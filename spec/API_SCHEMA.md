# API Schema Documentation

## Overview
RESTful API specification for the AI-Platform, an AI-powered business analysis SaaS platform. All endpoints use JSON format and require authentication unless otherwise specified.

## Base Configuration
- **Base URL**: `/api`
- **Content-Type**: `application/json`
- **Authentication**: Bearer JWT tokens

## Authentication

### Register User
```http
POST /api/auth/register
```

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response (201):**
```json
{
  "message": "User created successfully",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "created_at": "2025-01-15T10:30:00Z"
  },
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

### Login User
```http
POST /api/auth/login
```

**Request:**
```json
{
  "email": "user@example.com", 
  "password": "securePassword123"
}
```

**Response (200):**
```json
{
  "message": "Login successful",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "created_at": "2025-01-15T10:30:00Z"
  },
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

## Business Profiles

### List Business Profiles
```http
GET /api/business-profiles
Authorization: Bearer {jwt_token}
```

**Response (200):**
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Moja Firma sp. z o.o.",
      "website_url": "https://mojafirma.pl",
      "offer_description": "Specjalizujemy się w tworzeniu nowoczesnych rozwiązań IT",
      "target_customer": "Małe i średnie przedsiębiorstwa",
      "problem_solved": "Automatyzacja procesów biznesowych",
      "customer_desires": "Zwiększenie efektywności i redukcja kosztów",
      "brand_tone": "Profesjonalny, ekspercki",
      "communication_language": "pl",
      "analysis_status": "completed",
      "is_active": true,
      "created_at": "2025-01-15T10:30:00Z",
      "updated_at": "2025-01-15T10:30:00Z"
    }
  ]
}
```

### Get Business Profile
```http
GET /api/business-profiles/{id}
Authorization: Bearer {jwt_token}
```

**Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Moja Firma sp. z o.o.",
  "website_url": "https://mojafirma.pl",
  "offer_description": "Specjalizujemy się w tworzeniu nowoczesnych rozwiązań IT",
  "target_customer": "Małe i średnie przedsiębiorstwa, sektor finansowy",
  "problem_solved": "Brak zintegrowanych systemów IT, manualne procesy",
  "customer_desires": "Automatyzacja, lepsze raportowanie, mobilny dostęp",
  "brand_tone": "Profesjonalny, ekspercki, przyjazny",
  "communication_language": "pl",
  "analysis_status": "completed",
  "is_active": true,
  "created_at": "2025-01-15T10:30:00Z",
  "updated_at": "2025-01-15T10:30:00Z"
}
```

### Create Business Profile
```http
POST /api/business-profiles
Authorization: Bearer {jwt_token}
```

**Request:**
```json
{
  "name": "Nowa Firma",
  "website_url": "https://nowafirma.pl",
  "offer_description": "Usługi consultingowe",
  "target_customer": "Duże korporacje",
  "problem_solved": "Optymalizacja procesów",
  "customer_desires": "Zwiększenie zysku",
  "brand_tone": "Formalny, ekspercki", 
  "communication_language": "pl",
  "is_active": false
}
```

**Response (201):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "analysis_status": "pending",
  "created_at": "2025-01-15T10:35:00Z",
  "message": "Business profile created successfully"
}
```

### Update Business Profile
```http
PUT /api/business-profiles/{id}
Authorization: Bearer {jwt_token}
```

**Request:**
```json
{
  "name": "Zaktualizowana Nazwa",
  "offer_description": "Nowy opis oferty...",
  "is_active": true
}
```

**Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "updated_at": "2025-01-15T11:00:00Z",
  "message": "Business profile updated successfully"
}
```

### Delete Business Profile
```http
DELETE /api/business-profiles/{id}
Authorization: Bearer {jwt_token}
```

**Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Business profile deleted successfully"
}
```

## Competition Management

### List Competitions
```http
GET /api/competitions?business_profile_id={id}
Authorization: Bearer {jwt_token}
```

**Response (200):**
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "business_profile_id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "Konkurent ABC",
      "url": "https://konkurent-abc.pl",
      "description": "Wiodący dostawca rozwiązań CRM w Polsce",
      "usp": "Najlepsza obsługa klienta, 24/7 support",
      "created_at": "2025-01-15T10:30:00Z",
      "updated_at": "2025-01-15T10:30:00Z"
    }
  ]
}
```

### Get Competition Details
```http
GET /api/competitions/{id}
Authorization: Bearer {jwt_token}
```

**Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "business_profile_id": "550e8400-e29b-41d4-a716-446655440001", 
  "name": "Konkurent ABC",
  "url": "https://konkurent-abc.pl",
  "description": "Firma specjalizująca się w rozwiązaniach CRM dla sektora bankowego i ubezpieczeniowego",
  "usp": "Unikalne algorytmy ML, integracja z 200+ systemami bankowymi",
  "created_at": "2025-01-15T10:30:00Z",
  "updated_at": "2025-01-15T10:30:00Z"
}
```

### Create Competition
```http
POST /api/business-profiles/{id}/competitions
Authorization: Bearer {jwt_token}
```

**Request:**
```json
{
  "name": "Nowy Konkurent",
  "url": "https://nowy-konkurent.pl",
  "description": "Opis konkurenta...",
  "usp": "Unikalna propozycja wartości"
}
```

**Response (201):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440002",
  "message": "Competition created successfully"
}
```

### Update Competition
```http
PUT /api/competitions/{id}
Authorization: Bearer {jwt_token}
```

**Request:**
```json
{
  "name": "Zaktualizowana nazwa",
  "description": "Nowy opis...",
  "usp": "Nowa propozycja wartości"
}
```

**Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "updated_at": "2025-01-15T11:00:00Z",
  "message": "Competition updated successfully"
}
```

### Delete Competition
```http
DELETE /api/competitions/{id}
Authorization: Bearer {jwt_token}
```

**Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Competition deleted successfully"
}
```

### Get Competitions Count
```http
GET /api/competitions/count?business_profile_id={id}
Authorization: Bearer {jwt_token}
```

**Response (200):**
```json
{
  "count": 5
}
```

## Offer Management

### List Offers
```http
GET /api/business-profiles/{id}/offers
Authorization: Bearer {jwt_token}
```

**Response (200):**
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "business_profile_id": "550e8400-e29b-41d4-a716-446655440001",
      "type": "service",
      "name": "Konsultacje IT",
      "description": "Profesjonalne doradztwo w zakresie transformacji cyfrowej",
      "unit": "godzina",
      "price": 250.00,
      "status": "published",
      "created_at": "2025-01-15T10:30:00Z",
      "updated_at": "2025-01-15T10:30:00Z"
    }
  ]
}
```

### Get Offer Details
```http
GET /api/offers/{id}
Authorization: Bearer {jwt_token}
```

**Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "business_profile_id": "550e8400-e29b-41d4-a716-446655440001",
  "type": "service",
  "name": "Audit bezpieczeństwa IT",
  "description": "Kompleksowy audyt zabezpieczeń systemów informatycznych",
  "unit": "projekt", 
  "price": 8500.00,
  "status": "published",
  "created_at": "2025-01-15T10:30:00Z",
  "updated_at": "2025-01-15T10:30:00Z"
}
```

### Create Offer
```http
POST /api/business-profiles/{id}/offers
Authorization: Bearer {jwt_token}
```

**Request:**
```json
{
  "type": "product",
  "name": "Oprogramowanie CRM",
  "description": "Zaawansowany system zarządzania klientami",
  "unit": "licencja",
  "price": 1200.00,
  "status": "draft"
}
```

