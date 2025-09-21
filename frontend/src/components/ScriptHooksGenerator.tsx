import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Target,
  Loader2,
  Copy,
  CheckCircle,
  AlertCircle,
  Sparkles,
  ArrowRight,
  MessageSquare,
  FileText
} from 'lucide-react';
import { generateScriptHooks, getCreditBalance } from '../services/api';
import { dispatchCreditUpdate } from '../utils/creditEvents';
import {
  ScriptHookGenerationParams,
  ScriptHookGenerationResult,
  ScriptHookCategory,
  ScriptHook
} from '../types';

// Define the 15 content categories using translations
const getScriptHookCategories = (t: any): ScriptHookCategory[] => [
  {
    number: '1',
    name: t('scriptHooks.categories.1.name', 'Trends / Industry Insight'),
    purpose: t('scriptHooks.categories.1.purpose', 'build authority'),
    example: t('scriptHooks.categories.1.example', '3 AI go-to-market shifts we\'re seeing this quarter (and how to respond).')
  },
  {
    number: '2',
    name: t('scriptHooks.categories.2.name', 'Education / How-To / Playbook'),
    purpose: t('scriptHooks.categories.2.purpose', 'drive value & saves'),
    example: t('scriptHooks.categories.2.example', 'How to turn a landing page into a lead engine in 5 steps (templates inside).')
  },
  {
    number: '3',
    name: t('scriptHooks.categories.3.name', 'Use Case / Case Study'),
    purpose: t('scriptHooks.categories.3.purpose', 'prove ROI'),
    example: t('scriptHooks.categories.3.example', 'How ACME cut CAC by 27% using agentic outreach (stack + numbers).')
  },
  {
    number: '4',
    name: t('scriptHooks.categories.4.name', 'Failure Story / Lessons Learned'),
    purpose: t('scriptHooks.categories.4.purpose', 'authenticity & engagement'),
    example: t('scriptHooks.categories.4.example', 'We shipped the wrong feature first. Here\'s the post-mortem and the 3 guardrails we added.')
  },
  {
    number: '5',
    name: t('scriptHooks.categories.5.name', 'News / Announcements'),
    purpose: t('scriptHooks.categories.5.purpose', 'awareness'),
    example: t('scriptHooks.categories.5.example', 'We\'ve just shipped Windows support—why it matters for consumer GPUs.')
  },
  {
    number: '6',
    name: t('scriptHooks.categories.6.name', 'Review / Testimonial / Social Proof'),
    purpose: t('scriptHooks.categories.6.purpose', 'reduce risk'),
    example: t('scriptHooks.categories.6.example', '\'Saved us 12h/week.\' — PM at Golem. Full quote + context.')
  },
  {
    number: '7',
    name: t('scriptHooks.categories.7.name', 'Feature Spotlight / Mini-Demo'),
    purpose: t('scriptHooks.categories.7.purpose', 'activate demand'),
    example: t('scriptHooks.categories.7.example', '60-sec screen capture: competitor mapping → ICP brief → outreach script.')
  },
  {
    number: '8',
    name: t('scriptHooks.categories.8.name', 'Comparison / Benchmark'),
    purpose: t('scriptHooks.categories.8.purpose', 'help decisions'),
    example: t('scriptHooks.categories.8.example', 'Open-source image editors vs hosted: quality, TCO, and edit latency (charts).')
  },
  {
    number: '9',
    name: t('scriptHooks.categories.9.name', 'Myth-Busting / Hot Take'),
    purpose: t('scriptHooks.categories.9.purpose', 'spark discussion'),
    example: t('scriptHooks.categories.9.example', 'Hot take: \'Agents replace SDRs\' is wrong. Here\'s the right split of work.')
  },
  {
    number: '10',
    name: t('scriptHooks.categories.10.name', 'Data Drop / Research Snippet'),
    purpose: t('scriptHooks.categories.10.purpose', 'credibility & shares'),
    example: t('scriptHooks.categories.10.example', 'From 2147 analyzed sites: top 5 conversion blockers (with examples).')
  },
  {
    number: '11',
    name: t('scriptHooks.categories.11.name', 'Behind the Scenes / Build in Public'),
    purpose: t('scriptHooks.categories.11.purpose', 'trust'),
    example: t('scriptHooks.categories.11.example', 'Our roadmap Kanban this week + what slipped (and why).')
  },
  {
    number: '12',
    name: t('scriptHooks.categories.12.name', 'Community Question / Poll'),
    purpose: t('scriptHooks.categories.12.purpose', 'comments & reach'),
    example: t('scriptHooks.categories.12.example', 'If you had to cut one GTM tool today, which goes first? (Poll)')
  },
  {
    number: '13',
    name: t('scriptHooks.categories.13.name', 'Templates / Checklists / Notion drops'),
    purpose: t('scriptHooks.categories.13.purpose', 'saves & bookmarks'),
    example: t('scriptHooks.categories.13.example', 'Free: AI Growth OS audit checklist (15 checks, copy link inside).')
  },
  {
    number: '14',
    name: t('scriptHooks.categories.14.name', 'Events: Live, Recap, Slides'),
    purpose: t('scriptHooks.categories.14.purpose', 'FOMO + authority'),
    example: t('scriptHooks.categories.14.example', 'Slides from my NBX talk: \'Fixing the centralized AI market\' (download).')
  },
  {
    number: '15',
    name: t('scriptHooks.categories.15.name', 'Culture / Hiring / Team Spotlight'),
    purpose: t('scriptHooks.categories.15.purpose', 'employer brand'),
    example: t('scriptHooks.categories.15.example', 'Why we hire \'systems\' thinkers first—3 signals from interviews.')
  }
];

