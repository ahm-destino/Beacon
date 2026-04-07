import uuid
from datetime import datetime
from sqlalchemy.dialects.postgresql import UUID
from ..extensions import db


class ChallengeAnswer(db.Model):
    """
    Individual answers submitted during a challenge.
    Enables detailed analysis and per-question time tracking.
    """
    __tablename__ = 'challenge_answers'

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    challenge_id = db.Column(UUID(as_uuid=True), db.ForeignKey('challenges.id'), nullable=False)
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'), nullable=False)
    question_id = db.Column(UUID(as_uuid=True), db.ForeignKey('questions.id'), nullable=False)
    
    selected_option = db.Column(db.String(1))  # A, B, C, D
    is_correct = db.Column(db.Boolean)
    time_spent = db.Column(db.Integer)  # seconds spent on this question
    
    answered_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    challenge = db.relationship('Challenge', backref='answers')
    user = db.relationship('User', backref='challenge_answers')
    question = db.relationship('Question')

    def to_dict(self):
        return {
            'id': str(self.id),
            'challenge_id': str(self.challenge_id),
            'user_id': str(self.user_id),
            'question_id': str(self.question_id),
            'selected_option': self.selected_option,
            'is_correct': self.is_correct,
            'time_spent': self.time_spent,
            'answered_at': self.answered_at.isoformat() if self.answered_at else None,
        }


class StudyEvent(db.Model):
    """
    Real-time study tracking for analytics.
    Every single study action is recorded silently.
    """
    __tablename__ = 'study_events'

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'), nullable=False)
    
    # Action classification
    action_type = db.Column(db.String(50), nullable=False)
    # answer_correct, answer_wrong, session_start, session_complete,
    # video_watched, flashcard_reviewed, challenge_accepted, etc.
    
    # Context
    subject = db.Column(db.String(50))
    topic = db.Column(db.String(100))
    difficulty = db.Column(db.String(10))  # easy, medium, hard
    
    # Performance data
    is_correct = db.Column(db.Boolean)
    time_spent = db.Column(db.Integer)  # seconds
    score = db.Column(db.Float)  # percentage if applicable
    
    # Related entities
    session_id = db.Column(UUID(as_uuid=True), db.ForeignKey('practice_sessions.id'))
    challenge_id = db.Column(UUID(as_uuid=True), db.ForeignKey('challenges.id'))
    question_id = db.Column(UUID(as_uuid=True), db.ForeignKey('questions.id'))
    
    # Flexible metadata storage
    event_metadata = db.Column(db.JSON, default=dict)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    user = db.relationship('User', backref='study_events')
    session = db.relationship('PracticeSession')
    challenge = db.relationship('Challenge')
    question = db.relationship('Question')

    def to_dict(self):
        return {
            'id': str(self.id),
            'action_type': self.action_type,
            'subject': self.subject,
            'topic': self.topic,
            'difficulty': self.difficulty,
            'is_correct': self.is_correct,
            'time_spent': self.time_spent,
            'score': self.score,
            'metadata': self.event_metadata,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
