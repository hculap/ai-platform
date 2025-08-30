# Your First Agent: Website SEO Analyzer

**Difficulty: Beginner | Time: 30 minutes**

Build a complete website SEO analyzer agent from scratch. This tutorial covers all the fundamentals you need to create production-ready agents.

## 🎯 What You'll Build

A **Website SEO Analyzer Agent** that:
- Takes a website URL as input
- Analyzes SEO performance using AI
- Returns structured recommendations
- Integrates with the React frontend
- Supports both Polish and English

**End Result**: A fully functional agent accessible via API and frontend UI.

## 📋 Learning Objectives

By the end of this tutorial, you'll understand:
- ✅ Agent system architecture and patterns
- ✅ Factory function usage for rapid development
- ✅ Input validation with the shared framework
- ✅ OpenAI integration patterns
- ✅ Frontend integration and UI components
- ✅ Testing strategies for agents

## 🛠️ Prerequisites

- Python 3.8+ installed
- Node.js 16+ installed
- Code editor (VS Code recommended)
- Basic understanding of Python and React

## 📝 Step 1: Plan Your Agent

### Requirements Analysis
Our SEO analyzer should:
- Accept a website URL
- Validate the URL format
- Use OpenAI to analyze SEO factors
- Return structured SEO recommendations
- Handle errors gracefully

### Architecture Decision
We'll use:
- **Single-tool agent** (simplest pattern)
- **Prompt-based tool** (using existing OpenAI prompt)
- **Generic parser** (flexible JSON parsing)
- **URL validator** (built-in validation)

## 🏗️ Step 2: Create the Tool

### Create Tool File
```bash
mkdir -p backend/app/agents/seo_analyzer/tools
touch backend/app/agents/seo_analyzer/tools/__init__.py
touch backend/app/agents/seo_analyzer/tools/seoAnalysisTool.py
```

### Implement the Tool
```python
# File: backend/app/agents/seo_analyzer/tools/seoAnalysisTool.py
"""
SEO Analysis Tool - Analyze website SEO performance using AI.
"""

from app.agents.shared.tool_factory import create_prompt_tool
from app.agents.shared.validators import ParametersValidator, create_url_validator

def create_seo_analysis_tool():
    """Create SEO analysis tool using factory pattern."""
    
    # Step 1: Define input validation
    validator = (ParametersValidator()
        .add_required_field('url', create_url_validator())
        .add_optional_field('depth', create_required_validator('depth'))
        .add_optional_field('focus_areas', create_required_validator('focus_areas')))
    
    # Step 2: Create tool using factory
    return create_prompt_tool(
        name='Website SEO Analyzer',
        slug='seo-analysis',
        description='Analyze website SEO performance and provide actionable recommendations',
        prompt_id='pmpt_seo_analysis_comprehensive',  # Replace with your actual prompt ID
        parser_type='generic',  # Flexible JSON parsing
        validator=validator,
        version='1.0.0'
    )

# Create the tool instance
seo_analysis_tool = create_seo_analysis_tool()
```

**💡 Pro Tip**: The factory function handles all the boilerplate - OpenAI integration, error handling, background processing, and more!

### Add Tool to Package
```python
# File: backend/app/agents/seo_analyzer/tools/__init__.py
"""
SEO Analyzer Tools - Website SEO analysis capabilities.
"""

from .seoAnalysisTool import seo_analysis_tool

__all__ = ['seo_analysis_tool']
```

## 🤖 Step 3: Create the Agent

### Create Agent Directory
```bash
touch backend/app/agents/seo_analyzer/__init__.py
```

### Implement the Agent
```python
# File: backend/app/agents/seo_analyzer/__init__.py
"""
SEO Analyzer Agent - AI-powered website SEO analysis.
"""

from ..shared.agent_factory import create_and_register_single_tool_agent
from .tools.seoAnalysisTool import seo_analysis_tool

# Create and auto-register the agent
SEOAnalyzerAgent = create_and_register_single_tool_agent(
    name='SEO Analyzer Agent',
    slug='seo-analyzer',
    short_description='AI-powered website SEO analysis and recommendations',
    description='''Analyzes website SEO performance using advanced AI to identify issues and provide actionable recommendations for improving search engine rankings.
    
    Capabilities:
    - Technical SEO analysis
    - Content optimization suggestions  
    - Performance recommendations
    - Competitive insights
    - Mobile-first considerations
    ''',
    tool=seo_analysis_tool,
    version='1.0.0',
    is_public=True  # Make publicly accessible
)
```

**🎉 Amazing!** Your agent is now created and automatically registered.

## 📦 Step 4: Register the Agent

