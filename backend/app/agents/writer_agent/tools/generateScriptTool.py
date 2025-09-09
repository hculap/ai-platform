"""
GenerateScriptTool - A tool for generating complete scripts using OpenAI.
Takes a selected hook and generates full script content based on type and user preferences.
"""

from typing import Dict, Any, Optional, List
import json
import logging

from ...shared.tool_factory import PromptBasedTool
from ...shared.validators import BaseValidator, ValidationResult
from ....models.business_profile import BusinessProfile
from ....models.offer import Offer
from ....models.campaign import Campaign
from ....models.script import Script
from ....models.user_style import UserStyle
from ....models.competition import Competition
from .... import db

# Create logger for this module
logger = logging.getLogger('app.agents.writer_agent.generateScript')


class ScriptInputValidator(BaseValidator):
    """Custom validator for script generation input parameters."""
    
    def __init__(self):
        self.field_name = "script_input"
    
    def validate(self, parameters: Dict[str, Any], context: Optional[Dict[str, Any]] = None) -> ValidationResult:
        """Validate script generation input."""
        result = ValidationResult(is_valid=True)
        
        logger.debug(f"ScriptInputValidator.validate() received parameters: {parameters}")
        logger.debug(f"ScriptInputValidator.validate() received context: {context}")
        
        if not isinstance(parameters, dict):
            result.add_error("Parameters must be a dictionary")
            return result
        
        # Required fields
        selected_hook = parameters.get('selected_hook')
        script_type = parameters.get('script_type')
        business_profile_id = parameters.get('business_profile_id')
        
        # Validate selected_hook
        if not selected_hook:
            result.add_error("'selected_hook' is required")
        elif not isinstance(selected_hook, str) or not selected_hook.strip():
            result.add_error("'selected_hook' must be a non-empty string")
        else:
            result.set_validated_value('selected_hook', selected_hook.strip())
        
        # Validate script_type
        valid_script_types = [
            'post', 'blog', 'script_youtube', 'script_tiktok_reel', 'script_vsl', 'general'
        ]
        
        if not script_type:
            result.add_error("'script_type' is required")
        elif script_type not in valid_script_types:
            result.add_error(f"'script_type' must be one of: {', '.join(valid_script_types)}")
        else:
            result.set_validated_value('script_type', script_type)
        
        # Validate business_profile_id
        if not business_profile_id:
            result.add_error("'business_profile_id' is required")
        elif not isinstance(business_profile_id, str) or not business_profile_id.strip():
            result.add_error("'business_profile_id' must be a non-empty string")
        else:
            result.set_validated_value('business_profile_id', business_profile_id.strip())
        
        # Optional fields
        style_id = parameters.get('style_id')
        if style_id is not None:
            if not isinstance(style_id, str) or not style_id.strip():
                result.add_error("'style_id' must be a non-empty string if provided")
            else:
                result.set_validated_value('style_id', style_id.strip())
        
        additional_context = parameters.get('additional_context')
        if additional_context is not None:
            if not isinstance(additional_context, str):
                result.add_error("'additional_context' must be a string if provided")
            else:
                result.set_validated_value('additional_context', additional_context.strip())
        
        # Optional context (exactly one of offer_id or campaign_id, or neither)
        offer_id = parameters.get('offer_id')
        campaign_id = parameters.get('campaign_id')
        
        if offer_id and campaign_id:
            result.add_error("Cannot provide both 'offer_id' and 'campaign_id'")
        elif offer_id:
            if not isinstance(offer_id, str) or not offer_id.strip():
                result.add_error("'offer_id' must be a non-empty string if provided")
            else:
                result.set_validated_value('offer_id', offer_id.strip())
        elif campaign_id:
            if not isinstance(campaign_id, str) or not campaign_id.strip():
                result.add_error("'campaign_id' must be a non-empty string if provided")
            else:
                result.set_validated_value('campaign_id', campaign_id.strip())
        
        logger.debug(f"Validation completed. is_valid: {result.is_valid}")
        logger.debug(f"Validation errors: {result.errors}")
        logger.debug(f"Validated data: {result.validated_data}")
        
        return result


