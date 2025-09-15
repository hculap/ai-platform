"""
Generate Campaign Tool
AI-powered tool to generate marketing campaign strategies based on business profile and competitive landscape
"""

import logging
from typing import Dict, Any, Optional, List
from datetime import datetime, date
from ...shared.tool_factory import PromptBasedTool
from ...shared.base_tool import ToolInput, ToolOutput, ToolCategory
from ...shared.validators import BusinessProfileIdValidator, ParametersValidator, ValidationResult
from ...shared.parsers import create_parser
from ....services.campaign_service import CampaignGenerationService

logger = logging.getLogger(__name__)

class GenerateCampaignTool(PromptBasedTool):
    """
    AI tool to generate comprehensive marketing campaign strategies.
    
    Uses business profile data, competitive analysis, and campaign parameters
    to create tailored marketing campaign strategies with channel recommendations.
    Uses pre-registered OpenAI prompt for consistency.
    """
    
    # Constants
    PROMPT_ID = 'pmpt_68b6f349a55c8194a65b306469911922083ba8ae4a23fadf'
    VERSION = '1.0.0'
    COST = 40  # Credits required for marketing campaign generation
    
    # Campaign goal options
    CAMPAIGN_GOALS = [
        'Brand Awareness',
        'Lead Generation', 
        'Sales / Conversions',
        'Product Launch',
        'Customer Retention & Loyalty',
        'Event Promotion',
        'Rebranding / Reputation Management',
        'Community Engagement'
    ]

    def __init__(self):
        # Create parameter validator
        validator = ParametersValidator()
        validator.add_required_field('business_profile_id', BusinessProfileIdValidator())
        validator.add_required_field('campaign_goal', self._create_goal_validator())
        validator.add_optional_field('budget', self._create_budget_validator())  
        validator.add_optional_field('deadline', self._create_deadline_validator())
        validator.add_optional_field('selected_products', self._create_products_validator())
        
        # Create parser for campaign data
        parser = create_parser('generic')  # Will parse JSON response
        
        super().__init__(
            name='Generate Campaign Tool',
            slug='generate-campaign',
            description='Generate AI-powered marketing campaign strategy based on business profile and competitive landscape',
            prompt_id=self.PROMPT_ID,
            validator=validator,
            parser=parser,
            category=ToolCategory.ANALYSIS,
            version=self.VERSION
        )
    
    def _create_goal_validator(self):
        """Create validator for campaign goal"""
        class GoalValidator:
            def validate(self, value, context=None):
                result = ValidationResult(is_valid=True)
                if not value or value not in GenerateCampaignTool.CAMPAIGN_GOALS:
                    result.add_error(f"Campaign goal must be one of: {', '.join(GenerateCampaignTool.CAMPAIGN_GOALS)}")
                else:
                    result.set_validated_value('campaign_goal', value)
                return result
        return GoalValidator()
    
    def _create_budget_validator(self):
        """Create validator for budget"""
        class BudgetValidator:
            def validate(self, value, context=None):
                result = ValidationResult(is_valid=True)
                if value is None:
                    return result
                try:
                    budget = float(value)
                    if budget <= 0:
                        result.add_error("Budget must be positive")
                    else:
                        result.set_validated_value('budget', budget)
                except (ValueError, TypeError):
                    result.add_error("Budget must be a valid number")
                return result
        return BudgetValidator()
    
    def _create_deadline_validator(self):
        """Create validator for deadline"""
        class DeadlineValidator:
            def validate(self, value, context=None):
                result = ValidationResult(is_valid=True)
                if value is None:
                    return result
                try:
                    if isinstance(value, str):
                        deadline_date = datetime.strptime(value, '%Y-%m-%d').date()
                    elif isinstance(value, date):
                        deadline_date = value
                    else:
                        result.add_error("Deadline must be in YYYY-MM-DD format")
                        return result
                    
                    if deadline_date <= date.today():
                        result.add_error("Deadline must be in the future")
                    else:
                        result.set_validated_value('deadline', deadline_date.isoformat())
                except ValueError:
                    result.add_error("Deadline must be in YYYY-MM-DD format")
                return result
        return DeadlineValidator()
    
    def _create_products_validator(self):
        """Create validator for selected products"""
        class ProductsValidator:
            def validate(self, value, context=None):
                result = ValidationResult(is_valid=True)
                if value is None or value == []:
                    result.set_validated_value('selected_products', [])
                    return result
                if not isinstance(value, list):
                    result.add_error("Selected products must be an array")
                    return result
                for product_id in value:
                    if not isinstance(product_id, str):
                        result.add_error("Product IDs must be strings")
                        break
                else:
                    result.set_validated_value('selected_products', value)
                return result
        return ProductsValidator()
    
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
        
        logger.info(f"Preparing OpenAI message for campaign generation, business profile {business_profile_id}")
        
        # Prepare data for AI generation
        generation_data = CampaignGenerationService.prepare_generation_data(
            business_profile_id, user_id, validated_params
        )
        
        # Debug the retrieved data
        business_profile = generation_data['business_profile']
        competitors = generation_data['competitors']
        selected_products = generation_data['selected_products']
        campaign_params = generation_data['campaign_params']
        
        
        # Create user message for AI
        user_message = self._create_user_message(
            business_profile, competitors, selected_products, campaign_params
        )
        
        
        return user_message
    
    def _process_openai_result(
        self,
        content: Any,
        validated_params: Dict[str, Any],
        openai_result: Dict[str, Any],
        user_id: Optional[str]
    ) -> Dict[str, Any]:
        """
        Process OpenAI result and return generated campaign strategy
        
        Args:
            content: Content from OpenAI response
            validated_params: Validated input parameters
            openai_result: Full OpenAI response
            user_id: User ID for context
            
        Returns:
            Processed response data with campaign strategy
        """
        business_profile_id = validated_params['business_profile_id']
        
        logger.info(f"Processing OpenAI result for campaign generation, business profile {business_profile_id}")
        
        if not content or str(content).strip() == "":
            logger.error("OpenAI returned empty content for campaign generation")
            return {
                'error': 'AI service temporarily unavailable. Please try again.',
                'debug_info': {
                    'content_type': str(type(content)),
                    'openai_result': openai_result,
                    'business_profile_id': business_profile_id
                }
            }
        
        try:
            # Parse AI response
            campaign_data = CampaignGenerationService.parse_ai_response(str(content))
            
            logger.info(f"Successfully parsed campaign strategy from AI response")
            
            return {
                'message': 'Generated campaign strategy successfully',
                'campaign_data': campaign_data,
                'business_profile_id': business_profile_id,
                'campaign_params': validated_params
            }
            
        except Exception as e:
            logger.error(f"Error processing OpenAI response: {e}", exc_info=True)
            return {
                'error': f"Failed to process generated campaign: {str(e)}",
                'content': str(content),
                'debug_info': {
                    'content_type': str(type(content)),
                    'openai_result': openai_result,
                    'business_profile_id': business_profile_id
                }
            }
    
    def _create_user_message(
        self, 
        business_profile: Dict[str, Any], 
        competitors: list, 
        selected_products: list,
        campaign_params: Dict[str, Any]
    ) -> str:
        """
        Create user message for OpenAI API call
        
        Args:
            business_profile: Business profile data
            competitors: List of competitor data
            selected_products: List of selected products/offers
            campaign_params: Campaign parameters (goal, budget, deadline)
            
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
        
        # Selected products context
        if selected_products:
            message_parts.append("\n=== SELECTED PRODUCTS/SERVICES ===")
            for i, product in enumerate(selected_products, 1):
                product_info = f"{i}. {product.get('name', 'Unknown')} ({product.get('type', 'unknown')})"
                if product.get('description'):
                    desc = product['description'][:100]
                    if len(product['description']) > 100:
                        desc += "..."
                    product_info += f" - {desc}"
                if product.get('unit') and product.get('price'):
                    product_info += f" | {product['price']} {product['unit']}"
                message_parts.append(product_info)
        else:
            message_parts.append("\n=== SELECTED PRODUCTS/SERVICES ===")
            message_parts.append("No specific products selected - strategy will be brand/portfolio-level")
        
        # Campaign parameters
        message_parts.append("\n=== CAMPAIGN PARAMETERS ===")
        message_parts.append(f"Campaign Goal: {campaign_params['goal']}")
        
        if campaign_params.get('budget'):
            message_parts.append(f"Budget: {campaign_params['budget']} (currency as per business profile)")
        else:
            message_parts.append("Budget: Not specified - please recommend a budget")
        
        if campaign_params.get('deadline'):
            message_parts.append(f"Deadline: {campaign_params['deadline']}")
        else:
            message_parts.append("Deadline: Not specified - suggest appropriate campaign duration")
        
        # Generation request
        message_parts.append("\n=== REQUEST ===")
        message_parts.append(
            f"Based on the business profile, competitive landscape, selected products, and campaign parameters above, "
            f"generate a comprehensive marketing campaign strategy for '{campaign_params['goal']}'. "
            f"Create a detailed plan with channel recommendations, timeline, target audience segments, "
            f"and actionable next steps. Consider the competitive landscape and ensure the strategy "
            f"differentiates the business from competitors."
        )
        
        return "\n".join(message_parts)