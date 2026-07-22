from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean, Float
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
    queries = relationship("Query", back_populates="user", cascade="all, delete-orphan")


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


class Query(Base):
    __tablename__ = "queries"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    query_text = Column(String(500), nullable=False)
    intent_json = Column(Text, nullable=True)
    broadened = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="queries")
    recommendations = relationship("Recommendation", back_populates="query", cascade="all, delete-orphan")


class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    query_id = Column(Integer, ForeignKey("queries.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    rank_position = Column(Integer, nullable=False)  # 0 for top_pick, 1-4 for alternatives
    badge = Column(String(255), nullable=True)
    reasoning = Column(Text, nullable=True)
    style_score = Column(Float, nullable=True)
    budget_score = Column(Float, nullable=True)
    combined_score = Column(Float, nullable=True)

    query = relationship("Query", back_populates="recommendations")
    product = relationship("Product")


