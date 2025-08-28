"""
Tool for checking the status of background website analysis requests.
"""

import json
import logging
from typing import Dict, Any, Optional
from app.agents.shared.base_tool import BaseTool, ToolConfig, OpenAIConfig, OpenAIMode, ToolOutput
from app.services.openai_client import OpenAIClientFactory

logger = logging.getLogger(__name__)


class CheckAnalysisStatusTool(BaseTool):
    """Tool for checking the status of background website analysis."""
    
    def __init__(self, tool_config: ToolConfig, openai_config: OpenAIConfig):
        super().__init__(tool_config, openai_config)
    
    async def execute(self, input_data) -> ToolOutput:
        """
        Check the status of a background analysis request.
        
        Args:
            input_data: ToolInput containing:
                - openai_response_id: The OpenAI response ID to check
        
        Returns:
            ToolOutput with status information and results if completed
        """
        try:
            openai_response_id = input_data.get_parameter('openai_response_id')
            if not openai_response_id:
                return ToolOutput(
                    success=False,
                    error="openai_response_id is required",
                    data=None
                )
            
            # Check status with OpenAI directly
            openai_client = OpenAIClientFactory.get_client()
            openai_response = openai_client.get_response_status(openai_response_id)

            if not openai_response.success:
                logger.error(f"Failed to check OpenAI status: {openai_response.error}")
                return ToolOutput(
                    success=False,
                    error=f"Failed to check status: {openai_response.error}",
                    data=None
                )
            
            # Process response based on OpenAI status values
            status = getattr(openai_response, 'status', 'unknown')
            
            if status == 'completed':
                # Extract content from the completed response
                content = getattr(openai_response, 'content', None)
                
                if content:
                    # Parse the business profile from OpenAI response
                    try:
                        content = self._parse_business_profile(content)
                        return ToolOutput(
                            success=True,
                            data={
                                'status': 'completed',
                                'business_profile': content['business_profile']
                            }
                        )
                    except Exception as e:
                        # Return error status instead of failing
                        return ToolOutput(
                            success=True,
                            data={
                                'status': 'error',
                                'message': f'Failed to parse analysis result: {str(e)}'
                            }
                        )
                else:
                    # This can happen with invalid API keys or failed OpenAI requests
                    return ToolOutput(
                        success=True,
                        data={
                            'status': 'error',
                            'message': 'Analysis completed but no content was generated. Please check OpenAI API key configuration.'
                        }
                    )
            elif status in ['failed', 'canceled']:
                error_msg = getattr(openai_response, 'error', None) or f"OpenAI analysis {status}"
                return ToolOutput(
                    success=False,
                    error=error_msg,
                    data=None
                )
            elif status in ['pending', 'queued', 'in_progress']:  # Handle all possible processing statuses
                # Still processing - use OpenAI status directly
                return ToolOutput(
                    success=True,
                    data={
                        'status': status  # Return actual OpenAI status
                    }
                )
            else:
                # Unknown status - use OpenAI status directly
                return ToolOutput(
                    success=True,
                    data={
                        'status': status,
                        'message': f'Unknown OpenAI status: {status}'
                    }
                )
            
        except Exception as e:
            # Always return a safe fallback response
            return ToolOutput(
                success=True,
                data={
                    'status': 'error',
                    'message': f'Status check failed: {str(e)}',
                    'openai_response_id': openai_response_id
                }
            )
    
    def _parse_business_profile(self, content: str) -> Dict[str, Any]:
        """Parse business profile from OpenAI response content."""
        from app.agents.concierge.tools.analyzewebsiteTool import BusinessProfileParser
        
        parser = BusinessProfileParser()
        return parser.parse(content)
    




# Tool configuration
TOOL_CONFIG = ToolConfig(
    name="Check Analysis Status",
    slug="check_analysis_status",
    description="Check the status of a background website analysis request",
    version="1.0.0"
)

# This tool doesn't need OpenAI configuration since it only checks status
OPENAI_CONFIG = OpenAIConfig(
    mode=OpenAIMode.NONE
)
