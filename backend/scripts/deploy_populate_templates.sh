#!/bin/bash

# Prompt Templates Deployment Script
# This script is designed to be run on server deployment to populate the prompt templates database

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo -e "${BLUE}=== AI Platform - Prompt Templates Deployment ===${NC}"
echo "Script directory: $SCRIPT_DIR"
echo "Project root: $PROJECT_ROOT"
echo

# Check if we're in the right directory
if [[ ! -f "$PROJECT_ROOT/app.py" ]]; then
    echo -e "${RED}Error: Not in backend directory. Please run from backend/ folder.${NC}"
    exit 1
fi

# Check if virtual environment exists
if [[ ! -d "$PROJECT_ROOT/venv" ]]; then
    echo -e "${RED}Error: Virtual environment not found at $PROJECT_ROOT/venv${NC}"
    echo "Please create virtual environment first:"
    echo "  python -m venv venv"
    echo "  source venv/bin/activate"
    echo "  pip install -r requirements.txt"
    exit 1
fi

# Check if templates data file exists
if [[ ! -f "$SCRIPT_DIR/prompt_templates_export.json" ]]; then
    echo -e "${RED}Error: Templates data file not found: $SCRIPT_DIR/prompt_templates_export.json${NC}"
    exit 1
fi

# Activate virtual environment
echo -e "${YELLOW}Activating virtual environment...${NC}"
source "$PROJECT_ROOT/venv/bin/activate"

# Check if Flask app can be imported
echo -e "${YELLOW}Checking Flask application...${NC}"
cd "$PROJECT_ROOT"
python -c "from app import create_app; print('✅ Flask app can be imported successfully')" || {
    echo -e "${RED}Error: Cannot import Flask application${NC}"
    exit 1
}

# Run dry-run first to check what would happen
echo -e "${YELLOW}Running dry-run to check what would be populated...${NC}"
python scripts/populate_prompt_templates.py --dry-run

# Ask for confirmation unless --force is provided
if [[ "$1" != "--force" ]]; then
    echo
    echo -e "${YELLOW}Do you want to proceed with populating the database? ${NC}"
    read -p "Type 'yes' to continue: " -r
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        echo -e "${YELLOW}Operation cancelled.${NC}"
        exit 0
    fi
fi

# Run the actual population
echo -e "${YELLOW}Populating prompt templates database...${NC}"
python scripts/populate_prompt_templates.py --force

if [ $? -eq 0 ]; then
    echo
    echo -e "${GREEN}✅ Prompt templates populated successfully!${NC}"
    echo
    echo -e "${BLUE}Deployment completed. The database now contains the AI assistant prompt templates.${NC}"
    echo -e "${BLUE}These templates will be available in the frontend for users to personalize and use.${NC}"
else
    echo
    echo -e "${RED}❌ Error occurred during prompt templates population.${NC}"
    echo -e "${RED}Please check the logs above for details.${NC}"
    exit 1
fi