from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate
from flask_cors import CORS
import os
import logging
import sys
import traceback
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize extensions
db = SQLAlchemy()
jwt = JWTManager()
migrate = Migrate()
cors = CORS()

def setup_logging(app):
    """Configure comprehensive logging for the application"""
    
    # Create logs directory if it doesn't exist
    log_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'logs')
    os.makedirs(log_dir, exist_ok=True)
    
    # Configure root logger
    logging.basicConfig(
        level=logging.DEBUG if app.config.get('DEBUG') else logging.INFO,
        format='%(asctime)s [%(levelname)s] %(name)s:%(lineno)d - %(message)s',
        handlers=[
            # Console handler
            logging.StreamHandler(sys.stdout),
            # File handler for all logs
            logging.FileHandler(
                os.path.join(log_dir, 'app.log'),
                mode='a',
                encoding='utf-8'
            ),
            # Separate file for errors only
            logging.FileHandler(
                os.path.join(log_dir, 'errors.log'),
                mode='a',
                encoding='utf-8'
            )
        ]
    )
    
    # Configure different log levels for different files
    error_handler = logging.FileHandler(
        os.path.join(log_dir, 'errors.log'),
        mode='a',
        encoding='utf-8'
    )
    error_handler.setLevel(logging.ERROR)
    error_handler.setFormatter(logging.Formatter(
        '%(asctime)s [%(levelname)s] %(name)s:%(lineno)d - %(message)s\n'
        'Traceback:\n%(exc_info)s\n' + '='*80
    ))
    
    # Add the error handler to Flask's app logger
    app.logger.addHandler(error_handler)
    app.logger.setLevel(logging.DEBUG if app.config.get('DEBUG') else logging.INFO)
    
    # Configure specific loggers
    loggers_config = {
        'app.routes': logging.DEBUG,
        'app.agents': logging.DEBUG,
        'app.models': logging.INFO,
        'werkzeug': logging.WARNING,  # Reduce Flask request logs
        'urllib3': logging.WARNING,   # Reduce HTTP client logs
        'openai': logging.INFO,       # OpenAI API logs
    }
    
    for logger_name, level in loggers_config.items():
        logger = logging.getLogger(logger_name)
        logger.setLevel(level)
    
    app.logger.info(f"Logging configured - Log files in: {log_dir}")

def log_exception(logger, error, context="", include_request=True):
    """
    Enhanced exception logging with full context
    
    Args:
        logger: Logger instance to use
        error: Exception object
        context: Additional context string
        include_request: Whether to include Flask request details
    """
    from flask import request, has_request_context
    
    error_details = [
        f"EXCEPTION OCCURRED: {context}",
        f"Error Type: {type(error).__name__}",
        f"Error Message: {str(error)}",
        f"Timestamp: {datetime.now().isoformat()}",
    ]
    
    # Add request details if available
    if include_request and has_request_context():
        try:
            error_details.extend([
                f"Request URL: {request.url}",
                f"Request Method: {request.method}",
                f"Request Headers: {dict(request.headers)}",
                f"Request Args: {dict(request.args)}",
                f"Request Form: {dict(request.form) if request.form else 'None'}",
                f"Request JSON: {request.get_json(silent=True)}",
                f"Remote Address: {request.remote_addr}",
                f"User Agent: {request.headers.get('User-Agent', 'Unknown')}",
            ])
        except Exception as req_error:
            error_details.append(f"Could not get request details: {req_error}")
    
    # Add full stack trace
    error_details.extend([
        "Full Stack Trace:",
        traceback.format_exc()
    ])
    
    # Log as error with all details
    logger.error("\n".join(error_details))

