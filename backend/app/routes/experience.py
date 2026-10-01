"""Endpoints for the three-mode monument experience.

The frontend needs exactly one call — ``GET /experience/1`` — to start. The two
Google-facing endpoints exist so quota is spent by the server once and shared,
rather than by every browser tab that opens the app.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app import cache, maps_service
from app.config import settings
from app.database import get_db
from app.experience_service import (
    MONUMENT_ID,
    build_experience,
    invalidate_experience,
)
from app.tour_data import TOUR_WAYPOINTS

router = APIRouter()


@router.get("/experience/{monument_id}")
def get_experience(monument_id: int, db: Session = Depends(get_db)):
    """Return the full aerial + guided-tour + free-roam bundle for a monument."""
    if monument_id != MONUMENT_ID:
        raise HTTPException(
            status_code=404,
            detail=(
                "Only the Statue of Liberty (id 1) is configured in this build. "
                "Add a route to app/tour_data.py to enable another monument."
            ),
        )
    return build_experience(db, monument_id)


@router.post("/experience/{monument_id}/refresh")
def refresh_experience(monument_id: int, db: Session = Depends(get_db)):
    """Drop and rebuild the cached bundle — used after editing the tour script."""
    invalidate_experience(monument_id)
    return build_experience(db, monument_id)


@router.get("/maps/3dtiles/root.json")
def tiles_root(refresh: bool = Query(False, description="Force a new root tileset request")):
    """Serve the cached Photorealistic 3D Tiles root tileset.

    Google bills the root tileset request, and one root request stays valid for
    at least three hours — but the root endpoint rejects a caller-supplied
    session token, so the only way for browsers to share a session is to share
    the document itself. This endpoint fetches it at most once every 2h30m and
    hands the same copy to every client, with child URIs made absolute so all
    subsequent tile traffic goes browser-to-Google directly.
    """
    record = maps_service.get_tiles_root(force_refresh=refresh)
    if not record.get("available"):
        raise HTTPException(status_code=503, detail=record.get("reason", "3D Tiles unavailable"))

    response = JSONResponse(content=record["tileset"])
    # Let the browser hold it too, but never past the session's usable life.
    response.headers["Cache-Control"] = f"private, max-age={record.get('expires_in_seconds', 0)}"
    response.headers["X-Tiles-Session-Cached"] = "1" if record.get("cached") else "0"
    response.headers["X-Tiles-Session-Age"] = str(record.get("age_seconds", 0))
    return response


@router.get("/maps/tiles-session")
def tiles_session():
    """Report the cached 3D Tiles session without triggering a billable request."""
    return maps_service.tiles_session_status()


@router.get("/maps/streetview/verify")
def verify_street_view():
    """Confirm every tour waypoint still resolves to its expected panorama.

    Street View metadata requests are free of charge, and results are cached
    permanently, so this is safe to call repeatedly while rehearsing.
    """
    report = maps_service.verify_route(TOUR_WAYPOINTS)
    return {
        "waypoints": len(report),
        "with_coverage": sum(1 for r in report if r["coverage"]),
        "exact_matches": sum(1 for r in report if r["matches"]),
        "served_from_cache": sum(1 for r in report if r["from_cache"]),
        "maps_key_configured": bool(settings.GOOGLE_MAPS_API_KEY),
        "detail": report,
    }


@router.get("/maps/quota")
def quota_report():
    """What this backend has actually spent against Google, and what it cached.

    Handy during a hackathon: it makes the caching story visible instead of
    something you have to take on trust.
    """
    return {
        "cache_entries": cache.stats(),
        "tiles_session": {
            **maps_service.tiles_session_status(),
            "note": (
                "One billable root-tileset request per TTL, shared by every client; "
                "all glTF tile traffic goes browser-to-Google and is not billed per tile."
            ),
        },
        "street_view": {
            "metadata_requests": "free of charge; resolved route cached permanently",
            "panorama_loads": "billable in the browser — the tour reuses "
            f"{len(TOUR_WAYPOINTS)} fixed panoramas per run",
        },
        "narration": {
            "source": "gemini" if settings.GEMINI_API_KEY else "authored (no GEMINI_API_KEY)",
            "cached_permanently": True,
        },
    }
