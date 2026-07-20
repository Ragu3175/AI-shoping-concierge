from typing import List, Optional
from pydantic import BaseModel

class ProfileUpdate(BaseModel):
    preferred_styles: List[str]
    budget_min: Optional[int] = None
    budget_max: Optional[int] = None

class ProfileOut(BaseModel):
    preferred_styles: List[str]
    budget_min: Optional[int] = None
    budget_max: Optional[int] = None
    profile_picture_url: Optional[str] = None

    class Config:
        from_attributes = True
