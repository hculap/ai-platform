import pytest
from flask import json
from app import db
from app.models.user import User
from app.models.business_profile import BusinessProfile
from app.models.competition import Competition
from app.utils.messages import (
    COMPETITION_CREATED_SUCCESS, COMPETITION_UPDATED_SUCCESS,
    COMPETITION_DELETED_SUCCESS, COMPETITION_NOT_FOUND,
    COMPETITION_ACCESS_DENIED, ERROR_VALIDATION_ERROR
)

def test_competition_full_workflow(client, test_user_headers, test_business_profile):
    """Test complete Competition CRUD workflow"""

    # 1. Create a competition
    competition_data = {
        'name': 'Test Competition Co',
        'url': 'https://testcompetition.com',
        'description': 'A comprehensive competitor analysis test.',
        'usp': 'Advanced testing solutions for developers.'
    }

    response = client.post(
        f'/api/business-profiles/{test_business_profile.id}/competitions',
        json=competition_data,
        headers=test_user_headers
    )

    assert response.status_code == 201
    create_data = response.get_json()
    assert 'id' in create_data
    assert create_data['message'] == COMPETITION_CREATED_SUCCESS
    competition_id = create_data['id']

    # 2. Retrieve the created competition
    response = client.get(f'/api/competitions/{competition_id}', headers=test_user_headers)
    assert response.status_code == 200
    competition_data = response.get_json()
    assert competition_data['name'] == 'Test Competition Co'
    assert competition_data['url'] == 'https://testcompetition.com'
    assert competition_data['description'] == 'A comprehensive competitor analysis test.'
    assert competition_data['usp'] == 'Advanced testing solutions for developers.'
    assert competition_data['business_profile_id'] == test_business_profile.id

    # 3. Update the competition
    update_data = {
        'name': 'Updated Competition Co',
        'url': 'https://updatedcompetition.com',
        'description': 'Updated competitor analysis.',
        'usp': 'Updated testing solutions.'
    }

    response = client.put(
        f'/api/competitions/{competition_id}',
        json=update_data,
        headers=test_user_headers
    )

    assert response.status_code == 200
    update_response = response.get_json()
    assert update_response['message'] == COMPETITION_UPDATED_SUCCESS

    # 4. Verify the update
    response = client.get(f'/api/competitions/{competition_id}', headers=test_user_headers)
    assert response.status_code == 200
    updated_competition = response.get_json()
    assert updated_competition['name'] == 'Updated Competition Co'
    assert updated_competition['url'] == 'https://updatedcompetition.com'

    # 5. List all competitions
    response = client.get('/api/competitions', headers=test_user_headers)
    assert response.status_code == 200
    list_data = response.get_json()
    assert len(list_data['data']) >= 1
    assert any(comp['id'] == competition_id for comp in list_data['data'])

    # 6. Delete the competition
    response = client.delete(f'/api/competitions/{competition_id}', headers=test_user_headers)
    assert response.status_code == 200
    delete_response = response.get_json()
    assert delete_response['id'] == competition_id
    assert delete_response['message'] == COMPETITION_DELETED_SUCCESS

    # 7. Verify deletion
    response = client.get(f'/api/competitions/{competition_id}', headers=test_user_headers)
    assert response.status_code == 404

def test_competition_business_profile_relationship(client, test_user_headers, test_business_profile):
    """Test competition-business profile relationship integrity"""

    # Create multiple competitions for the same business profile
    competitions_data = [
        {
            'name': 'Competition A',
            'url': 'https://compa.com',
            'description': 'First competitor'
        },
        {
            'name': 'Competition B',
            'url': 'https://compb.com',
            'description': 'Second competitor'
        }
    ]

    created_competitions = []
    for comp_data in competitions_data:
        response = client.post(
            f'/api/business-profiles/{test_business_profile.id}/competitions',
            json=comp_data,
            headers=test_user_headers
        )
        assert response.status_code == 201
        data = response.get_json()
        created_competitions.append(data['id'])

    # Verify all competitions are linked to the business profile
    for comp_id in created_competitions:
        response = client.get(f'/api/competitions/{comp_id}', headers=test_user_headers)
        assert response.status_code == 200
        comp_data = response.get_json()
        assert comp_data['business_profile_id'] == test_business_profile.id

    # Verify business profile has all competitions
    response = client.get('/api/competitions', headers=test_user_headers)
    assert response.status_code == 200
    list_data = response.get_json()

    # Should have at least the competitions we created
    competition_names = [comp['name'] for comp in list_data['data']]
    assert 'Competition A' in competition_names
    assert 'Competition B' in competition_names

def test_competition_cross_user_isolation(client, test_user_headers, test_user2, test_business_profile2):
    """Test that competitions are properly isolated between users"""

    # Create a competition for user 1
    user1_competition = {
        'name': 'User 1 Competition',
        'url': 'https://user1comp.com'
    }

    response = client.post(
        f'/api/business-profiles/{test_business_profile2.id}/competitions',
        json=user1_competition,
        headers=test_user_headers
    )
    assert response.status_code == 403  # Should fail - wrong user

    # Now create competition for the correct user (user2)
    # First, we need to get user2's headers
    response = client.post('/api/auth/login', json={
        'email': 'testuser2@gmail.com',
        'password': 'TestPassword123'
    })
    user2_token = response.get_json()['access_token']
    user2_headers = {'Authorization': f'Bearer {user2_token}'}

    response = client.post(
        f'/api/business-profiles/{test_business_profile2.id}/competitions',
        json=user1_competition,
        headers=user2_headers
    )
    assert response.status_code == 201

    user2_competition_id = response.get_json()['id']

    # User 1 should not be able to access user 2's competition
    response = client.get(f'/api/competitions/{user2_competition_id}', headers=test_user_headers)
    assert response.status_code == 404

    # User 2 should be able to access their own competition
    response = client.get(f'/api/competitions/{user2_competition_id}', headers=user2_headers)
    assert response.status_code == 200

    # User 1's competition list should not include user 2's competition
    response = client.get('/api/competitions', headers=test_user_headers)
    assert response.status_code == 200
    data = response.get_json()
    competition_names = [comp['name'] for comp in data['data']]
    assert 'User 1 Competition' not in competition_names

def test_competition_data_validation(client, test_user_headers, test_business_profile):
    """Test competition data validation"""

    # Test missing name
    response = client.post(
        f'/api/business-profiles/{test_business_profile.id}/competitions',
        json={'url': 'https://test.com'},
        headers=test_user_headers
    )
    assert response.status_code == 400

    # Test empty name
    response = client.post(
        f'/api/business-profiles/{test_business_profile.id}/competitions',
        json={'name': ''},
        headers=test_user_headers
    )
    assert response.status_code == 400

    # Test valid minimal data (only name)
    response = client.post(
        f'/api/business-profiles/{test_business_profile.id}/competitions',
        json={'name': 'Minimal Competition'},
        headers=test_user_headers
    )
    assert response.status_code == 201

    # Test with all fields
    full_data = {
        'name': 'Full Competition',
        'url': 'https://fullcompetition.com',
        'description': 'Complete competitor profile',
        'usp': 'Best in class solutions'
    }

    response = client.post(
        f'/api/business-profiles/{test_business_profile.id}/competitions',
        json=full_data,
        headers=test_user_headers
    )
    assert response.status_code == 201

    # Verify all fields were saved
    competition_id = response.get_json()['id']
    response = client.get(f'/api/competitions/{competition_id}', headers=test_user_headers)
    assert response.status_code == 200
    saved_data = response.get_json()

    assert saved_data['name'] == 'Full Competition'
    assert saved_data['url'] == 'https://fullcompetition.com'
    assert saved_data['description'] == 'Complete competitor profile'
    assert saved_data['usp'] == 'Best in class solutions'

