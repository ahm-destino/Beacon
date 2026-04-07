from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from ..extensions import db
from ..models import (
    LiteratureText, LiteratureChapter, UserLiteratureProgress,
    LiteraturePastQuestion, Challenge, Question
)
from ..utils.helpers import success_response, error_response, paginate_query
from ..services.ai_service import AIService

literature_bp = Blueprint('literature', __name__)


def get_uid():
    return get_jwt_identity()


# ═══════════════════════════════════════════════════════
# LITERATURE TEXTS (BOOKS/DRAMAS/POETRY)
# ═══════════════════════════════════════════════════════

@literature_bp.route('/texts', methods=['GET'])
@jwt_required()
def list_texts():
    """
    Get all literature texts.
    Filter by exam_body, text_type, search query.
    """
    exam_body = request.args.get('exam_body')  # WAEC, NECO, JAMB
    text_type = request.args.get('text_type')  # novel, drama, poetry
    search = request.args.get('q')
    page = request.args.get('page', 1, type=int)
    
    query = LiteratureText.query.filter_by(is_active=True, is_approved=True)
    
    if exam_body:
        query = query.filter(LiteratureText.exam_bodies.contains([exam_body]))
    
    if text_type:
        query = query.filter_by(text_type=text_type)
    
    if search:
        search_filter = f'%{search}%'
        query = query.filter(
            db.or_(
                LiteratureText.title.ilike(search_filter),
                LiteratureText.author.ilike(search_filter)
            )
        )
    
    query = query.order_by(LiteratureText.title.asc())
    
    # Add user progress if available
    uid = get_uid()
    paginated = paginate_query(query, page=page)
    
    texts_with_progress = []
    for text_dict in paginated['items']:
        text = LiteratureText.query.get(text_dict['id'])
        if text:
            progress = UserLiteratureProgress.query.filter_by(
                user_id=uid, text_id=text.id
            ).first()
            text_data = text.to_dict()
            text_data['user_progress'] = progress.to_dict() if progress else None
            texts_with_progress.append(text_data)
    
    paginated['items'] = texts_with_progress
    return success_response(paginated)


@literature_bp.route('/texts/<text_id>', methods=['GET'])
@jwt_required()
def get_text(text_id):
    """Get detailed information about a literature text."""
    uid = get_uid()
    text = LiteratureText.query.filter_by(id=text_id, is_active=True).first_or_404()
    
    # Get user progress
    progress = UserLiteratureProgress.query.filter_by(
        user_id=uid, text_id=text_id
    ).first()
    
    data = text.to_dict(include_chapters=True)
    data['user_progress'] = progress.to_dict() if progress else None
    
    # Add chapter completion status
    if progress and data.get('chapters'):
        completed = set(progress.chapters_completed or [])
        for chapter in data['chapters']:
            chapter['is_completed'] = chapter['number'] in completed
    
    return success_response(data)


@literature_bp.route('/texts/<text_id>/chapters', methods=['GET'])
@jwt_required()
def get_chapters(text_id):
    """Get all chapters for a text."""
    text = LiteratureText.query.filter_by(id=text_id, is_active=True).first_or_404()
    chapters = text.chapters.order_by(LiteratureChapter.number.asc()).all()
    
    # Add completion status
    uid = get_uid()
    progress = UserLiteratureProgress.query.filter_by(
        user_id=uid, text_id=text_id
    ).first()
    completed = set(progress.chapters_completed or []) if progress else set()
    
    result = []
    for chapter in chapters:
        ch_data = chapter.to_dict()
        ch_data['is_completed'] = chapter.number in completed
        result.append(ch_data)
    
    return success_response(result)


