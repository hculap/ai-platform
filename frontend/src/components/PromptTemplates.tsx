import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Search, Filter, BookOpen, AlertCircle, Loader2,
  RefreshCw, Tag, CheckCircle, AlertTriangle
} from 'lucide-react';
import {
  PromptTemplate,
  TemplatesResponse,
  CategoriesResponse,
  TemplatePersonalizationData,
  BusinessProfileApi,
  Offer,
  Campaign,
  Ad,
  GeneratedScript,
  User,
  UserCredit
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
  }, [searchTerm]);

  // Category filter change
  useEffect(() => {
    loadTemplates();
  }, [selectedCategory]);

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
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <BookOpen className="w-6 h-6 mr-2 text-blue-600" />
              {t('promptTemplates.title')}
            </h1>
            <p className="text-gray-600 mt-1">
              {t('promptTemplates.subtitle')}
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center">
              <BookOpen className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-blue-600">{templates.length}</p>
                <p className="text-blue-600 text-sm">{t('promptTemplates.totalTemplates')}</p>
              </div>
            </div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-green-600">{readyCount}</p>
                <p className="text-green-600 text-sm">{t('promptTemplates.readyToUse')}</p>
              </div>
            </div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="flex items-center">
              <AlertTriangle className="w-8 h-8 text-orange-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-orange-600">{templates.length - readyCount}</p>
                <p className="text-orange-600 text-sm">Need Data</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={t('promptTemplates.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Category filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">{t('promptTemplates.allCategories')}</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>

          {/* Ready filter */}
          <label className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
            <input
              type="checkbox"
              checked={showOnlyReady}
              onChange={(e) => setShowOnlyReady(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">{t('promptTemplates.readyToUse')} only</span>
          </label>

          {/* Data loading indicator */}
          {dataLoading && (
            <div className="flex items-center px-3 py-2 text-sm text-gray-600">
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Loading data...
            </div>
          )}
        </div>
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