"""
EnrichCompetitorTool - A tool for enriching competitor data using OpenAI.
Takes a company name or URL and returns enriched competitor information.
"""

from typing import Dict, Any, Optional
import re

from ...shared.tool_factory import PromptBasedTool
from ...shared.parsers import competitors_parser
from ...shared.validators import BaseValidator, ValidationResult, ParametersValidator
from ....models.business_profile import BusinessProfile
import logging

# Create logger for this module
logger = logging.getLogger('app.agents.competitors_researcher.enrichCompetitor')


class CompetitorInputValidator(BaseValidator):
    """Custom validator that accepts either a company name OR URL (not both required, but at least one)."""
    
    def __init__(self):
        self.field_name = "competitor_input"
    
    def validate(self, parameters: Dict[str, Any], context: Optional[Dict[str, Any]] = None) -> ValidationResult:
        """Validate that either name or url is provided."""
        result = ValidationResult(is_valid=True)
        
        if not isinstance(parameters, dict):
            result.add_error("Parameters must be a dictionary")
            return result
        
        name = parameters.get('name')
        url = parameters.get('url')
        business_profile_id = parameters.get('business_profile_id')
        
        # Check that at least one is provided
        if not name and not url:
            result.add_error("Either 'name' or 'url' parameter is required")
            return result
        
        # Validate name if provided
        if name is not None:
            if not isinstance(name, str):
                result.add_error("'name' must be a string")
            elif not name.strip():
                result.add_error("'name' cannot be empty")
            else:
                result.set_validated_value('name', name.strip())
        
        # Validate URL if provided
        if url is not None:
            if not isinstance(url, str):
                result.add_error("'url' must be a string")
            elif not url.strip():
                result.add_error("'url' cannot be empty")
            else:
                url = url.strip()
                # Basic URL validation
                url_pattern = r'^https?://.+\..+'
                if not re.match(url_pattern, url, re.IGNORECASE):
                    result.add_error("'url' must be a valid HTTP/HTTPS URL")
                else:
                    result.set_validated_value('url', url)
        
        # Validate business_profile_id if provided (optional for language context)
        if business_profile_id is not None:
            if not isinstance(business_profile_id, str):
                result.add_error("'business_profile_id' must be a string")
            elif not business_profile_id.strip():
                result.add_error("'business_profile_id' cannot be empty")
            else:
                # Validate UUID format
                uuid_pattern = r'^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
                if not re.match(uuid_pattern, business_profile_id.strip()):
                    result.add_error("'business_profile_id' must be a valid UUID")
                else:
                    result.set_validated_value('business_profile_id', business_profile_id.strip())
        
        return result


