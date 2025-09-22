from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity, verify_jwt_in_request, get_jwt
from ..models.user import User
from .. import db
from email_validator import validate_email, EmailNotValidError
from ..utils.messages import (
    get_message, AUTH_EMAIL_PASSWORD_REQUIRED, AUTH_INVALID_EMAIL_FORMAT,
    AUTH_PASSWORD_TOO_SHORT, AUTH_PASSWORD_MISSING_UPPERCASE,
    AUTH_PASSWORD_MISSING_LOWERCASE, AUTH_PASSWORD_MISSING_DIGIT,
    AUTH_PASSWORD_VALID, AUTH_USER_ALREADY_EXISTS, AUTH_USER_REGISTERED_SUCCESS,
    AUTH_INVALID_CREDENTIALS, AUTH_LOGIN_SUCCESS, AUTH_USER_NOT_FOUND,
    AUTH_REGISTRATION_FAILED, AUTH_LOGIN_FAILED, AUTH_GET_PROFILE_FAILED,
    ERROR_VALIDATION_ERROR, ERROR_UNAUTHORIZED, ERROR_NOT_FOUND, ERROR_SERVER_ERROR
)
import re

auth_bp = Blueprint('auth', __name__)

def validate_password(password):
    """Validate password strength"""
    if len(password) < 8:
        return False, get_message(AUTH_PASSWORD_TOO_SHORT)
    if not re.search(r'[A-Z]', password):
        return False, get_message(AUTH_PASSWORD_MISSING_UPPERCASE)
    if not re.search(r'[a-z]', password):
        return False, get_message(AUTH_PASSWORD_MISSING_LOWERCASE)
    if not re.search(r'\d', password):
        return False, get_message(AUTH_PASSWORD_MISSING_DIGIT)
    return True, get_message(AUTH_PASSWORD_VALID)

@auth_bp.route('/register', methods=['POST'])
def register():
    """User registration endpoint"""
    try:
        data = request.get_json()

        if not data or not data.get('email') or not data.get('password'):
            return jsonify({
                'error': ERROR_VALIDATION_ERROR,
                'message': get_message(AUTH_EMAIL_PASSWORD_REQUIRED)
            }), 400

        email = data['email'].lower().strip()
        password = data['password']

        # Validate email
        try:
            validate_email(email, check_deliverability=False)
        except EmailNotValidError:
            return jsonify({
                'error': ERROR_VALIDATION_ERROR,
                'message': get_message(AUTH_INVALID_EMAIL_FORMAT)
            }), 400

        # Validate password
        is_valid, message = validate_password(password)
        if not is_valid:
            return jsonify({
                'error': 'validation_error',
                'message': message
            }), 400

        # Check if user already exists
        if User.query.filter_by(email=email).first():
            return jsonify({
                'error': ERROR_VALIDATION_ERROR,
                'message': get_message(AUTH_USER_ALREADY_EXISTS)
            }), 409

        # Create new user
        user = User(email=email, password=password)
        db.session.add(user)
        db.session.commit()

        # Initialize credit account for new user (50 free trial credits)
        try:
            from ..services.credit_service import CreditService
            CreditService.get_or_create_user_credits(user.id)
        except Exception as credit_error:
            # Don't fail registration if credit initialization fails
            import traceback
            print(f"Warning: Failed to initialize credits for new user {user.id}: {credit_error}")
            print(f"Credit error traceback: {traceback.format_exc()}")
            # Log specific database table errors
            if "no such table" in str(credit_error).lower() or "relation" in str(credit_error).lower() and "does not exist" in str(credit_error).lower():
                print("ERROR: Credit tables (user_credits, credit_transactions) do not exist in database. Migration may have failed.")
            # Continue with registration - user can use the platform without credits initially

        # Create access and refresh tokens
        access_token = create_access_token(identity=user.id)
        refresh_token = create_refresh_token(identity=user.id)

        return jsonify({
            'message': get_message(AUTH_USER_REGISTERED_SUCCESS),
            'user': user.to_dict(),
            'access_token': access_token,
            'refresh_token': refresh_token
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'error': ERROR_SERVER_ERROR,
            'message': get_message(AUTH_REGISTRATION_FAILED)
        }), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """User login endpoint"""
    try:
        data = request.get_json()

        if not data or not data.get('email') or not data.get('password'):
            return jsonify({
                'error': ERROR_VALIDATION_ERROR,
                'message': get_message(AUTH_EMAIL_PASSWORD_REQUIRED)
            }), 400

        email = data['email'].lower().strip()
        password = data['password']

        # Find user
        user = User.query.filter_by(email=email).first()
        if not user or not user.check_password(password):
            return jsonify({
                'error': ERROR_UNAUTHORIZED,
                'message': get_message(AUTH_INVALID_CREDENTIALS)
            }), 401

        # Create access and refresh tokens
        access_token = create_access_token(identity=user.id)
        refresh_token = create_refresh_token(identity=user.id)

        return jsonify({
            'message': get_message(AUTH_LOGIN_SUCCESS),
            'user': user.to_dict(),
            'access_token': access_token,
            'refresh_token': refresh_token
        }), 200

    except Exception as e:
        return jsonify({
            'error': ERROR_SERVER_ERROR,
            'message': get_message(AUTH_LOGIN_FAILED)
        }), 500

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current user profile"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        if not user:
            return jsonify({
                'error': ERROR_NOT_FOUND,
                'message': get_message(AUTH_USER_NOT_FOUND)
            }), 404

        return jsonify(user.to_dict()), 200

    except Exception as e:
        return jsonify({
            'error': ERROR_SERVER_ERROR,
            'message': get_message(AUTH_GET_PROFILE_FAILED)
        }), 500

@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """Refresh access token using refresh token"""
    try:
        current_user_id = get_jwt_identity()
        
        # Verify user still exists
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({
                'error': ERROR_NOT_FOUND,
                'message': get_message(AUTH_USER_NOT_FOUND)
            }), 404

        # Create new access token
        new_access_token = create_access_token(identity=current_user_id)

        return jsonify({
            'message': 'token_refreshed_success',
            'access_token': new_access_token
        }), 200

    except Exception as e:
        return jsonify({
            'error': ERROR_SERVER_ERROR,
            'message': 'token_refresh_failed'
        }), 500

