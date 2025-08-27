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
        profiles = BusinessProfile.query.filter_by(user_id=user_id).all()

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

        # Create new business profile
        profile = BusinessProfile(user_id=user_id, website_url=website_url)
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
