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
            
            # Log the response status for debugging
            try:
                logger.info(f"OpenAI response status: {openai_response.status}")
            except Exception as status_error:
                logger.error(f"Error accessing openai_response.status: {status_error}")
            
            logger.info(f"OpenAI response attributes: {dir(openai_response)}")
            logger.info(f"OpenAI response type: {type(openai_response)}")
            
            # Log all available attributes safely
            for attr in ['status', 'success', 'error', 'content', 'output_text', 'response_id']:
                try:
                    value = getattr(openai_response, attr, 'NOT_FOUND')
                    if value != 'NOT_FOUND':
                        # Safely convert to string and truncate
                        try:
                            value_str = str(value)[:100] if value is not None else 'None'
                        except Exception:
                            value_str = f'<{type(value).__name__}>'
                        logger.info(f"  {attr}: {value_str}")
                    else:
                        logger.info(f"  {attr}: NOT_FOUND")
                except Exception as attr_error:
                    logger.error(f"  {attr}: ERROR - {attr_error}")
            
            # Process response based on OpenAI status values
            status = getattr(openai_response, 'status', 'unknown')
            logger.info(f"Processing status: {status}")
            
            # Log response content structure for debugging
            try:
                if hasattr(openai_response, 'content'):
                    content_value = getattr(openai_response, 'content', None)
                    if content_value is not None:
                        try:
                            content_preview = str(content_value)[:200]
                            logger.info(f"Response content preview: {content_preview}")
                        except Exception as content_error:
                            logger.info(f"Response content: <{type(content_value).__name__}> (cannot stringify: {content_error})")
                    else:
                        logger.info("Response content: None")
            except Exception as e:
                logger.error(f"Error accessing content: {e}")
                
            try:
                if hasattr(openai_response, 'output_text'):
                    output_value = getattr(openai_response, 'output_text', None)
                    if output_value is not None:
                        try:
                            output_preview = str(output_value)[:200]
                            logger.info(f"Response output_text preview: {output_preview}")
                        except Exception as output_error:
                            logger.info(f"Response output_text: <{type(output_value).__name__}> (cannot stringify: {output_error})")
                    else:
                        logger.info("Response output_text: None")
            except Exception as e:
                logger.error(f"Error accessing output_text: {e}")
            
            if status == 'completed':
                # For completed responses, try multiple ways to get content
                content = None
                
                # Try different attribute paths for OpenAI Responses API
                if hasattr(openai_response, 'output'):
                    output = getattr(openai_response, 'output')
                    if isinstance(output, str):
                        content = output
                    elif output:
                        # Log the structure to debug
                        logger.info(f"Output type: {type(output)}")
                        logger.info(f"Output structure: {output if isinstance(output, str) else 'complex object'}")
                        
                        # Try to extract text content from structured output
                        if hasattr(output, '__iter__') and not isinstance(output, str):
                            try:
                                # Assuming output is a list-like structure
                                for item in output:
                                    if hasattr(item, 'text'):
                                        content = item.text
                                        break
                                    elif hasattr(item, 'content'):
                                        content = item.content
                                        break
                                    elif isinstance(item, str):
                                        content = item
                                        break
                            except Exception as e:
                                logger.error(f"Error iterating output: {e}")
                
                # Fallback attempts
                if not content and hasattr(openai_response, 'output_text'):
                    content = getattr(openai_response, 'output_text', None)
                if not content and hasattr(openai_response, 'content'):
                    content = getattr(openai_response, 'content', None)
                
                if content:
                    # Parse the business profile from OpenAI response
                    try:
                        logger.info(f"Attempting to parse business profile from content length: {len(str(content))}")
                        business_profile = self._parse_business_profile(content)
                        logger.info(f"Successfully parsed business profile: {list(business_profile.keys()) if business_profile else 'None'}")
                        return ToolOutput(
                            success=True,
                            data={
                                'status': 'completed',
                                'business_profile': business_profile
                            }
                        )
                    except Exception as e:
                        logger.error(f"Failed to parse business profile: {e}", exc_info=True)
                        logger.error(f"Content that failed to parse: {str(content)[:500]}")
                        return ToolOutput(
                            success=False,
                            error=f"Failed to parse analysis result: {str(e)}",
                            data=None
                        )
                else:
                    return ToolOutput(
                        success=False,
                        error="Analysis completed but no content found",
                        data=None
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
                logger.info(f"Analysis still {status}")
                return ToolOutput(
                    success=True,
                    data={
                        'status': status  # Return actual OpenAI status
                    }
                )
            else:
                # Unknown status - use OpenAI status directly
                logger.warning(f"Unknown OpenAI status: {status}")
                return ToolOutput(
                    success=True,
                    data={
                        'status': status,
                        'message': f'Unknown OpenAI status: {status}'
                    }
                )
            
        except Exception as e:
            logger.error(f"Error checking analysis status: {e}", exc_info=True)
            logger.error(f"OpenAI response ID: {openai_response_id}")
            logger.error(f"Error type: {type(e).__name__}")
            
            # Try to provide a fallback response instead of complete failure
            try:
                # At minimum, return the response ID so the frontend can retry
                return ToolOutput(
                    success=True,
                    data={
                        'status': 'error',
                        'message': f'Status check failed: {str(e)}',
                        'openai_response_id': openai_response_id
                    }
                )
            except Exception as fallback_error:
                logger.error(f"Even fallback response failed: {fallback_error}")
                return ToolOutput(
                    success=False,
                    error=f"Internal error: {str(e)}",
                    data=None
                )
    
    def _parse_business_profile(self, content: str) -> Dict[str, Any]:
        """Parse business profile from OpenAI response content."""
        from app.agents.concierge.tools.analyzewebsiteTool import BusinessProfileParser
        
        parser = BusinessProfileParser()
        return parser.parse_and_normalize(content)
    




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
