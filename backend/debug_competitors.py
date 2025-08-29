#!/usr/bin/env python3
"""
Debug script for Competitors Researcher Agent
"""

import asyncio
import json
import os
from datetime import datetime

async def debug_competitors_agent():
    """Debug the competitors researcher agent functionality"""
    print("🔍 Debugging Competitors Researcher Agent...")
    print("=" * 60)

    try:
        # Set up Flask app context
        from app import create_app
        app = create_app()

        with app.app_context():
            # Import the agent
            from app.agents.competitors_researcher import CompetitorsResearcherAgent
            from app.agents.base import AgentInput
            from app.models.business_profile import BusinessProfile
            from app.models.competition import Competition
            from app.models.user import User

            # Create agent instance
            agent = CompetitorsResearcherAgent()
            print(f"✅ Agent created: {agent.name}")

            # Get the test user and business profile
            test_user = User.query.filter_by(email='test@example.com').first()
            if not test_user:
                print("❌ Test user not found")
                return

            business_profile = BusinessProfile.query.filter_by(
                name='Test Business',
                user_id=test_user.id
            ).first()

            if not business_profile:
                print("❌ Business profile not found")
                return

            print(f"📊 Found Business Profile: {business_profile.name}")
            print(f"   ID: {business_profile.id}")
            print(f"   User ID: {business_profile.user_id}")

            # Get existing competitors
            existing_competitors = Competition.query.filter_by(
                business_profile_id=business_profile.id
            ).all()

            print(f"📋 Existing Competitors: {len(existing_competitors)}")
            for comp in existing_competitors:
                print(f"   - {comp.name}: {comp.url}")

            # Create agent input
            agent_input = AgentInput(
                agent_type='competitors-researcher',
                parameters={
                    'action': 'find-competitors',
                    'business_profile_id': business_profile.id
                },
                business_profile_id=business_profile.id,
                user_id=test_user.id
            )

            print("\n🚀 Executing agent...")
            try:
                result = await agent.execute(agent_input)
                print(f"📋 Agent Result: {result.success}")
                if result.data:
                    print(f"📄 Data: {result.data}")
                if result.error:
                    print(f"❌ Error: {result.error}")
            except Exception as e:
                print(f"💥 Execution Error: {e}")
                import traceback
                traceback.print_exc()

    except Exception as e:
        print(f"❌ Debug failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(debug_competitors_agent())
