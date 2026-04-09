from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..extensions import db
from ..models import (
    User, Question, Subscription, Notification, CommunityQuestion, CommunityAnswer, Badge, Tutor,
    PracticeSession, SessionAnswer, StudyEvent, Message, Document,
    QuestionReport, QuestionOptionExplanation, QuestionAnswerVerification, AdminAuditLog
)
from ..utils.decorators import require_admin
from ..utils.helpers import success_response, error_response, paginate_query
from datetime import datetime, timedelta, date
from sqlalchemy import func

admin_bp = Blueprint('admin', __name__)


def _get_request_ip():
    forwarded = request.headers.get('X-Forwarded-For')
    if forwarded:
        return forwarded.split(',')[0].strip()
    return request.remote_addr


def log_admin_action(action, target_type=None, target_id=None, metadata=None):
    try:
        admin_id = get_jwt_identity()
        log = AdminAuditLog(
            admin_id=admin_id,
            action=action,
            target_type=target_type,
            target_id=target_id,
            event_metadata=metadata or {},
            ip_address=_get_request_ip(),
            user_agent=request.headers.get('User-Agent'),
        )
        db.session.add(log)
        db.session.commit()
    except Exception:
        db.session.rollback()


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
    log_admin_action('user_update', 'user', user.id, {'fields': list(data.keys())})
    return success_response(user.to_dict())


@admin_bp.route('/users/<user_id>/ban', methods=['POST'])
@require_admin
def ban_user(user_id):
    user = User.query.get_or_404(user_id)
    user.is_banned = True
    db.session.commit()
    log_admin_action('user_ban', 'user', user.id)
    return success_response(message='User banned')


@admin_bp.route('/users/<user_id>/unban', methods=['POST'])
@require_admin
def unban_user(user_id):
    user = User.query.get_or_404(user_id)
    user.is_banned = False
    db.session.commit()
    log_admin_action('user_unban', 'user', user.id)
    return success_response(message='User unbanned')


@admin_bp.route('/users/<user_id>/subscription', methods=['PUT'])
@require_admin
def change_subscription(user_id):
    user = User.query.get_or_404(user_id)
    data = request.get_json()
    tier = data.get('tier', user.subscription_tier)
    status = data.get('status', 'active')
    billing_cycle = data.get('billing_cycle', 'monthly')
    duration_days = int(data.get('duration_days') or 0)

    user.subscription_tier = tier
    user.subscription_status = status

    if duration_days > 0:
        user.subscription_end = datetime.utcnow() + timedelta(days=duration_days)
    elif billing_cycle == 'annual':
        user.subscription_end = datetime.utcnow() + timedelta(days=365)
    elif billing_cycle == 'monthly':
        user.subscription_end = datetime.utcnow() + timedelta(days=30)

    if status == 'active':
        sub = Subscription(
            user_id=user.id,
            tier=tier,
            billing_cycle=billing_cycle,
            amount=int(data.get('amount') or 0),
            currency=data.get('currency') or 'NGN',
            status='active',
            current_period_start=datetime.utcnow(),
            current_period_end=user.subscription_end,
        )
        db.session.add(sub)

    db.session.commit()
    log_admin_action('subscription_update', 'user', user.id, {
        'tier': tier,
        'status': status,
        'billing_cycle': billing_cycle,
        'duration_days': duration_days,
        'amount': data.get('amount'),
        'currency': data.get('currency'),
    })
    return success_response(user.to_dict(), message='Subscription updated')


@admin_bp.route('/users/<user_id>/points', methods=['POST'])
@require_admin
def adjust_points(user_id):
    user = User.query.get_or_404(user_id)
    data = request.get_json()
    amount = int(data.get('amount', 0))
    user.points_balance = (user.points_balance or 0) + amount
    db.session.commit()
    log_admin_action('points_adjust', 'user', user.id, {'amount': amount})
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

    paginated = q.order_by(Question.created_at.desc()).paginate(
        page=page, per_page=20, error_out=False
    )
    return success_response({
        'items': [item.to_dict(include_answer=True) for item in paginated.items],
        'total': paginated.total,
        'pages': paginated.pages,
        'current_page': page,
        'per_page': paginated.per_page,
        'has_next': paginated.has_next,
        'has_prev': paginated.has_prev,
    })


@admin_bp.route('/questions/<qid>/approve', methods=['POST'])
@require_admin
def approve_question(qid):
    q = Question.query.get_or_404(qid)
    q.is_approved = True
    db.session.commit()
    log_admin_action('question_approve', 'question', q.id)
    return success_response(message='Question approved')


