import os
import time
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from db.database import get_db
from db.models import User, StyleProfile
from auth.jwt_handler import get_current_user
from .schemas import ProfileUpdate, ProfileOut

router = APIRouter()

UPLOAD_DIR = "uploads/profile_pictures"

@router.get("", response_model=ProfileOut)
def get_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Fetch current user's style profile and profile picture URL."""
    db_profile = db.query(StyleProfile).filter(StyleProfile.user_id == current_user.id).first()
    if not db_profile:
        # Fallback profile creation if not already created
        db_profile = StyleProfile(user_id=current_user.id, preferred_styles="")
        db.add(db_profile)
        db.commit()
        db.refresh(db_profile)
    
    # Parse preferred styles comma-separated string to list
    preferred_styles_list = [s.strip() for s in db_profile.preferred_styles.split(",") if s.strip()] if db_profile.preferred_styles else []
    
    return {
        "preferred_styles": preferred_styles_list,
        "budget_min": db_profile.budget_min,
        "budget_max": db_profile.budget_max,
        "profile_picture_url": current_user.profile_picture_url
    }

@router.put("", response_model=ProfileOut)
def update_profile(profile_in: ProfileUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Update current user's style preferences and budget margins."""
    db_profile = db.query(StyleProfile).filter(StyleProfile.user_id == current_user.id).first()
    if not db_profile:
        db_profile = StyleProfile(user_id=current_user.id)
        db.add(db_profile)
    
    # Convert preferred styles list to comma-separated string
    db_profile.preferred_styles = ",".join([s.strip() for s in profile_in.preferred_styles if s.strip()])
    db_profile.budget_min = profile_in.budget_min
    db_profile.budget_max = profile_in.budget_max
    
    db.commit()
    db.refresh(db_profile)
    
    preferred_styles_list = [s.strip() for s in db_profile.preferred_styles.split(",") if s.strip()] if db_profile.preferred_styles else []
    
    return {
        "preferred_styles": preferred_styles_list,
        "budget_min": db_profile.budget_min,
        "budget_max": db_profile.budget_max,
        "profile_picture_url": current_user.profile_picture_url
    }

@router.post("/picture")
def upload_profile_picture(file: UploadFile = File(...), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Accept user profile picture upload, store it locally, and register the static URL."""
    # Ensure upload directory exists
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    
    # Extract file extension
    filename, ext = os.path.splitext(file.filename)
    if not ext:
        ext = ".jpg"
        
    # Validate extension type
    allowed_extensions = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
    if ext.lower() not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid image format. Allowed types: JPG, JPEG, PNG, WEBP, GIF"
        )
    
    # Generate unique filename using user id and timestamp
    unique_filename = f"user_{current_user.id}_{int(time.time())}{ext.lower()}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    # Save the file
    try:
        with open(file_path, "wb") as buffer:
            content = file.file.read()
            buffer.write(content)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not save file: {str(e)}"
        )
    
    # Update profile_picture_url in user record (served statically from /uploads)
    profile_pic_url = f"/uploads/profile_pictures/{unique_filename}"
    current_user.profile_picture_url = profile_pic_url
    db.commit()
    
    return {"profile_picture_url": profile_pic_url}
