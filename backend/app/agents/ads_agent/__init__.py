"""
Ads Agent implementation.
AI-powered advertisement creative generation with two-step workflow.
"""

from ..shared.agent_factory import create_and_register_standard_agent
from .tools.generateHeadlinesTool import GenerateHeadlinesTool
from .tools.generateFullCreativeTool import GenerateFullCreativeTool

# Create and register the agent using factory pattern with multiple tools
AdsAgent = create_and_register_standard_agent(
    name='Ads Agent',
    slug='ads-agent',
    short_description='AI-powered advertisement creative generation',
    description='The Ads Agent creates ready, simple ad creatives through a two-step process: first generating headlines, then creating full creative content for selected headlines.',
    tools={
        'generate-headlines': GenerateHeadlinesTool(),
        'generate-full-creative': GenerateFullCreativeTool()
    },
    version='1.0.0',
    is_public=True
)