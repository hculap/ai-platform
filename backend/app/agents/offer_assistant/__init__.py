"""
Offer Assistant Agent implementation.
AI-powered offer catalog generation and management.
"""

from ..shared.agent_factory import create_and_register_single_tool_agent
from .tools.generateOffersTool import GenerateOffersTool

# Create and register the agent using factory pattern with single tool
OfferAssistantAgent = create_and_register_single_tool_agent(
    name='Offer Assistant Agent',
    slug='offer-assistant',
    short_description='AI-powered offer catalog generation',
    description='The Offer Assistant Agent analyzes business profiles and competitive landscapes to generate comprehensive, market-aligned offer catalogs with pricing recommendations.',
    tool=GenerateOffersTool(),
    version='1.0.0',
    is_public=True
)