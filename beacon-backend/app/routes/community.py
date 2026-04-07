from datetime import datetime
from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func, case
from ..extensions import db, redis_client
from ..models import (
    CommunityQuestion,
    CommunityAnswer,
    StudyBuddy,
    StudyBuddyMessage,
    Challenge,
    ChallengeAnswer,
    Question,
    User,
    Streak,
    SessionAnswer,
    UserBadge,
    Notification,
    Tutor,
    TutorReview,
)
from ..utils.helpers import success_response, error_response, paginate_query
from ..services.performance_service import record_study_event, award_points

community_bp = Blueprint('community', __name__)

def get_uid(): return get_jwt_identity()


def _public_user_summary(user, accuracy=0.0, streak=0):
    if not user:
        return None
    return {
        'id': str(user.id),
        'full_name': user.full_name,
        'profile_photo_url': user.profile_photo_url,
        'bio': user.bio,
        'school_name': user.school_name,
        'state': user.state,
        'primary_exam': user.primary_exam,
        'subjects': user.subjects or [],
        'accuracy': round(float(accuracy or 0), 1),
        'streak': int(streak or 0),
        'last_seen': user.last_seen.isoformat() if user.last_seen else None,
    }


def _accuracy_map(user_ids):
    if not user_ids:
        return {}
    rows = db.session.query(
        SessionAnswer.user_id.label('user_id'),
        func.count(SessionAnswer.id).label('total'),
        func.sum(case((SessionAnswer.is_correct == True, 1), else_=0)).label('correct'),
    ).filter(
        SessionAnswer.user_id.in_(user_ids)
    ).group_by(SessionAnswer.user_id).all()
    out = {}
    for row in rows:
        total = row.total or 0
        correct = row.correct or 0
        out[str(row.user_id)] = round((correct / total) * 100, 1) if total > 0 else 0.0
    return out


def _get_user_accuracy(user_id):
    accs = _accuracy_map([user_id])
    return accs.get(str(user_id), 0.0)


def _has_active_buddy(user_id):
    return StudyBuddy.query.filter(
        db.or_(StudyBuddy.user_id == user_id, StudyBuddy.buddy_id == user_id),
        StudyBuddy.status == 'active'
    ).first() is not None


def _get_active_buddy_relation(user_id):
    return StudyBuddy.query.filter(
        db.or_(StudyBuddy.user_id == user_id, StudyBuddy.buddy_id == user_id),
        StudyBuddy.status == 'active'
    ).first()


def _are_buddies(user_id, other_id):
    if not user_id or not other_id:
        return False
    return StudyBuddy.query.filter(
        StudyBuddy.status == 'active',
        db.or_(
            db.and_(StudyBuddy.user_id == user_id, StudyBuddy.buddy_id == other_id),
            db.and_(StudyBuddy.user_id == other_id, StudyBuddy.buddy_id == user_id),
        )
    ).first() is not None

def _lookup_practice_question_id(community_question):
    if not community_question:
        return None

    def base_query():
        q = Question.query.filter(
            Question.is_active == True,
            Question.is_approved == True,
        )
        if community_question.subject:
            q = q.filter(Question.subject == community_question.subject)
        if community_question.exam_type:
            q = q.filter(Question.exam_type == community_question.exam_type)
        return q

    candidates = []
    if community_question.title:
        candidates.append(community_question.title.strip())
    if community_question.body:
        candidates.append(community_question.body.strip())

    for text in candidates:
        if not text:
            continue
        match = base_query().filter(Question.question_text == text).first()
        if match:
            return str(match.id)

    if candidates:
        snippet = candidates[0][:120]
        if snippet:
            match = base_query().filter(Question.question_text.ilike(f'%{snippet}%')).first()
            if match:
                return str(match.id)

    return None


@community_bp.route('/tutors', methods=['GET'])
@jwt_required()
def list_tutors():
    subject = (request.args.get('subject') or '').strip()
    state = (request.args.get('state') or '').strip()
    mode = (request.args.get('mode') or '').strip()
    min_rating = request.args.get('min_rating', type=float)
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)

    q = Tutor.query.filter_by(is_active=True, is_approved=True)

    if subject and subject.lower() != 'all':
        q = q.filter(Tutor.subjects.any(subject))
    if state:
        q = q.filter(Tutor.state.ilike(f'%{state}%'))
    if mode:
        q = q.filter(Tutor.mode.any(mode))
    if min_rating is not None:
        q = q.filter(Tutor.average_rating >= min_rating)

    q = q.order_by(Tutor.average_rating.desc(), Tutor.total_reviews.desc(), Tutor.created_at.desc())

    pagination = q.paginate(page=page, per_page=per_page, error_out=False)
    return success_response({
        'tutors': [t.to_dict() for t in pagination.items],
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': page,
        'per_page': per_page,
        'has_next': pagination.has_next,
        'has_prev': pagination.has_prev,
    })


