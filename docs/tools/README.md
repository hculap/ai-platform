# Tool Development Documentation

Tools are the building blocks of agents - specialized components that perform specific analysis tasks. This documentation covers everything you need to know about creating, customizing, and optimizing tools.

## 🎯 What Are Tools?

Tools are focused components that:
- Perform a single, well-defined task
- Integrate with OpenAI for intelligent analysis
- Validate inputs using shared validation framework
- Parse outputs using specialized parsers
- Support both synchronous and asynchronous execution
- Handle errors gracefully with comprehensive logging

## 🚀 Quick Start

### Create a Tool in 3 Minutes

```python
from app.agents.shared.tool_factory import create_prompt_tool
from app.agents.shared.validators import ParametersValidator, create_url_validator

# Create your tool
tool = create_prompt_tool(
    name='Website Content Analyzer',
    slug='content-analysis',
    description='Analyze website content for readability and structure',
    prompt_id='your_openai_prompt_id_here',
    parser_type='generic',
    validator=ParametersValidator().add_required_field('url', create_url_validator())
)
```

That's it! Your tool is ready to use.

## 🏗️ Tool Architecture

```
Tool System Architecture
├── BaseTool                    # Universal tool interface
│   ├── Input validation       # Robust parameter checking
│   ├── Execution monitoring   # Performance tracking
│   ├── Error handling         # Comprehensive error management
│   └── Metadata generation    # Automatic metadata creation
├── OpenAITool                 # OpenAI integration base
│   ├── API communication      # OpenAI API handling
│   ├── Background processing  # Async operation support
│   └── Status management      # Job status tracking
├── PromptBasedTool           # Use existing OpenAI prompts
│   ├── Prompt management      # Prompt ID handling
│   ├── Response processing    # AI response handling
│   └── Result parsing         # Structured output generation
└── SystemMessageTool         # Custom system messages
    ├── Message customization  # Custom AI instructions
    ├── Model configuration    # AI model selection
    └── Advanced processing    # Complex response handling
```

## 📚 Documentation Sections

### Getting Started
- **[Creation Guide](creation-guide.md)** - Build tools step-by-step
- **[Factory Patterns](factory-patterns.md)** - Rapid development with factories
- **[Testing Strategies](testing.md)** - Test your tools comprehensively

### Advanced Topics
- **[Input Validation](validation.md)** - Robust input validation
- **[Content Parsing](parsing.md)** - Parse AI responses effectively
- **[OpenAI Integration](openai-integration.md)** - Advanced OpenAI patterns

## 🔧 Tool Types

### 1. Prompt-Based Tools (90% of use cases)

Use existing OpenAI prompts for rapid development:

```python
tool = create_prompt_tool(
    name='SEO Analyzer',
    slug='seo-analysis',
    description='Analyze website SEO performance',
    prompt_id='pmpt_your_openai_prompt_id',
    parser_type='business_profile',
    validator=url_validator
)
```

**Use when:**
- You have an existing OpenAI prompt
- Standard analysis workflows
- Quick prototyping

### 2. System Message Tools (Custom AI instructions)

For custom system messages and specialized AI behavior:

```python
tool = create_system_message_tool(
    name='Custom Analyzer', 
    slug='custom-analysis',
    description='Custom analysis with system message',
    system_message='You are an expert analyst. Analyze data and return structured results.',
    parser_type='generic',
    validator=custom_validator
)
```

**Use when:**
- Need custom AI instructions
- Specialized analysis requirements
- Fine-tuned AI behavior

### 3. Custom Tools (Complex logic)

For tools that need specialized processing:

```python
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
        """Custom result processing"""
        parsed = self.parser.parse(content)
        return {
            'analysis': parsed,
            'custom_metric': self._calculate_metric(parsed)
        }
```

**Use when:**
- Complex pre/post processing needed
- Custom business logic required
- Integration with external services

## 🎨 Common Patterns

### URL Analysis Tool
```python
validator = ParametersValidator().add_required_field('url', create_url_validator())
parser_type = 'generic'
```

### Business Profile Tool
```python
validator = ParametersValidator().add_required_field(
    'business_profile_id', 
    create_business_profile_validator()
)
parser_type = 'business_profile'
```

### Competitor Research Tool
```python
parser_type = 'competitors'  # For competitor lists
parser_type = 'list'         # For general research results
```

### Text Analysis Tool
```python
validator = ParametersValidator().add_required_field('text', create_required_validator('text'))
parser_type = 'generic'
```

## 🔄 Tool Execution Flow