@literature_bp.route('/texts/<text_id>/chapters/<int:chapter_num>', methods=['GET'])
@jwt_required()
def get_chapter(text_id, chapter_num):
    """Get a specific chapter with full details."""
    chapter = LiteratureChapter.query.filter_by(
        text_id=text_id, number=chapter_num
    ).first_or_404()
    
    # Mark as accessed
    uid = get_uid()
    progress = UserLiteratureProgress.query.filter_by(
        user_id=uid, text_id=text_id
    ).first()
    
    if progress:
        progress.last_accessed = datetime.utcnow()
        db.session.commit()
    else:
        # Create initial progress
        progress = UserLiteratureProgress(
            user_id=uid,
            text_id=text_id,
        )
        db.session.add(progress)
        db.session.commit()
    
    data = chapter.to_dict(include_quiz=True)
    data['text_title'] = chapter.text.title if chapter.text else None
    data['is_completed'] = chapter_num in (progress.chapters_completed or []) if progress else False
    
    return success_response(data)


# ═══════════════════════════════════════════════════════
# PROGRESS TRACKING
# ═══════════════════════════════════════════════════════

@literature_bp.route('/texts/<text_id>/progress', methods=['POST'])
@jwt_required()
def update_progress(text_id):
    """Update reading progress for a text."""
    uid = get_uid()
    data = request.get_json()
    
    chapter_number = data.get('chapter_number')
    is_completed = data.get('is_completed', True)
    
    text = LiteratureText.query.filter_by(id=text_id, is_active=True).first_or_404()
    
    # Get or create progress
    progress = UserLiteratureProgress.query.filter_by(
        user_id=uid, text_id=text_id
    ).first()
    
    if not progress:
        progress = UserLiteratureProgress(
            user_id=uid,
            text_id=text_id,
        )
        db.session.add(progress)
        db.session.flush()
    
    # Mark chapter complete
    if is_completed and chapter_number:
        progress.mark_chapter_complete(chapter_number)
    
    # Recalculate progress percentage
    total_chapters = text.chapters.count()
    progress.calculate_progress(total_chapters)
    
    db.session.commit()
    
    return success_response(progress.to_dict())


# ═══════════════════════════════════════════════════════
# CHARACTERS & THEMES
# ═══════════════════════════════════════════════════════

@literature_bp.route('/texts/<text_id>/characters', methods=['GET'])
@jwt_required()
def get_characters(text_id):
    """Get character analyses for a text."""
    text = LiteratureText.query.filter_by(id=text_id, is_active=True).first_or_404()
    
    return success_response({
        'text_id': str(text_id),
        'characters': text.characters or [],
    })


@literature_bp.route('/texts/<text_id>/themes', methods=['GET'])
@jwt_required()
def get_themes(text_id):
    """Get theme analyses for a text."""
    text = LiteratureText.query.filter_by(id=text_id, is_active=True).first_or_404()
    
    return success_response({
        'text_id': str(text_id),
        'themes': text.themes or [],
    })


# ═══════════════════════════════════════════════════════
# PAST QUESTIONS
# ═══════════════════════════════════════════════════════

@literature_bp.route('/texts/<text_id>/questions', methods=['GET'])
@jwt_required()
def get_past_questions(text_id):
    """
    Get past exam questions for a literature text.
    Organized by year and exam body.
    """
    year = request.args.get('year', type=int)
    exam_body = request.args.get('exam_body')
    question_type = request.args.get('type')  # mcq, essay
    topic = request.args.get('topic')  # character, theme, etc.
    
    query = LiteraturePastQuestion.query.filter_by(
        text_id=text_id, is_active=True
    )
    
    if year:
        query = query.filter_by(year=year)
    if exam_body:
        query = query.filter_by(exam_body=exam_body)
    if question_type:
        query = query.filter_by(question_type=question_type)
    if topic:
        query = query.filter_by(topic=topic)
    
    questions = query.order_by(LiteraturePastQuestion.year.desc()).all()
    
    # Group by year
    by_year = {}
    for q in questions:
        y = q.year or 'Unknown'
        if y not in by_year:
            by_year[y] = []
        by_year[y].append(q.to_dict(include_answer=False))
    
    return success_response({
        'text_id': str(text_id),
        'total': len(questions),
        'years': sorted(by_year.keys(), reverse=True),
        'by_year': by_year,
    })


