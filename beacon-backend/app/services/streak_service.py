from datetime import date, timedelta
from ..extensions import db
from ..models import Streak, StreakHistory, User


class StreakService:

    FREEZE_COST = 500   # points
    REPAIR_COST = 500   # points
    MIN_STUDY_MINUTES = 1
    MIN_STUDY_QUESTIONS = 1

    @staticmethod
    def _ensure_missed_history(user_id, start_date, end_date):
        if not start_date or not end_date or start_date > end_date:
            return {}

        existing = StreakHistory.query.filter(
            StreakHistory.user_id == user_id,
            StreakHistory.date >= start_date,
            StreakHistory.date <= end_date,
        ).all()
        history_map = {h.date: h for h in existing}

        d = start_date
        while d <= end_date:
            if d not in history_map:
                history = StreakHistory(
                    user_id=user_id,
                    date=d,
                    status='missed',
                )
                db.session.add(history)
                history_map[d] = history
            d += timedelta(days=1)

        return history_map

    @staticmethod
    def _apply_repair(streak):
        if not streak:
            return {'error': 'Streak record not found'}

        today = date.today()
        break_date = streak.streak_broken_date

        if not break_date and streak.last_study_date and streak.last_study_date < today - timedelta(days=1):
            break_date = streak.last_study_date + timedelta(days=1)
            if streak.previous_streak is None:
                streak.previous_streak = streak.current_streak
            streak.streak_broken_date = break_date

        restore_to = streak.previous_streak
        if restore_to is None and break_date and (streak.current_streak or 0) > 1:
            restore_to = streak.current_streak

        if not break_date or restore_to is None:
            return {'error': 'No broken streak to repair'}

        streak.current_streak = max(1, restore_to)
        streak.society_tier = StreakService.calculate_tier(streak.current_streak)
        if streak.current_streak > (streak.longest_streak or 0):
            streak.longest_streak = streak.current_streak

        if break_date:
            streak.streak_start_date = break_date - timedelta(days=streak.current_streak)

        history = StreakHistory.query.filter_by(user_id=streak.user_id, date=break_date).first()
        if history:
            history.status = 'repair_used'
        else:
            history = StreakHistory(
                user_id=streak.user_id,
                date=break_date,
                status='repair_used',
            )
            db.session.add(history)

        streak.previous_streak = None
        streak.streak_broken_date = None

        return None

    @staticmethod
    def record_study_activity(user_id, questions_answered, minutes_studied):
        """Called after every completed practice session."""
        streak = Streak.query.filter_by(user_id=user_id).first()
        if not streak:
            streak = Streak(user_id=user_id)
            db.session.add(streak)

        questions_answered = questions_answered or 0
        minutes_studied = minutes_studied or 0
        today = date.today()
        history_today = StreakHistory.query.filter_by(user_id=user_id, date=today).first()
        existing_questions = history_today.questions_done if history_today else 0
        existing_minutes = history_today.minutes_studied if history_today else 0
        total_questions_today = (existing_questions or 0) + questions_answered
        total_minutes_today = (existing_minutes or 0) + minutes_studied
        qualifies = (
            total_minutes_today >= StreakService.MIN_STUDY_MINUTES
            or total_questions_today >= StreakService.MIN_STUDY_QUESTIONS
        )

        # Already studied today - update count
        if streak.last_study_date == today:
            if not history_today:
                history_today = StreakHistory(
                    user_id=user_id,
                    date=today,
                    status='studied',
                )
                db.session.add(history_today)
            history_today.status = 'studied'
            history_today.questions_done = total_questions_today
            history_today.minutes_studied = total_minutes_today
            db.session.commit()
            return streak

        yesterday = today - timedelta(days=1)

        history_range = {}
        if streak.last_study_date:
            gap_start = streak.last_study_date + timedelta(days=1)
            gap_end = yesterday
            if gap_start <= gap_end:
                history_range = StreakService._ensure_missed_history(user_id, gap_start, gap_end)

        if not qualifies:
            if not history_today:
                history_today = StreakHistory(
                    user_id=user_id,
                    date=today,
                    status='missed',
                    questions_done=total_questions_today,
                    minutes_studied=total_minutes_today,
                )
                db.session.add(history_today)
            else:
                history_today.status = 'missed'
                history_today.questions_done = total_questions_today
                history_today.minutes_studied = total_minutes_today
            db.session.commit()
            return streak

        if streak.last_study_date == yesterday:
            # Streak continues
            streak.current_streak += 1
        elif streak.last_study_date and streak.last_study_date < yesterday:
            # Missed day(s) - check if every gap day was covered by freeze/repair
            gap_start = streak.last_study_date + timedelta(days=1)
            gap_end = yesterday
            gap_days = (gap_end - gap_start).days + 1 if gap_start <= gap_end else 0
            covered_statuses = {'freeze_used', 'repair_used', 'studied'}
            all_covered = True
            for i in range(gap_days):
                d = gap_start + timedelta(days=i)
                entry = history_range.get(d)
                if not entry or entry.status not in covered_statuses:
                    all_covered = False
                    break

            if all_covered:
                streak.current_streak += 1
            else:
                streak.broken_count += 1
                streak.previous_streak = streak.current_streak
                streak.streak_broken_date = gap_start
                streak.current_streak = 1
                streak.streak_start_date = today
        else:
            # New user first study day
            streak.current_streak = 1
            streak.streak_start_date = today

        streak.total_study_days = (streak.total_study_days or 0) + 1

        if streak.current_streak > (streak.longest_streak or 0):
            streak.longest_streak = streak.current_streak

        streak.last_study_date = today
        streak.society_tier = StreakService.calculate_tier(streak.current_streak)

        # Log to streak_history
        if not history_today:
            history_today = StreakHistory(
                user_id=user_id,
                date=today,
                status='studied',
                questions_done=total_questions_today,
                minutes_studied=total_minutes_today,
            )
            db.session.add(history_today)
        else:
            history_today.status = 'studied'
            history_today.questions_done = total_questions_today
            history_today.minutes_studied = total_minutes_today

        db.session.commit()

        StreakService.check_milestones(user_id, streak.current_streak)
        return streak
    @staticmethod
    def calculate_tier(streak_days):
        if streak_days >= 365: return 'legend'
        if streak_days >= 100: return 'champion'
        if streak_days >= 30:  return 'warrior'
        if streak_days >= 7:   return 'blazer'
        return 'none'

    @staticmethod
    def check_milestones(user_id, current_streak):
        milestones = {7: 100, 14: 200, 21: 300, 30: 500, 60: 1000, 100: 2000}
        if current_streak in milestones:
            StreakService.award_points(
                user_id, milestones[current_streak], 'streak_milestone',
                f'{current_streak}-day streak milestone reached!'
            )

    @staticmethod
    def award_points(user_id, amount, action, description=''):
        user = User.query.get(user_id)
        if not user:
            return
        user.points_balance = (user.points_balance or 0) + amount
        from ..models import PointTransaction
        transaction = PointTransaction(
            user_id=user_id,
            amount=amount,
            action=action,
            description=description,
            balance_after=user.points_balance,
        )
        db.session.add(transaction)
        db.session.commit()

    @staticmethod
    def use_freeze(user_id):
        streak = Streak.query.filter_by(user_id=user_id).first()
        if not streak or streak.freezes_remaining <= 0:
            return {'error': 'No streak freezes remaining'}

        yesterday = date.today() - timedelta(days=1)
        history = StreakHistory.query.filter_by(user_id=user_id, date=yesterday).first()
        if history:
            if history.status == 'studied':
                return {'error': 'You already studied yesterday'}
            if history.status in ['freeze_used', 'repair_used']:
                return {'error': 'Freeze already used for yesterday'}
            history.status = 'freeze_used'
        else:
            history = StreakHistory(
                user_id=user_id,
                date=yesterday,
                status='freeze_used',
            )
            db.session.add(history)
        streak.freezes_remaining -= 1
        streak.freezes_used = (streak.freezes_used or 0) + 1
        db.session.commit()
        return streak.to_dict()

    @staticmethod
    def buy_freeze(user_id):
        user = User.query.get(user_id)
        streak = Streak.query.filter_by(user_id=user_id).first()
        cost = StreakService.FREEZE_COST

        if (user.points_balance or 0) < cost:
            return {'error': f'Insufficient points. Need {cost} points.'}

        user.points_balance -= cost
        streak.freezes_remaining = (streak.freezes_remaining or 0) + 1

        from ..models import PointTransaction
        t = PointTransaction(
            user_id=user_id, amount=-cost, action='buy_freeze',
            description='Purchased 1 streak freeze',
            balance_after=user.points_balance
        )
        db.session.add(t)
        db.session.commit()
        return {'freezes_remaining': streak.freezes_remaining, 'points_balance': user.points_balance}

    @staticmethod
    def repair_free(user_id):
        """Complete 20 questions to repair streak for free."""
        from ..models import PracticeSession
        from datetime import datetime, timedelta

        week_ago = datetime.utcnow() - timedelta(days=7)
        recent_sessions = PracticeSession.query.filter(
            PracticeSession.user_id == user_id,
            PracticeSession.status == 'completed',
            PracticeSession.completed_at >= week_ago
        ).all()

        total_questions = sum(s.answered or 0 for s in recent_sessions)
        if total_questions < 20:
            return {'error': f'Answer at least 20 questions to repair. You have done {total_questions} this week.'}

        streak = Streak.query.filter_by(user_id=user_id).first()
        error = StreakService._apply_repair(streak)
        if error:
            return error
        streak.repairs_used = (streak.repairs_used or 0) + 1
        db.session.commit()
        return streak.to_dict()

    @staticmethod
    def repair_points(user_id):
        """Repair streak using points."""
        user = User.query.get(user_id)
        streak = Streak.query.filter_by(user_id=user_id).first()
        cost = StreakService.REPAIR_COST

        if not user or not streak:
            return {'error': 'Streak record not found'}

        if (user.points_balance or 0) < cost:
            return {'error': f'Insufficient points. Need {cost} points.'}

        error = StreakService._apply_repair(streak)
        if error:
            return error

        user.points_balance -= cost
        streak.repairs_used = (streak.repairs_used or 0) + 1

        from ..models import PointTransaction
        t = PointTransaction(
            user_id=user_id, amount=-cost, action='repair_streak',
            description='Repaired streak with points',
            balance_after=user.points_balance
        )
        db.session.add(t)
        db.session.commit()

        result = streak.to_dict()
        result['points_balance'] = user.points_balance
        return result
