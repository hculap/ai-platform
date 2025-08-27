import pytest
import json
from app.utils.messages import (
    AUTH_EMAIL_PASSWORD_REQUIRED, AUTH_INVALID_EMAIL_FORMAT,
    AUTH_USER_ALREADY_EXISTS, AUTH_INVALID_CREDENTIALS,
    ERROR_VALIDATION_ERROR, ERROR_UNAUTHORIZED
)

def test_register_success(client):
    """Test successful user registration"""
    response = client.post('/api/auth/register', json={
        'email': 'newuser@gmail.com',
        'password': 'TestPassword123'
    })

    assert response.status_code == 201
    data = response.get_json()
    assert 'access_token' in data
    assert 'user' in data
    assert data['user']['email'] == 'newuser@gmail.com'

def test_register_duplicate_email(client, test_user):
    """Test registration with duplicate email"""
    response = client.post('/api/auth/register', json={
        'email': 'testuser@gmail.com',
        'password': 'AnotherPassword123'
    })

    assert response.status_code == 409
    data = response.get_json()
    assert data['error'] == ERROR_VALIDATION_ERROR
    assert data['message'] == AUTH_USER_ALREADY_EXISTS

def test_register_invalid_email(client):
    """Test registration with invalid email"""
    response = client.post('/api/auth/register', json={
        'email': 'invalid-email',
        'password': 'TestPassword123'
    })

    assert response.status_code == 400
    data = response.get_json()
    assert data['error'] == ERROR_VALIDATION_ERROR
    assert data['message'] == AUTH_INVALID_EMAIL_FORMAT

def test_register_weak_password(client):
    """Test registration with weak password"""
    response = client.post('/api/auth/register', json={
        'email': 'testuser@gmail.com',
        'password': 'weak'
    })

    assert response.status_code == 400
    data = response.get_json()
    assert data['error'] == ERROR_VALIDATION_ERROR

def test_register_missing_fields(client):
    """Test registration with missing fields"""
    response = client.post('/api/auth/register', json={
        'email': 'test@example.com'
    })

    assert response.status_code == 400
    data = response.get_json()
    assert data['error'] == ERROR_VALIDATION_ERROR
    assert data['message'] == AUTH_EMAIL_PASSWORD_REQUIRED

def test_login_success(client, test_user):
    """Test successful login"""
    response = client.post('/api/auth/login', json={
        'email': 'testuser@gmail.com',
        'password': 'TestPassword123'
    })

    assert response.status_code == 200
    data = response.get_json()
    assert 'access_token' in data
    assert 'user' in data
    assert data['user']['email'] == 'testuser@gmail.com'

def test_login_invalid_credentials(client, test_user):
    """Test login with invalid credentials"""
    response = client.post('/api/auth/login', json={
        'email': 'testuser@gmail.com',
        'password': 'WrongPassword123'
    })

    assert response.status_code == 401
    data = response.get_json()
    assert data['error'] == ERROR_UNAUTHORIZED
    assert data['message'] == AUTH_INVALID_CREDENTIALS

def test_login_missing_fields(client):
    """Test login with missing fields"""
    response = client.post('/api/auth/login', json={
        'email': 'test@example.com'
    })

    assert response.status_code == 400
    data = response.get_json()
    assert data['error'] == ERROR_VALIDATION_ERROR
    assert data['message'] == AUTH_EMAIL_PASSWORD_REQUIRED

def test_get_current_user(client, test_user_headers):
    """Test getting current user profile"""
    response = client.get('/api/auth/me', headers=test_user_headers)

    assert response.status_code == 200
    data = response.get_json()
    assert data['email'] == 'testuser@gmail.com'
    assert 'id' in data
    assert 'created_at' in data

def test_get_current_user_unauthorized(client):
    """Test getting current user without authentication"""
    response = client.get('/api/auth/me')

    assert response.status_code == 401
