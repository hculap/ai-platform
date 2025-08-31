from .. import db
from datetime import datetime, timezone
import uuid

class Offer(db.Model):
    __tablename__ = 'offers'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    business_profile_id = db.Column(db.String(36), db.ForeignKey('business_profiles.id'), nullable=False)
    type = db.Column(db.String(20), nullable=False)  # 'product' or 'service'
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    unit = db.Column(db.String(50), nullable=False)  # 'per_month', 'per_project', 'per_hour', 'per_item', etc.
    price = db.Column(db.Numeric(10, 2), nullable=False)
    status = db.Column(db.String(20), default='draft')  # 'draft', 'published', 'archived'
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationship with BusinessProfile
    business_profile = db.relationship('BusinessProfile', backref=db.backref('offers', lazy=True, cascade='all, delete-orphan'))

    def __init__(self, business_profile_id, type, name, description=None, unit=None, price=None, status='draft'):
        self.business_profile_id = business_profile_id
        self.type = type
        self.name = name
        self.description = description
        self.unit = unit
        self.price = price
        self.status = status

    def to_dict(self):
        return {
            'id': self.id,
            'business_profile_id': self.business_profile_id,
            'type': self.type,
            'name': self.name,
            'description': self.description,
            'unit': self.unit,
            'price': float(self.price) if self.price else None,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

    def update_from_dict(self, data):
        """Update offer fields from dictionary data"""
        allowed_fields = ['type', 'name', 'description', 'unit', 'price', 'status']
        for field in allowed_fields:
            if field in data:
                setattr(self, field, data[field])
        self.updated_at = datetime.now(timezone.utc)

    @staticmethod
    def validate_type(offer_type):
        """Validate offer type"""
        return offer_type in ['product', 'service']

    @staticmethod
    def validate_status(status):
        """Validate offer status"""
        return status in ['draft', 'published', 'archived']

    @staticmethod
    def validate_unit(unit):
        """Validate offer unit"""
        standard_units = ['per_month', 'per_project', 'per_hour', 'per_item']
        # Allow standard units or custom units (any non-empty string)
        return unit and (unit in standard_units or isinstance(unit, str))

    def __repr__(self):
        return f'<Offer {self.name} ({self.type})>'