### Add to Main Agents Package
```python
# File: backend/app/agents/__init__.py
# Add this import to register your agent
from .seo_analyzer import SEOAnalyzerAgent

def initialize_agents() -> None:
    """Initialize all agents."""
    # Your agent is automatically registered via factory function
    # No additional code needed here
    pass
```

## 🧪 Step 5: Test Your Agent

### Create Test Script
```python
# File: test_seo_agent.py
"""
Test script for SEO Analyzer Agent.
"""
import asyncio
import json
from app.agents.base import AgentRegistry, AgentInput

async def test_seo_agent():
    """Test the SEO analyzer agent."""
    print("🧪 Testing SEO Analyzer Agent...")
    
    # Get the registered agent
    agent = AgentRegistry.get('seo-analyzer')
    if not agent:
        print("❌ Agent not found! Check registration.")
        return
    
    print(f"✅ Found agent: {agent.name}")
    
    # Test with a real website
    test_cases = [
        {
            'name': 'Basic URL test',
            'url': 'https://example.com'
        },
        {
            'name': 'Complex URL test',
            'url': 'https://www.google.com',
            'depth': 'comprehensive',
            'focus_areas': ['technical', 'content', 'performance']
        }
    ]
    
    for test_case in test_cases:
        print(f"\n🔍 Running: {test_case['name']}")
        
        # Create input data
        input_data = AgentInput(
            agent_type='seo-analyzer',
            parameters={
                'action': 'seo-analysis',
                **{k: v for k, v in test_case.items() if k != 'name'}
            },
            user_id='test-user-123'
        )
        
        try:
            # Execute the agent
            result = await agent.execute(input_data)
            
            if result.success:
                print(f"✅ Success! Analysis completed.")
                print(f"📊 Result keys: {list(result.data.keys()) if result.data else 'No data'}")
                
                # Pretty print first few results
                if result.data:
                    print(f"📋 Sample data: {json.dumps(result.data, indent=2)[:200]}...")
            else:
                print(f"❌ Failed: {result.error}")
                
        except Exception as e:
            print(f"💥 Exception: {str(e)}")
    
    print("\n🎉 Testing complete!")

# Run the test
if __name__ == "__main__":
    # Initialize agents first
    from app.agents import initialize_agents
    initialize_agents()
    
    # Run tests
    asyncio.run(test_seo_agent())
```

### Run the Test
```bash
cd backend
python test_seo_agent.py
```

**Expected Output:**
```
🧪 Testing SEO Analyzer Agent...
✅ Found agent: SEO Analyzer Agent

🔍 Running: Basic URL test
✅ Success! Analysis completed.
📊 Result keys: ['seo_score', 'recommendations', 'issues']

🔍 Running: Complex URL test  
✅ Success! Analysis completed.
📊 Result keys: ['seo_score', 'recommendations', 'issues']

🎉 Testing complete!
```

## 🌐 Step 6: Frontend Integration

