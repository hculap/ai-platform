import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Search,
  Plus,
  Edit,
  Building2,
  Globe,
  FileText,
  Trash2,
  ArrowLeft
} from 'lucide-react';
import { getBusinessProfiles } from '../services/api';

interface BusinessProfile {
  id: string;
  name: string;
  website_url: string;
  offer_description: string;
  is_active: boolean;
  created_at: string;
}

interface BusinessProfilesProps {
  authToken: string;
  onBack?: () => void;
  onCreateProfile?: () => void;
  onEditProfile?: (profile: BusinessProfile) => void;
}

const BusinessProfiles: React.FC<BusinessProfilesProps> = ({
  authToken,
  onBack,
  onCreateProfile,
  onEditProfile
}) => {
  const { t } = useTranslation();


  const [profiles, setProfiles] = useState<BusinessProfile[]>([]);
  const [filteredProfiles, setFilteredProfiles] = useState<BusinessProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isTokenExpired, setIsTokenExpired] = useState(false);

  useEffect(() => {
    fetchBusinessProfiles();
  }, [authToken]);

  useEffect(() => {
    // Filter profiles based on search query
    if (searchQuery.trim() === '') {
      setFilteredProfiles(profiles);
    } else {
      const filtered = profiles.filter(profile =>
        profile.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        profile.website_url?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        profile.offer_description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredProfiles(filtered);
    }
  }, [profiles, searchQuery]);

  const fetchBusinessProfiles = async () => {
    try {
      setIsLoading(true);
      const result = await getBusinessProfiles(authToken);

      if (result.isTokenExpired) {
        setIsTokenExpired(true);
        setIsLoading(false);
        return;
      }

      if (result.success && result.data) {
        setProfiles(result.data);
      }
    } catch (error) {
      console.error('Error fetching business profiles:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="h-full">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {t('businessProfiles.title', 'Business Profiles')}
          </h2>
          <p className="text-lg text-gray-600">
            {t('businessProfiles.subtitle', 'Manage your business profiles')}
          </p>
        </div>

        <button
          onClick={onCreateProfile}
          className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          {t('businessProfiles.createNew', 'Create New Profile')}
        </button>
      </div>

      {/* Search and Content */}
      <div>
        {/* Search Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="relative max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder={t('businessProfiles.search.placeholder', 'Search profiles...')}
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="text-sm text-gray-500">
              {isLoading ? 'Loading...' : `${profiles.length} profiles found`}
            </div>
          </div>
        </div>

        {/* Profiles Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <div className="w-8 h-8 bg-white rounded-full"></div>
              </div>
              <p className="text-gray-600">{t('businessProfiles.loading', 'Loading profiles...')}</p>
            </div>
          </div>
        ) : filteredProfiles.length === 0 ? (
          <div className="text-center py-12">
            {searchQuery ? (
              <div>
                <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {t('businessProfiles.noSearchResults', 'No profiles found')}
                </h3>
                <p className="text-gray-600">
                  {t('businessProfiles.tryDifferentSearch', 'Try adjusting your search terms')}
                </p>
              </div>
            ) : (
              <div>
                <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {t('businessProfiles.noProfiles', 'No business profiles yet')}
                </h3>
                <p className="text-gray-600 mb-6">
                  {t('businessProfiles.createFirst', 'Create your first business profile to get started')}
                </p>
                <div className="flex flex-col items-center space-y-3">
                  <button
                    onClick={onCreateProfile}
                    className="flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {t('businessProfiles.createFirstProfile', 'Create Your First Profile')}
                  </button>

                  <button
                    onClick={async () => {
                      try {
                        console.log('Creating test profile...');
                        const response = await fetch('/api/business-profiles', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${authToken}`
                          },
                          body: JSON.stringify({
                            website_url: 'https://example.com',
                            name: 'Test Business Profile',
                            offer_description: 'This is a test business profile created for debugging purposes.'
                          })
                        });

                        if (response.ok) {
                          console.log('Test profile created successfully');
                          await fetchBusinessProfiles(); // Refresh the list
                        } else {
                          const errorText = await response.text();
                          console.error('Failed to create test profile:', errorText);
                          alert(`Failed to create test profile: ${errorText}`);
                        }
                      } catch (error) {
                        console.error('Error creating test profile:', error);
                        alert(`Error creating test profile: ${error}`);
                      }
                    }}
                    className="text-sm text-gray-500 hover:text-gray-700 underline"
                  >
                    Create Test Profile (Debug)
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : isTokenExpired ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gradient-to-r from-red-600 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <div className="w-8 h-8 bg-white rounded-full"></div>
            </div>
            <h3 className="text-lg font-medium text-red-900 mb-2">Authentication Expired</h3>
            <p className="text-red-600 mb-6">Your session has expired. Please refresh the page to log in again.</p>
            <button
              onClick={() => window.location.reload()}
              className="flex items-center px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors mx-auto"
            >
              🔄 Refresh Page
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProfiles.map((profile) => (
              <div
                key={profile.id}
                className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => onEditProfile?.(profile)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                      <Building2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {profile.name || profile.website_url}
                      </h3>
                      <div className="flex items-center text-sm text-gray-500">
                        <Globe className="w-3 h-3 mr-1" />
                        <span>{profile.website_url}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      profile.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {profile.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditProfile?.(profile);
                      }}
                      className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex items-start">
                    <FileText className="w-4 h-4 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-600">
                      {truncateText(profile.offer_description || 'No description available')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{t('businessProfiles.created', 'Created')} {formatDate(profile.created_at)}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditProfile?.(profile);
                    }}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {t('businessProfiles.edit', 'Edit')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BusinessProfiles;
