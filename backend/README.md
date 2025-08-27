# AI Business Ecosystem - Backend API

A Flask-based REST API for the AI Business Ecosystem platform that enables businesses to analyze their websites and get AI-powered insights.

## 🚀 Features

- **User Authentication**: JWT-based authentication system
- **Business Profile Management**: Create and manage business profiles
- **Website Analysis**: Framework for AI-powered website analysis (OpenAI integration planned)
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
├── test_models.py           # Database model tests
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
