# AI Platform - Render Deployment Guide

This guide will walk you through deploying the AI Platform on Render with PostgreSQL database, Flask backend, and React frontend.

## Architecture Overview

The application will be deployed as:
1. **PostgreSQL Database** - Render managed database
2. **Flask Backend API** - Render web service
3. **React Frontend** - Render static site

## Prerequisites

- GitHub repository with your code
- Render account (render.com)
- Environment variables configured

## Step-by-Step Deployment

### 1. Create PostgreSQL Database

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New"** → **"PostgreSQL"**
3. Configure the database:
   - **Name**: `ai-platform-db`
   - **Database**: `ai_platform`
   - **User**: `ai_platform_user`
   - **Region**: Choose closest to your users
   - **Plan**: Choose based on your needs (Free tier available)

4. Click **"Create Database"**
5. **Save the database connection details** (you'll need these for the backend)

### 2. Deploy Flask Backend

1. In Render Dashboard, click **"New"** → **"Web Service"**
2. Connect your GitHub repository
3. Configure the service:

#### Basic Settings
- **Name**: `ai-platform-backend`
- **Branch**: `main` (or your deployment branch)
- **Root Directory**: `backend`
- **Runtime**: `Python 3`

#### Build & Deploy Settings
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `gunicorn wsgi:application`

#### Environment Variables
Add these environment variables in the Render dashboard:

```bash
# Required - Replace with secure values
SECRET_KEY=your-super-secret-key-here-min-32-chars
JWT_SECRET_KEY=your-jwt-secret-key-here-min-32-chars
FLASK_ENV=production

# Database - Use internal URL from your PostgreSQL service
DATABASE_URL=postgresql://ai_platform_user:password@dpg-xxxxx-a.oregon-postgres.render.com/ai_platform

# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key-here
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_DEFAULT_MODEL=gpt-4o

# Port (Render will set this automatically)
PORT=10000
```

#### Important Notes:
- Use the **Internal Database URL** from your PostgreSQL service (starts with `dpg-`)
- Generate secure random strings for SECRET_KEY and JWT_SECRET_KEY (32+ characters)
- Keep your OPENAI_API_KEY secure

4. Click **"Create Web Service"**

### 3. Initialize Database

After the backend service is deployed:

1. Go to your backend service in Render Dashboard
2. Open the **Shell** tab
3. Run database migrations:
   ```bash
   python -m flask db upgrade
   ```

4. Initialize database (run all migrations and populate data):
   ```bash
   python scripts/init_database.py
   ```

   Or run steps individually:
   ```bash
   python -m flask db upgrade
   python scripts/populate_prompt_templates.py --force
   ```

### 4. Deploy React Frontend

1. In Render Dashboard, click **"New"** → **"Static Site"**
2. Connect your GitHub repository
3. Configure the service:

#### Basic Settings
- **Name**: `ai-platform-frontend`
- **Branch**: `main`
- **Root Directory**: `frontend`

#### Build Settings
- **Build Command**: `npm ci && npm run build`
- **Publish Directory**: `build`

#### Environment Variables
Add this environment variable:

```bash
# Backend API URL - Use your backend service URL
REACT_APP_API_URL=https://ai-platform-backend.onrender.com/api
```

4. Click **"Create Static Site"**

## Post-Deployment Configuration

### 1. Update Frontend API URL

The frontend needs to know where your backend API is running. Update the environment variable:

```bash
REACT_APP_API_URL=https://your-backend-service-name.onrender.com/api
```

### 2. Custom Domains (Optional)

You can add custom domains to both services:
1. Go to Settings → Custom Domains
2. Add your domain
3. Update DNS records as instructed

### 3. HTTPS and Security

Render automatically provides HTTPS certificates. Ensure your frontend API calls use HTTPS URLs.

## Environment Variables Reference

### Backend Environment Variables

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `SECRET_KEY` | Flask secret key | `your-super-secret-key-32-chars` | Yes |
| `JWT_SECRET_KEY` | JWT signing key | `your-jwt-secret-32-chars` | Yes |
| `FLASK_ENV` | Environment | `production` | Yes |
| `DATABASE_URL` | PostgreSQL URL | `postgresql://user:pass@host/db` | Yes |
| `OPENAI_API_KEY` | OpenAI API key | `sk-proj-...` | Yes |
| `OPENAI_BASE_URL` | OpenAI API URL | `https://api.openai.com/v1` | No |
| `OPENAI_DEFAULT_MODEL` | Default model | `gpt-4o` | No |
| `PORT` | Server port | `10000` | No* |

*Render sets PORT automatically

### Frontend Environment Variables

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `REACT_APP_API_URL` | Backend API URL | `https://backend.onrender.com/api` | Yes |

## Troubleshooting

### Common Issues

#### 1. Database Connection Errors
- **Problem**: `psycopg2.OperationalError: connection failed`
- **Solution**: Check DATABASE_URL format and credentials
- **Check**: Use internal database URL, not external

#### 2. Secret Key Errors
- **Problem**: `Must set SECRET_KEY environment variable`
- **Solution**: Add secure SECRET_KEY and JWT_SECRET_KEY in Render dashboard

#### 3. OpenAI API Errors
- **Problem**: `OpenAI API key not set`
- **Solution**: Add valid OPENAI_API_KEY environment variable

#### 4. Frontend API Connection Errors
- **Problem**: Frontend can't connect to backend
- **Solution**: Check REACT_APP_API_URL points to correct backend URL
- **Check**: Ensure backend service is running and accessible

#### 5. Database Migration Errors
- **Problem**: Database tables don't exist
- **Solution**: Run migrations in backend shell:
  ```bash
  python -m flask db upgrade
  python scripts/populate_prompt_templates.py --force
  ```

### Logs and Debugging

1. **Backend Logs**: Go to backend service → Logs tab
2. **Frontend Build Logs**: Go to frontend service → Events tab
3. **Database Logs**: Go to database service → Logs tab

### Performance Optimization

1. **Database**: Use connection pooling for high traffic
2. **Backend**: Monitor response times and optimize queries
3. **Frontend**: Enable caching headers for static assets

## Security Checklist

- [ ] Secure SECRET_KEY and JWT_SECRET_KEY generated
- [ ] OpenAI API key kept secure
- [ ] Database uses internal URLs only
- [ ] HTTPS enabled (automatic with Render)
- [ ] Environment variables not exposed in frontend
- [ ] .env files excluded from repository

## Monitoring and Maintenance

### Health Checks

Render automatically monitors your services. You can also add custom health check endpoints.

### Backups

- **Database**: Render automatically backs up PostgreSQL databases
- **Code**: Ensure your GitHub repository is regularly updated

### Updates

1. **Backend**: Push to GitHub → automatic deployment
2. **Frontend**: Push to GitHub → automatic build and deployment
3. **Database**: Use migrations for schema changes

## Support

If you encounter issues:
1. Check Render documentation: https://render.com/docs
2. Review service logs in Render dashboard
3. Ensure all environment variables are correctly set
4. Test database connection and API endpoints

## Cost Optimization

- **Free Tier**: Use free tier for development/testing
- **Paid Plans**: Upgrade for production traffic
- **Database**: Choose appropriate plan based on data size
- **Services**: Scale based on actual usage

---

For additional help, refer to:
- [Render Flask Guide](https://render.com/docs/deploy-flask)
- [Render PostgreSQL Guide](https://render.com/docs/databases)
- [Render Static Sites Guide](https://render.com/docs/static-sites)