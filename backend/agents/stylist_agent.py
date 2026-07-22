import re


def matches_color(candidate: dict, target_color: str) -> bool:
    """Checks if a product candidate matches the target color."""
    if not target_color:
        return True

    color = target_color.lower().strip()
    if not color:
        return True

    name = (candidate.get("name") or "").lower()
    desc = (candidate.get("description") or "").lower()
    cat = (candidate.get("category") or "").lower()
    subcat = (candidate.get("subcategory") or "").lower()

    style_tags = candidate.get("style_tags") or []
    if isinstance(style_tags, list):
        tags_str = " ".join(style_tags).lower()
    else:
        tags_str = str(style_tags).lower()

    combined_text = f"{name} {desc} {cat} {subcat} {tags_str}"

    pattern = rf'\b{re.escape(color)}\b'
    return bool(re.search(pattern, combined_text))


def calculate_style_score(candidate: dict, intent: dict) -> float:
    """Computes a numeric style score (0-100) combining vector similarity (70%), tag overlap (30%), and color boost."""
    intent_tags = intent.get("style_tags") or []
    if isinstance(intent_tags, str):
        intent_tags = [t.strip().lower() for t in intent_tags.split(",") if t.strip()]
    else:
        intent_tags = [str(t).lower() for t in intent_tags]

    cand_tags = candidate.get("style_tags") or []
    if isinstance(cand_tags, str):
        cand_tags = [t.strip().lower() for t in cand_tags.split(",") if t.strip()]
    else:
        cand_tags = [str(t).lower() for t in cand_tags]

    cand_text = f"{candidate.get('name', '')} {candidate.get('description', '')}".lower()
    vector_score = float(candidate.get("score", 0.5)) * 100.0

    if intent_tags:
        matches = sum(1 for tag in intent_tags if tag in cand_tags or tag in cand_text)
        tag_overlap_score = (matches / len(intent_tags)) * 100.0
    else:
        tag_overlap_score = 50.0

    # 70% vector similarity score + 30% tag overlap score
    final_score = (vector_score * 0.70) + (tag_overlap_score * 0.30)

    # Color match boost (+20 points)
    target_color = (intent.get("color") or "").strip().lower()
    if target_color and matches_color(candidate, target_color):
        final_score += 20.0

    return round(min(100.0, max(0.0, final_score)), 2)


def run_stylist_agent(candidates: list, intent: dict) -> list:
    """
    Stylist Agent: Computes style scores for candidates using pure math/similarity logic.
    No LLM calls performed here to preserve rate limits.
    """
    enriched = []
    for cand in candidates:
        item = dict(cand)
        item["style_score"] = calculate_style_score(item, intent)
        enriched.append(item)

    enriched.sort(key=lambda x: x.get("style_score", 0), reverse=True)
    return enriched
