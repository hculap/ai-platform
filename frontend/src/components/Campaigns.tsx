import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Search,
  Plus,
  Edit,
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
  ArrowRight,
  Eye,
  EyeOff,
  Globe,
  TrendingUp
} from 'lucide-react';
import { 
  getCampaigns, 
  deleteCampaign, 
  generateCampaign,
  getCampaignGenerationStatus,
  saveCampaign,
  getOffers
} from '../services/api';
import { Campaign, CampaignGoal, CampaignGenerationParams, CampaignGenerationResult, Offer } from '../types';

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
      console.log('Generation response:', response);
      
      if (response.success && response.jobId) {
        console.log('Starting polling with jobId:', response.jobId);
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
    console.log('Starting polling for jobId:', jobId);
    const maxAttempts = 30; // 5 minutes max (10s intervals)
    let attempts = 0;

    return new Promise<void>((resolve, reject) => {
      const poll = async (): Promise<void> => {
        try {
          attempts++;
          console.log(`Polling attempt ${attempts} for jobId:`, jobId);
          const statusResponse = await getCampaignGenerationStatus(jobId, authToken);
          console.log('Status response:', statusResponse);
          
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
              console.log(`Status is ${statusResponse.status}, continuing to poll in 10 seconds...`);
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Campaigns</h2>
          <p className="mt-1 text-sm text-gray-500">Generate and manage marketing campaign strategies</p>
        </div>
        <button
          onClick={() => setShowGenerationForm(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <Brain className="h-4 w-4 mr-2" />
          Generate Campaign
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="mt-2 text-sm text-red-700">{error}</p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => setError(null)}
                className="inline-flex rounded-md bg-red-50 p-1.5 text-red-500 hover:bg-red-100"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search campaigns..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
      </div>

      {/* Campaigns List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <span className="ml-2 text-gray-600">Loading campaigns...</span>
        </div>
      ) : filteredCampaigns.length === 0 ? (
        <div className="text-center py-12">
          <Target className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No campaigns found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {campaigns.length === 0 
              ? "Get started by generating your first campaign strategy." 
              : "No campaigns match your search criteria."
            }
          </p>
          {campaigns.length === 0 && (
            <div className="mt-6">
              <button
                onClick={() => setShowGenerationForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <Brain className="h-4 w-4 mr-2" />
                Generate Your First Campaign
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {filteredCampaigns.map((campaign) => (
            <div key={campaign.id} className="bg-white shadow rounded-lg overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">{getGoalIcon(campaign.goal)}</span>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{campaign.goal}</h3>
                      <p className="text-sm text-gray-500">
                        Created {new Date(campaign.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(campaign.status)}`}>
                      {campaign.status}
                    </span>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => setExpandedCampaignId(
                          expandedCampaignId === campaign.id ? null : campaign.id
                        )}
                        className="p-1 text-gray-400 hover:text-indigo-600"
                      >
                        {expandedCampaignId === campaign.id ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(campaign.id)}
                        className="p-1 text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Campaign Summary */}
                {campaign.strategy_summary && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {campaign.strategy_summary}
                    </p>
                  </div>
                )}

                {/* Campaign Details */}
                <div className="mt-4 grid grid-cols-2 gap-4">
                  {campaign.budget && (
                    <div className="flex items-center text-sm text-gray-600">
                      <DollarSign className="h-4 w-4 mr-1" />
                      Budget: ${campaign.budget.toLocaleString()}
                    </div>
                  )}
                  {campaign.deadline && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-1" />
                      Deadline: {new Date(campaign.deadline).toLocaleDateString()}
                    </div>
                  )}
                  {campaign.recommended_budget && (
                    <div className="flex items-center text-sm text-gray-600">
                      <TrendingUp className="h-4 w-4 mr-1" />
                      Recommended: ${campaign.recommended_budget.toLocaleString()}
                    </div>
                  )}
                </div>

                {/* Channels */}
                {campaign.channels && Object.keys(campaign.channels).length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Recommended Channels</h4>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(campaign.channels)
                        .filter(([_, enabled]) => enabled)
                        .slice(0, 4)
                        .map(([channel, _]) => {
                          const channelInfo = AVAILABLE_CHANNELS.find(c => c.key === channel);
                          return (
                            <span
                              key={channel}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {channelInfo?.icon} {channelInfo?.label || channel}
                            </span>
                          );
                        })}
                      {Object.values(campaign.channels).filter(Boolean).length > 4 && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          +{Object.values(campaign.channels).filter(Boolean).length - 4} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Expanded Details */}
                {expandedCampaignId === campaign.id && (
                  <div className="mt-6 border-t pt-6 space-y-4">
                    {campaign.timeline && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Timeline</h4>
                        <div className="text-sm text-gray-600 whitespace-pre-wrap bg-gray-50 p-3 rounded-md">
                          {campaign.timeline}
                        </div>
                      </div>
                    )}
                    
                    {campaign.target_audience && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Target Audience</h4>
                        <div className="text-sm text-gray-600 whitespace-pre-wrap bg-gray-50 p-3 rounded-md">
                          {campaign.target_audience}
                        </div>
                      </div>
                    )}

                    {campaign.sales_funnel_steps && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Sales Funnel</h4>
                        <div className="text-sm text-gray-600 whitespace-pre-wrap bg-gray-50 p-3 rounded-md">
                          {campaign.sales_funnel_steps}
                        </div>
                      </div>
                    )}

                    {campaign.risks_recommendations && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Risks & Recommendations</h4>
                        <div className="text-sm text-gray-600 whitespace-pre-wrap bg-yellow-50 p-3 rounded-md">
                          {campaign.risks_recommendations}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" onClick={() => setShowDeleteConfirm(null)}>
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white" onClick={e => e.stopPropagation()}>
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-4">Delete Campaign</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete this campaign? This action cannot be undone.
                </p>
              </div>
              <div className="items-center px-4 py-3">
                <div className="flex space-x-3">
                  <button
                    onClick={() => handleDeleteCampaign(showDeleteConfirm)}
                    className="px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-300"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(null)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 text-base font-medium rounded-md w-full shadow-sm hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Campaign Generation Form Modal */}
      {showGenerationForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" onClick={() => setShowGenerationForm(false)}>
          <div className="relative top-20 mx-auto p-6 border max-w-2xl shadow-lg rounded-md bg-white" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900">Generate Campaign Strategy</h3>
              <button
                onClick={() => setShowGenerationForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Campaign Goal */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Campaign Goal *</label>
                <select
                  value={generationParams.campaign_goal}
                  onChange={(e) => setGenerationParams({...generationParams, campaign_goal: e.target.value as CampaignGoal})}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
                <label className="block text-sm font-medium text-gray-700">Budget (optional)</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={generationParams.budget || ''}
                    onChange={(e) => setGenerationParams({...generationParams, budget: e.target.value ? parseFloat(e.target.value) : undefined})}
                    placeholder="Leave empty for AI recommendation"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              </div>

              {/* Deadline */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Campaign Deadline (optional)</label>
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={generationParams.deadline || ''}
                  onChange={(e) => setGenerationParams({...generationParams, deadline: e.target.value || undefined})}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>

              {/* Products Selection */}
              {offers.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Selected Products/Services (optional)</label>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {offers.map(offer => (
                      <label key={offer.id} className="flex items-center">
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
                          className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          {offer.name} ({offer.type}) - ${offer.price}/{offer.unit}
                        </span>
                      </label>
                    ))}
                  </div>
                  {generationParams.selected_products?.length === 0 && (
                    <p className="text-sm text-gray-500 mt-1">No products selected - strategy will be brand-level</p>
                  )}
                </div>
              )}
            </div>

            <div className="mt-8 flex justify-end space-x-3">
              <button
                onClick={() => setShowGenerationForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateCampaign}
                disabled={isGenerating}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Strategy
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generated Campaign Result Modal */}
      {showGeneratedResult && generatedCampaign && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-6 border max-w-4xl shadow-lg rounded-md bg-white my-10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900">Generated Campaign Strategy</h3>
              <button
                onClick={() => setShowGeneratedResult(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6 max-h-96 overflow-y-auto">
              {/* Strategy Summary */}
              {generatedCampaign?.campaign_data?.strategy_summary && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Strategy Summary</h4>
                  <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded-md whitespace-pre-wrap">
                    {generatedCampaign.campaign_data.strategy_summary}
                  </div>
                </div>
              )}

              {/* Timeline */}
              {generatedCampaign?.campaign_data?.timeline && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Timeline & Phases</h4>
                  <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded-md whitespace-pre-wrap">
                    {generatedCampaign.campaign_data.timeline}
                  </div>
                </div>
              )}

              {/* Recommended Channels */}
              {generatedCampaign?.campaign_data?.channels && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Recommended Channels</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(generatedCampaign?.campaign_data?.channels || {})
                      .filter(([_, enabled]) => enabled)
                      .map(([channel, _]) => {
                        const channelInfo = AVAILABLE_CHANNELS.find(c => c.key === channel);
                        const rationale = generatedCampaign?.campaign_data?.channels_rationale?.[channel];
                        return (
                          <div key={channel} className="bg-blue-50 p-3 rounded-md">
                            <div className="flex items-center mb-1">
                              <span className="text-lg mr-2">{channelInfo?.icon}</span>
                              <span className="font-medium text-blue-900">{channelInfo?.label || channel}</span>
                            </div>
                            {rationale && (
                              <p className="text-xs text-blue-700">{rationale}</p>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Target Audience */}
              {generatedCampaign?.campaign_data?.target_audience && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Target Audience</h4>
                  <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded-md whitespace-pre-wrap">
                    {generatedCampaign?.campaign_data?.target_audience}
                  </div>
                </div>
              )}

              {/* Sales Funnel */}
              {generatedCampaign?.campaign_data?.sales_funnel_steps && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Sales Funnel Steps</h4>
                  <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded-md whitespace-pre-wrap">
                    {generatedCampaign?.campaign_data?.sales_funnel_steps}
                  </div>
                </div>
              )}

              {/* Budget Recommendation */}
              {generatedCampaign?.campaign_data?.recommended_budget && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Budget Recommendation</h4>
                  <div className="flex items-center bg-green-50 p-4 rounded-md">
                    <DollarSign className="h-5 w-5 text-green-600 mr-2" />
                    <span className="text-lg font-semibold text-green-800">
                      ${generatedCampaign?.campaign_data?.recommended_budget?.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              {/* Risks & Recommendations */}
              {generatedCampaign?.campaign_data?.risks_recommendations && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Risks & Recommendations</h4>
                  <div className="text-sm text-gray-600 bg-yellow-50 p-4 rounded-md whitespace-pre-wrap">
                    {generatedCampaign?.campaign_data?.risks_recommendations}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-8 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowGeneratedResult(false);
                  setShowGenerationForm(true);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Regenerate
              </button>
              <button
                onClick={handleSaveCampaign}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <Save className="h-4 w-4 mr-2" />
                Accept & Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampaignsComponent;