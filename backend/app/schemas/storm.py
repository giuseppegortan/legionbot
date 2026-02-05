from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class Message(BaseModel):
    role: str
    content: str
    sender: Optional[str] = None
    timestamp: str
    muted_agents: Optional[List[str]] = None

class StormState(BaseModel):
    session_id: str
    user_id: str
    messages: List[Message] = []
    next_speaker: Optional[str] = None
    metadata: Dict[str, Any] = {}

class EvolveRequest(BaseModel):
    agents: List[str]

class StartStormRequest(BaseModel):
    name: str = "New Storm"
    agents: List[str] = ["Architect", "Developer", "Secretary"]
