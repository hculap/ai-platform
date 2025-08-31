import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, Plus, X, Package } from 'lucide-react';
import { Offer } from '../types';

interface OfferFormProps {
  offer?: Offer | null;
  onSave: (offerData: Partial<Offer>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const OfferForm: React.FC<OfferFormProps> = ({
  offer,
  onSave,
  onCancel,
  isLoading = false
}) => {
  const { t } = useTranslation();
  
  const [formData, setFormData] = useState({
    type: offer?.type || 'service',
    name: offer?.name || '',
    description: offer?.description || '',
    unit: offer?.unit || 'per_month',
    price: offer?.price || 0,
    status: offer?.status || 'draft'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (offer) {
      setFormData({
        type: offer.type,
        name: offer.name,
        description: offer.description || '',
        unit: offer.unit,
        price: offer.price,
        status: offer.status
      });
    }
  }, [offer]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = t('validation.required');
    }

    if (!formData.unit.trim()) {
      newErrors.unit = t('validation.required');
    }

    if (formData.price <= 0) {
      newErrors.price = t('validation.pricePositive');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onSave(formData);
    } catch (error) {
      console.error('Error saving offer:', error);
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const unitOptions = [
    { value: 'per_month', label: t('offers.units.perMonth') },
    { value: 'per_project', label: t('offers.units.perProject') },
    { value: 'per_hour', label: t('offers.units.perHour') },
    { value: 'per_item', label: t('offers.units.perItem') },
    { value: 'per_year', label: t('offers.units.perYear') },
    { value: 'per_session', label: t('offers.units.perSession') },
    { value: 'per_consultation', label: t('offers.units.perConsultation') }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl">
              {offer ? <Edit className="w-6 h-6 text-white" /> : <Plus className="w-6 h-6 text-white" />}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {offer ? t('offers.editOffer') : t('offers.createOffer')}
              </h2>
              <p className="text-gray-600">
                {offer 
                  ? t('offers.editSubtitle', 'Zaktualizuj szczegóły oferty')
                  : t('offers.createSubtitle', 'Dodaj nową ofertę do katalogu')
                }
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={isLoading}
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        <div className="flex-1 p-6 overflow-y-auto">

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Type Selection */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-100">
              <label className="block text-lg font-semibold text-gray-900 mb-4">
                {t('offers.type')} *
              </label>
              <div className="flex space-x-6">
                <label className="flex items-center cursor-pointer group">
                  <div className="relative">
                    <input
                      type="radio"
                      name="type"
                      value="service"
                      checked={formData.type === 'service'}
                      onChange={(e) => handleInputChange('type', e.target.value)}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded-full border-2 transition-all ${
                      formData.type === 'service'
                        ? 'border-blue-600 bg-blue-600'
                        : 'border-gray-300 group-hover:border-blue-400'
                    }`}>
                      {formData.type === 'service' && (
                        <div className="w-2 h-2 bg-white rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                      )}
                    </div>
                  </div>
                  <span className="ml-3 text-gray-700 font-medium group-hover:text-gray-900 transition-colors">
                    {t('offers.types.service')}
                  </span>
                </label>
                <label className="flex items-center cursor-pointer group">
                  <div className="relative">
                    <input
                      type="radio"
                      name="type"
                      value="product"
                      checked={formData.type === 'product'}
                      onChange={(e) => handleInputChange('type', e.target.value)}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded-full border-2 transition-all ${
                      formData.type === 'product'
                        ? 'border-purple-600 bg-purple-600'
                        : 'border-gray-300 group-hover:border-purple-400'
                    }`}>
                      {formData.type === 'product' && (
                        <div className="w-2 h-2 bg-white rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                      )}
                    </div>
                  </div>
                  <span className="ml-3 text-gray-700 font-medium group-hover:text-gray-900 transition-colors">
                    {t('offers.types.product')}
                  </span>
                </label>
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                {t('offers.name')} *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all ${
                  errors.name 
                    ? 'border-red-500 focus:border-red-500' 
                    : 'border-gray-200 focus:border-blue-500 hover:border-gray-300'
                }`}
                placeholder={t('offers.namePlaceholder')}
                maxLength={255}
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                  <Package className="w-4 h-4" />
                  {errors.name}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                {t('offers.description')}
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 hover:border-gray-300 transition-all"
                placeholder={t('offers.descriptionPlaceholder')}
                rows={4}
                maxLength={500}
              />
              <div className="flex justify-end mt-2">
                <p className={`text-xs font-medium ${
                  formData.description.length > 450 
                    ? 'text-orange-600' 
                    : 'text-gray-500'
                }`}>
                  {formData.description.length}/500
                </p>
              </div>
            </div>

            {/* Unit */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                {t('offers.unit')} *
              </label>
              <select
                value={formData.unit}
                onChange={(e) => handleInputChange('unit', e.target.value)}
                className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all appearance-none bg-white ${
                  errors.unit 
                    ? 'border-red-500 focus:border-red-500' 
                    : 'border-gray-200 focus:border-blue-500 hover:border-gray-300'
                }`}
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: 'right 0.5rem center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '1.5em 1.5em',
                  paddingRight: '2.5rem'
                }}
              >
                {unitOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.unit && (
                <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                  <Package className="w-4 h-4" />
                  {errors.unit}
                </p>
              )}
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                {t('offers.price')} (PLN) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all ${
                    errors.price 
                      ? 'border-red-500 focus:border-red-500' 
                      : 'border-gray-200 focus:border-blue-500 hover:border-gray-300'
                  }`}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                  <span className="text-gray-400 font-medium">PLN</span>
                </div>
              </div>
              {errors.price && (
                <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                  <Package className="w-4 h-4" />
                  {errors.price}
                </p>
              )}
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                {t('offers.status')}
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 hover:border-gray-300 transition-all appearance-none bg-white"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: 'right 0.5rem center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '1.5em 1.5em',
                  paddingRight: '2.5rem'
                }}
              >
                <option value="draft">{t('offers.statuses.draft')}</option>
                <option value="published">{t('offers.statuses.published')}</option>
                <option value="archived">{t('offers.statuses.archived')}</option>
              </select>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200 mt-8">
              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-3 text-gray-700 bg-white border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-gray-500/20"
                disabled={isLoading}
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    <span>{t('common.saving')}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    <span>{t('common.save')}</span>
                  </div>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default OfferForm;