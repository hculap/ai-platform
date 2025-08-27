CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

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
