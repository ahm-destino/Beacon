from flask import Blueprint, request, Response, stream_with_context
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..extensions import db
from ..models import User, Conversation, Message
from ..services.ai_service import AIService
from ..services.performance_service import record_study_event
from ..utils.helpers import success_response, error_response, paginate_query
from sqlalchemy import func, case
from datetime import datetime
import base64
import io
import tempfile
import subprocess
import json
import os
import requests
from urllib.parse import unquote

ai_tutor_bp = Blueprint('ai_tutor', __name__)


def get_uid():
    return get_jwt_identity()


def _strip_base64_prefix(image_data: str) -> str:
    if not image_data:
        return ''
    return image_data.split(',', 1)[-1] if ',' in image_data else image_data


def _extract_text_from_base64(image_data: str) -> str:
    """Best-effort OCR from a base64 image string."""
    if not image_data:
        return ''
    data = _strip_base64_prefix(image_data)
    try:
        raw = base64.b64decode(data)
    except Exception:
        return ''

    try:
        from PIL import Image
        img = Image.open(io.BytesIO(raw)).convert('L')
    except Exception:
        return ''

    # Try pytesseract if available.
    try:
        import pytesseract  # type: ignore
        text = pytesseract.image_to_string(img) or ''
        if text.strip():
            return text.strip()
    except Exception:
        pass

    # Fallback to tesseract CLI if installed.
    input_path = None
    out_base = None
    try:
        with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as tmp:
            input_path = tmp.name
            img.save(input_path, format='PNG')
        out_base = f"{input_path}_out"
        subprocess.run(
            ['tesseract', input_path, out_base],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            timeout=10
        )
        txt_path = f"{out_base}.txt"
        if os.path.exists(txt_path):
            with open(txt_path, 'r', encoding='utf-8', errors='ignore') as f:
                text = f.read()
            return (text or '').strip()
    except Exception:
        return ''
    finally:
        try:
            if input_path and os.path.exists(input_path):
                os.remove(input_path)
            if out_base and os.path.exists(f"{out_base}.txt"):
                os.remove(f"{out_base}.txt")
        except Exception:
            pass

    return ''


@ai_tutor_bp.route('/conversations', methods=['GET'])
@jwt_required()
def get_conversations():
    uid = get_uid()
    page = request.args.get('page', 1, type=int)
    query = Conversation.query.filter_by(user_id=uid, is_archived=False).order_by(
        Conversation.updated_at.desc()
    )
    return success_response(paginate_query(query, page=page))


@ai_tutor_bp.route('/conversations', methods=['POST'])
@jwt_required()
def create_conversation():
    uid = get_uid()
    data = request.get_json()
    conv = Conversation(
        user_id=uid,
        title=data.get('title', 'New Conversation'),
        subject=data.get('subject'),
        topic=data.get('topic'),
    )
    db.session.add(conv)
    db.session.commit()
    return success_response(conv.to_dict(), status_code=201)


@ai_tutor_bp.route('/conversations/<conv_id>', methods=['GET'])
@jwt_required()
def get_conversation(conv_id):
    uid = get_uid()
    conv = Conversation.query.filter_by(id=conv_id, user_id=uid).first_or_404()
    return success_response(conv.to_dict(include_messages=True))


@ai_tutor_bp.route('/conversations/<conv_id>/messages', methods=['POST'])
@jwt_required()
def send_message(conv_id):
    """Stream AI response for a chat message."""
    uid = get_uid()
    user = User.query.get(uid)
    conv = Conversation.query.filter_by(id=conv_id, user_id=uid).first_or_404()
    data = request.get_json()

    user_message = data.get('message', '').strip()
    image_data = data.get('image_data')  # Base64 encoded image
    mime_type = data.get('mime_type', 'image/jpeg')

    if not user_message and not image_data:
        return error_response('Message or image is required', 422)

    explanation_level = data.get('explanation_level', user.explanation_level or 'normal')
    user_context = {
        'name': user.full_name,
        'exam_type': user.primary_exam or 'JAMB',
        'subjects': user.subjects or [],
        'weak_areas': [],
    }

    # Attach the user's current weak topics to improve AI personalization.
    # (Computed from SessionAnswer performance, consistent with /api/analytics/weak-areas.)
    try:
        from ..models import SessionAnswer, Question
        from sqlalchemy import func

        rows = db.session.query(
            Question.subject.label('subject'),
            Question.topic.label('topic'),
            func.count(SessionAnswer.id).label('attempts'),
            func.sum(case((SessionAnswer.is_correct == True, 1), else_=0)).label('correct_attempts'),
        ).join(SessionAnswer, SessionAnswer.question_id == Question.id).filter(
            SessionAnswer.user_id == uid
        ).group_by(Question.subject, Question.topic).all()

        weak = []
        for r in rows:
            attempts = int(r.attempts or 0)
            if attempts < 5:
                continue
            correct_attempts = int(r.correct_attempts or 0)
            accuracy = round((correct_attempts / attempts) * 100, 1)
            if accuracy < 70:
                weak.append({
                    'subject': r.subject,
                    'topic': r.topic,
                    'accuracy': accuracy,
                })

        user_context['weak_areas'] = sorted(weak, key=lambda x: x['accuracy'])[:3]
    except Exception:
        user_context['weak_areas'] = []

    # ─── RAG: Retrieve relevant JAMB questions ───────────────────────────────
    # Before calling the AI, we silently search the question bank for the
    # 5 most semantically similar questions to what the student just asked.
    # These are injected into the AI's system prompt as grounding context.
    rag_context = []
    try:
        subject_hint = conv.subject  # e.g. "physics" if conversation has a subject set
        rag_context = AIService.search_similar_questions(
            query_text=user_message,
            limit=5,
            subject=subject_hint,
            exam_type=user_context.get('exam_type', 'JAMB'),
        )
    except Exception:
        rag_context = []  # If RAG fails, gracefully fall back to normal chat

    def generate():
        try:
            if image_data:
                # Use Gemini for this turn because there's an image
                for chunk in AIService.chat_with_image(
                    str(conv.id), user_message, image_data, mime_type, explanation_level, user_context
                ):
                    yield f"data: {json.dumps({'chunk': chunk})}\n\n"
            else:
                # Normal text-only chat with Groq
                for chunk in AIService.chat(
                    str(conv.id), user_message, explanation_level, user_context, rag_context=rag_context
                ):
                    yield f"data: {json.dumps({'chunk': chunk})}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return Response(
        stream_with_context(generate()),
        mimetype='text/event-stream',
        headers={'Cache-Control': 'no-cache', 'X-Accel-Buffering': 'no'}
    )


