"""
Flask routes for scripts and AI writing assistant.
Provides REST API endpoints for script management and style analysis.
"""

import logging
import json
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.exceptions import BadRequest

from ..models.script import Script
from ..models.user_style import UserStyle
from ..models.business_profile import BusinessProfile
from ..models.offer import Offer
from ..models.campaign import Campaign
from ..utils.messages import (
    get_message,
    ERROR_VALIDATION_ERROR, ERROR_NOT_FOUND, ERROR_SERVER_ERROR
)
from .. import db

logger = logging.getLogger(__name__)

scripts_bp = Blueprint('scripts', __name__)

# ===== STYLE ANALYSIS ROUTES =====
# NOTE: Style analysis has been moved to the agent system.
# Use the agent execution API instead: POST /api/agents/writer-agent/tools/analyze-style/call
# Expected input format:
# {
#   "input": {
#     "user_id": "user-id",
#     "samples": ["sample text 1", "sample text 2", ...],
#     "content_types": ["post", "blog", "script", "general"],
#     "banlist_seed": ["optional", "cliche", "phrases"]
#   }
# }
# Language detection is now automatic and author_name field has been removed.

@scripts_bp.route('/user-styles', methods=['GET'])
@jwt_required()
def get_user_styles():
    """Get all style cards for the current user, optionally filtered by business_profile_id"""
    try:
        user_id = get_jwt_identity()
        business_profile_id = request.args.get('business_profile_id')
        
        logger.info(f"Getting user styles for user_id: {user_id}, business_profile_id: {business_profile_id}")
        
        try:
            query = UserStyle.query.filter_by(user_id=user_id)
            
            # Filter by business profile if provided
            if business_profile_id:
                # Show only styles for this specific business profile (exclude legacy global styles)
                query = query.filter(UserStyle.business_profile_id == business_profile_id)
            
            user_styles = query.order_by(UserStyle.created_at.desc()).all()
            logger.info(f"Found {len(user_styles)} styles for user {user_id}")
            
            # Convert to dict and log the response data
            style_dicts = []
            for style in user_styles:
                try:
                    style_dict = style.to_dict()
                    style_dicts.append(style_dict)
                except Exception as style_error:
                    logger.error(f"Error converting style {style.id} to dict: {style_error}")
                    continue
            
            logger.info(f"Successfully converted {len(style_dicts)} styles to dict")
            logger.info(f"Response data length: {len(style_dicts)}")
            
            return jsonify({
                'success': True,
                'data': style_dicts
            }), 200
            
        except Exception as db_error:
            logger.error(f"Database query error: {db_error}")
            raise db_error
        
    except Exception as e:
        logger.error(f"Get user styles error: {str(e)}")
        return jsonify({
            'error': ERROR_SERVER_ERROR,
            'message': 'Failed to retrieve user styles'
        }), 500

@scripts_bp.route('/user-styles/<style_id>', methods=['GET'])
@jwt_required()
def get_user_style(style_id):
    """Get a specific style card"""
    try:
        user_id = get_jwt_identity()
        
        user_style = UserStyle.query.filter_by(id=style_id, user_id=user_id).first()
        
        if not user_style:
            return jsonify({
                'error': ERROR_NOT_FOUND,
                'message': 'Style not found'
            }), 404
        
        return jsonify({
            'success': True,
            'data': user_style.to_dict()
        }), 200
        
    except Exception as e:
        logger.error(f"Get user style error: {str(e)}")
        return jsonify({
            'error': ERROR_SERVER_ERROR,
            'message': 'Failed to retrieve user style'
        }), 500

