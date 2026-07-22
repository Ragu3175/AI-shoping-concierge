from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from db.database import engine, Base
from auth.routes import router as auth_router
from profiles.routes import router as profile_router
from routes.query import router as query_router
from routes.history import router as history_router

# Initialize database tables on startup
Base.metadata.create_all(bind=engine)

# Auto-seed database if empty (required for Render deployment since app.db is ignored in git)
from sqlalchemy import func
from db.database import SessionLocal
from db.models import Product
from data.seed_products import seed_database

db = SessionLocal()
try:
    product_count = db.query(func.count(Product.id)).scalar()
    if product_count == 0:
        print("[Startup] Database is empty. Running auto-seed...")
        seed_database()
        print("[Startup] Auto-seed completed successfully.")
    else:
        print(f"[Startup] Database already has {product_count} products. Skipping seeding.")
except Exception as e:
    print(f"[Startup] Auto-seed check failed: {e}")
finally:
    db.close()

app = FastAPI(
    title="AI Shopping Concierge API",
    description="Backend API service for AI Shopping Concierge",
    version="1.0.0"
)

# Configure CORS middleware (allow all origins for dev environment)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"])
app.include_router(profile_router, prefix="/api/profile", tags=["Profile"])
app.include_router(query_router, prefix="/api/query", tags=["AI Query"])
app.include_router(history_router, prefix="/api/history", tags=["Search History"])

# Mount uploads static folder to serve profile pictures
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Health check route
@app.get("/")
def health_check():
    return {"status": "ok"}
