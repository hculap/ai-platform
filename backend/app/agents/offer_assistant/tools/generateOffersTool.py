"""
Generate Offers Tool
AI-powered tool to generate offer catalog based on business profile and competitive landscape
"""

import logging
from typing import Dict, Any, Optional, List
from ...shared.tool_factory import PromptBasedTool
from ...shared.base_tool import ToolInput, ToolOutput, ToolCategory
from ...shared.validators import BusinessProfileIdValidator, ParametersValidator
from ...shared.parsers import create_parser
from ....services.offer_service import OfferGenerationService, OfferService

logger = logging.getLogger(__name__)

class GenerateOffersTool(PromptBasedTool):
    """
    AI tool to generate comprehensive offer catalog for businesses.
    
    Uses business profile data and competitive analysis to create
    tailored product/service offerings with pricing recommendations.
    Uses pre-registered OpenAI prompt for consistency.
    """
    
    # Constants
    PROMPT_ID = 'pmpt_68b45d3e9768819385a3b08df384bddf05cf82b6c6aeae41'
    VERSION = '1.0.0'
    
    def __init__(self):
        # Create parameter validator
        validator = ParametersValidator()
        validator.add_required_field('business_profile_id', BusinessProfileIdValidator())
        
        # Create parser for offer data
        parser = create_parser('generic')  # Will parse JSON response
        
        super().__init__(
            name='Generate Offers Tool',
            slug='generate-offers',
            description='Generate AI-powered offer catalog based on business profile and competitive landscape',
            prompt_id=self.PROMPT_ID,
            validator=validator,
            parser=parser,
            category=ToolCategory.ANALYSIS,
            version=self.VERSION
        )
    
    def _prepare_openai_message(self, validated_params: Dict[str, Any], input_data: ToolInput) -> str:
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
        
        # Debug the retrieved data
        business_profile = generation_data['business_profile']
        competitors = generation_data['competitors']
        current_offers = generation_data['current_offers']
        
        logger.info(f"Business profile data: {business_profile}")
        logger.info(f"Competitors count: {len(competitors)}")
        logger.info(f"Current offers count: {len(current_offers)}")
        logger.info(f"Competitors data: {competitors}")
        logger.info(f"Current offers data: {current_offers}")
        
        # Create user message for AI
        user_message = self._create_user_message(business_profile, competitors, current_offers)
        
        logger.info(f"Generated user message for AI: {user_message[:500]}...")
        logger.info(f"Full user message length: {len(user_message)}")
        
        return user_message
    
    def _process_openai_result(
        self,
        content: Any,
        validated_params: Dict[str, Any],
        openai_result: Dict[str, Any],
        user_id: Optional[str]
    ) -> Dict[str, Any]:
        """
        Process OpenAI result and return generated offers for user selection
        
        Args:
            content: Content from OpenAI response
            validated_params: Validated input parameters
            openai_result: Full OpenAI response
            user_id: User ID for context
            
        Returns:
            Processed response data with offers for selection
        """
        business_profile_id = validated_params['business_profile_id']
        
        # Add debugging information
        logger.info(f"Processing OpenAI result for business profile {business_profile_id}")
        logger.info(f"Content type: {type(content)}, Content length: {len(str(content)) if content else 0}")
        logger.info(f"Content: {str(content)[:500]}...")  # First 500 chars for debugging
        logger.info(f"Full OpenAI result keys: {openai_result.keys()}")
        logger.info(f"OpenAI success: {openai_result.get('success')}")
        
        if not content or str(content).strip() == "":
            logger.error("OpenAI returned empty content, generating fallback offers")
            
            # Generate fallback offers based on business profile data
            fallback_offers = self._generate_fallback_offers(validated_params, user_id)
            
            if fallback_offers:
                logger.info(f"Generated {len(fallback_offers)} fallback offers")
                return {
                    'message': f'AI service temporarily unavailable. Generated {len(fallback_offers)} basic offers based on your business profile.',
                    'offers_count': len(fallback_offers),
                    'offers': fallback_offers,
                    'business_profile_id': business_profile_id,
                    'fallback': True
                }
            else:
                return {
                    'error': 'AI service temporarily unavailable and unable to generate basic offers. Please ensure your business profile has complete information (name, offer description, target customer) and try again.',
                    'debug_info': {
                        'content_type': str(type(content)),
                        'openai_result': openai_result,
                        'business_profile_id': business_profile_id
                    }
                }
        
        try:
            # Parse AI response
            offers_data = OfferGenerationService.parse_ai_response(str(content))
            
            logger.info(f"Successfully parsed {len(offers_data)} offers from AI response")
            
            return {
                'message': f'Generated {len(offers_data)} offers for selection',
                'offers_count': len(offers_data),
                'offers': offers_data,  # Return raw offer data for user selection
                'business_profile_id': business_profile_id
            }
            
        except Exception as e:
            logger.error(f"Error processing OpenAI response: {e}", exc_info=True)
            return {
                'error': f"Failed to process generated offers: {str(e)}",
                'content': str(content),
                'debug_info': {
                    'content_type': str(type(content)),
                    'openai_result': openai_result,
                    'business_profile_id': business_profile_id
                }
            }
    
    def _create_user_message(self, business_profile: Dict[str, Any], competitors: list, current_offers: list) -> str:
        """
        Create user message for OpenAI API call
        
        Args:
            business_profile: Business profile data
            competitors: List of competitor data
            current_offers: List of current offer data
            
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
        
        # Current offers context
        if current_offers:
            message_parts.append("\n=== CURRENT OFFERS ===")
            for i, offer in enumerate(current_offers, 1):
                offer_info = f"{i}. {offer.get('name', 'Unknown')} ({offer.get('type', 'unknown')})"
                if offer.get('description'):
                    # Truncate description to keep message manageable
                    desc = offer['description'][:100]
                    if len(offer['description']) > 100:
                        desc += "..."
                    offer_info += f" - {desc}"
                if offer.get('unit') and offer.get('price'):
                    offer_info += f" | {offer['price']} {offer['unit']}"
                offer_info += f" | Status: {offer.get('status', 'unknown')}"
                message_parts.append(offer_info)
        else:
            message_parts.append("\n=== CURRENT OFFERS ===")
            message_parts.append("No existing offers found")
        
        # Generation request
        message_parts.append("\n=== REQUEST ===")
        message_parts.append(
            "Based on the business profile, competitive landscape, and current offers above, "
            "generate a comprehensive offer catalog. Create 3-8 NEW offers that complement "
            "the existing ones and align with business capabilities and market positioning. "
            "AVOID creating offers too similar to the current ones - focus on new opportunities, "
            "different service tiers, or complementary products/services. "
            "Each offer should have a competitive price point and clear value proposition."
        )
        
        return "\n".join(message_parts)
    
    def _generate_fallback_offers(self, validated_params: Dict[str, Any], user_id: str) -> List[Dict[str, Any]]:
        """
        Generate basic fallback offers when AI service is unavailable
        
        Args:
            validated_params: Validated input parameters
            user_id: User ID for context
            
        Returns:
            List of basic offer dictionaries
        """
        try:
            business_profile_id = validated_params['business_profile_id']
            
            # Get business profile data
            generation_data = OfferGenerationService.prepare_generation_data(
                business_profile_id, user_id
            )
            
            business_profile = generation_data['business_profile']
            
            # Extract key information
            business_name = business_profile.get('name', 'Your Business')
            offer_description = business_profile.get('offer_description', '')
            
            # Generate basic offers based on common business patterns
            fallback_offers = []
            
            # Basic consultation offer
            fallback_offers.append({
                "type": "service",
                "name": f"{business_name} Consultation",
                "description": f"Professional consultation services to help you achieve your business goals. Get expert advice and strategic guidance tailored to your needs.",
                "unit": "per_hour",
                "price": 200
            })
            
            # Basic service package if offer description exists
            if offer_description:
                fallback_offers.append({
                    "type": "service", 
                    "name": f"{business_name} Service Package",
                    "description": f"Comprehensive service package based on our core offering: {offer_description[:80]}...",
                    "unit": "per_project",
                    "price": 1500
                })
            
            # Monthly subscription service
            fallback_offers.append({
                "type": "service",
                "name": f"{business_name} Monthly Support",
                "description": "Ongoing monthly support and services to help your business grow consistently. Includes regular check-ins and continuous optimization.",
                "unit": "per_month", 
                "price": 500
            })
            
            logger.info(f"Generated {len(fallback_offers)} fallback offers")
            return fallback_offers
            
        except Exception as e:
            logger.error(f"Failed to generate fallback offers: {e}", exc_info=True)
            return []