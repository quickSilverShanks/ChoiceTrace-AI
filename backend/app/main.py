from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import logging

from app.database import engine, Base, SessionLocal
from app.config import settings
from app.routes import auth, activities, challenges, simulator, roadmap, coach, dashboard
import app.crud as crud
import app.schemas as schemas

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("app.main")

# Auto-create tables (SQLite/PostgreSQL fallback)
try:
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables initialized successfully.")
except Exception as e:
    logger.error(f"Failed to initialize database tables: {str(e)}")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Proactive AI carbon awareness and decision nudging engine.",
    version="1.0.0",
    docs_url="/api/docs",
    openapi_url="/api/openapi.json"
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust for production GCP deployment
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router, prefix="/api")
app.include_router(activities.router, prefix="/api")
app.include_router(challenges.router, prefix="/api")
app.include_router(simulator.router, prefix="/api")
app.include_router(roadmap.router, prefix="/api")
app.include_router(coach.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")

# Lifespan startup seed handler
@app.on_event("startup")
def seed_demo_user():
    db = SessionLocal()
    try:
        demo_username = "demo_user"
        existing = crud.get_user_by_username(db, demo_username)
        if not existing:
            demo_user = schemas.UserCreate(
                username=demo_username,
                password="password123",
                persona="professional"
            )
            crud.create_user(db, demo_user)
            logger.info(f"Demo user '{demo_username}' created with password 'password123'.")
        else:
            logger.info("Demo user already exists.")
    except Exception as e:
        logger.error(f"Failed to seed demo user: {str(e)}")
    finally:
        db.close()

@app.get("/")
def read_root():
    return {"message": "Welcome to ChoiceTrace AI API. Access documentation at /api/docs"}
