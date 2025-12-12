import requests
import os

API = os.environ.get('API_URL', 'http://localhost:10000')

def main():
    r = requests.post(f"{API}/api/v1/agent-chat", json={"message": "Hello from test client"})
    print('status', r.status_code)
    print('json', r.json())

if __name__ == '__main__':
    main()
