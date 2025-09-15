#!/usr/bin/env python3
"""
Seed script for prompt templates
Run this script to populate the database with initial template data
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app, db
from app.models.prompt_template import PromptTemplate

def seed_templates():
    """Seed the database with initial prompt templates"""

    templates = [
        # Sales Templates
        {
            "title": "LinkedIn Sales Outreach",
            "description": "Personalized LinkedIn message for cold outreach to potential clients",
            "category": "Sales",
            "content": """Hi {{business_profile.target_customer}},

I noticed your work at [Company Name] and was impressed by [specific detail about their business].

At {{business_profile.name}}, we specialize in {{business_profile.offer_description}} and have helped similar companies {{business_profile.problem_solved}}.

Our approach focuses on {{business_profile.customer_desires}}, which I believe could be valuable for your team.

Would you be open to a brief 15-minute call this week to explore how we might help you achieve {{business_profile.customer_desires}}?

Best regards,
[Your Name]
{{business_profile.name}}
{{business_profile.website_url}}""",
            "dependencies": ["business_profile"],
            "language": "en",
            "status": "active"
        },
        {
            "title": "LinkedIn Sprzedażowy",
            "description": "Spersonalizowana wiadomość LinkedIn do cold outreach potencjalnych klientów",
            "category": "Sales",
            "content": """Cześć {{business_profile.target_customer}},

Zauważyłem Twoją pracę w [Nazwa Firmy] i byłem pod wrażeniem [konkretny szczegół o ich biznesie].

W {{business_profile.name}} specjalizujemy się w {{business_profile.offer_description}} i pomagaliśmy podobnym firmom {{business_profile.problem_solved}}.

Nasze podejście koncentruje się na {{business_profile.customer_desires}}, co może być wartościowe dla Twojego zespołu.

Czy byłbyś otwarty na krótką 15-minutową rozmowę w tym tygodniu, aby omówić, jak możemy pomóc Ci osiągnąć {{business_profile.customer_desires}}?

Pozdrawiam,
[Twoje Imię]
{{business_profile.name}}
{{business_profile.website_url}}""",
            "dependencies": ["business_profile"],
            "language": "pl",
            "status": "active"
        },

        # Marketing Templates
        {
            "title": "Competitor Analysis Report",
            "description": "Comprehensive analysis of your competition for strategic planning",
            "category": "Marketing",
            "content": """# Competitor Analysis Report for {{business_profile.name}}

## Overview
Analysis of {{competitors.count}} main competitors in the {{business_profile.target_customer}} market.

## Key Competitors
{{competitors.all}}

## Primary Competitor Focus: {{competitors.top_1}}
*Detailed analysis of our main competition*

## Our Competitive Advantages
- **Unique Value Proposition**: {{business_profile.offer_description}}
- **Target Market**: {{business_profile.target_customer}}
- **Core Problem We Solve**: {{business_profile.problem_solved}}
- **Customer Outcomes**: {{business_profile.customer_desires}}

## Strategic Recommendations
1. **Differentiation Strategy**: Emphasize {{business_profile.customer_desires}}
2. **Market Positioning**: Position against {{competitors.top_1}} by highlighting our {{business_profile.offer_description}}
3. **Communication Tone**: Maintain {{business_profile.brand_tone}} voice across all channels

## Next Steps
- Monitor competitor pricing and offerings
- Develop content that highlights our unique advantages
- Test messaging that directly compares our solution to {{competitors.top_3}}

Generated on: {{current_date}}""",
            "dependencies": ["business_profile", "competitors"],
            "language": "en",
            "status": "active"
        },

        # Copywriting Templates
        {
            "title": "Product Launch Email",
            "description": "Compelling email announcement for new product or service launch",
            "category": "Copywriting",
            "content": """Subject: 🚀 Introducing {{offers.primary}} - {{business_profile.customer_desires}}

Hi [First Name],

We're thrilled to announce the launch of {{offers.primary}}!

**Why we created this:**
After working with {{business_profile.target_customer}}, we consistently heard about {{business_profile.problem_solved}}. That's exactly what {{offers.primary}} is designed to address.

