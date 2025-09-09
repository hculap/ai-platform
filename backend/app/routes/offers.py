from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models.offer import Offer
from ..models.business_profile import BusinessProfile
from .. import db
from ..utils.messages import (
    get_message,
    ERROR_VALIDATION_ERROR, ERROR_NOT_FOUND, ERROR_SERVER_ERROR
)

offers_bp = Blueprint('offers', __name__)

@offers_bp.route('/business-profiles/<business_profile_id>/offers', methods=['GET'])
@jwt_required()
def get_offers(business_profile_id):
    """Get all offers for a specific business profile"""
    try:
        user_id = get_jwt_identity()

        # Verify business profile ownership
        business_profile = BusinessProfile.query.filter_by(
            id=business_profile_id, user_id=user_id
        ).first()

        if not business_profile:
            return jsonify({
                'error': ERROR_NOT_FOUND,
                'message': 'Business profile not found'
            }), 404

        # Get offers for this business profile
        offers = Offer.query.filter_by(business_profile_id=business_profile_id).all()

        return jsonify({
            'data': [offer.to_dict() for offer in offers]
        }), 200

    except Exception as e:
        return jsonify({
            'error': ERROR_SERVER_ERROR,
            'message': 'Failed to retrieve offers'
        }), 500

@offers_bp.route('/offers/<offer_id>', methods=['GET'])
@jwt_required()
def get_offer(offer_id):
    """Get specific offer"""
    try:
        user_id = get_jwt_identity()

        # Get offer with business profile ownership check
        offer = Offer.query.join(BusinessProfile).filter(
            Offer.id == offer_id,
            BusinessProfile.user_id == user_id
        ).first()

        if not offer:
            return jsonify({
                'error': ERROR_NOT_FOUND,
                'message': 'Offer not found'
            }), 404

        return jsonify(offer.to_dict()), 200

    except Exception as e:
        return jsonify({
            'error': ERROR_SERVER_ERROR,
            'message': 'Failed to retrieve offer'
        }), 500

@offers_bp.route('/business-profiles/<business_profile_id>/offers', methods=['POST'])
@jwt_required()
def create_offer(business_profile_id):
    """Create a new offer for a business profile"""
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
                'message': 'Business profile not found or access denied'
            }), 403

        data = request.get_json()

        # Validate required fields
        required_fields = ['type', 'name', 'unit', 'price']
        missing_fields = [field for field in required_fields if not data.get(field)]
        
        if missing_fields:
            return jsonify({
                'error': ERROR_VALIDATION_ERROR,
                'message': f'Missing required fields: {", ".join(missing_fields)}'
            }), 400

        # Validate offer type
        if not Offer.validate_type(data['type']):
            return jsonify({
                'error': ERROR_VALIDATION_ERROR,
                'message': 'Invalid offer type. Must be "product" or "service"'
            }), 400

        # Validate unit
        if not Offer.validate_unit(data['unit']):
            return jsonify({
                'error': ERROR_VALIDATION_ERROR,
                'message': 'Invalid unit format'
            }), 400

        # Validate price
        try:
            price = float(data['price'])
            if price < 0:
                return jsonify({
                    'error': ERROR_VALIDATION_ERROR,
                    'message': 'Price cannot be negative'
                }), 400
        except (ValueError, TypeError):
            return jsonify({
                'error': ERROR_VALIDATION_ERROR,
                'message': 'Invalid price format'
            }), 400

        # Validate status if provided
        status = data.get('status', 'draft')
        if not Offer.validate_status(status):
            return jsonify({
                'error': ERROR_VALIDATION_ERROR,
                'message': 'Invalid status. Must be "draft", "published", or "archived"'
            }), 400

        # Create offer
        offer = Offer(
            business_profile_id=business_profile_id,
            type=data['type'],
            name=data['name'],
            description=data.get('description'),
            unit=data['unit'],
            price=price,
            status=status
        )

        db.session.add(offer)
        db.session.commit()

        return jsonify({
            'id': offer.id,
            'message': 'Offer created successfully'
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'error': ERROR_SERVER_ERROR,
            'message': 'Failed to create offer'
        }), 500

