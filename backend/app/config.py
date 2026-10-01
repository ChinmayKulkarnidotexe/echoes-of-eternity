import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()


class Settings(BaseSettings):
    PROJECT_NAME: str = "Echoes of Eternity"
    PROJECT_DESCRIPTION: str = "Immersive AI Heritage & Fine Art Experience — ACM x MLH Hack Days 2026"

    # Use a fresh database filename (echoes.db) to avoid stale locks from prior runs
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./echoes.db")

    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")

    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ]


settings = Settings()