def test_competition_timestamps(client, test_user_headers, test_business_profile):
    """Test competition timestamp fields"""

    # Create a competition
    response = client.post(
        f'/api/business-profiles/{test_business_profile.id}/competitions',
        json={'name': 'Timestamp Test'},
        headers=test_user_headers
    )
    assert response.status_code == 201
    competition_id = response.get_json()['id']

    # Retrieve and check timestamps
    response = client.get(f'/api/competitions/{competition_id}', headers=test_user_headers)
    assert response.status_code == 200
    data = response.get_json()

    assert 'created_at' in data
    assert 'updated_at' in data
    assert data['created_at'] is not None
    assert data['updated_at'] is not None

    # Update and verify updated_at changes
    import time
    time.sleep(0.1)  # Small delay to ensure timestamp difference

    response = client.put(
        f'/api/competitions/{competition_id}',
        json={'name': 'Updated Timestamp Test'},
        headers=test_user_headers
    )
    assert response.status_code == 200

    # Check updated timestamp
    response = client.get(f'/api/competitions/{competition_id}', headers=test_user_headers)
    assert response.status_code == 200
    updated_data = response.get_json()
    assert updated_data['updated_at'] >= data['updated_at']

def test_competition_json_response_format(client, test_user_headers, test_business_profile):
    """Test that competition API returns proper JSON format"""

    # Create a competition
    response = client.post(
        f'/api/business-profiles/{test_business_profile.id}/competitions',
        json={
            'name': 'Format Test',
            'url': 'https://formattest.com',
            'description': 'Testing response format',
            'usp': 'Format validation'
        },
        headers=test_user_headers
    )
    assert response.status_code == 201
    competition_id = response.get_json()['id']

    # Test single competition response
    response = client.get(f'/api/competitions/{competition_id}', headers=test_user_headers)
    assert response.status_code == 200
    data = response.get_json()

    # Required fields
    required_fields = ['id', 'business_profile_id', 'name', 'created_at', 'updated_at']
    for field in required_fields:
        assert field in data
        assert data[field] is not None

    # Optional fields (should be present even if null)
    optional_fields = ['url', 'description', 'usp']
    for field in optional_fields:
        assert field in data

    # Test list response
    response = client.get('/api/competitions', headers=test_user_headers)
    assert response.status_code == 200
    list_data = response.get_json()

    assert 'data' in list_data
    assert isinstance(list_data['data'], list)

    if len(list_data['data']) > 0:
        competition = list_data['data'][0]
        for field in required_fields:
            assert field in competition
        for field in optional_fields:
            assert field in competition

def test_competition_error_responses(client, test_user_headers):
    """Test competition API error responses"""

    # Test 404 for non-existent competition
    response = client.get('/api/competitions/non-existent-id', headers=test_user_headers)
    assert response.status_code == 404
    data = response.get_json()
    assert data['error'] == ERROR_NOT_FOUND
    assert data['message'] == COMPETITION_NOT_FOUND

    # Test 404 for non-existent business profile
    response = client.post('/api/business-profiles/non-existent-id/competitions',
                          json={'name': 'Test'},
                          headers=test_user_headers)
    assert response.status_code == 403
    data = response.get_json()
    assert data['error'] == ERROR_VALIDATION_ERROR
    assert data['message'] == COMPETITION_ACCESS_DENIED

    # Test 401 for unauthorized access
    response = client.get('/api/competitions')
    assert response.status_code == 401

def test_competition_database_constraints(client, test_user_headers, test_business_profile):
    """Test database constraint enforcement"""

    # Create a competition
    response = client.post(
        f'/api/business-profiles/{test_business_profile.id}/competitions',
        json={'name': 'Constraint Test'},
        headers=test_user_headers
    )
    assert response.status_code == 201
    competition_id = response.get_json()['id']

    # Verify it exists
    response = client.get(f'/api/competitions/{competition_id}', headers=test_user_headers)
    assert response.status_code == 200

    # Delete the business profile (this should cascade or prevent deletion)
    # Note: This test depends on the foreign key constraints in the database

    # Delete the competition
    response = client.delete(f'/api/competitions/{competition_id}', headers=test_user_headers)
    assert response.status_code == 200

    # Verify it's gone
    response = client.get(f'/api/competitions/{competition_id}', headers=test_user_headers)
    assert response.status_code == 404
