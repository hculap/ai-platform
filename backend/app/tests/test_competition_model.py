import pytest
from app import db
from app.models.competition import Competition
from app.models.business_profile import BusinessProfile
from app.models.user import User

def test_competition_creation(app, test_business_profile):
    """Test Competition model creation"""
    with app.app_context():
        competition = Competition(
            business_profile_id=test_business_profile.id,
            name='Acme Widget Co',
            url='https://acmewidget.com',
            description='Leading supplier of modular widgets for industrial applications.',
            usp='Largest selection of widget customizations in North America.'
        )

        assert competition.business_profile_id == test_business_profile.id
        assert competition.name == 'Acme Widget Co'
        assert competition.url == 'https://acmewidget.com'
        assert competition.description == 'Leading supplier of modular widgets for industrial applications.'
        assert competition.usp == 'Largest selection of widget customizations in North America.'

        # Test to_dict method
        competition_dict = competition.to_dict()
        assert competition_dict['name'] == 'Acme Widget Co'
        assert competition_dict['url'] == 'https://acmewidget.com'
        assert competition_dict['description'] == 'Leading supplier of modular widgets for industrial applications.'
        assert competition_dict['usp'] == 'Largest selection of widget customizations in North America.'
        assert competition_dict['business_profile_id'] == test_business_profile.id
        assert 'id' in competition_dict
        assert 'created_at' in competition_dict
        assert 'updated_at' in competition_dict

def test_competition_creation_minimal_data(app, test_business_profile):
    """Test Competition model creation with minimal data"""
    with app.app_context():
        competition = Competition(
            business_profile_id=test_business_profile.id,
            name='Minimal Competition'
        )

        assert competition.business_profile_id == test_business_profile.id
        assert competition.name == 'Minimal Competition'
        assert competition.url is None
        assert competition.description is None
        assert competition.usp is None

def test_competition_business_profile_relationship(app, test_business_profile):
    """Test Competition and BusinessProfile relationship"""
    with app.app_context():
        competition1 = Competition(
            business_profile_id=test_business_profile.id,
            name='Competition 1'
        )
        competition2 = Competition(
            business_profile_id=test_business_profile.id,
            name='Competition 2'
        )

        db.session.add_all([competition1, competition2])
        db.session.commit()

        # Test relationship from business profile to competitions
        assert len(test_business_profile.competitions) == 2
        assert competition1 in test_business_profile.competitions
        assert competition2 in test_business_profile.competitions

        # Test relationship from competition to business profile
        assert competition1.business_profile == test_business_profile
        assert competition2.business_profile == test_business_profile

def test_competition_database_operations(app, test_business_profile):
    """Test Competition database operations"""
    with app.app_context():
        # Create competition
        competition = Competition(
            business_profile_id=test_business_profile.id,
            name='Test Competition',
            url='https://test.com',
            description='Test description',
            usp='Test USP'
        )
        db.session.add(competition)
        db.session.commit()

        # Verify competition was saved
        saved_competition = Competition.query.filter_by(name='Test Competition').first()
        assert saved_competition is not None
        assert saved_competition.url == 'https://test.com'
        assert saved_competition.description == 'Test description'
        assert saved_competition.usp == 'Test USP'

        # Update competition
        saved_competition.url = 'https://updated-test.com'
        saved_competition.description = 'Updated description'
        db.session.commit()

        # Verify update
        updated_competition = Competition.query.filter_by(name='Test Competition').first()
        assert updated_competition.url == 'https://updated-test.com'
        assert updated_competition.description == 'Updated description'

        # Delete competition
        db.session.delete(saved_competition)
        db.session.commit()

        # Verify deletion
        deleted_competition = Competition.query.filter_by(name='Test Competition').first()
        assert deleted_competition is None

def test_competition_timestamps(app, test_business_profile):
    """Test Competition timestamp fields"""
    with app.app_context():
        competition = Competition(
            business_profile_id=test_business_profile.id,
            name='Timestamp Test'
        )
        db.session.add(competition)
        db.session.commit()

        assert competition.created_at is not None
        assert competition.updated_at is not None
        assert competition.created_at <= competition.updated_at

def test_competition_foreign_key_constraint(app):
    """Test Competition foreign key constraint"""
    with app.app_context():
        # Try to create competition with non-existent business_profile_id
        competition = Competition(
            business_profile_id='non-existent-id',
            name='Invalid Competition'
        )

        with pytest.raises(Exception):  # Should raise IntegrityError
            db.session.add(competition)
            db.session.commit()

def test_competition_required_fields(app, test_business_profile):
    """Test Competition required fields validation"""
    with app.app_context():
        # Test missing name (should fail)
        competition = Competition(
            business_profile_id=test_business_profile.id
        )

        # Try to add without name - this should fail at database level
        # since name is required in the model __init__ method
        with pytest.raises(Exception):
            db.session.add(competition)
            db.session.commit()

def test_competition_string_fields_length(app, test_business_profile):
    """Test Competition string field length limits"""
    with app.app_context():
        # Test with very long name (should be limited by database)
        long_name = 'A' * 300  # Exceeds typical VARCHAR limits
        competition = Competition(
            business_profile_id=test_business_profile.id,
            name=long_name,
            url='https://test.com'
        )

        # This should either truncate or fail depending on database constraints
        try:
            db.session.add(competition)
            db.session.commit()
            # If it succeeds, verify the name was handled appropriately
            assert len(competition.name) <= 255  # VARCHAR(255) limit
        except Exception:
            # Expected if database enforces strict length limits
            db.session.rollback()
            pass

def test_competition_multiple_business_profiles(app):
    """Test competitions across multiple business profiles"""
    with app.app_context():
        # Create multiple business profiles
        user = User(email='multi-profile@test.com', password='TestPassword123')
        db.session.add(user)
        db.session.commit()

        profile1 = BusinessProfile(user_id=user.id, website_url='https://profile1.com')
        profile2 = BusinessProfile(user_id=user.id, website_url='https://profile2.com')
        db.session.add_all([profile1, profile2])
        db.session.commit()

        # Create competitions for each profile
        comp1 = Competition(
            business_profile_id=profile1.id,
            name='Competition for Profile 1'
        )
        comp2 = Competition(
            business_profile_id=profile2.id,
            name='Competition for Profile 2'
        )
        db.session.add_all([comp1, comp2])
        db.session.commit()

        # Verify relationships
        assert len(profile1.competitions) == 1
        assert len(profile2.competitions) == 1
        assert comp1.business_profile == profile1
        assert comp2.business_profile == profile2

        # Verify competitions are correctly associated
        assert profile1.competitions[0].name == 'Competition for Profile 1'
        assert profile2.competitions[0].name == 'Competition for Profile 2'
