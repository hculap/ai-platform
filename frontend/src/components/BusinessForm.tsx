import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FormData, BusinessProfile } from '../types';
import { ArrowLeft } from 'lucide-react';

interface BusinessFormProps {
  initialData?: BusinessProfile | null;
  onReanalyze: () => void;
  onAcceptProfile: (profileData: BusinessProfile) => void;
  isAgentAnalysis?: boolean;
}

export type { BusinessFormProps };

const BusinessForm: React.FC<BusinessFormProps> = ({ initialData, onReanalyze, onAcceptProfile, isAgentAnalysis = false }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<FormData>({
    companyName: '',
    formWebsiteUrl: '',
    offerDescription: '',
    targetCustomer: '',
    problemSolved: '',
    customerDesires: '',
    brandTone: '',
    communicationLanguage: 'en'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fill form with analysis data
  useEffect(() => {
    if (initialData) {
      setFormData({
        companyName: initialData.company_name || '',
        formWebsiteUrl: initialData.website_url || '',
        offerDescription: initialData.offer || '',
        targetCustomer: initialData.target_customer || '',
        problemSolved: initialData.problems || '',
        customerDesires: initialData.desires || '',
        brandTone: initialData.tone || '',
        communicationLanguage: initialData.language || 'en'
      });

      // Add animation effect
      setTimeout(() => {
        const formFields = document.querySelectorAll('#businessForm input, #businessForm textarea, #businessForm select');
        formFields.forEach((field, index) => {
          setTimeout(() => {
            field.classList.add('animate-pulse');
            setTimeout(() => field.classList.remove('animate-pulse'), 500);
          }, index * 50);
        });
      }, 100);
    }
  }, [initialData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const profileData: BusinessProfile = {
        company_name: formData.companyName,
        website_url: formData.formWebsiteUrl,
        offer: formData.offerDescription,
        target_customer: formData.targetCustomer,
        problems: formData.problemSolved,
        desires: formData.customerDesires,
        tone: formData.brandTone,
        language: formData.communicationLanguage
      };

      // Store profile data and proceed to signup
      onAcceptProfile(profileData);
      
    } catch (error) {
      console.error('Profile validation error:', error);
      
      // Show error notification
      const errorDiv = document.createElement('div');
      errorDiv.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-4 rounded-xl shadow-lg z-50 animate-slide-up';
      errorDiv.innerHTML = `
        <div class="flex items-center space-x-2">
          <div class="w-5 h-5">⚠</div>
          <span>Please check your profile information</span>
        </div>
      `;
      document.body.appendChild(errorDiv);
      setTimeout(() => errorDiv.remove(), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className={isAgentAnalysis ? 'px-4 py-6 sm:px-6' : 'px-4 py-10 sm:px-6 sm:py-12'}>
      <div className="mx-auto max-w-4xl">
        <div className="animate-fade-in">
          {!isAgentAnalysis && (
            <div className="text-center mb-12">
              <h2 className="mb-4 text-3xl font-bold text-gray-900 sm:text-4xl">{t('form.title')}</h2>
              <p className="text-base text-gray-600 sm:text-lg">{t('form.description')}</p>
            </div>
          )}

          <form id="businessForm" onSubmit={handleSubmit} className={isAgentAnalysis ? 'bg-transparent' : 'overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-xl'}>
            <div className={isAgentAnalysis ? 'space-y-8' : 'space-y-8 p-6 sm:p-8'}>
              <div className="grid gap-6 md:grid-cols-2 md:gap-8">
                {/* Company Name */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">{t('form.companyName')}</label>
                  <input 
                    type="text" 
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 transition-all duration-200 focus:border-blue-500 focus:bg-white focus:outline-none sm:py-4"
                    placeholder={t('form.companyName.placeholder')}
                  />
                </div>

                {/* Website URL */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">{t('form.websiteUrl')}</label>
                  <input 
                    type="url" 
                    name="formWebsiteUrl"
                    value={formData.formWebsiteUrl}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 transition-all duration-200 focus:border-blue-500 focus:bg-white focus:outline-none sm:py-4"
                    placeholder={t('form.websiteUrl.placeholder')}
                    readOnly={!!initialData}
                  />
                </div>

                {/* Offer Description */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">{t('form.offerDescription')}</label>
                  <textarea 
                    name="offerDescription"
                    value={formData.offerDescription}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 transition-all duration-200 focus:border-blue-500 focus:bg-white focus:outline-none sm:py-4"
                    placeholder={t('form.offerDescription.placeholder')}
                  />
                </div>

                {/* Target Customer */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">{t('form.targetCustomer')}</label>
                  <textarea 
                    name="targetCustomer"
                    value={formData.targetCustomer}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 transition-all duration-200 focus:border-blue-500 focus:bg-white focus:outline-none sm:py-4"
                    placeholder={t('form.targetCustomer.placeholder')}
                  />
                </div>

                {/* Problem Solved */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">{t('form.problemSolved')}</label>
                  <textarea 
                    name="problemSolved"
                    value={formData.problemSolved}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 transition-all duration-200 focus:border-blue-500 focus:bg-white focus:outline-none sm:py-4"
                    placeholder={t('form.problemSolved.placeholder')}
                  />
                </div>

                {/* Customer Desires */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">{t('form.customerDesires')}</label>
                  <textarea 
                    name="customerDesires"
                    value={formData.customerDesires}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 transition-all duration-200 focus:border-blue-500 focus:bg-white focus:outline-none sm:py-4"
                    placeholder={t('form.customerDesires.placeholder')}
                  />
                </div>

                {/* Brand Tone */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">{t('form.brandTone')}</label>
                  <input
                    type="text"
                    name="brandTone"
                    value={formData.brandTone}
                    onChange={handleInputChange}
                    placeholder={t('form.brandTone.placeholder')}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 transition-all duration-200 focus:border-blue-500 focus:bg-white focus:outline-none sm:py-4"
                  />
                </div>

                {/* Communication Language */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">{t('form.communicationLanguage')}</label>
                  <input
                    type="text"
                    name="communicationLanguage"
                    value={formData.communicationLanguage}
                    onChange={handleInputChange}
                    placeholder={t('form.communicationLanguage.placeholder')}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 transition-all duration-200 focus:border-blue-500 focus:bg-white focus:outline-none sm:py-4"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className={`mt-8 flex flex-col gap-4 border-t border-gray-100 pt-8 sm:flex-row sm:items-center sm:justify-between ${isAgentAnalysis ? 'sm:justify-end' : ''}`}>
                {!isAgentAnalysis && (
                  <button
                    type="button"
                    onClick={onReanalyze}
                    className="inline-flex items-center justify-center rounded-xl px-6 py-3 text-sm font-medium text-blue-600 transition-colors duration-200 hover:text-blue-700"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    {t('form.button.reanalyze')}
                  </button>
                )}

                <div className={`flex flex-col gap-3 sm:flex-row sm:items-center ${isAgentAnalysis ? '' : 'sm:gap-4'}`}>
                  {!isAgentAnalysis && (
                    <button
                      type="button"
                      className="rounded-xl bg-gray-100 px-8 py-3 text-sm font-semibold text-gray-700 transition-all duration-200 hover:bg-gray-200"
                    >
                      {t('form.button.saveAsDraft')}
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-3 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:from-blue-700 hover:to-purple-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50 sm:text-base"
                  >
                    {isSubmitting ? t('form.button.creating') : (isAgentAnalysis ? t('form.button.createProfile') : t('form.button.continueToSignup'))}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};

export default BusinessForm;
