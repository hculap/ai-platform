import React, { useState, useEffect } from 'react';
import { FormData, BusinessProfile } from '../types';
import { createBusinessProfile } from '../services/api';
import { ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';

interface BusinessFormProps {
  initialData?: BusinessProfile | null;
  onReanalyze: () => void;
}

const BusinessForm: React.FC<BusinessFormProps> = ({ initialData, onReanalyze }) => {
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

      const result = await createBusinessProfile(profileData);
      
      if (result.success) {
        // Show success notification
        const successDiv = document.createElement('div');
        successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-4 rounded-xl shadow-lg z-50 animate-slide-up';
        successDiv.innerHTML = `
          <div class="flex items-center space-x-2">
            <div class="w-5 h-5">✓</div>
            <span>Business profile created successfully!</span>
          </div>
        `;
        document.body.appendChild(successDiv);
        setTimeout(() => successDiv.remove(), 5000);
      } else {
        throw new Error(result.error || 'Failed to create profile');
      }
    } catch (error) {
      console.error('Profile creation error:', error);
      
      // Show error notification
      const errorDiv = document.createElement('div');
      errorDiv.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-4 rounded-xl shadow-lg z-50 animate-slide-up';
      errorDiv.innerHTML = `
        <div class="flex items-center space-x-2">
          <div class="w-5 h-5">⚠</div>
          <span>Failed to create profile. Please try again.</span>
        </div>
      `;
      document.body.appendChild(errorDiv);
      setTimeout(() => errorDiv.remove(), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="px-6 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="animate-fade-in">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Business Profile</h2>
            <p className="text-lg text-gray-600">Review and refine your business information</p>
          </div>

          <form id="businessForm" onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="p-8">
              <div className="grid md:grid-cols-2 gap-8">
                {/* Company Name */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Company Name</label>
                  <input 
                    type="text" 
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:bg-white focus:outline-none transition-all duration-200"
                    placeholder="Your company name"
                  />
                </div>

                {/* Website URL */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Website URL</label>
                  <input 
                    type="url" 
                    name="formWebsiteUrl"
                    value={formData.formWebsiteUrl}
                    onChange={handleInputChange}
                    className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:bg-white focus:outline-none transition-all duration-200"
                    placeholder="https://example.com"
                    readOnly={!!initialData}
                  />
                </div>

                {/* Offer Description */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Offer Description</label>
                  <textarea 
                    name="offerDescription"
                    value={formData.offerDescription}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:bg-white focus:outline-none transition-all duration-200 resize-none"
                    placeholder="Describe what your business offers..."
                  />
                </div>

                {/* Target Customer */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Target Customer</label>
                  <textarea 
                    name="targetCustomer"
                    value={formData.targetCustomer}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:bg-white focus:outline-none transition-all duration-200 resize-none"
                    placeholder="Describe your ideal customer..."
                  />
                </div>

                {/* Problem Solved */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Problem Solved</label>
                  <textarea 
                    name="problemSolved"
                    value={formData.problemSolved}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:bg-white focus:outline-none transition-all duration-200 resize-none"
                    placeholder="What problems do you solve?"
                  />
                </div>

                {/* Customer Desires */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Customer Desires</label>
                  <textarea 
                    name="customerDesires"
                    value={formData.customerDesires}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:bg-white focus:outline-none transition-all duration-200 resize-none"
                    placeholder="What do your customers really want?"
                  />
                </div>

                {/* Brand Tone */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Brand Tone</label>
                  <input
                    type="text"
                    name="brandTone"
                    value={formData.brandTone}
                    onChange={handleInputChange}
                    placeholder="e.g., Professional, Friendly, Innovative..."
                    className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:bg-white focus:outline-none transition-all duration-200"
                  />
                </div>

                {/* Communication Language */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Communication Language</label>
                  <select 
                    name="communicationLanguage"
                    value={formData.communicationLanguage}
                    onChange={handleInputChange}
                    className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:bg-white focus:outline-none transition-all duration-200"
                  >
                    <option value="en">English</option>
                    <option value="pl">Polish</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between items-center pt-8 mt-8 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={onReanalyze}
                  className="flex items-center px-6 py-3 text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Re-analyze Website
                </button>
                
                <div className="flex space-x-4">
                  <button 
                    type="button"
                    className="px-8 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all duration-200"
                  >
                    Save as Draft
                  </button>
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {isSubmitting ? 'Creating...' : 'Create Business Profile'}
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
