# Tool Creation Guide

A comprehensive guide to creating tools using the simplified factory patterns and shared framework components.

## 🚀 Quick Start (3 minutes)

### Create Your First Tool

```python
from app.agents.shared.tool_factory import create_prompt_tool
from app.agents.shared.validators import ParametersValidator, create_url_validator

# 1. Create input validator
validator = (ParametersValidator()
    .add_required_field('url', create_url_validator())
    .add_optional_field('language', create_required_validator('language')))

# 2. Create tool using factory
tool = create_prompt_tool(
    name='Website Content Analyzer',
    slug='content-analysis',
    description='Analyze website content for readability and structure',
    prompt_id='your_openai_prompt_id_here',
    parser_type='generic',
    validator=validator
)
```

**That's it!** Your tool is ready to execute.

## 🔧 Tool Types

### 1. Prompt-Based Tools (90% of use cases)

Use existing OpenAI prompts for rapid development:

```python
from app.agents.shared.tool_factory import create_prompt_tool

def create_seo_analyzer():
    validator = ParametersValidator().add_required_field('url', create_url_validator())
    
    return create_prompt_tool(
        name='SEO Analyzer',
        slug='seo-analysis',
        description='Analyze website SEO performance',
        prompt_id='pmpt_68aec68cbe2081909e109ce3b087d6ba07eff42b26c15bb8',
        parser_type='generic',  # or 'business_profile', 'competitors', 'list'
        validator=validator
    )
```

**When to use:**
- You have an existing OpenAI prompt ID
- Standard analysis workflows
- Quick prototyping and development

### 2. System Message Tools

For custom system messages and specialized AI behavior:

```python
from app.agents.shared.tool_factory import create_system_message_tool

def create_custom_analyzer():
    validator = ParametersValidator().add_required_field('text', create_required_validator('text'))
    
    return create_system_message_tool(
        name='Custom Text Analyzer',
        slug='custom-analysis',
        description='Custom analysis with specialized system message',
        system_message='''You are an expert text analyst. Analyze the provided text and return:
        - Sentiment score (0-100)
        - Key themes (list)
        - Complexity rating (1-10)
        - Recommendations (list)
        
        Return results in JSON format.''',
        parser_type='generic',
        validator=validator,
        model='gpt-4o'  # Optional: specify model
    )
```

**When to use:**
- Need custom AI instructions
- Don't have an existing prompt ID
- Require specialized analysis behavior

### 3. Custom Tools (Advanced)

For tools requiring complex logic or specialized processing:

```python
from app.agents.shared.tool_factory import PromptBasedTool
from app.agents.shared.parsers import create_parser
from app.agents.shared.validators import ParametersValidator, create_required_validator

class SentimentAnalysisTool(PromptBasedTool):
    def __init__(self):
        # Create custom validator
        validator = (ParametersValidator()
            .add_required_field('text', create_required_validator('text'))
            .add_optional_field('language', create_required_validator('language')))
        
        super().__init__(
            name='Advanced Sentiment Analysis',
            slug='sentiment-analysis',
            description='Analyze sentiment with custom processing',
            prompt_id='your_sentiment_prompt_id',
            parser=create_parser('generic'),
            validator=validator
        )
    
    async def _prepare_openai_message(self, validated_params, input_data):
        """Customize the OpenAI message"""
        text = validated_params['text']
        language = validated_params.get('language', 'English')
        
        return f"""Analyze the sentiment of this {language} text and provide detailed insights:
        
        Text: {text}
        
        Please provide:
        1. Overall sentiment (positive/negative/neutral)
        2. Confidence score (0-1)
        3. Emotional indicators found
        4. Context considerations
        """
    
    async def _process_openai_result(self, content, validated_params, openai_result, user_id):
        """Process results with custom logic"""
        # Parse AI response
        parsed = self.parser.parse(content)
        
        # Add custom metrics
        text_length = len(validated_params['text'])
        complexity_score = self._calculate_complexity(validated_params['text'])
        
        return {
            'sentiment_analysis': parsed,
            'metadata': {
                'text_length': text_length,
                'complexity_score': complexity_score,
                'language': validated_params.get('language', 'English'),
                'analysis_timestamp': time.time()
            }
        }
    
    def _calculate_complexity(self, text):
        """Calculate text complexity score"""
        sentences = text.split('.')
        words = text.split()
        avg_words_per_sentence = len(words) / max(len(sentences), 1)
        return min(10, int(avg_words_per_sentence / 10))
```

