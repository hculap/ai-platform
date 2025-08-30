# Frontend Integration Documentation

Connect your agents seamlessly with the React frontend using our comprehensive integration patterns and API client.

## 🎯 Overview

The frontend integration system provides:
- **Centralized API Client**: All agent calls go through `/src/services/api.ts`
- **Automatic Token Refresh**: JWT tokens refresh automatically
- **Error Handling**: Comprehensive error management with user-friendly messages
- **Background Processing**: Support for long-running agent operations
- **Internationalization**: Multi-language support (Polish/English)

## 🚀 Quick Integration

### Call Any Agent from Frontend

```javascript
// Import the API service
import { callAgent } from '../services/api';

// Call agent synchronously
const result = await callAgent('seo-analyzer', 'seo-analysis', {
  url: 'https://example.com'
}, authToken);

// Call agent with background processing
const backgroundResult = await callAgent('competitors-researcher', 'find-competitors', {
  business_profile_id: profileId,
  background: true
}, authToken);
```

## 🏗️ Integration Architecture

```
Frontend Integration Flow
├── React Components
│   ├── User interaction triggers
│   ├── Loading states management
│   ├── Results display
│   └── Error handling
├── API Service (/src/services/api.ts)
│   ├── Agent execution calls
│   ├── Status polling for background jobs
│   ├── Token refresh handling
│   └── Error transformation
├── HTTP Layer
│   ├── Axios with interceptors
│   ├── Automatic retry logic
│   ├── Request/response logging
│   └── Error standardization
└── Backend Agent System
    ├── Agent registry
    ├── Tool execution
    ├── Background processing
    └── Status management
```

## 📚 Documentation Sections

### Integration Guides
- **[API Integration](api-integration.md)** - HTTP client patterns and error handling
- **[Component Examples](component-examples.md)** - React component integration patterns  
- **[UI Patterns](ui-patterns.md)** - Common interface patterns for agents

## 🔗 API Integration Patterns

### Synchronous Agent Calls

```javascript
const handleAnalysis = async () => {
  setLoading(true);
  setError(null);
  
  try {
    const result = await callAgent('business-concierge', 'analyze-website', {
      url: websiteUrl
    }, authToken);
    
    if (result.success) {
      setAnalysisResult(result.data);
      setMessage('Analysis completed successfully!');
    } else {
      setError(result.error || 'Analysis failed');
    }
  } catch (error) {
    setError('Network error occurred');
  } finally {
    setLoading(false);
  }
};
```

### Background Processing with Status Polling

```javascript
const handleBackgroundAnalysis = async () => {
  setLoading(true);
  
  try {
    // Start background processing
    const initialResult = await callAgent('competitors-researcher', 'find-competitors', {
      business_profile_id: profileId,
      background: true
    }, authToken);
    
    if (initialResult.success) {
      const jobId = initialResult.data.openai_response_id;
      setMessage('Analysis started. Checking progress...');
      
      // Poll for status
      const finalResult = await pollAgentStatus(
        'competitors-researcher', 
        'find-competitors', 
        jobId, 
        authToken
      );
      
      if (finalResult.success) {
        setCompetitors(finalResult.data.competitors);
        setMessage(`Found ${finalResult.data.competitors.length} competitors!`);
      } else {
        setError(finalResult.error);
      }
    } else {
      setError(initialResult.error);
    }
  } catch (error) {
    setError('Failed to start analysis');
  } finally {
    setLoading(false);
  }
};
```

## 🎨 React Component Patterns

### Agent-Powered Analysis Component

```javascript
import React, { useState } from 'react';
import { callAgent } from '../services/api';
import { useTranslation } from 'react-i18next';

const WebsiteAnalyzer = ({ authToken, onAnalysisComplete }) => {
  const { t } = useTranslation();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!url) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await callAgent('business-concierge', 'analyze-website', {
        url: url.trim()
      }, authToken);

      if (response.success) {
        setResult(response.data);
        onAnalysisComplete?.(response.data);
      } else {
        setError(response.error);
      }
    } catch (err) {
      setError(t('common.errors.networkError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="website-analyzer">
      <form onSubmit={handleAnalyze} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            {t('analysis.websiteUrl')}
          </label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            disabled={loading}
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading || !url}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {t('analysis.analyzing')}
            </>
          ) : (
            t('analysis.analyze')
          )}
        </button>
      </form>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {result && (
        <div className="mt-6 space-y-4">
          <h3 className="text-lg font-semibold">{t('analysis.results')}</h3>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium">{t('businessProfile.name')}</h4>
            <p>{result.name || t('common.notAvailable')}</p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium">{t('businessProfile.offerDescription')}</h4>
            <p>{result.offer_description || t('common.notAvailable')}</p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium">{t('businessProfile.targetCustomer')}</h4>
            <p>{result.target_customer || t('common.notAvailable')}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default WebsiteAnalyzer;
```

### Background Processing Component

