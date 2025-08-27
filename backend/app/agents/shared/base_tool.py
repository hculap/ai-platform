"""
Base tool class for all agent tools across the entire system.
Provides common functionality, interfaces, and utilities for tool execution.
Designed to be reusable across all agents and use cases.
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, Union, List
from datetime import datetime
from dataclasses import dataclass, field
import time
import logging


# Configure logging
logger = logging.getLogger(__name__)


@dataclass
class ToolInput:
    """Input structure for tool execution"""
    parameters: Dict[str, Any]
    user_id: Optional[Union[int, str]] = None
    context: Optional[Any] = None
    agent_context: Optional[Dict[str, Any]] = None
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class ToolMetadata:
    """Metadata for tool execution"""
    tool_name: str
    execution_time: float
    timestamp: str
    version: str = "1.0.0"
    agent_name: Optional[str] = None
    agent_version: Optional[str] = None
    additional_info: Dict[str, Any] = field(default_factory=dict)


@dataclass
class ToolOutput:
    """Output structure for tool execution"""
    success: bool
    data: Optional[Any] = None
    error: Optional[str] = None
    metadata: Optional[ToolMetadata] = None
    warnings: List[str] = field(default_factory=list)


@dataclass
class ToolValidationResult:
    """Result of input parameter validation"""
    is_valid: bool
    errors: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)


class BaseTool(ABC):
    """
    Abstract base class for all agent tools in the system.

    This class provides common functionality that can be used by any tool,
    including input validation, logging, error handling, and metadata creation.
    """

    def __init__(
        self,
        name: str,
        slug: str,
        description: str,
        version: str = "1.0.0",
        category: str = "general",
        tags: List[str] = None,
        requires_authentication: bool = False,
        max_execution_time: Optional[float] = None,
        rate_limit_per_minute: Optional[int] = None,
        # OpenAI integration fields
        system_message: Optional[str] = None,
        prompt_id: Optional[str] = None,
        openai_model: str = "gpt-4o"
    ):
        """
        Initialize the base tool.

        Args:
            name: Unique name for the tool
            slug: URL-friendly identifier for the tool
            description: Human-readable description
            version: Tool version string
            category: Tool category for organization
            tags: List of tags for search/filtering
            requires_authentication: Whether tool requires user authentication
            max_execution_time: Maximum allowed execution time in seconds
            rate_limit_per_minute: Rate limit for tool usage
            system_message: System message for OpenAI chat completion (alternative to prompt_id)
            prompt_id: OpenAI prompt ID for responses API (alternative to system_message)
            openai_model: OpenAI model to use for generation
        """
        self.name = name
        self.slug = slug
        self.description = description
        self.version = version
        self.category = category
        self.tags = tags or []
        self.requires_authentication = requires_authentication
        self.max_execution_time = max_execution_time
        self.rate_limit_per_minute = rate_limit_per_minute

        # OpenAI integration
        self.system_message = system_message
        self.prompt_id = prompt_id
        self.openai_model = openai_model

        # Note: Allow tools to work without OpenAI integration
        # Some tools might not need AI capabilities
        
        # Runtime state
        self._execution_count = 0
        self._last_execution_time = None

    def call_openai(self, user_input: str, **kwargs) -> Dict[str, Any]:
        """
        Call OpenAI API using either prompt_id or system_message approach.

        Args:
            user_input: The user's input/message
            **kwargs: Additional parameters to pass to OpenAI API

        Returns:
            Dict containing OpenAI response or error information
        """
        try:
            # Import the client
            from ...services.openai_client import get_openai_client
            client = get_openai_client()

            result = None
            
            if self.prompt_id:
                # Use responses API with prompt_id
                logger.debug(f"Calling OpenAI responses API with prompt_id: {self.prompt_id}")
                
                # Call the API and get APIResponse object
                api_response = client.create_response_with_prompt_id(
                    prompt_id=self.prompt_id,
                    user_message=user_input,
                    **kwargs
                )
                
                # Convert APIResponse to dict
                if hasattr(api_response, 'to_dict'):
                    result = api_response.to_dict()
                else:
                    # Manual conversion if to_dict not available
                    result = {
                        'success': getattr(api_response, 'success', False),
                        'content': getattr(api_response, 'content', None),
                        'response_id': getattr(api_response, 'response_id', None),
                        'model': getattr(api_response, 'model', None),
                        'usage': getattr(api_response, 'usage', None),
                        'created_at': getattr(api_response, 'created_at', None),
                        'error': getattr(api_response, 'error', None),
                        'error_type': getattr(api_response, 'error_type', None)
                    }
                
            elif self.system_message:
                # Use chat completion with system message
                logger.debug(f"Calling OpenAI chat completion with model: {self.openai_model}")
                
                api_response = client.create_chat_completion(
                    system_message=self.system_message,
                    user_message=user_input,
                    model=self.openai_model,
                    **kwargs
                )
                
                # Convert APIResponse to dict
                if hasattr(api_response, 'to_dict'):
                    result = api_response.to_dict()
                else:
                    # Manual conversion
                    result = {
                        'success': getattr(api_response, 'success', False),
                        'content': getattr(api_response, 'content', None),
                        'model': getattr(api_response, 'model', None),
                        'usage': getattr(api_response, 'usage', None),
                        'created_at': getattr(api_response, 'created_at', None),
                        'finish_reason': getattr(api_response, 'finish_reason', None),
                        'error': getattr(api_response, 'error', None),
                        'error_type': getattr(api_response, 'error_type', None)
                    }
            else:
                # No OpenAI configuration
                logger.warning(f"Tool {self.slug} has no OpenAI configuration")
                result = {
                    'success': False,
                    'error': 'No OpenAI configuration found (missing prompt_id or system_message)',
                    'content': None
                }
            
            # Clean up the result - remove None values for cleaner output
            if result:
                result = {k: v for k, v in result.items() if v is not None}
            
            # Log the result for debugging
            if not result.get('success'):
                logger.warning(f"OpenAI call failed for tool {self.slug}: {result.get('error')}")
                logger.debug(f"Full OpenAI response: {result}")
            elif not result.get('content'):
                logger.warning(f"OpenAI call succeeded but no content returned for tool {self.slug}")
                logger.debug(f"Full OpenAI response: {result}")
            else:
                logger.debug(f"OpenAI call successful for tool {self.slug}, content length: {len(str(result.get('content', '')))}")
            
            return result

        except ImportError as e:
            logger.error(f"Failed to import OpenAI client: {e}")
            return {
                'success': False,
                'error': f'OpenAI client not available: {e}',
                'error_type': 'ImportError',
                'content': None
            }
        except Exception as e:
            logger.error(f"OpenAI call failed for tool {self.slug}: {e}", exc_info=True)
            return {
                'success': False,
                'error': str(e),
                'error_type': type(e).__name__,
                'content': None
            }

    @abstractmethod
    async def execute(self, input_data: ToolInput) -> ToolOutput:
        """
        Execute the tool with given input.

        This method must be implemented by all subclasses.

        Args:
            input_data: ToolInput containing parameters and context

        Returns:
            ToolOutput with execution results
        """
        pass

    def validate_input(self, input_data: ToolInput) -> ToolValidationResult:
        """
        Validate input parameters before execution.

        This method can be overridden by subclasses to provide
        custom validation logic.

        Args:
            input_data: Input data to validate

        Returns:
            ValidationResult indicating if input is valid
        """
        errors = []
        warnings = []

        # Check if authentication is required
        if self.requires_authentication and not input_data.user_id:
            errors.append("Authentication required for this tool")

        # Check for basic parameter structure
        if not isinstance(input_data.parameters, dict):
            errors.append("Parameters must be a dictionary")
        else:
            # Basic parameter validation - can be extended by subclasses
            pass

        return ToolValidationResult(
            is_valid=len(errors) == 0,
            errors=errors,
            warnings=warnings
        )

    def create_metadata(
        self,
        execution_time: float,
        agent_name: Optional[str] = None,
        agent_version: Optional[str] = None,
        additional_info: Dict[str, Any] = None
    ) -> ToolMetadata:
        """
        Create tool metadata for execution results.

        Args:
            execution_time: Time taken to execute the tool
            agent_name: Name of the agent using this tool
            agent_version: Version of the agent
            additional_info: Additional metadata

        Returns:
            ToolMetadata object
        """
        return ToolMetadata(
            tool_name=self.name,
            execution_time=execution_time,
            timestamp=datetime.now().isoformat(),
            version=self.version,
            agent_name=agent_name,
            agent_version=agent_version,
            additional_info=additional_info or {}
        )

    async def execute_with_monitoring(self, input_data: ToolInput) -> ToolOutput:
        """
        Execute tool with monitoring and error handling.

        This wrapper provides:
        - Input validation
        - Execution time monitoring
        - Error handling and logging
        - Rate limiting (basic implementation)

        Args:
            input_data: Tool input data

        Returns:
            ToolOutput with execution results
        """
        start_time = time.time()

        try:
            # Validate input
            validation = self.validate_input(input_data)
            if not validation.is_valid:
                logger.warning(f"Tool {self.name} input validation failed: {validation.errors}")
                return ToolOutput(
                    success=False,
                    error=f"Input validation failed: {', '.join(validation.errors)}",
                    metadata=self.create_metadata(time.time() - start_time)
                )

            # Check rate limiting (basic implementation)
            if self._should_rate_limit():
                return ToolOutput(
                    success=False,
                    error="Rate limit exceeded",
                    metadata=self.create_metadata(time.time() - start_time)
                )

            # Log execution start
            logger.info(f"Executing tool {self.name} for user {input_data.user_id}")

            # Execute the actual tool
            result = await self.execute(input_data)

            # Update execution tracking
            execution_time = time.time() - start_time
            self._execution_count += 1
            self._last_execution_time = datetime.now()

            # Check execution time limit
            if self.max_execution_time and execution_time > self.max_execution_time:
                logger.warning(f"Tool {self.name} exceeded execution time limit: {execution_time}s")

            # Ensure metadata is set
            if result.metadata is None:
                result.metadata = self.create_metadata(execution_time)

            # Log successful execution
            if result.success:
                logger.info(f"Tool {self.name} executed successfully in {execution_time:.2f}s")
            else:
                logger.error(f"Tool {self.name} execution failed: {result.error}")

            return result

        except Exception as e:
            execution_time = time.time() - start_time
            error_msg = f"Tool execution failed: {str(e)}"
            logger.exception(f"Tool {self.name} execution error: {e}")

            return ToolOutput(
                success=False,
                error=error_msg,
                metadata=self.create_metadata(execution_time)
            )

    def _should_rate_limit(self) -> bool:
        """
        Check if the tool should be rate limited.

        This is a basic implementation that can be extended.
        """
        if not self.rate_limit_per_minute:
            return False

        # Simple rate limiting based on execution count
        # In a real implementation, you'd use Redis or similar
        current_time = time.time()
        time_window = 60  # 1 minute

        # Reset counter if enough time has passed
        if (self._last_execution_time and
            (current_time - self._last_execution_time.timestamp()) > time_window):
            self._execution_count = 0

        return self._execution_count >= self.rate_limit_per_minute

    def get_info(self) -> Dict[str, Any]:
        """
        Get information about this tool.

        Returns:
            Dictionary with tool information
        """
        return {
            "name": self.name,
            "description": self.description,
            "version": self.version,
            "category": self.category,
            "tags": self.tags,
            "requires_authentication": self.requires_authentication,
            "max_execution_time": self.max_execution_time,
            "rate_limit_per_minute": self.rate_limit_per_minute,
            "has_openai_integration": bool(self.prompt_id or self.system_message),
            "openai_mode": "prompt_id" if self.prompt_id else ("system_message" if self.system_message else None)
        }

    def __repr__(self) -> str:
        return f"{self.__class__.__name__}(name='{self.name}', version='{self.version}')"


# Utility functions for tool management
def create_tool_from_config(config: Dict[str, Any]) -> BaseTool:
    """
    Factory function to create tools from configuration.

    This is a placeholder for future implementation where tools
    might be created dynamically from configuration files.
    """
    # Placeholder implementation
    raise NotImplementedError("Dynamic tool creation not yet implemented")


def validate_tool_config(config: Dict[str, Any]) -> ToolValidationResult:
    """
    Validate tool configuration.

    Args:
        config: Tool configuration dictionary

    Returns:
        ValidationResult indicating if config is valid
    """
    errors = []
    warnings = []

    required_fields = ['name', 'description']
    for field in required_fields:
        if field not in config:
            errors.append(f"Missing required field: {field}")

    if 'version' not in config:
        warnings.append("Version not specified, using default")

    return ToolValidationResult(
        is_valid=len(errors) == 0,
        errors=errors,
        warnings=warnings
    )