class GenerateScriptTool(PromptBasedTool):
    """
    Tool for generating complete scripts using AI analysis.
    Takes a selected hook and creates full script content based on type and preferences.
    """

    # Constants
    PROMPT_ID = 'pmpt_68bd29f83a5c8194bb62367f212baa5b08cfddfb386f5709'
    VERSION = '1.0.0'
    
    # Script type definitions with descriptions
    SCRIPT_TYPES = {
        'post': {
            'name': 'Social Media Post',
            'description': 'Short-form content for social media platforms',
            'max_length': '1-3 paragraphs'
        },
        'blog': {
            'name': 'Blog Article',
            'description': 'Long-form content for blogs and websites',
            'max_length': '500-2000 words'
        },
        'script_youtube': {
            'name': 'YouTube Script',
            'description': 'Video script optimized for YouTube format',
            'max_length': '3-10 minutes speaking time'
        },
        'script_tiktok_reel': {
            'name': 'TikTok/Reel Script',
            'description': 'Short video script for TikTok or Instagram Reels',
            'max_length': '15-60 seconds speaking time'
        },
        'script_vsl': {
            'name': 'Video Sales Letter (VSL)',
            'description': 'Sales-focused video script for conversions',
            'max_length': '5-20 minutes speaking time'
        },
        'general': {
            'name': 'General Script',
            'description': 'General purpose content script',
            'max_length': 'Variable length'
        }
    }

    def __init__(self):
        # Initialize using factory pattern
        super().__init__(
            name='Generate Script',
            slug='generate-script',
            description='Generate complete script content from hooks based on type and user preferences',
            prompt_id=self.PROMPT_ID,
            version=self.VERSION,
            parser=self._parse_script_response  # Custom parser for scripts
        )
        
        # Store custom validator for use in _validate_input
        self._custom_validator = ScriptInputValidator()

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
        selected_hook = validated_params['selected_hook']
        script_type = validated_params['script_type']
        business_profile_id = validated_params['business_profile_id']
        
        logger.info(f"Preparing script generation message for hook: {selected_hook}")
        
        # Get business profile
        business_profile = BusinessProfile.query.filter_by(
            id=business_profile_id,
            user_id=input_data.user_id
        ).first()

        if not business_profile:
            raise ValueError(f"Business profile not found: {business_profile_id}")

        # Get style information if provided
        style_data = None
        style_id = validated_params.get('style_id')
        if style_id:
            user_style = UserStyle.query.filter_by(
                id=style_id,
                user_id=input_data.user_id
            ).first()
            if user_style:
                style_data = user_style.to_dict()
            else:
                logger.warning(f"User style not found: {style_id}")

        # Get competition data
        competitions = Competition.query.filter_by(
            business_profile_id=business_profile_id
        ).all()
        
        # Get offers data
        offers = Offer.query.filter_by(
            business_profile_id=business_profile_id
        ).all()

        # Gather context data for the script generation
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
            [comp.to_dict() for comp in competitions],
            [offer.to_dict() for offer in offers],
            selected_hook,
            script_type,
            style_data,
            validated_params.get('additional_context', ''),
            context_data
        )
    
    def _create_user_message(self, business_profile_data: Dict[str, Any], 
                           competitions_data: list, offers_data: list,
                           selected_hook: str, script_type: str, style_data: Optional[Dict[str, Any]],
                           additional_context: str, context_data: Dict[str, Any]) -> str:
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
        
        # Competition Information
        message_parts.append(f"\n=== COMPETITION DATA ===")
        if competitions_data:
            for i, comp in enumerate(competitions_data, 1):
                message_parts.append(f"{i}. {comp.get('name', 'N/A')}")
                if comp.get('url'):
                    message_parts.append(f"   URL: {comp['url']}")
                if comp.get('description'):
                    message_parts.append(f"   Description: {comp['description']}")
                if comp.get('usp'):
                    message_parts.append(f"   USP: {comp['usp']}")
        else:
            message_parts.append("No competition data available")
        
        # Offers Information - only show if no focused context exists
        if not context_data:
            message_parts.append(f"\n=== OFFERS/PRODUCTS/SERVICES ===")
            if offers_data:
                for i, offer in enumerate(offers_data, 1):
                    offer_type = offer.get('type', '')
                    type_text = f"({offer_type}) " if offer_type and offer_type != 'N/A' else ""
                    description = offer.get('description', '')
                    desc_text = f" - {description}" if description and description != 'N/A' else ""
                    price = offer.get('price', 'N/A')
                    unit = offer.get('unit', '')
                    price_text = f" - {price} {unit}" if price != 'N/A' else ""
                    message_parts.append(f"{i}. {offer.get('name', 'N/A')} {type_text}{desc_text}{price_text}")
            else:
                message_parts.append("No offers/products/services data available")
        
        # Context Information
        if context_data:
            message_parts.append(f"\n=== FOCUS CONTEXT ({context_data.get('type', 'unknown').upper()}) ===")
            if context_data.get('type') == 'offer':
                offer = context_data['data']
                message_parts.append(f"Focus Offer: {offer.get('name', 'N/A')}")
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
                    message_parts.append(f"\nCampaign Products/Services:")
                    for i, offer in enumerate(related_offers, 1):
                        offer_type = offer.get('type', '')
                        type_text = f"({offer_type}) " if offer_type and offer_type != 'N/A' else ""
                        description = offer.get('description', '')
                        desc_text = f" - {description}" if description and description != 'N/A' else ""
                        message_parts.append(f"{i}. {offer.get('name', 'N/A')} {type_text}{desc_text} - {offer.get('price', 'N/A')} {offer.get('unit', '')}")
        
        # Style Information
        if style_data:
            message_parts.append(f"\n=== WRITING STYLE TO EMULATE ===")
            message_parts.append(f"Style Name: {style_data.get('style_name', 'N/A')}")
            message_parts.append(f"Language: {style_data.get('language', 'N/A')}")
            # Get style_card data (contains the actual analysis)
            style_card_data = style_data.get('style_card', {})
            message_parts.append(f"Content Types: {', '.join(style_card_data.get('content_types', []))}")
            
            # Style characteristics
            if style_card_data:
                if style_card_data.get('tone'):
                    message_parts.append(f"Tone: {style_card_data['tone']}")
                if style_card_data.get('vocabulary'):
                    message_parts.append(f"Vocabulary: {style_card_data['vocabulary']}")
                if style_card_data.get('sentence_structure'):
                    message_parts.append(f"Sentence Structure: {style_card_data['sentence_structure']}")
                if style_card_data.get('key_phrases'):
                    message_parts.append(f"Key Phrases: {', '.join(style_card_data['key_phrases'])}")
                if style_card_data.get('avoid_phrases'):
                    message_parts.append(f"Phrases to Avoid: {', '.join(style_card_data['avoid_phrases'])}")
        
        # Script Specifications
        script_info = self.SCRIPT_TYPES.get(script_type, {})
        message_parts.append(f"\n=== SCRIPT SPECIFICATIONS ===")
        message_parts.append(f"Script Type: {script_info.get('name', script_type)}")
        message_parts.append(f"Description: {script_info.get('description', 'N/A')}")
        message_parts.append(f"Target Length: {script_info.get('max_length', 'N/A')}")
        
        # Selected Hook
        message_parts.append(f"\n=== HOOK TO EXPAND INTO FULL SCRIPT ===")
        message_parts.append(selected_hook)
        
        # Additional Context
        if additional_context:
            message_parts.append(f"\n=== ADDITIONAL CONTEXT ===")
            message_parts.append(additional_context)
        
        return "\n".join(message_parts)

    def _parse_script_response(self, content: Any) -> Dict[str, Any]:
        """Custom parser for script response."""
        try:
            # If content is already a dict, use it directly
            if isinstance(content, dict):
                parsed_data = content
            elif isinstance(content, str):
                # Try to parse as JSON
                try:
                    parsed_data = json.loads(content)
                except json.JSONDecodeError:
                    # If not JSON, treat as plain text script content
                    parsed_data = {
                        'title': self._extract_title_from_content(content),
                        'content': content.strip()
                    }
            else:
                parsed_data = {'title': '', 'content': ''}
            
            # Ensure required fields exist
            if 'content' not in parsed_data:
                parsed_data['content'] = ''
            if 'title' not in parsed_data:
                parsed_data['title'] = self._extract_title_from_content(parsed_data.get('content', ''))
            
            return parsed_data
            
        except Exception as e:
            logger.error(f"Failed to parse script response: {str(e)}")
            return {'title': 'Generated Script', 'content': ''}
    
    def _extract_title_from_content(self, content: str) -> str:
        """Extract a title from content or generate a generic one."""
        if not content:
            return 'Generated Script'
        
        lines = content.strip().split('\n')
        first_line = lines[0].strip()
        
        # Remove common prefixes and clean up
        prefixes_to_remove = ['#', '##', '###', 'Title:', 'TITLE:', '*', '-', '•']
        for prefix in prefixes_to_remove:
            if first_line.startswith(prefix):
                first_line = first_line[len(prefix):].strip()
        
        # Limit title length
        if len(first_line) > 100:
            first_line = first_line[:97] + '...'
        
        return first_line if first_line else 'Generated Script'

    def _process_openai_result(
        self,
        content: Any,
        validated_params: Dict[str, Any],
        openai_result: Dict[str, Any],
        user_id: Optional[str]
    ) -> Dict[str, Any]:
        """Process OpenAI result and create new Script record."""
        try:
            # Parse the content using custom parser
            parsed_data = self.parser(content)
            
            script_title = parsed_data.get('title', 'Generated Script')
            script_content = parsed_data.get('content', '')
            
            if not script_content.strip():
                return {
                    'script': None,
                    'error': 'No script content was generated'
                }
            
            # Create new Script record
            script = Script(
                user_id=user_id,
                business_profile_id=validated_params['business_profile_id'],
                title=script_title,
                content=script_content,
                script_type=validated_params['script_type'],
                style_id=validated_params.get('style_id'),
                offer_id=validated_params.get('offer_id'),
                campaign_id=validated_params.get('campaign_id'),
                status='draft'
            )
            
            db.session.add(script)
            db.session.commit()
            
            logger.info(f"Created new script with ID: {script.id}")
            
            # Preserve rich metadata from OpenAI response alongside saved script
            response_data = {
                'script': script.to_dict(),
                'success': True,
                'business_profile_id': validated_params['business_profile_id'],
                'generation_params': {
                    'selected_hook': validated_params['selected_hook'],
                    'script_type': validated_params['script_type'],
                    'style_id': validated_params.get('style_id'),
                    'additional_context': validated_params.get('additional_context', '')
                }
            }
            
            # Add rich metadata from OpenAI if available (e.g., beats, checklist, cta, duration)
            rich_fields = ['beats', 'checklist', 'cta', 'estimated_duration_sec', 'metadata', 'language']
            for field in rich_fields:
                if field in parsed_data:
                    response_data[field] = parsed_data[field]
            
            return response_data
            
        except Exception as process_error:
            db.session.rollback()
            logger.error(f"Failed to process script result: {str(process_error)}")
            return {
                'script': None,
                'error': f"Failed to process script result: {str(process_error)}"
            }

    def _parse_status_content(self, content: Any) -> Dict[str, Any]:
        """Parse content from status checking."""
        try:
            parsed_content = self.parser(content)
            return parsed_content
        except Exception as e:
            raise Exception(f"Failed to parse script status result: {str(e)}")