"""
GenerateScriptHooksTool - A tool for generating script hooks using OpenAI.
Generates script hooks based on content categories for social media and content marketing.
"""

from typing import Dict, Any, Optional
import json
import logging

from ...shared.tool_factory import PromptBasedTool
from ...shared.validators import BaseValidator, ValidationResult
from ....models.business_profile import BusinessProfile
from ....models.offer import Offer
from ....models.competition import Competition

# Create logger for this module
logger = logging.getLogger('app.agents.writer_agent.generateScriptHooks')


class ScriptHooksInputValidator(BaseValidator):
    """Custom validator for script hooks input parameters."""
    
    def __init__(self):
        self.field_name = "script_hooks_input"
    
    def validate(self, parameters: Dict[str, Any], context: Optional[Dict[str, Any]] = None) -> ValidationResult:
        """Validate script hooks generation input."""
        result = ValidationResult(is_valid=True)
        
        # Debug: Log what parameters we receive
        logger.debug(f"ScriptHooksInputValidator.validate() received parameters: {parameters}")
        logger.debug(f"ScriptHooksInputValidator.validate() received context: {context}")
        
        if not isinstance(parameters, dict):
            result.add_error("Parameters must be a dictionary")
            return result
        
        # Required fields
        business_profile_id = parameters.get('business_profile_id')
        category = parameters.get('category')
        
        # Debug: Log extracted values
        logger.debug(f"Extracted business_profile_id: {business_profile_id} (type: {type(business_profile_id)})")
        logger.debug(f"Extracted category: {category}")
        
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
        
        # Define valid categories
        valid_categories = [
            "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15"
        ]
        
        # Validate category
        if not category:
            result.add_error("'category' is required")
        elif str(category) not in valid_categories:
            result.add_error(f"'category' must be one of: {', '.join(valid_categories)}")
        else:
            result.set_validated_value('category', str(category))
        
        # Optional additional context
        additional_context = parameters.get('additional_context')
        if additional_context is not None:
            if not isinstance(additional_context, str):
                result.add_error("'additional_context' must be a string if provided")
            else:
                result.set_validated_value('additional_context', additional_context.strip())
        
        # Debug: Log final validation state
        logger.debug(f"Validation completed. is_valid: {result.is_valid}")
        logger.debug(f"Validation errors: {result.errors}")
        logger.debug(f"Validated data: {result.validated_data}")
        
        return result


