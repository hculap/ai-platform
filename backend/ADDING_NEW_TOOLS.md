# Adding New Tools - Developer Guide

This guide shows how to create new tools using the simplified architecture patterns.

## Quick Start (3 minutes)

### Using Factory Functions (Recommended)

```python
from app.agents.shared.tool_factory import create_prompt_tool
from app.agents.shared.validators import ParametersValidator, create_url_validator

# Create validator
validator = (ParametersValidator()
            .add_required_field('url', create_url_validator())
            .add_optional_field('language', create_required_validator('language')))

# Create tool
my_tool = create_prompt_tool(
    name='Website Content Analyzer',
    slug='content-analysis',
    description='Analyze website content for readability and structure',
    prompt_id='your_openai_prompt_id_here',
    parser_type='generic',
    validator=validator
)
```

## Tool Types

### 1. Prompt-Based Tools (Most Common)

Use existing OpenAI prompts:

```python
from app.agents.shared.tool_factory import create_prompt_tool

tool = create_prompt_tool(
    name='SEO Analyzer',
    slug='seo-analysis',
    description='Analyze website SEO performance',
    prompt_id='pmpt_your_openai_prompt_id',
    parser_type='business_profile',  # Automatically handles business profile parsing
    validator=your_validator
)
```

### 2. System Message Tools

For custom system messages:

```python
from app.agents.shared.tool_factory import create_system_message_tool

tool = create_system_message_tool(
    name='Custom Analyzer',
    slug='custom-analysis',
    description='Custom analysis with system message',
    system_message='You are an expert analyst. Analyze the provided data and return structured results.',
    parser_type='generic',
    validator=your_validator
)
```

### 3. Custom Tools

For complex logic:

```python
from app.agents.shared.tool_factory import PromptBasedTool

class CustomTool(PromptBasedTool):
    def __init__(self):
        super().__init__(
            name='Advanced Analyzer',
            slug='advanced-analysis',
            description='Advanced analysis with custom logic',
            prompt_id='your_prompt_id'
        )
    
    async def _prepare_openai_message(self, validated_params, input_data):
        """Customize the OpenAI message"""
        return f"Analyze: {validated_params['data']}"
    
    async def _process_openai_result(self, content, validated_params, openai_result, user_id):
        """Customize result processing"""
        parsed = self.parser.parse(content)
        # Add custom processing logic
        return {
            'analysis': parsed,
            'metadata': {'processed_at': time.time()}
        }
```

## Input Validation

### Common Validators

```python
from app.agents.shared.validators import (
    ParametersValidator,
    create_url_validator,
    create_business_profile_validator,
    create_openai_response_validator,
    create_required_validator
)

# URL validation
validator = ParametersValidator().add_required_field('url', create_url_validator())

# Business Profile ID validation
validator = ParametersValidator().add_required_field(
    'business_profile_id', 
    create_business_profile_validator()
)

# Multiple fields
validator = (ParametersValidator()
            .add_required_field('url', create_url_validator())
            .add_required_field('business_profile_id', create_business_profile_validator())
            .add_optional_field('language', create_required_validator('language')))
```

### Custom Validators

```python
from app.agents.shared.validators import BaseValidator, ValidationResult

class CustomValidator(BaseValidator):
    def validate(self, value, context=None):
        result = ValidationResult(is_valid=True)
        
        if not self._is_valid(value):
            result.add_error("Custom validation failed")
        else:
            result.set_validated_value('custom_field', value)
        
        return result
```

## Content Parsing

### Built-in Parsers

```python
# Business profile data
parser_type = 'business_profile'

# Competitors list
parser_type = 'competitors'

# Generic list with custom key
parser_type = 'list'
parser_kwargs = {'list_key': 'results'}

# Generic/flexible parsing
parser_type = 'generic'
```

### Custom Parsers

```python
from app.agents.shared.parsers import BaseContentParser

class CustomParser(BaseContentParser):
    def parse(self, content):
        self._validate_content(content)
        
        # Custom parsing logic
        if isinstance(content, str):
            parsed_data = self._safe_json_parse(content)
            if parsed_data is None:
                parsed_data = {'text': content}
        
        # Apply custom transformations
        return self._transform_data(parsed_data)
```

## Background Processing

All tools automatically support background processing:

```python
# Synchronous mode (immediate response)
result = await tool.execute(tool_input, background=False)

# Background mode (returns job ID for polling)
result = await tool.execute(tool_input, background=True)

# Status checking (automatically implemented)
status = await tool.get_status(job_id, user_id)
```

## Complete Examples

### Website Analysis Tool

```python
from app.agents.shared.tool_factory import create_prompt_tool
from app.agents.shared.validators import ParametersValidator, create_url_validator

def create_website_analyzer():
    validator = ParametersValidator().add_required_field('url', create_url_validator())
    
    return create_prompt_tool(
        name='Website Analyzer',
        slug='analyze-website',
        description='Analyze website content and generate business profile',
        prompt_id='pmpt_68aec68cbe2081909e109ce3b087d6ba07eff42b26c15bb8',
        parser_type='business_profile',
        validator=validator
    )

website_tool = create_website_analyzer()
```

### Competitors Research Tool

