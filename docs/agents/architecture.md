# Agent System Architecture

A comprehensive overview of the AI Platform's agent system architecture, design principles, and implementation patterns.

## 🏗️ System Overview

The agent system is built on a **factory-based architecture** that promotes code reuse, consistency, and rapid development. The system consists of several layers working together to provide a robust, scalable AI analysis platform.

```
┌─────────────────────────────────────────────────────────────────┐
│                          Frontend Layer                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │ React Components │ API Client │ │ UI Patterns │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
└─────────────────────────────────────────────────────────────────┘
                              │
                        HTTP API Calls
                              │
┌─────────────────────────────────────────────────────────────────┐
│                          API Layer                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │ Flask Routes│  │ Auth Middle │ │ Error Handle│            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
└─────────────────────────────────────────────────────────────────┘
                              │
                        Agent Execution
                              │
┌─────────────────────────────────────────────────────────────────┐
│                        Agent System                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │ AgentRegistry│ │ BaseAgent   │ │ Agent Factory│            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │ StandardAgent│ │SingleToolAgent│ Tool System │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
└─────────────────────────────────────────────────────────────────┘
                              │
                        Tool Execution
                              │
┌─────────────────────────────────────────────────────────────────┐
│                        Tool Framework                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │  BaseTool   │  │ Tool Factory│ │  Validators │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │PromptBased  │  │SystemMessage│ │   Parsers   │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
└─────────────────────────────────────────────────────────────────┘
                              │
                        AI Integration
                              │
┌─────────────────────────────────────────────────────────────────┐
│                      External Services                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │ OpenAI API  │  │ PostgreSQL  │ │ Other APIs  │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
└─────────────────────────────────────────────────────────────────┘
```

## 🎯 Design Principles

### 1. **Factory-First Architecture**
Everything is created using factory patterns to ensure consistency and reduce boilerplate:

```python
# Instead of manual instantiation (50+ lines)
class MyAgent(BaseAgent):
    def __init__(self):
        # 50+ lines of boilerplate
        pass

# Use factory patterns (5 lines)
agent = create_and_register_single_tool_agent(
    name='My Agent', slug='my-agent', description='...', tool=my_tool
)
```

### 2. **Separation of Concerns**
- **Agents**: Orchestrate workflows and manage multiple tools
- **Tools**: Perform specific analysis tasks
- **Validators**: Handle input validation
- **Parsers**: Process AI responses
- **Factories**: Create and configure components

### 3. **Reusability Through Shared Framework**
Common functionality is centralized in the `shared/` framework:

```
agents/shared/
├── base_tool.py              # Universal tool interface
├── tool_factory.py           # Tool creation patterns
├── agent_factory.py          # Agent creation patterns
├── validators.py             # Input validation
├── parsers.py                # Content parsing
└── business_profile_utils.py # Domain utilities
```

### 4. **Automatic Registration**
Components auto-register themselves, eliminating manual registration code:

```python
# Auto-registers in AgentRegistry
agent = create_and_register_single_tool_agent(...)

# Immediately available
registered_agent = AgentRegistry.get('agent-slug')
```

## 🤖 Agent Architecture

### Agent Hierarchy

```
BaseAgent (Abstract)
├── StandardAgent (Multi-tool)
│   ├── Business Concierge Agent
│   └── Competitors Researcher Agent  
└── SingleToolAgent (Single-tool)
    ├── SEO Analysis Agent
    └── Content Analysis Agent
```

### Agent Lifecycle

```
1. Creation Phase
   ├── Factory function called
   ├── Tools created and configured
   ├── Validation rules established
   ├── Parsing strategy defined
   └── Auto-registration in registry

2. Execution Phase
   ├── Input received from API layer
   ├── Parameters validated
   ├── Appropriate tool selected
   ├── Background/sync mode determined
   └── Tool execution initiated

3. Processing Phase
   ├── OpenAI message prepared
   ├── AI analysis performed
   ├── Response parsed and structured
   ├── Results processed
   └── Output formatted for frontend

4. Completion Phase
   ├── Results stored (if needed)
   ├── Metadata collected
   ├── Performance metrics tracked
   └── Response returned to client
```

## 🔧 Tool Architecture

### Tool Hierarchy

```
BaseTool (Abstract)
├── OpenAITool (OpenAI integration)
│   ├── PromptBasedTool (Use existing prompts)
│   │   ├── Website Analysis Tool
│   │   ├── Competitor Research Tool
│   │   └── Competitor Enrichment Tool
│   └── SystemMessageTool (Custom system messages)
│       ├── Content Generation Tool
│       └── Custom Analysis Tool
└── Custom Tools (Non-AI tools)
    ├── Database Query Tool
    └── API Integration Tool
```

### Tool Execution Flow

```
Tool Execution Pipeline
├── 1. Input Validation
│   ├── Parameter structure validation
│   ├── Business rule validation
│   ├── Data type validation
│   └── Custom validation logic
├── 2. OpenAI Integration
│   ├── Message preparation
│   ├── Prompt/system message setup
│   ├── API call execution
│   └── Response handling
├── 3. Content Processing
│   ├── Response parsing
│   ├── Data transformation
│   ├── Error handling
│   └── Result formatting
└── 4. Output Generation
    ├── Structure standardization
    ├── Metadata attachment
    ├── Performance tracking
    └── Client response
```

## 🔄 Data Flow Architecture

### Request Flow

```
Frontend Request
    │
    ▼
API Endpoint (/api/agents/{slug}/tools/{tool}/call)
    │
    ▼
Route Handler (agents.py)
    │
    ▼
Agent Registry (AgentRegistry.get())
    │
    ▼
Agent Execution (agent.execute())
    │
    ▼
Tool Selection (based on action parameter)
    │
    ▼
Tool Execution (tool.execute())
    │
    ▼
OpenAI Integration (if applicable)
    │
    ▼
Result Processing (parsing and transformation)
    │
    ▼
Response Formation (structured JSON)
    │
    ▼
Frontend Response
```

### Background Processing Flow

```
Background Request (background=true)
    │
    ▼
Immediate Response (job ID returned)
    │
    ▼
Background OpenAI Processing
    │
    ▼
Status Polling (/status/{job_id})
    │
    ▼
Result Retrieval (when completed)
```

## 🏭 Factory Pattern Implementation

### Agent Factory

```python
def create_and_register_single_tool_agent(
    name: str,
    slug: str, 
    short_description: str,
    description: str,
    tool: BaseTool,
    **kwargs
) -> SingleToolAgent:
    """Creates and auto-registers a single-tool agent."""
    
    # 1. Create agent instance
    agent = SingleToolAgent(
        name=name,
        slug=slug,
        short_description=short_description, 
        description=description,
        tool=tool,
        **kwargs
    )
    
    # 2. Auto-register in registry
    AgentRegistry.register(slug, agent)
    
    # 3. Return configured agent
    return agent
```

### Tool Factory

```python
def create_prompt_tool(
    name: str,
    slug: str,
    description: str, 
    prompt_id: str,
    parser_type: str = 'generic',
    validator: Optional[ParametersValidator] = None,
    **kwargs
) -> PromptBasedTool:
    """Creates a prompt-based tool with all configurations."""
    
    # 1. Create parser
    parser = create_parser(parser_type, **kwargs.get('parser_kwargs', {}))
    
    # 2. Create OpenAI config
    openai_config = OpenAIConfig(
        mode=OpenAIMode.PROMPT_ID,
        prompt_id=prompt_id
    )
    
    # 3. Return configured tool
    return PromptBasedTool(
        name=name,
        slug=slug,
        description=description,
        parser=parser,
        validator=validator,
        openai_config=openai_config,
        **kwargs
    )
```

