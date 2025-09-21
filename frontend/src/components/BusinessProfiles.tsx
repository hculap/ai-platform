import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Search,
  Plus,
  Edit,
  Building2,
  Globe,
  FileText,
  Trash2,
  Activity,
  X,
  Calendar,
  ExternalLink
} from 'lucide-react';
import { getBusinessProfiles, deleteBusinessProfile, createBusinessProfile, updateBusinessProfile } from '../services/api';
import BusinessProfileForm from './BusinessProfileForm';

interface BusinessProfile {
  id: string;
  name: string;
  website_url: string;
  offer_description: string;
  target_customer: string;
  problem_solved: string;
  customer_desires: string;
  brand_tone: string;
  communication_language: string;
  is_active: boolean;
  created_at?: string;
}

interface BusinessProfilesProps {
  authToken: string;
  onCreateProfile?: () => void;
  onEditProfile?: (profile: BusinessProfile) => void;
  onTokenRefreshed?: (newToken: string) => void;
  onProfilesChanged?: () => void;
}

const BusinessProfiles: React.FC<BusinessProfilesProps> = ({
  authToken,
  onCreateProfile,
  onEditProfile,
  onTokenRefreshed,
  onProfilesChanged
}) => {
  const { t } = useTranslation();


  const [profiles, setProfiles] = useState<BusinessProfile[]>([]);
  const [filteredProfiles, setFilteredProfiles] = useState<BusinessProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isTokenExpired, setIsTokenExpired] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [editingProfile, setEditingProfile] = useState<BusinessProfile | null>(null);

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

  const fetchBusinessProfiles = useCallback(async () => {
    try {
      setIsLoading(true);
      setIsTokenExpired(false);
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
  }, [authToken]);

  // Debounce search query to improve performance
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    fetchBusinessProfiles();
  }, [fetchBusinessProfiles]);

  // Filter profiles based on debounced search query
  const filteredProfilesMemo = useMemo(() => {
    if (debouncedSearchQuery.trim() === '') {
      return profiles;
    } else {
      const query = debouncedSearchQuery.toLowerCase();
      return profiles.filter(profile =>
        profile.name?.toLowerCase().includes(query) ||
        profile.website_url?.toLowerCase().includes(query) ||
        profile.offer_description?.toLowerCase().includes(query)
      );
    }
  }, [profiles, debouncedSearchQuery]);

  useEffect(() => {
    setFilteredProfiles(filteredProfilesMemo);
  }, [filteredProfilesMemo]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };




  const handleDeleteProfile = useCallback(async (profile: BusinessProfile) => {
    try {
      const result = await deleteBusinessProfile(profile.id, authToken);

      if (result.isTokenExpired) {
        setIsTokenExpired(true);
        return;
      }

      if (result.success) {
        // Refresh the profiles list
        await fetchBusinessProfiles();
        setShowDeleteConfirm(null);
        // Notify parent component to refresh header selector
        if (onProfilesChanged) {
          onProfilesChanged();
        }
      } else {
        // Show error message
        alert(t('businessProfiles.deleteFailed', 'Usuwanie nie powiodło się'));
      }
    } catch (error) {
      console.error('Delete profile error:', error);
      alert(t('businessProfiles.deleteFailed', 'Usuwanie nie powiodło się'));
    }
  }, [authToken, fetchBusinessProfiles, t]);

  const handleCreateProfile = useCallback(() => {
    setEditingProfile(null);
    setShowProfileForm(true);
  }, []);

  const handleEditProfileForm = useCallback((profile: BusinessProfile) => {
    setEditingProfile(profile);
    setShowProfileForm(true);
  }, []);

  const handleSaveProfile = useCallback(async (profileData: Omit<BusinessProfile, 'id'>) => {
    try {
      if (editingProfile) {
        // Update existing profile
        const result = await updateBusinessProfile(editingProfile.id, profileData, authToken);

        if (result.isTokenExpired) {
          setIsTokenExpired(true);
          return;
        }

        if (result.success) {
          await fetchBusinessProfiles();
          setShowProfileForm(false);
          setEditingProfile(null);
          // Notify parent component to refresh header selector
          if (onProfilesChanged) {
            onProfilesChanged();
          }
        } else {
          alert(result.error || t('businessProfiles.form.update', 'Zaktualizuj'));
        }
      } else {
        // Create new profile
        const result = await createBusinessProfile(profileData, authToken);

        if (result.isTokenExpired) {
          setIsTokenExpired(true);
          return;
        }

        if (result.success) {
          await fetchBusinessProfiles();
          setShowProfileForm(false);
          setEditingProfile(null);
          // Notify parent component to refresh header selector
          if (onProfilesChanged) {
            onProfilesChanged();
          }
        } else {
          alert(result.error || t('businessProfiles.form.create', 'Utwórz'));
        }
      }
    } catch (error) {
      console.error('Save profile error:', error);
      alert(t('businessProfiles.form.saving', 'Zapisywanie...'));
    }
  }, [authToken, editingProfile, fetchBusinessProfiles, t]);

  const handleCancelForm = useCallback(() => {
    setShowProfileForm(false);
    setEditingProfile(null);
  }, []);

  // Confirmation Dialog Component
  const DeleteConfirmationDialog = ({ profile }: { profile: BusinessProfile }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-md mx-4 w-full">
        <div className="text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trash2 className="w-6 h-6 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {t('businessProfiles.deleteConfirmTitle', 'Potwierdź usunięcie')}
          </h3>
          <p className="text-gray-600 mb-6">
            {t('businessProfiles.deleteConfirm', 'Czy na pewno chcesz usunąć ten profil biznesowy?')}
            <br />
            <strong>{profile.name || profile.website_url}</strong>
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setShowDeleteConfirm(null)}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              {t('businessProfiles.cancel', 'Anuluj')}
            </button>
            <button
              onClick={() => handleDeleteProfile(profile)}
              className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              {t('businessProfiles.delete', 'Usuń')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pl-PL', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Nieprawidłowa data';
    }
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Skeleton loading component
  const ProfileCardSkeleton = () => (
    <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-gray-200 rounded-lg mr-3"></div>
          <div>
            <div className="h-5 bg-gray-200 rounded w-32 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-48"></div>
          </div>
        </div>
        <div className="h-6 bg-gray-200 rounded-full w-16"></div>
      </div>
      <div className="mb-4">
        <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      </div>
      <div className="flex items-center justify-between">
        <div className="h-4 bg-gray-200 rounded w-24"></div>
        <div className="h-8 bg-gray-200 rounded w-16"></div>
      </div>
    </div>
  );

  return (
    <div className="h-full">
      {/* State-of-the-art Header Panel */}
      <div className="relative bg-gradient-to-br from-white via-gray-50 to-blue-50/30 rounded-2xl border border-gray-200/60 shadow-xl shadow-gray-100/50 backdrop-blur-sm mb-8 overflow-hidden">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 bg-grid-gray-100/25 bg-[size:20px_20px] opacity-30"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-blue-100/40 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-purple-100/40 to-transparent rounded-full blur-3xl"></div>
        
        {/* Content with relative positioning */}
        <div className="relative p-8">
          {/* Header Section - Title and Create Button */}
          <div className="flex justify-between items-center mb-8">
            {/* Left - Title and Icon */}
            <div className="flex items-center gap-4">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-black text-gray-900 tracking-tight">
                  {t('businessProfiles.title', 'Profile Biznesowe')}
                </h1>
                <p className="text-lg text-gray-600 font-medium mt-1">
                  {t('businessProfiles.subtitle', 'Zarządzaj swoimi profilami biznesowymi')}
                </p>
              </div>
            </div>

            {/* Right - Profile Count */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl px-4 py-3 border border-gray-200/60 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg">
                  <Activity className="w-4 h-4 text-white" />
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">
                    {isLoading ? (
                      <span className="inline-block w-8 h-5 bg-gray-200 rounded animate-pulse"></span>
                    ) : !debouncedSearchQuery ? (
                      `${profiles.length}`
                    ) : (
                      `${filteredProfiles.length}`
                    )}
                  </p>
                  <p className="text-xs text-gray-500">{t('businessProfiles.totalActive', 'Łącznie aktywnych')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Actions Section */}
          <div className="flex justify-between items-center gap-4 mb-2">
            {/* Left - Search */}
            <div className="flex-1 max-w-lg">
              <div className="relative bg-white/90 backdrop-blur-sm rounded-xl border border-gray-200/60 shadow-lg">
                <div className="relative">
                  <Search className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder={t('businessProfiles.search.placeholder', 'Szukaj profili...')}
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

            {/* Right - Create Button */}
            <div className="flex gap-3 ml-4">
              <button
                onClick={handleCreateProfile}
                className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 whitespace-nowrap"
              >
                <Plus className="w-5 h-5" />
                <span>{t('businessProfiles.createNew', 'Utwórz Nowy Profil')}</span>
              </button>
            </div>
          </div>

          {/* Search feedback */}
          <div className="min-h-[20px] mb-2">
            {searchQuery && !debouncedSearchQuery && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                <span>{t('businessProfiles.searching', 'Szukam...')}</span>
              </div>
            )}

            {debouncedSearchQuery && filteredProfiles.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-emerald-600">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                <span className="font-medium">
                  {t('businessProfiles.searchResults', 'Znaleziono {{count}} {{type}}', {
                    count: filteredProfiles.length,
                    type: filteredProfiles.length === 1 ? 'profil' : 'profili'
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
                <ProfileCardSkeleton key={index} />
              ))}
            </div>
          )}

          {!isLoading && isTokenExpired && (
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
          )}

          {!isLoading && !isTokenExpired && filteredProfiles.length === 0 && (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center max-w-md mx-auto">
                {searchQuery ? (
                  <div className="space-y-4">
                    <div className="relative">
                      <div className="w-20 h-20 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto">
                        <Search className="w-10 h-10 text-blue-500" />
                      </div>
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center">
                        <span className="text-xs text-orange-600">?</span>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {t('businessProfiles.noSearchResults', 'No profiles found')}
                      </h3>
                      <p className="text-gray-600 mb-6">
                        {t('businessProfiles.tryDifferentSearch', 'Try adjusting your search terms or check for typos')}
                      </p>
                      <button
                        onClick={() => setSearchQuery('')}
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                      >
                        Clear Search
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="relative">
                      <div className="w-24 h-24 bg-gradient-to-r from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto transform rotate-3">
                        <Building2 className="w-12 h-12 text-blue-600" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <Plus className="w-4 h-4 text-green-600" />
                      </div>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-3">
                        {t('businessProfiles.noProfiles', 'Ready to get started?')}
                      </h3>
                      <p className="text-gray-600 mb-8 leading-relaxed">
                        {t('businessProfiles.createFirst', 'Create your first business profile to analyze websites, manage campaigns, and track performance all in one place.')}
                      </p>

                      <div className="space-y-4">
                        <button
                          onClick={handleCreateProfile}
                          className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                        >
                          <Plus className="w-5 h-5 mr-2" />
                          {t('businessProfiles.createFirstProfile', 'Create Your First Profile')}
                        </button>

                        <div className="text-sm text-gray-500">
                          <p>💡 Tip: Start by analyzing a website to auto-generate your profile</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {!isLoading && !isTokenExpired && filteredProfiles.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {filteredProfiles.map((profile) => (
              <div
                key={profile.id}
                className="group relative bg-white rounded-2xl border border-gray-200/60 p-6 hover:shadow-lg hover:border-blue-300/50 transition-all duration-300 cursor-pointer overflow-hidden"
                onClick={() => onEditProfile?.(profile)}
              >
                {/* Enhanced gradient background with multiple layers */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/40 via-purple-50/30 to-indigo-50/40 opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-200/20 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-200/20 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-500"></div>

                <div className="relative z-10">
                  {/* Enhanced Header with modern layout */}
                  <div className="space-y-6">
                    {/* Profile icon and status */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="relative">
                          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/25 group-hover:shadow-blue-500/40 transition-all duration-300">
                            <Building2 className="w-8 h-8 text-white" />
                          </div>
                          {/* Pulse indicator for active profiles */}
                          {profile.is_active && (
                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-900 transition-colors">
                            {debouncedSearchQuery ? highlightSearchTerm(profile.name || 'Unnamed Profile', debouncedSearchQuery) : (profile.name || 'Unnamed Profile')}
                          </h3>
                          
                          <div className="space-y-2">
                            <div className="flex items-center text-gray-600 group-hover:text-blue-600 transition-colors">
                              <Globe className="w-4 h-4 mr-2 flex-shrink-0" />
                              <span className="truncate font-medium">
                                {debouncedSearchQuery ? highlightSearchTerm(profile.website_url, debouncedSearchQuery) : profile.website_url}
                              </span>
                            </div>
                            
                            <div className="flex items-center text-sm text-gray-500">
                              <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
                                                             <span>{t('businessProfiles.created', 'Utworzono')} {formatDate(profile.created_at || '')}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Enhanced Status Badge */}
                      <div className={`absolute top-4 right-4 inline-flex items-center px-3 py-1.5 rounded-full font-medium text-xs border transition-all duration-300 ${
                        profile.is_active
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm'
                          : 'bg-red-50 text-red-700 border-red-200 shadow-sm'
                      }`}>
                        <div className={`w-2 h-2 rounded-full mr-2 ${
                          profile.is_active ? 'bg-emerald-500' : 'bg-red-500'
                        }`}></div>
                        {profile.is_active ? t('businessProfiles.active', 'Aktywny') : t('businessProfiles.inactive', 'Nieaktywny')}
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Description Section */}
                  <div className="mb-8">
                    <div className="bg-gray-50/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-100 group-hover:bg-blue-50/50 group-hover:border-blue-200/50 transition-all duration-300">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-white rounded-xl shadow-sm group-hover:shadow-md transition-all duration-300">
                          <FileText className="w-5 h-5 text-gray-600 group-hover:text-blue-600 transition-colors" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold text-gray-800 mb-2 uppercase tracking-wide">{t('businessProfiles.description', 'Opis')}</h4>
                          <p className="text-gray-700 leading-relaxed group-hover:text-gray-800 transition-colors">
                            {debouncedSearchQuery
                              ? highlightSearchTerm(truncateText(profile.offer_description || t('businessProfiles.noDescription', 'No description available'), 120), debouncedSearchQuery)
                              : truncateText(profile.offer_description || t('businessProfiles.noDescription', 'No description available'), 120)
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Action Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200/60 group-hover:border-blue-200/60 transition-all duration-300">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(profile.website_url, '_blank', 'noopener,noreferrer');
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-blue-100 text-gray-700 hover:text-blue-700 font-medium text-sm rounded-lg transition-all duration-300"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>{t('businessProfiles.viewWebsite', 'Zobacz stronę')}</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditProfileForm(profile);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 hover:text-blue-800 font-medium text-sm rounded-lg transition-all duration-300"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>{t('businessProfiles.edit', 'Edytuj')}</span>
                      </button>

                      {filteredProfiles.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowDeleteConfirm(profile.id);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 hover:text-red-800 font-medium text-sm rounded-lg transition-all duration-300"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>{t('businessProfiles.delete', 'Usuń')}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          )}
        </>

        {/* Delete Confirmation Dialog */}
        {showDeleteConfirm && (
          <DeleteConfirmationDialog
            profile={profiles.find(p => p.id === showDeleteConfirm)!}
          />
        )}

        {/* Business Profile Form */}
        {showProfileForm && (
          <BusinessProfileForm
            profile={editingProfile}
            onSave={handleSaveProfile}
            onCancel={handleCancelForm}
          />
        )}
    </div>
  );
};

export default BusinessProfiles;
