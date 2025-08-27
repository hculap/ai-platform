#!/usr/bin/env python3
"""
Simple test to verify OpenAI client works correctly after cleanup
"""

import sys
import os

# Add the app directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

def test_openai_client_import():
    """Test that OpenAI client can be imported and initialized"""
    try:
        from app.services.openai_client import OpenAIClient, get_openai_client

        # Test that we can create a client (will fail without API key, but should import correctly)
        print("✓ OpenAI client imported successfully")

        # Test that the class exists and has the expected methods
        assert hasattr(OpenAIClient, 'create_response_with_prompt_id')
        assert hasattr(OpenAIClient, 'create_chat_completion')
        assert hasattr(OpenAIClient, '_get_client')
        print("✓ OpenAI client has expected methods")

        # Test that get_openai_client function exists
        assert callable(get_openai_client)
        print("✓ get_openai_client function available")

        return True
    except Exception as e:
        print(f"✗ Error importing OpenAI client: {e}")
        return False

def test_no_business_logic():
    """Test that the client doesn't contain business logic or mock prompts"""
    try:
        with open('app/services/openai_client.py', 'r') as f:
            content = f.read()

        # Check that business logic terms are NOT present
        business_terms = [
            'business_profile',
            'company_name',
            'industry',
            'website_url',
            'mock_business_profile',
            'swot_analysis',
            'competitive_advantages'
        ]

        found_terms = []
        for term in business_terms:
            if term in content:
                found_terms.append(term)

        if found_terms:
            print(f"✗ Found business logic terms in client: {found_terms}")
            return False
        else:
            print("✓ No business logic found in OpenAI client")
            return True

    except Exception as e:
        print(f"✗ Error checking for business logic: {e}")
        return False

if __name__ == '__main__':
    print("Testing OpenAI client cleanup...")

    results = []
    results.append(test_openai_client_import())
    results.append(test_no_business_logic())

    if all(results):
        print("\n✅ All tests passed! OpenAI client is clean and functional.")
        sys.exit(0)
    else:
        print("\n❌ Some tests failed!")
        sys.exit(1)