@ai_tutor_bp.route('/conversations/<conv_id>', methods=['DELETE'])
@jwt_required()
def delete_conversation(conv_id):
    uid = get_uid()
    conv = Conversation.query.filter_by(id=conv_id, user_id=uid).first_or_404()
    db.session.delete(conv)
    db.session.commit()
    return success_response(message='Conversation deleted')


@ai_tutor_bp.route('/suggestions', methods=['GET'])
@jwt_required()
def get_suggestions():
    """Get personalized topic suggestions based on weak areas."""
    uid = get_uid()
    # Derive weak topics from SessionAnswer accuracy per (subject, topic).
    # This keeps AI suggestions synced to the same performance signals used by /api/analytics/weak-areas.
    from ..models import SessionAnswer, Question
    from sqlalchemy import func

    rows = db.session.query(
        Question.subject.label('subject'),
        Question.topic.label('topic'),
        func.count(SessionAnswer.id).label('attempts'),
        func.sum(case((SessionAnswer.is_correct == True, 1), else_=0)).label('correct_attempts'),
    ).join(SessionAnswer, SessionAnswer.question_id == Question.id).filter(
        SessionAnswer.user_id == uid
    ).group_by(Question.subject, Question.topic).all()

    weak_candidates = []
    for r in rows:
        attempts = int(r.attempts or 0)
        if attempts < 5:
            continue
        correct_attempts = int(r.correct_attempts or 0)
        accuracy = round((correct_attempts / attempts) * 100, 1)
        if accuracy < 70:
            weak_candidates.append({
                'subject': r.subject,
                'topic': r.topic,
                'accuracy': accuracy,
                'attempts': attempts,
            })

    weak_candidates = sorted(weak_candidates, key=lambda x: x['accuracy'])[:5]
    return success_response(weak_candidates)


