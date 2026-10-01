"""Assembles the single payload the frontend monument experience runs on.

One GET returns all three modes — aerial orbit, guided walk, free roam — so the
browser makes exactly one backend call to start an experience, and the whole
bundle is cached on disk afterwards. The authored text in ``tour_data`` is
already demo-ready prose; Gemini, when a key is configured, polishes each beat
once and the result is cached permanently (the grounding facts never change, so
there is nothing to regenerate).
"""

from __future__ import annotations

import logging
from typing import Any, Optional

from sqlalchemy.orm import Session

from app import cache, maps_service
from app.config import settings
from app.models import Monument
from app.tour_data import (
    AERIAL,
    FREE_ROAM_POIS,
    MONUMENT_ID,
    STATUE_CENTER,
    TOUR_WAYPOINTS,
)

logger = logging.getLogger(__name__)

# Bump when the shape of the bundle changes, so stale caches are ignored rather
# than served to a frontend that no longer understands them.
BUNDLE_VERSION = 4

MONUMENT_LOCATION = "Liberty Island, New York Harbour"
MONUMENT_ERA = "1875 – 1886"


# ---------------------------------------------------------------------------
# Narration polish (optional, cached permanently)
# ---------------------------------------------------------------------------
def _polish(beat_id: str, title: str, authored: str, facts: str) -> str:
    """Return a Gemini-polished narration line, falling back to the authored one.

    Cached under a key that includes the authored text, so editing the script in
    ``tour_data`` naturally invalidates just that line.
    """
    if not settings.GEMINI_API_KEY or not settings.GEMINI_POLISH_NARRATION:
        return authored

    cache_key = f"{beat_id}:{hash(authored) & 0xFFFFFFFF:08x}"

    def produce() -> Optional[str]:
        from app.gemini_service import polish_narration

        return polish_narration(title=title, authored=authored, facts=facts)

    value, _ = cache.get_or_set(
        "narration", cache_key, produce, settings.NARRATION_CACHE_TTL_SECONDS
    )
    return value or authored


# ---------------------------------------------------------------------------
# Bundle sections
# ---------------------------------------------------------------------------
def _build_aerial() -> dict:
    beats = []
    for index, beat in enumerate(AERIAL["beats"]):
        beats.append(
            {
                "id": beat["id"],
                "index": index,
                "title": beat["title"],
                "narration": _polish(beat["id"], beat["title"], beat["text"], beat["facts"]),
                "facts": beat["facts"],
            }
        )
    return {"center": AERIAL["center"], "orbit": AERIAL["orbit"], "beats": beats}


def _build_tour() -> dict:
    waypoints = []
    for index, waypoint in enumerate(TOUR_WAYPOINTS):
        horizontal = maps_service.distance_m(
            waypoint["lat"], waypoint["lng"], STATUE_CENTER["lat"], STATUE_CENTER["lng"]
        )
        waypoints.append(
            {
                "id": waypoint["id"],
                "index": index,
                "pano_id": waypoint["pano_id"],
                "lat": waypoint["lat"],
                "lng": waypoint["lng"],
                "heading": waypoint["heading"],
                "pitch": waypoint["pitch"],
                "zoom": waypoint["zoom"],
                "dwell_s": waypoint["dwell_s"],
                "title": waypoint["title"],
                "subtitle": waypoint["subtitle"],
                "distance_to_statue_m": round(horizontal, 1),
                "narration": _polish(
                    waypoint["id"], waypoint["title"], waypoint["narration"], waypoint["facts"]
                ),
                "facts": waypoint["facts"],
            }
        )
    return {
        "waypoints": waypoints,
        "estimated_seconds": sum(w["dwell_s"] for w in TOUR_WAYPOINTS),
    }


def _build_free_roam() -> dict:
    """Free roam reuses the tour's verified panorama set as the roamable network.

    Hotspot screen positions are computed in the browser from the live point of
    view, so the backend only supplies each hotspot's world position and height.
    """
    pois = []
    for poi in FREE_ROAM_POIS:
        pois.append(
            {
                "id": poi["id"],
                "name": poi["name"],
                "label": poi["label"],
                "icon": poi["icon"],
                "lat": poi["lat"],
                "lng": poi["lng"],
                "height_m": poi["height_m"],
                "category": poi["category"],
                "summary": poi["summary"],
                "facts": poi["facts"],
            }
        )

    panos = [
        {
            "pano_id": w["pano_id"],
            "lat": w["lat"],
            "lng": w["lng"],
            "label": w["title"],
            "heading_to_statue": w["heading"],
        }
        for w in TOUR_WAYPOINTS
    ]

    return {
        # Start free roam on the iconic frontal view.
        "start_pano_id": TOUR_WAYPOINTS[0]["pano_id"],
        "start_heading": TOUR_WAYPOINTS[0]["heading"],
        "start_pitch": TOUR_WAYPOINTS[0]["pitch"],
        "pois": pois,
        "panos": panos,
    }


# ---------------------------------------------------------------------------
# Public entry point
# ---------------------------------------------------------------------------
def build_experience(db: Session, monument_id: int = MONUMENT_ID) -> dict[str, Any]:
    """Return the full three-mode experience bundle, cached on disk after the first build."""
    cache_key = f"monument-{monument_id}-v{BUNDLE_VERSION}"
    cached = cache.read("experience", cache_key)
    if cached is not None:
        return {**cached, "from_cache": True}

    monument = db.query(Monument).filter(Monument.id == monument_id).first()

    bundle = {
        "version": BUNDLE_VERSION,
        "monument": {
            "id": monument_id,
            "name": monument.name if monument else "Statue of Liberty",
            "location": MONUMENT_LOCATION,
            "era": MONUMENT_ERA,
            "description": (
                monument.description
                if monument and monument.description
                else "A colossal neoclassical sculpture on Liberty Island in New York Harbour."
            ),
            "center": STATUE_CENTER,
        },
        "aerial": _build_aerial(),
        "tour": _build_tour(),
        "free_roam": _build_free_roam(),
        # Two separate facts, because they are genuinely separate: the tour
        # script is hand-written unless polishing is switched on, while the
        # visitor's questions are answered live whenever a key is configured.
        "narration_source": (
            "gemini" if (settings.GEMINI_API_KEY and settings.GEMINI_POLISH_NARRATION)
            else "authored"
        ),
        "live_answers": bool(settings.GEMINI_API_KEY),
    }

    cache.write("experience", cache_key, bundle)
    return {**bundle, "from_cache": False}


def invalidate_experience(monument_id: int = MONUMENT_ID) -> bool:
    """Drop the cached bundle so the next request rebuilds it from tour_data."""
    return cache.delete("experience", f"monument-{monument_id}-v{BUNDLE_VERSION}")