@community_bp.route('/tutors/<tutor_id>', methods=['GET'])
@jwt_required()
def get_tutor(tutor_id):
    tutor = Tutor.query.filter_by(id=tutor_id, is_active=True).first_or_404()
    if not tutor.is_approved:
        return error_response('Tutor not found', 404)

    reviews = TutorReview.query.filter_by(tutor_id=tutor.id).order_by(
        TutorReview.created_at.desc()
    ).all()

    return success_response({
        'tutor': tutor.to_dict(full=True),
        'reviews': [r.to_dict() for r in reviews],
    })


@community_bp.route('/tutors/<tutor_id>/rate', methods=['POST'])
@jwt_required()
def rate_tutor(tutor_id):
    uid = get_uid()
    tutor = Tutor.query.filter_by(id=tutor_id, is_active=True).first_or_404()
    if not tutor.is_approved:
        return error_response('Tutor not found', 404)

    data = request.get_json() or {}
    try:
        rating = int(data.get('rating'))
    except Exception:
        rating = None
    comment = (data.get('comment') or '').strip()

    if rating is None or rating < 1 or rating > 5:
        return error_response('Rating must be 1-5', 422)

    existing = TutorReview.query.filter_by(tutor_id=tutor.id, user_id=uid).first()
    if existing:
        existing.rating = rating
        existing.comment = comment
    else:
        review = TutorReview(
            tutor_id=tutor.id,
            user_id=uid,
            rating=rating,
            comment=comment,
        )
        db.session.add(review)

    db.session.commit()

    avg = db.session.query(func.avg(TutorReview.rating)).filter_by(tutor_id=tutor.id).scalar() or 0
    total = db.session.query(func.count(TutorReview.id)).filter_by(tutor_id=tutor.id).scalar() or 0
    tutor.average_rating = round(float(avg), 2)
    tutor.total_reviews = int(total)
    db.session.commit()

    review_out = existing if existing else TutorReview.query.filter_by(
        tutor_id=tutor.id, user_id=uid
    ).first()

    return success_response({
        'tutor_id': str(tutor.id),
        'average_rating': tutor.average_rating,
        'total_reviews': tutor.total_reviews,
        'review': review_out.to_dict() if review_out else None,
    }, message='Rating saved')


@community_bp.route('/questions', methods=['GET'])
@jwt_required()
def get_questions():
    subject = request.args.get('subject')
    status = request.args.get('status')
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    q = CommunityQuestion.query.filter_by(is_removed=False)
    if subject: q = q.filter_by(subject=subject)
    if status == 'unanswered': q = q.filter_by(answer_count=0)
    elif status == 'resolved': q = q.filter_by(is_resolved=True)
    q = q.order_by(CommunityQuestion.created_at.desc())
    pagination = q.paginate(page=page, per_page=per_page, error_out=False)
    items = []
    for item in pagination.items:
        data = item.to_dict()
        data['practice_question_id'] = _lookup_practice_question_id(item)
        items.append(data)
    return success_response({
        'items': items,
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': page,
        'per_page': per_page,
        'has_next': pagination.has_next,
        'has_prev': pagination.has_prev,
    })


@community_bp.route('/questions', methods=['POST'])
@jwt_required()
def post_question():
    uid = get_uid()
    data = request.get_json()
    q = CommunityQuestion(
        user_id=uid,
        subject=data.get('subject'),
        topic=data.get('topic'),
        exam_type=data.get('exam_type'),
        title=data.get('title'),
        body=data.get('body'),
        image_url=data.get('image_url'),
    )
    db.session.add(q)
    db.session.commit()
    return success_response(q.to_dict(), status_code=201)


@community_bp.route('/questions/<qid>', methods=['GET'])
@jwt_required()
def get_question(qid):
    q = CommunityQuestion.query.filter_by(id=qid, is_removed=False).first_or_404()
    q.views += 1
    db.session.commit()
    data = q.to_dict()
    data['practice_question_id'] = _lookup_practice_question_id(q)
    data['answers'] = [a.to_dict() for a in q.answers if not a.is_removed]
    return success_response(data)


@community_bp.route('/questions/<qid>/answers', methods=['POST'])
@jwt_required()
def post_answer(qid):
    uid = get_uid()
    q = CommunityQuestion.query.filter_by(id=qid, is_removed=False).first_or_404()
    data = request.get_json()
    ans = CommunityAnswer(question_id=q.id, user_id=uid, body=data.get('body'))
    q.answer_count += 1
    db.session.add(ans)
    db.session.commit()
    return success_response(ans.to_dict(), status_code=201)


@community_bp.route('/answers/<aid>/upvote', methods=['PUT'])
@jwt_required()
def upvote_answer(aid):
    ans = CommunityAnswer.query.get_or_404(aid)
    ans.upvotes += 1
    db.session.commit()
    return success_response({'upvotes': ans.upvotes})


@community_bp.route('/answers/<aid>/best', methods=['PUT'])
@jwt_required()
def mark_best(aid):
    uid = get_uid()
    ans = CommunityAnswer.query.get_or_404(aid)
    q = CommunityQuestion.query.get(ans.question_id)
    if str(q.user_id) != uid:
        return error_response('Only the question author can mark best answer', 403)
    CommunityAnswer.query.filter_by(question_id=q.id).update({'is_best_answer': False})
    ans.is_best_answer = True
    q.best_answer_id = ans.id
    q.is_resolved = True
    db.session.commit()
    return success_response(message='Best answer marked')


@community_bp.route('/buddies', methods=['GET'])
@jwt_required()
def get_buddy():
    uid = get_uid()

    buddy_rel = StudyBuddy.query.filter(
        db.or_(
            StudyBuddy.user_id == uid,
            StudyBuddy.buddy_id == uid
        ),
        StudyBuddy.status == 'active'
    ).first()

    if buddy_rel:
        other_id = buddy_rel.buddy_id if str(buddy_rel.user_id) == uid else buddy_rel.user_id
        other_user = User.query.get(other_id)
        other_streak = Streak.query.filter_by(user_id=other_id).first()
        other_accuracy = _get_user_accuracy(other_id)

        return success_response({
            'has_buddy': True,
            'buddy': _public_user_summary(
                other_user,
                accuracy=other_accuracy,
                streak=(other_streak.current_streak if other_streak else 0),
            ),
            'relationship_id': str(buddy_rel.id),
        })

    pending = StudyBuddy.query.filter_by(
        buddy_id=uid,
        status='pending'
    ).order_by(StudyBuddy.created_at.desc()).all()

    pending_ids = [r.user_id for r in pending]
    accuracies = _accuracy_map(pending_ids)
    streaks = {
        str(s.user_id): s.current_streak
        for s in Streak.query.filter(Streak.user_id.in_(pending_ids)).all()
    } if pending_ids else {}

    return success_response({
        'has_buddy': False,
        'pending_requests': [
            {
                'id': str(r.id),
                'from_user': _public_user_summary(
                    r.user,
                    accuracy=accuracies.get(str(r.user_id), 0.0),
                    streak=streaks.get(str(r.user_id), 0),
                ),
            }
            for r in pending
        ],
    })


@community_bp.route('/buddies/requests', methods=['GET'])
@jwt_required()
def get_buddy_requests():
    uid = get_uid()
    pending = StudyBuddy.query.filter_by(
        buddy_id=uid,
        status='pending'
    ).order_by(StudyBuddy.created_at.desc()).all()

    pending_ids = [r.user_id for r in pending]
    accuracies = _accuracy_map(pending_ids)
    streaks = {
        str(s.user_id): s.current_streak
        for s in Streak.query.filter(Streak.user_id.in_(pending_ids)).all()
    } if pending_ids else {}

    return success_response({
        'requests': [
            {
                'id': str(r.id),
                'from_user': _public_user_summary(
                    r.user,
                    accuracy=accuracies.get(str(r.user_id), 0.0),
                    streak=streaks.get(str(r.user_id), 0),
                ),
            }
            for r in pending
        ],
    })


@community_bp.route('/buddies/request', methods=['POST'])
@jwt_required()
def send_buddy_request():
    uid = get_uid()
    data = request.get_json() or {}
    buddy_id = data.get('user_id') or data.get('buddy_id')

    if not buddy_id:
        return error_response('user_id is required', 422)
    if str(uid) == str(buddy_id):
        return error_response('You cannot add yourself as a buddy', 400)

    buddy_user = User.query.get(buddy_id)
    if not buddy_user or not buddy_user.is_active:
        return error_response('User not found', 404)

    if _has_active_buddy(uid):
        return error_response('You already have an active buddy', 409)
    if _has_active_buddy(buddy_id):
        return error_response('User already has an active buddy', 409)

    existing_same = StudyBuddy.query.filter_by(user_id=uid, buddy_id=buddy_id).first()
    existing_any = StudyBuddy.query.filter(
        db.or_(
            db.and_(StudyBuddy.user_id == uid, StudyBuddy.buddy_id == buddy_id),
            db.and_(StudyBuddy.user_id == buddy_id, StudyBuddy.buddy_id == uid),
        )
    ).first()

    if existing_any and existing_any.status != 'ended':
        return error_response('Request already exists', 409)

    if existing_same and existing_same.status == 'ended':
        existing_same.status = 'pending'
        existing_same.created_at = datetime.utcnow()
        req = existing_same
    elif existing_any and existing_any.status == 'ended':
        req = StudyBuddy(user_id=uid, buddy_id=buddy_id, status='pending')
        db.session.add(req)
    else:
        req = StudyBuddy(user_id=uid, buddy_id=buddy_id, status='pending')
        db.session.add(req)

    requester = User.query.get(uid)
    notif = Notification(
        user_id=buddy_id,
        type='buddy_request',
        title='New study buddy request',
        body=f'{requester.full_name} wants to study with you.',
        data={'request_id': str(req.id), 'from_user_id': str(uid)},
        sent_via=['in_app'],
    )
    db.session.add(notif)
    db.session.commit()

    return success_response({
        'request_id': str(req.id),
        'status': req.status,
    }, message='Buddy request sent', status_code=201)


@community_bp.route('/buddies/<buddy_id>/accept', methods=['PUT'])
@jwt_required()
def accept_buddy(buddy_id):
    uid = get_uid()
    req = StudyBuddy.query.filter_by(
        id=buddy_id,
        buddy_id=uid,
        status='pending'
    ).first_or_404()

    if _has_active_buddy(uid):
        return error_response('You already have an active buddy', 409)
    if _has_active_buddy(req.user_id):
        return error_response('User already has an active buddy', 409)

    req.status = 'active'

    accepter = User.query.get(uid)
    notif = Notification(
        user_id=req.user_id,
        type='buddy_accepted',
        title='Buddy request accepted',
        body=f'{accepter.full_name} accepted your buddy request.',
        data={'relationship_id': str(req.id), 'buddy_id': str(uid)},
        sent_via=['in_app'],
    )
    db.session.add(notif)
    db.session.commit()

    return success_response(message='Buddy request accepted')


@community_bp.route('/buddies/<buddy_id>', methods=['DELETE'])
@jwt_required()
def end_buddy(buddy_id):
    uid = get_uid()
    rel = StudyBuddy.query.filter(
        StudyBuddy.id == buddy_id,
        db.or_(StudyBuddy.user_id == uid, StudyBuddy.buddy_id == uid),
    ).first_or_404()

    rel.status = 'ended'

    other_id = rel.buddy_id if str(rel.user_id) == str(uid) else rel.user_id
    other_user = User.query.get(other_id)
    actor = User.query.get(uid)
    if other_user and actor:
        notif = Notification(
            user_id=other_user.id,
            type='buddy_ended',
            title='Buddy relationship ended',
            body=f'{actor.full_name} ended your study buddy connection.',
            data={'relationship_id': str(rel.id)},
            sent_via=['in_app'],
        )
        db.session.add(notif)

    db.session.commit()
    return success_response(message='Buddy relationship ended')


@community_bp.route('/buddies/find', methods=['GET'])
@jwt_required()
def find_buddies():
    uid = get_uid()
    user = User.query.get(uid)
    if not user:
        return error_response('User not found', 404)

    # Exclude existing active/pending relationships.
    existing = StudyBuddy.query.filter(
        db.or_(
            StudyBuddy.user_id == uid,
            StudyBuddy.buddy_id == uid
        ),
        StudyBuddy.status.in_(['pending', 'active'])
    ).all()
    existing_buddy_ids = [
        b.buddy_id if str(b.user_id) == str(uid) else b.user_id
        for b in existing
    ]

    base_query = User.query.filter(
        User.id != uid,
        User.is_active == True
    )

    if user.primary_exam:
        base_query = base_query.filter(User.primary_exam == user.primary_exam)

    if user.subjects:
        base_query = base_query.filter(User.subjects.overlap(user.subjects))

    if existing_buddy_ids:
        base_query = base_query.filter(~User.id.in_(existing_buddy_ids))

    candidates = base_query.limit(120).all()

    # If too few, relax subject filter.
    if len(candidates) < 10 and user.subjects:
        relaxed = User.query.filter(
            User.id != uid,
            User.is_active == True
        )
        if user.primary_exam:
            relaxed = relaxed.filter(User.primary_exam == user.primary_exam)
        if existing_buddy_ids:
            relaxed = relaxed.filter(~User.id.in_(existing_buddy_ids))
        candidates = relaxed.limit(120).all()

    # If still too few, relax exam filter.
    if len(candidates) < 10 and user.primary_exam:
        relaxed = User.query.filter(
            User.id != uid,
            User.is_active == True
        )
        if existing_buddy_ids:
            relaxed = relaxed.filter(~User.id.in_(existing_buddy_ids))
        candidates = relaxed.limit(120).all()

    candidate_ids = [c.id for c in candidates]
    accuracies = _accuracy_map(candidate_ids)
    streaks = {
        str(s.user_id): s.current_streak
        for s in Streak.query.filter(Streak.user_id.in_(candidate_ids)).all()
    } if candidate_ids else {}

    # Current user accuracy for similarity scoring.
    my_accuracy = _get_user_accuracy(uid)
    my_subjects = set(user.subjects or [])

    def compute_score(cand):
        score = 0.0
        cand_acc = accuracies.get(str(cand.id), 0.0)
        if my_accuracy:
            diff = abs(cand_acc - my_accuracy)
            score += max(0, 30 - diff)
        if my_subjects and cand.subjects:
            overlap = len(my_subjects.intersection(set(cand.subjects or [])))
            score += min(20, overlap * 6)
        if user.state and cand.state and user.state == cand.state:
            score += 8
        return score

    ranked = sorted(
        candidates,
        key=lambda c: compute_score(c),
        reverse=True
    )

    suggestions = []
    for cand in ranked[:10]:
        cand_acc = accuracies.get(str(cand.id), 0.0)
        match_score = int(min(98, max(50, compute_score(cand) + 40)))  # 50-98
        suggestions.append({
            'id': str(cand.id),
            'full_name': cand.full_name,
            'profile_photo_url': cand.profile_photo_url,
            'school_name': cand.school_name,
            'state': cand.state,
            'primary_exam': cand.primary_exam,
            'subjects': cand.subjects or [],
            'accuracy': round(cand_acc, 1),
            'streak': int(streaks.get(str(cand.id), 0)),
            'match_score': match_score,
        })

    return success_response({'suggestions': suggestions})


@community_bp.route('/buddies/messages', methods=['GET'])
@jwt_required()
def get_buddy_messages():
    uid = get_uid()
    rel = _get_active_buddy_relation(uid)
    if not rel:
        return success_response({'has_buddy': False, 'messages': []})

    other_id = rel.buddy_id if str(rel.user_id) == str(uid) else rel.user_id
    limit = request.args.get('limit', 50, type=int)

    # Update last_seen for active user
    user = User.query.get(uid)
    if user:
        user.last_seen = datetime.utcnow()

    q = StudyBuddyMessage.query.filter(
        db.or_(
            db.and_(StudyBuddyMessage.sender_id == uid, StudyBuddyMessage.recipient_id == other_id),
            db.and_(StudyBuddyMessage.sender_id == other_id, StudyBuddyMessage.recipient_id == uid),
        )
    ).order_by(StudyBuddyMessage.created_at.desc()).limit(limit)

    rows = list(reversed(q.all()))

    # mark incoming as read
    StudyBuddyMessage.query.filter(
        StudyBuddyMessage.recipient_id == uid,
        StudyBuddyMessage.sender_id == other_id,
        StudyBuddyMessage.is_read == False,
    ).update({'is_read': True})
    db.session.commit()

    return success_response({
        'has_buddy': True,
        'buddy_id': str(other_id),
        'messages': [m.to_dict() for m in rows],
    })


@community_bp.route('/buddies/messages', methods=['POST'])
@jwt_required()
def send_buddy_message():
    uid = get_uid()
    rel = _get_active_buddy_relation(uid)
    if not rel:
        return error_response('No active buddy', 409)

    other_id = rel.buddy_id if str(rel.user_id) == str(uid) else rel.user_id
    data = request.get_json() or {}
    body = (data.get('body') or '').strip()
    if not body:
        return error_response('Message body is required', 422)

    msg = StudyBuddyMessage(
        sender_id=uid,
        recipient_id=other_id,
        body=body,
    )
    db.session.add(msg)

    sender = User.query.get(uid)
    if sender:
        sender.last_seen = datetime.utcnow()

    # Clear typing indicator for sender
    if redis_client:
        redis_client.delete(f'buddy_typing:{uid}:{other_id}')

    if sender:
        notif = Notification(
            user_id=other_id,
            type='buddy_message',
            title='New buddy message',
            body=f'{sender.full_name}: {body[:80]}',
            data={'sender_id': str(uid), 'path': '/community/buddies/chat'},
            sent_via=['in_app'],
        )
        db.session.add(notif)

    db.session.commit()
    return success_response({'message': msg.to_dict()}, status_code=201)


@community_bp.route('/buddies/typing', methods=['GET'])
@jwt_required()
def get_buddy_typing():
    uid = get_uid()
    rel = _get_active_buddy_relation(uid)
    if not rel:
        return success_response({'has_buddy': False, 'is_typing': False})

    other_id = rel.buddy_id if str(rel.user_id) == str(uid) else rel.user_id
    is_typing = False
    if redis_client:
        is_typing = redis_client.get(f'buddy_typing:{other_id}:{uid}') == '1'

    other_user = User.query.get(other_id)
    return success_response({
        'has_buddy': True,
        'buddy_id': str(other_id),
        'is_typing': bool(is_typing),
        'last_seen': other_user.last_seen.isoformat() if other_user and other_user.last_seen else None,
    })


@community_bp.route('/buddies/typing', methods=['POST'])
@jwt_required()
def set_buddy_typing():
    uid = get_uid()
    rel = _get_active_buddy_relation(uid)
    if not rel:
        return error_response('No active buddy', 409)

    other_id = rel.buddy_id if str(rel.user_id) == str(uid) else rel.user_id
    data = request.get_json() or {}
    is_typing = bool(data.get('is_typing'))

    if redis_client:
        key = f'buddy_typing:{uid}:{other_id}'
        if is_typing:
            redis_client.setex(key, 6, '1')
        else:
            redis_client.delete(key)

    user = User.query.get(uid)
    if user:
        user.last_seen = datetime.utcnow()
        db.session.commit()

    return success_response({'is_typing': is_typing})


@community_bp.route('/students/<student_id>', methods=['GET'])
@jwt_required()
def get_student_profile(student_id):
    uid = get_uid()
    user = User.query.get(student_id)
    if not user or not user.is_active:
        return error_response('User not found', 404)

    streak = Streak.query.filter_by(user_id=user.id).first()
    accuracy = _get_user_accuracy(user.id)
    points = user.points_balance or 0

    rank = db.session.query(func.count(User.id)).filter(
        User.points_balance > points
    ).scalar() or 0
    rank = int(rank) + 1

    badges = UserBadge.query.filter_by(user_id=user.id).all()
    badge_icons = [b.badge.icon for b in badges if b.badge and b.badge.icon]

    bio_text = (user.bio or '').strip()
    bio_visibility = (user.bio_visibility or 'public').lower()
    bio_moderation_status = (user.bio_moderation_status or 'approved').lower()
    same_user = str(uid) == str(user.id)
    bio_status = 'empty'
    bio_out = None

    if bio_text:
        bio_status = 'visible'
        if not same_user:
            if bio_moderation_status != 'approved':
                bio_status = bio_moderation_status
            elif bio_visibility == 'private':
                bio_status = 'private'
            elif bio_visibility == 'friends' and not _are_buddies(uid, user.id):
                bio_status = 'friends_only'
            else:
                bio_out = bio_text
        else:
            bio_out = bio_text
            if bio_moderation_status != 'approved':
                bio_status = bio_moderation_status
            elif bio_visibility == 'private':
                bio_status = 'private'
            elif bio_visibility == 'friends':
                bio_status = 'friends_only'

    return success_response({
        'id': str(user.id),
        'full_name': user.full_name,
        'profile_photo_url': user.profile_photo_url,
        'bio': bio_out,
        'bio_status': bio_status,
        'bio_visibility': bio_visibility,
        'school_name': user.school_name,
        'state': user.state,
        'primary_exam': user.primary_exam,
        'subjects': user.subjects or [],
        'accuracy': accuracy,
        'streak': streak.current_streak if streak else 0,
        'points': points,
        'rank': rank,
        'badges': badge_icons,
        'last_seen': user.last_seen.isoformat() if user.last_seen else None,
    })


@community_bp.route('/challenges', methods=['GET'])
@jwt_required()
def list_challenges():
    uid = get_uid()
    status = request.args.get('status')
    q = Challenge.query.filter(
        (Challenge.challenger_id == uid) | (Challenge.opponent_id == uid)
    )
    if status:
        q = q.filter_by(status=status)
    rows = q.order_by(Challenge.created_at.desc()).all()
    return success_response([r.to_dict(current_user_id=uid) for r in rows])


@community_bp.route('/challenges', methods=['POST'])
@jwt_required()
def create_challenge():
    uid = get_uid()
    data = request.get_json() or {}
    opponent_id = data.get('opponent_id')
    subject = data.get('subject')
    exam_type = data.get('exam_type') or 'JAMB'
    question_count = int(data.get('question_count') or 20)

    if not opponent_id:
        return error_response('opponent_id is required', 422)
    if not subject:
        return error_response('subject is required', 422)
    if question_count < 5:
        return error_response('question_count must be >= 5', 422)

    if str(uid) == str(opponent_id):
        return error_response('You cannot challenge yourself', 400)

    # Pull a randomized question set for the duel.
    qs = Question.query.filter_by(
        exam_type=exam_type,
        subject=subject,
        is_active=True,
        is_approved=True,
    ).order_by(db.func.random()).limit(question_count).all()

    if not qs:
        return error_response('No challenge questions available for this subject', 404)

    challenge = Challenge(
        challenger_id=uid,
        opponent_id=opponent_id,
        subject=subject,
        exam_type=exam_type,
        question_count=len(qs),
        status='pending',
        question_ids=[q.id for q in qs],
        challenger_answers={},
        opponent_answers={},
    )
    db.session.add(challenge)
    db.session.commit()
    return success_response(challenge.to_dict(current_user_id=uid), status_code=201)


@community_bp.route('/challenges/<challenge_id>', methods=['GET'])
@jwt_required()
def get_challenge(challenge_id):
    uid = get_uid()
    c = Challenge.query.filter_by(id=challenge_id).first_or_404()
    if str(c.challenger_id) != str(uid) and str(c.opponent_id) != str(uid):
        return error_response('Not allowed', 403)

    qs = Question.query.filter(Question.id.in_(c.question_ids or [])).all()
    qdict = {str(q.id): q for q in qs}
    ordered_questions = []
    for qid in c.question_ids or []:
        q = qdict.get(str(qid))
        if not q:
            continue
        ordered_questions.append({
            'id': str(q.id),
            'text': q.question_text,
            'options': [q.option_a, q.option_b, q.option_c, q.option_d],
            'correctAnswer': q.correct_answer,
            'subject': q.subject,
            'topic': q.topic,
            'explanation': q.explanation,
        })

    payload = c.to_dict(current_user_id=uid)
    payload['questions'] = ordered_questions
    payload['my_answers'] = c.challenger_answers if payload['my_role'] == 'challenger' else c.opponent_answers
    return success_response(payload)


@community_bp.route('/challenges/<challenge_id>/accept', methods=['PUT'])
@jwt_required()
def accept_challenge(challenge_id):
    uid = get_uid()
    c = Challenge.query.filter_by(id=challenge_id).first_or_404()
    if str(c.opponent_id) != str(uid):
        return error_response('Only opponent can accept', 403)
    if c.status != 'pending':
        return error_response('Challenge is not pending', 409)
    c.status = 'active'
    db.session.commit()
    return success_response(c.to_dict(current_user_id=uid))


@community_bp.route('/challenges/<challenge_id>/decline', methods=['PUT'])
@jwt_required()
def decline_challenge(challenge_id):
    uid = get_uid()
    c = Challenge.query.filter_by(id=challenge_id).first_or_404()
    if str(c.opponent_id) != str(uid):
        return error_response('Only opponent can decline', 403)
    if c.status not in ('pending', 'active'):
        return error_response('Challenge cannot be declined', 409)
    c.status = 'declined'
    db.session.commit()
    return success_response(c.to_dict(current_user_id=uid))


