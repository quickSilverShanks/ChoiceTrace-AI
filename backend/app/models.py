from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Date
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    persona = Column(String, default="professional")  # student, professional, commuter, family, enthusiast
    xp = Column(Integer, default=0)
    level = Column(Integer, default=1)
    streak = Column(Integer, default=0)
    longest_streak = Column(Integer, default=0)
    last_active_date = Column(Date, nullable=True)
    carbon_score = Column(Float, default=75.0)  # Dynamic score out of 100
    total_carbon_saved = Column(Float, default=0.0)  # In kg CO2
    trees_saved = Column(Float, default=0.0)

    # Relationships
    activities = relationship("ActivityLog", back_populates="user", cascade="all, delete-orphan")
    challenges = relationship("Challenge", back_populates="user", cascade="all, delete-orphan")
    badges = relationship("Badge", back_populates="user", cascade="all, delete-orphan")
    roadmap_items = relationship("RoadmapItem", back_populates="user", cascade="all, delete-orphan")
    simulations = relationship("Simulation", back_populates="user", cascade="all, delete-orphan")

class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(Integer, primary key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    activity_type = Column(String, index=True)  # commute, food, grocery, shopping, energy, travel, entertainment
    title = Column(String)
    original_action = Column(String)
    original_carbon = Column(Float)  # kg CO2
    recommended_alternative = Column(String)
    alternative_carbon = Column(Float)  # kg CO2
    carbon_saved = Column(Float)  # kg CO2
    cost_saved = Column(Float)  # USD
    difficulty = Column(String)  # Easy, Medium, Hard
    confidence_score = Column(Float, default=0.9)
    chosen = Column(Boolean, default=False)
    timestamp = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="activities")

class Challenge(Base):
    __tablename__ = "challenges"

    id = Column(Integer, primary key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String)
    description = Column(String)
    carbon_savings = Column(Float)  # kg CO2
    xp_reward = Column(Integer)
    time_estimate = Column(String)  # e.g., "10 mins"
    completed = Column(Boolean, default=False)
    created_date = Column(Date, default=datetime.utcnow().date)
    completed_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="challenges")

class Badge(Base):
    __tablename__ = "badges"

    id = Column(Integer, primary key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String)  # e.g., "7 Day Green Streak", "Public Transport Champion"
    description = Column(String)
    icon = Column(String)  # Emoji or icon key
    awarded_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="badges")

class RoadmapItem(Base):
    __tablename__ = "roadmap_items"

    id = Column(Integer, primary key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    day_number = Column(Integer)  # 1 to 30
    title = Column(String)
    description = Column(String)
    category = Column(String)  # Food, Energy, Transport, Shopping
    carbon_savings = Column(Float)
    difficulty = Column(String)  # Easy, Medium, Hard
    completed = Column(Boolean, default=False)
    completed_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="roadmap_items")

class Simulation(Base):
    __tablename__ = "simulations"

    id = Column(Integer, primary key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String)
    details = Column(String)  # JSON string or description
    annual_carbon_savings = Column(Float)
    annual_cost_savings = Column(Float)
    score_improvement = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="simulations")
