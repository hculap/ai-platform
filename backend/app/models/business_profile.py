from .. import db
from datetime import datetime
import uuid

class BusinessProfile(db.Model):
    __tablename__ = 'business_profiles'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    name = db.Column(db.String(255))
    website_url = db.Column(db.String(500))
    offer_description = db.Column(db.Text)
    target_customer = db.Column(db.Text)
    problem_solved = db.Column(db.Text)
    customer_desires = db.Column(db.Text)
    brand_tone = db.Column(db.String(255))
    communication_language = db.Column(db.String(10))
    analysis_status = db.Column(db.String(50), default='pending')
    is_active = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __init__(self, user_id, website_url):
        self.user_id = user_id
        self.website_url = website_url
        self.analysis_status = 'pending'
        self.is_active = False

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'website_url': self.website_url,
            'offer_description': self.offer_description,
            'target_customer': self.target_customer,
            'problem_solved': self.problem_solved,
            'customer_desires': self.customer_desires,
            'brand_tone': self.brand_tone,
            'communication_language': self.communication_language,
            'analysis_status': self.analysis_status,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

    def update_analysis_results(self, analysis_data):
        """Update profile with analysis results"""
        self.name = analysis_data.get('name')
        self.offer_description = analysis_data.get('offer_description')
        self.target_customer = analysis_data.get('target_customer')
        self.problem_solved = analysis_data.get('problem_solved')
        self.customer_desires = analysis_data.get('customer_desires')
        self.brand_tone = analysis_data.get('brand_tone')
        self.communication_language = analysis_data.get('communication_language', 'pl')
        self.analysis_status = 'completed'
        self.updated_at = datetime.utcnow()
