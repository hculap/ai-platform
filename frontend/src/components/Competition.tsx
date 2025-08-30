import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Search,
  Plus,
  Edit,
  Globe,
  FileText,
  Trash2,
  X,
  Target,
  Award,
  Calendar,
  Brain,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  Eye,
  Save
} from 'lucide-react';
import { 
  getCompetitions, 
  deleteCompetition, 
  createCompetition, 
  updateCompetition, 
  executeAgent, 
  startBackgroundCompetitorResearch,
  checkCompetitorResearchStatus,
  enrichCompetitor,
  type Competition 
} from '../services/api';
import CompetitionForm from './CompetitionForm';

interface CompetitionProps {
  businessProfileId?: string;
  authToken: string;
  onTokenRefreshed?: (newToken: string) => void;
  onCompetitionsChanged?: () => void;
}

const CompetitionComponent: React.FC<CompetitionProps> = ({
  businessProfileId,
  authToken,
  onTokenRefreshed,
  onCompetitionsChanged
}) => {
  const { t } = useTranslation();

  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [filteredCompetitions, setFilteredCompetitions] = useState<Competition[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showCompetitionForm, setShowCompetitionForm] = useState(false);
  const [editingCompetition, setEditingCompetition] = useState<Competition | null>(null);

  // AI Competitor Research states
  const [showAIRearchModal, setShowAIRearchModal] = useState(false);
  const [isAIRearchLoading, setIsAIRearchLoading] = useState(false);
  const [aiResearchError, setAiResearchError] = useState<string | null>(null);
  const [aiResearchSuccess, setAiResearchSuccess] = useState<string | null>(null);
  const [foundCompetitors, setFoundCompetitors] = useState<any[]>([]);
  const [researchStatus, setResearchStatus] = useState<'idle' | 'starting' | 'pending' | 'queued' | 'in_progress' | 'completed' | 'failed'>('idle');
  const [openaiResponseId, setOpenaiResponseId] = useState<string | null>(null);
  const [selectedCompetitors, setSelectedCompetitors] = useState<Set<string>>(new Set());

  // Quick Add states
  const [quickAddInput, setQuickAddInput] = useState('');
  const [isEnriching, setIsEnriching] = useState(false);
  const [enrichError, setEnrichError] = useState<string | null>(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Filter competitions based on search query
  const filteredCompetitionsMemo = useMemo(() => {
    if (!debouncedSearchQuery.trim()) {
      return competitions;
    }

    const query = debouncedSearchQuery.toLowerCase();
    return competitions.filter(competition =>
      competition.name?.toLowerCase().includes(query) ||
      competition.description?.toLowerCase().includes(query) ||
      competition.usp?.toLowerCase().includes(query) ||
      competition.url?.toLowerCase().includes(query)
    );
  }, [competitions, debouncedSearchQuery]);

  useEffect(() => {
    setFilteredCompetitions(filteredCompetitionsMemo);
  }, [filteredCompetitionsMemo]);

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

  const fetchCompetitions = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await getCompetitions(authToken, businessProfileId);

      if (result.success && result.data) {
        setCompetitions(result.data);
      }
    } catch (error) {
      console.error('Error fetching competitions:', error);
    } finally {
      setIsLoading(false);
    }
  }, [authToken, businessProfileId]);

  useEffect(() => {
    fetchCompetitions();
  }, [fetchCompetitions]);

  // Polling for competitor research status
  useEffect(() => {
    if (!openaiResponseId || researchStatus === 'completed' || researchStatus === 'failed') {
      return;
    }

    const pollStatus = async () => {
      try {
        const statusResult = await checkCompetitorResearchStatus(openaiResponseId, authToken);
        
        handleStatusResult(statusResult);
      } catch (error) {
        console.error('Error polling research status:', error);
        setResearchStatus('failed');
        setAiResearchError('Failed to check research status');
      }
    };

    const handleStatusResult = (statusResult: any) => {
      if (statusResult.status === 'completed' && statusResult.data) {
        setResearchStatus('completed');
        setFoundCompetitors(Array.isArray(statusResult.data) ? statusResult.data : []);
        setAiResearchSuccess(t('competitions.aiResearch.foundPotentialCompetitors', { count: Array.isArray(statusResult.data) ? statusResult.data.length : 0 }));
      } else if (statusResult.status === 'failed' || statusResult.status === 'error') {
        setResearchStatus('failed');
        setAiResearchError(statusResult.error || t('competitions.aiResearch.researchFailed'));
      } else {
        setResearchStatus(statusResult.status);
        // Update status message based on current status
        if (statusResult.status === 'in_progress') {
          setAiResearchSuccess(t('competitions.aiResearch.aiAnalyzing'));
        } else if (statusResult.status === 'queued') {
          setAiResearchSuccess(t('competitions.aiResearch.requestQueued'));
        }
      }
    };

    // Poll every 3 seconds when research is in progress
    const interval = setInterval(pollStatus, 3000);

    return () => clearInterval(interval);
  }, [openaiResponseId, researchStatus, authToken, onTokenRefreshed, t]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  const handleAddCompetition = useCallback(() => {
    setEditingCompetition(null);
    setShowCompetitionForm(true);
  }, []);

  const handleEnrichCompetitor = useCallback(async () => {
    if (!quickAddInput.trim()) {
      setEnrichError('Please enter a company name or URL');
      return;
    }

    setIsEnriching(true);
    setEnrichError(null);

    try {
      // Determine if input is a URL or company name
      const isUrl = quickAddInput.trim().match(/^https?:\/\/.+/i);
      const input = isUrl 
        ? { url: quickAddInput.trim() }
        : { name: quickAddInput.trim() };

      const result = await enrichCompetitor(input, authToken);

      if (result.success && result.data) {
        // Set the enriched data as editing competition and open the form
        setEditingCompetition(result.data);
        setShowCompetitionForm(true);
        setQuickAddInput(''); // Clear the input
      } else {
        setEnrichError(result.error || 'Failed to enrich competitor data');
      }

      // Handle token refresh if needed
      if (result.isTokenExpired && onTokenRefreshed) {
        // This will be handled by the API function automatically
      }
    } catch (error: any) {
      console.error('Error enriching competitor:', error);
      setEnrichError('Failed to enrich competitor data');
    } finally {
      setIsEnriching(false);
    }
  }, [quickAddInput, authToken, onTokenRefreshed]);

  const handleFindCompetitorsWithAI = useCallback(() => {
    setShowAIRearchModal(true);
    setAiResearchError(null);
    setAiResearchSuccess(null);
    setFoundCompetitors([]);
  }, []);

  const handleCloseAIRearchModal = useCallback(() => {
    setShowAIRearchModal(false);
    setAiResearchError(null);
    setAiResearchSuccess(null);
    setFoundCompetitors([]);
    setResearchStatus('idle');
    setOpenaiResponseId(null);
    setSelectedCompetitors(new Set());
  }, []);

  const handleEditCompetition = useCallback((competition: Competition) => {
    setEditingCompetition(competition);
    setShowCompetitionForm(true);
  }, []);

  const handleDeleteCompetition = useCallback(async (competitionId: string) => {
    try {
      const result = await deleteCompetition(competitionId, authToken);


      if (result.success) {
        setCompetitions(prev => prev.filter(c => c.id !== competitionId));
        if (onCompetitionsChanged) onCompetitionsChanged();
      } else {
        console.error('Failed to delete competition:', result.error);
      }
    } catch (error) {
      console.error('Error deleting competition:', error);
    } finally {
      setShowDeleteConfirm(null);
    }
  }, [authToken, onTokenRefreshed, onCompetitionsChanged]);

  const handleCompetitionFormSubmit = useCallback(async (competitionData: Omit<Competition, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      if (!businessProfileId) {
        console.error('Business profile ID is required');
        alert('Please select a business profile first before adding competitions.');
        return;
      }

      let result;
      if (editingCompetition && editingCompetition.id) {
        // Update existing competition
        result = await updateCompetition(editingCompetition.id, competitionData, authToken);
      } else {
        // Create new competition
        result = await createCompetition(businessProfileId, competitionData, authToken);
      }


      if (result.success) {
        setShowCompetitionForm(false);
        setEditingCompetition(null);
        // Refresh the competitions list
        fetchCompetitions();
        if (onCompetitionsChanged) onCompetitionsChanged();
      } else {
        console.error('Failed to save competition:', result.error);
      }
    } catch (error) {
      console.error('Error saving competition:', error);
    }
  }, [businessProfileId, editingCompetition, authToken, onTokenRefreshed, onCompetitionsChanged, fetchCompetitions]);

  const handleCancelForm = useCallback(() => {
    setShowCompetitionForm(false);
    setEditingCompetition(null);
  }, []);

  const handleExecuteAIRearch = useCallback(async () => {
    if (!businessProfileId) {
      setAiResearchError('Business profile ID is required');
      return;
    }

    try {
      setIsAIRearchLoading(true);
      setResearchStatus('starting');
      setAiResearchError(null);
      setAiResearchSuccess(null);
      setFoundCompetitors([]);

      const result = await startBackgroundCompetitorResearch(businessProfileId, authToken);

      if (result.success && result.openaiResponseId) {
        setOpenaiResponseId(result.openaiResponseId);
        setResearchStatus('pending');
        setAiResearchSuccess('Competitor research started in background...');
      } else {
        setResearchStatus('failed');
        setAiResearchError(result.error || 'Failed to start competitor research');
      }
    } catch (error) {
      console.error('Error starting competitor research:', error);
      setResearchStatus('failed');
      setAiResearchError('An unexpected error occurred while starting competitor research');
    } finally {
      setIsAIRearchLoading(false);
    }
  }, [businessProfileId, authToken, onTokenRefreshed]);

  const handleCompetitorSelect = useCallback((competitorName: string, isSelected: boolean) => {
    setSelectedCompetitors(prev => {
      const newSet = new Set(prev);
      if (isSelected) {
        newSet.add(competitorName);
      } else {
        newSet.delete(competitorName);
      }
      return newSet;
    });
  }, []);

  const handleSaveSelectedCompetitors = useCallback(async () => {
    if (selectedCompetitors.size === 0) {
      alert(t('competitions.aiResearch.selectAtLeastOne'));
      return;
    }

    try {
      setIsAIRearchLoading(true);
      const competitorsToSave = foundCompetitors.filter(competitor => 
        selectedCompetitors.has(competitor.name)
      );

      let savedCount = 0;
      let errorCount = 0;

      for (const competitor of competitorsToSave) {
        try {
          // Convert AI competitor format to our Competition format
          const competitionData = {
            name: competitor.name,
            url: competitor.url,
            description: competitor.description || '',
            usp: competitor.usp || ''
          };

          const result = await createCompetition(businessProfileId!, competitionData, authToken);

          if (result.success) {
            savedCount++;
          } else {
            console.error('Failed to add competitor:', result.error);
            errorCount++;
          }
        } catch (error) {
          console.error('Error adding competitor:', error);
          errorCount++;
        }
      }

      // Update UI based on results
      if (savedCount > 0) {
        setAiResearchSuccess(t('competitions.aiResearch.savedSuccessfully', { count: savedCount }));
        // Remove saved competitors from the found list
        setFoundCompetitors(prev => prev.filter(competitor => 
          !selectedCompetitors.has(competitor.name)
        ));
        setSelectedCompetitors(new Set());
        // Refresh competitions list
        fetchCompetitions();
        if (onCompetitionsChanged) onCompetitionsChanged();
      }

      if (errorCount > 0) {
        setAiResearchError(`Failed to save ${errorCount} competitor(s). Please try again.`);
      }
    } catch (error) {
      console.error('Error saving competitors:', error);
      setAiResearchError('An error occurred while saving competitors');
    } finally {
      setIsAIRearchLoading(false);
    }
  }, [selectedCompetitors, foundCompetitors, businessProfileId, authToken, onTokenRefreshed, onCompetitionsChanged, fetchCompetitions, t]);

  const truncateText = (text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Skeleton loader component
  const CompetitionCardSkeleton = () => (
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

  // Early return if no business profile is selected
  if (!businessProfileId) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Globe className="w-16 h-16 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {t('competitions.noBusinessProfile.title', 'Wybierz profil biznesowy')}
            </h3>
            <p className="text-gray-600">
              {t('competitions.noBusinessProfile.description', 'Aby zarządzać konkurentami, najpierw wybierz profil biznesowy.')}
            </p>
          </div>
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
                  {t('competitions.title', 'Konkurencja')}
                </h1>
                <p className="text-lg text-gray-600 font-medium mt-1">
                  {t('competitions.subtitle', 'Zarządzaj swoją konkurencją i analizuj rynek')}
                </p>
              </div>
            </div>

            {/* Right - Available Count */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl px-4 py-3 border border-gray-200/60 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg">
                  <Award className="w-4 h-4 text-white" />
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">
                    {isLoading ? (
                      <span className="inline-block w-8 h-5 bg-gray-200 rounded animate-pulse"></span>
                    ) : (
                      `${filteredCompetitions.length}`
                    )}
                  </p>
                  <p className="text-xs text-gray-500">{t('competitions.available', 'Dostępnych konkurentów')}</p>
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
                    placeholder={t('competitions.search.placeholder', 'Szukaj konkurentów...')}
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

            {/* Right - Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleFindCompetitorsWithAI}
                className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
              >
                <Brain className="w-5 h-5" />
                <span>{t('competitions.findWithAI', 'Znajdź z AI')}</span>
              </button>
              <button
                onClick={handleAddCompetition}
                className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
              >
                <Plus className="w-5 h-5" />
                <span>{t('competitions.addNew', 'Dodaj Konkurenta')}</span>
              </button>
            </div>
          </div>

          {/* Quick Add Competitor Section */}
          <div className="bg-white/70 backdrop-blur-sm rounded-xl border border-gray-200/60 p-4 mb-4 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="relative">
                  <input
                    type="text"
                    placeholder={t('competitions.quickAdd.placeholder', 'Wprowadź nazwę firmy lub URL strony...')}
                    value={quickAddInput}
                    onChange={(e) => {
                      setQuickAddInput(e.target.value);
                      if (enrichError) setEnrichError(null);
                    }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !isEnriching) {
                        handleEnrichCompetitor();
                      }
                    }}
                    disabled={isEnriching}
                    className="w-full pl-4 pr-4 py-3 bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 font-medium rounded-lg disabled:bg-gray-50 disabled:cursor-not-allowed"
                  />
                </div>
                {enrichError && (
                  <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {enrichError}
                  </p>
                )}
              </div>
              <button
                onClick={handleEnrichCompetitor}
                disabled={isEnriching || !quickAddInput.trim()}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-semibold rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 disabled:transform-none disabled:shadow-md"
              >
                {isEnriching ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>{t('competitions.quickAdd.enriching', 'Wzbogacanie...')}</span>
                  </>
                ) : (
                  <>
                    <Brain className="w-5 h-5" />
                    <span>{t('competitions.quickAdd.enrich', 'Wzbogać')}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Search feedback */}
          <div className="min-h-[20px] mb-2">
            {searchQuery && !debouncedSearchQuery && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                <span>{t('competitions.searching', 'Szukam...')}</span>
              </div>
            )}

            {debouncedSearchQuery && filteredCompetitions.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-emerald-600">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                <span className="font-medium">
                  {t('competitions.searchResults', 'Znaleziono {{count}} {{type}}', {
                    count: filteredCompetitions.length,
                    type: filteredCompetitions.length === 1 ? 'konkurenta' : 'konkurentów'
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
              <CompetitionCardSkeleton key={index} />
            ))}
          </div>
        )}

        {!isLoading && filteredCompetitions.length === 0 && (
          <div className="text-center py-16">
            <div className="relative inline-block">
              <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-6 transform rotate-3">
                <Target className="w-12 h-12 text-gray-400" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <Search className="w-4 h-4 text-white" />
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {searchQuery
                  ? t('competitions.noSearchResults', 'Nie znaleziono konkurentów')
                  : t('competitions.noCompetitions', 'Brak konkurentów')
                }
              </h3>
              <p className="text-gray-600 mb-8 leading-relaxed">
                {searchQuery
                  ? t('competitions.tryDifferentSearch', 'Spróbuj dostosować swoje wyszukiwanie')
                  : t('competitions.addFirst', 'Dodaj swojego pierwszego konkurenta, aby rozpocząć analizę rynku')
                }
              </p>
              {!searchQuery && (
                <button
                  onClick={handleAddCompetition}
                  className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                >
                  <Plus className="w-5 h-5" />
                  <span>{t('competitions.createFirst', 'Utwórz Pierwszego Konkurenta')}</span>
                </button>
              )}
            </div>
          </div>
        )}

        {!isLoading && filteredCompetitions.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {filteredCompetitions.map((competition) => (
              <div
                key={competition.id}
                className="group relative bg-white rounded-2xl border border-gray-200/60 p-8 hover:shadow-2xl hover:shadow-blue-500/10 hover:border-blue-300/50 transition-all duration-500 overflow-hidden"
              >
                {/* Background Effects */}
                <div className="absolute inset-0 bg-gradient-to-br from-white via-blue-50/30 to-purple-50/20 opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                <div className="absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-500"></div>

                <div className="relative">
                  {/* Competition Header */}
                  <div className="flex items-start gap-4 mb-6">
                    <div className="relative">
                      <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-lg flex items-center justify-center group-hover:shadow-xl group-hover:scale-105 transition-all duration-300">
                        <Target className="w-8 h-8 text-white" />
                      </div>
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <Award className="w-3 h-3 text-white" />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-700 transition-colors">
                        {debouncedSearchQuery
                          ? highlightSearchTerm(competition.name, debouncedSearchQuery)
                          : competition.name
                        }
                      </h3>
                      {competition.url && (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Globe className="w-4 h-4" />
                          <a
                            href={competition.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 truncate"
                          >
                            {competition.url}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Competition Description */}
                  {competition.description && (
                    <div className="mb-8">
                      <div className="bg-gray-50/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-100 group-hover:bg-blue-50/50 group-hover:border-blue-200/50 transition-all duration-300">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-white rounded-xl shadow-sm group-hover:shadow-md transition-all duration-300">
                            <FileText className="w-5 h-5 text-gray-600 group-hover:text-blue-600 transition-colors" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-sm font-semibold text-gray-800 mb-2 uppercase tracking-wide">
                              {t('competitions.description', 'Opis')}
                            </h4>
                            <p className="text-gray-700 leading-relaxed group-hover:text-gray-800 transition-colors">
                              {debouncedSearchQuery
                                ? highlightSearchTerm(truncateText(competition.description, 120), debouncedSearchQuery)
                                : truncateText(competition.description, 120)
                              }
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Competition USP */}
                  {competition.usp && (
                    <div className="mb-8">
                      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 backdrop-blur-sm rounded-2xl p-6 border border-emerald-100 group-hover:from-emerald-100/50 group-hover:to-teal-100/50 group-hover:border-emerald-200/50 transition-all duration-300">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-white rounded-xl shadow-sm group-hover:shadow-md transition-all duration-300">
                            <Award className="w-5 h-5 text-emerald-600 group-hover:text-emerald-700 transition-colors" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-sm font-semibold text-emerald-800 mb-2 uppercase tracking-wide">
                              {t('competitions.usp', 'Unikalna Wartość')}
                            </h4>
                            <p className="text-emerald-700 leading-relaxed group-hover:text-emerald-800 transition-colors">
                              {debouncedSearchQuery
                                ? highlightSearchTerm(truncateText(competition.usp, 120), debouncedSearchQuery)
                                : truncateText(competition.usp, 120)
                              }
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Competition Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200/60 group-hover:border-blue-200/60 transition-all duration-300">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {competition.created_at
                          ? new Date(competition.created_at).toLocaleDateString()
                          : t('competitions.recent', 'Ostatnio')
                        }
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditCompetition(competition)}
                        className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title={t('competitions.edit', 'Edytuj')}
                      >
                        <Edit className="w-4 h-4" />
                        <span className="hidden sm:inline">{t('competitions.edit', 'Edytuj')}</span>
                      </button>
                      <button
                        onClick={() => competition.id && setShowDeleteConfirm(competition.id)}
                        className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title={t('competitions.delete', 'Usuń')}
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="hidden sm:inline">{t('competitions.delete', 'Usuń')}</span>
                      </button>
                    </div>
                  </div>
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
                    {t('competitions.deleteConfirm.title', 'Potwierdź usunięcie')}
                  </h2>
                  <p className="text-gray-600">
                    {t('competitions.deleteConfirm.message', 'Czy na pewno chcesz usunąć tego konkurenta?')}
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
                {t('competitions.cancel', 'Anuluj')}
              </button>
              <button
                onClick={() => handleDeleteCompetition(showDeleteConfirm)}
                className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {t('competitions.delete', 'Usuń')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Competition Form Modal */}
      {showCompetitionForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl">
                  {editingCompetition ? <Edit className="w-6 h-6 text-white" /> : <Plus className="w-6 h-6 text-white" />}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {editingCompetition
                      ? t('competitions.editTitle', 'Edytuj Konkurenta')
                      : t('competitions.createTitle', 'Utwórz Konkurenta')
                    }
                  </h2>
                  <p className="text-gray-600">
                    {editingCompetition
                      ? t('competitions.editSubtitle', 'Zaktualizuj informacje o konkurencie')
                      : t('competitions.createSubtitle', 'Dodaj nowego konkurenta do analizy')
                    }
                  </p>
                </div>
              </div>
              <button
                onClick={handleCancelForm}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="flex-1 p-6 overflow-y-auto">
              <CompetitionForm
                initialData={editingCompetition}
                onSubmit={handleCompetitionFormSubmit}
                onCancel={handleCancelForm}
              />
            </div>
          </div>
        </div>
      )}

      {/* AI Competitor Research Modal */}
      {showAIRearchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {t('competitions.aiResearch.title', 'Badanie Konkurencji z AI')}
                  </h2>
                  <p className="text-gray-600">
                    {t('competitions.aiResearch.subtitle', 'Znajdź nowych konkurentów za pomocą sztucznej inteligencji')}
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseAIRearchModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="p-6">
              {/* Execute Button */}
              <div className="flex justify-center mb-6">
                <button
                  onClick={handleExecuteAIRearch}
                  disabled={isAIRearchLoading || (researchStatus !== 'idle' && researchStatus !== 'completed' && researchStatus !== 'failed')}
                  className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isAIRearchLoading || (researchStatus !== 'idle' && researchStatus !== 'completed' && researchStatus !== 'failed') ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {researchStatus === 'starting' && t('competitions.aiResearch.starting', 'Starting research...')}
                      {researchStatus === 'pending' && t('competitions.aiResearch.pending', 'Queuing request...')}
                      {researchStatus === 'queued' && t('competitions.aiResearch.queued', 'Waiting in queue...')}
                      {researchStatus === 'in_progress' && t('competitions.aiResearch.searching', 'Analyzing business...')}
                    </>
                  ) : (
                    <>
                      <Brain className="w-5 h-5" />
                      {t('competitions.aiResearch.findCompetitors', 'Znajdź Konkurentów')}
                    </>
                  )}
                </button>
              </div>

              {/* Status Messages */}
              {aiResearchError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                    <p className="text-red-800">{aiResearchError}</p>
                  </div>
                </div>
              )}

              {aiResearchSuccess && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <p className="text-green-800">{aiResearchSuccess}</p>
                  </div>
                </div>
              )}

              {/* Found Competitors */}
              {foundCompetitors.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                      <Target className="w-5 h-5 text-purple-600" />
                      {t('competitions.aiResearch.foundCompetitors', 'Znalezieni Konkurenci')} ({foundCompetitors.length})
                    </h3>
                    
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-600">
                        {t('competitions.aiResearch.competitorsSelected', { count: selectedCompetitors.size })}
                      </span>
                      <button
                        onClick={handleSaveSelectedCompetitors}
                        disabled={selectedCompetitors.size === 0 || isAIRearchLoading}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
                      >
                        <Save className="w-4 h-4" />
                        {isAIRearchLoading ? t('competitions.aiResearch.saving') : t('competitions.aiResearch.saveSelectedCount', { count: selectedCompetitors.size })}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                    {foundCompetitors.map((competitor, index) => (
                      <div key={index} className={`bg-gray-50 rounded-lg p-4 border transition-all ${
                        selectedCompetitors.has(competitor.name) 
                          ? 'border-purple-300 bg-purple-50 shadow-md' 
                          : 'border-gray-200 hover:shadow-md'
                      }`}>
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-start gap-3 flex-1">
                            <input
                              type="checkbox"
                              checked={selectedCompetitors.has(competitor.name)}
                              onChange={(e) => handleCompetitorSelect(competitor.name, e.target.checked)}
                              className="mt-1 w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 focus:ring-2"
                            />
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 text-lg">{competitor.name}</h4>
                            </div>
                          </div>
                          <button
                            onClick={() => window.open(competitor.url, '_blank')}
                            className="p-1.5 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                            title="Visit website"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="space-y-2 text-sm ml-7">
                          <div className="flex items-center gap-2">
                            <Globe className="w-4 h-4 text-gray-500" />
                            <a
                              href={competitor.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 truncate"
                            >
                              {competitor.url}
                            </a>
                          </div>

                          {competitor.description && (
                            <p className="text-gray-600">
                              <strong>{t('competitions.aiResearch.description', 'Opis')}:</strong> {truncateText(competitor.description, 100)}
                            </p>
                          )}

                          {competitor.usp && (
                            <p className="text-gray-600">
                              <strong>{t('competitions.aiResearch.usp', 'USP')}:</strong> {truncateText(competitor.usp, 80)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty State / Progress State */}
              {foundCompetitors.length === 0 && (
                <div className="text-center py-12">
                  {researchStatus === 'idle' || researchStatus === 'failed' ? (
                    <>
                      <Brain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {t('competitions.aiResearch.ready', 'Gotowy do wyszukiwania')}
                      </h3>
                      <p className="text-gray-600">
                        {t('competitions.aiResearch.instruction', 'Kliknij przycisk powyżej, aby znaleźć nowych konkurentów za pomocą AI.')}
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="relative mb-6">
                        <div className="w-16 h-16 mx-auto">
                          <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
                        </div>
                        <Clock className="w-6 h-6 text-purple-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                      </div>
                      
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {researchStatus === 'starting' && t('competitions.aiResearch.startingResearch')}
                        {researchStatus === 'pending' && t('competitions.aiResearch.requestQueuedTitle')}
                        {researchStatus === 'queued' && t('competitions.aiResearch.waitingInQueue')}
                        {researchStatus === 'in_progress' && t('competitions.aiResearch.aiAnalyzingTitle')}
                      </h3>
                      
                      <p className="text-gray-600 mb-4">
                        {researchStatus === 'starting' && t('competitions.aiResearch.initializingSystem')}
                        {researchStatus === 'pending' && t('competitions.aiResearch.queuedForProcessing')}
                        {researchStatus === 'queued' && t('competitions.aiResearch.pleaseWaitProcessing')}
                        {researchStatus === 'in_progress' && t('competitions.aiResearch.aiAnalyzingProfile')}
                      </p>

                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 max-w-md mx-auto">
                        <div className="flex items-center gap-2 text-purple-700">
                          <div className="w-2 h-2 bg-purple-600 rounded-full animate-pulse"></div>
                          <span className="text-sm font-medium">
                            {t('competitions.aiResearch.timeEstimate')}
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompetitionComponent;
