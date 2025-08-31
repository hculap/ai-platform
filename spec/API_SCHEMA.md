Simplified RESTful API Specification
Authentication
Authorization: Bearer {jwt_token}
Content-Type: application/json
Core Endpoints
User Management
GET /me
json{
  "id": "uuid",
  "email": "user@example.com"
}
Business Profiles
GET /business-profiles
json{
  "data": [
    {
      "id": "uuid",
      "name": "Moja Firma",
      "website_url": "https://mojafirma.pl",
      "is_active": true
    }
  ]
}
POST /business-profiles
jsonRequest:
{
  "website_url": "https://example.com"
}

Response:
{
  "id": "uuid",
  "analysis_status": "processing"
}
GET /business-profiles/:id
json{
  "id": "uuid",
  "name": "Sklep XYZ",
  "website_url": "https://sklep.pl",
  "offer_description": "Sprzedaż elektroniki...",
  "target_customer": "Mężczyźni 25-45 lat...",
  "problem_solved": "Trudność w znalezieniu gadżetów...",
  "customer_desires": "Najnowsza technologia...",
  "brand_tone": "Nowoczesny, ekspercki",
  "communication_language": "pl",
  "analysis_status": "completed"
}
PUT /business-profiles/:id
jsonRequest:
{
  "name": "Nowa nazwa",
  "offer_description": "Nowy opis..."
}

Response:
{
  "id": "uuid",
  "updated_at": "2025-01-15T10:30:00Z"
}
Offers
GET /business-profiles/:id/offers
json{
  "data": [
    {
      "id": "uuid",
      "type": "product",
      "name": "Konsultacje IT",
      "description": "Profesjonalne doradztwo technologiczne",
      "unit": "per_hour",
      "price": 250.00,
      "status": "published"
    }
  ]
}
POST /business-profiles/:id/offers
jsonRequest:
{
  "type": "service",
  "name": "Audit bezpieczeństwa",
  "description": "Kompleksowy audyt bezpieczeństwa IT",
  "unit": "per_project",
  "price": 5000.00,
  "status": "draft"
}

Response:
{
  "id": "uuid",
  "message": "Offer created successfully"
}
POST /business-profiles/:id/generate-offers
jsonRequest: {} (no body required)

Response:
{
  "message": "Offers generated successfully",
  "data": {
    "offers_count": 5,
    "offers": [
      {
        "id": "uuid",
        "type": "service",
        "name": "Konsultacje strategiczne IT",
        "description": "Doradztwo w zakresie strategii technologicznej",
        "unit": "per_hour",
        "price": 300.00,
        "status": "draft"
      }
    ]
  }
}
PUT /offers/:id
jsonRequest:
{
  "name": "Updated offer name",
  "price": 350.00,
  "status": "published"
}

Response:
{
  "id": "uuid",
  "updated_at": "2025-01-15T10:30:00Z",
  "message": "Offer updated successfully"
}
DELETE /offers/:id
jsonResponse:
{
  "id": "uuid",
  "message": "Offer deleted successfully"
}
Agents
GET /api/agents
json{
  "data": [
    {
      "id": "uuid",
      "name": "Agent Research",
      "slug": "research",
      "description": "Analiza konkurencji i rynku",
      "tools": [
        {
          "name": "Analiza Konkurencji",
          "slug": "competitor-analysis"
        }
      ]
    }
  ]
}
GET /api/agents/:slug
json{
  "id": "uuid",
  "name": "Agent Research",
  "slug": "research",
  "description": "Specjalista od analizy konkurencji",
  "tools": [
    {
      "name": "Analiza Konkurencji", 
      "slug": "competitor-analysis",
      "description": "Szczegółowa analiza konkurencji"
    }
  ]
}
Agent Interactions
POST /api/agents/:slug/tools/:tool_slug/call
jsonRequest:
{
  "business_profile_id": "uuid",
  "input": {
    "industry": "e-commerce",
    "competitors": ["allegro.pl", "amazon.pl"]
  }
}

Response:
{
  "interaction_id": "uuid",
  "status": "processing"
}
GET /api/interactions/:interaction_id
json{
  "id": "uuid",
  "status": "completed",
  "output": {
    "summary": "Analiza konkurencji wykazała...",
    "recommendations": [...]
  }
}
GET /api/interactions
json{
  "data": [
    {
      "id": "uuid",
      "agent_name": "Agent Research",
      "tool_name": "Analiza Konkurencji",
      "status": "completed",
      "created_at": "2025-01-15T10:30:00Z"
    }
  ]
}
Error Responses
json400 Bad Request:
{
  "error": "validation_error",
  "message": "Invalid input parameters"
}

401 Unauthorized:
{
  "error": "unauthorized",
  "message": "Invalid token"
}

404 Not Found:
{
  "error": "not_found",
  "message": "Resource not found"
}

500 Internal Server Error:
{
  "error": "server_error",
  "message": "Something went wrong"
}
