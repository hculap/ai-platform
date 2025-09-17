import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import {
  User as UserIcon,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
  Edit3,
  Globe
} from 'lucide-react';
import { User } from '../types';
import { updateUserEmail, updateUserPassword } from '../services/api';

interface UserProfileProps {
  user: User;
  authToken: string;
  onTokenRefreshed?: (newToken: string) => void;
  onUserUpdated?: (updatedUser: User) => void;
}

const UserProfile: React.FC<UserProfileProps> = ({
  user,
  authToken,
  onTokenRefreshed,
  onUserUpdated
}) => {
  const { t } = useTranslation();

  // Form states
  const [emailForm, setEmailForm] = useState({
    newEmail: user.email,
    isEditing: false,
    isLoading: false,
    message: '',
    messageType: '' as 'success' | 'error' | ''
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    showCurrentPassword: false,
    showNewPassword: false,
    showConfirmPassword: false,
    isLoading: false,
    message: '',
    messageType: '' as 'success' | 'error' | ''
  });

  const [languageForm, setLanguageForm] = useState({
    selectedLanguage: i18n.language,
    message: '',
    messageType: '' as 'success' | 'error' | ''
  });

  // Email form handlers
  const handleEmailEdit = () => {
    setEmailForm(prev => ({ ...prev, isEditing: true, message: '', messageType: '' }));
  };

  const handleEmailCancel = () => {
    setEmailForm(prev => ({
      ...prev,
      isEditing: false,
      newEmail: user.email,
      message: '',
      messageType: ''
    }));
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (emailForm.newEmail === user.email) {
      setEmailForm(prev => ({ ...prev, isEditing: false }));
      return;
    }

    setEmailForm(prev => ({ ...prev, isLoading: true, message: '', messageType: '' }));

    try {
      const result = await updateUserEmail(emailForm.newEmail, authToken);

      if (result.success) {
        setEmailForm(prev => ({
          ...prev,
          isLoading: false,
          isEditing: false,
          message: t('profile.email.updateSuccess', 'Email updated successfully'),
          messageType: 'success'
        }));

        // Update user data
        if (onUserUpdated && result.data?.user) {
          onUserUpdated(result.data.user);
        }
      } else {
        setEmailForm(prev => ({
          ...prev,
          isLoading: false,
          message: result.error || t('profile.email.updateError', 'Failed to update email'),
          messageType: 'error'
        }));

        if (result.isTokenExpired && onTokenRefreshed) {
          onTokenRefreshed('');
        }
      }
    } catch (error) {
      setEmailForm(prev => ({
        ...prev,
        isLoading: false,
        message: t('profile.email.updateError', 'Failed to update email'),
        messageType: 'error'
      }));
    }
  };

  // Password form handlers
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordForm(prev => ({
        ...prev,
        message: t('profile.password.mismatch', 'New passwords do not match'),
        messageType: 'error'
      }));
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordForm(prev => ({
        ...prev,
        message: t('profile.password.tooShort', 'Password must be at least 6 characters long'),
        messageType: 'error'
      }));
      return;
    }

    setPasswordForm(prev => ({ ...prev, isLoading: true, message: '', messageType: '' }));

    try {
      const result = await updateUserPassword(
        passwordForm.currentPassword,
        passwordForm.newPassword,
        authToken
      );

      if (result.success) {
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
          showCurrentPassword: false,
          showNewPassword: false,
          showConfirmPassword: false,
          isLoading: false,
          message: t('profile.password.updateSuccess', 'Password updated successfully'),
          messageType: 'success'
        });
      } else {
        setPasswordForm(prev => ({
          ...prev,
          isLoading: false,
          message: result.error || t('profile.password.updateError', 'Failed to update password'),
          messageType: 'error'
        }));

        if (result.isTokenExpired && onTokenRefreshed) {
          onTokenRefreshed('');
        }
      }
    } catch (error) {
      setPasswordForm(prev => ({
        ...prev,
        isLoading: false,
        message: t('profile.password.updateError', 'Failed to update password'),
        messageType: 'error'
      }));
    }
  };

  // Language form handlers
  const handleLanguageChange = async (newLanguage: string) => {
    try {
      await i18n.changeLanguage(newLanguage);
      localStorage.setItem('i18nextLng', newLanguage);

      setLanguageForm({
        selectedLanguage: newLanguage,
        message: t('profile.language.updateSuccess', 'Język został zmieniony'),
        messageType: 'success'
      });

      // Clear message after 3 seconds
      setTimeout(() => {
        setLanguageForm(prev => ({ ...prev, message: '', messageType: '' }));
      }, 3000);
    } catch (error) {
      setLanguageForm(prev => ({
        ...prev,
        message: t('profile.language.updateError', 'Nie udało się zmienić języka'),
        messageType: 'error'
      }));
    }
  };

  return (
    <div className="space-y-8">
      {/* Enhanced Header Panel */}
      <div className="relative bg-white rounded-xl border border-gray-200 p-6 shadow-sm overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-white to-purple-50/30"></div>
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-2xl"></div>
        <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-to-tr from-purple-400/10 to-blue-400/10 rounded-full blur-3xl"></div>

        {/* Content with relative positioning */}
        <div className="relative p-8">
          {/* Header Section - Title and User Info */}
          <div className="flex justify-between items-center mb-8">
            {/* Left - Title and Icon */}
            <div className="flex items-center gap-4">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg">
                <UserIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-black text-gray-900 tracking-tight">
                  {t('profile.title', 'Profil użytkownika')}
                </h1>
                <p className="text-lg text-gray-600 font-medium mt-1">
                  {t('profile.subtitle', 'Zarządzaj swoimi danymi konta')}
                </p>
              </div>
            </div>

            {/* Right - User Info */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl px-4 py-3 border border-gray-200/60 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{user.email}</p>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('profile.memberSince', 'Członek od')} {new Date(user.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Email Settings */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <Mail className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">{t('profile.email.title', 'Adres email')}</h2>
        </div>

        <form onSubmit={handleEmailSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('profile.email.current', 'Bieżący adres email')}
            </label>

            {emailForm.isEditing ? (
              <div className="flex gap-3">
                <input
                  type="email"
                  value={emailForm.newEmail}
                  onChange={(e) => setEmailForm(prev => ({ ...prev, newEmail: e.target.value }))}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <button
                  type="submit"
                  disabled={emailForm.isLoading}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50"
                >
                  {emailForm.isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {emailForm.isLoading ? t('profile.saving', 'Zapisywanie...') : t('profile.save', 'Zapisz')}
                </button>
                <button
                  type="button"
                  onClick={handleEmailCancel}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {t('profile.cancel', 'Anuluj')}
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="text-gray-900 font-medium">{user.email}</span>
                <button
                  type="button"
                  onClick={handleEmailEdit}
                  className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:text-blue-700 font-medium"
                >
                  <Edit3 className="w-4 h-4" />
                  {t('profile.edit', 'Edytuj')}
                </button>
              </div>
            )}
          </div>

          {emailForm.message && (
            <div className={`flex items-center gap-2 p-4 rounded-lg ${
              emailForm.messageType === 'success'
                ? 'bg-green-50 text-green-800'
                : 'bg-red-50 text-red-800'
            }`}>
              {emailForm.messageType === 'success' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              <span>{emailForm.message}</span>
            </div>
          )}
        </form>
      </div>

      {/* Password Settings */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <Lock className="w-5 h-5 text-purple-600" />
          <h2 className="text-xl font-semibold text-gray-900">{t('profile.password.title', 'Hasło')}</h2>
        </div>

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('profile.password.current', 'Obecne hasło')}
            </label>
            <div className="relative">
              <input
                type={passwordForm.showCurrentPassword ? 'text' : 'password'}
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
              <button
                type="button"
                onClick={() => setPasswordForm(prev => ({ ...prev, showCurrentPassword: !prev.showCurrentPassword }))}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {passwordForm.showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('profile.password.new', 'Nowe hasło')}
            </label>
            <div className="relative">
              <input
                type={passwordForm.showNewPassword ? 'text' : 'password'}
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setPasswordForm(prev => ({ ...prev, showNewPassword: !prev.showNewPassword }))}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {passwordForm.showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('profile.password.confirm', 'Potwierdź nowe hasło')}
            </label>
            <div className="relative">
              <input
                type={passwordForm.showConfirmPassword ? 'text' : 'password'}
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setPasswordForm(prev => ({ ...prev, showConfirmPassword: !prev.showConfirmPassword }))}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {passwordForm.showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={passwordForm.isLoading || !passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {passwordForm.isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Lock className="w-5 h-5" />
            )}
            {passwordForm.isLoading ? t('profile.updating', 'Aktualizowanie...') : t('profile.password.update', 'Zmień hasło')}
          </button>

          {passwordForm.message && (
            <div className={`flex items-center gap-2 p-4 rounded-lg ${
              passwordForm.messageType === 'success'
                ? 'bg-green-50 text-green-800'
                : 'bg-red-50 text-red-800'
            }`}>
              {passwordForm.messageType === 'success' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              <span>{passwordForm.message}</span>
            </div>
          )}
        </form>
      </div>

      {/* Language Settings */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <Globe className="w-5 h-5 text-emerald-600" />
          <h2 className="text-xl font-semibold text-gray-900">{t('profile.language.title', 'Język interfejsu')}</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              {t('profile.language.select', 'Wybierz język')}
            </label>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleLanguageChange('pl')}
                className={`flex items-center justify-center gap-3 p-4 rounded-lg border-2 transition-all duration-200 ${
                  languageForm.selectedLanguage === 'pl'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <span className="text-2xl">🇵🇱</span>
                <div className="text-left">
                  <div className="font-semibold">Polski</div>
                  <div className="text-sm opacity-70">Polish</div>
                </div>
                {languageForm.selectedLanguage === 'pl' && (
                  <CheckCircle className="w-5 h-5 text-emerald-600 ml-auto" />
                )}
              </button>

              <button
                type="button"
                onClick={() => handleLanguageChange('en')}
                className={`flex items-center justify-center gap-3 p-4 rounded-lg border-2 transition-all duration-200 ${
                  languageForm.selectedLanguage === 'en'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <span className="text-2xl">🇺🇸</span>
                <div className="text-left">
                  <div className="font-semibold">English</div>
                  <div className="text-sm opacity-70">Angielski</div>
                </div>
                {languageForm.selectedLanguage === 'en' && (
                  <CheckCircle className="w-5 h-5 text-emerald-600 ml-auto" />
                )}
              </button>
            </div>
          </div>

          {languageForm.message && (
            <div className={`flex items-center gap-2 p-4 rounded-lg ${
              languageForm.messageType === 'success'
                ? 'bg-green-50 text-green-800'
                : 'bg-red-50 text-red-800'
            }`}>
              {languageForm.messageType === 'success' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              <span>{languageForm.message}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;