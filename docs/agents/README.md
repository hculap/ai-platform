# Agent System Documentation

The AI Platform's agent system is the core component that enables AI-powered business analysis through modular, extensible agents. This documentation covers everything you need to know to work with and extend the agent system.

## 🎯 What Are Agents?

Agents are specialized AI-powered components that perform specific business analysis tasks. Each agent:
- Has a focused domain (e.g., competitor research, website analysis)
- Contains one or more tools to accomplish its tasks
- Integrates with OpenAI for intelligent analysis
- Provides standardized input/output interfaces
- Supports both synchronous and asynchronous execution

## 🏗️ System Architecture

```
Agent System Architecture
├── AgentRegistry                    # Central agent management
├── BaseAgent                       # Abstract base class for all agents
├── Agent Factories                 # Simplified agent creation
│   ├── StandardAgent              # Multi-tool agents
│   └── SingleToolAgent           # Single-tool agents
├── Tool System                    # Agent capabilities
│   ├── BaseTool                   # Universal tool interface
│   ├── PromptBasedTool           # OpenAI prompt-based tools
│   └── SystemMessageTool        # Custom system message tools
└── Shared Framework              # Reusable components
    ├── Validators                # Input validation
    ├── Parsers                   # Content parsing  
    ├── Factories                 # Creation patterns
    └── Utilities                 # Common functionality
```

## 🚀 Quick Start

### Create Your First Agent (5 minutes)

```python
# 1. Create a tool
from app.agents.shared.tool_factory import create_prompt_tool
from app.agents.shared.validators import ParametersValidator, create_url_validator

tool = create_prompt_tool(
    name='Website SEO Analyzer',
    slug='seo-analysis',
    description='Analyze website SEO and provide recommendations',
    prompt_id='your_openai_prompt_id_here',
    parser_type='generic',
    validator=ParametersValidator().add_required_field('url', create_url_validator())
)

# 2. Create agent
from app.agents.shared.agent_factory import create_and_register_single_tool_agent

agent = create_and_register_single_tool_agent(
    name='SEO Analysis Agent',
    slug='seo-analyzer',
    short_description='AI-powered SEO analysis and recommendations',
    description='Analyzes website SEO performance and provides actionable recommendations.',
    tool=tool,
    is_public=True
)
```

**That's it!** Your agent is created and automatically registered.

## 📚 Documentation Structure

### Getting Started
- **[Quick Start Guide](quick-start.md)** - Create agents in 5 minutes
- **[Architecture Overview](architecture.md)** - Deep dive into system design
- **[Development Guide](development-guide.md)** - Complete development workflow

### Reference Materials
- **[API Reference](api-reference.md)** - Complete API documentation
- **[Performance Guide](performance.md)** - Production optimization
- **[Troubleshooting](troubleshooting.md)** - Common issues and solutions

### Examples and Templates
- **[Examples](examples/)** - Working code examples
- **[Templates](templates/)** - Ready-to-use code templates

## 🤖 Current Agents

### Business Concierge Agent
**Slug:** `business-concierge`  
**Purpose:** AI-powered website analysis and business profile generation

**Capabilities:**
- Analyze website content and structure
- Extract business insights automatically
- Generate comprehensive business profiles
- Support multiple languages (Polish, English)

**Tools:**
- `analyze-website` - Website analysis and profile generation

### Competitors Researcher Agent  
**Slug:** `competitors-researcher`  
**Purpose:** AI-powered competitor research and analysis

**Capabilities:**
- Find competitors based on business profile
- Enrich competitor data from names or URLs
- Analyze competitive landscape
- Support background processing for large research tasks

**Tools:**
- `find-competitors` - Discover new competitors using AI
- `enrich-competitor` - Gather detailed competitor information

## 🎨 Agent Patterns

### Single-Tool Agent (Recommended for most use cases)
Perfect for agents that have one primary function:

```python
agent = create_and_register_single_tool_agent(
    name='Analysis Agent',
    slug='analyzer',
    short_description='AI-powered analysis',
    description='Provides specific analysis capabilities.',
    tool=your_tool,
    is_public=True
)
```

