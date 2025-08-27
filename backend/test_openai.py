#!/usr/bin/env python3
"""Test OpenAI client initialization to debug proxy issue."""

import sys
import os

# Add the app directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

def test_openai_init():
    """Test OpenAI client initialization."""
    try:
        import inspect
        from openai import OpenAI

        # Check OpenAI client signature
        print("Checking OpenAI client signature...")
        sig = inspect.signature(OpenAI.__init__)
        print(f"OpenAI.__init__ parameters: {list(sig.parameters.keys())}")

        # Check httpx proxy settings
        print("\nChecking httpx proxy settings...")
        try:
            import httpx
            print(f"httpx version: {httpx.__version__}")

            # Check if httpx has any default proxy settings
            with httpx.Client() as client:
                print(f"httpx client proxies: {client.proxies}")
        except Exception as e:
            print(f"httpx check failed: {e}")

        # Check requests proxy settings
        print("\nChecking requests proxy settings...")
        try:
            import requests
            print(f"requests version: {requests.__version__}")

            # Create a session and check proxies
            session = requests.Session()
            print(f"requests session proxies: {session.proxies}")
        except Exception as e:
            print(f"requests check failed: {e}")

        # Try to patch the OpenAI client to see what arguments are being passed
        print("\nTrying to patch OpenAI.__init__ to see arguments...")
        original_init = OpenAI.__init__

        def patched_init(self, *args, **kwargs):
            print(f"OpenAI.__init__ called with args: {args}")
            print(f"OpenAI.__init__ called with kwargs: {kwargs}")
            return original_init(self, *args, **kwargs)

        OpenAI.__init__ = patched_init

        try:
            print("4. Testing with patched init...")
            client = OpenAI(api_key="test-key")
            print("✅ Patched init successful")
        except Exception as e:
            print(f"❌ Patched init failed: {e}")
        finally:
            # Restore original init
            OpenAI.__init__ = original_init

        # Try with custom httpx client
        print("\n5. Testing with custom httpx client...")
        try:
            import httpx

            # Create httpx client with no proxies
            http_client = httpx.Client(proxies=None)
            print("httpx client created with proxies=None")

            client = OpenAI(api_key="test-key", http_client=http_client)
            print("✅ Custom httpx client successful")
        except Exception as e:
            print(f"❌ Custom httpx client failed: {e}")

        # Try monkey patching the OpenAI init to filter out proxies
        print("\n6. Testing with monkey patch to filter proxies...")
        original_init = OpenAI.__init__

        def filtered_init(self, *args, **kwargs):
            # Filter out any proxy-related parameters
            filtered_kwargs = {k: v for k, v in kwargs.items() if 'proxy' not in k.lower()}
            print(f"Filtered kwargs: {filtered_kwargs}")
            return original_init(self, *args, **filtered_kwargs)

        OpenAI.__init__ = filtered_init

        try:
            client = OpenAI(api_key="test-key")
            print("✅ Monkey patch successful")
        except Exception as e:
            print(f"❌ Monkey patch failed: {e}")
        finally:
            OpenAI.__init__ = original_init

    except ImportError as e:
        print(f"❌ Import error: {e}")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_openai_init()
