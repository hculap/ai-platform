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
      'user_credits': !!data.userCredits,
      'user_styles': true // Default to available for now
    };

    // Check template dependencies
    template.dependencies.forEach(dep => {
      if (dependencyChecks[dep as keyof typeof dependencyChecks]) {
        availableDependencies.push(dep);
      } else {
        missingDependencies.push(dep);
      }
    });

    // Replace placeholders (both simple and complex formats)
    personalizedContent = this.replacePlaceholders(personalizedContent, data);
    personalizedContent = this.replaceSimplePlaceholders(personalizedContent, data);

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

  /**
   * Replaces simple single-brace placeholders with actual data
   */
  private static replaceSimplePlaceholders(content: string, data: TemplatePersonalizationData): string {
    let result = content;

    // Business Profile placeholders (original schema only)
    if (data.businessProfile) {
      const businessReplacements = {
        '{business_name}': data.businessProfile.name || '[Business Name]',
        '{website_url}': data.businessProfile.website_url || '[Website URL]',
        '{offer_description}': data.businessProfile.offer_description || '[Offer Description]',
        '{target_customer}': data.businessProfile.target_customer || '[Target Customer]',
        '{problem_solved}': data.businessProfile.problem_solved || '[Problem Solved]',
        '{customer_desires}': data.businessProfile.customer_desires || '[Customer Desires]',
        '{brand_tone}': data.businessProfile.brand_tone || '[Brand Tone]',
        '{communication_language}': data.businessProfile.communication_language || '[Communication Language]'
      };
      result = this.applyReplacements(result, businessReplacements);
    }

    // Competitors simple placeholders
    if (data.competitors && data.competitors.length > 0) {
      const competitorNames = data.competitors.map(c => c.name || c.company_name).filter(Boolean);
      const competitorsReplacements = {
        '{competitors_list}': competitorNames.join('\n- ') ? `- ${competitorNames.join('\n- ')}` : '[No competitors found]',
        '{competitors_summary}': competitorNames.join(', ') || '[Competitors]',
        '{competitor_analysis}': competitorNames.length > 0 ?
          `Analyzed ${competitorNames.length} competitors: ${competitorNames.slice(0, 3).join(', ')}` : '[No competitor analysis available]',
        '{Top Competitor Name}': competitorNames[0] || '[Top Competitor]',
        '{Second Competitor}': competitorNames[1] || '[Second Competitor]',
        '{Competitor Service}': competitorNames[0] ? `${competitorNames[0]}'s service` : '[Competitor Service]'
      };
      console.log('Competitor names:', competitorNames);
      console.log('Competitors replacements:', competitorsReplacements);
      result = this.applyReplacements(result, competitorsReplacements);
      console.log('After competitors replacements:', result.substring(0, 200) + '...');
    }

    // Offers simple placeholders
    if (data.offers && data.offers.length > 0) {
      const offerNames = data.offers.map(o => o.name).filter(Boolean);
      const offersReplacements = {
        '{selected_products}': offerNames.join('\n- ') ? `- ${offerNames.join('\n- ')}` : '[No products selected]',
        '{promoted_offers}': offerNames.join(', ') || '[No offers to promote]',
        '{product_catalog}': offerNames.join(', ') || '[Product Catalog]'
      };
      result = this.applyReplacements(result, offersReplacements);
    }

    // Campaigns simple placeholders
    if (data.campaigns && data.campaigns.length > 0) {
      const latestCampaign = data.campaigns.sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0];

      const campaignsReplacements = {
        '{campaign_goal}': latestCampaign?.goal || '[Campaign Goal]',
        '{campaign_name}': latestCampaign?.strategy_summary?.split('\n')[0] || '[Campaign Name]',
        '{campaign_budget}': latestCampaign?.budget ? `$${latestCampaign.budget}` : '[Campaign Budget]',
        '{campaign_deadline}': latestCampaign?.deadline || '[Campaign Deadline]'
      };
      result = this.applyReplacements(result, campaignsReplacements);
    }

    // Ads simple placeholders
    if (data.ads && data.ads.length > 0) {
      const latestAd = data.ads.sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0];

      const adsReplacements = {
        '{ad_platform}': latestAd?.platform || '[Ad Platform]',
        '{ad_type}': latestAd?.format || '[Ad Type]',
        '{ad_budget}': '[Ad Budget]' // Budget not available in Ad type
      };
      result = this.applyReplacements(result, adsReplacements);
    }

    // User styles simple placeholders
    if (data.scripts && data.scripts.length > 0) {
      const scriptsReplacements = {
        '{writing_style}': 'Personalized based on your content history',
        '{content_type}': 'Marketing content'
      };
      result = this.applyReplacements(result, scriptsReplacements);
    }

    // Default/fallback placeholders with smart defaults and current date
    const now = new Date();
    const currentYear = now.getFullYear();
    // const currentMonth = now.toLocaleDateString('en-US', { month: 'long' });
    const currentDate = now.toLocaleDateString();

    const defaultReplacements = {
      // Core business placeholders
      '{business_name}': '[Your Business Name]',
      '{business_industry}': '[Your Industry]',
      '{business_description}': '[Your Business Description]',
      '{target_audience}': '[Your Target Audience]',
      '{competitors_list}': '[Your Competitors]',
      '{selected_products}': '[Your Products/Services]',
      '{writing_style}': 'professional and engaging',
      '{content_type}': 'Marketing content',

      // Brand and messaging
      '{Brand Voice}': 'Professional and Engaging',
      '{brand_voice}': 'professional and engaging',
      '{brand_tone}': 'professional and engaging',
      '{key_messages}': '[Your key marketing messages]',
      '{usp}': '[Your unique selling proposition]',
      '{Unique advantage}': '[Your unique competitive advantage]',

      // Company details
      '{Company}': '[Your Company Name]',
      '{CLIENT COMPANY}': '[Client Company Name]',
      '{Service Provider}': '[Your Company Name]',
      '{Your Service}': '[Your main service/product]',
      '{Professional Service}': '[Your professional service]',
      '{Core Service/Product}': '[Your core offering]',

      // Contact and personal info
      '{Your Name}': '[Your Name]',
      '{Your name}': '[Your name]',
      '{Name}': '[Name]',
      '{First Name}': '[First Name]',
      '{Email address}': '[email@example.com]',
      '{Phone number}': '[Phone Number]',


      // Outcomes and benefits
      '{Specific Benefit}': '[Specific benefit you provide]',
      '{Specific Result}': '[Specific result you deliver]',
      '{Achievement you enable}': '[Achievement you help clients reach]',
      '{Achieve Specific Outcome}': '[Specific outcome you help achieve]',
      '{Achieved Specific Result}': '[Specific result you\'ve delivered]',
      '{Solves Specific Problem}': '[Specific problem you solve]',

      // Time and dates
      '{Current Year}': currentYear.toString(),
      '{Current date}': currentDate,
      '{Years}': '5+ years',
      '{Years of experience}': '5+ years of experience',

      // Time and dates
      '{year}': currentYear.toString(),
      '{timeframe}': '3-6 months',
      '{X}': '10',
      '{number}': '5',
      '{location}': '[Your Location]',
      "'{phone number}'": '[Your Phone Number]',

      // Additional high-value placeholders from analysis
      "'{relevant topic}'": '[Relevant topic for your industry]',
      "'{contact information}'": '[Your Contact Information]',
      '{process}': '[Your process or methodology]',
      '{Process}': '[Your Process or Methodology]',
      '{service}': '[Your service]', // Ensure lowercase variant is covered

      // Financial and pricing
      '{Price}': '[Price]',
      '{Amount}': '[Amount]',
      '{Current revenue}': '[Current revenue]',
      '{ROI metric}': '[ROI percentage]',

      // Competition
      '{Top Competitor Name}': '[Top Competitor]',
      '{Second Competitor}': '[Second Competitor]',
      '{Competitor Service}': '[Competitor Service]',

      // Campaign and marketing
      '{campaign_name}': '[Campaign Name]',
      '{campaign_goal}': '[Campaign Goal]',
      '{campaign_budget}': '[Campaign Budget]',
      '{Primary Keyword}': '[Primary Keyword]',
      '{Secondary Keyword}': '[Secondary Keyword]',
      '{Target Audience}': '[Target Audience]',

      // Content and topics
      '{Main Topic}': '[Main Topic]',
      '{Secondary Topic}': '[Secondary Topic]',
      '{Topic}': '[Topic]',
      '{Title}': '[Title]',
      '{COMPELLING HEADLINE}': '[Compelling Headline]',

      // Industry and market
      '{Industry}': '[Your Industry]',
      '{Business_Industry}': '[Your Industry]',
      '{Primary Segment}': '[Primary Market Segment]',
      '{Geographic scope}': '[Geographic Area]',

      // Support and service levels
      '{Support level}': 'Standard support',
      '{Basic Package}': 'Basic Package',
      '{Premium Package}': 'Premium Package',
      '{Enterprise Package}': 'Enterprise Package'
    };

    // Only apply defaults for placeholders that haven't been replaced yet
    Object.entries(defaultReplacements).forEach(([placeholder, defaultValue]) => {
      if (result.includes(placeholder)) {
        result = result.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), defaultValue);
      }
    });

    // Handle bracket-style placeholders [Like This]
    const industry = data.businessProfile ? this.extractIndustryFromProfile(data.businessProfile) : '[Your Industry]';
    const bracketReplacements = {
      '[Brand Voice]': data.businessProfile?.brand_tone || 'professional and engaging',
      '[Business Name]': data.businessProfile?.name || '[Your Business Name]',
      '[Your Business Name]': data.businessProfile?.name || '[Your Business Name]',
      '[Your Industry]': industry,
      '[Target Audience]': data.businessProfile?.target_customer || '[Your Target Audience]',
      '[Your Service]': data.businessProfile?.offer_description || '[Your Service]',
      '[Service]': data.businessProfile?.offer_description || '[Service]',
      '[Top Competitor]': (data.competitors && data.competitors.length > 0) ?
        (data.competitors[0].name || data.competitors[0].company_name) : '[Top Competitor]',
      '[Competitor Service]': '[Competitor Service]',
      '[Price]': '[Price]',
      '[Your Name]': '[Your Name]',
      '[Company Name]': data.businessProfile?.name || '[Company Name]',
      '[Years of Experience]': '[5+ Years of Experience]',
      '[Specific Benefit]': data.businessProfile?.customer_desires || '[Specific Benefit]',
      '[Key Benefits]': data.businessProfile?.customer_desires || '[Key Benefits]',
      '[Primary Service]': data.businessProfile?.offer_description || '[Primary Service]',
      '[Core Offering]': data.businessProfile?.offer_description || '[Core Offering]'
    };

    result = this.applyReplacements(result, bracketReplacements);

    console.log('Final personalized content:', result.substring(0, 300) + '...');
    return result;
  }

  /**
   * Extracts industry information from business profile
   */
  private static extractIndustryFromProfile(businessProfile: BusinessProfileApi): string {
    console.log('DEBUG extractIndustryFromProfile: businessProfile:', businessProfile);

    // Try to derive industry from description or other fields
    if (businessProfile.offer_description) {
      const description = businessProfile.offer_description.toLowerCase();
      console.log('DEBUG extractIndustryFromProfile: description:', description);

      // Simple industry detection based on keywords - check more specific ones first
      if (description.includes('technology') || description.includes('software') || description.includes('tech') || description.includes('it ') || description.includes('digital')) {
        console.log('DEBUG extractIndustryFromProfile: Found Technology');
        return 'Technology';
      } else if (description.includes('restaurant') || description.includes('food') || description.includes('culinary')) {
        console.log('DEBUG extractIndustryFromProfile: Found Food & Restaurant');
        return 'Food & Restaurant';
      } else if (description.includes('retail') || description.includes('shop') || description.includes('store')) {
        console.log('DEBUG extractIndustryFromProfile: Found Retail');
        return 'Retail';
      } else if (description.includes('health') || description.includes('medical') || description.includes('wellness')) {
        console.log('DEBUG extractIndustryFromProfile: Found Healthcare');
        return 'Healthcare';
      } else if (description.includes('education') || description.includes('learning') || description.includes('training')) {
        console.log('DEBUG extractIndustryFromProfile: Found Education');
        return 'Education';
      } else if (description.includes('service') || description.includes('consulting')) {
        console.log('DEBUG extractIndustryFromProfile: Found Professional Services');
        return 'Professional Services';
      }
    } else {
      console.log('DEBUG extractIndustryFromProfile: No offer_description found');
    }

    console.log('DEBUG extractIndustryFromProfile: Returning fallback [Your Industry]');
    return '[Your Industry]';
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
      '{{user.email}}': user.email || '[User Email]',
      '{user_email}': user.email || '[User Email]'
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
    const placeholders: string[] = [];

    // Extract double-brace placeholders {{placeholder}}
    const doublePlaceholderRegex = /\{\{([^}]+)\}\}/g;
    let match;
    while ((match = doublePlaceholderRegex.exec(content)) !== null) {
      placeholders.push(match[0]);
    }

    // Extract single-brace placeholders {placeholder}
    const singlePlaceholderRegex = /\{([^{}]+)\}/g;
    while ((match = singlePlaceholderRegex.exec(content)) !== null) {
      placeholders.push(match[0]);
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
      'user_credits': !!data.userCredits,
      'user_styles': true // Default to available for now
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