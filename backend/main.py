from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from db.database import engine, Base
from auth.routes import router as auth_router
from profiles.routes import router as profile_router

# Initialize database tables on startup
Base.metadata.create_all(bind=engine)

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

# Mount uploads static folder to serve profile pictures
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Health check route
@app.get("/")
def health_check():
    return {"status": "ok"}