**Response (201):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440002",
  "message": "Offer created successfully"
}
```

### Update Offer
```http
PUT /api/offers/{id}
Authorization: Bearer {jwt_token}
```

**Request:**
```json
{
  "name": "Zaktualizowana nazwa oferty",
  "price": 1500.00,
  "status": "published"
}
```

**Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "updated_at": "2025-01-15T11:00:00Z",
  "message": "Offer updated successfully"
}
```

### Delete Offer
```http
DELETE /api/offers/{id}
Authorization: Bearer {jwt_token}
```

**Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Offer deleted successfully"
}
```

### Generate Offers with AI
```http
POST /api/business-profiles/{id}/generate-offers
Authorization: Bearer {jwt_token}
```

**Request:**
```json
{}
```

**Response (200):**
```json
{
  "message": "Offers generated successfully",
  "data": {
    "offers_count": 3,
    "offers": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440010",
        "type": "service",
        "name": "Implementacja systemu ERP",
        "description": "Kompleksowa implementacja systemu planowania zasobów przedsiębiorstwa",
        "unit": "projekt",
        "price": 45000.00,
        "status": "draft"
      }
    ]
  }
}
```

### Save Selected Generated Offers
```http
POST /api/business-profiles/{id}/save-selected-offers
Authorization: Bearer {jwt_token}
```

**Request:**
```json
{
  "selected_offer_ids": [
    "550e8400-e29b-41d4-a716-446655440010",
    "550e8400-e29b-41d4-a716-446655440011"
  ]
}
```

**Response (200):**
```json
{
  "message": "Selected offers saved successfully",
  "saved_count": 2
}
```

### Get Offers Count
```http
GET /api/offers/count?business_profile_id={id}
Authorization: Bearer {jwt_token}
```

**Response (200):**
```json
{
  "count": 8
}
```

## Campaign Management

### List Campaigns
```http
GET /api/business-profiles/{id}/campaigns
Authorization: Bearer {jwt_token}
```

**Response (200):**
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "business_profile_id": "550e8400-e29b-41d4-a716-446655440001",
      "user_id": "550e8400-e29b-41d4-a716-446655440002",
      "goal": "Lead Generation",
      "budget": 15000.00,
      "deadline": "2025-03-15",
      "selected_products": ["550e8400-e29b-41d4-a716-446655440010"],
      "strategy_summary": "Kampania leadgenowa skupiająca się na LinkedIn i Google Ads...",
      "timeline": "Faza 1 (tygodnie 1-2): Przygotowanie materiałów...",
      "target_audience": "CTO i IT Managerowie w firmach 100-500 pracowników",
      "sales_funnel_steps": "Świadomość → Zainteresowanie → Rozważanie → Decyzja",
      "channels": {
        "linkedin": true,
        "google_ads": true,
        "email": true,
        "facebook": false
      },
      "channels_rationale": {
        "linkedin": "Najlepszy kanał do dotarcia do decydentów IT",
        "google_ads": "Wysoka intencja zakupu w wyszukiwaniach"
      },
      "recommended_budget": 18000.00,
      "risks_recommendations": "Ryzyko: Wysoka konkurencja w segmencie...",
      "status": "published",
      "created_at": "2025-01-15T10:30:00Z",
      "updated_at": "2025-01-15T10:30:00Z"
    }
  ]
}
```

### Get Campaign Details
```http
GET /api/campaigns/{id}
Authorization: Bearer {jwt_token}
```

**Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "business_profile_id": "550e8400-e29b-41d4-a716-446655440001",
  "user_id": "550e8400-e29b-41d4-a716-446655440002",
  "goal": "Brand Awareness",
  "budget": 25000.00,
  "deadline": "2025-06-30",
  "selected_products": [
    "550e8400-e29b-41d4-a716-446655440010",
    "550e8400-e29b-41d4-a716-446655440011"
  ],
  "strategy_summary": "Kompleksowa kampania budowania świadomości marki w sektorze finansowym, wykorzystująca content marketing, webinary i case studies...",
  "timeline": "Faza 1 (miesiąc 1): Przygotowanie contentu i materiałów\nFaza 2 (miesiące 2-4): Aktywna promocja i webinary\nFaza 3 (miesiące 5-6): Optymalizacja i analiza wyników",
  "target_audience": "Dyrektorzy IT i CFO w bankach i firmach ubezpieczeniowych (50-2000 pracowników)",
  "sales_funnel_steps": "1. Świadomość problemu\n2. Poszukiwanie rozwiązań\n3. Ocena dostawców\n4. Decyzja i negocjacje",
  "channels": {
    "linkedin": true,
    "google_ads": true,
    "email": true,
    "youtube": true,
    "facebook": false,
    "tiktok": false
  },
  "channels_rationale": {
    "linkedin": "Główny kanał B2B, wysoka jakość leadów z sektora finansowego",
    "youtube": "Webinary i case studies, budowanie autorytetu eksperta",
    "email": "Nurturing leadów, personalizowana komunikacja"
  },
  "recommended_budget": 28000.00,
  "risks_recommendations": "Główne ryzyka:\n- Długi cykl decyzyjny w sektorze finansowym\n- Wysokie wymagania compliance\n\nZalecenia:\n- Focus na case studies z branży\n- Wczesne zaangażowanie działu prawnego klientów",
  "status": "published",
  "created_at": "2025-01-15T10:30:00Z",
  "updated_at": "2025-01-15T10:30:00Z"
}
```

### Create Campaign
```http
POST /api/business-profiles/{id}/campaigns
Authorization: Bearer {jwt_token}
```

**Request:**
```json
{
  "goal": "Sales / Conversions",
  "budget": 12000.00,
  "deadline": "2025-04-30",
  "selected_products": ["550e8400-e29b-41d4-a716-446655440010"],
  "status": "draft"
}
```

**Response (201):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440003",
  "message": "Campaign created successfully"
}
```

### Update Campaign
```http
PUT /api/campaigns/{id}
Authorization: Bearer {jwt_token}
```

**Request:**
```json
{
  "goal": "Lead Generation",
  "budget": 18000.00,
  "status": "published"
}
```

**Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "updated_at": "2025-01-15T11:00:00Z", 
  "message": "Campaign updated successfully"
}
```

### Delete Campaign
```http
DELETE /api/campaigns/{id}
Authorization: Bearer {jwt_token}
```

**Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Campaign deleted successfully"
}
```

### Generate Campaign with AI
```http
POST /api/agents/campaign-generator/tools/generate-campaign/call
Authorization: Bearer {jwt_token}
```

**Request:**
```json
{
  "input": {
    "business_profile_id": "550e8400-e29b-41d4-a716-446655440001",
    "campaign_goal": "Lead Generation",
    "budget": 15000.00,
    "deadline": "2025-04-30",
    "selected_products": ["550e8400-e29b-41d4-a716-446655440010"]
  }
}
```

**Response (202):**
```json
{
  "status": "pending",
  "data": {
    "openai_response_id": "run_550e8400e29b41d4a716446655440020"
  }
}
```

### Check Campaign Generation Status
```http
GET /api/agents/campaign-generator/tools/generate-campaign/call?job_id={openai_response_id}
Authorization: Bearer {jwt_token}
```

**Response (200) - In Progress:**
```json
{
  "status": "in_progress"
}
```

**Response (200) - Completed:**
```json
{
  "status": "completed",
  "data": {
    "campaign_data": {
      "strategy_summary": "Strategia leadgenowa oparta na LinkedIn i Google Ads...",
      "timeline": "Faza przygotowawcza (2 tygodnie), Faza aktywna (8 tygodni)...",
      "target_audience": "IT Decision Makers w firmach produkcyjnych 100-500 osób",
      "sales_funnel_steps": "Problem Awareness → Solution Research → Vendor Evaluation → Purchase Decision",
      "channels": {
        "linkedin": true,
        "google_ads": true,
        "email": true,
        "facebook": false
      },
      "channels_rationale": {
        "linkedin": "Bezpośredni dostęp do decydentów IT",
        "google_ads": "Przechwytywanie aktywnego popytu"
      },
      "recommended_budget": 18500.00,
      "risks_recommendations": "Ryzyka i mitigation strategies..."
    }
  }
}
```

