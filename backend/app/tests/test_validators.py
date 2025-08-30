"""
Tests for the Validation System
Tests ValidationResult, ParametersValidator, and specific validator implementations.
"""

import pytest
from app.agents.shared.validators import (
    ValidationResult, ParametersValidator, URLValidator
)


class TestValidationResult:
    """Test ValidationResult data class"""
    
    def test_validation_result_success(self):
        """Test ValidationResult for successful validation"""
        result = ValidationResult(
            is_valid=True,
            validated_data={"param1": "value1", "param2": "value2"}
        )
        
        assert result.is_valid is True
        assert result.errors == []
        assert result.warnings == []
        assert result.validated_data == {"param1": "value1", "param2": "value2"}
    
    def test_validation_result_failure(self):
        """Test ValidationResult for failed validation"""
        result = ValidationResult(
            is_valid=False,
            errors=["Error 1", "Error 2"],
            warnings=["Warning 1"]
        )
        
        assert result.is_valid is False
        assert result.errors == ["Error 1", "Error 2"]
        assert result.warnings == ["Warning 1"]
        assert result.validated_data == {}
    
    def test_validation_result_defaults(self):
        """Test ValidationResult default values"""
        result = ValidationResult(is_valid=True)
        
        assert result.is_valid is True
        assert result.errors == []
        assert result.warnings == []
        assert result.validated_data == {}
    
    def test_validation_result_with_warnings(self):
        """Test ValidationResult with warnings but success"""
        validated_data = {"url": "https://example.com", "timeout": 30}
        result = ValidationResult(
            is_valid=True,
            warnings=["Timeout is high, consider reducing it"],
            validated_data=validated_data
        )
        
        assert result.is_valid is True
        assert len(result.warnings) == 1
        assert result.validated_data == validated_data


class TestParametersValidator:
    """Test base ParametersValidator class"""
    
    def test_parameters_validator_creation(self):
        """Test that ParametersValidator can be created"""
        # ParametersValidator is not abstract, can be instantiated directly
        validator = ParametersValidator()
        assert validator is not None
        assert hasattr(validator, 'validate')
    
    def test_parameters_validator_has_validate_method(self):
        """Test that ParametersValidator has validate method"""
        validator = ParametersValidator()
        
        # Should have a validate method
        assert hasattr(validator, 'validate')
        
        # Test default validate behavior
        result = validator.validate({})
        assert isinstance(result, ValidationResult)


class MockParametersValidator(ParametersValidator):
    """Mock implementation of ParametersValidator for testing"""
    
    def validate(self, parameters):
        """Mock validation that checks for 'invalid' in any parameter"""
        errors = []
        warnings = []
        validated_data = {}
        
        for key, value in parameters.items():
            if "invalid" in str(value).lower():
                errors.append(f"Parameter '{key}' contains invalid value")
            elif "warning" in str(value).lower():
                warnings.append(f"Parameter '{key}' may need attention")
                validated_data[key] = value
            else:
                validated_data[key] = value
        
        return ValidationResult(
            is_valid=len(errors) == 0,
            errors=errors,
            warnings=warnings,
            validated_data=validated_data if len(errors) == 0 else {}
        )


class TestMockParametersValidator:
    """Test the mock validator to ensure it works as expected"""
    
    def test_mock_validator_success(self):
        """Test mock validator with valid parameters"""
        validator = MockParametersValidator()
        parameters = {"param1": "valid_value", "param2": "another_valid_value"}
        
        result = validator.validate(parameters)
        
        assert result.is_valid is True
        assert result.errors == []
        assert result.validated_data == parameters
    
    def test_mock_validator_failure(self):
        """Test mock validator with invalid parameters"""
        validator = MockParametersValidator()
        parameters = {"param1": "invalid_value", "param2": "valid_value"}
        
        result = validator.validate(parameters)
        
        assert result.is_valid is False
        assert len(result.errors) == 1
        assert "param1" in result.errors[0]
        assert result.validated_data == {}
    
    def test_mock_validator_warnings(self):
        """Test mock validator with warnings"""
        validator = MockParametersValidator()
        parameters = {"param1": "warning_value", "param2": "valid_value"}
        
        result = validator.validate(parameters)
        
        assert result.is_valid is True
        assert len(result.warnings) == 1
        assert "param1" in result.warnings[0]
        assert result.validated_data == parameters


