import { PromptTemplate, TemplatePersonalizationData, PersonalizedTemplate, BusinessProfileApi, Offer, Campaign, Ad, GeneratedScript, User, UserCredit } from '../types';

export class TemplatePersonalizationEngine {
  /**
   * Personalizes a template by replacing placeholders with actual user data
   */
  static personalizeTemplate(template: PromptTemplate, data: TemplatePersonalizationData): PersonalizedTemplate {
    let personalizedContent = template.content;
    const missingDependencies: string[] = [];
    const availableDependencies: string[] = [];

    // Check which dependencies are available
    const dependencyChecks = {
      'business_profile': !!data.businessProfile,
      'competitors': !!(data.competitors && data.competitors.length > 0),
      'offers': !!(data.offers && data.offers.length > 0),
      'campaigns': !!(data.campaigns && data.campaigns.length > 0),
      'scripts': !!(data.scripts && data.scripts.length > 0),
      'ads': !!(data.ads && data.ads.length > 0),
      'user': !!data.user,
      'user_credits': !!data.userCredits
    };

    // Check template dependencies
    template.dependencies.forEach(dep => {
      if (dependencyChecks[dep as keyof typeof dependencyChecks]) {
        availableDependencies.push(dep);
      } else {
        missingDependencies.push(dep);
      }
    });

    // Replace placeholders
    personalizedContent = this.replacePlaceholders(personalizedContent, data);

    return {
      originalTemplate: template,
      personalizedContent,
      missingDependencies,
      availableDependencies
    };
  }

  /**
   * Replaces all placeholders in content with actual data
   */
  private static replacePlaceholders(content: string, data: TemplatePersonalizationData): string {
    let result = content;

    // Business Profile placeholders
    if (data.businessProfile) {
      result = this.replaceBusinessProfilePlaceholders(result, data.businessProfile);
    }

    // Competitors placeholders
    if (data.competitors && data.competitors.length > 0) {
      result = this.replaceCompetitorsPlaceholders(result, data.competitors);
    }

    // Offers placeholders
    if (data.offers && data.offers.length > 0) {
      result = this.replaceOffersPlaceholders(result, data.offers);
    }

    // Campaigns placeholders
    if (data.campaigns && data.campaigns.length > 0) {
      result = this.replaceCampaignsPlaceholders(result, data.campaigns);
    }

    // Scripts placeholders
    if (data.scripts && data.scripts.length > 0) {
      result = this.replaceScriptsPlaceholders(result, data.scripts);
    }

    // Ads placeholders
    if (data.ads && data.ads.length > 0) {
      result = this.replaceAdsPlaceholders(result, data.ads);
    }

    // User placeholders
    if (data.user) {
      result = this.replaceUserPlaceholders(result, data.user);
    }

    // User credits placeholders
    if (data.userCredits) {
      result = this.replaceUserCreditsPlaceholders(result, data.userCredits);
    }

    // Dynamic content placeholders
    result = this.replaceDynamicPlaceholders(result);

    return result;
  }

  private static replaceBusinessProfilePlaceholders(content: string, businessProfile: BusinessProfileApi): string {
    const replacements = {
      '{{business_profile.name}}': businessProfile.name || '[Business Name]',
      '{{business_profile.website_url}}': businessProfile.website_url || '[Website URL]',
      '{{business_profile.offer_description}}': businessProfile.offer_description || '[Offer Description]',
      '{{business_profile.target_customer}}': businessProfile.target_customer || '[Target Customer]',
      '{{business_profile.problem_solved}}': businessProfile.problem_solved || '[Problem Solved]',
      '{{business_profile.customer_desires}}': businessProfile.customer_desires || '[Customer Desires]',
      '{{business_profile.brand_tone}}': businessProfile.brand_tone || '[Brand Tone]',
      '{{business_profile.communication_language}}': businessProfile.communication_language || '[Language]'
    };

    return this.applyReplacements(content, replacements);
  }

  private static replaceCompetitorsPlaceholders(content: string, competitors: any[]): string {
    const competitorNames = competitors.map(c => c.name || c.company_name).filter(Boolean);

    const replacements = {
      '{{competitors.top_1}}': competitorNames[0] || '[Primary Competitor]',
      '{{competitors.top_3}}': competitorNames.slice(0, 3).join(', ') || '[Top 3 Competitors]',
      '{{competitors.all}}': competitorNames.join(', ') || '[All Competitors]',
      '{{competitors.count}}': competitors.length.toString()
    };

    return this.applyReplacements(content, replacements);
  }

  private static replaceOffersPlaceholders(content: string, offers: Offer[]): string {
    const productOffers = offers.filter(o => o.type === 'product');
    const serviceOffers = offers.filter(o => o.type === 'service');
    const prices = offers.map(o => o.price).filter(p => p > 0);

    const replacements = {
      '{{offers.primary}}': offers[0]?.name || '[Primary Offer]',
      '{{offers.products}}': productOffers.map(o => o.name).join(', ') || '[Product Offers]',
      '{{offers.services}}': serviceOffers.map(o => o.name).join(', ') || '[Service Offers]',
      '{{offers.all}}': offers.map(o => o.name).join(', ') || '[All Offers]',
      '{{offers.count}}': offers.length.toString(),
      '{{offers.price_range}}': prices.length > 0 ?
        `$${Math.min(...prices)} - $${Math.max(...prices)}` : '[Price Range]'
    };

    return this.applyReplacements(content, replacements);
  }

