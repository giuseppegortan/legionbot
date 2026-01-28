from fastapi import APIRouter, HTTPException
from backend.app.schemas.storm import Message, StormState
from backend.app.orchestration.conductor import build_storm_graph
from backend.app.knowledge.rag import knowledge_manager
from typing import List
import uuid

router = APIRouter(prefix="/storm", tags=["storm"])

from sqlalchemy.orm import Session
from backend.app.models.storm import SessionLocal, StormSession
from fastapi import Depends

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/start")
async def start_storm(user_id: str, name: str = "New Storm", db: Session = Depends(get_db)):
    session_id = str(uuid.uuid4())
    db_session = StormSession(
        session_id=session_id,
        user_id=user_id,
        name=name,
        messages=[],
        metadata_json={"next_speaker": "conductor"}
    )
    db.add(db_session)
    db.commit()
    return {"session_id": session_id}

@router.get("/sessions")
async def list_sessions(user_id: str, db: Session = Depends(get_db)):
    sessions = db.query(StormSession).filter(StormSession.user_id == user_id).all()
    return [
        {"session_id": s.session_id, "name": s.name, "created_at": s.created_at.isoformat()}
        for s in sessions
    ]

@router.get("/{session_id}/message")
async def get_storm_status(session_id: str, db: Session = Depends(get_db)):
    db_session = db.query(StormSession).filter(StormSession.session_id == session_id).first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    rag_chunks = await knowledge_manager.search("recent context", db_session.user_id)
    return {
        "messages": db_session.messages,
        "rag_chunks": rag_chunks
    }

@router.post("/{session_id}/message")
async def send_message(session_id: str, message: Message, db: Session = Depends(get_db)):
    db_session = db.query(StormSession).filter(StormSession.session_id == session_id).first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Reconstruct state from DB
    state = {
        "messages": db_session.messages,
        "user_id": db_session.user_id,
        "session_id": db_session.session_id,
        "next_speaker": db_session.metadata_json.get("next_speaker", "conductor")
    }
    
    state["messages"].append(message.dict())
    
    # Run orchestration
    graph = build_storm_graph()
    result = await graph.ainvoke(state)
    
    # Evolve User Knowledge
    await knowledge_manager.add_knowledge(message.content, state["user_id"])
    
    # Update DB
    db_session.messages = result["messages"]
    db_session.metadata_json = {"next_speaker": result["next_speaker"]}
    db.commit()
    
    rag_chunks = await knowledge_manager.search(message.content, state["user_id"])
    
    return {
        "messages": result["messages"],
        "next_speaker": result["next_speaker"],
        "rag_chunks": rag_chunks
    }

@router.delete("/{session_id}")
async def delete_storm(session_id: str, db: Session = Depends(get_db)):
    db_session = db.query(StormSession).filter(StormSession.session_id == session_id).first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    db.delete(db_session)
    db.commit()
    return {"message": "Storm deleted successfully"}

from backend.app.utils.exporter import generate_blueprint_zip, save_zip_to_disk

@router.post("/{session_id}/end")
async def end_storm(session_id: str, db: Session = Depends(get_db)):
    db_session = db.query(StormSession).filter(StormSession.session_id == session_id).first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    messages = db_session.messages
    summary = "Successfull Storm Orchestration Summary." # This would come from Secretary
    
    zip_buffer = generate_blueprint_zip(session_id, summary, messages)
    save_zip_to_disk(zip_buffer, session_id)
    
    return {
        "message": "Storm ended. Report and Blueprint generated.",
        "download_url": f"/export/{session_id}.zip"
    }
