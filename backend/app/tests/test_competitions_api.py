import pytest
from app.utils.messages import (
    COMPETITION_RETRIEVE_FAILED, COMPETITION_NOT_FOUND,
    COMPETITION_CREATED_SUCCESS, COMPETITION_CREATE_FAILED,
    COMPETITION_UPDATED_SUCCESS, COMPETITION_UPDATE_FAILED,
    COMPETITION_DELETED_SUCCESS, COMPETITION_DELETE_FAILED,
    COMPETITION_ACCESS_DENIED,
    ERROR_VALIDATION_ERROR, ERROR_NOT_FOUND, ERROR_SERVER_ERROR
)

def test_get_competitions_empty(client, test_user_headers):
    """Test getting empty competitions list"""
    response = client.get('/api/competitions', headers=test_user_headers)

    assert response.status_code == 200
    data = response.get_json()
    assert 'data' in data
    assert data['data'] == []

def test_get_competitions_with_data(client, test_user_headers, test_competition):
    """Test getting competitions with data"""
    response = client.get('/api/competitions', headers=test_user_headers)

    assert response.status_code == 200
    data = response.get_json()
    assert 'data' in data
    assert len(data['data']) == 1
    assert data['data'][0]['name'] == 'Acme Widget Co'
    assert data['data'][0]['url'] == 'https://acmewidget.com'
    assert data['data'][0]['description'] == 'Leading supplier of modular widgets for industrial applications.'
    assert data['data'][0]['usp'] == 'Largest selection of widget customizations in North America.'

def test_get_competitions_cross_user_isolation(client, test_user_headers, test_competition, test_business_profile2):
    """Test that users can only see their own competitions"""
    # Create a competition for the second user
    from app.models.competition import Competition
    from app import db

    competition2 = Competition(
        business_profile_id=test_business_profile2.id,
        name='Competition for User 2',
        url='https://user2competition.com'
    )
    db.session.add(competition2)
    db.session.commit()

    # First user should only see their own competition
    response = client.get('/api/competitions', headers=test_user_headers)

    assert response.status_code == 200
    data = response.get_json()
    assert len(data['data']) == 1
    assert data['data'][0]['name'] == 'Acme Widget Co'

def test_get_competition_success(client, test_user_headers, test_competition):
    """Test getting specific competition"""
    response = client.get(f'/api/competitions/{test_competition.id}', headers=test_user_headers)

    assert response.status_code == 200
    data = response.get_json()
    assert data['id'] == test_competition.id
    assert data['name'] == 'Acme Widget Co'
    assert data['url'] == 'https://acmewidget.com'
    assert data['description'] == 'Leading supplier of modular widgets for industrial applications.'
    assert data['usp'] == 'Largest selection of widget customizations in North America.'

def test_get_competition_not_found(client, test_user_headers):
    """Test getting non-existent competition"""
    response = client.get('/api/competitions/non-existent-id', headers=test_user_headers)

    assert response.status_code == 404
    data = response.get_json()
    assert data['error'] == ERROR_NOT_FOUND
    assert data['message'] == COMPETITION_NOT_FOUND

def test_get_competition_wrong_user(client, test_user_headers, test_competition, test_business_profile2):
    """Test that user cannot access another user's competition"""
    # Create a competition for the second user
    from app.models.competition import Competition
    from app import db

    competition2 = Competition(
        business_profile_id=test_business_profile2.id,
        name='Competition for User 2'
    )
    db.session.add(competition2)
    db.session.commit()

    # First user should not be able to access second user's competition
    response = client.get(f'/api/competitions/{competition2.id}', headers=test_user_headers)

    assert response.status_code == 404
    data = response.get_json()
    assert data['error'] == ERROR_NOT_FOUND
    assert data['message'] == COMPETITION_NOT_FOUND

def test_create_competition_success(client, test_user_headers, test_business_profile):
    """Test successful competition creation"""
    response = client.post(f'/api/business-profiles/{test_business_profile.id}/competitions', json={
        'name': 'New Competition',
        'url': 'https://newcompetition.com',
        'description': 'A new competitor in the market.',
        'usp': 'Innovative solutions for modern businesses.'
    }, headers=test_user_headers)

    assert response.status_code == 201
    data = response.get_json()
    assert 'id' in data
    assert 'message' in data
    assert data['message'] == COMPETITION_CREATED_SUCCESS

def test_create_competition_minimal_data(client, test_user_headers, test_business_profile):
    """Test competition creation with minimal data"""
    response = client.post(f'/api/business-profiles/{test_business_profile.id}/competitions', json={
        'name': 'Minimal Competition'
    }, headers=test_user_headers)

    assert response.status_code == 201
    data = response.get_json()
    assert 'id' in data
    assert 'message' in data

def test_create_competition_missing_name(client, test_user_headers, test_business_profile):
    """Test competition creation with missing name"""
    response = client.post(f'/api/business-profiles/{test_business_profile.id}/competitions', json={
        'url': 'https://test.com',
        'description': 'Test description'
    }, headers=test_user_headers)

    assert response.status_code == 400
    data = response.get_json()
    assert data['error'] == ERROR_VALIDATION_ERROR
    assert 'name is required' in data['message']

def test_create_competition_wrong_business_profile(client, test_user_headers, test_business_profile2):
    """Test that user cannot create competition for another user's business profile"""
    response = client.post(f'/api/business-profiles/{test_business_profile2.id}/competitions', json={
        'name': 'Unauthorized Competition'
    }, headers=test_user_headers)

    assert response.status_code == 403
    data = response.get_json()
    assert data['error'] == ERROR_VALIDATION_ERROR
    assert data['message'] == COMPETITION_ACCESS_DENIED

def test_create_competition_nonexistent_business_profile(client, test_user_headers):
    """Test creating competition for non-existent business profile"""
    response = client.post('/api/business-profiles/non-existent-id/competitions', json={
        'name': 'Test Competition'
    }, headers=test_user_headers)

    assert response.status_code == 403
    data = response.get_json()
    assert data['error'] == ERROR_VALIDATION_ERROR
    assert data['message'] == COMPETITION_ACCESS_DENIED

def test_update_competition_success(client, test_user_headers, test_competition):
    """Test successful competition update"""
    response = client.put(f'/api/competitions/{test_competition.id}', json={
        'name': 'Updated Competition Name',
        'url': 'https://updated.com',
        'description': 'Updated description',
        'usp': 'Updated USP'
    }, headers=test_user_headers)

    assert response.status_code == 200
    data = response.get_json()
    assert 'id' in data
    assert 'updated_at' in data
    assert 'message' in data
    assert data['message'] == COMPETITION_UPDATED_SUCCESS

def test_update_competition_partial_update(client, test_user_headers, test_competition):
    """Test partial competition update"""
    response = client.put(f'/api/competitions/{test_competition.id}', json={
        'name': 'Partially Updated Competition'
    }, headers=test_user_headers)

    assert response.status_code == 200
    data = response.get_json()
    assert data['message'] == COMPETITION_UPDATED_SUCCESS

def test_update_competition_not_found(client, test_user_headers):
    """Test updating non-existent competition"""
    response = client.put('/api/competitions/non-existent-id', json={
        'name': 'Updated Name'
    }, headers=test_user_headers)

    assert response.status_code == 404
    data = response.get_json()
    assert data['error'] == ERROR_NOT_FOUND
    assert data['message'] == COMPETITION_NOT_FOUND

def test_update_competition_wrong_user(client, test_user_headers, test_business_profile2):
    """Test that user cannot update another user's competition"""
    from app.models.competition import Competition
    from app import db

    # Create a competition for the second user
    competition2 = Competition(
        business_profile_id=test_business_profile2.id,
        name='User 2 Competition'
    )
    db.session.add(competition2)
    db.session.commit()

    # First user tries to update second user's competition
    response = client.put(f'/api/competitions/{competition2.id}', json={
        'name': 'Hacked Competition Name'
    }, headers=test_user_headers)

    assert response.status_code == 404
    data = response.get_json()
    assert data['error'] == ERROR_NOT_FOUND
    assert data['message'] == COMPETITION_NOT_FOUND

def test_delete_competition_success(client, test_user_headers, test_competition):
    """Test successful competition deletion"""
    response = client.delete(f'/api/competitions/{test_competition.id}', headers=test_user_headers)

    assert response.status_code == 200
    data = response.get_json()
    assert data['id'] == test_competition.id
    assert data['message'] == COMPETITION_DELETED_SUCCESS

def test_delete_competition_not_found(client, test_user_headers):
    """Test deleting non-existent competition"""
    response = client.delete('/api/competitions/non-existent-id', headers=test_user_headers)

    assert response.status_code == 404
    data = response.get_json()
    assert data['error'] == ERROR_NOT_FOUND
    assert data['message'] == COMPETITION_NOT_FOUND

def test_delete_competition_wrong_user(client, test_user_headers, test_business_profile2):
    """Test that user cannot delete another user's competition"""
    from app.models.competition import Competition
    from app import db

    # Create a competition for the second user
    competition2 = Competition(
        business_profile_id=test_business_profile2.id,
        name='User 2 Competition'
    )
    db.session.add(competition2)
    db.session.commit()

    # First user tries to delete second user's competition
    response = client.delete(f'/api/competitions/{competition2.id}', headers=test_user_headers)

    assert response.status_code == 404
    data = response.get_json()
    assert data['error'] == ERROR_NOT_FOUND
    assert data['message'] == COMPETITION_NOT_FOUND

def test_competitions_unauthorized(client):
    """Test accessing competitions without authentication"""
    response = client.get('/api/competitions')

    assert response.status_code == 401
    data = response.get_json()
    assert 'msg' in data
    assert data['msg'] == 'Missing Authorization Header'

def test_create_competition_unauthorized(client, test_business_profile):
    """Test creating competition without authentication"""
    response = client.post(f'/api/business-profiles/{test_business_profile.id}/competitions', json={
        'name': 'Unauthorized Competition'
    })

    assert response.status_code == 401
    data = response.get_json()
    assert 'msg' in data
    assert data['msg'] == 'Missing Authorization Header'

def test_update_competition_unauthorized(client, test_competition):
    """Test updating competition without authentication"""
    response = client.put(f'/api/competitions/{test_competition.id}', json={
        'name': 'Unauthorized Update'
    })

    assert response.status_code == 401
    data = response.get_json()
    assert 'msg' in data
    assert data['msg'] == 'Missing Authorization Header'

def test_delete_competition_unauthorized(client, test_competition):
    """Test deleting competition without authentication"""
    response = client.delete(f'/api/competitions/{test_competition.id}')

    assert response.status_code == 401
    data = response.get_json()
    assert 'msg' in data
    assert data['msg'] == 'Missing Authorization Header'

def test_competition_data_validation(client, test_user_headers, test_business_profile):
    """Test competition data validation"""
    # Test with empty name
    response = client.post(f'/api/business-profiles/{test_business_profile.id}/competitions', json={
        'name': ''
    }, headers=test_user_headers)

    assert response.status_code == 400

    # Test with very long name
    long_name = 'A' * 300
    response = client.post(f'/api/business-profiles/{test_business_profile.id}/competitions', json={
        'name': long_name
    }, headers=test_user_headers)

    # Should either succeed (if truncated) or fail with validation error
    assert response.status_code in [201, 400]

def test_competition_json_response_format(client, test_user_headers, test_competition):
    """Test that competition API returns proper JSON format"""
    response = client.get(f'/api/competitions/{test_competition.id}', headers=test_user_headers)

    assert response.status_code == 200
    data = response.get_json()

    # Check required fields
    required_fields = ['id', 'business_profile_id', 'name', 'created_at', 'updated_at']
    for field in required_fields:
        assert field in data

    # Check optional fields
    optional_fields = ['url', 'description', 'usp']
    for field in optional_fields:
        assert field in data  # Should be present in response, even if null

    # Check data types
    assert isinstance(data['id'], str)
    assert isinstance(data['business_profile_id'], str)
    assert isinstance(data['name'], str)
    assert data['created_at'] is not None
    assert data['updated_at'] is not None
