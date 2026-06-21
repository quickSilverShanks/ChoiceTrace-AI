from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.routes.auth import get_current_user
import app.crud as crud
import app.schemas as schemas
import app.ai as ai

router = APIRouter(prefix="/activities", tags=["activities"])

@router.post("/nudge", response_model=schemas.ActivityLogOut)
def get_nudge_recommendation(
    activity_type: str = Query(..., description="commute, food, grocery, shopping, energy, travel, entertainment"),
    current_choice: str = Query(..., description="Describe what you are about to do, e.g., 'Drive 10km to office'"),
    details: Optional[str] = Query(None, description="Optional extra context"),
    current_user: schemas.UserOut = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Fetch recommendation from AI (Gemini or Mock)
    rec = ai.get_activity_recommendation(
        activity_type=activity_type,
        current_choice=current_choice,
        details_text=details,
        persona=current_user.persona
    )
    
    # Log this decision comparison in database (initially chosen = False)
    log_data = schemas.ActivityLogCreate(
        activity_type=activity_type,
        title=rec.get("title", f"Upcoming {activity_type}"),
        original_action=rec.get("original_action", current_choice),
        original_carbon=rec.get("original_carbon", 1.0),
        recommended_alternative=rec.get("recommended_alternative", "No specific alternative found"),
        alternative_carbon=rec.get("alternative_carbon", 0.5),
        carbon_saved=rec.get("carbon_saved", 0.5),
        cost_saved=rec.get("cost_saved", 0.0),
        difficulty=rec.get("difficulty", "Easy"),
        confidence_score=rec.get("confidence_score", 0.9)
    )
    
    logged_activity = crud.log_activity(db, current_user.id, log_data)
    return logged_activity

@router.post("/{activity_id}/choose", response_model=schemas.ActivityLogOut)
def record_user_choice(
    activity_id: int,
    choice: schemas.ActivityChoice,
    current_user: schemas.UserOut = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    updated_activity = crud.choose_alternative(
        db=db,
        activity_id=activity_id,
        chosen=choice.chosen,
        user_id=current_user.id
    )
    if not updated_activity:
        raise HTTPException(status_code=404, detail="Activity log not found")
    return updated_activity

@router.get("", response_model=List[schemas.ActivityLogOut])
def get_user_activities(
    current_user: schemas.UserOut = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(crud.ActivityLog).filter(
        crud.ActivityLog.user_id == current_user.id
    ).order_by(crud.ActivityLog.timestamp.desc()).all()
