from .. import db
from datetime import datetime, timezone
import uuid

class Ad(db.Model):
    __tablename__ = 'ads'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    business_profile_id = db.Column(db.String(36), db.ForeignKey('business_profiles.id'), nullable=False)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    
    # Context - either offer_id or campaign_id (XOR constraint)
    offer_id = db.Column(db.String(36), db.ForeignKey('offers.id'), nullable=True)
    campaign_id = db.Column(db.String(36), db.ForeignKey('campaigns.id'), nullable=True)
    
    # Input fields
    platform = db.Column(db.String(50), nullable=False)  # facebook, google_search, tiktok, etc.
    format = db.Column(db.String(20), nullable=False)  # video, image, text, carousel
    action = db.Column(db.String(50), nullable=False)  # visit_page, submit_form, purchase, etc.
    
    # Creative fields
    headline = db.Column(db.String(500), nullable=True)
    primary_text = db.Column(db.Text, nullable=True)
    visual_brief = db.Column(db.Text, nullable=True)  # Image description or video storyboard
    overlay_text = db.Column(db.Text, nullable=True)  # Optional on-visual text
    script_text = db.Column(db.Text, nullable=True)  # Video script/voiceover
    cta = db.Column(db.String(100), nullable=True)  # Call-to-action text
    
    # Assets/links
    asset_url = db.Column(db.String(500), nullable=True)  # Optional image/video URL
    landing_url = db.Column(db.String(500), nullable=True)  # Required for certain actions
    
    # Metadata
    status = db.Column(db.String(20), default='draft')  # 'draft', 'published', 'archived'
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    business_profile = db.relationship('BusinessProfile', backref=db.backref('ads', lazy=True, cascade='all, delete-orphan'))
    user = db.relationship('User', backref=db.backref('ads', lazy=True))
    offer = db.relationship('Offer', backref=db.backref('ads', lazy=True))
    campaign = db.relationship('Campaign', backref=db.backref('ads', lazy=True))

    # Platform options
    PLATFORM_OPTIONS = [
        'facebook', 'google_search', 'tiktok', 'instagram', 
        'youtube', 'linkedin', 'x', 'google_display'
    ]
    
    # Format options
    FORMAT_OPTIONS = ['video', 'image', 'text', 'carousel']
    
    # Action options
    ACTION_OPTIONS = [
        'visit_page', 'submit_form', 'purchase', 'download',
        'message', 'call', 'like', 'follow'
    ]
    

    def __init__(self, business_profile_id, user_id, platform, format, action,
                 offer_id=None, campaign_id=None, headline=None, status='draft'):
        self.business_profile_id = business_profile_id
        self.user_id = user_id
        self.platform = platform
        self.format = format
        self.action = action
        self.offer_id = offer_id
        self.campaign_id = campaign_id
        self.headline = headline
        self.status = status

    def to_dict(self):
        return {
            'id': self.id,
            'business_profile_id': self.business_profile_id,
            'user_id': self.user_id,
            'offer_id': self.offer_id,
            'campaign_id': self.campaign_id,
            'platform': self.platform,
            'format': self.format,
            'action': self.action,
            'headline': self.headline,
            'primary_text': self.primary_text,
            'visual_brief': self.visual_brief,
            'overlay_text': self.overlay_text,
            'script_text': self.script_text,
            'cta': self.cta,
            'asset_url': self.asset_url,
            'landing_url': self.landing_url,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

    def update_from_dict(self, data):
        """Update ad fields from dictionary data"""
        allowed_fields = [
            'platform', 'format', 'action', 'offer_id', 'campaign_id',
            'headline', 'primary_text', 'visual_brief', 'overlay_text', 
            'script_text', 'cta', 'asset_url', 'landing_url', 'status'
        ]
        for field in allowed_fields:
            if field in data:
                setattr(self, field, data[field])
        self.updated_at = datetime.now(timezone.utc)

    @staticmethod
    def validate_platform(platform):
        """Validate ad platform"""
        return platform in Ad.PLATFORM_OPTIONS

    @staticmethod
    def validate_format(format):
        """Validate ad format"""
        return format in Ad.FORMAT_OPTIONS

    @staticmethod
    def validate_action(action):
        """Validate ad action"""
        return action in Ad.ACTION_OPTIONS

    @staticmethod
    def validate_status(status):
        """Validate ad status"""
        return status in ['draft', 'published', 'archived']
    
    @staticmethod
    def validate_context(offer_id, campaign_id):
        """Validate that exactly one context is provided"""
        return bool(offer_id) != bool(campaign_id)  # XOR - exactly one should be True
    

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
        context_type = self.get_context_type()
        context_id = self.get_context_id()
        return f'<Ad {self.platform} {self.format} for {context_type}:{context_id}>'