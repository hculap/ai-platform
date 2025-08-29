"""
FindCompetitorsTool - A tool for finding competitors using OpenAI.
Uses OpenAI to analyze business profile and find competitors.
"""

import time
import json
import logging
from typing import Dict, Any, Optional, Union

from ...shared.base_tool import (
    BaseTool,
    ToolInput,
    ToolOutput,
    ToolConfig,
    OpenAIConfig,
    OpenAIMode
)
from ....utils.messages import (
    get_message, TOOL_EXECUTION_FAILED
)
from ....models.business_profile import BusinessProfile
from ....models.competition import Competition

# Create logger for this module
logger = logging.getLogger('app.agents.competitors_researcher.findCompetitors')


class CompetitorsParser:
    """Simple parser for competitors data from OpenAI."""
    
    def parse(self, content: Union[str, Dict, None]) -> Dict[str, Any]:
        """
        Parse competitors from OpenAI response.
        
        Args:
            content: Response content from OpenAI
            
        Returns:
            Parsed competitors data
        """
        if content is None:
            raise ValueError("Content cannot be None")
        
        # If it's already a dict, use it directly
        if isinstance(content, dict):
            competitors_data = content
        else:
            # Try to parse as JSON
            try:
                competitors_data = json.loads(str(content))
            except json.JSONDecodeError:
                # If not JSON, return empty list
                competitors_data = []
        
        # Ensure it's a list
        if not isinstance(competitors_data, list):
            return {'competitors': []}
        else:
            return {'competitors': competitors_data}