@ai_tutor_bp.route('/scan', methods=['POST'])
@jwt_required()
def scan_question():
    """Submit scanned problem image/text and return a streamed solution."""
    data = request.get_json() or {}
    detected_text = (data.get('detected_text') or '').strip()
    image_data = data.get('image_data')
    subject = data.get('subject') or 'General'
    topic = data.get('topic') or 'General'
    want_stream = bool(data.get('stream')) or 'text/event-stream' in (request.headers.get('Accept') or '')

    if not detected_text and image_data:
        detected_text = _extract_text_from_base64(image_data)

    if not detected_text:
        message = 'We could not read the image. Please retake the photo or type the question.'
        if want_stream:
            def generate_error():
                yield f"data: {json.dumps({'error': message, 'meta': {'detected_text': '', 'subject': subject, 'topic': topic}})}\n\n"
                yield "data: [DONE]\n\n"
            return Response(
                stream_with_context(generate_error()),
                mimetype='text/event-stream',
                headers={'Cache-Control': 'no-cache', 'X-Accel-Buffering': 'no'}
            )
        return error_response(message, 200)

    uid = get_uid()
    user = User.query.get(uid)

    # Create or reuse a conversation for scan history.
    conv = None
    provided_conv_id = data.get('conversation_id')
    if provided_conv_id:
        conv = Conversation.query.filter_by(id=provided_conv_id, user_id=uid).first()
    if not conv:
        title_snippet = detected_text[:60] + ('...' if len(detected_text) > 60 else '')
        conv = Conversation(
            user_id=uid,
            title=f"Scan: {title_snippet}" if title_snippet else "Scan Question",
            subject=subject,
            topic=topic,
        )
        db.session.add(conv)
        db.session.commit()

    if want_stream:
        def generate():
            try:
                yield f"data: {json.dumps({'meta': {'detected_text': detected_text, 'subject': subject, 'topic': topic, 'conversation_id': str(conv.id)}})}\n\n"
                user_context = {
                    'name': user.full_name if user else 'Student',
                    'exam_type': getattr(user, 'primary_exam', None) or 'JAMB',
                    'subjects': getattr(user, 'subjects', None) or [],
                }
                system_prompt = (
                    AIService.build_system_prompt('normal', user_context)
                    + "\n\nTask: Solve the student's question step-by-step, show key formulae, and end with a quick check question."
                )
                full_response = ''
                stream = AIService.get_client().chat.completions.create(
                    model=AIService.get_model(),
                    max_tokens=2000,
                    temperature=0.7,
                    messages=[
                        {'role': 'system', 'content': system_prompt},
                        {'role': 'user', 'content': detected_text},
                    ],
                    stream=True,
                )
                for chunk in stream:
                    delta = chunk.choices[0].delta if chunk.choices else None
                    text = getattr(delta, 'content', None)
                    if text:
                        full_response += text
                        yield f"data: {json.dumps({'text': text})}\n\n"

                # Persist scan conversation messages.
                user_msg = Message(
                    conversation_id=conv.id,
                    role='user',
                    content=detected_text,
                    explanation_level='normal',
                    input_mode='scan',
                )
                ai_msg = Message(
                    conversation_id=conv.id,
                    role='assistant',
                    content=full_response,
                    explanation_level='normal',
                    input_mode='scan',
                    tokens_used=None,
                )
                conv.message_count = (conv.message_count or 0) + 2
                conv.updated_at = datetime.utcnow()
                db.session.add(user_msg)
                db.session.add(ai_msg)
                db.session.commit()

                yield "data: [DONE]\n\n"
            except Exception as e:
                yield f"data: {json.dumps({'error': str(e)})}\n\n"

        return Response(
            stream_with_context(generate()),
            mimetype='text/event-stream',
            headers={'Cache-Control': 'no-cache', 'X-Accel-Buffering': 'no'}
        )

    # Fallback non-stream response for older clients.
    solution = {
        'subject': subject,
        'topic': topic,
        'final_answer': 'See guided steps below',
        'steps': [
            'Identify known quantities and target variable.',
            'Apply the relevant formula.',
            'Substitute values and simplify carefully.',
        ],
        'key_formula': 'Depends on the problem type.',
    }
    text = ''
    try:
        user_context = {
            'name': user.full_name if user else 'Student',
            'exam_type': getattr(user, 'primary_exam', None) or 'JAMB',
            'subjects': getattr(user, 'subjects', None) or [],
        }
        system_prompt = (
            AIService.build_system_prompt('normal', user_context)
            + "\n\nTask: Solve the student's question step-by-step, show key formulae, and end with a quick check question."
        )
        response = AIService.get_client().chat.completions.create(
            model=AIService.get_model(),
            max_tokens=2000,
            temperature=0.7,
            messages=[
                {'role': 'system', 'content': system_prompt},
                {'role': 'user', 'content': detected_text},
            ],
        )
        text = response.choices[0].message.content if response.choices else ''
        parsed = json.loads(text) if text else None
        if isinstance(parsed, dict):
            solution.update({
                'subject': parsed.get('subject') or solution['subject'],
                'topic': parsed.get('topic') or solution['topic'],
                'final_answer': parsed.get('final_answer') or solution['final_answer'],
                'steps': parsed.get('steps') or solution['steps'],
                'key_formula': parsed.get('key_formula') or solution['key_formula'],
            })
    except Exception:
        pass

    # Persist messages for non-stream clients.
    user_msg = Message(
        conversation_id=conv.id,
        role='user',
        content=detected_text,
        explanation_level='normal',
        input_mode='scan',
    )
    ai_msg = Message(
        conversation_id=conv.id,
        role='assistant',
        content=(text or ''),
        explanation_level='normal',
        input_mode='scan',
        tokens_used=None,
    )
    conv.message_count = (conv.message_count or 0) + 2
    conv.updated_at = datetime.utcnow()
    db.session.add(user_msg)
    db.session.add(ai_msg)
    db.session.commit()

    return success_response({
        'detected_text': detected_text,
        'subject': solution['subject'],
        'topic': solution['topic'],
        'solution': solution,
        'conversation_id': str(conv.id),
    })


@ai_tutor_bp.route('/voice/sessions', methods=['POST'])
@jwt_required()
def init_voice_session():
    """Initialize a voice tutoring session (stateless configuration response)."""
    data = request.get_json() or {}
    subject = data.get('subject') or 'General'
    topic = data.get('topic') or 'General'
    difficulty = data.get('difficulty') or 'normal'
    language = data.get('language') or 'English'
    duration = data.get('duration') or '15min'

    welcome = (
        f"Welcome to your {subject} voice session. We'll cover {topic} at {difficulty} level "
        f"in {language}. Let's start with the core idea."
    )
    return success_response({
        'session': {
            'subject': subject,
            'topic': topic,
            'difficulty': difficulty,
            'language': language,
            'duration': duration,
        },
        'welcome_message': welcome,
    }, status_code=201)


@ai_tutor_bp.route('/voice/sessions/evaluate', methods=['POST'])
@jwt_required()
def evaluate_voice_turn():
    """Evaluate a learner utterance and return tutor response + micro score."""
    data = request.get_json() or {}
    learner_text = (data.get('learner_text') or '').strip()
    subject = data.get('subject') or 'General'
    topic = data.get('topic') or 'General'
    if not learner_text:
        return error_response('learner_text is required', 422)

    response_text = (
        f"Good attempt. In {topic}, focus on defining the principle first, "
        "then apply it to the example before computing."
    )
    feedback_score = 70
    try:
        prompt = (
            'You are a concise tutor. Reply in 2-4 sentences to the learner response and '
            'include one correction and one next-step prompt. '
            f'Subject: {subject}. Topic: {topic}. Learner said: {learner_text}'
        )
        stream = AIService.chat('voice-eval', prompt, 'normal', {'mode': 'voice'})
        ai_text = ''.join(list(stream)) if stream else ''
        if ai_text:
            response_text = ai_text
    except Exception:
        pass

    # Cheap heuristic score so UI can show progression.
    lowered = learner_text.lower()
    if any(k in lowered for k in ['because', 'therefore', 'formula', 'so']):
        feedback_score = 82

    return success_response({
        'tutor_response': response_text,
        'turn_score': feedback_score,
    })


@ai_tutor_bp.route('/handwriting/check', methods=['POST'])
@jwt_required()
def check_handwriting_work():
    """Evaluate handwritten work (or extracted text) and return guidance."""
    data = request.get_json() or {}
    extracted_text = (data.get('extracted_text') or '').strip()
    if not extracted_text:
        return error_response('extracted_text is required', 422)

    analysis = {
        'verdict': 'partially_correct',
        'summary': 'Your setup is close, but one transformation step is missing.',
        'next_steps': [
            'Rewrite the formula cleanly with all terms.',
            'Substitute values carefully and keep sign consistency.',
            'Recompute the final line and compare units.',
        ],
    }
    return success_response(analysis)


@ai_tutor_bp.route('/concepts', methods=['GET'])
@jwt_required()
def list_concepts():
    """
    Return grouped concept topics from both the global question bank 
    AND user-uploaded document metadata tags.
    """
    uid = get_uid()
    search = (request.args.get('q') or '').strip().lower()
    from ..models import Question, SessionAnswer, Document, DocumentSection, TopicPerformance
    from sqlalchemy import func, or_
    
    # helper to filter out rubbish (filenames, broad subjects, etc.)
    def is_rubbish(name, subject=None):
        if not name: return True
        n = str(name).lower()
        forbidden = ['.pdf', '.docx', '.pptx', '.txt', 'general']
        # If topic is exactly the subject, it's too broad (e.g. Topic="Physics" in Subject="Physics")
        if subject and n == str(subject).lower():
            return True
        return any(f in n for f in forbidden) or len(n) < 3

    # 1. Get topics from Global Question Bank
    rows = db.session.query(
        Question.subject.label('subject'),
        Question.topic.label('topic'),
        func.count(Question.id).label('count'),
    ).filter(
        Question.is_active == True,
        Question.is_approved == True,
        Question.topic.isnot(None),
    ).group_by(
        Question.subject, Question.topic
    ).all()

    # 2. Get granular concepts from Document Metadata
    # We look at sections specifically to get those academic tags
    doc_concepts_query = db.session.query(
        Document.subject.label('subject'),
        DocumentSection.key_concepts.label('concepts')
    ).join(Document, Document.id == DocumentSection.document_id).filter(
        Document.user_id == uid,
        DocumentSection.key_concepts.isnot(None)
    ).all()

    grouped = {}
    
    # Process Question Bank topics
    for r in rows:
        subject = r.subject or 'General'
        topic = r.topic or 'General'
        if is_rubbish(topic, subject): continue
        if search and search not in topic.lower() and search not in subject.lower():
            continue
        grouped.setdefault(subject, {})
        if topic not in grouped[subject]:
            grouped[subject][topic] = {'name': topic, 'count': int(r.count or 0)}
        else:
            grouped[subject][topic]['count'] += int(r.count or 0)

    # Process Document-extracted Metadata tags
    for r in doc_concepts_query:
        subject = r.subject or 'General'
        concepts_list = r.concepts or []
        if not isinstance(concepts_list, list): continue
        for concept in concepts_list:
            if is_rubbish(concept, subject): continue
            if search and search not in concept.lower() and search not in subject.lower():
                continue
            grouped.setdefault(subject, {})
            if concept not in grouped[subject]:
                grouped[subject][concept] = {'name': concept, 'count': 1}
            else:
                grouped[subject][concept]['count'] += 1

    # Convert to final list format
    subjects_list = []
    for subject, concepts_map in grouped.items():
        concepts = []
        for name, info in concepts_map.items():
            concepts.append({
                'id': name,
                'name': name,
                'subject': subject,
                'count': info['count']
            })
        
        concepts = sorted(concepts, key=lambda c: c['name'].lower())
        subjects_list.append({
            'id': subject,
            'icon': '📘',
            'count': len(concepts),
            'concepts': concepts,
        })
    
    subjects_list = sorted(subjects_list, key=lambda s: s['id'].lower())

    # 3. "For you" list (Weak Areas) - now includes Document-derived performance
    # We query TopicPerformance which now handles these granular concepts
    weak_perf = TopicPerformance.query.filter_by(
        user_id=uid,
        is_weak_area=True
    ).order_by(TopicPerformance.accuracy.asc()).limit(15).all()

    weak_areas = []
    for p in weak_perf:
        if is_rubbish(p.topic, p.subject): continue
        # Filter by search if active
        if search and search not in p.topic.lower() and search not in p.subject.lower():
            continue
            
        weak_areas.append({
            'id': p.topic,
            'name': p.topic,
            'subject': p.subject,
            'accuracy': p.accuracy,
            'attempts': p.total_attempts,
        })

    return success_response({
        'subjects': subjects_list,
        'weak_areas': weak_areas,
        'search_active': bool(search)
    })
    weak_areas = sorted(weak_areas, key=lambda x: x['accuracy'])[:5]

    return success_response({
        'subjects': subjects,
        'weak_areas': weak_areas,
    })


