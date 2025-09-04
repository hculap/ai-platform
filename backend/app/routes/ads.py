"""
Flask routes for ads management.
Provides REST API endpoints for ad CRUD operations and creative generation.
"""

import logging
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.exceptions import BadRequest

from ..models.ad import Ad
from ..models.business_profile import BusinessProfile
from ..models.offer import Offer
from ..models.campaign import Campaign
from ..utils.messages import (
    get_message,
    ERROR_VALIDATION_ERROR, ERROR_NOT_FOUND, ERROR_SERVER_ERROR
)
from .. import db

logger = logging.getLogger(__name__)

ads_bp = Blueprint('ads', __name__)

@ads_bp.route('/business-profiles/<business_profile_id>/ads', methods=['GET'])
@jwt_required()
def get_ads(business_profile_id):
    """Get all ads for a specific business profile"""
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
        
        # Get ads with optional filtering
        query = Ad.query.filter_by(business_profile_id=business_profile_id, user_id=user_id)
        
        # Filter by platform if provided
        platform = request.args.get('platform')
        if platform:
            query = query.filter_by(platform=platform)
        
        # Filter by format if provided
        format = request.args.get('format')
        if format:
            query = query.filter_by(format=format)
        
        # Filter by status if provided
        status = request.args.get('status')
        if status:
            query = query.filter_by(status=status)
        
        # Filter by context if provided
        context_type = request.args.get('context_type')
        context_id = request.args.get('context_id')
        if context_type and context_id:
            if context_type == 'offer':
                query = query.filter_by(offer_id=context_id)
            elif context_type == 'campaign':
                query = query.filter_by(campaign_id=context_id)
        
        ads = query.order_by(Ad.created_at.desc()).all()
        
        return jsonify({
            'data': [ad.to_dict() for ad in ads]
        }), 200

    except Exception as e:
        logger.error(f"Error getting ads: {e}", exc_info=True)
        return jsonify({
            'error': ERROR_SERVER_ERROR,
            'message': 'Failed to get ads'
        }), 500

@ads_bp.route('/business-profiles/<business_profile_id>/ads', methods=['POST'])
@jwt_required()
def create_ad(business_profile_id):
    """Create a new ad manually (not via agent)"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data:
            return jsonify({
                'error': ERROR_VALIDATION_ERROR,
                'message': 'Request body is required'
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
        required_fields = ['platform', 'format', 'action']
        for field in required_fields:
            if not data.get(field):
                return jsonify({
                    'error': ERROR_VALIDATION_ERROR,
                    'message': f'{field} is required'
                }), 400
        
        # Validate platform, format, action
        if not Ad.validate_platform(data['platform']):
            return jsonify({
                'error': ERROR_VALIDATION_ERROR,
                'message': f'Invalid platform. Must be one of: {", ".join(Ad.PLATFORM_OPTIONS)}'
            }), 400
        
        if not Ad.validate_format(data['format']):
            return jsonify({
                'error': ERROR_VALIDATION_ERROR,
                'message': f'Invalid format. Must be one of: {", ".join(Ad.FORMAT_OPTIONS)}'
            }), 400
        
        if not Ad.validate_action(data['action']):
            return jsonify({
                'error': ERROR_VALIDATION_ERROR,
                'message': f'Invalid action. Must be one of: {", ".join(Ad.ACTION_OPTIONS)}'
            }), 400
        
        # Validate context (exactly one of offer_id or campaign_id)
        offer_id = data.get('offer_id')
        campaign_id = data.get('campaign_id')
        
        if not Ad.validate_context(offer_id, campaign_id):
            return jsonify({
                'error': ERROR_VALIDATION_ERROR,
                'message': 'Exactly one of offer_id or campaign_id must be provided'
            }), 400
        
        # Validate context existence and ownership
        if offer_id:
            offer = Offer.query.filter_by(
                id=offer_id,
                business_profile_id=business_profile_id
            ).first()
            if not offer:
                return jsonify({
                    'error': ERROR_NOT_FOUND,
                    'message': 'Offer not found'
                }), 404
        
        if campaign_id:
            campaign = Campaign.query.filter_by(
                id=campaign_id,
                business_profile_id=business_profile_id,
                user_id=user_id
            ).first()
            if not campaign:
                return jsonify({
                    'error': ERROR_NOT_FOUND,
                    'message': 'Campaign not found'
                }), 404
        
        
        # Create ad
        ad = Ad(
            business_profile_id=business_profile_id,
            user_id=user_id,
            platform=data['platform'],
            format=data['format'],
            action=data['action'],
            offer_id=offer_id,
            campaign_id=campaign_id,
            headline=data.get('headline'),
            status=data.get('status', 'draft')
        )
        
        # Set optional fields
        optional_fields = ['primary_text', 'visual_brief', 'overlay_text', 
                          'script_text', 'cta', 'asset_url', 'landing_url']
        for field in optional_fields:
            if data.get(field):
                setattr(ad, field, data[field])
        
        db.session.add(ad)
        db.session.commit()
        
        return jsonify({
            'message': 'Ad created successfully',
            'data': ad.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        logger.error(f"Error creating ad: {e}", exc_info=True)
        return jsonify({
            'error': ERROR_SERVER_ERROR,
            'message': 'Failed to create ad'
        }), 500

@ads_bp.route('/ads/<ad_id>', methods=['GET'])
@jwt_required()
def get_ad(ad_id):
    """Get a specific ad by ID"""
    try:
        user_id = get_jwt_identity()
        
        ad = Ad.query.filter_by(id=ad_id, user_id=user_id).first()
        
        if not ad:
            return jsonify({
                'error': ERROR_NOT_FOUND,
                'message': 'Ad not found'
            }), 404
        
        return jsonify({
            'data': ad.to_dict()
        }), 200

    except Exception as e:
        logger.error(f"Error getting ad: {e}", exc_info=True)
        return jsonify({
            'error': ERROR_SERVER_ERROR,
            'message': 'Failed to get ad'
        }), 500

@ads_bp.route('/ads/<ad_id>', methods=['PUT'])
@jwt_required()
def update_ad(ad_id):
    """Update an existing ad"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data:
            return jsonify({
                'error': ERROR_VALIDATION_ERROR,
                'message': 'Request body is required'
            }), 400
        
        ad = Ad.query.filter_by(id=ad_id, user_id=user_id).first()
        
        if not ad:
            return jsonify({
                'error': ERROR_NOT_FOUND,
                'message': 'Ad not found'
            }), 404
        
        # Validate fields if being updated
        if 'platform' in data and not Ad.validate_platform(data['platform']):
            return jsonify({
                'error': ERROR_VALIDATION_ERROR,
                'message': f'Invalid platform. Must be one of: {", ".join(Ad.PLATFORM_OPTIONS)}'
            }), 400
        
        if 'format' in data and not Ad.validate_format(data['format']):
            return jsonify({
                'error': ERROR_VALIDATION_ERROR,
                'message': f'Invalid format. Must be one of: {", ".join(Ad.FORMAT_OPTIONS)}'
            }), 400
        
        if 'action' in data and not Ad.validate_action(data['action']):
            return jsonify({
                'error': ERROR_VALIDATION_ERROR,
                'message': f'Invalid action. Must be one of: {", ".join(Ad.ACTION_OPTIONS)}'
            }), 400
        
        if 'status' in data and not Ad.validate_status(data['status']):
            return jsonify({
                'error': ERROR_VALIDATION_ERROR,
                'message': 'Invalid status. Must be one of: draft, published, archived'
            }), 400
        
        # Update ad
        ad.update_from_dict(data)
        db.session.commit()
        
        return jsonify({
            'message': 'Ad updated successfully',
            'data': ad.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f"Error updating ad: {e}", exc_info=True)
        return jsonify({
            'error': ERROR_SERVER_ERROR,
            'message': 'Failed to update ad'
        }), 500

@ads_bp.route('/ads/<ad_id>', methods=['DELETE'])
@jwt_required()
def delete_ad(ad_id):
    """Delete an ad"""
    try:
        user_id = get_jwt_identity()
        
        ad = Ad.query.filter_by(id=ad_id, user_id=user_id).first()
        
        if not ad:
            return jsonify({
                'error': ERROR_NOT_FOUND,
                'message': 'Ad not found'
            }), 404
        
        db.session.delete(ad)
        db.session.commit()
        
        return jsonify({
            'message': 'Ad deleted successfully'
        }), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f"Error deleting ad: {e}", exc_info=True)
        return jsonify({
            'error': ERROR_SERVER_ERROR,
            'message': 'Failed to delete ad'
        }), 500

