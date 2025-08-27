"""
Flask routes for agent management and execution.
Provides REST API endpoints for agents as specified in API_SCHEMA.md.
"""

import time
from typing import Dict, Any, Optional
from functools import wraps

from flask import Blueprint, request, jsonify, Response
from flask_jwt_extended import jwt_required, get_jwt_identity
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
@jwt_required()
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
@jwt_required()
def execute_tool(slug: str, tool_slug: str):
    """Execute a specific tool and create interaction record as specified in API_SCHEMA.md."""
    try:
        data = request.get_json() or {}

        # Get current user
        current_user_id = get_jwt_identity()

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

        # Create interaction record
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

        # Execute tool asynchronously (for now, we'll execute synchronously)
        start_time = time.time()

        try:
            from ..agents.shared.base_tool import ToolInput
            tool_input = ToolInput(
                parameters=data.get('input', {}),
                user_id=current_user_id,
                context={'agent_input': data, 'interaction_id': interaction.id}
            )

            # Execute tool synchronously
            import asyncio
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                result = loop.run_until_complete(tool.execute(tool_input))
            finally:
                loop.close()
            execution_time = time.time() - start_time

            if result.success:
                # Mark interaction as completed
                interaction.mark_completed(
                    output_data=result.data,
                    execution_time=execution_time
                )
                interaction.agent_version = agent.version
                interaction.tool_version = getattr(tool, 'version', '1.0.0')
                db.session.commit()

                return jsonify({
                    'interaction_id': interaction.id,
                    'status': 'completed'
                })
            else:
                # Mark interaction as failed
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
# PROMPTS ENDPOINTS
# ============================================================================


# ============================================================================
# INTERACTION ENDPOINTS
# ============================================================================

@agents_bp.route('/interactions/<string:interaction_id>/', methods=['GET'])
@agents_bp.route('/interactions/<string:interaction_id>', methods=['GET'])
@jwt_required()
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
@jwt_required()
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