```python
from app.agents.shared.tool_factory import create_prompt_tool
from app.agents.shared.validators import ParametersValidator, create_business_profile_validator

def create_competitors_researcher():
    validator = ParametersValidator().add_required_field(
        'business_profile_id', 
        create_business_profile_validator()
    )
    
    return create_prompt_tool(
        name='Find Competitors',
        slug='find-competitors',
        description='Find competitors for a business using AI analysis',
        prompt_id='pmpt_68aecb2e0708819096cbf4dfc96863f20e5fe4e80a8d9a31',
        parser_type='competitors',
        validator=validator
    )

competitors_tool = create_competitors_researcher()
```

### Custom Analysis Tool

```python
from app.agents.shared.tool_factory import PromptBasedTool
from app.agents.shared.validators import ParametersValidator, create_required_validator
from app.agents.shared.parsers import create_parser

class SentimentAnalysisTool(PromptBasedTool):
    def __init__(self):
        validator = (ParametersValidator()
                    .add_required_field('text', create_required_validator('text'))
                    .add_optional_field('language', create_required_validator('language')))
        
        super().__init__(
            name='Sentiment Analysis',
            slug='sentiment-analysis',
            description='Analyze sentiment of text content',
            prompt_id='your_sentiment_prompt_id',
            parser=create_parser('generic'),
            validator=validator
        )
    
    async def _prepare_openai_message(self, validated_params, input_data):
        text = validated_params['text']
        language = validated_params.get('language', 'English')
        return f"Analyze the sentiment of this {language} text: {text}"
    
    async def _process_openai_result(self, content, validated_params, openai_result, user_id):
        parsed = self.parser.parse(content)
        return {
            'sentiment': parsed,
            'text_length': len(validated_params['text']),
            'language': validated_params.get('language', 'English')
        }

sentiment_tool = SentimentAnalysisTool()
```

## Testing Tools

### Basic Test

```python
from app.agents.shared.base_tool import ToolInput

async def test_tool():
    tool_input = ToolInput(
        parameters={'url': 'https://example.com'},
        user_id=1
    )
    
    result = await my_tool.execute(tool_input)
    print(f"Success: {result.success}")
    print(f"Data: {result.data}")
```

### Background Mode Test

```python
async def test_background_mode():
    # Start background processing
    result = await my_tool.execute(tool_input, background=True)
    job_id = result.data['openai_response_id']
    
    # Check status
    status = await my_tool.get_status(job_id)
    print(f"Status: {status.data['status']}")
```

## Integration with Agents

### Add to Existing Agent

```python
# In your agent's __init__.py
from ..shared.tool_factory import create_prompt_tool

new_tool = create_prompt_tool(...)

# Add to agent's capabilities
capabilities = AgentCapabilities(
    tools={
        'existing-tool': existing_tool,
        'new-tool': new_tool  # Add your new tool
    }
)
```

### Create Agent with Tool

```python
from app.agents.shared.agent_factory import create_and_register_single_tool_agent

agent = create_and_register_single_tool_agent(
    name='Analysis Agent',
    slug='analyzer',
    short_description='AI-powered analysis',
    description='Provides various analysis capabilities.',
    tool=your_new_tool
)
```

## Best Practices

1. **Use Factory Functions**: Prefer `create_prompt_tool()` over manual instantiation
2. **Validate All Inputs**: Always use validators for robust input handling
3. **Choose Right Parser**: Match parser to your expected output format
4. **Descriptive Names**: Use clear, descriptive names and slugs
5. **Handle Errors Gracefully**: Factory classes provide automatic error handling
6. **Support Background Mode**: All tools should support async processing
7. **Test Both Modes**: Test synchronous and background execution
8. **Document OpenAI Prompts**: Keep track of prompt IDs and their purposes

## Common Patterns

### URL-based Tools
```python
validator = ParametersValidator().add_required_field('url', create_url_validator())
parser_type = 'business_profile'  # or 'generic'
```

### ID-based Tools
```python
validator = ParametersValidator().add_required_field(
    'business_profile_id', 
    create_business_profile_validator()
)
parser_type = 'competitors'  # or 'list'
```

### Text Analysis Tools
```python
validator = ParametersValidator().add_required_field('text', create_required_validator('text'))
parser_type = 'generic'
```

## Migration from Old Tools

### Before (100+ lines)
```python
class OldTool(BaseTool):
    def __init__(self):
        # 20+ lines of configuration
        pass
    
    def _validate_input(self, parameters):
        # 20+ lines of validation
        pass
    
    def _parse_result(self, content):
        # 20+ lines of parsing
        pass
    
    async def execute(self, input_data):
        # 40+ lines of execution logic
        pass
```

### After (5 lines)
```python
tool = create_prompt_tool(
    name='Modern Tool',
    slug='modern-tool',
    description='Same functionality, much cleaner',
    prompt_id='your_prompt_id',
    parser_type='business_profile',
    validator=your_validator
)
```

## Troubleshooting

- **Validation Errors**: Check your validator configuration
- **Parsing Errors**: Verify parser type matches OpenAI output format
- **OpenAI Errors**: Verify prompt_id exists and is accessible
- **Background Mode Issues**: Ensure OpenAI client supports async operations