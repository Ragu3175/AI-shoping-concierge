import json
import os
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

DEFAULT_INTENT = {
    "budget_max": None,
    "budget_min": None,
    "category": None,
    "style_tags": [],
    "occasion": None,
    "gender": None,
    "color": None,
    "extra_keywords": []
}

SYSTEM_PROMPT = """You are a shopping intent extractor. Analyze the user query and extract structured shopping preferences.
You MUST output valid JSON matching this exact schema:
{
  "budget_max": integer or null,
  "budget_min": integer or null,
  "category": string or null (e.g. "topwear", "footwear", "bottomwear", "accessories"),
  "style_tags": list of strings (e.g. ["casual", "minimal", "summer"]),
  "occasion": string or null (e.g. "office", "gift", "casual", "party"),
  "gender": string or null (e.g. "Men", "Women", "Unisex", "Kids", "Boys", "Girls"),
  "color": string or null (e.g. "white", "black", "navy blue", "red", "blue", "yellow", "teal"),
  "extra_keywords": list of strings (e.g. descriptive terms, fabrics, cuts, or brand names not captured elsewhere, e.g. ["vintage", "oversized", "denim", "cotton"])
}

Do not include any explanation or markdown formatting outside the JSON object.

Examples:
Query: "office wear, budget 5000, minimal style"
Output:
{
  "budget_max": 5000,
  "budget_min": null,
  "category": null,
  "style_tags": ["minimal"],
  "occasion": "office",
  "gender": null,
  "color": null,
  "extra_keywords": []
}

Query: "casual summer sneakers for men under 3000"
Output:
{
  "budget_max": 3000,
  "budget_min": null,
  "category": "footwear",
  "style_tags": ["casual", "summer"],
  "occasion": "casual",
  "gender": "Men",
  "color": null,
  "extra_keywords": []
}

Query: "vintage oversized denim jacket under 3000"
Output:
{
  "budget_max": 3000,
  "budget_min": null,
  "category": "topwear",
  "style_tags": [],
  "occasion": "casual",
  "gender": null,
  "color": null,
  "extra_keywords": ["vintage", "oversized", "denim"]
}
"""


def parse_query_intent(query_text: str) -> dict:
    """Extract structured shopping intent from raw query text using Groq llama-3.1-8b-instant."""
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        print("Warning: GROQ_API_KEY is missing from environment.")
        return DEFAULT_INTENT.copy()

    try:
        client = Groq(api_key=api_key)
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": query_text}
            ],
            response_format={"type": "json_object"}
        )
        content = response.choices[0].message.content
        parsed = json.loads(content)

        # Sanitize/ensure missing fields default correctly
        result = DEFAULT_INTENT.copy()
        if isinstance(parsed, dict):
            for key in result:
                if key in parsed:
                    result[key] = parsed[key]
            # Ensure list fields default correctly
            if not isinstance(result["style_tags"], list):
                result["style_tags"] = [] if result["style_tags"] is None else [str(result["style_tags"])]
            if not isinstance(result["extra_keywords"], list):
                result["extra_keywords"] = [] if result["extra_keywords"] is None else [str(result["extra_keywords"])]
        return result

    except Exception as e:
        print(f"Error calling Groq API: {e}")
        return DEFAULT_INTENT.copy()
