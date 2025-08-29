# Agent System (Simplified Architecture)

A modular, extensible agent system for the AI Business Ecosystem that enables AI-powered business analysis and automation. **Completely refactored for simplicity and scalability.**

## 🎉 New Simplified Architecture (2024)

The agent system has been completely refactored with a focus on **simplicity**, **reusability**, and **developer productivity**:

```
agents/
├── __init__.py                    # Agent initialization and registry exports
├── base.py                        # Base agent classes and registry
├── shared/                        # 🆕 Comprehensive shared framework
│   ├── __init__.py               # Shared exports
│   ├── base_tool.py              # Enhanced universal base tool class
│   ├── parsers.py                # 🆕 Content parsing framework
│   ├── validators.py             # 🆕 Input validation framework  
│   ├── tool_factory.py           # 🆕 Tool creation factory
│   ├── agent_factory.py          # 🆕 Agent creation factory
│   └── business_profile_utils.py # Business profile utilities
├── concierge/                     # Business Concierge Agent (simplified)
│   ├── __init__.py               # 🔄 10 lines instead of 50+
│   └── tools/
│       └── analyzewebsiteTool.py # Unified tool (execute + status)
├── competitors_researcher/        # Competitors Researcher Agent (simplified)
│   ├── __init__.py               # 🔄 10 lines instead of 50+
│   └── tools/
│       └── findCompetitorsTool.py # Unified tool (execute + status)
├── ADDING_NEW_AGENTS.md          # 🆕 Developer guide for agents
├── ADDING_NEW_TOOLS.md           # 🆕 Developer guide for tools
└── README.md                     # This documentation
```

## ⚡ Development Speed Improvements

### Before vs After

| Task | Before (Old) | After (New) | Improvement |
|------|-------------|-------------|-------------|
| **New Agent** | ~50+ lines, manual boilerplate | ~10 lines with factory | **5x faster** |
| **New Tool** | ~100+ lines, duplicate logic | ~5 lines with factory | **20x faster** |
| **Validation** | Custom code per tool | Shared validators | **10x faster** |
| **Parsing** | Custom parsers per tool | Shared parsers | **10x faster** |
| **Architecture** | 2 tools per operation | 1 unified tool | **50% reduction** |

## 🎯 Core Components

### 🆕 Shared Framework (`agents/shared/`)
The heart of the simplified architecture - reusable components that eliminate code duplication:

- **`base_tool.py`**: Enhanced universal base tool class with unified GET/POST operations
- **`parsers.py`**: Content parsing framework (Business Profile, Competitors, Generic, List)
- **`validators.py`**: Input validation framework (URL, IDs, Email, Custom)
- **`tool_factory.py`**: Factory patterns for creating tools (PromptBasedTool, SystemMessageTool)
- **`agent_factory.py`**: Factory patterns for creating agents (StandardAgent, SingleToolAgent)
- **`business_profile_utils.py`**: Business profile field normalization utilities

### Quick Examples

**Create a new tool (5 lines):**
```python
from app.agents.shared.tool_factory import create_prompt_tool
from app.agents.shared.validators import ParametersValidator, create_url_validator

tool = create_prompt_tool(
    name='Website Analyzer', slug='analyze-website', description='Analyze websites',
    prompt_id='your_openai_prompt_id', parser_type='business_profile',
    validator=ParametersValidator().add_required_field('url', create_url_validator())
)
```

**Create a new agent (3 lines):**
```python
from app.agents.shared.agent_factory import create_and_register_single_tool_agent

agent = create_and_register_single_tool_agent(
    name='Website Agent', slug='website-analyzer', description='AI website analysis', tool=tool
)
```

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
