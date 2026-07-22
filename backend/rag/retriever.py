import re
from llm.groq_client import parse_query_intent
from rag.vector_store import VectorStore

_vector_store_instance = None


def get_vector_store():
    global _vector_store_instance
    if _vector_store_instance is None:
        _vector_store_instance = VectorStore()
    return _vector_store_instance


def is_kids_product(item: dict) -> bool:
    """Checks if a candidate product belongs to children/kids/boys/girls categories or tags."""
    cat = (item.get("category") or "").lower()
    subcat = (item.get("subcategory") or "").lower()

    style_tags = item.get("style_tags") or []
    if isinstance(style_tags, list):
        tags_str = " ".join(style_tags).lower()
    else:
        tags_str = str(style_tags).lower()

    name = (item.get("name") or "").lower()
    desc = (item.get("description") or "").lower()

    combined_text = f"{cat} {subcat} {tags_str} {name} {desc}"

    kids_pattern = r'\b(kids?|children|child|girls?|boys?|kidswear)\b'
    return bool(re.search(kids_pattern, combined_text))


def matches_color(item: dict, target_color: str) -> bool:
    """Checks if a product candidate matches the target color."""
    if not target_color:
        return True

    color = target_color.lower().strip()
    if not color:
        return True

    name = (item.get("name") or "").lower()
    desc = (item.get("description") or "").lower()
    cat = (item.get("category") or "").lower()
    subcat = (item.get("subcategory") or "").lower()

    style_tags = item.get("style_tags") or []
    if isinstance(style_tags, list):
        tags_str = " ".join(style_tags).lower()
    else:
        tags_str = str(style_tags).lower()

    combined_text = f"{name} {desc} {cat} {subcat} {tags_str}"

    pattern = rf'\b{re.escape(color)}\b'
    return bool(re.search(pattern, combined_text))


def matches_category(item: dict, target_category: str) -> bool:
    """Checks if a product candidate matches the target category from intent."""
    if not target_category:
        return True

    target = target_category.lower().strip()
    item_cat = (item.get("category") or "").lower().strip()
    item_name = (item.get("name") or "").lower().strip()
    item_desc = (item.get("description") or "").lower().strip()
    combined_text = f"{item_cat} {item_name} {item_desc}"

    if target == "footwear":
        keywords = ["footwear", "shoe", "shoes", "heels", "sandals", "sneakers", "boots", "flats", "slippers"]
        return any(kw in combined_text for kw in keywords)
    elif target == "topwear":
        top_keywords = ["top", "shirt", "t-shirt", "tshirt", "jacket", "sweater", "polo", "kurta", "blazer", "vest", "topwear"]
        bottom_keywords = ["pant", "pants", "trouser", "trousers", "jeans", "shorts", "skirt", "track pant"]
        acc_keywords = ["wallet", "belt", "shoe", "shoes", "sandals", "heels", "deo", "perfume", "compact", "makeup", "accessories", "personal care"]

        if any(ak in combined_text for ak in acc_keywords):
            return False
        if any(bk in item_name for bk in bottom_keywords):
            return False
        return any(tk in combined_text for tk in top_keywords) or item_cat == "apparel"
    elif target == "bottomwear":
        bottom_keywords = ["pant", "pants", "trouser", "trousers", "jeans", "shorts", "skirt", "track pant", "bottomwear"]
        return any(bk in combined_text for bk in bottom_keywords)
    elif target == "accessories":
        acc_keywords = ["accessories", "wallet", "belt", "bag", "backpack", "watch", "tie", "sunglasses", "jewellery"]
        return any(ak in combined_text for ak in acc_keywords)

    return target in combined_text or item_cat == target


def filter_candidates(
    candidates: list,
    budget_max: float = None,
    budget_min: float = None,
    category: str = None,
    intent: dict = None,
    query_text: str = ""
) -> list:
    """Filters product candidates by price constraints, category, kids/adult audience, and color preference."""
    intent = intent or {}
    gender_intent = str(intent.get("gender") or "").strip().lower()
    cat_intent = str(intent.get("category") or "").strip().lower()
    color_intent = str(intent.get("color") or "").strip().lower()
    q_lower = (query_text or "").lower()

    kids_genders = {"kids", "boys", "girls", "children"}
    kids_kw_regex = r'\b(kids?|children|child|girls?|boys?|kidswear)\b'

    # Allow kids items ONLY if intent gender/category is explicitly kids/boys/girls or query text mentions kids/children/girls/boys
    is_kids_requested = (
        gender_intent in kids_genders or
        cat_intent in kids_genders or
        bool(re.search(kids_kw_regex, cat_intent)) or
        bool(re.search(kids_kw_regex, q_lower))
    )

    if budget_max is not None:
        try:
            budget_max = float(budget_max)
        except (ValueError, TypeError):
            budget_max = None

    if budget_min is not None:
        try:
            budget_min = float(budget_min)
        except (ValueError, TypeError):
            budget_min = None

    filtered = []
    for item in candidates:
        # Exclude kids products unless explicitly requested by user query/intent
        if not is_kids_requested and is_kids_product(item):
            continue

        # Category filtering
        if category and not matches_category(item, category):
            continue

        # Budget filtering
        price = item.get("price")
        if price is None:
            filtered.append(item)
            continue

        try:
            numeric_price = float(price)
        except (ValueError, TypeError):
            filtered.append(item)
            continue

        if budget_max is not None and numeric_price > budget_max:
            continue
        if budget_min is not None and numeric_price < budget_min:
            continue

        filtered.append(item)

    # Color filtering / boost:
    # If 3+ candidates match requested color, restrict results to color matches only.
    # Otherwise, prioritize color matches at the top of the candidate list as fallback.
    if color_intent:
        color_matches = [item for item in filtered if matches_color(item, color_intent)]
        if len(color_matches) >= 3:
            filtered = color_matches
        elif len(color_matches) > 0:
            filtered = sorted(filtered, key=lambda item: 0 if matches_color(item, color_intent) else 1)

    return filtered


