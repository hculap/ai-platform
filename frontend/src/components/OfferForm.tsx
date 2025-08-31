import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            {offer ? t('offers.editOffer') : t('offers.createOffer')}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('offers.type')} *
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="type"
                    value="service"
                    checked={formData.type === 'service'}
                    onChange={(e) => handleInputChange('type', e.target.value)}
                    className="mr-2"
                  />
                  {t('offers.types.service')}
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="type"
                    value="product"
                    checked={formData.type === 'product'}
                    onChange={(e) => handleInputChange('type', e.target.value)}
                    className="mr-2"
                  />
                  {t('offers.types.product')}
                </label>
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('offers.name')} *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder={t('offers.namePlaceholder')}
                maxLength={255}
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('offers.description')}
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={t('offers.descriptionPlaceholder')}
                rows={3}
                maxLength={500}
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.description.length}/500
              </p>
            </div>

            {/* Unit */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('offers.unit')} *
              </label>
              <select
                value={formData.unit}
                onChange={(e) => handleInputChange('unit', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.unit ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                {unitOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.unit && (
                <p className="text-red-500 text-sm mt-1">{errors.unit}</p>
              )}
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('offers.price')} (PLN) *
              </label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.price ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0.00"
                min="0"
                step="0.01"
              />
              {errors.price && (
                <p className="text-red-500 text-sm mt-1">{errors.price}</p>
              )}
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('offers.status')}
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="draft">{t('offers.statuses.draft')}</option>
                <option value="published">{t('offers.statuses.published')}</option>
                <option value="archived">{t('offers.statuses.archived')}</option>
              </select>
            </div>

            {/* Form Actions */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
                disabled={isLoading}
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {t('common.saving')}
                  </div>
                ) : (
                  t('common.save')
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