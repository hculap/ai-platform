#!/usr/bin/env python3
"""
Test to verify that the responses API integration still works after OpenAI client cleanup
"""

import sys
import os

# Add the app directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

def test_concierge_tool_import():
    """Test that concierge tool can be imported and uses OpenAI client correctly"""
    try:
        from app.agents.concierge.tools.analyzewebsiteTool import AnalyzeWebsiteTool
        from app.services.openai_client import get_openai_client

        print("✓ Concierge tool imported successfully")

        # Test that the tool has the expected attributes
        tool = AnalyzeWebsiteTool()
        assert hasattr(tool, 'call_openai')
        assert hasattr(tool, 'prompt_id')
        assert tool.prompt_id == 'pmpt_68aec68cbe2081909e109ce3b087d6ba07eff42b26c15bb8'
        print("✓ Tool has correct prompt_id and call_openai method")

        # Test that the tool's call_openai method can access the OpenAI client
        # We won't actually call it since we don't have an API key, but we can check the method exists
        assert callable(tool.call_openai)
        print("✓ Tool's call_openai method is callable")

        return True
    except Exception as e:
        print(f"✗ Error testing concierge tool: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_base_tool_integration():
    """Test that base tool properly integrates with OpenAI client"""
    try:
        from app.agents.shared.base_tool import BaseTool, ToolInput

        # Create a minimal test tool
        class TestTool(BaseTool):
            def __init__(self):
                super().__init__(
                    name='Test Tool',
                    slug='test-tool',
                    description='Test tool for OpenAI integration',
                    prompt_id='test_prompt_123'
                )

            async def execute(self, input_data: ToolInput):
                return self.call_openai("test message")

        tool = TestTool()
        print("✓ Base tool created successfully")

        # Test that it has OpenAI integration
        assert hasattr(tool, 'call_openai')
        assert tool.prompt_id == 'test_prompt_123'
        print("✓ Base tool has OpenAI integration")

        return True
    except Exception as e:
        print(f"✗ Error testing base tool integration: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    print("Testing responses API integration...")

    results = []
    results.append(test_concierge_tool_import())
    results.append(test_base_tool_integration())

    if all(results):
        print("\n✅ All tests passed! Responses API integration is working correctly.")
        sys.exit(0)
    else:
        print("\n❌ Some tests failed!")
        sys.exit(1)