@offers_bp.route('/offers/<offer_id>', methods=['PUT'])
@jwt_required()
def update_offer(offer_id):
    """Update offer"""
    try:
        user_id = get_jwt_identity()

        # Get offer with business profile ownership check
        offer = Offer.query.join(BusinessProfile).filter(
            Offer.id == offer_id,
            BusinessProfile.user_id == user_id
        ).first()

        if not offer:
            return jsonify({
                'error': ERROR_NOT_FOUND,
                'message': 'Offer not found'
            }), 404

        data = request.get_json()

        # Validate fields if provided
        if 'type' in data and not Offer.validate_type(data['type']):
            return jsonify({
                'error': ERROR_VALIDATION_ERROR,
                'message': 'Invalid offer type. Must be "product" or "service"'
            }), 400

        if 'unit' in data and not Offer.validate_unit(data['unit']):
            return jsonify({
                'error': ERROR_VALIDATION_ERROR,
                'message': 'Invalid unit format'
            }), 400

        if 'price' in data:
            try:
                price = float(data['price'])
                if price < 0:
                    return jsonify({
                        'error': ERROR_VALIDATION_ERROR,
                        'message': 'Price cannot be negative'
                    }), 400
            except (ValueError, TypeError):
                return jsonify({
                    'error': ERROR_VALIDATION_ERROR,
                    'message': 'Invalid price format'
                }), 400

        if 'status' in data and not Offer.validate_status(data['status']):
            return jsonify({
                'error': ERROR_VALIDATION_ERROR,
                'message': 'Invalid status. Must be "draft", "published", or "archived"'
            }), 400

        # Update offer using the model's update method
        offer.update_from_dict(data)
        db.session.commit()

        return jsonify({
            'id': offer.id,
            'updated_at': offer.updated_at.isoformat(),
            'message': 'Offer updated successfully'
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'error': ERROR_SERVER_ERROR,
            'message': 'Failed to update offer'
        }), 500

@offers_bp.route('/offers/<offer_id>', methods=['DELETE'])
@jwt_required()
def delete_offer(offer_id):
    """Delete offer"""
    try:
        user_id = get_jwt_identity()

        # Get offer with business profile ownership check
        offer = Offer.query.join(BusinessProfile).filter(
            Offer.id == offer_id,
            BusinessProfile.user_id == user_id
        ).first()

        if not offer:
            return jsonify({
                'error': ERROR_NOT_FOUND,
                'message': 'Offer not found'
            }), 404

        # Delete the offer
        db.session.delete(offer)
        db.session.commit()

        return jsonify({
            'id': offer_id,
            'message': 'Offer deleted successfully'
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'error': ERROR_SERVER_ERROR,
            'message': 'Failed to delete offer'
        }), 500

@offers_bp.route('/business-profiles/<business_profile_id>/generate-offers', methods=['POST'])
@jwt_required()
def generate_offers(business_profile_id):
    """AI-generate offers for a business profile"""
    import logging
    logger = logging.getLogger(__name__)
    
    logger.info(f"Starting offer generation for business_profile_id: {business_profile_id}")
    
    user_id = get_jwt_identity()
    logger.info(f"User ID: {user_id}")

    # Verify business profile ownership
    try:
        business_profile = BusinessProfile.query.filter_by(
            id=business_profile_id,
            user_id=user_id
        ).first()

        if not business_profile:
            logger.warning(f"Business profile not found or access denied for ID: {business_profile_id}, User: {user_id}")
            return jsonify({
                'error': ERROR_VALIDATION_ERROR,
                'message': 'Business profile not found or access denied'
            }), 403
        
        logger.info(f"Business profile found: {business_profile.name}")
    except Exception as e:
        logger.exception(f"Database error while fetching business profile: {e}")
        raise

    # Import and execute the offer assistant agent
    try:
        from ..agents.base import AgentRegistry
        from ..agents.base import AgentInput
        logger.info("Successfully imported agent modules")
    except Exception as e:
        logger.exception(f"Failed to import agent modules: {e}")
        raise

    # Get the offer assistant agent
    try:
        if 'offer-assistant' not in AgentRegistry._agents:
            available_agents = list(AgentRegistry._agents.keys())
            logger.error(f"Offer Assistant agent not available. Available agents: {available_agents}")
            return jsonify({
                'error': ERROR_SERVER_ERROR,
                'message': f'Offer Assistant agent not available. Available: {available_agents}'
            }), 500

        agent = AgentRegistry.get('offer-assistant')
        logger.info(f"Retrieved agent: {type(agent).__name__}")
    except Exception as e:
        logger.exception(f"Failed to get offer assistant agent: {e}")
        raise

    # Create agent input
    try:
        agent_input = AgentInput(
            agent_type='offer-assistant',
            parameters={
                'business_profile_id': business_profile_id
            },
            business_profile_id=business_profile_id,
            user_id=user_id
        )
        logger.info("Created agent input successfully")
    except Exception as e:
        logger.exception(f"Failed to create agent input: {e}")
        raise

    # Execute the agent
    try:
        logger.info("Starting agent execution...")
        result = agent.execute(agent_input)
        logger.info(f"Agent execution completed. Success: {result.success}")
        
        if not result.success:
            logger.error(f"Agent execution failed: {result.error}")
            logger.error(f"Agent result data: {result.data}")
            
            return jsonify({
                'error': ERROR_SERVER_ERROR,
                'message': f'Failed to generate offers: {result.error}'
            }), 500
            
        logger.info("Agent execution successful")
    except Exception as e:
        logger.exception(f"Exception during agent execution: {e}")
        return jsonify({
            'error': ERROR_SERVER_ERROR,
            'message': f'Failed to execute agent: {str(e)}'
        }), 500

    logger.info("Offer generation completed successfully")
    return jsonify({
        'message': 'Offers generated successfully',
        'data': result.data
    }), 200

