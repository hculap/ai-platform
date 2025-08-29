"""
Agent factory for standardized agent creation and registration.
Simplifies agent development with factory patterns and auto-registration.
"""

import logging
from typing import Dict, Any, Optional, List, Type
from abc import ABC

from ..base import BaseAgent, AgentInput, AgentOutput, AgentCapabilities, create_agent_metadata
from .base_tool import BaseTool

logger = logging.getLogger(__name__)


class StandardAgent(BaseAgent):
    """
    Standard agent implementation with common patterns.
    Reduces boilerplate code for typical agents.
    """
    
    def __init__(
        self,
        name: str,
        slug: str,
        short_description: str,
        description: str,
        tools: Dict[str, BaseTool],
        version: str = "1.0.0",
        is_public: bool = False,
        resources: Optional[Dict[str, Any]] = None,
        prompts: Optional[Dict[str, Any]] = None
    ):
        """
        Initialize standard agent with simplified parameters.
        
        Args:
            name: Agent display name
            slug: Agent slug identifier
            short_description: Brief description
            description: Detailed description
            tools: Dictionary of tools {slug: tool_instance}
            version: Agent version
            is_public: Whether agent is publicly accessible
            resources: Additional resources
            prompts: Additional prompts
        """
        capabilities = AgentCapabilities(
            tools=tools,
            resources=resources or {},
            prompts=prompts or {},
            logging={
                'execution': True,
                'performance': True,
                'errors': True
            }
        )
        
        super().__init__(
            name=name,
            slug=slug,
            short_description=short_description,
            description=description,
            version=version,
            capabilities=capabilities,
            is_public=is_public
        )
    
    async def execute(self, input_data: AgentInput) -> AgentOutput:
        """
        Execute the agent with standardized patterns.
        
        Args:
            input_data: Agent input data
            
        Returns:
            AgentOutput with execution results
        """
        import time
        start_time = time.time()
        
        try:
            parameters = input_data.parameters
            
            # Get action from parameters
            action = parameters.get('action')
            if not action:
                return AgentOutput(
                    success=False,
                    error="Action parameter is required",
                    metadata=create_agent_metadata(self.name, time.time() - start_time)
                )
            
            # Get the appropriate tool
            if action not in self.capabilities.tools:
                available_actions = list(self.capabilities.tools.keys())
                return AgentOutput(
                    success=False,
                    error=f"Unknown action '{action}'. Available actions: {available_actions}",
                    metadata=create_agent_metadata(self.name, time.time() - start_time)
                )
            
            tool = self.capabilities.tools[action]
            
            # Execute the tool
            from .base_tool import ToolInput
            tool_input = ToolInput(
                parameters=parameters,
                user_id=input_data.user_id,
                context=input_data
            )
            
            # Check if background mode is requested
            background_mode = parameters.get('background', False)
            if hasattr(tool.execute, '__code__') and 'background' in tool.execute.__code__.co_varnames:
                result = await tool.execute(tool_input, background=background_mode)
            else:
                result = await tool.execute(tool_input)
            
            return AgentOutput(
                success=result.success,
                data=result.data,
                error=result.error,
                metadata=create_agent_metadata(self.name, time.time() - start_time)
            )
            
        except Exception as error:
            logger.exception(f"{self.name} execution error: {error}")
            return AgentOutput(
                success=False,
                error=f"Agent execution failed: {str(error)}",
                metadata=create_agent_metadata(self.name, time.time() - start_time)
            )


class SingleToolAgent(StandardAgent):
    """
    Agent that wraps a single tool with simplified interface.
    Perfect for agents that only need one tool.
    """
    
    def __init__(
        self,
        name: str,
        slug: str,
        short_description: str,
        description: str,
        tool: BaseTool,
        version: str = "1.0.0",
        is_public: bool = False
    ):
        """
        Initialize single-tool agent.
        
        Args:
            name: Agent display name
            slug: Agent slug identifier
            short_description: Brief description
            description: Detailed description
            tool: The single tool this agent provides
            version: Agent version
            is_public: Whether agent is publicly accessible
        """
        super().__init__(
            name=name,
            slug=slug,
            short_description=short_description,
            description=description,
            tools={tool.slug: tool},
            version=version,
            is_public=is_public
        )
        
        self.primary_tool = tool
    
    async def execute(self, input_data: AgentInput) -> AgentOutput:
        """
        Execute the single tool directly or with action parameter.
        
        Args:
            input_data: Agent input data
            
        Returns:
            AgentOutput with execution results
        """
        import time
        start_time = time.time()
        
        try:
            parameters = input_data.parameters
            
            # If no action is specified, use the primary tool
            action = parameters.get('action', self.primary_tool.slug)
            
            # Override action to use primary tool
            if action != self.primary_tool.slug:
                # Allow the primary tool slug as action
                parameters['action'] = self.primary_tool.slug
                input_data.parameters = parameters
            
            # Use standard execution
            return await super().execute(input_data)
            
        except Exception as error:
            logger.exception(f"{self.name} execution error: {error}")
            return AgentOutput(
                success=False,
                error=f"Agent execution failed: {str(error)}",
                metadata=create_agent_metadata(self.name, time.time() - start_time)
            )


# Factory functions for easy agent creation
def create_standard_agent(
    name: str,
    slug: str,
    short_description: str,
    description: str,
    tools: Dict[str, BaseTool],
    **kwargs
) -> StandardAgent:
    """
    Factory function to create standard agents.
    
    Args:
        name: Agent display name
        slug: Agent slug identifier
        short_description: Brief description
        description: Detailed description
        tools: Dictionary of tools {slug: tool_instance}
        **kwargs: Additional arguments (version, is_public, etc.)
        
    Returns:
        Configured StandardAgent instance
    """
    return StandardAgent(
        name=name,
        slug=slug,
        short_description=short_description,
        description=description,
        tools=tools,
        **kwargs
    )


def create_single_tool_agent(
    name: str,
    slug: str,
    short_description: str,
    description: str,
    tool: BaseTool,
    **kwargs
) -> SingleToolAgent:
    """
    Factory function to create single-tool agents.
    
    Args:
        name: Agent display name
        slug: Agent slug identifier
        short_description: Brief description
        description: Detailed description
        tool: The single tool this agent provides
        **kwargs: Additional arguments (version, is_public, etc.)
        
    Returns:
        Configured SingleToolAgent instance
    """
    return SingleToolAgent(
        name=name,
        slug=slug,
        short_description=short_description,
        description=description,
        tool=tool,
        **kwargs
    )


class AgentAutoRegistry:
    """
    Auto-registration system for agents.
    Automatically registers agents when they are created.
    """
    
    _auto_register = True
    
    @classmethod
    def enable_auto_registration(cls):
        """Enable automatic agent registration."""
        cls._auto_register = True
    
    @classmethod
    def disable_auto_registration(cls):
        """Disable automatic agent registration."""
        cls._auto_register = False
    
    @classmethod
    def register_agent(cls, agent: BaseAgent):
        """Register an agent if auto-registration is enabled."""
        if cls._auto_register:
            from ..base import AgentRegistry
            AgentRegistry.register(agent.slug, agent)
            logger.info(f"Auto-registered agent: {agent.slug}")


# Enhanced factory functions with auto-registration
def create_and_register_standard_agent(
    name: str,
    slug: str,
    short_description: str,
    description: str,
    tools: Dict[str, BaseTool],
    **kwargs
) -> StandardAgent:
    """
    Create and auto-register a standard agent.
    
    Args:
        name: Agent display name
        slug: Agent slug identifier
        short_description: Brief description
        description: Detailed description
        tools: Dictionary of tools {slug: tool_instance}
        **kwargs: Additional arguments
        
    Returns:
        Configured and registered StandardAgent instance
    """
    agent = create_standard_agent(
        name=name,
        slug=slug,
        short_description=short_description,
        description=description,
        tools=tools,
        **kwargs
    )
    
    AgentAutoRegistry.register_agent(agent)
    return agent


def create_and_register_single_tool_agent(
    name: str,
    slug: str,
    short_description: str,
    description: str,
    tool: BaseTool,
    **kwargs
) -> SingleToolAgent:
    """
    Create and auto-register a single-tool agent.
    
    Args:
        name: Agent display name
        slug: Agent slug identifier
        short_description: Brief description
        description: Detailed description
        tool: The single tool this agent provides
        **kwargs: Additional arguments
        
    Returns:
        Configured and registered SingleToolAgent instance
    """
    agent = create_single_tool_agent(
        name=name,
        slug=slug,
        short_description=short_description,
        description=description,
        tool=tool,
        **kwargs
    )
    
    AgentAutoRegistry.register_agent(agent)
    return agent


# Decorator for automatic agent registration
def auto_register_agent(agent_class: Type[BaseAgent]):
    """
    Decorator to automatically register agent classes.
    
    Args:
        agent_class: Agent class to register
        
    Returns:
        The same agent class (for chaining)
    """
    original_init = agent_class.__init__
    
    def new_init(self, *args, **kwargs):
        original_init(self, *args, **kwargs)
        AgentAutoRegistry.register_agent(self)
    
    agent_class.__init__ = new_init
    return agent_class