**What makes it special:**
✅ {{business_profile.offer_description}}
✅ Specifically designed for {{business_profile.target_customer}}
✅ Helps you achieve {{business_profile.customer_desires}}

**Limited Time Launch Offer:**
Price range: {{offers.price_range}}
Available services: {{offers.services}}
Product options: {{offers.products}}

**Ready to get started?**
Visit {{business_profile.website_url}} or reply to this email.

Best regards,
The {{business_profile.name}} Team

P.S. This offer is only available until {{current_month}} {{current_year}} - don't miss out!""",
            "dependencies": ["business_profile", "offers"],
            "language": "en",
            "status": "active"
        },

        # Outreach Templates
        {
            "title": "Partnership Proposal",
            "description": "Professional proposal for business partnerships and collaborations",
            "category": "Outreach",
            "content": """Subject: Partnership Opportunity - {{business_profile.name}} x [Partner Company]

Dear [Partner Name],

I hope this message finds you well. I'm reaching out from {{business_profile.name}} regarding a potential partnership opportunity.

**About Us:**
{{business_profile.name}} specializes in {{business_profile.offer_description}} for {{business_profile.target_customer}}. We've successfully helped our clients {{business_profile.problem_solved}}.

**Why Partner With Us:**
Our current portfolio includes:
- {{offers.count}} active service offerings
- {{campaigns.count}} successful marketing campaigns
- Proven track record in delivering {{business_profile.customer_desires}}

**Partnership Opportunity:**
I believe there's strong synergy between our services and your {{business_profile.target_customer}} client base. Together, we could:

1. Expand market reach for both companies
2. Offer complementary solutions
3. Share resources and expertise
4. Cross-promote to achieve {{business_profile.customer_desires}}

**Next Steps:**
Would you be available for a 30-minute call next week to discuss this further? I'd love to explore how we can create mutual value.

Best regards,
[Your Name]
{{business_profile.name}}
{{business_profile.website_url}}

Tone: {{business_profile.brand_tone}}""",
            "dependencies": ["business_profile", "offers", "campaigns"],
            "language": "en",
            "status": "active"
        },

        # Social Templates
        {
            "title": "LinkedIn Company Update",
            "description": "Professional LinkedIn post to share company news and updates",
            "category": "Social",
            "content": """🎉 Exciting update from {{business_profile.name}}!

We're proud to share that we've now helped {{business_profile.target_customer}} achieve {{business_profile.customer_desires}} through our {{business_profile.offer_description}}.

**What we've accomplished:**
📊 {{campaigns.count}} successful campaigns launched
📝 {{scripts.count}} content pieces created
📢 {{ads.count}} effective advertisements running
💼 {{offers.count}} solutions now available

**Our mission remains clear:** {{business_profile.problem_solved}}

The journey continues, and we're excited about what's ahead in {{current_year}}!

#{{business_profile.name}} #{{business_profile.target_customer}} #Growth #Success

What challenges are you facing in {{current_month}}? Let's connect! 👇

{{business_profile.website_url}}""",
            "dependencies": ["business_profile", "campaigns", "scripts", "ads", "offers"],
            "language": "en",
            "status": "active"
        },

        # Ads Templates
        {
            "title": "Facebook Ad Copy - Problem/Solution",
            "description": "High-converting Facebook ad copy using problem-solution framework",
            "category": "Ads",
            "content": """**Headline:** Stop Struggling With {{business_profile.problem_solved}} - {{business_profile.name}} Has The Solution

**Primary Text:**
Are you a {{business_profile.target_customer}} tired of {{business_profile.problem_solved}}?

You're not alone. That's exactly why we created {{business_profile.offer_description}}.

Unlike {{competitors.top_1}}, our approach focuses specifically on {{business_profile.customer_desires}}.

**What makes us different:**
✅ Tailored for {{business_profile.target_customer}}
✅ Proven results: {{ads.facebook_count}} successful campaigns
✅ {{business_profile.brand_tone}} approach
✅ Immediate impact on {{business_profile.customer_desires}}

**Ready to see results?**
Click below to learn more about our {{offers.primary}}.

**CTA:** Get Started Today
**Landing Page:** {{business_profile.website_url}}

**Visual Brief:** Show a before/after transformation related to {{business_profile.problem_solved}}, featuring happy {{business_profile.target_customer}}.

Campaign Type: Conversion
Audience: {{business_profile.target_customer}} interested in {{business_profile.customer_desires}}""",
            "dependencies": ["business_profile", "competitors", "ads", "offers"],
            "language": "en",
            "status": "active"
        },

        # Content Planning Template
        {
            "title": "Monthly Content Calendar",
            "description": "Strategic content planning template for social media and marketing",
            "category": "Marketing",
            "content": """# {{current_month}} {{current_year}} Content Calendar for {{business_profile.name}}

## Content Themes This Month:
1. **Education**: {{business_profile.problem_solved}}
2. **Solutions**: {{business_profile.offer_description}}
3. **Results**: {{business_profile.customer_desires}}
4. **Community**: {{business_profile.target_customer}} success stories

## Content Mix:
- **Scripts Created**: {{scripts.count}} ready for video content
- **Campaign Assets**: {{campaigns.count}} campaign materials available
- **Ad Creatives**: {{ads.count}} ad variations across {{ads.platforms}}
- **Product Focus**: {{offers.primary}} and {{offers.count}} total offerings

## Weekly Breakdown:

**Week 1: Problem Awareness**
- Highlight challenges {{business_profile.target_customer}} face
- Share educational content about {{business_profile.problem_solved}}
- Tone: {{business_profile.brand_tone}}

**Week 2: Solution Introduction**
- Showcase {{business_profile.offer_description}}
- Compare with alternatives (including {{competitors.top_1}})
- Feature customer testimonials

**Week 3: Deep Dive Value**
- Detail how we achieve {{business_profile.customer_desires}}
- Behind-the-scenes content
- Case studies and results

**Week 4: Call to Action**
- Direct promotion of {{offers.primary}}
- Limited time offers
- Community engagement

## Content Distribution:
- **Primary Platform**: LinkedIn ({{business_profile.target_customer}} focus)
- **Supporting Platforms**: Based on {{ads.platforms}} performance
- **Website Traffic**: Drive to {{business_profile.website_url}}

## Success Metrics:
- Engagement with {{business_profile.target_customer}}
- Inquiries about {{business_profile.offer_description}}
- Traffic to key landing pages
- Conversion to {{offers.primary}}

Generated for: {{current_month}} {{current_year}}""",
            "dependencies": ["business_profile", "scripts", "campaigns", "ads", "offers", "competitors"],
            "language": "en",
            "status": "active"
        }
    ]

    # Clear existing templates (optional - comment out if you want to keep existing ones)
    print("Clearing existing templates...")
    existing_count = PromptTemplate.query.count()
    if existing_count > 0:
        PromptTemplate.query.delete()
        print(f"Deleted {existing_count} existing templates")

    # Add new templates
    print(f"Adding {len(templates)} templates...")
    for template_data in templates:
        template = PromptTemplate(**template_data)
        db.session.add(template)

    # Commit changes
    db.session.commit()
    print("✅ Templates seeded successfully!")

    # Print summary
    total_templates = PromptTemplate.query.count()
    en_templates = PromptTemplate.query.filter_by(language='en').count()
    pl_templates = PromptTemplate.query.filter_by(language='pl').count()

    print(f"📊 Database now contains:")
    print(f"   • Total templates: {total_templates}")
    print(f"   • English templates: {en_templates}")
    print(f"   • Polish templates: {pl_templates}")

    # Print categories
    categories = db.session.query(PromptTemplate.category).distinct().all()
    print(f"   • Categories: {', '.join([cat[0] for cat in categories])}")

if __name__ == "__main__":
    app = create_app()

    with app.app_context():
        print("🌱 Seeding prompt templates...")
        seed_templates()
        print("🎉 Done!")