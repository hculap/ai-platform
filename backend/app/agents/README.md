# Agent System

A modular, extensible agent system for the AI Business Ecosystem that enables AI-powered business analysis and automation.

## 🏗️ Architecture Overview

The agent system is built with a clean, modular architecture:

```
agents/
├── __init__.py          # Agent initialization and registry exports
├── base.py              # Base agent classes and registry
├── shared/              # Shared components for all agents
│   ├── __init__.py      # Shared exports
│   └── base_tool.py     # Universal base tool class
├── concierge/           # Business Concierge Agent
│   ├── __init__.py      # ConciergeAgent implementation
│   └── tools/           # Agent-specific tools
│       ├── __init__.py
│       └── analyzewebsiteTool.py # Website analysis tool
└── README.md           # This documentation
```

## 🎯 Core Components

### Shared Components (`agents/shared/`)
Contains reusable components that can be used by all agents:

- **`BaseTool`**: Universal base class for all tools
- **`ToolInput/ToolOutput`**: Standardized data structures
- **`ToolMetadata`**: Execution metadata and tracking

### AgentRegistry
Central registry for managing all available agents.

```python
from app.agents import AgentRegistry

# Register an agent
AgentRegistry.register('agent-type', agent_instance)

# Get an agent
agent = AgentRegistry.get('agent-type')

# List all agents
agents = AgentRegistry.list_agents()
```

### BaseAgent
Abstract base class that all agents must implement.

**Key Methods:**
- `execute(input_data)` - Main execution method
- Properties: `name`, `short_description`, `description`, `version`, `capabilities`

### AgentInput/AgentOutput
Standardized data structures for agent communication.

## 🤖 Available Agents

### Business Concierge Agent
**Agent Type:** `business-concierge`

AI-powered agent for analyzing websites and creating business profiles.

**Capabilities:**
- Website analysis using OpenAI
- Business profile generation
- Competitor analysis
- Market insights

**Tools:**
- `analyze-website` - Analyze website URLs to create business profiles

## 🔧 Tool System

### Shared BaseTool (`agents/shared/base_tool.py`)
Universal abstract base class for all agent tools across the entire system.

**Key Features:**
- **Input Validation**: Built-in parameter validation with customizable rules
- **Execution Monitoring**: Automatic timing and performance tracking
- **Error Handling**: Comprehensive error handling with logging
- **Rate Limiting**: Basic rate limiting capabilities
- **Metadata Creation**: Automatic metadata generation
- **Monitoring Integration**: Ready for integration with monitoring systems

**Key Methods:**
- `execute(input_data)` - Main execution method (must be implemented by subclasses)
- `execute_with_monitoring()` - Wrapper with monitoring and error handling
- `validate_input()` - Input validation (can be overridden)
- `create_metadata()` - Metadata generation
- Properties: `name`, `description`, `version`, `category`, `tags`, etc.

### ToolInput/ToolOutput
Standardized structures for tool communication with enhanced metadata support.

## 🚀 Usage Examples

### Initialize Agents
```python
from app.agents import initialize_agents

# Initialize all available agents
initialize_agents()
```

### Execute an Agent
```python
from app.agents import AgentRegistry, AgentInput

# Get the concierge agent
agent = AgentRegistry.get('business-concierge')

# Create input
input_data = AgentInput(
    agent_type='business-concierge',
    parameters={
        'action': 'analyze-website',
        'url': 'https://example.com'
    },
    user_id=123
)

# Execute
result = await agent.execute(input_data)

if result.success:
    print(f"Analysis complete: {result.data}")
else:
    print(f"Error: {result.error}")
```

### Direct Tool Execution
```python
from app.agents.concierge.tools import CONCIERGE_TOOLS

# Get the analyze website tool
tool = CONCIERGE_TOOLS['analyze-website']

# Execute directly
result = await tool.execute({
    'parameters': {'url': 'https://example.com'},
    'user_id': 123
})
```

## 🛠️ Extending the System

### Adding a New Agent