### Save Generated Campaign
```http
POST /api/business-profiles/{id}/campaigns/save
Authorization: Bearer {jwt_token}
```

**Request:**
```json
{
  "campaign_params": {
    "campaign_goal": "Lead Generation",
    "budget": 15000.00,
    "deadline": "2025-04-30",
    "selected_products": ["550e8400-e29b-41d4-a716-446655440010"]
  },
  "campaign_data": {
    "strategy_summary": "Generated strategy...",
    "timeline": "Generated timeline...",
    "target_audience": "Generated audience...",
    "sales_funnel_steps": "Generated funnel...",
    "channels": { "linkedin": true, "google_ads": true },
    "channels_rationale": { "linkedin": "Rationale..." },
    "recommended_budget": 18500.00,
    "risks_recommendations": "Generated risks..."
  }
}
```

**Response (201):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440004",
  "message": "Campaign saved successfully"
}
```

### Get Campaigns Count
```http
GET /api/campaigns/count?business_profile_id={id}
Authorization: Bearer {jwt_token}
```

**Response (200):**
```json
{
  "count": 3
}
```

## Agent System

### List Available Agents
```http
GET /api/agents
Authorization: Bearer {jwt_token}
```

**Response (200):**
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Business Concierge",
      "slug": "business-concierge",
      "description": "Analizuje strony internetowe firm i generuje profile biznesowe",
      "tools": [
        {
          "name": "Analyze Website",
          "slug": "analyze-website",
          "description": "Kompleksowa analiza strony internetowej firmy"
        }
      ]
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "Competitors Researcher",  
      "slug": "competitors-researcher",
      "description": "Znajduje i analizuje konkurentów w branży",
      "tools": [
        {
          "name": "Find Competitors",
          "slug": "find-competitors",
          "description": "Wyszukuje konkurentów na podstawie profilu biznesowego"
        },
        {
          "name": "Enrich Competitor",
          "slug": "enrich-competitor", 
          "description": "Wzbogaca dane o konkretnym konkurencie"
        }
      ]
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "name": "Offer Assistant",
      "slug": "offer-assistant",
      "description": "Generuje katalog ofert na podstawie profilu biznesowego",
      "tools": [
        {
          "name": "Generate Offers",
          "slug": "generate-offers",
          "description": "Generuje spersonalizowane oferty produktów i usług"
        }
      ]
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440003",
      "name": "Campaign Generator",
      "slug": "campaign-generator",
      "description": "Tworzy strategie kampanii marketingowych",
      "tools": [
        {
          "name": "Generate Campaign",
          "slug": "generate-campaign",
          "description": "Generuje kompleksową strategię kampanii marketingowej"
        }
      ]
    }
  ]
}
```

### Execute Agent Tool
```http
POST /api/agents/{agent_slug}/tools/{tool_slug}/call
Authorization: Bearer {jwt_token}
```

**Request (Business Analysis):**
```json
{
  "input": {
    "url": "https://example-company.pl"
  },
  "background": true
}
```

**Response (202):**
```json
{
  "status": "pending",
  "data": {
    "openai_response_id": "run_550e8400e29b41d4a716446655440000"
  }
}
```

**Request (Competitor Research):**
```json
{
  "input": {
    "business_profile_id": "550e8400-e29b-41d4-a716-446655440001"
  }
}
```

**Response (202):**
```json
{
  "status": "pending",
  "data": {
    "openai_response_id": "run_550e8400e29b41d4a716446655440021"
  }
}
```

### Check Tool Execution Status
```http
GET /api/agents/{agent_slug}/tools/{tool_slug}/call?job_id={openai_response_id}
Authorization: Bearer {jwt_token}
```

