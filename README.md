# AI Business Analysis Platform

An AI-powered SaaS platform that helps small and medium businesses analyze their websites, understand their competition, and generate actionable business insights using advanced artificial intelligence.

## 🚀 Features

### Current Capabilities
- **Website Analysis**: AI-powered analysis of business websites to extract key business information
- **Business Profile Generation**: Automatic creation of comprehensive business profiles from website data
- **Competitor Research**: AI-driven competitor discovery and analysis
- **Competitor Enrichment**: Detailed competitor data gathering and profiling
- **Multi-language Support**: Polish and English language support throughout the platform

### Core AI Agents
- **Concierge Agent**: Analyzes website URLs to create detailed business profiles
- **Competitors Researcher Agent**: Finds and enriches competitor data using advanced AI algorithms

## 🏗️ Architecture

### Backend (Flask/Python)
- **Framework**: Flask with SQLAlchemy ORM
- **Database**: PostgreSQL with Flask-Migrate
- **Authentication**: JWT-based authentication using Flask-JWT-Extended
- **AI Integration**: OpenAI API integration for intelligent analysis
- **Agent System**: Modular AI agent architecture with factory patterns

### Frontend (React/TypeScript)
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with responsive design
- **State Management**: Local React state (no external state management)
- **Internationalization**: i18next for Polish/English support
- **API Integration**: Centralized API service with auto-retry and token refresh

### Key Technologies
- **Backend**: Flask, SQLAlchemy, PostgreSQL, OpenAI API, JWT
- **Frontend**: React, TypeScript, Tailwind CSS, i18next
- **Development**: Hot reload, automated testing, modular architecture

## 🛠️ Development Setup

### Prerequisites
- Python 3.8+
- Node.js 16+
- PostgreSQL
- OpenAI API key

### Backend Setup
```bash
cd backend
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
flask db upgrade

# Start development server
python app.py
```

### Frontend Setup
```bash
cd frontend
npm install

# Start development server
npm start
```

### Development Commands

#### Backend (Flask/Python)
- **Run development server**: `cd backend && python app.py` (runs on port 5004)
- **Install dependencies**: `cd backend && pip install -r requirements.txt`
- **Run tests**: `cd backend && pytest`
- **Run tests with coverage**: `cd backend && pytest --cov=app --cov-report=html`
- **Database migrations**: 
  - Create migration: `cd backend && flask db migrate -m "Description"`
  - Apply migrations: `cd backend && flask db upgrade`

#### Frontend (React/TypeScript)
- **Run development server**: `cd frontend && npm start` (runs on port 3000)
- **Install dependencies**: `cd frontend && npm install`
- **Run tests**: `cd frontend && npm test`
- **Build for production**: `cd frontend && npm run build`
- **TypeScript check**: `cd frontend && npx tsc --noEmit`

## 🏛️ Project Structure

```
AI-Platform/
├── backend/                 # Flask backend application
│   ├── app/
│   │   ├── agents/         # AI agent system
│   │   │   ├── base.py     # Agent registry and base classes
│   │   │   ├── concierge/  # Website analysis agent
│   │   │   └── competitors_researcher/  # Competitor research agent
│   │   ├── models/         # SQLAlchemy models
│   │   ├── routes/         # API blueprints
│   │   ├── services/       # External service integrations
│   │   └── utils/          # Shared utilities
│   ├── tests/              # Backend tests
│   └── requirements.txt    # Python dependencies
├── frontend/               # React frontend application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── services/       # API integration
│   │   ├── types/          # TypeScript interfaces
│   │   └── i18n.ts         # Internationalization
│   ├── public/             # Static assets
│   └── package.json        # Node.js dependencies
├── CLAUDE.md              # Development guidelines for Claude Code
├── IDEAS.md               # Future feature ideas and strategic planning
└── README.md              # This file
```

## 🤖 AI Agent System

The platform implements a flexible, modular AI agent architecture:

### Agent Registry Pattern
- Agents register themselves via `AgentRegistry`
- Two implementation approaches: prompt-based and system message-based
- Background processing support with status polling

### Current Agents

#### Concierge Agent (`business-concierge`)
- **Purpose**: AI-powered business profile generation from website analysis
- **Tools**: Website analysis and business data extraction
- **Input**: Website URL
- **Output**: Comprehensive business profile

#### Competitors Researcher Agent (`competitors-researcher`)
- **Purpose**: AI-powered competitor research and analysis
- **Tools**: 
  - `find-competitors`: Discover new competitors based on business profile
  - `enrich-competitor`: Gather detailed information about specific competitors
- **Input**: Business profile data or competitor name/URL
- **Output**: Detailed competitor analysis and insights

### Adding New Agents
The system is designed for easy extensibility. New agents can be added by:
1. Creating agent directory under `backend/app/agents/`
2. Implementing tools using the factory pattern
3. Registering the agent using `create_and_register_standard_agent`

## 📊 Database Schema

