import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    PROJECT_NAME: str = "Immersive AI Heritage & Art Experience"
    # Defaults to SQLite for immediate zero-config start; easily overridden with PostgreSQL URI
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./heritage.db")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ]

settings = Settings()
