import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X, Copy, CheckCircle, AlertTriangle, Eye, EyeOff,
  ExternalLink, Settings, Tag, Calendar, FileText
} from 'lucide-react';
import {
  PromptTemplate,
  TemplatePersonalizationData,
  PersonalizedTemplate
} from '../types';
import { TemplatePersonalizationEngine } from '../utils/templatePersonalization';

interface TemplateModalProps {
  template: PromptTemplate;
  personalizationData: TemplatePersonalizationData;
  isOpen: boolean;
  onClose: () => void;
}

const TemplateModal: React.FC<TemplateModalProps> = ({
  template,
  personalizationData,
  isOpen,
  onClose
}) => {
  const { t } = useTranslation();
  const [personalizedTemplate, setPersonalizedTemplate] = useState<PersonalizedTemplate | null>(null);
  const [showRawTemplate, setShowRawTemplate] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'template' | 'personalize'>('overview');

  // Personalize template when data changes
  useEffect(() => {
    if (template && personalizationData) {
      const result = TemplatePersonalizationEngine.personalizeTemplate(template, personalizationData);
      setPersonalizedTemplate(result);
    }
  }, [template, personalizationData]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setActiveTab('overview');
      setShowRawTemplate(false);
      setCopySuccess(false);
    }
  }, [isOpen]);

  const handleCopyToClipboard = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const getCategoryColor = (category: string): string => {
    const colors: Record<string, string> = {
      'Sales': 'bg-green-100 text-green-800',
      'Marketing': 'bg-blue-100 text-blue-800',
      'Copywriting': 'bg-purple-100 text-purple-800',
      'Outreach': 'bg-orange-100 text-orange-800',
      'Social': 'bg-pink-100 text-pink-800',
      'Ads': 'bg-red-100 text-red-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const getDependencyDisplayName = (dep: string): string => {
    const dependencyKeys: Record<string, string> = {
      'business_profile': 'dependencies.businessProfile',
      'competitors': 'dependencies.competitors',
      'offers': 'dependencies.offers',
      'campaigns': 'dependencies.campaigns',
      'scripts': 'dependencies.scripts',
      'ads': 'dependencies.ads',
      'user': 'dependencies.user',
      'user_credits': 'dependencies.userCredits'
    };
    return dependencyKeys[dep] ? t(dependencyKeys[dep]) : dep;
  };

  const getDependencyLink = (dep: string): string => {
    const links: Record<string, string> = {
      'business_profile': '/business-profiles',
      'competitors': '/competition',
      'offers': '/offers',
      'campaigns': '/campaigns',
      'scripts': '/scripts',
      'ads': '/ads'
    };
    return links[dep] || '#';
  };

  if (!isOpen) return null;

  const isReady = personalizedTemplate ? personalizedTemplate.missingDependencies.length === 0 : false;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* Header */}
          <div className="bg-white px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {template.title}
                </h3>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(template.category)}`}>
                    <Tag className="w-3 h-3 mr-1" />
                    {template.category}
                  </span>
                  {template.language === 'pl' && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                      PL
                    </span>
                  )}
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500">
                    <Calendar className="w-3 h-3 mr-1" />
                    {new Date(template.updated_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {/* Status indicator */}
                {isReady ? (
                  <div className="flex items-center text-green-600">
                    <CheckCircle className="w-5 h-5 mr-1" />
                    <span className="text-sm font-medium">{t('templateModal.ready')}</span>
                  </div>
                ) : (
                  <div className="flex items-center text-orange-600">
                    <AlertTriangle className="w-5 h-5 mr-1" />
                    <span className="text-sm font-medium">{t('templateModal.missingData')}</span>
                  </div>
                )}
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="mt-4">
              <nav className="flex space-x-8">
                {(['overview', 'template', 'personalize'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab === 'overview' && t('templateModal.overview')}
                    {tab === 'template' && t('templateModal.template')}
                    {tab === 'personalize' && t('templateModal.personalize')}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white px-6 py-4 max-h-96 overflow-y-auto">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Description */}
                {template.description && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">{t('templateModal.description')}</h4>
                    <p className="text-gray-600">{template.description}</p>
                  </div>
                )}

                {/* Dependencies */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">{t('templateModal.dataRequirements')}</h4>
                  {template.dependencies.length > 0 ? (
                    <div className="space-y-2">
                      {template.dependencies.map((dep) => {
                        const isAvailable = personalizedTemplate?.availableDependencies.includes(dep);
                        return (
                          <div key={dep} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                            <div className="flex items-center">
                              <span
                                className={`inline-flex items-center w-2 h-2 rounded-full mr-3 ${
                                  isAvailable ? 'bg-green-500' : 'bg-red-500'
                                }`}
                              />
                              <span className="text-sm font-medium text-gray-900">
                                {getDependencyDisplayName(dep)}
                              </span>
                            </div>
                            {!isAvailable && (
                              <a
                                href={getDependencyLink(dep)}
                                className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                              >
                                {t('templateModal.generate')}
                                <ExternalLink className="w-3 h-3 ml-1" />
                              </a>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-gray-600 text-sm">{t('templateModal.noDataRequirements')}</p>
                  )}
                </div>

                {/* Placeholders */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">{t('templateModal.availablePlaceholders')}</h4>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                      {TemplatePersonalizationEngine.extractPlaceholders(template.content).join('\n')}
                    </pre>
                  </div>
                </div>
              </div>
            )}

            {/* Template Tab */}
            {activeTab === 'template' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-900">{t('templateModal.templateContent')}</h4>
                  <button
                    onClick={() => setShowRawTemplate(!showRawTemplate)}
                    className="flex items-center text-sm text-gray-600 hover:text-gray-800"
                  >
                    {showRawTemplate ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
                    {showRawTemplate ? t('templateModal.hidePlaceholders') : t('templateModal.showPlaceholders')}
                  </button>
                </div>
                <div className="bg-gray-50 p-4 rounded-md">
                  <pre className="whitespace-pre-wrap text-sm text-gray-800">
                    {showRawTemplate ? template.content : (personalizedTemplate?.personalizedContent || template.content)}
                  </pre>
                </div>
              </div>
            )}

            {/* Personalize Tab */}
            {activeTab === 'personalize' && (
              <div className="space-y-6">
                {/* Missing dependencies warning */}
                {personalizedTemplate && personalizedTemplate.missingDependencies.length > 0 && (
                  <div className="bg-orange-50 border border-orange-200 rounded-md p-4">
                    <div className="flex">
                      <AlertTriangle className="w-5 h-5 text-orange-400 mr-2 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium text-orange-800">{t('templateModal.missingDataTitle')}</h4>
                        <p className="text-sm text-orange-700 mt-1">
                          {t('templateModal.missingDataText')}
                        </p>
                        <ul className="mt-2 space-y-1">
                          {personalizedTemplate.missingDependencies.map((dep) => (
                            <li key={dep} className="text-sm text-orange-700">
                              • {getDependencyDisplayName(dep)}
                              <a
                                href={getDependencyLink(dep)}
                                className="ml-2 text-orange-600 hover:text-orange-800 underline"
                              >
                                {t('templateModal.generateNow')}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* Personalized content */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-gray-900">{t('templateModal.personalizedPrompt')}</h4>
                    <button
                      onClick={() => handleCopyToClipboard(personalizedTemplate?.personalizedContent || template.content)}
                      className="flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md transition-colors"
                    >
                      {copySuccess ? (
                        <>
                          <CheckCircle className="w-3 h-3 mr-1" />
                          {t('templateModal.copied')}
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 mr-1" />
                          {t('templateModal.copy')}
                        </>
                      )}
                    </button>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-md border">
                    <pre className="whitespace-pre-wrap text-sm text-gray-800">
                      {personalizedTemplate?.personalizedContent || template.content}
                    </pre>
                  </div>
                </div>

                {/* Usage tips */}
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <div className="flex">
                    <FileText className="w-5 h-5 text-blue-400 mr-2 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-blue-800">{t('templateModal.usageTips')}</h4>
                      <ul className="text-sm text-blue-700 mt-1 space-y-1">
                        <li>• {t('templateModal.tip1')}</li>
                        <li>• {t('templateModal.tip2')}</li>
                        <li>• {t('templateModal.tip3')}</li>
                        <li>• {t('templateModal.tip4')}</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-3 flex items-center justify-between">
            <div className="text-xs text-gray-500">
              Template ID: {template.id}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                {t('templateModal.close')}
              </button>
              {isReady && (
                <button
                  onClick={() => handleCopyToClipboard(personalizedTemplate?.personalizedContent || template.content)}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                >
                  {copySuccess ? t('templateModal.copied') : t('templateModal.copyPrompt')}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateModal;