import uuid
from datetime import datetime
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from ..extensions import db


class LiteratureText(db.Model):
    """
    Prescribed literature texts for WAEC/NECO/JAMB.
    Novels, Drama, Poetry collections.
    """
    __tablename__ = 'literature_texts'

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Basic info
    title = db.Column(db.String(200), nullable=False)
    author = db.Column(db.String(100))
    text_type = db.Column(db.String(20))  # novel, drama, poetry
    
    # Exam bodies that prescribe this text
    exam_bodies = db.Column(ARRAY(db.String))  # ['WAEC', 'NECO', 'JAMB']
    year_published = db.Column(db.Integer)
    
    # AI-generated content
    summary = db.Column(db.Text)
    themes = db.Column(db.JSON, default=list)  # List of theme dicts
    characters = db.Column(db.JSON, default=list)  # List of character analyses
    writing_style = db.Column(db.Text)
    
    # Media
    cover_url = db.Column(db.String(500))
    
    # Status
    is_active = db.Column(db.Boolean, default=True)
    is_approved = db.Column(db.Boolean, default=False)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    chapters = db.relationship('LiteratureChapter', backref='text', cascade='all, delete-orphan',
                            lazy='dynamic', order_by='LiteratureChapter.number')
    progress_records = db.relationship('UserLiteratureProgress', backref='text', cascade='all, delete-orphan')

    def to_dict(self, include_chapters=False):
        data = {
            'id': str(self.id),
            'title': self.title,
            'author': self.author,
            'text_type': self.text_type,
            'exam_bodies': self.exam_bodies or [],
            'year_published': self.year_published,
            'summary': self.summary,
            'themes': self.themes or [],
            'characters': self.characters or [],
            'writing_style': self.writing_style,
            'cover_url': self.cover_url,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
        if include_chapters:
            data['chapters'] = [c.to_dict() for c in self.chapters.all()]
        else:
            data['chapter_count'] = self.chapters.count()
        return data


class LiteratureChapter(db.Model):
    """
    Individual chapters/acts/poems within a literature text.
    """
    __tablename__ = 'literature_chapters'

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    text_id = db.Column(UUID(as_uuid=True), db.ForeignKey('literature_texts.id'), nullable=False)
    
    number = db.Column(db.Integer)  # Chapter number, Act number, or poem number
    title = db.Column(db.String(200))
    
    # AI-generated content
    summary = db.Column(db.Text)
    key_events = db.Column(db.JSON, default=list)  # List of key events
    quotes = db.Column(db.JSON, default=list)  # Important quotes with explanations
    
    # Quiz questions for this chapter
    quiz_questions = db.Column(db.JSON, default=list)  # AI-generated MCQ + essay
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self, include_quiz=False):
        data = {
            'id': str(self.id),
            'text_id': str(self.text_id),
            'number': self.number,
            'title': self.title,
            'summary': self.summary,
            'key_events': self.key_events or [],
            'quotes': self.quotes or [],
        }
        if include_quiz:
            data['quiz_questions'] = self.quiz_questions or []
        return data


class UserLiteratureProgress(db.Model):
    """
    Track user's reading progress through literature texts.
    """
    __tablename__ = 'user_literature_progress'

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'), nullable=False)
    text_id = db.Column(UUID(as_uuid=True), db.ForeignKey('literature_texts.id'), nullable=False)
    
    # Progress tracking
    chapters_completed = db.Column(ARRAY(db.Integer), default=list)  # List of completed chapter numbers
    overall_progress = db.Column(db.Float, default=0.0)  # 0-100 percentage
    
    # Status
    status = db.Column(db.String(20), default='reading')  # reading, completed
    
    # Activity tracking
    last_accessed = db.Column(db.DateTime, default=datetime.utcnow)
    started_at = db.Column(db.DateTime, default=datetime.utcnow)
    completed_at = db.Column(db.DateTime)
    
    # Quiz scores
    quiz_attempts = db.Column(db.Integer, default=0)
    quiz_total_score = db.Column(db.Float, default=0.0)
    
    # Relationships
    user = db.relationship('User', backref='literature_progress')

    __table_args__ = (
        db.UniqueConstraint('user_id', 'text_id', name='uix_user_literature_text'),
    )

    def calculate_progress(self, total_chapters):
        """Calculate progress percentage based on chapters completed."""
        if total_chapters > 0:
            self.overall_progress = round((len(self.chapters_completed or []) / total_chapters) * 100, 1)
        else:
            self.overall_progress = 0.0
        
        # Auto-update status
        if self.overall_progress >= 100:
            self.status = 'completed'
            if not self.completed_at:
                self.completed_at = datetime.utcnow()
        
        return self.overall_progress

    def mark_chapter_complete(self, chapter_number):
        """Mark a chapter as completed."""
        if self.chapters_completed is None:
            self.chapters_completed = []
        
        if chapter_number not in self.chapters_completed:
            self.chapters_completed.append(chapter_number)
            self.chapters_completed.sort()
        
        self.last_accessed = datetime.utcnow()

    def to_dict(self):
        return {
            'id': str(self.id),
            'text_id': str(self.text_id),
            'text_title': self.text.title if self.text else None,
            'chapters_completed': self.chapters_completed or [],
            'overall_progress': self.overall_progress,
            'status': self.status,
            'last_accessed': self.last_accessed.isoformat() if self.last_accessed else None,
            'started_at': self.started_at.isoformat() if self.started_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'quiz_attempts': self.quiz_attempts,
            'quiz_avg_score': round(self.quiz_total_score / max(self.quiz_attempts, 1), 1),
        }


class LiteraturePastQuestion(db.Model):
    """
    Past exam questions specifically about literature texts.
    Organized by year and exam body.
    """
    __tablename__ = 'literature_past_questions'

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    text_id = db.Column(UUID(as_uuid=True), db.ForeignKey('literature_texts.id'), nullable=False)
    
    question_text = db.Column(db.Text, nullable=False)
    question_type = db.Column(db.String(20))  # mcq, essay, character, theme
    
    year = db.Column(db.Integer)
    exam_body = db.Column(db.String(20))  # WAEC, NECO, JAMB
    
    # For MCQs
    option_a = db.Column(db.Text)
    option_b = db.Column(db.Text)
    option_c = db.Column(db.Text)
    option_d = db.Column(db.Text)
    correct_answer = db.Column(db.String(1))  # A, B, C, D
    
    # For essays
    marks = db.Column(db.Integer, default=10)
    model_answer = db.Column(db.Text)
    key_points = db.Column(db.JSON, default=list)
    
    # Metadata
    topic = db.Column(db.String(100))  # e.g., "Character Analysis", "Themes"
    is_active = db.Column(db.Boolean, default=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    text = db.relationship('LiteratureText', backref='past_questions')

    def to_dict(self, include_answer=False):
        data = {
            'id': str(self.id),
            'text_id': str(self.text_id),
            'question_text': self.question_text,
            'question_type': self.question_type,
            'year': self.year,
            'exam_body': self.exam_body,
            'topic': self.topic,
            'marks': self.marks,
        }
        
        if self.question_type == 'mcq':
            data['options'] = {
                'A': self.option_a,
                'B': self.option_b,
                'C': self.option_c,
                'D': self.option_d,
            }
        
        if include_answer:
            data['correct_answer'] = self.correct_answer
            data['model_answer'] = self.model_answer
            data['key_points'] = self.key_points or []
        
        return data
