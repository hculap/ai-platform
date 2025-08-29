"""
Shared validation framework for agent tools.
Provides standardized validation patterns to reduce code duplication.
"""

import re
import logging
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List, Union
from urllib.parse import urlparse
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass
class ValidationResult:
    """Result of a validation operation."""
    is_valid: bool
    errors: List[str] = None
    warnings: List[str] = None
    validated_data: Dict[str, Any] = None
    
    def __post_init__(self):
        if self.errors is None:
            self.errors = []
        if self.warnings is None:
            self.warnings = []
        if self.validated_data is None:
            self.validated_data = {}
    
    def add_error(self, message: str) -> None:
        """Add an error and mark validation as failed."""
        self.errors.append(message)
        self.is_valid = False
    
    def add_warning(self, message: str) -> None:
        """Add a warning without affecting validity."""
        self.warnings.append(message)
    
    def set_validated_value(self, key: str, value: Any) -> None:
        """Set a validated value."""
        self.validated_data[key] = value
    
    def get_error_message(self) -> str:
        """Get formatted error message."""
        return "; ".join(self.errors)


class BaseValidator(ABC):
    """Abstract base class for all validators."""
    
    @abstractmethod
    def validate(self, value: Any, context: Optional[Dict[str, Any]] = None) -> ValidationResult:
        """
        Validate a value.
        
        Args:
            value: Value to validate
            context: Optional context for validation
            
        Returns:
            ValidationResult with outcome
        """
        pass


class RequiredValidator(BaseValidator):
    """Validator for required fields."""
    
    def __init__(self, field_name: str):
        self.field_name = field_name
    
    def validate(self, value: Any, context: Optional[Dict[str, Any]] = None) -> ValidationResult:
        """Validate that value is present and not empty."""
        result = ValidationResult(is_valid=True)
        
        if value is None:
            result.add_error(f"{self.field_name} is required")
        elif isinstance(value, str) and not value.strip():
            result.add_error(f"{self.field_name} cannot be empty")
        elif isinstance(value, (list, dict)) and len(value) == 0:
            result.add_error(f"{self.field_name} cannot be empty")
        else:
            result.set_validated_value(self.field_name, value)
        
        return result


class URLValidator(BaseValidator):
    """Validator for URL format."""
    
    def __init__(self, field_name: str = "url"):
        self.field_name = field_name
    
    def validate(self, value: Any, context: Optional[Dict[str, Any]] = None) -> ValidationResult:
        """Validate URL format."""
        result = ValidationResult(is_valid=True)
        
        if not value:
            result.add_error(f"{self.field_name} is required")
            return result
        
        if not isinstance(value, str):
            result.add_error(f"{self.field_name} must be a string")
            return result
        
        try:
            parsed = urlparse(value.strip())
            if not (parsed.scheme and parsed.netloc):
                result.add_error(f"{self.field_name} must have valid scheme and domain")
            elif parsed.scheme not in ['http', 'https']:
                result.add_warning(f"{self.field_name} should use http or https")
            else:
                result.set_validated_value(self.field_name, value.strip())
        except Exception:
            result.add_error(f"{self.field_name} has invalid format")
        
        return result


class BusinessProfileIdValidator(BaseValidator):
    """Validator for business profile ID."""
    
    def __init__(self, field_name: str = "business_profile_id"):
        self.field_name = field_name
    
    def validate(self, value: Any, context: Optional[Dict[str, Any]] = None) -> ValidationResult:
        """Validate business profile ID."""
        result = ValidationResult(is_valid=True)
        
        if value is None:
            result.add_error(f"{self.field_name} is required")
            return result
        
        # Convert to int if it's a string
        if isinstance(value, str):
            try:
                value = int(value)
            except ValueError:
                result.add_error(f"{self.field_name} must be a valid integer")
                return result
        
        if not isinstance(value, int):
            result.add_error(f"{self.field_name} must be an integer")
        elif value <= 0:
            result.add_error(f"{self.field_name} must be a positive integer")
        else:
            result.set_validated_value(self.field_name, value)
        
        return result


class OpenAIResponseIdValidator(BaseValidator):
    """Validator for OpenAI response ID."""
    
    def __init__(self, field_name: str = "openai_response_id"):
        self.field_name = field_name
    
    def validate(self, value: Any, context: Optional[Dict[str, Any]] = None) -> ValidationResult:
        """Validate OpenAI response ID format."""
        result = ValidationResult(is_valid=True)
        
        if not value:
            result.add_error(f"{self.field_name} is required")
            return result
        
        if not isinstance(value, str):
            result.add_error(f"{self.field_name} must be a string")
            return result
        
        # Basic format validation for OpenAI response IDs
        if len(value.strip()) < 10:
            result.add_error(f"{self.field_name} appears to be too short")
        elif not re.match(r'^[a-zA-Z0-9_-]+$', value.strip()):
            result.add_error(f"{self.field_name} contains invalid characters")
        else:
            result.set_validated_value(self.field_name, value.strip())
        
        return result


class EmailValidator(BaseValidator):
    """Validator for email addresses."""
    
    def __init__(self, field_name: str = "email"):
        self.field_name = field_name
        self.email_regex = re.compile(
            r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        )
    
    def validate(self, value: Any, context: Optional[Dict[str, Any]] = None) -> ValidationResult:
        """Validate email format."""
        result = ValidationResult(is_valid=True)
        
        if not value:
            result.add_error(f"{self.field_name} is required")
            return result
        
        if not isinstance(value, str):
            result.add_error(f"{self.field_name} must be a string")
            return result
        
        email = value.strip().lower()
        if not self.email_regex.match(email):
            result.add_error(f"{self.field_name} has invalid format")
        else:
            result.set_validated_value(self.field_name, email)
        
        return result


class CompositeValidator:
    """Validator that combines multiple validators for complex validation scenarios."""
    
    def __init__(self, validators: List[BaseValidator]):
        self.validators = validators
    
    def validate(self, value: Any, context: Optional[Dict[str, Any]] = None) -> ValidationResult:
        """Run all validators and combine results."""
        result = ValidationResult(is_valid=True)
        
        for validator in self.validators:
            validator_result = validator.validate(value, context)
            
            if not validator_result.is_valid:
                result.is_valid = False
                result.errors.extend(validator_result.errors)
            
            result.warnings.extend(validator_result.warnings)
            result.validated_data.update(validator_result.validated_data)
        
        return result


class ParametersValidator:
    """Validator for tool input parameters with multiple field validation."""
    
    def __init__(self):
        self.field_validators: Dict[str, BaseValidator] = {}
        self.optional_fields: set = set()
    
    def add_required_field(self, field_name: str, validator: BaseValidator) -> 'ParametersValidator':
        """Add a required field validator."""
        self.field_validators[field_name] = validator
        return self
    
    def add_optional_field(self, field_name: str, validator: BaseValidator) -> 'ParametersValidator':
        """Add an optional field validator."""
        self.field_validators[field_name] = validator
        self.optional_fields.add(field_name)
        return self
    
    def validate(self, parameters: Dict[str, Any]) -> ValidationResult:
        """Validate all parameters."""
        result = ValidationResult(is_valid=True)
        
        if not isinstance(parameters, dict):
            result.add_error("Parameters must be a dictionary")
            return result
        
        # Check for required fields
        for field_name, validator in self.field_validators.items():
            if field_name not in self.optional_fields and field_name not in parameters:
                result.add_error(f"Required field '{field_name}' is missing")
                continue
            
            # Skip validation for optional fields that are not present
            if field_name in self.optional_fields and field_name not in parameters:
                continue
            
            # Validate field
            field_result = validator.validate(parameters.get(field_name))
            
            if not field_result.is_valid:
                result.is_valid = False
                result.errors.extend(field_result.errors)
            
            result.warnings.extend(field_result.warnings)
            result.validated_data.update(field_result.validated_data)
        
        return result


# Common validator factory functions
def create_url_validator(field_name: str = "url") -> URLValidator:
    """Create a URL validator."""
    return URLValidator(field_name)


def create_business_profile_validator(field_name: str = "business_profile_id") -> BusinessProfileIdValidator:
    """Create a business profile ID validator."""
    return BusinessProfileIdValidator(field_name)


def create_openai_response_validator(field_name: str = "openai_response_id") -> OpenAIResponseIdValidator:
    """Create an OpenAI response ID validator."""
    return OpenAIResponseIdValidator(field_name)


def create_required_validator(field_name: str) -> RequiredValidator:
    """Create a required field validator."""
    return RequiredValidator(field_name)


# Pre-configured common validators for easy import
url_validator = URLValidator()
business_profile_id_validator = BusinessProfileIdValidator()
openai_response_id_validator = OpenAIResponseIdValidator()
email_validator = EmailValidator()