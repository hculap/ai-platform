"""
AnalyzeWebsiteTool - A tool for analyzing website URLs using OpenAI.
Creates business profiles from website analysis using factory patterns.
"""

from typing import Dict, Any, Optional, Union

from ...shared.tool_factory import PromptBasedTool
from ...shared.parsers import business_profile_parser
from ...shared.validators import ParametersValidator, create_url_validator


class AnalyzeWebsiteTool(PromptBasedTool):
    """
    Tool for analyzing website URLs to create business profiles.
    Uses OpenAI to analyze website content and generate business insights.
    """
    
    # Constants
    PROMPT_ID = 'pmpt_68aec68cbe2081909e109ce3b087d6ba07eff42b26c15bb8'
    VERSION = '1.0.0'
    
    def __init__(self):
        # Create validator for URL parameter
        validator = ParametersValidator().add_required_field('url', create_url_validator())
        
        # Initialize using factory pattern
        super().__init__(
            name='Analyze Website',
            slug='analyze-website',
            description='Analyze a website URL to create a business profile using OpenAI',
            prompt_id=self.PROMPT_ID,
            version=self.VERSION,
            parser=business_profile_parser,
            validator=validator
        )
    
    async def _prepare_openai_message(self, validated_params: Dict[str, Any], input_data) -> str:
        """Prepare the message to send to OpenAI."""
        url = validated_params['url']
        return f"Please analyze the following website URL and create a comprehensive business profile: {url}"
    
    async def _process_openai_result(
        self,
        content: Any,
        validated_params: Dict[str, Any],
        openai_result: Dict[str, Any],
        user_id: Optional[str]
    ) -> Dict[str, Any]:
        """Process OpenAI result into business profile format."""
        try:
            # Use shared parser to parse content
            parsed_data = self.parser.parse(content)
            
            # Extract business profile
            if 'business_profile' in parsed_data:
                business_profile = parsed_data['business_profile']
            else:
                business_profile = parsed_data
            
            # Ensure it's a dict and add URL
            if not isinstance(business_profile, dict):
                business_profile = {'description': str(business_profile)}
            
            business_profile.setdefault('website_url', validated_params['url'])
            return business_profile
            
        except Exception as parse_error:
            return {
                'company_name': 'Unknown',
                'website_url': validated_params['url'],
                'error': f"Failed to parse analysis: {str(parse_error)}"
            }
    
    async def _parse_status_content(self, content: Any) -> Dict[str, Any]:
        """Parse content from status checking."""
        try:
            parsed_content = self.parser.parse(content)
            return {
                'business_profile': parsed_content.get('business_profile', parsed_content)
            }
        except Exception as e:
            raise Exception(f"Failed to parse analysis result: {str(e)}")