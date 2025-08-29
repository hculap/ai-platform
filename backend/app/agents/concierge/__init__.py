"""
Concierge Agent implementation.
AI-powered business profile generator from website analysis.
"""

from ..shared.agent_factory import create_and_register_single_tool_agent
from .tools.analyzewebsiteTool import AnalyzeWebsiteTool

# Create and register the agent using factory pattern
ConciergeAgent = create_and_register_single_tool_agent(
    name='Concierge Agent',
    slug='business-concierge', 
    short_description='AI-powered business profile generator from website analysis',
    description='The Concierge Agent analyzes website URLs to create business profiles using OpenAI.',
    tool=AnalyzeWebsiteTool(),
    version='1.0.0',
    is_public=True
)