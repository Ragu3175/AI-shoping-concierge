import json
from rag.retriever import retrieve_candidates


def print_result(title: str, result: dict):
    print("=" * 60)
    print(title)
    print("=" * 60)
    print("Broadened Triggered:", result.get("broadened"))
    print("\nParsed Intent:")
    print(json.dumps(result.get("intent"), indent=2))
    print(f"\nCandidates Found ({len(result.get('candidates', []))}):")
    for idx, candidate in enumerate(result.get("candidates", []), 1):
        dist = candidate.get('distance', 'N/A')
        print(f"  {idx}. ID: {candidate.get('id')} | Name: {candidate.get('name')} | Cat: {candidate.get('category')} | Price: {candidate.get('price')} | Distance: {dist} | Score: {candidate.get('score'):.4f}")
    print("\n")


def main():
    # Test 1: Standard query
    query1 = "office wear, budget 5000, minimal style"
    result1 = retrieve_candidates(query1)
    print_result(f"Test 1 Query: \"{query1}\"", result1)

    # Test 2: Narrow/unusual query to test broadening fallback
    query2 = "neon pink wedding shoes under 200"
    result2 = retrieve_candidates(query2)
    print_result(f"Test 2 Query: \"{query2}\"", result2)


if __name__ == "__main__":
    main()
