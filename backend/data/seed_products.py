import os
import shutil
import random
import pandas as pd
from db.database import SessionLocal, engine
from db.models import Base, Product

def seed_database():
    # 1. Initialize database tables (ensuring 'products' table exists)
    print("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # Clear existing products to ensure clean, idempotent seed
        print("Clearing existing products in the database...")
        db.query(Product).delete()
        db.commit()
        
        csv_path = os.path.join("data", "raw", "styles.csv")
        if not os.path.exists(csv_path):
            print(f"styles.csv not found at {csv_path}. Attempting to seed from persistent ChromaDB store...")
            import chromadb
            current_dir = os.path.dirname(os.path.abspath(__file__))
            chroma_path = os.path.abspath(os.path.join(current_dir, "..", "rag", "chroma_store"))
            
            if not os.path.exists(chroma_path):
                print(f"Error: Chroma store path not found at {chroma_path}")
                return
                
            client = chromadb.PersistentClient(path=chroma_path)
            try:
                collection = client.get_collection(name="products")
                data = collection.get()
                metadatas = data.get("metadatas", [])
                if not metadatas:
                    print("Error: No metadatas found in Chroma collection 'products'")
                    return
                    
                seeded_count = 0
                for meta in metadatas:
                    product_id = int(meta["id"])
                    
                    product = Product(
                        id=product_id,
                        name=meta.get("name"),
                        category=meta.get("category"),
                        subcategory=meta.get("subcategory"),
                        price=int(meta.get("price")),
                        style_tags=meta.get("style_tags"),
                        description=meta.get("description"),
                        image_url=meta.get("image_url"),
                        embedding_id=str(product_id)
                    )
                    db.add(product)
                    seeded_count += 1
                    
                db.commit()
                print(f"Successfully seeded {seeded_count} products from ChromaDB into the database.")
                return
            except Exception as ex:
                print(f"Failed to seed from ChromaDB: {ex}")
                return
            
        print(f"Reading product metadata from {csv_path}...")
        df = pd.read_csv(csv_path, on_bad_lines='skip')
        print(f"Loaded {len(df)} total rows from CSV.")
        
        # 2. Clean data
        # Drop rows with missing critical fields (articleType, gender, id)
        df = df.dropna(subset=['articleType', 'gender', 'id'])
        # Drop duplicates on 'id'
        df = df.drop_duplicates(subset=['id'])
        print(f"After dropping duplicates and rows missing critical fields: {len(df)} rows.")
        
        # Ensure ID is treated as integer
        df['id'] = df['id'].astype(int)
        
        # 3. Filter only rows where image file actually exists
        def check_image_exists(row_id):
            img_path = os.path.join("data", "raw", "images", f"{row_id}.jpg")
            return os.path.exists(img_path)
            
        print("Filtering products by checking for matching image files...")
        df = df[df['id'].apply(check_image_exists)]
        print(f"Found {len(df)} products with matching raw images.")
        
        if len(df) == 0:
            print("Error: No products with matching images found. Seeding aborted.")
            return
            
        # 4. Sample 500 rows with fixed random state
        sample_size = min(500, len(df))
        df_sampled = df.sample(n=sample_size, random_state=42)
        print(f"Sampled {sample_size} products for seeding.")
        
        # Set fixed random seed for price generation
        random.seed(42)
        
        dest_dir = os.path.join("uploads", "product_images")
        os.makedirs(dest_dir, exist_ok=True)
        
        seeded_count = 0
        for _, row in df_sampled.iterrows():
            product_id = int(row['id'])
            
            # Copy image file
            src_img = os.path.join("data", "raw", "images", f"{product_id}.jpg")
            dest_img = os.path.join(dest_dir, f"{product_id}.jpg")
            try:
                shutil.copy2(src_img, dest_img)
            except Exception as e:
                print(f"Failed to copy image for product {product_id}: {e}")
                continue
                
            # Helper for category-based price generation
            article = str(row['articleType']).lower()
            subcat = str(row['subCategory']).lower() if pd.notna(row['subCategory']) else ""
            master = str(row['masterCategory']).lower() if pd.notna(row['masterCategory']) else ""
            
            if subcat == 'topwear' or 'shirt' in article or 'top' in article or 'tunic' in article or 'kurta' in article:
                price = random.randint(800, 3500)
            elif 'blazer' in article or 'jacket' in article or 'coat' in article or 'sweater' in article or 'sweatshirt' in article:
                price = random.randint(2000, 6000)
            elif master == 'footwear' or 'footwear' in subcat or 'shoe' in article or 'sandal' in article or 'slipper' in article or 'flip flop' in article or 'flats' in article or 'heels' in article:
                price = random.randint(1200, 4500)
            elif master == 'accessories' or 'bag' in subcat or 'bag' in article or 'wallet' in article or 'belt' in article or 'backpack' in article or 'clutch' in article or 'handbag' in article:
                price = random.randint(300, 2000)
            else:
                price = random.randint(500, 3000)
                
            # Derived style tags
            usage_val = str(row['usage']).strip() if pd.notna(row['usage']) else ""
            season_val = str(row['season']).strip() if pd.notna(row['season']) else ""
            article_val = str(row['articleType']).strip() if pd.notna(row['articleType']) else ""
            tags = [t for t in [usage_val, season_val, article_val] if t]
            style_tags = ", ".join(tags)
            
            # Auto-generated description
            base_colour = str(row['baseColour']).strip() if pd.notna(row['baseColour']) else "unknown colour"
            gender = str(row['gender']).strip()
            usage_desc = usage_val if usage_val else "general"
            description = f"A {base_colour} {row['articleType']} for {gender}, ideal for {usage_desc} wear."
            
            # Map to Product model
            product = Product(
                id=product_id,
                name=str(row['productDisplayName']) if pd.notna(row['productDisplayName']) else f"{row['articleType']} {product_id}",
                category=str(row['masterCategory']),
                subcategory=str(row['subCategory']) if pd.notna(row['subCategory']) else None,
                price=price,
                style_tags=style_tags,
                description=description,
                image_url=f"/uploads/product_images/{product_id}.jpg",
                embedding_id=None
            )
            
            db.add(product)
            seeded_count += 1
            
        db.commit()
        print(f"Seeded {seeded_count} products with images into the database")
        
    except Exception as e:
        db.rollback()
        print(f"An error occurred during database seeding: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
