from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from ..extensions import db
from ..models import User, PracticeSession, SessionAnswer, Streak, UserBadge, PointTransaction, Badge, Referral, StudyEvent
from ..utils.helpers import success_response, error_response, paginate_query, generate_referral_code
from ..services.performance_service import award_points
from sqlalchemy import func

REFERRAL_SIGNUP_POINTS = 200
REFERRAL_SUBSCRIPTION_POINTS = 500

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

BADGE_DEFINITIONS = [
    # Streak badges
    { 'slug': 'on_fire', 'name': 'On Fire', 'icon': '🔥', 'category': 'streak',
      'requirement': {'type': 'streak', 'days': 7}, 'points_reward': 100 },
    { 'slug': 'unstoppable', 'name': 'Unstoppable', 'icon': '💪', 'category': 'streak',
      'requirement': {'type': 'streak', 'days': 14}, 'points_reward': 200 },
    { 'slug': 'legend', 'name': 'Legend', 'icon': '👑', 'category': 'streak',
      'requirement': {'type': 'streak', 'days': 30}, 'points_reward': 500 },

    # Performance badges
    { 'slug': 'perfect_score', 'name': 'Perfect Score', 'icon': '⭐', 'category': 'performance',
      'requirement': {'type': 'score', 'value': 100}, 'points_reward': 150 },
    { 'slug': 'speed_demon', 'name': 'Speed Demon', 'icon': '⚡', 'category': 'performance',
      'requirement': {'type': 'avg_time', 'seconds': 20}, 'points_reward': 100 },

    # Milestone badges
    { 'slug': '100_questions', 'name': 'Century', 'icon': '💯', 'category': 'milestone',
      'requirement': {'type': 'total_questions', 'count': 100}, 'points_reward': 50 },
    { 'slug': '1000_questions', 'name': 'Grinder', 'icon': '🏋️', 'category': 'milestone',
      'requirement': {'type': 'total_questions', 'count': 1000}, 'points_reward': 300 },
]


def _badge_requirement_text(req):
    if not req:
        return ''
    rtype = req.get('type')
    if rtype == 'streak':
        return f"{req.get('days')}-day streak"
    if rtype == 'score':
        return f"Score {req.get('value')}% in a session"
    if rtype == 'avg_time':
        return f"Average under {req.get('seconds')}s per question"
    if rtype == 'total_questions':
        return f"Answer {req.get('count')} questions"
    return ''


def _ensure_badge_definitions():
    """Seed badge definitions if missing."""
    for b in BADGE_DEFINITIONS:
        badge = Badge.query.filter_by(slug=b['slug']).first()
        if not badge:
            badge = Badge(
                slug=b['slug'],
                name=b['name'],
                description=_badge_requirement_text(b.get('requirement')),
                icon=b['icon'],
                category=b['category'],
                points_reward=b['points_reward'],
                requirement=b['requirement'],
            )
            db.session.add(badge)
        else:
            badge.name = b['name']
            badge.icon = b['icon']
            badge.category = b['category']
            badge.points_reward = b['points_reward']
            badge.requirement = b['requirement']
            badge.description = _badge_requirement_text(b.get('requirement'))
    db.session.commit()

def _ensure_referral_code(user):
    if user.referral_code:
        return user.referral_code
    for _ in range(10):
        code = generate_referral_code(user.full_name)
        if not User.query.filter_by(referral_code=code).first():
            user.referral_code = code
            db.session.commit()
            return code
    while True:
        code = generate_referral_code()
        if not User.query.filter_by(referral_code=code).first():
            user.referral_code = code
            db.session.commit()
            return code

users_bp = Blueprint('users', __name__)


def get_current_user():
    return User.query.get(get_jwt_identity())


@users_bp.route('/me', methods=['GET'])
@jwt_required()
def get_me():
    """Get current user profile."""
    user = get_current_user()
    if not user:
        return error_response('User not found', 404)
    return success_response(user.to_dict())


@users_bp.route('/me/heartbeat', methods=['POST'])
@jwt_required()
def heartbeat():
    """Lightweight endpoint called every 60s by the frontend to update last_seen."""
    user = get_current_user()
    if not user:
        return error_response('User not found', 404)
    user.last_seen = datetime.utcnow()
    db.session.commit()
    return success_response({'ok': True})


@users_bp.route('/me', methods=['PUT'])
@jwt_required()
def update_me():
    """Update profile fields."""
    user = get_current_user()
    if not user:
        return error_response('User not found', 404)

    data = request.get_json()
    allowed = [
        'full_name', 'username', 'phone', 'class_level', 'state', 'school_name',
        'target_course', 'target_university', 'primary_exam', 'exam_date',
        'subjects', 'daily_question_goal', 'explanation_level',
        'language_preference', 'theme', 'font_size', 'notifications_enabled',
        'notification_preferences', 'study_reminder_time'
    ]
    for field in allowed:
        if field in data:
            setattr(user, field, data[field])

    if 'bio' in data:
        bio = (data.get('bio') or '').strip()
        if len(bio) > 200:
            bio = bio[:200]
        user.bio = bio

    if 'bio_visibility' in data:
        visibility = (data.get('bio_visibility') or '').strip().lower()
        if visibility in ('public', 'friends', 'private'):
            user.bio_visibility = visibility

    if 'bio_moderation_status' in data:
        status = (data.get('bio_moderation_status') or '').strip().lower()
        if status in ('approved', 'pending', 'flagged'):
            user.bio_moderation_status = status

    db.session.commit()
    return success_response(user.to_dict(), message='Profile updated')


@users_bp.route('/me', methods=['DELETE'])
@jwt_required()
def delete_me():
    """Soft-delete the account (deactivate)."""
    user = get_current_user()
    if not user:
        return error_response('User not found', 404)

    user.is_active = False
    user.email = f"deleted_{user.id}@beacon.deleted"
    db.session.commit()
    return success_response(message='Account deleted')


@users_bp.route('/me/stats', methods=['GET'])
@jwt_required()
def get_stats():
    """Return full performance summary for the user."""
    user = get_current_user()
    if not user:
        return error_response('User not found', 404)

    correct_case = db.case(
        (StudyEvent.is_correct == True, 1),
        (StudyEvent.action_type.in_(CORRECT_ACTIONS), 1),
        else_=0
    )
    totals = db.session.query(
        func.count(StudyEvent.id),
        func.sum(correct_case)
    ).filter(
        StudyEvent.user_id == user.id,
        StudyEvent.action_type.in_(ANSWER_ACTIONS)
    ).first()
    total = int(totals[0] or 0)
    correct = int(totals[1] or 0)
    accuracy = round(correct / total * 100, 1) if total > 0 else 0

    completed_sessions = PracticeSession.query.filter_by(
        user_id=user.id, status='completed'
    ).count()

    streak = user.streak
    badges_count = UserBadge.query.filter_by(user_id=user.id).count()

    return success_response({
        'total_questions_answered': total,
        'total_correct': correct,
        'overall_accuracy': accuracy,
        'sessions_completed': completed_sessions,
        'points_balance': user.points_balance or 0,
        'badges_earned': badges_count,
        'current_streak': streak.current_streak if streak else 0,
        'longest_streak': streak.longest_streak if streak else 0,
        'subscription_tier': user.subscription_tier,
    })


@users_bp.route('/me/subjects', methods=['GET'])
@jwt_required()
def get_subject_performance():
    """Return per-subject performance breakdown."""
    user = get_current_user()
    if not user:
        return error_response('User not found', 404)

    from sqlalchemy import func
    from ..models import Question

    results = db.session.query(
        Question.subject,
        func.count(SessionAnswer.id).label('total'),
        func.sum(db.case((SessionAnswer.is_correct == True, 1), else_=0)).label('correct')
    ).join(
        SessionAnswer, SessionAnswer.question_id == Question.id
    ).filter(
        SessionAnswer.user_id == user.id
    ).group_by(Question.subject).all()

    subjects = []
    for row in results:
        accuracy = round(row.correct / row.total * 100, 1) if row.total > 0 else 0
        subjects.append({
            'subject': row.subject,
            'total': row.total,
            'correct': row.correct,
            'accuracy': accuracy,
        })

    return success_response(subjects)


