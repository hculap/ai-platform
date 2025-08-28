import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Save, X, AlertCircle } from 'lucide-react';

interface BusinessProfile {
  id?: string;
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

interface BusinessProfileFormProps {
  profile?: BusinessProfile | null;
  onSave: (profileData: Omit<BusinessProfile, 'id'>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const BusinessProfileForm: React.FC<BusinessProfileFormProps> = ({
  profile,
  onSave,
  onCancel,
  isLoading = false
}) => {
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    name: '',
    website_url: '',
    offer_description: '',
    target_customer: '',
    problem_solved: '',
    customer_desires: '',
    brand_tone: '',
    communication_language: 'pl',
    is_active: true
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fill form with existing profile data when editing
  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        website_url: profile.website_url || '',
        offer_description: profile.offer_description || '',
        target_customer: profile.target_customer || '',
        problem_solved: profile.problem_solved || '',
        customer_desires: profile.customer_desires || '',
        brand_tone: profile.brand_tone || '',
        communication_language: profile.communication_language || 'pl',
        is_active: profile.is_active !== false
      });
    } else {
      // Reset form for new profile
      setFormData({
        name: '',
        website_url: '',
        offer_description: '',
        target_customer: '',
        problem_solved: '',
        customer_desires: '',
        brand_tone: '',
        communication_language: 'pl',
        is_active: true
      });
    }
  }, [profile]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = t('businessProfiles.form.nameRequired', 'Nazwa firmy jest wymagana');
    }

    if (!formData.website_url.trim()) {
      newErrors.website_url = t('businessProfiles.form.websiteRequired', 'Adres strony jest wymagany');
    } else {
      try {
        new URL(formData.website_url);
      } catch {
        newErrors.website_url = t('businessProfiles.form.websiteInvalid', 'Nieprawidłowy format adresu URL');
      }
    }

    if (!formData.offer_description.trim()) {
      newErrors.offer_description = t('businessProfiles.form.descriptionRequired', 'Opis oferty jest wymagany');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onSave({
        name: formData.name.trim(),
        website_url: formData.website_url.trim(),
        offer_description: formData.offer_description.trim(),
        target_customer: formData.target_customer.trim(),
        problem_solved: formData.problem_solved.trim(),
        customer_desires: formData.customer_desires.trim(),
        brand_tone: formData.brand_tone.trim(),
        communication_language: formData.communication_language,
        is_active: formData.is_active
      });
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <button
              onClick={onCancel}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {profile
                  ? t('businessProfiles.form.editTitle', 'Edytuj Profil Biznesowy')
                  : t('businessProfiles.form.createTitle', 'Utwórz Nowy Profil Biznesowy')
                }
              </h2>
              <p className="text-gray-600 mt-1">
                {profile
                  ? t('businessProfiles.form.editSubtitle', 'Zaktualizuj informacje o swoim profilu biznesowym')
                  : t('businessProfiles.form.createSubtitle', 'Dodaj nowy profil biznesowy do swojego konta')
                }
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 p-6 overflow-y-auto min-h-0">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Business Name */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t('businessProfiles.form.name', 'Nazwa Firmy')} *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                    errors.name
                      ? 'border-red-300 focus:ring-red-200'
                      : 'border-gray-300 focus:ring-blue-200 focus:border-blue-500'
                  }`}
                  placeholder={t('businessProfiles.form.namePlaceholder', 'np. Moja Firma Sp. z o.o.')}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.name}
                  </p>
                )}
              </div>

              {/* Website URL */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t('businessProfiles.form.website', 'Adres Strony Internetowej')} *
                </label>
                <input
                  type="url"
                  name="website_url"
                  value={formData.website_url}
                  onChange={handleInputChange}
                  disabled={!!profile} // Can't change URL when editing
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                    errors.website_url
                      ? 'border-red-300 focus:ring-red-200'
                      : 'border-gray-300 focus:ring-blue-200 focus:border-blue-500'
                  } ${profile ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                  placeholder="https://www.twojastrona.pl"
                />
                {errors.website_url && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.website_url}
                  </p>
                )}
                {profile && (
                  <p className="mt-1 text-xs text-gray-500">
                    {t('businessProfiles.form.websiteLocked', 'Adres strony nie może być zmieniony podczas edycji')}
                  </p>
                )}
              </div>

              {/* Offer Description */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t('businessProfiles.form.description', 'Opis Oferty')} *
                </label>
                <textarea
                  name="offer_description"
                  value={formData.offer_description}
                  onChange={handleInputChange}
                  rows={4}
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all resize-none ${
                    errors.offer_description
                      ? 'border-red-300 focus:ring-red-200'
                      : 'border-gray-300 focus:ring-blue-200 focus:border-blue-500'
                  }`}
                  placeholder={t('businessProfiles.form.descriptionPlaceholder', 'Opisz swoją ofertę, produkty lub usługi...')}
                />
                {errors.offer_description && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.offer_description}
                  </p>
                )}
              </div>

              {/* Target Customer */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t('businessProfiles.form.targetCustomer', 'Docelowi Klienci')}
                </label>
                <textarea
                  name="target_customer"
                  value={formData.target_customer}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-all resize-none"
                  placeholder={t('businessProfiles.form.targetCustomerPlaceholder', 'Kim są Twoi idealni klienci?')}
                />
              </div>

              {/* Problem Solved */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t('businessProfiles.form.problemSolved', 'Rozwiązywane Problemy')}
                </label>
                <textarea
                  name="problem_solved"
                  value={formData.problem_solved}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-all resize-none"
                  placeholder={t('businessProfiles.form.problemSolvedPlaceholder', 'Jakie problemy rozwiązujesz dla klientów?')}
                />
              </div>

              {/* Customer Desires */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t('businessProfiles.form.customerDesires', 'Potrzeby Klientów')}
                </label>
                <textarea
                  name="customer_desires"
                  value={formData.customer_desires}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-all resize-none"
                  placeholder={t('businessProfiles.form.customerDesiresPlaceholder', 'Czego pragną Twoi klienci?')}
                />
              </div>

              {/* Brand Tone */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t('businessProfiles.form.brandTone', 'Ton Marki')}
                </label>
                <input
                  type="text"
                  name="brand_tone"
                  value={formData.brand_tone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-all"
                  placeholder={t('businessProfiles.form.brandTonePlaceholder', 'np. Profesjonalny, Przyjazny, Innowacyjny')}
                />
              </div>

              {/* Communication Language */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t('businessProfiles.form.communicationLanguage', 'Język Komunikacji')}
                </label>
                <select
                  name="communication_language"
                  value={formData.communication_language}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-all"
                >
                  <option value="pl">Polski</option>
                  <option value="en">English</option>
                  <option value="de">Deutsch</option>
                  <option value="fr">Français</option>
                  <option value="es">Español</option>
                </select>
              </div>

              {/* Active Status - Hidden, will be managed by header selector */}
              <input
                type="hidden"
                name="is_active"
                value={formData.is_active ? 'true' : 'false'}
              />
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-4 p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 font-medium rounded-xl transition-colors"
          >
            {t('businessProfiles.cancel', 'Anuluj')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || isLoading}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {isSubmitting
              ? t('businessProfiles.form.saving', 'Zapisywanie...')
              : profile
                ? t('businessProfiles.form.update', 'Zaktualizuj')
                : t('businessProfiles.form.create', 'Utwórz')
            }
          </button>
        </div>
      </div>
    </div>
  );
};

export default BusinessProfileForm;