**When to use:**
- Complex pre/post processing needed
- Custom business logic required
- Integration with external services
- Specialized metrics calculation

## 📊 Input Validation

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
url_validator = ParametersValidator().add_required_field('url', create_url_validator())

# Business Profile ID validation
profile_validator = ParametersValidator().add_required_field(
    'business_profile_id', 
    create_business_profile_validator()
)

# Multiple fields with optional parameters
complex_validator = (ParametersValidator()
    .add_required_field('url', create_url_validator())
    .add_required_field('business_profile_id', create_business_profile_validator())
    .add_optional_field('language', create_required_validator('language'))
    .add_optional_field('depth', create_required_validator('depth')))
```

### Custom Validators

For specialized validation needs:

```python
from app.agents.shared.validators import BaseValidator, ValidationResult

class EmailValidator(BaseValidator):
    """Validates email addresses."""
    
    def __init__(self):
        self.field_name = "email"
    
    def validate(self, parameters, context=None):
        result = ValidationResult(is_valid=True)
        
        email = parameters.get('email')
        if not email:
            result.add_error("Email is required")
            return result
        
        if not isinstance(email, str):
            result.add_error("Email must be a string")
            return result
        
        # Basic email validation
        import re
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, email):
            result.add_error("Invalid email format")
        else:
            result.set_validated_value('email', email.lower().strip())
        
        return result

class CompanyNameValidator(BaseValidator):
    """Validates company names with business rules."""
    
    def validate(self, parameters, context=None):
        result = ValidationResult(is_valid=True)
        
        name = parameters.get('company_name')
        if not name or len(name.strip()) < 2:
            result.add_error("Company name must be at least 2 characters")
        elif len(name) > 100:
            result.add_error("Company name must be less than 100 characters")
        else:
            result.set_validated_value('company_name', name.strip())
        
        return result

# Usage in validator
validator = (ParametersValidator()
    .add_required_field('email', EmailValidator())
    .add_required_field('company_name', CompanyNameValidator()))
```

## 🎨 Content Parsing

### Built-in Parsers

```python
# Business profile data parsing
parser_type = 'business_profile'
# Expects: name, website_url, offer_description, target_customer, etc.

# Competitor list parsing
parser_type = 'competitors' 
# Expects: [{'name': '...', 'url': '...', 'description': '...'}]

# Generic list parsing with custom key
parser_type = 'list'
parser_kwargs = {'list_key': 'results'}
# Expects: {'results': [...]}

# Flexible generic parsing
parser_type = 'generic'
# Handles any JSON structure
```

### Custom Parsers

```python
from app.agents.shared.parsers import BaseContentParser