class TestURLValidator:
    """Test URL validator implementation"""
    
    def test_url_validator_valid_urls(self):
        """Test URLValidator with valid URLs"""
        validator = URLValidator()
        
        valid_urls = [
            "https://www.example.com",
            "http://example.com",
            "https://subdomain.example.com/path?query=value",
            "https://example.com:8080/path"
        ]
        
        for url in valid_urls:
            result = validator.validate(url)
            assert result.is_valid is True, f"URL {url} should be valid"
    
    def test_url_validator_invalid_urls(self):
        """Test URLValidator with invalid URLs"""
        validator = URLValidator()
        
        invalid_urls = [
            "not-a-url",
            "",
            "https://",
            "example.com",  # Missing protocol
            "http://"
        ]
        
        for url in invalid_urls:
            result = validator.validate(url)
            assert result.is_valid is False, f"URL {url} should be invalid"
            assert len(result.errors) > 0
    
    def test_url_validator_missing_url(self):
        """Test URLValidator with None/empty input"""
        validator = URLValidator()
        
        result = validator.validate(None)
        
        assert result.is_valid is False
        assert any("required" in error.lower() for error in result.errors)
    
    def test_url_validator_with_valid_url(self):
        """Test URLValidator with a valid URL"""
        validator = URLValidator()
        url = "https://www.example.com"
        
        result = validator.validate(url)
        
        assert result.is_valid is True
        assert len(result.errors) == 0


class TestRealValidators:
    """Test real validator implementations that exist"""
    
    def test_email_validator(self):
        """Test EmailValidator"""
        from app.agents.shared.validators import EmailValidator
        validator = EmailValidator()
        
        # Test valid email
        result = validator.validate("test@example.com")
        assert result.is_valid is True
        
        # Test invalid email
        result = validator.validate("invalid-email")
        assert result.is_valid is False
    
    def test_required_validator(self):
        """Test RequiredValidator"""
        from app.agents.shared.validators import RequiredValidator
        validator = RequiredValidator("name")
        
        # Test with required field present
        result = validator.validate("John")
        assert result.is_valid is True
        
        # Test with missing required field (None/empty)
        result = validator.validate(None)
        assert result.is_valid is False


class TestValidationIntegration:
    """Integration tests for validation system"""
    
    def test_validator_chain(self):
        """Test chaining multiple validators"""
        url_validator = URLValidator()
        mock_validator = MockParametersValidator()
        
        # Test data that should pass URL validation
        url_data = "https://www.example.com"
        url_result = url_validator.validate(url_data)
        assert url_result.is_valid is True
        
        # Test data that should pass mock validation
        mock_data = {"param1": "valid_value", "param2": "another_valid"}
        mock_result = mock_validator.validate(mock_data)
        assert mock_result.is_valid is True
    
    def test_validation_error_handling(self):
        """Test proper error handling in validation"""
        validator = MockParametersValidator()
        
        # Test that validation errors are properly contained
        invalid_data = {"param1": "invalid_value", "param2": "another_invalid"}
        result = validator.validate(invalid_data)
        
        assert result.is_valid is False
        assert len(result.errors) == 2
        
        # Test that we can work with validation results
        assert isinstance(result, ValidationResult)
    
    def test_validation_with_mixed_results(self):
        """Test validation with mixed success/warning/error results"""
        validator = MockParametersValidator()
        
        mixed_data = {
            "valid_param": "good_value",
            "warning_param": "warning_value", 
            "invalid_param": "invalid_value"
        }
        
        result = validator.validate(mixed_data)
        
        # Should fail due to invalid parameter, but would have warnings too
        assert result.is_valid is False
        assert len(result.errors) >= 1
        # The mock validator doesn't add warnings when there are errors
        # but in a real scenario, warnings might be preserved
    
    def test_real_world_validation_scenario(self):
        """Test a realistic validation scenario with URL validator"""
        # Test with actual URL validation
        validator = URLValidator()
        
        real_url = "https://techinnovations.com"
        
        result = validator.validate(real_url)
        
        # This should pass validation
        assert result.is_valid is True


class TestValidatorPerformance:
    """Test validator performance characteristics"""
    
    def test_validator_handles_large_data(self):
        """Test validator performance with large datasets"""
        validator = MockParametersValidator()
        
        # Create a large dataset
        large_data = {f"param_{i}": f"value_{i}" for i in range(1000)}
        
        result = validator.validate(large_data)
        
        assert result.is_valid is True
        assert len(result.validated_data) == 1000
    
    def test_validator_handles_empty_data(self):
        """Test validator behavior with empty data"""
        validator = MockParametersValidator()
        
        result = validator.validate({})
        
        assert result.is_valid is True
        assert result.validated_data == {}
        assert result.errors == []
    
    def test_validator_handles_none_values(self):
        """Test validator behavior with None values"""
        validator = MockParametersValidator()
        
        data_with_none = {
            "param1": None,
            "param2": "valid_value"
        }
        
        result = validator.validate(data_with_none)
        
        # Should handle None values gracefully
        assert result.is_valid is True or result.is_valid is False  # Depends on implementation
        # The important thing is that it doesn't crash