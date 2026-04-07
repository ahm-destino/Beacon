import uuid
from datetime import datetime
from sqlalchemy.dialects.postgresql import UUID
from ..extensions import db


class LeagueRoom(db.Model):
    """
    A specific room of ~50 users competing in a specific tier 
    for the current week (Season).
    """
    __tablename__ = 'league_rooms'

    id              = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tier            = db.Column(db.String(20), default='Bronze') 
    # Bronze, Silver, Gold, Platinum, Sapphire, Ruby, Emerald, Amethyst, Pearl, Obsidian, Diamond
    
    season_id       = db.Column(db.String(50))   # e.g. "2024-W15"
    room_number     = db.Column(db.Integer, default=1)
    is_active       = db.Column(db.Boolean, default=True)
    created_at      = db.Column(db.DateTime, default=datetime.utcnow)

    members         = db.relationship('LeagueMember', backref='room', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': str(self.id),
            'tier': self.tier,
            'season_id': self.season_id,
            'room_number': self.room_number,
            'is_active': self.is_active,
            'member_count': len(self.members),
        }


class LeagueMember(db.Model):
    """
    Tracks a user's participation and points within a specific room.
    """
    __tablename__ = 'league_members'

    id              = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    room_id         = db.Column(UUID(as_uuid=True), db.ForeignKey('league_rooms.id'))
    user_id         = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'))
    
    # These points reset every season (week)
    points          = db.Column(db.Integer, default=0)
    
    joined_at       = db.Column(db.DateTime, default=datetime.utcnow)
    last_active     = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user            = db.relationship('User', foreign_keys=[user_id])

    __table_args__ = (db.UniqueConstraint('room_id', 'user_id'),)

    def to_dict(self, include_user=False):
        data = {
            'id': str(self.id),
            'room_id': str(self.room_id),
            'user_id': str(self.user_id),
            'points': self.points,
            'joined_at': self.joined_at.isoformat() if self.joined_at else None,
        }
        if include_user and self.user:
            data['user_name'] = self.user.full_name
            data['user_photo'] = self.user.profile_photo_url
        return data
