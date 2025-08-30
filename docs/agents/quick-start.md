# Agent Quick Start Guide

Get your first agent running in **5 minutes** with this step-by-step guide. We'll create a simple website SEO analyzer agent that demonstrates all the core concepts.

## 🎯 What You'll Build

A complete SEO analysis agent that:
- Takes a website URL as input
- Uses OpenAI to analyze SEO performance
- Returns structured recommendations
- Integrates with the frontend automatically

## ⚡ 5-Minute Setup

### Step 1: Create Your Tool (2 minutes)

```python
# File: backend/app/agents/seo_analyzer/tools/seoAnalysisTool.py
from app.agents.shared.tool_factory import create_prompt_tool
from app.agents.shared.validators import ParametersValidator, create_url_validator

def create_seo_analysis_tool():
    # Create input validator
    validator = ParametersValidator().add_required_field('url', create_url_validator())
    
    # Create the tool using factory pattern
    return create_prompt_tool(
        name='Website SEO Analyzer',
        slug='seo-analysis',
        description='Analyze website SEO performance and provide actionable recommendations',
        prompt_id='your_openai_prompt_id_here',  # Replace with your OpenAI prompt ID
        parser_type='generic',  # Can be 'business_profile', 'competitors', 'list', or 'generic'
        validator=validator
    )

# Create the tool instance
seo_analysis_tool = create_seo_analysis_tool()
```

### Step 2: Create Your Agent (2 minutes)

```python
# File: backend/app/agents/seo_analyzer/__init__.py
"""
SEO Analyzer Agent - AI-powered SEO analysis and recommendations.
"""

from ..shared.agent_factory import create_and_register_single_tool_agent
from .tools.seoAnalysisTool import seo_analysis_tool

# Create and auto-register the agent
SEOAnalyzerAgent = create_and_register_single_tool_agent(
    name='SEO Analysis Agent',
    slug='seo-analyzer',
    short_description='AI-powered SEO analysis and recommendations',
    description='Analyzes website SEO performance, identifies issues, and provides actionable recommendations for improvement.',
    tool=seo_analysis_tool,
    version='1.0.0',
    is_public=True  # Set to False if authentication is required
)
```

### Step 3: Register Your Agent (1 minute)

```python
# File: backend/app/agents/__init__.py
# Add this import to register your agent
from .seo_analyzer import SEOAnalyzerAgent

def initialize_agents() -> None:
    """Initialize all agents. Your agent is auto-registered via factory."""
    # No additional code needed - factory handles registration
    pass
```

**🎉 Done!** Your agent is now available at the `/api/agents/seo-analyzer/tools/seo-analysis/call` endpoint.

## 🧪 Test Your Agent

### Quick Test Script

```python
# File: test_seo_agent.py
import asyncio
from app.agents.base import AgentRegistry, AgentInput

async def test_seo_agent():
    # Get your agent
    agent = AgentRegistry.get('seo-analyzer')
    
    # Create input
    input_data = AgentInput(
        agent_type='seo-analyzer',
        parameters={
            'action': 'seo-analysis',
            'url': 'https://example.com'
        },
        user_id='test-user'
    )
    
    # Execute
    result = await agent.execute(input_data)
    
    print(f"Success: {result.success}")
    if result.success:
        print(f"SEO Analysis: {result.data}")
    else:
        print(f"Error: {result.error}")

# Run the test
if __name__ == "__main__":
    asyncio.run(test_seo_agent())
```

### Frontend Integration

Your agent automatically works with the frontend! Users can access it through:

```javascript
// Frontend API call
const result = await api.callAgent('seo-analyzer', 'seo-analysis', {
  url: 'https://example.com'
});
```

## 🚀 Advanced Patterns

### Multi-Tool Agent

For agents that need multiple capabilities:

```python
from app.agents.shared.agent_factory import create_and_register_standard_agent
from app.agents.shared.tool_factory import create_prompt_tool

# Create multiple tools
seo_tool = create_prompt_tool(...)
performance_tool = create_prompt_tool(...)
security_tool = create_prompt_tool(...)

# Create multi-tool agent
website_agent = create_and_register_standard_agent(
    name='Website Analysis Agent',
    slug='website-analyzer',
    short_description='Comprehensive website analysis',
    description='Provides SEO, performance, and security analysis for websites.',
    tools={
        'seo-analysis': seo_tool,
        'performance-analysis': performance_tool,
        'security-analysis': security_tool
    },
    is_public=True
)
```

