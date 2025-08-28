#!/usr/bin/env python3
import requests
import json

# Test the agent response format
def test_agent_response():
    base_url = "http://localhost:5000"
    
    print("🔍 Testing agent execution response format...")
    
    # Test background execution
    test_data = {
        'input': {'url': 'https://example.com'}, 
        'background': True
    }
    
    try:
        response = requests.post(
            f"{base_url}/api/agents/business-concierge/tools/analyze-website/call",
            json=test_data,
            headers={'Content-Type': 'application/json'}
        )
        
        print(f"📡 Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Response: {json.dumps(data, indent=2)}")
            
            # Check structure
            if 'data' in data and 'data' in data['data']:
                inner_data = data['data']['data']
                if 'openai_response_id' in inner_data:
                    print("🎯 Background response format correct!")
                    print(f"📝 Response ID: {inner_data['openai_response_id']}")
                    
                    # Test status checking
                    status_data = {'input': {'openai_response_id': inner_data['openai_response_id']}}
                    status_response = requests.post(
                        f"{base_url}/api/agents/business-concierge/tools/check-analysis-status/call",
                        json=status_data,
                        headers={'Content-Type': 'application/json'}
                    )
                    
                    if status_response.status_code == 200:
                        status_result = status_response.json()
                        print(f"📊 Status Check: {json.dumps(status_result, indent=2)}")
                        
                        if 'data' in status_result and 'data' in status_result['data']:
                            status_inner = status_result['data']['data']
                            print(f"📈 Analysis Status: {status_inner.get('status', 'unknown')}")
                        else:
                            print("❌ Status response format incorrect")
                    else:
                        print(f"❌ Status check failed: {status_response.status_code}")
                else:
                    print("❌ Missing openai_response_id in background response")
            else:
                print("❌ Incorrect response structure")
        else:
            print(f"❌ Request failed: {response.status_code}")
            print(f"Response: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to backend server. Make sure it's running on port 5000")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_agent_response()
