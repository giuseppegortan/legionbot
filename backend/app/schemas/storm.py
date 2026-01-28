from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class Message(BaseModel):
    role: str
    content: str
    sender: Optional[str] = None
    timestamp: str

class StormState(BaseModel):
    session_id: str
    user_id: str
    messages: List[Message] = []
    next_speaker: Optional[str] = None
    metadata: Dict[str, Any] = {}
