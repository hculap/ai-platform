#!/usr/bin/env python3
"""
Prompt Templates Database Population Script

This script populates the prompt_templates table with initial AI assistant prompts.
It can be run during deployment to ensure the database has the necessary prompt templates.

Usage:
    cd backend
    source venv/bin/activate
    python scripts/populate_prompt_templates.py

Features:
- Checks if templates already exist to avoid duplicates
- Supports both dry-run and actual execution modes
- Imports from JSON data file for maintainability
- Provides detailed logging of operations
- Can be integrated into deployment pipelines

Author: AI Platform Development Team
"""

import os
import sys
import json
import logging
from datetime import datetime

# Add the parent directory to the path so we can import from app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app
from app.models.prompt_template import PromptTemplate
from app import db

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def load_templates_data():
    """Load prompt templates data from JSON file."""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    data_file = os.path.join(script_dir, 'prompt_templates_export.json')

    if not os.path.exists(data_file):
        raise FileNotFoundError(f"Templates data file not found: {data_file}")

    try:
        with open(data_file, 'r', encoding='utf-8') as f:
            templates_data = json.load(f)
        logger.info(f"Loaded {len(templates_data)} templates from {data_file}")
        return templates_data
    except Exception as e:
        raise Exception(f"Error loading templates data: {str(e)}")

def check_existing_templates():
    """Check how many templates already exist in the database."""
    try:
        total_count = PromptTemplate.query.count()
        en_count = PromptTemplate.query.filter_by(language='en').count()
        pl_count = PromptTemplate.query.filter_by(language='pl').count()

        logger.info(f"Existing templates in database:")
        logger.info(f"  Total: {total_count}")
        logger.info(f"  English: {en_count}")
        logger.info(f"  Polish: {pl_count}")

        return total_count, en_count, pl_count
    except Exception as e:
        logger.warning(f"Could not check existing templates (table may not exist yet): {str(e)}")
        return 0, 0, 0

def template_exists(title, language):
    """Check if a template with the given title and language already exists."""
    try:
        return PromptTemplate.query.filter_by(title=title, language=language).first() is not None
    except Exception as e:
        # If table doesn't exist yet, return False
        logger.debug(f"Error checking template existence (table may not exist yet): {e}")
        return False

def create_template(template_data):
    """Create a new PromptTemplate from template data."""
    return PromptTemplate(
        title=template_data['title'],
        description=template_data.get('description'),
        content=template_data['content'],
        category=template_data['category'],
        dependencies=template_data.get('dependencies', []),
        language=template_data['language'],
        status=template_data.get('status', 'active')
    )

def populate_templates(dry_run=False):
    """
    Populate the database with prompt templates.

    Args:
        dry_run (bool): If True, only simulate the operation without making changes
    """
    logger.info(f"Starting prompt templates population (dry_run={dry_run})...")

    # Load templates data
    try:
        templates_data = load_templates_data()
    except Exception as e:
        logger.error(f"Failed to load templates data: {str(e)}")
        return False

    # Check existing templates
    existing_total, existing_en, existing_pl = check_existing_templates()

    # Process templates
    created_count = 0
    skipped_count = 0

    for template_data in templates_data:
        title = template_data['title']
        language = template_data['language']

        if template_exists(title, language):
            logger.debug(f"Skipping existing template: {title} ({language})")
            skipped_count += 1
            continue

        if dry_run:
            logger.info(f"[DRY RUN] Would create: {title} ({language})")
            created_count += 1
        else:
            try:
                template = create_template(template_data)
                db.session.add(template)
                logger.info(f"Created template: {title} ({language})")
                created_count += 1
            except Exception as e:
                logger.error(f"Error creating template '{title}': {str(e)}")
                return False

    # Commit changes if not dry run
    if not dry_run and created_count > 0:
        try:
            db.session.commit()
            logger.info(f"Successfully committed {created_count} new templates to database")
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error committing templates to database: {str(e)}")
            return False
    elif dry_run:
        logger.info(f"[DRY RUN] Would commit {created_count} new templates to database")

    # Final summary
    logger.info(f"Population summary:")
    logger.info(f"  Templates in data file: {len(templates_data)}")
    logger.info(f"  Already existing: {skipped_count}")
    logger.info(f"  {'Would create' if dry_run else 'Created'}: {created_count}")

    if not dry_run:
        # Check final state
        final_total, final_en, final_pl = check_existing_templates()
        logger.info(f"Final database state:")
        logger.info(f"  Total templates: {final_total}")
        logger.info(f"  English templates: {final_en}")
        logger.info(f"  Polish templates: {final_pl}")

    return True

def main():
    """Main function to run the population script."""
    # Parse command line arguments
    dry_run = '--dry-run' in sys.argv
    force = '--force' in sys.argv

    if dry_run:
        logger.info("Running in DRY RUN mode - no changes will be made")

    # Create Flask application context
    app = create_app()

    with app.app_context():
        # Check if we should proceed
        existing_total, _, _ = check_existing_templates()

        if existing_total > 0 and not force and not dry_run:
            logger.warning(f"Database already contains {existing_total} templates.")
            logger.warning("Use --force to proceed anyway, or --dry-run to see what would happen.")
            logger.warning("This may create duplicate templates.")
            response = input("Do you want to continue? (y/N): ")
            if response.lower() != 'y':
                logger.info("Operation cancelled by user.")
                return False

        # Run the population
        success = populate_templates(dry_run=dry_run)

        if success:
            logger.info("Prompt templates population completed successfully!")
            return True
        else:
            logger.error("Prompt templates population failed!")
            return False

if __name__ == '__main__':
    # Example usage information
    if '--help' in sys.argv or '-h' in sys.argv:
        print(__doc__)
        print("\nCommand line options:")
        print("  --dry-run    Simulate the operation without making changes")
        print("  --force      Skip confirmation prompts")
        print("  --help, -h   Show this help message")
        sys.exit(0)

    success = main()
    sys.exit(0 if success else 1)