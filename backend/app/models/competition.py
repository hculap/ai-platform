from .. import db
from datetime import datetime, timezone
import uuid

class Competition(db.Model):
    __tablename__ = 'competitions'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    business_profile_id = db.Column(db.String(36), db.ForeignKey('business_profiles.id'), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    url = db.Column(db.String(500))
    description = db.Column(db.Text)
    usp = db.Column(db.Text)  # Unique Selling Proposition
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationship with BusinessProfile
    business_profile = db.relationship('BusinessProfile', backref=db.backref('competitions', lazy=True))

    def __init__(self, business_profile_id, name, url=None, description=None, usp=None):
        self.business_profile_id = business_profile_id
        self.name = name
        self.url = url
        self.description = description
        self.usp = usp

    def to_dict(self):
        return {
            'id': self.id,
            'business_profile_id': self.business_profile_id,
            'name': self.name,
            'url': self.url,
            'description': self.description,
            'usp': self.usp,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
