import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Search,
  Target,
  Calendar,
  Trash2,
  X,
  Brain,
  Loader2,
  AlertCircle,
  CheckCircle,
  DollarSign,
  Save,
  Sparkles,
  Eye,
  EyeOff,
  Globe,
  TrendingUp,
  Award
} from 'lucide-react';
import {
  getCampaigns,
  deleteCampaign,
  generateCampaign,
  getCampaignGenerationStatus,
  saveCampaign,
  getOffers,
  getCreditBalance
} from '../services/api';
import { Campaign, CampaignGoal, CampaignGenerationParams, CampaignGenerationResult, Offer } from '../types';
import MarkdownRenderer from './MarkdownRenderer';
import { dispatchCreditUpdate } from '../utils/creditEvents';

interface CampaignsProps {
  businessProfileId?: string;
  authToken: string;
  onTokenRefreshed?: (newToken: string) => void;
  onCampaignsChanged?: () => void;
}

const CAMPAIGN_GOALS: CampaignGoal[] = [
  'Brand Awareness',
  'Lead Generation',
  'Sales / Conversions',
  'Product Launch',
  'Customer Retention & Loyalty',
  'Event Promotion',
  'Rebranding / Reputation Management',
  'Community Engagement'
];

const AVAILABLE_CHANNELS = [
  { key: 'facebook', label: 'Facebook', icon: '📘' },
  { key: 'instagram', label: 'Instagram', icon: '📷' },
  { key: 'linkedin', label: 'LinkedIn', icon: '💼' },
  { key: 'google_ads', label: 'Google Ads', icon: '🔍' },
  { key: 'youtube', label: 'YouTube', icon: '📺' },
  { key: 'tiktok', label: 'TikTok', icon: '🎵' },
  { key: 'email', label: 'Email', icon: '📧' },
  { key: 'influencers', label: 'Influencers', icon: '⭐' },
  { key: 'events', label: 'Events', icon: '🎪' },
  { key: 'seo', label: 'SEO', icon: '🔍' },
  { key: 'pr_media', label: 'PR & Media', icon: '📰' },
  { key: 'community_forums', label: 'Community Forums', icon: '💬' }
];

