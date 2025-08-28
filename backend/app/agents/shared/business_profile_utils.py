"""
Shared utilities for business profile processing across different agents and tools.
"""
from typing import Dict, Any


class BusinessProfileFieldMappings:
    """Centralized field mappings for business profile normalization."""
    
    # Standard field mappings for business profile normalization
    FIELD_MAPPINGS = {
        # Name variations
        'name': 'company_name',
        'company': 'company_name',
        'business_name': 'company_name',
        'company_name': 'company_name',  # Direct mapping
        
        # Offer variations
        'offerings': 'offer',
        'services': 'offer',
        'products': 'offer',
        'offer': 'offer',  # Direct mapping
        
        # Target customer variations
        'avatar': 'target_customer',
        'customer_avatar': 'target_customer',
        'persona': 'target_customer',
        'target_persona': 'target_customer',
        'target_customer': 'target_customer',  # Direct mapping
        
        # Problems variations
        'problems': 'problems',
        'problem_solved': 'problems',
        'pain_points': 'problems',
        
        # Desires variations
        'desires': 'desires',
        'customer_desires': 'desires',
        'wants': 'desires',
        'needs': 'desires',
        
        # Tone variations
        'tone': 'tone',
        'brand_tone': 'tone',
        'voice': 'tone',
        
        # Language variations
        'language': 'language',
        'communication_language': 'language',
        'lang': 'language',
        
        # URL variations
        'website_url': 'website_url',
        'url': 'website_url',
        'website': 'website_url'
    }
    
    @classmethod
    def normalize_fields(cls, profile: Dict[str, Any]) -> Dict[str, Any]:
        """
        Apply field mappings to normalize field names.
        
        Args:
            profile: Dictionary with business profile data
            
        Returns:
            Dictionary with normalized field names
        """
        if not isinstance(profile, dict):
            return profile
            
        # Apply field mappings
        for old_key, new_key in cls.FIELD_MAPPINGS.items():
            if old_key in profile and new_key not in profile:
                profile[new_key] = profile.pop(old_key)
        
        return profile
    
    @classmethod
    def get_expected_fields(cls) -> set:
        """
        Get the set of expected field names after normalization.
        
        Returns:
            Set of normalized field names
        """
        return set(cls.FIELD_MAPPINGS.values())
