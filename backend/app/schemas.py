from pydantic import BaseModel, ConfigDict
from typing import List, Optional, Dict
from datetime import datetime, date

# Token schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

# User schemas
class UserBase(BaseModel):
    username: str
    persona: str

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class UserOut(UserBase):
    id: int
    xp: int
    level: int
    streak: int
    longest_streak: int
    carbon_score: float
    total_carbon_saved: float
    trees_saved: float
    last_active_date: Optional[date] = None

    model_config = ConfigDict(from_attributes=True)

class PersonaUpdate(BaseModel):
    persona: str

# Activity Log schemas
class ActivityLogCreate(BaseModel):
    activity_type: str  # commute, food, grocery, shopping, energy, travel, entertainment
    title: str
    original_action: str
    original_carbon: float
    recommended_alternative: str
    alternative_carbon: float
    carbon_saved: float
    cost_saved: float
    difficulty: str
    confidence_score: float

class ActivityLogOut(ActivityLogCreate):
    id: int
    user_id: int
    chosen: bool
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)

class ActivityChoice(BaseModel):
    chosen: bool

# Challenge schemas
class ChallengeOut(BaseModel):
    id: int
    user_id: int
    title: str
    description: str
    carbon_savings: float
    xp_reward: int
    time_estimate: str
    completed: bool
    created_date: date
    completed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

# Badge schemas
class BadgeOut(BaseModel):
    id: int
    name: str
    description: str
    icon: str
    awarded_at: datetime

    model_config = ConfigDict(from_attributes=True)

# Roadmap schemas
class RoadmapItemOut(BaseModel):
    id: int
    day_number: int
    title: str
    description: str
    category: str
    carbon_savings: float
    difficulty: str
    completed: bool
    completed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

# Simulation schemas
class SimulationCreate(BaseModel):
    name: str
    details: str
    annual_carbon_savings: float
    annual_cost_savings: float
    score_improvement: float

class SimulationOut(SimulationCreate):
    id: int
    user_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# Chat/Coach schemas
class CoachMessage(BaseModel):
    message: str

class CoachResponse(BaseModel):
    reply: str
    estimated_carbon_impact: Optional[str] = None
    reasoning: Optional[str] = None
    alternatives: Optional[List[str]] = None
    potential_savings: Optional[str] = None

# What-If Simulator schemas
class WhatIfRequest(BaseModel):
    action_type: str  # e.g., "cycle_commute", "meat_reduction", "ac_temp"
    frequency_weekly: int  # e.g., times per week
    details: Optional[str] = None

class WhatIfResponse(BaseModel):
    weekly_carbon_saved: float  # kg
    monthly_carbon_saved: float  # kg
    annual_carbon_saved: float  # kg
    annual_cost_saved: float  # USD
    score_improvement: float  # scale of 0-100 improvement

# Dashboard Stats schema
class DashboardStats(BaseModel):
    user: UserOut
    recent_activities: List[ActivityLogOut]
    badges: List[BadgeOut]
    daily_challenges: List[ChallengeOut]
    weekly_missions: List[Dict]
    carbon_savings_by_category: Dict[str, float]
    habit_insights: List[str]
    leaderboard: List[Dict]
