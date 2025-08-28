import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Target, Award, Globe, FileText, Save, Loader2 } from 'lucide-react';
import { type Competition } from '../services/api';

interface CompetitionFormProps {
  initialData?: Competition | null;
  onSubmit: (data: Omit<Competition, 'id' | 'created_at' | 'updated_at'>) => void;
  onCancel: () => void;
}

const CompetitionForm: React.FC<CompetitionFormProps> = ({
  initialData,
  onSubmit,
  onCancel
}) => {
  const { t } = useTranslation();

  const [formData, setFormData] = useState<Omit<Competition, 'id' | 'created_at' | 'updated_at'>>({
    name: '',
    url: '',
    description: '',
    usp: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  // Initialize form data if editing
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        url: initialData.url || '',
        description: initialData.description || '',
        usp: initialData.usp || ''
      });
    } else {
      // Reset form for new competition
      setFormData({
        name: '',
        url: '',
        description: '',
        usp: ''
      });
    }
  }, [initialData]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.name.trim()) {
      newErrors.name = t('competitions.form.errors.nameRequired', 'Nazwa konkurenta jest wymagana');
    }

    if (!formData.url?.trim()) {
      newErrors.url = t('competitions.form.errors.urlRequired', 'URL jest wymagany');
    } else {
      // Require URL to start with http:// or https://
      if (!formData.url.match(/^https?:\/\//)) {
        newErrors.url = t('competitions.form.errors.urlInvalid', 'URL musi zaczynać się od http:// lub https://');
      }
    }

    if (!formData.description?.trim()) {
      newErrors.description = t('competitions.form.errors.descriptionRequired', 'Opis jest wymagany');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting competition form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Competition Name */}
      <div className="space-y-3">
        <label className="flex items-center gap-3 text-lg font-semibold text-gray-900">
          <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
            <Target className="w-5 h-5 text-white" />
          </div>
          {t('competitions.form.name', 'Nazwa Konkurenta')}
          <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder={t('competitions.form.namePlaceholder', 'np. Acme Widget Company')}
            className={`w-full px-4 py-3 bg-gray-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${
              errors.name ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
            }`}
            disabled={isSubmitting}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
              <span className="text-red-500">⚠️</span>
              {errors.name}
            </p>
          )}
        </div>
      </div>

      {/* Competition URL */}
      <div className="space-y-3">
        <label className="flex items-center gap-3 text-lg font-semibold text-gray-900">
          <div className="p-2 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-lg">
            <Globe className="w-5 h-5 text-white" />
          </div>
          {t('competitions.form.url', 'Strona Internetowa')}
          <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            type="url"
            value={formData.url}
            onChange={(e) => handleInputChange('url', e.target.value)}
            placeholder={t('competitions.form.urlPlaceholder', 'https://example.com')}
            className={`w-full px-4 py-3 bg-gray-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${
              errors.url ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
            }`}
            disabled={isSubmitting}
          />
          {errors.url && (
            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
              <span className="text-red-500">⚠️</span>
              {errors.url}
            </p>
          )}
        </div>
      </div>

      {/* Competition Description */}
      <div className="space-y-3">
        <label className="flex items-center gap-3 text-lg font-semibold text-gray-900">
          <div className="p-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg">
            <FileText className="w-5 h-5 text-white" />
          </div>
          {t('competitions.form.description', 'Opis')}
          <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <textarea
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder={t('competitions.form.descriptionPlaceholder', 'Opisz działalność konkurenta, jego produkty i pozycję na rynku...')}
            rows={4}
            className={`w-full px-4 py-3 bg-gray-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 resize-none ${
              errors.description ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
            }`}
            disabled={isSubmitting}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
              <span className="text-red-500">⚠️</span>
              {errors.description}
            </p>
          )}
          <div className="mt-2 text-xs text-gray-500 flex justify-between">
            <span>
              {t('competitions.form.descriptionHelp', 'Opisz działalność konkurenta i jego pozycję na rynku')}
            </span>
            <span className={`${formData.description?.length || 0 > 500 ? 'text-red-500' : 'text-gray-400'}`}>
              {(formData.description?.length || 0)} / 500
            </span>
          </div>
        </div>
      </div>

      {/* Competition USP */}
      <div className="space-y-3">
        <label className="flex items-center gap-3 text-lg font-semibold text-gray-900">
          <div className="p-2 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-lg">
            <Award className="w-5 h-5 text-white" />
          </div>
          {t('competitions.form.usp', 'Unikalna Wartość (USP)')}
        </label>
        <div className="relative">
          <textarea
            value={formData.usp}
            onChange={(e) => handleInputChange('usp', e.target.value)}
            placeholder={t('competitions.form.uspPlaceholder', 'Co wyróżnia tego konkurenta? Jakie są jego największe atuty?...')}
            rows={3}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-gray-300 transition-all duration-200 resize-none"
            disabled={isSubmitting}
          />
          <div className="mt-2 text-xs text-gray-500 flex justify-between">
            <span>
              {t('competitions.form.uspHelp', 'Opisz, co wyróżnia tego konkurenta od innych')}
            </span>
            <span className={`text-gray-400`}>
              {(formData.usp?.length || 0)} / 300
            </span>
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-6 py-3 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {t('competitions.form.cancel', 'Anuluj')}
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {t('competitions.form.saving', 'Zapisywanie...')}
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              {initialData
                ? t('competitions.form.update', 'Zaktualizuj Konkurenta')
                : t('competitions.form.create', 'Utwórz Konkurenta')
              }
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default CompetitionForm;
