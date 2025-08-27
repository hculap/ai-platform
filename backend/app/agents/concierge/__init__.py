"""
Concierge Agent implementation.
AI-powered business profile generator from website analysis.
"""

import time
from datetime import datetime
from typing import Any, Dict, Optional

from ..base import BaseAgent, AgentInput, AgentOutput, AgentMetadata, create_agent_metadata, AgentCapabilities
from .tools.analyzewebsiteTool import AnalyzeWebsiteTool
from ...utils.messages import (
    get_message, AGENT_ACTION_PARAMETER_REQUIRED, AGENT_UNKNOWN_ACTION,
    AGENT_EXECUTION_FAILED, AGENT_UNKNOWN_ERROR
)


class ConciergeAgent(BaseAgent):
    """Concierge Agent for analyzing websites and creating business profiles."""
    
    def __init__(self):
        """Initialize the Concierge Agent."""
        # Initialize tools
        analyze_website_tool = AnalyzeWebsiteTool()

        capabilities = AgentCapabilities(
            tools={
                'analyze-website': analyze_website_tool
            },
            resources={},
            prompts={},
            logging={
                'execution': True,
                'performance': True,
                'errors': True
            }
        )
        
        super().__init__(
            name='Concierge Agent',
            short_description='AI-powered business profile generator from website analysis',
            description='The Concierge Agent analyzes website URLs to create business profiles using OpenAI.',
            version='1.0.0',
            capabilities=capabilities
        )

    async def execute(self, input_data: AgentInput) -> AgentOutput:
        """Execute the Concierge Agent with the given input."""
        start_time = time.time()
        
        try:
            parameters = input_data.parameters
            
            if 'action' not in parameters:
                return AgentOutput(
                    success=False,
                    error=get_message(AGENT_ACTION_PARAMETER_REQUIRED),
                    metadata=create_agent_metadata(self.name, time.time() - start_time)
                )
            
            action = parameters['action']
            
            # Get the appropriate tool
            if action not in self.capabilities.tools:
                available_tools = list(self.capabilities.tools.keys())
                return AgentOutput(
                    success=False,
                    error=get_message(AGENT_UNKNOWN_ACTION),
                    metadata=create_agent_metadata(self.name, time.time() - start_time)
                )
            
            tool = self.capabilities.tools[action]
            
            # Execute the tool
            from ..shared.base_tool import ToolInput
            tool_input = ToolInput(
                parameters=parameters,
                user_id=input_data.user_id,
                context=input_data
            )
            result = await tool.execute(tool_input)
            
            return AgentOutput(
                success=result.success,
                data=result.data,
                error=result.error,
                metadata=create_agent_metadata(self.name, time.time() - start_time)
            )
            
        except Exception as error:
            print(f'Concierge Agent execution error: {error}')
            return AgentOutput(
                success=False,
                error=get_message(AGENT_EXECUTION_FAILED),
                metadata=create_agent_metadata(self.name, time.time() - start_time)
            )