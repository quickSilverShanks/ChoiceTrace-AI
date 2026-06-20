from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.routes.auth import get_current_user
import app.crud as crud
import app.schemas as schemas

router = APIRouter(prefix="/simulator", tags=["simulator"])

SIMULATION_CONSTANTS = {
    "cycle_commute": {
        "co2_per_unit": 2.8,  # kg CO2 saved per commute (10km round trip driving vs cycling)
        "cost_per_unit": 1.80, # USD fuel/parking saved
        "score_weight": 1.2
    },
    "meat_reduction": {
        "co2_per_unit": 2.6,  # kg CO2 saved per meal (beef vs plant)
        "cost_per_unit": 2.00, # USD cost savings
        "score_weight": 1.0
    },
    "ac_temp": {
        "co2_per_unit": 0.7,  # kg CO2 saved per day per degree shift (e.g., +1°C)
        "cost_per_unit": 0.40, # USD utility savings
        "score_weight": 0.8
    },
    "laundry_cold": {
        "co2_per_unit": 0.6,  # kg CO2 saved per wash cycle
        "cost_per_unit": 0.30, # USD electricity savings
        "score_weight": 0.5
    },
    "unplug_phantom": {
        "co2_per_unit": 0.4,  # kg CO2 saved per day
        "cost_per_unit": 0.20, # USD energy bill savings
        "score_weight": 0.4
    }
}

@router.post("/calculate", response_model=schemas.WhatIfResponse)
def calculate_simulation(
    req: schemas.WhatIfRequest,
    current_user: schemas.UserOut = Depends(get_current_user)
):
    action = req.action_type
    freq = req.frequency_weekly
    
    if action not in SIMULATION_CONSTANTS:
        raise HTTPException(status_code=400, detail="Invalid action type for simulation")
        
    constants = SIMULATION_CONSTANTS[action]
    
    # Calculate impacts
    weekly_carbon = constants["co2_per_unit"] * freq
    weekly_cost = constants["cost_per_unit"] * freq
    
    # Annual scaling factor (52 weeks)
    annual_carbon = weekly_carbon * 52
    annual_cost = weekly_cost * 52
    
    # Monthly scaling (average 4.33 weeks per month)
    monthly_carbon = weekly_carbon * 4.33
    
    # Score improvement estimation
    score_imp = min(weekly_carbon * constants["score_weight"], 15.0)  # capped at 15 points
    
    return schemas.WhatIfResponse(
        weekly_carbon_saved=round(weekly_carbon, 2),
        monthly_carbon_saved=round(monthly_carbon, 2),
        annual_carbon_saved=round(annual_carbon, 2),
        annual_cost_saved=round(annual_cost, 2),
        score_improvement=round(score_imp, 1)
    )

@router.post("/save", response_model=schemas.SimulationOut)
def save_user_simulation(
    sim: schemas.SimulationCreate,
    current_user: schemas.UserOut = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return crud.save_simulation(db, current_user.id, sim)

@router.get("/saved", response_model=List[schemas.SimulationOut])
def get_saved_simulations(
    current_user: schemas.UserOut = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return crud.get_simulations(db, current_user.id)
