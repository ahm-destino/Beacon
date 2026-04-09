from flask import Blueprint, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..extensions import db
from ..models import Document, PracticeSession, Question, User
from ..utils.helpers import success_response, error_response
from ..services.ai_service import AIService
from ..services.cloudinary_service import CloudinaryService
from werkzeug.utils import secure_filename
import os
import threading

documents_bp = Blueprint('documents', __name__)

def get_uid(): return get_jwt_identity()

def start_document_processing(doc_id):
    """Run document AI processing in a background thread."""
    app = current_app._get_current_object()

    def run_processing():
        with app.app_context():
            try:
                AIService.process_document(str(doc_id))
            except Exception:
                db.session.rollback()
                failed_doc = Document.query.get(doc_id)
                if failed_doc:
                    failed_doc.status = 'failed'
                    failed_doc.summary = 'Processing failed unexpectedly. The PDF might contain unsupported characters or formatting.'
                    db.session.commit()

    threading.Thread(target=run_processing, daemon=True).start()


def _section_payload(section, include_content=False):
    data = section.to_dict()
    if not include_content:
        data.pop('content_text', None)
    return data


def _build_document_payload(doc, sections='complete', include_content=False, limit=None):
    from ..models import DocumentSection

    data = doc.to_dict(full=False)

    sections = (sections or 'complete').lower()
    if sections != 'none':
        q = DocumentSection.query.filter_by(document_id=doc.id)
        if sections == 'complete':
            q = q.filter_by(status='complete')
        elif sections == 'pending':
            q = q.filter_by(status='pending')
        q = q.order_by(DocumentSection.order_index)
        if limit:
            q = q.limit(limit)
        rows = q.all()
        data['sections'] = [_section_payload(s, include_content=include_content) for s in rows]

    data['pending_count'] = DocumentSection.query.filter_by(document_id=doc.id, status='pending').count()
    data['completed_sections'] = DocumentSection.query.filter_by(document_id=doc.id, status='complete').count()
    data['total_sections'] = DocumentSection.query.filter_by(document_id=doc.id).count()
    return data


@documents_bp.route('', methods=['GET'])
@jwt_required()
def get_documents():
    uid = get_uid()
    docs = Document.query.filter_by(user_id=uid).order_by(Document.created_at.desc()).all()
    return success_response([d.to_dict() for d in docs])


@documents_bp.route('/upload', methods=['POST'])
@jwt_required()
def upload_document():
    uid = get_uid()
    if 'file' not in request.files:
        return error_response('No file provided', 422)

    file = request.files['file']
    subject = request.form.get('subject', 'General')
    filename = secure_filename(file.filename or '')

    if not filename.lower().endswith('.pdf'):
        return error_response('Only PDF files supported', 422)

    doc = Document(
        user_id=uid,
        filename=filename,
        file_url='',  # Set after upload
        file_size=0,
        subject=subject,
        status='processing',
    )
    db.session.add(doc)
    db.session.flush() # Get the ID without committing yet

    # Upload to Cloudinary
    # We use the document ID as the public_id to keep it unique and stable
    file_url = CloudinaryService.upload_document(file, str(doc.id))
    
    if not file_url:
        db.session.rollback()
        return error_response('Failed to upload document to cloud storage', 500)

    doc.file_url = file_url
    
    # Try to count pages if PyPDF2 is available (using the file stream before it's closed)
    try:
        from PyPDF2 import PdfReader
        file.seek(0)
        reader = PdfReader(file)
        doc.page_count = len(reader.pages)
    except Exception:
        doc.page_count = None

    db.session.commit()

    # Process with AI in background thread
    start_document_processing(doc.id)

    return success_response(doc.to_dict(), message='Document uploaded and processing has started.', status_code=202)


@documents_bp.route('/<doc_id>', methods=['GET'])
@jwt_required()
def get_document(doc_id):
    uid = get_uid()
    doc = Document.query.filter_by(id=doc_id, user_id=uid).first_or_404()
    return success_response(doc.to_dict(full=True))


@documents_bp.route('/<doc_id>/summary', methods=['GET'])
@jwt_required()
def get_summary(doc_id):
    uid = get_uid()
    doc = Document.query.filter_by(id=doc_id, user_id=uid).first_or_404()
    return success_response({'summary': doc.summary})


@documents_bp.route('/<doc_id>/flashcards', methods=['GET'])
@jwt_required()
def get_flashcards(doc_id):
    uid = get_uid()
    doc = Document.query.filter_by(id=doc_id, user_id=uid).first_or_404()
    return success_response({'flashcards': doc.flashcards or []})


@documents_bp.route('/<doc_id>/quiz', methods=['GET'])
@jwt_required()
def get_quiz(doc_id):
    uid = get_uid()
    doc = Document.query.filter_by(id=doc_id, user_id=uid).first_or_404()
    return success_response({'quiz_questions': doc.quiz_questions or []})


