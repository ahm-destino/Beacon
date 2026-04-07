from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models import User, Streak
from ..utils.helpers import success_response

leaderboard_bp = Blueprint('leaderboard', __name__)


def build_leaderboard(query, page=1, limit=50):
    from ..extensions import db
    users = query.limit(limit).offset((page - 1) * limit).all()
    result = []
    for rank, user in enumerate(users, start=1 + (page - 1) * limit):
        streak = user.streak
        result.append({
            'rank': rank,
            'user_id': str(user.id),
            'name': user.full_name,
            'photo': user.profile_photo_url,
            'school_name': user.school_name or '',
            'subscription_tier': user.subscription_tier,
            'points': user.points_balance or 0,
            'streak': streak.current_streak if streak else 0,
        })
    return result


@leaderboard_bp.route('/global', methods=['GET'])
@jwt_required()
def global_board():
    page = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 50, type=int)
    query = User.query.filter_by(is_active=True, is_banned=False).order_by(
        User.points_balance.desc()
    )
    return success_response(build_leaderboard(query, page, limit))


@leaderboard_bp.route('/streak-society', methods=['GET'])
@jwt_required()
def streak_society():
    page = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 50, type=int)
    query = User.query.join(Streak).filter(
        User.is_active == True, Streak.current_streak > 0
    ).order_by(Streak.current_streak.desc())
    return success_response(build_leaderboard(query, page, limit))


@leaderboard_bp.route('/league', methods=['GET'])
@jwt_required()
def league_board():
    uid = get_jwt_identity()
    from ..services.league_service import (
        get_or_create_room,
        PROMOTION_COUNT,
        DEMOTION_COUNT,
        MIN_MEMBERS_FOR_DEMOTION,
    )
    from ..models import LeagueMember
    
    # Ensure user is in a room
    room = get_or_create_room(uid)
    if not room:
        return success_response({'items': [], 'room_info': None})

    # Get all members in this room sorted by points
    members = LeagueMember.query.filter_by(room_id=room.id).order_by(
        LeagueMember.points.desc()
    ).all()

    total_members = len(members)
    promotion_cutoff = min(PROMOTION_COUNT, total_members)
    demotion_enabled = total_members >= MIN_MEMBERS_FOR_DEMOTION
    demotion_start_rank = total_members - DEMOTION_COUNT + 1

    result = []
    user_rank = 0
    for i, m in enumerate(members):
        rank = i + 1
        if str(m.user_id) == str(uid):
            user_rank = rank
        
        streak = m.user.streak if m.user else None
        result.append({
            'rank': rank,
            'user_id': str(m.user_id),
            'name': m.user.full_name,
            'photo': m.user.profile_photo_url,
            'points': m.points,
            'school_name': m.user.school_name or '' if m.user else '',
            'streak': streak.current_streak if streak else 0,
            'is_me': str(m.user_id) == str(uid),
            # Mimo/Duolingo style zones
            'zone': 'promotion' if rank <= promotion_cutoff else (
                'demotion' if demotion_enabled and rank >= demotion_start_rank else 'stable'
            )
        })

    return success_response({
        'items': result,
        'user_rank': user_rank,
        'room_info': {
            'tier': room.tier,
            'season_id': room.season_id,
            'room_number': room.room_number,
            'total_members': len(members)
        }
    })


@leaderboard_bp.route('/leagues', methods=['GET'])
@jwt_required()
def league_tiers():
    uid = get_jwt_identity()
    from ..services.league_service import TIER_ORDER

    user = User.query.get(uid)
    current = user.league_tier if user and user.league_tier in TIER_ORDER else 'Bronze'
    current_idx = TIER_ORDER.index(current)
    tiers = []

    for i, tier in enumerate(TIER_ORDER):
        tiers.append({
            'tier': tier,
            'index': i,
            'status': 'current' if i == current_idx else ('unlocked' if i < current_idx else 'locked'),
            'is_current': i == current_idx,
            'is_locked': i > current_idx,
        })

    next_tier = TIER_ORDER[current_idx + 1] if current_idx < len(TIER_ORDER) - 1 else None

    return success_response({
        'current_tier': current,
        'next_tier': next_tier,
        'tiers': tiers,
    })


@leaderboard_bp.route('/unseen-result', methods=['GET'])
@jwt_required()
def unseen_result():
    """
    Returns the user's last league result if they haven't seen it yet.
    Frontend calls this on app open to trigger the Mimo promotion/demotion popup.
    """
    from ..services.league_service import get_current_season
    uid = get_jwt_identity()
    user = User.query.get(uid)
    if not user:
        return success_response(None)

    current_season = get_current_season()
    # If user already saw this season's result, return nothing
    if user.last_seen_league_season == current_season:
        return success_response(None)

    # If there's a saved result from the PREVIOUS season, return it
    if user.last_league_result:
        return success_response(user.last_league_result)

    return success_response(None)


@leaderboard_bp.route('/acknowledge-result', methods=['POST'])
@jwt_required()
def acknowledge_result():
    """
    Marks the current season's league result as seen.
    Call this after the user dismisses the promotion/demotion popup.
    """
    from ..services.league_service import get_current_season
    from ..extensions import db
    uid = get_jwt_identity()
    user = User.query.get(uid)
    if not user:
        return success_response(None)

    user.last_seen_league_season = get_current_season()
    db.session.commit()
    return success_response({'acknowledged': True})
