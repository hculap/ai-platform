import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  FileText,
  Loader2,
  CheckCircle,
  AlertCircle,
  Sparkles,
  ArrowLeft,
  Save,
  Eye,
  Palette
} from 'lucide-react';
import { generateScript } from '../services/api';
import {
  ScriptGenerationParams,
  ScriptGenerationResult,
  ScriptType,
  ScriptTypeInfo,
  GeneratedScript
} from '../types';

// Define script type information
const getScriptTypes = (t: any): Record<ScriptType, ScriptTypeInfo> => ({
  post: {
    name: t('scriptGenerator.types.post', 'Social Media Post'),
    description: t('scriptGenerator.types.postDesc', 'Short-form content for social media platforms'),
    max_length: t('scriptGenerator.types.postLength', '1-3 paragraphs')
  },
  blog: {
    name: t('scriptGenerator.types.blog', 'Blog Article'),
    description: t('scriptGenerator.types.blogDesc', 'Long-form content for blogs and websites'),
    max_length: t('scriptGenerator.types.blogLength', '500-2000 words')
  },
  script_youtube: {
    name: t('scriptGenerator.types.youtube', 'YouTube Script'),
    description: t('scriptGenerator.types.youtubeDesc', 'Video script optimized for YouTube format'),
    max_length: t('scriptGenerator.types.youtubeLength', '3-10 minutes speaking time')
  },
  script_tiktok_reel: {
    name: t('scriptGenerator.types.tiktokReel', 'TikTok/Reel Script'),
    description: t('scriptGenerator.types.tiktokReelDesc', 'Short video script for TikTok or Instagram Reels'),
    max_length: t('scriptGenerator.types.tiktokReelLength', '15-60 seconds speaking time')
  },
  script_vsl: {
    name: t('scriptGenerator.types.vsl', 'Video Sales Letter (VSL)'),
    description: t('scriptGenerator.types.vslDesc', 'Sales-focused video script for conversions'),
    max_length: t('scriptGenerator.types.vslLength', '5-20 minutes speaking time')
  },
  general: {
    name: t('scriptGenerator.types.general', 'General Script'),
    description: t('scriptGenerator.types.generalDesc', 'General purpose content script'),
    max_length: t('scriptGenerator.types.generalLength', 'Variable length')
  }
});

interface ScriptGeneratorProps {
  businessProfileId?: string;
  authToken: string;
  onTokenRefreshed?: (newToken: string) => void;
  userStyles?: Array<{
    id: string;
    style_name: string;
    language: string;
    content_types: string[];
  }>;
  offers?: Array<{
    id: string;
    name: string;
    type: string;
    description?: string;
    price?: string;
    unit?: string;
  }>;
  campaigns?: Array<{
    id: string;
    goal: string;
    target_audience?: string;
  }>;
}