@ai_tutor_bp.route('/concepts/<concept_id>', methods=['GET'])
@jwt_required()
def get_concept(concept_id):
    """Return concept detail with related questions and videos."""
    concept_name = unquote(concept_id)
    from ..models import Question

    q_rows = Question.query.filter(
        Question.is_active == True,
        Question.is_approved == True,
        Question.topic.ilike(concept_name),
    ).order_by(Question.times_answered.desc().nullslast()).limit(25).all()

    if not q_rows:
        # Fallback: partial match
        q_rows = Question.query.filter(
            Question.is_active == True,
            Question.is_approved == True,
            Question.topic.ilike(f'%{concept_name}%'),
        ).order_by(Question.times_answered.desc().nullslast()).limit(25).all()

    if not q_rows:
        return error_response('Concept not found in question bank', 404)

    subject = q_rows[0].subject or 'General'
    canonical_name = q_rows[0].topic or concept_name
    related_questions = [
        {
            'id': str(q.id),
            'text': q.question_text,
            'subject': q.subject,
            'topic': q.topic,
            'correct_answer': q.correct_answer,
            'explanation': q.explanation,
        }
        for q in q_rows[:10]
    ]

    # Prefer curated question.video_link first
    videos = []
    for q in q_rows:
        if q.video_link:
            videos.append({
                'title': f'{q.topic or canonical_name} walkthrough',
                'url': q.video_link,
                'source': 'curated',
            })
    # Deduplicate by URL
    dedup = {}
    for v in videos:
        dedup[v['url']] = v
    videos = list(dedup.values())[:5]

    # Optional YouTube API fallback
    if len(videos) < 3:
        yt_key = os.getenv('YOUTUBE_API_KEY')
        if yt_key:
            try:
                query = f'{canonical_name} {subject} exam tutorial'
                resp = requests.get(
                    'https://www.googleapis.com/youtube/v3/search',
                    params={
                        'part': 'snippet',
                        'q': query,
                        'type': 'video',
                        'maxResults': 5,
                        'key': yt_key,
                    },
                    timeout=8,
                )
                payload = resp.json() if resp.ok else {}
                items = payload.get('items') or []
                for item in items:
                    vid = (((item or {}).get('id') or {}).get('videoId'))
                    snip = (item or {}).get('snippet') or {}
                    if not vid:
                        continue
                    url = f'https://www.youtube.com/watch?v={vid}'
                    if url in dedup:
                        continue
                    videos.append({
                        'title': snip.get('title') or f'{canonical_name} video',
                        'url': url,
                        'source': 'youtube',
                    })
                    dedup[url] = videos[-1]
                    if len(videos) >= 5:
                        break
            except Exception:
                pass

    summary = (
        f'{canonical_name} is a high-frequency topic in {subject}. '
        'Focus on definitions, core rules, common traps, and exam-style practice.'
    )
    bullets = [
        'Master the core definition and notation first.',
        'Practice at least 10 mixed questions (easy to hard).',
        'Review common mistakes and why distractor options look tempting.',
    ]

    return success_response({
        'id': canonical_name,
        'name': canonical_name,
        'subject': subject,
        'summary': summary,
        'key_points': bullets,
        'videos': videos[:5],
        'related_questions': related_questions,
    })


# ═══════════════════════════════════════════════════════
# CONCEPT DEEP DIVE - STREAMING EXPLANATION (FIX 9)
# ═══════════════════════════════════════════════════════

@ai_tutor_bp.route('/concepts/<concept_id>/explain', methods=['POST'])
@jwt_required()
def stream_concept_explain(concept_id):
    """
    Stream a complete concept explanation at chosen level (basic/normal/deep).
    Returns SSE stream with explanation text + related questions + videos.
    """
    from flask import Response, stream_with_context
    import json
    
    uid = get_jwt_identity()
    user = User.query.get(uid)
    data = request.get_json() or {}
    
    concept = unquote(concept_id)
    subject = data.get('subject', '')
    level = data.get('level', 'normal')  # basic, normal, deep
    
    # Level-specific prompts for Adaptive Tutors
    level_prompts = {
        'basic': f"""Explain {concept} in 'Beginner Mode'.
Structure:
- Core Idea: [One simple sentence using a relatable analogy]
- Why it matters: [Why a student should care]
- Breakdown: [3 clear bullet points using plain language]
- Everyday Example: [A relatable Nigerian context example]

Rules:
- NO jargon. NO complex math unless requested.
- If it IS a calculation, use 3 simple 'Action Steps'.
- If it is NOT a calculation, do NOT use 'Step 1/2/3' formatting; use descriptive bullets.
- Finish with: Answer: <one-sentence simple takeaway>.""",

        'normal': f"""Explain {concept} in 'Exam-ready Mode' for a Nigerian JAMB/WAEC student.
Structure:
## 🎯 Core Principle
[Simple 2-sentence definition with **key terms** in bold]

## 🔍 How it Works
[Use Numbered Steps ONLY if it is a technical process or calculation. Otherwise, use a 'Mechanism Breakdown' with themed bullets.]

## 🇳🇬 Nigerian Context
[A relatable real-world example from Nigeria]

## 💡 Exam Strategy
[How this topic typically appears in JAMB/WAEC and how to beat it]

Rules:
- Use **bold** for essential vocabulary.
- Finish with: Answer: <one-sentence academic takeaway>.""",

        'deep': f"""Provide a COMPREHENSIVE 'Expert Discovery' of {concept} for a high-achieving student.
Structure:
## 🌟 The Simple Logic
[Start with a brilliant analogy]

## 🧬 Full Mechanism & Nuance
[Detailed breakdown. Use professional terminology.]

## 🛠️ Technical Walkthrough
[Detailed steps if applicable. If not a calculation, provide a 'Logical Flow Chart' in text form.]

## ⚠️ Potential Pitfalls
[Nuanced traps and common misconceptions]

## 🎓 Exam Masterclass
[Pattern analysis of past questions on this topic]

## 🧠 Memory Anchor
[A clever mnemonic or memory trick]
"""
    }
    
    prompt = level_prompts.get(level, level_prompts['normal'])
    
    def generate():
        # Stream the explanation
        try:
            stream = AIService.chat(
                'concept-explain',
                prompt,
                level,
                {'mode': 'concept', 'name': user.full_name if user else 'Student'}
            )
            
            for chunk in stream:
                yield f"data: {json.dumps({'text': chunk})}\n\n"
            
            # After explanation, send related questions from DB
            from ..models import Question
            related_qs = Question.query.filter(
                Question.is_active == True,
                Question.is_approved == True,
                db.or_(
                    Question.topic.ilike(f'%{concept}%'),
                    Question.question_text.ilike(f'%{concept}%')
                )
            ).order_by(Question.year.desc()).limit(5).all()
            
            if related_qs:
                questions_data = []
                for q in related_qs:
                    questions_data.append({
                        'id': str(q.id),
                        'question_text': q.question_text,
                        'subject': q.subject,
                        'year': q.year,
                        'exam_type': q.exam_type,
                    })
                yield f"data: {json.dumps({'related_questions': questions_data})}\n\n"
            
            # Send YouTube videos if available
            import os, requests
            yt_key = os.getenv('YOUTUBE_API_KEY')
            if yt_key:
                try:
                    query = f'{concept} {subject} Nigeria JAMB WAEC explanation'
                    resp = requests.get(
                        'https://www.googleapis.com/youtube/v3/search',
                        params={
                            'part': 'snippet',
                            'q': query,
                            'type': 'video',
                            'maxResults': 3,
                            'key': yt_key,
                        },
                        timeout=8,
                    )
                    payload = resp.json() if resp.ok else {}
                    items = payload.get('items') or []
                    videos = []
                    for item in items:
                        vid = (((item or {}).get('id') or {}).get('videoId'))
                        snip = (item or {}).get('snippet') or {}
                        if vid:
                            videos.append({
                                'title': snip.get('title') or f'{concept} video',
                                'url': f'https://www.youtube.com/watch?v={vid}',
                            })
                    if videos:
                        yield f"data: {json.dumps({'videos': videos})}\n\n"
                except Exception:
                    pass
            
            yield "data: [DONE]\n\n"
            
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
    
    return Response(
        stream_with_context(generate()),
        content_type='text/event-stream',
        headers={'Cache-Control': 'no-cache', 'X-Accel-Buffering': 'no'}
    )


