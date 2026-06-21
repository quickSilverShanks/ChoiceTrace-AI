from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.routes.auth import get_current_user
import app.crud as crud
import app.schemas as schemas

router = APIRouter(prefix="/roadmap", tags=["roadmap"])

@router.get("", response_model=List[schemas.RoadmapItemOut])
def get_my_roadmap(
    current_user: schemas.UserOut = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    items = crud.get_user_roadmap(db, current_user.id)
    if not items:
        crud.initialize_user_roadmap(db, current_user.id)
        items = crud.get_user_roadmap(db, current_user.id)
    return items

@router.post("/{item_id}/complete", response_model=schemas.RoadmapItemOut)
def complete_roadmap_step(
    item_id: int,
    current_user: schemas.UserOut = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    item = db.query(crud.RoadmapItem).filter(
        crud.RoadmapItem.id == item_id,
        crud.RoadmapItem.user_id == current_user.id
    ).first()
    
    if not item:
        raise HTTPException(status_code=404, detail="Roadmap item not found")
        
    if item.completed:
        raise HTTPException(status_code=400, detail="Roadmap step already completed")
        
    completed = crud.complete_roadmap_item(db, item_id, current_user.id)
    return completed
