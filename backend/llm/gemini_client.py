import os
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
