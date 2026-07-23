import os
import json
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()

FALLBACK_REASONING = "Recommended based on style and budget match."
_is_rate_limited = False


def reset_rate_limit_flag():
    """Resets the rate-limit circuit-breaker flag for a new run."""
    global _is_rate_limited
    _is_rate_limited = False


def generate_reasoning(product: dict, user_intent: dict, role: str) -> str:
    """Generate a 1-sentence reasoning explanation using Gemini based on product, user intent, and role."""
    global _is_rate_limited

    if _is_rate_limited:
        return FALLBACK_REASONING

    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("Warning: GEMINI_API_KEY is missing from environment.")
        return FALLBACK_REASONING

    role_descriptions = {
        "stylist": "Focus on style matching, aesthetics, cut, color, and fashion suitability.",
        "budget": "Focus on value for money, pricing, affordability, and practical features.",
        "comparator": "Focus on how this product stands out compared to alternative options.",
        "combined": "Focus on combining style suitability, aesthetics, value for money, and price fit into one holistic recommendation."
    }

    role_context = role_descriptions.get(
        role.lower(),
        "Focus on general suitability and fit for the user's needs."
    )

    prompt = (
        f"You are a {role} advisor. {role_context}\n"
        f"Given this product: {product}\n"
        f"And what the user wants: {user_intent}\n\n"
        f"Write ONE short sentence (under 20 words) explaining why this product is a good fit. "
        f"Be specific and concrete, not generic. Do NOT use markdown, formatting, or quotation marks."
    )

    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-3.1-flash-lite")
        response = model.generate_content(prompt)

        text = response.text.strip() if response and response.text else FALLBACK_REASONING
        text = text.strip('"\'`')
        return text if text else FALLBACK_REASONING

    except Exception as e:
        err_msg = str(e).lower()
        if "429" in err_msg or "quota" in err_msg or "rate limit" in err_msg or "resource_exhausted" in err_msg:
            print(f"Gemini Rate Limit Hit (429). Circuit-breaker activated for remaining calls.")
            _is_rate_limited = True
        else:
            print(f"Error calling Gemini API: {e}")
        return FALLBACK_REASONING


def generate_all_reasonings(top_pick: dict, alternatives: list, user_intent: dict) -> dict:
    """
    Generate reasoning statements for all products (Top Pick + Alternatives) in one single Gemini call.
    Returns a dict structure matching the expected format.
    """
    global _is_rate_limited

    fallback_result = {
        "top_pick": {
            "stylist_reasoning": FALLBACK_REASONING,
            "budget_reasoning": FALLBACK_REASONING,
            "comparator_reasoning": FALLBACK_REASONING
        },
        "alternatives": [
            {"id": alt.get("id"), "reasoning": FALLBACK_REASONING}
            for alt in alternatives
        ]
    }

    if _is_rate_limited:
        return fallback_result

    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("Warning: GEMINI_API_KEY is missing from environment.")
        return fallback_result

    # Format the prompt
    top_pick_details = (
        f"ID: {top_pick.get('id')}\n"
        f"Name: {top_pick.get('name')}\n"
        f"Price: {top_pick.get('price')}\n"
        f"Description: {top_pick.get('description')}\n"
        f"Style Tags: {top_pick.get('style_tags')}"
    )

    alternatives_details = ""
    for idx, alt in enumerate(alternatives, start=1):
        alternatives_details += (
            f"Alternative {idx}:\n"
            f"- ID: {alt.get('id')}\n"
            f"- Name: {alt.get('name')}\n"
            f"- Price: {alt.get('price')}\n"
            f"- Description: {alt.get('description')}\n"
            f"- Style Tags: {alt.get('style_tags')}\n\n"
        )

    prompt = (
        f"You are a shopping assistant and fashion stylist expert. Your job is to generate highly specific reasoning explanations for a selected 'Top Pick' product and up to 4 'Alternative' products.\n\n"
        f"User Shopping Intent:\n{user_intent}\n\n"
        f"Selected Top Pick:\n{top_pick_details}\n\n"
        f"Alternative Options:\n{alternatives_details}"
        f"Instructions:\n"
        f"1. For the Top Pick, generate three separate reasonings:\n"
        f"   - 'stylist_reasoning': Focus on style suitability, aesthetics, and design fit.\n"
        f"   - 'budget_reasoning': Focus on value, pricing, and affordability.\n"
        f"   - 'comparator_reasoning': Focus on how this product stands out compared to the alternatives.\n"
        f"2. For each Alternative product, generate a single 'reasoning' focusing on overall fashion/price suitability.\n"
        f"3. All reasonings must be short, punchy (under 20 words each), and specific to the product features. Do not use generic placeholders.\n"
        f"4. Do NOT use markdown, quotes, formatting, or bullet points in the reasoning values.\n\n"
        f"You MUST return a JSON object matching this exact schema:\n"
        f"{{\n"
        f"  \"top_pick\": {{\n"
        f"    \"stylist_reasoning\": \"string\",\n"
        f"    \"budget_reasoning\": \"string\",\n"
        f"    \"comparator_reasoning\": \"string\"\n"
        f"  }},\n"
        f"  \"alternatives\": [\n"
        f"    {{\n"
        f"      \"id\": \"product_id_here\",\n"
        f"      \"reasoning\": \"string\"\n"
        f"    }}\n"
        f"  ]\n"
        f"}}\n"
    )

    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-3.1-flash-lite")
        
        # Use JSON mode structure response
        response = model.generate_content(
            prompt,
            generation_config={"response_mime_type": "application/json"}
        )

        content = response.text.strip() if response and response.text else None
        if not content:
            return fallback_result

        parsed = json.loads(content)
        
        # Validate structure and sanitize text values
        result = {
            "top_pick": {
                "stylist_reasoning": parsed.get("top_pick", {}).get("stylist_reasoning", FALLBACK_REASONING).strip('"\'` '),
                "budget_reasoning": parsed.get("top_pick", {}).get("budget_reasoning", FALLBACK_REASONING).strip('"\'` '),
                "comparator_reasoning": parsed.get("top_pick", {}).get("comparator_reasoning", FALLBACK_REASONING).strip('"\'` ')
            },
            "alternatives": []
        }

        # Match back by ID or index fallback
        parsed_alts = parsed.get("alternatives", [])
        for i, alt in enumerate(alternatives):
            alt_id = alt.get("id")
            # Try finding by ID first
            found_reasoning = None
            for p_alt in parsed_alts:
                # Compare stringified IDs to handle type mismatch
                if str(p_alt.get("id")) == str(alt_id):
                    found_reasoning = p_alt.get("reasoning")
                    break
            
            # Index fallback if ID matching failed
            if not found_reasoning and i < len(parsed_alts):
                found_reasoning = parsed_alts[i].get("reasoning")
            
            result["alternatives"].append({
                "id": alt_id,
                "reasoning": (found_reasoning or FALLBACK_REASONING).strip('"\'` ')
            })

        return result

    except Exception as e:
        err_msg = str(e).lower()
        if "429" in err_msg or "quota" in err_msg or "rate limit" in err_msg or "resource_exhausted" in err_msg:
            print(f"Gemini Rate Limit Hit (429). Circuit-breaker activated for remaining calls.")
            _is_rate_limited = True
        else:
            print(f"Error calling Gemini API for batched reasoning: {e}")
        return fallback_result
