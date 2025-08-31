import pytest
import json
from unittest.mock import patch, MagicMock
from app import db
from app.models.offer import Offer
from app.utils.messages import (
    ERROR_VALIDATION_ERROR, ERROR_NOT_FOUND, ERROR_SERVER_ERROR
)


def test_get_offers_empty(client, test_user_headers, test_business_profile):
    """Test getting empty offers list"""
    response = client.get(
        f'/api/business-profiles/{test_business_profile.id}/offers',
        headers=test_user_headers
    )
    
    assert response.status_code == 200
    data = response.get_json()
    assert 'data' in data
    assert data['data'] == []


def test_get_offers_with_data(client, test_user_headers, test_business_profile, test_offer):
    """Test getting offers with data"""
    response = client.get(
        f'/api/business-profiles/{test_business_profile.id}/offers',
        headers=test_user_headers
    )
    
    assert response.status_code == 200
    data = response.get_json()
    assert 'data' in data
    assert len(data['data']) == 1
    
    offer_data = data['data'][0]
    assert offer_data['id'] == test_offer.id
    assert offer_data['name'] == 'Test Product'
    assert offer_data['type'] == 'product'
    assert offer_data['unit'] == 'piece'
    assert float(offer_data['price']) == 99.99
    assert offer_data['status'] == 'draft'


def test_get_offers_business_profile_not_found(client, test_user_headers):
    """Test getting offers for non-existent business profile"""
    response = client.get(
        '/api/business-profiles/non-existent-id/offers',
        headers=test_user_headers
    )
    
    assert response.status_code == 404
    data = response.get_json()
    assert data['error'] == ERROR_NOT_FOUND
    assert 'Business profile not found' in data['message']


def test_get_offers_unauthorized_access(client, test_user_headers, test_business_profile2):
    """Test accessing offers of another user's business profile"""
    response = client.get(
        f'/api/business-profiles/{test_business_profile2.id}/offers',
        headers=test_user_headers
    )
    
    assert response.status_code == 404
    data = response.get_json()
    assert data['error'] == ERROR_NOT_FOUND


def test_create_offer_success(client, test_user_headers, test_business_profile):
    """Test successful offer creation"""
    offer_data = {
        'type': 'service',
        'name': 'Consulting Service',
        'description': 'Professional consulting service',
        'unit': 'hour',
        'price': 150.00,
        'status': 'draft'
    }
    
    response = client.post(
        f'/api/business-profiles/{test_business_profile.id}/offers',
        json=offer_data,
        headers=test_user_headers
    )
    
    assert response.status_code == 201
    data = response.get_json()
    assert 'id' in data
    assert 'message' in data
    assert 'successfully' in data['message']
    
    # Verify offer was created in database
    offer = Offer.query.get(data['id'])
    assert offer is not None
    assert offer.name == 'Consulting Service'
    assert offer.type == 'service'
    assert float(offer.price) == 150.00


def test_create_offer_missing_required_fields(client, test_user_headers, test_business_profile):
    """Test creating offer with missing required fields"""
    test_cases = [
        # Missing type
        {
            'name': 'Test',
            'unit': 'piece',
            'price': 10.00
        },
        # Missing name
        {
            'type': 'product',
            'unit': 'piece', 
            'price': 10.00
        },
        # Missing unit
        {
            'type': 'product',
            'name': 'Test',
            'price': 10.00
        },
        # Missing price
        {
            'type': 'product',
            'name': 'Test',
            'unit': 'piece'
        }
    ]
    
    for offer_data in test_cases:
        response = client.post(
            f'/api/business-profiles/{test_business_profile.id}/offers',
            json=offer_data,
            headers=test_user_headers
        )
        
        assert response.status_code == 400
        data = response.get_json()
        assert data['error'] == ERROR_VALIDATION_ERROR
        assert 'Missing required fields' in data['message']


def test_create_offer_invalid_type(client, test_user_headers, test_business_profile):
    """Test creating offer with invalid type"""
    offer_data = {
        'type': 'invalid_type',
        'name': 'Test Product',
        'unit': 'piece',
        'price': 10.00
    }
    
    response = client.post(
        f'/api/business-profiles/{test_business_profile.id}/offers',
        json=offer_data,
        headers=test_user_headers
    )
    
    assert response.status_code == 400
    data = response.get_json()
    assert data['error'] == ERROR_VALIDATION_ERROR
    assert 'Invalid offer type' in data['message']


def test_create_offer_invalid_unit(client, test_user_headers, test_business_profile):
    """Test creating offer with missing unit"""
    offer_data = {
        'type': 'product',
        'name': 'Test Product',
        # 'unit': '',  # Missing unit field
        'price': 10.00
    }
    
    response = client.post(
        f'/api/business-profiles/{test_business_profile.id}/offers',
        json=offer_data,
        headers=test_user_headers
    )
    
    assert response.status_code == 400
    data = response.get_json()
    assert data['error'] == ERROR_VALIDATION_ERROR
    assert 'Missing required fields' in data['message']


