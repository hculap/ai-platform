import React from 'react';
import { useTranslation } from 'react-i18next';
import { PromptTemplate } from '../types';
import { BookOpen, Clock, Tag, CheckCircle, AlertTriangle } from 'lucide-react';

interface TemplateCardProps {
  template: PromptTemplate;
  availableDependencies: string[];
  missingDependencies: string[];
  onClick: () => void;
}

const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  availableDependencies,
  missingDependencies,
  onClick
}) => {
  const { t } = useTranslation();
  const isReady = missingDependencies.length === 0;

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

  return (
    <div
      className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200 cursor-pointer"
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-2">
            {template.title}
          </h3>
          <div className="flex items-center gap-2 mb-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(template.category)}`}>
              <Tag className="w-3 h-3 mr-1" />
              {template.category}
            </span>
            {template.language === 'pl' && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                PL
              </span>
            )}
          </div>
        </div>

        {/* Status indicator */}
        <div className="flex-shrink-0">
          {isReady ? (
            <div className="flex items-center text-green-600">
              <CheckCircle className="w-5 h-5" />
            </div>
          ) : (
            <div className="flex items-center text-orange-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      {template.description && (
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {template.description}
        </p>
      )}

      {/* Dependencies status */}
      <div className="mb-4">
        {template.dependencies.length > 0 ? (
          <div className="space-y-2">
            <div className="text-xs font-medium text-gray-700">{t('templateCard.dependencies')}:</div>
            <div className="flex flex-wrap gap-1">
              {template.dependencies.map((dep) => {
                const isAvailable = availableDependencies.includes(dep);
                return (
                  <span
                    key={dep}
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      isAvailable
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {getDependencyDisplayName(dep)}
                  </span>
                );
              })}
            </div>
          </div>
        ) : (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
            {t('templateCard.noDependencies')}
          </span>
        )}
      </div>

      {/* Status message */}
      <div className="flex items-center justify-between">
        <div className="flex items-center text-sm">
          {isReady ? (
            <span className="text-green-600 font-medium">{t('templateCard.readyToUse')}</span>
          ) : (
            <span className="text-orange-600 font-medium">
              {t('templateCard.missing')}: {missingDependencies.map(getDependencyDisplayName).join(', ')}
            </span>
          )}
        </div>

        {/* Updated time */}
        <div className="flex items-center text-xs text-gray-500">
          <Clock className="w-3 h-3 mr-1" />
          {new Date(template.updated_at).toLocaleDateString()}
        </div>
      </div>

      {/* Preview button */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 px-4 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center">
          <BookOpen className="w-4 h-4 mr-2" />
          {t('templateCard.viewTemplate')}
        </button>
      </div>
    </div>
  );
};

export default TemplateCard;