### Custom Tool Logic

For specialized processing:

```python
from app.agents.shared.tool_factory import PromptBasedTool

class CustomSEOTool(PromptBasedTool):
    def __init__(self):
        super().__init__(
            name='Advanced SEO Analyzer',
            slug='advanced-seo',
            description='Advanced SEO analysis with custom logic',
            prompt_id='your_prompt_id'
        )
    
    async def _prepare_openai_message(self, validated_params, input_data):
        """Customize the OpenAI prompt"""
        url = validated_params['url']
        return f"Perform comprehensive SEO analysis for: {url}\nFocus on technical SEO, content quality, and user experience."
    
    async def _process_openai_result(self, content, validated_params, openai_result, user_id):
        """Process the AI response"""
        parsed = self.parser.parse(content)
        
        # Add custom processing
        return {
            'seo_score': self._calculate_seo_score(parsed),
            'recommendations': parsed.get('recommendations', []),
            'technical_issues': parsed.get('issues', []),
            'analysis_date': time.time()
        }
    
    def _calculate_seo_score(self, data):
        # Custom scoring logic
        return min(100, len(data.get('positives', [])) * 10)
```

## 🔧 Configuration Options

### Input Validation

```python
from app.agents.shared.validators import (
    ParametersValidator, 
    create_url_validator,
    create_required_validator,
    create_business_profile_validator
)

# URL validation
validator = ParametersValidator().add_required_field('url', create_url_validator())

# Multiple fields
validator = (ParametersValidator()
    .add_required_field('url', create_url_validator())
    .add_required_field('business_profile_id', create_business_profile_validator())
    .add_optional_field('language', create_required_validator('language')))
```

### Content Parsing

```python
# Business profile data
parser_type = 'business_profile'

# Competitor lists  
parser_type = 'competitors'

# Generic lists with custom key
parser_type = 'list'
parser_kwargs = {'list_key': 'results'}

# Flexible generic parsing
parser_type = 'generic'
```

### Background Processing

```python
# Your agent automatically supports background mode
# Frontend can request async processing:
{
    "url": "https://example.com",
    "background": true  // Returns job ID for status polling
}
```

## 📂 File Structure

Organize your agent files:

```
backend/app/agents/
├── your_agent_name/
│   ├── __init__.py          # Agent registration
│   └── tools/               # Agent tools
│       ├── __init__.py
│       └── your_tool.py     # Tool implementation
```

## ✅ Best Practices Checklist

- [ ] **Descriptive Naming**: Clear agent and tool names
- [ ] **Input Validation**: Use appropriate validators
- [ ] **Error Handling**: Leverage factory error handling
- [ ] **Documentation**: Add docstrings and comments
- [ ] **Testing**: Write unit tests for custom logic
- [ ] **Security**: Set appropriate `is_public` flag
- [ ] **Performance**: Consider background processing for long operations

## 🎯 Common Patterns

### URL Analysis Agent
```python
validator = ParametersValidator().add_required_field('url', create_url_validator())
parser_type = 'generic'
```

### Business Profile Agent
```python
validator = ParametersValidator().add_required_field(
    'business_profile_id', 
    create_business_profile_validator()
)
parser_type = 'business_profile'
```

### Research Agent
```python
parser_type = 'competitors'  # For competitor research
parser_type = 'list'         # For general research results
```

## 🆘 Need Help?

- **Agent not working?** → Check [Troubleshooting Guide](troubleshooting.md)
- **Want more examples?** → Browse [Examples](examples/)
- **Need custom validation?** → See [Tools Documentation](../tools/)
- **Frontend integration issues?** → Check [Frontend Guide](../frontend/)

## 🚀 Next Steps

1. **Create your first agent** using this guide
2. **Test it thoroughly** with different inputs
3. **Add frontend integration** for user access
4. **Learn advanced patterns** in the [Development Guide](development-guide.md)
5. **Optimize for production** with the [Performance Guide](performance.md)

---

**Congratulations!** You've created your first AI agent. The factory patterns handle all the complexity, so you can focus on your agent's unique value proposition.