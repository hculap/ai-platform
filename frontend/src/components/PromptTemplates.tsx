import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Search, BookOpen, AlertCircle, Loader2,
  Tag
} from 'lucide-react';
import {
  PromptTemplate,
  TemplatePersonalizationData,
  User
} from '../types';
import {
  getTemplates,
  getTemplateCategories,
  getBusinessProfiles,
  getCompetitions,
  getOffers,
  getCampaigns,
  getAds,
  getScripts,
  getCreditBalance
} from '../services/api';
import { TemplatePersonalizationEngine } from '../utils/templatePersonalization';
import TemplateCard from './TemplateCard';
import TemplateModal from './TemplateModal';

interface PromptTemplatesProps {
  user: User;
  authToken: string;
  onTokenRefreshed?: (newToken: string) => void;
}

const PromptTemplates: React.FC<PromptTemplatesProps> = ({
  user,
  authToken,
  onTokenRefreshed
}) => {
  const { t, i18n } = useTranslation();

  // State
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showOnlyReady, setShowOnlyReady] = useState(false);

  // Modal state
  const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplate | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Personalization data
  const [personalizationData, setPersonalizationData] = useState<TemplatePersonalizationData>({});
  const [dataLoading, setDataLoading] = useState(false);

  // Current language for templates - use user's language preference
  const currentLanguage = i18n.language === 'pl' ? 'pl' : 'en';

  // Load user data for personalization
  const loadPersonalizationData = useCallback(async () => {
    setDataLoading(true);
    try {
      // First get business profiles to find the active one
      const businessProfilesResult = await getBusinessProfiles(authToken);

      let activeBusinessProfile = undefined;
      let activeBusinessProfileId = undefined;

      if (businessProfilesResult.success && businessProfilesResult.data && businessProfilesResult.data.length > 0) {
        activeBusinessProfile = businessProfilesResult.data.find((bp: any) => bp.is_active) || businessProfilesResult.data[0];
        activeBusinessProfileId = activeBusinessProfile?.id;
      }

      console.log('Loading personalization data for business profile:', activeBusinessProfile?.name, 'ID:', activeBusinessProfileId);

      // Now load profile-specific data
      const [
        competitionsResult,
        offersResult,
        campaignsResult,
        adsResult,
        scriptsResult,
        creditsResult
      ] = await Promise.all([
        activeBusinessProfileId ? getCompetitions(authToken, activeBusinessProfileId) : Promise.resolve({ success: true, data: [] }),
        activeBusinessProfileId ? getOffers(authToken, activeBusinessProfileId) : Promise.resolve({ success: true, data: [] }),
        activeBusinessProfileId ? getCampaigns(authToken, activeBusinessProfileId) : Promise.resolve({ success: true, data: [] }),
        activeBusinessProfileId ? getAds(authToken, activeBusinessProfileId) : Promise.resolve({ success: true, data: [] }),
        activeBusinessProfileId ? getScripts(authToken, activeBusinessProfileId) : Promise.resolve({ success: true, data: [] }),
        getCreditBalance()
      ]);

      console.log('Loaded data:', {
        businessProfile: activeBusinessProfile?.name,
        competitors: competitionsResult.success ? competitionsResult.data?.length : 0,
        offers: offersResult.success ? offersResult.data?.length : 0,
        campaigns: campaignsResult.success ? campaignsResult.data?.length : 0,
        ads: adsResult.success ? adsResult.data?.length : 0,
        scripts: scriptsResult.success ? scriptsResult.data?.length : 0
      });

      const data: TemplatePersonalizationData = {
        user,
        businessProfile: activeBusinessProfile,
        competitors: competitionsResult.success ? competitionsResult.data : [],
        offers: offersResult.success ? offersResult.data : [],
        campaigns: campaignsResult.success ? campaignsResult.data : [],
        ads: adsResult.success ? adsResult.data : [],
        scripts: scriptsResult.success ? scriptsResult.data : [],
        userCredits: creditsResult.success ? creditsResult.data : undefined
      };

      setPersonalizationData(data);
      console.log('DEBUG: Personalization data loaded:', {
        hasBusinessProfile: !!data.businessProfile,
        competitorsCount: data.competitors?.length || 0,
        offersCount: data.offers?.length || 0,
        campaignsCount: data.campaigns?.length || 0,
        adsCount: data.ads?.length || 0,
        scriptsCount: data.scripts?.length || 0
      });
    } catch (error) {
      console.error('Error loading personalization data:', error);
    } finally {
      setDataLoading(false);
    }
  }, [user, authToken]);

  // Load templates and categories
  const loadTemplates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [templatesResult, categoriesResult] = await Promise.all([
        getTemplates(currentLanguage, selectedCategory || undefined, searchTerm || undefined),
        getTemplateCategories(currentLanguage)
      ]);

      if (templatesResult.success && templatesResult.data) {
        console.log('DEBUG: API returned templates:', templatesResult.data.templates?.length, 'templates');
        console.log('DEBUG: Templates data structure:', templatesResult.data);
        setTemplates(templatesResult.data.templates);
      } else {
        console.log('DEBUG: API error or no data:', templatesResult);
        setError(templatesResult.error || 'Failed to load templates');
      }

      if (categoriesResult.success && categoriesResult.data) {
        setCategories(categoriesResult.data.categories);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
      setError('Failed to load templates');
    } finally {
      setLoading(false);
    }
  }, [currentLanguage, selectedCategory, searchTerm]);

  // Initial load
  useEffect(() => {
    loadTemplates();
    loadPersonalizationData();
  }, [loadTemplates, loadPersonalizationData]);

  // Debounced search
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      loadTemplates();
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [searchTerm, loadTemplates]);

  // Category filter change
  useEffect(() => {
    loadTemplates();
  }, [selectedCategory, loadTemplates]);

  // Get dependency status for each template
  const getTemplateDependencyStatus = (template: PromptTemplate) => {
    const validation = TemplatePersonalizationEngine.validateDependencies(template, personalizationData);

    if (template.title?.includes('Sales') || template.title?.includes('Content')) {
      console.log(`DEBUG: Template "${template.title}" validation:`, {
        dependencies: template.dependencies,
        available: validation.available,
        missing: validation.missing,
        isReady: validation.valid
      });
    }

    return {
      available: validation.available,
      missing: validation.missing,
      isReady: validation.valid
    };
  };

  // Filter templates based on ready status
  const filteredTemplates = showOnlyReady
    ? templates.filter(template => getTemplateDependencyStatus(template).isReady)
    : templates;

  console.log('DEBUG: Current state - templates:', templates.length, 'filtered:', filteredTemplates.length, 'showOnlyReady:', showOnlyReady);

  // Let's also check how many templates are ready vs not ready
  const readyTemplates = templates.filter(template => getTemplateDependencyStatus(template).isReady);
  console.log('DEBUG: Ready templates count:', readyTemplates.length, 'Not ready:', templates.length - readyTemplates.length);

  // Handle template click
  const handleTemplateClick = (template: PromptTemplate) => {
    setSelectedTemplate(template);
    setShowModal(true);
  };

  // Handle modal close
  const handleModalClose = () => {
    setShowModal(false);
    setSelectedTemplate(null);
  };

  // Handle refresh
  const handleRefresh = () => {
    loadTemplates();
    loadPersonalizationData();
  };

  if (loading && templates.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">{t('promptTemplates.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 mx-auto mb-4 text-red-600" />
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const readyCount = templates.filter(t => getTemplateDependencyStatus(t).isReady).length;

  return (
    <div className="space-y-8">
      {/* Enhanced Header Panel */}
      <div className="relative bg-white rounded-xl border border-gray-200 p-6 shadow-sm overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 via-white to-blue-50/30"></div>
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-purple-400/20 to-blue-400/20 rounded-full blur-2xl"></div>
        <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-to-tr from-blue-400/10 to-purple-400/10 rounded-full blur-3xl"></div>

        {/* Content with relative positioning */}
        <div className="relative p-8">
          {/* Header Section - Title and Count */}
          <div className="flex justify-between items-center mb-8">
            {/* Left - Title and Icon */}
            <div className="flex items-center gap-4">
              <div className="p-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl shadow-lg">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-black text-gray-900 tracking-tight">
                  {t('promptTemplates.title')}
                </h1>
                <p className="text-lg text-gray-600 font-medium mt-1">
                  {t('promptTemplates.subtitle')}
                </p>
              </div>
            </div>

            {/* Right - Available Count */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl px-4 py-3 border border-gray-200/60 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg">
                  <Tag className="w-4 h-4 text-white" />
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">{templates.length}</p>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('promptTemplates.availableTemplates', 'Dostępnych szablonów')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Search Section */}
          <div className="flex justify-start">
            {/* Search Input */}
            <div className="max-w-md">
              <div className="relative bg-white/90 backdrop-blur-sm rounded-xl border border-gray-200/60 shadow-lg">
                <div className="relative">
                  <Search className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={t('promptTemplates.searchPlaceholder')}
                    className="w-full pl-12 pr-4 py-3 bg-transparent border-0 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 placeholder-gray-500 font-medium rounded-xl"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('promptTemplates.category', 'Kategoria')}
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">{t('promptTemplates.allCategories')}</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('promptTemplates.status', 'Status')}
            </label>
            <select
              value={showOnlyReady ? 'ready' : ''}
              onChange={(e) => setShowOnlyReady(e.target.value === 'ready')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">{t('promptTemplates.allStatuses', 'Wszystkie Statusy')}</option>
              <option value="ready">{t('promptTemplates.readyToUse')}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('promptTemplates.dataRequirements', 'Wymagania danych')}
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled
            >
              <option>{t('promptTemplates.allRequirements', 'Wszystkie wymagania')}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('promptTemplates.ready', 'Gotowość')}
            </label>
            <div className="flex items-center space-x-4 pt-2">
              <div className="text-sm text-gray-600">
                <span className="font-semibold text-green-600">{readyCount}</span> {t('promptTemplates.ready', 'gotowych')}
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-semibold text-orange-600">{templates.length - readyCount}</span> {t('promptTemplates.needsData', 'wymaga danych')}
              </div>
            </div>
          </div>
        </div>

        {/* Data loading indicator */}
        {dataLoading && (
          <div className="flex items-center justify-center py-2 text-sm text-gray-600">
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            {t('promptTemplates.loadingData', 'Ładowanie danych...')}
          </div>
        )}
      </div>

      {/* Templates grid */}
      {filteredTemplates.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">{t('promptTemplates.noTemplatesTitle')}</h3>
          <p className="text-gray-600">
            {showOnlyReady
              ? t('promptTemplates.noDataMessage')
              : t('promptTemplates.noTemplatesMessage')
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => {
            const dependencyStatus = getTemplateDependencyStatus(template);
            return (
              <TemplateCard
                key={template.id}
                template={template}
                availableDependencies={dependencyStatus.available}
                missingDependencies={dependencyStatus.missing}
                onClick={() => handleTemplateClick(template)}
              />
            );
          })}
        </div>
      )}

      {/* Template Modal */}
      {selectedTemplate && (
        <TemplateModal
          template={selectedTemplate}
          personalizationData={personalizationData}
          isOpen={showModal}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
};

export default PromptTemplates;