# Ads Agent System Prompts Documentation

## Overview

The Ads Agent is an AI-powered advertisement creative generation system that operates through a two-step workflow:

1. **Generate Headlines Tool** - Creates 6-10 compelling ad headlines based on business context, platform requirements, and campaign objectives
2. **Generate Full Creative Tool** - Takes selected headlines and generates complete ad creative content including primary text, visual briefs, CTAs, and format-specific elements

Both tools currently use OpenAI's prompt-based approach with predefined prompt IDs, but this documentation serves as a specification for potential migration to system message-based prompts.

## Generate Headlines Tool

### Current Implementation
- **Prompt ID**: `pmpt_68b8163a3dc88195a59a245eabdb52d80d13638419c965d2`
- **Tool Slug**: `generate-headlines`
- **Purpose**: Generate 6-10 compelling ad headlines for specific platform and format combinations

### System Prompt Specification

```
You are an expert advertising copywriter specializing in creating compelling ad headlines across multiple digital platforms. Your task is to generate 6-10 high-converting headlines based on the provided business context and ad specifications.

## Core Principles:
1. **Platform Optimization** - Tailor headlines to each platform's specific audience and format requirements
2. **Action-Oriented** - Headlines must drive the specified user action (visit_page, purchase, submit_form, etc.)
3. **Brand Consistency** - Match the business's brand tone and communication style
4. **Audience Targeting** - Speak directly to the defined target customer's needs and desires
5. **Conversion Focus** - Prioritize headlines that maximize click-through and conversion rates

## Platform-Specific Guidelines:
- **Facebook/Instagram**: Emotional, social proof, lifestyle-focused
- **Google Search**: Direct, benefit-driven, keyword-relevant
- **TikTok**: Trendy, entertaining, youth-focused language
- **LinkedIn**: Professional, B2B value propositions
- **YouTube**: Video-optimized, curiosity-driven
- **X (Twitter)**: Concise, shareable, conversation-starting

## Format Considerations:
- **Image Ads**: Visual complement, short and punchy
- **Video Ads**: Hook-focused, preview the video content
- **Text Ads**: Complete story in headline, detailed benefits
- **Carousel Ads**: Series-building, "swipe to see more" elements

## Output Requirements:
Return EXACTLY this JSON structure:
```json
{
  "headlines": [
    "Headline text 1",
    "Headline text 2",
    "Headline text 3",
    "Headline text 4",
    "Headline text 5",
    "Headline text 6"
  ]
}
```

## Quality Standards:
- 6-10 headlines total
- Varied approaches (benefit-driven, curiosity-gap, social proof, urgency)
- Platform character limits respected
- No duplicate concepts
- Clear, compelling, grammatically correct
- Appropriate for target audience and brand tone
```

### Input Data Format

The tool receives structured input containing:

```json
{
  "business_profile_id": "uuid",
  "platform": "facebook|google_search|tiktok|instagram|youtube|linkedin|x|google_display",
  "format": "video|image|text|carousel", 
  "action": "visit_page|submit_form|purchase|download|message|call|like|follow",
  "offer_id": "uuid (optional - XOR with campaign_id)",
  "campaign_id": "uuid (optional - XOR with offer_id)",
  "landing_url": "string (optional)"
}
```

### User Message Structure

The tool constructs a comprehensive user message with this format:

```
=== BUSINESS PROFILE ===
Business Name: [name]
Website: [website_url]
Offer Description: [offer_description]
Target Customer: [target_customer]
Problems Solved: [problem_solved]
Customer Desires: [customer_desires]
Brand Tone: [brand_tone]
Language: [communication_language]

=== CONTEXT (OFFER|CAMPAIGN) ===
[For Offers:]
Offer Name: [name]
Offer Type: [type]
Description: [description]
Price: [price] [unit]

[For Campaigns:]
Campaign Goal: [goal]
Budget: [budget]
Target Audience: [target_audience]
Strategy Summary: [strategy_summary]

Related Products/Services:
1. [offer_name] - [price] [unit]
2. [offer_name] - [price] [unit]

=== AD SPECIFICATIONS ===
Platform: [platform]
Format: [format]
Action: [action]
Landing URL: [landing_url] (if provided)

=== INSTRUCTION ===
Please generate 6-10 compelling headlines for a [format] ad on [platform].
The ad should encourage users to [action].
```

### Expected Output

```json
{
  "headlines": [
    "Transform Your Business in 30 Days - Start Free Trial",
    "Join 10,000+ Happy Customers - Special Offer Inside",
    "Stop Struggling with [Problem] - Easy Solution Here",
    "Get Results Fast: Proven Method for [Target Audience]",
    "Limited Time: 50% Off Premium Features",
    "See Why Experts Choose Our Solution"
  ]
}
```

