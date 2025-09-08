from .. import db
from datetime import datetime, timezone
import uuid
import json

class UserStyle(db.Model):
    __tablename__ = 'user_styles'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    business_profile_id = db.Column(db.String(36), db.ForeignKey('business_profiles.id'), nullable=True)
    language = db.Column(db.String(10), nullable=False)
    
    # User-defined name for the style (e.g., "My Blog Voice", "Professional Emails")
    style_name = db.Column(db.String(255), nullable=True)
    
    # Store original sample texts for reference
    sample_texts = db.Column(db.Text, nullable=True)  # JSON string
    
    # Store the complete style analysis as JSON
    style_card = db.Column(db.Text, nullable=False)  # JSON string
    
    # Metadata
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    user = db.relationship('User', backref=db.backref('user_styles', lazy=True))
    business_profile = db.relationship('BusinessProfile', backref=db.backref('user_styles', lazy=True))
    scripts = db.relationship('Script', backref='style', lazy=True)

    def __init__(self, user_id, language, style_card, style_name=None, sample_texts=None, business_profile_id=None):
        self.user_id = user_id
        self.business_profile_id = business_profile_id
        self.language = language
        self.style_name = style_name
        self.sample_texts = json.dumps(sample_texts) if isinstance(sample_texts, (dict, list)) else sample_texts
        self.style_card = json.dumps(style_card) if isinstance(style_card, dict) else style_card

    @property
    def style_card_dict(self):
        """Get style_card as a dictionary"""
        return json.loads(self.style_card) if self.style_card else {}

    @style_card_dict.setter
    def style_card_dict(self, value):
        """Set style_card from a dictionary"""
        self.style_card = json.dumps(value) if isinstance(value, dict) else value

    @property
    def sample_texts_dict(self):
        """Get sample_texts as a dictionary/list"""
        return json.loads(self.sample_texts) if self.sample_texts else []

    @sample_texts_dict.setter
    def sample_texts_dict(self, value):
        """Set sample_texts from a dictionary/list"""
        self.sample_texts = json.dumps(value) if isinstance(value, (dict, list)) else value

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'business_profile_id': self.business_profile_id,
            'language': self.language,
            'style_name': self.style_name,
            'sample_texts': self.sample_texts_dict,
            'style_card': self.style_card_dict,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

    def update_from_dict(self, data):
        """Update user style fields from dictionary data"""
        allowed_fields = ['language', 'style_card', 'style_name', 'sample_texts', 'business_profile_id']
        for field in allowed_fields:
            if field in data:
                if field == 'style_card':
                    self.style_card_dict = data[field]
                elif field == 'sample_texts':
                    self.sample_texts_dict = data[field]
                else:
                    setattr(self, field, data[field])
        self.updated_at = datetime.now(timezone.utc)

    def __repr__(self):
        return f'<UserStyle {self.id} ({self.language})>'