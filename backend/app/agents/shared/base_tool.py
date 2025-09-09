"""
Base tool class for all agent tools across the entire system.
Provides common functionality, interfaces, and utilities for tool execution.
Designed to be reusable across all agents and use cases.
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, Union, List, TypeVar, Generic
from datetime import datetime, timedelta
from dataclasses import dataclass, field, asdict
from enum import Enum
import time
import logging
# Removed asynccontextmanager import as we're converting to sync


# Configure logging
logger = logging.getLogger(__name__)


# Type variable for tool configuration
T = TypeVar('T')


class ToolCategory(Enum):
    """Enumeration of tool categories for better type safety."""
    GENERAL = "general"
    DATA = "data"
    API = "api"
    ANALYSIS = "analysis"
    COMMUNICATION = "communication"
    AUTOMATION = "automation"


class OpenAIMode(Enum):
    """OpenAI integration modes."""
    PROMPT_ID = "prompt_id"
    SYSTEM_MESSAGE = "system_message"
    NONE = "none"


@dataclass(frozen=True)
class ToolConfig:
    """Immutable configuration for a tool."""
    name: str
    slug: str
    description: str
    version: str = "1.0.0"
    category: ToolCategory = ToolCategory.GENERAL
    tags: List[str] = field(default_factory=list)
    requires_authentication: bool = False
    max_execution_time: Optional[float] = None
    rate_limit_per_minute: Optional[int] = None
    
    def __post_init__(self):
        """Validate configuration after initialization."""
        if not self.name or not self.slug:
            raise ValueError("Tool name and slug are required")
        if self.max_execution_time and self.max_execution_time <= 0:
            raise ValueError("max_execution_time must be positive")
        if self.rate_limit_per_minute and self.rate_limit_per_minute <= 0:
            raise ValueError("rate_limit_per_minute must be positive")


@dataclass(frozen=True)
class OpenAIConfig:
    """Configuration for OpenAI integration."""
    mode: OpenAIMode
    system_message: Optional[str] = None
    prompt_id: Optional[str] = None
    model: str = "gpt-4o"
    
    def __post_init__(self):
        """Validate OpenAI configuration."""
        if self.mode == OpenAIMode.PROMPT_ID and not self.prompt_id:
            raise ValueError("prompt_id required when mode is PROMPT_ID")
        if self.mode == OpenAIMode.SYSTEM_MESSAGE and not self.system_message:
            raise ValueError("system_message required when mode is SYSTEM_MESSAGE")


@dataclass
class ToolInput:
    """Input structure for tool execution."""
    parameters: Dict[str, Any]
    user_id: Optional[Union[int, str]] = None
    context: Optional[Any] = None
    agent_context: Optional[Dict[str, Any]] = None
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def get_parameter(self, key: str, default: Any = None) -> Any:
        """Safely get a parameter with a default value."""
        return self.parameters.get(key, default)
    
    def has_parameter(self, key: str) -> bool:
        """Check if a parameter exists."""
        return key in self.parameters


@dataclass
class ToolMetadata:
    """Metadata for tool execution."""
    tool_name: str
    execution_time: float
    timestamp: str
    version: str = "1.0.0"
    agent_name: Optional[str] = None
    agent_version: Optional[str] = None
    additional_info: Dict[str, Any] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert metadata to dictionary."""
        return asdict(self)


@dataclass
class ToolOutput:
    """Output structure for tool execution."""
    success: bool
    data: Optional[Any] = None
    error: Optional[str] = None
    metadata: Optional[ToolMetadata] = None
    warnings: List[str] = field(default_factory=list)
    
    def add_warning(self, warning: str) -> None:
        """Add a warning to the output."""
        self.warnings.append(warning)
    
    @classmethod
    def success_response(cls, data: Any, metadata: Optional[ToolMetadata] = None) -> 'ToolOutput':
        """Create a successful response."""
        return cls(success=True, data=data, metadata=metadata)
    
    @classmethod
    def error_response(cls, error: str, metadata: Optional[ToolMetadata] = None) -> 'ToolOutput':
        """Create an error response."""
        return cls(success=False, error=error, metadata=metadata)