**Response (200) - Processing:**
```json
{
  "status": "in_progress"
}
```

**Response (200) - Completed:**
```json
{
  "status": "completed",
  "data": {
    "business_profile": {
      "name": "Example Company",
      "offer_description": "AI-powered business solutions...",
      "target_customer": "SME businesses...",
      "problem_solved": "Inefficient manual processes...",
      "customer_desires": "Automation and cost reduction...",
      "brand_tone": "Professional, innovative",
      "communication_language": "pl"
    }
  }
}
```

### List Agent Interactions  
```http
GET /api/agents/interactions
Authorization: Bearer {jwt_token}
```

**Response (200):**
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "agent_slug": "business-concierge",
      "tool_slug": "analyze-website",
      "status": "completed",
      "created_at": "2025-01-15T10:30:00Z"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "agent_slug": "competitors-researcher",
      "tool_slug": "find-competitors",
      "status": "in_progress",
      "created_at": "2025-01-15T10:45:00Z"
    }
  ]
}
```

## Error Responses

### Standard Error Format
All error responses follow this format:

```json
{
  "error": "error_code",
  "message": "Human-readable error description",
  "details": "Additional context (optional)",
  "field": "field_name (for validation errors)"
}
```

### HTTP Status Codes

#### 400 Bad Request
```json
{
  "error": "validation_error",
  "message": "Invalid input parameters",
  "details": "Email format is invalid",
  "field": "email"
}
```

#### 401 Unauthorized
```json
{
  "error": "unauthorized",
  "message": "Authentication required"
}
```

```json
{
  "error": "invalid_token", 
  "message": "JWT token is invalid or expired"
}
```

#### 403 Forbidden
```json
{
  "error": "forbidden",
  "message": "Insufficient permissions to access this resource"
}
```

#### 404 Not Found
```json
{
  "error": "not_found",
  "message": "Business profile not found",
  "details": "Profile with ID 550e8400-e29b-41d4-a716-446655440000 does not exist"
}
```

#### 409 Conflict
```json
{
  "error": "conflict",
  "message": "Email address already exists",
  "field": "email"
}
```

#### 422 Unprocessable Entity
```json
{
  "error": "validation_error",
  "message": "Validation failed",
  "details": {
    "campaign_goal": "Must be one of the allowed values",
    "budget": "Must be a positive number"
  }
}
```

#### 429 Too Many Requests
```json
{
  "error": "rate_limit_exceeded",
  "message": "Too many requests. Please try again later.",
  "details": "Limit: 100 requests per minute"
}
```

#### 500 Internal Server Error
```json
{
  "error": "server_error",
  "message": "An unexpected error occurred",
  "details": "Please try again later or contact support"
}
```

#### 503 Service Unavailable
```json
{
  "error": "service_unavailable",
  "message": "OpenAI service temporarily unavailable",
  "details": "AI processing services are currently down"
}
```

## Rate Limiting
- **Standard endpoints**: 100 requests per minute per user
- **AI agent endpoints**: 10 requests per minute per user  
- **Authentication endpoints**: 5 requests per minute per IP

## Pagination
List endpoints support pagination with query parameters:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)
- `sort`: Sort field (default: created_at)
- `order`: Sort order (asc/desc, default: desc)

**Example:**
```http
GET /api/business-profiles?page=2&limit=10&sort=name&order=asc
```

## Background Processing
Long-running operations (AI analysis, competitor research, campaign generation) use OpenAI Assistant API processing:

1. **Initial Request**: Returns `202 Accepted` with OpenAI response ID
2. **Immediate OpenAI Call**: Backend immediately calls OpenAI API and gets response ID
3. **Frontend Polling**: Use OpenAI response ID to check progress
4. **Completion**: Status becomes `completed` with results
5. **Error Handling**: Status becomes `failed` with error details

OpenAI Assistant statuses: `pending` → `queued` → `in_progress` → `completed`/`failed`/`canceled`