import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import {
  User, Building2, Settings, LogOut, Search, Bell,
  Bot, Zap, FileText, Video, Target, TrendingUp, Megaphone,
  Users, Activity, Clock, CheckCircle, Plus, Menu, Package,
  Play, BookOpen, Lightbulb, ChevronLeft, ChevronRight, Check, X, Home
} from 'lucide-react';
import { User as UserType } from '../types';
import { getAgentsCount, getBusinessProfilesCount, getInteractionsCount, getBusinessProfiles, updateBusinessProfile, getCompetitionsCount, getOffersCount, getCampaignsCount, getAdsCount, getScriptsCount, getOffers, getCampaigns, getUserStyles } from '../services/api';
import BusinessProfiles from './BusinessProfiles';
import Agents from './Agents';
import Competition from './Competition';
import Offers from './Offers';
import Campaigns from './Campaigns';
import Ads from './Ads';
import Scripts from './Scripts';
import ScriptGenerator from './ScriptGenerator';

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
  const [adsCount, setAdsCount] = useState<number>(0);
  const [scriptsCount, setScriptsCount] = useState<number>(0);
  const [interactionsCount, setInteractionsCount] = useState<number>(0);
  const [isLoadingStats, setIsLoadingStats] = useState<boolean>(true);

  // Business profiles state
  const [businessProfiles, setBusinessProfiles] = useState<BusinessProfile[]>([]);
  const [selectedBusinessProfile, setSelectedBusinessProfile] = useState<BusinessProfile | null>(null);
  const [isLoadingProfiles, setIsLoadingProfiles] = useState<boolean>(true);

  // Tips carousel state
  const [currentTipIndex, setCurrentTipIndex] = useState<number>(0);

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

  // Function to refresh ads count
  const refreshAdsCount = useCallback(async () => {
    if (!selectedBusinessProfile?.id) {
      setAdsCount(0);
      return;
    }
    try {
      const adsResult = await getAdsCount(selectedBusinessProfile.id, authToken);
      if (adsResult.success && adsResult.data !== undefined) {
        setAdsCount(adsResult.data);
      }
    } catch (error) {
      console.error('Error refreshing ads count:', error);
    }
  }, [authToken, selectedBusinessProfile?.id]);

  // Function to refresh scripts count
  const refreshScriptsCount = useCallback(async () => {
    if (!selectedBusinessProfile?.id) {
      setScriptsCount(0);
      return;
    }
    try {
      const scriptsResult = await getScriptsCount(authToken, selectedBusinessProfile.id);
      if (scriptsResult.success && scriptsResult.data !== undefined) {
        setScriptsCount(scriptsResult.data);
      }
    } catch (error) {
      console.error('Error refreshing scripts count:', error);
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

        // Fetch ads count (will use selectedBusinessProfile?.id automatically)
        await refreshAdsCount();

        // Fetch scripts count (will use selectedBusinessProfile?.id automatically)
        await refreshScriptsCount();

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
  }, [authToken, refreshCompetitionsCount, refreshOffersCount, refreshCampaignsCount, refreshAdsCount, refreshScriptsCount]);

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

  // Refresh ads count when component mounts or business profile changes
  useEffect(() => {
    refreshAdsCount();
  }, [refreshAdsCount]);

  // Refresh scripts count when component mounts or business profile changes
  useEffect(() => {
    refreshScriptsCount();
  }, [refreshScriptsCount]);

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

  // Also refresh ads count when selectedBusinessProfile changes
  useEffect(() => {
    if (selectedBusinessProfile?.id) {
      refreshAdsCount();
    }
  }, [selectedBusinessProfile?.id, authToken, refreshAdsCount]);

  // Also refresh scripts count when selectedBusinessProfile changes
  useEffect(() => {
    if (selectedBusinessProfile?.id) {
      refreshScriptsCount();
    }
  }, [selectedBusinessProfile?.id, authToken, refreshScriptsCount]);



  // Update navigation sections with current data
  const navigationSections: NavSection[] = [
    {
      id: 'business',
      title: t('dashboard.nav.business'),
      items: [
        { id: 'business-profiles', label: t('dashboard.nav.businessProfiles'), icon: Building2, count: businessProfilesCount },
        { id: 'competition', label: t('dashboard.nav.competition'), icon: Target, count: competitionsCount },
        { id: 'offers', label: t('dashboard.nav.offers'), icon: Package, count: offersCount },
        { id: 'campaigns', label: t('dashboard.nav.campaigns'), icon: TrendingUp, count: campaignsCount },
        { id: 'ads', label: t('dashboard.nav.ads'), icon: Megaphone, count: adsCount },
        { id: 'scripts', label: t('dashboard.nav.scripts'), icon: FileText, count: scriptsCount },
      ]
    },
    {
      id: 'ai-tools',
      title: t('dashboard.nav.aiTools'),
      items: [
        { id: 'agents', label: t('dashboard.nav.agents'), icon: Bot, count: agentsCount },
        { id: 'automations', label: t('dashboard.nav.automations'), icon: Zap, count: 12 },
        { id: 'prompts', label: t('dashboard.nav.prompts'), icon: FileText, count: 28 },
        { id: 'videos', label: t('dashboard.nav.videos'), icon: Video, count: 3 },
      ]
    }
  ];

  const stats = [
    { id: 'profiles', label: t('dashboard.stats.businessProfiles'), value: isLoadingStats ? '...' : businessProfilesCount.toString(), icon: Building2, bgColor: 'bg-blue-100', textColor: 'text-blue-600', trend: 'Active profiles' },
    { id: 'agents', label: t('dashboard.stats.totalAgents'), value: isLoadingStats ? '...' : agentsCount.toString(), icon: Bot, bgColor: 'bg-purple-100', textColor: 'text-purple-600', trend: 'AI agents available' },
    { id: 'competitions', label: t('dashboard.stats.competitors'), value: isLoadingStats ? '...' : competitionsCount.toString(), icon: Target, bgColor: 'bg-blue-100', textColor: 'text-blue-600', trend: 'Market insights' },
    { id: 'offers', label: t('dashboard.stats.offers'), value: isLoadingStats ? '...' : offersCount.toString(), icon: Package, bgColor: 'bg-purple-100', textColor: 'text-purple-600', trend: 'Products & services' },
    { id: 'campaigns', label: t('dashboard.stats.campaigns'), value: isLoadingStats ? '...' : campaignsCount.toString(), icon: TrendingUp, bgColor: 'bg-blue-100', textColor: 'text-blue-600', trend: 'Marketing strategies' },
    { id: 'ads', label: t('dashboard.stats.ads'), value: isLoadingStats ? '...' : adsCount.toString(), icon: Megaphone, bgColor: 'bg-purple-100', textColor: 'text-purple-600', trend: 'Advertisement creatives' },
    { id: 'scripts', label: t('dashboard.stats.scripts'), value: isLoadingStats ? '...' : scriptsCount.toString(), icon: FileText, bgColor: 'bg-blue-100', textColor: 'text-blue-600', trend: 'Content pieces' },
  ];

  const businessTips = [
    {
      id: 1,
      title: t('dashboard.tips.tip1.title', 'Research Before You Campaign'),
      content: t('dashboard.tips.tip1.content', 'Always analyze your competitors before creating marketing campaigns. Understanding their strategies helps you position your business more effectively.'),
      icon: Target,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      id: 2,
      title: t('dashboard.tips.tip2.title', 'Optimize Your Offer Catalog'),
      content: t('dashboard.tips.tip2.content', 'Use AI-generated market insights to refine your product and service offerings. Focus on what your target customers truly desire.'),
      icon: Package,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      id: 3,
      title: t('dashboard.tips.tip3.title', 'Leverage AI Automation'),
      content: t('dashboard.tips.tip3.content', 'Let AI agents handle repetitive research tasks while you focus on strategy and execution. Automation saves time and improves accuracy.'),
      icon: Bot,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      id: 4,
      title: t('dashboard.tips.tip4.title', 'Monitor Campaign Performance'),
      content: t('dashboard.tips.tip4.content', 'Track your marketing campaign results and adjust strategies based on real data. Continuous optimization leads to better ROI.'),
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      id: 5,
      title: t('dashboard.tips.tip5.title', 'Build Customer Personas'),
      content: t('dashboard.tips.tip5.content', 'Create detailed customer profiles based on your target audience analysis. Personalized marketing messages convert better.'),
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    }
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

        {/* Navigation Container */}
        <div className="flex-1 flex flex-col">
          {/* Main Navigation - Scrollable */}
          <div className="flex-1 overflow-y-auto py-4">
            {/* Dashboard Overview Link */}
            <div className="mb-6">
              <nav className="space-y-1 px-2">
                <Link
                  to="/dashboard/overview"
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeSection === 'overview' || activeSection === ''
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Home className="w-5 h-5 mr-3 flex-shrink-0" />
                  {!sidebarCollapsed && (
                    <span className="flex-1 text-left">{t('dashboard.nav.overview', 'Dashboard')}</span>
                  )}
                </Link>
              </nav>
            </div>

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
          </div>

          {/* Bottom Navigation - Fixed at Bottom */}
          <div className="border-t border-gray-200 pt-4 pb-2">
            {/* Navigation Links */}
            <nav className="space-y-1 px-2 mb-3">
              <Link
                to="/dashboard/settings"
                className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors"
              >
                <Settings className="w-5 h-5 mr-3 flex-shrink-0" />
                {!sidebarCollapsed && t('dashboard.nav.settings')}
              </Link>
              <Link
                to="/dashboard/profile"
                className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors"
              >
                <User className="w-5 h-5 mr-3 flex-shrink-0" />
                {!sidebarCollapsed && t('dashboard.nav.profile')}
              </Link>
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors"
                  title={t('dashboard.logout')}
                >
                  <LogOut className="w-5 h-5 mr-3 flex-shrink-0" />
                  {!sidebarCollapsed && t('dashboard.logout')}
                </button>
              )}
            </nav>

            {/* User Identity - Very Compact and Subtle */}
            <div className="px-2">
              <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'px-2 py-1.5'}`}>
                {sidebarCollapsed ? (
                  <div className="w-6 h-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                    <User className="w-3 h-3 text-white" />
                  </div>
                ) : (
                  <>
                    <div className="w-6 h-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mr-2 flex-shrink-0">
                      <User className="w-3 h-3 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-gray-600 truncate">{user.email}</div>
                      <div className="text-xs text-gray-400">{t('dashboard.userRole.admin')}</div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
              {stats.map((stat) => (
                <div key={stat.id} className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-8 h-8 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                      <stat.icon className={`w-4 h-4 ${stat.textColor}`} />
                    </div>
                    <Plus className="w-3 h-3 text-gray-400 hover:text-gray-600 cursor-pointer" />
                  </div>
                  <div>
                    <div className="text-xl font-bold text-gray-900 mb-1">{stat.value}</div>
                    <div className="text-xs font-medium text-gray-600 mb-1">{stat.label}</div>
                    <div className="text-xs text-gray-500">{stat.trend}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Onboarding Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Onboarding Checklist */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">{t('dashboard.onboarding.title', 'Getting Started')}</h3>
                  </div>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {/* Progress bar */}
                    <div className="mb-6">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600">{t('dashboard.onboarding.progress', 'Progress')}</span>
                        <span className="font-medium text-blue-600">
                          {Math.round(((businessProfilesCount > 0 ? 1 : 0) + (competitionsCount > 0 ? 1 : 0) + (offersCount > 0 ? 1 : 0) + (campaignsCount > 0 ? 1 : 0) + (adsCount > 0 ? 1 : 0)) / 5 * 100)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${((businessProfilesCount > 0 ? 1 : 0) + (competitionsCount > 0 ? 1 : 0) + (offersCount > 0 ? 1 : 0) + (campaignsCount > 0 ? 1 : 0) + (adsCount > 0 ? 1 : 0)) / 5 * 100}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Checklist items */}
                    <Link to="/dashboard/business-profiles" className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all duration-200 group">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${businessProfilesCount > 0 ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                        {businessProfilesCount > 0 ? <Check className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 group-hover:text-blue-700 transition-colors">{t('dashboard.onboarding.step1', 'Create Business Profile')}</div>
                        <div className="text-sm text-gray-500">{businessProfilesCount > 0 ? t('dashboard.onboarding.step1Complete', 'Profile created') : t('dashboard.onboarding.step1Desc', 'Start by analyzing your business')}</div>
                      </div>
                      {businessProfilesCount > 0 && (
                        <div className="text-sm font-medium text-green-600">{businessProfilesCount} {t('dashboard.onboarding.created', 'created')}</div>
                      )}
                    </Link>

                    <Link to="/dashboard/competition" className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all duration-200 group">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${competitionsCount > 0 ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                        {competitionsCount > 0 ? <Check className="w-4 h-4" /> : <Target className="w-4 h-4" />}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 group-hover:text-blue-700 transition-colors">{t('dashboard.onboarding.step2', 'Find Competitors')}</div>
                        <div className="text-sm text-gray-500">{competitionsCount > 0 ? t('dashboard.onboarding.step2Complete', 'Competitors analyzed') : t('dashboard.onboarding.step2Desc', 'Research your market competition')}</div>
                      </div>
                      {competitionsCount > 0 && (
                        <div className="text-sm font-medium text-green-600">{competitionsCount} {t('dashboard.onboarding.found', 'found')}</div>
                      )}
                    </Link>

                    <Link to="/dashboard/offers" className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all duration-200 group">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${offersCount > 0 ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                        {offersCount > 0 ? <Check className="w-4 h-4" /> : <Package className="w-4 h-4" />}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 group-hover:text-blue-700 transition-colors">{t('dashboard.onboarding.step3', 'Create Offers')}</div>
                        <div className="text-sm text-gray-500">{offersCount > 0 ? t('dashboard.onboarding.step3Complete', 'Offers created') : t('dashboard.onboarding.step3Desc', 'Define your products & services')}</div>
                      </div>
                      {offersCount > 0 && (
                        <div className="text-sm font-medium text-green-600">{offersCount} {t('dashboard.onboarding.active', 'active')}</div>
                      )}
                    </Link>

                    <Link to="/dashboard/campaigns" className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all duration-200 group">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${campaignsCount > 0 ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                        {campaignsCount > 0 ? <Check className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 group-hover:text-blue-700 transition-colors">{t('dashboard.onboarding.step4', 'Create Campaign')}</div>
                        <div className="text-sm text-gray-500">{campaignsCount > 0 ? t('dashboard.onboarding.step4Complete', 'Campaigns launched') : t('dashboard.onboarding.step4Desc', 'Generate marketing strategies')}</div>
                      </div>
                      {campaignsCount > 0 && (
                        <div className="text-sm font-medium text-green-600">{campaignsCount} {t('dashboard.onboarding.running', 'running')}</div>
                      )}
                    </Link>

                    <Link to="/dashboard/ads" className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all duration-200 group">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${adsCount > 0 ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                        {adsCount > 0 ? <Check className="w-4 h-4" /> : <Megaphone className="w-4 h-4" />}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 group-hover:text-blue-700 transition-colors">{t('dashboard.onboarding.step5', 'Create first Ad')}</div>
                        <div className="text-sm text-gray-500">{adsCount > 0 ? t('dashboard.onboarding.step5Complete', 'Ads created') : t('dashboard.onboarding.step5Desc', 'Generate advertisement creatives')}</div>
                      </div>
                      {adsCount > 0 && (
                        <div className="text-sm font-medium text-green-600">{adsCount} {t('dashboard.onboarding.created', 'created')}</div>
                      )}
                    </Link>
                  </div>
                </div>
              </div>

              {/* Video Placeholder */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                      <Video className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">{t('dashboard.video.title', 'Tutorial Video')}</h3>
                  </div>
                </div>
                <div className="p-6">
                  <div className="relative bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 rounded-xl aspect-video mb-4 group cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden">
                    {/* Background pattern */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-purple-600/10"></div>
                    <div className="absolute top-4 left-4 right-4 bottom-4 border-2 border-dashed border-blue-300/50 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                          <Play className="w-6 h-6 text-white ml-1" />
                        </div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">{t('dashboard.video.videoTitle', 'Getting Started with AI Platform')}</h4>
                        <p className="text-sm text-gray-600 mb-3">{t('dashboard.video.videoDesc', 'Learn how to set up your business profile and create your first AI-powered marketing campaign')}</p>
                        <div className="flex items-center justify-center gap-2 text-sm text-purple-600 font-medium">
                          <Clock className="w-4 h-4" />
                          <span>{t('dashboard.video.duration', '5:32 min')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-center">
                    <button className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium text-sm rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200">
                      <Play className="w-4 h-4" />
                      {t('dashboard.video.watchNow', 'Watch Now')}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions & Tips */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Quick Actions */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                      <Zap className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">{t('dashboard.quickActions.title', 'Quick Actions')}</h3>
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-2 gap-4">
                    <Link to="/dashboard/agents" className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-left group">
                      <Bot className="w-8 h-8 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
                      <div className="font-medium text-gray-900 group-hover:text-blue-700 transition-colors">{t('dashboard.quickActions.runAgent', 'Run AI Agent')}</div>
                      <div className="text-sm text-gray-600">{t('dashboard.quickActions.runAgentDesc', 'Analyze website & generate insights')}</div>
                    </Link>
                    <Link to="/dashboard/competition" className="p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors text-left group">
                      <Target className="w-8 h-8 text-purple-600 mb-2 group-hover:scale-110 transition-transform" />
                      <div className="font-medium text-gray-900 group-hover:text-purple-700 transition-colors">{t('dashboard.quickActions.findCompetitors', 'Find Competitors')}</div>
                      <div className="text-sm text-gray-600">{t('dashboard.quickActions.findCompetitorsDesc', 'Research market competition')}</div>
                    </Link>
                    <Link to="/dashboard/campaigns" className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-left group">
                      <TrendingUp className="w-8 h-8 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
                      <div className="font-medium text-gray-900 group-hover:text-blue-700 transition-colors">{t('dashboard.quickActions.createCampaign', 'Create Campaign')}</div>
                      <div className="text-sm text-gray-600">{t('dashboard.quickActions.createCampaignDesc', 'Generate marketing strategy')}</div>
                    </Link>
                    <Link to="/dashboard/offers" className="p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors text-left group">
                      <Package className="w-8 h-8 text-purple-600 mb-2 group-hover:scale-110 transition-transform" />
                      <div className="font-medium text-gray-900 group-hover:text-purple-700 transition-colors">{t('dashboard.quickActions.manageOffers', 'Manage Offers')}</div>
                      <div className="text-sm text-gray-600">{t('dashboard.quickActions.manageOffersDesc', 'Create products & services')}</div>
                    </Link>
                    <Link to="/dashboard/ads" className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-left group">
                      <Megaphone className="w-8 h-8 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
                      <div className="font-medium text-gray-900 group-hover:text-blue-700 transition-colors">{t('dashboard.quickActions.generateAds', 'Generate Ads')}</div>
                      <div className="text-sm text-gray-600">{t('dashboard.quickActions.generateAdsDesc', 'Create advertisement creatives')}</div>
                    </Link>
                    <Link to="/dashboard/scripts" className="p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors text-left group">
                      <FileText className="w-8 h-8 text-purple-600 mb-2 group-hover:scale-110 transition-transform" />
                      <div className="font-medium text-gray-900 group-hover:text-purple-700 transition-colors">{t('dashboard.quickActions.generateScripts', 'Write Content')}</div>
                      <div className="text-sm text-gray-600">{t('dashboard.quickActions.generateScriptsDesc', 'Create content with AI assistant')}</div>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Business Tips */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                        <Lightbulb className="w-4 h-4 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">{t('dashboard.tips.title', 'Business Tips')}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentTipIndex(currentTipIndex > 0 ? currentTipIndex - 1 : businessTips.length - 1)}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        disabled={businessTips.length <= 1}
                      >
                        <ChevronLeft className="w-4 h-4 text-gray-400" />
                      </button>
                      <span className="text-xs text-gray-500 px-2">
                        {currentTipIndex + 1} / {businessTips.length}
                      </span>
                      <button
                        onClick={() => setCurrentTipIndex(currentTipIndex < businessTips.length - 1 ? currentTipIndex + 1 : 0)}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        disabled={businessTips.length <= 1}
                      >
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  {businessTips.length > 0 && (() => {
                    const IconComponent = businessTips[currentTipIndex].icon;
                    return (
                      <div className="transition-all duration-300 ease-in-out">
                        <div className="flex items-start gap-4 mb-4">
                          <div className={`w-12 h-12 ${businessTips[currentTipIndex].bgColor} rounded-lg flex items-center justify-center flex-shrink-0`}>
                            <IconComponent className={`w-6 h-6 ${businessTips[currentTipIndex].color}`} />
                          </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-2">{businessTips[currentTipIndex].title}</h4>
                          <p className="text-sm text-gray-600 leading-relaxed">{businessTips[currentTipIndex].content}</p>
                          </div>
                        </div>
                        
                        {/* Tip indicators */}
                        <div className="flex justify-center gap-2 mt-6">
                          {businessTips.map((_, index) => (
                            <button
                              key={index}
                              onClick={() => setCurrentTipIndex(index)}
                              className={`w-2 h-2 rounded-full transition-all duration-200 ${
                                index === currentTipIndex 
                                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 w-6' 
                                  : 'bg-gray-300 hover:bg-gray-400'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })()}
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
              <Route path="ads" element={
                <Ads
                  businessProfileId={selectedBusinessProfile?.id}
                  authToken={authToken}
                  onTokenRefreshed={onTokenRefreshed}
                  onAdsChanged={refreshAdsCount}
                />
              } />
              <Route path="scripts/*" element={
                <Scripts
                  businessProfileId={selectedBusinessProfile?.id}
                  authToken={authToken}
                  onTokenRefreshed={onTokenRefreshed}
                  onScriptsChanged={refreshScriptsCount}
                />
              } />
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
