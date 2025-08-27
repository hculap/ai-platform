"""
Flask routes for agent management and execution.
Provides REST API endpoints for agents as specified in API_SCHEMA.md.
"""

import time
from typing import Dict, Any, Optional
from functools import wraps

from flask import Blueprint, request, jsonify, Response
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request
from werkzeug.exceptions import NotFound, BadRequest

from ..agents.base import AgentRegistry, AgentInput
from ..models.interaction import Interaction
from .. import db
from ..utils.messages import (
    get_message, ERROR_VALIDATION_ERROR, ERROR_UNAUTHORIZED,
    ERROR_NOT_FOUND, ERROR_SERVER_ERROR
)


# Create blueprint for agent routes
agents_bp = Blueprint('agents', __name__, url_prefix='/api/agents')

# Simple debug route
@agents_bp.route('/debug', methods=['GET'])
def debug_route():
    """Debug route to test if Flask is working."""
    print("DEBUG: Debug route called")
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
        print(f'Error fetching agents: {error}')
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


@agents_bp.route('/<string:slug>/tools/<string:tool_slug>/call/', methods=['POST'])
@agents_bp.route('/<string:slug>/tools/<string:tool_slug>/call', methods=['POST'])
@conditional_auth
def execute_tool(slug: str, tool_slug: str):
    """Execute a specific tool and create interaction record as specified in API_SCHEMA.md."""
    try:
        data = request.get_json() or {}

        # Get current user (may be None for public agents)
        print(f"DEBUG: execute_tool called with slug={slug}, tool_slug={tool_slug}")
        print(f"DEBUG: Request data: {data}")
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
            background_mode = data.get('background', False) and tool_slug == 'analyze-website'
            
            # Execute tool synchronously
            import asyncio
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                # Check if tool supports background mode
                if background_mode and hasattr(tool.execute, '__code__') and 'background' in tool.execute.__code__.co_varnames:
                    result = loop.run_until_complete(tool.execute(tool_input, background=background_mode))
                else:
                    result = loop.run_until_complete(tool.execute(tool_input))
            finally:
                loop.close()
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

            print(f'Tool execution error: {tool_error}')
            return jsonify({
                'error': ERROR_SERVER_ERROR,
                'message': get_message(ERROR_SERVER_ERROR)
            }), 500

    except Exception as error:
        print(f'Execute tool error: {error}')
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