@dataclass
class ToolValidationResult:
    """Result of input parameter validation."""
    is_valid: bool
    errors: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)
    
    def add_error(self, error: str) -> None:
        """Add an error and mark as invalid."""
        self.errors.append(error)
        self.is_valid = False
    
    def add_warning(self, warning: str) -> None:
        """Add a warning without affecting validity."""
        self.warnings.append(warning)
    
    def merge(self, other: 'ToolValidationResult') -> None:
        """Merge another validation result into this one."""
        self.errors.extend(other.errors)
        self.warnings.extend(other.warnings)
        self.is_valid = self.is_valid and other.is_valid


class RateLimiter:
    """Simple rate limiter for tool execution."""
    
    def __init__(self, max_calls: int, time_window: timedelta = timedelta(minutes=1)):
        self.max_calls = max_calls
        self.time_window = time_window
        self.calls: List[datetime] = []
    
    def is_allowed(self) -> bool:
        """Check if a new call is allowed."""
        if not self.max_calls:
            return True
        
        now = datetime.now()
        cutoff = now - self.time_window
        
        # Remove old calls outside the time window
        self.calls = [call_time for call_time in self.calls if call_time > cutoff]
        
        # Check if we're within the limit
        return len(self.calls) < self.max_calls
    
    def record_call(self) -> None:
        """Record a new call."""
        self.calls.append(datetime.now())


class OpenAIClient:
    """Wrapper for OpenAI API interactions."""
    
    def __init__(self, config: OpenAIConfig):
        self.config = config
        self._client = None
    
    def _get_client(self):
        """Lazy load the OpenAI client."""
        if self._client is None:
            from ...services.openai_client import get_openai_client
            self._client = get_openai_client()
        return self._client
    
    def call(self, user_input: str, background: bool = False, **kwargs) -> Dict[str, Any]:
        """
        Call OpenAI API based on configuration.
        
        Args:
            user_input: User input message
            background: Whether to run in background mode
            **kwargs: Additional parameters
            
        Returns:
            API response as dictionary
        """
        if self.config.mode == OpenAIMode.NONE:
            return {
                'success': False,
                'error': 'No OpenAI configuration',
                'content': None
            }
        
        try:
            client = self._get_client()
            
            if self.config.mode == OpenAIMode.PROMPT_ID:
                api_response = client.create_response_with_prompt_id(
                    prompt_id=self.config.prompt_id,
                    user_message=user_input,
                    background=background,
                    **kwargs
                )
            else:  # SYSTEM_MESSAGE mode
                api_response = client.create_chat_completion(
                    system_message=self.config.system_message,
                    user_message=user_input,
                    model=self.config.model,
                    **kwargs
                )
            
            # Convert response to dictionary
            return self._parse_response(api_response)
            
        except ImportError as e:
            logger.error(f"Failed to import OpenAI client: {e}")
            return {
                'success': False,
                'error': f'OpenAI client not available: {e}',
                'error_type': 'ImportError',
                'content': None
            }
        except Exception as e:
            logger.error(f"OpenAI call failed: {e}", exc_info=True)
            return {
                'success': False,
                'error': str(e),
                'error_type': type(e).__name__,
                'content': None
            }
    
    def _parse_response(self, api_response) -> Dict[str, Any]:
        """Parse API response to dictionary."""
        if hasattr(api_response, 'to_dict'):
            result = api_response.to_dict()
        else:
            # Manual conversion
            result = {
                'success': getattr(api_response, 'success', False),
                'content': getattr(api_response, 'content', None),
                'response_id': getattr(api_response, 'response_id', None),
                'model': getattr(api_response, 'model', None),
                'usage': getattr(api_response, 'usage', None),
                'created_at': getattr(api_response, 'created_at', None),
                'finish_reason': getattr(api_response, 'finish_reason', None),
                'error': getattr(api_response, 'error', None),
                'error_type': getattr(api_response, 'error_type', None)
            }
        
        # Remove None values for cleaner output
        return {k: v for k, v in result.items() if v is not None}


