from .. import db
from datetime import datetime, timezone
import uuid

class Script(db.Model):
    __tablename__ = 'scripts'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    business_profile_id = db.Column(db.String(36), db.ForeignKey('business_profiles.id'), nullable=False)
    style_id = db.Column(db.String(36), db.ForeignKey('user_styles.id'), nullable=True)
    
    # Script content
    title = db.Column(db.String(255), nullable=False)
    content = db.Column(db.Text, nullable=False)
    script_type = db.Column(db.String(50), nullable=False, default='general')  # 'post', 'blog', 'script', 'general'
    
    # Optional context - either offer_id or campaign_id
    offer_id = db.Column(db.String(36), db.ForeignKey('offers.id'), nullable=True)
    campaign_id = db.Column(db.String(36), db.ForeignKey('campaigns.id'), nullable=True)
    
    # Metadata
    status = db.Column(db.String(20), default='draft')  # 'draft', 'published', 'archived'
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    user = db.relationship('User', backref=db.backref('scripts', lazy=True))
    business_profile = db.relationship('BusinessProfile', backref=db.backref('scripts', lazy=True, cascade='all, delete-orphan'))
    offer = db.relationship('Offer', backref=db.backref('scripts', lazy=True))
    campaign = db.relationship('Campaign', backref=db.backref('scripts', lazy=True))

    # Script type options
    SCRIPT_TYPE_OPTIONS = ['post', 'blog', 'script', 'general']
    
    # Status options
    STATUS_OPTIONS = ['draft', 'published', 'archived']

    def __init__(self, user_id, business_profile_id, title, content, script_type='general', 
                 style_id=None, offer_id=None, campaign_id=None, status='draft'):
        self.user_id = user_id
        self.business_profile_id = business_profile_id
        self.title = title
        self.content = content
        self.script_type = script_type
        self.style_id = style_id
        self.offer_id = offer_id
        self.campaign_id = campaign_id
        self.status = status

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'business_profile_id': self.business_profile_id,
            'style_id': self.style_id,
            'title': self.title,
            'content': self.content,
            'script_type': self.script_type,
            'offer_id': self.offer_id,
            'campaign_id': self.campaign_id,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

    def update_from_dict(self, data):
        """Update script fields from dictionary data"""
        allowed_fields = [
            'title', 'content', 'script_type', 'style_id', 
            'offer_id', 'campaign_id', 'status'
        ]
        for field in allowed_fields:
            if field in data:
                setattr(self, field, data[field])
        self.updated_at = datetime.now(timezone.utc)

    @staticmethod
    def validate_script_type(script_type):
        """Validate script type"""
        return script_type in Script.SCRIPT_TYPE_OPTIONS

    @staticmethod
    def validate_status(status):
        """Validate script status"""
        return status in Script.STATUS_OPTIONS

    def get_context_type(self):
        """Get the type of context (offer or campaign)"""
        if self.offer_id:
            return 'offer'
        elif self.campaign_id:
            return 'campaign'
        return None

    def get_context_id(self):
        """Get the ID of the context"""
        return self.offer_id or self.campaign_id

    def __repr__(self):
        return f'<Script {self.title} ({self.script_type})>'