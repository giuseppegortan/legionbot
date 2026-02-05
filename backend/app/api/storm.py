from fastapi import APIRouter, HTTPException
from backend.app.schemas.storm import Message, StormState, EvolveRequest, StartStormRequest
from backend.app.orchestration.conductor import build_storm_graph
from backend.app.knowledge.rag import knowledge_manager
from typing import List
import uuid

router = APIRouter(prefix="/storm", tags=["storm"])

from sqlalchemy.orm import Session
from backend.app.models.storm import SessionLocal, StormSession
from fastapi import Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import create_client, Client
from backend.app.core.config import settings

security = HTTPBearer()
supabase_client = None

if settings.SUPABASE_URL and settings.SUPABASE_ANON_KEY:
    supabase_client = create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not supabase_client:
        # Fallback for local development if no Supabase keys provided
        return {"id": "user_01"}
    
    token = credentials.credentials
    try:
        res = supabase_client.auth.get_user(token)
        return res.user
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

@router.post("/start")
async def start_storm(request: StartStormRequest, db: Session = Depends(get_db), user: any = Depends(get_current_user)):
    user_id = user.id if hasattr(user, 'id') else user.get('id')
    session_id = str(uuid.uuid4())
    db_session = StormSession(
        session_id=session_id,
        user_id=user_id,
        name=request.name,
        messages=[],
        metadata_json={
            "next_speaker": "conductor",
            "participants": request.agents
        }
    )
    db.add(db_session)
    db.commit()
    return {"session_id": session_id}

@router.get("/sessions")
async def list_sessions(db: Session = Depends(get_db), user: any = Depends(get_current_user)):
    user_id = user.id if hasattr(user, 'id') else user.get('id')
    sessions = db.query(StormSession).filter(StormSession.user_id == user_id).all()
    return [
        {"session_id": s.session_id, "name": s.name, "created_at": s.created_at.isoformat()}
        for s in sessions
    ]

@router.get("/{session_id}/message")
async def get_storm_status(session_id: str, db: Session = Depends(get_db), user: any = Depends(get_current_user)):
    user_id = user.id if hasattr(user, 'id') else user.get('id')
    db_session = db.query(StormSession).filter(
        StormSession.session_id == session_id,
        StormSession.user_id == user_id
    ).first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    rag_chunks = await knowledge_manager.search("recent context", db_session.user_id)
    return {
        "messages": db_session.messages,
        "rag_chunks": rag_chunks,
        "participants": db_session.metadata_json.get("participants", ["Architect", "Developer", "Secretary"])
    }

from fastapi.responses import StreamingResponse
import json
import asyncio

@router.post("/{session_id}/message")
async def send_message(session_id: str, message: Message, db: Session = Depends(get_db), user: any = Depends(get_current_user)):
    user_id = user.id if hasattr(user, 'id') else user.get('id')
    print(f"\n{'='*60}")
    print(f"📥 NEW MESSAGE REQUEST (STREAMING)")
    print(f"Session: {session_id}")
    print(f"User: {user_id}")
    print(f"{'='*60}\n")
    
    db_session = db.query(StormSession).filter(
        StormSession.session_id == session_id,
        StormSession.user_id == user_id
    ).first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Reconstruct state from DB
    state = {
        "messages": db_session.messages,
        "user_id": db_session.user_id,
        "session_id": db_session.session_id,
        "next_speaker": db_session.metadata_json.get("next_speaker", "conductor"),
        "muted_agents": message.muted_agents or [],
        "participants": db_session.metadata_json.get("participants", ["Architect", "Developer", "Secretary"])
    }
    
    msg_dict = message.dict()
    msg_dict.pop("muted_agents", None)
    state["messages"].append(msg_dict)
    
    async def event_generator():
        # Yield the user message first so the client sees it as accepted
        yield json.dumps({"type": "message", "payload": msg_dict}) + "\n"

        print(f"🌪️ Starting orchestration stream...")
        
        # Run orchestration with streaming
        graph = build_storm_graph()
        
        final_messages = list(state["messages"])
        current_next_speaker = state["next_speaker"]

        try:
            async for event in graph.astream(state):
                for node_name, update in event.items():
                    if "messages" in update:
                        new_msgs = update["messages"]
                        for m in new_msgs:
                            final_messages.append(m)
                            yield json.dumps({"type": "message", "payload": m}) + "\n"
                    
                    if "next_speaker" in update:
                        current_next_speaker = update["next_speaker"]
            
            # Evolve User Knowledge (this could be slow, maybe do it in background task?)
            # For now, keep it linear but maybe yield a 'processing' status
            yield json.dumps({"type": "status", "payload": "Evolving knowledge..."}) + "\n"
            await knowledge_manager.add_knowledge(message.content, state["user_id"])
            
            # Update DB
            db_session.messages = final_messages
            
            # Preserve existing metadata (like participants) and only update next_speaker
            current_metadata = dict(db_session.metadata_json) if db_session.metadata_json else {}
            current_metadata["next_speaker"] = current_next_speaker
            db_session.metadata_json = current_metadata
            
            db.commit()
            
            # RAG Search
            rag_chunks = await knowledge_manager.search(message.content, state["user_id"])
            yield json.dumps({"type": "rag", "payload": rag_chunks}) + "\n"
            
            print(f"✅ Stream completed successfully\n")
            yield json.dumps({"type": "done"}) + "\n"
            
        except Exception as e:
            print(f"❌ ERROR in stream: {e}")
            yield json.dumps({"type": "error", "payload": str(e)}) + "\n"

    return StreamingResponse(event_generator(), media_type="application/x-ndjson")

