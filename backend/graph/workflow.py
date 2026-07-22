from langgraph.graph import StateGraph, START, END
from graph.state import GraphState
from graph.nodes import node_parse_and_retrieve, node_run_agents


def create_shopping_graph():
    """Builds and compiles the LangGraph StateGraph workflow for shopping concierge."""
    builder = StateGraph(GraphState)

    # Add nodes
    builder.add_node("parse_and_retrieve", node_parse_and_retrieve)
    builder.add_node("run_agents", node_run_agents)

    # Wire edges: START -> parse_and_retrieve -> run_agents -> END
    builder.add_edge(START, "parse_and_retrieve")
    builder.add_edge("parse_and_retrieve", "run_agents")
    builder.add_edge("run_agents", END)

    return builder.compile()


# Compile global workflow graph instance
_workflow_app = None


def get_workflow_app():
    global _workflow_app
    if _workflow_app is None:
        _workflow_app = create_shopping_graph()
    return _workflow_app


def run_query_workflow(query_text: str) -> dict:
    """
    Entry point function for executing the LangGraph shopping concierge workflow.
    """
    app = get_workflow_app()
    initial_state: GraphState = {
        "query_text": query_text,
        "intent": None,
        "candidates": None,
        "top_pick": None,
        "alternatives": None,
        "broadened": False,
        "error": None
    }

    final_state = app.invoke(initial_state)

    return {
        "top_pick": final_state.get("top_pick"),
        "alternatives": final_state.get("alternatives", []),
        "intent": final_state.get("intent", {}),
        "broadened": final_state.get("broadened", False),
        "error": final_state.get("error")
    }
