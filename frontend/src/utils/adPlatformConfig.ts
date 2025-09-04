import { AdPlatform, AdFormat, AdAction } from '../types';

/**
 * Configuration mapping for ad platforms, supported formats, and actions
 * Based on 2024 platform specifications and capabilities
 */

export interface PlatformFormatConfig {
  formats: AdFormat[];
  actions: {
    [key in AdFormat]?: AdAction[];
  };
}

export type AdPlatformConfig = {
  [key in AdPlatform]: PlatformFormatConfig;
};

export const AD_PLATFORM_CONFIG: AdPlatformConfig = {
  facebook: {
    formats: ['video', 'image', 'carousel'],
    actions: {
      video: ['visit_page', 'submit_form', 'purchase', 'like', 'follow', 'message'],
      image: ['visit_page', 'submit_form', 'purchase', 'like', 'follow', 'message'],
      carousel: ['visit_page', 'submit_form', 'purchase', 'like', 'follow']
    }
  },
  
  instagram: {
    formats: ['video', 'image', 'carousel'],
    actions: {
      video: ['visit_page', 'submit_form', 'purchase', 'like', 'follow', 'message'],
      image: ['visit_page', 'submit_form', 'purchase', 'like', 'follow', 'message'],
      carousel: ['visit_page', 'submit_form', 'purchase', 'like', 'follow']
    }
  },
  
  google_search: {
    formats: ['text'],
    actions: {
      text: ['visit_page', 'submit_form', 'call', 'purchase', 'download']
    }
  },
  
  google_display: {
    formats: ['image', 'video'],
    actions: {
      image: ['visit_page', 'submit_form', 'purchase', 'download'],
      video: ['visit_page', 'submit_form', 'purchase', 'download']
    }
  },
  
  youtube: {
    formats: ['video'],
    actions: {
      video: ['visit_page', 'submit_form', 'follow', 'purchase', 'like']
    }
  },
  
  tiktok: {
    formats: ['video', 'image'],
    actions: {
      video: ['visit_page', 'like', 'follow', 'purchase', 'download'],
      image: ['visit_page', 'like', 'follow', 'purchase']
    }
  },
  
  linkedin: {
    formats: ['video', 'image', 'text', 'carousel'],
    actions: {
      video: ['visit_page', 'submit_form', 'message', 'follow', 'download'],
      image: ['visit_page', 'submit_form', 'message', 'follow', 'download'],
      text: ['visit_page', 'submit_form', 'message', 'follow'],
      carousel: ['visit_page', 'submit_form', 'follow']
    }
  },
  
  x: {
    formats: ['video', 'image', 'text'],
    actions: {
      video: ['visit_page', 'like', 'follow', 'message'],
      image: ['visit_page', 'like', 'follow', 'message'],
      text: ['visit_page', 'like', 'follow', 'message']
    }
  }
};

/**
 * Get available formats for a specific platform
 */
export const getAvailableFormats = (platform: AdPlatform): AdFormat[] => {
  return AD_PLATFORM_CONFIG[platform]?.formats || [];
};

/**
 * Get available actions for a specific platform and format combination
 */
export const getAvailableActions = (platform: AdPlatform, format: AdFormat): AdAction[] => {
  const platformConfig = AD_PLATFORM_CONFIG[platform];
  if (!platformConfig || !platformConfig.actions[format]) {
    return [];
  }
  return platformConfig.actions[format] || [];
};

/**
 * Check if a platform/format/action combination is valid
 */
export const isValidCombination = (
  platform: AdPlatform, 
  format: AdFormat, 
  action: AdAction
): boolean => {
  const availableFormats = getAvailableFormats(platform);
  if (!availableFormats.includes(format)) {
    return false;
  }
  
  const availableActions = getAvailableActions(platform, format);
  return availableActions.includes(action);
};

/**
 * Get the first valid format for a platform (default selection)
 */
export const getDefaultFormat = (platform: AdPlatform): AdFormat | null => {
  const formats = getAvailableFormats(platform);
  return formats.length > 0 ? formats[0] : null;
};

/**
 * Get the first valid action for a platform/format combination (default selection)
 */
export const getDefaultAction = (platform: AdPlatform, format: AdFormat): AdAction | null => {
  const actions = getAvailableActions(platform, format);
  return actions.length > 0 ? actions[0] : null;
};

/**
 * Get platform display names for better UX
 */
export const getPlatformDisplayName = (platform: AdPlatform): string => {
  const displayNames: { [key in AdPlatform]: string } = {
    facebook: 'Facebook',
    instagram: 'Instagram',
    google_search: 'Google Search',
    google_display: 'Google Display',
    youtube: 'YouTube',
    tiktok: 'TikTok',
    linkedin: 'LinkedIn',
    x: 'X (Twitter)'
  };
  
  return displayNames[platform] || platform;
};

/**
 * Get format display names for better UX
 */
export const getFormatDisplayName = (format: AdFormat): string => {
  const displayNames: { [key in AdFormat]: string } = {
    video: 'Video',
    image: 'Image',
    text: 'Text',
    carousel: 'Carousel'
  };
  
  return displayNames[format] || format;
};

/**
 * Get action display names for better UX
 */
export const getActionDisplayName = (action: AdAction): string => {
  const displayNames: { [key in AdAction]: string } = {
    visit_page: 'Visit Website',
    submit_form: 'Submit Form',
    purchase: 'Purchase',
    download: 'Download',
    message: 'Send Message',
    call: 'Call Now',
    like: 'Like',
    follow: 'Follow'
  };
  
  return displayNames[action] || action;
};