import uuid
from datetime import datetime
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from ..extensions import db


class Conversation(db.Model):
    __tablename__ = 'conversations'

    id              = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id         = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'))
    title           = db.Column(db.String(200))
    subject         = db.Column(db.String(50))
    topic           = db.Column(db.String(100))
    message_count   = db.Column(db.Integer, default=0)
    summary         = db.Column(db.Text)
    is_archived     = db.Column(db.Boolean, default=False)
    created_at      = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at      = db.Column(db.DateTime, onupdate=datetime.utcnow)

    messages        = db.relationship('Message', backref='conversation', cascade='all, delete-orphan',
                                      order_by='Message.created_at')

    def to_dict(self, include_messages=False):
        data = {
            'id': str(self.id),
            'user_id': str(self.user_id),
            'title': self.title,
            'subject': self.subject,
            'topic': self.topic,
            'message_count': self.message_count,
            'summary': self.summary,
            'is_archived': self.is_archived,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
        if include_messages:
            data['messages'] = [m.to_dict() for m in self.messages]
        return data


class Message(db.Model):
    __tablename__ = 'messages'

    id                  = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_id     = db.Column(UUID(as_uuid=True), db.ForeignKey('conversations.id'))
    role                = db.Column(db.String(10))   # user or assistant
    content             = db.Column(db.Text, nullable=False)
    explanation_level   = db.Column(db.String(10))
    input_mode          = db.Column(db.String(10))   # chat, scan, write, voice
    tokens_used         = db.Column(db.Integer)
    created_at          = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': str(self.id),
            'role': self.role,
            'content': self.content,
            'explanation_level': self.explanation_level,
            'input_mode': self.input_mode,
            'tokens_used': self.tokens_used,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