@literature_bp.route('/texts/<text_id>/questions/<question_id>', methods=['GET'])
@jwt_required()
def get_question(text_id, question_id):
    """Get a specific past question with answer."""
    question = LiteraturePastQuestion.query.filter_by(
        id=question_id, text_id=text_id
    ).first_or_404()
    
    return success_response(question.to_dict(include_answer=True))


# ═══════════════════════════════════════════════════════
# QUIZ GENERATION
# ═══════════════════════════════════════════════════════

@literature_bp.route('/texts/<text_id>/quiz/generate', methods=['POST'])
@jwt_required()
def generate_quiz(text_id):
    """
    Generate a quiz on a literature text.
    
    Options:
    - scope: full, chapter, theme, character
    - type: mcq, essay, both
    - count: number of questions
    """
    uid = get_uid()
    data = request.get_json()
    
    text = LiteratureText.query.filter_by(id=text_id, is_active=True).first_or_404()
    
    scope = data.get('scope', 'full')  # full, chapter, theme, character
    quiz_type = data.get('type', 'multiple_choice')  # multiple_choice, essay, both
    count = min(data.get('count', 15), 30)
    
    # Get context based on scope
    if scope == 'chapter':
        chapter_num = data.get('chapter_number')
        chapter = LiteratureChapter.query.filter_by(
            text_id=text_id, number=chapter_num
        ).first()
        context = chapter.summary if chapter else text.summary
        scope_desc = f"Chapter {chapter_num}"
    elif scope == 'theme':
        theme = data.get('theme')
        context = f"Theme: {theme}. {text.summary}"
        scope_desc = f"Theme: {theme}"
    elif scope == 'character':
        character = data.get('character')
        context = f"Character: {character}. {text.summary}"
        scope_desc = f"Character: {character}"
    else:
        context = text.summary
        scope_desc = "Full text"
    
    # Generate quiz with AI
    if quiz_type == 'multiple_choice':
        prompt = f"""Create {count} multiple choice questions about '{text.title}' by {text.author}.
Focus on: {scope_desc}
Context: {context[:2000] if context else 'Nigerian exam level'}

Return ONLY JSON array:
[{{
  "question": "Clear question text",
  "option_a": "First option",
  "option_b": "Second option", 
  "option_c": "Third option",
  "option_d": "Fourth option",
  "correct": "A|B|C|D",
  "explanation": "Why this is correct",
  "topic": "character|theme|plot|setting"
}}]

Questions should test deep understanding, not just memorization."""
        
    else:  # essay
        prompt = f"""Create {count} essay questions about '{text.title}' by {text.author}.
Focus on: {scope_desc}

Return ONLY JSON array:
[{{
  "question": "Essay question text",
  "key_points": ["Point 1", "Point 2", "Point 3"],
  "model_answer": "Detailed model answer",
  "marks": 10,
  "topic": "character|theme|plot|setting"
}}]

Essay questions should require critical thinking and textual evidence."""
    
    try:
        questions = AIService.generate_structured_content(prompt, list)
        
        # Update user's quiz attempts
        progress = UserLiteratureProgress.query.filter_by(
            user_id=uid, text_id=text_id
        ).first()
        
        if progress:
            progress.quiz_attempts += 1
            db.session.commit()
        
        return success_response({
            'text_id': str(text_id),
            'text_title': text.title,
            'scope': scope,
            'type': quiz_type,
            'questions': questions,
            'total': len(questions),
        })
        
    except Exception as e:
        return error_response(f'Failed to generate quiz: {str(e)}', 500)


# ═══════════════════════════════════════════════════════
# LITERATURE CHALLENGES
# ═══════════════════════════════════════════════════════

