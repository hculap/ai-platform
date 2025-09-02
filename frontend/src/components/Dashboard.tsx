import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import {
  User, Building2, Settings, LogOut, Search, Bell,
  Bot, Zap, FileText, Video, Target, TrendingUp, Megaphone,
  Users, Activity, Clock, CheckCircle, Plus, Menu, Package
} from 'lucide-react';
import { User as UserType } from '../types';
import { getAgentsCount, getBusinessProfilesCount, getInteractionsCount, getBusinessProfiles, updateBusinessProfile, getCompetitionsCount, getOffersCount, getCampaignsCount } from '../services/api';
import BusinessProfiles from './BusinessProfiles';
import Agents from './Agents';
import Competition from './Competition';
import Offers from './Offers';
import Campaigns from './Campaigns';

interface DashboardProps {
  user: UserType;
  authToken: string;
  onLogout?: () => void;
  onProfileCreated?: (refreshFn: () => Promise<void>) => void;
  onTokenRefreshed?: (newToken: string) => void;
}

interface BusinessProfile {
  id: string;
  name: string;
  website_url: string;
  is_active: boolean;
  created_at: string;
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

const Dashboard: React.FC<DashboardProps> = ({ user, authToken, onLogout, onProfileCreated, onTokenRefreshed }) => {
  const { t } = useTranslation();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Get current active section from URL
  const activeSection = location.pathname.split('/')[2] || 'overview';

  // Real data state
  const [agentsCount, setAgentsCount] = useState<number>(0);
  const [businessProfilesCount, setBusinessProfilesCount] = useState<number>(0);
  const [competitionsCount, setCompetitionsCount] = useState<number>(0);
  const [offersCount, setOffersCount] = useState<number>(0);
  const [campaignsCount, setCampaignsCount] = useState<number>(0);
  const [interactionsCount, setInteractionsCount] = useState<number>(0);
  const [isLoadingStats, setIsLoadingStats] = useState<boolean>(true);

  // Business profiles state
  const [businessProfiles, setBusinessProfiles] = useState<BusinessProfile[]>([]);
  const [selectedBusinessProfile, setSelectedBusinessProfile] = useState<BusinessProfile | null>(null);
  const [isLoadingProfiles, setIsLoadingProfiles] = useState<boolean>(true);

  // Function to update active profile (only one can be active at a time)
  const updateActiveProfile = useCallback(async (profileId: string) => {
    try {
      // First, get the current profile data
      const currentProfile = businessProfiles.find(p => p.id === profileId);
      if (!currentProfile) return;

      // Set this profile as active (backend will handle deactivating others)
      await updateBusinessProfile(profileId, {
        ...currentProfile,
        is_active: true
      }, authToken);


      // Update local state immediately
      setBusinessProfiles(prev => prev.map(p => ({
        ...p,
        is_active: p.id === profileId
      })));
      
      // Update selected profile
      setSelectedBusinessProfile(currentProfile);
    } catch (error) {
      console.error('Error updating active profile:', error);
    }
  }, [businessProfiles, authToken]);

  // Function to refresh business profiles (useCallback to prevent infinite loops)
  const refreshBusinessProfiles = useCallback(async () => {
    try {
      setIsLoadingProfiles(true);

      // Fetch business profiles count and list
      const profilesResult = await getBusinessProfilesCount(authToken);


      if (profilesResult.success && profilesResult.data !== undefined) {
        setBusinessProfilesCount(profilesResult.data);
      }

      // Fetch business profiles list
      const profilesListResult = await getBusinessProfiles(authToken);


      if (profilesListResult.success && profilesListResult.data) {
        setBusinessProfiles(profilesListResult.data);

        // Auto-select the active profile (there should be only one)
        const activeProfile = profilesListResult.data.find(p => p.is_active);
        if (activeProfile) {
          setSelectedBusinessProfile(activeProfile);
        }
        // If no active profile found, select the first one and make it active
        else if (profilesListResult.data.length > 0) {
          const firstProfile = profilesListResult.data[0];
          setSelectedBusinessProfile(firstProfile);
          // Make this profile active in the backend (without triggering refresh)
          try {
            await updateBusinessProfile(firstProfile.id, {
              ...firstProfile,
              is_active: true
            }, authToken);
          } catch (error) {
            console.error('Error setting first profile as active:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error refreshing business profiles:', error);
    } finally {
      setIsLoadingProfiles(false);
    }
  }, [authToken]);

  // Function to refresh competitions count
  const refreshCompetitionsCount = useCallback(async () => {
    try {
      const competitionsResult = await getCompetitionsCount(authToken, selectedBusinessProfile?.id);
      if (competitionsResult.success && competitionsResult.data !== undefined) {
        setCompetitionsCount(competitionsResult.data);
      }
    } catch (error) {
      console.error('Error refreshing competitions count:', error);
    }
  }, [authToken, selectedBusinessProfile?.id]);

  // Function to refresh offers count
  const refreshOffersCount = useCallback(async () => {
    try {
      const offersResult = await getOffersCount(authToken, selectedBusinessProfile?.id);
      if (offersResult.success && offersResult.data !== undefined) {
        setOffersCount(offersResult.data);
      }
    } catch (error) {
      console.error('Error refreshing offers count:', error);
    }
  }, [authToken, selectedBusinessProfile?.id]);

  // Function to refresh campaigns count
  const refreshCampaignsCount = useCallback(async () => {
    try {
      const campaignsResult = await getCampaignsCount(authToken, selectedBusinessProfile?.id);
      if (campaignsResult.success && campaignsResult.data !== undefined) {
        setCampaignsCount(campaignsResult.data);
      }
    } catch (error) {
      console.error('Error refreshing campaigns count:', error);
    }
  }, [authToken, selectedBusinessProfile?.id]);

  // Fetch real dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoadingStats(true);

        // Fetch agents count
        const agentsResult = await getAgentsCount(authToken);
        if (agentsResult.success && agentsResult.data !== undefined) {
          setAgentsCount(agentsResult.data);
        }

        // Fetch competitions count (will use selectedBusinessProfile?.id automatically)
        await refreshCompetitionsCount();

        // Fetch offers count (will use selectedBusinessProfile?.id automatically)
        await refreshOffersCount();

        // Fetch campaigns count (will use selectedBusinessProfile?.id automatically)
        await refreshCampaignsCount();

        // Fetch interactions count
        const interactionsResult = await getInteractionsCount(authToken);
        if (interactionsResult.success && interactionsResult.data !== undefined) {
          setInteractionsCount(interactionsResult.data);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoadingStats(false);
      }
    };

    fetchDashboardData();
  }, [authToken, refreshCompetitionsCount, refreshOffersCount, refreshCampaignsCount]);

  // Fetch business profiles separately
  useEffect(() => {
    refreshBusinessProfiles();
  }, [refreshBusinessProfiles]);

  // Call onProfileCreated when component mounts to register the refresh function
  useEffect(() => {
    if (onProfileCreated) {
      onProfileCreated(refreshBusinessProfiles);
    }
  }, [onProfileCreated, refreshBusinessProfiles]);

  // Refresh competitions count when component mounts or business profile changes
  useEffect(() => {
    refreshCompetitionsCount();
  }, [refreshCompetitionsCount]);

  // Refresh offers count when component mounts or business profile changes
  useEffect(() => {
    refreshOffersCount();
  }, [refreshOffersCount]);

  // Refresh campaigns count when component mounts or business profile changes
  useEffect(() => {
    refreshCampaignsCount();
  }, [refreshCampaignsCount]);

  // Also refresh competitions count when selectedBusinessProfile changes
  useEffect(() => {
    if (selectedBusinessProfile?.id) {
      refreshCompetitionsCount();
    }
  }, [selectedBusinessProfile?.id, authToken, refreshCompetitionsCount]);

  // Also refresh offers count when selectedBusinessProfile changes
  useEffect(() => {
    if (selectedBusinessProfile?.id) {
      refreshOffersCount();
    }
  }, [selectedBusinessProfile?.id, authToken, refreshOffersCount]);

  // Also refresh campaigns count when selectedBusinessProfile changes
  useEffect(() => {
    if (selectedBusinessProfile?.id) {
      refreshCampaignsCount();
    }
  }, [selectedBusinessProfile?.id, authToken, refreshCampaignsCount]);



  // Update navigation sections with current data
  const navigationSections: NavSection[] = [
    {
      id: 'ai-tools',
      title: t('dashboard.nav.aiTools'),
      items: [
        { id: 'agents', label: t('dashboard.nav.agents'), icon: Bot, count: agentsCount },
        { id: 'automations', label: t('dashboard.nav.automations'), icon: Zap, count: 12 },
        { id: 'prompts', label: t('dashboard.nav.prompts'), icon: FileText, count: 28 },
        { id: 'videos', label: t('dashboard.nav.videos'), icon: Video, count: 3 },
      ]
    },
    {
      id: 'business',
      title: t('dashboard.nav.business'),
      items: [
        { id: 'business-profiles', label: t('dashboard.nav.businessProfiles'), icon: Building2, count: businessProfilesCount },
        { id: 'competition', label: t('dashboard.nav.competition'), icon: Target, count: competitionsCount },
        { id: 'offers', label: t('dashboard.nav.offers'), icon: Package, count: offersCount },
        { id: 'campaigns', label: t('dashboard.nav.campaigns'), icon: TrendingUp, count: campaignsCount },
        { id: 'ads', label: t('dashboard.nav.ads'), icon: Megaphone, count: 15 },
      ]
    }
  ];

  const stats = [
    { id: 'agents', label: t('dashboard.stats.totalAgents'), value: isLoadingStats ? '...' : agentsCount.toString(), icon: Bot, bgColor: 'bg-blue-100', textColor: 'text-blue-600', trend: '+2 this week' },
    { id: 'automations', label: t('dashboard.stats.totalAutomations'), value: '12', icon: Zap, bgColor: 'bg-purple-100', textColor: 'text-purple-600', trend: '+3 this week' },
    { id: 'prompts', label: t('dashboard.stats.totalPrompts'), value: '28', icon: FileText, bgColor: 'bg-green-100', textColor: 'text-green-600', trend: '+8 this week' },
    { id: 'campaigns', label: t('dashboard.stats.activeCampaigns'), value: '4', icon: TrendingUp, bgColor: 'bg-orange-100', textColor: 'text-orange-600', trend: '2 running' },
    { id: 'users', label: t('dashboard.stats.totalUsers'), value: '156', icon: Users, bgColor: 'bg-indigo-100', textColor: 'text-indigo-600', trend: '+12 this month' },
    { id: 'activity', label: t('dashboard.stats.todayActivity'), value: isLoadingStats ? '...' : interactionsCount.toString(), icon: Activity, bgColor: 'bg-pink-100', textColor: 'text-pink-600', trend: '↑ 23% vs yesterday' },
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
                  <Link
                    key={item.id}
                    to={`/dashboard/${item.id}`}
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
                        {item.count !== undefined && item.count !== null && (
                          <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full">
                            {item.count}
                          </span>
                        )}
                      </>
                    )}
                  </Link>
                ))}
              </nav>
            </div>
          ))}

          {/* Bottom Navigation */}
          {!sidebarCollapsed && (
            <div className="mt-auto pt-4 border-t border-gray-200">
              <nav className="space-y-1 px-2">
                <Link
                  to="/dashboard/settings"
                  className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors"
                >
                  <Settings className="w-5 h-5 mr-3" />
                  {t('dashboard.nav.settings')}
                </Link>
                <Link
                  to="/dashboard/profile"
                  className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors"
                >
                  <User className="w-5 h-5 mr-3" />
                  {t('dashboard.nav.profile')}
                </Link>
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
                {isLoadingProfiles ? (
                  <div className="flex items-center space-x-2 px-4 py-2 bg-gray-50 rounded-lg">
                    <Building2 className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-900">Loading...</span>
                  </div>
                ) : businessProfiles.length > 0 ? (
                  <select
                    value={selectedBusinessProfile?.id || ''}
                    onChange={async (e) => {
                      const selectedProfile = businessProfiles.find(p => p.id === e.target.value);
                      if (selectedProfile) {
                        // Update the active profile in the backend
                        await updateActiveProfile(selectedProfile.id);
                      }
                    }}
                    className="flex items-center px-4 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border-0 focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer min-w-[200px]"
                  >
                    {businessProfiles.map((profile) => (
                      <option key={profile.id} value={profile.id}>
                        {profile.name || profile.website_url}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="flex items-center space-x-2 px-4 py-2 bg-gray-50 rounded-lg text-gray-500">
                    <Building2 className="w-4 h-4" />
                    <span className="text-sm font-medium">No business profiles</span>
                  </div>
                )}
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
            {/* Render different content based on routes */}
            <Routes>
              <Route path="business-profiles" element={
                <BusinessProfiles
                  authToken={authToken}
                  onCreateProfile={() => {
                    // For now, navigate back to URL input to create new profile
                    window.location.href = '/';
                  }}
                  onEditProfile={(profile) => {
                    // For now, show alert - can be enhanced later
                    alert(`Edit profile: ${profile.name}`);
                  }}
                  onTokenRefreshed={onTokenRefreshed}
                  onProfilesChanged={refreshBusinessProfiles}
                />
              } />
              
              <Route path="agents" element={
                <Agents
                  authToken={authToken}
                  onTokenRefreshed={onTokenRefreshed}
                  onNavigateToBusinessProfiles={() => window.location.href = '/dashboard/business-profiles'}
                  onProfileCreated={refreshBusinessProfiles}
                  onProfilesChanged={refreshBusinessProfiles}
                />
              } />
              
              <Route path="competition" element={
                <Competition
                  businessProfileId={selectedBusinessProfile?.id}
                  authToken={authToken}
                  onTokenRefreshed={onTokenRefreshed}
                  onCompetitionsChanged={refreshCompetitionsCount}
                />
              } />
              
              <Route path="offers" element={
                <Offers
                  businessProfileId={selectedBusinessProfile?.id}
                  authToken={authToken}
                  onTokenRefreshed={onTokenRefreshed}
                  onOffersChanged={refreshOffersCount}
                />
              } />
              
              <Route path="overview" element={
              <>
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
              </>
              } />
              
              {/* Default route - redirect to overview */}
              <Route path="" element={<Navigate to="overview" replace />} />
              
              {/* Placeholder routes for other sections */}
              <Route path="automations" element={<div className="text-center py-12"><p>{t('dashboard.sections.automations.comingSoon', 'Sekcja Automatyzacji już wkrótce')}</p></div>} />
              <Route path="prompts" element={<div className="text-center py-12"><p>{t('dashboard.sections.prompts.comingSoon', 'Sekcja Promptów już wkrótce')}</p></div>} />
              <Route path="campaigns" element={
                <Campaigns
                  businessProfileId={selectedBusinessProfile?.id}
                  authToken={authToken}
                  onTokenRefreshed={onTokenRefreshed}
                  onCampaignsChanged={refreshCampaignsCount}
                />
              } />
              <Route path="ads" element={<div className="text-center py-12"><p>{t('dashboard.sections.ads.comingSoon', 'Sekcja Reklam już wkrótce')}</p></div>} />
              <Route path="settings" element={<div className="text-center py-12"><p>{t('dashboard.sections.settings.comingSoon', 'Sekcja Ustawień już wkrótce')}</p></div>} />
              <Route path="profile" element={<div className="text-center py-12"><p>{t('dashboard.sections.profile.comingSoon', 'Sekcja Profilu już wkrótce')}</p></div>} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