const CampaignsComponent: React.FC<CampaignsProps> = ({
  businessProfileId,
  authToken,
  onTokenRefreshed,
  onCampaignsChanged
}) => {
  const { t } = useTranslation();

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [filteredCampaigns, setFilteredCampaigns] = useState<Campaign[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showGenerationForm, setShowGenerationForm] = useState(false);
  const [generatedCampaign, setGeneratedCampaign] = useState<CampaignGenerationResult | null>(null);
  const [showGeneratedResult, setShowGeneratedResult] = useState(false);
  const [expandedCampaignId, setExpandedCampaignId] = useState<string | null>(null);

  // Function to highlight search terms in text
  const highlightSearchTerm = useCallback((text: string, searchTerm: string) => {
    if (!searchTerm.trim()) return text;

    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <span key={index} className="bg-yellow-200 text-yellow-800 px-1 rounded">
          {part}
        </span>
      ) : part
    );
  }, []);

  const truncateText = (text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Skeleton loader component
  const CampaignCardSkeleton = () => (
    <div className="bg-white rounded-2xl border border-gray-200/60 p-8 animate-pulse">
      <div className="flex items-start gap-4 mb-6">
        <div className="w-16 h-16 bg-gray-200 rounded-2xl"></div>
        <div className="flex-1">
          <div className="h-6 bg-gray-200 rounded mb-2 w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
      <div className="space-y-2 mb-6">
        <div className="h-4 bg-gray-200 rounded"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        <div className="h-4 bg-gray-200 rounded w-4/6"></div>
      </div>
      <div className="flex justify-between items-center">
        <div className="h-8 bg-gray-200 rounded w-24"></div>
        <div className="h-10 bg-gray-200 rounded w-32"></div>
      </div>
    </div>
  );

  // Generation form state
  const [generationParams, setGenerationParams] = useState<CampaignGenerationParams>({
    campaign_goal: 'Brand Awareness',
    budget: undefined,
    deadline: undefined,
    selected_products: []
  });

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Filter campaigns based on search
  useEffect(() => {
    if (!debouncedSearchQuery.trim()) {
      setFilteredCampaigns(campaigns);
    } else {
      const query = debouncedSearchQuery.toLowerCase();
      const filtered = campaigns.filter(campaign => 
        campaign.goal.toLowerCase().includes(query) ||
        campaign.strategy_summary?.toLowerCase().includes(query) ||
        campaign.status.toLowerCase().includes(query)
      );
      setFilteredCampaigns(filtered);
    }
  }, [campaigns, debouncedSearchQuery]);

  const fetchCampaigns = useCallback(async () => {
    if (!businessProfileId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const response = await getCampaigns(authToken, businessProfileId);
      
      if (response.success && response.data) {
        setCampaigns(response.data);
      } else if (response.isTokenExpired && onTokenRefreshed) {
        // Handle token refresh logic if needed
        setError('Please refresh the page and try again.');
      } else {
        setError(response.error || 'Failed to load campaigns');
      }
    } catch (err) {
      console.error('Error fetching campaigns:', err);
      setError('Failed to load campaigns');
    } finally {
      setIsLoading(false);
    }
  }, [businessProfileId, authToken, onTokenRefreshed]);

  const fetchOffers = useCallback(async () => {
    if (!businessProfileId) return;
    
    try {
      const response = await getOffers(authToken, businessProfileId);
      if (response.success && response.data) {
        setOffers(response.data);
      }
    } catch (err) {
      console.error('Error fetching offers:', err);
    }
  }, [businessProfileId, authToken]);

  useEffect(() => {
    fetchCampaigns();
    fetchOffers();
  }, [fetchCampaigns, fetchOffers]);

  const handleDeleteCampaign = async (campaignId: string) => {
    try {
      const response = await deleteCampaign(campaignId, authToken);
      
      if (response.success) {
        setCampaigns(prev => prev.filter(c => c.id !== campaignId));
        setShowDeleteConfirm(null);
        onCampaignsChanged?.();
      } else {
        setError(response.error || 'Failed to delete campaign');
      }
    } catch (err) {
      console.error('Error deleting campaign:', err);
      setError('Failed to delete campaign');
    }
  };

  const handleGenerateCampaign = async () => {
    if (!businessProfileId) return;

    setIsGenerating(true);
    setError(null);

    try {
      // Start campaign generation (returns job ID immediately)
      const response = await generateCampaign(businessProfileId, generationParams, authToken);
      
      if (response.success && response.jobId) {
        // Start polling for results
        await pollCampaignGeneration(response.jobId);
      } else {
        console.error('No jobId in response:', response);
        setError(response.error || 'Failed to start campaign generation');
        setIsGenerating(false);
      }
    } catch (err) {
      console.error('Error generating campaign:', err);
      setError('Failed to generate campaign');
      setIsGenerating(false);
    }
  };

  const pollCampaignGeneration = async (jobId: string): Promise<void> => {
    const maxAttempts = 30; // 5 minutes max (10s intervals)
    let attempts = 0;

    return new Promise<void>((resolve, reject) => {
      const poll = async (): Promise<void> => {
        try {
          attempts++;
          const statusResponse = await getCampaignGenerationStatus(jobId, authToken);
          
          if (statusResponse.success) {
            if (statusResponse.status === 'completed' && statusResponse.data) {
              // Generation completed successfully - merge with original parameters
              const completeCampaignData = {
                ...statusResponse.data,
                campaign_params: generationParams // Use the original parameters from the form
              };
              setGeneratedCampaign(completeCampaignData);
              setShowGenerationForm(false);
              setShowGeneratedResult(true);
              setIsGenerating(false);

              // Update credits and dispatch event for real-time updates
              try {
                const creditResult = await getCreditBalance();
                if (creditResult.success && creditResult.data) {
                  dispatchCreditUpdate({
                    userId: 'current-user',
                    newBalance: creditResult.data.balance,
                    toolSlug: 'campaign-generator'
                  });
                }
              } catch (creditError) {
                console.error('Error updating credits after campaign generation:', creditError);
              }

              resolve();
              return;
            } else if (statusResponse.status === 'failed') {
              // Generation failed
              setError('Campaign generation failed');
              setIsGenerating(false);
              reject(new Error('Campaign generation failed'));
              return;
            } else if (statusResponse.status === 'queued' || statusResponse.status === 'pending' || statusResponse.status === 'processing') {
              // Still processing, continue polling
              if (attempts < maxAttempts) {
                setTimeout(poll, 10000); // Poll every 10 seconds
              } else {
                setError('Campaign generation timed out. Please try again.');
                setIsGenerating(false);
                reject(new Error('Campaign generation timed out'));
              }
            } else {
              // Unknown status, log and continue polling for a few more attempts
              console.warn(`Unknown status received: ${statusResponse.status}, continuing to poll...`);
              if (attempts < maxAttempts) {
                setTimeout(poll, 10000); // Poll every 10 seconds
              } else {
                setError(`Campaign generation stopped with unknown status: ${statusResponse.status}`);
                setIsGenerating(false);
                reject(new Error(`Unknown status: ${statusResponse.status}`));
              }
            }
          } else {
            setError(statusResponse.error || 'Failed to check generation status');
            setIsGenerating(false);
            reject(new Error(statusResponse.error || 'Failed to check generation status'));
          }
        } catch (err) {
          console.error('Error polling campaign generation:', err);
          setError('Failed to check generation status');
          setIsGenerating(false);
          reject(err);
        }
      };

      poll();
    });
  };

  const handleSaveCampaign = async () => {
    if (!businessProfileId || !generatedCampaign) return;

    try {
      const response = await saveCampaign(businessProfileId, {
        campaign_params: generationParams,
        campaign_data: generatedCampaign.campaign_data
      }, authToken);
      
      if (response.success) {
        await fetchCampaigns(); // Refresh the list
        setShowGeneratedResult(false);
        setGeneratedCampaign(null);
        onCampaignsChanged?.();
      } else {
        setError(response.error || 'Failed to save campaign');
      }
    } catch (err) {
      console.error('Error saving campaign:', err);
      setError('Failed to save campaign');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'text-green-600 bg-green-100 border-green-200';
      case 'archived': return 'text-gray-600 bg-gray-100 border-gray-200';
      default: return 'text-yellow-600 bg-yellow-100 border-yellow-200';
    }
  };

  const getGoalIcon = (goal: CampaignGoal) => {
    const iconMap: Record<CampaignGoal, string> = {
      'Brand Awareness': '🎯',
      'Lead Generation': '🔗',
      'Sales / Conversions': '💰',
      'Product Launch': '🚀',
      'Customer Retention & Loyalty': '❤️',
      'Event Promotion': '🎪',
      'Rebranding / Reputation Management': '✨',
      'Community Engagement': '👥'
    };
    return iconMap[goal] || '🎯';
  };

  if (!businessProfileId) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No Business Profile Selected</h3>
          <p className="mt-1 text-sm text-gray-500">Please select a business profile to manage campaigns.</p>
        </div>
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
                <Target className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-black text-gray-900 tracking-tight">
                  {t('campaigns.title', 'Kampanie')}
                </h1>
                <p className="text-lg text-gray-600 font-medium mt-1">
                  {t('campaigns.subtitle', 'Generuj i zarządzaj strategiami kampanii marketingowych')}
                </p>
              </div>
            </div>

            {/* Right - Available Count */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl px-4 py-3 border border-gray-200/60 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                  <Award className="w-4 h-4 text-white" />
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">
                    {isLoading ? (
                      <span className="inline-block w-8 h-5 bg-gray-200 rounded animate-pulse"></span>
                    ) : (
                      `${filteredCampaigns.length}`
                    )}
                  </p>
                  <p className="text-xs text-gray-500">{t('campaigns.available', 'Dostępnych kampanii')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Actions Section */}
          <div className="flex justify-between items-center gap-4 mb-2">
            {/* Left - Search */}
            <div className="flex-1 max-w-md">
              <div className="relative bg-white/90 backdrop-blur-sm rounded-xl border border-gray-200/60 shadow-lg">
                <div className="relative">
                  <Search className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder={t('campaigns.search.placeholder', 'Szukaj kampanii...')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-12 py-3 bg-transparent border-0 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 placeholder-gray-500 font-medium rounded-xl"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Right - Action Button */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowGenerationForm(true)}
                className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
              >
                <Brain className="w-5 h-5" />
                <span>{t('campaigns.generateNew', 'Generuj Kampanię')}</span>
              </button>
            </div>
          </div>

          {/* Search feedback */}
          <div className="min-h-[20px] mb-2">
            {searchQuery && !debouncedSearchQuery && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                <span>{t('campaigns.searching', 'Szukam...')}</span>
              </div>
            )}

            {debouncedSearchQuery && filteredCampaigns.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="font-medium">
                  {t('campaigns.searchResults', 'Znaleziono {{count}} {{type}}', {
                    count: filteredCampaigns.length,
                    type: filteredCampaigns.length === 1 ? 'kampanię' : 'kampanii'
                  })}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-2xl bg-red-50 border border-red-200 p-6 shadow-sm">
          <div className="flex">
            <div className="p-2 bg-red-100 rounded-xl">
              <AlertCircle className="h-5 w-5 text-red-600" />
            </div>
            <div className="ml-4 flex-1">
              <h3 className="text-sm font-semibold text-red-900 mb-1">{t('campaigns.error', 'Błąd')}</h3>
              <p className="text-sm text-red-800">{error}</p>
            </div>
            <div className="ml-auto">
              <button
                onClick={() => setError(null)}
                className="p-2 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-lg transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content Area */}
      <>
        {isLoading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {[...Array(4)].map((_, index) => (
              <CampaignCardSkeleton key={index} />
            ))}
          </div>
        )}

        {!isLoading && filteredCampaigns.length === 0 && (
          <div className="text-center py-16">
            <div className="relative inline-block">
              <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-6 transform rotate-3">
                <Target className="w-12 h-12 text-gray-400" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <Brain className="w-4 h-4 text-white" />
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {searchQuery
                  ? t('campaigns.noSearchResults', 'Nie znaleziono kampanii')
                  : t('campaigns.noCampaigns', 'Brak kampanii')
                }
              </h3>
              <p className="text-gray-600 mb-8 leading-relaxed">
                {searchQuery
                  ? t('campaigns.tryDifferentSearch', 'Spróbuj dostosować swoje wyszukiwanie')
                  : t('campaigns.addFirst', 'Wygeneruj swoją pierwszą kampanię, aby rozpocząć analizę marketingową')
                }
              </p>
              {!searchQuery && (
                <button
                  onClick={() => setShowGenerationForm(true)}
                  className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                >
                  <Brain className="w-5 h-5" />
                  <span>{t('campaigns.createFirst', 'Wygeneruj Pierwszą Kampanię')}</span>
                </button>
              )}
            </div>
          </div>
        )}

        {!isLoading && filteredCampaigns.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {filteredCampaigns.map((campaign) => (
              <div
                key={campaign.id}
                className="group relative bg-white rounded-2xl border border-gray-200/60 p-8 hover:shadow-2xl hover:shadow-purple-500/10 hover:border-purple-300/50 transition-all duration-500 overflow-hidden"
              >
                {/* Background Effects */}
                <div className="absolute inset-0 bg-gradient-to-br from-white via-purple-50/30 to-blue-50/20 opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                <div className="absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-br from-purple-400/10 to-blue-400/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-500"></div>

                <div className="relative">
                  {/* Campaign Header */}
                  <div className="flex items-start gap-4 mb-6">
                    <div className="relative">
                      <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-lg flex items-center justify-center group-hover:shadow-xl group-hover:scale-105 transition-all duration-300">
                        <span className="text-2xl">{getGoalIcon(campaign.goal)}</span>
                      </div>
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <Target className="w-3 h-3 text-white" />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-purple-700 transition-colors">
                        {debouncedSearchQuery
                          ? highlightSearchTerm(campaign.goal, debouncedSearchQuery)
                          : campaign.goal
                        }
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(campaign.created_at).toLocaleDateString()}</span>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getStatusColor(campaign.status)}`}>
                          {campaign.status}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setExpandedCampaignId(
                          expandedCampaignId === campaign.id ? null : campaign.id
                        )}
                        className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        title={expandedCampaignId === campaign.id ? t('campaigns.hide', 'Ukryj') : t('campaigns.show', 'Pokaż')}
                      >
                        {expandedCampaignId === campaign.id ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        <span className="hidden sm:inline">{expandedCampaignId === campaign.id ? t('campaigns.hide', 'Ukryj') : t('campaigns.show', 'Pokaż')}</span>
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(campaign.id)}
                        className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title={t('campaigns.delete', 'Usuń')}
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="hidden sm:inline">{t('campaigns.delete', 'Usuń')}</span>
                      </button>
                    </div>
                  </div>

                  {/* Campaign Summary */}
                  {campaign.strategy_summary && (
                    <div className="mb-8">
                      <div className="bg-gray-50/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-100 group-hover:bg-purple-50/50 group-hover:border-purple-200/50 transition-all duration-300">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-white rounded-xl shadow-sm group-hover:shadow-md transition-all duration-300">
                            <Sparkles className="w-5 h-5 text-gray-600 group-hover:text-purple-600 transition-colors" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-sm font-semibold text-gray-800 mb-2 uppercase tracking-wide">
                              {t('campaigns.strategySummary', 'Strategia')}
                            </h4>
                            <div className="text-gray-700 leading-relaxed group-hover:text-gray-800 transition-colors line-clamp-3">
                              {debouncedSearchQuery ? (
                                <MarkdownRenderer 
                                  content={highlightSearchTerm(truncateText(campaign.strategy_summary, 200), debouncedSearchQuery) as string} 
                                  variant="summary"
                                  className="text-sm"
                                />
                              ) : (
                                <MarkdownRenderer 
                                  content={truncateText(campaign.strategy_summary, 200)} 
                                  variant="summary"
                                  className="text-sm"
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Campaign Budget & Details */}
                  {(campaign.budget || campaign.recommended_budget || campaign.deadline) && (
                    <div className="mb-8">
                      <div className="bg-gradient-to-r from-blue-50 to-purple-50 backdrop-blur-sm rounded-2xl p-6 border border-blue-100 group-hover:from-blue-100/50 group-hover:to-purple-100/50 group-hover:border-blue-200/50 transition-all duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {campaign.budget && (
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-white rounded-xl shadow-sm group-hover:shadow-md transition-all duration-300">
                                <DollarSign className="w-5 h-5 text-blue-600 group-hover:text-blue-700 transition-colors" />
                              </div>
                              <div>
                                <h4 className="text-sm font-semibold text-blue-800 mb-1 uppercase tracking-wide">
                                  {t('campaigns.budget', 'Budżet')}
                                </h4>
                                <p className="text-lg font-bold text-blue-700 group-hover:text-blue-800 transition-colors">
                                  ${campaign.budget.toLocaleString()}
                                </p>
                              </div>
                            </div>
                          )}
                          {campaign.recommended_budget && (
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-white rounded-xl shadow-sm group-hover:shadow-md transition-all duration-300">
                                <TrendingUp className="w-5 h-5 text-blue-600 group-hover:text-blue-700 transition-colors" />
                              </div>
                              <div>
                                <h4 className="text-sm font-semibold text-blue-800 mb-1 uppercase tracking-wide">
                                  {t('campaigns.recommended', 'Zalecane')}
                                </h4>
                                <p className="text-lg font-bold text-blue-700 group-hover:text-blue-800 transition-colors">
                                  ${campaign.recommended_budget.toLocaleString()}
                                </p>
                              </div>
                            </div>
                          )}
                          {campaign.deadline && (
                            <div className="flex items-center gap-3 md:col-span-2">
                              <div className="p-2 bg-white rounded-xl shadow-sm group-hover:shadow-md transition-all duration-300">
                                <Calendar className="w-5 h-5 text-blue-600 group-hover:text-blue-700 transition-colors" />
                              </div>
                              <div>
                                <h4 className="text-sm font-semibold text-blue-800 mb-1 uppercase tracking-wide">
                                  {t('campaigns.deadline', 'Termin')}
                                </h4>
                                <p className="text-lg font-bold text-blue-700 group-hover:text-blue-800 transition-colors">
                                  {new Date(campaign.deadline).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Channels */}
                  {campaign.channels && Object.keys(campaign.channels).length > 0 && (
                    <div className="mb-8">
                      <div className="bg-blue-50/80 backdrop-blur-sm rounded-2xl p-6 border border-blue-100 group-hover:bg-blue-100/50 group-hover:border-blue-200/50 transition-all duration-300">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="p-2 bg-white rounded-xl shadow-sm group-hover:shadow-md transition-all duration-300">
                            <Globe className="w-5 h-5 text-blue-600 group-hover:text-blue-700 transition-colors" />
                          </div>
                          <h4 className="text-sm font-semibold text-blue-800 uppercase tracking-wide">
                            {t('campaigns.recommendedChannels', 'Zalecane Kanały')}
                          </h4>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(campaign.channels)
                            .filter(([_, enabled]) => enabled)
                            .slice(0, 6)
                            .map(([channel, _]) => {
                              const channelInfo = AVAILABLE_CHANNELS.find(c => c.key === channel);
                              return (
                                <span
                                  key={channel}
                                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-white/80 border border-blue-200 text-blue-800 group-hover:bg-white group-hover:border-blue-300 transition-all duration-300"
                                >
                                  <span className="text-sm">{channelInfo?.icon}</span>
                                  {channelInfo?.label || channel}
                                </span>
                              );
                            })}
                          {Object.values(campaign.channels).filter(Boolean).length > 6 && (
                            <span className="inline-flex items-center px-3 py-2 rounded-xl text-xs font-semibold bg-white/60 border border-blue-200 text-blue-700">
                              +{Object.values(campaign.channels).filter(Boolean).length - 6} more
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Expanded Details */}
                  {expandedCampaignId === campaign.id && (
                    <div className="mt-6 pt-6 border-t border-gray-200/60 group-hover:border-purple-200/60 transition-all duration-300 space-y-6">
                      {campaign.timeline && (
                        <div className="bg-purple-50/80 backdrop-blur-sm rounded-2xl p-6 border border-purple-100">
                          <h4 className="text-sm font-semibold text-purple-800 mb-3 uppercase tracking-wide flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {t('campaigns.timeline', 'Harmonogram')}
                          </h4>
                          <MarkdownRenderer 
                            content={campaign.timeline} 
                            variant="timeline"
                          />
                        </div>
                      )}
                      
                      {campaign.target_audience && (
                        <div className="bg-purple-50/80 backdrop-blur-sm rounded-2xl p-6 border border-purple-100">
                          <h4 className="text-sm font-semibold text-purple-800 mb-3 uppercase tracking-wide flex items-center gap-2">
                            <Target className="w-4 h-4" />
                            {t('campaigns.targetAudience', 'Grupa Docelowa')}
                          </h4>
                          <MarkdownRenderer 
                            content={campaign.target_audience} 
                            variant="audience"
                          />
                        </div>
                      )}

                      {campaign.sales_funnel_steps && (
                        <div className="bg-purple-50/80 backdrop-blur-sm rounded-2xl p-6 border border-purple-100">
                          <h4 className="text-sm font-semibold text-purple-800 mb-3 uppercase tracking-wide flex items-center gap-2">
                            <TrendingUp className="w-4 h-4" />
                            {t('campaigns.salesFunnel', 'Lejek Sprzedażowy')}
                          </h4>
                          <MarkdownRenderer 
                            content={campaign.sales_funnel_steps} 
                            variant="funnel"
                          />
                        </div>
                      )}

                      {campaign.risks_recommendations && (
                        <div className="bg-yellow-50/80 backdrop-blur-sm rounded-2xl p-6 border border-yellow-100">
                          <h4 className="text-sm font-semibold text-yellow-800 mb-3 uppercase tracking-wide flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            {t('campaigns.risksRecommendations', 'Ryzyka i Zalecenia')}
                          </h4>
                          <MarkdownRenderer 
                            content={campaign.risks_recommendations} 
                            variant="risks"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-r from-red-600 to-red-600 rounded-xl">
                  <Trash2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {t('campaigns.deleteConfirm.title', 'Potwierdź usunięcie')}
                  </h2>
                  <p className="text-gray-600">
                    {t('campaigns.deleteConfirm.message', 'Czy na pewno chcesz usunąć tę kampanię?')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="flex items-center justify-end gap-4 p-6">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-6 py-3 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 font-medium rounded-xl transition-colors"
              >
                {t('campaigns.cancel', 'Anuluj')}
              </button>
              <button
                onClick={() => handleDeleteCampaign(showDeleteConfirm)}
                className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {t('campaigns.delete', 'Usuń')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Campaign Generation Form Modal */}
      {showGenerationForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {t('campaigns.generateTitle', 'Generuj Strategię Kampanii')}
                  </h2>
                  <p className="text-gray-600">
                    {t('campaigns.generateSubtitle', 'Stwórz spersonalizowaną strategię marketingową z AI')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowGenerationForm(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="flex-1 p-6 overflow-y-auto">
              {!isGenerating && (
                <div className="space-y-6">
                {/* Campaign Goal */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    {t('campaigns.form.goal', 'Cel Kampanii')} *
                  </label>
                  <select
                    value={generationParams.campaign_goal}
                    onChange={(e) => setGenerationParams({...generationParams, campaign_goal: e.target.value as CampaignGoal})}
                    className="block w-full px-4 py-3 bg-white border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 font-medium"
                  >
                    {CAMPAIGN_GOALS.map(goal => (
                      <option key={goal} value={goal}>
                        {getGoalIcon(goal)} {goal}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Budget */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    {t('campaigns.form.budget', 'Budżet')} ({t('campaigns.form.optional', 'opcjonalnie')})
                  </label>
                  <div className="relative rounded-xl shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <DollarSign className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="number"
                      min="0"
                      value={generationParams.budget || ''}
                      onChange={(e) => setGenerationParams({...generationParams, budget: e.target.value ? parseFloat(e.target.value) : undefined})}
                      placeholder={t('campaigns.form.budgetPlaceholder', 'Zostaw puste dla rekomendacji AI')}
                      className="block w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 font-medium placeholder-gray-500"
                    />
                  </div>
                </div>

                {/* Deadline */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    {t('campaigns.form.deadline', 'Termin Kampanii')} ({t('campaigns.form.optional', 'opcjonalnie')})
                  </label>
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={generationParams.deadline || ''}
                    onChange={(e) => setGenerationParams({...generationParams, deadline: e.target.value || undefined})}
                    className="block w-full px-4 py-3 bg-white border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 font-medium"
                  />
                </div>

                {/* Products Selection */}
                {offers.length > 0 && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      {t('campaigns.form.products', 'Wybrane Produkty/Usługi')} ({t('campaigns.form.optional', 'opcjonalnie')})
                    </label>
                    <div className="space-y-3 max-h-48 overflow-y-auto bg-gray-50 rounded-xl p-4 border">
                      {offers.map(offer => (
                        <label key={offer.id} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50/30 transition-all cursor-pointer">
                          <input
                            type="checkbox"
                            checked={generationParams.selected_products?.includes(offer.id) || false}
                            onChange={(e) => {
                              const selected = generationParams.selected_products || [];
                              if (e.target.checked) {
                                setGenerationParams({...generationParams, selected_products: [...selected, offer.id]});
                              } else {
                                setGenerationParams({...generationParams, selected_products: selected.filter(id => id !== offer.id)});
                              }
                            }}
                            className="mt-1 w-4 h-4 rounded border-gray-300 text-purple-600 shadow-sm focus:border-purple-300 focus:ring focus:ring-purple-200 focus:ring-opacity-50"
                          />
                          <div className="flex-1">
                            <span className="text-sm font-semibold text-gray-900 block">
                              {offer.name}
                            </span>
                            <span className="text-xs text-gray-600">
                              ({offer.type}) - ${offer.price}/{offer.unit}
                            </span>
                          </div>
                        </label>
                      ))}
                    </div>
                    {generationParams.selected_products?.length === 0 && (
                      <p className="text-sm text-gray-500 mt-2 bg-blue-50 p-3 rounded-lg border border-blue-200">
                        {t('campaigns.form.noProductsNote', 'Brak wybranych produktów - strategia będzie na poziomie marki')}
                      </p>
                    )}
                  </div>
                )}
              </div>
              )}

              {isGenerating && (
                <div className="text-center py-16">
                  <div className="relative inline-block mb-8">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-3xl flex items-center justify-center mx-auto transform rotate-3">
                      <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">
                      {t('campaigns.generating.title', 'Generuję Strategię Kampanii')}
                    </h3>
                    <p className="text-lg text-gray-600 mb-8 leading-relaxed max-w-md mx-auto">
                      {t('campaigns.generating.description', 'AI analizuje Twój profil biznesowy i tworzy spersonalizowaną strategię marketingową...')}
                    </p>
                    
                    {/* Progress indicator */}
                    <div className="flex items-center justify-center space-x-2">
                      <div className="flex space-x-2">
                        {[0, 1, 2].map((index) => (
                          <div
                            key={index}
                            className={`h-2 w-8 rounded-full transition-colors duration-500 ${
                              index === 0 ? 'bg-purple-500' :
                              index === 1 ? 'bg-purple-300' : 'bg-gray-200'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {!isGenerating && (
              <div className="flex items-center justify-end gap-4 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowGenerationForm(false)}
                className="px-6 py-3 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 font-medium rounded-xl transition-colors"
              >
                {t('campaigns.cancel', 'Anuluj')}
              </button>
              <button
                onClick={handleGenerateCampaign}
                disabled={isGenerating}
                className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>{t('campaigns.generating', 'Generuję...')}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>{t('campaigns.generateStrategy', 'Generuj Strategię')}</span>
                  </>
                )}
              </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Generated Campaign Result Modal */}
      {showGeneratedResult && generatedCampaign && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {t('campaigns.generatedTitle', 'Wygenerowana Strategia Kampanii')}
                  </h2>
                  <p className="text-gray-600">
                    {t('campaigns.generatedSubtitle', 'Przejrzyj i zapisz swoją spersonalizowaną strategię')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowGeneratedResult(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="flex-1 p-6 overflow-y-auto">

              <div className="space-y-6">
                {/* Strategy Summary */}
                {generatedCampaign?.campaign_data?.strategy_summary && (
                  <div className="bg-purple-50/80 backdrop-blur-sm rounded-2xl p-6 border border-purple-100">
                    <h4 className="text-sm font-semibold text-purple-800 mb-3 uppercase tracking-wide flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      {t('campaigns.strategySummary', 'Strategia')}
                    </h4>
                    <MarkdownRenderer 
                      content={generatedCampaign.campaign_data.strategy_summary} 
                      variant="summary"
                    />
                  </div>
                )}

                {/* Timeline */}
                {generatedCampaign?.campaign_data?.timeline && (
                  <div className="bg-purple-50/80 backdrop-blur-sm rounded-2xl p-6 border border-purple-100">
                    <h4 className="text-sm font-semibold text-purple-800 mb-3 uppercase tracking-wide flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {t('campaigns.timeline', 'Harmonogram')}
                    </h4>
                    <MarkdownRenderer 
                      content={generatedCampaign.campaign_data.timeline} 
                      variant="timeline"
                    />
                  </div>
                )}

                {/* Recommended Channels */}
                {generatedCampaign?.campaign_data?.channels && (
                  <div className="bg-blue-50/80 backdrop-blur-sm rounded-2xl p-6 border border-blue-100">
                    <h4 className="text-sm font-semibold text-blue-800 mb-4 uppercase tracking-wide flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      {t('campaigns.recommendedChannels', 'Zalecane Kanały')}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(generatedCampaign?.campaign_data?.channels || {})
                        .filter(([_, enabled]) => enabled)
                        .map(([channel, _]) => {
                          const channelInfo = AVAILABLE_CHANNELS.find(c => c.key === channel);
                          const rationale = generatedCampaign?.campaign_data?.channels_rationale?.[channel];
                          return (
                            <div key={channel} className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-blue-200">
                              <div className="flex items-center mb-2">
                                <span className="text-lg mr-3">{channelInfo?.icon}</span>
                                <span className="font-semibold text-blue-900">{channelInfo?.label || channel}</span>
                              </div>
                              {rationale && (
                                <div className="text-xs text-blue-700">
                                  <MarkdownRenderer 
                                    content={rationale} 
                                    className="text-xs bg-transparent border-0 p-0"
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* Target Audience */}
                {generatedCampaign?.campaign_data?.target_audience && (
                  <div className="bg-pink-50/80 backdrop-blur-sm rounded-2xl p-6 border border-pink-100">
                    <h4 className="text-sm font-semibold text-pink-800 mb-3 uppercase tracking-wide flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      {t('campaigns.targetAudience', 'Grupa Docelowa')}
                    </h4>
                    <MarkdownRenderer 
                      content={generatedCampaign.campaign_data.target_audience} 
                      variant="audience"
                    />
                  </div>
                )}

                {/* Sales Funnel */}
                {generatedCampaign?.campaign_data?.sales_funnel_steps && (
                  <div className="bg-purple-50/80 backdrop-blur-sm rounded-2xl p-6 border border-purple-100">
                    <h4 className="text-sm font-semibold text-purple-800 mb-3 uppercase tracking-wide flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      {t('campaigns.salesFunnel', 'Lejek Sprzedażowy')}
                    </h4>
                    <MarkdownRenderer 
                      content={generatedCampaign.campaign_data.sales_funnel_steps} 
                      variant="funnel"
                    />
                  </div>
                )}

                {/* Budget Recommendation */}
                {generatedCampaign?.campaign_data?.recommended_budget && (
                  <div className="bg-blue-50/80 backdrop-blur-sm rounded-2xl p-6 border border-blue-100">
                    <h4 className="text-sm font-semibold text-blue-800 mb-3 uppercase tracking-wide flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      {t('campaigns.budgetRecommendation', 'Rekomendacja Budżetowa')}
                    </h4>
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-blue-200">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <DollarSign className="w-6 h-6 text-blue-600" />
                        </div>
                        <span className="text-2xl font-bold text-blue-800">
                          ${generatedCampaign?.campaign_data?.recommended_budget?.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Risks & Recommendations */}
                {generatedCampaign?.campaign_data?.risks_recommendations && (
                  <div className="bg-yellow-50/80 backdrop-blur-sm rounded-2xl p-6 border border-yellow-100">
                    <h4 className="text-sm font-semibold text-yellow-800 mb-3 uppercase tracking-wide flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      {t('campaigns.risksRecommendations', 'Ryzyka i Zalecenia')}
                    </h4>
                    <MarkdownRenderer 
                      content={generatedCampaign.campaign_data.risks_recommendations} 
                      variant="risks"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-4 p-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowGeneratedResult(false);
                  setShowGenerationForm(true);
                }}
                className="px-6 py-3 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 font-medium rounded-xl transition-colors"
              >
                {t('campaigns.regenerate', 'Generuj ponownie')}
              </button>
              <button
                onClick={handleSaveCampaign}
                className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
              >
                <Save className="w-5 h-5" />
                <span>{t('campaigns.acceptSave', 'Zaakceptuj i Zapisz')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampaignsComponent;