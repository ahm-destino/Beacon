import uuid
from datetime import datetime
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from ..extensions import db
try:
    from pgvector.sqlalchemy import Vector
    PGVECTOR_AVAILABLE = True
except ImportError:
    PGVECTOR_AVAILABLE = False


class Question(db.Model):
    __tablename__ = 'questions'

    id                  = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    source              = db.Column(db.String(20))   # PAST_PAPER or AI_GENERATED
    exam_type           = db.Column(db.String(20))   # JAMB, WAEC, NECO, JUPEB
    subject             = db.Column(db.String(50))
    topic               = db.Column(db.String(100))
    subtopic            = db.Column(db.String(100))
    year                = db.Column(db.Integer)
    difficulty          = db.Column(db.String(10))   # easy, medium, hard
    question_text       = db.Column(db.Text, nullable=False)
    image_url           = db.Column(db.String(500))
    option_a            = db.Column(db.Text, nullable=False)
    option_b            = db.Column(db.Text, nullable=False)
    option_c            = db.Column(db.Text, nullable=False)
    option_d            = db.Column(db.Text, nullable=False)
    correct_answer      = db.Column(db.String(1), nullable=False)  # A, B, C, D
    explanation         = db.Column(db.Text)
    explanation_steps   = db.Column(db.JSON)
    concepts            = db.Column(db.JSON, default=list) # Academic metadata tags
    common_mistake      = db.Column(db.Text)
    video_link          = db.Column(db.String(500))
    video_duration      = db.Column(db.String(10))
    times_answered      = db.Column(db.Integer, default=0)
    times_correct       = db.Column(db.Integer, default=0)
    pass_rate           = db.Column(db.Float)
    generated_for_user  = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'))
    quality_score       = db.Column(db.Float)
    is_approved         = db.Column(db.Boolean, default=True)
    report_count        = db.Column(db.Integer, default=0)
    is_active           = db.Column(db.Boolean, default=True)
    hf_enriched         = db.Column(db.Boolean, default=False)
    reference_link      = db.Column(db.Text, nullable=True)
    created_at          = db.Column(db.DateTime, default=datetime.utcnow)
    # RAG: stores a 384-dimensional embedding vector for semantic search
    embedding           = db.Column(Vector(384), nullable=True) if PGVECTOR_AVAILABLE else db.Column(db.Text, nullable=True)

    def to_dict(self, include_answer=False):
        data = {
            'id': str(self.id),
            'source': self.source,
            'exam_type': self.exam_type,
            'subject': self.subject,
            'topic': self.topic,
            'subtopic': self.subtopic,
            'concepts': self.concepts or [],
            'year': self.year,
            'difficulty': self.difficulty,
            'question_text': self.question_text,
            'image_url': self.image_url,
            'option_a': self.option_a,
            'option_b': self.option_b,
            'option_c': self.option_c,
            'option_d': self.option_d,
            'explanation': self.explanation,
            'explanation_steps': self.explanation_steps,
            'common_mistake': self.common_mistake,
            'video_link': self.video_link,
            'video_duration': self.video_duration,
            'times_answered': self.times_answered,
            'pass_rate': self.pass_rate,
        }
        if include_answer:
            data['correct_answer'] = self.correct_answer
        return data


class QuestionReport(db.Model):
    __tablename__ = 'question_reports'

    id          = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    question_id = db.Column(UUID(as_uuid=True), db.ForeignKey('questions.id'))
    user_id     = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'))
    reason      = db.Column(db.String(50))  # wrong_answer, typo, outdated, etc.
    description = db.Column(db.Text)
    is_resolved = db.Column(db.Boolean, default=False)
    created_at  = db.Column(db.DateTime, default=datetime.utcnow)
