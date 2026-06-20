from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Dict, Optional
from pydantic import BaseModel

from app.routes.auth import get_current_user
import app.schemas as schemas
import app.ai as ai

router = APIRouter(prefix="/coach", tags=["coach"])

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[Dict[str, str]]] = []

@router.post("/chat", response_model=schemas.CoachResponse)
def chat_with_coach(
    req: ChatRequest,
    current_user: schemas.UserOut = Depends(get_current_user)
):
    # Fetch response from AI Coach (Gemini API with Mock fallback)
    coach_data = ai.get_coach_response(
        user_message=req.message,
        chat_history=req.history,
        persona=current_user.persona
    )
    return schemas.CoachResponse(
        reply=coach_data.get("reply", "I'm here to help you make low-carbon decisions!"),
        estimated_carbon_impact=coach_data.get("estimated_carbon_impact"),
        reasoning=coach_data.get("reasoning"),
        alternatives=coach_data.get("alternatives"),
        potential_savings=coach_data.get("potential_savings")
    )