@scripts_bp.route('/user-styles/<style_id>', methods=['DELETE'])
@jwt_required()
def delete_user_style(style_id):
    """Delete a style card"""
    try:
        user_id = get_jwt_identity()
        
        user_style = UserStyle.query.filter_by(id=style_id, user_id=user_id).first()
        
        if not user_style:
            return jsonify({
                'error': ERROR_NOT_FOUND,
                'message': 'Style not found'
            }), 404
        
        db.session.delete(user_style)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Style deleted successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Delete user style error: {str(e)}")
        return jsonify({
            'error': ERROR_SERVER_ERROR,
            'message': 'Failed to delete style'
        }), 500

# ===== SCRIPTS MANAGEMENT ROUTES =====

@scripts_bp.route('/business-profiles/<business_profile_id>/scripts', methods=['GET'])
@jwt_required()
def get_scripts(business_profile_id):
    """Get all scripts for a specific business profile"""
    try:
        user_id = get_jwt_identity()
        
        # Verify business profile ownership
        business_profile = BusinessProfile.query.filter_by(
            id=business_profile_id, 
            user_id=user_id
        ).first()
        
        if not business_profile:
            return jsonify({
                'error': ERROR_NOT_FOUND,
                'message': 'Business profile not found'
            }), 404
        
        # Get scripts with optional filtering
        query = Script.query.filter_by(business_profile_id=business_profile_id, user_id=user_id)
        
        # Filter by script type if provided
        script_type = request.args.get('script_type')
        if script_type:
            query = query.filter_by(script_type=script_type)
        
        # Filter by status if provided
        status = request.args.get('status')
        if status:
            query = query.filter_by(status=status)
        
        scripts = query.order_by(Script.created_at.desc()).all()
        
        return jsonify({
            'success': True,
            'data': [script.to_dict() for script in scripts]
        }), 200
        
    except Exception as e:
        logger.error(f"Get scripts error: {str(e)}")
        return jsonify({
            'error': ERROR_SERVER_ERROR,
            'message': 'Failed to retrieve scripts'
        }), 500

@scripts_bp.route('/business-profiles/<business_profile_id>/scripts', methods=['POST'])
@jwt_required()
def create_script(business_profile_id):
    """Create a new script"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data:
            return jsonify({
                'error': ERROR_VALIDATION_ERROR,
                'message': 'Request data is required'
            }), 400
        
        # Verify business profile ownership
        business_profile = BusinessProfile.query.filter_by(
            id=business_profile_id, 
            user_id=user_id
        ).first()
        
        if not business_profile:
            return jsonify({
                'error': ERROR_NOT_FOUND,
                'message': 'Business profile not found'
            }), 404
        
        # Validate required fields
        required_fields = ['title', 'content']
        missing_fields = [field for field in required_fields if field not in data or not data[field]]
        
        if missing_fields:
            return jsonify({
                'error': ERROR_VALIDATION_ERROR,
                'message': f'Missing required fields: {", ".join(missing_fields)}'
            }), 400
        
        # Validate script_type if provided
        script_type = data.get('script_type', 'general')
        if not Script.validate_script_type(script_type):
            return jsonify({
                'error': ERROR_VALIDATION_ERROR,
                'message': f'Invalid script type. Must be one of: {", ".join(Script.SCRIPT_TYPE_OPTIONS)}'
            }), 400
        
        # Validate status if provided
        status = data.get('status', 'draft')
        if not Script.validate_status(status):
            return jsonify({
                'error': ERROR_VALIDATION_ERROR,
                'message': f'Invalid status. Must be one of: {", ".join(Script.STATUS_OPTIONS)}'
            }), 400
        
        # Create script
        script = Script(
            user_id=user_id,
            business_profile_id=business_profile_id,
            title=data['title'],
            content=data['content'],
            script_type=script_type,
            style_id=data.get('style_id'),
            offer_id=data.get('offer_id'),
            campaign_id=data.get('campaign_id'),
            status=status
        )
        
        db.session.add(script)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': script.to_dict(),
            'message': 'Script created successfully'
        }), 201
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Create script error: {str(e)}")
        return jsonify({
            'error': ERROR_SERVER_ERROR,
            'message': 'Failed to create script'
        }), 500

@scripts_bp.route('/scripts/<script_id>', methods=['GET'])
@jwt_required()
def get_script(script_id):
    """Get a specific script"""
    try:
        user_id = get_jwt_identity()
        
        script = Script.query.filter_by(id=script_id, user_id=user_id).first()
        
        if not script:
            return jsonify({
                'error': ERROR_NOT_FOUND,
                'message': 'Script not found'
            }), 404
        
        return jsonify({
            'success': True,
            'data': script.to_dict()
        }), 200
        
    except Exception as e:
        logger.error(f"Get script error: {str(e)}")
        return jsonify({
            'error': ERROR_SERVER_ERROR,
            'message': 'Failed to retrieve script'
        }), 500

@scripts_bp.route('/scripts/<script_id>', methods=['PUT'])
@jwt_required()
def update_script(script_id):
    """Update a script"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data:
            return jsonify({
                'error': ERROR_VALIDATION_ERROR,
                'message': 'Request data is required'
            }), 400
        
        script = Script.query.filter_by(id=script_id, user_id=user_id).first()
        
        if not script:
            return jsonify({
                'error': ERROR_NOT_FOUND,
                'message': 'Script not found'
            }), 404
        
        # Validate script_type if provided
        if 'script_type' in data and not Script.validate_script_type(data['script_type']):
            return jsonify({
                'error': ERROR_VALIDATION_ERROR,
                'message': f'Invalid script type. Must be one of: {", ".join(Script.SCRIPT_TYPE_OPTIONS)}'
            }), 400
        
        # Validate status if provided
        if 'status' in data and not Script.validate_status(data['status']):
            return jsonify({
                'error': ERROR_VALIDATION_ERROR,
                'message': f'Invalid status. Must be one of: {", ".join(Script.STATUS_OPTIONS)}'
            }), 400
        
        script.update_from_dict(data)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': script.to_dict(),
            'message': 'Script updated successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Update script error: {str(e)}")
        return jsonify({
            'error': ERROR_SERVER_ERROR,
            'message': 'Failed to update script'
        }), 500

