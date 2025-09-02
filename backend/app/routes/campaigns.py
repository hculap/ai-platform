"""
Flask routes for campaign management.
Provides REST API endpoints for campaign CRUD operations and generation.
"""

import logging
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.exceptions import BadRequest

from ..models.campaign import Campaign
from ..services.campaign_service import CampaignService, CampaignGenerationService
from ..agents.base import AgentRegistry, AgentInput
from ..utils.messages import (
    get_message,
    ERROR_VALIDATION_ERROR, ERROR_NOT_FOUND, ERROR_SERVER_ERROR
)

logger = logging.getLogger(__name__)

campaigns_bp = Blueprint('campaigns', __name__)

@campaigns_bp.route('/business-profiles/<business_profile_id>/campaigns', methods=['GET'])
@jwt_required()
def get_campaigns(business_profile_id):
    """Get all campaigns for a specific business profile"""
    try:
        user_id = get_jwt_identity()
        campaigns = CampaignService.get_campaigns_for_business_profile(business_profile_id, user_id)
        
        return jsonify({
            'data': [campaign.to_dict() for campaign in campaigns]
        }), 200

    except ValueError as e:
        return jsonify({
            'error': ERROR_NOT_FOUND,
            'message': str(e)
        }), 404
    except Exception as e:
        logger.error(f"Error getting campaigns: {e}", exc_info=True)
        return jsonify({
            'error': ERROR_SERVER_ERROR,
            'message': 'Failed to get campaigns'
        }), 500

@campaigns_bp.route('/business-profiles/<business_profile_id>/campaigns', methods=['POST'])
@jwt_required()
def create_campaign(business_profile_id):
    """Create a new campaign"""
    try:
        user_id = get_jwt_identity()
        
        if not request.is_json:
            return jsonify({
                'error': ERROR_VALIDATION_ERROR,
                'message': 'Request must be JSON'
            }), 400
        
        campaign_data = request.get_json()
        campaign = CampaignService.create_campaign(business_profile_id, user_id, campaign_data)
        
        return jsonify({
            'data': campaign.to_dict(),
            'message': 'Campaign created successfully'
        }), 201

    except ValueError as e:
        return jsonify({
            'error': ERROR_VALIDATION_ERROR,
            'message': str(e)
        }), 400
    except Exception as e:
        logger.error(f"Error creating campaign: {e}", exc_info=True)
        return jsonify({
            'error': ERROR_SERVER_ERROR,
            'message': 'Failed to create campaign'
        }), 500

@campaigns_bp.route('/campaigns/<campaign_id>', methods=['GET'])
@jwt_required()
def get_campaign(campaign_id):
    """Get a specific campaign by ID"""
    try:
        user_id = get_jwt_identity()
        campaign = CampaignService.get_campaign_by_id(campaign_id, user_id)
        
        if not campaign:
            return jsonify({
                'error': ERROR_NOT_FOUND,
                'message': 'Campaign not found'
            }), 404
        
        return jsonify({
            'data': campaign.to_dict()
        }), 200

    except Exception as e:
        logger.error(f"Error getting campaign: {e}", exc_info=True)
        return jsonify({
            'error': ERROR_SERVER_ERROR,
            'message': 'Failed to get campaign'
        }), 500

@campaigns_bp.route('/campaigns/<campaign_id>', methods=['PUT'])
@jwt_required()
def update_campaign(campaign_id):
    """Update an existing campaign"""
    try:
        user_id = get_jwt_identity()
        
        if not request.is_json:
            return jsonify({
                'error': ERROR_VALIDATION_ERROR,
                'message': 'Request must be JSON'
            }), 400
        
        update_data = request.get_json()
        campaign = CampaignService.update_campaign(campaign_id, user_id, update_data)
        
        return jsonify({
            'data': campaign.to_dict(),
            'message': 'Campaign updated successfully'
        }), 200

    except ValueError as e:
        if "not found" in str(e).lower():
            return jsonify({
                'error': ERROR_NOT_FOUND,
                'message': str(e)
            }), 404
        else:
            return jsonify({
                'error': ERROR_VALIDATION_ERROR,
                'message': str(e)
            }), 400
    except Exception as e:
        logger.error(f"Error updating campaign: {e}", exc_info=True)
        return jsonify({
            'error': ERROR_SERVER_ERROR,
            'message': 'Failed to update campaign'
        }), 500

@campaigns_bp.route('/campaigns/<campaign_id>', methods=['DELETE'])
@jwt_required()
def delete_campaign(campaign_id):
    """Delete a campaign"""
    try:
        user_id = get_jwt_identity()
        CampaignService.delete_campaign(campaign_id, user_id)
        
        return jsonify({
            'message': 'Campaign deleted successfully'
        }), 200

    except ValueError as e:
        return jsonify({
            'error': ERROR_NOT_FOUND,
            'message': str(e)
        }), 404
    except Exception as e:
        logger.error(f"Error deleting campaign: {e}", exc_info=True)
        return jsonify({
            'error': ERROR_SERVER_ERROR,
            'message': 'Failed to delete campaign'
        }), 500

