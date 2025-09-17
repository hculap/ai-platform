# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Environment

### Virtual Environment Setup
**IMPORTANT**: This project uses Python virtual environment (`venv`) for dependency isolation:
- **Activate venv**: `cd backend && source venv/bin/activate` (Unix/macOS) or `venv\Scripts\activate` (Windows)
- **Deactivate venv**: `deactivate`
- **Always activate venv before running any Python commands**

## Development Commands

### Backend (Flask/Python)
**Note**: Always activate venv first: `cd backend && source venv/bin/activate`

- **Run development server**: `python app.py` (runs on port 5004)
- **Install dependencies**: `pip install -r requirements.txt`
- **Run tests**: `pytest`
- **Run tests with coverage**: `pytest --cov=app --cov-report=html`
- **Run specific test**: `pytest app/tests/test_auth.py`
- **Database migrations**:
  - Create migration: `flask db migrate -m "Description"`
  - Apply migrations: `flask db upgrade`
- **Populate prompt templates database**: `./scripts/deploy_populate_templates.sh` (for deployment)

### Frontend (React/TypeScript)
- **Run development server**: `cd frontend && npm start` (runs on port 3000, proxies to backend on 5004)
- **Install dependencies**: `cd frontend && npm install`
- **Run tests**: `cd frontend && npm test`
- **Build for production**: `cd frontend && npm run build`
- **Lint/typecheck**: No explicit commands defined - use standard React Scripts

### Testing Commands
- **Backend test markers**: Use `pytest -m unit`, `pytest -m integration`, `pytest -m api` for specific test types
- **Coverage reports**: Generated in `backend/htmlcov/` directory
- **Comprehensive test suite**: `pytest app/tests/test_parsers.py app/tests/test_validators.py app/tests/test_tool_factory.py app/tests/test_agent_factory.py -v`

## Quality Assurance & Testing Requirements

### Mandatory Testing After Changes
**CRITICAL**: After making any code changes, you MUST:

1. **Run Full Test Suite**: Execute all tests to ensure nothing breaks
   ```bash
   cd backend && source venv/bin/activate
   pytest -v --tb=short
   ```

2. **Verify Specific Component Tests**: Run tests for the components you modified
   ```bash
   # For agent system changes
   pytest app/tests/test_agent_factory.py app/tests/test_tool_factory.py -v
   
   # For validation/parsing changes  
   pytest app/tests/test_validators.py app/tests/test_parsers.py -v
   
   # For API changes
   pytest app/tests/test_auth.py app/tests/test_business_profiles.py -v
   ```

3. **Add New Tests**: Create comprehensive tests for any new functions or features
   - Follow existing test patterns in `app/tests/`
   - Include unit tests, integration tests, and error handling tests
   - Ensure minimum 80% code coverage for new code
   - Test both success and failure scenarios

4. **Frontend Testing**: If frontend changes were made
   ```bash
   cd frontend && npm test
   ```

### Test Coverage Requirements
- **Backend**: Current coverage is 63% - maintain or improve
- **New Features**: Must have >80% test coverage
- **Critical Paths**: Authentication, agent execution, data persistence must be 100% covered
- **Error Handling**: All error scenarios must be tested

### Documentation Update Requirements
When making changes, update relevant documentation:
- **API Changes**: Update `spec/API_SCHEMA.md`
- **Database Changes**: Update `spec/DB_SCHEMA.md` 
- **Agent Changes**: Update `docs/agents/` documentation
- **Tool Changes**: Update `docs/tools/` documentation
- **Frontend Changes**: Update `docs/frontend/README.md`
- **Architecture Changes**: Update this `CLAUDE.md` file

## Project Architecture

### High-Level Structure
This is an AI-powered business analysis SaaS platform with a Flask backend and React frontend. The system enables small/medium businesses to analyze their websites and get AI-powered business insights.

### Backend Architecture (Flask)
- **Main entry point**: `backend/app.py` (creates Flask app, runs on port 5004)
- **Application factory**: `backend/app/__init__.py` contains `create_app()` function
- **Database**: SQLite with SQLAlchemy ORM and Flask-Migrate (single instance: `backend/instance/ai_platform.db`)
- **Authentication**: JWT-based auth using Flask-JWT-Extended
- **API Structure**: RESTful endpoints organized in blueprints

#### Key Backend Components:
- **Models** (`app/models/`): SQLAlchemy models for User, BusinessProfile, Competition, Interaction, PromptTemplate, UserCredit, CreditTransaction
- **Routes** (`app/routes/`): API blueprints for auth, business_profiles, competitions, agents, offers, templates, credits
- **Agents System** (`app/agents/`): Modular AI agent architecture
  - `agents/base.py`: Core agent registry and base classes
  - `agents/concierge/`: Business website analysis agent
  - `agents/competitors_researcher/`: Competitor research agent  
  - `agents/offer_assistant/`: AI-powered offer catalog generation agent
  - Each agent has tools in separate directories with standardized structure
- **Services** (`app/services/`): External service integrations (OpenAI)
- **Utils** (`app/utils/`): Shared utilities and message constants

### Frontend Architecture (React/TypeScript)
- **Main App**: `frontend/src/App.tsx` - handles routing between different sections
- **State Management**: Local React state, no external state management library
- **API Integration**: Centralized in `frontend/src/services/api.ts` with auto-retry and token refresh
- **Internationalization**: i18next with Polish/English support in `frontend/src/i18n.ts`
- **Styling**: Tailwind CSS with PostCSS configuration