@scripts_bp.route('/scripts/<script_id>', methods=['DELETE'])
@jwt_required()
def delete_script(script_id):
    """Delete a script"""
    try:
        user_id = get_jwt_identity()
        
        script = Script.query.filter_by(id=script_id, user_id=user_id).first()
        
        if not script:
            return jsonify({
                'error': ERROR_NOT_FOUND,
                'message': 'Script not found'
            }), 404
        
        db.session.delete(script)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Script deleted successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Delete script error: {str(e)}")
        return jsonify({
            'error': ERROR_SERVER_ERROR,
            'message': 'Failed to delete script'
        }), 500

# ===== UTILITY ROUTES =====

@scripts_bp.route('/scripts/count', methods=['GET'])
@jwt_required()
def get_scripts_count():
    """Get the total count of scripts for the current user"""
    try:
        user_id = get_jwt_identity()
        
        # Get business profile ID if provided
        business_profile_id = request.args.get('business_profile_id')
        
        if business_profile_id:
            # Verify business profile ownership
            business_profile = BusinessProfile.query.filter_by(
                id=business_profile_id, 
                user_id=user_id
            ).first()
            
            if not business_profile:
                return jsonify({
                    'error': ERROR_NOT_FOUND,
                    'message': 'Business profile not found'
                }), 404
            
            count = Script.query.filter_by(
                user_id=user_id,
                business_profile_id=business_profile_id
            ).count()
        else:
            count = Script.query.filter_by(user_id=user_id).count()
        
        return jsonify({
            'success': True,
            'data': count
        }), 200
        
    except Exception as e:
        logger.error(f"Get scripts count error: {str(e)}")
        return jsonify({
            'error': ERROR_SERVER_ERROR,
            'message': 'Failed to get scripts count'
        }), 500