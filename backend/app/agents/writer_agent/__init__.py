"""
Writer Agent implementation.
AI-powered writing assistance including style analysis and content generation.
"""

from ..shared.agent_factory import create_and_register_standard_agent
from .tools.style_analyzer_tool import StyleAnalyzerTool
from .tools.generateScriptHooksTool import GenerateScriptHooksTool
from .tools.generateScriptTool import GenerateScriptTool

# Create and register the agent using factory pattern
WriterAgent = create_and_register_standard_agent(
    name='Writer Agent',
    slug='writer-agent',
    short_description='AI-powered writing assistant with style analysis, script hooks, and full script generation',
    description='The Writer Agent provides AI-powered writing assistance including style analysis of writing samples to create personalized writing guides, script hook generation for content marketing, and complete script generation from hooks.',
    tools={
        'analyze-style': StyleAnalyzerTool(),
        'generate-script-hooks': GenerateScriptHooksTool(),
        'generate-script': GenerateScriptTool()
    },
    version='1.1.0',
    is_public=True
)