@community_bp.route('/challenges/<challenge_id>/answers', methods=['POST'])
@jwt_required()
def submit_challenge_answer(challenge_id):
    """
    Submit an answer for a challenge question.
    Uses ChallengeAnswer model for detailed tracking per FIX 3.
    """
    uid = get_uid()
    c = Challenge.query.filter_by(id=challenge_id).first_or_404()
    if c.status not in ('active', 'pending'):
        return error_response('Challenge is not active', 409)

    data = request.get_json() or {}
    question_id = str(data.get('question_id') or '')
    selected_option = (data.get('selected_option') or '').upper()
    time_spent = data.get('time_spent', 0)
    
    if not question_id:
        return error_response('question_id is required', 422)
    if selected_option not in ('A', 'B', 'C', 'D'):
        return error_response('selected_option must be A-D', 422)

    # Get the question to check correctness
    question = Question.query.get(question_id)
    if not question:
        return error_response('Question not found', 404)
    
    is_correct = selected_option == question.correct_answer

    # Check if user already answered this question in this challenge
    existing = ChallengeAnswer.query.filter_by(
        challenge_id=challenge_id,
        user_id=uid,
        question_id=question_id
    ).first()
    
    if existing:
        # Update existing answer
        existing.selected_option = selected_option
        existing.is_correct = is_correct
        existing.time_spent = time_spent
        existing.answered_at = datetime.utcnow()
    else:
        # Create new ChallengeAnswer record (FIX 3)
        answer = ChallengeAnswer(
            challenge_id=challenge_id,
            user_id=uid,
            question_id=question_id,
            selected_option=selected_option,
            is_correct=is_correct,
            time_spent=time_spent,
        )
        db.session.add(answer)

    # Update challenge progress JSON (for backwards compatibility)
    if str(uid) == str(c.challenger_id):
        answers = dict(c.challenger_answers or {})
        answers[question_id] = selected_option
        c.challenger_answers = answers
    elif str(uid) == str(c.opponent_id):
        answers = dict(c.opponent_answers or {})
        answers[question_id] = selected_option
        c.opponent_answers = answers
    else:
        return error_response('Not allowed', 403)

    # Activate challenge on first answer
    if c.status == 'pending':
        c.status = 'active'

    db.session.commit()
    
    # Record study event for analytics
    record_study_event(
        user_id=uid,
        action_type='challenge_answer_correct' if is_correct else 'challenge_answer_wrong',
        subject=question.subject,
        topic=question.topic,
        difficulty=question.difficulty,
        is_correct=is_correct,
        time_spent=time_spent,
        challenge_id=challenge_id,
        question_id=question_id,
    )

    return success_response({
        'challenge': c.to_dict(current_user_id=uid),
        'is_correct': is_correct,
        'correct_answer': question.correct_answer if is_correct else None,
        'explanation': question.explanation if not is_correct else None,
    })


@community_bp.route('/challenges/<challenge_id>/complete', methods=['POST'])
@jwt_required()
def complete_challenge(challenge_id):
    uid = get_uid()
    c = Challenge.query.filter_by(id=challenge_id).first_or_404()
    if str(uid) not in (str(c.challenger_id), str(c.opponent_id)):
        return error_response('Not allowed', 403)

    qs = Question.query.filter(Question.id.in_(c.question_ids or [])).all()
    by_id = {str(q.id): q for q in qs}

    def compute_score(answer_map):
        if not answer_map:
            return 0.0
        total = len(c.question_ids or []) or 1
        correct = 0
        for qid, sel in (answer_map or {}).items():
            q = by_id.get(str(qid))
            if q and sel == q.correct_answer:
                correct += 1
        return round((correct / total) * 100, 1)

    if str(uid) == str(c.challenger_id):
        c.challenger_completed_at = datetime.utcnow()
        c.challenger_score = compute_score(c.challenger_answers or {})
    else:
        c.opponent_completed_at = datetime.utcnow()
        c.opponent_score = compute_score(c.opponent_answers or {})

    if c.challenger_completed_at and c.opponent_completed_at:
        c.status = 'completed'
        c_score = c.challenger_score or 0
        o_score = c.opponent_score or 0
        if c_score > o_score:
            c.winner_id = c.challenger_id
        elif o_score > c_score:
            c.winner_id = c.opponent_id
        else:
            c.winner_id = None
    else:
        c.status = 'active'

    db.session.commit()
    payload = c.to_dict(current_user_id=uid)
    payload['my_score'] = c.challenger_score if payload['my_role'] == 'challenger' else c.opponent_score
    payload['opponent_score'] = c.opponent_score if payload['my_role'] == 'challenger' else c.challenger_score
    return success_response(payload)