def test_create_offer_negative_price(client, test_user_headers, test_business_profile):
    """Test creating offer with negative price"""
    offer_data = {
        'type': 'product',
        'name': 'Test Product',
        'unit': 'piece',
        'price': -10.00
    }
    
    response = client.post(
        f'/api/business-profiles/{test_business_profile.id}/offers',
        json=offer_data,
        headers=test_user_headers
    )
    
    assert response.status_code == 400
    data = response.get_json()
    assert data['error'] == ERROR_VALIDATION_ERROR
    assert 'cannot be negative' in data['message']


def test_create_offer_invalid_price_format(client, test_user_headers, test_business_profile):
    """Test creating offer with invalid price format"""
    offer_data = {
        'type': 'product',
        'name': 'Test Product',
        'unit': 'piece',
        'price': 'not_a_number'
    }
    
    response = client.post(
        f'/api/business-profiles/{test_business_profile.id}/offers',
        json=offer_data,
        headers=test_user_headers
    )
    
    assert response.status_code == 400
    data = response.get_json()
    assert data['error'] == ERROR_VALIDATION_ERROR
    assert 'Invalid price format' in data['message']


def test_get_specific_offer_success(client, test_user_headers, test_offer):
    """Test getting specific offer"""
    response = client.get(
        f'/api/offers/{test_offer.id}',
        headers=test_user_headers
    )
    
    assert response.status_code == 200
    data = response.get_json()
    assert data['id'] == test_offer.id
    assert data['name'] == 'Test Product'
    assert data['type'] == 'product'


def test_get_specific_offer_not_found(client, test_user_headers):
    """Test getting non-existent offer"""
    response = client.get(
        '/api/offers/non-existent-id',
        headers=test_user_headers
    )
    
    assert response.status_code == 404
    data = response.get_json()
    assert data['error'] == ERROR_NOT_FOUND
    assert 'Offer not found' in data['message']


def test_update_offer_success(client, test_user_headers, test_offer):
    """Test successful offer update"""
    update_data = {
        'name': 'Updated Product Name',
        'description': 'Updated description',
        'price': 199.99,
        'status': 'published'
    }
    
    response = client.put(
        f'/api/offers/{test_offer.id}',
        json=update_data,
        headers=test_user_headers
    )
    
    assert response.status_code == 200
    data = response.get_json()
    assert 'id' in data
    assert 'updated_at' in data
    assert 'message' in data
    
    # Verify changes in database
    updated_offer = Offer.query.get(test_offer.id)
    assert updated_offer.name == 'Updated Product Name'
    assert updated_offer.description == 'Updated description'
    assert float(updated_offer.price) == 199.99
    assert updated_offer.status == 'published'


def test_update_offer_partial_update(client, test_user_headers, test_offer):
    """Test partial offer update"""
    update_data = {
        'name': 'Partially Updated Name'
    }
    
    response = client.put(
        f'/api/offers/{test_offer.id}',
        json=update_data,
        headers=test_user_headers
    )
    
    assert response.status_code == 200
    
    # Verify only name was changed
    updated_offer = Offer.query.get(test_offer.id)
    assert updated_offer.name == 'Partially Updated Name'
    assert updated_offer.type == 'product'  # Unchanged
    assert float(updated_offer.price) == 99.99  # Unchanged


def test_update_offer_invalid_validations(client, test_user_headers, test_offer):
    """Test updating offer with invalid values"""
    test_cases = [
        ({'type': 'invalid_type'}, 'Invalid offer type'),
        ({'unit': ''}, 'Invalid unit format'),  # Empty string is invalid
        ({'price': -50}, 'cannot be negative'),
        ({'price': 'invalid'}, 'Invalid price format'),
        ({'status': 'invalid_status'}, 'Invalid status')
    ]
    
    for update_data, expected_error in test_cases:
        response = client.put(
            f'/api/offers/{test_offer.id}',
            json=update_data,
            headers=test_user_headers
        )
        
        assert response.status_code == 400
        data = response.get_json()
        assert data['error'] == ERROR_VALIDATION_ERROR
        assert expected_error in data['message']


def test_delete_offer_success(client, test_user_headers, test_offer):
    """Test successful offer deletion"""
    offer_id = test_offer.id
    
    response = client.delete(
        f'/api/offers/{offer_id}',
        headers=test_user_headers
    )
    
    assert response.status_code == 200
    data = response.get_json()
    assert 'message' in data
    assert 'deleted successfully' in data['message']
    
    # Verify offer is deleted from database
    deleted_offer = Offer.query.get(offer_id)
    assert deleted_offer is None


def test_delete_offer_not_found(client, test_user_headers):
    """Test deleting non-existent offer"""
    response = client.delete(
        '/api/offers/non-existent-id',
        headers=test_user_headers
    )
    
    assert response.status_code == 404
    data = response.get_json()
    assert data['error'] == ERROR_NOT_FOUND


