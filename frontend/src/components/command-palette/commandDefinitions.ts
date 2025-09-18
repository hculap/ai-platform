import {
  Home, Bot, FileText, Video, Zap, Building2, Target, Package,
  TrendingUp, Megaphone, User, Settings, Plus, Search, Globe,
  CreditCard, Palette, BookOpen, Lightbulb, Users, Activity
} from 'lucide-react';

export interface Command {
  id: string;
  title: string;
  description: string;
  category: CommandCategory;
  icon: React.ComponentType<any>;
  action: CommandAction;
  keywords: string[];
  shortcut?: string;
  requiresAuth?: boolean;
  requiresBusinessProfile?: boolean;
  creditCost?: number;
}

export type CommandCategory =
  | 'navigation'
  | 'create'
  | 'ai'
  | 'search'
  | 'settings'
  | 'recent';

export interface CommandAction {
  type: 'navigate' | 'modal' | 'function' | 'external';
  target?: string;
  handler?: () => void;
  modalType?: string;
}

export const COMMAND_CATEGORIES = {
  navigation: {
    label: 'commandPalette.categories.navigation',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  create: {
    label: 'commandPalette.categories.create',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
  ai: {
    label: 'commandPalette.categories.ai',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
  search: {
    label: 'commandPalette.categories.search',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
  },
  settings: {
    label: 'commandPalette.categories.settings',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
  },
  recent: {
    label: 'commandPalette.categories.recent',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
  },
};

export const COMMANDS: Command[] = [
  // Navigation Commands
  {
    id: 'nav-dashboard',
    title: 'commandPalette.commands.dashboard.title',
    description: 'commandPalette.commands.dashboard.description',
    category: 'navigation',
    icon: Home,
    action: { type: 'navigate', target: '/dashboard' },
    keywords: ['dashboard', 'home', 'overview', 'main'],
    shortcut: 'G D',
  },
  {
    id: 'nav-prompts',
    title: 'commandPalette.commands.prompts.title',
    description: 'commandPalette.commands.prompts.description',
    category: 'navigation',
    icon: FileText,
    action: { type: 'navigate', target: '/dashboard/prompts' },
    keywords: ['prompts', 'templates', 'ai', 'chatgpt', 'claude'],
    shortcut: 'G P',
  },
  {
    id: 'nav-agents',
    title: 'commandPalette.commands.agents.title',
    description: 'commandPalette.commands.agents.description',
    category: 'navigation',
    icon: Bot,
    action: { type: 'navigate', target: '/dashboard/agents' },
    keywords: ['agents', 'ai', 'bot', 'assistant', 'automation'],
    shortcut: 'G A',
  },
  {
    id: 'nav-automations',
    title: 'commandPalette.commands.automations.title',
    description: 'commandPalette.commands.automations.description',
    category: 'navigation',
    icon: Zap,
    action: { type: 'navigate', target: '/dashboard/automations' },
    keywords: ['automations', 'workflows', 'automatic', 'trigger'],
    shortcut: 'G U',
  },
  {
    id: 'nav-videos',
    title: 'commandPalette.commands.videos.title',
    description: 'commandPalette.commands.videos.description',
    category: 'navigation',
    icon: Video,
    action: { type: 'navigate', target: '/dashboard/videos' },
    keywords: ['videos', 'content', 'media', 'film'],
    shortcut: 'G V',
  },
  {
    id: 'nav-business-profiles',
    title: 'commandPalette.commands.businessProfiles.title',
    description: 'commandPalette.commands.businessProfiles.description',
    category: 'navigation',
    icon: Building2,
    action: { type: 'navigate', target: '/dashboard/business-profiles' },
    keywords: ['business', 'profiles', 'company', 'organization'],
    shortcut: 'G B',
  },
  {
    id: 'nav-competition',
    title: 'commandPalette.commands.competition.title',
    description: 'commandPalette.commands.competition.description',
    category: 'navigation',
    icon: Target,
    action: { type: 'navigate', target: '/dashboard/competition' },
    keywords: ['competition', 'competitors', 'market', 'analysis'],
    shortcut: 'G C',
  },
  {
    id: 'nav-offers',
    title: 'commandPalette.commands.offers.title',
    description: 'commandPalette.commands.offers.description',
    category: 'navigation',
    icon: Package,
    action: { type: 'navigate', target: '/dashboard/offers' },
    keywords: ['offers', 'products', 'services', 'catalog'],
    shortcut: 'G O',
  },
  {
    id: 'nav-campaigns',
    title: 'commandPalette.commands.campaigns.title',
    description: 'commandPalette.commands.campaigns.description',
    category: 'navigation',
    icon: TrendingUp,
    action: { type: 'navigate', target: '/dashboard/campaigns' },
    keywords: ['campaigns', 'marketing', 'strategy', 'promotion'],
    shortcut: 'G M',
  },
  {
    id: 'nav-ads',
    title: 'commandPalette.commands.ads.title',
    description: 'commandPalette.commands.ads.description',
    category: 'navigation',
    icon: Megaphone,
    action: { type: 'navigate', target: '/dashboard/ads' },
    keywords: ['ads', 'advertisements', 'creative', 'promotion'],
    shortcut: 'G R',
  },
  {
    id: 'nav-scripts',
    title: 'commandPalette.commands.scripts.title',
    description: 'commandPalette.commands.scripts.description',
    category: 'navigation',
    icon: FileText,
    action: { type: 'navigate', target: '/dashboard/scripts' },
    keywords: ['scripts', 'content', 'writing', 'copy'],
    shortcut: 'G S',
  },
  {
    id: 'nav-profile',
    title: 'commandPalette.commands.profile.title',
    description: 'commandPalette.commands.profile.description',
    category: 'navigation',
    icon: User,
    action: { type: 'navigate', target: '/dashboard/profile' },
    keywords: ['profile', 'account', 'settings', 'user'],
    shortcut: 'G U',
  },

  // Create Commands (Navigate to pages)
  {
    id: 'create-business-profile',
    title: 'commandPalette.commands.createBusinessProfile.title',
    description: 'commandPalette.commands.createBusinessProfile.description',
    category: 'create',
    icon: Building2,
    action: { type: 'navigate', target: '/dashboard/business-profiles?action=create' },
    keywords: ['create', 'new', 'business', 'profile', 'company'],
    requiresAuth: true,
  },
  {
    id: 'create-competitor',
    title: 'commandPalette.commands.createCompetitor.title',
    description: 'commandPalette.commands.createCompetitor.description',
    category: 'create',
    icon: Target,
    action: { type: 'navigate', target: '/dashboard/competition?action=create' },
    keywords: ['create', 'add', 'competitor', 'competition'],
    requiresAuth: true,
    requiresBusinessProfile: true,
  },
  {
    id: 'create-offer',
    title: 'commandPalette.commands.createOffer.title',
    description: 'commandPalette.commands.createOffer.description',
    category: 'create',
    icon: Package,
    action: { type: 'navigate', target: '/dashboard/offers?action=create' },
    keywords: ['create', 'add', 'offer', 'product', 'service'],
    requiresAuth: true,
    requiresBusinessProfile: true,
  },
  {
    id: 'create-campaign',
    title: 'commandPalette.commands.createCampaign.title',
    description: 'commandPalette.commands.createCampaign.description',
    category: 'create',
    icon: TrendingUp,
    action: { type: 'navigate', target: '/dashboard/campaigns?action=create' },
    keywords: ['create', 'new', 'campaign', 'marketing'],
    requiresAuth: true,
    requiresBusinessProfile: true,
  },
  {
    id: 'create-ad',
    title: 'commandPalette.commands.createAd.title',
    description: 'commandPalette.commands.createAd.description',
    category: 'create',
    icon: Megaphone,
    action: { type: 'navigate', target: '/dashboard/ads?action=create' },
    keywords: ['create', 'new', 'ad', 'advertisement', 'creative'],
    requiresAuth: true,
    requiresBusinessProfile: true,
  },

  // AI Commands
  {
    id: 'ai-generate-script',
    title: 'commandPalette.commands.generateScript.title',
    description: 'commandPalette.commands.generateScript.description',
    category: 'ai',
    icon: Bot,
    action: { type: 'navigate', target: '/dashboard/scripts?action=generate' },
    keywords: ['generate', 'ai', 'script', 'content', 'writing'],
    requiresAuth: true,
    requiresBusinessProfile: true,
    creditCost: 10,
  },
  {
    id: 'ai-generate-campaign',
    title: 'commandPalette.commands.generateCampaign.title',
    description: 'commandPalette.commands.generateCampaign.description',
    category: 'ai',
    icon: Bot,
    action: { type: 'navigate', target: '/dashboard/campaigns?action=generate' },
    keywords: ['generate', 'ai', 'campaign', 'strategy', 'marketing'],
    requiresAuth: true,
    requiresBusinessProfile: true,
    creditCost: 25,
  },
  {
    id: 'ai-generate-offers',
    title: 'commandPalette.commands.generateOffers.title',
    description: 'commandPalette.commands.generateOffers.description',
    category: 'ai',
    icon: Bot,
    action: { type: 'navigate', target: '/dashboard/offers?action=generate' },
    keywords: ['generate', 'ai', 'offers', 'products', 'catalog'],
    requiresAuth: true,
    requiresBusinessProfile: true,
    creditCost: 15,
  },
  {
    id: 'ai-find-competitors',
    title: 'commandPalette.commands.findCompetitors.title',
    description: 'commandPalette.commands.findCompetitors.description',
    category: 'ai',
    icon: Bot,
    action: { type: 'navigate', target: '/dashboard/competition?action=find' },
    keywords: ['find', 'search', 'competitors', 'ai', 'research'],
    requiresAuth: true,
    requiresBusinessProfile: true,
    creditCost: 20,
  },
  {
    id: 'ai-analyze-website',
    title: 'commandPalette.commands.analyzeWebsite.title',
    description: 'commandPalette.commands.analyzeWebsite.description',
    category: 'ai',
    icon: Bot,
    action: { type: 'navigate', target: '/dashboard/business-profiles?action=analyze' },
    keywords: ['analyze', 'website', 'ai', 'insights', 'business'],
    requiresAuth: true,
    creditCost: 30,
  },
  {
    id: 'ai-generate-ads',
    title: 'commandPalette.commands.generateAds.title',
    description: 'commandPalette.commands.generateAds.description',
    category: 'ai',
    icon: Bot,
    action: { type: 'navigate', target: '/dashboard/ads?action=generate' },
    keywords: ['generate', 'ai', 'ads', 'advertisements', 'creative'],
    requiresAuth: true,
    requiresBusinessProfile: true,
    creditCost: 15,
  },

  // Search Commands
  {
    id: 'search-prompts',
    title: 'commandPalette.commands.searchPrompts.title',
    description: 'commandPalette.commands.searchPrompts.description',
    category: 'search',
    icon: Search,
    action: { type: 'navigate', target: '/dashboard/prompts?focus=search' },
    keywords: ['search', 'find', 'prompts', 'templates'],
    requiresAuth: true,
  },
  {
    id: 'search-competitors',
    title: 'commandPalette.commands.searchCompetitors.title',
    description: 'commandPalette.commands.searchCompetitors.description',
    category: 'search',
    icon: Search,
    action: { type: 'navigate', target: '/dashboard/competition?focus=search' },
    keywords: ['search', 'find', 'competitors', 'competition'],
    requiresAuth: true,
    requiresBusinessProfile: true,
  },
  {
    id: 'search-offers',
    title: 'commandPalette.commands.searchOffers.title',
    description: 'commandPalette.commands.searchOffers.description',
    category: 'search',
    icon: Search,
    action: { type: 'navigate', target: '/dashboard/offers?focus=search' },
    keywords: ['search', 'find', 'offers', 'products'],
    requiresAuth: true,
    requiresBusinessProfile: true,
  },

  // Settings Commands
  {
    id: 'manage-credits',
    title: 'commandPalette.commands.manageCredits.title',
    description: 'commandPalette.commands.manageCredits.description',
    category: 'settings',
    icon: CreditCard,
    action: { type: 'modal', modalType: 'manage-credits' },
    keywords: ['credits', 'billing', 'subscription', 'upgrade'],
    requiresAuth: true,
  },
  {
    id: 'switch-language',
    title: 'commandPalette.commands.switchLanguage.title',
    description: 'commandPalette.commands.switchLanguage.description',
    category: 'settings',
    icon: Globe,
    action: { type: 'navigate', target: '/dashboard/profile?section=language' },
    keywords: ['language', 'locale', 'polish', 'english', 'settings'],
    requiresAuth: true,
  },
  {
    id: 'clone-style',
    title: 'commandPalette.commands.cloneStyle.title',
    description: 'commandPalette.commands.cloneStyle.description',
    category: 'settings',
    icon: Palette,
    action: { type: 'modal', modalType: 'clone-style' },
    keywords: ['clone', 'style', 'writing', 'copy', 'ai'],
    requiresAuth: true,
    requiresBusinessProfile: true,
    creditCost: 50,
  },
];