class FindCompetitorsTool(BaseTool):
    """
    Tool for finding competitors using AI analysis.
    Uses pre-registered OpenAI prompt to analyze business profile and find competitors.
    """

    # Constants
    PROMPT_ID = 'pmpt_68aecb2e0708819096cbf4dfc96863f20e5fe4e80a8d9a31'
    VERSION = '1.0.0'

    def __init__(self):
        # Create tool configuration
        tool_config = ToolConfig(
            name='Find Competitors',
            slug='find-competitors',
            description='Find competitors for a business using AI analysis',
            version=self.VERSION
        )

        # Create OpenAI configuration using pre-registered prompt
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
        self.competitors_parser = CompetitorsParser()

    async def execute(self, input_data: ToolInput, background: bool = False) -> ToolOutput:
        """
        Execute competitor research using OpenAI.

        Args:
            input_data: Tool input containing parameters and user info
            background: Whether to run in background mode (returns request_id instead of waiting)

        Returns:
            ToolOutput: Research results or error
        """
        start_time = time.time()
        
        logger.info(f"Starting competitor research - Background: {background}, User: {input_data.user_id}")
        logger.debug(f"Input parameters: {input_data.parameters}")

        try:
            # Validate input
            validation_result = self._validate_input(input_data.parameters)
            if not validation_result['valid']:
                return self._create_error_output(
                    validation_result['error'],
                    start_time
                )

            business_profile_id = validation_result['business_profile_id']
            logger.info(f"Validated input - Business Profile ID: {business_profile_id}")

            # Fetch business profile data from database
            business_profile = BusinessProfile.query.filter_by(
                id=business_profile_id,
                user_id=input_data.user_id
            ).first()

            if not business_profile:
                logger.error(f"Business profile not found - ID: {business_profile_id}, User: {input_data.user_id}")
                return self._create_error_output(
                    f"Business profile not found: {business_profile_id}",
                    start_time
                )
                
            logger.info(f"Found business profile: {business_profile.name} for user {input_data.user_id}")

            # Fetch existing competitors for this business profile
            existing_competitors = Competition.query.filter_by(
                business_profile_id=business_profile_id
            ).all()

            existing_competitors_data = [comp.to_dict() for comp in existing_competitors]
            logger.info(f"Found {len(existing_competitors_data)} existing competitors for business profile {business_profile_id}")

            # Call OpenAI API with real data
            logger.info(f"Calling OpenAI API - Background mode: {background}")
            openai_result = await self._find_competitors(
                business_profile.to_dict(),
                existing_competitors_data,
                background=background
            )

            if not openai_result.get('success'):
                logger.error(f"OpenAI API error: {openai_result.get('error', 'Unknown error')}")
                return self._create_error_output(
                    f"OpenAI API error: {openai_result.get('error', 'Unknown error')}",
                    start_time
                )

            # Handle background mode
            if background:
                response_id = openai_result.get('response_id')
                logger.info(f"Background mode - OpenAI response ID: {response_id}")
                # Return OpenAI response_id directly - frontend will poll with this
                return ToolOutput(
                    success=True,
                    data={
                        'openai_response_id': response_id,
                        'status': 'pending',
                        'business_profile_id': business_profile_id,
                        'message': 'Competitor research started in background. Use openai_response_id to check status.'
                    },
                    metadata=self.create_metadata(time.time() - start_time)
                )

            # Process and return results for synchronous mode
            response_data = self._process_research_result(
                openai_result.get('content'),
                business_profile_id,
                existing_competitors_data,
                openai_result,
                input_data.user_id
            )

            return ToolOutput(
                success=True,
                data=response_data,
                metadata=self.create_metadata(time.time() - start_time)
            )

        except Exception as error:
            print(f'FindCompetitorsTool execution error: {error}')
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
            Validation result with 'valid' flag and either data or 'error'
        """
        if 'business_profile_id' not in parameters:
            return {
                'valid': False,
                'error': 'Business profile ID is required'
            }
        
        return {
            'valid': True,
            'business_profile_id': parameters['business_profile_id']
        }

    async def _find_competitors(self, business_profile_data: Dict[str, Any], existing_competitors: list, background: bool = False) -> Dict[str, Any]:
        """
        Find competitors using OpenAI.
        
        Args:
            business_profile_data: Complete business profile data from database
            existing_competitors: List of existing competitors from database
            background: Whether to run in background mode
            
        Returns:
            OpenAI API response
        """
        # Create comprehensive user message with business profile and existing competitors
        user_message = self._create_user_message(business_profile_data, existing_competitors)
        
        # Call OpenAI with the complete context
        return await self.call_openai(user_message, background=background)

    def _create_user_message(self, business_profile_data: Dict[str, Any], existing_competitors: list) -> str:
        """
        Create a comprehensive user message for the OpenAI prompt.
        
        Args:
            business_profile_data: Complete business profile data
            existing_competitors: List of existing competitors
            
        Returns:
            Formatted user message string
        """
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
        
        # Existing Competitors
        message_parts.append("\n=== EXISTING COMPETITORS ===")
        if existing_competitors:
            for i, competitor in enumerate(existing_competitors, 1):
                message_parts.append(f"{i}. {competitor.get('name', 'N/A')}")
                if competitor.get('url'):
                    message_parts.append(f"   URL: {competitor['url']}")
                if competitor.get('description'):
                    message_parts.append(f"   Description: {competitor['description']}")
                if competitor.get('usp'):
                    message_parts.append(f"   USP: {competitor['usp']}")
                message_parts.append("")  # Empty line between competitors
        else:
            message_parts.append("No existing competitors found.")
        
        # Final instruction
        message_parts.append("\n=== INSTRUCTION ===")
        message_parts.append("Please find 8-12 new competitors for this business based on the profile above.")
        message_parts.append("Avoid duplicating any existing competitors listed above.")
        
        return "\n".join(message_parts)

    def _process_research_result(
        self,
        content: Any,
        business_profile_id: str,
        existing_competitors: list,
        openai_result: Dict[str, Any],
        user_id: Optional[str]
    ) -> Dict[str, Any]:
        """Process OpenAI research result into competitors list."""
        try:
            # Parse the content
            parsed_data = self.competitors_parser.parse(content)
            
            # Extract competitors
            if 'competitors' in parsed_data:
                competitors = parsed_data['competitors']
            else:
                competitors = parsed_data if isinstance(parsed_data, list) else []
            
            # Ensure it's a list and add metadata
            if not isinstance(competitors, list):
                competitors = []
            
            return {
                'competitors': competitors,
                'business_profile_id': business_profile_id,
                'existing_competitors_count': len(existing_competitors),
                'new_competitors_count': len(competitors)
            }
            
        except Exception as parse_error:
            return {
                'competitors': [],
                'business_profile_id': business_profile_id,
                'error': f"Failed to parse research result: {str(parse_error)}"
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
