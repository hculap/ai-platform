"""
OpenAI Client Service for agent integrations.
Pure client for connecting to OpenAI APIs - no business logic.
"""

import logging
from typing import Dict, Any, Optional, List, Union
from dataclasses import dataclass
from enum import Enum
from functools import lru_cache
import os

logger = logging.getLogger(__name__)


class ClientInitStrategy(Enum):
    """Strategy for initializing OpenAI client."""
    STANDARD = "standard"
    MINIMAL = "minimal"
    NO_PROXY = "no_proxy"


@dataclass
class OpenAIConfig:
    """Configuration for OpenAI client."""
    api_key: str
    base_url: str = "https://api.openai.com/v1"
    timeout: float = 60.0
    max_retries: int = 3


@dataclass
class APIResponse:
    """Standardized API response structure."""
    success: bool
    content: Optional[str] = None
    response_id: Optional[str] = None
    model: Optional[str] = None
    usage: Optional[Dict[str, Any]] = None
    created_at: Optional[Any] = None
    error: Optional[str] = None
    error_type: Optional[str] = None
    finish_reason: Optional[str] = None
    status: Optional[str] = None  # For background requests: 'pending', 'completed', 'failed'
    is_background: bool = False

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary, excluding None values."""
        return {k: v for k, v in self.__dict__.items() if v is not None}


class OpenAIClient:
    """Pure OpenAI client for handling API requests."""

    def __init__(self, config: OpenAIConfig):
        """Initialize OpenAI client with configuration."""
        self.config = config
        self._client = None
        self._initialization_strategy = None

    def _create_client_with_strategy(self, strategy: ClientInitStrategy):
        """Create client using specified strategy."""
        try:
            from openai import OpenAI
            import httpx
        except ImportError as e:
            raise ImportError(f"OpenAI package not available: {e}")

        strategies = {
            ClientInitStrategy.STANDARD: lambda: OpenAI(
                api_key=self.config.api_key,
                base_url=self.config.base_url,
                http_client=httpx.Client(timeout=self.config.timeout),
                max_retries=self.config.max_retries
            ),
            ClientInitStrategy.MINIMAL: lambda: OpenAI(
                api_key=self.config.api_key,
                max_retries=self.config.max_retries
            ),
            ClientInitStrategy.NO_PROXY: lambda: OpenAI(
                api_key=self.config.api_key,
                base_url=self.config.base_url,
                http_client=httpx.Client(proxies=None, timeout=self.config.timeout),
                max_retries=self.config.max_retries
            )
        }
        
        return strategies[strategy]()

    def _get_client(self):
        """Lazy initialization of OpenAI client with fallback strategies."""
        if self._client is None:
            for strategy in ClientInitStrategy:
                try:
                    self._client = self._create_client_with_strategy(strategy)
                    self._initialization_strategy = strategy
                    logger.info(f"OpenAI client created with {strategy.value} strategy")
                    break
                except (TypeError, ImportError) as e:
                    logger.warning(f"Strategy {strategy.value} failed: {e}")
                    if strategy == list(ClientInitStrategy)[-1]:
                        raise RuntimeError(f"All initialization strategies failed. Last error: {e}")
        return self._client

    def _extract_response_content(self, response) -> Optional[str]:
        """
        Extract content from various OpenAI response structures.
        
        Args:
            response: OpenAI API response object
            
        Returns:
            Extracted text content or None
        """
        # FIRST: Try direct OpenAI Responses API structure
        if hasattr(response, 'output'):
            output = response.output
            
            # Handle string output directly
            if isinstance(output, str):
                logger.info("Found direct string output")
                return output
                
            # Handle structured output
            if output:
                logger.info(f"Found structured output, type: {type(output)}")
                # Try to access as list
                if isinstance(output, list) and len(output) > 0:
                    first_output = output[0]
                    
                    # Check if it has content attribute
                    if hasattr(first_output, 'content'):
                        content = first_output.content
                        
                        # If content is a list, get first item
                        if isinstance(content, list) and len(content) > 0:
                            content_item = content[0]
                            
                            # Try to get text from content item
                            if hasattr(content_item, 'text'):
                                logger.info("Found text in content[0].text")
                                return content_item.text
                            elif isinstance(content_item, dict) and 'text' in content_item:
                                logger.info("Found text in content[0]['text']")
                                return content_item['text']
                            elif isinstance(content_item, str):
                                logger.info("Found string content[0]")
                                return content_item
                        
                        # If content is string
                        elif isinstance(content, str):
                            logger.info("Found string content")
                            return content
                    
                    # Check direct text attribute
                    elif hasattr(first_output, 'text'):
                        logger.info("Found text in output[0].text")
                        return first_output.text
                    elif isinstance(first_output, str):
                        logger.info("Found string output[0]")
                        return first_output

        # FALLBACK: Try to convert to dict if possible to avoid Pydantic issues
        response_data = None
        try:
            if hasattr(response, 'model_dump'):
                # Use exclude_unset to avoid serialization issues
                response_data = response.model_dump(exclude_unset=True, mode='python')
            elif hasattr(response, 'dict'):
                response_data = response.dict()
            elif isinstance(response, dict):
                response_data = response
        except Exception as e:
            logger.debug(f"Could not convert response to dict: {e}")
        
        # If we have dict data, try dictionary extraction first
        if response_data:
            dict_paths = [
                # Standard path for responses API
                lambda d: d['output'][0]['content'][0]['text'],
                lambda d: d['output'][0]['content'][0]['output_text'],
                # Handle tool calls or function responses
                lambda d: d['output'][0]['content'],
                # Direct text field
                lambda d: d['text'],
                lambda d: d['content'],
            ]
            
            for path in dict_paths:
                try:
                    content = path(response_data)
                    if isinstance(content, str) and content:
                        return content
                    elif isinstance(content, list) and content:
                        # Handle case where content is a list of messages
                        for item in content:
                            if isinstance(item, dict):
                                text = item.get('text') or item.get('output_text') or item.get('content')
                                if text:
                                    return text
                            elif isinstance(item, str):
                                return item
                except (KeyError, IndexError, TypeError):
                    continue
        
        # Fallback to attribute access if dict extraction failed
        attribute_paths = [
            # Path 1: response.output[0].content[0].text
            lambda r: r.output[0].content[0].text,
            # Path 2: response.output[0].content[0].output_text
            lambda r: r.output[0].content[0].output_text,
            # Path 3: Direct content access
            lambda r: r.content,
            lambda r: r.text,
        ]
        
        for path in attribute_paths:
            try:
                content = path(response)
                if content and isinstance(content, str):
                    return content
            except (AttributeError, IndexError, KeyError, TypeError):
                continue
        
        # Log structure for debugging if all paths fail
        if logger.isEnabledFor(logging.DEBUG):
            logger.debug(f"Unable to extract content. Response type: {type(response)}")
            if response_data:
                # Log keys to understand structure without full dump
                logger.debug(f"Response keys: {list(response_data.keys()) if isinstance(response_data, dict) else 'N/A'}")
        
        return None

    def _extract_usage_data(self, usage) -> Optional[Dict[str, Any]]:
        """Extract usage data from response safely without triggering Pydantic warnings."""
        if not usage:
            return None
            
        try:
            # Try to safely convert to dict without triggering serialization warnings
            if hasattr(usage, 'model_dump'):
                # Use exclude_unset and mode='python' to avoid serialization issues
                return usage.model_dump(exclude_unset=True, mode='python')
            elif hasattr(usage, 'dict'):
                return usage.dict()
            elif isinstance(usage, dict):
                return usage
            
            # Fallback to manual extraction
            usage_dict = {}
            for field in ['input_tokens', 'output_tokens', 'total_tokens', 
                         'input_tokens_details', 'output_tokens_details']:
                if hasattr(usage, field):
                    value = getattr(usage, field)
                    if value is not None:
                        usage_dict[field] = value
            
            return usage_dict if usage_dict else None
            
        except Exception as e:
            logger.debug(f"Failed to extract usage data: {e}")
            return None

    def create_response_with_prompt_id(
        self, 
        prompt_id: str,
        user_message: str,
        variables: Optional[Dict[str, Any]] = None,
        version: Optional[str] = None,
        background: bool = False,
        **kwargs
    ) -> APIResponse:
        """
        Create a response using OpenAI's responses API with prompt_id.

        Args:
            prompt_id: The ID of the prompt to use
            user_message: The user's message/input
            variables: Variables for the prompt
            version: Prompt version
            background: Whether to run in background mode
            **kwargs: Additional parameters for the API

        Returns:
            APIResponse object with the result
        """
        try:
            client = self._get_client()

            # Build prompt configuration
            prompt_config = {
                "id": prompt_id,
                "variables": variables or {},
            }
            if version:
                prompt_config["version"] = version

            # Make API call
            response = client.responses.create(
                prompt=prompt_config,
                input=user_message,
                background=background,
                **kwargs
            )

            # Handle the response more carefully to avoid Pydantic issues
            content = None
            response_id = None
            model = None
            usage_data = None
            created_at = None
            status = None
            
            # Try to extract data without triggering Pydantic serialization warnings
            try:
                # Get response ID safely
                response_id = getattr(response, 'id', None)
                model = getattr(response, 'model', None)
                created_at = getattr(response, 'created_at', None)
                status = getattr(response, 'status', None)
                
                # For background requests, we might not have content immediately
                if background and status == 'pending':
                    content = None  # Content will be available when status is 'completed'
                else:
                    # Extract content with the improved extraction method
                    content = self._extract_response_content(response)
                
                # Extract usage data safely
                if hasattr(response, 'usage'):
                    usage_data = self._extract_usage_data(response.usage)
                    
            except Exception as e:
                logger.warning(f"Error extracting response data: {e}")
            
            # Additional fallback: Check if response has a direct text/content attribute
            # But skip this for pending background requests
            if not content and not (background and status == 'pending'):
                for attr in ['text', 'content', 'output_text']:
                    if hasattr(response, attr):
                        attr_value = getattr(response, attr)
                        if isinstance(attr_value, str):
                            content = attr_value
                            break
            
            # For background requests, success depends on getting a response_id
            if background:
                success = bool(response_id)
                error_msg = "No response ID for background request" if not response_id else None
            else:
                success = bool(content)
                error_msg = "No content found in response" if not content else None
            
            if not content and not background:
                logger.warning(f"No content extracted for prompt_id: {prompt_id}")
                # Try to log response structure safely
                try:
                    logger.debug(f"Response attributes: {[attr for attr in dir(response) if not attr.startswith('_')]}")
                except:
                    pass
            
            return APIResponse(
                success=success,
                content=content,
                response_id=response_id,
                model=model,
                usage=usage_data,
                created_at=created_at,
                status=status,
                is_background=background,
                error=error_msg
            )

        except Exception as e:
            logger.error(f"OpenAI responses API error with prompt_id {prompt_id}: {e}", exc_info=True)
            return APIResponse(
                success=False,
                error=str(e),
                error_type=type(e).__name__,
                is_background=background
            )

    def get_response_status(self, response_id: str) -> APIResponse:
        """
        Get the status of a background response.

        Args:
            response_id: The ID of the response to check

        Returns:
            APIResponse object with the current status and content (if completed)
        """
        try:
            client = self._get_client()

            # Retrieve the response by ID
            response = client.responses.retrieve(response_id)

            # Extract response data
            content = None
            status = getattr(response, 'status', None)
            model = getattr(response, 'model', None)
            usage_data = None
            created_at = getattr(response, 'created_at', None)
            
            # If completed, extract content
            if status == 'completed':
                content = self._extract_response_content(response)
                if hasattr(response, 'usage'):
                    usage_data = self._extract_usage_data(response.usage)
                
                # Additional logging for debugging content extraction
                logger.info(f"Extracted content length: {len(str(content)) if content else 0}")
                logger.info(f"Content preview: {str(content)[:200] if content else 'None'}")
            
            return APIResponse(
                success=True,
                content=content,
                response_id=response_id,
                model=model,
                usage=usage_data,
                created_at=created_at,
                status=status,
                is_background=True
            )

        except Exception as e:
            logger.error(f"Error retrieving response {response_id}: {e}", exc_info=True)
            return APIResponse(
                success=False,
                error=str(e),
                error_type=type(e).__name__,
                response_id=response_id,
                is_background=True
            )

    def create_chat_completion(
        self,
        messages: Optional[List[Dict[str, str]]] = None,
        system_message: Optional[str] = None,
        user_message: Optional[str] = None,
        model: str = "gpt-4o",
        **kwargs
    ) -> APIResponse:
        """
        Create a chat completion with flexible message handling.

        Args:
            messages: Pre-formatted messages list
            system_message: System prompt (used if messages not provided)
            user_message: User input (used if messages not provided)
            model: The model to use
            **kwargs: Additional parameters for the API

        Returns:
            APIResponse object with the result
        """
        try:
            client = self._get_client()

            # Build messages list
            if messages is None:
                if not user_message:
                    raise ValueError("Either messages or user_message must be provided")
                messages = []
                if system_message:
                    messages.append({"role": "system", "content": system_message})
                messages.append({"role": "user", "content": user_message})

            # Make API call
            response = client.chat.completions.create(
                model=model,
                messages=messages,
                **kwargs
            )

            # Extract response data
            choice = response.choices[0]
            
            return APIResponse(
                success=True,
                content=choice.message.content,
                model=response.model,
                finish_reason=choice.finish_reason,
                usage=self._extract_usage_data(response.usage),
                created_at=getattr(response, 'created_at', None),
                response_id=getattr(response, 'id', None)
            )

        except Exception as e:
            logger.error(f"OpenAI chat completion error: {e}", exc_info=True)
            return APIResponse(
                success=False,
                error=str(e),
                error_type=type(e).__name__
            )


class OpenAIClientFactory:
    """Factory for managing OpenAI client instances."""
    
    _instances: Dict[str, OpenAIClient] = {}
    
    @classmethod
    def get_client(
        cls,
        api_key: Optional[str] = None,
        base_url: Optional[str] = None,
        config: Optional[OpenAIConfig] = None,
        instance_key: str = "default"
    ) -> OpenAIClient:
        """
        Get or create an OpenAI client instance.
        
        Args:
            api_key: API key (overrides config/env)
            base_url: Base URL (overrides config/env)
            config: OpenAIConfig object
            instance_key: Key for managing multiple instances
            
        Returns:
            OpenAIClient instance
        """
        if instance_key not in cls._instances:
            if config is None:
                # Try Flask config
                try:
                    from flask import current_app
                    app_config = current_app.config
                    api_key = api_key or app_config.get('OPENAI_API_KEY')
                    base_url = base_url or app_config.get('OPENAI_BASE_URL')
                except (RuntimeError, ImportError):
                    pass
                
                # Fall back to environment variables
                api_key = api_key or os.environ.get('OPENAI_API_KEY')
                base_url = base_url or os.environ.get('OPENAI_BASE_URL', 'https://api.openai.com/v1')
                
                if not api_key:
                    raise ValueError("OPENAI_API_KEY is required but not configured")
                
                config = OpenAIConfig(api_key=api_key, base_url=base_url)
            
            cls._instances[instance_key] = OpenAIClient(config)
        
        return cls._instances[instance_key]
    
    @classmethod
    def reset_client(cls, instance_key: str = "default"):
        """Reset a specific client instance."""
        if instance_key in cls._instances:
            del cls._instances[instance_key]
    
    @classmethod
    def reset_all_clients(cls):
        """Reset all client instances."""
        cls._instances.clear()


# Convenience functions for backward compatibility
def get_openai_client(api_key=None, base_url=None) -> OpenAIClient:
    """Get the default OpenAI client instance."""
    return OpenAIClientFactory.get_client(api_key=api_key, base_url=base_url)


def reset_openai_client():
    """Reset the default OpenAI client."""
    OpenAIClientFactory.reset_client()