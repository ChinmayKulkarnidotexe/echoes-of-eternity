import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import engine, Base, SessionLocal
from app.seed import seed_data
from app.routes import experience, monuments, paintings, qa

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Lifespan — create tables & seed data on startup
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        try:
            seed_data(db)
            logger.info("Database tables created and seed data verified.")
        except Exception as exc:
            logger.error("Seed error: %s", exc)
    yield  # app is now running
    # Shutdown cleanup (if needed) goes here


app = FastAPI(
    title=settings.PROJECT_NAME,
    description=settings.PROJECT_DESCRIPTION,
    version="1.0.0",
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# Middleware
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=settings.CORS_ORIGIN_REGEX,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    # Lets the frontend read the cache-hit headers on the 3D Tiles root.
    expose_headers=["X-Tiles-Session-Cached", "X-Tiles-Session-Age"],
)

# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
app.include_router(monuments.router, prefix="", tags=["Monuments & POIs"])
app.include_router(paintings.router, prefix="", tags=["Art Gallery"])
app.include_router(qa.router, prefix="", tags=["AI Q&A"])
app.include_router(experience.router, prefix="", tags=["Monument Experience"])


@app.get("/", tags=["Root"])
def root():
    return {
        "project": settings.PROJECT_NAME,
        "status": "online",
        "docs": "/docs",
        "endpoints": {
            "monuments": "/monuments/1/pois",
            "narrate": "/narrate/{poi_id}",
            "paintings": "/paintings",
            "painting_info": "/painting-info/{painting_id}",
            "ask": "/ask  (POST)",
            "experience": "/experience/1",
            "tiles_session": "/maps/tiles-session",
            "street_view_verify": "/maps/streetview/verify",
            "quota": "/maps/quota",
        },
    }


@app.get("/health", tags=["Root"])
def health():
    from app import cache

    return {
        "status": "ok",
        "project": settings.PROJECT_NAME,
        "maps_key_configured": bool(settings.GOOGLE_MAPS_API_KEY),
        "gemini_key_configured": bool(settings.GEMINI_API_KEY),
        "cache_entries": cache.stats(),
    }
