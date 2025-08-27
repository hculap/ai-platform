#!/usr/bin/env python3
"""Test the mock OpenAI client."""

import sys
import os

# Add the app directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

def test_mock_client():
    """Test the mock OpenAI client."""
    try:
        from services.openai_client import get_openai_client

        print("Testing mock OpenAI client...")
        client = get_openai_client()

        # Test prompt_id method
        print("Testing create_response_with_prompt_id...")
        result = client.create_response_with_prompt_id(
            prompt_id="test-prompt",
            user_message="Test message"
        )
        print(f"Result: {result}")

        # Test system_message method
        print("Testing create_chat_completion...")
        result2 = client.create_chat_completion(
            system_message="You are a helpful assistant",
            user_message="Test message"
        )
        print(f"Result2: {result2}")

    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_mock_client()
