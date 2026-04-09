import uuid
from datetime import datetime
from sqlalchemy.dialects.postgresql import UUID
from ..extensions import db


class AdminAuditLog(db.Model):
    __tablename__ = 'admin_audit_logs'

    id          = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    admin_id    = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'), nullable=False)
    action      = db.Column(db.String(100), nullable=False)
    target_type = db.Column(db.String(50))
    target_id   = db.Column(UUID(as_uuid=True))
    event_metadata = db.Column(db.JSON)
    ip_address  = db.Column(db.String(100))
    user_agent  = db.Column(db.String(255))
    created_at  = db.Column(db.DateTime, default=datetime.utcnow)

    admin = db.relationship('User', backref='admin_audit_logs')

    def to_dict(self):
        return {
            'id': str(self.id),
            'admin_id': str(self.admin_id),
            'action': self.action,
            'target_type': self.target_type,
            'target_id': str(self.target_id) if self.target_id else None,
            'metadata': self.event_metadata or {},
            'ip_address': self.ip_address,
            'user_agent': self.user_agent,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
