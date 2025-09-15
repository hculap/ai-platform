"""
Flask routes for credit management.
Provides REST API endpoints for user credit operations.
"""

import logging
from typing import Dict, Any

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from ..services.credit_service import CreditService
from ..utils.messages import (
    get_message, ERROR_UNAUTHORIZED, ERROR_NOT_FOUND, ERROR_SERVER_ERROR, ERROR_VALIDATION_ERROR
)

# Create logger for this module
logger = logging.getLogger('app.routes.credits')

# Create blueprint for credit routes
credits_bp = Blueprint('credits', __name__, url_prefix='/api/credits')


@credits_bp.route('/balance', methods=['GET'])
@jwt_required()
def get_credit_balance():
    """Get current user's credit balance and subscription information."""
    try:
        current_user_id = get_jwt_identity()
        balance_info = CreditService.check_balance(current_user_id)
        
        return jsonify({
            'balance': balance_info['balance'],
            'monthly_quota': balance_info['monthly_quota'], 
            'subscription_status': balance_info['subscription_status'],
            'renewal_date': balance_info.get('renewal_date'),
            'is_renewal_due': balance_info.get('is_renewal_due', False)
        })
        
    except Exception as error:
        logger.error(f"Error getting credit balance for user {get_jwt_identity()}: {error}")
        return jsonify({
            'error': ERROR_SERVER_ERROR,
            'message': get_message(ERROR_SERVER_ERROR)
        }), 500


@credits_bp.route('/transactions', methods=['GET'])
@jwt_required()
def get_credit_transactions():
    """Get current user's credit transaction history."""
    try:
        current_user_id = get_jwt_identity()
        
        # Get optional limit parameter
        limit = request.args.get('limit', 50, type=int)
        if limit > 100:
            limit = 100  # Cap at 100 transactions max
            
        transactions = CreditService.get_transaction_history(current_user_id, limit)
        
        return jsonify({
            'data': transactions,
            'count': len(transactions)
        })
        
    except Exception as error:
        logger.error(f"Error getting credit transactions for user {get_jwt_identity()}: {error}")
        return jsonify({
            'error': ERROR_SERVER_ERROR,
            'message': get_message(ERROR_SERVER_ERROR)
        }), 500


@credits_bp.route('/tools/costs', methods=['GET'])
def get_tool_costs():
    """Get credit costs for all tools. Public endpoint - no auth required."""
    try:
        tool_costs = CreditService.get_all_tool_costs()
        
        return jsonify({
            'data': tool_costs,
            'count': len(tool_costs)
        })
        
    except Exception as error:
        logger.error(f"Error getting tool costs: {error}")
        return jsonify({
            'error': ERROR_SERVER_ERROR,
            'message': get_message(ERROR_SERVER_ERROR)
        }), 500


@credits_bp.route('/tools/<string:tool_slug>/cost', methods=['GET'])
def get_tool_cost(tool_slug: str):
    """Get credit cost for a specific tool. Public endpoint - no auth required."""
    try:
        cost = CreditService.get_tool_cost(tool_slug)
        
        return jsonify({
            'tool_slug': tool_slug,
            'cost': cost
        })
        
    except Exception as error:
        logger.error(f"Error getting tool cost for {tool_slug}: {error}")
        return jsonify({
            'error': ERROR_SERVER_ERROR,
            'message': get_message(ERROR_SERVER_ERROR)
        }), 500


@credits_bp.route('/subscription/upgrade', methods=['POST'])
@jwt_required()
def upgrade_subscription():
    """Upgrade user subscription to paid plan."""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json() or {}
        
        # Get monthly quota from request
        monthly_quota = data.get('monthly_quota', 500)  # Default to 500 credits
        
        # Validate quota
        if not isinstance(monthly_quota, int) or monthly_quota <= 0:
            return jsonify({
                'error': ERROR_VALIDATION_ERROR,
                'message': 'monthly_quota must be a positive integer'
            }), 400
            
        # Upgrade subscription
        success = CreditService.upgrade_user_subscription(current_user_id, monthly_quota)
        
        if success:
            # Get updated balance info
            balance_info = CreditService.check_balance(current_user_id)
            
            return jsonify({
                'message': f'Subscription upgraded successfully to {monthly_quota} monthly credits',
                'balance': balance_info['balance'],
                'monthly_quota': balance_info['monthly_quota'],
                'subscription_status': balance_info['subscription_status'],
                'renewal_date': balance_info.get('renewal_date')
            })
        else:
            return jsonify({
                'error': ERROR_SERVER_ERROR,
                'message': 'Failed to upgrade subscription'
            }), 500
        
    except Exception as error:
        logger.error(f"Error upgrading subscription for user {get_jwt_identity()}: {error}")
        return jsonify({
            'error': ERROR_SERVER_ERROR,
            'message': get_message(ERROR_SERVER_ERROR)
        }), 500


@credits_bp.route('/add', methods=['POST'])
@jwt_required()
def add_credits():
    """Add credits to user's balance. For admin/promotional use."""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json() or {}
        
        # Get amount and reason from request
        amount = data.get('amount')
        reason = data.get('reason', 'Manual credit addition')
        
        # Validate amount
        if not isinstance(amount, int) or amount <= 0:
            return jsonify({
                'error': ERROR_VALIDATION_ERROR,
                'message': 'amount must be a positive integer'
            }), 400
            
        # Add credits
        success = CreditService.add_credits(current_user_id, amount, reason)
        
        if success:
            # Get updated balance info
            balance_info = CreditService.check_balance(current_user_id)
            
            return jsonify({
                'message': f'Successfully added {amount} credits',
                'balance': balance_info['balance'],
                'amount_added': amount,
                'reason': reason
            })
        else:
            return jsonify({
                'error': ERROR_SERVER_ERROR,
                'message': 'Failed to add credits'
            }), 500
        
    except Exception as error:
        logger.error(f"Error adding credits for user {get_jwt_identity()}: {error}")
        return jsonify({
            'error': ERROR_SERVER_ERROR,
            'message': get_message(ERROR_SERVER_ERROR)
        }), 500