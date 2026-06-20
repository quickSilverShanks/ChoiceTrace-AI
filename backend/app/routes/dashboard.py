from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Any

from app.database import get_db
from app.routes.auth import get_current_user
import app.crud as crud
import app.schemas as schemas
import app.ai as ai

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

@router.get("/stats", response_model=schemas.DashboardStats)
def get_dashboard_statistics(
    current_user: schemas.UserOut = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Fetch recent activity logs
    recent_activities_db = db.query(crud.ActivityLog).filter(
        crud.ActivityLog.user_id == current_user.id
    ).order_by(crud.ActivityLog.timestamp.desc()).limit(5).all()
    
    recent_activities = [schemas.ActivityLogOut.model_validate(act) for act in recent_activities_db]

    # Fetch badges
    badges_db = db.query(crud.Badge).filter(
        crud.Badge.user_id == current_user.id
    ).order_by(crud.Badge.awarded_at.desc()).all()
    
    badges = [schemas.BadgeOut.model_validate(b) for b in badges_db]

    # Fetch daily challenges
    daily_challenges_db = db.query(crud.Challenge).filter(
        crud.Challenge.user_id == current_user.id
    ).all()
    if not daily_challenges_db:
        crud.initialize_user_challenges(db, current_user.id)
        daily_challenges_db = db.query(crud.Challenge).filter(
            crud.Challenge.user_id == current_user.id
        ).all()
        
    daily_challenges = [schemas.ChallengeOut.model_validate(c) for c in daily_challenges_db]

    # Mock weekly missions
    weekly_missions = [
        {
            "id": 1,
            "title": "Public Transport Champion",
            "description": "Log 3 Commute actions choosing transit",
            "progress": min(len([a for a in recent_activities_db if a.activity_type == "commute" and a.chosen]), 3),
            "target": 3,
            "xp_reward": 150,
            "completed": len([a for a in recent_activities_db if a.activity_type == "commute" and a.chosen]) >= 3
        },
        {
            "id": 2,
            "title": "Low-Carbon Dining",
            "description": "Save 10 kg of CO2 from food alternatives",
            "progress": int(sum([a.carbon_saved for a in recent_activities_db if a.activity_type == "food" and a.chosen])),
            "target": 10,
            "xp_reward": 200,
            "completed": sum([a.carbon_saved for a in recent_activities_db if a.activity_type == "food" and a.chosen]) >= 10.0
        }
    ]

    # Calculate carbon savings by category
    savings_by_cat = {
        "commute": 0.0,
        "food": 0.0,
        "grocery": 0.0,
        "shopping": 0.0,
        "energy": 0.0,
        "travel": 0.0,
        "entertainment": 0.0
    }
    
    category_sums = db.query(
        crud.ActivityLog.activity_type,
        func.sum(crud.ActivityLog.carbon_saved)
    ).filter(
        crud.ActivityLog.user_id == current_user.id,
        crud.ActivityLog.chosen == True
    ).group_by(crud.ActivityLog.activity_type).all()

    for cat, val in category_sums:
        if cat in savings_by_cat:
            savings_by_cat[cat] = float(round(val, 1))

    # Also add savings from completed challenges
    completed_challenge_sum = db.query(func.sum(crud.Challenge.carbon_savings)).filter(
        crud.Challenge.user_id == current_user.id,
        crud.Challenge.completed == True
    ).scalar() or 0.0
    
    # Put challenge savings in a general category or mix with energy/food
    savings_by_cat["energy"] += float(round(completed_challenge_sum, 1))

    # Generate Habit Insights (Gemini / Fallback Mock)
    activity_dicts = [
        {"activity_type": a.activity_type, "chosen": a.chosen, "carbon_saved": a.carbon_saved}
        for a in recent_activities_db
    ]
    habit_insights = ai.get_habit_insights(activity_dicts, current_user.persona)

    # Leaderboard calculation
    # Fetch all users, rank them, place mock users in reasonable slots to make it exciting
    all_users = crud.get_all_users(db)
    
    peer_users = [
        {"username": "EcoNudgeQueen", "level": 12, "xp": 1150, "carbon_score": 96.0, "is_mock": True},
        {"username": "SolarParent", "level": 8, "xp": 780, "carbon_score": 88.0, "is_mock": True},
        {"username": "MetroCommuter", "level": 6, "xp": 540, "carbon_score": 82.0, "is_mock": True},
        {"username": "BikeToClass", "level": 4, "xp": 390, "carbon_score": 79.0, "is_mock": True},
        {"username": "ZeroWaster", "level": 3, "xp": 220, "carbon_score": 76.0, "is_mock": True}
    ]

    # Add active user
    active_user_data = {
        "username": current_user.username + " (You)",
        "level": current_user.level,
        "xp": current_user.xp + (current_user.level * 100 * (current_user.level - 1) // 2),  # Cumulative XP approximation
        "carbon_score": current_user.carbon_score,
        "is_mock": False
    }
    peer_users.append(active_user_data)
    
    # Sort leaderboard
    leaderboard = sorted(peer_users, key=lambda x: x["xp"], reverse=True)
    # Add rank index
    for idx, user_entry in enumerate(leaderboard):
        user_entry["rank"] = idx + 1

    return schemas.DashboardStats(
        user=schemas.UserOut.model_validate(current_user),
        recent_activities=recent_activities,
        badges=badges,
        daily_challenges=daily_challenges,
        weekly_missions=weekly_missions,
        carbon_savings_by_category=savings_by_cat,
        habit_insights=habit_insights,
        leaderboard=leaderboard
    )
