from .. import db
from datetime import datetime, timezone
import uuid
import json

class Campaign(db.Model):
    __tablename__ = 'campaigns'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    business_profile_id = db.Column(db.String(36), db.ForeignKey('business_profiles.id'), nullable=False)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    
    # Input fields
    goal = db.Column(db.String(100), nullable=False)  # 'Brand Awareness', 'Lead Generation', etc.
    budget = db.Column(db.Numeric(12, 2), nullable=True)  # Optional budget
    deadline = db.Column(db.Date, nullable=True)  # Optional campaign end date
    selected_products = db.Column(db.JSON, nullable=True, default=list)  # Array of product IDs
    
    # Generated output fields
    strategy_summary = db.Column(db.Text)
    timeline = db.Column(db.Text)  # Timeline/harmonogram
    target_audience = db.Column(db.Text)
    sales_funnel_steps = db.Column(db.Text)
    channels = db.Column(db.JSON, nullable=True, default=dict)  # Channel selection (boolean map)
    channels_rationale = db.Column(db.JSON, nullable=True, default=dict)  # Channel justifications
    recommended_budget = db.Column(db.Numeric(12, 2), nullable=True)  # Only if budget not provided
    risks_recommendations = db.Column(db.Text)
    
    # Metadata
    status = db.Column(db.String(20), default='draft')  # 'draft', 'published', 'archived'
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    business_profile = db.relationship('BusinessProfile', backref=db.backref('campaigns', lazy=True, cascade='all, delete-orphan'))
    user = db.relationship('User', backref=db.backref('campaigns', lazy=True))

    # Goal options enum
    GOAL_OPTIONS = [
        'Brand Awareness',
        'Lead Generation', 
        'Sales / Conversions',
        'Product Launch',
        'Customer Retention & Loyalty',
        'Event Promotion',
        'Rebranding / Reputation Management',
        'Community Engagement'
    ]
    
    # Available channels
    AVAILABLE_CHANNELS = [
        'facebook', 'instagram', 'linkedin', 'google_ads', 'youtube', 
        'tiktok', 'email', 'influencers', 'events', 'seo', 'pr_media', 'community_forums'
    ]

    def __init__(self, business_profile_id, user_id, goal, budget=None, deadline=None, 
                 selected_products=None, status='draft'):
        self.business_profile_id = business_profile_id
        self.user_id = user_id
        self.goal = goal
        self.budget = budget
        self.deadline = deadline
        self.selected_products = selected_products or []
        self.status = status

    def to_dict(self):
        return {
            'id': self.id,
            'business_profile_id': self.business_profile_id,
            'user_id': self.user_id,
            'goal': self.goal,
            'budget': float(self.budget) if self.budget else None,
            'deadline': self.deadline.isoformat() if self.deadline else None,
            'selected_products': self.selected_products or [],
            'strategy_summary': self.strategy_summary,
            'timeline': self.timeline,
            'target_audience': self.target_audience,
            'sales_funnel_steps': self.sales_funnel_steps,
            'channels': self.channels or {},
            'channels_rationale': self.channels_rationale or {},
            'recommended_budget': float(self.recommended_budget) if self.recommended_budget else None,
            'risks_recommendations': self.risks_recommendations,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

    def update_from_dict(self, data):
        """Update campaign fields from dictionary data"""
        allowed_fields = [
            'goal', 'budget', 'deadline', 'selected_products', 'strategy_summary',
            'timeline', 'target_audience', 'sales_funnel_steps', 'channels',
            'channels_rationale', 'recommended_budget', 'risks_recommendations', 'status'
        ]
        for field in allowed_fields:
            if field in data:
                setattr(self, field, data[field])
        self.updated_at = datetime.now(timezone.utc)

    @staticmethod
    def validate_goal(goal):
        """Validate campaign goal"""
        return goal in Campaign.GOAL_OPTIONS

    @staticmethod
    def validate_status(status):
        """Validate campaign status"""
        return status in ['draft', 'published', 'archived']

    @staticmethod
    def validate_channels(channels):
        """Validate channels object"""
        if not isinstance(channels, dict):
            return False
        for channel in channels.keys():
            if channel not in Campaign.AVAILABLE_CHANNELS:
                return False
        return True

    def __repr__(self):
        return f'<Campaign {self.goal} for {self.business_profile_id}>'