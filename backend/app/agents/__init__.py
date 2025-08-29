"""
Agent initialization module.
Registers all available agents and provides exports for the agent system.
"""

from .base import AgentRegistry, BaseAgent, AgentInput, AgentOutput, AgentMetadata
from .concierge import ConciergeAgent
from .competitors_researcher import CompetitorsResearcherAgent


def initialize_agents() -> None:
    """Initialize and register all available agents."""
    # Clear any existing registrations
    AgentRegistry.clear()

    # Register Business Concierge Agent (uses prompt_id approach)
    AgentRegistry.register('business-concierge', ConciergeAgent())

    # Register Competitors Researcher Agent (uses system message approach)
    AgentRegistry.register('competitors-researcher', CompetitorsResearcherAgent())

    print('✅ Agent system initialized')
    agent_types = [agent_type for agent_type, _ in AgentRegistry.list_agents()]
    print(f'📋 Available agents: {agent_types}')


# Re-export agent registry for use in routes
__all__ = [
    # Core classes and types
    'AgentRegistry',
    'BaseAgent',
    'AgentInput',
    'AgentOutput',
    'AgentMetadata',

    # Individual agents
    'ConciergeAgent',
    'CompetitorsResearcherAgent',
    'ExampleAgent',

    # Initialization function
    'initialize_agents'
]