### Multi-Tool Agent
For agents that need multiple capabilities:

```python
agent = create_and_register_standard_agent(
    name='Multi-Tool Agent',  
    slug='multi-agent',
    short_description='Agent with multiple capabilities',
    description='Provides various analysis tools.',
    tools={
        'analyze': analysis_tool,
        'research': research_tool,
        'optimize': optimization_tool
    },
    is_public=False
)
```

## 🔧 Key Features

### Automatic Registration
All agents created with factory functions are automatically registered in the `AgentRegistry`:

```python
# Agent is automatically available
agent = AgentRegistry.get('your-agent-slug')
```

### Background Processing
All agents support asynchronous execution for long-running tasks:

```python
# Synchronous execution
result = await agent.execute(input_data)

# Background execution
input_data.parameters['background'] = True
result = await agent.execute(input_data)
# Returns job ID for status polling
```

### Input Validation
Robust input validation using the shared validation framework:

```python
validator = (ParametersValidator()
    .add_required_field('url', create_url_validator())
    .add_optional_field('language', create_required_validator('language')))
```

### Content Parsing
Intelligent parsing of AI responses using specialized parsers:

```python
# Business profile parsing
parser_type = 'business_profile'

# Competitor list parsing  
parser_type = 'competitors'

# Generic/flexible parsing
parser_type = 'generic'
```

## 📊 Agent Execution Flow

```
1. Input Validation
   ├── Parameter validation using shared validators
   ├── Business context validation
   └── User authorization checks

2. Tool Execution  
   ├── Select appropriate tool based on action
   ├── Prepare OpenAI message with context
   ├── Execute AI analysis (sync or async)
   └── Handle errors and retries

3. Result Processing
   ├── Parse AI response using specialized parsers
   ├── Transform data for frontend consumption
   ├── Store results for future reference
   └── Return structured response

4. Error Handling
   ├── Validation errors with helpful messages
   ├── Execution errors with retry logic
   ├── Timeout handling for long operations
   └── Comprehensive logging for debugging
```

## 🎯 Best Practices

### Agent Design
- **Single Responsibility**: Each agent should have a clear, focused purpose
- **Descriptive Naming**: Use clear names that indicate the agent's function
- **Comprehensive Descriptions**: Help users understand what the agent does
- **Error Handling**: Implement proper error handling and user feedback

### Tool Integration  
- **Use Factory Patterns**: Leverage factory functions for consistency
- **Validate All Inputs**: Use the shared validation framework
- **Choose Right Parser**: Match parser to expected AI output format
- **Support Background Mode**: Enable async processing for long operations

### Performance
- **Optimize Prompts**: Design efficient OpenAI prompts
- **Cache When Possible**: Cache results for repeated queries
- **Monitor Execution**: Track performance and optimize bottlenecks
- **Handle Rate Limits**: Implement proper rate limiting and retry logic

## 🔄 Development Workflow

1. **Design** your agent's purpose and required tools
2. **Create Tools** using factory patterns and shared components
3. **Build Agent** using factory functions for automatic registration
4. **Test Thoroughly** with unit and integration tests
5. **Integrate Frontend** with React components
6. **Deploy** with proper monitoring and error handling

## 🤝 Contributing

When extending the agent system:
- Follow the established patterns and conventions
- Use shared components to avoid code duplication  
- Write comprehensive tests for new agents and tools
- Update documentation with examples and use cases
- Consider performance and scalability implications

## 📈 System Metrics

The agent system tracks:
- **Execution Time**: Monitor performance of agent operations
- **Success Rate**: Track successful vs. failed executions
- **Error Patterns**: Identify common issues for improvement
- **Usage Analytics**: Understand which agents are most valuable
- **Resource Utilization**: Monitor OpenAI API usage and costs

---

**Next Steps:**
- Ready to create your first agent? → [Quick Start Guide](quick-start.md)
- Want to understand the architecture? → [Architecture Overview](architecture.md)
- Need to solve an issue? → [Troubleshooting Guide](troubleshooting.md)