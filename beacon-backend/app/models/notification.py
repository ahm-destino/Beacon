import uuid
from datetime import datetime
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from ..extensions import db


class Notification(db.Model):
    __tablename__ = 'notifications'

    id          = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id     = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'))
    type        = db.Column(db.String(50))
    title       = db.Column(db.String(200))
    body        = db.Column(db.Text)
    data        = db.Column(db.JSON)         # deep link data
    is_read     = db.Column(db.Boolean, default=False)
    sent_via    = db.Column(ARRAY(db.String))  # push, sms, in_app
    created_at  = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': str(self.id),
            'type': self.type,
            'title': self.title,
            'body': self.body,
            'data': self.data,
            'is_read': self.is_read,
            'sent_via': self.sent_via or [],
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class NotificationPreference(db.Model):
    __tablename__ = 'notification_preferences'

    id          = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id     = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'), unique=True)
    # Streak
    streak_risk         = db.Column(db.Boolean, default=True)
    streak_milestone    = db.Column(db.Boolean, default=True)
    streak_broken       = db.Column(db.Boolean, default=True)
    # Study Plan
    study_daily         = db.Column(db.Boolean, default=True)
    study_behind        = db.Column(db.Boolean, default=True)
    study_reviews       = db.Column(db.Boolean, default=True)
    # Performance
    perf_prediction     = db.Column(db.Boolean, default=True)
    perf_weak           = db.Column(db.Boolean, default=True)
    perf_badge          = db.Column(db.Boolean, default=True)
    perf_exam           = db.Column(db.Boolean, default=True)
    # Social
    social_challenge    = db.Column(db.Boolean, default=True)
    social_rank         = db.Column(db.Boolean, default=True)
    social_community    = db.Column(db.Boolean, default=True)
    social_buddy        = db.Column(db.Boolean, default=True)
    # Motivational
    moti_inactive       = db.Column(db.Boolean, default=True)
    moti_summary        = db.Column(db.Boolean, default=True)
    moti_monday         = db.Column(db.Boolean, default=True)
    # DND
    dnd_enabled         = db.Column(db.Boolean, default=False)
    dnd_from            = db.Column(db.String(5), default='22:00')
    dnd_to              = db.Column(db.String(5), default='08:00')
    weekend_mode        = db.Column(db.Boolean, default=False)
    # Push token
    fcm_token           = db.Column(db.String(500))

    def to_dict(self):
        return {
            'streak_risk': self.streak_risk,
            'streak_milestone': self.streak_milestone,
            'streak_broken': self.streak_broken,
            'study_daily': self.study_daily,
            'study_behind': self.study_behind,
            'study_reviews': self.study_reviews,
            'perf_prediction': self.perf_prediction,
            'perf_weak': self.perf_weak,
            'perf_badge': self.perf_badge,
            'perf_exam': self.perf_exam,
            'social_challenge': self.social_challenge,
            'social_rank': self.social_rank,
            'social_community': self.social_community,
            'social_buddy': self.social_buddy,
            'moti_inactive': self.moti_inactive,
            'moti_summary': self.moti_summary,
            'moti_monday': self.moti_monday,
            'dnd_enabled': self.dnd_enabled,
            'dnd_from': self.dnd_from,
            'dnd_to': self.dnd_to,
            'weekend_mode': self.weekend_mode,
        }
