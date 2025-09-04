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
  landing_url?: string;
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
