import sys
from unittest.mock import MagicMock

# Mock OTLPSpanExporter to bypass loading the blocked grpc DLL (Windows AppControl restriction)
sys.modules['opentelemetry.exporter.otlp.proto.grpc.trace_exporter'] = MagicMock()

import os
import chromadb
from sentence_transformers import SentenceTransformer

class VectorStore:
    """
    Wrapper around ChromaDB for storing and querying product embeddings.
    """
    def __init__(self):
        # Resolve persistent ChromaDB store path relative to this file
        current_dir = os.path.dirname(os.path.abspath(__file__))
        chroma_path = os.path.join(current_dir, "chroma_store")
        
        # Load ChromaDB client and collection
        self.client = chromadb.PersistentClient(path=chroma_path)
        self.collection = self.client.get_or_create_collection(name="products")
        
        # Load embedding model
        self.model = SentenceTransformer('all-MiniLM-L6-v2')

    def query(self, text: str, top_k: int = 10):
        """
        Embeds the query text and retrieves the top_k most similar products
        from the persistent vector store.
        
        Args:
            text (str): Query string (e.g. user prompt or style search).
            top_k (int): Number of matches to return.
            
        Returns:
            list: List of product metadata dictionaries with their similarity scores.
        """
        if not text or not text.strip():
            return []
            
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
                # Convert L2 distance (Chroma default) to a normalized similarity score
                similarity_score = 1.0 / (1.0 + distance)
                
                formatted_results.append({
                    "id": metadata.get("id"),
                    "name": metadata.get("name"),
                    "price": metadata.get("price"),
                    "image_url": metadata.get("image_url"),
                    "score": similarity_score
                })
                
        return formatted_results