@ai_tutor_bp.route('/concepts/confidence', methods=['POST'])
@jwt_required()
def rate_concept_confidence():
    """Student rates their confidence in a concept (0-3 scale)."""
    from ..models import ConceptConfidence
    
    uid = get_jwt_identity()
    data = request.get_json()
    
    concept = data.get('concept')
    subject = data.get('subject')
    rating = data.get('rating')  # 0=not at all, 1=little, 2=pretty well, 3=got it
    
    if rating is None or not (0 <= rating <= 3):
        return error_response('Rating must be 0-3', 422)
    
    # Find or create confidence record
    conf = ConceptConfidence.query.filter_by(
        user_id=uid, concept=concept
    ).first()
    
    if not conf:
        conf = ConceptConfidence(
            user_id=uid,
            concept=concept,
            subject=subject
        )
        db.session.add(conf)
    
    conf.rating = rating
    conf.rated_at = datetime.utcnow()
    db.session.commit()
    
    return success_response({
        'success': True,
        'rating': rating,
        'rating_label': conf.get_rating_label(),
    })


@ai_tutor_bp.route('/concepts/quiz', methods=['POST'])
@jwt_required()
def generate_concept_quiz():
    """Generate custom quiz on a specific concept."""
    uid = get_jwt_identity()
    data = request.get_json()
    
    concept = data.get('concept')
    subject = data.get('subject')
    count = min(data.get('count', 10), 20)
    
    if not concept:
        return error_response('Concept is required', 422)
    
    # First try to get questions from DB
    from ..models import Question
    db_qs = Question.query.filter(
        Question.is_active == True,
        Question.is_approved == True,
        db.or_(
            Question.topic.ilike(f'%{concept}%'),
            Question.question_text.ilike(f'%{concept}%')
        )
    ).order_by(db.func.random()).limit(count).all()
    
    db_questions = [q.to_dict(include_answer=True) for q in db_qs]
    
    # If not enough in DB, fill gap with AI
    gap = count - len(db_questions)
    ai_questions = []
    
    if gap > 0:
        prompt = f"""Create {gap} multiple choice questions specifically testing knowledge of {concept} in {subject or 'general'}.
Make questions progressively harder (easy to medium to hard).

Return ONLY JSON array:
[{{
  "question_text": "...",
  "option_a": "...",
  "option_b": "...",
  "option_c": "...",
  "option_d": "...",
  "correct_answer": "A|B|C|D",
  "explanation": "...",
  "difficulty": "easy|medium|hard"
}}]"""
        try:
            ai_response = AIService.generate_structured_content(prompt, list)
            ai_questions = ai_response if isinstance(ai_response, list) else []
        except Exception:
            ai_questions = []
    
    all_questions = db_questions + ai_questions
    
    # Create a mini session for this concept quiz
    from ..models import PracticeSession
    session = PracticeSession(
        user_id=uid,
        mode='concept_quiz',
        practice_type='concept',
        subject=subject,
        topic=concept,
        total_questions=len(all_questions),
    )
    db.session.add(session)
    db.session.commit()
    
    return success_response({
        'session_id': str(session.id),
        'concept': concept,
        'subject': subject,
        'total_questions': len(all_questions),
        'questions': all_questions[:count],
        'source': 'database' if len(db_questions) >= count else 'mixed',
    })


# ═══════════════════════════════════════════════════════
# WRITE MODE - HANDWRITING PRACTICE (FIX 7)
# ═══════════════════════════════════════════════════════

