from datetime import datetime, timedelta
from sqlalchemy import func
from ..extensions import db, celery
from ..models import User, LeagueRoom, LeagueMember, Notification

ROOM_SIZE = 50
PROMOTION_COUNT = 10
DEMOTION_COUNT = 5
MIN_MEMBERS_FOR_DEMOTION = PROMOTION_COUNT + DEMOTION_COUNT
TIER_ORDER = [
    'Bronze', 'Silver', 'Gold', 'Diamond'
]


def get_current_season():
    """Returns a string identifier for the current week, e.g., '2024-W15'."""
    now = datetime.utcnow()
    year, week, _ = now.isocalendar()
    return f"{year}-W{week:02d}"


def get_or_create_room(user_id):
    """
    Ensures a user is assigned to a room for the current season.
    If they aren't in any, find one with space (< 50) or create a new one.
    """
    user = User.query.get(user_id)
    if not user:
        return None

    season_id = get_current_season()
    tier = user.league_tier or 'Bronze'
    if tier not in TIER_ORDER:
        tier = 'Bronze'

    # Check if user already has a member record for this season
    member = LeagueMember.query.join(LeagueRoom).filter(
        LeagueMember.user_id == user_id,
        LeagueRoom.season_id == season_id,
        LeagueRoom.is_active == True
    ).first()

    if member:
        return member.room

    # Find available room in the right tier/season
    room = LeagueRoom.query.filter_by(
        tier=tier,
        season_id=season_id,
        is_active=True
    ).outerjoin(LeagueMember).group_by(LeagueRoom.id).having(
        func.count(LeagueMember.id) < ROOM_SIZE
    ).first()

    # Create new room if none found
    if not room:
        # Get next room number for this tier/season
        last_room = LeagueRoom.query.filter_by(
            tier=tier, season_id=season_id
        ).order_by(LeagueRoom.room_number.desc()).first()
        
        next_num = (last_room.room_number + 1) if last_room else 1
        
        room = LeagueRoom(
            tier=tier,
            season_id=season_id,
            room_number=next_num,
            is_active=True
        )
        db.session.add(room)
        db.session.flush()

    # Join the room
    member = LeagueMember(
        user_id=user_id,
        room_id=room.id,
        points=0
    )
    db.session.add(member)
    db.session.commit()

    return room


def update_league_points(user_id, points_to_add):
    """
    Updates the user's weekly league points and checks for leaderboard passes.
    """
    user = User.query.get(user_id)
    if not user:
        return

    # 1. Ensure user is in a room
    room = get_or_create_room(user_id)
    if not room:
        return

    member = LeagueMember.query.filter_by(user_id=user_id, room_id=room.id).first()
    if not member:
        return

    old_points = member.points
    new_points = old_points + points_to_add

    # 2. Check for passes BEFORE updating (Who was ahead of me?)
    # We find users in the same room who have points BETWEEN old and new
    victims = LeagueMember.query.filter(
        LeagueMember.room_id == room.id,
        LeagueMember.user_id != user_id,
        LeagueMember.points > old_points,
        LeagueMember.points < new_points
    ).all()

    # 3. Apply the update
    member.points = new_points
    user.league_points = new_points
    db.session.commit()

    # 4. Notify victims!
    passer_name = user.full_name or 'Someone'
    for victim in victims:
        _notify_passed(victim.user_id, passer_name)


def _notify_passed(victim_id, passer_name):
    """Triggers a notification to the user who was just passed."""
    notif = Notification(
        user_id=victim_id,
        type='social_rank',
        title='Leaderboard Alert! \U0001F3C3\u200D\u2642\uFE0F',
        body=f'{passer_name} just passed you in the {get_current_season()} League!',
        data={'path': '/community/leaderboard', 'passer_name': passer_name},
        sent_via=['in_app']
    )
    db.session.add(notif)
    db.session.commit()


@celery.task(name='app.services.league_service.process_weekly_rotation')
def process_weekly_rotation():
    """
    Called every Sunday at midnight (via Cron task).
    Handles the Promotion/Demotion zones and resets all weekly league points.
    """
    season_id = get_current_season()
    
    # 1. Get all active rooms from the season that just ended 
    # (assuming this is called just after the season change)
    # For now, let's just find ALL active rooms.
    rooms = LeagueRoom.query.filter_by(is_active=True).all()
    
    for room in rooms:
        # Get members sorted by points
        members = LeagueMember.query.filter_by(room_id=room.id).order_by(
            LeagueMember.points.desc()
        ).all()
        
        if not members:
            room.is_active = False
            continue

        total_members = len(members)
        promotion_cutoff = min(PROMOTION_COUNT, total_members)
        demotion_enabled = total_members >= MIN_MEMBERS_FOR_DEMOTION
        demotion_start_rank = total_members - DEMOTION_COUNT + 1

        for i, member in enumerate(members):
            rank = i + 1
            user = member.user
            if not user:
                continue

            # --- CALCULATE WEEKLY REWARD ---
            reward = 0
            if rank == 1:
                reward = 500
            elif rank == 2:
                reward = 300
            elif rank == 3:
                reward = 200
            elif rank <= promotion_cutoff:
                reward = 100
                
            if reward > 0:
                user.points_balance = (user.points_balance or 0) + reward

            current_tier = user.league_tier or 'Bronze'
            tier_idx = TIER_ORDER.index(current_tier) if current_tier in TIER_ORDER else 0
            result_type = 'stable'
            final_tier  = current_tier

            # --- PROMOTION ZONE (Top 10) ---
            if rank <= promotion_cutoff and tier_idx < len(TIER_ORDER) - 1:
                final_tier = TIER_ORDER[tier_idx + 1]
                user.league_tier = final_tier
                result_type = 'promotion'
                _notify_rotation(user.id, 'promotion', final_tier, reward)

            # --- DEMOTION ZONE (Bottom 5) ---
            elif demotion_enabled and rank >= demotion_start_rank and tier_idx > 0:
                final_tier = TIER_ORDER[tier_idx - 1]
                user.league_tier = final_tier
                result_type = 'demotion'
                _notify_rotation(user.id, 'demotion', final_tier, 0)

            # Neutral result (stable)
            elif reward > 0:
                _notify_rotation(user.id, 'stable', current_tier, reward)

            # --- SAVE RESULT FOR "MONDAY MORNING" POPUP ---
            user.last_league_result = {
                'result': result_type,
                'tier': final_tier,
                'reward': reward,
                'rank': rank,
                'total': total_members,
                'season': season_id,
            }
            # Clear seen-flag so the popup shows again on next app open
            user.last_seen_league_season = None

            # Reset weekly points cache on User model
            user.league_points = 0

        # Deactivate the room
        room.is_active = False

    db.session.commit()


def _notify_rotation(user_id, result_type, tier, reward=0):
    """Notify user of their promotion or demotion."""
    if result_type == 'promotion':
        title = "League Promotion! \U0001F3C6"
        body = f"Congratulations! You've been promoted to the {tier} League!"
    elif result_type == 'demotion':
        title = "League Demotion \U0001F4C9"
        body = f"You've been moved to the {tier} League. Study harder this week to climb back up!"
    else:
        title = "Season Ended! 🏁"
        body = f"The session has ended. You maintained your spot in the {tier} League."

    if reward > 0:
        body += f" You earned {reward} bonus points! 💎"
    
    notif = Notification(
        user_id=user_id,
        type='social_rank',
        title=title,
        body=body,
        data={'result': result_type, 'new_tier': tier, 'reward': reward},
        sent_via=['in_app']
    )
    db.session.add(notif)
    # Note: In a production app, we would also emit a Socket.io event here
