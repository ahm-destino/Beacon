import uuid
from datetime import datetime
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from ..extensions import db


class Tutor(db.Model):
    __tablename__ = 'tutors'

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'), nullable=True)
    full_name = db.Column(db.String(100), nullable=False)
    profile_photo = db.Column(db.String(500))
    subjects = db.Column(ARRAY(db.String))
    bio = db.Column(db.Text)
    location = db.Column(db.String(100))
    state = db.Column(db.String(50))
    mode = db.Column(ARRAY(db.String))  # ['online', 'in_person', 'both']
    hourly_rate = db.Column(db.Integer)  # in Naira, null = negotiable
    whatsapp = db.Column(db.String(20))
    phone = db.Column(db.String(20))
    verification_level = db.Column(db.String(20), default='basic')
    is_approved = db.Column(db.Boolean, default=False)
    average_rating = db.Column(db.Float, default=0)
    total_reviews = db.Column(db.Integer, default=0)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    reviews = db.relationship('TutorReview', backref='tutor', cascade='all, delete-orphan',
                              order_by='TutorReview.created_at.desc()')

    def to_dict(self, full=False):
        data = {
            'id': str(self.id),
            'user_id': str(self.user_id) if self.user_id else None,
            'full_name': self.full_name,
            'profile_photo': self.profile_photo,
            'subjects': self.subjects or [],
            'bio': self.bio,
            'location': self.location,
            'state': self.state,
            'mode': self.mode or [],
            'hourly_rate': self.hourly_rate,
            'verification_level': self.verification_level,
            'is_approved': self.is_approved,
            'average_rating': float(self.average_rating or 0),
            'total_reviews': int(self.total_reviews or 0),
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
        if full:
            data['whatsapp'] = self.whatsapp
            data['phone'] = self.phone
        return data


class TutorReview(db.Model):
    __tablename__ = 'tutor_reviews'

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tutor_id = db.Column(UUID(as_uuid=True), db.ForeignKey('tutors.id'))
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'))
    rating = db.Column(db.Integer, nullable=False)
    comment = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship('User')

    def to_dict(self):
        return {
            'id': str(self.id),
            'tutor_id': str(self.tutor_id),
            'user_id': str(self.user_id),
            'rating': int(self.rating),
            'comment': self.comment,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'user': {
                'id': str(self.user.id),
                'full_name': self.user.full_name,
                'profile_photo_url': self.user.profile_photo_url,
            } if self.user else None,
        }