const ScriptGenerator: React.FC<ScriptGeneratorProps> = ({
  businessProfileId,
  authToken,
  onTokenRefreshed,
  userStyles = [],
  offers = [],
  campaigns = []
}) => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Get localized script types
  const SCRIPT_TYPES = getScriptTypes(t);

  // Get prefilled hook from URL params
  const prefilledHook = searchParams.get('hook') || '';

  // State
  const [selectedHook, setSelectedHook] = useState(prefilledHook);
  const [scriptType, setScriptType] = useState<ScriptType>('general');
  const [styleId, setStyleId] = useState('');
  const [additionalContext, setAdditionalContext] = useState('');
  const [contextType, setContextType] = useState<'none' | 'offer' | 'campaign'>('none');
  const [offerId, setOfferId] = useState('');
  const [campaignId, setCampaignId] = useState('');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generatedScript, setGeneratedScript] = useState<ScriptGenerationResult | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Get selected script type details
  const selectedScriptType = SCRIPT_TYPES[scriptType];

  // Handle generation
  const handleGenerateScript = async () => {
    if (!businessProfileId || !selectedHook.trim()) return;

    setIsGenerating(true);
    setGenerationError(null);
    setGeneratedScript(null);

    const params: ScriptGenerationParams = {
      selected_hook: selectedHook.trim(),
      script_type: scriptType,
      business_profile_id: businessProfileId,
      style_id: styleId || undefined,
      additional_context: additionalContext.trim() || undefined,
      offer_id: contextType === 'offer' ? offerId : undefined,
      campaign_id: contextType === 'campaign' ? campaignId : undefined
    };

    try {
      const result = await generateScript(params, authToken);

      if (result.success && result.data) {
        setGeneratedScript(result.data);
        setShowPreview(true);
        console.log('Script generated:', result.data);
      } else {
        setGenerationError(result.error || 'Failed to generate script');
        
        if (result.isTokenExpired && onTokenRefreshed) {
          console.log('Token expired, may need refresh');
        }
      }
    } catch (error: any) {
      console.error('Error generating script:', error);
      setGenerationError('An unexpected error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle context type change
  const handleContextTypeChange = (newType: 'none' | 'offer' | 'campaign') => {
    setContextType(newType);
    setOfferId('');
    setCampaignId('');
  };

  // Reset form
  const handleStartOver = () => {
    setGeneratedScript(null);
    setShowPreview(false);
    setGenerationError(null);
  };

  // Navigate back to hooks generator
  const handleBackToHooks = () => {
    navigate(-1);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                {t('scriptGenerator.title', 'Script Generator')}
              </h3>
              <p className="text-gray-600 text-sm">
                {t('scriptGenerator.description', 'Generate complete scripts from hooks')}
              </p>
            </div>
          </div>
          <button
            onClick={handleBackToHooks}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">{t('scriptGenerator.backToHooks', 'Back to Hooks')}</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {!showPreview ? (
          // Setup Form
          <div className="space-y-6">
            {/* Hook Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('scriptGenerator.selectedHook', 'Script Hook')} *
              </label>
              <textarea
                value={selectedHook}
                onChange={(e) => setSelectedHook(e.target.value)}
                placeholder={t('scriptGenerator.hookPlaceholder', 'Enter or paste your hook here...')}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isGenerating}
              />
            </div>

            {/* Script Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('scriptGenerator.scriptType', 'Script Type')} *
              </label>
              <select
                value={scriptType}
                onChange={(e) => setScriptType(e.target.value as ScriptType)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isGenerating}
              >
                {Object.entries(SCRIPT_TYPES).map(([type, info]) => (
                  <option key={type} value={type}>
                    {info.name} - {info.description}
                  </option>
                ))}
              </select>
              
              {/* Script Type Info */}
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <FileText className="w-4 h-4 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-blue-900 font-medium">
                      {selectedScriptType.name}
                    </p>
                    <p className="text-sm text-blue-700 mb-1">
                      {selectedScriptType.description}
                    </p>
                    <p className="text-xs text-blue-600">
                      <strong>Target Length:</strong> {selectedScriptType.max_length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Style Selection */}
            {userStyles.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('scriptGenerator.clonedStyle', 'Cloned Style')} 
                  <span className="text-gray-500 font-normal ml-1">
                    {t('scriptGenerator.optional', '(optional)')}
                  </span>
                </label>
                <select
                  value={styleId}
                  onChange={(e) => setStyleId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isGenerating}
                >
                  <option value="">
                    {t('scriptGenerator.noStyle', 'No specific style')}
                  </option>
                  {userStyles.map((style) => (
                    <option key={style.id} value={style.id}>
                      {style.style_name} ({style.language}) - {style.content_types.join(', ')}
                    </option>
                  ))}
                </select>
                
                {styleId && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-green-700">
                    <Palette className="w-4 h-4" />
                    <span>{t('scriptGenerator.styleSelected', 'Style will be applied to generated script')}</span>
                  </div>
                )}
              </div>
            )}

            {/* Context Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('scriptGenerator.focusContext', 'Focus Context')} 
                <span className="text-gray-500 font-normal ml-1">
                  {t('scriptGenerator.optional', '(optional)')}
                </span>
              </label>
              
              <div className="space-y-3">
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="contextType"
                      value="none"
                      checked={contextType === 'none'}
                      onChange={() => handleContextTypeChange('none')}
                      className="mr-2"
                      disabled={isGenerating}
                    />
                    {t('scriptGenerator.noContext', 'No specific focus')}
                  </label>
                  
                  {offers.length > 0 && (
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="contextType"
                        value="offer"
                        checked={contextType === 'offer'}
                        onChange={() => handleContextTypeChange('offer')}
                        className="mr-2"
                        disabled={isGenerating}
                      />
                      {t('scriptGenerator.focusOffer', 'Focus on offer')}
                    </label>
                  )}
                  
                  {campaigns.length > 0 && (
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="contextType"
                        value="campaign"
                        checked={contextType === 'campaign'}
                        onChange={() => handleContextTypeChange('campaign')}
                        className="mr-2"
                        disabled={isGenerating}
                      />
                      {t('scriptGenerator.focusCampaign', 'Focus on campaign')}
                    </label>
                  )}
                </div>

                {contextType === 'offer' && offers.length > 0 && (
                  <select
                    value={offerId}
                    onChange={(e) => setOfferId(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isGenerating}
                  >
                    <option value="">{t('scriptGenerator.selectOffer', 'Select an offer...')}</option>
                    {offers.map((offer) => (
                      <option key={offer.id} value={offer.id}>
                        {offer.name} {offer.type && `(${offer.type})`} {offer.price && `- ${offer.price} ${offer.unit || ''}`}
                      </option>
                    ))}
                  </select>
                )}

                {contextType === 'campaign' && campaigns.length > 0 && (
                  <select
                    value={campaignId}
                    onChange={(e) => setCampaignId(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isGenerating}
                  >
                    <option value="">{t('scriptGenerator.selectCampaign', 'Select a campaign...')}</option>
                    {campaigns.map((campaign) => (
                      <option key={campaign.id} value={campaign.id}>
                        {campaign.goal} {campaign.target_audience && `- ${campaign.target_audience}`}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Additional Context */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('scriptGenerator.additionalContext', 'Additional Context')} 
                <span className="text-gray-500 font-normal ml-1">
                  {t('scriptGenerator.optional', '(optional)')}
                </span>
              </label>
              <textarea
                value={additionalContext}
                onChange={(e) => setAdditionalContext(e.target.value)}
                placeholder={t('scriptGenerator.contextPlaceholder', 'Add specific details, tone adjustments, or focus areas...')}
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
                onClick={handleGenerateScript}
                disabled={!businessProfileId || !selectedHook.trim() || isGenerating}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t('scriptGenerator.generating', 'Generating Script...')}
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    {t('scriptGenerator.generateScript', 'Generate Script')}
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
                {t('scriptGenerator.scriptGenerated', 'Script Generated')}
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                {generatedScript?.script?.title || 'Generated Script'}
              </h4>
              <p className="text-gray-600 text-sm mb-4">
                {selectedScriptType.name} • {t('scriptGenerator.savedAsDraft', 'Saved as draft')}
              </p>
            </div>

            {/* Script Content */}
            {generatedScript?.script && (
              <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                <div className="flex items-center justify-between mb-4">
                  <h5 className="font-medium text-gray-900">
                    {t('scriptGenerator.scriptContent', 'Script Content')}
                  </h5>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">
                      {Math.round(generatedScript.script.content.length / 5)} words
                    </span>
                    <Eye className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <pre className="whitespace-pre-wrap text-sm text-gray-900 font-normal leading-relaxed">
                    {generatedScript.script.content}
                  </pre>
                </div>
              </div>
            )}

            {/* Generation Details */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h5 className="font-medium text-blue-900 mb-2">
                {t('scriptGenerator.generationDetails', 'Generation Details')}
              </h5>
              <div className="space-y-1 text-sm text-blue-700">
                <p><strong>Hook Used:</strong> {generatedScript?.generation_params?.selected_hook}</p>
                <p><strong>Script Type:</strong> {SCRIPT_TYPES[generatedScript?.generation_params?.script_type || 'general']?.name}</p>
                {generatedScript?.generation_params?.style_id && (
                  <p><strong>Style Applied:</strong> Yes</p>
                )}
                {generatedScript?.generation_params?.additional_context && (
                  <p><strong>Additional Context:</strong> Provided</p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-center gap-4 pt-4">
              <button
                onClick={handleStartOver}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                {t('scriptGenerator.generateAnother', 'Generate Another')}
              </button>
              
              <button
                onClick={() => navigate('/dashboard/scripts')}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {t('scriptGenerator.viewAllScripts', 'View All Scripts')}
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
                {t('scriptGenerator.noBusinessProfile', 'Please create a business profile first to generate scripts.')}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScriptGenerator;