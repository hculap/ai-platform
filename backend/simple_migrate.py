#!/usr/bin/env python3
"""
Simplified Database Migration Script for Production Deployment

This is a minimal migration script that sets up only the necessary components
for database migration without loading the full Flask application.
"""

import os
import sys
import logging
import signal
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate, upgrade, current

class TimeoutError(Exception):
    pass

def timeout_handler(signum, frame):
    raise TimeoutError("Migration timed out")

def with_timeout(timeout_seconds):
    """Decorator to add timeout to functions"""
    def decorator(func):
        def wrapper(*args, **kwargs):
            # Set timeout
            signal.signal(signal.SIGALRM, timeout_handler)
            signal.alarm(timeout_seconds)
            try:
                result = func(*args, **kwargs)
                signal.alarm(0)  # Cancel timeout
                return result
            except TimeoutError:
                raise
            finally:
                signal.alarm(0)  # Ensure timeout is cancelled
        return wrapper
    return decorator

def setup_logging():
    """Configure basic logging"""
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s [MIGRATE-PYTHON] %(message)s',
        handlers=[logging.StreamHandler(sys.stdout)]
    )
    return logging.getLogger(__name__)

def create_minimal_app():
    """Create minimal Flask app for migrations only"""
    app = Flask(__name__)

    # Basic configuration
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        raise ValueError("DATABASE_URL environment variable is required")

    # Handle Render's postgres:// URL format
    if database_url.startswith('postgres://'):
        database_url = database_url.replace('postgres://', 'postgresql://', 1)

    app.config['SQLALCHEMY_DATABASE_URI'] = database_url
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    return app

@with_timeout(300)  # 5 minute timeout
def run_migrations():
    """Run database migrations with minimal Flask app"""
    logger = setup_logging()

    try:
        logger.info("=== Starting Simplified Migration ===")
        logger.info(f"Python version: {sys.version}")
        logger.info(f"Current directory: {os.getcwd()}")

        # Check for required environment variables
        if not os.getenv('DATABASE_URL'):
            raise ValueError("DATABASE_URL environment variable is required")

        logger.info("Creating minimal Flask app...")
        app = create_minimal_app()

        # Initialize database and migration objects
        db = SQLAlchemy(app)
        migrate = Migrate(app, db, directory='migrations')

        logger.info("Testing database connection...")
        with app.app_context():
            # Test connection
            from sqlalchemy import text
            with db.engine.connect() as connection:
                result = connection.execute(text("SELECT 1"))
                result.fetchone()
            logger.info("Database connection successful")

            # Check current migration
            logger.info("Checking current migration...")
            try:
                current_rev = current()
                if current_rev:
                    logger.info(f"Current revision: {current_rev}")
                else:
                    logger.info("No current revision found")
            except Exception as e:
                logger.warning(f"Could not get current revision: {e}")

            # Run upgrade
            logger.info("Running migration upgrade...")
            upgrade()
            logger.info("Migration upgrade completed")

            # Verify final state
            try:
                final_rev = current()
                if final_rev:
                    logger.info(f"Final revision: {final_rev}")
                else:
                    logger.info("No final revision found")
            except Exception as e:
                logger.warning(f"Could not get final revision: {e}")

        logger.info("=== Migration Completed Successfully ===")

    except Exception as e:
        logger.error(f"Migration failed: {e}")
        logger.error("Full traceback:", exc_info=True)
        sys.exit(1)

if __name__ == "__main__":
    try:
        run_migrations()
    except TimeoutError:
        print("ERROR: Migration timed out after 5 minutes")
        print("This might indicate a database lock or connection issue")
        sys.exit(1)