import requests
import json
import sys

API_URL = "http://127.0.0.1:9000"

def test_health():
    print("Testing health endpoint...")
    try:
        r = requests.get(f"{API_URL}/api/v1/health", timeout=5)
        print(f"Status: {r.status_code}")
        print(f"Response: {r.json()}")
        return r.status_code == 200
    except Exception as e:
        print(f"Error: {e}")
        return False

def test_chat():
    print("\nTesting chat endpoint...")
    try:
        payload = {"message": "Hello, what is 2+2?", "session_id": "test-session"}
        r = requests.post(f"{API_URL}/api/v1/agent-chat", json=payload, timeout=10)
        print(f"Status: {r.status_code}")
        print(f"Response: {r.json()}")
        return r.status_code == 200
    except Exception as e:
        print(f"Error: {e}")
        return False

def test_stream():
    print("\nTesting stream endpoint...")
    try:
        payload = {"message": "Tell me a short story", "session_id": "test-session-2"}
        r = requests.post(f"{API_URL}/api/v1/agent-chat/stream", json=payload, timeout=10, stream=True)
        print(f"Status: {r.status_code}")
        print("Streaming response:")
        for line in r.iter_lines():
            if line:
                print(f"  {line.decode()}")
        return r.status_code == 200
    except Exception as e:
        print(f"Error: {e}")
        return False

if __name__ == "__main__":
    results = []
    results.append(("Health", test_health()))
    results.append(("Chat", test_chat()))
    results.append(("Stream", test_stream()))
    
    print("\n" + "="*50)
    print("Test Results:")
    for name, passed in results:
        status = "PASS" if passed else "FAIL"
        print(f"  {name}: {status}")
    
    all_passed = all(r[1] for r in results)
    sys.exit(0 if all_passed else 1)
