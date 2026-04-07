from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models import Streak, StreakHistory, User, StudyBuddy
from ..utils.helpers import success_response, error_response

streaks_bp = Blueprint('streaks', __name__)


@streaks_bp.route('/me', methods=['GET'])
@jwt_required()
def get_streak():
    from datetime import date, timedelta
    uid = get_jwt_identity()
    streak = Streak.query.filter_by(user_id=uid).first()
    if not streak:
        return error_response('Streak record not found', 404)
    user = User.query.get(uid)
    data = streak.to_dict()
    data['points_balance'] = user.points_balance if user else 0

    # Determine if streak is broken today (no study yesterday and no freeze)
    today = date.today()
    yesterday = today - timedelta(days=1)
    broken_today = False
    previous_streak = None
    if streak.streak_broken_date == yesterday:
        broken_today = True
        previous_streak = streak.previous_streak
    elif streak.last_study_date and streak.last_study_date == today - timedelta(days=2):
        freeze_used = StreakHistory.query.filter(
            StreakHistory.user_id == uid,
            StreakHistory.date == yesterday,
            StreakHistory.status.in_(['freeze_used', 'repair_used'])
        ).first()
        if not freeze_used:
            broken_today = True
            previous_streak = streak.current_streak

    data['streak_broken_today'] = broken_today
    data['previous_streak'] = previous_streak

    return success_response(data)


@streaks_bp.route('/calendar', methods=['GET'])
@jwt_required()
def get_calendar():
    """Get 365-day streak calendar data."""
    from datetime import date, timedelta
    uid = get_jwt_identity()
    today = date.today()
    start = today - timedelta(days=364)

    history = StreakHistory.query.filter(
        StreakHistory.user_id == uid,
        StreakHistory.date >= start
    ).all()

    history_map = {h.date.isoformat(): h.to_dict() for h in history}
    calendar = []
    for i in range(365):
        d = (start + timedelta(days=i)).isoformat()
        calendar.append({
            'date': d,
            **history_map.get(d, {'status': 'none', 'questions_done': 0})
        })

    return success_response({'calendar': calendar})


@streaks_bp.route('/check-in', methods=['POST'])
@jwt_required()
def check_in():
    """Record study activity (called after session complete)."""
    from ..services.streak_service import StreakService
    uid = get_jwt_identity()
    data = request.get_json()
    streak = StreakService.record_study_activity(
        uid,
        questions_answered=data.get('questions_answered', 0),
        minutes_studied=data.get('minutes_studied', 0)
    )
    return success_response(streak.to_dict() if streak else None)


@streaks_bp.route('/freeze/use', methods=['POST'])
@jwt_required()
def use_freeze():
    uid = get_jwt_identity()
    from ..services.streak_service import StreakService
    result = StreakService.use_freeze(uid)
    if result.get('error'):
        return error_response(result['error'])
    return success_response(result)


@streaks_bp.route('/freeze/buy', methods=['POST'])
@jwt_required()
def buy_freeze():
    uid = get_jwt_identity()
    from ..services.streak_service import StreakService
    result = StreakService.buy_freeze(uid)
    if result.get('error'):
        return error_response(result['error'])
    return success_response(result, message='Freeze purchased!')


@streaks_bp.route('/repair/free', methods=['POST'])
@jwt_required()
def free_repair():
    uid = get_jwt_identity()
    from ..services.streak_service import StreakService
    result = StreakService.repair_free(uid)
    if result.get('error'):
        return error_response(result['error'])
    return success_response(result, message='Streak repaired!')


@streaks_bp.route('/repair/points', methods=['POST'])
@jwt_required()
def points_repair():
    uid = get_jwt_identity()
    from ..services.streak_service import StreakService
    result = StreakService.repair_points(uid)
    if result.get('error'):
        return error_response(result['error'])
    return success_response(result, message='Streak repaired with points!')


@streaks_bp.route('/society', methods=['GET'])
@jwt_required()
def streak_society():
    """Get streak society leaderboard."""
    top_streaks = Streak.query.filter(
        Streak.current_streak > 0
    ).order_by(Streak.current_streak.desc()).limit(50).all()

    result = []
    for s in top_streaks:
        user = User.query.get(s.user_id)
        if user:
            result.append({
                'user_id': str(user.id),
                'name': user.full_name,
                'photo': user.profile_photo_url,
                'streak': s.current_streak,
                'tier': s.society_tier,
            })

    return success_response(result)


@streaks_bp.route('/friends', methods=['GET'])
@jwt_required()
def streak_friends():
    """Get friends' streaks."""
    uid = get_jwt_identity()
    buddies = StudyBuddy.query.filter(
        ((StudyBuddy.user_id == uid) | (StudyBuddy.buddy_id == uid)),
        StudyBuddy.status == 'active'
    ).all()

    friend_ids = []
    for b in buddies:
        other_id = b.buddy_id if str(b.user_id) == str(uid) else b.user_id
        friend_ids.append(other_id)

    if not friend_ids:
        return success_response({'friends': []})

    friend_streaks = Streak.query.filter(Streak.user_id.in_(friend_ids)).all()
    result = []
    for s in friend_streaks:
        user = User.query.get(s.user_id)
        if not user:
            continue
        result.append({
            'user_id': str(user.id),
            'name': user.full_name,
            'photo': user.profile_photo_url,
            'current_streak': s.current_streak,
            'longest_streak': s.longest_streak,
            'society_tier': s.society_tier,
        })

    return success_response({'friends': result})
