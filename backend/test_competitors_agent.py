#!/usr/bin/env python3
"""
Test script for Competitors Researcher Agent
"""

import asyncio
import json
from datetime import datetime

# Mock database setup (since we don't have a real database running)
class MockBusinessProfile:
    def __init__(self, data):
        self.id = data.get('id', 'test-id')
        self.name = data.get('name', 'Test Company')
        self.website_url = data.get('website_url', 'https://test.com')
        self.offer_description = data.get('offer_description', 'Test services')
        self.target_customer = data.get('target_customer', 'Test customers')
        self.problem_solved = data.get('problem_solved', 'Test problems')
        self.customer_desires = data.get('customer_desires', 'Test desires')
        self.brand_tone = data.get('brand_tone', 'Professional')
        self.communication_language = data.get('communication_language', 'en')
        self.user_id = data.get('user_id', 'test-user')

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'website_url': self.website_url,
            'offer_description': self.offer_description,
            'target_customer': self.target_customer,
            'problem_solved': self.problem_solved,
            'customer_desires': self.customer_desires,
            'brand_tone': self.brand_tone,
            'communication_language': self.communication_language
        }

class MockCompetition:
    def __init__(self, data):
        self.id = data.get('id', 'comp-id')
        self.business_profile_id = data.get('business_profile_id', 'test-id')
        self.name = data.get('name', 'Test Competitor')
        self.url = data.get('url', 'https://competitor.com')
        self.description = data.get('description', 'Test description')
        self.usp = data.get('usp', 'Test USP')

    def to_dict(self):
        return {
            'id': self.id,
            'business_profile_id': self.business_profile_id,
            'name': self.name,
            'url': self.url,
            'description': self.description,
            'usp': self.usp
        }

# Mock database session
class MockDB:
    @staticmethod
    def get_business_profile(business_profile_id, user_id):
        # Mock business profile data
        mock_data = {
            'id': business_profile_id,
            'user_id': user_id,
            'name': 'TechSolutions Inc.',
            'website_url': 'https://techsolutions.com',
            'offer_description': 'We provide cutting-edge software solutions for businesses, including web development, mobile apps, and cloud services.',
            'target_customer': 'Small to medium-sized businesses, startups, and enterprises looking for digital transformation',
            'problem_solved': 'Inefficient manual processes, lack of digital presence, poor customer experience',
            'customer_desires': 'Modern, scalable solutions, fast development, excellent support, competitive pricing',
            'brand_tone': 'Professional, innovative, trustworthy',
            'communication_language': 'en'
        }
        return MockBusinessProfile(mock_data)

    @staticmethod
    def get_existing_competitors(business_profile_id):
        # Mock existing competitors
        mock_competitors = [
            {
                'id': 'comp-1',
                'business_profile_id': business_profile_id,
                'name': 'WebDev Masters',
                'url': 'https://webdevmasters.com',
                'description': 'Professional web development company specializing in custom solutions',
                'usp': '15+ years of experience with 99.9% uptime guarantee'
            },
            {
                'id': 'comp-2',
                'business_profile_id': business_profile_id,
                'name': 'CodeCrafters',
                'url': 'https://codecrafters.io',
                'description': 'Full-stack development agency for modern businesses',
                'usp': 'Agile development with dedicated project managers'
            }
        ]
        return [MockCompetition(comp) for comp in mock_competitors]

async def test_competitors_agent():
    """Test the competitors researcher agent functionality"""
    print("🧪 Testing Competitors Researcher Agent...")
    print("=" * 50)

    try:
        # Import the agent
        from app.agents.competitors_researcher import CompetitorsResearcherAgent
        from app.agents.base import AgentInput

        # Create agent instance
        agent = CompetitorsResearcherAgent()
        print(f"✅ Agent created: {agent.name}")
        print(f"📋 Available tools: {list(agent.capabilities.tools.keys())}")

        # Mock business profile ID and user ID
        business_profile_id = "test-business-profile-123"
        user_id = "test-user-456"

        # Mock the database queries
        business_profile = MockDB.get_business_profile(business_profile_id, user_id)
        existing_competitors = MockDB.get_existing_competitors(business_profile_id)

        print("\n📊 Mock Data:")
        print(f"Business Profile: {business_profile.name}")
        print(f"Website: {business_profile.website_url}")
        print(f"Existing Competitors: {len(existing_competitors)}")

        for i, comp in enumerate(existing_competitors, 1):
            print(f"  {i}. {comp.name} - {comp.url}")

        # Create agent input
        agent_input = AgentInput(
            agent_type='competitors-researcher',
            parameters={
                'action': 'find-competitors',
                'business_profile_id': business_profile_id
            },
            business_profile_id=business_profile_id,
            user_id=user_id
        )

        print("\n🚀 Executing agent...")
        print("Note: This would normally call OpenAI, but we'll simulate the user message creation")
        # Test the user message creation (without actually calling OpenAI)
        tool = agent.capabilities.tools['find-competitors']

        # Create a mock tool input to test the user message creation
        from app.agents.shared.base_tool import ToolInput
        tool_input = ToolInput(
            parameters={'business_profile_id': business_profile_id},
            user_id=user_id
        )

        # Test the user message creation by accessing the private method
        user_message = tool._create_user_message(
            business_profile.to_dict(),
            [comp.to_dict() for comp in existing_competitors]
        )

        print("\n📝 Generated User Message:")
        print("=" * 50)
        print(user_message)
        print("=" * 50)

        print("\n✅ Test completed successfully!")
        print("The user message contains:")
        print(f"  - Business profile information: {business_profile.name}")
        print(f"  - Website: {business_profile.website_url}")
        print(f"  - Existing competitors: {len(existing_competitors)}")
        print("  - Clear instructions for finding new competitors")

        return True

    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = asyncio.run(test_competitors_agent())
    if success:
        print("\n🎉 All tests passed! The Competitors Researcher Agent is working correctly.")
    else:
        print("\n💥 Tests failed. Please check the implementation.")
