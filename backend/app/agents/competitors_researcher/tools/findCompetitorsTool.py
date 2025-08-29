"""
FindCompetitorsTool - A tool for finding competitors using OpenAI.
Uses OpenAI to analyze business profile and find competitors using factory patterns.
"""

from typing import Dict, Any, Optional

from ...shared.tool_factory import PromptBasedTool
from ...shared.parsers import competitors_parser
from ...shared.validators import ParametersValidator, create_business_profile_validator
from ....models.business_profile import BusinessProfile
from ....models.competition import Competition
import logging

# Create logger for this module
logger = logging.getLogger('app.agents.competitors_researcher.findCompetitors')


class FindCompetitorsTool(PromptBasedTool):
    """
    Tool for finding competitors using AI analysis.
    Uses pre-registered OpenAI prompt to analyze business profile and find competitors.
    """

    # Constants
    PROMPT_ID = 'pmpt_68aecb2e0708819096cbf4dfc96863f20e5fe4e80a8d9a31'
    VERSION = '1.0.0'

    def __init__(self):
        # Create validator for business profile ID
        validator = ParametersValidator().add_required_field(
            'business_profile_id', 
            create_business_profile_validator()
        )
        
        # Initialize using factory pattern
        super().__init__(
            name='Find Competitors',
            slug='find-competitors',
            description='Find competitors for a business using AI analysis',
            prompt_id=self.PROMPT_ID,
            version=self.VERSION,
            parser=competitors_parser,
            validator=validator
        )

    async def _prepare_openai_message(self, validated_params: Dict[str, Any], input_data) -> str:
        """Prepare the comprehensive user message for OpenAI."""
        business_profile_id = validated_params['business_profile_id']
        logger.info(f"Preparing message for business profile ID: {business_profile_id}")

        # Fetch business profile data from database
        business_profile = BusinessProfile.query.filter_by(
            id=business_profile_id,
            user_id=input_data.user_id
        ).first()

        if not business_profile:
            raise ValueError(f"Business profile not found: {business_profile_id}")
            
        logger.info(f"Found business profile: {business_profile.name} for user {input_data.user_id}")

        # Fetch existing competitors for this business profile
        existing_competitors = Competition.query.filter_by(
            business_profile_id=business_profile_id
        ).all()

        existing_competitors_data = [comp.to_dict() for comp in existing_competitors]
        logger.info(f"Found {len(existing_competitors_data)} existing competitors")

        # Create comprehensive user message
        return self._create_user_message(business_profile.to_dict(), existing_competitors_data)
    
    def _create_user_message(self, business_profile_data: Dict[str, Any], existing_competitors: list) -> str:
        """Create a comprehensive user message for the OpenAI prompt."""
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

    async def _process_openai_result(
        self,
        content: Any,
        validated_params: Dict[str, Any],
        openai_result: Dict[str, Any],
        user_id: Optional[str]
    ) -> Dict[str, Any]:
        """Process OpenAI research result into competitors list."""
        try:
            # Parse the content using shared parser
            parsed_data = self.parser.parse(content)
            
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
                'business_profile_id': validated_params['business_profile_id'],
                'new_competitors_count': len(competitors)
            }
            
        except Exception as parse_error:
            return {
                'competitors': [],
                'business_profile_id': validated_params['business_profile_id'],
                'error': f"Failed to parse research result: {str(parse_error)}"
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
            raise Exception(f"Failed to parse research result: {str(e)}")