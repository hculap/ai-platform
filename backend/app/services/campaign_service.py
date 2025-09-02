"""
Campaign Service
Provides business logic for campaign management and AI generation
"""

import json
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, date
from ..models.campaign import Campaign
from ..models.business_profile import BusinessProfile
from ..models.competition import Competition
from ..models.offer import Offer
from .. import db

logger = logging.getLogger(__name__)

class CampaignService:
    """Service class for campaign-related business operations"""
    
    @staticmethod
    def get_campaigns_for_business_profile(business_profile_id: str, user_id: str) -> List[Campaign]:
        """
        Get all campaigns for a business profile, ensuring user ownership
        
        Args:
            business_profile_id: ID of the business profile
            user_id: ID of the authenticated user
            
        Returns:
            List of Campaign objects
            
        Raises:
            ValueError: If business profile not found or access denied
        """
        # Verify ownership
        business_profile = BusinessProfile.query.filter_by(
            id=business_profile_id, user_id=user_id
        ).first()
        
        if not business_profile:
            raise ValueError("Business profile not found or access denied")
        
        return Campaign.query.filter_by(
            business_profile_id=business_profile_id, user_id=user_id
        ).order_by(Campaign.created_at.desc()).all()
    
    @staticmethod
    def create_campaign(business_profile_id: str, user_id: str, campaign_data: Dict[str, Any]) -> Campaign:
        """
        Create a new campaign with validation
        
        Args:
            business_profile_id: ID of the business profile
            user_id: ID of the authenticated user  
            campaign_data: Dictionary containing campaign data
            
        Returns:
            Created Campaign object
            
        Raises:
            ValueError: If validation fails or business profile not found
        """
        # Verify ownership
        business_profile = BusinessProfile.query.filter_by(
            id=business_profile_id, user_id=user_id
        ).first()
        
        if not business_profile:
            raise ValueError("Business profile not found or access denied")
        
        # Validate required fields
        if 'goal' not in campaign_data or not campaign_data['goal']:
            raise ValueError("Campaign goal is required")
        
        # Validate campaign goal
        if not Campaign.validate_goal(campaign_data['goal']):
            raise ValueError(f"Invalid campaign goal. Must be one of: {', '.join(Campaign.GOAL_OPTIONS)}")
        
        # Validate budget if provided
        if 'budget' in campaign_data and campaign_data['budget'] is not None:
            try:
                budget = float(campaign_data['budget'])
                if budget <= 0:
                    raise ValueError("Budget must be positive")
            except (ValueError, TypeError):
                raise ValueError("Invalid budget format")
        
        # Validate deadline if provided
        deadline = None
        if 'deadline' in campaign_data and campaign_data['deadline'] is not None:
            try:
                if isinstance(campaign_data['deadline'], str):
                    deadline = datetime.strptime(campaign_data['deadline'], '%Y-%m-%d').date()
                else:
                    deadline = campaign_data['deadline']
                    
                if deadline <= date.today():
                    raise ValueError("Deadline must be in the future")
            except ValueError:
                raise ValueError("Deadline must be in YYYY-MM-DD format")
        
        # Validate selected products if provided
        selected_products = campaign_data.get('selected_products', [])
        if selected_products and not isinstance(selected_products, list):
            raise ValueError("Selected products must be an array")
        
        # Validate status if provided
        status = campaign_data.get('status', 'draft')
        if not Campaign.validate_status(status):
            raise ValueError("Invalid status. Must be 'draft', 'published', or 'archived'")
        
        # Create campaign
        campaign = Campaign(
            business_profile_id=business_profile_id,
            user_id=user_id,
            goal=campaign_data['goal'],
            budget=campaign_data.get('budget'),
            deadline=deadline,
            selected_products=selected_products,
            status=status
        )
        
        try:
            db.session.add(campaign)
            db.session.commit()
            logger.info(f"Created campaign {campaign.id} for business profile {business_profile_id}")
            return campaign
        except Exception as e:
            db.session.rollback()
            logger.error(f"Failed to create campaign: {e}")
            raise ValueError("Failed to create campaign")
    
    @staticmethod
    def update_campaign(campaign_id: str, user_id: str, update_data: Dict[str, Any]) -> Campaign:
        """
        Update an existing campaign with validation
        
        Args:
            campaign_id: ID of the campaign to update
            user_id: ID of the authenticated user
            update_data: Dictionary containing fields to update
            
        Returns:
            Updated Campaign object
            
        Raises:
            ValueError: If validation fails or campaign not found
        """
        # Get campaign with ownership check
        campaign = Campaign.query.filter_by(id=campaign_id, user_id=user_id).first()
        
        if not campaign:
            raise ValueError("Campaign not found")
        
        # Validate fields if provided
        if 'goal' in update_data and not Campaign.validate_goal(update_data['goal']):
            raise ValueError(f"Invalid campaign goal. Must be one of: {', '.join(Campaign.GOAL_OPTIONS)}")
        
        if 'budget' in update_data and update_data['budget'] is not None:
            try:
                budget = float(update_data['budget'])
                if budget <= 0:
                    raise ValueError("Budget must be positive")
            except (ValueError, TypeError):
                raise ValueError("Invalid budget format")
        
        if 'deadline' in update_data and update_data['deadline'] is not None:
            try:
                if isinstance(update_data['deadline'], str):
                    deadline = datetime.strptime(update_data['deadline'], '%Y-%m-%d').date()
                else:
                    deadline = update_data['deadline']
                    
                if deadline <= date.today():
                    raise ValueError("Deadline must be in the future")
            except ValueError:
                raise ValueError("Deadline must be in YYYY-MM-DD format")
        
        if 'status' in update_data and not Campaign.validate_status(update_data['status']):
            raise ValueError("Invalid status. Must be 'draft', 'published', or 'archived'")
        
        if 'channels' in update_data and not Campaign.validate_channels(update_data['channels']):
            raise ValueError("Invalid channels format")
        
        try:
            campaign.update_from_dict(update_data)
            db.session.commit()
            logger.info(f"Updated campaign {campaign_id}")
            return campaign
        except Exception as e:
            db.session.rollback()
            logger.error(f"Failed to update campaign {campaign_id}: {e}")
            raise ValueError("Failed to update campaign")
    
    @staticmethod
    def delete_campaign(campaign_id: str, user_id: str) -> bool:
        """
        Delete a campaign
        
        Args:
            campaign_id: ID of the campaign to delete
            user_id: ID of the authenticated user
            
        Returns:
            True if deleted successfully
            
        Raises:
            ValueError: If campaign not found
        """
        # Get campaign with ownership check
        campaign = Campaign.query.filter_by(id=campaign_id, user_id=user_id).first()
        
        if not campaign:
            raise ValueError("Campaign not found")
        
        try:
            db.session.delete(campaign)
            db.session.commit()
            logger.info(f"Deleted campaign {campaign_id}")
            return True
        except Exception as e:
            db.session.rollback()
            logger.error(f"Failed to delete campaign {campaign_id}: {e}")
            raise ValueError("Failed to delete campaign")
    
    @staticmethod
    def get_campaign_by_id(campaign_id: str, user_id: str) -> Optional[Campaign]:
        """
        Get a specific campaign by ID
        
        Args:
            campaign_id: ID of the campaign
            user_id: ID of the authenticated user
            
        Returns:
            Campaign object or None if not found
        """
        return Campaign.query.filter_by(id=campaign_id, user_id=user_id).first()


