import pytest
import os
import tempfile
import sys
from pathlib import Path

# Add the current directory to Python path for imports
current_dir = Path(__file__).parent
if str(current_dir) not in sys.path:
    sys.path.insert(0, str(current_dir))

from app import create_app, db
from app.models.user import User
from app.models.business_profile import BusinessProfile
from app.models.interaction import Interaction
from app.models.competition import Competition

@pytest.fixture
def app():
    """Create and configure a test app instance."""
    app = create_app('testing')

    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()

@pytest.fixture
def client(app):
    """A test client for the app"""
    return app.test_client()

@pytest.fixture
def runner(app):
    """A test runner for the app's Click commands."""
    return app.test_cli_runner()

@pytest.fixture
def test_user(app):
    """Create a test user"""
    user = User(email='testuser@gmail.com', password='TestPassword123')
    db.session.add(user)
    db.session.commit()
    return user

@pytest.fixture
def test_user_headers(test_user, client):
    """Get authorization headers for test user"""
    # Login to get token
    response = client.post('/api/auth/login', json={
        'email': 'testuser@gmail.com',
        'password': 'TestPassword123'
    })
    data = response.get_json()
    token = data['access_token']
    return {'Authorization': f'Bearer {token}'}

@pytest.fixture
def test_business_profile(test_user):
    """Create a test business profile"""
    profile = BusinessProfile(
        user_id=test_user.id,
        website_url='https://example.com'
    )
    profile.name = 'Test Business'
    profile.analysis_status = 'completed'
    db.session.add(profile)
    db.session.commit()
    return profile

@pytest.fixture
def test_competition(test_business_profile):
    """Create a test competition"""
    competition = Competition(
        business_profile_id=test_business_profile.id,
        name='Acme Widget Co',
        url='https://acmewidget.com',
        description='Leading supplier of modular widgets for industrial applications.',
        usp='Largest selection of widget customizations in North America.'
    )
    db.session.add(competition)
    db.session.commit()
    return competition

@pytest.fixture
def test_user2(app):
    """Create a second test user"""
    with app.app_context():
        user = User(email='testuser2@gmail.com', password='TestPassword123')
        db.session.add(user)
        db.session.commit()
        return user

@pytest.fixture
def test_business_profile2(test_user2):
    """Create a test business profile for second user"""
    with app.app_context():
        profile = BusinessProfile(
            user_id=test_user2.id,
            website_url='https://example2.com'
        )
        profile.name = 'Test Business 2'
        profile.analysis_status = 'completed'
        db.session.add(profile)
        db.session.commit()
        return profile
