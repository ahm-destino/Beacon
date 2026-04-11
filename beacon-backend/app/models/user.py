import uuid
from datetime import datetime
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from ..extensions import db
from ..utils.helpers import utc_iso


class User(db.Model):
    __tablename__ = 'users'

    id                   = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    full_name            = db.Column(db.String(100), nullable=False)
    username             = db.Column(db.String(50), unique=True)
    email                = db.Column(db.String(150), unique=True, nullable=False)
    phone                = db.Column(db.String(20), unique=True)
    password_hash        = db.Column(db.String(255))
    google_id            = db.Column(db.String(100), unique=True)
    profile_photo_url    = db.Column(db.String(500))
    bio                  = db.Column(db.String(280))
    bio_visibility       = db.Column(db.String(20), default='public')
    bio_moderation_status = db.Column(db.String(20), default='approved')
    referral_code        = db.Column(db.String(20), unique=True)

    # Academic info
    class_level          = db.Column(db.String(20))   # SS2, SS3, Graduate, etc.
    state                = db.Column(db.String(50))
    school_name          = db.Column(db.String(150))
    target_course        = db.Column(db.String(100))
    target_university    = db.Column(db.String(150))

    # Exam info
    primary_exam         = db.Column(db.String(20))   # JAMB, WAEC, NECO, JUPEB
    exam_date            = db.Column(db.Date)
    subjects             = db.Column(ARRAY(db.String))

    # App preferences
    daily_question_goal  = db.Column(db.Integer, default=45)
    explanation_level    = db.Column(db.String(10), default='normal')
    language_preference  = db.Column(db.String(20), default='english')
    theme                = db.Column(db.String(10), default='light')
    font_size            = db.Column(db.String(10), default='medium')
    notifications_enabled = db.Column(db.Boolean, default=True)
    tfa_enabled          = db.Column(db.Boolean, default=False)

    # Subscription
    subscription_tier    = db.Column(db.String(20), default='seeker')
    subscription_status  = db.Column(db.String(20), default='active')
    subscription_end     = db.Column(db.DateTime)

    # Onboarding
    onboarding_completed = db.Column(db.Boolean, default=False)
    onboarding_step      = db.Column(db.Integer, default=1)
    diagnostic_completed = db.Column(db.Boolean, default=False)

    # Points & Leagues
    points_balance           = db.Column(db.Integer, default=0) # Lifetime points
    league_points            = db.Column(db.Integer, default=0) # Weekly points (resets Sunday)
    league_tier              = db.Column(db.String(20), default='Bronze')
    # Unseen league result (Mimo "Monday morning" popup)
    last_league_result       = db.Column(db.JSON, nullable=True)  # {result, tier, reward, rank}
    last_seen_league_season  = db.Column(db.String(20), nullable=True) # e.g. "2024-W15"

    # Status
    is_active            = db.Column(db.Boolean, default=True)
    is_verified          = db.Column(db.Boolean, default=False)
    is_admin             = db.Column(db.Boolean, default=False)
    is_banned            = db.Column(db.Boolean, default=False)
    last_seen            = db.Column(db.DateTime)
    created_at           = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at           = db.Column(db.DateTime, onupdate=datetime.utcnow)

    # Relationships
    streak               = db.relationship('Streak', backref='user', uselist=False)
    sessions             = db.relationship('PracticeSession', backref='user', foreign_keys='PracticeSession.user_id')
    conversations        = db.relationship('Conversation', backref='user')
    subscriptions        = db.relationship('Subscription', backref='user')
    notifications        = db.relationship('Notification', backref='user')
    badges               = db.relationship('UserBadge', backref='user')
    documents            = db.relationship('Document', backref='user')

    def to_dict(self):
        return {
            'id': str(self.id),
            'full_name': self.full_name,
            'username': self.username,
            'email': self.email,
            'phone': self.phone,
            'profile_photo_url': self.profile_photo_url,
            'bio': self.bio,
            'bio_visibility': self.bio_visibility,
            'bio_moderation_status': self.bio_moderation_status,
            'class_level': self.class_level,
            'state': self.state,
            'school_name': self.school_name,
            'target_course': self.target_course,
            'target_university': self.target_university,
            'primary_exam': self.primary_exam,
            'exam_date': self.exam_date.isoformat() if self.exam_date else None,
            'subjects': self.subjects or [],
            'daily_question_goal': self.daily_question_goal,
            'explanation_level': self.explanation_level,
            'language_preference': self.language_preference,
            'theme': self.theme,
            'font_size': self.font_size,
            'notifications_enabled': self.notifications_enabled,
            'tfa_enabled': self.tfa_enabled,
            'subscription_tier': self.subscription_tier,
            'subscription_status': self.subscription_status,
            'subscription_end': self.subscription_end.isoformat() if self.subscription_end else None,
            'onboarding_completed': self.onboarding_completed,
            'onboarding_step': self.onboarding_step,
            'diagnostic_completed': self.diagnostic_completed,
            'points_balance': self.points_balance,
            'league_points': self.league_points,
            'league_tier': self.league_tier,
            'is_active': self.is_active,
            'is_verified': self.is_verified,
            'is_admin': self.is_admin,
            'is_banned': self.is_banned,
            'referral_code': self.referral_code,
            'last_seen': utc_iso(self.last_seen),
            'created_at': utc_iso(self.created_at),
        }
