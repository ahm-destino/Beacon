"""
Topic Performance Service

Handles automatic tracking of user performance per topic/subject.
Called after EVERY answer submission to maintain real-time weak areas detection.
"""

from datetime import datetime
from ..extensions import db
from ..models import TopicPerformance, SessionAnswer, Question, StudyEvent


def update_topic_performance(user_id, question_id, is_correct, time_spent=0):
    """
    Update the user's topic performance after answering a question.
    Now supports Metadata-First Architecture: updates EVERY concept tag found
    in the question metadata.
    """
    # Get question details
    question = Question.query.get(question_id)
    if not question:
        return None
    
    subject = question.subject
    
    # ─── METADATA-FIRST LOGIC ────────────────────────────────────────────────
    # We gather all academic topics to update. 
    # If the question has 'concepts' (granular tags), we update all of them.
    # Otherwise, we fallback to the main 'topic' (unless it's a filename/General).
    topics_to_update = []
    if question.concepts and isinstance(question.concepts, list):
        topics_to_update = [t for t in question.concepts if t]
    
    # Fallback/Default if no granular tags found
    if not topics_to_update:
        main_topic = question.topic or 'General'
        # Basic filter: don't track 'General' or Filenames as unique academic concepts
        forbidden = ['.pdf', '.docx', '.pptx', '.txt', 'general']
        is_rubbish = any(f in main_topic.lower() for f in forbidden) or len(main_topic) < 3
        if not is_rubbish:
            topics_to_update = [main_topic]
            
    if not topics_to_update:
        # If still nothing (e.g. it was 'General'), we just return None to avoid polluting DB
        return None

    last_perf = None
    for topic in topics_to_update:
        # Find or create performance record
        performance = TopicPerformance.query.filter_by(
            user_id=user_id,
            subject=subject,
            topic=topic
        ).first()
        
        if not performance:
            performance = TopicPerformance(
                user_id=user_id,
                subject=subject,
                topic=topic,
                total_attempts=0,
                correct_answers=0,
                accuracy=0.0,
                trend='stable',
                total_time_spent=0,
                is_weak_area=False,
            )
            db.session.add(performance)
            db.session.flush()
        
        # Update stats
        performance.total_attempts += 1
        if is_correct:
            performance.correct_answers += 1
        performance.total_time_spent += (time_spent or 0)
        performance.last_attempted = datetime.utcnow()
        
        # Recalculate and update thresholds
        performance.calculate_accuracy()
        _update_trend(performance, user_id, subject, topic)
        performance.update_weak_area_status()
        last_perf = performance

    return last_perf


def _update_trend(performance, user_id, subject, topic):
    """
    Calculate trend by comparing recent 5 attempts vs previous 5.
    Updates the performance object in place.
    """
    # Get last 10 attempts for this subject/topic
    recent_answers = SessionAnswer.query.join(
        Question, SessionAnswer.question_id == Question.id
    ).filter(
        SessionAnswer.user_id == user_id,
        Question.subject == subject,
        Question.topic == topic,
    ).order_by(
        SessionAnswer.answered_at.desc()
    ).limit(10).all()
    
    if len(recent_answers) >= 10:
        recent_5 = recent_answers[:5]
        prev_5 = recent_answers[5:10]
        
        recent_accuracy = sum(1 for a in recent_5 if a.is_correct) / 5 * 100
        prev_accuracy = sum(1 for a in prev_5 if a.is_correct) / 5 * 100
        
        performance.calculate_trend(recent_accuracy, prev_accuracy)
    else:
        performance.trend = 'stable'


def get_weak_areas(user_id, limit=10):
    """
    Get the user's weak areas (accuracy < 70% with 5+ attempts).
    
    Returns list of TopicPerformance objects sorted by accuracy ascending.
    """
    weak = TopicPerformance.query.filter_by(
        user_id=user_id,
        is_weak_area=True
    ).order_by(
        TopicPerformance.accuracy.asc()
    ).limit(limit).all()
    
    return weak


def get_strong_areas(user_id, limit=5):
    """
    Get the user's strong areas (accuracy >= 80% with 5+ attempts).
    
    Returns list of TopicPerformance objects sorted by accuracy descending.
    """
    strong = TopicPerformance.query.filter(
        TopicPerformance.user_id == user_id,
        TopicPerformance.accuracy >= 80,
        TopicPerformance.total_attempts >= 5,
        TopicPerformance.is_weak_area == False
    ).order_by(
        TopicPerformance.accuracy.desc()
    ).limit(limit).all()
    
    return strong


def get_topic_recommendations(user_id):
    """
    Get personalized topic recommendations based on weak areas.
    Returns topics that need the most attention.
    """
    weak = get_weak_areas(user_id, limit=5)
    
    recommendations = []
    for perf in weak:
        recommendations.append({
            'subject': perf.subject,
            'topic': perf.topic,
            'accuracy': perf.accuracy,
            'attempts': perf.total_attempts,
            'priority': 'high' if perf.accuracy < 50 else 'medium',
            'reason': 'Weak area - needs practice'
        })
    
    return recommendations


def record_study_event(user_id, action_type, **kwargs):
    """
    Record a study event for analytics tracking.
    
    Args:
        user_id: UUID of the user
        action_type: Type of action (answer_correct, answer_wrong, etc.)
        **kwargs: Additional fields (subject, topic, difficulty, etc.)
    """
    event = StudyEvent(
        user_id=user_id,
        action_type=action_type,
        subject=kwargs.get('subject'),
        topic=kwargs.get('topic'),
        difficulty=kwargs.get('difficulty'),
        is_correct=kwargs.get('is_correct'),
        time_spent=kwargs.get('time_spent'),
        score=kwargs.get('score'),
        session_id=kwargs.get('session_id'),
        challenge_id=kwargs.get('challenge_id'),
        question_id=kwargs.get('question_id'),
        event_metadata=kwargs.get('metadata', {}),
    )
    
    db.session.add(event)
    return event


def award_points(user_id, points, action, description=''):
    """
    Award points to a user and record the transaction.
    """
    from ..models import User, PointTransaction

    user = User.query.get(user_id)
    if not user:
        return None

    # Update balance
    user.points_balance = (user.points_balance or 0) + points

    # --- LEAGUE SYSTEM TRIGGER ---
    from .league_service import update_league_points
    update_league_points(user_id, points)
    # -----------------------------

    # Record transaction
    transaction = PointTransaction(
        user_id=user_id,
        amount=points,
        action=action,
        description=description,
        balance_after=user.points_balance,
    )
    db.session.add(transaction)

    return transaction