  private static replaceCampaignsPlaceholders(content: string, campaigns: Campaign[]): string {
    const activeCampaigns = campaigns.filter(c => c.status === 'published');
    const latestCampaign = campaigns.sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0];

    const replacements = {
      '{{campaigns.latest}}': latestCampaign?.strategy_summary?.split('\n')[0] || '[Latest Campaign]',
      '{{campaigns.active}}': activeCampaigns.map(c =>
        c.strategy_summary?.split('\n')[0] || 'Campaign'
      ).join(', ') || '[Active Campaigns]',
      '{{campaigns.goals}}': Array.from(new Set(campaigns.map(c => c.goal))).join(', ') || '[Campaign Goals]',
      '{{campaigns.count}}': campaigns.length.toString()
    };

    return this.applyReplacements(content, replacements);
  }

  private static replaceScriptsPlaceholders(content: string, scripts: GeneratedScript[]): string {
    const latestScript = scripts.sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0];

    const scriptTypes = Array.from(new Set(scripts.map(s => s.script_type)));
    const youtubeScripts = scripts.filter(s => s.script_type === 'script_youtube');
    const tiktokScripts = scripts.filter(s => s.script_type === 'script_tiktok_reel');

    const replacements = {
      '{{scripts.latest}}': latestScript?.title || '[Latest Script]',
      '{{scripts.youtube_count}}': youtubeScripts.length.toString(),
      '{{scripts.tiktok_count}}': tiktokScripts.length.toString(),
      '{{scripts.types}}': scriptTypes.join(', ') || '[Script Types]'
    };

    return this.applyReplacements(content, replacements);
  }

  private static replaceAdsPlaceholders(content: string, ads: Ad[]): string {
    const platforms = Array.from(new Set(ads.map(a => a.platform)));
    const facebookAds = ads.filter(a => a.platform === 'facebook');
    const googleAds = ads.filter(a => a.platform === 'google_search' || a.platform === 'google_display');
    const latestAd = ads.sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0];

    const replacements = {
      '{{ads.platforms}}': platforms.join(', ') || '[Ad Platforms]',
      '{{ads.facebook_count}}': facebookAds.length.toString(),
      '{{ads.google_count}}': googleAds.length.toString(),
      '{{ads.latest_headline}}': latestAd?.headline || '[Latest Ad Headline]'
    };

    return this.applyReplacements(content, replacements);
  }

  private static replaceUserPlaceholders(content: string, user: User): string {
    const replacements = {
      '{{user.email}}': user.email || '[User Email]'
    };

    return this.applyReplacements(content, replacements);
  }

  private static replaceUserCreditsPlaceholders(content: string, userCredits: UserCredit): string {
    const replacements = {
      '{{user.credits_balance}}': userCredits.balance.toString(),
      '{{user.subscription_status}}': userCredits.subscription_status || '[Subscription Status]'
    };

    return this.applyReplacements(content, replacements);
  }

  private static replaceDynamicPlaceholders(content: string): string {
    const now = new Date();
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const replacements = {
      '{{current_date}}': now.toLocaleDateString(),
      '{{current_month}}': monthNames[now.getMonth()],
      '{{current_year}}': now.getFullYear().toString()
    };

    return this.applyReplacements(content, replacements);
  }

  private static applyReplacements(content: string, replacements: Record<string, string>): string {
    let result = content;

    Object.entries(replacements).forEach(([placeholder, value]) => {
      // Use global replace to handle multiple occurrences
      result = result.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
    });

    return result;
  }

  /**
   * Extracts all placeholders from template content
   */
  static extractPlaceholders(content: string): string[] {
    const placeholderRegex = /\{\{([^}]+)\}\}/g;
    const placeholders: string[] = [];
    let match;

    while ((match = placeholderRegex.exec(content)) !== null) {
      placeholders.push(match[0]); // Include the full {{placeholder}} syntax
    }

    return Array.from(new Set(placeholders)); // Remove duplicates
  }

  /**
   * Validates if all required dependencies are available for a template
   */
  static validateDependencies(template: PromptTemplate, data: TemplatePersonalizationData): {
    valid: boolean;
    missing: string[];
    available: string[]
  } {
    const missing: string[] = [];
    const available: string[] = [];

    const dependencyChecks = {
      'business_profile': !!data.businessProfile,
      'competitors': !!(data.competitors && data.competitors.length > 0),
      'offers': !!(data.offers && data.offers.length > 0),
      'campaigns': !!(data.campaigns && data.campaigns.length > 0),
      'scripts': !!(data.scripts && data.scripts.length > 0),
      'ads': !!(data.ads && data.ads.length > 0),
      'user': !!data.user,
      'user_credits': !!data.userCredits
    };

    template.dependencies.forEach(dep => {
      if (dependencyChecks[dep as keyof typeof dependencyChecks]) {
        available.push(dep);
      } else {
        missing.push(dep);
      }
    });

    return {
      valid: missing.length === 0,
      missing,
      available
    };
  }
}