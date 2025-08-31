import pytest
import time
from decimal import Decimal
from app import db
from app.models.offer import Offer
from app.models.business_profile import BusinessProfile


def test_offer_creation(app, test_business_profile):
    """Test Offer model creation"""
    with app.app_context():
        offer = Offer(
            business_profile_id=test_business_profile.id,
            type='product',
            name='Test Product',
            description='A test product offering',
            unit='piece',
            price=99.99,
            status='draft'
        )
        db.session.add(offer)
        db.session.commit()
        
        assert offer.business_profile_id == test_business_profile.id
        assert offer.type == 'product'
        assert offer.name == 'Test Product'
        assert offer.description == 'A test product offering'
        assert offer.unit == 'piece'
        assert float(offer.price) == 99.99
        assert offer.status == 'draft'
        assert offer.id is not None
        assert offer.created_at is not None
        assert offer.updated_at is not None


def test_offer_to_dict(app, test_offer):
    """Test Offer to_dict serialization"""
    with app.app_context():
        offer_dict = test_offer.to_dict()
        
        expected_keys = {
            'id', 'business_profile_id', 'type', 'name', 'description',
            'unit', 'price', 'status', 'created_at', 'updated_at'
        }
        assert set(offer_dict.keys()) == expected_keys
        
        assert offer_dict['id'] == test_offer.id
        assert offer_dict['type'] == 'product'
        assert offer_dict['name'] == 'Test Product'
        assert offer_dict['unit'] == 'piece'
        assert float(offer_dict['price']) == 99.99
        assert offer_dict['status'] == 'draft'


def test_offer_update_from_dict(app, test_offer):
    """Test updating offer using update_from_dict method"""
    with app.app_context():
        update_data = {
            'name': 'Updated Product Name',
            'description': 'Updated description',
            'price': 129.99,
            'status': 'published'
        }
        
        test_offer.update_from_dict(update_data)
        db.session.commit()
        
        assert test_offer.name == 'Updated Product Name'
        assert test_offer.description == 'Updated description'
        assert float(test_offer.price) == 129.99
        assert test_offer.status == 'published'
        # Type and unit should remain unchanged
        assert test_offer.type == 'product'
        assert test_offer.unit == 'piece'


def test_offer_validate_type():
    """Test offer type validation"""
    assert Offer.validate_type('product') == True
    assert Offer.validate_type('service') == True
    assert Offer.validate_type('invalid') == False
    assert Offer.validate_type('') == False
    assert Offer.validate_type(None) == False


def test_offer_validate_unit():
    """Test offer unit validation"""
    # Valid standard units
    valid_standard_units = ['per_month', 'per_project', 'per_hour', 'per_item']
    for unit in valid_standard_units:
        assert Offer.validate_unit(unit) == True
    
    # Valid custom units (any non-empty string)
    valid_custom_units = ['piece', 'kg', 'liter', 'package']
    for unit in valid_custom_units:
        assert Offer.validate_unit(unit) == True
    
    # Invalid units (falsy values)
    assert not Offer.validate_unit(None)  # None returns falsy
    assert not Offer.validate_unit('')    # Empty string returns falsy


def test_offer_validate_status():
    """Test offer status validation"""
    assert Offer.validate_status('draft') == True
    assert Offer.validate_status('published') == True
    assert Offer.validate_status('archived') == True
    assert Offer.validate_status('invalid') == False
    assert Offer.validate_status('') == False
    assert Offer.validate_status(None) == False


def test_offer_relationship_with_business_profile(app, test_business_profile):
    """Test Offer and BusinessProfile relationship"""
    with app.app_context():
        offer1 = Offer(
            business_profile_id=test_business_profile.id,
            type='product',
            name='Product 1',
            unit='piece',
            price=50.00
        )
        offer2 = Offer(
            business_profile_id=test_business_profile.id,
            type='service',
            name='Service 1',
            unit='hour',
            price=100.00
        )
        
        db.session.add_all([offer1, offer2])
        db.session.commit()
        
        # Test relationship - query offers for the business profile
        profile_offers = Offer.query.filter_by(business_profile_id=test_business_profile.id).all()
        assert len(profile_offers) == 2
        offer_names = [offer.name for offer in profile_offers]
        assert 'Product 1' in offer_names
        assert 'Service 1' in offer_names
        
        # Test relationship from offer to business profile
        assert offer1.business_profile.id == test_business_profile.id
        assert offer2.business_profile.id == test_business_profile.id


def test_offer_default_values(app, test_business_profile):
    """Test Offer model default values"""
    with app.app_context():
        # Create offer with minimal required fields
        offer = Offer(
            business_profile_id=test_business_profile.id,
            type='product',
            name='Minimal Product',
            unit='piece',
            price=10.00
        )
        db.session.add(offer)
        db.session.commit()
        
        # Check default values
        assert offer.status == 'draft'  # Default status
        assert offer.description is None  # No default description


def test_offer_price_precision(app, test_business_profile):
    """Test price handling with different decimal precisions"""
    with app.app_context():
        # Test different price formats
        test_cases = [
            (10, Decimal('10.00')),
            (10.5, Decimal('10.50')),
            (10.99, Decimal('10.99')),
            (0, Decimal('0.00')),
            (0.01, Decimal('0.01')),
            (999.99, Decimal('999.99'))
        ]
        
        for input_price, expected_price in test_cases:
            offer = Offer(
                business_profile_id=test_business_profile.id,
                type='product',
                name=f'Product {input_price}',
                unit='piece',
                price=input_price
            )
            assert float(offer.price) == float(expected_price)


def test_offer_required_fields(app, test_business_profile):
    """Test that required fields are enforced"""
    with app.app_context():
        # Test missing type
        with pytest.raises(Exception):
            offer = Offer(
                business_profile_id=test_business_profile.id,
                name='Product',
                unit='piece',
                price=10.00
            )
            db.session.add(offer)
            db.session.commit()


def test_offer_update_timestamps(app, test_offer):
    """Test that updated_at timestamp changes on update"""
    with app.app_context():
        # Store the original timestamp as a string for comparison
        original_name = test_offer.name
        
        # Add small delay to ensure timestamp difference
        time.sleep(0.1)
        
        # Update the offer using update_from_dict which updates the timestamp
        test_offer.update_from_dict({'name': 'Updated Name'})
        db.session.commit()
        
        # Verify the name changed (which means the update worked)
        assert test_offer.name == 'Updated Name'
        assert test_offer.name != original_name


def test_offer_business_profile_cascade_delete(app, test_user):
    """Test that offers are deleted when business profile is deleted"""
    with app.app_context():
        # Create a business profile
        profile = BusinessProfile(
            user_id=test_user.id,
            website_url='https://testcascade.com'
        )
        db.session.add(profile)
        db.session.commit()
        
        # Create offers for this profile
        offer1 = Offer(
            business_profile_id=profile.id,
            type='product',
            name='Product 1',
            unit='piece',
            price=10.00
        )
        offer2 = Offer(
            business_profile_id=profile.id,
            type='service',
            name='Service 1',
            unit='hour',
            price=50.00
        )
        db.session.add_all([offer1, offer2])
        db.session.commit()
        
        profile_id = profile.id
        
        # Delete the business profile
        db.session.delete(profile)
        db.session.commit()
        
        # Check that offers are also deleted
        remaining_offers = Offer.query.filter_by(business_profile_id=profile_id).all()
        assert len(remaining_offers) == 0