class ContactInfoParser(BaseContentParser):
    """Parse contact information from AI responses."""
    
    def parse(self, content):
        """Parse content into contact information structure."""
        self._validate_content(content)
        
        # Try JSON parsing first
        parsed_data = self._safe_json_parse(content)
        if parsed_data is None:
            # Fallback to text parsing
            parsed_data = self._parse_text_content(content)
        
        # Normalize structure
        return self._normalize_contact_data(parsed_data)
    
    def _parse_text_content(self, content):
        """Parse contact info from plain text."""
        import re
        
        # Extract email
        email_match = re.search(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', content)
        
        # Extract phone
        phone_match = re.search(r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b', content)
        
        return {
            'email': email_match.group(0) if email_match else None,
            'phone': phone_match.group(0) if phone_match else None,
            'raw_content': content
        }
    
    def _normalize_contact_data(self, data):
        """Normalize contact data structure."""
        if not isinstance(data, dict):
            return {'contacts': [], 'error': 'Invalid data format'}
        
        # Ensure standard fields
        normalized = {
            'contacts': data.get('contacts', []),
            'primary_email': data.get('email') or data.get('primary_email'),
            'primary_phone': data.get('phone') or data.get('primary_phone'),
            'social_media': data.get('social_media', {}),
            'addresses': data.get('addresses', [])
        }
        
        return normalized
```

## 🔄 Background Processing

All tools automatically support background processing:

```python
# Synchronous execution (immediate response)
result = await tool.execute(tool_input, background=False)

# Background execution (returns job ID)
result = await tool.execute(tool_input, background=True)
job_id = result.data['openai_response_id']

# Status checking (built into all tools)
status = await tool.get_status(job_id, user_id)
```

### Custom Status Processing

Override status parsing for specialized background workflows:

```python
class CustomTool(PromptBasedTool):
    async def _parse_status_content(self, content):
        """Custom status content parsing."""
        try:
            parsed = self.parser.parse(content)
            
            # Add custom status processing
            if 'progress' in parsed:
                return {
                    'status': 'in_progress',
                    'progress': parsed['progress'],
                    'estimated_completion': parsed.get('eta'),
                    'partial_results': parsed.get('preliminary_data')
                }
            
            return {'results': parsed}
            
        except Exception as e:
            raise Exception(f"Failed to parse status: {str(e)}")
```

## 📈 Complete Examples

### Website Analysis Tool

```python
from app.agents.shared.tool_factory import create_prompt_tool
from app.agents.shared.validators import ParametersValidator, create_url_validator

def create_website_analyzer():
    """Create a comprehensive website analysis tool."""
    
    # Input validation
    validator = (ParametersValidator()
        .add_required_field('url', create_url_validator())
        .add_optional_field('analysis_depth', create_required_validator('analysis_depth'))
        .add_optional_field('include_seo', create_required_validator('include_seo')))
    
    return create_prompt_tool(
        name='Website Analyzer',
        slug='analyze-website',
        description='Comprehensive website analysis including content, SEO, and user experience',
        prompt_id='pmpt_68aec68cbe2081909e109ce3b087d6ba07eff42b26c15bb8',
        parser_type='business_profile',
        validator=validator,
        version='2.0.0'
    )

# Usage
website_tool = create_website_analyzer()
```

### Competitor Research Tool

```python
def create_competitor_researcher():
    """Create AI-powered competitor research tool."""
    
    validator = ParametersValidator().add_required_field(
        'business_profile_id', 
        create_business_profile_validator()
    )
    
    return create_prompt_tool(
        name='Find Competitors',
        slug='find-competitors',
        description='Find and analyze competitors using AI-powered research',
        prompt_id='pmpt_68aecb2e0708819096cbf4dfc96863f20e5fe4e80a8d9a31',
        parser_type='competitors',
        validator=validator
    )

# Usage  
competitor_tool = create_competitor_researcher()
```

### Multi-Input Analysis Tool

```python
class MarketAnalysisTool(PromptBasedTool):
    """Advanced market analysis with multiple data sources."""
    
    def __init__(self):
        # Complex validation for multiple inputs
        validator = (ParametersValidator()
            .add_required_field('business_profile_id', create_business_profile_validator())
            .add_required_field('market_region', create_required_validator('market_region'))
            .add_optional_field('competitor_urls', create_required_validator('competitor_urls'))
            .add_optional_field('analysis_period', create_required_validator('analysis_period')))
        
        super().__init__(
            name='Market Analysis Tool',
            slug='market-analysis',
            description='Comprehensive market analysis combining business profile, competitor data, and regional insights',
            prompt_id='your_market_analysis_prompt_id',
            parser=create_parser('generic'),
            validator=validator
        )
    
    async def _prepare_openai_message(self, validated_params, input_data):
        """Prepare comprehensive market analysis message."""
        
        # Fetch business profile data
        business_profile = self._get_business_profile(
            validated_params['business_profile_id'],
            input_data.user_id
        )
        
        # Prepare comprehensive context
        context = {
            'business': business_profile.to_dict(),
            'market_region': validated_params['market_region'],
            'competitor_urls': validated_params.get('competitor_urls', []),
            'analysis_period': validated_params.get('analysis_period', '6 months')
        }
        
        return f"""Conduct comprehensive market analysis for:
        
        Business: {context['business']['name']}
        Region: {context['market_region']}
        Analysis Period: {context['analysis_period']}
        
        Business Details:
        - Offer: {context['business']['offer_description']}
        - Target Customer: {context['business']['target_customer']}
        - Problem Solved: {context['business']['problem_solved']}
        
        Known Competitors: {context['competitor_urls']}
        
        Please provide:
        1. Market size and growth trends
        2. Competitive landscape analysis
        3. Market opportunities and threats
        4. Target customer behavior insights
        5. Pricing strategy recommendations
        6. Market entry/expansion strategies
        """
    
    def _get_business_profile(self, profile_id, user_id):
        """Fetch business profile from database."""
        from ....models.business_profile import BusinessProfile
        return BusinessProfile.query.filter_by(
            id=profile_id, 
            user_id=user_id
        ).first()
```

## 🧪 Testing Your Tools

### Unit Testing

```python
import pytest
from app.agents.shared.base_tool import ToolInput

class TestSEOAnalyzerTool:
    """Test suite for SEO Analyzer tool."""
    
    @pytest.fixture
    def seo_tool(self):
        """Create SEO tool instance for testing."""
        return create_seo_analyzer()
    
    @pytest.fixture  
    def valid_input(self):
        """Valid test input."""
        return ToolInput(
            parameters={'url': 'https://example.com'},
            user_id='test-user'
        )
    
    async def test_valid_url_analysis(self, seo_tool, valid_input):
        """Test analysis with valid URL."""
        result = await seo_tool.execute(valid_input)
        
        assert result.success
        assert result.data is not None
        assert 'seo_score' in result.data or 'analysis' in result.data
    
    async def test_invalid_url_validation(self, seo_tool):
        """Test validation with invalid URL."""
        invalid_input = ToolInput(
            parameters={'url': 'not-a-valid-url'},
            user_id='test-user'
        )
        
        result = await seo_tool.execute(invalid_input)
        assert not result.success
        assert 'URL' in result.error or 'url' in result.error
    
    async def test_background_processing(self, seo_tool, valid_input):
        """Test background execution mode."""
        result = await seo_tool.execute(valid_input, background=True)
        
        assert result.success
        assert 'openai_response_id' in result.data
        assert result.data['status'] == 'pending'
```

### Integration Testing

```python
import pytest
from unittest.mock import AsyncMock, patch

class TestToolIntegration:
    """Integration tests for tool system."""
    
    async def test_openai_integration(self):
        """Test OpenAI API integration."""
        tool = create_prompt_tool(
            name='Test Tool',
            slug='test-tool',
            description='Test tool',
            prompt_id='test_prompt_id',
            parser_type='generic'
        )
        
        with patch('app.agents.shared.tool_factory.OpenAIClientFactory') as mock_factory:
            # Mock OpenAI response
            mock_client = AsyncMock()
            mock_client.call_openai.return_value = {
                'success': True,
                'content': '{"result": "test analysis"}'
            }
            mock_factory.get_client.return_value = mock_client
            
            # Execute tool
            result = await tool.execute(ToolInput(
                parameters={}, 
                user_id='test-user'
            ))
            
            assert result.success
            assert result.data is not None
    
    async def test_validation_integration(self):
        """Test validation framework integration."""
        validator = (ParametersValidator()
            .add_required_field('url', create_url_validator())
            .add_required_field('email', EmailValidator()))
        
        tool = create_prompt_tool(
            name='Test Tool',
            slug='test-tool',
            description='Test tool',
            prompt_id='test_prompt_id',
            validator=validator
        )
        
        # Test validation failure
        result = await tool.execute(ToolInput(
            parameters={'url': 'invalid-url'},
            user_id='test-user'
        ))
        
        assert not result.success
        assert 'validation' in result.error.lower()
```

## 🎯 Best Practices

### Tool Design Principles
1. **Single Responsibility**: Each tool should have one clear, focused purpose
2. **Descriptive Naming**: Use names that clearly indicate functionality
3. **Comprehensive Validation**: Validate all inputs thoroughly
4. **Graceful Error Handling**: Provide helpful error messages
5. **Performance Awareness**: Consider execution time and resource usage

### Code Quality
1. **Use Factory Patterns**: Leverage factory functions for consistency
2. **Follow Naming Conventions**: Use clear, consistent naming
3. **Document Custom Logic**: Add docstrings for complex methods
4. **Write Tests**: Cover both success and failure scenarios
5. **Handle Edge Cases**: Consider unusual inputs and scenarios

### Performance Optimization
1. **Efficient Prompts**: Design prompts for optimal AI performance
2. **Smart Caching**: Cache results for repeated operations when appropriate
3. **Background Processing**: Use async mode for long-running operations
4. **Resource Monitoring**: Track OpenAI API usage and costs
5. **Error Recovery**: Implement retry logic for transient failures

## 🔄 Migration from Legacy Tools

### Before (100+ lines of boilerplate)
```python
class OldStyleTool(BaseTool):
    def __init__(self):
        # 20+ lines of configuration
        super().__init__('tool-name', 'Tool description')
        self.openai_client = OpenAIClient()
        self.parser = CustomParser()
        # ... more setup
    
    def _validate_input(self, parameters):
        # 20+ lines of validation logic
        if 'url' not in parameters:
            raise ValidationError("URL required")
        # ... more validation
    
    def _parse_result(self, content):
        # 20+ lines of parsing logic
        try:
            parsed = json.loads(content)
            # ... complex parsing
        except Exception:
            # ... error handling
    
    async def execute(self, input_data):
        # 40+ lines of execution logic
        validated = self._validate_input(input_data.parameters)
        result = await self.openai_client.call(...)
        parsed = self._parse_result(result.content)
        # ... more processing
        return ToolOutput(success=True, data=parsed)
```

### After (5 lines with factories)
```python
tool = create_prompt_tool(
    name='Modern Tool',
    slug='modern-tool',
    description='Same functionality, much cleaner code',
    prompt_id='your_prompt_id',
    parser_type='generic',
    validator=ParametersValidator().add_required_field('url', create_url_validator())
)
```

## 🆘 Troubleshooting

### Common Issues

**Validation Errors**
```
Error: "Field 'url' is required"
Solution: Add required field to validator or provide parameter
```

**Parsing Errors**  
```
Error: "Failed to parse OpenAI result"
Solution: Verify parser type matches expected output format
```

**OpenAI Errors**
```
Error: "Prompt not found"
Solution: Verify prompt_id exists and is accessible
```

**Background Mode Issues**
```  
Error: "Background processing not supported"
Solution: Ensure OpenAI client supports async operations
```

### Debugging Tips

1. **Enable Debug Logging**: Set logging level to DEBUG for detailed execution logs
2. **Test with Simple Inputs**: Start with basic test cases before complex scenarios
3. **Check OpenAI Responses**: Verify AI responses match expected format
4. **Validate Step by Step**: Test validation, execution, and parsing separately
5. **Monitor Resource Usage**: Track OpenAI API calls and response times

---

**Next Steps:**
- Want to use advanced factory patterns? → [Factory Patterns Guide](factory-patterns.md)
- Need robust input validation? → [Validation Guide](validation.md)
- Ready to integrate with OpenAI? → [OpenAI Integration Guide](openai-integration.md)