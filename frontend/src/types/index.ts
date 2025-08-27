export interface BusinessProfile {
  company_name?: string;
  website_url?: string;
  offer?: string;
  target_customer?: string;
  problems?: string;
  desires?: string;
  tone?: string;
  language?: string;
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
  FORM = 'FORM'
}

export interface LoadingState {
  isLoading: boolean;
  progress: number;
  text: string;
}
