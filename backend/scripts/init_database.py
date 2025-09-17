#!/usr/bin/env python3
"""
Database Initialization Script for Production Deployment

This script initializes the database with proper schema and initial data.
It's designed to be run during deployment to set up a fresh database.

Usage:
    cd backend
    source venv/bin/activate
    python scripts/init_database.py

Environment Variables Required:
    - DATABASE_URL: PostgreSQL connection string
    - FLASK_ENV: Set to 'production' for production deployment
"""

import os
import sys
import logging
from datetime import datetime

# Add the parent directory to the path so we can import from app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app, db
from flask_migrate import upgrade, current, stamp

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def check_database_connection(app):
    """Check if database connection is working"""
    try:
        with app.app_context():
            # Try to connect to the database
            db.session.execute('SELECT 1')
            db.session.commit()
            logger.info("✅ Database connection successful")
            return True
    except Exception as e:
        logger.error(f"❌ Database connection failed: {str(e)}")
        return False

def check_migrations_exist():
    """Check if migration files exist"""
    migrations_dir = os.path.join(os.path.dirname(__file__), '..', 'migrations', 'versions')
    if not os.path.exists(migrations_dir):
        logger.error(f"❌ Migrations directory not found: {migrations_dir}")
        return False

    migration_files = [f for f in os.listdir(migrations_dir) if f.endswith('.py')]
    if not migration_files:
        logger.error("❌ No migration files found")
        return False

    logger.info(f"✅ Found {len(migration_files)} migration files")
    return True

def run_migrations(app):
    """Run database migrations"""
    try:
        with app.app_context():
            # Check current migration state
            try:
                current_rev = current()
                logger.info(f"Current migration revision: {current_rev}")
            except Exception as e:
                logger.info("No migration history found, will create tables from scratch")
                current_rev = None

            # Run migrations
            logger.info("Running database migrations...")
            upgrade()

            # Check final state
            final_rev = current()
            logger.info(f"✅ Migrations completed. Final revision: {final_rev}")
            return True

    except Exception as e:
        logger.error(f"❌ Migration failed: {str(e)}")
        return False

def populate_prompt_templates(app):
    """Populate prompt templates using the existing script"""
    try:
        with app.app_context():
            logger.info("Populating prompt templates...")

            # Import and run the populate script
            import subprocess
            result = subprocess.run([
                sys.executable,
                'scripts/populate_prompt_templates.py',
                '--force'
            ], capture_output=True, text=True, cwd=os.path.dirname(__file__) + '/..')

            if result.returncode == 0:
                logger.info("✅ Prompt templates populated successfully")
                return True
            else:
                logger.error(f"❌ Prompt templates population failed: {result.stderr}")
                return False

    except Exception as e:
        logger.error(f"❌ Error populating prompt templates: {str(e)}")
        return False

def verify_database_setup(app):
    """Verify that the database is properly set up"""
    try:
        with app.app_context():
            # Check if key tables exist and have data
            from app.models.prompt_template import PromptTemplate

            template_count = PromptTemplate.query.count()
            logger.info(f"Prompt templates in database: {template_count}")

            if template_count > 0:
                logger.info("✅ Database verification successful")
                return True
            else:
                logger.warning("⚠️ Database exists but may be missing data")
                return False

    except Exception as e:
        logger.error(f"❌ Database verification failed: {str(e)}")
        return False

def main():
    """Main initialization function"""
    logger.info("🚀 Starting database initialization...")
    logger.info(f"Timestamp: {datetime.now().isoformat()}")

    # Check environment
    env = os.getenv('FLASK_ENV', 'development')
    database_url = os.getenv('DATABASE_URL')

    logger.info(f"Environment: {env}")
    logger.info(f"Database URL configured: {'Yes' if database_url else 'No'}")

    if env == 'production' and not database_url:
        logger.error("❌ DATABASE_URL must be set for production")
        return False

    # Create Flask application
    try:
        app = create_app()
        logger.info("✅ Flask application created")
    except Exception as e:
        logger.error(f"❌ Failed to create Flask application: {str(e)}")
        return False

    # Step 1: Check database connection
    logger.info("\n📊 Step 1: Checking database connection...")
    if not check_database_connection(app):
        return False

    # Step 2: Check migrations
    logger.info("\n📋 Step 2: Checking migration files...")
    if not check_migrations_exist():
        return False

    # Step 3: Run migrations
    logger.info("\n🔄 Step 3: Running database migrations...")
    if not run_migrations(app):
        return False

    # Step 4: Populate initial data
    logger.info("\n📚 Step 4: Populating prompt templates...")
    if not populate_prompt_templates(app):
        return False

    # Step 5: Verify setup
    logger.info("\n✅ Step 5: Verifying database setup...")
    if not verify_database_setup(app):
        return False

    logger.info("\n🎉 Database initialization completed successfully!")
    logger.info("The application is ready to serve requests.")
    return True

if __name__ == '__main__':
    success = main()
    if not success:
        logger.error("\n❌ Database initialization failed!")
        logger.error("Please check the logs above and fix any issues before deploying.")
        sys.exit(1)

    sys.exit(0)