@documents_bp.route('/<doc_id>/quiz/session', methods=['POST'])
@jwt_required()
def create_document_quiz_session(doc_id):
    uid = get_uid()
    doc = Document.query.filter_by(id=doc_id, user_id=uid).first_or_404()
    if doc.status != 'complete':
        return error_response('Document is still processing', 409)

    data = request.get_json() or {}
    section_id = data.get('section_id')
    
    quiz_questions = []
    from ..models import DocumentSection
    if section_id:
        section = DocumentSection.query.filter_by(id=section_id, document_id=doc.id).first()
        if section and section.quiz_questions:
            quiz_questions = section.quiz_questions
            topic = section.topic or doc.filename
    else:
        sections = DocumentSection.query.filter_by(document_id=doc.id).order_by(DocumentSection.order_index).all()
        for s in sections:
            if s.quiz_questions:
                quiz_questions.extend(s.quiz_questions)
        # Pre-calculate topic to avoid filename rubbish (Metadata-First FIX)
    subject = doc.subject or 'General'
    # Use the first available concept tag as the topic if it's there
    first_section = section if section else (sections[0] if sections else None)
    concepts_pool = first_section.key_concepts if first_section and first_section.key_concepts else []
    
    # ─── METADATA-FIRST CLEANUP ──────────────────────────────────────────────
    # Ban usernames/filenames/broad subjects for the topic label
    topic = concepts_pool[0] if concepts_pool else subject
    forbidden = ['.pdf', '.docx', '.pptx', '.txt', 'general']
    if any(f in str(topic).lower() for f in forbidden) or topic == subject:
        topic = f"{subject} Practice" if subject != 'General' else "Knowledge Quest"

    if not quiz_questions:
        return error_response('No quiz questions available', 422)

    count = data.get('count')
    try:
        count = int(count) if count else len(quiz_questions)
    except Exception:
        count = len(quiz_questions)
    count = max(1, min(count, len(quiz_questions)))

    user = User.query.get(uid)
    exam_type = (user.primary_exam if user else None) or 'JAMB'

    saved_questions = []
    # We need to know which section each question belongs to for the concepts metadata
    # ... but the current logic flattens sections. We'll reconstruct a bit.
    questions_with_concepts = []
    if section:
        for q in quiz_questions:
            questions_with_concepts.append({'data': q, 'concepts': section.key_concepts or []})
    else:
        for s in sections:
            if s.quiz_questions:
                for q in s.quiz_questions:
                    questions_with_concepts.append({'data': q, 'concepts': s.key_concepts or []})

    for idx, item in enumerate(questions_with_concepts[:count]):
        q = item['data']
        q_concepts = item['concepts']
        if not q: continue
        
        question_text = q.get('question_text') or q.get('question') or q.get('text') or f'Document question {idx + 1}'
        options = q.get('options') or {}
        option_a = q.get('option_a') or q.get('optionA') or options.get('a') or options.get('A') or options.get('option_a') or 'Option A'
        option_b = q.get('option_b') or q.get('optionB') or options.get('b') or options.get('B') or options.get('option_b') or 'Option B'
        option_c = q.get('option_c') or q.get('optionC') or options.get('c') or options.get('C') or options.get('option_c') or 'Option C'
        option_d = q.get('option_d') or q.get('optionD') or options.get('d') or options.get('D') or options.get('option_d') or 'Option D'

        correct = (q.get('correct_answer') or q.get('answer') or q.get('correct') or 'A').upper()
        if correct not in ['A', 'B', 'C', 'D']:
            correct = 'A'

        question = Question(
            source='DOCUMENT',
            exam_type=exam_type,
            subject=subject,
            topic=topic,
            subtopic=subject,
            concepts=q_concepts,  # Inherit the granular tags for Metadata-First tracking!
            difficulty=q.get('difficulty') or 'medium',
            question_text=question_text,
            option_a=option_a,
            option_b=option_b,
            option_c=option_c,
            option_d=option_d,
            correct_answer=correct,
            explanation=q.get('explanation') or '',
            is_approved=True,
            generated_for_user=uid,
        )
        db.session.add(question)
        saved_questions.append(question)

    if not saved_questions:
        return error_response('No valid quiz questions found', 422)

    db.session.flush()

    session = PracticeSession(
        user_id=uid,
        mode='practice',
        practice_type='document',
        exam_type=exam_type,
        subject=subject,
        topic=topic,
        total_questions=len(saved_questions),
    )
    session.question_ids = [q.id for q in saved_questions]

    db.session.add(session)
    db.session.commit()

    return success_response({
        'session': session.to_dict(),
        'questions': [q.to_dict(include_answer=True) for q in saved_questions],
        'document_id': str(doc.id),
    }, status_code=201)


@documents_bp.route('/<doc_id>/reprocess', methods=['POST'])
@jwt_required()
def reprocess_document(doc_id):
    uid = get_uid()
    doc = Document.query.filter_by(id=doc_id, user_id=uid).first_or_404()

    if not doc.file_url:
        return error_response('Original file not found for reprocessing', 422)

    doc.status = 'processing'
    doc.summary = None
    doc.key_concepts = None
    doc.flashcards = None
    doc.quiz_questions = None
    db.session.commit()

    start_document_processing(doc.id)
    return success_response(doc.to_dict(), message='Document reprocessing started')


@documents_bp.route('/<doc_id>', methods=['DELETE'])
@jwt_required()
def delete_document(doc_id):
    uid = get_uid()
    doc = Document.query.filter_by(id=doc_id, user_id=uid).first_or_404()
    
    # Also delete from Cloudinary
    CloudinaryService.delete_document(str(doc.id))
    
    db.session.delete(doc)
    db.session.commit()
    return success_response(message='Document deleted')


@documents_bp.route('/<doc_id>/process_next_batch', methods=['POST'])
@jwt_required()
def process_next_batch(doc_id):
    uid = get_uid()
    doc = Document.query.filter_by(id=doc_id, user_id=uid).first_or_404()
    
    # Process up to 5 more sections immediately
    # We use the internal service method
    try:
        processed = AIService._process_document_batch(str(doc.id), batch_size=5)
        if processed:
            # Refresh doc sections for response
            return success_response(doc.to_dict(full=True), message="Successfully unlocked next sections!")
        else:
            return error_response("No more pending sections to process right now.", 422)
    except Exception as e:
        return error_response(f"Batch processing failed: {str(e)}", 500)



@documents_bp.route('/<doc_id>/sections/<sec_id>/generate_more_quiz', methods=['POST'])
@jwt_required()
def generate_more_quiz(doc_id, sec_id):
    uid = get_uid()
    doc = Document.query.filter_by(id=doc_id, user_id=uid).first_or_404()
    from ..models import DocumentSection
    section = DocumentSection.query.filter_by(id=sec_id, document_id=doc.id).first_or_404()
    
    data = request.get_json() or {}
    count = data.get('count', 5)
    
    prompt = f"""Read this section of a larger document:
    
Topic: {section.topic}
Subtopic: {section.subtopic}
Content:
{section.content_text}

Generate {count} NEW multiple choice quiz questions strictly based on this text.
Return ONLY valid JSON matching this schema:
[{{"question": "...", "options": {{"A": "...", "B": "...", "C": "...", "D": "..."}}, "correct_answer": "A", "explanation": "..."}}]
"""
    result = AIService.generate_structured_content(prompt, provider='hf')
    if result and isinstance(result, list):
        current_quizzes = section.quiz_questions or []
        current_quizzes.extend(result)
        # Update db column and flag as modified
        from sqlalchemy.orm.attributes import flag_modified
        section.quiz_questions = current_quizzes
        flag_modified(section, "quiz_questions")
        db.session.commit()
        return success_response(result, message=f"Generated {len(result)} new questions!")
    return error_response('Failed to generate extra questions from AI', 500)


@documents_bp.route('/<doc_id>/chat', methods=['POST'])
@jwt_required()
def chat_with_document(doc_id):
    uid = get_uid()
    doc = Document.query.filter_by(id=doc_id, user_id=uid).first_or_404()
    data = request.get_json() or {}
    user_message = data.get('message')
    if not user_message:
         return error_response('Message is required', 422)

    from ..models import DocumentSection
    import json
    
    # Simple fallback matching for windows/local without raw pgvector queries
    # We will brute force concatenate the sections if document is small, or use sentence-transformers locally
    sections = DocumentSection.query.filter_by(document_id=doc.id).order_by(DocumentSection.order_index).all()
    
    # Provide the context to Groq
    context_builder = [f"Document Metadata: {doc.filename} ({doc.subject})"]
    for s in sections[:5]: # Cap to 5 chunks to prevent overriding groq limits if naive fallback
        context_builder.append(f"Chapter: {s.subtopic}\n{s.content_text}")
    
    doc_context = "\n\n".join(context_builder)
    
    system_prompt = f"""You are a personal tutor helping a student study their personally uploaded document.
Use the following extracted document text constraints to answer their questions. 
If the document context lacks the exact answer, you may supplement it carefully with your own academic knowledge, but prioritize the document heavily!

Formatting rules:
- Use short sections, bullets, and clear spacing.
- When solving or simplifying a problem, write:
  Step 1: ...
  Step 2: ...
  Step 3: ...
  Answer: ...

--- DOCUMENT TEXT ---
{doc_context}
---------------------
"""
    # Just run a direct execution instead of creating a full Conversation log for now, to keep it lightweight!
    try:
        response = AIService.execute_groq_with_fallback(
            messages=[
                {'role': 'system', 'content': system_prompt},
                {'role': 'user', 'content': user_message}
            ],
            stream=False,
            max_tokens=1000
        )
        answer = response.choices[0].message.content
        return success_response({'answer': answer})
    except Exception as e:
        return error_response(str(e), 500)
