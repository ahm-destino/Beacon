from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models import User, PracticeSession, SessionAnswer, Question, Streak, StudyEvent
from ..utils.helpers import success_response, error_response
from ..extensions import db
from sqlalchemy import func

analytics_bp = Blueprint('analytics', __name__)

def get_uid(): return get_jwt_identity()

ANSWER_ACTIONS = [
    'answer_correct', 'answer_wrong',
    'challenge_answer_correct', 'challenge_answer_wrong',
    'diagnostic_answer_correct', 'diagnostic_answer_wrong',
]

CORRECT_ACTIONS = [
    'answer_correct',
    'challenge_answer_correct',
    'diagnostic_answer_correct',
]

WRONG_ACTIONS = [
    'answer_wrong',
    'challenge_answer_wrong',
    'diagnostic_answer_wrong',
]


@analytics_bp.route('/dashboard', methods=['GET'])
@jwt_required()
def dashboard():
    uid = get_uid()
    user = User.query.get(uid)

    correct_case = db.case(
        (StudyEvent.is_correct == True, 1),
        (StudyEvent.action_type.in_(CORRECT_ACTIONS), 1),
        else_=0
    )
    totals = db.session.query(
        func.count(StudyEvent.id),
        func.sum(correct_case)
    ).filter(
        StudyEvent.user_id == uid,
        StudyEvent.action_type.in_(ANSWER_ACTIONS)
    ).first()
    total = int(totals[0] or 0)
    correct = int(totals[1] or 0)
    accuracy = round(correct / total * 100, 1) if total > 0 else 0
    streak = user.streak

    completed_sessions = PracticeSession.query.filter_by(
        user_id=uid, status='completed'
    ).count()

    return success_response({
        'total_questions': total,
        'overall_accuracy': accuracy,
        'sessions_completed': completed_sessions,
        'current_streak': streak.current_streak if streak else 0,
        'longest_streak': streak.longest_streak if streak else 0,
        'points_balance': user.points_balance or 0,
        'subscription_tier': user.subscription_tier,
    })


@analytics_bp.route('/subjects', methods=['GET'])
@jwt_required()
def subjects():
    uid = get_uid()
    correct_case = db.case(
        (StudyEvent.is_correct == True, 1),
        (StudyEvent.action_type.in_(CORRECT_ACTIONS), 1),
        else_=0
    )
    results = db.session.query(
        StudyEvent.subject,
        func.count(StudyEvent.id).label('total'),
        func.sum(correct_case).label('correct')
    ).filter(
        StudyEvent.user_id == uid,
        StudyEvent.action_type.in_(ANSWER_ACTIONS),
        StudyEvent.subject.isnot(None)
    ).group_by(StudyEvent.subject).all()

    data = [{
        'subject': row.subject,
        'total': row.total,
        'correct': row.correct,
        'accuracy': round(row.correct / row.total * 100, 1) if row.total > 0 else 0
    } for row in results]
    return success_response(data)


@analytics_bp.route('/prediction', methods=['GET'])
@jwt_required()
def prediction():
    from ..services.score_predictor import ScorePredictor
    uid = get_uid()
    result = ScorePredictor.predict(uid)
    if result is None:
        return success_response({'message': 'Answer at least 50 questions to unlock score prediction'})
    return success_response(result)


@analytics_bp.route('/errors', methods=['GET'])
@jwt_required()
def error_patterns():
    uid = get_uid()
    wrong_events = StudyEvent.query.filter(
        StudyEvent.user_id == uid,
        StudyEvent.action_type.in_(WRONG_ACTIONS)
    ).all()

    question_ids = [e.question_id for e in wrong_events if e.question_id]
    q_map = {}
    if question_ids:
        questions = Question.query.filter(Question.id.in_(question_ids)).all()
        q_map = {str(q.id): q for q in questions}

    topic_errors = {}
    for e in wrong_events:
        subject = e.subject
        topic = e.topic
        if e.question_id and q_map.get(str(e.question_id)):
            q = q_map[str(e.question_id)]
            subject = q.subject
            topic = q.topic
        if not subject and not topic:
            continue
        key = f"{subject} > {topic or 'General'}"
        topic_errors[key] = topic_errors.get(key, 0) + 1

    sorted_errors = sorted(topic_errors.items(), key=lambda x: -x[1])
    return success_response([{'area': k, 'errors': v} for k, v in sorted_errors[:20]])


@analytics_bp.route('/trends', methods=['GET'])
@jwt_required()
def trends():
    uid = get_uid()
    from datetime import date, datetime, timedelta
    today = date.today()
    start = today - timedelta(days=29)

    activity = {}
    for i in range(30):
        d = start + timedelta(days=i)
        activity[d] = {'questions_done': 0, 'seconds': 0}

    cutoff = datetime.combine(start, datetime.min.time())
    events = StudyEvent.query.filter(
        StudyEvent.user_id == uid,
        StudyEvent.action_type.in_(ANSWER_ACTIONS),
        StudyEvent.created_at >= cutoff
    ).all()

    for e in events:
        if not e.created_at:
            continue
        d = e.created_at.date()
        if d not in activity:
            continue
        activity[d]['questions_done'] += 1
        if e.time_spent is not None:
            try:
                activity[d]['seconds'] += max(0, int(e.time_spent))
            except Exception:
                pass

    days = []
    for i in range(30):
        d = start + timedelta(days=i)
        seconds = activity[d]['seconds']
        minutes = int(round(seconds / 60)) if seconds else 0
        days.append({
            'date': d.isoformat(),
            'questions_done': activity[d]['questions_done'],
            'minutes_studied': minutes,
        })
    return success_response({'daily_activity': days})


@analytics_bp.route('/heatmap', methods=['GET'])
@jwt_required()
def heatmap():
    """Return study activity heatmap for last 30 days."""
    uid = get_uid()
    from datetime import datetime, timedelta
    from ..models import StudyEvent

    cutoff = datetime.utcnow() - timedelta(days=30)
    events = StudyEvent.query.filter(
        StudyEvent.user_id == uid,
        StudyEvent.created_at >= cutoff
    ).all()

    days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    buckets = ['0-3', '4-7', '8-11', '12-15', '16-19', '20-23']
    values = [[0 for _ in buckets] for _ in days]

    for e in events:
        if not e.created_at:
            continue
        day_idx = e.created_at.weekday()  # Monday=0
        bucket_idx = int(e.created_at.hour // 4)
        if 0 <= day_idx < 7 and 0 <= bucket_idx < len(buckets):
            values[day_idx][bucket_idx] += 1

    max_val = max([max(row) for row in values]) if values else 0

    return success_response({
        'days': days,
        'buckets': buckets,
        'values': values,
        'max': max_val,
    })


@analytics_bp.route('/weak-areas', methods=['GET'])
@jwt_required()
def weak_areas():
    """
    Get weak and strong areas from TopicPerformance table.
    Weak = accuracy < 70% with >= 5 attempts
    Strong = accuracy >= 80% with >= 5 attempts
    """
    uid = get_uid()
    
    # Use the dedicated TopicPerformance table (FIX 4)
    from ..models import TopicPerformance
    
    weak = TopicPerformance.query.filter_by(
        user_id=uid,
        is_weak_area=True
    ).order_by(
        TopicPerformance.accuracy.asc()
    ).limit(10).all()
    
    strong = TopicPerformance.query.filter(
        TopicPerformance.user_id == uid,
        TopicPerformance.accuracy >= 80,
        TopicPerformance.total_attempts >= 5,
        TopicPerformance.is_weak_area == False
    ).order_by(
        TopicPerformance.accuracy.desc()
    ).limit(5).all()
    
    return success_response({
        'weak_areas': [w.to_dict() for w in weak],
        'strong_areas': [s.to_dict() for s in strong],
    })