class GenerateScriptHooksTool(PromptBasedTool):
    """
    Tool for generating script hooks using AI analysis.
    Creates content hooks based on predefined categories for social media and content marketing.
    """

    # Constants
    PROMPT_ID = 'pmpt_68bc7fd71d288197a1f4bb2dff0b79350822e72caa8345e2'
    VERSION = '1.0.0'
    
    # Category definitions
    CATEGORIES = {
        "1": {
            "name": "Trends / Industry Insight",
            "purpose": "build authority",
            "example": "3 AI go-to-market shifts we're seeing this quarter (and how to respond)."
        },
        "2": {
            "name": "Education / How-To / Playbook",
            "purpose": "drive value & saves",
            "example": "How to turn a landing page into a lead engine in 5 steps (templates inside)."
        },
        "3": {
            "name": "Use Case / Case Study",
            "purpose": "prove ROI",
            "example": "How ACME cut CAC by 27% using agentic outreach (stack + numbers)."
        },
        "4": {
            "name": "Failure Story / Lessons Learned",
            "purpose": "authenticity & engagement",
            "example": "We shipped the wrong feature first. Here's the post-mortem and the 3 guardrails we added."
        },
        "5": {
            "name": "News / Announcements",
            "purpose": "awareness",
            "example": "We've just shipped Windows support—why it matters for consumer GPUs."
        },
        "6": {
            "name": "Review / Testimonial / Social Proof",
            "purpose": "reduce risk",
            "example": "'Saved us 12h/week.' — PM at Golem. Full quote + context."
        },
        "7": {
            "name": "Feature Spotlight / Mini-Demo",
            "purpose": "activate demand",
            "example": "60-sec screen capture: competitor mapping → ICP brief → outreach script."
        },
        "8": {
            "name": "Comparison / Benchmark",
            "purpose": "help decisions",
            "example": "Open-source image editors vs hosted: quality, TCO, and edit latency (charts)."
        },
        "9": {
            "name": "Myth-Busting / Hot Take",
            "purpose": "spark discussion",
            "example": "Hot take: 'Agents replace SDRs' is wrong. Here's the right split of work."
        },
        "10": {
            "name": "Data Drop / Research Snippet",
            "purpose": "credibility & shares",
            "example": "From 2147 analyzed sites: top 5 conversion blockers (with examples)."
        },
        "11": {
            "name": "Behind the Scenes / Build in Public",
            "purpose": "trust",
            "example": "Our roadmap Kanban this week + what slipped (and why)."
        },
        "12": {
            "name": "Community Question / Poll",
            "purpose": "comments & reach",
            "example": "If you had to cut one GTM tool today, which goes first? (Poll)"
        },
        "13": {
            "name": "Templates / Checklists / Notion drops",
            "purpose": "saves & bookmarks",
            "example": "Free: AI Growth OS audit checklist (15 checks, copy link inside)."
        },
        "14": {
            "name": "Events: Live, Recap, Slides",
            "purpose": "FOMO + authority",
            "example": "Slides from my NBX talk: 'Fixing the centralized AI market' (download)."
        },
        "15": {
            "name": "Culture / Hiring / Team Spotlight",
            "purpose": "employer brand",
            "example": "Why we hire 'systems' thinkers first—3 signals from interviews."
        }
    }

    def __init__(self):
        # Initialize using factory pattern
        super().__init__(
            name='Generate Script Hooks',
            slug='generate-script-hooks',
            description='Generate script hooks for content marketing based on selected categories',
            prompt_id=self.PROMPT_ID,
            version=self.VERSION,
            parser=self._parse_hooks_response  # Custom parser for hooks
        )
        
        # Store custom validator for use in _validate_input
        self._custom_validator = ScriptHooksInputValidator()

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
        category = validated_params['category']
        additional_context = validated_params.get('additional_context', '')
        
        logger.info(f"Preparing message for business profile ID: {business_profile_id}")
        
        # Fetch business profile data from database
        business_profile = BusinessProfile.query.filter_by(
            id=business_profile_id,
            user_id=input_data.user_id
        ).first()

        if not business_profile:
            raise ValueError(f"Business profile not found: {business_profile_id}")
            
        logger.info(f"Found business profile: {business_profile.name} for user {input_data.user_id}")

        # Fetch competition data
        competitions = Competition.query.filter_by(
            business_profile_id=business_profile_id
        ).all()
        
        # Fetch offers data
        offers = Offer.query.filter_by(
            business_profile_id=business_profile_id
        ).all()

        # Create comprehensive user message
        return self._create_user_message(
            business_profile.to_dict(), 
            [comp.to_dict() for comp in competitions],
            [offer.to_dict() for offer in offers],
            category,
            additional_context
        )
    
    def _create_user_message(self, business_profile_data: Dict[str, Any], 
                           competitions_data: list, offers_data: list,
                           category: str, additional_context: str = '') -> str:
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
        
        # Offers Information
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
        
        # Category Information
        category_info = self.CATEGORIES.get(category, {})
        message_parts.append(f"\n=== CONTENT CATEGORY ===")
        message_parts.append(f"Category {category}: {category_info.get('name', 'Unknown')}")
        message_parts.append(f"Purpose: {category_info.get('purpose', 'N/A')}")
        message_parts.append(f"Example Hook: {category_info.get('example', 'N/A')}")
        
        # Additional Context
        if additional_context:
            message_parts.append(f"\n=== ADDITIONAL CONTEXT ===")
            message_parts.append(additional_context)
        
        return "\n".join(message_parts)

    def _parse_hooks_response(self, content: Any) -> Dict[str, Any]:
        """Custom parser for hooks response."""
        try:
            # If content is already a dict, use it directly
            if isinstance(content, dict):
                parsed_data = content
            elif isinstance(content, str):
                # Try to parse as JSON
                try:
                    parsed_data = json.loads(content)
                except json.JSONDecodeError:
                    # If not JSON, treat as plain text and try to extract hooks
                    hooks = self._extract_hooks_from_text(content)
                    parsed_data = {'hooks': hooks}
            else:
                parsed_data = {'hooks': []}
            
            # Ensure hooks is a list
            hooks = parsed_data.get('hooks', [])
            if not isinstance(hooks, list):
                hooks = []
            
            return {'hooks': hooks}
            
        except Exception as e:
            logger.error(f"Failed to parse hooks response: {str(e)}")
            return {'hooks': []}
    
    def _extract_hooks_from_text(self, text: str) -> list:
        """Extract hooks from plain text response."""
        hooks = []
        lines = text.split('\n')
        
        for line in lines:
            line = line.strip()
            if line and not line.startswith('='):
                # Remove common prefixes like numbers, bullets, etc.
                line = line.lstrip('0123456789.-* ')
                if len(line) > 15:  # Reasonable hook length
                    hooks.append({'hook': line, 'category': '', 'purpose': ''})
        
        return hooks[:10]  # Limit to 10 hooks

    def _process_openai_result(
        self,
        content: Any,
        validated_params: Dict[str, Any],
        openai_result: Dict[str, Any],
        user_id: Optional[str]
    ) -> Dict[str, Any]:
        """Process OpenAI result and return hooks for user selection."""
        try:
            # Parse the content using custom parser
            parsed_data = self.parser(content)
            hooks = parsed_data.get('hooks', [])
            
            # Extract hook texts for response (no database operations)
            hook_texts = []
            business_profile_id = validated_params['business_profile_id']
            category = validated_params['category']
            category_info = self.CATEGORIES.get(category, {})
            
            for hook_data in hooks:
                hook_text = hook_data.get('hook', '') if isinstance(hook_data, dict) else str(hook_data)
                if hook_text.strip():
                    hook_texts.append(hook_text.strip())
            
            # Return just the hooks without creating database records
            return {
                'hooks': hook_texts,
                'hook_count': len(hook_texts),
                'business_profile_id': business_profile_id,
                'category': {
                    'number': category,
                    'name': category_info.get('name', 'Unknown'),
                    'purpose': category_info.get('purpose', 'N/A'),
                    'example': category_info.get('example', 'N/A')
                },
                'generation_params': {
                    'category': category,
                    'additional_context': validated_params.get('additional_context', '')
                }
            }
            
        except Exception as process_error:
            logger.error(f"Failed to process hooks result: {str(process_error)}")
            return {
                'hooks': [],
                'hook_count': 0,
                'error': f"Failed to process hooks result: {str(process_error)}"
            }

    def _parse_status_content(self, content: Any) -> Dict[str, Any]:
        """Parse content from status checking."""
        try:
            parsed_content = self.parser(content)
            return parsed_content
        except Exception as e:
            raise Exception(f"Failed to parse hooks status result: {str(e)}")