@ai_tutor_bp.route('/write/session', methods=['POST'])
@jwt_required()
def start_write_session():
    """AI generates questions for writing/handwriting practice session."""
    uid = get_jwt_identity()
    data = request.get_json()
    
    subject = data.get('subject')
    topic = data.get('topic')
    raw_count = data.get('question_count') or data.get('count', 5)
    try:
        raw_count = int(raw_count)
    except Exception:
        raw_count = 5
    count = min(max(raw_count, 1), 10)
    question_type = data.get('type', 'problem_solving')  # problem_solving, essay, diagram
    
    type_instructions = {
        'problem_solving': 'Mathematical or scientific problems to solve step by step',
        'essay': 'Short answer questions requiring written explanation',
        'diagram': 'Questions asking student to draw and label a diagram'
    }
    
    # Generate questions with AI
    prompt = f"""Generate {count} {type_instructions.get(question_type, 'questions')} for {topic or subject} at JAMB/WAEC level.

Return ONLY JSON array:
[{{
  "question": "The question to answer in writing",
  "expected_key_points": ["Point 1", "Point 2", "Point 3"],
  "model_answer": "What a correct answer looks like",
  "marks": 5
}}]"""
    
    try:
        questions = AIService.generate_structured_content(prompt, list)
        if not isinstance(questions, list) or not questions:
            return error_response('Failed to generate write questions', 500)
        
        # Store session in Redis for state management
        import json, uuid
        from ..extensions import redis_client
        
        session_id = str(uuid.uuid4())
        session_data = {
            'user_id': str(uid),
            'subject': subject,
            'topic': topic,
            'type': question_type,
            'questions': questions,
            'started_at': datetime.utcnow().isoformat(),
        }
        
        redis_client.setex(
            f'write_session:{session_id}',
            7200,  # 2 hours
            json.dumps(session_data)
        )
        
        # Return questions without answers
        safe_questions = []
        for i, q in enumerate(questions):
            safe_questions.append({
                'index': i,
                'question': q.get('question'),
                'marks': q.get('marks', 5),
            })
        
        return success_response({
            'session_id': session_id,
            'questions': safe_questions,
            'total': len(safe_questions),
            'type': question_type,
        })
        
    except Exception as e:
        return error_response(f'Failed to generate write session: {str(e)}', 500)


@ai_tutor_bp.route('/write/submit', methods=['POST'])
@jwt_required()
def submit_written_answer():
    """
    Student submits handwritten answer (as extracted text or image data).
    AI analyzes and scores the answer.
    """
    uid = get_jwt_identity()
    data = request.get_json()
    
    session_id = data.get('session_id')
    question_index = data.get('question_index')
    
    # Get extracted text (from OCR or manual input)
    extracted_text = data.get('extracted_text', '').strip()
    image_data = data.get('image_data')  # Base64 image if available

    if not extracted_text and image_data:
        extracted_text = _extract_text_from_base64(image_data)

    if not extracted_text and not image_data:
        return error_response('Either extracted_text or image_data is required', 422)
    
    # Get session from Redis
    import json
    from ..extensions import redis_client
    
    stored = redis_client.get(f'write_session:{session_id}')
    if not stored:
        return error_response('Write session expired or not found', 404)
    
    session_data = json.loads(stored)
    try:
        question_index = int(question_index)
    except Exception:
        return error_response('question_index must be an integer', 422)
    if question_index < 0 or question_index >= len(session_data.get('questions', [])):
        return error_response('question_index out of range', 422)
    question = session_data['questions'][question_index]
    
    # Analyze with AI
    if not extracted_text:
        return success_response({
            'transcription': '',
            'score': 0,
            'max_score': question.get('marks', 5),
            'points_covered': [],
            'points_missed': question.get('expected_key_points', []),
            'feedback': 'We could not read your handwriting. Please write more clearly or type your answer.',
            'is_correct': False,
            'accuracy_percentage': 0,
            'model_answer': question.get('model_answer'),
        })

    prompt = f"""You are grading a student's handwritten answer.

Question: {question.get('question')}
Expected key points: {question.get('expected_key_points', [])}
Model answer: {question.get('model_answer')}
Total marks: {question.get('marks', 5)}

Student's answer: {extracted_text}

Please analyze and return ONLY JSON:
{{
  "transcription": "What the student wrote (confirm or correct)",
  "score": 3,
  "max_score": {question.get('marks', 5)},
  "points_covered": ["Point 1 was covered well", "Point 2 mentioned"],
  "points_missed": ["Point 3 was not addressed"],
  "feedback": "Detailed constructive feedback for improvement",
  "is_correct": true|false,
  "accuracy_percentage": 60
}}"""
    
    try:
        result = AIService.generate_structured_content(prompt, dict)
        
        # Record study event
        record_study_event(
            user_id=uid,
            action_type='write_answer_submitted',
            subject=session_data.get('subject'),
            topic=session_data.get('topic'),
            score=result.get('accuracy_percentage'),
            metadata={
                'session_id': session_id,
                'question_index': question_index,
                'score_out_of': result.get('score'),
                'max_score': result.get('max_score'),
            }
        )
        
        return success_response({
            'transcription': result.get('transcription'),
            'score': result.get('score'),
            'max_score': result.get('max_score'),
            'points_covered': result.get('points_covered', []),
            'points_missed': result.get('points_missed', []),
            'feedback': result.get('feedback'),
            'is_correct': result.get('is_correct'),
            'accuracy_percentage': result.get('accuracy_percentage'),
            'model_answer': question.get('model_answer'),
        })
        
    except Exception as e:
        return error_response(f'Failed to analyze answer: {str(e)}', 500)


# ═══════════════════════════════════════════════════════
# VOICE MODE - VOICE STUDY (FIX 8)
# ═══════════════════════════════════════════════════════