def create_app(config_name='development'):
    """Application factory pattern"""
    print(f"DEBUG: Creating Flask app with config: {config_name}")
    import sys
    import os

    # Add the parent directory to Python path for imports
    parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    if parent_dir not in sys.path:
        sys.path.insert(0, parent_dir)

    from config import config

    app = Flask(__name__)
    print("DEBUG: Flask app created")

    # Load configuration
    app.config.from_object(config[config_name])
    print("DEBUG: Configuration loaded")

    # Initialize extensions with app
    db.init_app(app)
    jwt.init_app(app)
    migrate.init_app(app, db)
    cors.init_app(app)
    print("DEBUG: Extensions initialized")
    
    # Setup comprehensive logging
    setup_logging(app)
    app.logger.info("Flask application created successfully")

    # Register blueprints
    from .routes.auth import auth_bp
    from .routes.business_profiles import business_profiles_bp
    from .routes.competitions import competitions_bp
    from .routes.agents import agents_bp
    from .routes.offers import offers_bp
    from .routes.campaigns import campaigns_bp
    from .routes.ads import ads_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(business_profiles_bp, url_prefix='/api')
    app.register_blueprint(competitions_bp, url_prefix='/api')
    app.register_blueprint(agents_bp)
    app.register_blueprint(offers_bp, url_prefix='/api')
    app.register_blueprint(campaigns_bp, url_prefix='/api')
    app.register_blueprint(ads_bp, url_prefix='/api')

    # Import models to ensure they are registered with SQLAlchemy
    from .models.user import User
    from .models.business_profile import BusinessProfile
    from .models.interaction import Interaction
    from .models.competition import Competition
    from .models.offer import Offer
    from .models.campaign import Campaign
    from .models.ad import Ad

    # Initialize agents
    from .agents import initialize_agents
    initialize_agents()

    # Add global error handlers
    @app.errorhandler(500)
    def handle_internal_error(error):
        """Handle 500 Internal Server Error with detailed logging"""
        from flask import jsonify
        log_exception(
            app.logger, 
            error.original_exception if hasattr(error, 'original_exception') else error,
            "Internal Server Error (500)",
            include_request=True
        )
        
        return jsonify({
            'error': 'INTERNAL_SERVER_ERROR',
            'message': 'An internal server error occurred. Please try again later.',
            'timestamp': datetime.now().isoformat()
        }), 500

    @app.errorhandler(404)
    def handle_not_found(error):
        """Handle 404 Not Found"""
        from flask import jsonify, request
        app.logger.warning(f"404 Not Found: {request.url} - Method: {request.method}")
        
        return jsonify({
            'error': 'NOT_FOUND',
            'message': 'The requested resource was not found.',
            'timestamp': datetime.now().isoformat()
        }), 404

    @app.errorhandler(400)
    def handle_bad_request(error):
        """Handle 400 Bad Request"""
        from flask import jsonify, request
        log_exception(
            app.logger,
            error,
            "Bad Request (400)",
            include_request=True
        )
        
        return jsonify({
            'error': 'BAD_REQUEST',
            'message': 'The request was invalid or malformed.',
            'timestamp': datetime.now().isoformat()
        }), 400

    @app.errorhandler(401)
    def handle_unauthorized(error):
        """Handle 401 Unauthorized"""
        from flask import jsonify, request
        app.logger.warning(f"401 Unauthorized: {request.url} - Method: {request.method} - User: {request.headers.get('Authorization', 'No auth header')}")
        
        return jsonify({
            'error': 'UNAUTHORIZED',
            'message': 'Authentication required or invalid credentials.',
            'timestamp': datetime.now().isoformat()
        }), 401

    @app.errorhandler(Exception)
    def handle_generic_exception(error):
        """Handle any unhandled exceptions"""
        from flask import jsonify
        log_exception(
            app.logger,
            error,
            "Unhandled Exception",
            include_request=True
        )
        
        return jsonify({
            'error': 'INTERNAL_SERVER_ERROR',
            'message': 'An unexpected error occurred. Please try again later.',
            'timestamp': datetime.now().isoformat(),
            'error_type': type(error).__name__ if app.config.get('DEBUG') else None
        }), 500

    # Request logging middleware
    @app.before_request
    def log_request_info():
        """Log incoming request details"""
        from flask import request
        app.logger.debug(
            f"Request: {request.method} {request.url} - "
            f"User-Agent: {request.headers.get('User-Agent', 'Unknown')} - "
            f"Remote-Addr: {request.remote_addr}"
        )

    @app.after_request
    def log_response_info(response):
        """Log response details and add CORS headers"""
        from flask import request
        
        # Log response status
        app.logger.debug(
            f"Response: {response.status_code} for {request.method} {request.url}"
        )
        
        # Add CORS headers for React development
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
        
        return response

    app.logger.info("Flask application setup completed")
    return app
