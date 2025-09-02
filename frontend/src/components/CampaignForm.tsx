import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, DollarSign, Calendar, Package, AlertCircle } from 'lucide-react';
import { Campaign, CampaignGoal, Offer } from '../types';

interface CampaignFormProps {
  campaign?: Campaign;
  offers: Offer[];
  onSubmit: (campaignData: Omit<Campaign, 'id' | 'business_profile_id' | 'user_id' | 'created_at' | 'updated_at'>) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const CAMPAIGN_GOALS: CampaignGoal[] = [
  'Brand Awareness',
  'Lead Generation',
  'Sales / Conversions',
  'Product Launch',
  'Customer Retention & Loyalty',
  'Event Promotion',
  'Rebranding / Reputation Management',
  'Community Engagement'
];

const CampaignForm: React.FC<CampaignFormProps> = ({
  campaign,
  offers,
  onSubmit,
  onCancel,
  isSubmitting = false
}) => {
  const { t } = useTranslation();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    goal: campaign?.goal || 'Brand Awareness' as CampaignGoal,
    budget: campaign?.budget || undefined,
    deadline: campaign?.deadline || '',
    selected_products: campaign?.selected_products || [],
    status: campaign?.status || 'draft' as const,
    strategy_summary: campaign?.strategy_summary || '',
    timeline: campaign?.timeline || '',
    target_audience: campaign?.target_audience || '',
    sales_funnel_steps: campaign?.sales_funnel_steps || '',
    channels: campaign?.channels || {},
    channels_rationale: campaign?.channels_rationale || {},
    recommended_budget: campaign?.recommended_budget || undefined,
    risks_recommendations: campaign?.risks_recommendations || ''
  });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.goal) {
      newErrors.goal = 'Campaign goal is required';
    }

    if (formData.budget && formData.budget <= 0) {
      newErrors.budget = 'Budget must be positive';
    }

    if (formData.deadline) {
      const deadlineDate = new Date(formData.deadline);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (deadlineDate <= today) {
        newErrors.deadline = 'Deadline must be in the future';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    onSubmit({
      goal: formData.goal,
      budget: formData.budget,
      deadline: formData.deadline || undefined,
      selected_products: formData.selected_products,
      strategy_summary: formData.strategy_summary,
      timeline: formData.timeline,
      target_audience: formData.target_audience,
      sales_funnel_steps: formData.sales_funnel_steps,
      channels: formData.channels,
      channels_rationale: formData.channels_rationale,
      recommended_budget: formData.recommended_budget,
      risks_recommendations: formData.risks_recommendations,
      status: formData.status
    });
  };

  const getGoalIcon = (goal: CampaignGoal) => {
    const iconMap: Record<CampaignGoal, string> = {
      'Brand Awareness': '🎯',
      'Lead Generation': '🔗',
      'Sales / Conversions': '💰',
      'Product Launch': '🚀',
      'Customer Retention & Loyalty': '❤️',
      'Event Promotion': '🎪',
      'Rebranding / Reputation Management': '✨',
      'Community Engagement': '👥'
    };
    return iconMap[goal] || '🎯';
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-6 border max-w-2xl shadow-lg rounded-md bg-white my-10">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">
            {campaign ? 'Edit Campaign' : 'Create Campaign'}
          </h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Campaign Goal */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Campaign Goal *</label>
            <select
              value={formData.goal}
              onChange={(e) => setFormData({ ...formData, goal: e.target.value as CampaignGoal })}
              className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                errors.goal ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              {CAMPAIGN_GOALS.map(goal => (
                <option key={goal} value={goal}>
                  {getGoalIcon(goal)} {goal}
                </option>
              ))}
            </select>
            {errors.goal && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.goal}
              </p>
            )}
          </div>

          {/* Budget */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Budget (optional)</label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <DollarSign className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.budget || ''}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value ? parseFloat(e.target.value) : undefined })}
                placeholder="Enter campaign budget"
                className={`block w-full pl-10 pr-3 py-2 border rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                  errors.budget ? 'border-red-300' : 'border-gray-300'
                }`}
              />
            </div>
            {errors.budget && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.budget}
              </p>
            )}
          </div>

          {/* Deadline */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Campaign Deadline (optional)</label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                className={`block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                  errors.deadline ? 'border-red-300' : 'border-gray-300'
                }`}
              />
            </div>
            {errors.deadline && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.deadline}
              </p>
            )}
          </div>

          {/* Products Selection */}
          {offers.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Package className="inline h-4 w-4 mr-1" />
                Selected Products/Services (optional)
              </label>
              <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-md p-3">
                {offers.map(offer => (
                  <label key={offer.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.selected_products.includes(offer.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            selected_products: [...formData.selected_products, offer.id]
                          });
                        } else {
                          setFormData({
                            ...formData,
                            selected_products: formData.selected_products.filter(id => id !== offer.id)
                          });
                        }
                      }}
                      className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      {offer.name} ({offer.type}) - ${offer.price}/{offer.unit}
                    </span>
                  </label>
                ))}
              </div>
              {formData.selected_products.length === 0 && (
                <p className="text-sm text-gray-500 mt-1">No products selected - strategy will be brand-level</p>
              )}
            </div>
          )}

          {/* Status */}
          {campaign && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'draft' | 'published' | 'archived' })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          )}

          {/* Strategy Summary (for editing existing campaigns) */}
          {campaign && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700">Strategy Summary</label>
                <textarea
                  value={formData.strategy_summary}
                  onChange={(e) => setFormData({ ...formData, strategy_summary: e.target.value })}
                  rows={4}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Enter strategy summary..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Timeline</label>
                <textarea
                  value={formData.timeline}
                  onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
                  rows={3}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Enter campaign timeline..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Target Audience</label>
                <textarea
                  value={formData.target_audience}
                  onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
                  rows={3}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Describe target audience..."
                />
              </div>
            </>
          )}

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {campaign ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                campaign ? 'Update Campaign' : 'Create Campaign'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CampaignForm;