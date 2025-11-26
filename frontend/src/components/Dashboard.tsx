import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import {
  User, Building2, LogOut, Search, Bell,
  Bot, Zap, FileText, Video, Target, TrendingUp, Megaphone,
  Users, Activity, Clock, CheckCircle, Plus, Menu, Package, X,
  Play, Lightbulb, ChevronLeft, ChevronRight, Check, Home, Palette, TrendingUp as TrendingUpIcon, TrendingDown, Star,
  BarChart3, Globe, Heart, MessageSquare, Share2, Eye
} from 'lucide-react';
import { User as UserType, UserCredit } from '../types';
import { getAgentsCount, getBusinessProfilesCount, getInteractionsCount, getBusinessProfiles, updateBusinessProfile, getCompetitionsCount, getOffersCount, getCampaignsCount, getAdsCount, getScriptsCount, getUserStyles, getTemplatesCount } from '../services/api';
import BusinessProfiles from './BusinessProfiles';
import Agents from './Agents';
import Competition from './Competition';
import Offers from './Offers';
import Campaigns from './Campaigns';
import Ads from './Ads';
import Scripts from './Scripts';
import CreditsCard from './CreditsCard';
import PromptTemplates from './PromptTemplates';
import UserProfile from './UserProfile';
import CommandPalette from './command-palette/CommandPalette';
import { useKeyboardShortcuts, createCommandPaletteShortcuts } from '../hooks/useKeyboardShortcuts';

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
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
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
  const [, setInteractionsCount] = useState<number>(0);
  const [userStylesCount, setUserStylesCount] = useState<number>(0);
  const [templatesCount, setTemplatesCount] = useState<number>(0);
  const [, setCredits] = useState<UserCredit | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState<boolean>(true);

  // Business profiles state
  const [businessProfiles, setBusinessProfiles] = useState<BusinessProfile[]>([]);
  const [selectedBusinessProfile, setSelectedBusinessProfile] = useState<BusinessProfile | null>(null);
  const [isLoadingProfiles, setIsLoadingProfiles] = useState<boolean>(true);

  // Tips carousel state
  const [currentTipIndex, setCurrentTipIndex] = useState<number>(0);

  // Credits state
  const [userCredits, ] = useState<UserCredit | null>(null);

  // Command Palette state
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const isSidebarCollapsed = sidebarCollapsed && !isMobileSidebarOpen;

  // Stable callback prevents CreditsCard from recreating loadCredits on every render
  const handleCreditUpdate = useCallback((creditData: UserCredit) => {
    setCredits(creditData);
  }, []);

  // Command Palette handlers
  const openCommandPalette = useCallback(() => {
    setIsCommandPaletteOpen(true);
  }, []);

  const closeCommandPalette = useCallback(() => {
    setIsCommandPaletteOpen(false);
  }, []);

  const handleModalOpen = useCallback((modalType: string) => {
    // Handle different modal types
    console.log('Open modal:', modalType);
    // TODO: Implement modal opening logic based on modalType
  }, []);

  // Setup keyboard shortcuts for command palette
  useKeyboardShortcuts(createCommandPaletteShortcuts(openCommandPalette));

  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [location.pathname]);

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

  // Function to refresh user styles count
  const refreshUserStylesCount = useCallback(async () => {
    if (!selectedBusinessProfile?.id) {
      setUserStylesCount(0);
      return;
    }
    try {
      const stylesResult = await getUserStyles(authToken, selectedBusinessProfile.id);
      if (stylesResult.success && stylesResult.data) {
        setUserStylesCount(stylesResult.data.length);
      }
    } catch (error) {
      console.error('Error refreshing user styles count:', error);
    }
  }, [authToken, selectedBusinessProfile?.id]);

  // Function to refresh templates count
  const refreshTemplatesCount = useCallback(async () => {
    try {
      const templatesResult = await getTemplatesCount();
      if (templatesResult.success && templatesResult.data !== undefined) {
        setTemplatesCount(templatesResult.data);
      }
    } catch (error) {
      console.error('Error refreshing templates count:', error);
    }
  }, []);

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

        // Fetch user styles count (will use selectedBusinessProfile?.id automatically)
        await refreshUserStylesCount();

        // Fetch templates count
        await refreshTemplatesCount();

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
  }, [authToken, refreshCompetitionsCount, refreshOffersCount, refreshCampaignsCount, refreshAdsCount, refreshScriptsCount, refreshUserStylesCount, refreshTemplatesCount]);

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

  // Also refresh user styles count when selectedBusinessProfile changes
  useEffect(() => {
    if (selectedBusinessProfile?.id) {
      refreshUserStylesCount();
    }
  }, [selectedBusinessProfile?.id, authToken, refreshUserStylesCount]);

  // Refresh templates count (independent of business profile)
  useEffect(() => {
    refreshTemplatesCount();

    // Set up real-time refresh for templates count every 30 seconds
    const interval = setInterval(() => {
      refreshTemplatesCount();
    }, 30000);

    return () => clearInterval(interval);
  }, [refreshTemplatesCount]);

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
        { id: 'prompts', label: t('dashboard.nav.prompts'), icon: FileText, count: templatesCount },
        { id: 'agents', label: t('dashboard.nav.agents'), icon: Bot, count: agentsCount },
        { id: 'automations', label: t('dashboard.nav.automations'), icon: Zap, count: 0 },
        { id: 'videos', label: t('dashboard.nav.videos'), icon: Video, count: 0 },
      ]
    }
  ];

  // Enhanced stats with growth indicators and activity data
  const getStatWithGrowth = (currentValue: number, statId: string) => {
    // Simulate growth data - in real app this would come from backend
    const mockGrowthData: Record<string, { growth: number; isPositive: boolean; activity: string }> = {
      'profiles': { growth: businessProfilesCount > 0 ? 0 : 100, isPositive: true, activity: 'Setup in progress' },
      'competitions': { growth: competitionsCount > 1 ? 25 : 0, isPositive: true, activity: 'Research active' },
      'offers': { growth: offersCount > 2 ? 15 : 0, isPositive: true, activity: 'Catalog growing' },
      'campaigns': { growth: campaignsCount > 0 ? 12 : 0, isPositive: true, activity: 'Strategy ready' },
      'ads': { growth: adsCount > 1 ? 8 : 0, isPositive: true, activity: 'Creatives ready' },
      'scripts': { growth: scriptsCount > 3 ? 20 : 0, isPositive: true, activity: 'Content active' },
      'styles': { growth: userStylesCount > 0 ? 100 : 0, isPositive: true, activity: 'Styles cloned' },
      'agents': { growth: 0, isPositive: true, activity: 'Always available' }
    };

    return mockGrowthData[statId] || { growth: 0, isPositive: true, activity: 'Active' };
  };

  const stats = [
    { 
      id: 'profiles', 
      label: t('dashboard.stats.businessProfiles'), 
      value: isLoadingStats ? '...' : businessProfilesCount.toString(), 
      icon: Building2, 
      bgColor: 'bg-blue-100', 
      textColor: 'text-blue-600', 
      trend: 'Active profiles',
      ...getStatWithGrowth(businessProfilesCount, 'profiles')
    },
    { 
      id: 'styles', 
      label: t('dashboard.stats.userStyles', 'Writing Styles'), 
      value: isLoadingStats ? '...' : userStylesCount.toString(), 
      icon: Palette, 
      bgColor: 'bg-purple-100', 
      textColor: 'text-purple-600', 
      trend: 'Cloned writing styles',
      ...getStatWithGrowth(userStylesCount, 'styles')
    },
    { 
      id: 'competitions', 
      label: t('dashboard.stats.competitors'), 
      value: isLoadingStats ? '...' : competitionsCount.toString(), 
      icon: Target, 
      bgColor: 'bg-blue-100', 
      textColor: 'text-blue-600', 
      trend: 'Market insights',
      ...getStatWithGrowth(competitionsCount, 'competitions')
    },
    { 
      id: 'offers', 
      label: t('dashboard.stats.offers'), 
      value: isLoadingStats ? '...' : offersCount.toString(), 
      icon: Package, 
      bgColor: 'bg-purple-100', 
      textColor: 'text-purple-600', 
      trend: 'Products & services',
      ...getStatWithGrowth(offersCount, 'offers')
    },
    { 
      id: 'campaigns', 
      label: t('dashboard.stats.campaigns'), 
      value: isLoadingStats ? '...' : campaignsCount.toString(), 
      icon: TrendingUp, 
      bgColor: 'bg-blue-100', 
      textColor: 'text-blue-600', 
      trend: 'Marketing strategies',
      ...getStatWithGrowth(campaignsCount, 'campaigns')
    },
    { 
      id: 'ads', 
      label: t('dashboard.stats.ads'), 
      value: isLoadingStats ? '...' : adsCount.toString(), 
      icon: Megaphone, 
      bgColor: 'bg-purple-100', 
      textColor: 'text-purple-600', 
      trend: 'Advertisement creatives',
      ...getStatWithGrowth(adsCount, 'ads')
    },
    { 
      id: 'scripts', 
      label: t('dashboard.stats.scripts'), 
      value: isLoadingStats ? '...' : scriptsCount.toString(), 
      icon: FileText, 
      bgColor: 'bg-blue-100', 
      textColor: 'text-blue-600', 
      trend: 'Content pieces',
      ...getStatWithGrowth(scriptsCount, 'scripts')
    },
    { 
      id: 'agents', 
      label: t('dashboard.stats.totalAgents'), 
      value: isLoadingStats ? '...' : agentsCount.toString(), 
      icon: Bot, 
      bgColor: 'bg-purple-100', 
      textColor: 'text-purple-600', 
      trend: 'AI agents available',
      ...getStatWithGrowth(agentsCount, 'agents')
    },
  ];

  // Smart contextual recommendations based on user progress
  const getSmartRecommendations = () => {
    const recommendations = [];
    
    // Base tips - always available
    const baseTips = [
      {
        id: 'leverage-ai',
        title: t('dashboard.tips.leverageAI.title', 'Leverage AI Automation'),
        content: t('dashboard.tips.leverageAI.content', 'Let AI agents handle repetitive research tasks while you focus on strategy and execution. Automation saves time and improves accuracy.'),
        icon: Bot,
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
        priority: 1
      },
      {
        id: 'customer-personas',
        title: t('dashboard.tips.customerPersonas.title', 'Build Customer Personas'),
        content: t('dashboard.tips.customerPersonas.content', 'Create detailed customer profiles based on your target audience analysis. Personalized marketing messages convert better.'),
        icon: Users,
        color: 'text-purple-600',
        bgColor: 'bg-purple-100',
        priority: 1
      },
      {
        id: 'track-analytics',
        title: t('dashboard.tips.trackAnalytics.title', 'Track Key Performance Metrics'),
        content: t('dashboard.tips.trackAnalytics.content', 'Monitor conversion rates, customer acquisition costs, and engagement metrics. Data-driven decisions lead to sustainable business growth.'),
        icon: BarChart3,
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        priority: 1
      },
      {
        id: 'global-reach',
        title: t('dashboard.tips.globalReach.title', 'Expand Your Digital Presence'),
        content: t('dashboard.tips.globalReach.content', 'Optimize your website for international markets. Multi-language content and local SEO unlock new customer segments.'),
        icon: Globe,
        color: 'text-indigo-600',
        bgColor: 'bg-indigo-100',
        priority: 1
      },
      {
        id: 'customer-retention',
        title: t('dashboard.tips.customerRetention.title', 'Focus on Customer Retention'),
        content: t('dashboard.tips.customerRetention.content', 'Acquiring new customers costs 5x more than retaining existing ones. Build loyalty programs and personalized experiences.'),
        icon: Heart,
        color: 'text-red-600',
        bgColor: 'bg-red-100',
        priority: 1
      },
      {
        id: 'social-engagement',
        title: t('dashboard.tips.socialEngagement.title', 'Master Social Media Engagement'),
        content: t('dashboard.tips.socialEngagement.content', 'Create authentic conversations with your audience. Consistent engagement builds brand trust and drives organic growth.'),
        icon: MessageSquare,
        color: 'text-pink-600',
        bgColor: 'bg-pink-100',
        priority: 1
      },
      {
        id: 'content-strategy',
        title: t('dashboard.tips.contentStrategy.title', 'Develop a Content Strategy'),
        content: t('dashboard.tips.contentStrategy.content', 'Plan your content calendar around customer journey stages. Educational content positions you as an industry expert.'),
        icon: Share2,
        color: 'text-orange-600',
        bgColor: 'bg-orange-100',
        priority: 1
      },
      {
        id: 'monitor-competition',
        title: t('dashboard.tips.monitorCompetition.title', 'Monitor Competitor Activity'),
        content: t('dashboard.tips.monitorCompetition.content', 'Stay informed about competitor pricing, content, and campaigns. Market intelligence helps you identify opportunities and threats.'),
        icon: Eye,
        color: 'text-gray-600',
        bgColor: 'bg-gray-100',
        priority: 1
      }
    ];

    // Contextual tips based on progress
    if (businessProfilesCount === 0) {
      recommendations.push({
        id: 'create-profile',
        title: t('dashboard.recommendations.createProfile.title', 'Start with Business Analysis'),
        content: t('dashboard.recommendations.createProfile.content', 'Create your first business profile to unlock AI-powered insights. Analyze your website and define your target audience.'),
        icon: Building2,
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
        priority: 3,
        actionUrl: '/dashboard/business-profiles'
      });
    } else {
      if (userStylesCount === 0) {
        recommendations.push({
          id: 'clone-style',
          title: t('dashboard.recommendations.cloneStyle.title', 'Clone Your Writing Style'),
          content: t('dashboard.recommendations.cloneStyle.content', 'Analyze your existing content to create AI-powered writing styles. This helps maintain brand consistency across all content.'),
          icon: Palette,
          color: 'text-purple-600',
          bgColor: 'bg-purple-100',
          priority: 3,
          actionUrl: '/dashboard/scripts'
        });
      }
      
      if (competitionsCount === 0) {
        recommendations.push({
          id: 'research-competition',
          title: t('dashboard.recommendations.researchCompetition.title', 'Research Your Competition'),
          content: t('dashboard.recommendations.researchCompetition.content', 'Understanding your competitors\' strategies helps position your business more effectively and identify market opportunities.'),
          icon: Target,
          color: 'text-blue-600',
          bgColor: 'bg-blue-100',
          priority: 3,
          actionUrl: '/dashboard/competition'
        });
      }
      
      if (offersCount === 0) {
        recommendations.push({
          id: 'create-offers',
          title: t('dashboard.recommendations.createOffers.title', 'Define Your Offers'),
          content: t('dashboard.recommendations.createOffers.content', 'Create a comprehensive offer catalog. AI can help optimize pricing and positioning based on market analysis.'),
          icon: Package,
          color: 'text-purple-600',
          bgColor: 'bg-purple-100',
          priority: 3,
          actionUrl: '/dashboard/offers'
        });
      } else if (campaignsCount === 0) {
        recommendations.push({
          id: 'create-campaigns',
          title: t('dashboard.recommendations.createCampaigns.title', 'Launch Marketing Campaigns'),
          content: t('dashboard.recommendations.createCampaigns.content', 'With offers defined, create strategic marketing campaigns to reach your target audience effectively.'),
          icon: TrendingUp,
          color: 'text-blue-600',
          bgColor: 'bg-blue-100',
          priority: 3,
          actionUrl: '/dashboard/campaigns'
        });
      } else if (adsCount === 0) {
        recommendations.push({
          id: 'create-ads',
          title: t('dashboard.recommendations.createAds.title', 'Generate Ad Creatives'),
          content: t('dashboard.recommendations.createAds.content', 'Turn your campaigns into compelling advertisements. AI can generate platform-specific creatives for better performance.'),
          icon: Megaphone,
          color: 'text-purple-600',
          bgColor: 'bg-purple-100',
          priority: 3,
          actionUrl: '/dashboard/ads'
        });
      }
      
      // Advanced recommendations for established users
      if (campaignsCount > 0 && adsCount > 0) {
        recommendations.push({
          id: 'optimize-performance',
          title: t('dashboard.recommendations.optimizePerformance.title', 'Monitor & Optimize'),
          content: t('dashboard.recommendations.optimizePerformance.content', 'Track your marketing campaign results and adjust strategies based on real data. Continuous optimization leads to better ROI.'),
          icon: Activity,
          color: 'text-blue-600',
          bgColor: 'bg-blue-100',
          priority: 2
        });
      }
      
      if (scriptsCount === 0 && userStylesCount > 0) {
        recommendations.push({
          id: 'generate-content',
          title: t('dashboard.recommendations.generateContent.title', 'Create Content with AI'),
          content: t('dashboard.recommendations.generateContent.content', 'Use your cloned writing styles to generate consistent, high-quality content for your marketing campaigns.'),
          icon: FileText,
          color: 'text-purple-600',
          bgColor: 'bg-purple-100',
          priority: 2,
          actionUrl: '/dashboard/scripts'
        });
      }
    }

    // Combine and sort by priority (higher priority first)
    const allTips = [...recommendations, ...baseTips]
      .sort((a, b) => (b.priority || 0) - (a.priority || 0))
      .slice(0, 5); // Limit to 5 tips

    return allTips;
  };

  const businessTips = getSmartRecommendations();

  // Empty State Components
  const AutomationsEmptyState = () => (
    <div className="text-center py-16">
      <div className="relative inline-block">
        <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-blue-200 rounded-3xl flex items-center justify-center mx-auto mb-6 transform rotate-3">
          <Zap className="w-12 h-12 text-purple-600" />
        </div>
        <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
          <Bot className="w-4 h-4 text-white" />
        </div>
      </div>

      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {t('dashboard.automations.empty.title', 'Automatyzacje już wkrótce')}
        </h3>
        <p className="text-gray-600 mb-8 leading-relaxed max-w-md mx-auto">
          {t('dashboard.automations.empty.description', 'Wkrótce będziesz mógł tworzyć inteligentne automatyzacje biznesowe, które oszczędzą Ci czas i zwiększą efektywność.')}
        </p>
        <div className="flex justify-center gap-4">
          <button
            className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
            disabled
          >
            <Zap className="w-5 h-5" />
            <span>{t('dashboard.automations.empty.action', 'Wkrótce dostępne')}</span>
          </button>
          <button
            onClick={() => window.location.href = '/dashboard/agents'}
            className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
          >
            <Bot className="w-5 h-5" />
            <span>{t('dashboard.automations.empty.agentsAction', 'Sprawdź Agentów AI')}</span>
          </button>
        </div>
      </div>
    </div>
  );

  const VideosEmptyState = () => (
    <div className="text-center py-16">
      <div className="relative inline-block">
        <div className="w-24 h-24 bg-gradient-to-br from-pink-100 to-purple-200 rounded-3xl flex items-center justify-center mx-auto mb-6 transform rotate-3">
          <Video className="w-12 h-12 text-pink-600" />
        </div>
        <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center">
          <Play className="w-4 h-4 text-white" />
        </div>
      </div>

      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {t('dashboard.videos.empty.title', 'Biblioteka wideo już wkrótce')}
        </h3>
        <p className="text-gray-600 mb-8 leading-relaxed max-w-md mx-auto">
          {t('dashboard.videos.empty.description', 'Wkrótce będziesz mógł tworzyć i zarządzać materiałami wideo dla swojego biznesu, wykorzystując moc sztucznej inteligencji.')}
        </p>
        <div className="flex justify-center gap-4">
          <button
            className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
            disabled
          >
            <Video className="w-5 h-5" />
            <span>{t('dashboard.videos.empty.action', 'Wkrótce dostępne')}</span>
          </button>
          <button
            onClick={() => window.location.href = '/dashboard/scripts'}
            className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
          >
            <FileText className="w-5 h-5" />
            <span>{t('dashboard.videos.empty.scriptsAction', 'Utwórz Skrypty')}</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      {isMobileSidebarOpen && (
        <button
          type="button"
          aria-label={t('dashboard.closeNavigation', 'Close navigation')}
          className="fixed inset-0 z-30 bg-gray-900/40 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-40 flex w-72 transform flex-col bg-white shadow-xl transition-transform duration-300 lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:w-auto lg:translate-x-0 lg:border-r lg:border-gray-200 lg:shadow-none ${
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${isSidebarCollapsed ? 'lg:w-16' : 'lg:w-64'}`}
      >
        {/* Sidebar Header */}
        <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4">
          {!isSidebarCollapsed && (
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600"></div>
              <span className="text-lg font-bold text-gray-900">AI Platform</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition-colors hover:bg-gray-100 lg:hidden"
              onClick={() => setIsMobileSidebarOpen(false)}
              aria-label={t('dashboard.closeNavigation', 'Close navigation')}
            >
              <X className="h-5 w-5" />
            </button>
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden h-9 w-9 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-gray-100 lg:inline-flex"
              aria-label={isSidebarCollapsed ? t('dashboard.expandNavigation', 'Expand navigation') : t('dashboard.collapseNavigation', 'Collapse navigation')}
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
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
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className={`flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    activeSection === 'overview' || activeSection === ''
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Home className="w-5 h-5 mr-3 flex-shrink-0" />
                  {!isSidebarCollapsed && (
                    <span className="flex-1 text-left">{t('dashboard.nav.overview', 'Dashboard')}</span>
                  )}
                </Link>
              </nav>
            </div>

            {navigationSections.map((section) => (
              <div key={section.id} className="mb-6">
                {!isSidebarCollapsed && (
                  <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    {section.title}
                  </h3>
                )}
                <nav className="space-y-1 px-2">
                  {section.items.map((item) => (
                    <Link
                      key={item.id}
                      to={`/dashboard/${item.id}`}
                      onClick={() => setIsMobileSidebarOpen(false)}
                      className={`flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        activeSection === item.id
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                      {!isSidebarCollapsed && (
                        <>
                          <span className="flex-1 text-left">{item.label}</span>
                          {item.count !== undefined && item.count !== null && (
                            <span className="rounded-full bg-gray-200 px-2 py-1 text-xs text-gray-700">
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
          <div className="border-t border-gray-200 pb-4 pt-3">
            {/* Navigation Links */}
            <nav className="mb-3 space-y-1 px-2">
              <Link
                to="/dashboard/profile"
                onClick={() => setIsMobileSidebarOpen(false)}
                className="flex items-center rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
              >
                <User className="mr-3 h-5 w-5 flex-shrink-0" />
                {!isSidebarCollapsed && t('dashboard.nav.profile')}
              </Link>
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
                  title={t('dashboard.logout')}
                >
                  <LogOut className="mr-3 h-5 w-5 flex-shrink-0" />
                  {!isSidebarCollapsed && t('dashboard.logout')}
                </button>
              )}
            </nav>

            {/* Credits Card - Compact Version for Sidebar */}
            {!isSidebarCollapsed && (
              <div className="mb-3 px-2">
                <CreditsCard
                  className="!bg-gray-50 !p-3 !shadow-none"
                  onCreditUpdate={handleCreditUpdate}
                />
              </div>
            )}

            {/* User Identity - Very Compact and Subtle */}
            <div className="px-2">
              <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'px-2 py-1.5'}`}>
                {isSidebarCollapsed ? (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-purple-600">
                    <User className="h-3 w-3 text-white" />
                  </div>
                ) : (
                  <>
                    <div className="mr-2 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-purple-600">
                      <User className="h-3 w-3 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs text-gray-600">{user.email}</div>
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
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex flex-1 items-center gap-3">
                <button
                  type="button"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition-colors hover:bg-gray-100 lg:hidden"
                  onClick={() => setIsMobileSidebarOpen(true)}
                  aria-label={t('dashboard.openNavigation', 'Open navigation')}
                >
                  <Menu className="h-5 w-5" />
                </button>
                <div className="min-w-0">
                  <h1 className="truncate text-xl font-bold text-gray-900 sm:text-2xl">{t('dashboard.title')}</h1>
                  <p className="mt-1 hidden text-sm text-gray-500 sm:block">
                    {t('dashboard.subtitle', 'Monitoruj i rozwijaj swój biznes z pomocą AI')}
                  </p>
                </div>
              </div>

              {/* Business Profile Selector */}
              <div className="relative w-full sm:w-auto">
                {isLoadingProfiles ? (
                  <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-4 py-2">
                    <Building2 className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-900">Loading...</span>
                  </div>
                ) : businessProfiles.length > 0 ? (
                  <select
                    value={selectedBusinessProfile?.id || ''}
                    onChange={async (e) => {
                      const selectedProfile = businessProfiles.find(p => p.id === e.target.value);
                      if (selectedProfile) {
                        await updateActiveProfile(selectedProfile.id);
                      }
                    }}
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-800 transition-colors focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 sm:w-auto"
                  >
                    {businessProfiles.map((profile) => (
                      <option key={profile.id} value={profile.id}>
                        {profile.name || profile.website_url}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-4 py-2 text-gray-500">
                    <Building2 className="h-4 w-4" />
                    <span className="text-sm font-medium">No business profiles</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-end sm:gap-4">
              {/* Search */}
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder={t('dashboard.search.placeholder', 'Search...')}
                  className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-4 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Notifications */}
              <button className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition-colors hover:bg-gray-100">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-500"></span>
              </button>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-4 mb-8">
              {stats.map((stat) => (
                <div key={stat.id} className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-8 h-8 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                      <stat.icon className={`w-4 h-4 ${stat.textColor}`} />
                    </div>
                    {stat.growth > 0 && (
                      <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        stat.isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {stat.isPositive ? <TrendingUpIcon className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        +{stat.growth}%
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-xl font-bold text-gray-900 mb-1">{stat.value}</div>
                    <div className="text-xs font-medium text-gray-600 mb-1">{stat.label}</div>
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-500">{stat.activity}</div>
                      {stat.growth === 0 && stat.value !== '...' && parseInt(stat.value) > 0 && (
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-yellow-500 fill-current" />
                          <span className="text-xs text-yellow-600">Ready</span>
                        </div>
                      )}
                    </div>
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
                          {Math.round(((businessProfilesCount > 0 ? 1 : 0) + (userStylesCount > 0 ? 1 : 0) + (competitionsCount > 0 ? 1 : 0) + (offersCount > 0 ? 1 : 0) + (campaignsCount > 0 ? 1 : 0) + (adsCount > 0 ? 1 : 0)) / 6 * 100)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${((businessProfilesCount > 0 ? 1 : 0) + (userStylesCount > 0 ? 1 : 0) + (competitionsCount > 0 ? 1 : 0) + (offersCount > 0 ? 1 : 0) + (campaignsCount > 0 ? 1 : 0) + (adsCount > 0 ? 1 : 0)) / 6 * 100}%` }}
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

                    <Link to="/dashboard/scripts" className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all duration-200 group">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${userStylesCount > 0 ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                        {userStylesCount > 0 ? <Check className="w-4 h-4" /> : <Palette className="w-4 h-4" />}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 group-hover:text-blue-700 transition-colors">{t('dashboard.onboarding.stepStyles', 'Clone Writing Style')}</div>
                        <div className="text-sm text-gray-500">{userStylesCount > 0 ? t('dashboard.onboarding.stepStylesComplete', 'Writing styles cloned') : t('dashboard.onboarding.stepStylesDesc', 'Analyze and clone your writing style')}</div>
                      </div>
                      {userStylesCount > 0 && (
                        <div className="text-sm font-medium text-green-600">{userStylesCount} {t('dashboard.onboarding.cloned', 'cloned')}</div>
                      )}
                    </Link>

                    <Link to="/dashboard/competition" className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all duration-200 group">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${competitionsCount > 0 ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                        {competitionsCount > 0 ? <Check className="w-4 h-4" /> : <Target className="w-4 h-4" />}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 group-hover:text-blue-700 transition-colors">{t('dashboard.onboarding.step3', 'Find Competitors')}</div>
                        <div className="text-sm text-gray-500">{competitionsCount > 0 ? t('dashboard.onboarding.step3Complete', 'Competitors analyzed') : t('dashboard.onboarding.step3Desc', 'Research your market competition')}</div>
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
                        <div className="font-medium text-gray-900 group-hover:text-blue-700 transition-colors">{t('dashboard.onboarding.step4', 'Create Offers')}</div>
                        <div className="text-sm text-gray-500">{offersCount > 0 ? t('dashboard.onboarding.step4Complete', 'Offers created') : t('dashboard.onboarding.step4Desc', 'Define your products & services')}</div>
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
                        <div className="font-medium text-gray-900 group-hover:text-blue-700 transition-colors">{t('dashboard.onboarding.step5', 'Create Campaign')}</div>
                        <div className="text-sm text-gray-500">{campaignsCount > 0 ? t('dashboard.onboarding.step5Complete', 'Campaigns launched') : t('dashboard.onboarding.step5Desc', 'Generate marketing strategies')}</div>
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
                        <div className="font-medium text-gray-900 group-hover:text-blue-700 transition-colors">{t('dashboard.onboarding.step6', 'Create first Ad')}</div>
                        <div className="text-sm text-gray-500">{adsCount > 0 ? t('dashboard.onboarding.step6Complete', 'Ads created') : t('dashboard.onboarding.step6Desc', 'Generate advertisement creatives')}</div>
                      </div>
                      {adsCount > 0 && (
                        <div className="text-sm font-medium text-green-600">{adsCount} {t('dashboard.onboarding.created', 'created')}</div>
                      )}
                    </Link>
                  </div>
                </div>
              </div>

              {/* Right Column: Video + Tips Stacked */}
              <div className="space-y-6">
                {/* Video Section */}
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

                {/* Business Tips Section */}
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
                            <p className="text-sm text-gray-600 leading-relaxed mb-3">{businessTips[currentTipIndex].content}</p>
                            {businessTips[currentTipIndex].actionUrl && (
                              <Link 
                                to={businessTips[currentTipIndex].actionUrl!}
                                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105"
                              >
                                <Plus className="w-3 h-3" />
                                {t('dashboard.recommendations.takeAction', 'Take Action')}
                              </Link>
                            )}
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
            </div>

            {/* Full-Width Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-8">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                    <Zap className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">{t('dashboard.quickActions.title', 'Quick Actions')}</h3>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
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
              </>
              } />
              
              {/* Default route - redirect to overview */}
              <Route path="" element={<Navigate to="overview" replace />} />
              
              {/* Placeholder routes for other sections */}
              <Route path="automations" element={<AutomationsEmptyState />} />
              <Route path="prompts" element={
                <PromptTemplates
                  user={user}
                  authToken={authToken}
                  onTokenRefreshed={onTokenRefreshed}
                />
              } />
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
              <Route path="videos" element={<VideosEmptyState />} />
              <Route path="profile" element={
                <UserProfile
                  user={user}
                  authToken={authToken}
                  onTokenRefreshed={onTokenRefreshed}
                />
              } />
            </Routes>
          </div>
        </main>
      </div>

      {/* Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={closeCommandPalette}
        onOpenModal={handleModalOpen}
        userCredits={userCredits?.balance || 0}
        hasBusinessProfile={!!selectedBusinessProfile}
        isAuthenticated={!!user}
      />
    </div>
  );
};

export default Dashboard;