@offers_bp.route('/business-profiles/<business_profile_id>/save-selected-offers', methods=['POST'])
@jwt_required()
def save_selected_offers(business_profile_id):
    """Save selected offers from AI generation"""
    import logging
    logger = logging.getLogger(__name__)
    
    logger.info(f"Starting save selected offers for business_profile_id: {business_profile_id}")
    
    user_id = get_jwt_identity()
    
    # Verify business profile ownership
    try:
        business_profile = BusinessProfile.query.filter_by(
            id=business_profile_id,
            user_id=user_id
        ).first()
        if not business_profile:
            logger.warning(f"Business profile not found or access denied for ID: {business_profile_id}, User: {user_id}")
            return jsonify({
                'error': ERROR_VALIDATION_ERROR,
                'message': 'Business profile not found or access denied'
            }), 403
    except Exception as e:
        logger.exception(f"Database error while fetching business profile: {e}")
        return jsonify({
            'error': ERROR_SERVER_ERROR,
            'message': 'Database error occurred'
        }), 500
    
    # Get selected offers from request
    try:
        data = request.get_json()
        if not data or 'selected_offers' not in data:
            return jsonify({
                'error': ERROR_VALIDATION_ERROR,
                'message': 'selected_offers array is required'
            }), 400
            
        selected_offers = data['selected_offers']
        if not isinstance(selected_offers, list):
            return jsonify({
                'error': ERROR_VALIDATION_ERROR,
                'message': 'selected_offers must be an array'
            }), 400
            
        logger.info(f"Received {len(selected_offers)} offers to save")
        
    except Exception as e:
        logger.exception(f"Error parsing request data: {e}")
        return jsonify({
            'error': ERROR_SERVER_ERROR,
            'message': 'Invalid request data'
        }), 400
    
    # Save selected offers using the OfferGenerationService
    try:
        from ..services.offer_service import OfferGenerationService
        
        created_offers = OfferGenerationService.save_generated_offers(
            business_profile_id, user_id, selected_offers
        )
        
        logger.info(f"Successfully saved {len(created_offers)} selected offers")
        
        return jsonify({
            'message': f'Successfully saved {len(created_offers)} offers',
            'offers_count': len(created_offers),
            'offers': [offer.to_dict() for offer in created_offers]
        }), 200
        
    except Exception as e:
        logger.exception(f"Error saving selected offers: {e}")
        db.session.rollback()
        return jsonify({
            'error': ERROR_SERVER_ERROR,
            'message': f'Failed to save offers: {str(e)}'
        }), 500

@offers_bp.route('/debug/agent-status', methods=['GET'])
@jwt_required()
def debug_agent_status():
    """Debug endpoint to check agent registration and basic functionality"""
    import logging
    logger = logging.getLogger(__name__)
    
    try:
        from ..agents.base import AgentRegistry
        
        # Check agent registry
        available_agents = list(AgentRegistry._agents.keys())
        logger.info(f"Available agents: {available_agents}")
        
        # Check if offer assistant is registered
        has_offer_assistant = 'offer-assistant' in AgentRegistry._agents
        
        # Get agent info if available
        agent_info = None
        if has_offer_assistant:
            try:
                agent = AgentRegistry.get('offer-assistant')
                agent_info = {
                    'type': type(agent).__name__,
                    'tools': getattr(agent, 'tools', 'N/A'),
                    'description': getattr(agent, 'description', 'N/A')
                }
            except Exception as e:
                logger.exception(f"Error getting agent info: {e}")
                agent_info = {'error': str(e)}
        
        return jsonify({
            'agent_registry_available': True,
            'available_agents': available_agents,
            'offer_assistant_registered': has_offer_assistant,
            'offer_assistant_info': agent_info
        }), 200
        
    except Exception as e:
        logger.exception(f"Debug endpoint failed: {e}")
        return jsonify({
            'error': str(e),
            'agent_registry_available': False
        }), 500

@offers_bp.route('/offers/count', methods=['GET'])
@jwt_required()
def get_offers_count():
    """Get count of offers for the user, optionally filtered by business profile"""
    try:
        user_id = get_jwt_identity()
        business_profile_id = request.args.get('business_profile_id')

        if business_profile_id:
            # Verify business profile ownership
            business_profile = BusinessProfile.query.filter_by(
                id=business_profile_id, user_id=user_id
            ).first()

            if not business_profile:
                return jsonify({
                    'error': ERROR_NOT_FOUND,
                    'message': 'Business profile not found'
                }), 404

            # Count offers for specific business profile
            count = Offer.query.filter_by(business_profile_id=business_profile_id).count()
        else:
            # Count all offers for user's business profiles
            count = Offer.query.join(BusinessProfile).filter(
                BusinessProfile.user_id == user_id
            ).count()

        return jsonify({
            'count': count
        }), 200

    except Exception as e:
        return jsonify({
            'error': ERROR_SERVER_ERROR,
            'message': 'Failed to retrieve offers count'
        }), 500