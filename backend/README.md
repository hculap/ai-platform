# AI Business Ecosystem - Backend API

A Flask-based REST API for the AI Business Ecosystem platform that enables businesses to analyze their websites and get AI-powered insights.

## 🚀 Features

- **User Authentication**: JWT-based authentication system
- **Business Profile Management**: Create and manage business profiles
- **Website Analysis**: Framework for AI-powered website analysis (OpenAI integration planned)
- **Offers Management**: Create, manage and AI-generate business offers
- **Competition Analysis**: Track and analyze competitors
- **PostgreSQL Database**: Robust data storage with SQLAlchemy ORM
- **Comprehensive Testing**: Full test coverage with pytest
- **API Documentation**: RESTful endpoints with proper error handling

## 📋 Requirements

- Python 3.8+
- PostgreSQL 12+
- pip (Python package manager)

## 🛠️ Installation

1. **Clone the repository and navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create a virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables:**
   Create a `.env` file in the backend directory:
   ```bash
   SECRET_KEY=your-secret-key-here
   JWT_SECRET_KEY=your-jwt-secret-key-here
   DATABASE_URL=postgresql://username:password@localhost:5432/ai_platform
   OPENAI_API_KEY=your-openai-api-key-here  # For future use
   ```

5. **Set up PostgreSQL database:**
   ```bash
   createdb ai_platform
   ```

6. **Run database migrations:**
   ```bash
   flask db init
   flask db migrate -m "Initial migration"
   flask db upgrade
   ```

## 🏃‍♂️ Running the Application

### Development Mode
```bash
python app.py
```

The API will be available at `http://localhost:5000`

### Production Mode
```bash
gunicorn --bind 0.0.0.0:5000 wsgi:app
```

## 📖 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "StrongPassword123"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "created_at": "2024-01-01T00:00:00"
  },
  "access_token": "jwt_token_here"
}
```

#### Login User
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "StrongPassword123"
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <jwt_token>
```

### Business Profile Endpoints

#### Get Business Profiles
```http
GET /api/business-profiles
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Business Name",
      "website_url": "https://example.com",
      "offer_description": "Business description...",
      "target_customer": "Target audience...",
      "problem_solved": "Problems solved...",
      "customer_desires": "Customer desires...",
      "brand_tone": "Brand tone",
      "communication_language": "pl",
      "analysis_status": "completed",
      "is_active": true,
      "created_at": "2024-01-01T00:00:00",
      "updated_at": "2024-01-01T00:00:00"
    }
  ]
}
```

#### Create Business Profile
```http
POST /api/business-profiles
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "website_url": "https://example.com"
}
```

#### Get Specific Business Profile
```http
GET /api/business-profiles/<profile_id>
Authorization: Bearer <jwt_token>
```

#### Update Business Profile
```http
PUT /api/business-profiles/<profile_id>
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "Updated Business Name",
  "offer_description": "Updated description...",
  "is_active": true
}
```

### Offers Endpoints

#### Get Offers for Business Profile
```http
GET /api/business-profiles/<profile_id>/offers
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "business_profile_id": "uuid",
      "type": "product",
      "name": "Premium Widget",
      "description": "High-quality widget for professionals",
      "unit": "piece",
      "price": "99.99",
      "status": "published",
      "created_at": "2024-01-01T00:00:00",
      "updated_at": "2024-01-01T00:00:00"
    }
  ]
}
```

#### Create Offer
```http
POST /api/business-profiles/<profile_id>/offers
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "type": "service",
  "name": "Consulting Service",
  "description": "Professional consulting service",
  "unit": "hour",
  "price": 150.00,
  "status": "draft"
}
```

#### Get Specific Offer
```http
GET /api/offers/<offer_id>
Authorization: Bearer <jwt_token>
```

#### Update Offer
```http
PUT /api/offers/<offer_id>
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "Updated Offer Name",
  "description": "Updated description",
  "price": 199.99,
  "status": "published"
}
```

#### Delete Offer
```http
DELETE /api/offers/<offer_id>
Authorization: Bearer <jwt_token>
```

#### AI Generate Offers
```http
POST /api/business-profiles/<profile_id>/generate-offers
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "message": "Offers generated successfully",
  "data": {
    "offers_generated": 3,
    "offers": [...]
  }
}
```

#### Get Offers Count
```http
GET /api/offers/count?business_profile_id=<profile_id>
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "count": 5
}
```

#### Offer Field Specifications

**Type:** Must be either "product" or "service"