@admin_bp.route('/questions/<qid>/reject', methods=['POST'])
@require_admin
def reject_question(qid):
    q = Question.query.get_or_404(qid)
    q.is_active = False
    q.is_approved = False
    db.session.commit()
    log_admin_action('question_reject', 'question', q.id)
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
    log_admin_action('question_update', 'question', q.id, {'fields': list(data.keys())})
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
    log_admin_action('broadcast_notification', 'notification', None, {
        'title': title,
        'tier_filter': tier_filter,
        'count': len(users),
    })
    return success_response(message=f'Notification sent to {len(users)} users')


@admin_bp.route('/tutors/<tutor_id>/approve', methods=['POST'])
@require_admin
def approve_tutor(tutor_id):
    tutor = Tutor.query.get_or_404(tutor_id)
    tutor.is_approved = True
    if not tutor.verification_level or tutor.verification_level == 'basic':
        tutor.verification_level = 'verified'
    db.session.commit()
    log_admin_action('tutor_approve', 'tutor', tutor.id)
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


ANSWER_ACTIONS = [
    'answer_correct', 'answer_wrong',
    'challenge_answer_correct', 'challenge_answer_wrong',
    'diagnostic_answer_correct', 'diagnostic_answer_wrong',
]


@admin_bp.route('/users/<user_id>/stats', methods=['GET'])
@require_admin
def get_user_stats(user_id):
    user = User.query.get_or_404(user_id)

    correct_case = db.case(
        (StudyEvent.is_correct == True, 1),
        (StudyEvent.action_type.in_(ANSWER_ACTIONS), 1),
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

    return success_response({
        'user_id': str(user.id),
        'total_questions_answered': total,
        'total_correct': correct,
        'overall_accuracy': accuracy,
        'sessions_completed': completed_sessions,
        'points_balance': user.points_balance or 0,
        'subscription_tier': user.subscription_tier,
        'subscription_status': user.subscription_status,
        'subscription_end': user.subscription_end.isoformat() if user.subscription_end else None,
        'last_seen': user.last_seen.isoformat() if user.last_seen else None,
    })


@admin_bp.route('/users/<user_id>/sessions', methods=['GET'])
@require_admin
def get_user_sessions(user_id):
    page = request.args.get('page', 1, type=int)
    q = PracticeSession.query.filter_by(user_id=user_id).order_by(
        PracticeSession.started_at.desc()
    )
    return success_response(paginate_query(q, page=page))


@admin_bp.route('/reports', methods=['GET'])
@require_admin
def list_reports():
    page = request.args.get('page', 1, type=int)
    status = (request.args.get('status') or 'pending').lower()

    q = QuestionReport.query
    if status == 'pending':
        q = q.filter_by(is_resolved=False)
    elif status == 'resolved':
        q = q.filter_by(is_resolved=True)

    paginated = q.order_by(QuestionReport.created_at.desc()).paginate(
        page=page, per_page=20, error_out=False
    )

    question_ids = [r.question_id for r in paginated.items if r.question_id]
    user_ids = [r.user_id for r in paginated.items if r.user_id]
    questions = Question.query.filter(Question.id.in_(question_ids)).all() if question_ids else []
    users = User.query.filter(User.id.in_(user_ids)).all() if user_ids else []

    q_map = {str(q.id): q for q in questions}
    u_map = {str(u.id): u for u in users}

    items = []
    for r in paginated.items:
        item = r.to_dict()
        q_obj = q_map.get(str(r.question_id))
        if q_obj:
            item['question'] = {
                'id': str(q_obj.id),
                'subject': q_obj.subject,
                'exam_type': q_obj.exam_type,
                'question_text': q_obj.question_text,
                'correct_answer': q_obj.correct_answer,
                'image_url': q_obj.image_url,
            }
        u_obj = u_map.get(str(r.user_id))
        if u_obj:
            item['reporter'] = {
                'id': str(u_obj.id),
                'name': u_obj.full_name,
                'email': u_obj.email,
            }
        items.append(item)

    return success_response({
        'items': items,
        'total': paginated.total,
        'pages': paginated.pages,
        'current_page': page,
        'per_page': paginated.per_page,
        'has_next': paginated.has_next,
        'has_prev': paginated.has_prev,
    })


@admin_bp.route('/reports/<report_id>/resolve', methods=['POST'])
@require_admin
def resolve_report(report_id):
    report = QuestionReport.query.get_or_404(report_id)
    data = request.get_json() or {}
    report.is_resolved = True
    report.resolution_note = data.get('note')
    report.resolved_by = get_jwt_identity()
    report.resolved_at = datetime.utcnow()
    db.session.commit()
    log_admin_action('report_resolve', 'question_report', report.id, {
        'note': data.get('note'),
        'question_id': str(report.question_id) if report.question_id else None,
    })
    return success_response(report.to_dict(), message='Report resolved')


@admin_bp.route('/ai-corrections', methods=['GET'])
@require_admin
def list_ai_corrections():
    page = request.args.get('page', 1, type=int)
    status = (request.args.get('status') or 'pending').lower()

    q = QuestionAnswerVerification.query
    if status in ('pending', 'approved', 'rejected'):
        q = q.filter_by(review_status=status)

    paginated = q.order_by(QuestionAnswerVerification.created_at.desc()).paginate(
        page=page, per_page=20, error_out=False
    )

    question_ids = [v.question_id for v in paginated.items if v.question_id]
    questions = Question.query.filter(Question.id.in_(question_ids)).all() if question_ids else []
    q_map = {str(q.id): q for q in questions}

    items = []
    for v in paginated.items:
        item = v.to_dict()
        q_obj = q_map.get(str(v.question_id))
        if q_obj:
            item['question'] = {
                'id': str(q_obj.id),
                'subject': q_obj.subject,
                'exam_type': q_obj.exam_type,
                'question_text': q_obj.question_text,
                'option_a': q_obj.option_a,
                'option_b': q_obj.option_b,
                'option_c': q_obj.option_c,
                'option_d': q_obj.option_d,
                'db_correct_answer': q_obj.correct_answer,
            }
        items.append(item)

    return success_response({
        'items': items,
        'total': paginated.total,
        'pages': paginated.pages,
        'current_page': page,
        'per_page': paginated.per_page,
        'has_next': paginated.has_next,
        'has_prev': paginated.has_prev,
    })


@admin_bp.route('/ai-corrections/<verification_id>/approve', methods=['POST'])
@require_admin
def approve_ai_correction(verification_id):
    verification = QuestionAnswerVerification.query.get_or_404(verification_id)
    data = request.get_json() or {}
    note = data.get('note')
    question = Question.query.get(verification.question_id)

    if question:
        question.correct_answer = verification.ai_correct_answer
        if verification.explanation_text:
            question.explanation = verification.explanation_text

    verification.review_status = 'approved'
    verification.review_note = note
    verification.reviewed_by = get_jwt_identity()
    verification.reviewed_at = datetime.utcnow()
    db.session.commit()

    log_admin_action('ai_correction_approve', 'question_answer_verification', verification.id, {
        'question_id': str(verification.question_id),
        'ai_correct_answer': verification.ai_correct_answer,
    })

    return success_response(verification.to_dict(), message='AI correction approved')


@admin_bp.route('/ai-corrections/<verification_id>/reject', methods=['POST'])
@require_admin
def reject_ai_correction(verification_id):
    verification = QuestionAnswerVerification.query.get_or_404(verification_id)
    data = request.get_json() or {}
    note = data.get('note')
    verification.review_status = 'rejected'
    verification.review_note = note
    verification.reviewed_by = get_jwt_identity()
    verification.reviewed_at = datetime.utcnow()
    db.session.commit()

    log_admin_action('ai_correction_reject', 'question_answer_verification', verification.id, {
        'question_id': str(verification.question_id),
        'ai_correct_answer': verification.ai_correct_answer,
    })

    return success_response(verification.to_dict(), message='AI correction rejected')


@admin_bp.route('/audit', methods=['GET'])
@require_admin
def list_audit_logs():
    page = request.args.get('page', 1, type=int)
    q = AdminAuditLog.query.order_by(AdminAuditLog.created_at.desc())
    return success_response(paginate_query(q, page=page))


@admin_bp.route('/analytics/summary', methods=['GET'])
@require_admin
def analytics_summary():
    now = datetime.utcnow()
    week_ago = now - timedelta(days=7)
    month_ago = now - timedelta(days=30)

    total_users = User.query.count()
    new_users_7d = User.query.filter(User.created_at >= week_ago).count()
    active_7d = User.query.filter(User.last_seen >= week_ago).count()
    active_30d = User.query.filter(User.last_seen >= month_ago).count()

    total_questions = Question.query.filter_by(is_active=True).count()
    pending_reports = QuestionReport.query.filter_by(is_resolved=False).count()
    pending_ai = QuestionAnswerVerification.query.filter_by(review_status='pending').count()

    sessions_7d = PracticeSession.query.filter(PracticeSession.started_at >= week_ago).count()
    answers_7d = StudyEvent.query.filter(
        StudyEvent.created_at >= week_ago,
        StudyEvent.action_type.in_(ANSWER_ACTIONS)
    ).count()

    ai_messages_7d = Message.query.filter(
        Message.created_at >= week_ago,
        Message.role == 'assistant'
    ).count()

    documents_7d = Document.query.filter(Document.created_at >= week_ago).count()

    return success_response({
        'users': {
            'total': total_users,
            'new_7d': new_users_7d,
            'active_7d': active_7d,
            'active_30d': active_30d,
        },
        'questions': {
            'total': total_questions,
            'pending_reports': pending_reports,
            'pending_ai_reviews': pending_ai,
        },
        'usage': {
            'sessions_7d': sessions_7d,
            'answers_7d': answers_7d,
            'ai_messages_7d': ai_messages_7d,
            'documents_7d': documents_7d,
        }
    })


@admin_bp.route('/analytics/engagement', methods=['GET'])
@require_admin
def analytics_engagement():
    days = request.args.get('days', 30, type=int)
    days = max(7, min(days, 120))
    start_date = date.today() - timedelta(days=days - 1)
    start_dt = datetime.combine(start_date, datetime.min.time())

    events = StudyEvent.query.filter(
        StudyEvent.created_at >= start_dt,
        StudyEvent.action_type.in_(ANSWER_ACTIONS)
    ).all()

    activity = {}
    for i in range(days):
        d = start_date + timedelta(days=i)
        activity[d] = {
            'questions_answered': 0,
            'active_users': set(),
            'seconds_studied': 0,
        }

    for e in events:
        if not e.created_at:
            continue
        d = e.created_at.date()
        if d not in activity:
            continue
        activity[d]['questions_answered'] += 1
        activity[d]['active_users'].add(str(e.user_id))
        if e.time_spent:
            try:
                activity[d]['seconds_studied'] += max(0, int(e.time_spent))
            except Exception:
                pass

    series = []
    for i in range(days):
        d = start_date + timedelta(days=i)
        seconds = activity[d]['seconds_studied']
        series.append({
            'date': d.isoformat(),
            'questions_answered': activity[d]['questions_answered'],
            'active_users': len(activity[d]['active_users']),
            'minutes_studied': int(round(seconds / 60)) if seconds else 0,
        })

    return success_response({'daily': series})


@admin_bp.route('/analytics/subjects', methods=['GET'])
@require_admin
def analytics_subjects():
    correct_case = db.case(
        (StudyEvent.is_correct == True, 1),
        (StudyEvent.action_type.in_(ANSWER_ACTIONS), 1),
        else_=0
    )
    results = db.session.query(
        StudyEvent.subject,
        func.count(StudyEvent.id).label('total'),
        func.sum(correct_case).label('correct')
    ).filter(
        StudyEvent.action_type.in_(ANSWER_ACTIONS),
        StudyEvent.subject.isnot(None)
    ).group_by(StudyEvent.subject).order_by(func.count(StudyEvent.id).desc()).all()

    data = []
    for row in results:
        total = int(row.total or 0)
        correct = int(row.correct or 0)
        data.append({
            'subject': row.subject,
            'total': total,
            'correct': correct,
            'accuracy': round(correct / total * 100, 1) if total > 0 else 0,
        })
    return success_response(data)


@admin_bp.route('/analytics/ai-usage', methods=['GET'])
@require_admin
def analytics_ai_usage():
    ai_messages = Message.query.filter(Message.role == 'assistant').count()
    option_explanations = QuestionOptionExplanation.query.count()
    answer_verifications = QuestionAnswerVerification.query.count()
    pending_reviews = QuestionAnswerVerification.query.filter_by(review_status='pending').count()

    model_breakdown = db.session.query(
        QuestionAnswerVerification.model_name,
        func.count(QuestionAnswerVerification.id)
    ).group_by(QuestionAnswerVerification.model_name).all()
    model_usage = [
        {'model': m or 'unknown', 'count': int(c or 0)}
        for m, c in model_breakdown
    ]

    return success_response({
        'ai_messages': ai_messages,
        'option_explanations': option_explanations,
        'answer_verifications': answer_verifications,
        'pending_reviews': pending_reviews,
        'verification_models': model_usage,
    })


@admin_bp.route('/analytics/subscriptions', methods=['GET'])
@require_admin
def analytics_subscriptions():
    active_subs = Subscription.query.filter_by(status='active')
    by_tier = db.session.query(
        Subscription.tier,
        func.count(Subscription.id)
    ).filter(
        Subscription.status == 'active'
    ).group_by(Subscription.tier).all()

    totals = {
        'active': active_subs.count(),
        'cancelled': Subscription.query.filter_by(status='cancelled').count(),
        'expired': Subscription.query.filter_by(status='expired').count(),
        'past_due': Subscription.query.filter_by(status='past_due').count(),
    }

    return success_response({
        'totals': totals,
        'by_tier': [{'tier': t or 'unknown', 'count': int(c or 0)} for t, c in by_tier],
    })
