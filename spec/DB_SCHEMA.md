# Database Schema

## Overview
This document describes the complete database schema for the AI-Platform application, an AI-powered business analysis SaaS platform with Flask backend and React frontend.

## Tables

### users
Core user authentication table.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
```

### business_profiles
Business information and analysis results.

```sql
CREATE TABLE business_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255),
  website_url VARCHAR(500),
  offer_description TEXT,
  target_customer TEXT,
  problem_solved TEXT,
  customer_desires TEXT,
  brand_tone VARCHAR(255),
  communication_language VARCHAR(10) DEFAULT 'pl',
  analysis_status VARCHAR(50) DEFAULT 'pending' 
    CHECK (analysis_status IN ('pending', 'processing', 'completed', 'failed')),
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_active_profile_per_user 
    EXCLUDE (user_id WITH =) WHERE (is_active = true)
);

CREATE INDEX idx_business_profiles_user_id ON business_profiles(user_id);
CREATE INDEX idx_business_profiles_active ON business_profiles(is_active);
CREATE INDEX idx_business_profiles_status ON business_profiles(analysis_status);
```

### competitions
Competitor data linked to business profiles.

```sql
CREATE TABLE competitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_profile_id UUID REFERENCES business_profiles(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  url VARCHAR(500),
  description TEXT,
  usp TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_competitions_business_profile ON competitions(business_profile_id);
CREATE INDEX idx_competitions_created_at ON competitions(created_at);
```

### offers
Product/service offerings linked to business profiles.

```sql
CREATE TABLE offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_profile_id UUID REFERENCES business_profiles(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('product', 'service')),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  unit VARCHAR(100),
  price DECIMAL(10,2),
  status VARCHAR(50) DEFAULT 'draft' 
    CHECK (status IN ('draft', 'published', 'archived')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_offers_business_profile ON offers(business_profile_id);
CREATE INDEX idx_offers_status ON offers(status);
CREATE INDEX idx_offers_type ON offers(type);
```

### campaigns
Marketing campaign strategies linked to business profiles.

```sql
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_profile_id UUID REFERENCES business_profiles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  goal VARCHAR(100) NOT NULL CHECK (goal IN (
    'Brand Awareness',
    'Lead Generation', 
    'Sales / Conversions',
    'Product Launch',
    'Customer Retention & Loyalty',
    'Event Promotion',
    'Rebranding / Reputation Management',
    'Community Engagement'
  )),
  budget DECIMAL(12,2),
  deadline DATE,
  selected_products JSONB DEFAULT '[]',
  strategy_summary TEXT,
  timeline TEXT,
  target_audience TEXT,
  sales_funnel_steps TEXT,
  channels JSONB DEFAULT '{}',
  channels_rationale JSONB DEFAULT '{}',
  recommended_budget DECIMAL(12,2),
  risks_recommendations TEXT,
  status VARCHAR(50) DEFAULT 'draft' 
    CHECK (status IN ('draft', 'published', 'archived')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_campaigns_business_profile ON campaigns(business_profile_id);
CREATE INDEX idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX idx_campaigns_goal ON campaigns(goal);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_created_at ON campaigns(created_at);
```

### agents
AI agent registry for the modular agent system.

```sql
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  tools JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_agents_slug ON agents(slug);
CREATE INDEX idx_agents_active ON agents(is_active);
```

### interactions
Agent execution history for tracking AI operations.

```sql
CREATE TABLE interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_slug VARCHAR(100),
  tool_slug VARCHAR(100),
  business_profile_id UUID REFERENCES business_profiles(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'pending' 
    CHECK (status IN ('pending', 'queued', 'processing', 'completed', 'failed', 'canceled')),
  input_data JSONB,
  output_data JSONB,
  error_message TEXT,
  openai_response_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_interactions_agent_tool ON interactions(agent_slug, tool_slug);
CREATE INDEX idx_interactions_business_profile ON interactions(business_profile_id);
CREATE INDEX idx_interactions_user_id ON interactions(user_id);
CREATE INDEX idx_interactions_status ON interactions(status);
CREATE INDEX idx_interactions_openai_id ON interactions(openai_response_id);
CREATE INDEX idx_interactions_created_at ON interactions(created_at);
```

### analysis_requests
Async processing status tracking (used by Flask-Migrate).

```sql
CREATE TABLE analysis_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  website_url VARCHAR(500) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  result JSONB,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_analysis_requests_user_id ON analysis_requests(user_id);
CREATE INDEX idx_analysis_requests_status ON analysis_requests(status);
CREATE INDEX idx_analysis_requests_created_at ON analysis_requests(created_at);
```

## Relationships

### Primary Relationships
- `users` → `business_profiles` (1:N) - Users can have multiple business profiles
- `users` → `campaigns` (1:N) - Users can create multiple campaigns
- `users` → `interactions` (1:N) - Users can have multiple AI interactions
- `business_profiles` → `competitions` (1:N) - Each profile can track multiple competitors
- `business_profiles` → `offers` (1:N) - Each profile can have multiple offers/services
- `business_profiles` → `campaigns` (1:N) - Each profile can have multiple campaigns

### Business Logic Constraints
- Only one active business profile per user (enforced by exclusion constraint)
- Campaign goals are restricted to predefined values
- Offer types are limited to 'product' or 'service'
- Status fields use controlled vocabularies with CHECK constraints

## Data Types and Conventions

### UUIDs
- All primary keys use UUID type with `gen_random_uuid()` default
- Foreign keys maintain UUID consistency

### Timestamps
- All tables include `created_at` and `updated_at` fields
- Timestamps use `TIMESTAMP` type with `NOW()` defaults

### JSON Data
- `JSONB` type used for flexible schema data (channels, selected_products, tools)
- Provides efficient querying and indexing capabilities

### Text Fields
- `VARCHAR` with appropriate limits for structured data
- `TEXT` for unlimited content (descriptions, analysis results)

### Status Fields
- Consistent naming pattern across tables
- CHECK constraints ensure data integrity
- Indexed for query performance

## Indexes

### Performance Indexes
- Foreign key relationships are indexed
- Status fields are indexed for filtering
- Created timestamps for sorting
- Unique constraints on business logic fields

### Query Optimization
- Composite indexes on frequently queried combinations
- Partial indexes for conditional queries (e.g., active profiles)

## Migration Notes

### Schema Evolution
- Tables designed for backward compatibility
- JSON fields allow schema flexibility without migrations
- Status enums can be extended via ALTER TABLE statements

### Data Integrity
- Foreign key constraints with appropriate CASCADE/SET NULL actions
- CHECK constraints maintain business rule integrity
- UNIQUE constraints prevent duplicate data