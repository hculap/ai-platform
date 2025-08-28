from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models.competition import Competition
from ..models.business_profile import BusinessProfile
from .. import db
from ..utils.messages import (
    get_message, COMPETITION_RETRIEVE_FAILED, COMPETITION_NOT_FOUND,
    COMPETITION_CREATED_SUCCESS, COMPETITION_CREATE_FAILED,
    COMPETITION_UPDATED_SUCCESS, COMPETITION_UPDATE_FAILED,
    COMPETITION_DELETED_SUCCESS, COMPETITION_DELETE_FAILED,
    COMPETITION_ACCESS_DENIED,
    ERROR_VALIDATION_ERROR, ERROR_NOT_FOUND, ERROR_SERVER_ERROR
)

competitions_bp = Blueprint('competitions', __name__)

@competitions_bp.route('/competitions', methods=['GET'])
@jwt_required()
def get_competitions():
    """Get all competitions for current user's business profiles"""
    try:
        user_id = get_jwt_identity()

        # Check if business_profile_id is provided as query parameter
        business_profile_id = request.args.get('business_profile_id')

        if business_profile_id:
            # Get specific business profile and verify ownership
            business_profile = BusinessProfile.query.filter_by(
                id=business_profile_id, user_id=user_id
            ).first()

            if not business_profile:
                return jsonify({
                    'error': ERROR_NOT_FOUND,
                    'message': 'Business profile not found'
                }), 404

            # Get competitions for specific business profile
            competitions = Competition.query.filter_by(
                business_profile_id=business_profile_id
            ).all()
        else:
            # Get all business profiles for this user
            business_profiles = BusinessProfile.query.filter_by(user_id=user_id).all()
            business_profile_ids = [bp.id for bp in business_profiles]

            if not business_profile_ids:
                return jsonify({'data': []}), 200

            # Get all competitions for these business profiles
            competitions = Competition.query.filter(
                Competition.business_profile_id.in_(business_profile_ids)
            ).all()

        return jsonify({
            'data': [competition.to_dict() for competition in competitions]
        }), 200

    except Exception as e:
        return jsonify({
            'error': ERROR_SERVER_ERROR,
            'message': get_message(COMPETITION_RETRIEVE_FAILED)
        }), 500

@competitions_bp.route('/competitions/<competition_id>', methods=['GET'])
@jwt_required()
def get_competition(competition_id):
    """Get specific competition"""
    try:
        user_id = get_jwt_identity()

        # Get competition with business profile ownership check
        competition = Competition.query.join(BusinessProfile).filter(
            Competition.id == competition_id,
            BusinessProfile.user_id == user_id
        ).first()

        if not competition:
            return jsonify({
                'error': ERROR_NOT_FOUND,
                'message': get_message(COMPETITION_NOT_FOUND)
            }), 404

        return jsonify(competition.to_dict()), 200

    except Exception as e:
        return jsonify({
            'error': ERROR_SERVER_ERROR,
            'message': get_message(COMPETITION_RETRIEVE_FAILED)
        }), 500

@competitions_bp.route('/business-profiles/<business_profile_id>/competitions', methods=['POST'])
@jwt_required()
def create_competition(business_profile_id):
    """Create a new competition for a business profile"""
    try:
        user_id = get_jwt_identity()

        # Verify business profile ownership
        business_profile = BusinessProfile.query.filter_by(
            id=business_profile_id,
            user_id=user_id
        ).first()

        if not business_profile:
            return jsonify({
                'error': ERROR_VALIDATION_ERROR,
                'message': get_message(COMPETITION_ACCESS_DENIED)
            }), 403

        data = request.get_json()

        if not data or not data.get('name'):
            return jsonify({
                'error': ERROR_VALIDATION_ERROR,
                'message': 'Competition name is required'
            }), 400

        # Create competition
        competition = Competition(
            business_profile_id=business_profile_id,
            name=data['name'],
            url=data.get('url'),
            description=data.get('description'),
            usp=data.get('usp')
        )

        db.session.add(competition)
        db.session.commit()

        return jsonify({
            'id': competition.id,
            'message': get_message(COMPETITION_CREATED_SUCCESS)
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'error': ERROR_SERVER_ERROR,
            'message': get_message(COMPETITION_CREATE_FAILED)
        }), 500

@competitions_bp.route('/competitions/<competition_id>', methods=['PUT'])
@jwt_required()
def update_competition(competition_id):
    """Update competition"""
    try:
        user_id = get_jwt_identity()

        # Get competition with business profile ownership check
        competition = Competition.query.join(BusinessProfile).filter(
            Competition.id == competition_id,
            BusinessProfile.user_id == user_id
        ).first()

        if not competition:
            return jsonify({
                'error': ERROR_NOT_FOUND,
                'message': get_message(COMPETITION_NOT_FOUND)
            }), 404

        data = request.get_json()

        # Update allowed fields
        allowed_fields = ['name', 'url', 'description', 'usp']

        for field in allowed_fields:
            if field in data:
                setattr(competition, field, data[field])

        db.session.commit()

        return jsonify({
            'id': competition.id,
            'updated_at': competition.updated_at.isoformat(),
            'message': get_message(COMPETITION_UPDATED_SUCCESS)
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'error': ERROR_SERVER_ERROR,
            'message': get_message(COMPETITION_UPDATE_FAILED)
        }), 500

@competitions_bp.route('/competitions/<competition_id>', methods=['DELETE'])
@jwt_required()
def delete_competition(competition_id):
    """Delete competition"""
    try:
        user_id = get_jwt_identity()

        # Get competition with business profile ownership check
        competition = Competition.query.join(BusinessProfile).filter(
            Competition.id == competition_id,
            BusinessProfile.user_id == user_id
        ).first()

        if not competition:
            return jsonify({
                'error': ERROR_NOT_FOUND,
                'message': get_message(COMPETITION_NOT_FOUND)
            }), 404

        # Delete the competition
        db.session.delete(competition)
        db.session.commit()

        return jsonify({
            'id': competition_id,
            'message': get_message(COMPETITION_DELETED_SUCCESS)
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'error': ERROR_SERVER_ERROR,
            'message': get_message(COMPETITION_DELETE_FAILED)
        }), 500


@competitions_bp.route('/competitions/count', methods=['GET'])
@jwt_required()
def get_competitions_count():
    """Get count of competitions for authenticated user"""
    try:
        user_id = get_jwt_identity()

        # Check if business_profile_id is provided as query parameter
        business_profile_id = request.args.get('business_profile_id')

        if business_profile_id:
            # Get specific business profile and verify ownership
            business_profile = BusinessProfile.query.filter_by(
                id=business_profile_id, user_id=user_id
            ).first()

            if not business_profile:
                return jsonify({
                    'error': ERROR_NOT_FOUND,
                    'message': 'Business profile not found'
                }), 404

            # Count competitions for specific business profile
            count = Competition.query.filter_by(
                business_profile_id=business_profile_id
            ).count()
        else:
            # Get all business profiles for this user
            business_profiles = BusinessProfile.query.filter_by(user_id=user_id).all()
            business_profile_ids = [bp.id for bp in business_profiles]

            if not business_profile_ids:
                return jsonify({'count': 0}), 200

            # Count all competitions for these business profiles
            count = Competition.query.filter(
                Competition.business_profile_id.in_(business_profile_ids)
            ).count()

        return jsonify({
            'count': count
        }), 200

    except Exception as e:
        return jsonify({
            'error': ERROR_SERVER_ERROR,
            'message': get_message(COMPETITION_RETRIEVE_FAILED)
        }), 500
