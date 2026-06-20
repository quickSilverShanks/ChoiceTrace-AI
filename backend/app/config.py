import os
from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    PROJECT_NAME: str = "ChoiceTrace AI API"
    DATABASE_URL: str = Field(default="sqlite:///./choicetrace.db")
    GEMINI_API_KEY: str = Field(default="")
    SECRET_KEY: str = Field(default="choicetrace-ai-super-secret-key-for-development-only")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 1 day

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"

settings = Settings()
