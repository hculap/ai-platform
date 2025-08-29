import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Search,
  Plus,
  Brain,
  Loader2,
  AlertCircle,
  CheckCircle,
  Target,
  Globe
} from 'lucide-react';

import { executeAgent } from '../services/api';
import type { BusinessProfile } from '../types';

interface CompetitorsResearcherProps {
  businessProfileId?: string;
  authToken: string;
  onTokenRefreshed?: (newToken: string) => void;
  onCompetitorsFound?: (competitors: any[]) => void;
}

interface Competitor {
  name: string;
  url: string;
  description: string | null;
  usp: string | null;
}

const CompetitorsResearcherComponent: React.FC<CompetitorsResearcherProps> = ({
  businessProfileId,
  authToken,
  onTokenRefreshed,
  onCompetitorsFound
}) => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [isTokenExpired, setIsTokenExpired] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [foundCompetitors, setFoundCompetitors] = useState<Competitor[]>([]);
  const [businessProfileData, setBusinessProfileData] = useState<BusinessProfile | null>(null);

  // Early return if no business profile is selected
  if (!businessProfileId) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Globe className="w-16 h-16 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {t('competitorsResearcher.noBusinessProfile.title', 'Wybierz profil biznesowy')}
            </h3>
            <p className="text-gray-600">
              {t('competitorsResearcher.noBusinessProfile.description', 'Aby wyszukać konkurentów, najpierw wybierz profil biznesowy.')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const handleFindCompetitors = useCallback(async () => {
    if (!businessProfileId) {
      setError('Business profile ID is required');
      return;
    }

    try {
      setIsLoading(true);
      setIsTokenExpired(false);
      setError(null);
      setSuccess(null);

      // Prepare the agent input
      const agentInput = {
        input: {
          business_profile_id: businessProfileId,
          existing_competitors: [] // We'll get this from the current competitors
        }
      };

      const result = await executeAgent('competitors-researcher', 'find-competitors', agentInput, authToken);

      if (result.isTokenExpired && onTokenRefreshed) {
        // Try to refresh token and retry
        const refreshResult = await fetch('/api/auth/refresh', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });

        if (refreshResult.ok) {
          const refreshData = await refreshResult.json();
          if (refreshData.access_token) {
            onTokenRefreshed(refreshData.access_token);

            // Retry with new token
            const retryResult = await executeAgent('competitors-researcher', 'find-competitors', agentInput, refreshData.access_token);
            if (retryResult.success && retryResult.data) {
              handleSuccess(retryResult.data);
            } else {
              setError(retryResult.error || 'Failed to find competitors');
            }
          } else {
            setIsTokenExpired(true);
          }
        } else {
          setIsTokenExpired(true);
        }
      } else if (result.success && result.data) {
        handleSuccess(result.data);
      } else {
        setError(result.error || 'Failed to find competitors');
      }
    } catch (error) {
      console.error('Error finding competitors:', error);
      setError('An unexpected error occurred while finding competitors');
    } finally {
      setIsLoading(false);
    }
  }, [businessProfileId, authToken, onTokenRefreshed]);

  const handleSuccess = (data: any) => {
    if (Array.isArray(data)) {
      setFoundCompetitors(data);
      setSuccess(`Found ${data.length} potential competitors!`);
      if (onCompetitorsFound) {
        onCompetitorsFound(data);
      }
    } else {
      setError('Invalid response format from AI analysis');
    }
  };

  const handleAddCompetitor = (competitor: Competitor) => {
    // Here you would typically add the competitor to the database
    console.log('Adding competitor:', competitor);
    // For now, just remove it from the found list
    setFoundCompetitors(prev => prev.filter(c => c.name !== competitor.name));
  };

  return (
    <div className="space-y-8">
      {/* Enhanced Header Panel */}
      <div className="relative bg-white rounded-xl border border-gray-200 p-6 shadow-sm overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 via-white to-blue-50/30"></div>
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-purple-600/20 to-blue-600/20 rounded-full blur-2xl"></div>
        <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-to-tr from-blue-600/10 to-purple-600/10 rounded-full blur-3xl"></div>

        {/* Content with relative positioning */}
        <div className="relative p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Top Left - Title and Icon */}
            <div className="flex items-center gap-4">
              <div className="p-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl shadow-lg">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-black text-gray-900 tracking-tight">
                  {t('competitorsResearcher.title', 'Badanie Konkurencji')}
                </h1>
                <p className="text-lg text-gray-600 mt-2">
                  {t('competitorsResearcher.subtitle', 'Znajdź nowych konkurentów za pomocą AI')}
                </p>
              </div>
            </div>

            {/* Top Right - Action Button */}
            <div className="flex items-center justify-end">
              <button
                onClick={handleFindCompetitors}
                disabled={isLoading}
                className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {t('competitorsResearcher.searching', 'Szukam...')}
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    {t('competitorsResearcher.findCompetitors', 'Znajdź Konkurentów')}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Status Messages */}
          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <p className="text-red-800">{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <p className="text-green-800">{success}</p>
              </div>
            </div>
          )}

          {isTokenExpired && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                <p className="text-yellow-800">
                  {t('competitorsResearcher.tokenExpired', 'Sesja wygasła. Odśwież stronę, aby kontynuować.')}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Found Competitors */}
      {foundCompetitors.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <Target className="w-6 h-6 text-purple-600" />
            <h2 className="text-2xl font-bold text-gray-900">
              {t('competitorsResearcher.foundCompetitors', 'Znalezieni Konkurenci')} ({foundCompetitors.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {foundCompetitors.map((competitor, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 text-lg">{competitor.name}</h3>
                  <button
                    onClick={() => handleAddCompetitor(competitor)}
                    className="p-1.5 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition-colors"
                    title={t('competitorsResearcher.addCompetitor', 'Dodaj konkurenta')}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2 text-sm">
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
                      <strong>{t('competitorsResearcher.description', 'Opis')}:</strong> {competitor.description}
                    </p>
                  )}

                  {competitor.usp && (
                    <p className="text-gray-600">
                      <strong>{t('competitorsResearcher.usp', 'USP')}:</strong> {competitor.usp}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {foundCompetitors.length === 0 && !isLoading && !error && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 shadow-sm">
          <div className="text-center">
            <Brain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {t('competitorsResearcher.readyToSearch', 'Gotowy do wyszukiwania')}
            </h3>
            <p className="text-gray-600">
              {t('competitorsResearcher.clickToFind', 'Kliknij przycisk powyżej, aby znaleźć nowych konkurentów za pomocą AI.')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompetitorsResearcherComponent;