@campaigns_bp.route('/business-profiles/<business_profile_id>/campaigns/generate', methods=['POST'])
@jwt_required()
def generate_campaign(business_profile_id):
    """Generate a new campaign using AI agent"""
    try:
        user_id = get_jwt_identity()
        
        if not request.is_json:
            return jsonify({
                'error': ERROR_VALIDATION_ERROR,
                'message': 'Request must be JSON'
            }), 400
        
        request_data = request.get_json()
        
        # Get the campaign generator agent
        agent = AgentRegistry.get('campaign-generator')
        if not agent:
            return jsonify({
                'error': ERROR_NOT_FOUND,
                'message': 'Campaign generator agent not available'
            }), 404
        
        # Prepare agent input
        agent_input = AgentInput(
            agent_type='campaign-generator',
            parameters={
                'business_profile_id': business_profile_id,
                'campaign_goal': request_data.get('campaign_goal'),
                'budget': request_data.get('budget'),
                'deadline': request_data.get('deadline'),
                'selected_products': request_data.get('selected_products', [])
            },
            business_profile_id=business_profile_id,
            user_id=user_id
        )
        
        # Execute agent (note: agent.execute is async but we need to handle it in Flask)
        import asyncio
        result = asyncio.run(agent.execute(agent_input))
        
        if not result.success:
            logger.error(f"Campaign generation failed: {result.error}")
            return jsonify({
                'error': ERROR_SERVER_ERROR,
                'message': result.error or 'Campaign generation failed'
            }), 500
        
        return jsonify({
            'data': result.data,
            'message': 'Campaign strategy generated successfully'
        }), 200

    except ValueError as e:
        return jsonify({
            'error': ERROR_VALIDATION_ERROR,
            'message': str(e)
        }), 400
    except Exception as e:
        logger.error(f"Error generating campaign: {e}", exc_info=True)
        return jsonify({
            'error': ERROR_SERVER_ERROR,
            'message': 'Failed to generate campaign'
        }), 500

@campaigns_bp.route('/business-profiles/<business_profile_id>/campaigns/save', methods=['POST'])
@jwt_required()
def save_generated_campaign(business_profile_id):
    """Save a generated campaign strategy to database"""
    try:
        user_id = get_jwt_identity()
        
        if not request.is_json:
            return jsonify({
                'error': ERROR_VALIDATION_ERROR,
                'message': 'Request must be JSON'
            }), 400
        
        request_data = request.get_json()
        
        # Extract campaign parameters and generated data
        campaign_params = request_data.get('campaign_params', {})
        campaign_data = request_data.get('campaign_data', {})
        
        if not campaign_params or not campaign_data:
            return jsonify({
                'error': ERROR_VALIDATION_ERROR,
                'message': 'Both campaign_params and campaign_data are required'
            }), 400
        
        # Save the campaign
        campaign = CampaignGenerationService.save_generated_campaign(
            business_profile_id, user_id, campaign_params, campaign_data
        )
        
        return jsonify({
            'data': campaign.to_dict(),
            'message': 'Campaign saved successfully'
        }), 201

    except ValueError as e:
        return jsonify({
            'error': ERROR_VALIDATION_ERROR,
            'message': str(e)
        }), 400
    except Exception as e:
        logger.error(f"Error saving generated campaign: {e}", exc_info=True)
        return jsonify({
            'error': ERROR_SERVER_ERROR,
            'message': 'Failed to save campaign'
        }), 500

@campaigns_bp.route('/campaigns/count', methods=['GET'])
@jwt_required()
def get_campaigns_count():
    """Get count of campaigns, optionally filtered by business profile"""
    try:
        user_id = get_jwt_identity()
        business_profile_id = request.args.get('business_profile_id')
        
        query = Campaign.query.filter_by(user_id=user_id)
        
        if business_profile_id:
            # Verify business profile ownership if filtering
            from ..models.business_profile import BusinessProfile
            business_profile = BusinessProfile.query.filter_by(
                id=business_profile_id, user_id=user_id
            ).first()
            
            if not business_profile:
                return jsonify({
                    'error': ERROR_NOT_FOUND,
                    'message': 'Business profile not found'
                }), 404
            
            query = query.filter_by(business_profile_id=business_profile_id)
        
        count = query.count()
        
        return jsonify({
            'data': {'count': count}
        }), 200

    except Exception as e:
        logger.error(f"Error getting campaigns count: {e}", exc_info=True)
        return jsonify({
            'error': ERROR_SERVER_ERROR,
            'message': 'Failed to get campaigns count'
        }), 500