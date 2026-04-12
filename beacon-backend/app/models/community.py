import uuid
from datetime import datetime, timedelta
from sqlalchemy.dialects.postgresql import UUID
from ..extensions import db
from ..utils.helpers import utc_iso


class CommunityQuestion(db.Model):
    __tablename__ = 'community_questions'

    id              = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id         = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'))
    subject         = db.Column(db.String(50))
    topic           = db.Column(db.String(100))
    exam_type       = db.Column(db.String(20))
    title           = db.Column(db.String(300))
    body            = db.Column(db.Text)
    image_url       = db.Column(db.String(500))
    views           = db.Column(db.Integer, default=0)
    answer_count    = db.Column(db.Integer, default=0)
    best_answer_id  = db.Column(UUID(as_uuid=True))
    is_resolved     = db.Column(db.Boolean, default=False)
    is_removed      = db.Column(db.Boolean, default=False)
    created_at      = db.Column(db.DateTime, default=datetime.utcnow)

    answers         = db.relationship('CommunityAnswer', backref='question', cascade='all, delete-orphan')
    author          = db.relationship('User', foreign_keys=[user_id])

    def to_dict(self):
        return {
            'id': str(self.id),
            'user_id': str(self.user_id),
            'author_name': self.author.full_name if self.author else None,
            'author_photo': self.author.profile_photo_url if self.author else None,
            'subject': self.subject,
            'topic': self.topic,
            'exam_type': self.exam_type,
            'title': self.title,
            'body': self.body,
            'image_url': self.image_url,
            'views': self.views,
            'answer_count': self.answer_count,
            'is_resolved': self.is_resolved,
            'created_at': utc_iso(self.created_at),
        }


class CommunityAnswer(db.Model):
    __tablename__ = 'community_answers'

    id              = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    question_id     = db.Column(UUID(as_uuid=True), db.ForeignKey('community_questions.id'))
    user_id         = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'))
    body            = db.Column(db.Text)
    upvotes         = db.Column(db.Integer, default=0)
    is_best_answer  = db.Column(db.Boolean, default=False)
    is_removed      = db.Column(db.Boolean, default=False)
    created_at      = db.Column(db.DateTime, default=datetime.utcnow)

    author          = db.relationship('User', foreign_keys=[user_id])

    def to_dict(self):
        return {
            'id': str(self.id),
            'question_id': str(self.question_id),
            'user_id': str(self.user_id),
            'author_name': self.author.full_name if self.author else None,
            'author_photo': self.author.profile_photo_url if self.author else None,
            'body': self.body,
            'upvotes': self.upvotes,
            'is_best_answer': self.is_best_answer,
            'created_at': utc_iso(self.created_at),
        }


class StudyBuddy(db.Model):
    __tablename__ = 'study_buddies'

    id          = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id     = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'))
    buddy_id    = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'))
    status      = db.Column(db.String(20), default='pending')
    # pending, active, ended
    created_at  = db.Column(db.DateTime, default=datetime.utcnow)

    user        = db.relationship('User', foreign_keys=[user_id])
    buddy       = db.relationship('User', foreign_keys=[buddy_id])

    # NOTE: UniqueConstraint removed to allow multiple study buddies per user.


class StudyBuddyMessage(db.Model):
    __tablename__ = 'study_buddy_messages'

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    sender_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'), nullable=False)
    recipient_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'), nullable=False)
    body = db.Column(db.Text, nullable=False)
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    sender = db.relationship('User', foreign_keys=[sender_id])
    recipient = db.relationship('User', foreign_keys=[recipient_id])

    def to_dict(self):
        return {
            'id': str(self.id),
            'sender_id': str(self.sender_id),
            'recipient_id': str(self.recipient_id),
            'body': self.body,
            'is_read': self.is_read,
            'created_at': utc_iso(self.created_at),
        }


class Referral(db.Model):
    __tablename__ = 'referrals'

    id              = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    referrer_id     = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'))
    referred_id     = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'))
    referral_code   = db.Column(db.String(20))
    status          = db.Column(db.String(20), default='signed_up')
    # signed_up, active, subscribed
    points_awarded  = db.Column(db.Integer, default=0)
    created_at      = db.Column(db.DateTime, default=datetime.utcnow)


class Challenge(db.Model):
    __tablename__ = 'challenges'

    id                      = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    challenger_id           = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'), nullable=False)
    opponent_id             = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'), nullable=False)
    subject                 = db.Column(db.String(50), nullable=False)
    exam_type               = db.Column(db.String(20), default='JAMB')
    question_count          = db.Column(db.Integer, default=20)
    status                  = db.Column(db.String(20), default='pending')
    # pending, active, completed, declined
    question_ids            = db.Column(db.ARRAY(UUID(as_uuid=True)))
    challenger_answers      = db.Column(db.JSON, default=dict)
    opponent_answers        = db.Column(db.JSON, default=dict)
    challenger_score        = db.Column(db.Float)
    opponent_score          = db.Column(db.Float)
    challenger_completed_at = db.Column(db.DateTime)
    opponent_completed_at   = db.Column(db.DateTime)
    expires_at              = db.Column(db.DateTime)  # 24h window after first completion
    winner_id               = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'))
    created_at              = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at              = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    challenger              = db.relationship('User', foreign_keys=[challenger_id])
    opponent                = db.relationship('User', foreign_keys=[opponent_id])

    def _public_user(self, user):
        if not user:
            return None
        initials = ''.join([p[:1] for p in (user.full_name or '').split()[:2]]).upper() or 'U'
        return {
            'id': str(user.id),
            'name': user.full_name,
            'avatar': initials,
            'photo': user.profile_photo_url,
        }

    def to_dict(self, current_user_id=None):
        challenger_answers = self.challenger_answers or {}
        opponent_answers = self.opponent_answers or {}

        my_role = None
        if current_user_id:
            if str(self.challenger_id) == str(current_user_id):
                my_role = 'challenger'
            elif str(self.opponent_id) == str(current_user_id):
                my_role = 'opponent'

        def answered_count(answer_map):
            if not isinstance(answer_map, dict):
                return 0
            return len([v for v in answer_map.values() if v])

        challenger_progress = answered_count(challenger_answers)
        opponent_progress = answered_count(opponent_answers)
        total = self.question_count or 1

        my_completed = (
            self.challenger_completed_at is not None if my_role == 'challenger'
            else self.opponent_completed_at is not None
        )
        opponent_completed = (
            self.opponent_completed_at is not None if my_role == 'challenger'
            else self.challenger_completed_at is not None
        )

        return {
            'id': str(self.id),
            'subject': self.subject,
            'exam_type': self.exam_type,
            'question_count': self.question_count,
            'status': self.status,
            'challenger': self._public_user(self.challenger),
            'opponent': self._public_user(self.opponent),
            'my_role': my_role,
            'challenger_progress': round((challenger_progress / total) * 100),
            'opponent_progress': round((opponent_progress / total) * 100),
            'challenger_score': self.challenger_score,
            'opponent_score': self.opponent_score,
            'my_completed': my_completed,
            'opponent_completed': opponent_completed,
            'current_user_id': str(current_user_id) if current_user_id else None,
            'winner_id': str(self.winner_id) if self.winner_id else None,
            'expires_at': utc_iso(self.expires_at),
            'created_at': utc_iso(self.created_at),
            'updated_at': utc_iso(self.updated_at),
        }


class StudySession(db.Model):
    __tablename__ = 'study_sessions'

    id              = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    host_id         = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'), nullable=False)
    subject         = db.Column(db.String(50), nullable=False)
    topic           = db.Column(db.String(100))
    limit           = db.Column(db.Integer, default=5)
    participant_ids = db.Column(db.ARRAY(UUID(as_uuid=True)), default=list)
    status          = db.Column(db.String(20), default='active')  # active, expired, completed
    created_at      = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at      = db.Column(db.DateTime)

    host            = db.relationship('User', foreign_keys=[host_id])

    def to_dict(self):
        return {
            'id': str(self.id),
            'host_id': str(self.host_id),
            'host_name': self.host.full_name if self.host else 'Student',
            'host_photo': self.host.profile_photo_url if self.host else None,
            'subject': self.subject,
            'topic': self.topic,
            'limit': self.limit,
            'participant_count': len(self.participant_ids) if self.participant_ids else 0,
            'status': self.status,
            'created_at': utc_iso(self.created_at),
            'expires_at': utc_iso(self.expires_at),
        }