@router.delete("/{session_id}")
async def delete_storm(session_id: str, db: Session = Depends(get_db), user: any = Depends(get_current_user)):
    user_id = user.id if hasattr(user, 'id') else user.get('id')
    db_session = db.query(StormSession).filter(
        StormSession.session_id == session_id,
        StormSession.user_id == user_id
    ).first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    db.delete(db_session)
    db.commit()
    return {"message": "Storm deleted successfully"}

from fastapi.responses import FileResponse
import os

@router.get("/export/{session_id}")
async def download_export(session_id: str):
    file_path = f"exports/{session_id}.zip"
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Blueprint not found")
    
    return FileResponse(
        path=file_path,
        filename=f"storm_blueprint_{session_id[:8]}.zip",
        media_type="application/zip"
    )

from backend.app.utils.exporter import generate_blueprint_zip, save_zip_to_disk

@router.get("/{session_id}/analysis")
async def get_storm_analysis(session_id: str, db: Session = Depends(get_db), user: any = Depends(get_current_user)):
    user_id = user.id if hasattr(user, 'id') else user.get('id')
    db_session = db.query(StormSession).filter(
        StormSession.session_id == session_id,
        StormSession.user_id == user_id
    ).first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    messages = db_session.messages
    
    # Try to find a detailed analysis from Secretary
    analysis = None
    for m in reversed(messages):
        if m.get('sender') == "Secretary" or m.get('role') == 'assistant':
            if len(m.get('content', '')) > 300: # Heuristic for a detailed analysis
                analysis = m['content']
                break
    
    if not analysis:
        from backend.app.agents.base_agents import call_gemini
        system_prompt = """You are a Senior Systems Architect. 
        Analyze the transition log and generate a COMPREHENSIVE Application Analysis and Technical Specification.
        Include:
        1. Project Overview & Core Objectives
        2. Detailed Feature Specification
        3. Proposed Technical Stack
        4. Architecture & Data Flow
        5. Implementation Roadmap
        Format everything in clean Markdown."""
        analysis = await call_gemini(system_prompt, messages)
        
    return {"analysis": analysis}

@router.post("/{session_id}/blueprint")
async def generate_blueprint(session_id: str, db: Session = Depends(get_db), user: any = Depends(get_current_user)):
    user_id = user.id if hasattr(user, 'id') else user.get('id')
    db_session = db.query(StormSession).filter(
        StormSession.session_id == session_id,
        StormSession.user_id == user_id
    ).first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    messages = db_session.messages
    
    # Get analysis first (similar logic)
    analysis = None
    for m in reversed(messages):
        if m.get('sender') == "Secretary" or m.get('role') == 'assistant':
            if len(m.get('content', '')) > 300:
                analysis = m['content']
                break
    
    if not analysis:
        from backend.app.agents.base_agents import call_gemini_threaded
        system_prompt = "Generate a comprehensive technical analysis for this project."
        analysis = await call_gemini_threaded(system_prompt, messages, "Architect")

    zip_buffer = generate_blueprint_zip(session_id, analysis, messages)
    save_zip_to_disk(zip_buffer, session_id)
    
    return {
        "download_url": f"/storm/export/{session_id}"
    }

@router.post("/{session_id}/evolve")
async def evolve_knowledge(session_id: str, request: EvolveRequest, db: Session = Depends(get_db), user: any = Depends(get_current_user)):
    user_id = user.id if hasattr(user, 'id') else user.get('id')
    db_session = db.query(StormSession).filter(
        StormSession.session_id == session_id,
        StormSession.user_id == user_id
    ).first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    messages = db_session.messages
    from backend.app.agents.base_agents import call_gemini_threaded
    
    evolution_results = []
    for agent in request.agents:
        system_prompt = f"""You are the {agent}. 
        Analyze this storm session and extract the MOST VALUABLE technical insights, decisions, and patterns 
        that should be remembered for future projects. 
        Focus on your specific domain expertise.
        Format as a condensed knowledge chunk."""
        
        summary = await call_gemini_threaded(system_prompt, messages, agent)
        await knowledge_manager.add_knowledge(
            content=summary,
            user_id=user_id,
            metadata={"agent": agent, "session_id": session_id, "type": "evolution"}
        )
        evolution_results.append(agent)
    
    return {"message": f"Knowledge evolved for: {', '.join(evolution_results)}"}
