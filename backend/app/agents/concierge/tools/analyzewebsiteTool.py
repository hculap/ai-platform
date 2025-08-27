"""
AnalyzeWebsiteTool - A tool for analyzing website URLs using OpenAI.
Creates business profiles from website analysis.
"""

import time
import re
import json
from datetime import datetime
from typing import Dict, Any, Optional, Union
from urllib.parse import urlparse

from ...shared.base_tool import BaseTool, ToolInput, ToolOutput
from ....utils.messages import (
    get_message, TOOL_URL_PARAMETER_REQUIRED, TOOL_INVALID_URL_FORMAT,
    TOOL_EXECUTION_FAILED, TOOL_ANALYSIS_FAILED
)


class AnalyzeWebsiteTool(BaseTool):
    """
    Tool for analyzing website URLs to create business profiles.
    Uses OpenAI to analyze website content and generate business insights.
    """

    def __init__(self):
        super().__init__(
            name='Analyze Website',
            slug='analyze-website',
            description='Analyze a website URL to create a business profile using OpenAI',
            version='1.0.0',
            prompt_id='pmpt_68aec68cbe2081909e109ce3b087d6ba07eff42b26c15bb8'
        )

    def validate_url(self, url: str) -> bool:
        """
        Validate URL format.
        
        Args:
            url: URL string to validate
            
        Returns:
            bool: True if URL is valid, False otherwise
        """
        try:
            result = urlparse(url)
            return all([result.scheme, result.netloc])
        except Exception:
            return False

    def extract_json_from_string(self, text: str) -> Optional[Dict[str, Any]]:
        """
        Extract JSON object from a string that might contain additional text.
        
        Args:
            text: String potentially containing JSON
            
        Returns:
            Dict or None: Parsed JSON if found, None otherwise
        """
        # First try direct JSON parsing
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            pass
        
        # Try to find JSON object within the string
        json_patterns = [
            r'\{[^{}]*\}',  # Simple JSON object
            r'\{(?:[^{}]|(?:\{[^{}]*\}))*\}',  # Nested JSON object
            r'```json\s*(.*?)\s*```',  # JSON in markdown code block
            r'```\s*(.*?)\s*```',  # JSON in generic code block
        ]
        
        for pattern in json_patterns:
            matches = re.findall(pattern, text, re.DOTALL)
            for match in matches:
                try:
                    # Clean up the match if needed
                    clean_match = match.strip()
                    if clean_match.startswith('{'):
                        return json.loads(clean_match)
                except json.JSONDecodeError:
                    continue
        
        return None

    def parse_business_profile(self, content: Union[str, Dict]) -> Dict[str, Any]:
        """
        Parse business profile from OpenAI response content.
        
        Args:
            content: Response content from OpenAI (string or dict)
            
        Returns:
            Dict: Parsed business profile data
        """
        # Handle None content
        if content is None:
            raise ValueError("OpenAI response content is None")
        
        # If content is already a properly structured dict with business_profile
        if isinstance(content, dict):
            if 'business_profile' in content:
                profile = content['business_profile']
                # If business_profile itself contains a JSON string, parse it
                if isinstance(profile, dict) and 'description' in profile:
                    desc = profile.get('description', '')
                    if isinstance(desc, str) and (desc.startswith('{') or '"name"' in desc):
                        parsed_desc = self.extract_json_from_string(desc)
                        if parsed_desc:
                            # Merge parsed description into profile
                            profile.update(parsed_desc)
                            # Remove the old description field if it was just JSON
                            if 'description' in profile and profile['description'] == desc:
                                del profile['description']
                return content
            # If it's a dict but without business_profile key, wrap it
            return {'business_profile': content}
        
        # If content is a string, try to parse it
        if isinstance(content, str):
            # Try to extract JSON from string
            parsed_json = self.extract_json_from_string(content)
            
            if parsed_json:
                # Check if it has business_profile structure
                if 'business_profile' in parsed_json:
                    profile = parsed_json['business_profile']
                    # Check if the business_profile itself contains embedded JSON
                    if isinstance(profile, dict) and 'description' in profile:
                        desc = profile.get('description', '')
                        if isinstance(desc, str) and (desc.startswith('{') or '"name"' in desc):
                            parsed_desc = self.extract_json_from_string(desc)
                            if parsed_desc:
                                profile.update(parsed_desc)
                                if 'description' in profile and profile['description'] == desc:
                                    del profile['description']
                    return parsed_json
                else:
                    # Assume the parsed JSON is the business profile itself
                    return {'business_profile': parsed_json}
            
            # If no JSON found, return as description
            return {
                'business_profile': {
                    'description': content
                }
            }
        
        # Fallback for other types
        return {
            'business_profile': {
                'description': str(content)
            }
        }

    def create_error_response(
        self,
        url: str,
        error_message: str,
        openai_result: Optional[Dict] = None,
        user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Create a standardized error response.

        Args:
            url: The website URL that was analyzed
            error_message: Error message to include
            openai_result: Optional OpenAI result for metadata
            user_id: Optional user ID for access tracking

        Returns:
            Dict: Formatted error response
        """
        return {
            'company_name': 'Unknown',
            'website_url': url,
            'error': error_message
        }

    def enrich_business_profile(
        self,
        profile: Dict[str, Any],
        url: str,
        openai_result: Dict[str, Any],
        user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Enrich business profile with additional metadata.

        Args:
            profile: Business profile data
            url: Website URL
            openai_result: OpenAI API result
            user_id: Optional user ID

        Returns:
            Dict: Enriched response data
        """
        # Ensure business_profile exists and is a dict
        if 'business_profile' not in profile:
            profile = {'business_profile': profile}

        business_profile = profile['business_profile']

        # Ensure it's a dict
        if not isinstance(business_profile, dict):
            business_profile = {'description': str(business_profile)}

        # Add website URL if not present
        if 'website_url' not in business_profile:
            business_profile['website_url'] = url

        # Map common fields if they exist with different names
        field_mappings = {
            'name': 'company_name',
            'company': 'company_name',
            'business_name': 'company_name',
            'offerings': 'offer',
            'services': 'offer',
            'products': 'offer'
        }

        for old_key, new_key in field_mappings.items():
            if old_key in business_profile and new_key not in business_profile:
                business_profile[new_key] = business_profile[old_key]
                del business_profile[old_key]

        return business_profile

    async def execute(self, input_data: ToolInput) -> ToolOutput:
        """
        Execute website analysis using OpenAI.
        
        Args:
            input_data: Tool input containing parameters and user info
            
        Returns:
            ToolOutput: Analysis results or error
        """
        start_time = time.time()

        try:
            # Validate input parameters
            parameters = input_data.parameters
            
            if 'url' not in parameters:
                return ToolOutput(
                    success=False,
                    error=get_message(TOOL_URL_PARAMETER_REQUIRED),
                    metadata=self.create_metadata(time.time() - start_time)
                )

            url = parameters['url']
            
            if not self.validate_url(url):
                return ToolOutput(
                    success=False,
                    error=get_message(TOOL_INVALID_URL_FORMAT),
                    metadata=self.create_metadata(time.time() - start_time)
                )

            # Prepare OpenAI request
            user_input = f"Please analyze the following website URL and create a comprehensive business profile: {url}"
            
            # Call OpenAI API
            openai_result = self.call_openai(user_input)
            
            if not openai_result.get('success'):
                return ToolOutput(
                    success=False,
                    error=f"OpenAI API error: {openai_result.get('error', 'Unknown error')}",
                    metadata=self.create_metadata(time.time() - start_time)
                )

            # Parse and process the OpenAI response
            try:
                content = openai_result.get('content')
                parsed_data = self.parse_business_profile(content)
                response_data = self.enrich_business_profile(
                    parsed_data, 
                    url, 
                    openai_result,
                    input_data.user_id
                )
                
            except Exception as parse_error:
                print(f"Error parsing OpenAI response: {parse_error}")
                print(f"Raw content: {openai_result.get('content')}")
                
                # Create error response with raw content
                response_data = self.create_error_response(
                    url,
                    f"Failed to parse analysis: {str(parse_error)}",
                    openai_result,
                    input_data.user_id
                )
                
                # Add raw content for debugging
                response_data['raw_content'] = str(openai_result.get('content'))

            return ToolOutput(
                success=True,
                data=response_data,
                metadata=self.create_metadata(time.time() - start_time)
            )

        except Exception as error:
            print(f'AnalyzeWebsiteTool execution error: {error}')
            return ToolOutput(
                success=False,
                error=get_message(TOOL_EXECUTION_FAILED),
                metadata=self.create_metadata(time.time() - start_time)
            )