@literature_bp.route('/texts/<text_id>/challenge', methods=['POST'])
@jwt_required()
def create_literature_challenge(text_id):
    """
    Create a challenge with literature questions.
    Challenge a friend to quiz on this text.
    """
    uid = get_uid()
    data = request.get_json()
    
    text = LiteratureText.query.filter_by(id=text_id, is_active=True).first_or_404()
    
    opponent_id = data.get('opponent_id')
    question_count = min(data.get('question_count', 20), 30)
    
    if not opponent_id:
        return error_response('opponent_id required', 422)
    
    # Generate questions for the challenge
    prompt = f"""Create {question_count} multiple choice questions about '{text.title}' by {text.author}.
Mix of character analysis, themes, plot, and setting questions.

Return ONLY JSON array:
[{{
  "question": "...",
  "option_a": "...",
  "option_b": "...",
  "option_c": "...",
  "option_d": "...",
  "correct": "A|B|C|D",
  "explanation": "..."
}}]"""

    try:
        questions = AIService.generate_structured_content(prompt, list)
        
        # Create the challenge
        challenge = Challenge(
            challenger_id=uid,
            opponent_id=opponent_id,
            subject='Literature in English',
            topic=f"{text.title} - {text.author}",
            exam_type='Literature',
            question_count=len(questions),
            status='pending',
        )
        
        db.session.add(challenge)
        db.session.flush()
        
        # Store custom questions in challenge metadata
        # We'll extend the Challenge model or use a separate table
        challenge.challenger_answers = {'custom_questions': questions}
        
        db.session.commit()
        
        return success_response({
            'challenge': challenge.to_dict(current_user_id=uid),
            'text_title': text.title,
            'questions_count': len(questions),
        }, status_code=201)
        
    except Exception as e:
        db.session.rollback()
        return error_response(f'Failed to create challenge: {str(e)}', 500)


# ═══════════════════════════════════════════════════════
# ADMIN ENDPOINTS (for seeding literature data)
# ═══════════════════════════════════════════════════════

@literature_bp.route('/admin/texts', methods=['POST'])
@jwt_required()
def create_text():
    """Admin: Add a new literature text."""
    # TODO: Add admin check
    data = request.get_json()
    
    text = LiteratureText(
        title=data.get('title'),
        author=data.get('author'),
        text_type=data.get('text_type'),
        exam_bodies=data.get('exam_bodies', []),
        year_published=data.get('year_published'),
        summary=data.get('summary'),
        themes=data.get('themes', []),
        characters=data.get('characters', []),
        writing_style=data.get('writing_style'),
        is_approved=data.get('is_approved', False),
    )
    
    db.session.add(text)
    db.session.commit()
    
    return success_response(text.to_dict(), status_code=201)


@literature_bp.route('/admin/texts/<text_id>/chapters', methods=['POST'])
@jwt_required()
def create_chapter(text_id):
    """Admin: Add a chapter to a literature text."""
    text = LiteratureText.query.get_or_404(text_id)
    data = request.get_json()
    
    chapter = LiteratureChapter(
        text_id=text_id,
        number=data.get('number'),
        title=data.get('title'),
        summary=data.get('summary'),
        key_events=data.get('key_events', []),
        quotes=data.get('quotes', []),
        quiz_questions=data.get('quiz_questions', []),
    )
    
    db.session.add(chapter)
    db.session.commit()
    
    return success_response(chapter.to_dict(), status_code=201)


@literature_bp.route('/admin/questions', methods=['POST'])
@jwt_required()
def create_past_question():
    """Admin: Add a past exam question about literature."""
    data = request.get_json()
    
    question = LiteraturePastQuestion(
        text_id=data.get('text_id'),
        question_text=data.get('question_text'),
        question_type=data.get('question_type'),
        year=data.get('year'),
        exam_body=data.get('exam_body'),
        option_a=data.get('option_a'),
        option_b=data.get('option_b'),
        option_c=data.get('option_c'),
        option_d=data.get('option_d'),
        correct_answer=data.get('correct_answer'),
        marks=data.get('marks', 10),
        model_answer=data.get('model_answer'),
        key_points=data.get('key_points', []),
        topic=data.get('topic'),
    )
    
    db.session.add(question)
    db.session.commit()
    
    return success_response(question.to_dict(), status_code=201)


# Add import for db
from ..extensions import db
