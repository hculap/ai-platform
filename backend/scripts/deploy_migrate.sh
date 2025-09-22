#!/bin/bash

# Production Database Migration Script for Render Deployment
# This script handles database migrations with proper error handling and logging

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored messages
log_info() { echo -e "${BLUE}[MIGRATE]${NC} $1"; }
log_success() { echo -e "${GREEN}[MIGRATE]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[MIGRATE]${NC} $1"; }
log_error() { echo -e "${RED}[MIGRATE]${NC} $1"; }

# Function to check if we're in the right directory
check_directory() {
    log_info "Checking current directory..."
    echo "Current directory: $(pwd)"
    echo "Directory contents:"
    ls -la

    # Ensure we're in the backend directory
    if [[ ! -f "app.py" ]]; then
        log_warning "Not in backend directory. Attempting to navigate..."
        if [[ -f "../backend/app.py" ]]; then
            cd ../backend
            log_info "Successfully navigated to backend directory"
        elif [[ -f "backend/app.py" ]]; then
            cd backend
            log_info "Successfully navigated to backend directory"
        else
            log_error "Cannot find backend directory with app.py"
            exit 1
        fi
    fi

    log_success "Confirmed in backend directory: $(pwd)"
}

# Function to setup environment
setup_environment() {
    log_info "Setting up environment variables..."

    # Set Flask app
    export FLASK_APP=app.py
    export PYTHONPATH=$(pwd):$PYTHONPATH
    export SKIP_AGENT_INIT=1

    log_info "Environment setup:"
    echo "  FLASK_APP: $FLASK_APP"
    echo "  PYTHONPATH: $PYTHONPATH"
    echo "  SKIP_AGENT_INIT: $SKIP_AGENT_INIT"
    echo "  Current directory: $(pwd)"
}

# Function to validate environment
validate_environment() {
    log_info "Validating environment..."

    # Check DATABASE_URL
    if [[ -z "$DATABASE_URL" ]]; then
        log_error "DATABASE_URL environment variable is not set"
        exit 1
    fi
    log_success "DATABASE_URL is set"

    # Check Python version
    python_version=$(python --version 2>&1)
    log_info "Python version: $python_version"

    # Check Flask installation
    flask_version=$(python -c "import flask; print(flask.__version__)" 2>&1)
    if [[ $? -eq 0 ]]; then
        log_success "Flask version: $flask_version"
    else
        log_error "Flask is not installed or importable"
        exit 1
    fi

    # Check if migrations directory exists
    if [[ ! -d "migrations" ]]; then
        log_error "Migrations directory not found"
        exit 1
    fi
    log_success "Migrations directory found"
}

# Function to test database connectivity
test_database_connection() {
    log_info "Testing database connectivity..."

    # Try to import and create app
    python -c "
import os
import sys
from app import create_app

try:
    print('Creating Flask app...')
    app = create_app()
    print('Flask app created successfully')

    with app.app_context():
        from app import db
        print('Testing database connection...')
        # Simple query to test connection
        from sqlalchemy import text
        with db.engine.connect() as connection:
            result = connection.execute(text('SELECT 1'))
            result.fetchone()
        print('Database connection successful')
except Exception as e:
    print(f'Database connection failed: {e}')
    sys.exit(1)
" || {
        log_error "Database connectivity test failed"
        exit 1
    }

    log_success "Database connectivity test passed"
}

# Function to run migrations with Flask CLI
run_flask_migrations() {
    log_info "Running migrations using Flask CLI..."

    # Check current migration state
    log_info "Checking current migration state..."
    current_revision=$(flask db current 2>&1 || echo "none")
    log_info "Current revision: $current_revision"

    # Run the upgrade
    log_info "Running flask db upgrade..."
    if flask db upgrade; then
        log_success "Flask CLI migration completed successfully"

        # Check final state
        final_revision=$(flask db current 2>&1 || echo "unknown")
        log_info "Final revision: $final_revision"
        return 0
    else
        log_error "Flask CLI migration failed"
        return 1
    fi
}

# Function to run migrations with Python script fallback
run_python_migrations() {
    log_info "Running migrations using Python script fallback..."

    if [[ -f "simple_migrate.py" ]]; then
        if python simple_migrate.py; then
            log_success "Python script migration completed successfully"
            return 0
        else
            log_error "Python script migration failed"
            return 1
        fi
    else
        log_error "simple_migrate.py not found"
        return 1
    fi
}

# Function to populate prompt templates
populate_prompt_templates() {
    log_info "=== Starting Prompt Templates Population ==="

    # Check if templates population script exists
    if [[ ! -f "scripts/populate_prompt_templates.py" ]]; then
        log_error "Prompt templates population script not found"
        return 1
    fi

    # Check if templates data file exists
    if [[ ! -f "scripts/prompt_templates_export.json" ]]; then
        log_error "Prompt templates data file not found"
        return 1
    fi

    # Check current template count
    log_info "Checking existing prompt templates..."
    template_count=$(python -c "
import os
import sys
os.environ['SKIP_AGENT_INIT'] = '1'
try:
    from app import create_app
    from app.models.prompt_template import PromptTemplate
    app = create_app()
    with app.app_context():
        count = PromptTemplate.query.count()
        print(count)
except Exception as e:
    print(0)
" 2>/dev/null | grep -E '^[0-9]+$' | tail -n1 || echo "0")

    log_info "Found $template_count existing templates in database"

    # If templates already exist, skip population
    if [[ "$template_count" -gt 20 ]]; then
        log_success "Prompt templates already populated ($template_count templates found)"
        return 0
    fi

    # Run template population
    log_info "Populating prompt templates database..."
    if python scripts/populate_prompt_templates.py --force; then
        # Verify population success
        final_count=$(python -c "
import os
import sys
os.environ['SKIP_AGENT_INIT'] = '1'
try:
    from app import create_app
    from app.models.prompt_template import PromptTemplate
    app = create_app()
    with app.app_context():
        count = PromptTemplate.query.count()
        print(count)
except Exception as e:
    print(0)
" 2>/dev/null | grep -E '^[0-9]+$' | tail -n1 || echo "0")

        log_success "Prompt templates population completed successfully"
        log_info "Final template count: $final_count"
        return 0
    else
        log_error "Prompt templates population failed"
        return 1
    fi
}

# Main migration function
run_migrations() {
    log_info "=== Starting Database Migration ==="

    # Try Flask CLI first
    if run_flask_migrations; then
        log_success "Migration completed using Flask CLI"
        return 0
    fi

    log_warning "Flask CLI migration failed, trying Python script fallback..."

    # Try Python script fallback
    if run_python_migrations; then
        log_success "Migration completed using Python script fallback"
        return 0
    fi

    log_error "All migration attempts failed"
    return 1
}

# Main execution
main() {
    log_info "=== Production Database Migration Script ==="

    # Step 1: Ensure we're in the right directory
    check_directory

    # Step 2: Setup environment
    setup_environment

    # Step 3: Validate environment
    validate_environment

    # Step 4: Test database connection
    test_database_connection

    # Step 5: Run migrations
    if run_migrations; then
        log_success "Database migrations completed successfully"
    else
        log_error "=== Migration Process Failed ==="
        exit 1
    fi

    # Step 6: Populate prompt templates
    if populate_prompt_templates; then
        log_success "Prompt templates population completed successfully"
    else
        log_error "=== Prompt Templates Population Failed ==="
        exit 1
    fi

    log_success "=== Complete Deployment Process Completed Successfully ==="
    exit 0
}

# Execute main function
main "$@"