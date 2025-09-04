import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Search,
  Target,
  Megaphone,
  Trash2,
  X,
  Brain,
  Loader2,
  AlertCircle,
  CheckCircle,
  Save,
  Sparkles,
  Eye,
  EyeOff,
  Globe,
  TrendingUp,
  Award,
  Plus,
  Edit
} from 'lucide-react';
import {
  getAds,
  deleteAd,
  generateHeadlines,
  generateCreative,
  updateAd,
  getOffers,
  getCampaigns,
  saveSelectedCreatives
} from '../services/api';
import {
  Ad,
  AdPlatform,
  AdFormat,
  AdAction,
  AdGenerationParams,
  HeadlineGenerationResult,
  CreativeGenerationResult,
  Offer,
  Campaign
} from '../types';
import MarkdownRenderer from './MarkdownRenderer';
import {
  getAvailableFormats,
  getAvailableActions,
  getDefaultFormat,
  getDefaultAction,
  getPlatformDisplayName,
  getFormatDisplayName,
  getActionDisplayName
} from '../utils/adPlatformConfig';

interface AdsProps {
  businessProfileId?: string;
  authToken: string;
  onTokenRefreshed?: (newToken: string) => void;
  onAdsChanged?: () => void;
}

const AD_PLATFORMS: AdPlatform[] = [
  'facebook', 'instagram', 'google_search', 'google_display',
  'youtube', 'tiktok', 'linkedin', 'x'
];

const AD_FORMATS: AdFormat[] = ['video', 'image', 'text', 'carousel'];


