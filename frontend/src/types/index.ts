export interface BusinessProfile {
  // Frontend internal names (used in forms and components)
  company_name?: string;
  website_url?: string;
  offer?: string;
  target_customer?: string;
  problems?: string;
  desires?: string;
  tone?: string;
  language?: string;
}

export interface BusinessProfileApi {
  // Backend API field names (used for API calls)
  name?: string;
  website_url?: string;
  offer_description?: string;
  target_customer?: string;
  problem_solved?: string;
  customer_desires?: string;
  brand_tone?: string;
  communication_language?: string;
  is_active?: boolean;
}

export interface AnalysisResult {
  success: boolean;
  data?: BusinessProfile;
  error?: string;
}

export interface FormData {
  companyName: string;
  formWebsiteUrl: string;
  offerDescription: string;
  targetCustomer: string;
  problemSolved: string;
  customerDesires: string;
  brandTone: string;
  communicationLanguage: string;
}

export enum AppSection {
  URL_INPUT = 'URL_INPUT',
  LOADING = 'LOADING',
  FORM = 'FORM',
  SIGNUP = 'SIGNUP',
  SIGNIN = 'SIGNIN',
  DASHBOARD = 'DASHBOARD',
  BUSINESS_PROFILES = 'BUSINESS_PROFILES'
}

export interface LoadingState {
  isLoading: boolean;
  progress: number;
  text: string;
}

export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  access_token: string;
  refresh_token?: string;
}

export interface Offer {
  id: string;
  business_profile_id: string;
  type: 'product' | 'service';
  name: string;
  description?: string;
  unit: string;
  price: number;
  status: 'draft' | 'published' | 'archived';
  created_at: string;
  updated_at: string;
}

export interface Campaign {
  id: string;
  business_profile_id: string;
  user_id: string;
  goal: CampaignGoal;
  budget?: number;
  deadline?: string;
  selected_products: string[];
  strategy_summary?: string;
  timeline?: string;
  target_audience?: string;
  sales_funnel_steps?: string;
  channels?: Record<string, boolean>;
  channels_rationale?: Record<string, string>;
  recommended_budget?: number;
  risks_recommendations?: string;
  status: 'draft' | 'published' | 'archived';
  created_at: string;
  updated_at: string;
}

export type CampaignGoal = 
  | 'Brand Awareness'
  | 'Lead Generation'
  | 'Sales / Conversions'
  | 'Product Launch'
  | 'Customer Retention & Loyalty'
  | 'Event Promotion'
  | 'Rebranding / Reputation Management'
  | 'Community Engagement';

export interface CampaignGenerationParams {
  campaign_goal: CampaignGoal;
  budget?: number;
  deadline?: string;
  selected_products?: string[];
}

export interface CampaignGenerationResult {
  campaign_data: {
    strategy_summary: string;
    timeline: string;
    target_audience: string;
    sales_funnel_steps: string;
    channels: Record<string, boolean>;
    channels_rationale: Record<string, string>;
    recommended_budget?: number;
    risks_recommendations: string;
  };
  business_profile_id: string;
  campaign_params: CampaignGenerationParams;
}

export interface Ad {
  id: string;
  business_profile_id: string;
  user_id: string;
  offer_id?: string;
  campaign_id?: string;
  platform: AdPlatform;
  format: AdFormat;
  action: AdAction;
  headline?: string;
  primary_text?: string;
  visual_brief?: string;
  overlay_text?: string;
  script_text?: string;
  cta?: string;
  asset_url?: string;
  landing_url?: string;
  status: 'draft' | 'published' | 'archived';
  created_at: string;
  updated_at: string;
}

export type AdPlatform = 
  | 'facebook'
  | 'google_search'
  | 'tiktok'
  | 'instagram'
  | 'youtube'
  | 'linkedin'
  | 'x'
  | 'google_display';

export type AdFormat = 
  | 'video'
  | 'image'
  | 'text'
  | 'carousel';

export type AdAction = 
  | 'visit_page'
  | 'submit_form'
  | 'purchase'
  | 'download'
  | 'message'
  | 'call'
  | 'like'
  | 'follow';

export interface AdGenerationParams {
  platform: AdPlatform;
  format: AdFormat;
  action: AdAction;
  offer_id?: string;
  campaign_id?: string;
}

