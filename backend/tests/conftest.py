import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.database import Base, get_db

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def db():
    # Create the database tables
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        # Drop the database tables to ensure clean slate
        Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def client(db):
    def _get_db_override():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = _get_db_override
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()

@pytest.fixture(scope="function")
def auth_headers(client):
    # Register a user
    register_response = client.post("/api/auth/register", json={
        "username": "testuser",
        "password": "testpassword",
        "persona": "student"
    })
    assert register_response.status_code == 200
    
    # Login
    login_response = client.post("/api/auth/login", json={
        "username": "testuser",
        "password": "testpassword"
    })
    assert login_response.status_code == 200
    token = login_response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
