"""
Competitors Researcher Agent implementation.
AI-powered competitor research and analysis.
"""

from ..shared.agent_factory import create_and_register_standard_agent
from .tools.findCompetitorsTool import FindCompetitorsTool
from .tools.enrichCompetitorTool import EnrichCompetitorTool

# Create and register the agent using factory pattern with multiple tools
CompetitorsResearcherAgent = create_and_register_standard_agent(
    name='Competitors Researcher Agent',
    slug='competitors-researcher',
    short_description='AI-powered competitor research and analysis',
    description='The Competitors Researcher Agent analyzes business profiles, finds new competitors, and enriches competitor data using advanced AI algorithms.',
    tools={
        'find-competitors': FindCompetitorsTool(),
        'enrich-competitor': EnrichCompetitorTool()
    },
    version='1.0.0',
    is_public=True
)