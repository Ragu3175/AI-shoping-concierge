import json
from llm.groq_client import parse_query_intent
from llm.gemini_client import generate_reasoning


def main():
    print("========================================")
    print("1. Testing Groq Query Intent Parsing")
    print("========================================")
    test_query = "office wear, budget 5000, minimal style"
    print(f"Input Query: \"{test_query}\"")
    parsed_intent = parse_query_intent(test_query)
    print("Extracted Intent JSON:")
    print(json.dumps(parsed_intent, indent=2))

    print("\n========================================")
    print("2. Testing Gemini Reasoning Generation")
    print("========================================")
    dummy_product = {
        "name": "Classic Oxford Cotton Shirt",
        "category": "topwear",
        "price": 3499,
        "style_tags": ["minimal", "classic", "clean"],
        "description": "Slim fit 100% organic cotton oxford shirt suitable for formal and office settings."
    }

    roles = ["stylist", "budget", "comparator"]

    print(f"Product: {dummy_product['name']} (Price: {dummy_product['price']})")
    print("User Intent:", parsed_intent)
    print("-" * 40)

    for role in roles:
        reasoning = generate_reasoning(dummy_product, parsed_intent, role)
        print(f"[{role.capitalize()} Role Reasoning]:")
        print(f"  {reasoning}\n")


if __name__ == "__main__":
    main()
