import uuid
from datetime import datetime, date
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from ..extensions import db


class Streak(db.Model):
    __tablename__ = 'streaks'

    id                  = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id             = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'), unique=True)
    current_streak      = db.Column(db.Integer, default=0)
    longest_streak      = db.Column(db.Integer, default=0)
    total_study_days    = db.Column(db.Integer, default=0)
    streak_start_date   = db.Column(db.Date)
    last_study_date     = db.Column(db.Date)
    freezes_remaining   = db.Column(db.Integer, default=0)
    freezes_used        = db.Column(db.Integer, default=0)
    repairs_used        = db.Column(db.Integer, default=0)
    broken_count        = db.Column(db.Integer, default=0)
    perfect_weeks       = db.Column(db.Integer, default=0)
    society_tier        = db.Column(db.String(20), default='none')
    # none, blazer, warrior, champion, legend
    milestones_earned   = db.Column(ARRAY(db.String), default=list)
    previous_streak     = db.Column(db.Integer)
    streak_broken_date  = db.Column(db.Date)
    updated_at          = db.Column(db.DateTime, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': str(self.id),
            'user_id': str(self.user_id),
            'current_streak': self.current_streak,
            'longest_streak': self.longest_streak,
            'total_study_days': self.total_study_days,
            'streak_start_date': self.streak_start_date.isoformat() if self.streak_start_date else None,
            'last_study_date': self.last_study_date.isoformat() if self.last_study_date else None,
            'freezes_remaining': self.freezes_remaining,
            'freezes_used': self.freezes_used,
            'repairs_used': self.repairs_used,
            'broken_count': self.broken_count,
            'perfect_weeks': self.perfect_weeks,
            'society_tier': self.society_tier,
            'milestones_earned': self.milestones_earned or [],
            'previous_streak': self.previous_streak,
            'streak_broken_date': self.streak_broken_date.isoformat() if self.streak_broken_date else None,
        }


class StreakHistory(db.Model):
    __tablename__ = 'streak_history'

    id              = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id         = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'))
    date            = db.Column(db.Date, nullable=False)
    status          = db.Column(db.String(20))
    # studied, freeze_used, missed, repair_used
    questions_done  = db.Column(db.Integer, default=0)
    minutes_studied = db.Column(db.Integer, default=0)
    points_earned   = db.Column(db.Integer, default=0)

    __table_args__ = (db.UniqueConstraint('user_id', 'date'),)

    def to_dict(self):
        return {
            'date': self.date.isoformat(),
            'status': self.status,
            'questions_done': self.questions_done,
            'minutes_studied': self.minutes_studied,
            'points_earned': self.points_earned,
        }


class QuestionState(db.Model):
    """Spaced Repetition state per user per question."""
    __tablename__ = 'question_states'

    id              = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id         = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'))
    question_id     = db.Column(UUID(as_uuid=True), db.ForeignKey('questions.id'))
    memory_state    = db.Column(db.String(20), default='new')
    # new, learning, reviewing, known, mastered
    ease_factor     = db.Column(db.Float, default=2.5)
    interval_days   = db.Column(db.Integer, default=1)
    next_review     = db.Column(db.Date)
    times_reviewed  = db.Column(db.Integer, default=0)
    times_correct   = db.Column(db.Integer, default=0)
    last_reviewed   = db.Column(db.DateTime)

    __table_args__ = (db.UniqueConstraint('user_id', 'question_id'),)
