import os
from pathlib import Path
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    PROJECT_NAME: str = "Echoes of Eternity"
    PROJECT_DESCRIPTION: str = "Immersive AI Heritage & Fine Art Experience — ACM x MLH Hack Days 2026"

    # Use a fresh database filename (echoes.db) to avoid stale locks from prior runs
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./echoes.db")

    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-3.5-flash")

    # Whether Gemini rewrites the authored tour script on first build.
    #
    # Off by default, and not for want of ambition: the Gemini free tier allows
    # only a few dozen requests per day per model, and polishing the tour costs
    # fourteen of them. The authored narration in tour_data.py is already
    # written to be spoken, so the daily allowance is far better spent on the
    # visitor's live questions — the part of the experience where the model's
    # answer is actually unscripted. Set GEMINI_POLISH_NARRATION=1 to enable it;
    # results are cached permanently, so it is a one-off cost per machine.
    GEMINI_POLISH_NARRATION: bool = os.getenv("GEMINI_POLISH_NARRATION", "").strip().lower() in (
        "1",
        "true",
        "yes",
    )

    # ------------------------------------------------------------------
    # Google Maps Platform
    # The .env in this repo names the variable GOOGLE_MAPS_API; we also accept
    # the more conventional GOOGLE_MAPS_API_KEY so either spelling works.
    # ------------------------------------------------------------------
    GOOGLE_MAPS_API_KEY: str = (
        os.getenv("GOOGLE_MAPS_API_KEY") or os.getenv("GOOGLE_MAPS_API") or ""
    )

    # ------------------------------------------------------------------
    # Caching — every Google / Gemini response we can legally keep is written
    # to disk so a demo run costs zero upstream requests (PRD §12).
    # ------------------------------------------------------------------
    CACHE_DIR: str = os.getenv("CACHE_DIR", str(BASE_DIR / ".cache"))

    # Photorealistic 3D Tiles bills per *root tileset* request; one root request
    # entitles the renderer to at least three hours of tile traffic. We re-use a
    # cached session well inside that window so repeated page loads cost nothing.
    TILES_SESSION_TTL_SECONDS: int = 2 * 60 * 60 + 30 * 60  # 2h30m

    # Street View panorama metadata is free of charge, but we still cache the
    # resolved route forever — it makes the guided tour deterministic on stage.
    PANO_CACHE_TTL_SECONDS: int = 0  # 0 == never expire

    # Gemini narration cache. Narration is grounded in static facts, so it only
    # needs generating once per POI/waypoint.
    NARRATION_CACHE_TTL_SECONDS: int = 0  # 0 == never expire

    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ]

    # Vite walks up a port when 5173 is taken, which silently broke CORS during
    # development. Any loopback origin is allowed instead of a fixed list.
    CORS_ORIGIN_REGEX: str = r"^http://(localhost|127\.0\.0\.1)(:\d+)?$"


settings = Settings()