class ExecutionMonitor:
    """Monitors tool execution metrics."""
    
    def __init__(self, tool_name: str, max_execution_time: Optional[float] = None):
        self.tool_name = tool_name
        self.max_execution_time = max_execution_time
        self.execution_count = 0
        self.total_execution_time = 0.0
        self.last_execution_time: Optional[datetime] = None
    
    def monitor(self):
        """Context manager for monitoring execution."""
        class MonitorContext:
            def __init__(self, parent):
                self.parent = parent
                self.start_time = None
                
            def __enter__(self):
                self.start_time = time.time()
                logger.info(f"Starting execution of {self.parent.tool_name}")
                return self
                
            def __exit__(self, exc_type, exc_val, exc_tb):
                execution_time = time.time() - self.start_time
                self.parent.execution_count += 1
                self.parent.total_execution_time += execution_time
                self.parent.last_execution_time = datetime.now()
                
                if self.parent.max_execution_time and execution_time > self.parent.max_execution_time:
                    logger.warning(
                        f"Tool {self.parent.tool_name} exceeded time limit: "
                        f"{execution_time:.2f}s > {self.parent.max_execution_time}s"
                    )
                
                logger.info(f"Completed {self.parent.tool_name} in {execution_time:.2f}s")
        
        return MonitorContext(self)
    
    def get_metrics(self) -> Dict[str, Any]:
        """Get execution metrics."""
        avg_time = (self.total_execution_time / self.execution_count 
                   if self.execution_count > 0 else 0)
        
        return {
            'execution_count': self.execution_count,
            'total_execution_time': self.total_execution_time,
            'average_execution_time': avg_time,
            'last_execution': self.last_execution_time.isoformat() if self.last_execution_time else None
        }


