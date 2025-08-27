"""
AnalyzeWebsiteTool - A tool for analyzing website URLs using OpenAI.
Creates business profiles from website analysis.
"""

import time
import re
import json
from datetime import datetime
from typing import Dict, Any, Optional
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
        """Validate URL format"""
        try:
            result = urlparse(url)
            return all([result.scheme, result.netloc])
        except:
            return False

    async def execute(self, input_data: ToolInput) -> ToolOutput:
        """Execute website analysis using OpenAI"""
        start_time = time.time()

        try:
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

            # Prepare user input for OpenAI
            user_input = f"Please analyze the following website URL and create a comprehensive business profile: {url}"

            # Call OpenAI using the prompt_id
            openai_result = self.call_openai(user_input)

            if not openai_result['success']:
                return ToolOutput(
                    success=False,
                    error=f"OpenAI API error: {openai_result['error']}",
                    metadata=self.create_metadata(time.time() - start_time)
                )

            # Parse the OpenAI response - it should be JSON with business_profile
            try:
                # Handle both string and dict responses
                content = openai_result.get('content')
                if content is None:
                    raise ValueError("OpenAI response content is None")

                if isinstance(content, str):
                    # Parse JSON string
                    business_data = json.loads(content)
                else:
                    # Already a dict
                    business_data = content

                # Extract business profile if it exists
                if isinstance(business_data, dict) and 'business_profile' in business_data:
                    business_profile = business_data['business_profile']

                    # Ensure business_profile is a dict and add URL
                    if isinstance(business_profile, dict):
                        business_profile['website_url'] = url

                        # Add metadata
                        response_data = {
                            'business_profile': business_profile,
                            'is_public_access': input_data.user_id is None,
                            'openai_model': openai_result.get('model'),
                            'openai_usage': openai_result.get('usage'),
                            'response_id': openai_result.get('response_id'),
                            'analysis_timestamp': datetime.now().isoformat()
                        }
                    else:
                        # business_profile is not a dict
                        response_data = {
                            'business_profile': {
                                'company_name': 'Unknown',
                                'website_url': url,
                                'description': str(business_profile),
                                'confidence_score': 0.5
                            },
                            'is_public_access': input_data.user_id is None,
                            'openai_model': openai_result.get('model'),
                            'openai_usage': openai_result.get('usage'),
                            'response_id': openai_result.get('response_id'),
                            'analysis_timestamp': datetime.now().isoformat()
                        }
                else:
                    # Fallback for non-structured responses
                    response_data = {
                        'business_profile': {
                            'company_name': 'Unknown',
                            'website_url': url,
                            'description': str(content),
                            'confidence_score': 0.5
                        },
                        'is_public_access': input_data.user_id is None,
                        'openai_model': openai_result.get('model'),
                        'openai_usage': openai_result.get('usage'),
                        'response_id': openai_result.get('response_id'),
                        'analysis_timestamp': datetime.now().isoformat()
                    }

            except json.JSONDecodeError as e:
                # If JSON parsing fails, return the raw content
                response_data = {
                    'business_profile': {
                        'company_name': 'Unknown',
                        'website_url': url,
                        'description': str(openai_result['content']),
                        'confidence_score': 0.3
                    },
                    'is_public_access': input_data.user_id is None,
                    'openai_model': openai_result.get('model'),
                    'openai_usage': openai_result.get('usage'),
                    'response_id': openai_result.get('response_id'),
                    'analysis_timestamp': datetime.now().isoformat(),
                    'parsing_error': str(e)
                }
            except Exception as e:
                # General error handling
                response_data = {
                    'business_profile': {
                        'company_name': 'Unknown',
                        'website_url': url,
                        'description': f"Analysis failed: {str(e)}",
                        'confidence_score': 0.0
                    },
                    'is_public_access': input_data.user_id is None,
                    'openai_model': openai_result.get('model'),
                    'openai_usage': openai_result.get('usage'),
                    'response_id': openai_result.get('response_id'),
                    'analysis_timestamp': datetime.now().isoformat(),
                    'error': str(e)
                }

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


