from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List, Tuple
from datetime import datetime
from dataclasses import dataclass
import time


# Agent Capabilities Structure
@dataclass
class AgentCapabilities:
    tools: Dict[str, Any]
    resources: Dict[str, Any]
    prompts: Dict[str, Any]
    logging: Dict[str, Any]


# Agent Input/Output Types
@dataclass
class AgentInput:
    agent_type: str
    parameters: Dict[str, Any]
    business_profile_id: Optional[int] = None
    language: Optional[str] = None
    user_id: Optional[int] = None


@dataclass
class AgentMetadata:
    agent_name: str
    execution_time: float
    timestamp: str


@dataclass
class AgentOutput:
    success: bool
    data: Optional[Any] = None
    error: Optional[str] = None
    metadata: Optional[AgentMetadata] = None


# Base Agent Interface
class BaseAgent(ABC):
    def __init__(
        self,
        name: str,
        slug: str,
        short_description: str,
        description: str,
        version: str,
        capabilities: AgentCapabilities
    ):
        self.name = name
        self.slug = slug
        self.short_description = short_description
        self.description = description
        self.version = version
        self.capabilities = capabilities

    @abstractmethod
    async def execute(self, input_data: AgentInput) -> AgentOutput:
        """Execute method that all agents must implement"""
        pass


# Agent Registry for managing available agents
class AgentRegistry:
    _agents: Dict[str, BaseAgent] = {}

    @classmethod
    def register(cls, agent_type: str, agent: BaseAgent) -> None:
        """Register an agent with the registry"""
        cls._agents[agent_type] = agent

    @classmethod
    def get(cls, agent_type: str) -> Optional[BaseAgent]:
        """Get an agent by type"""
        return cls._agents.get(agent_type)

    @classmethod
    def get_all(cls) -> Dict[str, BaseAgent]:
        """Get all registered agents"""
        return cls._agents.copy()

    @classmethod
    def list_agents(cls) -> List[Tuple[str, BaseAgent]]:
        """List all agents as tuples of (type, agent)"""
        return list(cls._agents.items())

    @classmethod
    def clear(cls) -> None:
        """Clear all registered agents (useful for testing)"""
        cls._agents.clear()


# Utility function to create agent metadata
def create_agent_metadata(agent_name: str, execution_time: float) -> AgentMetadata:
    """Create agent metadata with execution time and timestamp"""
    return AgentMetadata(
        agent_name=agent_name,
        execution_time=execution_time,
        timestamp=datetime.now().isoformat()
    )


# Example usage and helper functions
class ExampleAgent(BaseAgent):
    """Example implementation of a BaseAgent"""
    
    def __init__(self):
        capabilities = AgentCapabilities(
            tools={"example_tool": "some_config"},
            resources={"example_resource": "some_config"},
            prompts={"example_prompt": "Hello, {name}!"},
            logging={"level": "INFO"}
        )
        
        super().__init__(
            name="ExampleAgent",
            slug="example-agent",
            short_description="An example agent",
            description="This is an example agent implementation",
            version="1.0.0",
            capabilities=capabilities
        )

    async def execute(self, input_data: AgentInput) -> AgentOutput:
        """Example implementation of the execute method"""
        start_time = time.time()
        
        try:
            # Example processing logic
            result = f"Processed input for agent type: {input_data.agent_type}"
            execution_time = time.time() - start_time
            
            return AgentOutput(
                success=True,
                data=result,
                metadata=create_agent_metadata(self.name, execution_time)
            )
        except Exception as e:
            execution_time = time.time() - start_time
            return AgentOutput(
                success=False,
                error=str(e),
                metadata=create_agent_metadata(self.name, execution_time)
            )
