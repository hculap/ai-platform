import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Target,
  Loader2,
  Copy,
  CheckCircle,
  AlertCircle,
  Sparkles,
  ArrowRight,
  MessageSquare
} from 'lucide-react';
import { generateScriptHooks } from '../services/api';
import {
  ScriptHookGenerationParams,
  ScriptHookGenerationResult,
  ScriptHookCategory
} from '../types';

// Define the 15 content categories
const SCRIPT_HOOK_CATEGORIES: ScriptHookCategory[] = [
  {
    number: '1',
    name: 'Trends / Industry Insight',
    purpose: 'build authority',
    example: '3 AI go-to-market shifts we\'re seeing this quarter (and how to respond).'
  },
  {
    number: '2',
    name: 'Education / How-To / Playbook',
    purpose: 'drive value & saves',
    example: 'How to turn a landing page into a lead engine in 5 steps (templates inside).'
  },
  {
    number: '3',
    name: 'Use Case / Case Study',
    purpose: 'prove ROI',
    example: 'How ACME cut CAC by 27% using agentic outreach (stack + numbers).'
  },
  {
    number: '4',
    name: 'Failure Story / Lessons Learned',
    purpose: 'authenticity & engagement',
    example: 'We shipped the wrong feature first. Here\'s the post-mortem and the 3 guardrails we added.'
  },
  {
    number: '5',
    name: 'News / Announcements',
    purpose: 'awareness',
    example: 'We\'ve just shipped Windows support—why it matters for consumer GPUs.'
  },
  {
    number: '6',
    name: 'Review / Testimonial / Social Proof',
    purpose: 'reduce risk',
    example: '\'Saved us 12h/week.\' — PM at Golem. Full quote + context.'
  },
  {
    number: '7',
    name: 'Feature Spotlight / Mini-Demo',
    purpose: 'activate demand',
    example: '60-sec screen capture: competitor mapping → ICP brief → outreach script.'
  },
  {
    number: '8',
    name: 'Comparison / Benchmark',
    purpose: 'help decisions',
    example: 'Open-source image editors vs hosted: quality, TCO, and edit latency (charts).'
  },
  {
    number: '9',
    name: 'Myth-Busting / Hot Take',
    purpose: 'spark discussion',
    example: 'Hot take: \'Agents replace SDRs\' is wrong. Here\'s the right split of work.'
  },
  {
    number: '10',
    name: 'Data Drop / Research Snippet',
    purpose: 'credibility & shares',
    example: 'From 2147 analyzed sites: top 5 conversion blockers (with examples).'
  },
  {
    number: '11',
    name: 'Behind the Scenes / Build in Public',
    purpose: 'trust',
    example: 'Our roadmap Kanban this week + what slipped (and why).'
  },
  {
    number: '12',
    name: 'Community Question / Poll',
    purpose: 'comments & reach',
    example: 'If you had to cut one GTM tool today, which goes first? (Poll)'
  },
  {
    number: '13',
    name: 'Templates / Checklists / Notion drops',
    purpose: 'saves & bookmarks',
    example: 'Free: AI Growth OS audit checklist (15 checks, copy link inside).'
  },
  {
    number: '14',
    name: 'Events: Live, Recap, Slides',
    purpose: 'FOMO + authority',
    example: 'Slides from my NBX talk: \'Fixing the centralized AI market\' (download).'
  },
  {
    number: '15',
    name: 'Culture / Hiring / Team Spotlight',
    purpose: 'employer brand',
    example: 'Why we hire \'systems\' thinkers first—3 signals from interviews.'
  }
];

interface ScriptHooksGeneratorProps {
  businessProfileId?: string;
  authToken: string;
  onTokenRefreshed?: (newToken: string) => void;
}

const ScriptHooksGenerator: React.FC<ScriptHooksGeneratorProps> = ({
  businessProfileId,
  authToken,
  onTokenRefreshed
}) => {
  const { t } = useTranslation();

  // State
  const [selectedCategory, setSelectedCategory] = useState('');
  const [additionalContext, setAdditionalContext] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generatedHooks, setGeneratedHooks] = useState<ScriptHookGenerationResult | null>(null);
  const [copiedHooks, setCopiedHooks] = useState<Set<number>>(new Set());

  // Get selected category details
  const selectedCategoryData = SCRIPT_HOOK_CATEGORIES.find(
    cat => cat.number === selectedCategory
  );

  // Handle generation
  const handleGenerateHooks = async () => {
    if (!businessProfileId || !selectedCategory) return;

    setIsGenerating(true);
    setGenerationError(null);
    setGeneratedHooks(null);

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
  };

  // Handle copy hook
  const handleCopyHook = async (hook: string, index: number) => {
    try {
      await navigator.clipboard.writeText(hook);
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
  };

  // Reset form
  const handleStartOver = () => {
    setSelectedCategory('');
    setAdditionalContext('');
    setGeneratedHooks(null);
    setGenerationError(null);
    setCopiedHooks(new Set());
  };

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
                {t('scriptHooks.selectToUse', 'Click on any hook to copy it to your clipboard')}
              </p>
            </div>

            {/* Hooks Grid */}
            <div className="grid gap-4">
              {generatedHooks.hooks && generatedHooks.hooks.length > 0 ? (
                generatedHooks.hooks.map((hook, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 hover:shadow-sm transition-all cursor-pointer group"
                    onClick={() => handleCopyHook(hook, index)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-gray-900 flex-1 leading-relaxed">
                        {hook}
                      </p>
                      <div className="flex-shrink-0">
                        {copiedHooks.has(index) ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <Copy className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
                        )}
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