"""
Example agent demonstrating system_message approach (alternative to prompt_id).
"""

from .base import BaseAgent, AgentCapabilities, AgentInput, AgentOutput, AgentMetadata
from .shared.base_tool import BaseTool, ToolInput, ToolOutput
from ..utils.messages import get_message, ERROR_SERVER_ERROR


class ExampleTool(BaseTool):
    """Example tool using system_message approach."""

    def __init__(self):
        super().__init__(
            name='Example Analysis Tool',
            slug='example-analysis',
            description='Example tool demonstrating system_message approach',
            version='1.0.0',
            system_message='You are a helpful assistant that analyzes business data and provides insights.',
            openai_model='gpt-4o-mini'  # Tool-specific model
        )

    async def execute(self, input_data: ToolInput) -> ToolOutput:
        """Execute example analysis."""
        start_time = self.get_start_time()

        try:
            parameters = input_data.parameters

            if 'text' not in parameters:
                return ToolOutput(
                    success=False,
                    error=get_message('TOOL_TEXT_PARAMETER_REQUIRED'),
                    metadata=self.create_metadata(self.get_execution_time(start_time))
                )

            text = parameters['text']

            # Call OpenAI using system_message approach
            openai_result = self.call_openai(f"Please analyze the following text: {text}")

            if not openai_result['success']:
                return ToolOutput(
                    success=False,
                    error=f"OpenAI API error: {openai_result['error']}",
                    metadata=self.create_metadata(self.get_execution_time(start_time))
                )

            return ToolOutput(
                success=True,
                data={
                    'analysis': openai_result['content'],
                    'input_text': text,
                    'model_used': openai_result.get('model', self.openai_model),
                    'usage': openai_result.get('usage')
                },
                metadata=self.create_metadata(self.get_execution_time(start_time))
            )

        except Exception as error:
            print(f'ExampleTool execution error: {error}')
            return ToolOutput(
                success=False,
                error=get_message(ERROR_SERVER_ERROR),
                metadata=self.create_metadata(self.get_execution_time(start_time))
            )


class ExampleAgent(BaseAgent):
    """Example agent demonstrating system_message approach."""

    def __init__(self):
        capabilities = AgentCapabilities(
            tools={
                'example-analysis': ExampleTool()
            }
        )

        super().__init__(
            name='Example Agent',
            slug='example-agent',
            short_description='Example agent using system_message approach',
            description='This is an example agent that demonstrates using system_message instead of prompt_id.',
            version='1.0.0',
            capabilities=capabilities,
            is_public=False
        )

    async def execute(self, input_data: AgentInput) -> AgentOutput:
        """Execute the example agent."""
        start_time = self.get_start_time()

        try:
            action = input_data.parameters.get('action')

            if action in self.capabilities.tools:
                tool = self.capabilities.tools[action]
                tool_input = ToolInput(
                    parameters=input_data.parameters,
                    user_id=input_data.user_id,
                    context=input_data.context
                )

                result = await tool.execute(tool_input)

                return AgentOutput(
                    success=result.success,
                    data=result.data,
                    error=result.error,
                    metadata=AgentMetadata(
                        agent_name=self.name,
                        execution_time=self.get_execution_time(start_time),
                        timestamp=self.get_timestamp()
                    )
                )
            else:
                return AgentOutput(
                    success=False,
                    error=get_message('AGENT_INVALID_ACTION'),
                    metadata=AgentMetadata(
                        agent_name=self.name,
                        execution_time=self.get_execution_time(start_time),
                        timestamp=self.get_timestamp()
                    )
                )

        except Exception as error:
            print(f'ExampleAgent execution error: {error}')
            return AgentOutput(
                success=False,
                error=get_message(ERROR_SERVER_ERROR),
                metadata=AgentMetadata(
                    agent_name=self.name,
                    execution_time=self.get_execution_time(start_time),
                    timestamp=self.get_timestamp()
                )
            )
