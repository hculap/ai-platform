import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Bot, 
  Plus, 
  Trash2, 
  Copy,
  Check,
  X,
  FileText,
  Loader,
  Eye,
  EyeOff,
  AlertCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { analyzeStyle } from '../services/api';

interface UserStyle {
  id: string;
  user_id: string;
  language: string;
  style_card: any;
  created_at: string;
  updated_at: string;
}

interface StyleCopyToolProps {
  userStyles: UserStyle[];
  authToken: string;
  onStyleCreated: () => void;
  onTokenRefreshed?: (newToken: string) => void;
}

interface StyleFormData {
  content_types: string[];
  samples: string[];
  banlist_seed: string[];
}

const StyleCopyTool: React.FC<StyleCopyToolProps> = ({ 
  userStyles, 
  authToken, 
  onStyleCreated, 
  onTokenRefreshed 
}) => {
  const { t } = useTranslation();
  
  // State
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [expandedStyle, setExpandedStyle] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<StyleFormData>({
    content_types: ['post'],
    samples: [''],
    banlist_seed: [
      'dive into',
      'unlock potential', 
      'game-changer',
      'at the end of the day',
      'cutting-edge',
      'synergy'
    ]
  });
  
  // Handle form input changes
  const handleInputChange = useCallback((field: keyof StyleFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);
  
  // Handle content types change
  const handleContentTypeToggle = useCallback((contentType: string) => {
    setFormData(prev => ({
      ...prev,
      content_types: prev.content_types.includes(contentType)
        ? prev.content_types.filter(t => t !== contentType)
        : [...prev.content_types, contentType]
    }));
  }, []);
  
  // Handle sample changes
  const handleSampleChange = useCallback((index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      samples: prev.samples.map((sample, i) => i === index ? value : sample)
    }));
  }, []);
  
  // Add new sample
  const addSample = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      samples: [...prev.samples, '']
    }));
  }, []);
  
  // Remove sample
  const removeSample = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      samples: prev.samples.filter((_, i) => i !== index)
    }));
  }, []);
  
  // Handle banlist change
  const handleBanlistChange = useCallback((value: string) => {
    const items = value.split('\n').map(item => item.trim()).filter(item => item.length > 0);
    setFormData(prev => ({
      ...prev,
      banlist_seed: items
    }));
  }, []);
  
  // Validate form
  const validateForm = useCallback((): string | null => {
    
    if (formData.content_types.length === 0) {
      return t('styleCopyTool.errors.contentTypesRequired', 'At least one content type must be selected');
    }
    
    const validSamples = formData.samples.filter(sample => sample.trim().length >= 50);
    if (validSamples.length === 0) {
      return t('styleCopyTool.errors.samplesRequired', 'At least one sample with minimum 50 characters is required');
    }
    
    return null;
  }, [formData, t]);
  
  // Handle style analysis
  const handleAnalyzeStyle = useCallback(async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    
    setIsAnalyzing(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Filter out empty samples and ensure minimum length
      const validSamples = formData.samples
        .filter(sample => sample.trim().length >= 50)
        .map(sample => sample.trim());
      
      const analysisData = {
        content_types: formData.content_types,
        samples: validSamples,
        banlist_seed: formData.banlist_seed
      };
      
      const result = await analyzeStyle(analysisData, authToken);
      
      if (result.success) {
        setSuccess(t('styleCopyTool.success', 'Style analysis completed successfully!'));
        setShowCreateForm(false);
        onStyleCreated();
        
        // Reset form
        setFormData({
          content_types: ['post'],
          samples: [''],
          banlist_seed: [
            'dive into',
            'unlock potential', 
            'game-changer',
            'at the end of the day',
            'cutting-edge',
            'synergy'
          ]
        });
      } else {
        setError(result.error || t('styleCopyTool.errors.analysisFailer', 'Style analysis failed'));
      }
    } catch (error: any) {
      console.error('Style analysis error:', error);
      setError(t('styleCopyTool.errors.unexpected', 'An unexpected error occurred'));
    } finally {
      setIsAnalyzing(false);
    }
  }, [formData, validateForm, authToken, t, onStyleCreated]);
  
  // Clear messages
  const clearMessages = useCallback(() => {
    setError(null);
    setSuccess(null);
  }, []);
  
  // Toggle style card expansion
  const toggleStyleExpansion = useCallback((styleId: string) => {
    setExpandedStyle(expandedStyle === styleId ? null : styleId);
  }, [expandedStyle]);
  
  return (
    <div className="space-y-6">
      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="text-red-800">{error}</span>
            </div>
            <button
              onClick={clearMessages}
              className="text-red-600 hover:text-red-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-600" />
              <span className="text-green-800">{success}</span>
            </div>
            <button
              onClick={clearMessages}
              className="text-green-600 hover:text-green-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      
      {/* Existing Styles */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                {t('styleCopyTool.existingStyles', 'Your Writing Styles')}
              </h3>
              <p className="text-gray-600 mt-1">
                {t('styleCopyTool.existingStylesDesc', 'Previously analyzed writing styles')}
              </p>
            </div>
            
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              {t('styleCopyTool.analyzeNewStyle', 'Analyze New Style')}
            </button>
          </div>
        </div>
        
        <div className="p-6">
          {userStyles.length === 0 ? (
            <div className="text-center py-12">
              <Bot className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                {t('styleCopyTool.noStyles', 'No Writing Styles Yet')}
              </h4>
              <p className="text-gray-600 mb-6">
                {t('styleCopyTool.noStylesDesc', 'Create your first writing style analysis to get started')}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {userStyles.map((style) => (
                <StyleCard
                  key={style.id}
                  style={style}
                  isExpanded={expandedStyle === style.id}
                  onToggleExpansion={() => toggleStyleExpansion(style.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Create New Style Form */}
      {showCreateForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {t('styleCopyTool.createNewStyle', 'Analyze Writing Style')}
                </h3>
                <p className="text-gray-600 mt-1">
                  {t('styleCopyTool.createNewStyleDesc', 'Upload writing samples to analyze your unique style')}
                </p>
              </div>
              
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="p-6 space-y-6">
            {/* Note about automatic language detection */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-blue-600" />
                <p className="text-sm text-blue-700">
                  {t('styleCopyTool.autoDetectionNote', 'Language will be automatically detected from your writing samples using AI analysis.')}
                </p>
              </div>
            </div>
            
            {/* Content Types */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('styleCopyTool.contentTypes', 'Content Types')} *
              </label>
              <div className="flex flex-wrap gap-2">
                {['post', 'blog', 'script', 'general'].map((type) => (
                  <button
                    key={type}
                    onClick={() => handleContentTypeToggle(type)}
                    className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                      formData.content_types.includes(type)
                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                        : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                    }`}
                  >
                    {t(`styleCopyTool.contentType.${type}`, type)}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Writing Samples */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  {t('styleCopyTool.writingSamples', 'Writing Samples')} *
                </label>
                <button
                  onClick={addSample}
                  className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                >
                  <Plus className="w-4 h-4" />
                  {t('styleCopyTool.addSample', 'Add Sample')}
                </button>
              </div>
              <p className="text-sm text-gray-500 mb-3">
                {t('styleCopyTool.samplesDesc', 'Provide 1-20 text samples (100-400 words each). The more samples, the better the analysis.')}
              </p>
              
              <div className="space-y-3">
                {formData.samples.map((sample, index) => (
                  <div key={index} className="relative">
                    <div className="flex items-start gap-2">
                      <div className="flex-1">
                        <textarea
                          value={sample}
                          onChange={(e) => handleSampleChange(index, e.target.value)}
                          placeholder={t('styleCopyTool.samplePlaceholder', 'Paste a writing sample here (minimum 50 characters)...')}
                          rows={4}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical"
                        />
                        <div className="flex items-center justify-between mt-1">
                          <span className={`text-xs ${sample.length >= 50 ? 'text-green-600' : 'text-red-500'}`}>
                            {sample.length} {t('styleCopyTool.characters', 'characters')}
                            {sample.length < 50 && ` (${t('styleCopyTool.minimum', 'minimum')} 50)`}
                          </span>
                        </div>
                      </div>
                      
                      {formData.samples.length > 1 && (
                        <button
                          onClick={() => removeSample(index)}
                          className="text-red-500 hover:text-red-700 mt-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Banlist (Advanced) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('styleCopyTool.banlist', 'Avoid These Phrases')} ({t('styleCopyTool.optional', 'optional')})
              </label>
              <p className="text-sm text-gray-500 mb-2">
                {t('styleCopyTool.banlistDesc', 'Phrases to avoid in generated content (one per line)')}
              </p>
              <textarea
                value={formData.banlist_seed.join('\n')}
                onChange={(e) => handleBanlistChange(e.target.value)}
                placeholder={t('styleCopyTool.banlistPlaceholder', 'dive into\nunlock potential\ngame-changer')}
                rows={4}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            {/* Submit Button */}
            <div className="flex items-center gap-4">
              <button
                onClick={handleAnalyzeStyle}
                disabled={isAnalyzing}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
              >
                {isAnalyzing ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    {t('styleCopyTool.analyzing', 'Analyzing...')}
                  </>
                ) : (
                  <>
                    <Bot className="w-4 h-4" />
                    {t('styleCopyTool.analyzeButton', 'Analyze Writing Style')}
                  </>
                )}
              </button>
              
              <button
                onClick={() => setShowCreateForm(false)}
                disabled={isAnalyzing}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                {t('styleCopyTool.cancel', 'Cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Style Card Component
const StyleCard: React.FC<{
  style: UserStyle;
  isExpanded: boolean;
  onToggleExpansion: () => void;
}> = ({ style, isExpanded, onToggleExpansion }) => {
  const { t } = useTranslation();
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };
  
  const formatStyleCard = (styleCard: any) => {
    return JSON.stringify(styleCard, null, 2);
  };
  
  return (
    <div className="border border-gray-200 rounded-lg">
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h4 className="font-semibold text-gray-900">
                {t('styleCopyTool.writingStyle', 'Writing Style')}
              </h4>
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                {style.language.toUpperCase()}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {t('styleCopyTool.createdOn', 'Created on')} {formatDate(style.created_at)}
            </p>
          </div>
          
          <button
            onClick={onToggleExpansion}
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
          >
            {isExpanded ? (
              <>
                <EyeOff className="w-4 h-4" />
                {t('styleCopyTool.hide', 'Hide Details')}
                <ChevronUp className="w-4 h-4" />
              </>
            ) : (
              <>
                <Eye className="w-4 h-4" />
                {t('styleCopyTool.viewDetails', 'View Details')}
                <ChevronDown className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
        
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <h5 className="font-medium text-gray-900 mb-2">
              {t('styleCopyTool.styleAnalysis', 'Style Analysis')}
            </h5>
            <pre className="bg-gray-50 p-3 rounded-lg text-xs overflow-x-auto text-gray-700 whitespace-pre-wrap">
              {formatStyleCard(style.style_card)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default StyleCopyTool;