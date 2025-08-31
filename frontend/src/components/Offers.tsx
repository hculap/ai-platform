import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Search,
  Plus,
  Edit,
  Package,
  Settings,
  Trash2,
  X,
  Brain,
  Calendar,
  Loader2,
  AlertCircle,
  CheckCircle,
  DollarSign
} from 'lucide-react';
import { 
  getOffers, 
  deleteOffer, 
  createOffer, 
  updateOffer, 
  generateOffers
} from '../services/api';
import { Offer } from '../types';
import OfferForm from './OfferForm';

interface OffersProps {
  businessProfileId?: string;
  authToken: string;
  onTokenRefreshed?: (newToken: string) => void;
  onOffersChanged?: () => void;
}

const OffersComponent: React.FC<OffersProps> = ({
  businessProfileId,
  authToken,
  onTokenRefreshed,
  onOffersChanged
}) => {
  const { t } = useTranslation();

  const [offers, setOffers] = useState<Offer[]>([]);
  const [filteredOffers, setFilteredOffers] = useState<Offer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);

  // AI Offer Generation states
  const [showAIGenerationModal, setShowAIGenerationModal] = useState(false);
  const [isAIGenerationLoading, setIsAIGenerationLoading] = useState(false);
  const [aiGenerationError, setAiGenerationError] = useState<string | null>(null);
  const [aiGenerationSuccess, setAiGenerationSuccess] = useState<string | null>(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Filter offers based on search query
  const filteredOffersMemo = useMemo(() => {
    if (!debouncedSearchQuery.trim()) {
      return offers;
    }

    const query = debouncedSearchQuery.toLowerCase();
    return offers.filter(offer =>
      offer.name?.toLowerCase().includes(query) ||
      offer.description?.toLowerCase().includes(query) ||
      offer.unit?.toLowerCase().includes(query) ||
      offer.type?.toLowerCase().includes(query)
    );
  }, [offers, debouncedSearchQuery]);

  useEffect(() => {
    setFilteredOffers(filteredOffersMemo);
  }, [filteredOffersMemo]);

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

  const fetchOffers = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await getOffers(authToken, businessProfileId || '');

      if (result.success && result.data) {
        setOffers(result.data);
      }
    } catch (error) {
      console.error('Error fetching offers:', error);
    } finally {
      setIsLoading(false);
    }
  }, [authToken, businessProfileId]);

  useEffect(() => {
    if (businessProfileId) {
      fetchOffers();
    }
  }, [fetchOffers, businessProfileId]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  const handleAddOffer = useCallback(() => {
    setEditingOffer(null);
    setShowOfferForm(true);
  }, []);

  const handleGenerateOffersWithAI = useCallback(() => {
    setShowAIGenerationModal(true);
    setAiGenerationError(null);
    setAiGenerationSuccess(null);
  }, []);

  const handleCloseAIGenerationModal = useCallback(() => {
    setShowAIGenerationModal(false);
    setAiGenerationError(null);
    setAiGenerationSuccess(null);
  }, []);

  const handleEditOffer = useCallback((offer: Offer) => {
    setEditingOffer(offer);
    setShowOfferForm(true);
  }, []);

  const handleDeleteOffer = useCallback(async (offerId: string) => {
    try {
      const result = await deleteOffer(offerId, authToken);

      if (result.success) {
        setOffers(prev => prev.filter(o => o.id !== offerId));
        if (onOffersChanged) onOffersChanged();
      } else {
        console.error('Failed to delete offer:', result.error);
      }
    } catch (error) {
      console.error('Error deleting offer:', error);
    } finally {
      setShowDeleteConfirm(null);
    }
  }, [authToken, onOffersChanged]);

  const handleOfferFormSubmit = useCallback(async (offerData: Partial<Offer>) => {
    try {
      if (!businessProfileId) {
        console.error('Business profile ID is required');
        alert('Please select a business profile first before adding offers.');
        return;
      }

      // Validate required fields for new offers
      if (!editingOffer) {
        if (!offerData.type || !offerData.name || !offerData.unit || offerData.price === undefined) {
          console.error('Missing required fields for new offer');
          alert('Please fill in all required fields.');
          return;
        }
      }

      let result;
      if (editingOffer && editingOffer.id) {
        // Update existing offer
        result = await updateOffer(editingOffer.id, offerData, authToken);
      } else {
        // Create new offer - cast to required type after validation
        const createData: Omit<Offer, 'id' | 'business_profile_id' | 'created_at' | 'updated_at'> = {
          type: offerData.type!,
          name: offerData.name!,
          description: offerData.description || '',
          unit: offerData.unit!,
          price: offerData.price!,
          status: offerData.status || 'draft'
        };
        result = await createOffer(businessProfileId, createData, authToken);
      }

      if (result.success) {
        setShowOfferForm(false);
        setEditingOffer(null);
        // Refresh the offers list
        fetchOffers();
        if (onOffersChanged) onOffersChanged();
      } else {
        console.error('Failed to save offer:', result.error);
      }
    } catch (error) {
      console.error('Error saving offer:', error);
    }
  }, [businessProfileId, editingOffer, authToken, onOffersChanged, fetchOffers]);

  const handleCancelForm = useCallback(() => {
    setShowOfferForm(false);
    setEditingOffer(null);
  }, []);

  const handleExecuteAIGeneration = useCallback(async () => {
    if (!businessProfileId) {
      setAiGenerationError('Business profile ID is required');
      return;
    }

    try {
      setIsAIGenerationLoading(true);
      setAiGenerationError(null);
      setAiGenerationSuccess(null);

      const result = await generateOffers(businessProfileId, authToken);

      if (result.success) {
        setAiGenerationSuccess('Offers generated successfully!');
        // Refresh offers list
        fetchOffers();
        if (onOffersChanged) onOffersChanged();
      } else {
        setAiGenerationError(result.error || 'Failed to generate offers');
      }
    } catch (error) {
      console.error('Error generating offers:', error);
      setAiGenerationError('An unexpected error occurred while generating offers');
    } finally {
      setIsAIGenerationLoading(false);
    }
  }, [businessProfileId, authToken, fetchOffers, onOffersChanged]);

  const truncateText = (text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(price);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    return type === 'product' ? Package : Settings;
  };

  // Skeleton loader component
  const OfferCardSkeleton = () => (
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
            <Package className="w-16 h-16 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {t('offers.noBusinessProfile.title', 'Wybierz profil biznesowy')}
            </h3>
            <p className="text-gray-600">
              {t('offers.noBusinessProfile.description', 'Aby zarządzać ofertami, najpierw wybierz profil biznesowy.')}
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
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-black text-gray-900 tracking-tight">
                  {t('offers.title', 'Oferty')}
                </h1>
                <p className="text-lg text-gray-600 font-medium mt-1">
                  {t('offers.subtitle', 'Zarządzaj katalogiem ofert i generuj AI-powered oferty')}
                </p>
              </div>
            </div>

            {/* Right - Available Count */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl px-4 py-3 border border-gray-200/60 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg">
                  <DollarSign className="w-4 h-4 text-white" />
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">
                    {isLoading ? (
                      <span className="inline-block w-8 h-5 bg-gray-200 rounded animate-pulse"></span>
                    ) : (
                      `${filteredOffers.length}`
                    )}
                  </p>
                  <p className="text-xs text-gray-500">{t('offers.available', 'Dostępnych ofert')}</p>
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
                    placeholder={t('offers.search.placeholder', 'Szukaj ofert...')}
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="w-full pl-12 pr-12 py-3 bg-transparent border-0 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 placeholder-gray-500 font-medium rounded-xl"
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
                onClick={handleGenerateOffersWithAI}
                className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
              >
                <Brain className="w-5 h-5" />
                <span>{t('offers.generateWithAI', 'Generuj z AI')}</span>
              </button>
              <button
                onClick={handleAddOffer}
                className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
              >
                <Plus className="w-5 h-5" />
                <span>{t('offers.addNew', 'Dodaj Ofertę')}</span>
              </button>
            </div>
          </div>

          {/* Search feedback */}
          <div className="min-h-[20px] mb-2">
            {searchQuery && !debouncedSearchQuery && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <div className="w-4 h-4 border-2 border-gray-300 border-t-purple-500 rounded-full animate-spin"></div>
                <span>{t('offers.searching', 'Szukam...')}</span>
              </div>
            )}

            {debouncedSearchQuery && filteredOffers.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-emerald-600">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                <span className="font-medium">
                  {t('offers.searchResults', 'Znaleziono {{count}} {{type}}', {
                    count: filteredOffers.length,
                    type: filteredOffers.length === 1 ? 'ofertę' : 'ofert'
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
              <OfferCardSkeleton key={index} />
            ))}
          </div>
        )}

        {!isLoading && filteredOffers.length === 0 && (
          <div className="text-center py-16">
            <div className="relative inline-block">
              <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-6 transform rotate-3">
                <Package className="w-12 h-12 text-gray-400" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                <Search className="w-4 h-4 text-white" />
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {searchQuery
                  ? t('offers.noSearchResults', 'Nie znaleziono ofert')
                  : t('offers.noOffers', 'Brak ofert')
                }
              </h3>
              <p className="text-gray-600 mb-8 leading-relaxed">
                {searchQuery
                  ? t('offers.tryDifferentSearch', 'Spróbuj dostosować swoje wyszukiwanie')
                  : t('offers.addFirst', 'Dodaj swoją pierwszą ofertę, aby rozpocząć zarządzanie katalogiem')
                }
              </p>
              {!searchQuery && (
                <div className="flex justify-center gap-4">
                  <button
                    onClick={handleAddOffer}
                    className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                  >
                    <Plus className="w-5 h-5" />
                    <span>{t('offers.createFirst', 'Utwórz Pierwszą Ofertę')}</span>
                  </button>
                  <button
                    onClick={handleGenerateOffersWithAI}
                    className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                  >
                    <Brain className="w-5 h-5" />
                    <span>{t('offers.generateWithAI', 'Generuj z AI')}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {!isLoading && filteredOffers.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {filteredOffers.map((offer) => {
              const TypeIcon = getTypeIcon(offer.type);
              
              return (
                <div
                  key={offer.id}
                  className="group relative bg-white rounded-2xl border border-gray-200/60 p-8 hover:shadow-2xl hover:shadow-purple-500/10 hover:border-purple-300/50 transition-all duration-500 overflow-hidden"
                >
                  {/* Background Effects */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white via-purple-50/30 to-blue-50/20 opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                  <div className="absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-br from-purple-400/10 to-blue-400/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-500"></div>

                  <div className="relative">
                    {/* Offer Header */}
                    <div className="flex items-start gap-4 mb-6">
                      <div className="relative">
                        <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl shadow-lg flex items-center justify-center group-hover:shadow-xl group-hover:scale-105 transition-all duration-300">
                          <TypeIcon className="w-8 h-8 text-white" />
                        </div>
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                          <DollarSign className="w-3 h-3 text-white" />
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-purple-700 transition-colors">
                          {debouncedSearchQuery
                            ? highlightSearchTerm(offer.name, debouncedSearchQuery)
                            : offer.name
                          }
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="capitalize">{offer.type}</span>
                          <span>•</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(offer.status)}`}>
                            {offer.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Offer Description */}
                    {offer.description && (
                      <div className="mb-8">
                        <div className="bg-gray-50/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-100 group-hover:bg-purple-50/50 group-hover:border-purple-200/50 transition-all duration-300">
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-white rounded-xl shadow-sm group-hover:shadow-md transition-all duration-300">
                              <Package className="w-5 h-5 text-gray-600 group-hover:text-purple-600 transition-colors" />
                            </div>
                            <div className="flex-1">
                              <h4 className="text-sm font-semibold text-gray-800 mb-2 uppercase tracking-wide">
                                {t('offers.description', 'Opis')}
                              </h4>
                              <p className="text-gray-700 leading-relaxed group-hover:text-gray-800 transition-colors">
                                {debouncedSearchQuery
                                  ? highlightSearchTerm(truncateText(offer.description, 120), debouncedSearchQuery)
                                  : truncateText(offer.description, 120)
                                }
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Offer Pricing */}
                    <div className="mb-8">
                      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 backdrop-blur-sm rounded-2xl p-6 border border-emerald-100 group-hover:from-emerald-100/50 group-hover:to-teal-100/50 group-hover:border-emerald-200/50 transition-all duration-300">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-white rounded-xl shadow-sm group-hover:shadow-md transition-all duration-300">
                              <DollarSign className="w-5 h-5 text-emerald-600 group-hover:text-emerald-700 transition-colors" />
                            </div>
                            <div>
                              <h4 className="text-sm font-semibold text-emerald-800 mb-1 uppercase tracking-wide">
                                {t('offers.pricing', 'Cena')}
                              </h4>
                              <p className="text-2xl font-bold text-emerald-700 group-hover:text-emerald-800 transition-colors">
                                {formatPrice(offer.price)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-emerald-600 font-medium">{t('offers.unit', 'Jednostka')}</p>
                            <p className="text-emerald-700 font-semibold">
                              {offer.unit.replace('_', ' ')}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Offer Footer */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200/60 group-hover:border-purple-200/60 transition-all duration-300">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {offer.created_at
                            ? new Date(offer.created_at).toLocaleDateString()
                            : t('offers.recent', 'Ostatnio')
                          }
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditOffer(offer)}
                          className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          title={t('offers.edit', 'Edytuj')}
                        >
                          <Edit className="w-4 h-4" />
                          <span className="hidden sm:inline">{t('offers.edit', 'Edytuj')}</span>
                        </button>
                        <button
                          onClick={() => offer.id && setShowDeleteConfirm(offer.id)}
                          className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title={t('offers.delete', 'Usuń')}
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="hidden sm:inline">{t('offers.delete', 'Usuń')}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
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
                    {t('offers.deleteConfirm.title', 'Potwierdź usunięcie')}
                  </h2>
                  <p className="text-gray-600">
                    {t('offers.deleteConfirm.message', 'Czy na pewno chcesz usunąć tę ofertę?')}
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
                {t('offers.cancel', 'Anuluj')}
              </button>
              <button
                onClick={() => handleDeleteOffer(showDeleteConfirm)}
                className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {t('offers.delete', 'Usuń')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Offer Form Modal */}
      {showOfferForm && (
        <OfferForm
          offer={editingOffer}
          onSave={handleOfferFormSubmit}
          onCancel={handleCancelForm}
          isLoading={false}
        />
      )}

      {/* AI Generation Modal */}
      {showAIGenerationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {t('offers.aiGeneration.title', 'Generowanie Ofert z AI')}
                  </h2>
                  <p className="text-gray-600">
                    {t('offers.aiGeneration.subtitle', 'Utwórz inteligentne oferty bazując na profilu biznesowym')}
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseAIGenerationModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="p-6">
              {/* Execute Button */}
              <div className="flex justify-center mb-6">
                <button
                  onClick={handleExecuteAIGeneration}
                  disabled={isAIGenerationLoading}
                  className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isAIGenerationLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {t('offers.aiGeneration.generating', 'Generuję oferty...')}
                    </>
                  ) : (
                    <>
                      <Brain className="w-5 h-5" />
                      {t('offers.aiGeneration.generateOffers', 'Generuj Oferty')}
                    </>
                  )}
                </button>
              </div>

              {/* Status Messages */}
              {aiGenerationError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                    <p className="text-red-800">{aiGenerationError}</p>
                  </div>
                </div>
              )}

              {aiGenerationSuccess && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <p className="text-green-800">{aiGenerationSuccess}</p>
                  </div>
                </div>
              )}

              {/* Empty State */}
              <div className="text-center py-12">
                <Brain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {t('offers.aiGeneration.ready', 'Gotowy do generowania')}
                </h3>
                <p className="text-gray-600">
                  {t('offers.aiGeneration.instruction', 'Kliknij przycisk powyżej, aby wygenerować oferty za pomocą AI bazując na profilu biznesowym.')}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OffersComponent;