@users_bp.route('/me/points', methods=['GET'])
@jwt_required()
def get_points():
    """Get points balance and transaction history."""
    user = get_current_user()
    if not user:
        return error_response('User not found', 404)

    page = request.args.get('page', 1, type=int)
    transactions_q = PointTransaction.query.filter_by(user_id=user.id).order_by(
        PointTransaction.created_at.desc()
    )
    paginated = paginate_query(transactions_q, page=page)

    return success_response({
        'balance': user.points_balance or 0,
        'transactions': paginated,
    })


@users_bp.route('/me/badges', methods=['GET'])
@jwt_required()
def get_badges():
    """Get earned, in-progress, and locked badges."""
    user = get_current_user()
    if not user:
        return error_response('User not found', 404)

    _ensure_badge_definitions()

    # Metrics for badge evaluation
    streak = Streak.query.filter_by(user_id=user.id).first()
    current_streak = streak.current_streak if streak else 0
    total_questions = SessionAnswer.query.filter_by(user_id=user.id).count()
    best_score = db.session.query(
        func.max(PracticeSession.score)
    ).filter(
        PracticeSession.user_id == user.id,
        PracticeSession.status == 'completed'
    ).scalar() or 0
    avg_time = db.session.query(
        func.avg(SessionAnswer.time_spent)
    ).filter(
        SessionAnswer.user_id == user.id,
        SessionAnswer.time_spent.isnot(None)
    ).scalar()

    avg_time = float(avg_time) if avg_time is not None else None

    # Existing earned badges by slug
    earned_rows = UserBadge.query.filter_by(user_id=user.id).all()
    earned_map = {}
    for row in earned_rows:
        if row.badge:
            earned_map[row.badge.slug] = row

    earned = []
    in_progress = []
    locked = []

    # Evaluate each definition
    for definition in BADGE_DEFINITIONS:
        slug = definition['slug']
        req = definition.get('requirement') or {}
        req_type = req.get('type')
        progress = 0
        target = None
        achieved = False

        if req_type == 'streak':
            target = req.get('days') or 0
            progress = current_streak
            achieved = progress >= target
        elif req_type == 'score':
            target = req.get('value') or 0
            progress = float(best_score or 0)
            achieved = progress >= target
        elif req_type == 'avg_time':
            target = req.get('seconds') or 0
            progress = round(avg_time, 1) if avg_time is not None else 0
            achieved = avg_time is not None and progress <= target
        elif req_type == 'total_questions':
            target = req.get('count') or 0
            progress = total_questions
            achieved = progress >= target

        badge = Badge.query.filter_by(slug=slug).first()
        if not badge:
            continue

        if achieved:
            if slug not in earned_map:
                # Award new badge
                user_badge = UserBadge(user_id=user.id, badge_id=badge.id)
                db.session.add(user_badge)
                award_points(user.id, badge.points_reward or 0, 'badge', f"Badge earned: {badge.name}")
                db.session.commit()
                earned_map[slug] = user_badge
            earned.append({
                'slug': badge.slug,
                'name': badge.name,
                'icon': badge.icon,
                'category': badge.category,
                'requirement': badge.requirement,
                'points_reward': badge.points_reward,
                'earned_at': earned_map[slug].earned_at.isoformat() if earned_map[slug].earned_at else None,
            })
        else:
            if target is None:
                locked.append({
                    'slug': badge.slug,
                    'name': badge.name,
                    'icon': badge.icon,
                    'category': badge.category,
                    'requirement': _badge_requirement_text(badge.requirement),
                })
            else:
                in_progress.append({
                    'slug': badge.slug,
                    'name': badge.name,
                    'icon': badge.icon,
                    'category': badge.category,
                    'requirement': badge.requirement,
                    'progress': progress,
                    'target': target,
                    'points_reward': badge.points_reward,
                })

    # Sort lists for stable UI
    earned = sorted(earned, key=lambda b: b.get('earned_at') or '')
    in_progress = sorted(in_progress, key=lambda b: b.get('target') or 0)
    locked = sorted(locked, key=lambda b: b.get('name') or '')

    return success_response({
        'earned': earned,
        'in_progress': in_progress,
        'locked': locked,
    })


