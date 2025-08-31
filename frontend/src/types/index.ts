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