### Create React Component
```javascript
// File: frontend/src/components/SEOAnalyzer.jsx
import React, { useState } from 'react';
import { callAgent } from '../services/api';
import { useTranslation } from 'react-i18next';

const SEOAnalyzer = ({ authToken }) => {
  const { t } = useTranslation();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const handleAnalyze = async (e) => {
    e.preventDefault();
    
    if (!url) return;

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await callAgent('seo-analyzer', 'seo-analysis', {
        url: url.trim(),
        depth: 'standard'
      }, authToken);

      if (response.success) {
        setResults(response.data);
      } else {
        setError(response.error || 'Analysis failed');
      }
    } catch (err) {
      setError(t('common.errors.networkError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">
        {t('seo.analyzer.title', 'SEO Analyzer')}
      </h2>
      
      <form onSubmit={handleAnalyze} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('seo.analyzer.websiteUrl', 'Website URL')}
          </label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading || !url}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {t('seo.analyzer.analyzing', 'Analyzing...')}
            </div>
          ) : (
            t('seo.analyzer.analyze', 'Analyze SEO')
          )}
        </button>
      </form>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex">
            <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="ml-2 text-red-800">{error}</p>
          </div>
        </div>
      )}

      {results && (
        <div className="mt-6 space-y-6">
          {/* SEO Score */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">
              {t('seo.results.score', 'SEO Score')}
            </h3>
            <div className="flex items-center">
              <div className="text-3xl font-bold text-blue-600">
                {results.seo_score || 'N/A'}
              </div>
              <div className="ml-2 text-gray-600">/100</div>
            </div>
          </div>

          {/* Recommendations */}
          {results.recommendations && results.recommendations.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">
                {t('seo.results.recommendations', 'Recommendations')}
              </h3>
              <div className="space-y-3">
                {results.recommendations.map((rec, index) => (
                  <div key={index} className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-medium text-green-800">{rec.title}</h4>
                    <p className="text-green-700 text-sm mt-1">{rec.description}</p>
                    {rec.priority && (
                      <span className={`inline-block px-2 py-1 rounded text-xs mt-2 ${
                        rec.priority === 'high' ? 'bg-red-100 text-red-800' :
                        rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {rec.priority} priority
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Issues */}
          {results.issues && results.issues.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">
                {t('seo.results.issues', 'Issues Found')}
              </h3>
              <div className="space-y-3">
                {results.issues.map((issue, index) => (
                  <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h4 className="font-medium text-red-800">{issue.title}</h4>
                    <p className="text-red-700 text-sm mt-1">{issue.description}</p>
                    {issue.impact && (
                      <p className="text-red-600 text-xs mt-2">Impact: {issue.impact}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SEOAnalyzer;
```

### Add Translations
```javascript
// File: frontend/src/i18n.ts (add these translations)
const translations = {
  pl: {
    seo: {
      analyzer: {
        title: "Analiza SEO",
        websiteUrl: "URL strony internetowej",
        analyze: "Analizuj SEO",
        analyzing: "Analizowanie..."
      },
      results: {
        score: "Wynik SEO",
        recommendations: "Rekomendacje", 
        issues: "Znalezione problemy"
      }
    }
  },
  en: {
    seo: {
      analyzer: {
        title: "SEO Analyzer",
        websiteUrl: "Website URL",
        analyze: "Analyze SEO", 
        analyzing: "Analyzing..."
      },
      results: {
        score: "SEO Score",
        recommendations: "Recommendations",
        issues: "Issues Found"
      }
    }
  }
};
```

## 🚀 Step 7: Test the Complete System

### Backend Test
```bash
cd backend
python test_seo_agent.py
```

### Frontend Test
1. Start the backend: `cd backend && python app.py`
2. Start the frontend: `cd frontend && npm start`
3. Navigate to your component and test with different URLs

## 🎉 Congratulations!

You've successfully built your first complete agent! 🎊

### What You've Accomplished
- ✅ **Created a production-ready agent** using factory patterns
- ✅ **Implemented input validation** with the shared framework
- ✅ **Integrated with OpenAI** for intelligent analysis
- ✅ **Built a React component** for frontend interaction
- ✅ **Added internationalization** support
- ✅ **Tested the complete system** end-to-end

### Your Agent Features
- **URL validation** prevents invalid inputs
- **OpenAI integration** provides intelligent analysis
- **Background processing** support (automatic)
- **Error handling** with user-friendly messages
- **Multilingual support** (Polish/English)
- **Responsive UI** with loading states

## 🔧 Next Steps & Enhancements

### Easy Enhancements (15 minutes each)
1. **Add more validation**: Include domain validation or URL reachability checks
2. **Enhance the UI**: Add progress bars or result export functionality
3. **Add more parameters**: Include analysis depth options or focus areas

### Intermediate Enhancements (30-60 minutes each)
1. **Background processing**: Add support for analyzing multiple URLs
2. **Result caching**: Cache analysis results to avoid repeated API calls
3. **Historical tracking**: Store and display analysis history

### Advanced Enhancements (1-2 hours each)
1. **Custom tool logic**: Override `_prepare_openai_message` for custom prompts
2. **External integrations**: Connect to Google PageSpeed or other SEO tools
3. **Multi-tool agent**: Add related tools like performance analysis

### Production Improvements
1. **Comprehensive testing**: Add unit, integration, and E2E tests
2. **Error monitoring**: Integrate with Sentry or similar tools
3. **Performance optimization**: Add caching and rate limiting
4. **Security hardening**: Add input sanitization and rate limiting

## 📚 What to Learn Next

### For Frontend Developers
- [React Component Patterns](../frontend/component-examples.md)
- [UI Design Patterns](../frontend/ui-patterns.md)
- [Advanced API Integration](../frontend/api-integration.md)

### For Backend Developers  
- [Advanced Tool Development](../tools/creation-guide.md)
- [Multi-Tool Agent Architecture](marketing-agent.md)
- [Custom Integration Patterns](custom-integration.md)

### For DevOps/Production
- [Deployment Strategies](../deployment/README.md)
- [Performance Optimization](../deployment/performance.md)
- [Monitoring & Observability](../deployment/monitoring.md)

## 🤝 Share Your Success!

Built something cool with your first agent? We'd love to hear about it!
- Share screenshots of your working agent
- Contribute improvements to this tutorial
- Help other learners in discussions
- Build upon this foundation for your own projects

---

**🎊 Well done!** You've mastered the fundamentals of agent development. The skills you've learned here will serve as the foundation for building more complex and powerful agents.