def test_get_offers_count_no_filter(client, test_user_headers, test_offer, test_offer_service):
    """Test getting total offers count for user"""
    response = client.get('/api/offers/count', headers=test_user_headers)
    
    assert response.status_code == 200
    data = response.get_json()
    assert 'count' in data
    assert data['count'] == 2  # Both test offers belong to the same user


def test_get_offers_count_with_business_profile_filter(client, test_user_headers, test_business_profile, test_offer):
    """Test getting offers count filtered by business profile"""
    response = client.get(
        f'/api/offers/count?business_profile_id={test_business_profile.id}',
        headers=test_user_headers
    )
    
    assert response.status_code == 200
    data = response.get_json()
    assert 'count' in data
    assert data['count'] == 1


def test_get_offers_count_business_profile_not_found(client, test_user_headers):
    """Test getting offers count with non-existent business profile"""
    response = client.get(
        '/api/offers/count?business_profile_id=non-existent-id',
        headers=test_user_headers
    )
    
    assert response.status_code == 404
    data = response.get_json()
    assert data['error'] == ERROR_NOT_FOUND


@patch('app.agents.base.AgentRegistry')
@patch('asyncio.run')
def test_generate_offers_success(mock_asyncio_run, mock_registry, client, test_user_headers, test_business_profile):
    """Test successful AI offer generation"""
    # Mock the agent and result
    mock_agent = MagicMock()
    mock_result = MagicMock()
    mock_result.success = True
    mock_result.data = {'offers_generated': 3}
    
    mock_registry.get_agent.return_value = mock_agent
    mock_registry._agents = {'offer-assistant': mock_agent}
    mock_asyncio_run.return_value = mock_result
    
    response = client.post(
        f'/api/business-profiles/{test_business_profile.id}/generate-offers',
        headers=test_user_headers
    )
    
    assert response.status_code == 200
    data = response.get_json()
    assert 'message' in data
    assert 'generated successfully' in data['message']
    assert 'data' in data


@patch('app.agents.base.AgentRegistry')
def test_generate_offers_agent_not_available(mock_registry, client, test_user_headers, test_business_profile):
    """Test offer generation when agent is not available"""
    mock_registry._agents = {}  # No agents available
    
    response = client.post(
        f'/api/business-profiles/{test_business_profile.id}/generate-offers',
        headers=test_user_headers
    )
    
    assert response.status_code == 500
    data = response.get_json()
    assert data['error'] == ERROR_SERVER_ERROR
    assert 'not available' in data['message']


@patch('app.agents.base.AgentRegistry')
@patch('asyncio.run')
def test_generate_offers_agent_failure(mock_asyncio_run, mock_registry, client, test_user_headers, test_business_profile):
    """Test offer generation when agent fails"""
    # Mock the agent and failed result
    mock_agent = MagicMock()
    mock_result = MagicMock()
    mock_result.success = False
    mock_result.error = 'Agent execution failed'
    
    mock_registry.get_agent.return_value = mock_agent
    mock_registry._agents = {'offer-assistant': mock_agent}
    mock_asyncio_run.return_value = mock_result
    
    response = client.post(
        f'/api/business-profiles/{test_business_profile.id}/generate-offers',
        headers=test_user_headers
    )
    
    assert response.status_code == 500
    data = response.get_json()
    assert data['error'] == ERROR_SERVER_ERROR
    assert 'Failed to generate offers' in data['message']


def test_generate_offers_business_profile_not_found(client, test_user_headers):
    """Test offer generation with non-existent business profile"""
    response = client.post(
        '/api/business-profiles/non-existent-id/generate-offers',
        headers=test_user_headers
    )
    
    assert response.status_code == 403
    data = response.get_json()
    assert data['error'] == ERROR_VALIDATION_ERROR


def test_offers_endpoints_unauthorized(client):
    """Test accessing offers endpoints without authentication"""
    endpoints = [
        ('GET', '/api/business-profiles/test-id/offers'),
        ('POST', '/api/business-profiles/test-id/offers'),
        ('GET', '/api/offers/test-id'),
        ('PUT', '/api/offers/test-id'),
        ('DELETE', '/api/offers/test-id'),
        ('POST', '/api/business-profiles/test-id/generate-offers'),
        ('GET', '/api/offers/count')
    ]
    
    for method, endpoint in endpoints:
        if method == 'GET':
            response = client.get(endpoint)
        elif method == 'POST':
            response = client.post(endpoint, json={})
        elif method == 'PUT':
            response = client.put(endpoint, json={})
        elif method == 'DELETE':
            response = client.delete(endpoint)
        
        assert response.status_code == 401
        data = response.get_json()
        assert 'msg' in data
        assert 'Missing Authorization Header' in data['msg']