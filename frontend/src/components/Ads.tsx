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
  Calendar,
  Copy
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
  const [selectedAdForModal, setSelectedAdForModal] = useState<Ad | null>(null);
  
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
  const [campaignFilter, setCampaignFilter] = useState<string>('');
  const [offerFilter, setOfferFilter] = useState<string>('');

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

    // Campaign filter
    if (campaignFilter) {
      filtered = filtered.filter(ad => ad.campaign_id === campaignFilter);
    }

    // Offer filter
    if (offerFilter) {
      filtered = filtered.filter(ad => ad.offer_id === offerFilter);
    }

    setFilteredAds(filtered);
  }, [ads, searchQuery, platformFilter, formatFilter, statusFilter, campaignFilter, offerFilter]);

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

  // Modal handlers
  const handleOpenAdModal = (ad: Ad) => {
    setSelectedAdForModal(ad);
  };

  const handleCloseAdModal = () => {
    setSelectedAdForModal(null);
  };

  // Copy to clipboard handler
  const handleCopyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // Optional: Add toast notification here in the future
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
      } catch (fallbackError) {
        console.error('Fallback copy also failed:', fallbackError);
      }
      document.body.removeChild(textArea);
    }
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
    <div className="space-y-8">
      {/* Enhanced Header Panel */}
      <div className="relative bg-white rounded-xl border border-gray-200 p-6 shadow-sm overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-white to-purple-50/30"></div>
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-2xl"></div>
        <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-to-tr from-purple-400/10 to-blue-400/10 rounded-full blur-3xl"></div>

        {/* Content with relative positioning */}
        <div className="relative p-8">
          {/* Header Section - Title and Count */}
          <div className="flex justify-between items-center mb-8">
            {/* Left - Title and Icon */}
            <div className="flex items-center gap-4">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg">
                <Megaphone className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-black text-gray-900 tracking-tight">
                  {t('ads.title')}
                </h1>
                <p className="text-lg text-gray-600 font-medium mt-1">
                  {t('ads.subtitle')}
                </p>
              </div>
            </div>

            {/* Right - Available Count */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl px-4 py-3 border border-gray-200/60 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">{ads.length}</p>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('ads.available')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Action Section */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Search Input */}
            <div className="flex-1 max-w-md">
              <div className="relative bg-white/90 backdrop-blur-sm rounded-xl border border-gray-200/60 shadow-lg">
                <div className="relative">
                  <Search className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('ads.searchPlaceholder')}
                    className="w-full pl-12 pr-4 py-3 bg-transparent border-0 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 placeholder-gray-500 font-medium rounded-xl"
                  />
                </div>
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={() => {
                setShowGenerationForm(true);
                // Refresh data when opening the modal to ensure offers and campaigns are up to date
                loadData();
              }}
              className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
            >
              <Brain className="w-5 h-5" />
              {t('ads.generateNewAd')}
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('ads.platform')}
            </label>
            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">{t('ads.allPlatforms')}</option>
              {AD_PLATFORMS.map(platform => (
                <option key={platform} value={platform}>
                  {getPlatformDisplayName(platform)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('ads.format')}
            </label>
            <select
              value={formatFilter}
              onChange={(e) => setFormatFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">{t('ads.allFormats')}</option>
              {AD_FORMATS.map(format => (
                <option key={format} value={format}>
                  {getFormatDisplayName(format)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('ads.status')}
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">{t('ads.allStatuses')}</option>
              <option value="draft">{t('ads.statuses.draft')}</option>
              <option value="published">{t('ads.statuses.published')}</option>
              <option value="archived">{t('ads.statuses.archived')}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('campaigns.title')}
            </label>
            <select
              value={campaignFilter}
              onChange={(e) => setCampaignFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">{t('ads.allCampaigns')}</option>
              {campaigns.map(campaign => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.goal}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('offers.title')}
            </label>
            <select
              value={offerFilter}
              onChange={(e) => setOfferFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">{t('ads.allOffers')}</option>
              {offers.map(offer => (
                <option key={offer.id} value={offer.id}>
                  {offer.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Ads List */}
      {filteredAds.length === 0 ? (
        <div className="text-center py-12">
          <Megaphone className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">{t('ads.noAdsFound')}</h3>
          <p className="text-gray-600 mb-4">
            {ads.length === 0 
              ? t('ads.startByGenerating')
              : t('ads.tryAdjustingFilters')
            }
          </p>
          {ads.length === 0 && (
            <button
              onClick={() => setShowGenerationForm(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors inline-flex items-center space-x-2"
            >
              <Brain className="w-5 h-5" />
              <span>{t('ads.generateFirstAd')}</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {filteredAds.map((ad) => (
            <div
              key={ad.id}
              className="group relative bg-white rounded-2xl border border-gray-200/60 p-8 hover:shadow-2xl hover:shadow-blue-500/10 hover:border-blue-300/50 transition-all duration-500 overflow-hidden"
            >
              {/* Background Effects */}
              <div className="absolute inset-0 bg-gradient-to-br from-white via-blue-50/30 to-purple-50/20 opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
              <div className="absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
              
              <div className="relative">
                {/* Ad Header */}
                <div className="flex items-start gap-4 mb-6">
                  <div className="relative">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-lg flex items-center justify-center group-hover:shadow-xl group-hover:scale-105 transition-all duration-300">
                      <Megaphone className="w-8 h-8 text-white" />
                    </div>
                    <div className={`absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 ${
                      ad.status === 'published' 
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                        : ad.status === 'draft'
                        ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                        : 'bg-gradient-to-r from-gray-500 to-gray-600'
                    }`}>
                      <CheckCircle className="w-3 h-3 text-white" />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Platform/Format/Status Badges */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                        ad.status === 'published' 
                          ? 'bg-emerald-100 text-emerald-800'
                          : ad.status === 'draft'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {ad.status}
                      </span>
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                        {getPlatformDisplayName(ad.platform)}
                      </span>
                      <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-semibold">
                        {getFormatDisplayName(ad.format)}
                      </span>
                    </div>

                    {/* Headline */}
                    {ad.headline && (
                      <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-blue-900 transition-colors duration-300">
                        {ad.headline}
                      </h3>
                    )}

                    {/* Primary Text Preview */}
                    {ad.primary_text && (
                      <div className="text-gray-600 mb-4 line-clamp-3">
                        <MarkdownRenderer content={ad.primary_text} />
                      </div>
                    )}

                    {/* Metadata */}
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Target className="w-4 h-4" />
                        {getActionDisplayName(ad.action)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(ad.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-6 border-t border-gray-200/60 group-hover:border-purple-200/60 transition-all duration-300">
                  <button
                    onClick={() => handleOpenAdModal(ad)}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                  >
                    <Eye className="w-4 h-4" />
                    {t('ads.viewDetails')}
                  </button>

                  <div className="flex items-center gap-2">
                    {ad.status === 'draft' && (
                      <button
                        onClick={() => handlePublishAd(ad.id)}
                        className="p-3 bg-emerald-100 text-emerald-700 rounded-xl hover:bg-emerald-200 transition-colors"
                        title={t('ads.publish')}
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    )}
                    
                    <button
                      onClick={() => setShowDeleteConfirm(ad.id)}
                      className="p-3 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 transition-colors"
                      title={t('ads.delete')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
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
                  <div className="text-sm font-medium text-gray-700">{t('ads.setup')}</div>
                  
                  <div className="w-8 h-px bg-gray-300" />
                  
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                    generationStep === 'headlines' ? 'bg-blue-600 text-white' : 
                    generationStep === 'creative' ? 'bg-green-600 text-white' : 
                    'bg-gray-300 text-gray-600'
                  }`}>
                    2
                  </div>
                  <div className="text-sm font-medium text-gray-700">{t('ads.headlines')}</div>
                  
                  <div className="w-8 h-px bg-gray-300" />
                  
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                    generationStep === 'creative' ? 'bg-blue-600 text-white' : 
                    'bg-gray-300 text-gray-600'
                  }`}>
                    3
                  </div>
                  <div className="text-sm font-medium text-gray-700">{t('ads.creative')}</div>
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
                        {t('ads.platformRequired')}
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
                        {t('ads.formatRequired')}
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
                        {t('ads.actionRequired')}
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
                        {t('ads.context')}
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
                          <option value="">{t('ads.selectOffer')}</option>
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
                          <option value="">{t('ads.selectCampaign')}</option>
                          {campaigns.map(campaign => (
                            <option key={campaign.id} value={campaign.id}>
                              {campaign.goal} {t('ads.campaignSuffix')}
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
                      {t('ads.cancel')}
                    </button>
                    <button
                      onClick={handleGenerateHeadlines}
                      disabled={isGenerating || (!generationParams.offer_id && !generationParams.campaign_id)}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>{t('ads.generating')}</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5" />
                          <span>{t('ads.generateHeadlines')}</span>
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
                      {t('ads.selectHeadlines')}
                    </h3>
                    <p className="text-gray-600 mb-6">
                      {t('ads.chooseHeadlines', { count: generatedHeadlines.headline_count })}
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
                      {t('ads.back')}
                    </button>
                    <button
                      onClick={handleGenerateCreative}
                      disabled={isGenerating || selectedHeadlines.length === 0}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>{t('ads.generating')}</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5" />
                          <span>{t('ads.generateCreativeCount', { count: selectedHeadlines.length })}</span>
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
                      {t('ads.creativeGenerationComplete')}
                    </h3>
                    <p className="text-gray-600 mb-6">
                      {t('ads.reviewCreatives')}
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
                      {t('ads.backToHeadlines')}
                    </button>
                    <button
                      onClick={resetGeneration}
                      className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      {t('ads.cancel')}
                    </button>
                    <button
                      onClick={handleSaveSelectedCreatives}
                      disabled={selectedCreatives.length === 0 || isGenerating}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>{t('ads.saving')}</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-5 h-5" />
                          <span>{t('ads.saveSelectedAds', { count: selectedCreatives.length })}</span>
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

      {/* Ad Details Modal */}
      {selectedAdForModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            {/* Fixed Header - outside overflow container */}
            <div className="p-6 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <Megaphone className="w-6 h-6 text-blue-600 mr-2" />
                {t('ads.modal.title')}
              </h2>
              <button
                onClick={handleCloseAdModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 overflow-y-auto flex-1">
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Headline */}
                  {selectedAdForModal.headline && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('ads.modal.headline')}
                      </label>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {selectedAdForModal.headline}
                        </h3>
                      </div>
                    </div>
                  )}

                  {/* Platform Info */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('ads.modal.platform')}
                    </label>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <span className="font-medium text-blue-800">
                        {getPlatformDisplayName(selectedAdForModal.platform)}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('ads.modal.format')}
                    </label>
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <span className="font-medium text-purple-800">
                        {getFormatDisplayName(selectedAdForModal.format)}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('ads.modal.action')}
                    </label>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <span className="font-medium text-green-800">
                        {getActionDisplayName(selectedAdForModal.action)}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('ads.modal.status')}
                    </label>
                    <div className={`p-3 rounded-lg ${
                      selectedAdForModal.status === 'published' 
                        ? 'bg-emerald-50'
                        : selectedAdForModal.status === 'draft'
                        ? 'bg-yellow-50'
                        : 'bg-gray-50'
                    }`}>
                      <span className={`font-medium ${
                        selectedAdForModal.status === 'published' 
                          ? 'text-emerald-800'
                          : selectedAdForModal.status === 'draft'
                          ? 'text-yellow-800'
                          : 'text-gray-800'
                      }`}>
                        {selectedAdForModal.status.charAt(0).toUpperCase() + selectedAdForModal.status.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Primary Text */}
                {selectedAdForModal.primary_text && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('ads.modal.primaryText')}
                    </label>
                    <div className="relative p-4 bg-gray-50 rounded-lg border">
                      <button
                        onClick={() => handleCopyToClipboard(selectedAdForModal.primary_text || '')}
                        className="absolute top-2 right-2 p-1 bg-white/80 hover:bg-white rounded-md shadow-sm hover:shadow-md transition-all duration-200 opacity-70 hover:opacity-100"
                        title="Copy to clipboard"
                      >
                        <Copy className="w-4 h-4 text-gray-600" />
                      </button>
                      <MarkdownRenderer content={selectedAdForModal.primary_text} />
                    </div>
                  </div>
                )}

                {/* Visual Brief */}
                {selectedAdForModal.visual_brief && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('ads.modal.visualBrief')}
                    </label>
                    <div className="relative p-4 bg-blue-50 rounded-lg border">
                      <button
                        onClick={() => handleCopyToClipboard(selectedAdForModal.visual_brief || '')}
                        className="absolute top-2 right-2 p-1 bg-white/80 hover:bg-white rounded-md shadow-sm hover:shadow-md transition-all duration-200 opacity-70 hover:opacity-100"
                        title="Copy to clipboard"
                      >
                        <Copy className="w-4 h-4 text-gray-600" />
                      </button>
                      <MarkdownRenderer content={selectedAdForModal.visual_brief} />
                    </div>
                  </div>
                )}

                {/* Additional Creative Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {selectedAdForModal.script_text && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('ads.modal.scriptText')}
                      </label>
                      <div className="relative p-4 bg-green-50 rounded-lg border">
                        <button
                          onClick={() => handleCopyToClipboard(selectedAdForModal.script_text || '')}
                          className="absolute top-2 right-2 p-1 bg-white/80 hover:bg-white rounded-md shadow-sm hover:shadow-md transition-all duration-200 opacity-70 hover:opacity-100"
                          title="Copy to clipboard"
                        >
                          <Copy className="w-4 h-4 text-gray-600" />
                        </button>
                        <p className="text-gray-900">{selectedAdForModal.script_text}</p>
                      </div>
                    </div>
                  )}

                  {selectedAdForModal.overlay_text && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('ads.modal.overlayText')}
                      </label>
                      <div className="relative p-4 bg-purple-50 rounded-lg border">
                        <button
                          onClick={() => handleCopyToClipboard(selectedAdForModal.overlay_text || '')}
                          className="absolute top-2 right-2 p-1 bg-white/80 hover:bg-white rounded-md shadow-sm hover:shadow-md transition-all duration-200 opacity-70 hover:opacity-100"
                          title="Copy to clipboard"
                        >
                          <Copy className="w-4 h-4 text-gray-600" />
                        </button>
                        <p className="text-gray-900">{selectedAdForModal.overlay_text}</p>
                      </div>
                    </div>
                  )}

                  {selectedAdForModal.cta && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('ads.modal.callToAction')}
                      </label>
                      <div className="p-4 bg-orange-50 rounded-lg border">
                        <p className="font-semibold text-orange-900">{selectedAdForModal.cta}</p>
                      </div>
                    </div>
                  )}

                  {selectedAdForModal.landing_url && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('ads.modal.landingUrl')}
                      </label>
                      <div className="p-4 bg-indigo-50 rounded-lg border">
                        <a 
                          href={selectedAdForModal.landing_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-800 underline break-all"
                        >
                          {selectedAdForModal.landing_url}
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                {/* Context */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('ads.modal.context')}
                  </label>
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <p className="text-gray-900">{getContextInfo(selectedAdForModal)}</p>
                  </div>
                </div>

                {/* Timestamps */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('ads.modal.createdAt')}
                    </label>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-gray-900">
                        {new Date(selectedAdForModal.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('ads.modal.updatedAt')}
                    </label>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-gray-900">
                        {new Date(selectedAdForModal.updated_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

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