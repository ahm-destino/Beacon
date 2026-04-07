import uuid
from datetime import datetime
from sqlalchemy.dialects.postgresql import UUID
from ..extensions import db


class TopicPerformance(db.Model):
    """
    Tracks user performance per subject/topic for automatic weak areas detection.
    Updated in real-time after EVERY answer submitted.
    """
    __tablename__ = 'topic_performance'

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'), nullable=False)
    subject = db.Column(db.String(50), nullable=False)
    topic = db.Column(db.String(100), nullable=False)
    
    # Performance metrics
    total_attempts = db.Column(db.Integer, default=0)
    correct_answers = db.Column(db.Integer, default=0)
    accuracy = db.Column(db.Float, default=0.0)  # 0-100
    
    # Trend analysis
    trend = db.Column(db.String(20), default='stable')  # improving, declining, stable
    total_time_spent = db.Column(db.Integer, default=0)  # seconds
    
    # Weak area flag (auto-calculated)
    is_weak_area = db.Column(db.Boolean, default=False)
    
    last_attempted = db.Column(db.DateTime, default=datetime.utcnow)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = db.relationship('User', backref='topic_performances')

    __table_args__ = (
        db.UniqueConstraint('user_id', 'subject', 'topic', name='uix_user_subject_topic'),
    )

    def calculate_accuracy(self):
        """Recalculate accuracy percentage."""
        if self.total_attempts > 0:
            self.accuracy = round((self.correct_answers / self.total_attempts) * 100, 1)
        else:
            self.accuracy = 0.0
        return self.accuracy

    def update_weak_area_status(self):
        """
        Mark as weak area if accuracy < 70% with 5+ attempts.
        Strong areas have accuracy >= 80% with 5+ attempts.
        """
        if self.total_attempts >= 5:
            self.is_weak_area = self.accuracy < 70
        else:
            self.is_weak_area = False

    def calculate_trend(self, recent_accuracy, previous_accuracy):
        """
        Calculate trend based on recent vs previous performance.
        Threshold: 10% difference
        """
        if recent_accuracy is None or previous_accuracy is None:
            self.trend = 'stable'
        elif recent_accuracy > previous_accuracy + 10:
            self.trend = 'improving'
        elif recent_accuracy < previous_accuracy - 10:
            self.trend = 'declining'
        else:
            self.trend = 'stable'

    def to_dict(self):
        return {
            'id': str(self.id),
            'user_id': str(self.user_id),
            'subject': self.subject,
            'topic': self.topic,
            'total_attempts': self.total_attempts,
            'correct_answers': self.correct_answers,
            'accuracy': self.accuracy,
            'trend': self.trend,
            'total_time_spent': self.total_time_spent,
            'is_weak_area': self.is_weak_area,
            'last_attempted': self.last_attempted.isoformat() if self.last_attempted else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class ConceptConfidence(db.Model):
    """
    User's self-reported confidence rating for specific concepts.
    Used to personalize study recommendations.
    """
    __tablename__ = 'concept_confidence'

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'), nullable=False)
    concept = db.Column(db.String(200), nullable=False)  # Concept name/topic
    subject = db.Column(db.String(50))
    rating = db.Column(db.Integer, default=0)  # 0=not at all, 1=little, 2=pretty well, 3=got it
    rated_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    user = db.relationship('User', backref='concept_confidences')

    __table_args__ = (
        db.UniqueConstraint('user_id', 'concept', name='uix_user_concept'),
    )

    def to_dict(self):
        return {
            'id': str(self.id),
            'concept': self.concept,
            'subject': self.subject,
            'rating': self.rating,
            'rating_label': self.get_rating_label(),
            'rated_at': self.rated_at.isoformat() if self.rated_at else None,
        }

    def get_rating_label(self):
        labels = {
            0: 'Not at all',
            1: 'A little',
            2: 'Pretty well',
            3: "I've got this!"
        }
        return labels.get(self.rating, 'Unknown')
