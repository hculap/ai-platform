import pytest
from app.utils.messages import (
    BUSINESS_PROFILE_ALREADY_EXISTS, BUSINESS_PROFILE_INVALID_URL_FORMAT,
    BUSINESS_PROFILE_WEBSITE_URL_REQUIRED, BUSINESS_PROFILE_NOT_FOUND,
    ERROR_VALIDATION_ERROR, ERROR_NOT_FOUND, ERROR_UNAUTHORIZED
)

def test_get_business_profiles_empty(client, test_user_headers):
    """Test getting empty business profiles list"""
    response = client.get('/api/business-profiles', headers=test_user_headers)

    assert response.status_code == 200
    data = response.get_json()
    assert 'data' in data
    assert data['data'] == []

def test_get_business_profiles_with_data(client, test_user_headers, test_business_profile):
    """Test getting business profiles with data"""
    response = client.get('/api/business-profiles', headers=test_user_headers)

    assert response.status_code == 200
    data = response.get_json()
    assert 'data' in data
    assert len(data['data']) == 1
    assert data['data'][0]['name'] == 'Test Business'
    assert data['data'][0]['website_url'] == 'https://example.com'

def test_create_business_profile_success(client, test_user_headers):
    """Test successful business profile creation"""
    response = client.post('/api/business-profiles', json={
        'website_url': 'https://newbusiness.com'
    }, headers=test_user_headers)

    assert response.status_code == 201
    data = response.get_json()
    assert 'id' in data
    assert 'analysis_status' in data
    assert data['analysis_status'] == 'pending'
    assert 'message' in data

def test_create_business_profile_duplicate_url(client, test_user_headers, test_business_profile):
    """Test creating profile with duplicate URL"""
    response = client.post('/api/business-profiles', json={
        'website_url': 'https://example.com'  # Same URL as test_business_profile
    }, headers=test_user_headers)

    assert response.status_code == 409
    data = response.get_json()
    assert data['error'] == ERROR_VALIDATION_ERROR
    assert data['message'] == BUSINESS_PROFILE_ALREADY_EXISTS

def test_create_business_profile_invalid_url(client, test_user_headers):
    """Test creating profile with invalid URL"""
    response = client.post('/api/business-profiles', json={
        'website_url': 'not-a-valid-url'
    }, headers=test_user_headers)

    assert response.status_code == 400
    data = response.get_json()
    assert data['error'] == ERROR_VALIDATION_ERROR
    assert data['message'] == BUSINESS_PROFILE_INVALID_URL_FORMAT

def test_create_business_profile_missing_url(client, test_user_headers):
    """Test creating profile with missing URL"""
    response = client.post('/api/business-profiles', json={
        'name': 'Test Business'
    }, headers=test_user_headers)

    assert response.status_code == 400
    data = response.get_json()
    assert data['error'] == ERROR_VALIDATION_ERROR
    assert data['message'] == BUSINESS_PROFILE_WEBSITE_URL_REQUIRED

def test_get_business_profile_success(client, test_user_headers, test_business_profile):
    """Test getting specific business profile"""
    response = client.get(f'/api/business-profiles/{test_business_profile.id}', headers=test_user_headers)

    assert response.status_code == 200
    data = response.get_json()
    assert data['id'] == test_business_profile.id
    assert data['name'] == 'Test Business'
    assert data['website_url'] == 'https://example.com'
    assert data['analysis_status'] == 'completed'

def test_get_business_profile_not_found(client, test_user_headers):
    """Test getting non-existent business profile"""
    response = client.get('/api/business-profiles/non-existent-id', headers=test_user_headers)

    assert response.status_code == 404
    data = response.get_json()
    assert data['error'] == ERROR_NOT_FOUND
    assert data['message'] == BUSINESS_PROFILE_NOT_FOUND

def test_update_business_profile_success(client, test_user_headers, test_business_profile):
    """Test successful business profile update"""
    response = client.put(f'/api/business-profiles/{test_business_profile.id}', json={
        'name': 'Updated Business Name',
        'is_active': True
    }, headers=test_user_headers)

    assert response.status_code == 200
    data = response.get_json()
    assert 'id' in data
    assert 'updated_at' in data
    assert 'message' in data

def test_update_business_profile_not_found(client, test_user_headers):
    """Test updating non-existent business profile"""
    response = client.put('/api/business-profiles/non-existent-id', json={
        'name': 'Updated Name'
    }, headers=test_user_headers)

    assert response.status_code == 404
    data = response.get_json()
    assert data['error'] == ERROR_NOT_FOUND
    assert data['message'] == BUSINESS_PROFILE_NOT_FOUND

def test_business_profiles_unauthorized(client):
    """Test accessing business profiles without authentication"""
    response = client.get('/api/business-profiles')

    assert response.status_code == 401
    data = response.get_json()
    assert 'msg' in data
    assert data['msg'] == 'Missing Authorization Header'
