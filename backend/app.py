import os
from app import create_app

# Create the Flask app instance
app = create_app()

if __name__ == '__main__':
    # Development server configuration
    port = int(os.environ.get('PORT', 5004))
    debug = os.environ.get('FLASK_ENV') != 'production'
    app.run(debug=debug, host='0.0.0.0', port=port)