@ads_bp.route('/business-profiles/<business_profile_id>/ads/batch', methods=['POST'])
@jwt_required()
def create_ads_batch(business_profile_id):
    """Create multiple ads in batch for a specific business profile"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data or 'ads' not in data or not isinstance(data['ads'], list):
            return jsonify({
                'error': ERROR_VALIDATION_ERROR,
                'message': 'Request must contain an "ads" array'
            }), 400
        
        if len(data['ads']) == 0:
            return jsonify({
                'error': ERROR_VALIDATION_ERROR,
                'message': 'At least one ad is required'
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
        
        created_ads = []
        
        for ad_data in data['ads']:
            # Validate required fields
            required_fields = ['platform', 'format', 'action']
            for field in required_fields:
                if field not in ad_data:
                    return jsonify({
                        'error': ERROR_VALIDATION_ERROR,
                        'message': f'Missing required field: {field}'
                    }), 400
            
            # Validate platform, format, action
            if not Ad.validate_platform(ad_data['platform']):
                return jsonify({
                    'error': ERROR_VALIDATION_ERROR,
                    'message': f'Invalid platform: {ad_data["platform"]}'
                }), 400
                
            if not Ad.validate_format(ad_data['format']):
                return jsonify({
                    'error': ERROR_VALIDATION_ERROR,
                    'message': f'Invalid format: {ad_data["format"]}'
                }), 400
                
            if not Ad.validate_action(ad_data['action']):
                return jsonify({
                    'error': ERROR_VALIDATION_ERROR,
                    'message': f'Invalid action: {ad_data["action"]}'
                }), 400
            
            # Validate context (exactly one of offer_id or campaign_id)
            offer_id = ad_data.get('offer_id')
            campaign_id = ad_data.get('campaign_id')
            
            if not Ad.validate_context(offer_id, campaign_id):
                return jsonify({
                    'error': ERROR_VALIDATION_ERROR,
                    'message': 'Exactly one of offer_id or campaign_id must be provided'
                }), 400
            
            # Verify offer or campaign exists
            if offer_id:
                offer = Offer.query.filter_by(
                    id=offer_id,
                    business_profile_id=business_profile_id
                ).first()
                if not offer:
                    return jsonify({
                        'error': ERROR_NOT_FOUND,
                        'message': f'Offer not found: {offer_id}'
                    }), 404
            
            if campaign_id:
                campaign = Campaign.query.filter_by(
                    id=campaign_id,
                    business_profile_id=business_profile_id,
                    user_id=user_id
                ).first()
                if not campaign:
                    return jsonify({
                        'error': ERROR_NOT_FOUND,
                        'message': f'Campaign not found: {campaign_id}'
                    }), 404
            
            
            # Create ad
            ad = Ad(
                business_profile_id=business_profile_id,
                user_id=user_id,
                platform=ad_data['platform'],
                format=ad_data['format'],
                action=ad_data['action'],
                offer_id=offer_id,
                campaign_id=campaign_id,
                headline=ad_data.get('headline'),
                status=ad_data.get('status', 'draft')
            )
            
            # Set optional fields
            optional_fields = ['primary_text', 'visual_brief', 'overlay_text', 
                              'script_text', 'cta', 'asset_url', 'landing_url']
            for field in optional_fields:
                if ad_data.get(field):
                    setattr(ad, field, ad_data[field])
            
            db.session.add(ad)
            created_ads.append(ad)
        
        # Commit all ads at once
        db.session.commit()
        
        return jsonify({
            'message': f'Successfully created {len(created_ads)} ads',
            'data': [ad.to_dict() for ad in created_ads]
        }), 201

    except Exception as e:
        db.session.rollback()
        logger.error(f"Error creating ads batch: {e}", exc_info=True)
        return jsonify({
            'error': ERROR_SERVER_ERROR,
            'message': 'Failed to create ads batch'
        }), 500

