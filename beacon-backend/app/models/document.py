import uuid
from datetime import datetime
from sqlalchemy.dialects.postgresql import UUID
from ..extensions import db


class Document(db.Model):
    __tablename__ = 'documents'

    id              = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id         = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'))
    filename        = db.Column(db.String(255))
    file_url        = db.Column(db.String(500))
    file_size       = db.Column(db.Integer)      # bytes
    page_count      = db.Column(db.Integer)
    subject         = db.Column(db.String(50))
    status          = db.Column(db.String(20), default='processing')
    # processing, complete, failed
    summary         = db.Column(db.Text)
    key_concepts    = db.Column(db.JSON)
    flashcards      = db.Column(db.JSON)
    quiz_questions  = db.Column(db.JSON)
    processing_time = db.Column(db.Float)
    created_at      = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self, full=False):
        data = {
            'id': str(self.id),
            'user_id': str(self.user_id),
            'filename': self.filename,
            'file_url': self.file_url,
            'file_size': self.file_size,
            'page_count': self.page_count,
            'subject': self.subject,
            'status': self.status,
            'summary': self.summary,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
        if full:
            data['key_concepts'] = self.key_concepts
            data['flashcards'] = self.flashcards
            data['quiz_questions'] = self.quiz_questions
            data['processing_time'] = self.processing_time
            
            # Optionally attach sections if loaded
            if hasattr(self, 'sections') and self.sections:
                data['sections'] = [s.to_dict() for s in self.sections]
        return data


class DocumentSection(db.Model):
    __tablename__ = 'document_sections'

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = db.Column(UUID(as_uuid=True), db.ForeignKey('documents.id', ondelete='CASCADE'), nullable=False)
    
    order_index = db.Column(db.Integer)
    topic = db.Column(db.String(255))
    subtopic = db.Column(db.String(255))
    
    content_text = db.Column(db.Text)
    summary = db.Column(db.Text)
    flashcards = db.Column(db.JSON)
    quiz_questions = db.Column(db.JSON)
    key_concepts = db.Column(db.JSON, default=list) # List of extracted academic tags
    status = db.Column(db.String(20), default='pending') # pending, complete, failed
    
    # Vector embedding for Personal RAG - stored as Text locally due to Windows postgres restrictions
    embedding = db.Column(db.Text)
        
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationship back to Document
    document = db.relationship('Document', backref=db.backref('sections', lazy='dynamic', cascade='all, delete-orphan'))

    def to_dict(self):
        return {
            'id': str(self.id),
            'document_id': str(self.document_id),
            'order_index': self.order_index,
            'topic': self.topic,
            'subtopic': self.subtopic,
            'content_text': self.content_text,
            'summary': self.summary,
            'flashcards': self.flashcards,
            'quiz_questions': self.quiz_questions,
            'key_concepts': self.key_concepts or [],
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

