from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize extensions
db = SQLAlchemy()
jwt = JWTManager()
migrate = Migrate()

def create_app(config_name='development'):
    """Application factory pattern"""
    import sys
    import os

    # Add the parent directory to Python path for imports
    parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    if parent_dir not in sys.path:
        sys.path.insert(0, parent_dir)

    from config import config

    app = Flask(__name__)

    # Load configuration
    app.config.from_object(config[config_name])

    # Initialize extensions with app
    db.init_app(app)
    jwt.init_app(app)
    migrate.init_app(app, db)

    # Register blueprints
    from .routes.auth import auth_bp
    from .routes.business_profiles import business_profiles_bp
    from .routes.agents import agents_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(business_profiles_bp, url_prefix='/api')
    app.register_blueprint(agents_bp)

    # Import models to ensure they are registered with SQLAlchemy
    from .models.user import User
    from .models.business_profile import BusinessProfile
    from .models.interaction import Interaction

    # Initialize agents
    from .agents import initialize_agents
    initialize_agents()

    return app
