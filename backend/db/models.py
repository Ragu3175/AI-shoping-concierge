from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    profile_picture_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # One-to-one relationship with StyleProfile
    style_profile = relationship("StyleProfile", uselist=False, back_populates="user", cascade="all, delete-orphan")


class StyleProfile(Base):
    __tablename__ = "style_profiles"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    preferred_styles = Column(Text, default="", nullable=False)  # Comma-separated tags
    budget_min = Column(Integer, nullable=True)
    budget_max = Column(Integer, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Reference back to the User
    user = relationship("User", back_populates="style_profile")


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    category = Column(String(255), nullable=False)
    subcategory = Column(String(255), nullable=True)
    price = Column(Integer, nullable=False)
    style_tags = Column(String(500), nullable=False)  # Comma-separated tags
    description = Column(Text, nullable=False)
    image_url = Column(String(500), nullable=True)
    embedding_id = Column(String(255), nullable=True)

