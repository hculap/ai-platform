"""
Competitors Researcher Agent implementation.
AI-powered competitor research and analysis.
"""

from ..shared.agent_factory import create_and_register_single_tool_agent
from .tools.findCompetitorsTool import FindCompetitorsTool

# Create and register the agent using factory pattern
CompetitorsResearcherAgent = create_and_register_single_tool_agent(
    name='Competitors Researcher Agent',
    slug='competitors-researcher',
    short_description='AI-powered competitor research and analysis',
    description='The Competitors Researcher Agent analyzes business profiles and existing competitors to find new competitors using advanced AI algorithms.',
    tool=FindCompetitorsTool(),
    version='1.0.0',
    is_public=True
)