const AdsComponent: React.FC<AdsProps> = ({
  businessProfileId,
  authToken,
  onTokenRefreshed,
  onAdsChanged
}) => {
  const { t } = useTranslation();

  // State
  const [ads, setAds] = useState<Ad[]>([]);
  const [filteredAds, setFilteredAds] = useState<Ad[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  
  // Generation state
  const [showGenerationForm, setShowGenerationForm] = useState(false);
  const [generationStep, setGenerationStep] = useState<'setup' | 'headlines' | 'creative'>('setup');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generationParams, setGenerationParams] = useState<AdGenerationParams>({
    platform: 'facebook',
    format: 'image',
    action: 'visit_page'
  });
  const [generatedHeadlines, setGeneratedHeadlines] = useState<HeadlineGenerationResult | null>(null);
  const [selectedHeadlines, setSelectedHeadlines] = useState<string[]>([]);
  const [generatedCreatives, setGeneratedCreatives] = useState<CreativeGenerationResult | null>(null);
  const [selectedCreatives, setSelectedCreatives] = useState<number[]>([]);
  
  // Helper function to normalize headlines response structure
  const normalizeHeadlinesResponse = (data: any): any => {
    // New structure: just return headlines and context for selection
    if (data.headlines && Array.isArray(data.headlines)) {
      return {
        headlines: data.headlines,
        headline_count: data.headline_count || data.headlines.length,
        business_profile_id: data.business_profile_id || businessProfileId,
        generation_params: data.generation_params || generationParams
      };
    }
    
    // Fallback for unexpected structure
    return {
      headlines: [],
      headline_count: 0,
      business_profile_id: businessProfileId || '',
      generation_params: generationParams
    };
  };
  
  // Filters
  const [platformFilter, setPlatformFilter] = useState<string>('');
  const [formatFilter, setFormatFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Load data
  const loadData = useCallback(async () => {
    if (!businessProfileId || !authToken) {
      return;
    }

    setIsLoading(true);
    try {
      const [adsResult, offersResult, campaignsResult] = await Promise.all([
        getAds(businessProfileId, authToken),
        getOffers(authToken, businessProfileId),
        getCampaigns(authToken, businessProfileId)
      ]);

      if (adsResult.success) {
        setAds(adsResult.data || []);
      }

      if (offersResult.success) {
        setOffers(offersResult.data || []);
      }

      if (campaignsResult.success) {
        setCampaigns(campaignsResult.data || []);
      }

      if (adsResult.isTokenExpired || offersResult.isTokenExpired || campaignsResult.isTokenExpired) {
        onTokenRefreshed?.('');
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [businessProfileId, authToken, onTokenRefreshed]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter ads
  useEffect(() => {
    let filtered = [...ads];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(ad =>
        ad.headline?.toLowerCase().includes(query) ||
        ad.primary_text?.toLowerCase().includes(query) ||
        ad.platform.toLowerCase().includes(query) ||
        ad.format.toLowerCase().includes(query)
      );
    }

    // Platform filter
    if (platformFilter) {
      filtered = filtered.filter(ad => ad.platform === platformFilter);
    }

    // Format filter
    if (formatFilter) {
      filtered = filtered.filter(ad => ad.format === formatFilter);
    }

    // Status filter
    if (statusFilter) {
      filtered = filtered.filter(ad => ad.status === statusFilter);
    }

    setFilteredAds(filtered);
  }, [ads, searchQuery, platformFilter, formatFilter, statusFilter]);

  // Handlers
  const handleDelete = async (adId: string) => {
    if (!authToken) return;

    try {
      const result = await deleteAd(adId, authToken);
      
      if (result.success) {
        setAds(prev => prev.filter(ad => ad.id !== adId));
        setShowDeleteConfirm(null);
        onAdsChanged?.();
      } else {
        console.error('Failed to delete ad:', result.error);
        if (result.isTokenExpired) {
          onTokenRefreshed?.('');
        }
      }
    } catch (error) {
      console.error('Error deleting ad:', error);
    }
  };

  const handleGenerateHeadlines = async () => {
    if (!businessProfileId || !authToken) return;

    setIsGenerating(true);
    setGenerationError(null);

    try {
      const result = await generateHeadlines(businessProfileId, generationParams, authToken);
      
      if (result.success && result.data) {
        setGeneratedHeadlines(normalizeHeadlinesResponse(result.data));
        setGenerationStep('headlines');
        // Refresh ads list to show new draft ads
        loadData();
      } else {
        setGenerationError(result.error || 'Failed to generate headlines');
        if (result.isTokenExpired) {
          onTokenRefreshed?.('');
        }
      }
    } catch (error) {
      console.error('Error generating headlines:', error);
      setGenerationError('An unexpected error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateCreative = async () => {
    if (!authToken || selectedHeadlines.length === 0 || !businessProfileId) return;

    setIsGenerating(true);
    setGenerationError(null);

    try {
      // Use the generation params from the headlines response or current form state
      const params = generatedHeadlines?.generation_params || generationParams;
      
      const result = await generateCreative(
        selectedHeadlines,
        params,
        businessProfileId,
        authToken
      );
      
      if (result.success && result.data) {
        console.log('Creative generation successful:', result.data);
        setGeneratedCreatives(result.data);
        setGenerationStep('creative');
        // Don't refresh ads list yet - wait for user to save selected creatives
      } else {
        setGenerationError(result.error || 'Failed to generate creative');
        if (result.isTokenExpired) {
          onTokenRefreshed?.('');
        }
      }
    } catch (error) {
      console.error('Error generating creative:', error);
      setGenerationError('An unexpected error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveSelectedCreatives = async () => {
    if (!authToken || !businessProfileId || !generatedCreatives || selectedCreatives.length === 0) return;

    setIsGenerating(true);
    setGenerationError(null);

    try {
      // Get selected creatives data
      const creativesToSave = selectedCreatives.map(index => generatedCreatives.creatives[index]);
      
      // Use the generation params from the headlines response or current form state
      const params = generatedHeadlines?.generation_params || generationParams;
      
      const result = await saveSelectedCreatives(
        creativesToSave,
        params,
        businessProfileId,
        authToken
      );
      
      if (result.success) {
        // Success! Refresh ads list and close modal
        await loadData();
        resetGeneration();
        onAdsChanged?.();
      } else {
        setGenerationError(result.error || 'Failed to save selected ads');
        if (result.isTokenExpired) {
          onTokenRefreshed?.('');
        }
      }
    } catch (error) {
      console.error('Error saving selected creatives:', error);
      setGenerationError('An unexpected error occurred while saving ads');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePublishAd = async (adId: string) => {
    if (!authToken) return;

    try {
      const result = await updateAd(adId, { status: 'published' }, authToken);
      
      if (result.success) {
        setAds(prev => prev.map(ad => 
          ad.id === adId ? { ...ad, status: 'published' } : ad
        ));
        onAdsChanged?.();
      } else {
        console.error('Failed to publish ad:', result.error);
        if (result.isTokenExpired) {
          onTokenRefreshed?.('');
        }
      }
    } catch (error) {
      console.error('Error publishing ad:', error);
    }
  };

  const resetGeneration = () => {
    setShowGenerationForm(false);
    setGenerationStep('setup');
    setGeneratedHeadlines(null);
    setSelectedHeadlines([]);
    setGeneratedCreatives(null);
    setSelectedCreatives([]);
    setGenerationError(null);
    setGenerationParams({
      platform: 'facebook',
      format: 'image',
      action: 'visit_page'
    });
  };


  const getContextInfo = (ad: Ad) => {
    if (ad.offer_id) {
      const offer = offers.find(o => o.id === ad.offer_id);
      return offer ? `Offer: ${offer.name}` : 'Unknown Offer';
    }
    if (ad.campaign_id) {
      const campaign = campaigns.find(c => c.id === ad.campaign_id);
      return campaign ? `Campaign: ${campaign.goal}` : 'Unknown Campaign';
    }
    return 'No Context';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading ads...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Megaphone className="w-7 h-7 text-blue-600 mr-2" />
            Advertisement Creatives
          </h1>
          <p className="text-gray-600 mt-1">Create and manage ad creatives with AI assistance</p>
        </div>
        <button
          onClick={() => {
            setShowGenerationForm(true);
            // Refresh data when opening the modal to ensure offers and campaigns are up to date
            loadData();
          }}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl"
        >
          <Brain className="w-5 h-5" />
          <span>Generate New Ad</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ads..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Platform
            </label>
            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Platforms</option>
              {AD_PLATFORMS.map(platform => (
                <option key={platform} value={platform}>
                  {getPlatformDisplayName(platform)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Format
            </label>
            <select
              value={formatFilter}
              onChange={(e) => setFormatFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Formats</option>
              {AD_FORMATS.map(format => (
                <option key={format} value={format}>
                  {format.charAt(0).toUpperCase() + format.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>
      </div>

      {/* Ads List */}
      {filteredAds.length === 0 ? (
        <div className="text-center py-12">
          <Megaphone className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No ads found</h3>
          <p className="text-gray-600 mb-4">
            {ads.length === 0 
              ? "Start by generating your first ad creative."
              : "Try adjusting your search or filter criteria."
            }
          </p>
          {ads.length === 0 && (
            <button
              onClick={() => setShowGenerationForm(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors inline-flex items-center space-x-2"
            >
              <Brain className="w-5 h-5" />
              <span>Generate Your First Ad</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredAds.map((ad) => (
            <div key={ad.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      ad.status === 'published' 
                        ? 'bg-green-100 text-green-800'
                        : ad.status === 'draft'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {ad.status.charAt(0).toUpperCase() + ad.status.slice(1)}
                    </span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                      {getPlatformDisplayName(ad.platform)}
                    </span>
                    <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                      {getFormatDisplayName(ad.format)}
                    </span>
                    <span className="text-sm text-gray-500">
                      {getContextInfo(ad)}
                    </span>
                  </div>
                  
                  {ad.headline && (
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {ad.headline}
                    </h3>
                  )}
                  
                  {ad.primary_text && (
                    <div className="text-gray-600 mb-3">
                      <MarkdownRenderer content={ad.primary_text} />
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-sm">
                    {ad.visual_brief && (
                      <div>
                        <span className="font-medium text-gray-700">Visual Brief:</span>
                        <div className="text-gray-600 mt-1">
                          <MarkdownRenderer content={ad.visual_brief} />
                        </div>
                      </div>
                    )}
                    
                    {ad.cta && (
                      <div>
                        <span className="font-medium text-gray-700">Call-to-Action:</span>
                        <p className="text-gray-600 mt-1">{ad.cta}</p>
                      </div>
                    )}
                    
                    {ad.overlay_text && (
                      <div>
                        <span className="font-medium text-gray-700">Overlay Text:</span>
                        <p className="text-gray-600 mt-1">{ad.overlay_text}</p>
                      </div>
                    )}
                    
                    {ad.script_text && (
                      <div>
                        <span className="font-medium text-gray-700">Script:</span>
                        <p className="text-gray-600 mt-1">{ad.script_text}</p>
                      </div>
                    )}
                    
                    {ad.landing_url && (
                      <div>
                        <span className="font-medium text-gray-700">Landing URL:</span>
                        <a 
                          href={ad.landing_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 underline mt-1 block"
                        >
                          {ad.landing_url}
                        </a>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-4 mt-4 text-sm text-gray-500">
                    <span>Action: {getActionDisplayName(ad.action)}</span>
                    <span>Created: {new Date(ad.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  {ad.status === 'draft' && (
                    <button
                      onClick={() => handlePublishAd(ad.id)}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-1"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Publish</span>
                    </button>
                  )}
                  
                  <button
                    onClick={() => setShowDeleteConfirm(ad.id)}
                    className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Generation Modal */}
      {showGenerationForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <Brain className="w-6 h-6 text-blue-600 mr-2" />
                Generate Ad Creative
              </h2>
              <button
                onClick={resetGeneration}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              {/* Progress Steps */}
              <div className="flex items-center justify-center mb-8">
                <div className="flex items-center space-x-4">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                    generationStep === 'setup' ? 'bg-blue-600 text-white' : 
                    ['headlines', 'creative'].includes(generationStep) ? 'bg-green-600 text-white' : 
                    'bg-gray-300 text-gray-600'
                  }`}>
                    1
                  </div>
                  <div className="text-sm font-medium text-gray-700">Setup</div>
                  
                  <div className="w-8 h-px bg-gray-300" />
                  
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                    generationStep === 'headlines' ? 'bg-blue-600 text-white' : 
                    generationStep === 'creative' ? 'bg-green-600 text-white' : 
                    'bg-gray-300 text-gray-600'
                  }`}>
                    2
                  </div>
                  <div className="text-sm font-medium text-gray-700">Headlines</div>
                  
                  <div className="w-8 h-px bg-gray-300" />
                  
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                    generationStep === 'creative' ? 'bg-blue-600 text-white' : 
                    'bg-gray-300 text-gray-600'
                  }`}>
                    3
                  </div>
                  <div className="text-sm font-medium text-gray-700">Creative</div>
                </div>
              </div>

              {/* Error Display */}
              {generationError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center">
                  <AlertCircle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0" />
                  <p className="text-red-800">{generationError}</p>
                </div>
              )}

              {/* Step Content */}
              {generationStep === 'setup' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Platform *
                      </label>
                      <select
                        value={generationParams.platform}
                        onChange={(e) => {
                          const newPlatform = e.target.value as AdPlatform;
                          const availableFormats = getAvailableFormats(newPlatform);
                          const currentFormat = generationParams.format;
                          const newFormat = availableFormats.includes(currentFormat) 
                            ? currentFormat 
                            : getDefaultFormat(newPlatform) || availableFormats[0];
                          
                          const availableActions = getAvailableActions(newPlatform, newFormat);
                          const currentAction = generationParams.action;
                          const newAction = availableActions.includes(currentAction)
                            ? currentAction
                            : getDefaultAction(newPlatform, newFormat) || availableActions[0];
                          
                          setGenerationParams(prev => ({ 
                            ...prev, 
                            platform: newPlatform,
                            format: newFormat,
                            action: newAction
                          }));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {AD_PLATFORMS.map(platform => (
                          <option key={platform} value={platform}>
                            {getPlatformDisplayName(platform)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Format *
                      </label>
                      <select
                        value={generationParams.format}
                        onChange={(e) => {
                          const newFormat = e.target.value as AdFormat;
                          const availableActions = getAvailableActions(generationParams.platform, newFormat);
                          const currentAction = generationParams.action;
                          const newAction = availableActions.includes(currentAction)
                            ? currentAction
                            : getDefaultAction(generationParams.platform, newFormat) || availableActions[0];
                          
                          setGenerationParams(prev => ({ 
                            ...prev, 
                            format: newFormat,
                            action: newAction
                          }));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {getAvailableFormats(generationParams.platform).map(format => (
                          <option key={format} value={format}>
                            {getFormatDisplayName(format)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Action *
                      </label>
                      <select
                        value={generationParams.action}
                        onChange={(e) => setGenerationParams(prev => ({ ...prev, action: e.target.value as AdAction }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {getAvailableActions(generationParams.platform, generationParams.format).map(action => (
                          <option key={action} value={action}>
                            {getActionDisplayName(action)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Context
                      </label>
                      
                      
                      <div className="space-y-2">
                        <select
                          value={generationParams.offer_id || ''}
                          onChange={(e) => {
                            const offerId = e.target.value;
                            setGenerationParams(prev => ({ 
                              ...prev, 
                              offer_id: offerId || undefined,
                              campaign_id: offerId ? undefined : prev.campaign_id
                            }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Select Offer</option>
                          {offers.map(offer => (
                            <option key={offer.id} value={offer.id}>
                              {offer.name} - {offer.price} {offer.unit}
                            </option>
                          ))}
                        </select>
                        
                        <div className="text-center text-sm text-gray-500">or</div>
                        
                        <select
                          value={generationParams.campaign_id || ''}
                          onChange={(e) => {
                            const campaignId = e.target.value;
                            setGenerationParams(prev => ({ 
                              ...prev, 
                              campaign_id: campaignId || undefined,
                              offer_id: campaignId ? undefined : prev.offer_id
                            }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Select Campaign</option>
                          {campaigns.map(campaign => (
                            <option key={campaign.id} value={campaign.id}>
                              {campaign.goal} Campaign
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>


                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={resetGeneration}
                      className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleGenerateHeadlines}
                      disabled={isGenerating || (!generationParams.offer_id && !generationParams.campaign_id)}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Generating...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5" />
                          <span>Generate Headlines</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {generationStep === 'headlines' && generatedHeadlines && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Select Headlines for Full Creative Generation
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Choose the headlines you want to develop into full creatives. We generated {generatedHeadlines.headline_count} options for you.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {generatedHeadlines.headlines.map((headline: string, index) => (
                      <div
                        key={index}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                          selectedHeadlines.includes(headline)
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => {
                          setSelectedHeadlines(prev =>
                            prev.includes(headline)
                              ? prev.filter(h => h !== headline)
                              : [...prev, headline]
                          );
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{headline}</h4>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                                {getPlatformDisplayName(generatedHeadlines.generation_params?.platform || generationParams.platform)}
                              </span>
                              <span className="text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded">
                                {getFormatDisplayName(generatedHeadlines.generation_params?.format || generationParams.format)}
                              </span>
                            </div>
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            selectedHeadlines.includes(headline)
                              ? 'border-blue-500 bg-blue-500'
                              : 'border-gray-300'
                          }`}>
                            {selectedHeadlines.includes(headline) && (
                              <CheckCircle className="w-3 h-3 text-white" />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => setGenerationStep('setup')}
                      className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleGenerateCreative}
                      disabled={isGenerating || selectedHeadlines.length === 0}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Generating...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5" />
                          <span>Generate Creative ({selectedHeadlines.length})</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {generationStep === 'creative' && generatedCreatives && (
                <div className="space-y-6">
                  <div className="text-center">
                    <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Creative Generation Complete!
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Review the generated ad creatives below and select which ones you want to save to your ads library.
                    </p>
                  </div>

                  {/* Creative Preview Cards */}
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {generatedCreatives.creatives.map((creative, index) => (
                      <div
                        key={index}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                          selectedCreatives.includes(index)
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => {
                          setSelectedCreatives(prev =>
                            prev.includes(index)
                              ? prev.filter(i => i !== index)
                              : [...prev, index]
                          );
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-3">
                            {/* Headline */}
                            {creative.headline && (
                              <div>
                                <h4 className="font-semibold text-gray-900 text-lg">
                                  {creative.headline}
                                </h4>
                              </div>
                            )}
                            
                            {/* Platform and Format Tags */}
                            <div className="flex items-center space-x-2">
                              <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                                {getPlatformDisplayName(generatedHeadlines?.generation_params?.platform || generationParams.platform)}
                              </span>
                              <span className="text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded">
                                {getFormatDisplayName(generatedHeadlines?.generation_params?.format || generationParams.format)}
                              </span>
                              <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded">
                                {getActionDisplayName(generatedHeadlines?.generation_params?.action || generationParams.action)}
                              </span>
                            </div>

                            {/* Primary Text */}
                            {creative.primary_text && (
                              <div>
                                <span className="text-sm font-medium text-gray-700">Primary Text:</span>
                                <div className="text-sm text-gray-600 mt-1 max-h-20 overflow-y-auto">
                                  <MarkdownRenderer content={creative.primary_text} />
                                </div>
                              </div>
                            )}

                            {/* Visual Brief */}
                            {creative.visual_brief && (
                              <div>
                                <span className="text-sm font-medium text-gray-700">Visual Brief:</span>
                                <div className="text-sm text-gray-600 mt-1 max-h-16 overflow-y-auto">
                                  <MarkdownRenderer content={creative.visual_brief} />
                                </div>
                              </div>
                            )}

                            {/* Additional Details */}
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              {creative.cta && (
                                <div>
                                  <span className="font-medium text-gray-700">CTA:</span>
                                  <p className="text-gray-600">{creative.cta}</p>
                                </div>
                              )}
                              
                              {creative.overlay_text && (
                                <div>
                                  <span className="font-medium text-gray-700">Overlay Text:</span>
                                  <p className="text-gray-600">{creative.overlay_text}</p>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Selection Checkbox */}
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ml-4 flex-shrink-0 ${
                            selectedCreatives.includes(index)
                              ? 'border-blue-500 bg-blue-500'
                              : 'border-gray-300'
                          }`}>
                            {selectedCreatives.includes(index) && (
                              <CheckCircle className="w-4 h-4 text-white" />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => setGenerationStep('headlines')}
                      className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      Back to Headlines
                    </button>
                    <button
                      onClick={resetGeneration}
                      className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveSelectedCreatives}
                      disabled={selectedCreatives.length === 0 || isGenerating}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-5 h-5" />
                          <span>Save Selected Ads ({selectedCreatives.length})</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Delete Ad</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this ad? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdsComponent;