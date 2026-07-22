import json
from graph.workflow import run_query_workflow


def print_item(product: dict, label: str):
    if not product:
        print(f"{label}: None")
        return

    print(f"[{label}]")
    print(f"  ID: {product.get('id')} | Name: {product.get('name')}")
    print(f"  Badge: {product.get('badge')} | Price: {product.get('price')} | Image URL: {product.get('image_url')}")
    print(f"  Scores -> Style: {product.get('style_score')} | Budget: {product.get('budget_score')} | Combined: {product.get('combined_score')}")
    print(f"  Stylist Reasoning: {product.get('stylist_reasoning')}")
    print(f"  Budget Reasoning:  {product.get('budget_reasoning')}")
    print(f"  Comparator Reason: {product.get('comparator_reasoning')}")
    print("-" * 60)


def main():
    test_query = "office wear, budget 5000, minimal style"
    print("=" * 60)
    print(f"Testing LangGraph Query Workflow: \"{test_query}\"")
    print("=" * 60)

    result = run_query_workflow(test_query)

    print("\nParsed Intent:")
    print(json.dumps(result.get("intent"), indent=2))
    print("\nBroadened Fallback Triggered:", result.get("broadened"))
    print("Error:", result.get("error"))

    print("\n" + "=" * 60)
    print("WORKFLOW FINAL OUTPUT:")
    print("=" * 60)

    top_pick = result.get("top_pick")
    print_item(top_pick, "TOP PICK")

    alternatives = result.get("alternatives", [])
    print(f"ALTERNATIVES ({len(alternatives)}):")
    for idx, alt in enumerate(alternatives, 1):
        print_item(alt, f"ALTERNATIVE {idx}")


if __name__ == "__main__":
    main()
