# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Backend (Flask/Python)
- **Run development server**: `cd backend && python app.py` (runs on port 5004)
- **Install dependencies**: `cd backend && pip install -r requirements.txt`
- **Run tests**: `cd backend && pytest`
- **Run tests with coverage**: `cd backend && pytest --cov=app --cov-report=html`
- **Run specific test**: `cd backend && pytest app/tests/test_auth.py`
- **Database migrations**: 
  - Create migration: `cd backend && flask db migrate -m "Description"`
  - Apply migrations: `cd backend && flask db upgrade`

### Frontend (React/TypeScript)
- **Run development server**: `cd frontend && npm start` (runs on port 3000, proxies to backend on 5004)
- **Install dependencies**: `cd frontend && npm install`
- **Run tests**: `cd frontend && npm test`
- **Build for production**: `cd frontend && npm run build`
- **Lint/typecheck**: No explicit commands defined - use standard React Scripts

### Testing Commands
- **Backend test markers**: Use `pytest -m unit`, `pytest -m integration`, `pytest -m api` for specific test types
- **Coverage reports**: Generated in `backend/htmlcov/` directory

## Project Architecture

### High-Level Structure
This is an AI-powered business analysis SaaS platform with a Flask backend and React frontend. The system enables small/medium businesses to analyze their websites and get AI-powered business insights.

### Backend Architecture (Flask)
- **Main entry point**: `backend/app.py` (creates Flask app, runs on port 5004)
- **Application factory**: `backend/app/__init__.py` contains `create_app()` function
- **Database**: PostgreSQL with SQLAlchemy ORM and Flask-Migrate
- **Authentication**: JWT-based auth using Flask-JWT-Extended
- **API Structure**: RESTful endpoints organized in blueprints

#### Key Backend Components:
- **Models** (`app/models/`): SQLAlchemy models for User, BusinessProfile, Competition, Interaction
- **Routes** (`app/routes/`): API blueprints for auth, business_profiles, competitions, agents
- **Agents System** (`app/agents/`): Modular AI agent architecture
  - `agents/base.py`: Core agent registry and base classes
  - `agents/concierge/`: Business website analysis agent
  - `agents/competitors_researcher/`: Competitor research agent
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
- **Authentication Forms**: SignInForm, SignupForm components
- **Types** (`types/index.ts`): Centralized TypeScript interfaces

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
- **interactions**: Agent execution history
- **analysis_requests**: Async processing status (via Alembic migrations)

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
- **Multi-language Support**: Polish as primary language, English secondary

### Development Workflow
1. Backend API development in Flask with immediate testing via pytest
2. Frontend component development with live preview
3. Integration testing between frontend/backend via proxy setup
4. Database changes managed through Flask-Migrate migrations

### Important Implementation Notes
- Backend runs on port 5004 (not standard 5000) to avoid conflicts
- Frontend uses axios with automatic token refresh and retry logic
- All user-facing text supports internationalization
- Agent system designed for extensibility - new agents can be easily added
- Business profiles have single-active constraint (only one can be active per user)
- Error handling includes proper HTTP status codes and user-friendly messages