#### Key Frontend Components:
- **Dashboard** (`components/Dashboard.tsx`): Main authenticated user interface
- **Business Profiles** (`components/BusinessProfiles.tsx`): CRUD for business profiles
- **Agents** (`components/Agents.tsx`): AI agent execution interface
- **Competition** (`components/Competition.tsx`): Competitor management
- **Prompt Templates** (`components/PromptTemplates.tsx`): Browse and personalize AI prompt templates
- **Authentication Forms**: SignInForm, SignupForm components
- **Types** (`types/index.ts`): Centralized TypeScript interfaces
- **Template Personalization** (`utils/templatePersonalization.ts`): Frontend-only placeholder resolution engine

### Agent System Architecture
The backend implements a flexible agent system:
- **Registry Pattern**: Agents register themselves via `AgentRegistry`
- **Tool-based Architecture**: Each agent can have multiple tools
- **Two Implementation Approaches**:
  - Prompt-based (legacy): Uses OpenAI Assistant with predefined prompt IDs
  - System message-based (current): Uses direct OpenAI chat with system messages
- **Background Processing**: Supports async execution with status polling

### Database Schema
- **users**: Basic user authentication
- **business_profiles**: Business information and analysis results
- **competitions**: Competitor data linked to business profiles
- **offers**: Product/service offerings linked to business profiles
- **interactions**: Agent execution history
- **analysis_requests**: Async processing status (via Alembic migrations)
- **prompt_templates**: AI prompt templates with personalization support
- **user_credits**: Credit tracking for user accounts
- **credit_transactions**: Credit usage history

**Database Location**: Single consolidated instance at `backend/instance/ai_platform.db`

### Authentication Flow
1. User registers/logs in via `/api/auth/` endpoints
2. JWT tokens stored in localStorage with automatic refresh
3. Protected routes require `Authorization: Bearer <token>` header
4. Frontend auto-refreshes expired tokens using refresh tokens

### API Proxy Configuration
- Frontend development server proxies API calls to `http://localhost:5004`
- Production deployment needs proper reverse proxy configuration

### Key Business Logic
- **Business Profile Analysis**: AI-powered website analysis using OpenAI
- **Agent Execution**: Standardized tool execution with input validation
- **Competition Management**: CRUD operations for competitor tracking
- **Offer Management**: AI-powered offer catalog generation and CRUD operations
- **Prompt Templates**: Personalized AI prompt library with 30+ placeholder types
- **Credit System**: User credit tracking for AI service usage
- **Multi-language Support**: Polish as primary language, English secondary

### Development Workflow
1. **Environment Setup**: Always activate Python virtual environment first (`source venv/bin/activate`)
2. **Backend API Development**: Develop in Flask with immediate testing via pytest
3. **Frontend Development**: Component development with live preview
4. **Integration Testing**: Test between frontend/backend via proxy setup
5. **Database Changes**: Manage through Flask-Migrate migrations
6. **Quality Assurance**: After each change, run comprehensive tests and ensure all pass
7. **Documentation Updates**: Update all necessary documentation when making changes
8. **Version Control**: Make proper git commits with descriptive messages at completion

### Important Implementation Notes
- Backend runs on port 5004 (not standard 5000) to avoid conflicts
- Frontend uses axios with automatic token refresh and retry logic
- All user-facing text supports internationalization
- Agent system designed for extensibility - new agents can be easily added
- Business profiles have single-active constraint (only one can be active per user)
- Error handling includes proper HTTP status codes and user-friendly messages

## Git Workflow & Version Control

### Commit Requirements
At the completion of any development work, you MUST propose a proper git commit:

1. **Pre-commit Checklist**:
   - [ ] All tests pass (`pytest -v`)
   - [ ] Code coverage maintained or improved
   - [ ] Documentation updated
   - [ ] No console errors or warnings
   - [ ] Code follows project conventions

2. **Commit Message Format**:
   ```
   <type>(<scope>): <subject>
   
   <body>
   
   🤖 Generated with [Claude Code](https://claude.ai/code)
   
   Co-Authored-By: Claude <noreply@anthropic.com>
   ```

3. **Commit Types**:
   - `feat`: New feature
   - `fix`: Bug fix
   - `refactor`: Code restructuring without behavior change
   - `test`: Adding or updating tests
   - `docs`: Documentation updates
   - `style`: Code formatting changes
   - `perf`: Performance improvements
   - `chore`: Maintenance tasks

4. **Commit Scope Examples**:
   - `agents`: Agent system changes
   - `tools`: Tool implementations
   - `api`: API endpoint changes
   - `frontend`: React component changes
   - `db`: Database schema changes
   - `tests`: Test infrastructure changes

### Example Commit Messages
```bash
feat(agents): add competitors researcher agent with find and enrich tools

- Implement CompetitorsResearcherAgent with two tools
- Add FindCompetitorsTool for discovering new competitors
- Add EnrichCompetitorTool for detailed competitor analysis
- Include comprehensive test coverage (87 tests passing)
- Update documentation for agent system

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

```bash
chore: remove unused test files and obsolete code

- Remove 8 standalone test scripts from backend root
- Remove obsolete app.js and index.html files  
- Update README_COMPETITION_TESTS.md to use pytest commands
- Verify all 87 tests still pass after cleanup
- No functional changes to production code

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

### Branch Strategy
- **main**: Production-ready code
- **develop**: Integration branch for features
- **feature/***: Individual feature development
- **hotfix/***: Critical production fixes

Always ensure your changes are properly tested and documented before proposing commits.