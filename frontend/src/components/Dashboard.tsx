import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  User, Building2, BarChart3, Settings, LogOut, ChevronDown, Search, Bell, 
  Bot, Zap, FileText, Video, Target, TrendingUp, Megaphone, 
  Users, Activity, Clock, CheckCircle, Plus, Menu
} from 'lucide-react';
import { User as UserType } from '../types';

interface DashboardProps {
  user: UserType;
  onLogout?: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  count?: number;
}

interface NavSection {
  id: string;
  title: string;
  items: NavItem[];
}

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const { t } = useTranslation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [selectedBusinessProfile, setSelectedBusinessProfile] = useState('My Business');

  const navigationSections: NavSection[] = [
    {
      id: 'ai-tools',
      title: t('dashboard.nav.aiTools'),
      items: [
        { id: 'agents', label: t('dashboard.nav.agents'), icon: Bot, count: 5 },
        { id: 'automations', label: t('dashboard.nav.automations'), icon: Zap, count: 12 },
        { id: 'prompts', label: t('dashboard.nav.prompts'), icon: FileText, count: 28 },
        { id: 'videos', label: t('dashboard.nav.videos'), icon: Video, count: 3 },
      ]
    },
    {
      id: 'business',
      title: t('dashboard.nav.business'),
      items: [
        { id: 'business-profiles', label: t('dashboard.nav.businessProfiles'), icon: Building2, count: 1 },
        { id: 'competition', label: t('dashboard.nav.competition'), icon: Target, count: 7 },
        { id: 'campaigns', label: t('dashboard.nav.campaigns'), icon: TrendingUp, count: 4 },
        { id: 'ads', label: t('dashboard.nav.ads'), icon: Megaphone, count: 15 },
      ]
    }
  ];

  const stats = [
    { id: 'agents', label: t('dashboard.stats.totalAgents'), value: '5', icon: Bot, bgColor: 'bg-blue-100', textColor: 'text-blue-600', trend: '+2 this week' },
    { id: 'automations', label: t('dashboard.stats.totalAutomations'), value: '12', icon: Zap, bgColor: 'bg-purple-100', textColor: 'text-purple-600', trend: '+3 this week' },
    { id: 'prompts', label: t('dashboard.stats.totalPrompts'), value: '28', icon: FileText, bgColor: 'bg-green-100', textColor: 'text-green-600', trend: '+8 this week' },
    { id: 'campaigns', label: t('dashboard.stats.activeCampaigns'), value: '4', icon: TrendingUp, bgColor: 'bg-orange-100', textColor: 'text-orange-600', trend: '2 running' },
    { id: 'users', label: t('dashboard.stats.totalUsers'), value: '156', icon: Users, bgColor: 'bg-indigo-100', textColor: 'text-indigo-600', trend: '+12 this month' },
    { id: 'activity', label: t('dashboard.stats.todayActivity'), value: '89', icon: Activity, bgColor: 'bg-pink-100', textColor: 'text-pink-600', trend: '↑ 23% vs yesterday' },
  ];

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      {/* Sidebar */}
      <div className={`bg-white border-r border-gray-200 transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-64'}`}>
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
          {!sidebarCollapsed && (
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg mr-3"></div>
              <span className="text-lg font-bold text-gray-900">AI Platform</span>
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Menu className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-4">
          {navigationSections.map((section) => (
            <div key={section.id} className="mb-6">
              {!sidebarCollapsed && (
                <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  {section.title}
                </h3>
              )}
              <nav className="space-y-1 px-2">
                {section.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      activeSection === item.id
                        ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <item.icon className="w-5 h-5 mr-3 flex-shrink-0" />
                    {!sidebarCollapsed && (
                      <>
                        <span className="flex-1 text-left">{item.label}</span>
                        {item.count && (
                          <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full">
                            {item.count}
                          </span>
                        )}
                      </>
                    )}
                  </button>
                ))}
              </nav>
            </div>
          ))}

          {/* Bottom Navigation */}
          {!sidebarCollapsed && (
            <div className="mt-auto pt-4 border-t border-gray-200">
              <nav className="space-y-1 px-2">
                <button
                  onClick={() => setActiveSection('settings')}
                  className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors"
                >
                  <Settings className="w-5 h-5 mr-3" />
                  {t('dashboard.nav.settings')}
                </button>
                <button
                  onClick={() => setActiveSection('profile')}
                  className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors"
                >
                  <User className="w-5 h-5 mr-3" />
                  {t('dashboard.nav.profile')}
                </button>
              </nav>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">{t('dashboard.title')}</h1>
              
              {/* Business Profile Selector */}
              <div className="relative">
                <button
                  onClick={() => {}}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Building2 className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-900">{selectedBusinessProfile}</span>
                  <ChevronDown className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder={t('dashboard.search.placeholder')}
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Notifications */}
              <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative">
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
              </button>

              {/* User Menu */}
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">{user.email}</div>
                  <div className="text-xs text-gray-500">{t('dashboard.userRole.admin')}</div>
                </div>
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                {onLogout && (
                  <button
                    onClick={onLogout}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    title={t('dashboard.logout')}
                  >
                    <LogOut className="w-4 h-4 text-gray-600" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            {/* Welcome Section */}
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                {t('dashboard.welcome')}
              </h2>
              <p className="text-lg text-gray-600">
                {t('dashboard.welcomeDescription')}
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
              {stats.map((stat) => (
                <div key={stat.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-10 h-10 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                      <stat.icon className={`w-5 h-5 ${stat.textColor}`} />
                    </div>
                    <Plus className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-pointer" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</div>
                    <div className="text-sm font-medium text-gray-600 mb-2">{stat.label}</div>
                    <div className="text-xs text-gray-500">{stat.trend}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Actions & Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Quick Actions */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="p-6 border-b border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900">{t('dashboard.quickActions.title')}</h3>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-2 gap-4">
                    <button className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-left">
                      <Bot className="w-8 h-8 text-blue-600 mb-2" />
                      <div className="font-medium text-gray-900">{t('dashboard.quickActions.createAgent')}</div>
                      <div className="text-sm text-gray-600">{t('dashboard.quickActions.createAgentDesc')}</div>
                    </button>
                    <button className="p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors text-left">
                      <Zap className="w-8 h-8 text-purple-600 mb-2" />
                      <div className="font-medium text-gray-900">{t('dashboard.quickActions.createAutomation')}</div>
                      <div className="text-sm text-gray-600">{t('dashboard.quickActions.createAutomationDesc')}</div>
                    </button>
                    <button className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors text-left">
                      <TrendingUp className="w-8 h-8 text-green-600 mb-2" />
                      <div className="font-medium text-gray-900">{t('dashboard.quickActions.createCampaign')}</div>
                      <div className="text-sm text-gray-600">{t('dashboard.quickActions.createCampaignDesc')}</div>
                    </button>
                    <button className="p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors text-left">
                      <FileText className="w-8 h-8 text-orange-600 mb-2" />
                      <div className="font-medium text-gray-900">{t('dashboard.quickActions.createPrompt')}</div>
                      <div className="text-sm text-gray-600">{t('dashboard.quickActions.createPromptDesc')}</div>
                    </button>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="p-6 border-b border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900">{t('dashboard.activity.title')}</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">{t('dashboard.activity.profileCreated')}</div>
                        <div className="text-xs text-gray-500">{t('dashboard.activity.profileCreatedTime')}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <Bot className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">{t('dashboard.activity.agentsAvailable')}</div>
                        <div className="text-xs text-gray-500">{t('dashboard.activity.agentsAvailableTime')}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <Clock className="w-4 h-4 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">{t('dashboard.activity.systemReady')}</div>
                        <div className="text-xs text-gray-500">{t('dashboard.activity.systemReadyTime')}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
