from typing import TypedDict, List, Annotated
from langgraph.graph import StateGraph, END
import operator

class AgentState(TypedDict):
    messages: Annotated[List[dict], operator.add]
    next_speaker: str
    user_id: str
    session_id: str
    muted_agents: List[str]
    participants: List[str]

from datetime import datetime
from backend.app.agents.base_agents import architect_agent, developer_agent, secretary_agent, security_auditor_agent

def conductor_node(state: AgentState):
    # Only decide IF we start.
    messages = state.get("messages", [])
    if not messages:
        return {"next_speaker": "architect"}
    
    last_message = messages[-1]
    if last_message.get("role") == "user":
        return {"next_speaker": "architect"}
    
    return {"next_speaker": END}

# Sequential Router is simple: It just follows the hardcoded edge, 
# but we can use simple edges instead of conditional if we want fixed order.
# However, to support short-circuiting (if we kept router), we'd need it.
# But here, we put skip logic inside the nodes. So we just chain them.

def build_storm_graph():
    workflow = StateGraph(AgentState)
    
    workflow.add_node("conductor", conductor_node)
    workflow.add_node("architect", architect_agent)
    workflow.add_node("developer", developer_agent)
    workflow.add_node("security_auditor", security_auditor_agent) # Note: order matters now
    workflow.add_node("secretary", secretary_agent)
    
    workflow.set_entry_point("conductor")
    
    # Conditional edge from conductor still useful to decide if we run at all
    def initial_router(state):
        return state.get("next_speaker")

    workflow.add_conditional_edges(
        "conductor",
        initial_router,
        {
            "architect": "architect",
            END: END
        }
    )
    
    # Sequential Chain
    workflow.add_edge("architect", "developer")
    workflow.add_edge("developer", "security_auditor")
    workflow.add_edge("security_auditor", "secretary")
    workflow.add_edge("secretary", END)
    
    return workflow.compile()