### Core Models
- **Users**: User authentication and account management
- **BusinessProfiles**: Comprehensive business information and analysis results
- **Competitions**: Competitor data linked to business profiles
- **Interactions**: Agent execution history and results

### Key Relationships
- Users → BusinessProfiles (one-to-many)
- BusinessProfiles → Competitions (one-to-many)
- All models → Interactions (tracking agent executions)

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Token refresh

### Business Profiles
- `GET /api/business-profiles` - List user's business profiles
- `POST /api/business-profiles` - Create new business profile
- `PUT /api/business-profiles/{id}` - Update business profile
- `DELETE /api/business-profiles/{id}` - Delete business profile

### Competitions
- `GET /api/competitions` - List competitors for active business profile
- `POST /api/competitions` - Create new competitor
- `PUT /api/competitions/{id}` - Update competitor
- `DELETE /api/competitions/{id}` - Delete competitor

### AI Agents
- `GET /api/agents` - List available agents
- `POST /api/agents/{agent-slug}/tools/{tool-slug}/call` - Execute agent tool
- `GET /api/agents/{agent-slug}/tools/{tool-slug}/status/{interaction-id}` - Check execution status

## 🌍 Internationalization

The platform supports multiple languages with Polish as the primary language:
- **Default Language**: Polish (`pl`)
- **Supported Languages**: Polish, English
- **Implementation**: i18next with localStorage persistence
- **Coverage**: Complete UI translation for both languages

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```
DATABASE_URL=postgresql://user:password@localhost/dbname
SECRET_KEY=your-secret-key
JWT_SECRET_KEY=your-jwt-secret
OPENAI_API_KEY=your-openai-api-key
```

#### Frontend
Configuration is handled through the proxy setup in `package.json` for development.

## 🧪 Testing

### Backend Testing
```bash
cd backend
pytest                    # Run all tests
pytest -m unit           # Run unit tests only
pytest -m integration    # Run integration tests only
pytest --cov=app         # Run with coverage
```

### Frontend Testing
```bash
cd frontend
npm test                 # Run tests in watch mode
npm test -- --coverage  # Run with coverage
```

## 📈 Business Model

### Target Market
- Small to medium businesses
- Primary focus on Polish market
- Businesses seeking AI-powered competitive intelligence

### Value Proposition
- Automated business analysis and competitive intelligence
- AI-powered insights that would normally require expensive consultants
- Multi-language support for local markets
- Modular agent system allowing for rapid feature expansion

## 🔮 Future Roadmap

See [IDEAS.md](IDEAS.md) for detailed strategic planning and feature ideas.

### Planned Agents
1. **Marketing Content Generator Agent** - Generate contextually-aware marketing content
2. **SEO Strategy Agent** - AI-powered SEO recommendations
3. **Pricing Strategy Agent** - Competitive pricing optimization
4. **Customer Journey Optimizer Agent** - Conversion optimization insights

### Platform Enhancements
- Real-time competitor monitoring
- Advanced analytics and reporting
- Team collaboration features
- API for third-party integrations

## 🤝 Contributing

This project uses a modular architecture designed for rapid development and easy maintenance. Key principles:

1. **Agent-First Design**: New features should be implemented as AI agents when possible
2. **Factory Patterns**: Use existing factory patterns for consistency
3. **Multi-language Support**: All user-facing text must support internationalization
4. **Type Safety**: Maintain TypeScript coverage in frontend code
5. **Testing**: Write tests for new features and bug fixes

## 📚 Documentation

Comprehensive documentation is available in the [`/docs`](docs/) directory:

### Quick Start
- **[Agent Development Tutorial](docs/tutorials/first-agent.md)** - Build your first agent in 30 minutes
- **[Agent Quick Start](docs/agents/quick-start.md)** - Create agents in 5 minutes using factory patterns
- **[System Architecture](docs/agents/architecture.md)** - Understand the platform architecture

### Complete Documentation
- **[📖 Documentation Hub](docs/README.md)** - Central documentation index
- **[🤖 Agents](docs/agents/)** - Agent system development
- **[🔧 Tools](docs/tools/)** - Tool creation and customization
- **[🎨 Frontend](docs/frontend/)** - React integration patterns
- **[🧪 Testing](docs/testing/)** - Testing strategies
- **[🚀 Deployment](docs/deployment/)** - Production deployment
- **[📖 Tutorials](docs/tutorials/)** - Step-by-step learning guides

### Developer Resources
- **[CLAUDE.md](CLAUDE.md)** - Development workflow and commands
- **[IDEAS.md](IDEAS.md)** - Strategic planning and future features

## 📄 License

This project is proprietary software. All rights reserved.

## 🆘 Support

For development questions and guidance:
- **Development Setup**: See [CLAUDE.md](CLAUDE.md)
- **Agent Development**: See [Agent Documentation](docs/agents/)
- **Tutorials**: See [Step-by-step Tutorials](docs/tutorials/)
- **Issues**: Report at [GitHub Issues](https://github.com/your-repo/issues)