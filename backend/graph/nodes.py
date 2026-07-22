from graph.state import GraphState
from rag.retriever import retrieve_candidates
from agents.stylist_agent import run_stylist_agent
from agents.budget_agent import run_budget_agent
from agents.comparator_agent import run_comparator_agent


def node_parse_and_retrieve(state: GraphState) -> GraphState:
    """
    Node 1: Parses query intent and retrieves product candidates from vector store.
    """
    try:
        query_text = state.get("query_text", "")
        retrieval_result = retrieve_candidates(query_text)

        state["intent"] = retrieval_result.get("intent", {})
        state["candidates"] = retrieval_result.get("candidates", [])
        state["broadened"] = retrieval_result.get("broadened", False)
        state["error"] = None
    except Exception as e:
        print(f"Error in node_parse_and_retrieve: {e}")
        state["intent"] = {}
        state["candidates"] = []
        state["broadened"] = False
        state["error"] = f"Retrieval failed: {str(e)}"

    return state


def node_run_agents(state: GraphState) -> GraphState:
    """
    Node 2: Passes candidates through Stylist, Budget, and Comparator agents.
    """
    # If a prior node set an error or candidates list is empty, exit early safely
    if state.get("error") or not state.get("candidates"):
        state["top_pick"] = None
        state["alternatives"] = []
        return state

    try:
        candidates = state.get("candidates", [])
        intent = state.get("intent", {})

        # Step A: Stylist Agent
        stylist_candidates = run_stylist_agent(candidates, intent)

        # Step B: Budget Agent
        budget_candidates = run_budget_agent(stylist_candidates, intent)

        # Step C: Comparator Agent
        comparator_output = run_comparator_agent(budget_candidates, intent)

        state["top_pick"] = comparator_output.get("top_pick")
        state["alternatives"] = comparator_output.get("alternatives", [])
    except Exception as e:
        print(f"Error in node_run_agents: {e}")
        state["top_pick"] = None
        state["alternatives"] = []
        state["error"] = f"Agent pipeline failed: {str(e)}"

    return state
