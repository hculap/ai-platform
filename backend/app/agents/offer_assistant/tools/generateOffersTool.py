"""
Generate Offers Tool
AI-powered tool to generate offer catalog based on business profile and competitive landscape
"""

import logging
from typing import Dict, Any, Optional
from ...shared.tool_factory import SystemMessageTool
from ...shared.base_tool import ToolInput, ToolOutput, ToolCategory
from ...shared.validators import BusinessProfileIdValidator, ParametersValidator
from ...shared.parsers import create_parser
from ....services.offer_service import OfferGenerationService, OfferService

logger = logging.getLogger(__name__)

class GenerateOffersTool(SystemMessageTool):
    """
    AI tool to generate comprehensive offer catalog for businesses.
    
    Uses business profile data and competitive analysis to create
    tailored product/service offerings with pricing recommendations.
    """
    
    def __init__(self):
        # Create parameter validator
        validator = ParametersValidator()
        validator.add_required_field('business_profile_id', BusinessProfileIdValidator())
        
        # Create parser for offer data
        parser = create_parser('generic')  # Will parse JSON response
        
        # System message from the provided prompt
        system_message = """Role and Objective
• Act as an Offer Assistant. Given a business_profile object and a competitors array, produce a concise offer catalog tailored to the business.

Checklist
• Summarize planned steps in 3–7 bullets (internal only; do not include in output).
• Parse business_profile to identify category, ICP, positioning, and core capabilities.
• Use competitors only as contextual signals (no fabrication).
• Derive 3–8 clear offers with sensible units and a single recommended price each.
• Keep language aligned with the detected/declared language.
• Validate output strictly against the schema and field order.

Instructions
• Use only the provided business_profile and competitors. Do not browse or fetch external data.
• Extract what the business can credibly sell; convert services into productized packages when appropriate.
• Price each offer once (no ranges). If pricing signals are weak, infer conservatively from effort/value and common billing practices—not from invented competitor numbers.
• Keep names short, benefit-led; descriptions ≤120 words, plain text (no Markdown).
• Units must reflect how the buyer pays (e.g., per_month, per_project, per_hour, per_item, or a clear custom unit).
• If the input is sparse, still return 3–5 best-effort offers that fit the profile; avoid exotic units or unrealistic pricing.

Rules
• No fabrication of competitor facts or prices. Competitors are context only.
• Output only the fields specified, in the exact order. No extra fields, IDs, notes, currency symbols, or metadata.
• Prices are numeric (VAT excluded), assumed in the default currency (see Default Values).
• Language defaults to Polish unless business_profile clearly indicates English.
• If an element cannot be determined confidently, choose a conservative, reasonable option rather than leaving fields blank.

Output Format

Return only a strict JSON array with 3–8 objects.
Each object must have exactly these fields in order:

[
  {
    "type": "product or service",
    "name": "String",
    "description": "String, ≤120 words, plain text",
    "unit": "per_month | per_project | per_hour | per_item | custom unit string",
    "price": 0
  }
]

• price must be a number (no quotes, no currency symbol).
• Do not include any text before or after the JSON array.

Validation
• Enforce: correct field names, exact order, required presence, types (string/number), and description length.
• Ensure 3–8 total items.
• Ensure unit clarity and pricing plausibility (no zero/negative prices unless clearly freemium).
• If validation fails, self-correct and regenerate until compliant.

Default Values
• Language: detect from business_profile; fallback "pl".
• Currency assumption for price: default PLN, VAT excluded (currency not printed).
• Units: prefer per_month for subscriptions, per_project for scoped work, per_hour for time & materials, per_item for SKUs.

Stop Conditions
• If business_profile is so ambiguous you cannot propose even 3 conservative offers, return an empty JSON array [].
• Otherwise, do not ask questions; deliver best-effort compliant output.

Verbosity
• Output is JSON only (no commentary, no checklist)."""

        super().__init__(
            name='Generate Offers Tool',
            slug='generate-offers',
            description='Generate AI-powered offer catalog based on business profile and competitive landscape',
            system_message=system_message,
            validator=validator,
            parser=parser,
            category=ToolCategory.ANALYSIS,
            version='1.0.0'
        )
    
    async def _prepare_openai_message(self, validated_params: Dict[str, Any], input_data: ToolInput) -> str:
        """
        Prepare user message for OpenAI API call
        
        Args:
            validated_params: Validated input parameters
            input_data: Original tool input
            
        Returns:
            Formatted user message string
        """
        business_profile_id = validated_params['business_profile_id']
        user_id = input_data.user_id
        
        logger.info(f"Preparing OpenAI message for business profile {business_profile_id}")
        
        # Prepare data for AI generation
        generation_data = OfferGenerationService.prepare_generation_data(
            business_profile_id, user_id
        )
        
        # Create user message for AI
        user_message = self._create_user_message(
            generation_data['business_profile'],
            generation_data['competitors']
        )
        
        logger.debug(f"Generated user message for AI: {user_message[:200]}...")
        return user_message
    
    async def _process_openai_result(
        self,
        content: Any,
        validated_params: Dict[str, Any],
        openai_result: Dict[str, Any],
        user_id: Optional[str]
    ) -> Dict[str, Any]:
        """
        Process OpenAI result and save generated offers
        
        Args:
            content: Content from OpenAI response
            validated_params: Validated input parameters
            openai_result: Full OpenAI response
            user_id: User ID for context
            
        Returns:
            Processed response data
        """
        business_profile_id = validated_params['business_profile_id']
        
        try:
            # Parse AI response
            offers_data = OfferGenerationService.parse_ai_response(str(content))
            
            # Save generated offers to database
            created_offers = OfferGenerationService.save_generated_offers(
                business_profile_id, user_id, offers_data
            )
            
            logger.info(f"Successfully generated {len(created_offers)} offers")
            
            return {
                'message': f'Generated {len(created_offers)} offers successfully',
                'offers_count': len(created_offers),
                'offers': [offer.to_dict() for offer in created_offers]
            }
            
        except Exception as e:
            logger.error(f"Error processing OpenAI response: {e}", exc_info=True)
            return {
                'error': f"Failed to process generated offers: {str(e)}",
                'content': str(content)
            }
    
    def _create_user_message(self, business_profile: Dict[str, Any], competitors: list) -> str:
        """
        Create user message for OpenAI API call
        
        Args:
            business_profile: Business profile data
            competitors: List of competitor data
            
        Returns:
            Formatted user message string
        """
        # Build comprehensive context for AI
        message_parts = []
        
        # Business profile context
        message_parts.append("=== BUSINESS PROFILE ===")
        message_parts.append(f"Company Name: {business_profile.get('name', 'Unknown')}")
        message_parts.append(f"Website: {business_profile.get('website_url', 'Not specified')}")
        
        if business_profile.get('offer_description'):
            message_parts.append(f"Current Offer: {business_profile['offer_description']}")
        
        if business_profile.get('target_customer'):
            message_parts.append(f"Target Customer: {business_profile['target_customer']}")
        
        if business_profile.get('problem_solved'):
            message_parts.append(f"Problems Solved: {business_profile['problem_solved']}")
        
        if business_profile.get('customer_desires'):
            message_parts.append(f"Customer Desires: {business_profile['customer_desires']}")
        
        if business_profile.get('brand_tone'):
            message_parts.append(f"Brand Tone: {business_profile['brand_tone']}")
        
        # Language preference
        language = business_profile.get('communication_language', 'pl')
        message_parts.append(f"Language: {language}")
        
        # Competitors context
        if competitors:
            message_parts.append("\n=== COMPETITORS ===")
            for i, competitor in enumerate(competitors[:10], 1):  # Limit to top 10
                comp_info = f"{i}. {competitor.get('name', 'Unknown')}"
                if competitor.get('url'):
                    comp_info += f" ({competitor['url']})"
                if competitor.get('description'):
                    comp_info += f" - {competitor['description']}"
                if competitor.get('usp'):
                    comp_info += f" | USP: {competitor['usp']}"
                message_parts.append(comp_info)
        else:
            message_parts.append("\n=== COMPETITORS ===")
            message_parts.append("No competitor data available")
        
        # Generation request
        message_parts.append("\n=== REQUEST ===")
        message_parts.append(
            "Based on the business profile and competitive landscape above, "
            "generate a comprehensive offer catalog. Create 3-8 clear offers "
            "that align with the business capabilities and market positioning. "
            "Each offer should have a competitive price point and clear value proposition."
        )
        
        return "\n".join(message_parts)