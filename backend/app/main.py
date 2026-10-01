import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base, SessionLocal
from app.seed import seed_data
from app.routes import monuments, paintings, qa

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize database schema
Base.metadata.create_all(bind=engine)

# Seed initial data on startup
with SessionLocal() as db:
    try:
        seed_data(db)
        logger.info("Database checked and seeded successfully.")
    except Exception as e:
        logger.error(f"Error seeding database: {e}")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend API for Immersive AI Heritage & Art Experience (ACM x MLH Hack Days 2026)",
    version="1.0.0",
)

# CORS configuration to allow local frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(monuments.router)
app.include_router(paintings.router)
app.include_router(qa.router)

@app.get("/")
def root():
    return {
        "status": "online",
        "project": settings.PROJECT_NAME,
        "docs_url": "/docs",
        "endpoints": [
            "/monuments/1/pois",
            "/narrate/1",
            "/paintings",
            "/painting-info/1",
            "/ask"
        ]
    }

@app.get("/health")
def health():
    return {"status": "ok"}