export interface HeadlineGenerationResult {
  headlines: string[]; // Now just an array of headline strings
  headline_count: number;
  business_profile_id: string;
  generation_params?: AdGenerationParams; // Include the generation params for context
}

export interface CreativeGenerationResult {
  creatives: Array<{
    primary_text?: string;
    visual_brief?: string;
    overlay_text?: string;
    script_text?: string;
    cta?: string;
    landing_url?: string;
    asset_url?: string;
    headline?: string;
  }>;
  created_ads: Ad[];
  ads_count: number;
  business_profile_id: string;
}

// Script Hooks Generation Types
export interface ScriptHookCategory {
  number: string;
  name: string;
  purpose: string;
  example: string;
}

export interface ScriptHookGenerationParams {
  business_profile_id: string;
  category: string;
  additional_context?: string;
}

export interface ScriptHook {
  category: string;
  hook: string;
  purpose: string;
}

export interface ScriptHookGenerationResult {
  hooks: ScriptHook[];
  hook_count: number;
  business_profile_id: string;
  category: ScriptHookCategory;
  generation_params: ScriptHookGenerationParams;
}

// Script Generation Types
export type ScriptType = 'post' | 'blog' | 'script_youtube' | 'script_tiktok_reel' | 'script_vsl' | 'general';

export interface ScriptGenerationParams {
  selected_hook: string;
  script_type: ScriptType;
  business_profile_id: string;
  style_id?: string;
  additional_context?: string;
  offer_id?: string;
  campaign_id?: string;
}

export interface GeneratedScript {
  id: string;
  user_id: string;
  business_profile_id: string;
  style_id?: string;
  title: string;
  content: string;
  script_type: ScriptType;
  offer_id?: string;
  campaign_id?: string;
  status: 'draft' | 'published' | 'archived';
  created_at: string;
  updated_at: string;
}

export interface ScriptBeat {
  timestamp?: string;
  section?: string;
  content?: string;
  text?: string;
}

export interface ScriptCTA {
  alternatives?: string[];
}

export interface ScriptGenerationResult {
  script: GeneratedScript | null;
  success?: boolean;
  error?: string;
  business_profile_id: string;
  generation_params: {
    selected_hook: string;
    script_type: ScriptType;
    style_id?: string;
    additional_context: string;
  };
  // Rich metadata fields from OpenAI
  beats?: ScriptBeat[];
  checklist?: string[];
  cta?: ScriptCTA;
  estimated_duration_sec?: number;
  metadata?: any;
  language?: string;
  // Content fields (available in background mode at root level)
  title?: string;
  content?: string;
  type?: string;
}

export interface ScriptTypeInfo {
  name: string;
  description: string;
  max_length: string;
}

// Credit System Types
export interface UserCredit {
  balance: number;
  monthly_quota: number;
  subscription_status: 'free_trial' | 'active' | 'inactive';
  renewal_date?: string;
  is_renewal_due?: boolean;
}

export interface CreditTransaction {
  id: string;
  transaction_type: 'earned' | 'spent' | 'expired' | 'renewal';
  amount: number;
  balance_after: number;
  description: string;
  tool_slug?: string;
  interaction_id?: string;
  created_at: string;
}

export interface ToolCost {
  [toolSlug: string]: number;
}

export interface CreditError {
  error: 'INSUFFICIENT_CREDITS';
  message: string;
  required_credits: number;
  current_balance: number;
  subscription_status: string;
}

// Prompt Templates Types
export interface PromptTemplate {
  id: string;
  title: string;
  description?: string;
  content: string;
  category: string;
  dependencies: string[];
  language: 'en' | 'pl';
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface TemplatesResponse {
  templates: PromptTemplate[];
  count: number;
}

export interface CategoriesResponse {
  categories: string[];
  count: number;
}

export interface TemplatePersonalizationData {
  businessProfile?: BusinessProfileApi;
  competitors?: any[];
  offers?: Offer[];
  campaigns?: Campaign[];
  scripts?: GeneratedScript[];
  ads?: Ad[];
  user?: User;
  userCredits?: UserCredit;
}

export interface PersonalizedTemplate {
  originalTemplate: PromptTemplate;
  personalizedContent: string;
  missingDependencies: string[];
  availableDependencies: string[];
}
