"""Google Maps Platform access, with every response we keep cached to disk.

Quota discipline is the whole point of this module:

* **Street View metadata** (``/streetview/metadata``) is free of charge, but the
  resolved route is still cached permanently so the guided tour is byte-identical
  on every run and never depends on a live lookup during a demo.
* **Photorealistic 3D Tiles** bills per *root tileset* request, and one root
  request entitles the renderer to at least three hours of tile traffic. We
  therefore fetch the root tileset at most once every two and a half hours and
  hand the same session token to every browser that asks.

Nothing here is called from the request path unless the cache misses.
"""

from __future__ import annotations

import json
import logging
import math
import time
import urllib.error
import urllib.parse
import urllib.request
from typing import Any, Optional

from app import cache
from app.config import settings

logger = logging.getLogger(__name__)

STREET_VIEW_METADATA_URL = "https://maps.googleapis.com/maps/api/streetview/metadata"
TILES_ROOT_URL = "https://tile.googleapis.com/v1/3dtiles/root.json"

_HTTP_TIMEOUT = 15


# ---------------------------------------------------------------------------
# Geodesy helpers — shared by the tour builder and the free-roam hotspots
# ---------------------------------------------------------------------------
def bearing_deg(from_lat: float, from_lng: float, to_lat: float, to_lng: float) -> float:
    """True initial bearing from one point to another, in degrees from north."""
    lat1, lng1, lat2, lng2 = map(math.radians, (from_lat, from_lng, to_lat, to_lng))
    dlng = lng2 - lng1
    y = math.sin(dlng) * math.cos(lat2)
    x = math.cos(lat1) * math.sin(lat2) - math.sin(lat1) * math.cos(lat2) * math.cos(dlng)
    return (math.degrees(math.atan2(y, x)) + 360.0) % 360.0


def distance_m(from_lat: float, from_lng: float, to_lat: float, to_lng: float) -> float:
    """Equirectangular approximation — accurate to centimetres at island scale."""
    mean_lat = math.radians((from_lat + to_lat) / 2.0)
    dx = (to_lng - from_lng) * 111_320.0 * math.cos(mean_lat)
    dy = (to_lat - from_lat) * 110_540.0
    return math.hypot(dx, dy)


def elevation_pitch_deg(horizontal_m: float, height_m: float, eye_height_m: float = 1.8) -> float:
    """Pitch needed to look at something *height_m* tall from *horizontal_m* away."""
    if horizontal_m <= 0.5:
        return 89.0 if height_m > eye_height_m else 0.0
    return math.degrees(math.atan2(height_m - eye_height_m, horizontal_m))


# ---------------------------------------------------------------------------
# Low-level HTTP
# ---------------------------------------------------------------------------
def _get_json(url: str, params: dict[str, Any]) -> Optional[dict]:
    if not settings.GOOGLE_MAPS_API_KEY:
        logger.warning("GOOGLE_MAPS_API_KEY is not set — skipping call to %s", url)
        return None

    query = urllib.parse.urlencode({**params, "key": settings.GOOGLE_MAPS_API_KEY})
    request = urllib.request.Request(
        f"{url}?{query}",
        headers={"User-Agent": "EchoesOfEternity/1.0"},
    )
    try:
        with urllib.request.urlopen(request, timeout=_HTTP_TIMEOUT) as response:
            return json.load(response)
    except (urllib.error.URLError, json.JSONDecodeError, TimeoutError, OSError) as exc:
        logger.error("Google request failed (%s): %s", url, exc)
        return None


# ---------------------------------------------------------------------------
# Street View panorama resolution (free endpoint, permanently cached)
# ---------------------------------------------------------------------------
def resolve_panorama(
    lat: float,
    lng: float,
    radius_m: int = 40,
    outdoor_only: bool = True,
) -> Optional[dict]:
    """Resolve the nearest panorama to a coordinate.

    Returns ``{pano_id, lat, lng, date, copyright}`` or None when there is no
    coverage. Cached forever, keyed on the rounded request, so a given demo
    machine performs each lookup exactly once in its lifetime.
    """
    key = f"{round(lat, 6)},{round(lng, 6)}@{radius_m}{'-outdoor' if outdoor_only else ''}"

    def fetch() -> Optional[dict]:
        params: dict[str, Any] = {"location": f"{lat},{lng}", "radius": radius_m}
        if outdoor_only:
            params["source"] = "outdoor"
        payload = _get_json(STREET_VIEW_METADATA_URL, params)
        if not payload or payload.get("status") != "OK":
            # Cache the negative result too — "no coverage here" is a stable fact
            # and we never want to re-ask. Stored as a dict so it is cacheable.
            if payload is not None:
                return {"status": payload.get("status", "ZERO_RESULTS")}
            return None
        location = payload.get("location") or {}
        return {
            "status": "OK",
            "pano_id": payload.get("pano_id"),
            "lat": location.get("lat"),
            "lng": location.get("lng"),
            "date": payload.get("date"),
            "copyright": payload.get("copyright"),
        }

    value, was_cached = cache.get_or_set(
        "streetview-pano", key, fetch, settings.PANO_CACHE_TTL_SECONDS
    )
    if value is None or value.get("status") != "OK":
        return None
    value = dict(value)
    value["cached"] = was_cached
    return value


