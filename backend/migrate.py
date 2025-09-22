#!/usr/bin/env python3
"""
Database Migration Script for Production Deployment

This script handles database migrations in production environments where
Flask CLI app discovery might fail. It directly imports the Flask app
and runs migrations programmatically.

Usage:
    python migrate.py

Environment Variables:
    DATABASE_URL - Database connection string
    FLASK_ENV - Flask environment (production/development)
"""

import os
import sys
import logging
from datetime import datetime

def setup_logging():
    """Configure logging for migration script"""
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s [%(levelname)s] Migration: %(message)s',
        handlers=[
            logging.StreamHandler(sys.stdout)
        ]
    )
    return logging.getLogger(__name__)

def validate_environment():
    """Validate required environment variables"""
    logger = logging.getLogger(__name__)

    required_vars = ['DATABASE_URL']
    missing_vars = []

    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)

    if missing_vars:
        logger.error(f"Missing required environment variables: {missing_vars}")
        return False

    logger.info("Environment validation passed")
    return True

def test_database_connection(app):
    """Test database connectivity"""
    logger = logging.getLogger(__name__)

    try:
        with app.app_context():
            from app import db
            from sqlalchemy import text
            # Test basic database connection using modern SQLAlchemy syntax
            with db.engine.connect() as connection:
                result = connection.execute(text("SELECT 1"))
                result.fetchone()
            logger.info("Database connection test successful")
            return True
    except Exception as e:
        logger.error(f"Database connection test failed: {e}")
        return False

def run_migrations():
    """Run database migrations"""
    logger = setup_logging()

    try:
        logger.info("=== Starting Database Migration Script ===")
        logger.info(f"Python version: {sys.version}")
        logger.info(f"Current directory: {os.getcwd()}")
        logger.info(f"PYTHONPATH: {sys.path}")

        # Validate environment
        if not validate_environment():
            sys.exit(1)

        # Import Flask app
        logger.info("Importing Flask application...")

        # Set environment variable to skip agent initialization during migration
        os.environ['SKIP_AGENT_INIT'] = '1'

        from app import create_app, db
        from flask_migrate import upgrade, current, show

        # Create app instance
        logger.info("Creating Flask application instance...")
        app = create_app()

        # Test database connection
        logger.info("Testing database connection...")
        if not test_database_connection(app):
            sys.exit(1)

        # Run migrations within app context
        with app.app_context():
            logger.info("Checking current migration status...")
            try:
                current_rev = current()
                if current_rev:
                    logger.info(f"Current migration revision: {current_rev}")
                else:
                    logger.info("No current migration found - will run all migrations")
            except Exception as e:
                logger.warning(f"Could not get current migration (this is normal for new databases): {e}")

            logger.info("Running database upgrade...")
            try:
                upgrade()
                logger.info("Database upgrade command completed")
            except Exception as e:
                logger.error(f"Migration upgrade failed: {e}")
                raise

            # Verify migration completed
            logger.info("Verifying migration completion...")
            try:
                new_rev = current()
                if new_rev:
                    logger.info(f"Final migration revision: {new_rev}")
                else:
                    logger.info("No final revision found")
            except Exception as e:
                logger.warning(f"Could not verify final migration: {e}")

            logger.info("=== Database Migration Completed Successfully ===")

    except ImportError as e:
        logger.error(f"Import error: {e}")
        logger.error("Make sure you're running this script from the backend directory")
        logger.error("and that all dependencies are installed")
        sys.exit(1)

    except Exception as e:
        logger.error(f"Migration failed: {e}")
        logger.error("Full traceback:", exc_info=True)
        sys.exit(1)

if __name__ == "__main__":
    run_migrations()