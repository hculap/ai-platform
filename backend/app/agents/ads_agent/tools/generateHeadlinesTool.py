"""
GenerateHeadlinesTool - A tool for generating ad headlines using OpenAI.
Generates 6-10 headline suggestions for ads based on platform, format, and context.
"""

from typing import Dict, Any, Optional
import json
import logging

from ...shared.tool_factory import PromptBasedTool
from ...shared.validators import ParametersValidator, BaseValidator, ValidationResult
from ....models.business_profile import BusinessProfile
from ....models.offer import Offer
from ....models.campaign import Campaign
from ....models.ad import Ad

# Create logger for this module
logger = logging.getLogger('app.agents.ads_agent.generateHeadlines')


class AdsInputValidator(BaseValidator):
    """Custom validator for ads input parameters."""
    
    def __init__(self):
        self.field_name = "ads_input"
    
    def validate(self, parameters: Dict[str, Any], context: Optional[Dict[str, Any]] = None) -> ValidationResult:
        """Validate ads generation input."""
        result = ValidationResult(is_valid=True)
        
        # Debug: Log what parameters we receive
        logger.debug(f"AdsInputValidator.validate() received parameters: {parameters}")
        logger.debug(f"AdsInputValidator.validate() received context: {context}")
        
        if not isinstance(parameters, dict):
            result.add_error("Parameters must be a dictionary")
            return result
        
        # Required fields
        business_profile_id = parameters.get('business_profile_id')
        platform = parameters.get('platform')
        format = parameters.get('format')
        
        # Debug: Log extracted values
        logger.debug(f"Extracted business_profile_id: {business_profile_id} (type: {type(business_profile_id)})")
        logger.debug(f"Extracted platform: {platform}")
        logger.debug(f"Extracted format: {format}")
        action = parameters.get('action')
        
        # Context (exactly one required)
        offer_id = parameters.get('offer_id')
        campaign_id = parameters.get('campaign_id')
        
        # Validate business_profile_id
        logger.debug(f"Validating business_profile_id: {business_profile_id}")
        if not business_profile_id:
            logger.debug("business_profile_id validation failed: missing or falsy")
            result.add_error("'business_profile_id' is required")
        elif not isinstance(business_profile_id, str) or not business_profile_id.strip():
            logger.debug(f"business_profile_id validation failed: not string or empty. Type: {type(business_profile_id)}, value: '{business_profile_id}'")
            result.add_error("'business_profile_id' must be a non-empty string")
        else:
            logger.debug(f"business_profile_id validation passed: '{business_profile_id.strip()}'")
            result.set_validated_value('business_profile_id', business_profile_id.strip())
        
        # Validate platform
        if not platform:
            result.add_error("'platform' is required")
        elif not Ad.validate_platform(platform):
            result.add_error(f"'platform' must be one of: {', '.join(Ad.PLATFORM_OPTIONS)}")
        else:
            result.set_validated_value('platform', platform)
        
        # Validate format
        if not format:
            result.add_error("'format' is required")
        elif not Ad.validate_format(format):
            result.add_error(f"'format' must be one of: {', '.join(Ad.FORMAT_OPTIONS)}")
        else:
            result.set_validated_value('format', format)
        
        # Validate action
        if not action:
            result.add_error("'action' is required")
        elif not Ad.validate_action(action):
            result.add_error(f"'action' must be one of: {', '.join(Ad.ACTION_OPTIONS)}")
        else:
            result.set_validated_value('action', action)
        
        # Validate context (exactly one of offer_id or campaign_id)
        if not Ad.validate_context(offer_id, campaign_id):
            result.add_error("Exactly one of 'offer_id' or 'campaign_id' must be provided")
        else:
            if offer_id:
                result.set_validated_value('offer_id', offer_id)
            if campaign_id:
                result.set_validated_value('campaign_id', campaign_id)
        
        # Validate landing_url if provided (optional at this stage)
        landing_url = parameters.get('landing_url')
        if landing_url is not None:
            if not isinstance(landing_url, str) or not landing_url.strip():
                result.add_error("'landing_url' must be a non-empty string if provided")
            else:
                result.set_validated_value('landing_url', landing_url.strip())
        
        # Debug: Log final validation state
        logger.debug(f"Validation completed. is_valid: {result.is_valid}")
        logger.debug(f"Validation errors: {result.errors}")
        logger.debug(f"Validated data: {result.validated_data}")
        
        return result


class GenerateHeadlinesTool(PromptBasedTool):
    """
    Tool for generating ad headlines using AI analysis.
    Creates 6-10 headline suggestions based on platform, format, and context.
    """

    # Constants
    PROMPT_ID = 'pmpt_68b8163a3dc88195a59a245eabdb52d80d13638419c965d2'
    VERSION = '1.0.0'

    def __init__(self):
        # Initialize using factory pattern
        super().__init__(
            name='Generate Headlines',
            slug='generate-headlines',
            description='Generate ad headlines for a specific platform, format, and context',
            prompt_id=self.PROMPT_ID,
            version=self.VERSION,
            parser=self._parse_headlines_response  # Custom parser for headlines
        )
        
        # Store custom validator for use in _validate_input
        self._custom_validator = AdsInputValidator()

    def _validate_input(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Override to use custom validation logic."""
        logger.info(f"Validating input parameters: {parameters}")
        
        validation_result = self._custom_validator.validate(parameters)
        
        logger.info(f"Validation result: valid={validation_result.is_valid}, errors={validation_result.errors}")
        
        if not validation_result.is_valid:
            logger.error(f"Validation failed: {validation_result.get_error_message()}")
            return {
                'valid': False,
                'error': validation_result.get_error_message()
            }
        
        # Return validated parameters with proper structure
        result = {'valid': True}
        result.update(validation_result.validated_data)
        logger.info(f"Validation successful, returning: {result}")
        return result

    def _prepare_openai_message(self, validated_params: Dict[str, Any], input_data) -> str:
        """Prepare the comprehensive user message for OpenAI."""
        business_profile_id = validated_params['business_profile_id']
        platform = validated_params['platform']
        format = validated_params['format']
        action = validated_params['action']
        offer_id = validated_params.get('offer_id')
        campaign_id = validated_params.get('campaign_id')
        landing_url = validated_params.get('landing_url')
        
        logger.info(f"Preparing message for business profile ID: {business_profile_id}")
        
        # Fetch business profile data from database
        business_profile = BusinessProfile.query.filter_by(
            id=business_profile_id,
            user_id=input_data.user_id
        ).first()

        if not business_profile:
            raise ValueError(f"Business profile not found: {business_profile_id}")
            
        logger.info(f"Found business profile: {business_profile.name} for user {input_data.user_id}")

        # Fetch context data (offer or campaign)
        context_data = {}
        if offer_id:
            offer = Offer.query.filter_by(
                id=offer_id,
                business_profile_id=business_profile_id
            ).first()
            if offer:
                context_data = {
                    'type': 'offer',
                    'data': offer.to_dict()
                }
            else:
                logger.warning(f"Offer not found: {offer_id}")
        
        elif campaign_id:
            campaign = Campaign.query.filter_by(
                id=campaign_id,
                business_profile_id=business_profile_id,
                user_id=input_data.user_id
            ).first()
            if campaign:
                # Get related offers for the campaign
                related_offers = []
                if campaign.selected_products:
                    related_offers = Offer.query.filter(
                        Offer.id.in_(campaign.selected_products),
                        Offer.business_profile_id == business_profile_id
                    ).all()
                    related_offers = [offer.to_dict() for offer in related_offers]
                
                context_data = {
                    'type': 'campaign',
                    'data': campaign.to_dict(),
                    'related_offers': related_offers
                }
            else:
                logger.warning(f"Campaign not found: {campaign_id}")

        # Create comprehensive user message
        return self._create_user_message(
            business_profile.to_dict(), 
            context_data, 
            platform, 
            format, 
            action,
            landing_url
        )
    
    def _create_user_message(self, business_profile_data: Dict[str, Any], 
                           context_data: Dict[str, Any], platform: str, 
                           format: str, action: str, landing_url: str = None) -> str:
        """Create a comprehensive user message for the OpenAI prompt."""
        message_parts = []
        
        # Business Profile Information
        message_parts.append("=== BUSINESS PROFILE ===")
        message_parts.append(f"Business Name: {business_profile_data.get('name', 'N/A')}")
        message_parts.append(f"Website: {business_profile_data.get('website_url', 'N/A')}")
        message_parts.append(f"Offer Description: {business_profile_data.get('offer_description', 'N/A')}")
        message_parts.append(f"Target Customer: {business_profile_data.get('target_customer', 'N/A')}")
        message_parts.append(f"Problems Solved: {business_profile_data.get('problem_solved', 'N/A')}")
        message_parts.append(f"Customer Desires: {business_profile_data.get('customer_desires', 'N/A')}")
        message_parts.append(f"Brand Tone: {business_profile_data.get('brand_tone', 'N/A')}")
        message_parts.append(f"Language: {business_profile_data.get('communication_language', 'N/A')}")
        
        # Context Information
        message_parts.append(f"\n=== CONTEXT ({context_data.get('type', 'unknown').upper()}) ===")
        if context_data.get('type') == 'offer':
            offer = context_data['data']
            message_parts.append(f"Offer Name: {offer.get('name', 'N/A')}")
            message_parts.append(f"Offer Type: {offer.get('type', 'N/A')}")
            message_parts.append(f"Description: {offer.get('description', 'N/A')}")
            message_parts.append(f"Price: {offer.get('price', 'N/A')} {offer.get('unit', '')}")
        
        elif context_data.get('type') == 'campaign':
            campaign = context_data['data']
            message_parts.append(f"Campaign Goal: {campaign.get('goal', 'N/A')}")
            message_parts.append(f"Budget: {campaign.get('budget', 'N/A')}")
            message_parts.append(f"Target Audience: {campaign.get('target_audience', 'N/A')}")
            message_parts.append(f"Strategy Summary: {campaign.get('strategy_summary', 'N/A')}")
            
            # Include related offers
            related_offers = context_data.get('related_offers', [])
            if related_offers:
                message_parts.append(f"\nRelated Products/Services:")
                for i, offer in enumerate(related_offers, 1):
                    offer_type = offer.get('type', '')
                    type_text = f"({offer_type}) " if offer_type and offer_type != 'N/A' else ""
                    description = offer.get('description', '')
                    desc_text = f" - {description}" if description and description != 'N/A' else ""
                    message_parts.append(f"{i}. {offer.get('name', 'N/A')} {type_text}{desc_text} - {offer.get('price', 'N/A')} {offer.get('unit', '')}")
        
        # Ad Specifications
        message_parts.append(f"\n=== AD SPECIFICATIONS ===")
        message_parts.append(f"Platform: {platform}")
        message_parts.append(f"Format: {format}")
        message_parts.append(f"Action: {action}")
        
        return "\n".join(message_parts)

    def _parse_headlines_response(self, content: Any) -> Dict[str, Any]:
        """Custom parser for headlines response."""
        try:
            # If content is already a dict, use it directly
            if isinstance(content, dict):
                parsed_data = content
            elif isinstance(content, str):
                # Try to parse as JSON
                try:
                    parsed_data = json.loads(content)
                except json.JSONDecodeError:
                    # If not JSON, treat as plain text and try to extract headlines
                    headlines = self._extract_headlines_from_text(content)
                    parsed_data = {'headlines': headlines}
            else:
                parsed_data = {'headlines': []}
            
            # Ensure headlines is a list
            headlines = parsed_data.get('headlines', [])
            if not isinstance(headlines, list):
                headlines = []
            
            return {'headlines': headlines}
            
        except Exception as e:
            logger.error(f"Failed to parse headlines response: {str(e)}")
            return {'headlines': []}
    
    def _extract_headlines_from_text(self, text: str) -> list:
        """Extract headlines from plain text response."""
        headlines = []
        lines = text.split('\n')
        
        for line in lines:
            line = line.strip()
            if line and not line.startswith('='):
                # Remove common prefixes like numbers, bullets, etc.
                line = line.lstrip('0123456789.-* ')
                if len(line) > 10:  # Reasonable headline length
                    headlines.append({'headline': line, 'angle': ''})
        
        return headlines[:10]  # Limit to 10 headlines

    def _process_openai_result(
        self,
        content: Any,
        validated_params: Dict[str, Any],
        openai_result: Dict[str, Any],
        user_id: Optional[str]
    ) -> Dict[str, Any]:
        """Process OpenAI result and create draft ads with headlines."""
        try:
            # Parse the content using custom parser
            parsed_data = self.parser(content)
            headlines = parsed_data.get('headlines', [])
            
            # Extract headline texts for response (no database operations)
            headline_texts = []
            business_profile_id = validated_params['business_profile_id']
            
            for headline_data in headlines:
                headline_text = headline_data.get('headline', '') if isinstance(headline_data, dict) else str(headline_data)
                if headline_text.strip():
                    headline_texts.append(headline_text.strip())
            
            # Return just the headlines without creating database records
            return {
                'headlines': headline_texts,
                'headline_count': len(headline_texts),
                'business_profile_id': business_profile_id,
                'generation_params': {
                    'platform': validated_params['platform'],
                    'format': validated_params['format'],
                    'action': validated_params['action'],
                    'offer_id': validated_params.get('offer_id'),
                    'campaign_id': validated_params.get('campaign_id'),
                    'landing_url': validated_params.get('landing_url')
                }
            }
            
        except Exception as process_error:
            logger.error(f"Failed to process headlines result: {str(process_error)}")
            return {
                'headlines': [],
                'headline_count': 0,
                'error': f"Failed to process headlines result: {str(process_error)}"
            }

    def _parse_status_content(self, content: Any) -> Dict[str, Any]:
        """Parse content from status checking."""
        try:
            parsed_content = self.parser(content)
            return parsed_content
        except Exception as e:
            raise Exception(f"Failed to parse headlines status result: {str(e)}")