from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..extensions import db
from ..models import Question, QuestionReport
from ..utils.helpers import success_response, error_response, paginate_query

questions_bp = Blueprint('questions', __name__)


@questions_bp.route('', methods=['GET'])
@jwt_required()
def get_questions():
    """Get questions with filters."""
    user_id = get_jwt_identity()
    query = Question.query.filter_by(is_active=True, is_approved=True)

    exam_type  = request.args.get('exam_type')
    subject    = request.args.get('subject')
    topic      = request.args.get('topic')
    year       = request.args.get('year', type=int)
    difficulty = request.args.get('difficulty')
    limit      = request.args.get('limit', 40, type=int)
    page       = request.args.get('page', 1, type=int)

    if exam_type:  query = query.filter_by(exam_type=exam_type)
    if subject:    query = query.filter_by(subject=subject)
    if topic:      query = query.filter_by(topic=topic)
    if year:       query = query.filter_by(year=year)
    if difficulty: query = query.filter_by(difficulty=difficulty)

    per_page = min(limit, 100)
    paginated = query.order_by(Question.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )

    return success_response({
        'questions': [q.to_dict() for q in paginated.items],
        'total': paginated.total,
        'pages': paginated.pages,
        'current_page': page,
    })


@questions_bp.route('/<question_id>', methods=['GET'])
@jwt_required()
def get_question(question_id):
    """Get a single question (without correct answer by default)."""
    q = Question.query.get_or_404(question_id)
    include_answer = request.args.get('include_answer', 'false').lower() == 'true'
    return success_response(q.to_dict(include_answer=include_answer))


@questions_bp.route('/<question_id>/report', methods=['POST'])
@jwt_required()
def report_question(question_id):
    """Report a question for review."""
    user_id = get_jwt_identity()
    data = request.get_json()
    q = Question.query.get_or_404(question_id)

    report = QuestionReport(
        question_id=q.id,
        user_id=user_id,
        reason=data.get('reason', 'other'),
        description=data.get('description', ''),
    )
    q.report_count = (q.report_count or 0) + 1
    db.session.add(report)
    db.session.commit()

    return success_response(message='Question reported. Thank you for your feedback.')


@questions_bp.route('/generate', methods=['POST'])
@jwt_required()
def generate_questions():
    """Generate AI questions for a topic (premium)."""
    from ..services.ai_service import AIService
    data = request.get_json()
    subject    = data.get('subject', '')
    topic      = data.get('topic', '')
    difficulty = data.get('difficulty', 'medium')
    count      = min(data.get('count', 10), 20)
    exam_type  = data.get('exam_type', 'JAMB')

    if not subject or not topic:
        return error_response('subject and topic are required', 422)

    questions = AIService.generate_questions(subject, topic, difficulty, count, exam_type)
    return success_response([q.to_dict(include_answer=True) for q in questions], status_code=201)


@questions_bp.route('/topics', methods=['GET'])
@jwt_required()
def get_topics():
    """Get all topics for a subject."""
    from sqlalchemy import distinct
    subject = request.args.get('subject')
    exam_type = request.args.get('exam_type')

    query = db.session.query(distinct(Question.topic)).filter(
        Question.is_active == True, Question.topic.isnot(None)
    )
    if subject:    query = query.filter(Question.subject == subject)
    if exam_type:  query = query.filter(Question.exam_type == exam_type)

    topics = sorted([t[0] for t in query.all() if t[0]])
    return success_response({'topics': topics})


@questions_bp.route('/years', methods=['GET'])
@jwt_required()
def get_years():
    """Get available years for an exam type."""
    from sqlalchemy import distinct
    exam_type = request.args.get('exam_type', 'JAMB')
    years = db.session.query(distinct(Question.year)).filter(
        Question.exam_type == exam_type,
        Question.year.isnot(None),
        Question.is_active == True
    ).order_by(Question.year.desc()).all()
    return success_response({'years': [y[0] for y in years if y[0]]})
