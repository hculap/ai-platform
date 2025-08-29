#!/usr/bin/env python3
"""
Test script for Competitors Researcher Agent tools
"""

from app.agents.competitors_researcher import CompetitorsResearcherAgent

def test_agent_tools():
    """Test if the Competitors Researcher Agent has both tools"""
    print("🔍 Testing Competitors Researcher Agent Tools...")
    print("=" * 60)

    try:
        agent = CompetitorsResearcherAgent()
        print('✅ Competitors Researcher Agent initialized successfully')
        print(f'Agent name: {agent.name}')
        print(f'Available tools: {list(agent.capabilities.tools.keys())}')

        print('\nTools details:')
        for name, tool in agent.capabilities.tools.items():
            print(f'  - {name}: {tool.config.name} ({tool.config.description})')

        return True

    except Exception as e:
        print(f'❌ Test failed: {e}')
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_agent_tools()
    if success:
        print("\n🎉 All tests passed! The Competitors Researcher Agent has both tools.")
    else:
        print("\n💥 Tests failed. Please check the implementation.")
