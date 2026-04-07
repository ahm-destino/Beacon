import uuid
from datetime import datetime
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from ..extensions import db


class PracticeSession(db.Model):
    __tablename__ = 'practice_sessions'

    id              = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id         = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'), nullable=False)
    mode            = db.Column(db.String(20))   # practice, exam, mock
    practice_type   = db.Column(db.String(20))   # subject_based, topic_based, year_based
    exam_type       = db.Column(db.String(20))
    subject         = db.Column(db.String(50))
    topic           = db.Column(db.String(100))
    year            = db.Column(db.Integer)
    difficulty      = db.Column(db.String(10))
    time_limit      = db.Column(db.Integer)      # seconds, null = no limit
    time_used       = db.Column(db.Integer)      # seconds
    total_questions = db.Column(db.Integer)
    answered        = db.Column(db.Integer, default=0)
    correct         = db.Column(db.Integer, default=0)
    score           = db.Column(db.Float)        # percentage
    status          = db.Column(db.String(20), default='in_progress')
    # in_progress, completed, abandoned
    question_ids    = db.Column(ARRAY(UUID(as_uuid=True)))
    started_at      = db.Column(db.DateTime, default=datetime.utcnow)
    completed_at    = db.Column(db.DateTime)

    answers         = db.relationship('SessionAnswer', backref='session', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': str(self.id),
            'user_id': str(self.user_id),
            'mode': self.mode,
            'practice_type': self.practice_type,
            'exam_type': self.exam_type,
            'subject': self.subject,
            'topic': self.topic,
            'year': self.year,
            'difficulty': self.difficulty,
            'time_limit': self.time_limit,
            'time_used': self.time_used,
            'total_questions': self.total_questions,
            'answered': self.answered,
            'correct': self.correct,
            'score': self.score,
            'status': self.status,
            'question_ids': [str(q) for q in (self.question_ids or [])],
            'started_at': self.started_at.isoformat() if self.started_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
        }


class SessionAnswer(db.Model):
    __tablename__ = 'session_answers'

    id              = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id      = db.Column(UUID(as_uuid=True), db.ForeignKey('practice_sessions.id'))
    user_id         = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'))
    question_id     = db.Column(UUID(as_uuid=True), db.ForeignKey('questions.id'))
    selected_option = db.Column(db.String(1))   # A, B, C, D
    is_correct      = db.Column(db.Boolean)
    time_spent      = db.Column(db.Integer)      # seconds
    is_flagged      = db.Column(db.Boolean, default=False)
    is_bookmarked   = db.Column(db.Boolean, default=False)
    answered_at     = db.Column(db.DateTime, default=datetime.utcnow)

    question        = db.relationship('Question')

    def to_dict(self):
        return {
            'id': str(self.id),
            'session_id': str(self.session_id),
            'question_id': str(self.question_id),
            'selected_option': self.selected_option,
            'is_correct': self.is_correct,
            'time_spent': self.time_spent,
            'is_flagged': self.is_flagged,
            'is_bookmarked': self.is_bookmarked,
            'answered_at': self.answered_at.isoformat() if self.answered_at else None,
        }


class Bookmark(db.Model):
    __tablename__ = 'bookmarks'

    id          = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id     = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'))
    question_id = db.Column(UUID(as_uuid=True), db.ForeignKey('questions.id'))
    created_at  = db.Column(db.DateTime, default=datetime.utcnow)

    question    = db.relationship('Question')

    __table_args__ = (db.UniqueConstraint('user_id', 'question_id'),)
