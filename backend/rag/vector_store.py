import sys
from unittest.mock import MagicMock

# Mock OTLPSpanExporter to bypass loading the blocked grpc DLL (Windows AppControl restriction)
sys.modules['opentelemetry.exporter.otlp.proto.grpc.trace_exporter'] = MagicMock()

import os
import chromadb


class VectorStore:
    """
    Wrapper around ChromaDB for storing and querying product embeddings.
    """
    def __init__(self):
        # Resolve persistent ChromaDB store path relative to this file
        current_dir = os.path.dirname(os.path.abspath(__file__))
        chroma_path = os.path.join(current_dir, "chroma_store")
        
        # Load ChromaDB client and collection
        from chromadb.config import Settings
        self.client = chromadb.PersistentClient(
            path=chroma_path,
            settings=Settings(anonymized_telemetry=False)
        )
        self.collection = self.client.get_or_create_collection(
            name="products",
            metadata={"hnsw:space": "cosine"}
        )
        
        # Load embedding model lazily during query execution to speed up app startup
        self.model = None

    def query(self, text: str, top_k: int = 10):
        """
        Embeds the query text and retrieves the top_k most similar products
        from the persistent vector store.
        
        Args:
            text (str): Query string (e.g. user prompt or style search).
            top_k (int): Number of matches to return.
            
        Returns:
            list: List of product metadata dictionaries with similarity scores and distances.
        """
        if not text or not text.strip():
            return []
            
        if self.model is None:
            from sentence_transformers import SentenceTransformer
            self.model = SentenceTransformer('all-MiniLM-L6-v2')
            
        # Generate embedding for the query
        query_embedding = self.model.encode(text).tolist()
        
        # Perform query in ChromaDB
        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k
        )
        
        formatted_results = []
        if results and results.get("ids") and len(results["ids"]) > 0:
            ids = results["ids"][0]
            metadatas = results["metadatas"][0]
            distances = results["distances"][0]
            
            for doc_id, metadata, distance in zip(ids, metadatas, distances):
                # Cosine distance in Chroma: distance = 1 - cosine_similarity
                # Convert to Cosine Similarity score [0.0, 1.0]
                similarity_score = max(0.0, 1.0 - float(distance))
                
                # Parse style_tags if stored as string/list
                style_tags = metadata.get("style_tags", "")
                if isinstance(style_tags, str):
                    style_tags_list = [t.strip() for t in style_tags.split(",") if t.strip()]
                else:
                    style_tags_list = style_tags if isinstance(style_tags, list) else []

                formatted_results.append({
                    "id": metadata.get("id"),
                    "name": metadata.get("name"),
                    "price": metadata.get("price"),
                    "image_url": metadata.get("image_url"),
                    "category": metadata.get("category"),
                    "subcategory": metadata.get("subcategory", ""),
                    "style_tags": style_tags_list,
                    "description": metadata.get("description"),
                    "score": round(similarity_score, 4),
                    "distance": round(float(distance), 4)
                })
                
        return formatted_results