class EnrichCompetitorTool(PromptBasedTool):
    """
    Tool for enriching competitor data using AI analysis.
    Takes a company name or URL and returns enriched competitor information.
    """

    # Constants
    PROMPT_ID = 'pmpt_68b231ddbf6081958ef0ea802e04375e07b8425ce317b6bc'
    VERSION = '1.0.0'

    def __init__(self):
        # Create validator for competitor input (name or URL)
        validator = ParametersValidator()
        # Use our custom validator by calling it directly in validate method
        
        # Initialize using factory pattern
        super().__init__(
            name='Enrich Competitor',
            slug='enrich-competitor',
            description='Enrich competitor data from company name or URL using AI analysis',
            prompt_id=self.PROMPT_ID,
            version=self.VERSION,
            parser=competitors_parser,
            validator=validator  # We'll override _validate_input for custom logic
        )
        
        # Store custom validator for use in _validate_input
        self._custom_validator = CompetitorInputValidator()

    def _validate_input(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Override to use custom validation logic."""
        logger.info(f"Validating input parameters: {parameters}")
        
        # The parameters come from input_data.parameters which contains the user's input
        validation_result = self._custom_validator.validate(parameters)
        
        logger.info(f"Validation result: valid={validation_result.is_valid}, errors={validation_result.errors}, validated_data={validation_result.validated_data}")
        
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

    async def _prepare_openai_message(self, validated_params: Dict[str, Any], input_data) -> str:
        """Prepare the input message for OpenAI."""
        logger.info(f"Preparing enrichment message with params: {validated_params}")
        logger.info(f"Input data: {input_data}")
        logger.info(f"Input data parameters: {input_data.parameters}")

        # Get either name or url from validated params
        name = validated_params.get('name')
        url = validated_params.get('url')
        business_profile_id = validated_params.get('business_profile_id')
        
        # If not in validated_params, check input_data.parameters directly
        if not name and not url:
            name = input_data.parameters.get('name')
            url = input_data.parameters.get('url')
            logger.info(f"Fallback to input_data.parameters - name: {name}, url: {url}")
        
        if not business_profile_id:
            business_profile_id = input_data.parameters.get('business_profile_id')
        
        # Store the input for later use in response
        self._current_input = {'name': name, 'url': url}
        
        # Try to get language from business profile if ID is provided
        language_instruction = ""
        if business_profile_id:
            try:
                business_profile = BusinessProfile.query.filter_by(
                    id=business_profile_id,
                    user_id=input_data.user_id
                ).first()
                
                if business_profile and business_profile.communication_language:
                    language = business_profile.communication_language
                    if language.lower() == 'pl':
                        language_instruction = "\n\nIMPORTANT: Please respond in Polish language."
                    elif language.lower() == 'en':
                        language_instruction = "\n\nIMPORTANT: Please respond in English language."
                    else:
                        language_instruction = f"\n\nIMPORTANT: Please respond in {language} language."
                    logger.info(f"Added language instruction for {language}")
            except Exception as e:
                logger.warning(f"Could not fetch business profile language: {str(e)}")
        
        if name:
            input_text = f"Company name: {name}{language_instruction}"
            logger.info(f"Enriching competitor by name: {name}")
        elif url:
            input_text = f"Company URL: {url}{language_instruction}"
            logger.info(f"Enriching competitor by URL: {url}")
        else:
            # This shouldn't happen due to validation, but just in case
            logger.error(f"No name or URL found! validated_params: {validated_params}, input_data.parameters: {input_data.parameters}")
            raise ValueError("No name or URL provided for competitor enrichment")
        
        return input_text
    
    async def _process_openai_result(
        self,
        content: Any,
        validated_params: Dict[str, Any],
        openai_result: Dict[str, Any],
        user_id: Optional[str]
    ) -> Dict[str, Any]:
        """Process OpenAI result into competitor data."""
        try:
            # Parse the content using shared parser
            parsed_data = self.parser.parse(content)
            
            # Extract competitors (should be a single competitor in array)
            if 'competitors' in parsed_data:
                competitors = parsed_data['competitors']
            else:
                competitors = parsed_data if isinstance(parsed_data, list) else []
            
            # Ensure it's a list
            if not isinstance(competitors, list):
                competitors = []
            
            # The enrichment should return exactly one competitor
            if len(competitors) > 1:
                logger.warning(f"Expected 1 competitor, got {len(competitors)}. Using first one.")
                competitors = competitors[:1]
            
            # Get input values from current execution context
            current_input = getattr(self, '_current_input', {'name': None, 'url': None})
            
            return {
                'competitors': competitors,
                'enriched_count': len(competitors),
                'input': current_input
            }
            
        except Exception as parse_error:
            logger.error(f"Failed to parse enrichment result: {str(parse_error)}")
            # Get input values from current execution context  
            current_input = getattr(self, '_current_input', {'name': None, 'url': None})
            
            return {
                'competitors': [],
                'enriched_count': 0,
                'error': f"Failed to parse enrichment result: {str(parse_error)}",
                'input': current_input
            }

    async def _parse_status_content(self, content: Any) -> Dict[str, Any]:
        """Parse content from status checking."""
        try:
            parsed_content = self.parser.parse(content)
            
            # Handle different response formats
            competitors = []
            if parsed_content.get('competitors'):
                competitors = parsed_content['competitors']
            elif isinstance(parsed_content, list):
                competitors = parsed_content
            
            return {'competitors': competitors}
        except Exception as e:
            raise Exception(f"Failed to parse enrichment status result: {str(e)}")