## Generate Full Creative Tool

### Current Implementation
- **Prompt ID**: `pmpt_68b816560a3c81968971fce73cf9777d0ff8a4e4f5493aec`
- **Tool Slug**: `generate-full-creative`
- **Purpose**: Create complete ad creative content for selected headlines

### System Prompt Specification

```
You are an expert digital advertising creative director responsible for developing complete ad creative packages. Your task is to take existing ad headlines and expand them into full creative content including primary text, visual briefs, call-to-actions, and format-specific elements.

## Core Responsibilities:
1. **Creative Expansion** - Transform headlines into complete ad narratives
2. **Visual Direction** - Provide detailed visual briefs for designers/video producers
3. **Platform Optimization** - Ensure all elements work within platform specifications
4. **Conversion Optimization** - Focus on elements that drive the specified action
5. **Brand Consistency** - Maintain brand voice across all creative elements

## Creative Elements to Generate:

### Primary Text (Required)
- Expand the headline concept into compelling body copy
- Include benefits, features, and social proof as appropriate
- Match the brand tone and target audience
- Optimize length for platform (Facebook: 125 chars, Instagram: varies, etc.)

### Visual Brief (Required)
- Detailed description of visual elements
- For images: composition, colors, objects, people, text overlays
- For videos: scene descriptions, transitions, key moments
- Brand elements to include (logo placement, colors, fonts)

### Call-to-Action (Required)
- Action-specific CTA text that aligns with the desired user action
- Platform-optimized CTA buttons/text
- Urgency and value proposition included where appropriate

### Format-Specific Elements:

#### Image Ads
- `overlay_text`: Text to appear on the image
- `visual_brief`: Detailed image description
- `primary_text`: Complementary body copy

#### Video Ads  
- `script_text`: Complete video script/voiceover
- `visual_brief`: Scene-by-scene storyboard
- `overlay_text`: On-screen text elements

#### Text Ads
- `primary_text`: Extended headline copy
- `visual_brief`: Supporting visual elements (minimal)

#### Carousel Ads
- `primary_text`: Copy for primary card
- `visual_brief`: Multi-card visual sequence
- `overlay_text`: Card-specific text variations

## Output Requirements:
Return EXACTLY this JSON structure:
```json
{
  "creatives": [
    {
      "headline": "Original headline",
      "primary_text": "Expanded body copy that complements the headline...",
      "visual_brief": "Detailed description of visual elements...",
      "overlay_text": "Text to appear on visual (if applicable)",
      "script_text": "Video script/voiceover text (for video formats)",
      "cta": "Take Action Now",
      "asset_url": null
    }
  ]
}
```

## Quality Standards:
- Complete creative package for each selected headline
- Platform character limits respected
- Consistent brand voice and messaging
- Clear, actionable visual direction
- Conversion-focused copy and CTAs
- Professional, error-free content
```

### Input Data Format

The tool receives selected ad IDs and processes their associated data:

```json
{
  "selected_ad_ids": ["uuid1", "uuid2", "uuid3"]
}
```

### User Message Structure

For each selected ad, the tool constructs a message containing:

```
=== BUSINESS PROFILE ===
Business Name: [name]
Website: [website_url]
Offer Description: [offer_description]
Target Customer: [target_customer]
Problems Solved: [problem_solved]
Customer Desires: [customer_desires]
Brand Tone: [brand_tone]
Language: [communication_language]

=== SELECTED ADS FOR CREATIVE EXPANSION ===

Ad 1:
- Headline: [headline]
- Platform: [platform]
- Format: [format]
- Action: [action]
- Landing URL: [landing_url]
- Context: [offer/campaign details]

Ad 2:
- Headline: [headline]
- Platform: [platform]
- Format: [format]
- Action: [action]
- Landing URL: [landing_url]
- Context: [offer/campaign details]

=== INSTRUCTION ===
Please create complete creative content for each selected ad. Expand the headlines into full creative packages including primary text, visual briefs, CTAs, and format-specific elements.
```

### Expected Output

```json
{
  "creatives": [
    {
      "headline": "Transform Your Business in 30 Days - Start Free Trial",
      "primary_text": "Ready to see real results? Our proven system has helped over 10,000 businesses increase revenue by 40% in just 30 days. Don't let another month go by wondering 'what if.' Start your free trial today and see the difference for yourself.",
      "visual_brief": "Professional business person at modern desk with laptop, multiple screens showing upward trending graphs. Bright, clean office environment. Blue and white color scheme. Company logo in bottom right corner. Text overlay with '30 Days' prominently displayed.",
      "overlay_text": "30-Day Free Trial • Proven Results • Join 10,000+ Users",
      "script_text": "What if I told you that in just 30 days, your business could be completely transformed? [Scene: Success montage] Our customers see an average 40% revenue increase in their first month. [Scene: Happy customers] Don't wait another day to change your future. Start your free trial now.",
      "cta": "Start Free Trial"
    }
  ]
}
```

## Data Models Reference

### Business Profile Fields
- `name` - Business name
- `website_url` - Company website
- `offer_description` - Main value proposition
- `target_customer` - Ideal customer description
- `problem_solved` - Problems the business solves
- `customer_desires` - What customers want to achieve
- `brand_tone` - Communication style/voice
- `communication_language` - Primary language

### Offer Context Fields
- `name` - Offer/product name
- `type` - Product/service category
- `description` - Detailed offer description
- `price` - Price point
- `unit` - Pricing unit (month, year, one-time)

### Campaign Context Fields
- `goal` - Campaign objective
- `budget` - Campaign budget
- `target_audience` - Specific audience targeting
- `strategy_summary` - Overall campaign strategy
- `selected_products` - Array of related offer IDs

### Ad Model Fields
- `platform` - Target platform
- `format` - Ad format type
- `action` - Desired user action
- `headline` - Generated headline text
- `primary_text` - Main ad copy
- `visual_brief` - Visual direction
- `overlay_text` - Text on visuals
- `script_text` - Video script
- `cta` - Call-to-action text
- `landing_url` - Destination URL
- `asset_url` - Media asset reference

## Platform Specifications

### Character Limits
- **Facebook**
  - Headlines: 25 characters
  - Primary text: 125 characters
  - Link description: 30 characters
- **Instagram**
  - Caption: 2,200 characters
  - Stories text: 160 characters per screen
- **Google Ads**
  - Headlines: 30 characters each (up to 15)
  - Descriptions: 90 characters each (up to 4)
- **TikTok**
  - Caption: 150 characters
  - Video text: Keep minimal for readability
- **LinkedIn**
  - Headlines: 150 characters
  - Primary text: 600 characters
- **YouTube**
  - Title: 100 characters
  - Description: 5,000 characters

### Platform-Specific Best Practices

#### Facebook/Instagram
- Use emojis strategically
- Include social proof elements
- Focus on lifestyle benefits
- Use storytelling approaches
- Include clear value propositions

#### Google Search
- Include relevant keywords
- Focus on immediate benefits
- Use numbers and specifics
- Address search intent directly
- Include location if relevant

#### TikTok
- Use trending language/slang
- Focus on entertainment value
- Keep text minimal and readable
- Use bold, contrasting colors
- Appeal to younger demographics

#### LinkedIn
- Professional, business-focused tone
- Include industry-specific terms
- Focus on professional growth/ROI
- Use data and statistics
- Target decision-makers

## Best Practices

### Content Guidelines
1. **Clarity First** - Every element should be immediately understandable
2. **Value-Driven** - Lead with benefits, not features
3. **Action-Oriented** - Every piece should drive toward the desired action
4. **Brand-Consistent** - Maintain voice and visual consistency
5. **Mobile-Optimized** - Design for mobile-first viewing

### Visual Brief Guidelines
1. **Be Specific** - Include colors, composition, objects, people
2. **Brand Elements** - Specify logo placement and brand colors
3. **Text Readability** - Ensure overlay text contrasts with background
4. **Platform Format** - Consider aspect ratios and safe zones
5. **Cultural Sensitivity** - Ensure inclusive and appropriate imagery

### Quality Assurance
- All text elements are grammatically correct
- Character limits are respected for each platform
- Visual briefs provide actionable direction
- CTAs align with the specified action
- Content matches brand tone and target audience
- Output format matches expected JSON structure exactly

## Migration Notes

This documentation serves as a specification for migrating from OpenAI prompt IDs to system message-based prompts. Key considerations for migration:

1. **Prompt Testing** - A/B test new system prompts against current prompt IDs
2. **Output Consistency** - Ensure JSON structure remains exactly the same
3. **Quality Benchmarking** - Compare creative quality and conversion rates
4. **Error Handling** - Implement robust parsing for various output formats
5. **Rollback Plan** - Keep prompt ID fallback during transition period

The current tools are functioning effectively with prompt IDs, but this system message approach would provide more direct control over prompt evolution and customization.