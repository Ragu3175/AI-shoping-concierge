from llm.gemini_client import generate_all_reasonings, reset_rate_limit_flag


def run_comparator_agent(candidates: list, intent: dict) -> dict:
    """
    Comparator Agent:
    1. Resets Gemini rate limit circuit-breaker.
    2. Ranks candidates by combined score (60% style, 40% budget).
    3. Runs a single batched Gemini API call to get all reasoning statements.
    4. Enriches items with badges and parsed reasoning fields.
    """
    reset_rate_limit_flag()

    if not candidates:
        return {"top_pick": None, "alternatives": []}

    scored_candidates = []
    for cand in candidates:
        item = dict(cand)
        style = float(item.get("style_score", 50.0))
        budget = float(item.get("budget_score", 50.0))
        item["combined_score"] = round((style * 0.6) + (budget * 0.4), 2)
        scored_candidates.append(item)

    scored_candidates.sort(key=lambda x: x.get("combined_score", 0), reverse=True)

    # Separate top pick and alternatives
    raw_top_pick = dict(scored_candidates[0])
    raw_alternatives = [dict(alt) for alt in scored_candidates[1:5]]

    # Single batched LLM call to get all reasonings
    reasonings = generate_all_reasonings(raw_top_pick, raw_alternatives, intent)

    # 1. Enrich Top pick
    top_pick = raw_top_pick
    top_pick["badge"] = "Top pick"
    
    top_pick_res = reasonings.get("top_pick", {})
    top_pick["stylist_reasoning"] = top_pick_res.get("stylist_reasoning", "Recommended based on style match.")
    top_pick["budget_reasoning"] = top_pick_res.get("budget_reasoning", "Recommended based on budget value.")
    top_pick["comparator_reasoning"] = top_pick_res.get("comparator_reasoning", "A standout choice overall.")

    # 2. Enrich Alternatives
    alternatives = []
    alt_reasonings_list = reasonings.get("alternatives", [])
    
    for alt in raw_alternatives:
        style = alt.get("style_score", 0)
        budget = alt.get("budget_score", 0)
        alt["badge"] = "Style match" if style >= budget else "Best value"

        # Find matching reasoning by ID
        matching_reasoning = None
        for r_item in alt_reasonings_list:
            if str(r_item.get("id")) == str(alt.get("id")):
                matching_reasoning = r_item.get("reasoning")
                break
        
        if not matching_reasoning:
            matching_reasoning = "Great alternative option matching your search."

        # Assign reasoning fields (maintaining UI structure)
        alt["stylist_reasoning"] = matching_reasoning
        alt["budget_reasoning"] = matching_reasoning
        alt["comparator_reasoning"] = matching_reasoning
        
        alternatives.append(alt)

    return {
        "top_pick": top_pick,
        "alternatives": alternatives
    }