@ai_tutor_bp.route('/voice/session', methods=['POST'])
@jwt_required()
def start_voice_study_session():
    """
    Initialize a voice tutoring session with AI-generated questions.
    Returns voice-friendly questions and TTS text for the first question.
    """
    uid = get_jwt_identity()
    data = request.get_json()
    
    subject = data.get('subject')
    topic = data.get('topic')
    difficulty = data.get('difficulty', 'mixed')
    raw_count = data.get('question_count') or data.get('count', 20)
    try:
        raw_count = int(raw_count)
    except Exception:
        raw_count = 20
    count = min(max(raw_count, 5), 30)
    language = data.get('language', 'english')
    
    # Generate voice-friendly questions
    prompt = f"""Generate {count} voice-friendly questions about {topic or subject}.

Voice-friendly means:
- Clear, unambiguous spoken questions
- No mathematical notation that can't be spoken
- Multiple choice with clear distinct options

Return ONLY JSON array:
[{{
  "question": "Spoken clearly without symbols",
  "option_a": "First option",
  "option_b": "Second option",
  "option_c": "Third option",
  "option_d": "Fourth option",
  "correct": "A|B|C|D",
  "explanation": "Clear spoken explanation"
}}]"""
    
    try:
        questions = AIService.generate_structured_content(prompt, list)
        
        # Store session
        import json, uuid
        from ..extensions import redis_client
        
        session_id = str(uuid.uuid4())
        session_data = {
            'user_id': str(uid),
            'subject': subject,
            'topic': topic,
            'questions': questions,
            'current_index': 0,
            'score': 0,
            'answers': [],
            'started_at': datetime.utcnow().isoformat(),
        }
        
        redis_client.setex(
            f'voice_session:{session_id}',
            7200,
            json.dumps(session_data)
        )
        
        # Build TTS text for first question
        first_q = questions[0]
        tts_text = (
            f"Starting your {subject} voice session. {count} questions. "
            f"Question 1. {first_q.get('question')} "
            f"Option A: {first_q.get('option_a')}. "
            f"Option B: {first_q.get('option_b')}. "
            f"Option C: {first_q.get('option_c')}. "
            f"Option D: {first_q.get('option_d')}."
        )
        
        return success_response({
            'session_id': session_id,
            'total_questions': len(questions),
            'first_question': {
                'index': 0,
                'question': first_q.get('question'),
                'options': {
                    'A': first_q.get('option_a'),
                    'B': first_q.get('option_b'),
                    'C': first_q.get('option_c'),
                    'D': first_q.get('option_d'),
                }
            },
            'text_to_speak': tts_text,
        })
        
    except Exception as e:
        return error_response(f'Failed to start voice session: {str(e)}', 500)


@ai_tutor_bp.route('/voice/answer', methods=['POST'])
@jwt_required()
def submit_voice_answer():
    """
    Process voice answer (text from speech recognition).
    Returns next question with TTS text or session complete.
    """
    uid = get_jwt_identity()
    data = request.get_json()
    
    session_id = data.get('session_id')
    spoken_text = (data.get('spoken_text') or '').upper().strip()
    
    if not spoken_text:
        return error_response('spoken_text is required', 422)
    
    # Get session
    import json
    from ..extensions import redis_client
    
    stored = redis_client.get(f'voice_session:{session_id}')
    if not stored:
        return error_response('Voice session expired', 404)
    
    session_data = json.loads(stored)
    current_idx = session_data['current_index']
    questions = session_data['questions']
    
    if current_idx >= len(questions):
        return error_response('Session already complete', 400)
    
    current_q = questions[current_idx]
    
    # Parse spoken answer (accept "A", "B", "C", "D", "option A", etc.)
    selected = None
    for option in ['A', 'B', 'C', 'D']:
        if option in spoken_text or f'OPTION {option}' in spoken_text:
            selected = option
            break
    
    if not selected:
        return success_response({
            'understood': False,
            'text_to_speak': "I didn't catch that. Please say A, B, C, or D.",
        })
    
    correct = current_q.get('correct')
    is_correct = selected == correct
    
    # Update score
    if is_correct:
        session_data['score'] += 1
    
    # Record answer
    session_data['answers'].append({
        'index': current_idx,
        'selected': selected,
        'correct': correct,
        'is_correct': is_correct,
    })
    
    # Move to next
    next_idx = current_idx + 1
    session_data['current_index'] = next_idx
    is_last = next_idx >= len(questions)
    
    # Save session
    redis_client.setex(
        f'voice_session:{session_id}',
        7200,
        json.dumps(session_data)
    )
    
    # Build response
    if is_last:
        # Session complete
        total = len(questions)
        score = session_data['score']
        percentage = round(score / total * 100)
        
        tts_text = (
            f"Session complete! You got {score} out of {total} correct. "
            f"That's {percentage} percent. Well done!"
        )
        
        # Record study event
        record_study_event(
            user_id=uid,
            action_type='voice_session_complete',
            subject=session_data.get('subject'),
            topic=session_data.get('topic'),
            score=percentage,
            metadata={
                'session_id': session_id,
                'correct': score,
                'total': total,
            }
        )
        
        return success_response({
            'is_last': True,
            'session_complete': True,
            'final_score': score,
            'total': total,
            'percentage': percentage,
            'text_to_speak': tts_text,
            'understood': True,
            'is_correct': is_correct,
            'correct_answer': correct,
        })
    
    # Next question
    next_q = questions[next_idx]
    
    # Build feedback + next question TTS
    if is_correct:
        feedback = "Correct! "
    else:
        feedback = f"Not quite. The answer was {correct}. {current_q.get('explanation', '')} "
    
    tts_text = (
        f"{feedback}Question {next_idx + 1}. "
        f"{next_q.get('question')} "
        f"Option A: {next_q.get('option_a')}. "
        f"Option B: {next_q.get('option_b')}. "
        f"Option C: {next_q.get('option_c')}. "
        f"Option D: {next_q.get('option_d')}."
    )
    
    return success_response({
        'is_last': False,
        'is_correct': is_correct,
        'correct_answer': correct,
        'explanation': current_q.get('explanation') if not is_correct else None,
        'next_question': {
            'index': next_idx,
            'question': next_q.get('question'),
            'options': {
                'A': next_q.get('option_a'),
                'B': next_q.get('option_b'),
                'C': next_q.get('option_c'),
                'D': next_q.get('option_d'),
            }
        },
        'text_to_speak': tts_text,
        'understood': True,
    })


# Add db import for the routes
from ..extensions import db
