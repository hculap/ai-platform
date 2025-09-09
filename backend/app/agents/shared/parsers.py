"""
Shared content parsers for processing OpenAI responses across different agents and tools.
Provides standardized parsing logic to reduce code duplication.
"""

import json
import logging
from abc import ABC, abstractmethod
from typing import Dict, Any, Union, Optional, List
from .business_profile_utils import BusinessProfileFieldMappings

logger = logging.getLogger(__name__)


class BaseContentParser(ABC):
    """Abstract base class for all content parsers."""
    
    @abstractmethod
    def parse(self, content: Union[str, Dict, None]) -> Dict[str, Any]:
        """
        Parse content from OpenAI response.
        
        Args:
            content: Response content from OpenAI
            
        Returns:
            Parsed data structure
        """
        pass
    
    def _safe_json_parse(self, content: str) -> Optional[Dict[str, Any]]:
        """Safely parse JSON content with error handling."""
        try:
            return json.loads(content)
        except json.JSONDecodeError as e:
            logger.warning(f"JSON parsing failed: {e}")
            return None
    
    def _validate_content(self, content: Union[str, Dict, None]) -> None:
        """Validate that content is not None or empty."""
        if content is None:
            raise ValueError("Content cannot be None")
        if isinstance(content, str) and not content.strip():
            raise ValueError("Content cannot be empty string")


class OpenAIContentParser(BaseContentParser):
    """Generic parser for OpenAI responses with common patterns."""
    
    def __init__(self, expected_structure: Optional[str] = None):
        """
        Initialize parser with optional expected structure.
        
        Args:
            expected_structure: Expected top-level key (e.g., 'business_profile', 'competitors')
        """
        self.expected_structure = expected_structure
    
    def parse(self, content: Union[str, Dict, None]) -> Dict[str, Any]:
        """Parse OpenAI content with generic handling."""
        self._validate_content(content)
        
        # If it's already a dict, use it directly
        if isinstance(content, dict):
            parsed_data = content
        else:
            # Try to parse as JSON
            parsed_data = self._safe_json_parse(str(content))
            if parsed_data is None:
                # If not JSON, create simple structure
                parsed_data = {'content': str(content)}
        
        # If parsed data is a list, wrap it in a dictionary
        if isinstance(parsed_data, list):
            parsed_data = {'data': parsed_data}
        
        # Apply expected structure if specified
        if self.expected_structure and self.expected_structure not in parsed_data:
            parsed_data = {self.expected_structure: parsed_data}
        
        return parsed_data


class BusinessProfileParser(BaseContentParser):
    """Specialized parser for business profile data from OpenAI."""
    
    def parse(self, content: Union[str, Dict, None]) -> Dict[str, Any]:
        """
        Parse business profile from OpenAI response.
        
        Args:
            content: Response content from OpenAI
            
        Returns:
            Parsed business profile data with normalized fields
        """
        self._validate_content(content)
        
        # If it's already a dict, use it directly
        if isinstance(content, dict):
            profile_data = content
        else:
            # Try to parse as JSON
            profile_data = self._safe_json_parse(str(content))
            if profile_data is None:
                # If not JSON, treat as description
                profile_data = {'description': str(content)}
        
        # Apply field mappings for normalization
        BusinessProfileFieldMappings.normalize_fields(profile_data)
        
        # Ensure proper structure
        if 'business_profile' in profile_data:
            return profile_data
        else:
            return {'business_profile': profile_data}


class CompetitorsParser(BaseContentParser):
    """Specialized parser for competitors data from OpenAI."""
    
    def parse(self, content: Union[str, Dict, None]) -> Dict[str, Any]:
        """
        Parse competitors from OpenAI response.
        
        Args:
            content: Response content from OpenAI
            
        Returns:
            Parsed competitors data as standardized structure
        """
        self._validate_content(content)
        
        # If it's already a dict, use it directly
        if isinstance(content, dict):
            competitors_data = content
        else:
            # Try to parse as JSON
            competitors_data = self._safe_json_parse(str(content))
            if competitors_data is None:
                # If not JSON, return empty list
                competitors_data = []
        
        # Handle different response formats
        if isinstance(competitors_data, list):
            return {'competitors': competitors_data}
        elif isinstance(competitors_data, dict):
            if 'competitors' in competitors_data:
                return competitors_data
            else:
                # Single competitor or unexpected format
                return {'competitors': [competitors_data] if competitors_data else []}
        else:
            return {'competitors': []}


class ListContentParser(BaseContentParser):
    """Generic parser for list-based content from OpenAI."""
    
    def __init__(self, list_key: str = 'items'):
        """
        Initialize parser for list content.
        
        Args:
            list_key: Key name for the list in the returned structure
        """
        self.list_key = list_key
    
    def parse(self, content: Union[str, Dict, None]) -> Dict[str, Any]:
        """Parse content expected to be a list or contain a list."""
        self._validate_content(content)
        
        # If it's already a dict, use it directly
        if isinstance(content, dict):
            parsed_data = content
        else:
            # Try to parse as JSON
            parsed_data = self._safe_json_parse(str(content))
            if parsed_data is None:
                # If not JSON, return empty list
                parsed_data = []
        
        # Normalize to list structure
        if isinstance(parsed_data, list):
            return {self.list_key: parsed_data}
        elif isinstance(parsed_data, dict):
            if self.list_key in parsed_data:
                return parsed_data
            else:
                # Convert dict to single-item list
                return {self.list_key: [parsed_data] if parsed_data else []}
        else:
            return {self.list_key: []}


# Factory function for easy parser creation
def create_parser(parser_type: str, **kwargs) -> BaseContentParser:
    """
    Factory function to create parsers by type.
    
    Args:
        parser_type: Type of parser ('business_profile', 'competitors', 'list', 'generic')
        **kwargs: Additional arguments for parser initialization
        
    Returns:
        Configured parser instance
    """
    parsers = {
        'business_profile': BusinessProfileParser,
        'competitors': CompetitorsParser,
        'list': ListContentParser,
        'generic': OpenAIContentParser
    }
    
    if parser_type not in parsers:
        raise ValueError(f"Unknown parser type: {parser_type}. Available: {list(parsers.keys())}")
    
    return parsers[parser_type](**kwargs)


# Pre-configured common parsers for easy import
business_profile_parser = BusinessProfileParser()
competitors_parser = CompetitorsParser()
generic_parser = OpenAIContentParser()