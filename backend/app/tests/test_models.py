import pytest
from app import db
from app.models.user import User
from app.models.business_profile import BusinessProfile

def test_user_creation(app):
    """Test User model creation"""
    with app.app_context():
        user = User(email='testuser@gmail.com', password='TestPassword123')

        assert user.email == 'testuser@gmail.com'
        assert user.check_password('TestPassword123')
        assert not user.check_password('WrongPassword')

        user_dict = user.to_dict()
        assert user_dict['email'] == 'testuser@gmail.com'
        assert 'id' in user_dict
        assert 'created_at' in user_dict

def test_business_profile_creation(app, test_user):
    """Test BusinessProfile model creation"""
    with app.app_context():
        profile = BusinessProfile(
            user_id=test_user.id,
            website_url='https://example.com'
        )

        assert profile.user_id == test_user.id
        assert profile.website_url == 'https://example.com'
        assert profile.analysis_status == 'pending'
        assert profile.is_active == False

        profile_dict = profile.to_dict()
        assert profile_dict['website_url'] == 'https://example.com'
        assert profile_dict['analysis_status'] == 'pending'
        assert 'id' in profile_dict

def test_business_profile_update_analysis(app, test_user):
    """Test updating business profile with analysis results"""
    with app.app_context():
        profile = BusinessProfile(
            user_id=test_user.id,
            website_url='https://example.com'
        )

        analysis_data = {
            'name': 'Test Company',
            'offer_description': 'We provide testing services',
            'target_customer': 'Developers',
            'problem_solved': 'Testing challenges',
            'customer_desires': 'Quality software',
            'brand_tone': 'Professional',
            'communication_language': 'en'
        }

        profile.update_analysis_results(analysis_data)

        assert profile.name == 'Test Company'
        assert profile.offer_description == 'We provide testing services'
        assert profile.analysis_status == 'completed'

def test_business_profile_update_analysis_openai_format(app, test_user):
    """Test updating business profile with OpenAI response format"""
    with app.app_context():
        profile = BusinessProfile(
            user_id=test_user.id,
            website_url='https://example.com'
        )

        # Simulate OpenAI response format
        openai_response = {
            'business_profile': {
                'name': 'Starbucks Coffee Company',
                'website_url': 'https://www.starbucks.com',
                'offer': 'Handcrafted coffee beverages, seasonal drinks, food items, merchandise, mobile ordering, and the Starbucks Rewards program',
                'problems': 'Long wait times, limited seating',
                'desires': 'Quality coffee, comfortable atmosphere, quick service',
                'tone': 'Warm, inviting, and enthusiastic',
                'language': 'en'
            }
        }

        profile.update_analysis_results(openai_response)

        assert profile.name == 'Starbucks Coffee Company'
        assert profile.website_url == 'https://www.starbucks.com'
        assert profile.offer_description == 'Handcrafted coffee beverages, seasonal drinks, food items, merchandise, mobile ordering, and the Starbucks Rewards program'
        assert profile.problem_solved == 'Long wait times, limited seating'
        assert profile.customer_desires == 'Quality coffee, comfortable atmosphere, quick service'
        assert profile.brand_tone == 'Warm, inviting, and enthusiastic'
        assert profile.communication_language == 'en'
        assert profile.analysis_status == 'completed'

def test_user_business_profile_relationship(app):
    """Test User and BusinessProfile relationship"""
    with app.app_context():
        user = User(email='relationship@example.com', password='TestPassword123')
        db.session.add(user)
        db.session.commit()

        profile1 = BusinessProfile(user_id=user.id, website_url='https://site1.com')
        profile2 = BusinessProfile(user_id=user.id, website_url='https://site2.com')
        db.session.add_all([profile1, profile2])
        db.session.commit()

        # Test relationship from user to profiles
        assert len(user.business_profiles) == 2
        assert profile1 in user.business_profiles
        assert profile2 in user.business_profiles

        # Test relationship from profile to user
        assert profile1.user == user
        assert profile2.user == user
