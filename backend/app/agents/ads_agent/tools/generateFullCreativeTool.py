"""
GenerateFullCreativeTool - A tool for generating complete ad creatives using OpenAI.
Takes selected headlines and generates full creative content including primary text, visual brief, etc.
"""

from typing import Dict, Any, Optional, List
import json
import logging

from ...shared.tool_factory import PromptBasedTool
from ...shared.validators import ParametersValidator, BaseValidator, ValidationResult
from ....models.business_profile import BusinessProfile
from ....models.offer import Offer
from ....models.campaign import Campaign
from ....models.ad import Ad
from .... import db

# Create logger for this module
logger = logging.getLogger('app.agents.ads_agent.generateFullCreative')


class CreativeInputValidator(BaseValidator):
    """Custom validator for creative generation input parameters."""
    
    def __init__(self):
        self.field_name = "creative_input"
    
    def validate(self, parameters: Dict[str, Any], context: Optional[Dict[str, Any]] = None) -> ValidationResult:
        """Validate creative generation input."""
        result = ValidationResult(is_valid=True)
        
        if not isinstance(parameters, dict):
            result.add_error("Parameters must be a dictionary")
            return result
        
        # Required fields
        selected_headlines = parameters.get('selected_headlines')
        business_profile_id = parameters.get('business_profile_id')
        platform = parameters.get('platform')
        format = parameters.get('format')
        action = parameters.get('action')
        
        # Validate selected_headlines
        if not selected_headlines:
            result.add_error("'selected_headlines' is required")
        elif not isinstance(selected_headlines, list) or len(selected_headlines) == 0:
            result.add_error("'selected_headlines' must be a non-empty list")
        elif not all(isinstance(headline, str) for headline in selected_headlines):
            result.add_error("'selected_headlines' must be a list of strings")
        else:
            result.set_validated_value('selected_headlines', selected_headlines)
        
        # Validate business_profile_id
        if not business_profile_id:
            result.add_error("'business_profile_id' is required")
        elif not isinstance(business_profile_id, str) or not business_profile_id.strip():
            result.add_error("'business_profile_id' must be a non-empty string")
        else:
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
        
        # Optional fields
        offer_id = parameters.get('offer_id')
        campaign_id = parameters.get('campaign_id')
        landing_url = parameters.get('landing_url')
        
        # Validate context (exactly one of offer_id or campaign_id)
        if not Ad.validate_context(offer_id, campaign_id):
            result.add_error("Exactly one of 'offer_id' or 'campaign_id' must be provided")
        else:
            if offer_id:
                result.set_validated_value('offer_id', offer_id)
            if campaign_id:
                result.set_validated_value('campaign_id', campaign_id)
        
        # Validate landing_url if provided (optional)
        if landing_url is not None:
            if not isinstance(landing_url, str) or not landing_url.strip():
                result.add_error("'landing_url' must be a non-empty string if provided")
            else:
                result.set_validated_value('landing_url', landing_url.strip())
        
        return result


