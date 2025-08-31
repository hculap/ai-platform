"""
Offer Service
Provides business logic for offer management and AI generation
"""

import json
import logging
from typing import List, Dict, Any, Optional
from ..models.offer import Offer
from ..models.business_profile import BusinessProfile
from ..models.competition import Competition
from .. import db

logger = logging.getLogger(__name__)

class OfferService:
    """Service class for offer-related business operations"""
    
    @staticmethod
    def get_offers_for_business_profile(business_profile_id: str, user_id: str) -> List[Offer]:
        """
        Get all offers for a business profile, ensuring user ownership
        
        Args:
            business_profile_id: ID of the business profile
            user_id: ID of the authenticated user
            
        Returns:
            List of Offer objects
            
        Raises:
            ValueError: If business profile not found or access denied
        """
        # Verify ownership
        business_profile = BusinessProfile.query.filter_by(
            id=business_profile_id, user_id=user_id
        ).first()
        
        if not business_profile:
            raise ValueError("Business profile not found or access denied")
        
        return Offer.query.filter_by(business_profile_id=business_profile_id).all()
    
    @staticmethod
    def create_offer(business_profile_id: str, user_id: str, offer_data: Dict[str, Any]) -> Offer:
        """
        Create a new offer with validation
        
        Args:
            business_profile_id: ID of the business profile
            user_id: ID of the authenticated user  
            offer_data: Dictionary containing offer data
            
        Returns:
            Created Offer object
            
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
        required_fields = ['type', 'name', 'unit', 'price']
        missing_fields = [field for field in required_fields if field not in offer_data or not offer_data[field]]
        
        if missing_fields:
            raise ValueError(f"Missing required fields: {', '.join(missing_fields)}")
        
        # Validate offer type
        if not Offer.validate_type(offer_data['type']):
            raise ValueError("Invalid offer type. Must be 'product' or 'service'")
        
        # Validate unit
        if not Offer.validate_unit(offer_data['unit']):
            raise ValueError("Invalid unit format")
        
        # Validate price
        try:
            price = float(offer_data['price'])
            if price < 0:
                raise ValueError("Price cannot be negative")
        except (ValueError, TypeError):
            raise ValueError("Invalid price format")
        
        # Validate status if provided
        status = offer_data.get('status', 'draft')
        if not Offer.validate_status(status):
            raise ValueError("Invalid status. Must be 'draft', 'published', or 'archived'")
        
        # Create offer
        offer = Offer(
            business_profile_id=business_profile_id,
            type=offer_data['type'],
            name=offer_data['name'],
            description=offer_data.get('description'),
            unit=offer_data['unit'],
            price=price,
            status=status
        )
        
        try:
            db.session.add(offer)
            db.session.commit()
            logger.info(f"Created offer {offer.id} for business profile {business_profile_id}")
            return offer
        except Exception as e:
            db.session.rollback()
            logger.error(f"Failed to create offer: {e}")
            raise ValueError("Failed to create offer")
    
    @staticmethod
    def update_offer(offer_id: str, user_id: str, update_data: Dict[str, Any]) -> Offer:
        """
        Update an existing offer with validation
        
        Args:
            offer_id: ID of the offer to update
            user_id: ID of the authenticated user
            update_data: Dictionary containing fields to update
            
        Returns:
            Updated Offer object
            
        Raises:
            ValueError: If validation fails or offer not found
        """
        # Get offer with ownership check
        offer = Offer.query.join(BusinessProfile).filter(
            Offer.id == offer_id,
            BusinessProfile.user_id == user_id
        ).first()
        
        if not offer:
            raise ValueError("Offer not found")
        
        # Validate fields if provided
        if 'type' in update_data and not Offer.validate_type(update_data['type']):
            raise ValueError("Invalid offer type. Must be 'product' or 'service'")
        
        if 'unit' in update_data and not Offer.validate_unit(update_data['unit']):
            raise ValueError("Invalid unit format")
        
        if 'price' in update_data:
            try:
                price = float(update_data['price'])
                if price < 0:
                    raise ValueError("Price cannot be negative")
            except (ValueError, TypeError):
                raise ValueError("Invalid price format")
        
        if 'status' in update_data and not Offer.validate_status(update_data['status']):
            raise ValueError("Invalid status. Must be 'draft', 'published', or 'archived'")
        
        try:
            offer.update_from_dict(update_data)
            db.session.commit()
            logger.info(f"Updated offer {offer_id}")
            return offer
        except Exception as e:
            db.session.rollback()
            logger.error(f"Failed to update offer {offer_id}: {e}")
            raise ValueError("Failed to update offer")
    
    @staticmethod
    def delete_offer(offer_id: str, user_id: str) -> bool:
        """
        Delete an offer
        
        Args:
            offer_id: ID of the offer to delete
            user_id: ID of the authenticated user
            
        Returns:
            True if deleted successfully
            
        Raises:
            ValueError: If offer not found
        """
        # Get offer with ownership check
        offer = Offer.query.join(BusinessProfile).filter(
            Offer.id == offer_id,
            BusinessProfile.user_id == user_id
        ).first()
        
        if not offer:
            raise ValueError("Offer not found")
        
        try:
            db.session.delete(offer)
            db.session.commit()
            logger.info(f"Deleted offer {offer_id}")
            return True
        except Exception as e:
            db.session.rollback()
            logger.error(f"Failed to delete offer {offer_id}: {e}")
            raise ValueError("Failed to delete offer")


class OfferGenerationService:
    """Service class for AI-powered offer generation"""
    
    @staticmethod
    def prepare_generation_data(business_profile_id: str, user_id: str) -> Dict[str, Any]:
        """
        Prepare data for AI offer generation
        
        Args:
            business_profile_id: ID of the business profile
            user_id: ID of the authenticated user
            
        Returns:
            Dictionary containing business profile and competitors data
            
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
        
        return {
            'business_profile': business_profile.to_dict(),
            'competitors': [comp.to_dict() for comp in competitors]
        }
    
    @staticmethod
    def parse_ai_response(ai_response: str) -> List[Dict[str, Any]]:
        """
        Parse AI response into offer data
        
        Args:
            ai_response: JSON string response from AI
            
        Returns:
            List of offer dictionaries
            
        Raises:
            ValueError: If response is invalid or cannot be parsed
        """
        try:
            # Try to parse as JSON
            offers_data = json.loads(ai_response)
            
            # Ensure it's a list
            if not isinstance(offers_data, list):
                raise ValueError("AI response must be a JSON array")
            
            # Validate each offer has required fields
            required_fields = ['type', 'name', 'unit', 'price']
            for i, offer in enumerate(offers_data):
                if not isinstance(offer, dict):
                    raise ValueError(f"Offer {i+1} must be an object")
                
                missing_fields = [field for field in required_fields if field not in offer]
                if missing_fields:
                    raise ValueError(f"Offer {i+1} missing fields: {', '.join(missing_fields)}")
                
                # Validate types
                if not isinstance(offer['type'], str) or offer['type'] not in ['product', 'service']:
                    raise ValueError(f"Offer {i+1} has invalid type")
                
                if not isinstance(offer['name'], str) or not offer['name'].strip():
                    raise ValueError(f"Offer {i+1} has invalid name")
                
                if not isinstance(offer['unit'], str) or not offer['unit'].strip():
                    raise ValueError(f"Offer {i+1} has invalid unit")
                
                try:
                    price = float(offer['price'])
                    if price < 0:
                        raise ValueError(f"Offer {i+1} has negative price")
                except (ValueError, TypeError):
                    raise ValueError(f"Offer {i+1} has invalid price")
            
            logger.info(f"Successfully parsed {len(offers_data)} offers from AI response")
            return offers_data
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse AI response as JSON: {e}")
            raise ValueError("Invalid JSON response from AI")
        except Exception as e:
            logger.error(f"Error parsing AI response: {e}")
            raise ValueError(f"Failed to parse AI response: {str(e)}")
    
    @staticmethod
    def save_generated_offers(business_profile_id: str, user_id: str, offers_data: List[Dict[str, Any]]) -> List[Offer]:
        """
        Save AI-generated offers to database
        
        Args:
            business_profile_id: ID of the business profile
            user_id: ID of the authenticated user
            offers_data: List of offer dictionaries from AI
            
        Returns:
            List of created Offer objects
            
        Raises:
            ValueError: If business profile not found or saving fails
        """
        # Verify ownership
        business_profile = BusinessProfile.query.filter_by(
            id=business_profile_id, user_id=user_id
        ).first()
        
        if not business_profile:
            raise ValueError("Business profile not found or access denied")
        
        created_offers = []
        
        try:
            for offer_data in offers_data:
                offer = Offer(
                    business_profile_id=business_profile_id,
                    type=offer_data['type'],
                    name=offer_data['name'],
                    description=offer_data.get('description', ''),
                    unit=offer_data['unit'],
                    price=float(offer_data['price']),
                    status='draft'  # All AI-generated offers start as draft
                )
                
                db.session.add(offer)
                created_offers.append(offer)
            
            db.session.commit()
            logger.info(f"Saved {len(created_offers)} AI-generated offers for business profile {business_profile_id}")
            return created_offers
            
        except Exception as e:
            db.session.rollback()
            logger.error(f"Failed to save generated offers: {e}")
            raise ValueError("Failed to save generated offers")