import json
import logging
import time
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from auth.jwt_handler import get_current_user
from db.database import get_db
from db.models import User, Query, Recommendation
from graph.workflow import run_query_workflow

logger = logging.getLogger(__name__)

router = APIRouter()


class QueryRequest(BaseModel):
    query_text: str


class QueryResponse(BaseModel):
    top_pick: Optional[Dict[str, Any]] = None
    alternatives: List[Dict[str, Any]] = []
    intent: Dict[str, Any] = {}
    broadened: bool = False


@router.post("", response_model=QueryResponse)
@router.post("/", response_model=QueryResponse, include_in_schema=False)
def execute_shopping_query(
    request: QueryRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Executes the AI Shopping Concierge LangGraph workflow for authenticated user queries
    and persists search history.
    """
    if not request.query_text or not request.query_text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="query_text cannot be empty."
        )

    start_time = time.time()
    result = run_query_workflow(request.query_text)
    elapsed = time.time() - start_time

    print(f"[Query API] Processed query for User '{current_user.email}' in {elapsed:.2f}s")

    if result.get("error"):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Workflow execution failed: {result['error']}"
        )

    # Persist query and recommendations to database history asynchronously/safely
    try:
        intent_data = result.get("intent", {})
        intent_json_str = json.dumps(intent_data) if intent_data else "{}"

        new_query = Query(
            user_id=current_user.id,
            query_text=request.query_text,
            intent_json=intent_json_str,
            broadened=bool(result.get("broadened", False))
        )
        db.add(new_query)
        db.flush()  # Assigns new_query.id

        recommendations_to_add = []
        top_pick = result.get("top_pick")
        if top_pick and isinstance(top_pick, dict) and "id" in top_pick:
            reasoning_text = (
                top_pick.get("comparator_reasoning") or 
                top_pick.get("stylist_reasoning") or 
                top_pick.get("budget_reasoning") or 
                top_pick.get("reasoning", "")
            )
            rec_top = Recommendation(
                query_id=new_query.id,
                product_id=top_pick["id"],
                rank_position=0,
                badge=top_pick.get("badge", "Top pick"),
                reasoning=reasoning_text,
                style_score=top_pick.get("style_score"),
                budget_score=top_pick.get("budget_score"),
                combined_score=top_pick.get("combined_score")
            )
            recommendations_to_add.append(rec_top)

        alternatives = result.get("alternatives", [])
        for rank, alt in enumerate(alternatives, start=1):
            if alt and isinstance(alt, dict) and "id" in alt:
                reasoning_text = (
                    alt.get("comparator_reasoning") or 
                    alt.get("stylist_reasoning") or 
                    alt.get("budget_reasoning") or 
                    alt.get("reasoning", "")
                )
                rec_alt = Recommendation(
                    query_id=new_query.id,
                    product_id=alt["id"],
                    rank_position=rank,
                    badge=alt.get("badge", "Style match"),
                    reasoning=reasoning_text,
                    style_score=alt.get("style_score"),
                    budget_score=alt.get("budget_score"),
                    combined_score=alt.get("combined_score")
                )
                recommendations_to_add.append(rec_alt)

        if recommendations_to_add:
            db.add_all(recommendations_to_add)
        db.commit()
    except Exception as e:
        db.rollback()
        logger.error(f"[Query API] Failed to save query history: {e}")

    return QueryResponse(
        top_pick=result.get("top_pick"),
        alternatives=result.get("alternatives", []),
        intent=result.get("intent", {}),
        broadened=result.get("broadened", False)
    )

