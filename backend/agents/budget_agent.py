def calculate_budget_score(candidate: dict, intent: dict) -> float:
    """
    Computes a numeric budget score (0-100):
    - If budget_max is provided: higher price up to budget_max yields higher score (better quality/features for budget).
    - If no budget_max: lower price yields higher affordability score.
    """
    price = candidate.get("price")
    try:
        price = float(price) if price is not None else 0.0
    except (ValueError, TypeError):
        price = 0.0

    budget_max = intent.get("budget_max")
    if budget_max is not None and budget_max > 0:
        try:
            budget_max = float(budget_max)
        except (ValueError, TypeError):
            budget_max = None

    if budget_max:
        if price > budget_max:
            over_pct = (price - budget_max) / budget_max
            score = max(0.0, 50.0 - (over_pct * 100.0))
        else:
            ratio = price / budget_max
            score = 50.0 + (ratio * 50.0)
    else:
        score = max(10.0, 100.0 - (price / 100.0))

    return round(min(100.0, max(0.0, score)), 2)


def run_budget_agent(candidates: list, intent: dict) -> list:
    """
    Budget Agent: Computes budget scores for candidates using price math logic.
    No LLM calls performed here to preserve rate limits.
    """
    enriched = []
    for cand in candidates:
        item = dict(cand)
        item["budget_score"] = calculate_budget_score(item, intent)
        enriched.append(item)

    enriched.sort(key=lambda x: x.get("budget_score", 0), reverse=True)
    return enriched
