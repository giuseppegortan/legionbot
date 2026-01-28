from typing import TypedDict, List, Annotated
from langgraph.graph import StateGraph, END
import operator

class AgentState(TypedDict):
    messages: Annotated[List[dict], operator.add]
    next_speaker: str
    user_id: str
    session_id: str

from datetime import datetime
from backend.app.agents.base_agents import architect_agent, developer_agent, secretary_agent

def conductor_node(state: AgentState):
    messages = state.get("messages", [])
    if not messages:
        return {"next_speaker": "architect"}
    
    last_message = messages[-1]
    
    # Simple logic to decide who speaks next
    if last_message.get("role") == "user":
        return {"next_speaker": "architect"}
    
    sender = last_message.get("sender")
    if sender == "architect":
        return {"next_speaker": "developer"}
    elif sender == "developer":
        return {"next_speaker": "secretary"}
    
    return {"next_speaker": END}

def router(state: AgentState):
    return state["next_speaker"]

def build_storm_graph():
    workflow = StateGraph(AgentState)
    
    workflow.add_node("conductor", conductor_node)
    workflow.add_node("architect", architect_agent)
    workflow.add_node("developer", developer_agent)
    workflow.add_node("secretary", secretary_agent)
    
    workflow.set_entry_point("conductor")
    
    workflow.add_conditional_edges(
        "conductor",
        router,
        {
            "architect": "architect",
            "developer": "developer",
            "secretary": "secretary",
            END: END
        }
    )
    
    workflow.add_edge("architect", "conductor")
    workflow.add_edge("developer", "conductor")
    workflow.add_edge("secretary", "conductor")
    
    return workflow.compile()
