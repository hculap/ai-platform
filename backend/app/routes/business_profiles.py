from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models.business_profile import BusinessProfile
from .. import db
from urllib.parse import urlparse
from ..utils.messages import (
    get_message, BUSINESS_PROFILE_RETRIEVE_FAILED, BUSINESS_PROFILE_WEBSITE_URL_REQUIRED,
    BUSINESS_PROFILE_INVALID_URL_FORMAT, BUSINESS_PROFILE_ALREADY_EXISTS,
    BUSINESS_PROFILE_CREATED_SUCCESS, BUSINESS_PROFILE_CREATE_FAILED,
    BUSINESS_PROFILE_NOT_FOUND, BUSINESS_PROFILE_RETRIEVE_SINGLE_FAILED,
    BUSINESS_PROFILE_UPDATED_SUCCESS, BUSINESS_PROFILE_UPDATE_FAILED,
    BUSINESS_PROFILE_DELETED_SUCCESS, BUSINESS_PROFILE_DELETE_FAILED,
    BUSINESS_PROFILE_LAST_PROFILE_ERROR,
    ERROR_VALIDATION_ERROR, ERROR_NOT_FOUND, ERROR_SERVER_ERROR
)
import re

business_profiles_bp = Blueprint('business_profiles', __name__)

def validate_url(url):
    """Validate URL format"""
    try:
        result = urlparse(url)
        return all([result.scheme, result.netloc])
    except:
        return False

@business_profiles_bp.route('/business-profiles', methods=['GET'])
@jwt_required()
def get_business_profiles():
    """Get all business profiles for current user"""
    try:
        user_id = get_jwt_identity()
        print(f"DEBUG: Getting business profiles for user_id: {user_id}")

        profiles = BusinessProfile.query.filter_by(user_id=user_id).all()
        print(f"DEBUG: Found {len(profiles)} profiles for user {user_id}")

        for profile in profiles:
            print(f"DEBUG: Profile ID: {profile.id}, Name: {profile.name}, Website: {profile.website_url}")

        return jsonify({
            'data': [profile.to_dict() for profile in profiles]
        }), 200

    except Exception as e:
        return jsonify({
            'error': ERROR_SERVER_ERROR,
            'message': get_message(BUSINESS_PROFILE_RETRIEVE_FAILED)
        }), 500

@business_profiles_bp.route('/business-profiles', methods=['POST'])
@jwt_required()
def create_business_profile():
    """Create a new business profile"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()

        if not data or not data.get('website_url'):
            return jsonify({
                'error': ERROR_VALIDATION_ERROR,
                'message': get_message(BUSINESS_PROFILE_WEBSITE_URL_REQUIRED)
            }), 400

        website_url = data['website_url'].strip()

        # Validate URL
        if not validate_url(website_url):
            return jsonify({
                'error': ERROR_VALIDATION_ERROR,
                'message': get_message(BUSINESS_PROFILE_INVALID_URL_FORMAT)
            }), 400

        # Check if user already has a profile for this website
        existing_profile = BusinessProfile.query.filter_by(
            user_id=user_id,
            website_url=website_url
        ).first()

        if existing_profile:
            return jsonify({
                'error': ERROR_VALIDATION_ERROR,
                'message': get_message(BUSINESS_PROFILE_ALREADY_EXISTS)
            }), 409

        # Deactivate all other profiles for this user (only one active at a time)
        BusinessProfile.query.filter_by(user_id=user_id).update({'is_active': False})

        # Create new business profile
        profile = BusinessProfile(user_id=user_id, website_url=website_url)
        
        # Set additional fields if provided
        if data.get('name'):
            profile.name = data['name']
        if data.get('offer_description'):
            profile.offer_description = data['offer_description']
        if data.get('target_customer'):
            profile.target_customer = data['target_customer']
        if data.get('problem_solved'):
            profile.problem_solved = data['problem_solved']
        if data.get('customer_desires'):
            profile.customer_desires = data['customer_desires']
        if data.get('brand_tone'):
            profile.brand_tone = data['brand_tone']
        if data.get('communication_language'):
            profile.communication_language = data['communication_language']
        
        # Mark as active since it's manually created (and we deactivated others above)
        profile.is_active = True
        profile.analysis_status = 'completed'
        
        db.session.add(profile)
        db.session.commit()

        return jsonify({
            'id': profile.id,
            'analysis_status': profile.analysis_status,
            'message': get_message(BUSINESS_PROFILE_CREATED_SUCCESS)
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'error': ERROR_SERVER_ERROR,
            'message': get_message(BUSINESS_PROFILE_CREATE_FAILED)
        }), 500

@business_profiles_bp.route('/business-profiles/<profile_id>', methods=['GET'])
@jwt_required()
def get_business_profile(profile_id):
    """Get specific business profile"""
    try:
        user_id = get_jwt_identity()
        profile = BusinessProfile.query.filter_by(
            id=profile_id,
            user_id=user_id
        ).first()

        if not profile:
            return jsonify({
                'error': ERROR_NOT_FOUND,
                'message': get_message(BUSINESS_PROFILE_NOT_FOUND)
            }), 404

        return jsonify(profile.to_dict()), 200

    except Exception as e:
        return jsonify({
            'error': ERROR_SERVER_ERROR,
            'message': get_message(BUSINESS_PROFILE_RETRIEVE_SINGLE_FAILED)
        }), 500

@business_profiles_bp.route('/business-profiles/<profile_id>', methods=['PUT'])
@jwt_required()
def update_business_profile(profile_id):
    """Update business profile"""
    try:
        user_id = get_jwt_identity()
        profile = BusinessProfile.query.filter_by(
            id=profile_id,
            user_id=user_id
        ).first()

        if not profile:
            return jsonify({
                'error': ERROR_NOT_FOUND,
                'message': get_message(BUSINESS_PROFILE_NOT_FOUND)
            }), 404

        data = request.get_json()

        # Update allowed fields
        allowed_fields = [
            'name', 'offer_description', 'target_customer',
            'problem_solved', 'customer_desires', 'brand_tone',
            'communication_language', 'is_active'
        ]

        # If setting this profile as active, deactivate all other profiles for this user
        if 'is_active' in data and data['is_active']:
            BusinessProfile.query.filter_by(user_id=user_id).update({'is_active': False})

        for field in allowed_fields:
            if field in data:
                setattr(profile, field, data[field])

        db.session.commit()

        return jsonify({
            'id': profile.id,
            'updated_at': profile.updated_at.isoformat(),
            'message': get_message(BUSINESS_PROFILE_UPDATED_SUCCESS)
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'error': ERROR_SERVER_ERROR,
            'message': get_message(BUSINESS_PROFILE_UPDATE_FAILED)
        }), 500

@business_profiles_bp.route('/business-profiles/<profile_id>', methods=['DELETE'])
@jwt_required()
def delete_business_profile(profile_id):
    """Delete business profile - users must have at least one profile"""
    try:
        user_id = get_jwt_identity()

        # Find the profile to delete
        profile = BusinessProfile.query.filter_by(
            id=profile_id,
            user_id=user_id
        ).first()

        if not profile:
            return jsonify({
                'error': ERROR_NOT_FOUND,
                'message': get_message(BUSINESS_PROFILE_NOT_FOUND)
            }), 404

        # Check if user has multiple profiles (prevent deletion if only one profile)
        user_profile_count = BusinessProfile.query.filter_by(user_id=user_id).count()

        if user_profile_count <= 1:
            return jsonify({
                'error': ERROR_VALIDATION_ERROR,
                'message': get_message(BUSINESS_PROFILE_LAST_PROFILE_ERROR)
            }), 400

        # Delete the profile
        db.session.delete(profile)
        db.session.commit()

        return jsonify({
            'id': profile_id,
            'message': get_message(BUSINESS_PROFILE_DELETED_SUCCESS)
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'error': ERROR_SERVER_ERROR,
            'message': get_message(BUSINESS_PROFILE_DELETE_FAILED)
        }), 500