def retrieve_candidates(query_text: str, top_k: int = 10) -> dict:
    """
    Parses user query intent using Groq, enriches search string, queries vector store,
    applies budget and color filtering, and triggers broadening fallback if matches are too low.
    """
    store = get_vector_store()

    # 1. Parse structured intent
    intent = parse_query_intent(query_text)

    style_tags = intent.get("style_tags") or []
    category = intent.get("category") or ""
    color_intent = intent.get("color") or ""

    # Infer color if missing from groq intent
    if not color_intent:
        common_colors = ["white", "black", "red", "blue", "green", "yellow", "purple", "navy", "pink", "grey", "gray", "teal", "brown", "beige"]
        for c in common_colors:
            if re.search(rf'\b{c}\b', query_text.lower()):
                intent["color"] = c
                color_intent = c
                break

    # Infer category if missing
    if not category:
        q_lower = query_text.lower()
        occ_lower = (intent.get("occasion") or "").lower()
        if any(k in q_lower for k in ["shirt", "top", "t-shirt", "tshirt", "jacket", "blazer", "wear"]) or occ_lower in ["office", "work", "formal"]:
            category = "topwear"
        elif any(k in q_lower for k in ["shoe", "shoes", "heels", "sandals", "sneakers", "boots", "footwear"]):
            category = "footwear"
        elif any(k in q_lower for k in ["pant", "pants", "trouser", "trousers", "jeans", "shorts", "skirt"]):
            category = "bottomwear"
        elif any(k in q_lower for k in ["wallet", "belt", "bag", "watch", "accessories"]):
            category = "accessories"

        if category:
            intent["category"] = category

    style_str = " ".join(style_tags) if isinstance(style_tags, list) else str(style_tags)
    extra_keywords = intent.get("extra_keywords") or []
    extra_str = " ".join(extra_keywords) if isinstance(extra_keywords, list) else str(extra_keywords)

    # 2. Build clean semantic search string (stripping price/budget noise from embedding text)
    clean_query = re.sub(r'(?i)\b(budget|under|below|above|max|min|rs\.?|inr|\$)\s*\d+\b', '', query_text).strip()
    search_components = [clean_query]
    if color_intent:
        search_components.append(color_intent)
    if style_str:
        search_components.append(style_str)
    if category:
        search_components.append(category)
    if extra_str:
        search_components.append(extra_str)
    search_string = " ".join(search_components).strip()

    # 3. Initial query to vector store with a large candidate pool (top_k=100)
    initial_pool_size = max(100, top_k)
    initial_candidates = store.query(search_string, top_k=initial_pool_size)

    # 4. Strict budget, category, kids/adult, and color filtering on the large pool
    budget_max = intent.get("budget_max")
    budget_min = intent.get("budget_min")

    filtered_candidates = filter_candidates(
        initial_candidates,
        budget_max=budget_max,
        budget_min=budget_min,
        category=category,
        intent=intent,
        query_text=query_text
    )
    broadened = False

    # 5. Conditional logic: broaden search if fewer than 3 candidates match
    if len(filtered_candidates) < 3:
        broadened = True
        print(f"[Retriever] Broadening triggered: Only {len(filtered_candidates)} candidate(s) matched initial top-{initial_pool_size} pool for query '{query_text}'. Querying full catalog (top_k=500).")
        broader_candidates = store.query(search_string, top_k=500)

        relaxed_max = (budget_max * 1.2) if budget_max is not None else None
        relaxed_min = (budget_min * 0.8) if budget_min is not None else None

        filtered_candidates = filter_candidates(
            broader_candidates,
            budget_max=relaxed_max,
            budget_min=relaxed_min,
            category=category,
            intent=intent,
            query_text=query_text
        )

    return {
        "intent": intent,
        "candidates": filtered_candidates[:top_k],
        "broadened": broadened
    }