class BaseTool(ABC):
    """
    Abstract base class for all agent tools in the system.
    
    This class provides common functionality that can be used by any tool,
    including input validation, logging, error handling, and metadata creation.
    """
    
    def __init__(
        self,
        config: ToolConfig,
        openai_config: Optional[OpenAIConfig] = None
    ):
        """
        Initialize the base tool.
        
        Args:
            config: Tool configuration
            openai_config: Optional OpenAI configuration
        """
        self.config = config
        self.openai_config = openai_config or OpenAIConfig(mode=OpenAIMode.NONE)
        
        # Initialize components
        self.rate_limiter = RateLimiter(config.rate_limit_per_minute) if config.rate_limit_per_minute else None
        self.openai_client = OpenAIClient(self.openai_config) if self.openai_config.mode != OpenAIMode.NONE else None
        self.monitor = ExecutionMonitor(config.name, config.max_execution_time)
    
    @classmethod
    def from_legacy_params(
        cls,
        name: str,
        slug: str,
        description: str,
        version: str = "1.0.0",
        category: str = "general",
        tags: List[str] = None,
        requires_authentication: bool = False,
        max_execution_time: Optional[float] = None,
        rate_limit_per_minute: Optional[int] = None,
        system_message: Optional[str] = None,
        prompt_id: Optional[str] = None,
        openai_model: str = "gpt-4o"
    ):
        """
        Create tool from legacy parameters for backward compatibility.
        """
        # Create tool config
        tool_config = ToolConfig(
            name=name,
            slug=slug,
            description=description,
            version=version,
            category=ToolCategory(category) if isinstance(category, str) else category,
            tags=tags or [],
            requires_authentication=requires_authentication,
            max_execution_time=max_execution_time,
            rate_limit_per_minute=rate_limit_per_minute
        )
        
        # Create OpenAI config
        if prompt_id:
            openai_config = OpenAIConfig(
                mode=OpenAIMode.PROMPT_ID,
                prompt_id=prompt_id,
                model=openai_model
            )
        elif system_message:
            openai_config = OpenAIConfig(
                mode=OpenAIMode.SYSTEM_MESSAGE,
                system_message=system_message,
                model=openai_model
            )
        else:
            openai_config = OpenAIConfig(mode=OpenAIMode.NONE)
        
        # Create instance using the actual class, not BaseTool
        return cls(config=tool_config, openai_config=openai_config)
    
    @property
    def name(self) -> str:
        """Tool name for backward compatibility."""
        return self.config.name
    
    @property
    def slug(self) -> str:
        """Tool slug for backward compatibility."""
        return self.config.slug
    
    @property
    def description(self) -> str:
        """Tool description for backward compatibility."""
        return self.config.description
    
    @property
    def version(self) -> str:
        """Tool version for backward compatibility."""
        return self.config.version
    
    @abstractmethod
    def execute(self, input_data: ToolInput) -> ToolOutput:
        """
        Execute the tool with given input.
        
        This method must be implemented by all subclasses.
        
        Args:
            input_data: ToolInput containing parameters and context
            
        Returns:
            ToolOutput with execution results
        """
        pass
    
    def get_status(self, job_id: str, user_id: Optional[Union[int, str]] = None) -> ToolOutput:
        """
        Get the status of a background job.
        
        This method can be overridden by subclasses to provide custom status checking logic.
        Default implementation uses OpenAI response ID for status checking.
        
        Args:
            job_id: The job ID (typically OpenAI response ID) to check status for
            user_id: Optional user ID for authorization
            
        Returns:
            ToolOutput with status information and results if completed
        """
        if not self.openai_client:
            return ToolOutput.error_response("No OpenAI configuration for status checking")
        
        try:
            # Import here to avoid circular imports
            from ...services.openai_client import OpenAIClientFactory
            
            openai_client = OpenAIClientFactory.get_client()
            openai_response = openai_client.get_response_status(job_id)

            if not openai_response.success:
                logger.error(f"Failed to check OpenAI status: {openai_response.error}")
                return ToolOutput.error_response(f"Failed to check status: {openai_response.error}")
            
            # Process response based on OpenAI status values
            status = getattr(openai_response, 'status', 'unknown')
            
            if status == 'completed':
                # Extract content from the completed response
                content = getattr(openai_response, 'content', None)
                
                if content:
                    return ToolOutput.success_response({
                        'status': 'completed',
                        'content': content
                    })
                else:
                    return ToolOutput.success_response({
                        'status': 'error',
                        'message': 'Analysis completed but no content was generated. Please check OpenAI API key configuration.'
                    })
            elif status in ['failed', 'canceled']:
                error_msg = getattr(openai_response, 'error', None) or f"OpenAI analysis {status}"
                return ToolOutput.error_response(error_msg)
            elif status in ['pending', 'queued', 'in_progress']:
                return ToolOutput.success_response({'status': status})
            else:
                return ToolOutput.success_response({
                    'status': status,
                    'message': f'Unknown OpenAI status: {status}'
                })
            
        except Exception as e:
            logger.exception(f"Status check failed for job {job_id}: {e}")
            return ToolOutput.success_response({
                'status': 'error',
                'message': f'Status check failed: {str(e)}',
                'job_id': job_id
            })
    
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
        result = ToolValidationResult(is_valid=True)
        
        # Check authentication requirement
        if self.config.requires_authentication and not input_data.user_id:
            result.add_error("Authentication required for this tool")
        
        # Validate parameter structure
        if not isinstance(input_data.parameters, dict):
            result.add_error("Parameters must be a dictionary")
        
        return result
    
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
            tool_name=self.config.name,
            execution_time=execution_time,
            timestamp=datetime.now().isoformat(),
            version=self.config.version,
            agent_name=agent_name,
            agent_version=agent_version,
            additional_info=additional_info or {}
        )
    
    def call_openai(self, user_input: str, background: bool = False, **kwargs) -> Dict[str, Any]:
        """
        Call OpenAI API using configured settings.
        
        Args:
            user_input: User input message
            background: Whether to run in background mode
            **kwargs: Additional parameters
            
        Returns:
            API response as dictionary
        """
        if not self.openai_client:
            return {
                'success': False,
                'error': 'No OpenAI configuration',
                'content': None
            }
        
        return self.openai_client.call(user_input, background=background, **kwargs)
    
    def execute_with_monitoring(self, input_data: ToolInput) -> ToolOutput:
        """
        Execute tool with monitoring and error handling.
        
        This wrapper provides:
        - Input validation
        - Execution time monitoring
        - Error handling and logging
        - Rate limiting
        
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
                logger.warning(f"Tool {self.config.name} validation failed: {validation.errors}")
                return ToolOutput.error_response(
                    f"Validation failed: {', '.join(validation.errors)}",
                    self.create_metadata(time.time() - start_time)
                )
            
            # Check rate limiting
            if self.rate_limiter and not self.rate_limiter.is_allowed():
                return ToolOutput.error_response(
                    "Rate limit exceeded",
                    self.create_metadata(time.time() - start_time)
                )
            
            # Execute with monitoring
            with self.monitor.monitor():
                result = self.execute(input_data)
            
            # Record successful call for rate limiting
            if self.rate_limiter and result.success:
                self.rate_limiter.record_call()
            
            # Ensure metadata is set
            if result.metadata is None:
                result.metadata = self.create_metadata(time.time() - start_time)
            
            # Add warnings from validation if any
            result.warnings.extend(validation.warnings)
            
            return result
            
        except Exception as e:
            logger.exception(f"Tool {self.config.name} execution error: {e}")
            return ToolOutput.error_response(
                f"Execution failed: {str(e)}",
                self.create_metadata(time.time() - start_time)
            )
    
    def get_info(self) -> Dict[str, Any]:
        """
        Get information about this tool.
        
        Returns:
            Dictionary with tool information
        """
        return {
            "name": self.config.name,
            "slug": self.config.slug,
            "description": self.config.description,
            "version": self.config.version,
            "category": self.config.category.value if isinstance(self.config.category, ToolCategory) else self.config.category,
            "tags": self.config.tags,
            "requires_authentication": self.config.requires_authentication,
            "max_execution_time": self.config.max_execution_time,
            "rate_limit_per_minute": self.config.rate_limit_per_minute,
            "has_openai_integration": self.openai_config.mode != OpenAIMode.NONE,
            "openai_mode": self.openai_config.mode.value,
            "metrics": self.monitor.get_metrics()
        }
    
    def __repr__(self) -> str:
        return f"{self.__class__.__name__}(name='{self.config.name}', version='{self.config.version}')"


# Utility functions for tool management
class ToolRegistry:
    """Registry for managing tools."""
    
    def __init__(self):
        self.tools: Dict[str, BaseTool] = {}
    
    def register(self, tool: BaseTool) -> None:
        """Register a tool."""
        if tool.slug in self.tools:
            raise ValueError(f"Tool with slug '{tool.slug}' already registered")
        self.tools[tool.slug] = tool
    
    def get(self, slug: str) -> Optional[BaseTool]:
        """Get a tool by slug."""
        return self.tools.get(slug)
    
    def list(self) -> List[Dict[str, Any]]:
        """List all registered tools."""
        return [tool.get_info() for tool in self.tools.values()]
    
    def search(self, category: Optional[ToolCategory] = None, tags: Optional[List[str]] = None) -> List[BaseTool]:
        """Search for tools by category or tags."""
        results = []
        for tool in self.tools.values():
            if category and tool.config.category != category:
                continue
            if tags and not any(tag in tool.config.tags for tag in tags):
                continue
            results.append(tool)
        return results


def validate_tool_config(config: Dict[str, Any]) -> ToolValidationResult:
    """
    Validate tool configuration dictionary.
    
    Args:
        config: Tool configuration dictionary
        
    Returns:
        ValidationResult indicating if config is valid
    """
    result = ToolValidationResult(is_valid=True)
    
    # Check required fields
    required_fields = ['name', 'slug', 'description']
    for field in required_fields:
        if field not in config:
            result.add_error(f"Missing required field: {field}")
    
    # Validate field types and values
    if 'name' in config and not config['name']:
        result.add_error("Name cannot be empty")
    
    if 'slug' in config and not config['slug']:
        result.add_error("Slug cannot be empty")
    
    if 'version' not in config:
        result.add_warning("Version not specified, using default")
    
    if 'category' in config and config['category'] not in [cat.value for cat in ToolCategory]:
        result.add_warning(f"Unknown category: {config['category']}")
    
    if 'max_execution_time' in config and config['max_execution_time'] <= 0:
        result.add_error("max_execution_time must be positive")
    
    if 'rate_limit_per_minute' in config and config['rate_limit_per_minute'] <= 0:
        result.add_error("rate_limit_per_minute must be positive")
    
    return result