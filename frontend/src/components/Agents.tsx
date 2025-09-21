import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Search,
  Bot,
  Zap,
  FileText,
  Activity,
  X,
  Play,
  Sparkles,
  ArrowRight,
  Loader2,
  CheckCircle
} from 'lucide-react';
import { getAgents, executeAgent, checkAnalysisStatus, createBusinessProfile, getCreditBalance } from '../services/api';
import BusinessForm from './BusinessForm';
import { BusinessProfile, BusinessProfileApi, UserCredit } from '../types';
import ToolCostBadge from './ToolCostBadge';
import { dispatchCreditUpdate } from '../utils/creditEvents';


interface Agent {
  id: string;
  name: string;
  slug: string;
  description: string;
  tools: Array<{
    name: string;
    slug: string;
  }>;
}

interface AgentsProps {
  authToken: string;
  onTokenRefreshed?: (newToken: string) => void;
  onNavigateToBusinessProfiles?: () => void;
  onProfileCreated?: () => Promise<void>;
  onProfilesChanged?: () => void;
}

const Agents: React.FC<AgentsProps> = ({
  authToken,
  onTokenRefreshed,
  onNavigateToBusinessProfiles,
  onProfileCreated,
  onProfilesChanged
}) => {
  const { t } = useTranslation();

  const [agents, setAgents] = useState<Agent[]>([]);
  const [filteredAgents, setFilteredAgents] = useState<Agent[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  // Agent execution state
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionError, setExecutionError] = useState('');
  
  // Business form state
  const [showBusinessForm, setShowBusinessForm] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const [openaiResponseId, setOpenaiResponseId] = useState<string | null>(null);
  
  // Credits state
  const [userCredits, setUserCredits] = useState<UserCredit | null>(null);
  const [, setIsLoadingCredits] = useState(false);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  // Helper function to show notifications
  const showNotification = (message: string, type: 'success' | 'error') => {
    const notificationDiv = document.createElement('div');
    notificationDiv.className = `fixed top-4 right-4 px-6 py-4 rounded-xl shadow-lg z-50 animate-slide-up ${
      type === 'success'
        ? 'bg-green-500 text-white'
        : 'bg-red-500 text-white'
    }`;
    notificationDiv.innerHTML = `
      <div class="flex items-center space-x-2">
        <div class="w-5 h-5">${type === 'success' ? '✓' : '⚠'}</div>
        <span>${message}</span>
      </div>
    `;
    document.body.appendChild(notificationDiv);
    setTimeout(() => notificationDiv.remove(), 5000);
  };

  // Filter agents based on search query
  const filteredAgentsMemo = useMemo(() => {
    if (!debouncedSearchQuery.trim()) {
      return agents;
    }

    const query = debouncedSearchQuery.toLowerCase();
    return agents.filter(agent =>
      agent.name?.toLowerCase().includes(query) ||
      agent.description?.toLowerCase().includes(query) ||
      agent.slug?.toLowerCase().includes(query)
    );
  }, [agents, debouncedSearchQuery]);

  useEffect(() => {
    setFilteredAgents(filteredAgentsMemo);
  }, [filteredAgentsMemo]);

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

  const fetchAgents = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await getAgents(authToken);

      if (result.success && result.data) {
        setAgents(result.data);
      } else {
        console.error('Error fetching agents:', result.error);
      }
    } catch (error) {
      console.error('Error fetching agents:', error);
    } finally {
      setIsLoading(false);
    }
  }, [authToken]);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  // Fetch user credits
  const fetchCredits = useCallback(async () => {
    try {
      setIsLoadingCredits(true);
      const result = await getCreditBalance();

      if (result.success && result.data) {
        setUserCredits(result.data);
      } else {
        console.error('Error fetching credits:', result.error);
      }
    } catch (error) {
      console.error('Error fetching credits:', error);
    } finally {
      setIsLoadingCredits(false);
    }
  }, []);

  useEffect(() => {
    fetchCredits();
  }, [fetchCredits]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  const handleUseAgent = useCallback((agent: Agent) => {
    setSelectedAgent(agent);
    setShowAgentModal(true);
    setWebsiteUrl('');
    setExecutionError('');
  }, []);

  const startPolling = useCallback((responseId: string) => {
    // Don't start if already polling for the same response ID
    if (isPolling && openaiResponseId === responseId) {
      return;
    }

    // Clear any existing polling first
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }

    setIsPolling(true);
    setOpenaiResponseId(responseId);

    const interval = setInterval(async () => {
      try {
        const statusResult = await checkAnalysisStatus(responseId);

        if (statusResult.status === 'completed' && statusResult.data) {
          // Analysis completed successfully
          setAnalysisResult(statusResult.data);
          setShowBusinessForm(true);
          setShowAgentModal(false);
          setIsPolling(false);
          setOpenaiResponseId(null);
          clearInterval(interval);
          setPollingInterval(null);

          // Refresh credits and dispatch event for real-time updates
          fetchCredits();
          if (userCredits) {
            dispatchCreditUpdate({
              userId: 'current-user',
              newBalance: userCredits.balance,
              toolSlug: selectedAgent?.slug
            });
          }
        } else if (statusResult.status === 'failed' || statusResult.status === 'error') {
          // Analysis failed
          setExecutionError(statusResult.error || 'Analysis failed');
          setIsPolling(false);
          setOpenaiResponseId(null);
          clearInterval(interval);
          setPollingInterval(null);
        } else {
          // Still processing
        }
        // Continue polling for 'pending', 'queued', 'in_progress' statuses
      } catch (error) {
        console.error('Polling error:', error);
        setExecutionError('Failed to check analysis status');
        setIsPolling(false);
        setOpenaiResponseId(null);
        clearInterval(interval);
        setPollingInterval(null);
      }
    }, 2000); // Poll every 2 seconds

    setPollingInterval(interval);
  }, [fetchCredits, userCredits, selectedAgent, isPolling, openaiResponseId, pollingInterval]);

  const handleExecuteAgent = useCallback(async () => {
    if (!selectedAgent || !websiteUrl.trim()) return;

    setIsExecuting(true);
    setExecutionError('');

    try {
      // Validate and normalize URL format
      let normalizedUrl = websiteUrl.trim();
      
      // Add https:// if no protocol is specified
      if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
        normalizedUrl = 'https://' + normalizedUrl;
      }
      
      // Validate the normalized URL
      try {
        new URL(normalizedUrl);
      } catch {
        setExecutionError(t('agents.invalidUrl', 'Nieprawidłowy format URL'));
        setIsExecuting(false);
        return;
      }

      const result = await executeAgent(selectedAgent.slug, 'analyze-website', {
        input: {
          url: normalizedUrl
        },
        context: {
          source: 'agents_view'
        },
        background: true
      }, authToken);



      if (result.success && result.data) {
        // Refresh credits after successful execution start
        fetchCredits();

        // Check if this is a background response
        if (result.data.data && result.data.data.openai_response_id) {
          // Start polling for status
          startPolling(result.data.data.openai_response_id);
        } else if (result.data.status === 'completed' && result.data.data) {
          // Direct completion (fallback for non-background mode)
          setAnalysisResult(result.data.data);
          setShowBusinessForm(true);
          setShowAgentModal(false);
        } else {
          setExecutionError('Unexpected response format');
        }
      } else {
        // Check for credit errors by error message pattern
        if (result.error && result.error.includes('INSUFFICIENT_CREDITS')) {
          // This is a credit error - show special message
          setExecutionError(`${result.error} - Please upgrade your subscription to continue using AI tools.`);
          // Refresh credits to show current balance
          fetchCredits();
        } else {
          setExecutionError(result.error || t('agents.executionFailed', 'Wykonanie agenta nie powiodło się'));
        }
      }
    } catch (error) {
      console.error('Agent execution error:', error);
      setExecutionError(t('agents.executionFailed', 'Wykonanie agenta nie powiodło się'));
    } finally {
      setIsExecuting(false);
    }
  }, [selectedAgent, websiteUrl, authToken, t, fetchCredits, startPolling]);

  const handleCloseModal = useCallback(() => {
    setShowAgentModal(false);
    setSelectedAgent(null);
    setWebsiteUrl('');
    setExecutionError('');
    // Clear polling if active
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
    setIsPolling(false);
    setOpenaiResponseId(null);
  }, [pollingInterval]); // Need pollingInterval to clear it


  const handleUrlChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setWebsiteUrl(e.target.value);
  }, []);

  const handleBusinessFormAccept = useCallback(async (profileData: BusinessProfile) => {
    try {
      // Convert the form data to the expected API format
      // Map frontend field names to backend database field names
      const apiProfileData: BusinessProfileApi = {
        name: profileData.company_name, // company_name -> name
        website_url: profileData.website_url,
        offer_description: profileData.offer, // offer -> offer_description
        target_customer: profileData.target_customer,
        problem_solved: profileData.problems, // problems -> problem_solved
        customer_desires: profileData.desires, // desires -> customer_desires
        brand_tone: profileData.tone, // tone -> brand_tone
        communication_language: profileData.language, // language -> communication_language
        is_active: true // Make this the active profile
      };

      const result = await createBusinessProfile(apiProfileData, authToken);


      if (result.success) {
        // Show success notification
        showNotification('Profil biznesowy został pomyślnie utworzony!', 'success');

        // Refresh business profiles in dashboard header
        if (onProfileCreated) {
          await onProfileCreated();
        }

        // Notify other components that profiles have changed
        if (onProfilesChanged) {
          onProfilesChanged();
        }

        // Close modal and navigate to business profiles
        setShowBusinessForm(false);
        setAnalysisResult(null);
        if (onNavigateToBusinessProfiles) {
          onNavigateToBusinessProfiles();
        }
      } else {
        console.error('Failed to create business profile:', result.error);
        showNotification(result.error || 'Nie udało się utworzyć profilu biznesowego. Spróbuj ponownie.', 'error');
      }
    } catch (error) {
      console.error('Error creating business profile:', error);
      showNotification(
        error instanceof Error ? error.message : 'Wystąpił błąd podczas tworzenia profilu biznesowego.',
        'error'
      );
    }
  }, [authToken, onNavigateToBusinessProfiles, onProfileCreated, onProfilesChanged]);

  const handleBusinessFormReanalyze = useCallback(() => {
    setShowBusinessForm(false);
    setShowAgentModal(true);
  }, []);

  const handleCloseBusinessForm = useCallback(() => {
    setShowBusinessForm(false);
    setAnalysisResult(null);
  }, []);

  const truncateText = (text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Skeleton loader component
  const AgentCardSkeleton = () => (
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

  // Agent execution modal JSX (not a component to prevent re-render issues)
  const agentExecutionModal = showAgentModal && selectedAgent && (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {t('agents.useAgent', 'Użyj Agenta')}: {selectedAgent?.name}
              </h2>
              <p className="text-gray-600 mt-1">
                {selectedAgent?.description}
              </p>
            </div>
          </div>
          <button
            onClick={handleCloseModal}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              {t('agents.websiteUrl', 'Adres strony internetowej')} *
            </label>
            <input
              type="text"
              value={websiteUrl}
              onChange={handleUrlChange}
              placeholder="www.twojastrona.pl"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-all"
              autoComplete="off"
              autoFocus
            />
            <p className="text-xs text-gray-500 mt-2">
              {t('agents.websiteUrlDescription', 'Agent przeanalizuje tę stronę i utworzy profil biznesowy')}
            </p>
          </div>

          {executionError && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-700 text-sm">{executionError}</p>
            </div>
          )}

          {isPolling && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                <div>
                  <div className="font-medium text-blue-900">
                    {t('agents.analyzing', 'Analizowanie strony...')}
                  </div>
                  <div className="text-blue-700 text-sm">
                    {t('agents.analysisInProgress', 'Proszę czekać, analiza jest w toku')}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-4 p-6 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={handleCloseModal}
            className="px-6 py-3 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 font-medium rounded-xl transition-colors"
          >
            {t('agents.cancel', 'Anuluj')}
          </button>
          <button
            onClick={handleExecuteAgent}
            disabled={!websiteUrl.trim() || isExecuting || isPolling}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isExecuting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t('agents.analyzing', 'Analizowanie...')}
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                {t('agents.startAnalysis', 'Rozpocznij Analizę')}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

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
          {/* Header Section - Title and Available Count */}
          <div className="flex justify-between items-center mb-8">
            {/* Left - Title and Icon */}
            <div className="flex items-center gap-4">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-black text-gray-900 tracking-tight">
                  {t('agents.title', 'AI Agenci')}
                </h1>
                <p className="text-lg text-gray-600 font-medium mt-1">
                  {t('agents.subtitle', 'Wybierz agenta, aby przeanalizować swoją stronę internetową i automatycznie utworzyć profil biznesowy')}
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
                  <p className="text-lg font-bold text-gray-900">
                    {isLoading ? (
                      <span className="inline-block w-8 h-5 bg-gray-200 rounded animate-pulse"></span>
                    ) : (
                      `${filteredAgents.length}`
                    )}
                  </p>
                  <p className="text-xs text-gray-500">{t('agents.available', 'Dostępnych agentów')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Search Section */}
          <div className="flex justify-between items-center gap-4 mb-2">
            {/* Search Input */}
            <div className="flex-1 max-w-md">
              <div className="relative bg-white/90 backdrop-blur-sm rounded-xl border border-gray-200/60 shadow-lg">
                <div className="relative">
                  <Search className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder={t('agents.search.placeholder', 'Szukaj agentów...')}
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="w-full pl-12 pr-12 py-3 bg-transparent border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500 font-medium rounded-xl"
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

            {/* Right - Empty for consistent spacing */}
            <div></div>
          </div>

          {/* Search feedback */}
          <div className="min-h-[20px] mb-2">
            {searchQuery && !debouncedSearchQuery && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                <span>{t('agents.searching', 'Szukam...')}</span>
              </div>
            )}

            {debouncedSearchQuery && filteredAgents.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-emerald-600">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                <span className="font-medium">
                  {t('agents.searchResults', 'Znaleziono {{count}} {{type}}', {
                    count: filteredAgents.length,
                    type: filteredAgents.length === 1 ? 'agenta' : 'agentów'
                  })}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <>
        {isLoading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {[...Array(4)].map((_, index) => (
              <AgentCardSkeleton key={index} />
            ))}
          </div>
        )}


        {!isLoading && filteredAgents.length === 0 && (
          <div className="text-center py-16">
            <div className="relative inline-block">
              <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-6 transform rotate-3">
                <Bot className="w-12 h-12 text-gray-400" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <Search className="w-4 h-4 text-white" />
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {searchQuery 
                  ? t('agents.noSearchResults', 'Nie znaleziono agentów')
                  : t('agents.noAgents', 'Brak dostępnych agentów')
                }
              </h3>
              <p className="text-gray-600 mb-8 leading-relaxed">
                {searchQuery
                  ? t('agents.tryDifferentSearch', 'Spróbuj dostosować swoje wyszukiwanie')
                  : t('agents.noAgentsDescription', 'Aktualnie nie ma dostępnych agentów AI')
                }
              </p>
            </div>
          </div>
        )}

        {!isLoading && filteredAgents.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {filteredAgents.map((agent) => (
              <div
                key={agent.id}
                className="group relative bg-white rounded-2xl border border-gray-200/60 p-8 hover:shadow-2xl hover:shadow-blue-500/10 hover:border-blue-300/50 transition-all duration-500 cursor-pointer overflow-hidden"
              >
                {/* Background Effects */}
                <div className="absolute inset-0 bg-gradient-to-br from-white via-blue-50/30 to-purple-50/20 opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                <div className="absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-500"></div>

                <div className="relative">
                  {/* Agent Header */}
                  <div className="flex items-start gap-4 mb-6">
                    <div className="relative">
                      <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-lg flex items-center justify-center group-hover:shadow-xl group-hover:scale-105 transition-all duration-300">
                        <Bot className="w-8 h-8 text-white" />
                      </div>
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <Zap className="w-3 h-3 text-white" />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-700 transition-colors">
                        {debouncedSearchQuery
                          ? highlightSearchTerm(agent.name, debouncedSearchQuery)
                          : agent.name
                        }
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Activity className="w-4 h-4" />
                        <span>{agent.tools.length} {t('agents.tools', 'narzędzi')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Agent Description */}
                  <div className="mb-8">
                    <div className="bg-gray-50/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-100 group-hover:bg-blue-50/50 group-hover:border-blue-200/50 transition-all duration-300">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-white rounded-xl shadow-sm group-hover:shadow-md transition-all duration-300">
                          <FileText className="w-5 h-5 text-gray-600 group-hover:text-blue-600 transition-colors" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold text-gray-800 mb-2 uppercase tracking-wide">
                            {t('agents.description', 'Opis')}
                          </h4>
                          <p className="text-gray-700 leading-relaxed group-hover:text-gray-800 transition-colors">
                            {debouncedSearchQuery
                              ? highlightSearchTerm(truncateText(agent.description, 120), debouncedSearchQuery)
                              : truncateText(agent.description, 120)
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Agent Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200/60 group-hover:border-blue-200/60 transition-all duration-300">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Sparkles className="w-4 h-4" />
                        <span>{t('agents.aiPowered', 'Zasilany AI')}</span>
                      </div>
                      {/* Show cost for main tool (assume analyze-website for business-concierge) */}
                      {agent.slug === 'business-concierge' && (
                        <ToolCostBadge 
                          toolSlug="analyze-website" 
                          userBalance={userCredits?.balance}
                          compact={true}
                        />
                      )}
                    </div>

                    <button
                      onClick={() => handleUseAgent(agent)}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium text-sm rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl"
                    >
                      <Play className="w-4 h-4" />
                      <span>{t('agents.useAgent', 'Użyj Agenta')}</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </>

      {/* Agent Execution Modal */}
      {agentExecutionModal}

      {/* Business Profile Modal */}
      {showBusinessForm && analysisResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-r from-green-600 to-blue-600 rounded-xl">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {t('businessProfile.modalTitle', 'Przejrzyj Profil Biznesowy')}
                  </h2>
                  <p className="text-gray-600">
                    {t('businessProfile.modalSubtitle', 'Agent przeanalizował Twoją stronę i utworzył profil biznesowy')}
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseBusinessForm}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Form Content */}
            <div className="flex-1 p-0 overflow-y-auto min-h-0">
              <BusinessForm
                initialData={analysisResult}
                onReanalyze={handleBusinessFormReanalyze}
                onAcceptProfile={handleBusinessFormAccept}
                isAgentAnalysis={true}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Agents;