## 🧩 Shared Framework Architecture

### Validation Framework

```python
class ParametersValidator:
    """Chainable validation framework."""
    
    def add_required_field(self, field: str, validator: BaseValidator):
        """Add required field validation."""
        return self
    
    def add_optional_field(self, field: str, validator: BaseValidator):
        """Add optional field validation."""
        return self
    
    def validate(self, parameters: Dict[str, Any]) -> ValidationResult:
        """Validate all parameters."""
        pass

# Usage
validator = (ParametersValidator()
    .add_required_field('url', create_url_validator())
    .add_optional_field('language', create_required_validator('language')))
```

### Parsing Framework

```python
class BaseContentParser:
    """Base class for content parsers."""
    
    def parse(self, content: Any) -> Dict[str, Any]:
        """Parse content into structured data."""
        pass

# Specialized parsers
business_profile_parser = BusinessProfileParser()
competitors_parser = CompetitorsParser() 
generic_parser = GenericContentParser()
list_parser = ListContentParser(list_key='results')
```

## 🔐 Security Architecture

### Input Validation
- **Parameter validation**: Type checking and format validation
- **Business rule validation**: Domain-specific constraints
- **SQL injection prevention**: Parameterized queries
- **XSS prevention**: Content sanitization

### Authentication & Authorization
- **JWT-based authentication**: Stateless token validation
- **Agent-level permissions**: Public vs. authenticated agents
- **User context**: User ID passed through execution chain
- **Rate limiting**: Prevent API abuse

### Data Protection
- **Input sanitization**: Clean all user inputs
- **Output filtering**: Remove sensitive information
- **Audit logging**: Track all agent executions
- **Error message sanitization**: Don't expose internal details

## 📊 Performance Architecture

### Execution Optimization
- **Background processing**: Long-running operations
- **Result caching**: Cache repeated analyses
- **Connection pooling**: Efficient database connections
- **Async operations**: Non-blocking I/O

### Monitoring & Metrics
- **Execution timing**: Track performance metrics
- **Error rates**: Monitor failure patterns
- **Resource usage**: Track OpenAI API usage
- **User analytics**: Understand usage patterns

### Scalability Patterns
- **Stateless design**: Easy horizontal scaling
- **Queue integration**: Handle peak loads
- **Database optimization**: Efficient queries
- **CDN integration**: Static asset delivery

## 🔮 Extension Points

### Adding New Agent Types
```python
class CustomAgentType(BaseAgent):
    """Create specialized agent types."""
    
    def __init__(self, specialized_config):
        # Custom initialization logic
        super().__init__(...)
    
    async def execute(self, input_data):
        # Custom execution logic
        pass
```

### Custom Tool Categories
```python
class DatabaseTool(BaseTool):
    """Non-OpenAI tool for database operations."""
    
    async def execute(self, input_data):
        # Direct database operations
        pass
```

### Integration Hooks
- **Pre-execution hooks**: Modify inputs before processing
- **Post-execution hooks**: Transform outputs after processing  
- **Error hooks**: Custom error handling logic
- **Monitoring hooks**: Custom metrics collection

## 🎯 Best Practices

### Architecture Guidelines
- **Use factory patterns** for all component creation
- **Leverage shared framework** to avoid code duplication
- **Design for testability** with clear interfaces
- **Plan for scalability** with stateless designs

### Performance Guidelines  
- **Cache frequently accessed data** at appropriate levels
- **Use background processing** for long operations
- **Monitor resource usage** and optimize bottlenecks
- **Design efficient database queries** for data retrieval

### Security Guidelines
- **Validate all inputs** at multiple levels
- **Sanitize all outputs** before returning to clients
- **Use parameterized queries** for database operations
- **Implement proper authentication** for sensitive operations

---

This architecture enables rapid development while maintaining production-quality standards. The factory patterns eliminate boilerplate, the shared framework ensures consistency, and the modular design supports easy extension and maintenance.