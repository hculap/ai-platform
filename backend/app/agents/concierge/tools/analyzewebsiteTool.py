"""
AnalyzeWebsiteTool - A tool for analyzing website URLs using OpenAI.
Creates business profiles from website analysis.
"""

import time
import re
import json
from datetime import datetime
from typing import Dict, Any, Optional, Union, List
from urllib.parse import urlparse
from dataclasses import dataclass
from enum import Enum

from ...shared.base_tool import (
    BaseTool, 
    ToolInput, 
    ToolOutput,
    ToolConfig,
    OpenAIConfig,
    OpenAIMode
)
from ....utils.messages import (
    get_message, TOOL_URL_PARAMETER_REQUIRED, TOOL_INVALID_URL_FORMAT,
    TOOL_EXECUTION_FAILED, TOOL_ANALYSIS_FAILED
)
# Removed AnalysisRequest - using browser state instead


class JSONExtractor:
    """Handles JSON extraction from various string formats."""
    
    # Compile regex patterns once for better performance
    JSON_PATTERNS = [
        re.compile(r'\{[^{}]*\}'),  # Simple JSON object
        re.compile(r'\{(?:[^{}]|(?:\{[^{}]*\}))*\}'),  # Nested JSON object
        re.compile(r'```json\s*(.*?)\s*```', re.DOTALL),  # JSON in markdown code block
        re.compile(r'```\s*(.*?)\s*```', re.DOTALL),  # JSON in generic code block
    ]
    
    @classmethod
    def extract(cls, text: str) -> Optional[Dict[str, Any]]:
        """
        Extract JSON object from a string that might contain additional text.
        
        Args:
            text: String potentially containing JSON
            
        Returns:
            Parsed JSON if found, None otherwise
        """
        if not text:
            return None
            
        # Try direct JSON parsing first
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            pass
        
        # Try pattern matching
        for pattern in cls.JSON_PATTERNS:
            matches = pattern.findall(text)
            for match in matches:
                try:
                    clean_match = match.strip()
                    if clean_match.startswith('{'):
                        return json.loads(clean_match)
                except json.JSONDecodeError:
                    continue
        
        return None


class BusinessProfileParser:
    """Handles parsing and normalization of business profiles."""
    
    # Field mapping for standardization
    FIELD_MAPPINGS = {
        'name': 'company_name',
        'company': 'company_name',
        'business_name': 'company_name',
        'offerings': 'offer',
        'services': 'offer',
        'products': 'offer',
        'avatar': 'target_customer',
        'customer_avatar': 'target_customer',
        'persona': 'target_customer',
        'target_persona': 'target_customer',
        'target_customer': 'target_customer'  # Direct mapping for AI responses
    }
    
    def __init__(self, json_extractor: Optional[JSONExtractor] = None):
        self.json_extractor = json_extractor or JSONExtractor()
    
    def parse(self, content: Union[str, Dict, None]) -> Dict[str, Any]:
        """
        Parse business profile from various content formats.
        
        Args:
            content: Response content (string, dict, or None)
            
        Returns:
            Parsed and structured business profile data
        """
        if content is None:
            raise ValueError("Content cannot be None")
        
        # Handle dict content
        if isinstance(content, dict):
            return self._parse_dict(content)
        
        # Handle string content
        if isinstance(content, str):
            return self._parse_string(content)
        
        # Fallback for other types
        return self._create_profile_wrapper(str(content))
    
    def _parse_dict(self, content: Dict) -> Dict[str, Any]:
        """Parse dictionary content into business profile format."""
        if 'business_profile' in content:
            profile = content['business_profile']
            self._extract_embedded_json(profile)
            return content
        return {'business_profile': content}
    
    def _parse_string(self, content: str) -> Dict[str, Any]:
        """Parse string content into business profile format."""
        parsed_json = self.json_extractor.extract(content)
        
        if parsed_json:
            if 'business_profile' in parsed_json:
                profile = parsed_json['business_profile']
                self._extract_embedded_json(profile)
                return parsed_json
            return {'business_profile': parsed_json}
        
        return self._create_profile_wrapper(content)
    
    def _extract_embedded_json(self, profile: Dict) -> None:
        """Extract and merge embedded JSON from description field."""
        if not isinstance(profile, dict):
            return
            
        desc = profile.get('description', '')
        if isinstance(desc, str) and (desc.startswith('{') or '"name"' in desc):
            parsed_desc = self.json_extractor.extract(desc)
            if parsed_desc:
                profile.update(parsed_desc)
                # Remove original description if it was just JSON
                if profile.get('description') == desc:
                    del profile['description']
    
    def _create_profile_wrapper(self, description: str) -> Dict[str, Any]:
        """Create a standard profile wrapper with description."""
        return {
            'business_profile': {
                'description': description
            }
        }
    
    def normalize_fields(self, profile: Dict[str, Any]) -> Dict[str, Any]:
        """
        Normalize field names in the business profile.
        
        Args:
            profile: Business profile to normalize
            
        Returns:
            Normalized profile
        """
        if not isinstance(profile, dict):
            return profile
            
        # Apply field mappings
        for old_key, new_key in self.FIELD_MAPPINGS.items():
            if old_key in profile and new_key not in profile:
                profile[new_key] = profile.pop(old_key)
        
        return profile