def verify_route(waypoints: list[dict], radius_m: int = 40) -> list[dict]:
    """Re-resolve each waypoint's panorama and report drift.

    Used by the ``/experience/{id}/verify`` maintenance endpoint. Results come
    from the permanent cache after the first run, so calling it repeatedly costs
    nothing — and metadata requests are free regardless.
    """
    report: list[dict] = []
    for waypoint in waypoints:
        resolved = resolve_panorama(waypoint["lat"], waypoint["lng"], radius_m)
        report.append(
            {
                "id": waypoint["id"],
                "expected_pano_id": waypoint["pano_id"],
                "resolved_pano_id": resolved.get("pano_id") if resolved else None,
                "matches": bool(resolved and resolved.get("pano_id") == waypoint["pano_id"]),
                "coverage": bool(resolved),
                "from_cache": bool(resolved and resolved.get("cached")),
            }
        )
    return report


# ---------------------------------------------------------------------------
# Photorealistic 3D Tiles — session reuse is the entire billing story
#
# Google bills the *root tileset* request, not the thousands of glTF tiles a
# renderer pulls afterwards, and one root request stays valid for at least three
# hours. Critically, the root endpoint rejects a caller-supplied `session`
# parameter (HTTP 400), so a browser cannot be handed a token to reuse — the only
# way to share a session is to serve the cached root *document*, whose child URIs
# already carry it. That is what ``get_tiles_root`` does: one root request per
# 2h30m for the whole machine, no matter how many times the aerial view opens.
# ---------------------------------------------------------------------------
_TILES_NAMESPACE = "tiles-root"
_TILES_KEY = "root"
_TILES_HOST = "https://tile.googleapis.com"


def _absolutise_uris(node: Any) -> Any:
    """Rewrite the root document's relative child URIs to absolute Google URLs.

    The document we serve no longer lives on tile.googleapis.com, so its
    root-relative ``/v1/3dtiles/...`` URIs would otherwise resolve against our
    own backend. Making them absolute keeps every tile request going straight
    from the browser to Google (we proxy nothing but this one 66 KB document)
    while preserving the session token Google embedded in each URI.
    """
    if isinstance(node, dict):
        out = {}
        for name, value in node.items():
            if name == "uri" and isinstance(value, str) and value.startswith("/"):
                out[name] = _TILES_HOST + value
            else:
                out[name] = _absolutise_uris(value)
        return out
    if isinstance(node, list):
        return [_absolutise_uris(item) for item in node]
    return node


def _extract_session(root_tileset: dict) -> Optional[str]:
    """Pull the session token out of a root tileset's child URIs."""
    blob = json.dumps(root_tileset)
    marker = "session="
    index = blob.find(marker)
    if index == -1:
        return None
    token = blob[index + len(marker):]
    for terminator in ('"', "&", "\\"):
        cut = token.find(terminator)
        if cut != -1:
            token = token[:cut]
    return token or None


def get_tiles_root(force_refresh: bool = False) -> dict:
    """Return a cached, browser-ready Photorealistic 3D Tiles root tileset.

    The result is ``{available, tileset, session, created_at, ...}``. On failure
    ``available`` is False and ``reason`` explains why, so the frontend can fall
    back to Cesium's own loader (which works, but mints a session per page load).
    """
    if force_refresh:
        cached = None
    else:
        cached = cache.read(_TILES_NAMESPACE, _TILES_KEY, settings.TILES_SESSION_TTL_SECONDS)

    if cached:
        age = time.time() - cached.get("created_at", 0)
        return {
            **cached,
            "cached": True,
            "age_seconds": int(age),
            "expires_in_seconds": max(0, int(settings.TILES_SESSION_TTL_SECONDS - age)),
        }

    if not settings.GOOGLE_MAPS_API_KEY:
        return {
            "available": False,
            "reason": "GOOGLE_MAPS_API_KEY is not configured on the backend.",
            "cached": False,
        }

    raw_root = _get_json(TILES_ROOT_URL, {})
    if not raw_root:
        return {
            "available": False,
            "reason": "Root tileset request failed — check that the Map Tiles API is enabled for this key.",
            "cached": False,
        }

    session = _extract_session(raw_root)
    if not session:
        return {
            "available": False,
            "reason": "Root tileset carried no session token.",
            "cached": False,
        }

    record = {
        "available": True,
        "tileset": _absolutise_uris(raw_root),
        "session": session,
        "created_at": time.time(),
        "attribution": "Google",
    }
    cache.write(_TILES_NAMESPACE, _TILES_KEY, record)
    logger.info(
        "Minted a new Photorealistic 3D Tiles session (Google-valid ~3h, cached %ds).",
        settings.TILES_SESSION_TTL_SECONDS,
    )
    return {
        **record,
        "cached": False,
        "age_seconds": 0,
        "expires_in_seconds": settings.TILES_SESSION_TTL_SECONDS,
    }


def tiles_session_status() -> dict:
    """Describe the cached session without ever triggering a billable request."""
    cached = cache.read(_TILES_NAMESPACE, _TILES_KEY, settings.TILES_SESSION_TTL_SECONDS)
    if not cached:
        return {"active": False, "ttl_seconds": settings.TILES_SESSION_TTL_SECONDS}
    age = time.time() - cached.get("created_at", 0)
    return {
        "active": True,
        "session_prefix": (cached.get("session") or "")[:12] + "…",
        "age_seconds": int(age),
        "expires_in_seconds": max(0, int(settings.TILES_SESSION_TTL_SECONDS - age)),
        "ttl_seconds": settings.TILES_SESSION_TTL_SECONDS,
    }