1. **Create Agent Class:**
```python
from app.agents.base import BaseAgent, AgentCapabilities

class MyCustomAgent(BaseAgent):
    def __init__(self):
        capabilities = AgentCapabilities(
            tools={'my-tool': MyTool()},
            resources={},
            prompts={},
            logging={'level': 'INFO'}
        )

        super().__init__(
            name='My Custom Agent',
            short_description='Custom agent description',
            description='Detailed description',
            version='1.0.0',
            capabilities=capabilities
        )

    async def execute(self, input_data):
        # Implementation
        pass
```

2. **Register the Agent:**
```python
from app.agents import AgentRegistry

AgentRegistry.register('my-custom-agent', MyCustomAgent())
```

### Adding a New Tool

1. **Create Tool Class:**
```python
from app.agents.shared.base_tool import BaseTool

class MyCustomTool(BaseTool):
    def __init__(self):
        super().__init__('my-tool', 'Tool description')

    async def execute(self, input_data):
        # Implementation
        pass
```

2. **Add to Agent Capabilities:**
```python
# In your agent __init__
capabilities = AgentCapabilities(
    tools={'my-tool': MyCustomTool()},
    # ... other capabilities
)
```

## 🧪 Testing

Run agent tests:
```bash
pytest app/tests/test_agents.py -v
```

Run all tests:
```bash
pytest
```

## 📊 Agent Capabilities Structure

Each agent has a capabilities structure:

```python
@dataclass
class AgentCapabilities:
    tools: Dict[str, Any]        # Available tools
    resources: Dict[str, Any]    # External resources
    prompts: Dict[str, Any]      # AI prompts/templates
    logging: Dict[str, Any]      # Logging configuration
```

## 🔍 Monitoring & Debugging

### Agent Execution Logging
All agents include execution metadata:
- Execution time
- Timestamp
- Agent name
- Success/failure status

### Error Handling
- Comprehensive error messages
- Execution time tracking
- Graceful failure handling

## 🎯 Best Practices

### Agent Design
- Keep agents focused on specific domains
- Use clear, descriptive names and descriptions
- Implement proper error handling
- Include execution metadata

### Tool Design
- Extend from `agents.shared.BaseTool` for consistency
- Use `execute_with_monitoring()` for automatic monitoring
- Override `validate_input()` for custom validation
- Leverage built-in error handling and logging
- Include execution metadata

### Shared Components Usage
- Import from `agents.shared` for reusable components
- Use `ToolInput` and `ToolOutput` for consistent data structures
- Leverage `ToolMetadata` for execution tracking
- Take advantage of built-in validation and monitoring

### Testing
- Test both success and failure scenarios
- Mock external dependencies
- Validate input/output structures
- Test agent registration and execution
- Test shared component integration

## 🔄 Future Enhancements

- **Plugin System:** Dynamic agent loading
- **Configuration Management:** External config files
- **Metrics & Monitoring:** Performance tracking
- **Caching:** Response caching for repeated requests
- **Rate Limiting:** API rate limiting per agent
- **Authentication:** Agent-level access control

## 📝 API Reference

### AgentRegistry Methods
- `register(agent_type, agent)` - Register an agent
- `get(agent_type)` - Get an agent by type
- `list_agents()` - List all registered agents
- `clear()` - Clear all registered agents

### BaseAgent Properties
- `name` - Agent name
- `short_description` - Brief description
- `description` - Detailed description
- `version` - Agent version
- `capabilities` - Agent capabilities

### AgentInput Fields
- `agent_type` - Type of agent to execute
- `parameters` - Execution parameters
- `business_profile_id` - Optional business profile ID
- `language` - Optional language preference
- `user_id` - Optional user ID

### AgentOutput Fields
- `success` - Execution success status
- `data` - Execution result data
- `error` - Error message if failed
- `metadata` - Execution metadata

---

The agent system is designed to be extensible, maintainable, and production-ready. Each component follows clean architecture principles and includes comprehensive testing and documentation.
