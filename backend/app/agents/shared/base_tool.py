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
        rate_limit_per_minute: Optional[int] = None
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

        # Runtime state
        self._execution_count = 0
        self._last_execution_time = None

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
            "rate_limit_per_minute": self.rate_limit_per_minute
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
