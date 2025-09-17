"""
WSGI Entry Point for Production Deployment

This module provides the WSGI application object that Gunicorn expects.
It creates the Flask application using the factory pattern with production configuration.
"""

import os
from app import create_app

# Create the Flask application for WSGI servers like Gunicorn
application = create_app()

if __name__ == "__main__":
    # This is for testing the WSGI application locally
    port = int(os.environ.get('PORT', 5004))
    application.run(host='0.0.0.0', port=port)