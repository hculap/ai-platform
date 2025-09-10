"""
Flask routes for agent management and execution.
Provides REST API endpoints for agents as specified in API_SCHEMA.md.
"""

import time
import logging
from typing import Dict, Any, Optional
from functools import wraps

from flask import Blueprint, request, jsonify, Response, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request
from werkzeug.exceptions import NotFound, BadRequest

from ..agents.base import AgentRegistry, AgentInput
from ..models.interaction import Interaction
from ..models.ad import Ad
from ..models.script import Script
from ..models.business_profile import BusinessProfile
from .. import db
from ..utils.messages import (
    get_message, ERROR_VALIDATION_ERROR, ERROR_UNAUTHORIZED,
    ERROR_NOT_FOUND, ERROR_SERVER_ERROR
)

# Create logger for this module
logger = logging.getLogger('app.routes.agents')


def _process_headlines_result(headlines_data: Dict[str, Any], request_data: Dict[str, Any], user_id: str) -> Dict[str, Any]:
    """
    Process headlines result by creating Ad records in the database.
    
    Args:
        headlines_data: The headlines data from the AI agent
        request_data: The original request data
        user_id: The user ID
    
    Returns:
        Processed data with created_ads array
    """
    input_params = request_data.get('input', {})
    headlines = headlines_data.get('headlines', [])
    
    created_ads = []
    business_profile_id = input_params.get('business_profile_id')
    
    for headline_data in headlines:
        headline_text = headline_data.get('headline', '') if isinstance(headline_data, dict) else str(headline_data)
        
        if headline_text.strip():
            ad = Ad(
                business_profile_id=business_profile_id,
                user_id=user_id,
                platform=input_params.get('platform'),
                format=input_params.get('format'),
                action=input_params.get('action'),
                offer_id=input_params.get('offer_id'),
                campaign_id=input_params.get('campaign_id'),
                headline=headline_text.strip(),
                status='draft'
            )
            
            # Add landing_url if provided
            if input_params.get('landing_url'):
                ad.landing_url = input_params['landing_url']
            
            db.session.add(ad)
            created_ads.append(ad)
    
    # Commit to database
    db.session.commit()
    
    # Convert to dict for response
    ads_data = [ad.to_dict() for ad in created_ads]
    
    return {
        'headlines': headlines,
        'created_ads': ads_data,
        'ads_count': len(created_ads),
        'business_profile_id': business_profile_id
    }


# Create blueprint for agent routes
agents_bp = Blueprint('agents', __name__, url_prefix='/api/agents')

# Simple debug route
@agents_bp.route('/debug', methods=['GET'])
def debug_route():
    """Debug route to test if Flask is working."""
    return jsonify({
        'message': 'Debug route working',
        'agents_available': len(AgentRegistry.list_agents())
    })


def conditional_auth(f):
    """
    Decorator for conditional authentication based on agent's public_access property.
    Public agents don't require authentication, private agents do.
    For interaction endpoints, authentication is always required since they deal with user-specific data.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Check if this is an interaction endpoint (always requires auth)
        if request.endpoint and 'interaction' in request.endpoint:
            return jwt_required()(f)(*args, **kwargs)

        # Get agent slug from URL parameters
        agent_slug = kwargs.get('slug')
        if not agent_slug:
            # If no slug in kwargs, try to get from request view_args
            agent_slug = request.view_args.get('slug')

        if agent_slug:
            # Get agent from registry
            agent = AgentRegistry.get(agent_slug)
            if agent and hasattr(agent, 'is_public') and agent.is_public:
                # Public agent - no authentication required
                return f(*args, **kwargs)

        # Private agent or no agent found - require authentication
        return jwt_required()(f)(*args, **kwargs)

    return decorated_function


@agents_bp.route('/', methods=['GET'])
@agents_bp.route('', methods=['GET'])
def list_agents():
    """Get all available agents as specified in API_SCHEMA.md."""
    try:
        agents_list = []
        for agent_type, agent in AgentRegistry.list_agents():
            # Convert agent tools to API schema format
            tools = []
            for tool_name, tool in agent.capabilities.tools.items():
                tools.append({
                    'name': getattr(tool, 'name', tool_name),
                    'slug': getattr(tool, 'slug', tool_name)
                })

            agents_list.append({
                'id': agent.slug,
                'name': agent.name,
                'slug': agent.slug,
                'description': agent.description,
                'tools': tools
            })

        return jsonify({'data': agents_list})

    except Exception as error:
        from .. import log_exception
        log_exception(logger, error, "Error fetching agents list")
        return jsonify({
            'error': ERROR_SERVER_ERROR,
            'message': get_message(ERROR_SERVER_ERROR)
        }), 500


@agents_bp.route('/<string:slug>/', methods=['GET'])
@agents_bp.route('/<string:slug>', methods=['GET'])
def get_agent(slug: str):
    """Get specific agent information as specified in API_SCHEMA.md."""
    try:
        agent = AgentRegistry.get(slug)

        if not agent:
            return jsonify({
                'error': ERROR_NOT_FOUND,
                'message': get_message(ERROR_NOT_FOUND)
            }), 404

        # Convert agent tools to API schema format
        tools = []
        for tool_name, tool in agent.capabilities.tools.items():
            tools.append({
                'name': getattr(tool, 'name', tool_name),
                'slug': getattr(tool, 'slug', tool_name),
                'description': getattr(tool, 'description', '')
            })

        return jsonify({
            'id': agent.slug,
            'name': agent.name,
            'slug': agent.slug,
            'description': agent.description,
            'tools': tools
        })

    except Exception as error:
        print(f'Error fetching agent: {error}')
        return jsonify({
            'error': ERROR_SERVER_ERROR,
            'message': get_message(ERROR_SERVER_ERROR)
        }), 500


# ============================================================================
# TOOLS ENDPOINTS (API Schema Compatible)
# ============================================================================

@agents_bp.route('/<string:slug>/tools/', methods=['GET'])
@agents_bp.route('/<string:slug>/tools', methods=['GET'])
@conditional_auth
def get_agent_tools(slug: str):
    """Get tools for a specific agent as specified in API_SCHEMA.md."""
    try:
        agent = AgentRegistry.get(slug)

        if not agent:
            return jsonify({
                'error': ERROR_NOT_FOUND,
                'message': get_message(ERROR_NOT_FOUND)
            }), 404

        tools = []
        for tool_name, tool in agent.capabilities.tools.items():
            tools.append({
                'name': getattr(tool, 'name', tool_name),
                'slug': getattr(tool, 'slug', tool_name),
                'description': getattr(tool, 'description', '')
            })

        return jsonify({'data': tools})

    except Exception as error:
        print(f'Error fetching agent tools: {error}')
        return jsonify({
            'error': ERROR_SERVER_ERROR,
            'message': get_message(ERROR_SERVER_ERROR)
        }), 500


@agents_bp.route('/<string:slug>/tools/<string:tool_slug>/call/', methods=['POST', 'GET'])
@agents_bp.route('/<string:slug>/tools/<string:tool_slug>/call', methods=['POST', 'GET'])
@conditional_auth
def execute_tool(slug: str, tool_slug: str):
    """Execute a specific tool or check status as specified in unified API design."""
    try:
        # Handle GET requests for status checking
        if request.method == 'GET':
            return handle_tool_status_check(slug, tool_slug)
        
        # Handle POST requests for tool execution
        data = request.get_json() or {}

        # Get current user (may be None for public agents)
        current_user_id = None

        # Check if Authorization header is present
        auth_header = request.headers.get('Authorization')
        if auth_header:
            try:
                # Verify JWT and get user identity
                verify_jwt_in_request()
                current_user_id = get_jwt_identity()
            except Exception as e:
                pass  # Keep current_user_id as None if JWT verification fails

        # Get agent from registry
        agent = AgentRegistry.get(slug)
        if not agent:
            return jsonify({
                'error': ERROR_NOT_FOUND,
                'message': get_message(ERROR_NOT_FOUND)
            }), 404

        # Check if tool exists
        if tool_slug not in agent.capabilities.tools:
            return jsonify({
                'error': ERROR_NOT_FOUND,
                'message': get_message(ERROR_NOT_FOUND)
            }), 404

        tool = agent.capabilities.tools[tool_slug]

        # Create interaction record if user is authenticated
        # Skip interaction tracking only for unauthenticated users on public agents
        interaction = None
        interaction_id = None
        if current_user_id is not None:
            interaction = Interaction(
                user_id=current_user_id,
                business_profile_id=data.get('business_profile_id'),
                agent_type=agent.slug,
                agent_name=agent.name,
                tool_name=getattr(tool, 'slug', tool_slug),
                tool_description=getattr(tool, 'description', ''),
                input_data={
                    'parameters': data.get('input', {}),
                    'context': data.get('context', {})
                }
            )
            db.session.add(interaction)
            db.session.commit()
            interaction_id = interaction.id

        # Execute tool asynchronously (for now, we'll execute synchronously)
        start_time = time.time()

        try:
            from ..agents.shared.base_tool import ToolInput
            tool_input = ToolInput(
                parameters=data.get('input', {}),
                user_id=current_user_id,
                context={'agent_input': data, 'interaction_id': interaction_id}
            )

            # Check for background mode
            background_mode = data.get('background', False) and tool_slug in ['analyze-website', 'find-competitors', 'enrich-competitor', 'generate-campaign', 'generate-headlines', 'generate-full-creative', 'generate-script-hooks', 'generate-script', 'generate-offers']
            
            # Execute tool synchronously (no more asyncio needed)
            # Check if tool supports background mode
            if background_mode and hasattr(tool.execute, '__code__') and 'background' in tool.execute.__code__.co_varnames:
                result = tool.execute(tool_input, background=background_mode)
            else:
                result = tool.execute(tool_input)
            execution_time = time.time() - start_time

            if result.success:
                # Handle background mode responses
                if background_mode and result.data.get('status') == 'pending':
                    # For background requests, mark interaction as pending
                    if interaction and interaction_id:
                        interaction.status = 'pending'
                        interaction.output_data = result.data
                        db.session.commit()
                    
                    response_data = {
                        'status': 'pending',
                        'data': result.data
                    }
                    if interaction_id:
                        response_data['interaction_id'] = interaction_id
                    
                    return jsonify(response_data)
                
                # Handle regular synchronous responses
                # Process business profile update if this is an analyze-website tool
                business_profile_id = data.get('business_profile_id')
                if business_profile_id and tool_slug == 'analyze-website' and not background_mode:
                    try:
                        from ..models.business_profile import BusinessProfile
                        profile = BusinessProfile.query.filter_by(
                            id=business_profile_id,
                            user_id=current_user_id
                        ).first()

                        if profile:
                            # Update the business profile with analysis results
                            profile.update_analysis_results(result.data)
                            db.session.commit()
                    except Exception as profile_error:
                        print(f'Error updating business profile: {profile_error}')
                        # Don't fail the entire request if profile update fails
                
                # Process ads agent tool results - create Ad records in database
                if tool_slug == 'generate-headlines' and not background_mode:
                    try:
                        # Create Ad records for each generated headline
                        result.data = _process_headlines_result(result.data, data, current_user_id)
                    except Exception as ads_error:
                        print(f'Error processing headlines: {ads_error}')
                        # Don't fail the entire request if ads processing fails

                # Mark interaction as completed (if it exists)
                if interaction and interaction_id:
                    interaction.mark_completed(
                        output_data=result.data,
                        execution_time=execution_time
                    )
                    interaction.agent_version = agent.version
                    interaction.tool_version = getattr(tool, 'version', '1.0.0')
                    db.session.commit()

                response_data = {
                    'status': 'completed',
                    'data': result.data  # Include the actual tool output
                }
                if interaction_id:
                    response_data['interaction_id'] = interaction_id

                return jsonify(response_data)
            else:
                # Mark interaction as failed (if it exists)
                if interaction and interaction_id:
                    interaction.mark_failed(
                        error_message=result.error,
                        execution_time=execution_time
                    )
                    db.session.commit()

                return jsonify({
                    'error': ERROR_SERVER_ERROR,
                    'message': get_message(ERROR_SERVER_ERROR)
                }), 500

        except Exception as tool_error:
            execution_time = time.time() - start_time
            # Mark interaction as failed (if it exists)
            if interaction and interaction_id:
                interaction.mark_failed(
                    error_message=str(tool_error),
                    execution_time=execution_time
                )
                db.session.commit()

            from .. import log_exception
            log_exception(logger, tool_error, f"Tool execution failed - Agent: {slug}, Tool: {tool_slug}")
            return jsonify({
                'error': ERROR_SERVER_ERROR,
                'message': get_message(ERROR_SERVER_ERROR)
            }), 500

    except Exception as error:
        from .. import log_exception
        log_exception(logger, error, f"Execute tool endpoint error - Agent: {slug}, Tool: {tool_slug}")
        return jsonify({
            'error': ERROR_SERVER_ERROR,
            'message': get_message(ERROR_SERVER_ERROR)
        }), 500


def handle_tool_status_check(slug: str, tool_slug: str):
    """Handle GET requests for checking tool execution status."""
    try:
        # Get job_id parameter from query string
        job_id = request.args.get('job_id')
        if not job_id:
            return jsonify({
                'error': ERROR_VALIDATION_ERROR,
                'message': 'job_id parameter is required for status checking'
            }), 400

        # Get current user (may be None for public agents)
        current_user_id = None
        auth_header = request.headers.get('Authorization')
        if auth_header:
            try:
                verify_jwt_in_request()
                current_user_id = get_jwt_identity()
            except Exception:
                pass  # Keep current_user_id as None if JWT verification fails

        # Get agent from registry
        agent = AgentRegistry.get(slug)
        if not agent:
            return jsonify({
                'error': ERROR_NOT_FOUND,
                'message': get_message(ERROR_NOT_FOUND)
            }), 404

        # Check if tool exists
        if tool_slug not in agent.capabilities.tools:
            return jsonify({
                'error': ERROR_NOT_FOUND,
                'message': get_message(ERROR_NOT_FOUND)
            }), 404

        tool = agent.capabilities.tools[tool_slug]

        # Execute status check synchronously (no more asyncio needed)
        start_time = time.time()

        try:
            result = tool.get_status(job_id, current_user_id)
            
            execution_time = time.time() - start_time

            if result.success:
                # Process tool results for async completion
                processed_data = result.data
                
                if tool_slug == 'generate-headlines' and result.data.get('status') == 'completed':
                    # For async headlines, we can't easily create Ad records without original parameters
                    # For now, return the headlines data as-is and let frontend handle it
                    # TODO: Implement proper parameter storage for async jobs
                    pass
                
                elif tool_slug == 'generate-script' and result.data.get('status') == 'completed':
                    # Save completed script to database
                    try:
                        processed_data = _save_background_script(result.data, current_user_id)
                    except Exception as script_error:
                        logger.error(f'Error saving background script: {script_error}')
                        # Don't fail the entire request if script saving fails
                        pass
                
                response_data = {
                    'status': 'completed',
                    'data': processed_data
                }
                return jsonify(response_data)
            else:
                return jsonify({
                    'error': ERROR_SERVER_ERROR,
                    'message': result.error or get_message(ERROR_SERVER_ERROR)
                }), 500

        except Exception as tool_error:
            execution_time = time.time() - start_time
            from .. import log_exception
            log_exception(logger, tool_error, f"Status check failed - Agent: {slug}, Tool: {tool_slug}, Job: {job_id}")
            return jsonify({
                'error': ERROR_SERVER_ERROR,
                'message': get_message(ERROR_SERVER_ERROR)
            }), 500

    except Exception as error:
        from .. import log_exception
        log_exception(logger, error, f"Status check endpoint error - Agent: {slug}, Tool: {tool_slug}")
        return jsonify({
            'error': ERROR_SERVER_ERROR,
            'message': get_message(ERROR_SERVER_ERROR)
        }), 500


# ============================================================================
# INTERACTION ENDPOINTS
# ============================================================================

@agents_bp.route('/interactions/<string:interaction_id>/', methods=['GET'])
@agents_bp.route('/interactions/<string:interaction_id>', methods=['GET'])
@conditional_auth
def get_interaction(interaction_id: str):
    """Get specific interaction details as specified in API_SCHEMA.md."""
    try:
        current_user_id = get_jwt_identity()

        # Find interaction by ID and user
        interaction = Interaction.query.filter_by(
            id=interaction_id,
            user_id=current_user_id
        ).first()

        if not interaction:
            return jsonify({
                'error': ERROR_NOT_FOUND,
                'message': get_message(ERROR_NOT_FOUND)
            }), 404

        return jsonify({
            'id': interaction.id,
            'status': interaction.status,
            'output': interaction.output_data or {},
            'agent_name': interaction.agent_name,
            'tool_name': interaction.tool_name
        })

    except Exception as error:
        print(f'Error fetching interaction: {error}')
        return jsonify({
            'error': ERROR_SERVER_ERROR,
            'message': get_message(ERROR_SERVER_ERROR)
        }), 500


@agents_bp.route('/interactions/', methods=['GET'])
@agents_bp.route('/interactions', methods=['GET'])
@conditional_auth
def list_interactions():
    """Get all interactions for current user as specified in API_SCHEMA.md."""
    try:
        current_user_id = get_jwt_identity()

        # Get all interactions for current user
        interactions = Interaction.query.filter_by(user_id=current_user_id).all()

        interactions_list = []
        for interaction in interactions:
            interactions_list.append({
                'id': interaction.id,
                'agent_name': interaction.agent_name,
                'tool_name': interaction.tool_name,
                'status': interaction.status,
                'created_at': interaction.created_at.isoformat() if interaction.created_at else None
            })

        return jsonify({'data': interactions_list})

    except Exception as error:
        print(f'Error fetching interactions: {error}')
        return jsonify({
            'error': ERROR_SERVER_ERROR,
            'message': get_message(ERROR_SERVER_ERROR)
        }), 500


def _save_background_script(script_data: Dict[str, Any], user_id: str) -> Dict[str, Any]:
    """
    Save completed background script to database.
    
    Args:
        script_data: The completed script data from background processing
        user_id: The user ID from JWT
    
    Returns:
        Updated script data with saved script record
    """
    if not user_id:
        logger.warning("Cannot save background script: no user_id provided")
        return script_data
    
    try:
        # Extract required fields from script data
        title = script_data.get('title', 'Generated Script')
        content = script_data.get('content', '')
        script_type = script_data.get('type', 'general')
        
        # Validate we have essential content
        if not content.strip():
            logger.warning("Cannot save background script: no content provided")
            return script_data
        
        # The challenge: we don't have business_profile_id from the original request
        # For now, let's try to find an active business profile for this user
        # This is a workaround until we implement proper parameter storage for async jobs
        business_profile = BusinessProfile.query.filter_by(
            user_id=user_id,
            is_active=True
        ).first()
        
        if not business_profile:
            # Fallback: get any business profile for this user
            business_profile = BusinessProfile.query.filter_by(user_id=user_id).first()
        
        if not business_profile:
            logger.warning(f"Cannot save background script: no business profile found for user {user_id}")
            return script_data
        
        # Create script record
        script = Script(
            user_id=user_id,
            business_profile_id=business_profile.id,
            title=title,
            content=content,
            script_type=script_type,
            # We don't have access to style_id, offer_id, campaign_id from background mode
            # These would need to be stored with the original job parameters
            status='draft'
        )
        
        db.session.add(script)
        db.session.commit()
        
        logger.info(f"Successfully saved background script with ID: {script.id}")
        
        # Add the saved script to the response data
        updated_data = script_data.copy()
        updated_data['script'] = script.to_dict()
        updated_data['saved_to_database'] = True
        
        return updated_data
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Failed to save background script: {str(e)}")
        # Return original data if saving fails - don't break the response
        return script_data