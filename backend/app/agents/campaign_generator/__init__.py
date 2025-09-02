"""
Campaign Generator Agent implementation.
AI-powered marketing campaign strategy generation.
"""

from ..shared.agent_factory import create_and_register_single_tool_agent
from .tools.generateCampaignTool import GenerateCampaignTool

# Create and register the agent using factory pattern with single tool
CampaignGeneratorAgent = create_and_register_single_tool_agent(
    name='Campaign Generator Agent',
    slug='campaign-generator',
    short_description='AI-powered marketing campaign strategy generation',
    description='The Campaign Generator Agent analyzes business profiles, competitive landscapes, and campaign parameters to generate comprehensive marketing campaign strategies with channel recommendations, timelines, and actionable insights.',
    tool=GenerateCampaignTool(),
    version='1.0.0',
    is_public=True
)