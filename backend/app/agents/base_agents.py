from datetime import datetime
from backend.app.core.config import settings
from dotenv import load_dotenv
import os
import asyncio

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage

# FORCE load .env
load_dotenv(override=True)
api_key = os.getenv("GEMINI_API_KEY") or settings.GEMINI_API_KEY

# Configure LangChain Chat Model
llm = ChatGoogleGenerativeAI(
    model="gemini-2.0-flash",
    google_api_key=api_key,
    temperature=0.7
)

def format_messages(messages: list):
    """Converts raw dict messages to LangChain message objects."""
    lc_messages = []
    for m in messages:
        content = m.get("content", "")
        role = m.get("role", "user")
        sender = m.get("sender", "User")
        
        # We prepend the sender name to the content to help agents identify who said what
        formatted_content = f"[{sender}]: {content}"
        
        if role == "user":
            lc_messages.append(HumanMessage(content=formatted_content))
        else:
            lc_messages.append(AIMessage(content=formatted_content))
    return lc_messages

async def get_agent_response(system_prompt: str, messages: list, agent_name: str):
    """Generic helper to call LangChain model with collaborative context."""
    
    # Collaborative Framework
    cooperation_framework = (
        "TEAM COOPERATION FRAMEWORK:\n"
        "1. You are working in a SHARED AREA. You must read and acknowledge the contributions of other agents.\n"
        "2. DO NOT repeat what has already been said. BUILD UPON it.\n"
        "3. If a previous agent (e.g. Architect or Developer) made a proposal, CRITIQUE it, add missing details, or solve problems they identified.\n"
        "4. Mention other agents by name (e.g. 'Regarding the Architect's proposal...') to ensure a logical flow of reasoning.\n"
        "5. Your goal is a collective, refined solution, not a standalone report.\n"
        "6. RESPONSE LANGUAGE: You must respond in the SAME LANGUAGE as the user's last message."
    )

    prompt = ChatPromptTemplate.from_messages([
        ("system", f"ROLE DEFINITION: {system_prompt}\n\n{cooperation_framework}"),
        MessagesPlaceholder(variable_name="history"),
    ])
    
    chain = prompt | llm
    
    lc_history = format_messages(messages)
    
    response = await chain.ainvoke({"history": lc_history})
    return response.content

def should_run(agent_name: str, state: dict) -> bool:
    participants = state.get("participants") or ["Architect", "Developer", "Secretary"]
    muted = state.get("muted_agents") or []
    participants = [p.lower() for p in participants]
    muted = [m.lower() for m in muted]
    agent_key = agent_name.lower().replace(" ", "_")
    
    is_participant = False
    for p in participants:
       if p.replace(" ", "_") == agent_key:
           is_participant = True
           break
           
    is_muted = False
    for m in muted:
        if m.replace(" ", "_") == agent_key:
            is_muted = True
            break
            
    return is_participant and not is_muted

async def architect_agent(state):
    if not should_run("Architect", state): return {}
    print(f"🌪️ [LC-NODE] Architect analyzing...")
    content = await get_agent_response(
        "You are the Lead Architect. Set the structural vision. Critique follow-up turns and refine the design recursively.",
        state.get("messages", []),
        "Architect"
    )
    return {
        "messages": [{
            "role": "assistant",
            "sender": "Architect",
            "content": content,
            "timestamp": datetime.now().isoformat()
        }]
    }

async def developer_agent(state):
    if not should_run("Developer", state): return {}
    print(f"🌪️ [LC-NODE] Developer implementing...")
    content = await get_agent_response(
        "You are the Developer. Explicitly review the Architect's current proposal. Identify gaps. Propose concrete code blueprints.",
        state.get("messages", []),
        "Developer"
    )
    return {
        "messages": [{
            "role": "assistant",
            "sender": "Developer",
            "content": content,
            "timestamp": datetime.now().isoformat()
        }]
    }

async def secretary_agent(state):
    if not should_run("Secretary", state): return {}
    print(f"🌪️ [LC-NODE] Secretary synthesizing...")
    content = await get_agent_response(
        "You are the Knowledge Integrator. Consolidate the team effort. Highlight agreements/conflicts. Finalize actionable steps.",
        state.get("messages", []),
        "Secretary"
    )
    return {
        "messages": [{
            "role": "assistant",
            "sender": "Secretary",
            "content": content,
            "timestamp": datetime.now().isoformat()
        }]
    }

async def security_auditor_agent(state):
    if not should_run("Security Auditor", state): return {}
    print(f"🌪️ [LC-NODE] Security Auditor auditing...")
    state_key = "security_auditor" if "security_auditor" in [p.lower().replace(" ","_") for p in state.get("participants", [])] else "Security Auditor"
    
    content = await get_agent_response(
        "You are the Security Auditor. Review the Developer's code and Architect's design. Force consideration of edge cases. Be rigorous.",
        state.get("messages", []),
        "Security Auditor"
    )
    return {
        "messages": [{
            "role": "assistant",
            "sender": "Security Auditor",
            "content": content,
            "timestamp": datetime.now().isoformat()
        }]
    }

async def call_gemini(system_prompt: str, messages: list):
    """Simple wrapper for direct LLM calls."""
    return await get_agent_response(system_prompt, messages, "System")

async def call_gemini_threaded(system_prompt: str, messages: list, agent_name: str):
    """Alias for get_agent_response to match storm.py imports."""
    return await get_agent_response(system_prompt, messages, agent_name)
