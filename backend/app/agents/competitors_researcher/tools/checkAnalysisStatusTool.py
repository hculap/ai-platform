"""
Tool for checking the status of background competitor research requests.
"""

import json
import logging
from typing import Dict, Any, Optional
from app.agents.shared.base_tool import BaseTool, ToolConfig, OpenAIConfig, OpenAIMode, ToolOutput
from app.services.openai_client import OpenAIClientFactory

logger = logging.getLogger(__name__)


class CheckAnalysisStatusTool(BaseTool):
    """Tool for checking the status of background competitor research."""

    def __init__(self, tool_config: ToolConfig, openai_config: OpenAIConfig):
        super().__init__(tool_config, openai_config)

    async def execute(self, input_data) -> ToolOutput:
        """
        Check the status of a background competitor research request.

        Args:
            input_data: ToolInput containing:
                - openai_response_id: The OpenAI response ID to check

        Returns:
            ToolOutput with status information and results if completed
        """
        try:
            openai_response_id = input_data.get_parameter('openai_response_id')
            logger.info(f"Checking competitor research status - OpenAI Response ID: {openai_response_id}")
            
            if not openai_response_id:
                logger.error("Missing openai_response_id parameter in status check request")
                return ToolOutput(
                    success=False,
                    error="openai_response_id is required",
                    data=None
                )

            # Check status with OpenAI directly
            logger.debug(f"Querying OpenAI client for response status: {openai_response_id}")
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
            logger.info(f"OpenAI response status: {status} for request ID: {openai_response_id}")

            if status == 'completed':
                # Extract content from the completed response
                content = getattr(openai_response, 'content', None)
                logger.debug(f"OpenAI response completed with content length: {len(str(content)) if content else 0}")

                if content:
                    # Parse the competitors from OpenAI response
                    try:
                        competitors = self._parse_competitors(content)
                        logger.info(f"Successfully parsed {len(competitors)} competitors from OpenAI response")
                        return ToolOutput(
                            success=True,
                            data={
                                'status': 'completed',
                                'competitors': competitors
                            }
                        )
                    except Exception as e:
                        # Return error status instead of failing
                        logger.error(f"Failed to parse competitor research result: {str(e)}")
                        return ToolOutput(
                            success=True,
                            data={
                                'status': 'error',
                                'message': f'Failed to parse competitor research result: {str(e)}'
                            }
                        )
                else:
                    # This can happen with invalid API keys or failed OpenAI requests
                    logger.warning(f"OpenAI analysis completed but no content generated for request ID: {openai_response_id}")
                    return ToolOutput(
                        success=True,
                        data={
                            'status': 'error',
                            'message': 'Competitor research completed but no content was generated. Please check OpenAI API key configuration.'
                        }
                    )
            elif status in ['failed', 'canceled']:
                error_msg = getattr(openai_response, 'error', None) or f"OpenAI analysis {status}"
                logger.error(f"OpenAI analysis failed with status '{status}': {error_msg}")
                return ToolOutput(
                    success=False,
                    error=error_msg,
                    data=None
                )
            elif status in ['pending', 'queued', 'in_progress']:  # Handle all possible processing statuses
                # Still processing - use OpenAI status directly
                logger.debug(f"OpenAI analysis still processing with status: {status}")
                return ToolOutput(
                    success=True,
                    data={
                        'status': status  # Return actual OpenAI status
                    }
                )
            else:
                # Unknown status - use OpenAI status directly
                logger.warning(f"Unknown OpenAI status received: {status} for request ID: {openai_response_id}")
                return ToolOutput(
                    success=True,
                    data={
                        'status': status,
                        'message': f'Unknown OpenAI status: {status}'
                    }
                )

        except Exception as e:
            # Always return a safe fallback response
            logger.error(f"Exception in status check for OpenAI response ID {openai_response_id}: {str(e)}")
            return ToolOutput(
                success=True,
                data={
                    'status': 'error',
                    'message': f'Status check failed: {str(e)}',
                    'openai_response_id': openai_response_id
                }
            )

    def _parse_competitors(self, content: str) -> list:
        """Parse competitors from OpenAI response content."""
        try:
            # Try to parse as JSON first
            if isinstance(content, str):
                try:
                    parsed = json.loads(content)
                    if isinstance(parsed, list):
                        return parsed
                    elif isinstance(parsed, dict) and 'competitors' in parsed:
                        return parsed['competitors']
                except json.JSONDecodeError:
                    pass

            # If JSON parsing fails, try to extract from text
            # Look for JSON array pattern in the text
            import re
            json_match = re.search(r'\[.*\]', content, re.DOTALL)
            if json_match:
                try:
                    competitors = json.loads(json_match.group())
                    if isinstance(competitors, list):
                        return competitors
                except json.JSONDecodeError:
                    pass

            # Fallback: return empty list if parsing fails
            logger.warning(f"Failed to parse competitors from content: {content[:200]}...")
            return []

        except Exception as e:
            logger.error(f"Error parsing competitors: {e}")
            return []




# Tool configuration
TOOL_CONFIG = ToolConfig(
    name="Check Analysis Status",
    slug="check_analysis_status",
    description="Check the status of a background competitor research request",
    version="1.0.0"
)

# This tool doesn't need OpenAI configuration since it only checks status
OPENAI_CONFIG = OpenAIConfig(
    mode=OpenAIMode.NONE
)
