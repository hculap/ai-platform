"""
Tool factory for standardized tool creation and common patterns.
Simplifies tool development by providing base classes and factory functions.
"""

import time
import logging
from typing import Dict, Any, Optional, Union, Type
from abc import ABC, abstractmethod

from .base_tool import (
    BaseTool, ToolInput, ToolOutput, ToolConfig, 
    OpenAIConfig, OpenAIMode, ToolCategory
)
from .parsers import BaseContentParser, create_parser
from .validators import ParametersValidator, ValidationResult

logger = logging.getLogger(__name__)


class OpenAITool(BaseTool):
    """
    Base class for tools that use OpenAI integration.
    Provides common patterns for OpenAI-powered tools.
    """
    
    def __init__(
        self,
        name: str,
        slug: str,
        description: str,
        version: str = "1.0.0",
        parser: Optional[BaseContentParser] = None,
        validator: Optional[ParametersValidator] = None,
        openai_config: Optional[OpenAIConfig] = None,
        category: ToolCategory = ToolCategory.ANALYSIS
    ):
        """
        Initialize OpenAI tool with common configurations.
        
        Args:
            name: Tool display name
            slug: Tool slug identifier
            description: Tool description
            version: Tool version
            parser: Content parser for OpenAI responses
            validator: Input parameters validator
            openai_config: OpenAI configuration
            category: Tool category
        """
        tool_config = ToolConfig(
            name=name,
            slug=slug,
            description=description,
            version=version,
            category=category
        )
        
        super().__init__(
            config=tool_config,
            openai_config=openai_config
        )
        
        self.parser = parser or create_parser('generic')
        self.validator = validator
    
    def execute(self, input_data: ToolInput, background: bool = False) -> ToolOutput:
        """
        Execute OpenAI tool with standardized patterns.
        
        Args:
            input_data: Tool input containing parameters and user info
            background: Whether to run in background mode
            
        Returns:
            ToolOutput: Execution results or error
        """
        start_time = time.time()
        
        try:
            # Validate input parameters if validator is provided
            if self.validator:
                validation_result = self.validator.validate(input_data.parameters)
                if not validation_result.is_valid:
                    return self._create_error_output(
                        validation_result.get_error_message(),
                        start_time
                    )
                # Use validated data
                validated_params = validation_result.validated_data
            else:
                # Use custom validation
                validation_result = self._validate_input(input_data.parameters)
                if not validation_result['valid']:
                    return self._create_error_output(
                        validation_result['error'],
                        start_time
                    )
                validated_params = validation_result
            
            # Call OpenAI API
            user_message = self._prepare_openai_message(validated_params, input_data)
            openai_result = self.call_openai(user_message, background=background)
            
            if not openai_result.get('success'):
                return self._create_error_output(
                    f"OpenAI API error: {openai_result.get('error', 'Unknown error')}",
                    start_time
                )
            
            # Handle background mode
            if background:
                return ToolOutput(
                    success=True,
                    data={
                        'openai_response_id': openai_result.get('response_id'),
                        'status': 'pending',
                        'message': 'Processing started in background. Use openai_response_id to check status.'
                    },
                    metadata=self.create_metadata(time.time() - start_time)
                )
            
            # Process and return results for synchronous mode
            response_data = self._process_openai_result(
                openai_result.get('content'),
                validated_params,
                openai_result,
                input_data.user_id
            )
            
            return ToolOutput(
                success=True,
                data=response_data,
                metadata=self.create_metadata(time.time() - start_time)
            )
            
        except Exception as error:
            logger.exception(f"{self.name} execution error: {error}")
            return self._create_error_output(
                f"Tool execution failed: {str(error)}",
                start_time
            )
    
    def get_status(self, job_id: str, user_id: Optional[str] = None) -> ToolOutput:
        """
        Get the status of a background job with custom parsing.
        
        Args:
            job_id: The job ID (typically OpenAI response ID) to check status for
            user_id: Optional user ID for authorization
            
        Returns:
            ToolOutput with status information and results if completed
        """
        try:
            # Import here to avoid circular imports
            from ...services.openai_client import OpenAIClientFactory
            
            openai_client = OpenAIClientFactory.get_client()
            openai_response = openai_client.get_response_status(job_id)

            if not openai_response.success:
                logger.error(f"Failed to check OpenAI status: {openai_response.error}")
                return ToolOutput.error_response(f"Failed to check status: {openai_response.error}")
            
            status = getattr(openai_response, 'status', 'unknown')
            
            if status == 'completed':
                content = getattr(openai_response, 'content', None)
                
                if content:
                    try:
                        parsed_content = self._parse_status_content(content)
                        return ToolOutput.success_response({
                            'status': 'completed',
                            **parsed_content
                        })
                    except Exception as e:
                        return ToolOutput.success_response({
                            'status': 'error',
                            'message': f'Failed to parse result: {str(e)}'
                        })
                else:
                    return ToolOutput.success_response({
                        'status': 'error',
                        'message': 'Processing completed but no content was generated.'
                    })
            elif status in ['failed', 'canceled']:
                error_msg = getattr(openai_response, 'error', None) or f"Processing {status}"
                return ToolOutput.error_response(error_msg)
            elif status in ['pending', 'queued', 'in_progress']:
                return ToolOutput.success_response({'status': status})
            else:
                return ToolOutput.success_response({
                    'status': status,
                    'message': f'Unknown status: {status}'
                })
            
        except Exception as e:
            logger.exception(f"Status check failed for job {job_id}: {e}")
            return ToolOutput.success_response({
                'status': 'error',
                'message': f'Status check failed: {str(e)}',
                'job_id': job_id
            })
    
    # Abstract/Override methods for subclasses
    def _validate_input(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """
        Custom input validation for tools that don't use ParametersValidator.
        Override this method for custom validation logic.
        
        Args:
            parameters: Input parameters dictionary
            
        Returns:
            Validation result with 'valid' flag and either data or 'error'
        """
        return {'valid': True, **parameters}
    
    def _prepare_openai_message(
        self, 
        validated_params: Dict[str, Any], 
        input_data: ToolInput
    ) -> str:
        """
        Prepare the message to send to OpenAI.
        Override this method to customize the OpenAI prompt.
        
        Args:
            validated_params: Validated input parameters
            input_data: Full tool input data
            
        Returns:
            Message string for OpenAI
        """
        return f"Process the following data: {validated_params}"
    
    def _process_openai_result(
        self,
        content: Any,
        validated_params: Dict[str, Any],
        openai_result: Dict[str, Any],
        user_id: Optional[str]
    ) -> Dict[str, Any]:
        """
        Process OpenAI result into the final response.
        Override this method to customize result processing.
        
        Args:
            content: Content from OpenAI response
            validated_params: Validated input parameters
            openai_result: Full OpenAI response
            user_id: User ID for context
            
        Returns:
            Processed response data
        """
        try:
            parsed_data = self.parser.parse(content)
            return parsed_data
        except Exception as parse_error:
            logger.warning(f"Failed to parse OpenAI result: {parse_error}")
            return {
                'content': str(content),
                'error': f"Failed to parse result: {str(parse_error)}"
            }
    
    def _parse_status_content(self, content: Any) -> Dict[str, Any]:
        """
        Parse content from status checking.
        Override this method to customize status content parsing.
        
        Args:
            content: Content from completed OpenAI response
            
        Returns:
            Parsed status content
        """
        return self.parser.parse(content)
    
    def _create_error_output(self, error_message: str, start_time: float) -> ToolOutput:
        """Create an error ToolOutput."""
        return ToolOutput(
            success=False,
            error=error_message,
            metadata=self.create_metadata(time.time() - start_time)
        )


class PromptBasedTool(OpenAITool):
    """
    Specialized OpenAI tool that uses prompt_id for OpenAI integration.
    Most tools should inherit from this class.
    """
    
    def __init__(
        self,
        name: str,
        slug: str,
        description: str,
        prompt_id: str,
        version: str = "1.0.0",
        parser: Optional[BaseContentParser] = None,
        validator: Optional[ParametersValidator] = None,
        category: ToolCategory = ToolCategory.ANALYSIS
    ):
        """
        Initialize prompt-based tool.
        
        Args:
            name: Tool display name
            slug: Tool slug identifier
            description: Tool description
            prompt_id: OpenAI prompt ID
            version: Tool version
            parser: Content parser for OpenAI responses
            validator: Input parameters validator
            category: Tool category
        """
        openai_config = OpenAIConfig(
            mode=OpenAIMode.PROMPT_ID,
            prompt_id=prompt_id
        )
        
        super().__init__(
            name=name,
            slug=slug,
            description=description,
            version=version,
            parser=parser,
            validator=validator,
            openai_config=openai_config,
            category=category
        )


class SystemMessageTool(OpenAITool):
    """
    Specialized OpenAI tool that uses system messages for OpenAI integration.
    Use this for tools that need custom system messages.
    """
    
    def __init__(
        self,
        name: str,
        slug: str,
        description: str,
        system_message: str,
        version: str = "1.0.0",
        model: str = "gpt-4o",
        parser: Optional[BaseContentParser] = None,
        validator: Optional[ParametersValidator] = None,
        category: ToolCategory = ToolCategory.ANALYSIS
    ):
        """
        Initialize system message-based tool.
        
        Args:
            name: Tool display name
            slug: Tool slug identifier
            description: Tool description
            system_message: System message for OpenAI
            version: Tool version
            model: OpenAI model to use
            parser: Content parser for OpenAI responses
            validator: Input parameters validator
            category: Tool category
        """
        openai_config = OpenAIConfig(
            mode=OpenAIMode.SYSTEM_MESSAGE,
            system_message=system_message,
            model=model
        )
        
        super().__init__(
            name=name,
            slug=slug,
            description=description,
            version=version,
            parser=parser,
            validator=validator,
            openai_config=openai_config,
            category=category
        )


# Factory functions for easy tool creation
def create_prompt_tool(
    name: str,
    slug: str,
    description: str,
    prompt_id: str,
    parser_type: str = 'generic',
    validator: Optional[ParametersValidator] = None,
    **kwargs
) -> PromptBasedTool:
    """
    Factory function to create prompt-based tools easily.
    
    Args:
        name: Tool display name
        slug: Tool slug identifier
        description: Tool description
        prompt_id: OpenAI prompt ID
        parser_type: Type of parser ('business_profile', 'competitors', 'list', 'generic')
        validator: Input parameters validator
        **kwargs: Additional arguments
        
    Returns:
        Configured PromptBasedTool instance
    """
    parser = create_parser(parser_type, **kwargs.get('parser_kwargs', {}))
    
    return PromptBasedTool(
        name=name,
        slug=slug,
        description=description,
        prompt_id=prompt_id,
        parser=parser,
        validator=validator,
        **{k: v for k, v in kwargs.items() if k != 'parser_kwargs'}
    )


def create_system_message_tool(
    name: str,
    slug: str,
    description: str,
    system_message: str,
    parser_type: str = 'generic',
    validator: Optional[ParametersValidator] = None,
    **kwargs
) -> SystemMessageTool:
    """
    Factory function to create system message-based tools easily.
    
    Args:
        name: Tool display name
        slug: Tool slug identifier
        description: Tool description
        system_message: System message for OpenAI
        parser_type: Type of parser ('business_profile', 'competitors', 'list', 'generic')
        validator: Input parameters validator
        **kwargs: Additional arguments
        
    Returns:
        Configured SystemMessageTool instance
    """
    parser = create_parser(parser_type, **kwargs.get('parser_kwargs', {}))
    
    return SystemMessageTool(
        name=name,
        slug=slug,
        description=description,
        system_message=system_message,
        parser=parser,
        validator=validator,
        **{k: v for k, v in kwargs.items() if k != 'parser_kwargs'}
    )