**Unit:** Valid units include:
- `piece` - Individual items
- `hour` - Time-based services
- `kg` - Weight measurements
- `liter` - Volume measurements
- `meter` - Length measurements
- `square_meter` - Area measurements
- `cubic_meter` - Volume measurements
- `package` - Bundled items

**Status:** Must be "draft", "published", or "archived"

**Price:** Numeric value (cannot be negative)

### Competition Endpoints

#### Get Competitors for Business Profile
```http
GET /api/business-profiles/<profile_id>/competitions
Authorization: Bearer <jwt_token>
```

#### Create Competitor
```http
POST /api/business-profiles/<profile_id>/competitions
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "Competitor Name",
  "url": "https://competitor.com",
  "description": "Competitor description",
  "usp": "Their unique selling proposition"
}
```

#### AI Research Competitors
```http
POST /api/business-profiles/<profile_id>/research-competitors
Authorization: Bearer <jwt_token>
```

### Agent Endpoints

#### Get Available Agents
```http
GET /api/agents
Authorization: Bearer <jwt_token>
```

#### Execute Agent
```http
POST /api/agents/execute
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "agent_type": "offer-assistant",
  "parameters": {
    "business_profile_id": "uuid"
  },
  "business_profile_id": "uuid"
}
```

#### Get Agent Interactions
```http
GET /api/agents/interactions
Authorization: Bearer <jwt_token>
```

## 🧪 Testing

### Run All Tests
```bash
pytest
```

### Run Tests with Coverage
```bash
pytest --cov=app --cov-report=html
```

### Run Specific Test File
```bash
pytest app/tests/test_auth.py
```

### Run Tests with Verbose Output
```bash
pytest -v
```

### Test Structure
```
app/tests/
├── test_auth.py              # Authentication endpoint tests
├── test_business_profiles.py # Business profile endpoint tests
├── test_competitions_api.py  # Competition endpoint tests
├── test_offers_api.py        # Offers endpoint tests
├── test_offer_model.py       # Offer model tests
├── test_offer_assistant.py   # Offer assistant agent tests
├── test_models.py           # Database model tests
├── test_agents.py           # Agent system tests
└── __init__.py
```

## 📊 Database Schema

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Business Profiles Table
```sql
CREATE TABLE business_profiles (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  name VARCHAR(255),
  website_url VARCHAR(500),
  offer_description TEXT,
  target_customer TEXT,
  problem_solved TEXT,
  customer_desires TEXT,
  brand_tone VARCHAR(255),
  communication_language VARCHAR(10),
  analysis_status VARCHAR(50) DEFAULT 'pending',
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Offers Table
```sql
CREATE TABLE offers (
  id UUID PRIMARY KEY,
  business_profile_id UUID REFERENCES business_profiles(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('product', 'service')),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  unit VARCHAR(50) NOT NULL CHECK (unit IN ('piece', 'hour', 'kg', 'liter', 'meter', 'square_meter', 'cubic_meter', 'package')),
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Competitions Table
```sql
CREATE TABLE competitions (
  id UUID PRIMARY KEY,
  business_profile_id UUID REFERENCES business_profiles(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  url VARCHAR(500),
  description TEXT,
  usp TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Interactions Table
```sql
CREATE TABLE interactions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  business_profile_id UUID REFERENCES business_profiles(id) ON DELETE CASCADE,
  agent_type VARCHAR(100) NOT NULL,
  input_data JSON,
  output_data JSON,
  status VARCHAR(50) DEFAULT 'completed',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## 🔧 Development

### Code Formatting
```bash
pip install black
black app/
```

### Linting
```bash
pip install flake8
flake8 app/
```

### Database Migrations
```bash
# Create a new migration
flask db migrate -m "Migration description"

# Apply migrations
flask db upgrade

# Rollback migration
flask db downgrade
```

## 🚀 Deployment

### Docker (Recommended)
```dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 5000

CMD ["python", "app.py"]
```

### Environment Variables for Production
```bash
SECRET_KEY=your-production-secret-key
JWT_SECRET_KEY=your-production-jwt-secret-key
DATABASE_URL=postgresql://user:password@db_host:5432/ai_platform
FLASK_ENV=production
```

## 📝 Error Handling

The API uses consistent error response format:

```json
{
  "error": "error_type",
  "message": "Human readable error message"
}
```

### Error Types
- `validation_error`: Invalid input data
- `unauthorized`: Authentication required or failed
- `not_found`: Resource not found
- `server_error`: Internal server error

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License.
