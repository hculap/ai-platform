"""
Writer Agent implementation.
AI-powered writing assistance including style analysis and content generation.
"""

from ..shared.agent_factory import create_and_register_standard_agent
from .tools.style_analyzer_tool import StyleAnalyzerTool
from .tools.generateScriptHooksTool import GenerateScriptHooksTool

# Create and register the agent using factory pattern
WriterAgent = create_and_register_standard_agent(
    name='Writer Agent',
    slug='writer-agent',
    short_description='AI-powered writing assistant with style analysis and script hooks',
    description='The Writer Agent provides AI-powered writing assistance including style analysis of writing samples to create personalized writing guides, and script hook generation for content marketing.',
    tools={
        'analyze-style': StyleAnalyzerTool(),
        'generate-script-hooks': GenerateScriptHooksTool()
    },
    version='1.0.0',
    is_public=True
)