import sys
from unittest.mock import MagicMock

# Mock OTLPSpanExporter to bypass loading the blocked grpc DLL (Windows AppControl restriction)
sys.modules['opentelemetry.exporter.otlp.proto.grpc.trace_exporter'] = MagicMock()

import os
import chromadb
from fastembed import TextEmbedding
from db.database import SessionLocal
from db.models import Product

def embed_catalog():
    # Setup persistent ChromaDB store path relative to this file
    current_dir = os.path.dirname(os.path.abspath(__file__))
    chroma_path = os.path.join(current_dir, "chroma_store")
    os.makedirs(chroma_path, exist_ok=True)
    
    db = SessionLocal()
    try:
        print("Fetching products from the database...")
        products = db.query(Product).all()
        if not products:
            print("No products found in the database. Please run the seeding script first.")
            return
            
        print(f"Found {len(products)} products. Loading fastembed TextEmbedding('all-MiniLM-L6-v2')...")
        model = TextEmbedding(model_name="sentence-transformers/all-MiniLM-L6-v2")
        
        from chromadb.config import Settings
        print(f"Initializing ChromaDB persistent client at {chroma_path}...")
        client = chromadb.PersistentClient(
            path=chroma_path,
            settings=Settings(anonymized_telemetry=False)
        )
        
        # Reset the collection if it exists to ensure a clean state
        collection_name = "products"
        try:
            client.delete_collection(name=collection_name)
            print(f"Deleted existing ChromaDB collection '{collection_name}' for clean start.")
        except Exception:
            pass
            
        collection = client.get_or_create_collection(
            name=collection_name,
            metadata={"hnsw:space": "cosine"}
        )
        
        print("Generating embeddings and indexing catalog...")
        batch_size = 50
        for start_idx in range(0, len(products), batch_size):
            batch_products = products[start_idx : start_idx + batch_size]
            
            ids = [str(p.id) for p in batch_products]
            # Combined text: {name}. {category}. {subcategory}. {style_tags}. {description}
            texts = [f"{p.name}. {p.category}. {p.subcategory or ''}. {p.style_tags}. {p.description}" for p in batch_products]
            metadatas = [
                {
                    "id": p.id,
                    "name": p.name,
                    "price": p.price,
                    "image_url": p.image_url or "",
                    "category": p.category or "",
                    "subcategory": p.subcategory or "",
                    "style_tags": p.style_tags or "",
                    "description": p.description or ""
                }
                for p in batch_products
            ]
            
            # Generate embeddings
            embeddings = [emb.tolist() for emb in model.embed(texts)]
            
            # Store in ChromaDB
            collection.add(
                ids=ids,
                embeddings=embeddings,
                metadatas=metadatas,
                documents=texts
            )
            
            # Update database records with embedding_id
            for p in batch_products:
                p.embedding_id = str(p.id)
                db.add(p)
            db.commit()
            
            print(f"Embedded and updated {start_idx + len(batch_products)}/{len(products)} products.")
            
        print("Successfully completed embedding pipeline!")
        
    except Exception as e:
        print(f"An error occurred during embedding: {e}")
        db.rollback()
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    embed_catalog()
