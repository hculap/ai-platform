from .. import db
from datetime import datetime, timezone
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
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

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
        # Handle both direct analysis data and OpenAI response format
        if isinstance(analysis_data, dict):
            # Check if this is an OpenAI response with business_profile key
            if 'business_profile' in analysis_data:
                business_profile_data = analysis_data['business_profile']
            else:
                business_profile_data = analysis_data

            # Handle case where business_profile_data itself has the fields we need
            if isinstance(business_profile_data, dict):
                # Check if this is the old error format with description containing JSON
                if 'description' in business_profile_data and business_profile_data.get('description'):
                    description = business_profile_data['description']
                    if isinstance(description, str):
                        try:
                            # Try to parse the JSON from the description field
                            import json
                            parsed_data = json.loads(description)
                            if isinstance(parsed_data, dict):
                                # Use the parsed data
                                business_profile_data = parsed_data
                        except (json.JSONDecodeError, ValueError):
                            # If parsing fails, use the description as offer_description
                            pass

                # Map fields to model fields
                self.name = business_profile_data.get('name') or business_profile_data.get('company_name')
                self.website_url = business_profile_data.get('website_url', self.website_url)
                self.offer_description = (business_profile_data.get('offer') or
                                        business_profile_data.get('offer_description') or
                                        business_profile_data.get('description'))
                # target_customer field maps from avatar or target_customer
                self.target_customer = (business_profile_data.get('avatar') or
                                      business_profile_data.get('target_customer') or
                                      business_profile_data.get('customer_avatar') or
                                      business_profile_data.get('persona'))
                self.problem_solved = business_profile_data.get('problems') or business_profile_data.get('problem_solved')
                self.customer_desires = business_profile_data.get('desires') or business_profile_data.get('customer_desires')
                self.brand_tone = business_profile_data.get('tone') or business_profile_data.get('brand_tone')
                self.communication_language = business_profile_data.get('language', 'pl')

        self.analysis_status = 'completed'
        self.updated_at = datetime.now(timezone.utc)
