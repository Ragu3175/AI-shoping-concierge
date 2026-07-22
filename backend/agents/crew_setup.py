from rag.retriever import retrieve_candidates
from agents.stylist_agent import run_stylist_agent
from agents.budget_agent import run_budget_agent
from agents.comparator_agent import run_comparator_agent


def run_agent_pipeline(query_text: str) -> dict:
    """
    Sequentially runs the AI shopping agent pipeline:
    1. Retrieval layer (Groq intent parsing + Chroma vector search + filtering)
    2. Stylist Agent (style scoring + Gemini stylist reasoning)
    3. Budget Agent (budget scoring + Gemini budget reasoning)
    4. Comparator Agent (combined ranking, top pick selection, badges + comparator reasoning)
    """
    try:
        # Step 1: RAG Candidate Retrieval
        retrieval_result = retrieve_candidates(query_text)
        candidates = retrieval_result.get("candidates", [])
        intent = retrieval_result.get("intent", {})

        if not candidates:
            return {
                "top_pick": None,
                "alternatives": [],
                "intent": intent,
                "broadened": retrieval_result.get("broadened", False),
                "error": None
            }

        # Step 2: Stylist Agent
        stylist_candidates = run_stylist_agent(candidates, intent)

        # Step 3: Budget Agent
        budget_candidates = run_budget_agent(stylist_candidates, intent)

        # Step 4: Comparator Agent
        final_output = run_comparator_agent(budget_candidates, intent)
        final_output["intent"] = intent
        final_output["broadened"] = retrieval_result.get("broadened", False)
        final_output["error"] = None

        return final_output

    except Exception as e:
        print(f"Error in run_agent_pipeline: {e}")
        return {
            "top_pick": None,
            "alternatives": [],
            "intent": {},
            "broadened": False,
            "error": str(e)
        }
