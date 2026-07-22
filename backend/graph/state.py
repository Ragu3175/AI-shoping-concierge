from typing import TypedDict, Optional, List, Dict, Any


class GraphState(TypedDict):
    """State model for LangGraph shopping concierge workflow."""
    query_text: str
    intent: Optional[Dict[str, Any]]
    candidates: Optional[List[Dict[str, Any]]]
    top_pick: Optional[Dict[str, Any]]
    alternatives: Optional[List[Dict[str, Any]]]
    broadened: Optional[bool]
    error: Optional[str]
