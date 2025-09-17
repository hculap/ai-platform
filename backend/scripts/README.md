# Prompt Templates Deployment Scripts

This directory contains scripts for automatically populating the prompt templates database during server deployment.

## Files

### `populate_prompt_templates.py`
Python script that reads prompt templates from a JSON file and populates the database.

**Features:**
- Checks for existing templates to avoid duplicates
- Supports dry-run mode for testing
- Provides detailed logging of operations
- Can be integrated into deployment pipelines
- Handles errors gracefully with database rollback

**Usage:**
```bash
cd backend
source venv/bin/activate
python scripts/populate_prompt_templates.py [options]
```

**Options:**
- `--dry-run`: Simulate the operation without making changes
- `--force`: Skip confirmation prompts
- `--help, -h`: Show help message

### `deploy_populate_templates.sh`
Bash deployment script that provides a user-friendly interface for populating templates.

**Features:**
- Validates environment setup (virtual environment, Flask app)
- Runs dry-run first to show what would be done
- Provides colored output for better readability
- Includes safety checks and confirmations
- Designed for server deployment automation

**Usage:**
```bash
cd backend
./scripts/deploy_populate_templates.sh [--force]
```

**Options:**
- `--force`: Skip confirmation prompts (useful for automated deployment)

### `prompt_templates_export.json`
JSON data file containing all prompt templates to be populated.

**Structure:**
```json
[
  {
    "title": "Template Title",
    "description": "Template description",
    "content": "Template content with placeholders",
    "category": "Category Name",
    "dependencies": ["business_profile", "competitors"],
    "language": "en",
    "status": "active"
  }
]
```

## Deployment Integration

### Manual Deployment
For manual server deployment:
```bash
cd backend
source venv/bin/activate
./scripts/deploy_populate_templates.sh
```

### Automated Deployment
For CI/CD pipeline integration:
```bash
cd backend
source venv/bin/activate
./scripts/deploy_populate_templates.sh --force
```

### Docker Integration
Add to your Dockerfile or deployment script:
```dockerfile
RUN cd backend && source venv/bin/activate && python scripts/populate_prompt_templates.py --force
```

## Template Content

The exported templates include:

**English Templates (15):**
- Business Strategy: Competitor Analysis, Market Research, etc.
- Marketing: Content Marketing, Email Marketing, Social Media, etc.
- Sales: Sales Funnel Optimization, Customer Retention, etc.
- Operations: Crisis Management, Product Launch, etc.

**Polish Templates (15):**
- Strategia Biznesowa: Analiza Konkurencji, Badania Rynku, etc.
- Marketing: Content Marketing, Email Marketing, Social Media, etc.
- Sprzedaż: Optymalizacja Lejka Sprzedaży, Retencja Klientów, etc.
- Operacje: Zarządzanie Kryzysami, Wprowadzenie Produktu, etc.

## Dependencies and Placeholders

Templates use the following dependency types:
- `business_profile`: Business information and analysis
- `competitors`: Competitor research data
- `offers`: Product/service offerings
- `campaigns`: Marketing campaigns
- `scripts`: Generated content scripts
- `ads`: Advertisement data
- `user`: User account information
- `user_credits`: User credit balance

Common placeholders in templates:
- `{business_name}`: Name of the business
- `{website_url}`: Business website URL
- `{industry}`: Business industry
- `{target_audience}`: Target customer demographics
- `{competitor_names}`: List of competitor names
- `{offer_titles}`: List of available offers

## Error Handling

The scripts include comprehensive error handling:
- Database connection validation
- JSON file format validation
- Duplicate prevention
- Transaction rollback on errors
- Detailed logging for troubleshooting

## Maintenance

To update templates:
1. Export current templates from production database
2. Edit the JSON file with new/updated templates
3. Test with `--dry-run` option
4. Deploy the changes

## Security Considerations

- Scripts validate Flask app can be imported before proceeding
- Database transactions are used to ensure data consistency
- Existing data is preserved (no overwriting without confirmation)
- Sensitive information is not logged

## Troubleshooting

**Common Issues:**

1. **Virtual environment not found**
   ```
   Error: Virtual environment not found at backend/venv
   ```
   Solution: Create and activate virtual environment, install dependencies

2. **Flask app import error**
   ```
   Error: Cannot import Flask application
   ```
   Solution: Ensure all dependencies are installed and environment variables are set

3. **Templates already exist**
   ```
   Database already contains X templates
   ```
   Solution: This is expected behavior. Use `--force` to proceed or `--dry-run` to see what would happen

4. **Permission errors**
   ```
   Permission denied: ./scripts/deploy_populate_templates.sh
   ```
   Solution: Make script executable with `chmod +x scripts/deploy_populate_templates.sh`

## Logging

Logs are written to:
- Console output (INFO level and above)
- Flask application logs (configured in app settings)

For debugging, check:
- `/backend/logs/` directory for Flask application logs
- Script output for deployment-specific messages