class GenerateFullCreativeTool(PromptBasedTool):
    """
    Tool for generating full ad creatives using AI analysis.
    Takes selected headlines and creates complete creative content.
    """

    # Constants
    PROMPT_ID = 'pmpt_68b816560a3c81968971fce73cf9777d0ff8a4e4f5493aec'
    VERSION = '1.0.0'

    def __init__(self):
        # Initialize using factory pattern
        super().__init__(
            name='Generate Full Creative',
            slug='generate-full-creative',
            description='Generate complete ad creative content for selected headlines',
            prompt_id=self.PROMPT_ID,
            version=self.VERSION,
            parser=self._parse_creative_response  # Custom parser for creative
        )
        
        # Store custom validator for use in _validate_input
        self._custom_validator = CreativeInputValidator()

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
        selected_headlines = validated_params['selected_headlines']
        business_profile_id = validated_params['business_profile_id']
        
        logger.info(f"Preparing creative generation message for headlines: {selected_headlines}")
        
        # Get business profile
        business_profile = BusinessProfile.query.filter_by(
            id=business_profile_id,
            user_id=input_data.user_id
        ).first()

        if not business_profile:
            raise ValueError(f"Business profile not found: {business_profile_id}")

        # Gather context data for the creative generation
        context_data = {}
        offer_id = validated_params.get('offer_id')
        campaign_id = validated_params.get('campaign_id')
        
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
            selected_headlines,
            validated_params['platform'],
            validated_params['format'],
            validated_params['action'],
            context_data,
            validated_params.get('landing_url')
        )
    
    def _create_user_message(self, business_profile_data: Dict[str, Any], 
                           selected_headlines: List[str], platform: str,
                           format: str, action: str, context_data: Dict[str, Any],
                           landing_url: str = None) -> str:
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
        
        # Selected Headlines
        message_parts.append(f"\n=== SELECTED HEADLINES FOR CREATIVE EXPANSION ===")
        for i, headline in enumerate(selected_headlines, 1):
            message_parts.append(f"{i}. {headline}")
        
        return "\n".join(message_parts)

    def _parse_creative_response(self, content: Any) -> Dict[str, Any]:
        """Custom parser for creative response."""
        try:
            # If content is already a dict, use it directly
            if isinstance(content, dict):
                parsed_data = content
            elif isinstance(content, str):
                # Try to parse as JSON
                try:
                    parsed_data = json.loads(content)
                except json.JSONDecodeError:
                    # If not JSON, create a simple structure
                    parsed_data = {'creatives': [{'primary_text': content}]}
            else:
                parsed_data = {'creatives': []}
            
            # Ensure creatives is a list
            creatives = parsed_data.get('creatives', [])
            if not isinstance(creatives, list):
                creatives = []
            
            return {'creatives': creatives}
            
        except Exception as e:
            logger.error(f"Failed to parse creative response: {str(e)}")
            return {'creatives': []}

    def _process_openai_result(
        self,
        content: Any,
        validated_params: Dict[str, Any],
        openai_result: Dict[str, Any],
        user_id: Optional[str]
    ) -> Dict[str, Any]:
        """Process OpenAI result and create new complete Ad records."""
        try:
            # Parse the content using custom parser
            parsed_data = self.parser(content)
            creatives = parsed_data.get('creatives', [])
            
            selected_headlines = validated_params['selected_headlines']
            business_profile_id = validated_params['business_profile_id']
            
            created_ads = []
            
            # Create new ad record for each headline/creative pair
            for i, headline in enumerate(selected_headlines):
                creative = None
                if i < len(creatives):
                    creative = creatives[i]
                elif len(creatives) == 1:
                    # If only one creative returned, use it for all headlines
                    creative = creatives[0]
                
                # Create new Ad record with complete creative content
                ad = Ad(
                    business_profile_id=business_profile_id,
                    user_id=user_id,
                    platform=validated_params['platform'],
                    format=validated_params['format'],
                    action=validated_params['action'],
                    offer_id=validated_params.get('offer_id'),
                    campaign_id=validated_params.get('campaign_id'),
                    headline=headline,
                    status='draft'
                )
                
                # Add creative content if available
                if creative:
                    ad.primary_text = creative.get('primary_text', '')
                    ad.visual_brief = creative.get('visual_brief', '')
                    ad.overlay_text = creative.get('overlay_text')
                    ad.script_text = creative.get('script_text')
                    ad.cta = creative.get('cta', '')
                
                # Add landing_url (from creative or original params)
                landing_url = validated_params.get('landing_url')
                if creative and creative.get('landing_url'):
                    ad.landing_url = creative['landing_url']
                elif landing_url:
                    ad.landing_url = landing_url
                
                db.session.add(ad)
                created_ads.append(ad)
            
            # Commit to database
            db.session.commit()
            
            # Convert to dict for response
            ads_data = [ad.to_dict() for ad in created_ads]
            
            return {
                'creatives': creatives,
                'created_ads': ads_data,
                'ads_count': len(created_ads),
                'business_profile_id': business_profile_id
            }
            
        except Exception as process_error:
            db.session.rollback()
            logger.error(f"Failed to process creative result: {str(process_error)}")
            return {
                'creatives': [],
                'created_ads': [],
                'ads_count': 0,
                'error': f"Failed to process creative result: {str(process_error)}"
            }

    def _parse_status_content(self, content: Any) -> Dict[str, Any]:
        """Parse content from status checking."""
        try:
            parsed_content = self.parser(content)
            return parsed_content
        except Exception as e:
            raise Exception(f"Failed to parse creative status result: {str(e)}")