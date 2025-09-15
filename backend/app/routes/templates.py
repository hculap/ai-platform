from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models.prompt_template import PromptTemplate
from .. import db
from ..utils.messages import (
    get_message, ERROR_NOT_FOUND, ERROR_SERVER_ERROR, ERROR_VALIDATION_ERROR
)

templates_bp = Blueprint('templates', __name__)

@templates_bp.route('/', methods=['GET'])
@jwt_required()
def get_templates():
    """Get all active prompt templates with optional filtering"""
    try:
        # Get query parameters
        language = request.args.get('language', 'en')
        category = request.args.get('category')
        search = request.args.get('search')

        # Validate language
        if language not in ['en', 'pl']:
            language = 'en'

        # Start with active templates in specified language
        query = PromptTemplate.query.filter_by(status='active', language=language)

        # Apply category filter if provided
        if category:
            query = query.filter_by(category=category)

        # Apply search filter if provided
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                db.or_(
                    PromptTemplate.title.ilike(search_term),
                    PromptTemplate.description.ilike(search_term)
                )
            )

        # Execute query and order by creation date
        templates = query.order_by(PromptTemplate.created_at.desc()).all()

        return jsonify({
            'templates': [template.to_dict() for template in templates],
            'count': len(templates)
        }), 200

    except Exception as e:
        print(f"Error fetching templates: {e}")
        return jsonify({
            'error': ERROR_SERVER_ERROR,
            'message': 'Failed to fetch templates'
        }), 500

@templates_bp.route('/<template_id>', methods=['GET'])
@jwt_required()
def get_template(template_id):
    """Get a single template by ID"""
    try:
        template = PromptTemplate.query.filter_by(id=template_id, status='active').first()

        if not template:
            return jsonify({
                'error': ERROR_NOT_FOUND,
                'message': 'Template not found'
            }), 404

        return jsonify(template.to_dict()), 200

    except Exception as e:
        print(f"Error fetching template {template_id}: {e}")
        return jsonify({
            'error': ERROR_SERVER_ERROR,
            'message': 'Failed to fetch template'
        }), 500

@templates_bp.route('/categories', methods=['GET'])
@jwt_required()
def get_categories():
    """Get all available template categories"""
    try:
        language = request.args.get('language', 'en')

        # Validate language
        if language not in ['en', 'pl']:
            language = 'en'

        categories = PromptTemplate.get_categories(language=language)

        return jsonify({
            'categories': categories,
            'count': len(categories)
        }), 200

    except Exception as e:
        print(f"Error fetching categories: {e}")
        return jsonify({
            'error': ERROR_SERVER_ERROR,
            'message': 'Failed to fetch categories'
        }), 500

# Admin endpoints for template management (future implementation)
@templates_bp.route('/', methods=['POST'])
@jwt_required()
def create_template():
    """Create a new template (admin only - future implementation)"""
    return jsonify({
        'error': 'NOT_IMPLEMENTED',
        'message': 'Template creation not yet implemented'
    }), 501

@templates_bp.route('/<template_id>', methods=['PUT'])
@jwt_required()
def update_template(template_id):
    """Update a template (admin only - future implementation)"""
    return jsonify({
        'error': 'NOT_IMPLEMENTED',
        'message': 'Template update not yet implemented'
    }), 501

@templates_bp.route('/<template_id>', methods=['DELETE'])
@jwt_required()
def delete_template(template_id):
    """Delete a template (admin only - future implementation)"""
    return jsonify({
        'error': 'NOT_IMPLEMENTED',
        'message': 'Template deletion not yet implemented'
    }), 501