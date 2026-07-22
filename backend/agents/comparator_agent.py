import time
from llm.gemini_client import generate_reasoning, reset_rate_limit_flag


def enrich_top_pick(item: dict, intent: dict) -> dict:
    """Helper to generate separate reasoning for stylist, budget, and comparator roles for Top Pick."""
    product = dict(item)
    product["badge"] = "Top pick"

    product["stylist_reasoning"] = generate_reasoning(product, intent, role="stylist")
    time.sleep(2.0)

    product["budget_reasoning"] = generate_reasoning(product, intent, role="budget")
    time.sleep(2.0)

    product["comparator_reasoning"] = generate_reasoning(product, intent, role="comparator")
    time.sleep(2.0)

    return product


def enrich_alternative(item: dict, intent: dict) -> dict:
    """Helper to generate 1 combined reasoning call for alternative items."""
    product = dict(item)
    style = product.get("style_score", 0)
    budget = product.get("budget_score", 0)
    product["badge"] = "Style match" if style >= budget else "Best value"

    # Single combined reasoning call
    combined_reasoning = generate_reasoning(product, intent, role="combined")
    time.sleep(2.0)

    product["stylist_reasoning"] = combined_reasoning
    product["budget_reasoning"] = combined_reasoning
    product["comparator_reasoning"] = combined_reasoning

    return product


def run_comparator_agent(candidates: list, intent: dict) -> dict:
    """
    Comparator Agent:
    1. Resets Gemini rate limit circuit-breaker.
    2. Ranks candidates by combined score (60% style, 40% budget).
    3. Generates 3 role reasonings for Top Pick (3 calls with 2s delays).
    4. Generates 1 combined reasoning for each of the 4 Alternatives (4 calls with 2s delays).
    Total calls = 7 max per search run.
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

    # 1. Top pick (3 calls)
    top_pick = enrich_top_pick(scored_candidates[0], intent)

    # 2. Alternatives (up to 4 items, 1 combined call each)
    raw_alternatives = scored_candidates[1:5]
    alternatives = []
    for alt_raw in raw_alternatives:
        enriched_alt = enrich_alternative(alt_raw, intent)
        alternatives.append(enriched_alt)

    return {
        "top_pick": top_pick,
        "alternatives": alternatives
    }
