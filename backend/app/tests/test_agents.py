"""
Tests for the Agent System
Tests agent registration, execution, and tool functionality.
"""

import pytest
import json
from app.agents import AgentRegistry, ConciergeAgent, initialize_agents
from app.agents.base import AgentInput
from app.utils.messages import (
    AGENT_ACTION_PARAMETER_REQUIRED, AGENT_UNKNOWN_ACTION,
    TOOL_URL_PARAMETER_REQUIRED, TOOL_INVALID_URL_FORMAT,
    ERROR_VALIDATION_ERROR, ERROR_NOT_FOUND, ERROR_UNAUTHORIZED,
    ERROR_SERVER_ERROR
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
    # Check that we get business profile data directly (new structure)
    assert 'company_name' in result.data
    assert 'website_url' in result.data
    assert result.data['website_url'] == 'https://example.com'
    assert 'target_customer' in result.data
    assert 'offer' in result.data
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


# ============================================================================
# INTERACTION API TESTS
# ============================================================================

def test_list_agents_api(client):
    """Test GET /api/agents endpoint"""
    response = client.get('/api/agents')

    assert response.status_code == 200
    data = response.get_json()
    assert 'data' in data
    assert isinstance(data['data'], list)
    assert len(data['data']) >= 1  # Should have at least concierge agent

    # Check agent structure
    agent = data['data'][0]
    assert 'id' in agent
    assert 'name' in agent
    assert 'slug' in agent
    assert 'description' in agent
    assert 'tools' in agent
    assert isinstance(agent['tools'], list)


def test_get_agent_api(client):
    """Test GET /api/agents/:slug endpoint"""
    response = client.get('/api/agents/business-concierge')

    assert response.status_code == 200
    data = response.get_json()
    assert 'id' in data
    assert 'name' in data
    assert 'slug' in data
    assert 'description' in data
    assert 'tools' in data
    assert data['slug'] == 'business-concierge'


def test_get_agent_not_found_api(client):
    """Test GET /api/agents/:slug endpoint with non-existent agent"""
    response = client.get('/api/agents/non-existent-agent')

    assert response.status_code == 404
    data = response.get_json()
    assert data['error'] == ERROR_NOT_FOUND


def test_get_agent_tools_api(client, test_user_headers):
    """Test GET /api/agents/:slug/tools endpoint"""
    response = client.get('/api/agents/business-concierge/tools', headers=test_user_headers)

    assert response.status_code == 200
    data = response.get_json()
    assert 'data' in data
    assert isinstance(data['data'], list)
    assert len(data['data']) >= 1  # Should have analyze-website tool

    # Check tool structure
    tool = data['data'][0]
    assert 'name' in tool
    assert 'slug' in tool
    assert 'description' in tool


def test_execute_tool_unauthorized(client):
    """Test POST /api/agents/:slug/tools/:tool_slug/call without authentication"""
    # Note: concierge agent is now public, so it should work without authentication
    # but no interaction will be created since user is not authenticated
    response = client.post('/api/agents/business-concierge/tools/analyze-website/call', json={
        'input': {'url': 'https://example.com'}
    })

    assert response.status_code == 200
    data = response.get_json()
    assert 'interaction_id' not in data  # No interaction for unauthenticated users
    assert 'status' in data
    assert data['status'] == 'completed'


def test_execute_tool_success(client, test_user_headers):
    """Test POST /api/agents/:slug/tools/:tool_slug/call success case"""
    response = client.post('/api/agents/business-concierge/tools/analyze-website/call',
                         json={
                             'business_profile_id': 'test-profile-id',
                             'input': {
                                 'url': 'https://example.com'
                             }
                         },
                         headers=test_user_headers)

    assert response.status_code == 200
    data = response.get_json()
    assert 'interaction_id' in data  # Should have interaction_id for authenticated users
    assert 'status' in data
    assert data['status'] == 'completed'

    # Verify interaction was created
    interaction_id = data['interaction_id']
    assert interaction_id is not None


def test_execute_tool_invalid_agent(client, test_user_headers):
    """Test POST /api/agents/:slug/tools/:tool_slug/call with invalid agent"""
    response = client.post('/api/agents/invalid-agent/tools/analyze-website/call',
                         json={'input': {'url': 'https://example.com'}},
                         headers=test_user_headers)

    assert response.status_code == 404
    data = response.get_json()
    assert data['error'] == ERROR_NOT_FOUND


def test_execute_tool_invalid_tool(client, test_user_headers):
    """Test POST /api/agents/:slug/tools/:tool_slug/call with invalid tool"""
    response = client.post('/api/agents/business-concierge/tools/invalid-tool/call',
                         json={'input': {'url': 'https://example.com'}},
                         headers=test_user_headers)

    assert response.status_code == 404
    data = response.get_json()
    assert data['error'] == ERROR_NOT_FOUND


def test_execute_tool_missing_url(client, test_user_headers):
    """Test POST /api/agents/:slug/tools/:tool_slug/call with missing URL"""
    response = client.post('/api/agents/business-concierge/tools/analyze-website/call',
                         json={'input': {}},  # Missing URL
                         headers=test_user_headers)

    assert response.status_code == 500
    data = response.get_json()
    assert data['error'] == ERROR_SERVER_ERROR


def test_get_interaction_success(client, test_user_headers):
    """Test GET /api/interactions/:interaction_id success case"""
    # First create an interaction
    response = client.post('/api/agents/business-concierge/tools/analyze-website/call',
                         json={'input': {'url': 'https://example.com'}},
                         headers=test_user_headers)

    interaction_id = response.get_json()['interaction_id']

    # Now get the interaction
    response = client.get(f'/api/agents/interactions/{interaction_id}', headers=test_user_headers)

    assert response.status_code == 200
    data = response.get_json()
    assert 'id' in data
    assert 'status' in data
    assert 'output' in data
    assert 'agent_name' in data
    assert 'tool_name' in data
    assert data['id'] == interaction_id
    assert data['agent_name'] == 'Concierge Agent'
    assert data['tool_name'] == 'analyze-website'


def test_get_interaction_not_found(client, test_user_headers):
    """Test GET /api/interactions/:interaction_id with non-existent interaction"""
    response = client.get('/api/agents/interactions/non-existent-id', headers=test_user_headers)

    assert response.status_code == 404
    data = response.get_json()
    if data:  # Only check if data is not None
        assert data['error'] == ERROR_NOT_FOUND


def test_get_interaction_unauthorized(client):
    """Test GET /api/interactions/:interaction_id without authentication"""
    response = client.get('/api/agents/interactions/test-id')

    assert response.status_code == 401


def test_list_interactions_success(client, test_user_headers):
    """Test GET /api/interactions success case"""
    # Create a few interactions first
    client.post('/api/agents/business-concierge/tools/analyze-website/call',
               json={'input': {'url': 'https://example1.com'}},
               headers=test_user_headers)

    client.post('/api/agents/business-concierge/tools/analyze-website/call',
               json={'input': {'url': 'https://example2.com'}},
               headers=test_user_headers)

    # Now list interactions
    response = client.get('/api/agents/interactions', headers=test_user_headers)

    assert response.status_code == 200
    data = response.get_json()
    assert 'data' in data
    assert isinstance(data['data'], list)
    assert len(data['data']) >= 2  # Should have at least the 2 we created

    # Check interaction structure
    interaction = data['data'][0]
    assert 'id' in interaction
    assert 'agent_name' in interaction
    assert 'tool_name' in interaction
    assert 'status' in interaction
    assert 'created_at' in interaction


def test_list_interactions_empty(client, test_user_headers):
    """Test GET /api/interactions when no interactions exist"""
    # Make sure we have a fresh user with no interactions
    response = client.get('/api/agents/interactions', headers=test_user_headers)

    assert response.status_code == 200
    data = response.get_json()
    assert 'data' in data
    assert isinstance(data['data'], list)


def test_list_interactions_unauthorized(client):
    """Test GET /api/interactions without authentication"""
    response = client.get('/api/agents/interactions')

    assert response.status_code == 401


# ============================================================================
# COMPREHENSIVE API ENDPOINT TESTS
# ============================================================================

def test_agent_slug_field():
    """Test that agents have proper slug fields"""
    from app.agents.concierge import ConciergeAgent

    agent = ConciergeAgent()
    assert hasattr(agent, 'slug')
    assert agent.slug == 'business-concierge'
    assert agent.slug is not None
    assert isinstance(agent.slug, str)


def test_agent_public_field():
    """Test that agents have proper is_public fields"""
    from app.agents.concierge import ConciergeAgent
    from app.agents.base import ExampleAgent

    # Concierge agent should be public
    concierge_agent = ConciergeAgent()
    assert hasattr(concierge_agent, 'is_public')
    assert concierge_agent.is_public is True

    # Example agent should be private by default
    example_agent = ExampleAgent()
    assert hasattr(example_agent, 'is_public')
    assert example_agent.is_public is False


def test_tool_slug_field():
    """Test that tools have proper slug fields"""
    from app.agents.concierge.tools.analyzewebsiteTool import AnalyzeWebsiteTool

    tool = AnalyzeWebsiteTool()
    assert hasattr(tool, 'slug')
    assert tool.slug == 'analyze-website'
    assert tool.slug is not None
    assert isinstance(tool.slug, str)


def test_api_response_structure_agents(client):
    """Test that API responses have correct structure for agents"""
    response = client.get('/api/agents')
    assert response.status_code == 200

    data = response.get_json()
    assert 'data' in data
    assert isinstance(data['data'], list)

    if len(data['data']) > 0:
        agent = data['data'][0]
        required_fields = ['id', 'name', 'slug', 'description', 'tools']
        for field in required_fields:
            assert field in agent

        # Test tools structure
        if len(agent['tools']) > 0:
            tool = agent['tools'][0]
            assert 'name' in tool
            assert 'slug' in tool


def test_api_response_structure_single_agent(client):
    """Test that single agent API response has correct structure"""
    response = client.get('/api/agents/business-concierge')
    assert response.status_code == 200

    data = response.get_json()
    required_fields = ['id', 'name', 'slug', 'description', 'tools']
    for field in required_fields:
        assert field in data

    assert data['slug'] == 'business-concierge'


def test_api_response_structure_agent_tools(client, test_user_headers):
    """Test that agent tools API response has correct structure"""
    response = client.get('/api/agents/business-concierge/tools', headers=test_user_headers)
    assert response.status_code == 200

    data = response.get_json()
    assert 'data' in data
    assert isinstance(data['data'], list)

    if len(data['data']) > 0:
        tool = data['data'][0]
        required_fields = ['name', 'slug', 'description']
        for field in required_fields:
            assert field in tool


def test_api_response_structure_tool_execution(client, test_user_headers):
    """Test that tool execution API response has correct structure"""
    response = client.post('/api/agents/business-concierge/tools/analyze-website/call',
                         json={'input': {'url': 'https://example.com'}},
                         headers=test_user_headers)
    assert response.status_code == 200

    data = response.get_json()
    assert 'interaction_id' in data  # Should have interaction_id for authenticated users
    assert 'status' in data
    assert data['status'] == 'completed'


def test_api_response_structure_interactions_list(client, test_user_headers):
    """Test that interactions list API response has correct structure"""
    # First create an interaction
    client.post('/api/agents/business-concierge/tools/analyze-website/call',
               json={'input': {'url': 'https://example.com'}},
               headers=test_user_headers)

    response = client.get('/api/agents/interactions', headers=test_user_headers)
    assert response.status_code == 200

    data = response.get_json()
    assert 'data' in data
    assert isinstance(data['data'], list)

    if len(data['data']) > 0:
        interaction = data['data'][0]
        required_fields = ['id', 'agent_name', 'tool_name', 'status', 'created_at']
        for field in required_fields:
            assert field in interaction


def test_api_response_structure_single_interaction(client, test_user_headers):
    """Test that single interaction API response has correct structure"""
    # First create an interaction
    response = client.post('/api/agents/business-concierge/tools/analyze-website/call',
                         json={'input': {'url': 'https://example.com'}},
                         headers=test_user_headers)

    interaction_id = response.get_json()['interaction_id']

    # Now get the interaction
    response = client.get(f'/api/agents/interactions/{interaction_id}', headers=test_user_headers)
    assert response.status_code == 200

    data = response.get_json()
    required_fields = ['id', 'status', 'output', 'agent_name', 'tool_name']
    for field in required_fields:
        assert field in data

    assert data['id'] == interaction_id
    assert data['agent_name'] == 'Concierge Agent'
    assert data['tool_name'] == 'analyze-website'


def test_public_agent_access_without_authentication(client):
    """Test that public agents can be accessed without authentication"""
    # Test public agent list access without auth
    response = client.get('/api/agents')
    assert response.status_code == 200

    # Test public agent details access without auth
    response = client.get('/api/agents/business-concierge')
    assert response.status_code == 200

    # Test public agent tools access without auth
    response = client.get('/api/agents/business-concierge/tools')
    assert response.status_code == 200

    # Test public agent tool execution without auth (no interaction created for anonymous users)
    response = client.post('/api/agents/business-concierge/tools/analyze-website/call',
                         json={'input': {'url': 'https://example.com'}})
    assert response.status_code == 200
    data = response.get_json()
    assert 'interaction_id' not in data  # No interaction for unauthenticated users
    assert 'status' in data
    assert data['status'] == 'completed'


def test_public_agent_with_authenticated_user(client, test_user_headers):
    """Test that public agents create interactions when accessed by authenticated users"""
    # Test public agent tool execution with authenticated user (interaction should be created)
    response = client.post('/api/agents/business-concierge/tools/analyze-website/call',
                         json={'input': {'url': 'https://example.com'}},
                         headers=test_user_headers)
    assert response.status_code == 200
    data = response.get_json()
    assert 'interaction_id' in data  # Should have interaction_id for authenticated users
    assert 'status' in data
    assert data['status'] == 'completed'


def test_private_agent_requires_authentication(client):
    """Test that private agents require authentication"""
    # Register a private agent for testing
    from app.agents.base import AgentRegistry, AgentCapabilities
    from app.agents.base import BaseAgent

    class PrivateAgent(BaseAgent):
        def __init__(self):
            capabilities = AgentCapabilities(
                tools={},
                resources={},
                prompts={},
                logging={}
            )
            super().__init__(
                name='Private Agent',
                slug='private-agent',
                short_description='A private agent for testing',
                description='This is a private agent that requires authentication',
                version='1.0.0',
                capabilities=capabilities,
                is_public=False
            )

        async def execute(self, input_data):
            return {"message": "Private agent executed"}

    # Register the private agent
    private_agent = PrivateAgent()
    AgentRegistry.register('private-agent', private_agent)

    try:
        # Test that private agent tools require authentication
        response = client.get('/api/agents/private-agent/tools')
        assert response.status_code == 401

        # Test that private agent tool execution requires authentication
        response = client.post('/api/agents/private-agent/tools/some-tool/call',
                             json={'input': {}})
        assert response.status_code == 401

    finally:
        # Clean up
        AgentRegistry._agents.pop('private-agent', None)


def test_api_error_responses(client, test_user_headers):
    """Test that API error responses have correct structure"""
    # Test 404 for non-existent agent
    response = client.get('/api/agents/non-existent-agent')
    assert response.status_code == 404
    data = response.get_json()
    assert 'error' in data
    assert 'message' in data

    # Test 404 for non-existent tool
    response = client.post('/api/agents/business-concierge/tools/non-existent-tool/call',
                         json={'input': {}},
                         headers=test_user_headers)
    assert response.status_code == 404
    data = response.get_json()
    assert 'error' in data
    assert 'message' in data

    # Test 401 for unauthorized access to private agents (if we had any)
    # This test would be for private agents only


def test_api_input_validation(client, test_user_headers):
    """Test API input validation"""
    # Test tool execution with missing URL
    response = client.post('/api/agents/business-concierge/tools/analyze-website/call',
                         json={'input': {}},  # Missing URL
                         headers=test_user_headers)
    assert response.status_code == 500
    data = response.get_json()
    assert 'error' in data

    # Test tool execution with invalid URL
    response = client.post('/api/agents/business-concierge/tools/analyze-website/call',
                         json={'input': {'url': 'not-a-valid-url'}},
                         headers=test_user_headers)
    assert response.status_code == 500
    data = response.get_json()
    assert 'error' in data


def test_api_pagination_and_filtering(client, test_user_headers):
    """Test API pagination and filtering capabilities"""
    # Create multiple interactions
    for i in range(3):
        client.post('/api/agents/business-concierge/tools/analyze-website/call',
                   json={'input': {'url': f'https://example{i}.com'}},
                   headers=test_user_headers)

    # Test interactions list
    response = client.get('/api/agents/interactions', headers=test_user_headers)
    assert response.status_code == 200
    data = response.get_json()
    assert len(data['data']) >= 3


def test_api_cross_references(client):
    """Test that API responses are consistent across different endpoints"""
    # Get agent from list
    response = client.get('/api/agents')
    agents_data = response.get_json()['data']
    agent_from_list = agents_data[0]

    # Get same agent individually
    response = client.get(f'/api/agents/{agent_from_list["slug"]}')
    agent_individual = response.get_json()

    # Compare key fields
    assert agent_from_list['id'] == agent_individual['id']
    assert agent_from_list['name'] == agent_individual['name']
    assert agent_from_list['slug'] == agent_individual['slug']

    # Compare tools
    tools_from_list = agent_from_list['tools']
    tools_individual = agent_individual['tools']

    assert len(tools_from_list) == len(tools_individual)
    if len(tools_from_list) > 0:
        assert tools_from_list[0]['slug'] == tools_individual[0]['slug']


def test_api_response_consistency(client):
    """Test that API responses are consistent in format and structure"""
    endpoints = [
        '/api/agents',
        '/api/agents/business-concierge'
    ]

    for endpoint in endpoints:
        response = client.get(endpoint)
        assert response.status_code == 200
        data = response.get_json()

        # All endpoints should return proper JSON
        assert isinstance(data, dict)

        # Error endpoints should have error structure
        if 'error' in data:
            assert 'message' in data


def test_debug_interaction_creation(client, test_user_headers):
    """Debug test to understand interaction creation/retrieval issue"""
    from flask_jwt_extended import decode_token

    # First, let's see what user ID is in the JWT token
    auth_header = test_user_headers['Authorization']
    token = auth_header.split(' ')[1]  # Remove 'Bearer ' prefix
    decoded = decode_token(token)
    jwt_user_id = decoded['sub']
    print(f"JWT User ID: {jwt_user_id}")

    # Create an interaction
    response = client.post('/api/agents/business-concierge/tools/analyze-website/call',
                         json={'input': {'url': 'https://example.com'}},
                         headers=test_user_headers)

    assert response.status_code == 200
    data = response.get_json()
    interaction_id = data['interaction_id']
    print(f"Created interaction ID: {interaction_id}")

    # Check if interaction exists in database
    from app.models.interaction import Interaction
    from app import db

    interaction = Interaction.query.filter_by(id=interaction_id).first()
    if interaction:
        print(f"Interaction found - User ID: {interaction.user_id}, Status: {interaction.status}")
    else:
        print("Interaction NOT found in database")

    # Try to retrieve via API
    response = client.get(f'/api/agents/interactions/{interaction_id}', headers=test_user_headers)
    print(f"API retrieval status: {response.status_code}")

    if response.status_code != 200:
        data = response.get_json()
        print(f"API error: {data}")


# ============================================================================
# OPENAI INTEGRATION TESTS
# ============================================================================

def test_openai_client_initialization():
    """Test OpenAI client initialization and configuration"""
    from app.services.openai_client import OpenAIClient
    from app.agents.shared.base_tool import OpenAIConfig, OpenAIMode

    # Test with valid config
    openai_config = OpenAIConfig(
        mode=OpenAIMode.PROMPT_ID,
        prompt_id="test-prompt-id",
        model="gpt-4o"
    )

    client = OpenAIClient(openai_config)

    assert client.config.prompt_id == "test-prompt-id"
    assert client.config.model == "gpt-4o"
    assert client.config.mode == OpenAIMode.PROMPT_ID


def test_base_tool_openai_fields():
    """Test BaseTool OpenAI integration fields"""
    from app.agents.shared.base_tool import BaseTool, ToolInput, ToolOutput, ToolConfig, OpenAIConfig, OpenAIMode

    # Create a concrete implementation for testing
    class TestTool(BaseTool):
        async def execute(self, input_data: ToolInput) -> ToolOutput:
            return ToolOutput(success=True, data="test")

    # Test with prompt_id
    tool_config = ToolConfig(
        name="Test Tool",
        slug="test-tool",
        description="A test tool",
        version="1.0.0"
    )

    openai_config = OpenAIConfig(
        mode=OpenAIMode.PROMPT_ID,
        prompt_id="pmpt_test123",
        model="gpt-4o"
    )

    tool_with_prompt = TestTool(
        config=tool_config,
        openai_config=openai_config
    )

    assert tool_with_prompt.config.name == "Test Tool"
    assert tool_with_prompt.openai_config.prompt_id == "pmpt_test123"
    assert tool_with_prompt.openai_config.model == "gpt-4o"

    # Test with system_message
    tool_config2 = ToolConfig(
        name="Test Tool 2",
        slug="test-tool-2",
        description="Another test tool",
        version="1.0.0"
    )

    openai_config2 = OpenAIConfig(
        mode=OpenAIMode.SYSTEM_MESSAGE,
        system_message="You are a helpful assistant",
        model="gpt-4o"
    )

    tool_with_system = TestTool(
        config=tool_config2,
        openai_config=openai_config2
    )

    assert tool_with_system.openai_config.system_message == "You are a helpful assistant"
    assert tool_with_system.openai_config.prompt_id is None

    # Test validation - invalid OpenAI config should raise error
    with pytest.raises(ValueError, match="prompt_id required when mode is PROMPT_ID"):
        invalid_openai_config = OpenAIConfig(
            mode=OpenAIMode.PROMPT_ID,
            prompt_id=None  # This should raise an error
        )

    # Test that OpenAIConfig allows both fields to be set (no validation error)
    # This tests that the config is flexible enough to handle different scenarios
    config_with_both = OpenAIConfig(
        mode=OpenAIMode.PROMPT_ID,
        system_message="You are helpful",
        prompt_id="pmpt_test123"
    )
    assert config_with_both.prompt_id == "pmpt_test123"
    assert config_with_both.system_message == "You are helpful"


def test_analyze_website_tool_openai_integration():
    """Test that AnalyzeWebsiteTool is properly configured for OpenAI"""
    from app.agents.concierge.tools.analyzewebsiteTool import AnalyzeWebsiteTool
    from app.agents.shared.base_tool import OpenAIMode

    tool = AnalyzeWebsiteTool()

    # Check OpenAI configuration
    assert tool.openai_config.prompt_id == 'pmpt_68aec68cbe2081909e109ce3b087d6ba07eff42b26c15bb8'
    assert tool.openai_config.system_message is None
    assert tool.openai_config.model == "gpt-4o"
    assert tool.openai_config.mode == OpenAIMode.PROMPT_ID
    assert tool.config.name == "Analyze Website"
    assert tool.config.slug == "analyze-website"


@pytest.mark.asyncio
async def test_openai_call_with_prompt_id():
    """Test OpenAI call using prompt_id approach"""
    from app.agents.shared.base_tool import BaseTool, ToolInput, ToolOutput

    # Create concrete implementation that uses call_openai
    class MockTool(BaseTool):
        async def execute(self, input_data: ToolInput) -> ToolOutput:
            # Prepare user input
            user_input = f"Analyze: {input_data.parameters.get('url', 'unknown')}"

            # Call OpenAI
            openai_result = self.call_openai(user_input)

            if not openai_result['success']:
                return ToolOutput(
                    success=False,
                    error=f"OpenAI API error: {openai_result['error']}"
                )

            # Return formatted result
            return ToolOutput(
                success=True,
                data={
                    'analysis': openai_result['content'],
                    'source_url': input_data.parameters.get('url'),
                    'openai_model': openai_result.get('model'),
                    'openai_usage': openai_result.get('usage')
                }
            )

    # Mock tool with prompt_id
    from app.agents.shared.base_tool import ToolConfig, OpenAIConfig, OpenAIMode

    tool_config = ToolConfig(
        name="Mock Tool",
        slug="mock-tool",
        description="Mock tool for testing"
    )

    openai_config = OpenAIConfig(
        mode=OpenAIMode.PROMPT_ID,
        prompt_id="pmpt_test123",
        model="gpt-4o"
    )

    tool = MockTool(
        config=tool_config,
        openai_config=openai_config
    )

    # Mock the call_openai method to avoid actual API call
    def mock_openai_call(user_input, **kwargs):
        return {
            'success': True,
            'content': f'OpenAI response for: {user_input}',
            'model': 'gpt-4o',
            'usage': {'prompt_tokens': 10, 'completion_tokens': 20, 'total_tokens': 30},
            'response_id': 'resp_test123'
        }

    tool.call_openai = mock_openai_call

    # Test execution
    input_data = ToolInput(
        parameters={'url': 'https://example.com'},
        user_id='test-user'
    )

    result = await tool.execute(input_data)

    assert result.success is True
    assert 'analysis' in result.data
    assert result.data['source_url'] == 'https://example.com'
    assert 'openai_model' in result.data
    assert 'openai_usage' in result.data


@pytest.mark.asyncio
async def test_openai_call_with_system_message():
    """Test OpenAI call using system message approach"""
    from app.agents.shared.base_tool import BaseTool, ToolInput, ToolOutput, ToolConfig, OpenAIConfig, OpenAIMode

    # Create concrete implementation that uses call_openai
    class MockTool(BaseTool):
        async def execute(self, input_data: ToolInput) -> ToolOutput:
            # Prepare user input
            user_input = input_data.parameters.get('query', 'unknown query')

            # Call OpenAI
            openai_result = self.call_openai(user_input)

            if not openai_result['success']:
                return ToolOutput(
                    success=False,
                    error=f"OpenAI API error: {openai_result['error']}"
                )

            # Return formatted result
            return ToolOutput(
                success=True,
                data={
                    'analysis': openai_result['content'],
                    'query': user_input,
                    'openai_model': openai_result.get('model'),
                    'openai_usage': openai_result.get('usage')
                }
            )

    # Mock tool with system message
    tool_config = ToolConfig(
        name="Mock Tool",
        slug="mock-tool",
        description="Mock tool for testing"
    )

    openai_config = OpenAIConfig(
        mode=OpenAIMode.SYSTEM_MESSAGE,
        system_message="You are a helpful business analyst.",
        model="gpt-4o"
    )

    tool = MockTool(
        config=tool_config,
        openai_config=openai_config
    )

    # Mock the call_openai method to avoid actual API call
    def mock_openai_call(user_input, **kwargs):
        return {
            'success': True,
            'content': f'Analysis result for: {user_input}',
            'model': 'gpt-4o',
            'usage': {'prompt_tokens': 15, 'completion_tokens': 25, 'total_tokens': 40}
        }

    tool.call_openai = mock_openai_call

    # Test execution
    input_data = ToolInput(
        parameters={'query': 'Analyze this business'},
        user_id='test-user'
    )

    result = await tool.execute(input_data)

    assert result.success is True
    assert 'analysis' in result.data


@pytest.mark.asyncio
async def test_openai_call_error_handling():
    """Test error handling in OpenAI calls"""
    from app.agents.shared.base_tool import BaseTool, ToolInput, ToolOutput

    # Create concrete implementation that uses call_openai
    class ErrorTool(BaseTool):
        async def execute(self, input_data: ToolInput) -> ToolOutput:
            # Prepare user input
            user_input = f"Test input: {input_data.parameters.get('url', 'unknown')}"

            # Call OpenAI (which will return error)
            openai_result = self.call_openai(user_input)

            if not openai_result['success']:
                return ToolOutput(
                    success=False,
                    error=f"OpenAI API error: {openai_result['error']}"
                )

            return ToolOutput(success=True, data="success")

    from app.agents.shared.base_tool import ToolConfig, OpenAIConfig, OpenAIMode

    tool_config = ToolConfig(
        name="Error Tool",
        slug="error-tool",
        description="Tool that simulates errors"
    )

    openai_config = OpenAIConfig(
        mode=OpenAIMode.PROMPT_ID,
        prompt_id="pmpt_error",
        model="gpt-4o"
    )

    tool = ErrorTool(
        config=tool_config,
        openai_config=openai_config
    )

    # Mock error response
    def mock_error_call(user_input, **kwargs):
        return {
            'success': False,
            'error': 'OpenAI API rate limit exceeded',
            'error_type': 'RateLimitError'
        }

    tool.call_openai = mock_error_call

    input_data = ToolInput(
        parameters={'url': 'https://example.com'},
        user_id='test-user'
    )

    result = await tool.execute(input_data)

    assert result.success is False
    assert 'OpenAI API error' in result.error


def test_openai_configuration_in_config():
    """Test that OpenAI configuration is properly loaded"""
    from config import Config

    # Test the Config class directly
    config = Config()

    # Check that OpenAI config attributes exist
    assert hasattr(config, 'OPENAI_API_KEY')
    assert hasattr(config, 'OPENAI_BASE_URL')
    assert hasattr(config, 'OPENAI_DEFAULT_MODEL')

    # Check default values
    assert config.OPENAI_BASE_URL == 'https://api.openai.com/v1'
    assert config.OPENAI_DEFAULT_MODEL == 'gpt-4o'


def test_interaction_model_creation():
    """Test Interaction model creation and methods"""
    from app.models.interaction import Interaction

    interaction = Interaction(
        user_id='test-user-123',
        business_profile_id='test-profile-456',
        agent_type='business-concierge',
        agent_name='Concierge Agent',
        tool_name='analyze-website',
        tool_description='Website analysis tool',
        input_data={'url': 'https://example.com'}
    )

    # Set status explicitly since SQLAlchemy defaults don't apply until database commit
    interaction.status = 'processing'

    assert interaction.user_id == 'test-user-123'
    assert interaction.business_profile_id == 'test-profile-456'
    assert interaction.agent_type == 'business-concierge'
    assert interaction.agent_name == 'Concierge Agent'
    assert interaction.tool_name == 'analyze-website'
    assert interaction.status == 'processing'
    assert interaction.input_data == {'url': 'https://example.com'}

    # Test marking as completed
    interaction.mark_completed(
        output_data={'analysis': 'Test analysis'},
        execution_time=1.5
    )

    assert interaction.status == 'completed'
    assert interaction.output_data == {'analysis': 'Test analysis'}
    assert interaction.execution_time == 1.5

    # Test marking as failed
    interaction.mark_failed(
        error_message='Test error',
        execution_time=0.5
    )

    assert interaction.status == 'failed'
    assert interaction.error_message == 'Test error'
    assert interaction.execution_time == 0.5

    # Test to_dict method
    data = interaction.to_dict()
    assert 'id' in data
    assert 'agent_name' in data
    assert 'tool_name' in data
    assert 'status' in data
    assert 'created_at' in data
    assert data['status'] == 'failed'

    # Test to_detail_dict method
    detail_data = interaction.to_detail_dict()
    assert 'input_data' in detail_data
    assert 'output_data' in detail_data
    assert 'error_message' in detail_data
    assert detail_data['error_message'] == 'Test error'
