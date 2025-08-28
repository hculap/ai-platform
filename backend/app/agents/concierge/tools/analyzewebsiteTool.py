"""
AnalyzeWebsiteTool - A tool for analyzing website URLs using OpenAI.
Creates business profiles from website analysis.
"""

import time
import json
from typing import Dict, Any, Optional, Union
from urllib.parse import urlparse

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


class BusinessProfileParser:
    """Simple parser for business profile data from OpenAI."""
    
    def parse(self, content: Union[str, Dict, None]) -> Dict[str, Any]:
        """
        Parse business profile from OpenAI response.
        
        Args:
            content: Response content from OpenAI
            
        Returns:
            Parsed business profile data
        """
        if content is None:
            raise ValueError("Content cannot be None")
        
        # If it's already a dict, use it directly
        if isinstance(content, dict):
            profile_data = content
        else:
            # Try to parse as JSON
            try:
                profile_data = json.loads(str(content))
            except json.JSONDecodeError:
                # If not JSON, treat as description
                profile_data = {'description': str(content)}
        
        # Apply field mappings
        from app.agents.shared.business_profile_utils import BusinessProfileFieldMappings
        BusinessProfileFieldMappings.normalize_fields(profile_data)
        
        # Ensure proper structure
        if 'business_profile' in profile_data:
            return profile_data
        else:
            return {'business_profile': profile_data}
    



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
        
        if not URLValidator.validate(url):
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
        """Process OpenAI analysis result into business profile."""
        try:
            # Parse the content
            parsed_data = self.profile_parser.parse(content)
            
            # Extract business profile
            if 'business_profile' in parsed_data:
                business_profile = parsed_data['business_profile']
            else:
                business_profile = parsed_data
            
            # Ensure it's a dict and add URL
            if not isinstance(business_profile, dict):
                business_profile = {'description': str(business_profile)}
            
            business_profile.setdefault('website_url', url)
            return business_profile
            
        except Exception as parse_error:
            return {
                'company_name': 'Unknown',
                'website_url': url,
                'error': f"Failed to parse analysis: {str(parse_error)}"
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