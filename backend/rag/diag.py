import json
from rag.retriever import retrieve_candidates, parse_query_intent, matches_color
from rag.vector_store import VectorStore


def run_diagnostics():
    store = VectorStore()

    # Diagnostic 1: Collection count
    print("=" * 70)
    print("DIAGNOSTIC 1: Chroma Collection Count")
    print("Count:", store.collection.count())
    print("=" * 70)

    # Diagnostic 3 & 4: Trace queries
    queries = ["white pants under 3k", "denim jacket", "office wear under 5k", "casual pants"]

    for q in queries:
        print("\n" + "=" * 70)
        print("DIAGNOSTIC TRACE FOR QUERY:", q)
        print("=" * 70)

        intent = parse_query_intent(q)
        print("Groq Intent:", json.dumps(intent, indent=2))

        # 1. Raw Chroma query (top_k=10)
        raw_top10 = store.query(q, top_k=10)
        print(f"\nRaw Chroma query (top_k=10) returned {len(raw_top10)} items:")
        for idx, item in enumerate(raw_top10, 1):
            print(f"  {idx}. ID: {item.get('id')} | Name: {item.get('name')} | Cat: {item.get('category')} | Sub: {item.get('subcategory')} | Price: {item.get('price')}")

        # 2. Run retrieve_candidates
        retrieval_res = retrieve_candidates(q)
        broadened = retrieval_res.get("broadened")
        candidates = retrieval_res.get("candidates", [])

        print(f"\nretrieve_candidates final output:")
        print(f"  Broadened triggered: {broadened}")
        print(f"  Final candidate count: {len(candidates)}")
        for idx, item in enumerate(candidates, 1):
            color_match = matches_color(item, intent.get("color", "")) if intent.get("color") else "N/A"
            print(f"  {idx}. ID: {item.get('id')} | Name: {item.get('name')} | Price: {item.get('price')} | Cat: {item.get('category')} | ColorMatch({intent.get('color')}): {color_match}")


if __name__ == "__main__":
    run_diagnostics()