interface ScriptHooksGeneratorProps {
  businessProfileId?: string;
  authToken: string;
  onTokenRefreshed?: (newToken: string) => void;
  onHookSelected?: (hook: string) => void;
}

const ScriptHooksGenerator: React.FC<ScriptHooksGeneratorProps> = ({
  businessProfileId,
  authToken,
  onTokenRefreshed,
  onHookSelected
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Get localized categories
  const SCRIPT_HOOK_CATEGORIES = getScriptHookCategories(t);

  // Generate storage key based on businessProfileId for isolation
  const storageKey = `scriptHooks_${businessProfileId}`;

  // State with localStorage persistence
  const [selectedCategory, setSelectedCategory] = useState('');
  const [additionalContext, setAdditionalContext] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generatedHooks, setGeneratedHooks] = useState<ScriptHookGenerationResult | null>(null);
  const [copiedHooks, setCopiedHooks] = useState<Set<number>>(new Set());

  // Restore results from localStorage on component mount
  useEffect(() => {
    const savedResults = localStorage.getItem(storageKey);
    if (savedResults) {
      try {
        const parsed = JSON.parse(savedResults);
        if (parsed.generatedHooks && parsed.timestamp && Date.now() - parsed.timestamp < 3600000) { // 1 hour
          setGeneratedHooks(parsed.generatedHooks);
          setSelectedCategory(parsed.selectedCategory || '');
          setAdditionalContext(parsed.additionalContext || '');
        } else {
          // Clear expired data
          localStorage.removeItem(storageKey);
        }
      } catch (error) {
        console.error('Error loading saved hooks:', error);
        localStorage.removeItem(storageKey);
      }
    }
  }, [storageKey]);

  // Save results to localStorage whenever they change
  useEffect(() => {
    if (generatedHooks) {
      const dataToSave = {
        generatedHooks,
        selectedCategory,
        additionalContext,
        timestamp: Date.now()
      };
      localStorage.setItem(storageKey, JSON.stringify(dataToSave));
    }
  }, [generatedHooks, selectedCategory, additionalContext, storageKey]);

  // Get selected category details with memoization
  const selectedCategoryData = useMemo(() =>
    SCRIPT_HOOK_CATEGORIES.find(cat => cat.number === selectedCategory),
    [SCRIPT_HOOK_CATEGORIES, selectedCategory]
  );

  // Clear saved results when starting new generation
  const clearSavedResults = useCallback(() => {
    localStorage.removeItem(storageKey);
  }, [storageKey]);

  // Handle generation with optimization
  const handleGenerateHooks = useCallback(async () => {
    if (!businessProfileId || !selectedCategory) return;

    // Clear previous results and saved data
    setIsGenerating(true);
    setGenerationError(null);
    setGeneratedHooks(null);
    clearSavedResults();

    const params: ScriptHookGenerationParams = {
      business_profile_id: businessProfileId,
      category: selectedCategory,
      additional_context: additionalContext.trim() || undefined
    };

    try {
      const result = await generateScriptHooks(params, authToken);

      if (result.success && result.data) {
        setGeneratedHooks(result.data);
        console.log('Script hooks generated:', result.data);

        // Update credits and dispatch event for real-time updates
        try {
          const creditResult = await getCreditBalance();
          if (creditResult.success && creditResult.data) {
            dispatchCreditUpdate({
              userId: 'current-user',
              newBalance: creditResult.data.balance,
              toolSlug: 'writer-agent'
            });
          }
        } catch (creditError) {
          console.error('Error updating credits after script hooks generation:', creditError);
        }
      } else {
        setGenerationError(result.error || 'Failed to generate script hooks');
        
        if (result.isTokenExpired && onTokenRefreshed) {
          // Handle token refresh if needed
          console.log('Token expired, may need refresh');
        }
      }
    } catch (error: any) {
      console.error('Error generating script hooks:', error);
      setGenerationError('An unexpected error occurred');
    } finally {
      setIsGenerating(false);
    }
  }, [businessProfileId, selectedCategory, additionalContext, authToken, clearSavedResults, onTokenRefreshed]);

  // Handle copy hook with optimization
  const handleCopyHook = useCallback(async (hook: ScriptHook | string, index: number) => {
    try {
      const hookText = typeof hook === 'string' ? hook : hook.hook;
      await navigator.clipboard.writeText(hookText);
      setCopiedHooks(prev => new Set(prev).add(index));
      
      // Remove from copied set after 2 seconds
      setTimeout(() => {
        setCopiedHooks(prev => {
          const newSet = new Set(prev);
          newSet.delete(index);
          return newSet;
        });
      }, 2000);
    } catch (error) {
      console.error('Failed to copy hook:', error);
    }
  }, []);

  // Handle start over - clear all results and return to form
  const handleStartOver = useCallback(() => {
    setGeneratedHooks(null);
    setSelectedCategory('');
    setAdditionalContext('');
    setGenerationError(null);
    setCopiedHooks(new Set());
    clearSavedResults();
  }, [clearSavedResults]);

  // Handle use hook for script generation with optimization
  const handleUseHook = useCallback((hook: ScriptHook | string) => {
    const hookText = typeof hook === 'string' ? hook : hook.hook;
    
    // Use callback if available (modal-based approach)
    if (onHookSelected) {
      onHookSelected(hookText);
    } else {
      // Fallback to navigation (route-based approach for backward compatibility)
      const encodedHook = encodeURIComponent(hookText);
      navigate(`/dashboard/scripts/generate?hook=${encodedHook}`);
    }
  }, [onHookSelected, navigate]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
            <Target className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              {t('scriptHooks.title', 'Script Hooks Generator')}
            </h3>
            <p className="text-gray-600 text-sm">
              {t('scriptHooks.description', 'Generate compelling content hooks based on proven categories')}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {!generatedHooks ? (
          // Setup Form
          <div className="space-y-6">
            {/* Category Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('scriptHooks.selectCategory', 'Select Content Category')} *
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isGenerating}
              >
                <option value="">
                  {t('scriptHooks.chooseCategoryPlaceholder', 'Choose a category...')}
                </option>
                {SCRIPT_HOOK_CATEGORIES.map((category) => (
                  <option key={category.number} value={category.number}>
                    {category.number}. {category.name} — {category.purpose}
                  </option>
                ))}
              </select>
            </div>

            {/* Category Preview */}
            {selectedCategoryData && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <MessageSquare className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900 mb-1">
                      {selectedCategoryData.name}
                    </h4>
                    <p className="text-sm text-blue-700 mb-2">
                      <strong>Purpose:</strong> {selectedCategoryData.purpose}
                    </p>
                    <p className="text-sm text-blue-600">
                      <strong>Example:</strong> {selectedCategoryData.example}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Additional Context */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('scriptHooks.additionalContext', 'Additional Context')} 
                <span className="text-gray-500 font-normal ml-1">
                  {t('scriptHooks.optional', '(optional)')}
                </span>
              </label>
              <textarea
                value={additionalContext}
                onChange={(e) => setAdditionalContext(e.target.value)}
                placeholder={t('scriptHooks.contextPlaceholder', 'Add any specific details, recent events, or focus areas...')}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isGenerating}
              />
            </div>

            {/* Error Display */}
            {generationError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <p className="text-sm text-red-700">{generationError}</p>
                </div>
              </div>
            )}

            {/* Generate Button */}
            <div className="flex justify-end">
              <button
                onClick={handleGenerateHooks}
                disabled={!businessProfileId || !selectedCategory || isGenerating}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t('scriptHooks.generating', 'Generating Hooks...')}
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    {t('scriptHooks.generateHooks', 'Generate Script Hooks')}
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          // Results Display
          <div className="space-y-6">
            {/* Results Header */}
            <div className="text-center">
              <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium mb-4">
                <CheckCircle className="w-4 h-4" />
                {t('scriptHooks.hooksGenerated', 'Script Hooks Generated')}
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                {generatedHooks.hook_count} hooks for "{generatedHooks.category?.name || 'Selected Category'}"
              </h4>
              <p className="text-gray-600 text-sm">
                {t('scriptHooks.selectToUse', 'Kopiuj hooki do schowka lub użyj ich do generowania pełnych skryptów')}
              </p>
            </div>

            {/* Hooks Grid */}
            <div className="grid gap-4">
              {generatedHooks.hooks && generatedHooks.hooks.length > 0 ? (
                generatedHooks.hooks.map((hook, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 hover:shadow-sm transition-all group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-gray-900 flex-1 leading-relaxed">
                        {typeof hook === 'string' ? hook : (hook as ScriptHook).hook}
                      </p>
                      
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {/* Copy Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyHook(hook, index);
                          }}
                          className="p-2 rounded-lg hover:bg-gray-100 transition-colors group/copy"
                          title={t('scriptHooks.copyHook', 'Kopiuj hook')}
                        >
                          {copiedHooks.has(index) ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4 text-gray-400 group-hover/copy:text-gray-600 transition-colors" />
                          )}
                        </button>
                        
                        {/* Use Hook Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUseHook(hook);
                          }}
                          className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg text-sm font-medium hover:from-blue-700 hover:to-purple-700 transition-all shadow-sm flex items-center gap-1.5"
                          title={t('scriptHooks.useHook', 'Użyj tego hooka do generowania skryptu')}
                        >
                          <FileText className="w-3 h-3" />
                          {t('scriptHooks.useHook', 'Użyj Hook')}
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600">No hooks were generated. Please try again.</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-center pt-4">
              <button
                onClick={handleStartOver}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center gap-2"
              >
                <ArrowRight className="w-4 h-4 rotate-180" />
                {t('scriptHooks.generateMore', 'Generate More Hooks')}
              </button>
            </div>
          </div>
        )}

        {/* No Business Profile Warning */}
        {!businessProfileId && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <p className="text-sm text-yellow-700">
                {t('scriptHooks.noBusinessProfile', 'Please create a business profile first to generate script hooks.')}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScriptHooksGenerator;