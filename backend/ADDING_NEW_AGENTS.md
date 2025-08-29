# Adding New Agents - Developer Guide

This guide shows how to create new agents using the simplified architecture patterns.

## Quick Start (5 minutes)

### Single-Tool Agent (Recommended)

Most agents only need one tool. Use the `SingleToolAgent` pattern:

```python
# 1. Create your tool
from app.agents.shared.tool_factory import create_prompt_tool
from app.agents.shared.validators import ParametersValidator, create_url_validator

# Create validator for tool inputs
validator = ParametersValidator().add_required_field('url', create_url_validator())

# Create the tool (using existing prompt)
my_tool = create_prompt_tool(
    name='Website SEO Analyzer',
    slug='seo-analysis', 
    description='Analyze website SEO and provide recommendations',
    prompt_id='your_openai_prompt_id_here',
    parser_type='generic',  # or 'business_profile', 'competitors', 'list'
    validator=validator
)

# 2. Create agent using factory
from app.agents.shared.agent_factory import create_and_register_single_tool_agent

seo_agent = create_and_register_single_tool_agent(
    name='SEO Analysis Agent',
    slug='seo-analyzer',
    short_description='AI-powered SEO analysis and recommendations',
    description='Analyzes website SEO performance and provides actionable recommendations.',
    tool=my_tool,
    is_public=True
)
```

That's it! Your agent is created and automatically registered.

### Multi-Tool Agent

For agents with multiple tools:

```python
from app.agents.shared.agent_factory import create_and_register_standard_agent

# Create multiple tools
tool1 = create_prompt_tool(...)
tool2 = create_prompt_tool(...)

multi_agent = create_and_register_standard_agent(
    name='Multi-Tool Agent',
    slug='multi-agent',
    short_description='Agent with multiple capabilities',
    description='This agent provides multiple analysis tools.',
    tools={
        'analyze': tool1,
        'research': tool2
    },
    is_public=False
)
```

## Custom Tool Development

### Using Tool Factory

```python
from app.agents.shared.tool_factory import PromptBasedTool
from app.agents.shared.parsers import create_parser
from app.agents.shared.validators import ParametersValidator, create_required_validator

class CustomTool(PromptBasedTool):
    def __init__(self):
        # Create custom validator
        validator = (ParametersValidator()
                    .add_required_field('input_text', create_required_validator('input_text'))
                    .add_optional_field('language', create_required_validator('language')))
        
        super().__init__(
            name='Custom Analysis Tool',
            slug='custom-analysis',
            description='Custom tool with specific logic',
            prompt_id='your_prompt_id',
            parser=create_parser('generic'),
            validator=validator
        )
    
    async def _prepare_openai_message(self, validated_params, input_data):
        """Override to customize OpenAI message"""
        return f"Analyze this text: {validated_params['input_text']}"
    
    async def _process_openai_result(self, content, validated_params, openai_result, user_id):
        """Override to customize result processing"""
        parsed = self.parser.parse(content)
        return {
            'analysis': parsed,
            'input_length': len(validated_params['input_text'])
        }
```

## File Structure

Create your agent in the appropriate directory:

```
backend/app/agents/
├── your_agent_name/
│   ├── __init__.py          # Agent definition
│   └── tools/              # If you need custom tools
│       ├── __init__.py
│       └── custom_tool.py
```

### Agent File Example (`__init__.py`)

```python
"""
Your Agent Name - Brief description.
"""

from ..shared.agent_factory import create_and_register_single_tool_agent
from ..shared.tool_factory import create_prompt_tool
from ..shared.validators import ParametersValidator, create_url_validator

# Create tool with validation
validator = ParametersValidator().add_required_field('url', create_url_validator())

analyze_tool = create_prompt_tool(
    name='Website Analyzer',
    slug='analyze-website',
    description='Analyze website content and structure',
    prompt_id='your_openai_prompt_id',
    parser_type='business_profile',
    validator=validator
)

# Create and register agent
YourAgentClass = create_and_register_single_tool_agent(
    name='Website Analysis Agent',
    slug='website-analyzer',
    short_description='AI-powered website analysis',
    description='Analyzes websites to extract business insights.',
    tool=analyze_tool,
    is_public=True
)
```

## Registration

### Automatic Registration

Agents created with factory functions are automatically registered:

```python
# Automatically registered when created
agent = create_and_register_single_tool_agent(...)
```

### Manual Registration

If you need manual control:

```python
from app.agents.base import AgentRegistry

# Create agent without auto-registration
agent = create_single_tool_agent(...)

# Register manually
AgentRegistry.register('my-agent', agent)
```

### Import in Main Module

Add your agent to `backend/app/agents/__init__.py`:

```python
from .your_agent_name import YourAgentClass

def initialize_agents() -> None:
    # Your agent is already registered via factory
    # No additional code needed
    pass
```

## Testing Your Agent

### Basic Test

```python
import asyncio
from app.agents.base import AgentRegistry, AgentInput

async def test_agent():
    agent = AgentRegistry.get('your-agent-slug')
    
    input_data = AgentInput(
        agent_type='your-agent-slug',
        parameters={
            'action': 'your-tool-slug',
            'url': 'https://example.com'
        },
        user_id=1
    )
    
    result = await agent.execute(input_data)
    print(f"Success: {result.success}")
    print(f"Data: {result.data}")

# Run test
asyncio.run(test_agent())
```

## Common Patterns

### URL Analysis Agent

```python
from app.agents.shared.validators import create_url_validator

validator = ParametersValidator().add_required_field('url', create_url_validator())
```

### Business Profile Agent

```python
parser_type = 'business_profile'  # Uses BusinessProfileParser
```

### Competitors Research Agent

```python
parser_type = 'competitors'  # Uses CompetitorsParser
```

### List-based Results Agent

```python
parser_type = 'list'  # Uses ListContentParser
parser_kwargs = {'list_key': 'results'}  # Customize list key
```

## Best Practices

1. **Use Factory Functions**: Always prefer factory functions over manual instantiation
2. **Validate Inputs**: Use the validation framework for robust input handling
3. **Choose Right Parser**: Use appropriate parser for your data format
4. **Descriptive Names**: Use clear, descriptive names for agents and tools
5. **Public Access**: Set `is_public=True` only for agents that don't require authentication
6. **Error Handling**: Factory classes handle errors automatically
7. **Background Support**: Background mode is automatically supported

## Migration from Old Patterns

### Before (50+ lines)
```python
class OldAgent(BaseAgent):
    def __init__(self):
        # 50+ lines of boilerplate
        pass
    
    async def execute(self, input_data):
        # 20+ lines of action handling
        pass
```

### After (10 lines)
```python
tool = create_prompt_tool(...)
agent = create_and_register_single_tool_agent(...)
```

## Troubleshooting

- **Agent not found**: Check registration in `initialize_agents()`
- **Validation errors**: Verify your validator configuration
- **Parser errors**: Ensure you're using the right parser type
- **OpenAI errors**: Verify your prompt_id is valid

For more examples, see existing agents in the codebase.