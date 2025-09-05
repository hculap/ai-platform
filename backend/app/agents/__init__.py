"""
Agent initialization module.
Registers all available agents and provides exports for the agent system.
"""

from .base import AgentRegistry, BaseAgent, AgentInput, AgentOutput, AgentMetadata
from .concierge import ConciergeAgent
from .competitors_researcher import CompetitorsResearcherAgent
from .offer_assistant import OfferAssistantAgent
from .campaign_generator import CampaignGeneratorAgent
from .ads_agent import AdsAgent
from .writer_agent import WriterAgent


def initialize_agents() -> None:
    """Initialize and register all available agents."""
    # Clear any existing registrations
    AgentRegistry.clear()

    # Register Business Concierge Agent (uses prompt_id approach)
    AgentRegistry.register('business-concierge', ConciergeAgent)

    # Register Competitors Researcher Agent (uses system message approach)
    AgentRegistry.register('competitors-researcher', CompetitorsResearcherAgent)

    # Register Offer Assistant Agent (uses system message approach)
    AgentRegistry.register('offer-assistant', OfferAssistantAgent)

    # Register Campaign Generator Agent (uses prompt_id approach)
    AgentRegistry.register('campaign-generator', CampaignGeneratorAgent)

    # Register Ads Agent (uses prompt_id approach)
    AgentRegistry.register('ads-agent', AdsAgent)

    # Register Writer Agent (uses system message approach)
    AgentRegistry.register('writer-agent', WriterAgent)

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
    'OfferAssistantAgent',
    'CampaignGeneratorAgent',
    'AdsAgent',
    'WriterAgent',

    # Initialization function
    'initialize_agents'
]