```
1. Input Validation Phase
   ├── Parameter structure validation
   ├── Data type checking
   ├── Business rule validation
   └── Custom validation logic

2. OpenAI Integration Phase
   ├── Message preparation
   ├── Prompt/system message setup
   ├── API call execution (sync/async)
   └── Error handling and retries

3. Response Processing Phase
   ├── Content parsing
   ├── Data transformation
   ├── Error detection
   └── Result structuring

4. Output Generation Phase
   ├── Response formatting
   ├── Metadata attachment
   ├── Performance metrics
   └── Client response delivery
```

## 📊 Performance Features

### Background Processing
All tools automatically support background execution:

```python
# Synchronous execution
result = await tool.execute(tool_input, background=False)

# Asynchronous execution  
result = await tool.execute(tool_input, background=True)
# Returns job ID for status polling

# Status checking
status = await tool.get_status(job_id, user_id)
```

### Monitoring & Metrics
- **Execution timing**: Automatic performance tracking
- **Success/failure rates**: Error pattern analysis
- **Resource usage**: OpenAI API consumption monitoring
- **User analytics**: Usage pattern insights

### Error Handling
- **Validation errors**: Clear, actionable error messages
- **OpenAI errors**: Automatic retry logic and fallbacks
- **Timeout handling**: Graceful handling of long operations
- **Comprehensive logging**: Detailed error tracking for debugging

## ✅ Best Practices

### Tool Design
- **Single Responsibility**: Each tool should have one clear purpose
- **Descriptive Naming**: Clear names that indicate tool functionality
- **Comprehensive Validation**: Use shared validation framework
- **Error Handling**: Leverage factory error handling patterns

### Performance Optimization
- **Efficient Prompts**: Design prompts for optimal AI performance
- **Smart Caching**: Cache results for repeated operations
- **Background Processing**: Use async mode for long operations
- **Resource Monitoring**: Track OpenAI API usage and costs

### Testing Strategy
- **Unit Tests**: Test individual tool components
- **Integration Tests**: Test tool interaction with external services
- **Validation Tests**: Verify input validation logic
- **Error Scenario Tests**: Test error handling and edge cases

## 🧪 Testing Your Tools

### Basic Test
```python
from app.agents.shared.base_tool import ToolInput

async def test_tool():
    tool_input = ToolInput(
        parameters={'url': 'https://example.com'},
        user_id='test-user'
    )
    
    result = await tool.execute(tool_input)
    assert result.success
    assert result.data is not None
```

### Background Mode Test
```python
async def test_background_mode():
    result = await tool.execute(tool_input, background=True)
    job_id = result.data['openai_response_id']
    
    status = await tool.get_status(job_id)
    assert status.data['status'] in ['pending', 'completed']
```

## 🔧 Available Validators

### Pre-built Validators
- **URL Validator**: `create_url_validator()` - Validates HTTP/HTTPS URLs
- **Business Profile Validator**: `create_business_profile_validator()` - Validates UUID format
- **Required Field Validator**: `create_required_validator(field_name)` - Ensures field presence
- **OpenAI Response Validator**: `create_openai_response_validator()` - Validates AI responses

### Custom Validators
```python
class CustomValidator(BaseValidator):
    def validate(self, value, context=None):
        result = ValidationResult(is_valid=True)
        
        if not self._is_valid(value):
            result.add_error("Validation failed")
        else:
            result.set_validated_value('field', value)
        
        return result
```

## 📋 Available Parsers

### Built-in Parsers
- **`business_profile`**: Parse business profile data
- **`competitors`**: Parse competitor lists
- **`generic`**: Flexible JSON parsing
- **`list`**: Parse lists with custom keys

### Custom Parsers
```python
class CustomParser(BaseContentParser):
    def parse(self, content):
        # Custom parsing logic
        return transformed_data
```

## 🎯 Migration from Legacy Tools

### Before (100+ lines)
```python
class OldTool(BaseTool):
    def __init__(self):
        # 20+ lines of configuration
    
    def _validate_input(self, parameters):
        # 20+ lines of validation
    
    async def execute(self, input_data):
        # 60+ lines of execution logic
```

### After (5 lines)  
```python
tool = create_prompt_tool(
    name='Modern Tool',
    slug='modern-tool', 
    description='Same functionality, much cleaner',
    prompt_id='your_prompt_id',
    parser_type='business_profile',
    validator=validator
)
```

## 🤝 Contributing

When creating new tools:
- Use factory patterns for consistency
- Follow naming conventions
- Write comprehensive tests
- Document custom logic
- Consider performance implications
- Update relevant documentation

---

**Next Steps:**
- Ready to create your first tool? → [Creation Guide](creation-guide.md)
- Need advanced validation? → [Validation Guide](validation.md)
- Want to integrate with OpenAI? → [OpenAI Integration](openai-integration.md)