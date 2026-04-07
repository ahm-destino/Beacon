import uuid
from datetime import datetime, timedelta
from sqlalchemy.dialects.postgresql import UUID
from ..extensions import db


class FlashcardDeck(db.Model):
    """
    A collection of flashcards (e.g., from PDF, topic, or manual creation).
    """
    __tablename__ = 'flashcard_decks'

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'), nullable=False)
    
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    subject = db.Column(db.String(50))
    topic = db.Column(db.String(100))
    
    # Source tracking
    source_type = db.Column(db.String(30))  # pdf, ai_tutor, concept, manual, wrong_answer
    source_id = db.Column(UUID(as_uuid=True))  # ID of source document/question
    
    # Stats
    total_cards = db.Column(db.Integer, default=0)
    mastered_cards = db.Column(db.Integer, default=0)
    
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = db.relationship('User', backref='flashcard_decks')
    cards = db.relationship('Flashcard', backref='deck', cascade='all, delete-orphan',
                           lazy='dynamic')

    def update_stats(self):
        """Recalculate deck statistics."""
        self.total_cards = self.cards.count()
        self.mastered_cards = self.cards.filter_by(is_mastered=True).count()

    def to_dict(self, include_cards=False):
        data = {
            'id': str(self.id),
            'name': self.name,
            'description': self.description,
            'subject': self.subject,
            'topic': self.topic,
            'source_type': self.source_type,
            'total_cards': self.total_cards,
            'mastered_cards': self.mastered_cards,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
        if include_cards:
            data['cards'] = [c.to_dict() for c in self.cards.all()]
        return data


class Flashcard(db.Model):
    """
    Individual flashcard with spaced repetition scheduling.
    Uses SM-2 algorithm (SuperMemo 2) for review scheduling.
    """
    __tablename__ = 'flashcards'

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    deck_id = db.Column(UUID(as_uuid=True), db.ForeignKey('flashcard_decks.id'), nullable=False)
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'), nullable=False)
    
    # Card content
    front = db.Column(db.Text, nullable=False)  # Question/prompt
    back = db.Column(db.Text, nullable=False)   # Answer/explanation
    hint = db.Column(db.Text)  # Optional hint
    context = db.Column(db.Text)  # Additional context (e.g., from which question)
    
    # Source tracking
    source_type = db.Column(db.String(30))  # ai_tutor, concept, question, document, manual
    source_id = db.Column(UUID(as_uuid=True))  # Original question/conversation ID
    
    # SM-2 Algorithm Fields
    interval = db.Column(db.Integer, default=0)  # Days until next review
    repetitions = db.Column(db.Integer, default=0)  # Successful review count
    ease_factor = db.Column(db.Float, default=2.5)  # Ease factor (starts at 2.5)
    
    # Scheduling
    next_review_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_reviewed_at = db.Column(db.DateTime)
    
    # Status
    is_mastered = db.Column(db.Boolean, default=False)  # After ~5 successful reviews
    is_suspended = db.Column(db.Boolean, default=False)
    
    # Stats
    total_reviews = db.Column(db.Integer, default=0)
    correct_reviews = db.Column(db.Integer, default=0)
    streak = db.Column(db.Integer, default=0)  # Consecutive correct reviews
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = db.relationship('User', backref='flashcards')
    reviews = db.relationship('FlashcardReview', backref='flashcard', cascade='all, delete-orphan',
                             lazy='dynamic', order_by='FlashcardReview.created_at.desc()')

    def apply_review(self, quality):
        """
        Apply SM-2 algorithm based on review quality (0-5).
        
        Quality: 0=complete blackout, 1=incorrect but recognized, 2=incorrect but easy,
                 3=correct with difficulty, 4=correct with hesitation, 5=perfect
        """
        # Update stats
        self.total_reviews += 1
        if quality >= 3:
            self.correct_reviews += 1
            self.streak += 1
        else:
            self.streak = 0

        # SM-2 Algorithm
        if quality < 3:
            self.repetitions = 0
            self.interval = 0
        else:
            self.repetitions += 1
            if self.repetitions == 1:
                self.interval = 1
            elif self.repetitions == 2:
                self.interval = 6
            else:
                self.interval = round(self.interval * self.ease_factor)

        # Update ease factor
        self.ease_factor = max(1.3, self.ease_factor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))

        # Check if mastered (5+ successful reviews)
        self.is_mastered = self.repetitions >= 5

        # Schedule next review
        self.next_review_at = datetime.utcnow() + timedelta(days=self.interval)
        self.last_reviewed_at = datetime.utcnow()

        return self.interval

    def is_due(self):
        """Check if card is due for review."""
        return not self.is_suspended and not self.is_mastered and self.next_review_at <= datetime.utcnow()

    def to_dict(self, include_reviews=False):
        data = {
            'id': str(self.id),
            'deck_id': str(self.deck_id),
            'front': self.front,
            'back': self.back,
            'hint': self.hint,
            'context': self.context,
            'source_type': self.source_type,
            'interval': self.interval,
            'repetitions': self.repetitions,
            'ease_factor': self.ease_factor,
            'next_review_at': self.next_review_at.isoformat() if self.next_review_at else None,
            'last_reviewed_at': self.last_reviewed_at.isoformat() if self.last_reviewed_at else None,
            'is_mastered': self.is_mastered,
            'is_suspended': self.is_suspended,
            'is_due': self.is_due(),
            'total_reviews': self.total_reviews,
            'correct_reviews': self.correct_reviews,
            'streak': self.streak,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
        if include_reviews:
            data['reviews'] = [r.to_dict() for r in self.reviews.limit(10).all()]
        return data


class FlashcardReview(db.Model):
    """
    Record of each flashcard review attempt.
    """
    __tablename__ = 'flashcard_reviews'

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    flashcard_id = db.Column(UUID(as_uuid=True), db.ForeignKey('flashcards.id'), nullable=False)
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'), nullable=False)
    
    quality = db.Column(db.Integer, nullable=False)  # 0-5 rating
    time_spent = db.Column(db.Integer)  # seconds to answer
    
    # Current state at time of review
    interval_before = db.Column(db.Integer)
    ease_factor_before = db.Column(db.Float)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    user = db.relationship('User', backref='flashcard_reviews')

    def to_dict(self):
        return {
            'id': str(self.id),
            'flashcard_id': str(self.flashcard_id),
            'quality': self.quality,
            'time_spent': self.time_spent,
            'interval_before': self.interval_before,
            'ease_factor_before': self.ease_factor_before,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
