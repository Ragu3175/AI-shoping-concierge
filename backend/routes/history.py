import json
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from auth.jwt_handler import get_current_user
from db.database import get_db
from db.models import User, Query, Recommendation, Product

router = APIRouter()


class TopPickSummary(BaseModel):
    name: str
    price: int
    image_url: Optional[str] = None
    badge: Optional[str] = None


class HistoryItemResponse(BaseModel):
    id: int
    query_text: str
    created_at: Optional[str] = None
    top_pick: Optional[TopPickSummary] = None


@router.get("", response_model=List[HistoryItemResponse])
@router.get("/", response_model=List[HistoryItemResponse], include_in_schema=False)
def get_user_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Fetches the last 20 search queries for the current user with top pick summaries.
    """
    queries = (
        db.query(Query)
        .filter(Query.user_id == current_user.id)
        .order_by(Query.created_at.desc())
        .limit(20)
        .all()
    )

    result = []
    for q in queries:
        top_rec = (
            db.query(Recommendation)
            .filter(Recommendation.query_id == q.id, Recommendation.rank_position == 0)
            .first()
        )
        
        top_pick_summary = None
        if top_rec:
            prod = db.query(Product).filter(Product.id == top_rec.product_id).first()
            if prod:
                top_pick_summary = {
                    "name": prod.name,
                    "price": prod.price,
                    "image_url": prod.image_url,
                    "badge": top_rec.badge or "Top pick"
                }

        result.append({
            "id": q.id,
            "query_text": q.query_text,
            "created_at": q.created_at.isoformat() if q.created_at else None,
            "top_pick": top_pick_summary
        })

    return result


@router.get("/{query_id}")
def get_history_detail(
    query_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Fetches full query details and product recommendations for a specific historical search.
    """
    query_record = (
        db.query(Query)
        .filter(Query.id == query_id, Query.user_id == current_user.id)
        .first()
    )
    if not query_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="History item not found or access denied."
        )

    recommendations = (
        db.query(Recommendation)
        .filter(Recommendation.query_id == query_record.id)
        .order_by(Recommendation.rank_position.asc())
        .all()
    )

    top_pick_dict = None
    alternatives_list = []

    for rec in recommendations:
        prod = db.query(Product).filter(Product.id == rec.product_id).first()
        if not prod:
            continue

        prod_data = {
            "id": prod.id,
            "name": prod.name,
            "category": prod.category,
            "subcategory": prod.subcategory,
            "price": prod.price,
            "style_tags": prod.style_tags,
            "description": prod.description,
            "image_url": prod.image_url,
            "embedding_id": prod.embedding_id,
            "badge": rec.badge,
            "comparator_reasoning": rec.reasoning,
            "stylist_reasoning": rec.reasoning,
            "budget_reasoning": rec.reasoning,
            "style_score": rec.style_score,
            "budget_score": rec.budget_score,
            "combined_score": rec.combined_score
        }

        if rec.rank_position == 0:
            top_pick_dict = prod_data
        else:
            alternatives_list.append(prod_data)

    intent_dict = {}
    if query_record.intent_json:
        try:
            intent_dict = json.loads(query_record.intent_json)
        except Exception:
            intent_dict = {}

    return {
        "id": query_record.id,
        "query_text": query_record.query_text,
        "top_pick": top_pick_dict,
        "alternatives": alternatives_list,
        "intent": intent_dict,
        "broadened": query_record.broadened
    }
