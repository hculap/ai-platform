import os
from dotenv import load_dotenv

# Load environment variables from .env file in development
if os.getenv('FLASK_ENV') != 'production':
    load_dotenv()

class Config:
    """Base configuration"""
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'jwt-secret-key-change-in-production')

    # Database configuration - handle both PostgreSQL and SQLite
    DATABASE_URL = os.getenv('DATABASE_URL')
    if DATABASE_URL and DATABASE_URL.startswith('postgres://'):
        # Render provides postgres:// but SQLAlchemy needs postgresql://
        DATABASE_URL = DATABASE_URL.replace('postgres://', 'postgresql://', 1)

    SQLALCHEMY_DATABASE_URI = DATABASE_URL or 'sqlite:///instance/ai_platform.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # OpenAI Configuration
    OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
    OPENAI_BASE_URL = os.getenv('OPENAI_BASE_URL', 'https://api.openai.com/v1')
    OPENAI_DEFAULT_MODEL = os.getenv('OPENAI_DEFAULT_MODEL', 'gpt-4o')

    # Email configuration (for future use)
    SMTP_SERVER = os.getenv('SMTP_SERVER')
    SMTP_PORT = int(os.getenv('SMTP_PORT', 587))
    SMTP_USERNAME = os.getenv('SMTP_USERNAME')
    SMTP_PASSWORD = os.getenv('SMTP_PASSWORD')

    # Server configuration
    PORT = int(os.getenv('PORT', 5004))

class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'sqlite:///ai_platform.db')

class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False

class TestingConfig(Config):
    """Testing configuration"""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    WTF_CSRF_ENABLED = False
    SECRET_KEY = 'testing-secret-key'
    JWT_SECRET_KEY = 'testing-jwt-secret'

# Configuration mapping
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}

def validate_production_config():
    """Validate production configuration"""
    if os.getenv('FLASK_ENV') != 'production':
        return  # Only validate in production

    errors = []

    # Check required environment variables
    secret_key = os.getenv('SECRET_KEY')
    if not secret_key or secret_key == 'dev-secret-key-change-in-production':
        errors.append("Must set SECRET_KEY environment variable in production")

    jwt_secret = os.getenv('JWT_SECRET_KEY')
    if not jwt_secret or jwt_secret == 'jwt-secret-key-change-in-production':
        errors.append("Must set JWT_SECRET_KEY environment variable in production")

    if not os.getenv('OPENAI_API_KEY'):
        errors.append("Must set OPENAI_API_KEY environment variable in production")

    if not os.getenv('DATABASE_URL'):
        errors.append("Must set DATABASE_URL environment variable in production")

    if errors:
        raise ValueError("Production configuration errors:\n" + "\n".join(f"- {error}" for error in errors))

def get_config():
    """Get configuration based on environment"""
    env = os.getenv('FLASK_ENV', 'development')
    config_class = config.get(env, config['default'])

    # Validate production configuration
    if env == 'production':
        validate_production_config()

    return config_class
