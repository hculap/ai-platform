#!/usr/bin/env python3
"""
Competition Tests Runner
Run comprehensive tests for the Competition functionality
"""

import sys
import os
import unittest
from pathlib import Path

# Add the current directory to Python path
current_dir = Path(__file__).parent
sys.path.insert(0, str(current_dir))

def run_competition_tests():
    """Run all competition-related tests"""

    # Discover and run tests
    loader = unittest.TestLoader()

    # Test patterns for competition tests
    test_patterns = [
        'test_competition_model.py',
        'test_competitions_api.py'
    ]

    suite = unittest.TestSuite()

    # Load tests from each pattern
    for pattern in test_patterns:
        test_file = current_dir / 'app' / 'tests' / pattern
        if test_file.exists():
            module_name = f'app.tests.{pattern[:-3]}'  # Remove .py extension
            try:
                module = __import__(module_name, fromlist=[''])
                suite.addTests(loader.loadTestsFromModule(module))
                print(f"✓ Loaded tests from {pattern}")
            except ImportError as e:
                print(f"✗ Failed to load {pattern}: {e}")
        else:
            print(f"✗ Test file not found: {test_file}")

    # Run the tests
    if suite.countTestCases() > 0:
        print(f"\n🚀 Running {suite.countTestCases()} Competition tests...\n")

        runner = unittest.TextTestRunner(
            verbosity=2,
            stream=sys.stdout,
            descriptions=True,
            failfast=False
        )

        result = runner.run(suite)

        # Summary
        print(f"\n📊 Test Results:")
        print(f"   Tests run: {result.testsRun}")
        print(f"   Failures: {len(result.failures)}")
        print(f"   Errors: {len(result.errors)}")
        print(f"   Skipped: {len(result.skipped)}")

        if result.wasSuccessful():
            print("✅ All Competition tests passed!")
            return True
        else:
            print("❌ Some tests failed!")
            return False
    else:
        print("❌ No tests found!")
        return False

if __name__ == '__main__':
    success = run_competition_tests()
    sys.exit(0 if success else 1)
