"""
Tests for the Agent System
Tests agent registration, execution, and tool functionality.
"""

import pytest
from app.agents import AgentRegistry, ConciergeAgent, initialize_agents
from app.agents.base import AgentInput
from app.utils.messages import (
    AGENT_ACTION_PARAMETER_REQUIRED, AGENT_UNKNOWN_ACTION,
    TOOL_URL_PARAMETER_REQUIRED, TOOL_INVALID_URL_FORMAT
)


@pytest.fixture
def setup_agents():
    """Set up agents for testing"""
    AgentRegistry.clear()
    initialize_agents()
    yield
    AgentRegistry.clear()


def test_agent_registry():
    """Test agent registry functionality"""
    # Clear registry first
    AgentRegistry.clear()

    # Test empty registry
    assert len(AgentRegistry.list_agents()) == 0
    assert AgentRegistry.get('nonexistent') is None

    # Register an agent
    concierge = ConciergeAgent()
    AgentRegistry.register('test-concierge', concierge)

    # Test registration
    assert len(AgentRegistry.list_agents()) == 1
    assert AgentRegistry.get('test-concierge') is concierge

    # Test registry listing
    agents = AgentRegistry.list_agents()
    assert len(agents) == 1
    agent_type, agent = agents[0]
    assert agent_type == 'test-concierge'
    assert agent is concierge


def test_concierge_agent_creation():
    """Test ConciergeAgent creation and properties"""
    agent = ConciergeAgent()

    assert agent.name == 'Concierge Agent'
    assert agent.short_description == 'AI-powered business profile generator from website analysis'
    assert agent.version == '1.0.0'
    assert 'analyze-website' in agent.capabilities.tools


@pytest.mark.asyncio
async def test_concierge_agent_execute_missing_action():
    """Test ConciergeAgent execution with missing action"""
    agent = ConciergeAgent()

    input_data = AgentInput(
        agent_type='business-concierge',
        parameters={}
    )

    result = await agent.execute(input_data)

    assert result.success is False
    assert result.error == AGENT_ACTION_PARAMETER_REQUIRED


@pytest.mark.asyncio
async def test_concierge_agent_execute_invalid_action():
    """Test ConciergeAgent execution with invalid action"""
    agent = ConciergeAgent()

    input_data = AgentInput(
        agent_type='business-concierge',
        parameters={'action': 'invalid-action'}
    )

    result = await agent.execute(input_data)

    assert result.success is False
    assert result.error == AGENT_UNKNOWN_ACTION


@pytest.mark.asyncio
async def test_concierge_agent_execute_analyze_website_missing_url():
    """Test ConciergeAgent analyze-website tool with missing URL"""
    agent = ConciergeAgent()

    input_data = AgentInput(
        agent_type='business-concierge',
        parameters={'action': 'analyze-website'}
    )

    result = await agent.execute(input_data)

    assert result.success is False
    assert result.error == TOOL_URL_PARAMETER_REQUIRED


@pytest.mark.asyncio
async def test_concierge_agent_execute_analyze_website_invalid_url():
    """Test ConciergeAgent analyze-website tool with invalid URL"""
    agent = ConciergeAgent()

    input_data = AgentInput(
        agent_type='business-concierge',
        parameters={
            'action': 'analyze-website',
            'url': 'not-a-valid-url'
        }
    )

    result = await agent.execute(input_data)

    assert result.success is False
    assert result.error == TOOL_INVALID_URL_FORMAT


@pytest.mark.asyncio
async def test_concierge_agent_execute_analyze_website_success():
    """Test ConciergeAgent analyze-website tool success case"""
    agent = ConciergeAgent()

    input_data = AgentInput(
        agent_type='business-concierge',
        parameters={
            'action': 'analyze-website',
            'url': 'https://example.com'
        },
        user_id=1
    )

    result = await agent.execute(input_data)

    assert result.success is True
    assert result.data is not None
    assert 'analysis' in result.data
    assert 'source_url' in result.data
    assert result.data['source_url'] == 'https://example.com'
    assert result.metadata is not None
    assert result.metadata.agent_name == 'Concierge Agent'


def test_initialize_agents(setup_agents):
    """Test agent initialization"""
    agents = AgentRegistry.list_agents()
    assert len(agents) >= 1

    # Check that concierge agent is registered
    agent_types = [agent_type for agent_type, _ in agents]
    assert 'business-concierge' in agent_types


def test_agent_registry_clear():
    """Test agent registry clear functionality"""
    # Register an agent
    concierge = ConciergeAgent()
    AgentRegistry.register('test-concierge', concierge)
    assert len(AgentRegistry.list_agents()) == 1

    # Clear registry
    AgentRegistry.clear()
    assert len(AgentRegistry.list_agents()) == 0


def test_agent_metadata_creation():
    """Test agent metadata creation"""
    from app.agents.base import create_agent_metadata
    import time

    start_time = time.time()
    metadata = create_agent_metadata('TestAgent', 0.5)

    assert metadata.agent_name == 'TestAgent'
    assert metadata.execution_time == 0.5
    assert metadata.timestamp is not None
    assert isinstance(metadata.timestamp, str)


def test_agent_input_creation():
    """Test AgentInput creation"""
    from app.agents.base import AgentInput

    input_data = AgentInput(
        agent_type='test-agent',
        parameters={'key': 'value'},
        user_id=123
    )

    assert input_data.agent_type == 'test-agent'
    assert input_data.parameters == {'key': 'value'}
    assert input_data.user_id == 123


def test_agent_output_creation():
    """Test AgentOutput creation"""
    from app.agents.base import AgentOutput, AgentMetadata

    metadata = AgentMetadata(
        agent_name='TestAgent',
        execution_time=0.5,
        timestamp='2024-01-01T00:00:00'
    )

    output = AgentOutput(
        success=True,
        data={'result': 'success'},
        metadata=metadata
    )

    assert output.success is True
    assert output.data == {'result': 'success'}
    assert output.metadata is metadata
