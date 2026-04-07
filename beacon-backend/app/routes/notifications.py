from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..extensions import db
from ..models import Notification, NotificationPreference
from ..utils.helpers import success_response, error_response, paginate_query

notifications_bp = Blueprint('notifications', __name__)

def get_uid(): return get_jwt_identity()


@notifications_bp.route('', methods=['GET'])
@jwt_required()
def get_notifications():
    uid = get_uid()
    page = request.args.get('page', 1, type=int)
    query = Notification.query.filter_by(user_id=uid).order_by(
        Notification.created_at.desc()
    )
    return success_response(paginate_query(query, page=page))


@notifications_bp.route('/read-all', methods=['PUT'])
@jwt_required()
def mark_all_read():
    uid = get_uid()
    Notification.query.filter_by(user_id=uid, is_read=False).update({'is_read': True})
    db.session.commit()
    return success_response(message='All notifications marked as read')


@notifications_bp.route('/<notif_id>/read', methods=['PUT'])
@jwt_required()
def mark_read(notif_id):
    uid = get_uid()
    n = Notification.query.filter_by(id=notif_id, user_id=uid).first_or_404()
    n.is_read = True
    db.session.commit()
    return success_response(message='Notification marked as read')


@notifications_bp.route('/preferences', methods=['GET'])
@jwt_required()
def get_prefs():
    uid = get_uid()
    prefs = NotificationPreference.query.filter_by(user_id=uid).first()
    if not prefs:
        prefs = NotificationPreference(user_id=uid)
        db.session.add(prefs)
        db.session.commit()
    return success_response(prefs.to_dict())


@notifications_bp.route('/preferences', methods=['PUT'])
@jwt_required()
def update_prefs():
    uid = get_uid()
    prefs = NotificationPreference.query.filter_by(user_id=uid).first()
    if not prefs:
        prefs = NotificationPreference(user_id=uid)
        db.session.add(prefs)

    data = request.get_json()
    allowed_fields = [
        'streak_risk', 'streak_milestone', 'streak_broken',
        'study_daily', 'study_behind', 'study_reviews',
        'perf_prediction', 'perf_weak', 'perf_badge', 'perf_exam',
        'social_challenge', 'social_rank', 'social_community', 'social_buddy',
        'moti_inactive', 'moti_summary', 'moti_monday',
        'dnd_enabled', 'dnd_from', 'dnd_to', 'weekend_mode',
    ]
    for field in allowed_fields:
        if field in data:
            setattr(prefs, field, data[field])

    db.session.commit()
    return success_response(prefs.to_dict(), message='Preferences updated')


@notifications_bp.route('/push-token', methods=['POST'])
@jwt_required()
def register_push_token():
    uid = get_uid()
    data = request.get_json()
    token = data.get('token')
    if not token:
        return error_response('FCM token required', 422)

    prefs = NotificationPreference.query.filter_by(user_id=uid).first()
    if prefs:
        prefs.fcm_token = token
        db.session.commit()

    return success_response(message='Push token registered')