```javascript
const BackgroundAnalysisComponent = ({ authToken, businessProfileId }) => {
  const { t } = useTranslation();
  const [status, setStatus] = useState('idle'); // idle, running, completed, error
  const [progress, setProgress] = useState(null);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const startAnalysis = async () => {
    setStatus('running');
    setError(null);
    setResults(null);

    try {
      // Start background job
      const response = await callAgent('competitors-researcher', 'find-competitors', {
        business_profile_id: businessProfileId,
        background: true
      }, authToken);

      if (response.success) {
        const jobId = response.data.openai_response_id;
        
        // Poll for completion
        const result = await pollAgentStatus(
          'competitors-researcher',
          'find-competitors', 
          jobId,
          authToken,
          (progressData) => setProgress(progressData) // Progress callback
        );

        if (result.success) {
          setResults(result.data);
          setStatus('completed');
        } else {
          setError(result.error);
          setStatus('error');
        }
      } else {
        setError(response.error);
        setStatus('error');
      }
    } catch (err) {
      setError(t('common.errors.networkError'));
      setStatus('error');
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">{t('competitors.research.title')}</h3>
        
        {status === 'idle' && (
          <button
            onClick={startAnalysis}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            {t('competitors.research.start')}
          </button>
        )}
      </div>

      {status === 'running' && (
        <div className="space-y-3">
          <div className="flex items-center">
            <svg className="animate-spin h-5 w-5 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>{t('competitors.research.analyzing')}</span>
          </div>
          
          {progress && (
            <div className="bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress.percentage || 0}%` }}
              ></div>
            </div>
          )}
        </div>
      )}

      {status === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded p-4">
          <p className="text-red-800">{error}</p>
          <button 
            onClick={() => setStatus('idle')}
            className="mt-2 text-sm text-red-600 hover:text-red-700"
          >
            {t('common.tryAgain')}
          </button>
        </div>
      )}

      {status === 'completed' && results && (
        <div className="space-y-4">
          <div className="flex items-center text-green-600">
            <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>{t('competitors.research.completed')}</span>
          </div>

          <div className="grid gap-4">
            {results.competitors.map((competitor, index) => (
              <div key={index} className="border rounded-lg p-4">
                <h4 className="font-medium">{competitor.name}</h4>
                <p className="text-sm text-gray-600 mt-1">{competitor.description}</p>
                {competitor.url && (
                  <a 
                    href={competitor.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 text-sm mt-2 inline-block"
                  >
                    {competitor.url}
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
```

## 🌐 Internationalization Integration

All agent interactions support internationalization:

```javascript
// Add translations for agent interactions
// src/i18n.ts
const translations = {
  pl: {
    agents: {
      executing: "Wykonywanie...",
      completed: "Zakończone",
      failed: "Nieudane",
      backgroundProcessing: "Przetwarzanie w tle...",
      checkingStatus: "Sprawdzanie statusu..."
    },
    analysis: {
      websiteUrl: "URL strony internetowej",
      analyze: "Analizuj",
      analyzing: "Analizowanie...",
      results: "Wyniki analizy"
    }
  },
  en: {
    agents: {
      executing: "Executing...",
      completed: "Completed", 
      failed: "Failed",
      backgroundProcessing: "Processing in background...",
      checkingStatus: "Checking status..."
    },
    analysis: {
      websiteUrl: "Website URL",
      analyze: "Analyze", 
      analyzing: "Analyzing...",
      results: "Analysis Results"
    }
  }
};
```

## 🎯 Best Practices

### Error Handling
- Always wrap agent calls in try-catch blocks
- Provide user-friendly error messages
- Use loading states to indicate processing
- Handle network failures gracefully

### User Experience
- Show loading indicators for long operations
- Use background processing for time-consuming tasks
- Provide progress updates when possible
- Cache results to avoid repeated calls

### Performance
- Debounce user inputs to avoid excessive API calls
- Use React.memo for expensive components
- Implement proper cleanup for background operations
- Consider pagination for large result sets

### Security
- Always validate inputs before sending to agents
- Handle authentication token expiry
- Sanitize displayed results from AI responses
- Don't expose sensitive configuration in frontend

## 🔄 Integration Checklist

- [ ] **API Service**: Import and configure agent API calls
- [ ] **Error Handling**: Implement comprehensive error management
- [ ] **Loading States**: Add appropriate loading indicators
- [ ] **Background Processing**: Support async operations with status polling
- [ ] **Internationalization**: Add translations for all agent interactions
- [ ] **Validation**: Validate user inputs before sending to backend
- [ ] **Caching**: Implement result caching where appropriate
- [ ] **Testing**: Write tests for agent integration components

---

**Next Steps:**
- Ready to implement API integration? → [API Integration Guide](api-integration.md)
- Need React component examples? → [Component Examples](component-examples.md)
- Want to learn UI patterns? → [UI Patterns Guide](ui-patterns.md)