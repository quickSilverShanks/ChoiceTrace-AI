from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, date, timedelta
import bcrypt
import json
from app.models import User, ActivityLog, Challenge, Badge, RoadmapItem, Simulation
from app.schemas import UserCreate, ActivityLogCreate, SimulationCreate

def get_password_hash(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False

# User CRUDS
def get_user(db: Session, user_id: int):
    return db.query(User).filter(User.id == user_id).first()

def get_user_by_username(db: Session, username: str):
    return db.query(User).filter(User.username == username).first()

def get_all_users(db: Session):
    return db.query(User).order_by(User.xp.desc()).all()

def create_user(db: Session, user: UserCreate):
    hashed_password = get_password_hash(user.password)
    db_user = User(
        username=user.username,
        hashed_password=hashed_password,
        persona=user.persona,
        xp=0,
        level=1,
        streak=0,
        longest_streak=0,
        carbon_score=75.0,
        total_carbon_saved=0.0,
        trees_saved=0.0
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Initialize challenges and roadmap items for the user
    initialize_user_challenges(db, db_user.id)
    initialize_user_roadmap(db, db_user.id)
    
    return db_user

def update_user_persona(db: Session, user_id: int, persona: str):
    user = get_user(db, user_id)
    if user:
        user.persona = persona
        db.commit()
        db.refresh(user)
    return user

def add_user_xp(db: Session, user: User, xp_to_add: int):
    user.xp += xp_to_add
    
    # Level up logic: Level Up when XP reaches (level * 100)
    # E.g., Level 1 -> 2 needs 100 XP, Level 2 -> 3 needs 200 XP, etc.
    # We can simplify: next_level_xp = level * 100
    while user.xp >= (user.level * 100):
        user.xp -= (user.level * 100)
        user.level += 1
        # Award level-up badge
        award_badge(
            db, 
            user.id, 
            name=f"Level {user.level} Climber", 
            description=f"Reached level {user.level} on your green journey!", 
            icon="🚀"
        )
    
    # Recalculate carbon score based on completed habits & level
    recalculate_carbon_score(db, user)
    db.commit()
    db.refresh(user)

def update_user_streak(db: Session, user: User):
    today = date.today()
    if user.last_active_date is None:
        user.streak = 1
        user.longest_streak = max(user.longest_streak, 1)
    else:
        delta = today - user.last_active_date
        if delta.days == 1:
            user.streak += 1
            user.longest_streak = max(user.longest_streak, user.streak)
            # Award streak badge
            if user.streak == 7:
                award_badge(db, user.id, "7 Day Green Streak", "Completed eco-friendly actions 7 days in a row!", "🔥")
            elif user.streak == 30:
                award_badge(db, user.id, "30 Day Eco Warrior", "Completed eco-friendly actions 30 days in a row!", "👑")
        elif delta.days > 1:
            user.streak = 1
            
    user.last_active_date = today
    db.commit()

def recalculate_carbon_score(db: Session, user: User):
    # Carbon score starts at 75. It goes up based on chosen green alternatives, level, completed challenges.
    # Max score is 100.
    # Score = 75 + (level * 2) + (total_carbon_saved / 10) - (uncompleted_challenges_penalty)
    base_score = 75.0
    xp_bonus = user.level * 1.5
    savings_bonus = min(user.total_carbon_saved * 0.1, 15.0)  # Max 15 points from savings
    
    # Check completed vs total challenges
    total_challenges = db.query(Challenge).filter(Challenge.user_id == user.id).count()
    completed_challenges = db.query(Challenge).filter(Challenge.user_id == user.id, Challenge.completed == True).count()
    
    challenge_ratio = (completed_challenges / total_challenges) if total_challenges > 0 else 0
    challenge_bonus = challenge_ratio * 8.5
    
    user.carbon_score = min(base_score + xp_bonus + savings_bonus + challenge_bonus, 100.0)

# Activity Log CRUDS
def log_activity(db: Session, user_id: int, activity: ActivityLogCreate):
    db_activity = ActivityLog(
        user_id=user_id,
        activity_type=activity.activity_type,
        title=activity.title,
        original_action=activity.original_action,
        original_carbon=activity.original_carbon,
        recommended_alternative=activity.recommended_alternative,
        alternative_carbon=activity.alternative_carbon,
        carbon_saved=activity.carbon_saved,
        cost_saved=activity.cost_saved,
        difficulty=activity.difficulty,
        confidence_score=activity.confidence_score,
        chosen=False
    )
    db.add(db_activity)
    db.commit()
    db.refresh(db_activity)
    return db_activity

def choose_alternative(db: Session, activity_id: int, chosen: bool, user_id: int):
    activity = db.query(ActivityLog).filter(ActivityLog.id == activity_id, ActivityLog.user_id == user_id).first()
    if not activity:
        return None
    
    if chosen and not activity.chosen:
        # User switched from original to alternative
        activity.chosen = True
        
        # Reward user
        user = get_user(db, user_id)
        if user:
            user.total_carbon_saved += activity.carbon_saved
            user.trees_saved = user.total_carbon_saved / 22.0  # Approx 22kg CO2 absorbed per tree per year
            
            # Award XP: 10 XP base + 10 XP per kg saved
            xp_reward = int(10 + (activity.carbon_saved * 10))
            add_user_xp(db, user, xp_reward)
            update_user_streak(db, user)
            
            # Badge checks
            check_and_award_activity_badges(db, user)
            
    elif not chosen and activity.chosen:
        # User reverted selection
        activity.chosen = False
        user = get_user(db, user_id)
        if user:
            user.total_carbon_saved = max(0.0, user.total_carbon_saved - activity.carbon_saved)
            user.trees_saved = user.total_carbon_saved / 22.0
            
            xp_loss = int(10 + (activity.carbon_saved * 10))
            user.xp = max(0, user.xp - xp_loss)
            recalculate_carbon_score(db, user)
            
    db.commit()
    db.refresh(activity)
    return activity

def check_and_award_activity_badges(db: Session, user: User):
    # Commute Badge
    commutes_saved = db.query(ActivityLog).filter(
        ActivityLog.user_id == user.id,
        ActivityLog.activity_type == "commute",
        ActivityLog.chosen == True
    ).count()
    if commutes_saved >= 5:
        award_badge(db, user.id, "Public Transport Champion", "Replaced 5 drive trips with green transport alternatives!", "🚇")

    # Shopping Badge
    shopping_saved = db.query(ActivityLog).filter(
        ActivityLog.user_id == user.id,
        ActivityLog.activity_type.in_(["shopping", "grocery"]),
        ActivityLog.chosen == True
    ).count()
    if shopping_saved >= 5:
        award_badge(db, user.id, "Sustainable Shopper", "Chosen 5 eco-friendly options during shopping!", "🛍️")

    # Food Badge
    food_saved = db.query(ActivityLog).filter(
        ActivityLog.user_id == user.id,
        ActivityLog.activity_type == "food",
        ActivityLog.chosen == True
    ).count()
    if food_saved >= 5:
        award_badge(db, user.id, "Plant-Powered", "Chosen 5 vegetarian/vegan alternatives for meals!", "🥗")

    # Carbon milestones
    if user.total_carbon_saved >= 50.0:
        award_badge(db, user.id, "Carbon Buster", "Saved over 50 kg of CO2!", "💚")
    if user.total_carbon_saved >= 200.0:
        award_badge(db, user.id, "Forest Guardian", "Saved over 200 kg of CO2 (equivalent to 10 trees saved)!", "🌳")

def award_badge(db: Session, user_id: int, name: str, description: str, icon: str):
    # Check if user already has this badge
    exists = db.query(Badge).filter(Badge.user_id == user_id, Badge.name == name).first()
    if not exists:
        badge = Badge(
            user_id=user_id,
            name=name,
            description=description,
            icon=icon
        )
        db.add(badge)
        
        # Award extra XP for getting a badge
        user = get_user(db, user_id)
        if user:
            user.xp += 100
            while user.xp >= (user.level * 100):
                user.xp -= (user.level * 100)
                user.level += 1
            recalculate_carbon_score(db, user)
        db.commit()

# Challenge CRUDS
def get_user_challenges(db: Session, user_id: int):
    return db.query(Challenge).filter(Challenge.user_id == user_id).all()

def complete_challenge(db: Session, challenge_id: int, user_id: int):
    challenge = db.query(Challenge).filter(Challenge.id == challenge_id, Challenge.user_id == user_id).first()
    if challenge and not challenge.completed:
        challenge.completed = True
        challenge.completed_at = datetime.utcnow()
        
        user = get_user(db, user_id)
        if user:
            user.total_carbon_saved += challenge.carbon_savings
            user.trees_saved = user.total_carbon_saved / 22.0
            add_user_xp(db, user, challenge.xp_reward)
            update_user_streak(db, user)
        db.commit()
        db.refresh(challenge)
    return challenge

def initialize_user_challenges(db: Session, user_id: int):
    # Create default daily/weekly challenges
    challenges = [
        {"title": "Plant-Based Lunch", "description": "Eat one plant-based meal today instead of meat.", "carbon_savings": 1.5, "xp_reward": 50, "time_estimate": "15 mins"},
        {"title": "Unplug Phantom Loads", "description": "Unplug unused electronics, chargers, and appliances before leaving home.", "carbon_savings": 0.4, "xp_reward": 30, "time_estimate": "5 mins"},
        {"title": "Active Commuting", "description": "Walk or cycle for a short trip (under 2 km) instead of driving.", "carbon_savings": 0.8, "xp_reward": 40, "time_estimate": "10 mins"},
        {"title": "AC Nudge", "description": "Increase your air conditioner thermostat by 1°C for today.", "carbon_savings": 0.7, "xp_reward": 35, "time_estimate": "2 mins"},
        {"title": "Cold Wash", "description": "Wash a load of laundry using cold water instead of hot.", "carbon_savings": 0.6, "xp_reward": 30, "time_estimate": "5 mins"}
    ]
    for c in challenges:
        db_challenge = Challenge(
            user_id=user_id,
            title=c["title"],
            description=c["description"],
            carbon_savings=c["carbon_savings"],
            xp_reward=c["xp_reward"],
            time_estimate=c["time_estimate"],
            completed=False
        )
        db.add(db_challenge)
    db.commit()

# Roadmap CRUDS
def get_user_roadmap(db: Session, user_id: int):
    return db.query(RoadmapItem).filter(RoadmapItem.user_id == user_id).order_by(RoadmapItem.day_number.asc()).all()

def complete_roadmap_item(db: Session, item_id: int, user_id: int):
    item = db.query(RoadmapItem).filter(RoadmapItem.id == item_id, RoadmapItem.user_id == user_id).first()
    if item and not item.completed:
        item.completed = True
        item.completed_at = datetime.utcnow()
        
        user = get_user(db, user_id)
        if user:
            user.total_carbon_saved += item.carbon_savings
            user.trees_saved = user.total_carbon_saved / 22.0
            add_user_xp(db, user, 75)  # 75 XP for roadmap milestones
            update_user_streak(db, user)
        db.commit()
        db.refresh(item)
    return item

def initialize_user_roadmap(db: Session, user_id: int):
    # Generates a basic 30-day template roadmap (AI can regenerate/personalize it later)
    categories = ["Transport", "Food", "Energy", "Shopping"]
    titles = [
        "Audit Commute Habits", "Meatless Monday Intro", "Unplug Unused Devices", "Understand E-Waste",
        "Try Public Transit", "Local Grocery Sourcing", "Optimize Refrigerator Temp", "Buy Refurbished Only",
        "Combine Trip Errands", "Plant-based Dairy Swap", "Switch to LED Bulbs", "Declutter Sustainably",
        "Bike/Walk Short Trips", "Batch Cook Veggie Meals", "Line Dry Your Clothes", "Eco-friendly Detergents",
        "Carpool with Coworkers", "Explore Seasonal Recipes", "Install Smart Power Strips", "Avoid Single-use Plastics",
        "No-Car Weekend", "Try Tofu/Tempeh Cooking", "Set AC Nudge Routine", "Choose Minimal Packaging",
        "Tune Up Car Tires", "Zero Waste Picnic", "Lower Water Heater Temp", "Support Local Farmers Market",
        "Verify Driving Carbon", "Invite Friends to Nudge"
    ]
    
    for i in range(30):
        day = i + 1
        cat = categories[i % len(categories)]
        title = titles[i % len(titles)]
        savings = round(1.0 + (i * 0.1), 1)
        difficulty = "Easy" if day <= 10 else "Medium" if day <= 20 else "Hard"
        
        db_item = RoadmapItem(
            user_id=user_id,
            day_number=day,
            title=title,
            description=f"Day {day} action target for {cat} sustainability.",
            category=cat,
            carbon_savings=savings,
            difficulty=difficulty,
            completed=False
        )
        db.add(db_item)
    db.commit()

# Simulation CRUDS
def save_simulation(db: Session, user_id: int, sim: SimulationCreate):
    db_sim = Simulation(
        user_id=user_id,
        name=sim.name,
        details=sim.details,
        annual_carbon_savings=sim.annual_carbon_savings,
        annual_cost_savings=sim.annual_cost_savings,
        score_improvement=sim.score_improvement
    )
    db.add(db_sim)
    db.commit()
    db.refresh(db_sim)
    return db_sim

def get_simulations(db: Session, user_id: int):
    return db.query(Simulation).filter(Simulation.user_id == user_id).order_by(Simulation.created_at.desc()).all()
