import React from 'react';
import { useTranslation } from 'react-i18next';
import { User, Building2, BarChart3, Settings, LogOut } from 'lucide-react';
import { User as UserType } from '../types';

interface DashboardProps {
  user: UserType;
  onLogout?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg mr-3"></div>
              <h1 className="text-2xl font-bold text-gray-900">AI Platform</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-sm text-gray-600">
                <User className="w-4 h-4 mr-2" />
                {user.email}
              </div>
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="flex items-center px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  {t('dashboard.logout')}
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-fade-in">
          {/* Welcome Section */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {t('dashboard.welcome')}
            </h2>
            <p className="text-lg text-gray-600">
              {t('dashboard.welcomeDescription')}
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                  <Building2 className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{t('dashboard.stats.businessProfile')}</h3>
                  <p className="text-sm text-gray-600">{t('dashboard.stats.businessProfile.status')}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                  <BarChart3 className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{t('dashboard.stats.analytics')}</h3>
                  <p className="text-sm text-gray-600">{t('dashboard.stats.analytics.status')}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                  <Settings className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{t('dashboard.stats.settings')}</h3>
                  <p className="text-sm text-gray-600">{t('dashboard.stats.settings.status')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">{t('dashboard.activity.title')}</h3>
            </div>
            <div className="p-6">
              <div className="text-center py-12">
                <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h4 className="text-xl font-medium text-gray-900 mb-2">
                  {t('dashboard.activity.profileReady')}
                </h4>
                <p className="text-gray-600 max-w-md mx-auto">
                  {t('dashboard.activity.description')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