class URLValidator:
    """Handles URL validation logic."""
    
    @staticmethod
    def validate(url: str) -> bool:
        """
        Validate URL format.
        
        Args:
            url: URL string to validate
            
        Returns:
            True if URL is valid, False otherwise
        """
        if not url or not isinstance(url, str):
            return False
            
        try:
            result = urlparse(url)
            return bool(result.scheme and result.netloc)
        except Exception:
            return False


class AnalyzeWebsiteTool(BaseTool):
    """
    Tool for analyzing website URLs to create business profiles.
    Uses OpenAI to analyze website content and generate business insights.
    """
    
    # Constants
    PROMPT_ID = 'pmpt_68aec68cbe2081909e109ce3b087d6ba07eff42b26c15bb8'
    VERSION = '1.0.0'
    
    def __init__(self):
        # Create tool configuration
        tool_config = ToolConfig(
            name='Analyze Website',
            slug='analyze-website',
            description='Analyze a website URL to create a business profile using OpenAI',
            version=self.VERSION
        )
        
        # Create OpenAI configuration
        openai_config = OpenAIConfig(
            mode=OpenAIMode.PROMPT_ID,
            prompt_id=self.PROMPT_ID
        )
        
        # Initialize parent class
        super().__init__(
            config=tool_config,
            openai_config=openai_config
        )
        
        # Initialize helper classes
        self.url_validator = URLValidator()
        self.profile_parser = BusinessProfileParser()
    
    async def execute(self, input_data: ToolInput, background: bool = False) -> ToolOutput:
        """
        Execute website analysis using OpenAI.
        
        Args:
            input_data: Tool input containing parameters and user info
            background: Whether to run in background mode (returns request_id instead of waiting)
            
        Returns:
            ToolOutput: Analysis results or error
        """
        start_time = time.time()
        
        try:
            # Validate input
            validation_result = self._validate_input(input_data.parameters)
            if not validation_result['valid']:
                return self._create_error_output(
                    validation_result['error'],
                    start_time
                )
            
            url = validation_result['url']
            
            # Call OpenAI API (now properly awaited)
            openai_result = await self._analyze_website(url, background=background)
            
            if not openai_result.get('success'):
                return self._create_error_output(
                    f"OpenAI API error: {openai_result.get('error', 'Unknown error')}",
                    start_time
                )
            
            # Handle background mode
            if background:
                # Return OpenAI response_id directly - frontend will poll with this
                return ToolOutput(
                    success=True,
                    data={
                        'openai_response_id': openai_result.get('response_id'),
                        'status': 'pending',
                        'website_url': url,
                        'message': 'Analysis started in background. Use openai_response_id to check status.'
                    },
                    metadata=self.create_metadata(time.time() - start_time)
                )
            
            # Process and return results for synchronous mode
            response_data = self._process_analysis_result(
                openai_result.get('content'),
                url,
                openai_result,
                input_data.user_id
            )
            
            return ToolOutput(
                success=True,
                data=response_data,
                metadata=self.create_metadata(time.time() - start_time)
            )
            
        except Exception as error:
            print(f'AnalyzeWebsiteTool execution error: {error}')
            return self._create_error_output(
                get_message(TOOL_EXECUTION_FAILED),
                start_time
            )
    
    def _validate_input(self, parameters: Dict) -> Dict[str, Any]:
        """
        Validate input parameters.
        
        Args:
            parameters: Input parameters dictionary
            
        Returns:
            Validation result with 'valid' flag and either 'url' or 'error'
        """
        if 'url' not in parameters:
            return {
                'valid': False,
                'error': get_message(TOOL_URL_PARAMETER_REQUIRED)
            }
        
        url = parameters['url']
        
        if not self.url_validator.validate(url):
            return {
                'valid': False,
                'error': get_message(TOOL_INVALID_URL_FORMAT)
            }
        
        return {
            'valid': True,
            'url': url
        }
    
    async def _analyze_website(self, url: str, background: bool = False) -> Dict[str, Any]:
        """
        Analyze website using OpenAI.
        
        Args:
            url: Website URL to analyze
            background: Whether to run in background mode
            
        Returns:
            OpenAI API response
        """
        user_input = f"Please analyze the following website URL and create a comprehensive business profile: {url}"
        # Now properly awaiting the async method with background parameter
        return await self.call_openai(user_input, background=background)
    
    def _process_analysis_result(
        self,
        content: Any,
        url: str,
        openai_result: Dict[str, Any],
        user_id: Optional[str]
    ) -> Dict[str, Any]:
        """
        Process OpenAI analysis result into structured business profile.
        
        Args:
            content: Raw content from OpenAI
            url: Website URL
            openai_result: Full OpenAI result
            user_id: Optional user ID
            
        Returns:
            Processed business profile data
        """
        try:
            parsed_data = self.profile_parser.parse(content)
            return self._enrich_business_profile(
                parsed_data,
                url,
                openai_result,
                user_id
            )
        except Exception as parse_error:
            print(f"Error parsing OpenAI response: {parse_error}")
            print(f"Raw content: {content}")
            
            # Return error response with raw content for debugging
            error_response = self._create_error_response(
                url,
                f"Failed to parse analysis: {str(parse_error)}",
                openai_result,
                user_id
            )
            error_response['raw_content'] = str(content)
            return error_response
    
    def _enrich_business_profile(
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
            Enriched response data
        """
        # Ensure business_profile structure
        if 'business_profile' not in profile:
            profile = {'business_profile': profile}
        
        business_profile = profile['business_profile']
        
        # Ensure it's a dict
        if not isinstance(business_profile, dict):
            business_profile = {'description': str(business_profile)}
        
        # Add website URL
        business_profile.setdefault('website_url', url)
        
        # Normalize field names
        business_profile = self.profile_parser.normalize_fields(business_profile)
        
        return business_profile
    
    def _create_error_response(
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
            Formatted error response
        """
        return {
            'company_name': 'Unknown',
            'website_url': url,
            'error': error_message
        }
    
    def _create_error_output(self, error_message: str, start_time: float) -> ToolOutput:
        """
        Create an error ToolOutput.
        
        Args:
            error_message: Error message
            start_time: Processing start time
            
        Returns:
            ToolOutput with error
        """
        return ToolOutput(
            success=False,
            error=error_message,
            metadata=self.create_metadata(time.time() - start_time)
        )