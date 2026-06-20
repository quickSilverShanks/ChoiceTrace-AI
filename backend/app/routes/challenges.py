from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.routes.auth import get_current_user
import app.crud as crud
import app.schemas as schemas

router = APIRouter(prefix="/challenges", tags=["challenges"])

@router.get("/", response_model=List[schemas.ChallengeOut])
def get_my_challenges(
    current_user: schemas.UserOut = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    challenges = crud.get_user_challenges(db, current_user.id)
    # If user has no challenges, initialize them
    if not challenges:
        crud.initialize_user_challenges(db, current_user.id)
        challenges = crud.get_user_challenges(db, current_user.id)
    return challenges

@router.post("/{challenge_id}/complete", response_model=schemas.ChallengeOut)
def complete_user_challenge(
    challenge_id: int,
    current_user: schemas.UserOut = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    challenge = db.query(crud.Challenge).filter(
        crud.Challenge.id == challenge_id, 
        crud.Challenge.user_id == current_user.id
    ).first()
    
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")
        
    if challenge.completed:
        raise HTTPException(status_code=400, detail="Challenge already completed")
        
    completed = crud.complete_challenge(db, challenge_id, current_user.id)
    return completed
