import uuid
from datetime import datetime
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from ..extensions import db


class Subscription(db.Model):
    __tablename__ = 'subscriptions'

    id                        = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id                   = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'))
    tier                      = db.Column(db.String(20))
    # seeker, beacon, luminary, north_star
    billing_cycle             = db.Column(db.String(10))  # monthly, annual
    amount                    = db.Column(db.Integer)      # in kobo
    currency                  = db.Column(db.String(5), default='NGN')
    status                    = db.Column(db.String(20))
    # active, cancelled, expired, past_due
    paystack_customer_id      = db.Column(db.String(100))
    paystack_subscription_id  = db.Column(db.String(100))
    paystack_authorization    = db.Column(db.String(200))
    current_period_start      = db.Column(db.DateTime)
    current_period_end        = db.Column(db.DateTime)
    cancelled_at              = db.Column(db.DateTime)
    created_at                = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': str(self.id),
            'user_id': str(self.user_id),
            'tier': self.tier,
            'billing_cycle': self.billing_cycle,
            'amount': self.amount,
            'currency': self.currency,
            'status': self.status,
            'current_period_start': self.current_period_start.isoformat() if self.current_period_start else None,
            'current_period_end': self.current_period_end.isoformat() if self.current_period_end else None,
            'cancelled_at': self.cancelled_at.isoformat() if self.cancelled_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class PointTransaction(db.Model):
    __tablename__ = 'point_transactions'

    id              = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id         = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'))
    amount          = db.Column(db.Integer)      # positive = earned, negative = spent
    action          = db.Column(db.String(50))
    description     = db.Column(db.String(200))
    reference_id    = db.Column(UUID(as_uuid=True))   # session_id, badge_id etc.
    balance_after   = db.Column(db.Integer)
    created_at      = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': str(self.id),
            'amount': self.amount,
            'action': self.action,
            'description': self.description,
            'balance_after': self.balance_after,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class Badge(db.Model):
    __tablename__ = 'badges'

    id              = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    slug            = db.Column(db.String(50), unique=True)
    name            = db.Column(db.String(100))
    description     = db.Column(db.String(255))
    icon            = db.Column(db.String(10))   # emoji
    category        = db.Column(db.String(30))
    # streak, performance, subject, challenge, social, event
    points_reward   = db.Column(db.Integer, default=0)
    requirement     = db.Column(db.JSON)

    def to_dict(self):
        return {
            'id': str(self.id),
            'slug': self.slug,
            'name': self.name,
            'description': self.description,
            'icon': self.icon,
            'category': self.category,
            'points_reward': self.points_reward,
            'requirement': self.requirement,
        }


class UserBadge(db.Model):
    __tablename__ = 'user_badges'

    id          = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id     = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'))
    badge_id    = db.Column(UUID(as_uuid=True), db.ForeignKey('badges.id'))
    earned_at   = db.Column(db.DateTime, default=datetime.utcnow)

    badge       = db.relationship('Badge')

    def to_dict(self):
        data = {'earned_at': self.earned_at.isoformat() if self.earned_at else None}
        if self.badge:
            data.update(self.badge.to_dict())
        return data
