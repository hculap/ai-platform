"""
Competitors Researcher Agent implementation.
AI-powered competitor research and analysis.
"""

import time
from datetime import datetime
from typing import Any, Dict, Optional

from ..base import BaseAgent, AgentInput, AgentOutput, AgentMetadata, create_agent_metadata, AgentCapabilities
from .tools.findCompetitorsTool import FindCompetitorsTool
from ...utils.messages import (
    get_message, AGENT_ACTION_PARAMETER_REQUIRED, AGENT_UNKNOWN_ACTION,
    AGENT_EXECUTION_FAILED, AGENT_UNKNOWN_ERROR
)


class CompetitorsResearcherAgent(BaseAgent):
    """Competitors Researcher Agent for finding and analyzing competitors."""

    def __init__(self):
        """Initialize the Competitors Researcher Agent."""
        # Initialize tools
        find_competitors_tool = FindCompetitorsTool()

        capabilities = AgentCapabilities(
            tools={
                'find-competitors': find_competitors_tool
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
            name='Competitors Researcher Agent',
            slug='competitors-researcher',
            short_description='AI-powered competitor research and analysis',
            description='The Competitors Researcher Agent analyzes business profiles and existing competitors to find new competitors using advanced AI algorithms.',
            version='1.0.0',
            capabilities=capabilities,
            is_public=True
        )

    async def execute(self, input_data: AgentInput) -> AgentOutput:
        """Execute the Competitors Researcher Agent with the given input."""
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

            # Execute the tool
            result = await tool.execute(tool_input)

            return AgentOutput(
                success=result.success,
                data=result.data,
                error=result.error,
                metadata=create_agent_metadata(self.name, time.time() - start_time)
            )

        except Exception as error:
            print(f'Competitors Researcher Agent execution error: {error}')
            return AgentOutput(
                success=False,
                error=get_message(AGENT_EXECUTION_FAILED),
                metadata=create_agent_metadata(self.name, time.time() - start_time)
            )