@users_bp.route('/me/referral', methods=['GET'])
@jwt_required()
def get_referral():
    """Get referral code and stats."""
    user = get_current_user()
    if not user:
        return error_response('User not found', 404)

    code = _ensure_referral_code(user)

    referrals = Referral.query.filter_by(referrer_id=user.id).order_by(
        Referral.created_at.desc()
    ).all()

    referred_ids = [r.referred_id for r in referrals if r.referred_id]
    referred_users = []
    if referred_ids:
        users = User.query.filter(User.id.in_(referred_ids)).all()
        user_map = {str(u.id): u for u in users}

        for r in referrals:
            u = user_map.get(str(r.referred_id))
            if not u:
                continue
            status = r.status or 'signed_up'
            referred_users.append({
                'name': u.full_name,
                'status': status,
                'joined': u.created_at.date().isoformat() if u.created_at else None,
            })

    total_referrals = len(referrals)
    active_referrals = sum(1 for r in referrals if r.status in ('active', 'subscribed'))
    subscribed_referrals = sum(1 for r in referrals if r.status == 'subscribed')
    points_earned = sum(int(r.points_awarded or 0) for r in referrals)

    referral_link = f"https://beacon.ng/?ref={code}"

    return success_response({
        'referral_code': code,
        'referral_link': referral_link,
        'referral_url': referral_link,
        'total_referrals': total_referrals,
        'active_referrals': active_referrals,
        'subscribed_referrals': subscribed_referrals,
        'successful_referrals': subscribed_referrals,
        'points_earned': points_earned,
        'referred_users': referred_users,
    })


@users_bp.route('/me/referral/apply', methods=['POST'])
@jwt_required()
def apply_referral():
    """Apply a referral code after signup."""
    user = get_current_user()
    if not user:
        return error_response('User not found', 404)

    data = request.get_json() or {}
    code = (data.get('code') or data.get('referral_code') or '').strip().upper()
    if not code:
        return error_response('code is required', 422)

    if user.referral_code and code == user.referral_code:
        return error_response('You cannot apply your own referral code', 400)

    existing = Referral.query.filter_by(referred_id=user.id).first()
    if existing:
        return error_response('Referral already applied', 409)

    referrer = User.query.filter_by(referral_code=code).first()
    if not referrer:
        return error_response('Invalid referral code', 404)

    status = 'active' if user.onboarding_completed or user.diagnostic_completed else 'signed_up'
    referral = Referral(
        referrer_id=referrer.id,
        referred_id=user.id,
        referral_code=code,
        status=status,
        points_awarded=0,
    )
    db.session.add(referral)

    award_points(
        referrer.id,
        REFERRAL_SIGNUP_POINTS,
        'referral_signup',
        f'{user.full_name} signed up with your code'
    )
    referral.points_awarded = (referral.points_awarded or 0) + REFERRAL_SIGNUP_POINTS

    # If the user already has an active subscription, upgrade referral immediately
    if user.subscription_status == 'active' and referral.status != 'subscribed':
        referral.status = 'subscribed'
        award_points(
            referrer.id,
            REFERRAL_SUBSCRIPTION_POINTS,
            'referral_subscription',
            f'{user.full_name} subscribed'
        )
        referral.points_awarded = (referral.points_awarded or 0) + REFERRAL_SUBSCRIPTION_POINTS

    db.session.commit()

    return success_response({
        'referral_code': code,
        'status': referral.status,
        'points_awarded': referral.points_awarded,
    }, message='Referral applied')
