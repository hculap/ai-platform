import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Brain,
  Loader2,
  AlertCircle,
  CheckCircle,
  Package,
  Settings
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

interface OfferAssistantProps {
  businessProfileId?: string;
  authToken: string;
  onTokenRefreshed?: (newToken: string) => void;
  onOffersChanged?: () => void;
}

const OfferAssistantComponent: React.FC<OfferAssistantProps> = ({
  businessProfileId,
  authToken,
  onTokenRefreshed,
  onOffersChanged
}) => {
  const { t } = useTranslation();

  const [offers, setOffers] = useState<Offer[]>([]);
  const [filteredOffers, setFilteredOffers] = useState<Offer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [generateSuccess, setGenerateSuccess] = useState<string | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    show: boolean;
    offerId: string;
    offerName: string;
  }>({ show: false, offerId: '', offerName: '' });

  // Load offers
  const loadOffers = useCallback(async () => {
    if (!businessProfileId) return;

    try {
      setIsLoading(true);
      setError(null);

      const result = await getOffers(authToken, businessProfileId);
      
      if (result.success && result.data) {
        setOffers(result.data);
        setFilteredOffers(result.data);
      } else if (result.isTokenExpired) {
        // Handle token expiration
        if (onTokenRefreshed) {
          // This would be handled by the parent component
          setError('Session expired. Please refresh the page.');
        }
      } else {
        setError(result.error || 'Failed to load offers');
      }
    } catch (err) {
      setError('Failed to load offers');
    } finally {
      setIsLoading(false);
    }
  }, [businessProfileId, authToken, onTokenRefreshed]);

  // Filter offers
  useEffect(() => {
    let filtered = offers;

    if (searchTerm) {
      filtered = filtered.filter(offer =>
        offer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (offer.description && offer.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(offer => offer.status === selectedStatus);
    }

    if (selectedType !== 'all') {
      filtered = filtered.filter(offer => offer.type === selectedType);
    }

    setFilteredOffers(filtered);
  }, [offers, searchTerm, selectedStatus, selectedType]);

  // Load offers on mount
  useEffect(() => {
    loadOffers();
  }, [loadOffers]);

  // Generate offers with AI
  const handleGenerateOffers = async () => {
    if (!businessProfileId) return;

    try {
      setIsGenerating(true);
      setGenerateError(null);
      setGenerateSuccess(null);

      const result = await generateOffers(businessProfileId, authToken);
      
      if (result.success) {
        setGenerateSuccess('AI offers generated successfully!');
        // Reload offers
        await loadOffers();
        if (onOffersChanged) {
          onOffersChanged();
        }
      } else if (result.isTokenExpired) {
        setGenerateError('Session expired. Please refresh the page.');
      } else {
        setGenerateError(result.error || 'Failed to generate offers');
      }
    } catch (err) {
      setGenerateError('Failed to generate offers');
    } finally {
      setIsGenerating(false);
    }
  };

  // Show delete confirmation
  const showDeleteConfirmation = (offerId: string, offerName: string) => {
    setDeleteConfirmation({
      show: true,
      offerId,
      offerName
    });
  };

  // Delete offer
  const handleDeleteOffer = async () => {
    const { offerId } = deleteConfirmation;

    try {
      const result = await deleteOffer(offerId, authToken);
      
      if (result.success) {
        setOffers(offers.filter(o => o.id !== offerId));
        if (onOffersChanged) {
          onOffersChanged();
        }
        setDeleteConfirmation({ show: false, offerId: '', offerName: '' });
      } else {
        setError(result.error || 'Failed to delete offer');
      }
    } catch (err) {
      setError('Failed to delete offer');
    }
  };

  // Cancel delete confirmation
  const cancelDeleteConfirmation = () => {
    setDeleteConfirmation({ show: false, offerId: '', offerName: '' });
  };

  // Handle create offer from form
  const handleCreateOfferFromForm = async (offerData: Partial<Offer>) => {
    if (!businessProfileId) return;
    
    // Convert Partial<Offer> to the required type for createOffer API
    const createData = {
      type: offerData.type as 'product' | 'service',
      name: offerData.name!,
      description: offerData.description,
      unit: offerData.unit!,
      price: offerData.price!,
      status: offerData.status as 'draft' | 'published' | 'archived'
    };

    return handleCreateOffer(createData);
  };

  // Handle create offer
  const handleCreateOffer = async (offerData: Omit<Offer, 'id' | 'business_profile_id' | 'created_at' | 'updated_at'>) => {
    if (!businessProfileId) return;

    try {
      const result = await createOffer(businessProfileId, offerData, authToken);
      
      if (result.success) {
        await loadOffers();
        setShowCreateForm(false);
        if (onOffersChanged) {
          onOffersChanged();
        }
      } else {
        setError(result.error || 'Failed to create offer');
      }
    } catch (err) {
      setError('Failed to create offer');
    }
  };

  // Handle update offer
  const handleUpdateOffer = async (offerId: string, offerData: Partial<Omit<Offer, 'id' | 'business_profile_id' | 'created_at' | 'updated_at'>>) => {
    try {
      const result = await updateOffer(offerId, offerData, authToken);
      
      if (result.success) {
        await loadOffers();
        setEditingOffer(null);
        if (onOffersChanged) {
          onOffersChanged();
        }
      } else {
        setError(result.error || 'Failed to update offer');
      }
    } catch (err) {
      setError('Failed to update offer');
    }
  };

  // Get status badge color
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

  // Get type icon
  const getTypeIcon = (type: string) => {
    return type === 'product' ? Package : Settings;
  };

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(price);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading offers...</span>
      </div>
    );
  }

  if (!businessProfileId) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Please select a business profile to manage offers.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Brain className="h-8 w-8 text-blue-600 mr-3" />
              Offer Assistant
            </h1>
            <p className="text-gray-600 mt-2">
              Manage your offer catalog or generate AI-powered offers based on your business profile.
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Offer
            </button>
            <button
              onClick={handleGenerateOffers}
              disabled={isGenerating}
              className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Brain className="h-4 w-4 mr-2" />
              )}
              {isGenerating ? 'Generating...' : 'Generate with AI'}
            </button>
          </div>
        </div>

        {/* AI Generation Status */}
        {generateError && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
              <p className="text-red-700">{generateError}</p>
            </div>
          </div>
        )}

        {generateSuccess && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start">
              <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 mr-3 flex-shrink-0" />
              <p className="text-green-700">{generateSuccess}</p>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="mb-6 bg-white rounded-lg border p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search offers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Types</option>
            <option value="product">Products</option>
            <option value="service">Services</option>
          </select>

          <div className="text-sm text-gray-600 flex items-center">
            <span className="font-medium">{filteredOffers.length}</span>
            <span className="ml-1">of {offers.length} offers</span>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-red-700">{error}</p>
              <button
                onClick={() => setError(null)}
                className="mt-2 text-red-600 hover:text-red-800 text-sm font-medium"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Offers List */}
      {filteredOffers.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border">
          <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">No offers yet</h3>
          <p className="text-gray-600 mb-6">
            {offers.length === 0 
              ? 'Get started by creating your first offer or generating offers with AI.'
              : 'No offers match your current filters.'
            }
          </p>
          {offers.length === 0 && (
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => setShowCreateForm(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Offer
              </button>
              <button
                onClick={handleGenerateOffers}
                disabled={isGenerating}
                className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                <Brain className="h-4 w-4 mr-2" />
                Generate with AI
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Offer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOffers.map((offer) => {
                  const TypeIcon = getTypeIcon(offer.type);
                  
                  return (
                    <tr key={offer.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-start">
                          <TypeIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-3 flex-shrink-0" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {offer.name}
                            </div>
                            {offer.description && (
                              <div className="text-sm text-gray-500 mt-1">
                                {offer.description.length > 60 
                                  ? `${offer.description.substring(0, 60)}...`
                                  : offer.description
                                }
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="capitalize text-sm text-gray-900">
                          {offer.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatPrice(offer.price)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {offer.unit.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(offer.status)}`}>
                          {offer.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => setEditingOffer(offer)}
                            className="text-blue-600 hover:text-blue-800 p-1 rounded"
                            title="Edit offer"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => showDeleteConfirmation(offer.id, offer.name)}
                            className="text-red-600 hover:text-red-800 p-1 rounded"
                            title="Delete offer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Form Modal */}
      {showCreateForm && (
        <OfferForm
          onSave={handleCreateOfferFromForm}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {/* Edit Form Modal */}
      {editingOffer && (
        <OfferForm
          offer={editingOffer}
          onSave={(data: Partial<Offer>) => handleUpdateOffer(editingOffer.id, data)}
          onCancel={() => setEditingOffer(null)}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirmation.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {t('offers.deleteConfirm.title')}
              </h2>
              <p className="text-gray-600 mb-6">
                {t('offers.deleteConfirm.message')} "{deleteConfirmation.offerName}"?
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={cancelDeleteConfirmation}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  {t('offers.cancel')}
                </button>
                <button
                  onClick={handleDeleteOffer}
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  {t('offers.delete')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfferAssistantComponent;