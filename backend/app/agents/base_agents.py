from google import genai
from datetime import datetime
from backend.app.core.config import settings
from dotenv import load_dotenv
import os

# FORCE load .env to override any system environment variables (like GEMINI_API_KEY)
load_dotenv(override=True)
api_key = os.getenv("GEMINI_API_KEY") or settings.GEMINI_API_KEY

# Configure Gemini Client (v1 SDK)
if not api_key:
    print("❌ CRITICAL: GEMINI_API_KEY is not set! Check your .env file.")
else:
    masked_key = api_key[:4] + "..." + api_key[-4:]
    print(f"✅ Gemini API Key LOADED FROM .ENV: {masked_key}")

client = genai.Client(api_key=api_key)

async def call_gemini(system_prompt: str, messages: list):
    """Helper to call Gemini API with history."""
    model_name = 'gemini-2.0-flash'
    print(f"DEBUG: Calling Gemini with model={model_name}")
    
    history_str = "\n".join([f"{m.get('sender', m.get('role', 'Unknown'))}: {m['content']}" for m in messages])
    prompt = f"{system_prompt}\n\nConversation history:\n{history_str}\n\nAgent Response:"
    
    try:
        response = client.models.generate_content(
            model=model_name,
            contents=prompt
        )
        return response.text
    except Exception as e:
        error_msg = str(e)
        if "429" in error_msg:
            return "⚠️ Quota Exceeded (429). If you have a Pro plan, ensure billing is active."
        return f"Error calling Gemini: {error_msg}"

async def architect_agent(state):
    system_prompt = "You are the Architect Agent of the STORM ENGINE. Your role is to design system architecture, choose technologies, and define high-level structure. Be precise and professional."
    content = await call_gemini(system_prompt, state.get("messages", []))
    
    message = {
        "role": "assistant",
        "sender": "architect",
        "content": content,
        "timestamp": datetime.now().isoformat()
    }
    return {"messages": [message], "next_speaker": "conductor"}

async def developer_agent(state):
    system_prompt = "You are the Developer Agent of the STORM ENGINE. Your role is to implement core logic, suggest implementation details, and write pseudo-code or documentation. Follow the architect's design."
    content = await call_gemini(system_prompt, state.get("messages", []))
    
    message = {
        "role": "assistant",
        "sender": "developer",
        "content": content,
        "timestamp": datetime.now().isoformat()
    }
    return {"messages": [message], "next_speaker": "conductor"}

async def secretary_agent(state):
    system_prompt = "You are the Secretary Agent. Your role is to summarize the discussion, draft reports, and prepare instructions for the final blueprint export. Keep track of all decisions made."
    content = await call_gemini(system_prompt, state.get("messages", []))
    
    message = {
        "role": "assistant",
        "sender": "secretary",
        "content": content,
        "timestamp": datetime.now().isoformat()
    }
    return {"messages": [message], "next_speaker": "END"}
