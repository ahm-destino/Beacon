from flask import Blueprint, request
from flask_jwt_extended import jwt_required
from ..extensions import db
from ..models import User, Question, Subscription, Notification, CommunityQuestion, CommunityAnswer, Badge, Tutor
from ..utils.decorators import require_admin
from ..utils.helpers import success_response, error_response, paginate_query
from datetime import datetime

admin_bp = Blueprint('admin', __name__)


@admin_bp.route('/dashboard', methods=['GET'])
@require_admin
def dashboard():
    total_users = User.query.count()
    active_today_cutoff = datetime(datetime.utcnow().year, datetime.utcnow().month,
                                   datetime.utcnow().day)
    active_today = User.query.filter(User.last_seen >= active_today_cutoff).count()
    paid_users = User.query.filter(User.subscription_tier != 'seeker').count()
    total_questions = Question.query.filter_by(is_active=True).count()
    ai_questions = Question.query.filter_by(source='AI_GENERATED', is_active=True).count()
    enriched_questions = Question.query.filter_by(hf_enriched=True).count()
    pending_approval = Question.query.filter_by(is_approved=False, is_active=True).count()

    active_subs = Subscription.query.filter_by(status='active')
    beacon_count = active_subs.filter_by(tier='beacon').count()
    luminary_count = active_subs.filter_by(tier='luminary').count()
    north_star_count = active_subs.filter_by(tier='north_star').count()

    return success_response({
        'users': {
            'total': total_users,
            'active_today': active_today,
            'paid': paid_users,
        },
        'subscriptions': {
            'beacon_plan': beacon_count,
            'luminary_plan': luminary_count,
            'north_star_plan': north_star_count,
        },
        'questions': {
            'total_in_bank': total_questions,
            'ai_generated': ai_questions,
            'hf_enriched': enriched_questions,
            'pending_approval': pending_approval,
        },
    })


@admin_bp.route('/users', methods=['GET'])
@require_admin
def list_users():
    page = request.args.get('page', 1, type=int)
    search = request.args.get('search', '')
    tier = request.args.get('tier')
    status = request.args.get('status')

    q = User.query
    if search:
        q = q.filter((User.full_name.ilike(f'%{search}%')) |
                     (User.email.ilike(f'%{search}%')))
    if tier:    q = q.filter_by(subscription_tier=tier)
    if status == 'banned': q = q.filter_by(is_banned=True)
    elif status == 'active': q = q.filter_by(is_active=True, is_banned=False)

    return success_response(paginate_query(q.order_by(User.created_at.desc()), page=page))


@admin_bp.route('/users/<user_id>', methods=['GET'])
@require_admin
def get_user(user_id):
    user = User.query.get_or_404(user_id)
    return success_response(user.to_dict())


@admin_bp.route('/users/<user_id>', methods=['PUT'])
@require_admin
def update_user(user_id):
    user = User.query.get_or_404(user_id)
    data = request.get_json()
    for field, value in data.items():
        if hasattr(user, field) and field not in ['id', 'password_hash']:
            setattr(user, field, value)
    db.session.commit()
    return success_response(user.to_dict())


@admin_bp.route('/users/<user_id>/ban', methods=['POST'])
@require_admin
def ban_user(user_id):
    user = User.query.get_or_404(user_id)
    user.is_banned = True
    db.session.commit()
    return success_response(message='User banned')


@admin_bp.route('/users/<user_id>/unban', methods=['POST'])
@require_admin
def unban_user(user_id):
    user = User.query.get_or_404(user_id)
    user.is_banned = False
    db.session.commit()
    return success_response(message='User unbanned')


@admin_bp.route('/users/<user_id>/subscription', methods=['PUT'])
@require_admin
def change_subscription(user_id):
    user = User.query.get_or_404(user_id)
    data = request.get_json()
    user.subscription_tier = data.get('tier', user.subscription_tier)
    user.subscription_status = data.get('status', 'active')
    db.session.commit()
    return success_response(user.to_dict(), message='Subscription updated')


@admin_bp.route('/users/<user_id>/points', methods=['POST'])
@require_admin
def adjust_points(user_id):
    user = User.query.get_or_404(user_id)
    data = request.get_json()
    amount = int(data.get('amount', 0))
    user.points_balance = (user.points_balance or 0) + amount
    db.session.commit()
    return success_response({'new_balance': user.points_balance})


@admin_bp.route('/questions', methods=['GET'])
@require_admin
def list_questions():
    page = request.args.get('page', 1, type=int)
    source = request.args.get('source')
    subject = request.args.get('subject')
    is_approved = request.args.get('is_approved')

    q = Question.query
    if source:      q = q.filter_by(source=source)
    if subject:     q = q.filter_by(subject=subject)
    if is_approved is not None:
        q = q.filter_by(is_approved=is_approved.lower() == 'true')

    return success_response(paginate_query(q, page=page))


@admin_bp.route('/questions/<qid>/approve', methods=['POST'])
@require_admin
def approve_question(qid):
    q = Question.query.get_or_404(qid)
    q.is_approved = True
    db.session.commit()
    return success_response(message='Question approved')


@admin_bp.route('/questions/<qid>/reject', methods=['POST'])
@require_admin
def reject_question(qid):
    q = Question.query.get_or_404(qid)
    q.is_active = False
    q.is_approved = False
    db.session.commit()
    return success_response(message='Question rejected and removed')


@admin_bp.route('/questions/<qid>', methods=['PUT'])
@require_admin
def update_question(qid):
    q = Question.query.get_or_404(qid)
    data = request.get_json()
    editable = ['question_text', 'option_a', 'option_b', 'option_c', 'option_d',
                'correct_answer', 'explanation', 'difficulty']
    for field in editable:
        if field in data:
            setattr(q, field, data[field])
    db.session.commit()
    return success_response(q.to_dict(include_answer=True))


@admin_bp.route('/notifications/broadcast', methods=['POST'])
@require_admin
def broadcast():
    data = request.get_json()
    title = data.get('title')
    body = data.get('body')
    tier_filter = data.get('tier')

    q = User.query.filter_by(is_active=True)
    if tier_filter:
        q = q.filter_by(subscription_tier=tier_filter)

    users = q.all()
    notifications = [
        Notification(user_id=u.id, type='broadcast', title=title, body=body)
        for u in users
    ]
    db.session.bulk_save_objects(notifications)
    db.session.commit()

    return success_response(message=f'Notification sent to {len(users)} users')


@admin_bp.route('/tutors/<tutor_id>/approve', methods=['POST'])
@require_admin
def approve_tutor(tutor_id):
    tutor = Tutor.query.get_or_404(tutor_id)
    tutor.is_approved = True
    if not tutor.verification_level or tutor.verification_level == 'basic':
        tutor.verification_level = 'verified'
    db.session.commit()
    return success_response(tutor.to_dict(full=True), message='Tutor approved')


@admin_bp.route('/system/health', methods=['GET'])
@require_admin
def system_health():
    from ..extensions import redis_client
    try:
        redis_client.ping()
        redis_ok = True
    except Exception:
        redis_ok = False
    try:
        db.session.execute(db.text('SELECT 1'))
        db_ok = True
    except Exception:
        db_ok = False
    return success_response({
        'status': 'healthy' if (redis_ok and db_ok) else 'degraded',
        'database': 'ok' if db_ok else 'error',
        'redis': 'ok' if redis_ok else 'error',
    })