class CampaignGenerationService:
    """Service class for AI-powered campaign generation"""
    
    @staticmethod
    def prepare_generation_data(
        business_profile_id: str, 
        user_id: str, 
        campaign_params: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Prepare data for AI campaign generation
        
        Args:
            business_profile_id: ID of the business profile
            user_id: ID of the authenticated user
            campaign_params: Campaign parameters (goal, budget, deadline, selected_products)
            
        Returns:
            Dictionary containing business profile, competitors, selected products, and campaign params
            
        Raises:
            ValueError: If business profile not found
        """
        # Get business profile with ownership check
        business_profile = BusinessProfile.query.filter_by(
            id=business_profile_id, user_id=user_id
        ).first()
        
        if not business_profile:
            raise ValueError("Business profile not found or access denied")
        
        # Get competitors for this business profile
        competitors = Competition.query.filter_by(
            business_profile_id=business_profile_id
        ).all()
        
        # Get selected products if specified
        selected_products = []
        if campaign_params.get('selected_products'):
            product_ids = campaign_params['selected_products']
            selected_products = Offer.query.filter(
                Offer.id.in_(product_ids),
                Offer.business_profile_id == business_profile_id
            ).all()
        
        extracted_params = {
            'goal': campaign_params.get('campaign_goal'),
            'budget': campaign_params.get('budget'),
            'deadline': campaign_params.get('deadline')
        }
        
        return {
            'business_profile': business_profile.to_dict(),
            'competitors': [comp.to_dict() for comp in competitors],
            'selected_products': [product.to_dict() for product in selected_products],
            'campaign_params': extracted_params
        }
    
    @staticmethod
    def parse_ai_response(ai_response: str) -> Dict[str, Any]:
        """
        Parse AI response into campaign strategy data
        
        Args:
            ai_response: JSON string response from AI
            
        Returns:
            Dictionary of campaign strategy data
            
        Raises:
            ValueError: If response is invalid or cannot be parsed
        """
        try:
            # Clean the response - remove markdown code blocks if present
            cleaned_response = ai_response.strip()
            
            # Remove markdown code blocks (```json...``` or ```...```)
            if cleaned_response.startswith('```'):
                # Find the first newline after ```
                start_idx = cleaned_response.find('\n')
                if start_idx != -1:
                    # Find the closing ```
                    end_idx = cleaned_response.rfind('```')
                    if end_idx != -1 and end_idx > start_idx:
                        cleaned_response = cleaned_response[start_idx+1:end_idx].strip()
            
            logger.debug(f"Cleaned AI response: {cleaned_response[:200]}...")
            
            # Try to parse as JSON
            campaign_data = json.loads(cleaned_response)
            
            # Ensure it's a dictionary with expected fields
            if not isinstance(campaign_data, dict):
                raise ValueError("AI response must be a JSON object")
            
            # Validate required fields exist
            required_fields = ['strategy_summary', 'timeline', 'target_audience', 'sales_funnel_steps']
            for field in required_fields:
                if field not in campaign_data:
                    logger.warning(f"Missing field {field} in AI response")
            
            # Validate channels format if present
            if 'channels' in campaign_data:
                if not isinstance(campaign_data['channels'], dict):
                    raise ValueError("Channels must be an object")
            
            if 'channels_rationale' in campaign_data:
                if not isinstance(campaign_data['channels_rationale'], dict):
                    raise ValueError("Channels rationale must be an object")
            
            logger.info(f"Successfully parsed campaign strategy from AI response")
            return campaign_data
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse AI response as JSON: {e}")
            logger.error(f"Response content: {ai_response[:500]}...")
            raise ValueError("Invalid JSON response from AI")
        except Exception as e:
            logger.error(f"Error parsing AI response: {e}")
            raise ValueError(f"Failed to parse AI response: {str(e)}")
    
    @staticmethod
    def save_generated_campaign(
        business_profile_id: str, 
        user_id: str, 
        campaign_params: Dict[str, Any],
        campaign_data: Dict[str, Any]
    ) -> Campaign:
        """
        Save AI-generated campaign to database
        
        Args:
            business_profile_id: ID of the business profile
            user_id: ID of the authenticated user
            campaign_params: Original campaign parameters
            campaign_data: AI-generated campaign data
            
        Returns:
            Created Campaign object
            
        Raises:
            ValueError: If business profile not found or saving fails
        """
        # Verify ownership
        business_profile = BusinessProfile.query.filter_by(
            id=business_profile_id, user_id=user_id
        ).first()
        
        if not business_profile:
            raise ValueError("Business profile not found or access denied")
        
        try:
            # Validate and prepare campaign parameters
            goal = campaign_params.get('campaign_goal')
            if not goal:
                raise ValueError("Campaign goal is required")
            
            # Validate goal is in allowed options (import Campaign class constants)
            from ..models.campaign import Campaign
            if goal not in Campaign.GOAL_OPTIONS:
                raise ValueError(f"Invalid campaign goal: {goal}")
            
            # Handle budget conversion
            budget = campaign_params.get('budget')
            if budget is not None:
                try:
                    budget = float(budget)
                    if budget <= 0:
                        raise ValueError("Budget must be positive")
                except (ValueError, TypeError):
                    raise ValueError("Invalid budget format")
            
            # Handle deadline conversion from string to date
            deadline = campaign_params.get('deadline')
            if deadline is not None:
                try:
                    if isinstance(deadline, str):
                        deadline = datetime.strptime(deadline, '%Y-%m-%d').date()
                    elif not hasattr(deadline, 'year'):  # Not a date-like object
                        raise ValueError("Invalid deadline format")
                except ValueError:
                    raise ValueError("Deadline must be in YYYY-MM-DD format")
            
            # Handle selected products
            selected_products = campaign_params.get('selected_products', [])
            if not isinstance(selected_products, list):
                raise ValueError("Selected products must be a list")
            
            # Create campaign with validated data
            campaign = Campaign(
                business_profile_id=business_profile_id,
                user_id=user_id,
                goal=goal,
                budget=budget,
                deadline=deadline,
                selected_products=selected_products,
                status='draft'  # All AI-generated campaigns start as draft
            )
            
            # Set generated fields
            campaign.strategy_summary = campaign_data.get('strategy_summary')
            campaign.timeline = campaign_data.get('timeline')
            campaign.target_audience = campaign_data.get('target_audience')
            campaign.sales_funnel_steps = campaign_data.get('sales_funnel_steps')
            campaign.channels = campaign_data.get('channels', {})
            campaign.channels_rationale = campaign_data.get('channels_rationale', {})
            campaign.recommended_budget = campaign_data.get('recommended_budget')
            campaign.risks_recommendations = campaign_data.get('risks_recommendations')
            
            db.session.add(campaign)
            db.session.commit()
            
            logger.info(f"Saved AI-generated campaign {campaign.id} for business profile {business_profile_id}")
            return campaign
            
        except Exception as e:
            db.session.rollback()
            logger.error(f"Failed to save generated campaign: {e}", exc_info=True)
            logger.error(f"Campaign params: {campaign_params}")
            logger.error(f"Campaign data keys: {list(campaign_data.keys()) if campaign_data else 'None'}")
            raise ValueError(f"Failed to save generated campaign: {str(e)}")