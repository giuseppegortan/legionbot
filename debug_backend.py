import requests
import json

BASE_URL = "http://localhost:8000"

def debug():
    print(f"Checking health...")
    try:
        r = requests.get(f"{BASE_URL}/health")
        print(f"Health: {r.status_code} {r.text}")
    except Exception as e:
        print(f"Backend down: {e}")
        return

    # 1. Get Sessions
    print("\nGetting sessions...")
    headers = {"Authorization": "Bearer DEBUG_TOKEN_123"} 
    
    r = requests.get(f"{BASE_URL}/storm/sessions", headers=headers)
    if r.status_code == 401:
        print("Auth required. Backend has Supabase enabled.")
        # I cannot easily get a valid token without user interaction.
        # BUT, if I can see if backend/app/core/config.py loads a .env file, maybe I can see what's going on.
        # Or I can try to bypass it? No.
        print(f"Status: {r.status_code}")
        print(f"Response: {r.text}")
        return

    sessions = r.json()
    print(f"Sessions found: {len(sessions)}")
    
    session_id = None
    if sessions:
        session_id = sessions[0]['session_id']
        print(f"Using session: {session_id}")
    else:
        print("Creating new session...")
        r = requests.post(f"{BASE_URL}/storm/start", json={"name": "Debug Session", "agents": ["Architect", "Developer"]}, headers=headers)
        print(f"Start: {r.status_code} {r.text}")
        if r.status_code == 200:
            session_id = r.json()['session_id']
        else:
            return

    # 2. Send Message
    if session_id:
        print(f"\nSending message to {session_id}...")
        payload = {
            "role": "user",
            "sender": "User",
            "content": "Hello storm",
            "timestamp": "2023-01-01T00:00:00Z",
            "muted_agents": []
        }
        r = requests.post(f"{BASE_URL}/storm/{session_id}/message", json=payload, headers=headers)
        print(f"Message Status: {r.status_code}")
        print(f"Message Response: {r.text}")

if __name__ == "__main__":
    debug()
