import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Eye, EyeOff, LogIn, Mail, Lock } from 'lucide-react';

interface SignInFormData {
  email: string;
  password: string;
}

interface SignInFormProps {
  onBack: () => void;
  onSignIn: (email: string, password: string) => Promise<void>;
  isSubmitting?: boolean;
}

const SignInForm: React.FC<SignInFormProps> = ({ onBack, onSignIn, isSubmitting = false }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<SignInFormData>({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Partial<SignInFormData>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field when user starts typing
    if (errors[name as keyof SignInFormData]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<SignInFormData> = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = t('signin.validation.emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('signin.validation.emailInvalid');
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = t('signin.validation.passwordRequired');
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
      await onSignIn(formData.email, formData.password);
    } catch (error) {
      console.error('Sign in error:', error);
    }
  };

  return (
    <section className="px-6 py-12">
      <div className="max-w-md mx-auto">
        <div className="animate-fade-in">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <LogIn className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">{t('signin.title')}</h2>
            <p className="text-gray-600">{t('signin.description')}</p>
          </div>

          <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="p-8 space-y-6">
              {/* Email Field */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  <Mail className="w-4 h-4 inline mr-2" />
                  {t('signin.email')}
                </label>
                <input 
                  type="email" 
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-4 bg-gray-50 border rounded-xl focus:outline-none transition-all duration-200 ${
                    errors.email 
                      ? 'border-red-500 focus:border-red-500 focus:bg-red-50' 
                      : 'border-gray-200 focus:border-blue-500 focus:bg-white'
                  }`}
                  placeholder={t('signin.email.placeholder')}
                  autoComplete="email"
                  disabled={isSubmitting}
                />
                {errors.email && (
                  <p className="mt-2 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  <Lock className="w-4 h-4 inline mr-2" />
                  {t('signin.password')}
                </label>
                <div className="relative">
                  <input 
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-4 pr-12 bg-gray-50 border rounded-xl focus:outline-none transition-all duration-200 ${
                      errors.password 
                        ? 'border-red-500 focus:border-red-500 focus:bg-red-50' 
                        : 'border-gray-200 focus:border-blue-500 focus:bg-white'
                    }`}
                    placeholder={t('signin.password.placeholder')}
                    autoComplete="current-password"
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    disabled={isSubmitting}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-2 text-sm text-red-600">{errors.password}</p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between items-center pt-6 mt-8 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={onBack}
                  className="flex items-center px-6 py-3 text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
                  disabled={isSubmitting}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {t('signin.button.back')}
                </button>
                
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isSubmitting ? t('signin.button.signingIn') : t('signin.button.signIn')}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};

export default SignInForm;
