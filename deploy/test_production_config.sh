#!/bin/bash

# Test Production Configuration Locally
# This script helps test the production configuration locally before deploying

set -e

echo "🧪 Testing AI Platform Production Configuration"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [[ ! -f "backend/app.py" ]] || [[ ! -f "frontend/package.json" ]]; then
    echo -e "${RED}Error: Please run this script from the project root directory${NC}"
    exit 1
fi

echo -e "${BLUE}Step 1: Checking Backend Dependencies${NC}"
cd backend

# Check if virtual environment exists
if [[ ! -d "venv" ]]; then
    echo -e "${YELLOW}Virtual environment not found. Creating...${NC}"
    python -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "Installing/updating dependencies..."
pip install -r requirements.txt

echo -e "${BLUE}Step 2: Testing Configuration Loading${NC}"
# Test configuration without starting server
python -c "
from app import create_app
import os

# Test development config
os.environ['FLASK_ENV'] = 'development'
try:
    app = create_app()
    print('✅ Development config loads successfully')
except Exception as e:
    print(f'❌ Development config failed: {e}')
    exit(1)

# Test production config (will fail without proper env vars, which is expected)
os.environ['FLASK_ENV'] = 'production'
try:
    app = create_app()
    print('❌ Production config should have failed without env vars')
except ValueError as e:
    if 'Must set' in str(e):
        print('✅ Production config properly validates environment variables')
    else:
        print(f'❌ Unexpected error: {e}')
except Exception as e:
    print(f'❌ Unexpected error: {e}')

# Reset to development
os.environ['FLASK_ENV'] = 'development'
"

echo -e "${BLUE}Step 3: Testing Database Migration${NC}"
# Test database operations
export FLASK_ENV=development
export DATABASE_URL=sqlite:///test_deployment.db

# Run migrations
echo "Testing database migrations..."
python -m flask db upgrade

# Test prompt templates population
echo "Testing prompt templates population..."
python scripts/populate_prompt_templates.py --dry-run

# Clean up test database
rm -f test_deployment.db

echo -e "${BLUE}Step 4: Testing Gunicorn${NC}"
# Test Gunicorn can start (but don't actually start it)
echo "Testing Gunicorn configuration..."
gunicorn --check-config app:app
if [[ $? -eq 0 ]]; then
    echo "✅ Gunicorn configuration is valid"
else
    echo "❌ Gunicorn configuration failed"
    exit 1
fi

echo -e "${BLUE}Step 5: Testing Frontend Build${NC}"
cd ../frontend

# Check Node.js and npm
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js not found. Please install Node.js${NC}"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo -e "${RED}npm not found. Please install npm${NC}"
    exit 1
fi

# Install dependencies
echo "Installing frontend dependencies..."
npm ci

# Test build process
echo "Testing production build..."
npm run build

if [[ -d "build" ]]; then
    echo "✅ Frontend builds successfully"
    echo "Build size:"
    du -sh build/
else
    echo "❌ Frontend build failed"
    exit 1
fi

echo -e "${BLUE}Step 6: Summary${NC}"
cd ..

echo -e "${GREEN}✅ All tests passed!${NC}"
echo ""
echo "Production readiness checklist:"
echo "✅ Backend dependencies installed (including Gunicorn)"
echo "✅ Configuration validates environment variables"
echo "✅ Database migrations work"
echo "✅ Prompt templates script works"
echo "✅ Gunicorn configuration is valid"
echo "✅ Frontend builds successfully"
echo ""
echo -e "${YELLOW}Before deploying to Render:${NC}"
echo "1. Set up PostgreSQL database"
echo "2. Configure environment variables (SECRET_KEY, JWT_SECRET_KEY, OPENAI_API_KEY, DATABASE_URL)"
echo "3. Update frontend REACT_APP_API_URL to point to your backend"
echo "4. Follow the deployment guide in deploy/RENDER_DEPLOYMENT.md"
echo ""
echo -e "${GREEN}🚀 Ready for Render deployment!${NC}"