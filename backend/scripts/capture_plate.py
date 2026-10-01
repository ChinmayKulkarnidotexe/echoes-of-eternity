"""Save a still of the monument's opening view as a local frontend asset.

The monument catalogue card used a stock photograph that happened to show the
Manhattan skyline rather than the statue. This grabs the exact panorama the
guided walk opens on instead, so the card shows what the visitor is about to
step into.

This is the one and only Street View *Static* API request in the project, it is
made at build time rather than at runtime, and the result is committed as a
normal image — so it costs a fraction of a cent, once, ever.

    cd backend
    .venv/Scripts/python.exe -m scripts.capture_plate
"""

from __future__ import annotations

import sys
import urllib.parse
import urllib.request
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

from app.config import settings  # noqa: E402
from app.tour_data import TOUR_WAYPOINTS  # noqa: E402

OUTPUT = BACKEND_DIR.parent / "frontend" / "public" / "liberty-plate.jpg"
ENDPOINT = "https://maps.googleapis.com/maps/api/streetview"


def main() -> int:
    if not settings.GOOGLE_MAPS_API_KEY:
        print("GOOGLE_MAPS_API_KEY is not configured.")
        return 1

    if OUTPUT.exists():
        print(f"{OUTPUT.name} already exists — delete it first to re-capture.")
        return 0

    opening = TOUR_WAYPOINTS[0]
    params = {
        "size": "640x640",
        "pano": opening["pano_id"],
        "heading": opening["heading"],
        "pitch": opening["pitch"],
        "fov": 80,
        "return_error_code": "true",
        "key": settings.GOOGLE_MAPS_API_KEY,
    }

    url = f"{ENDPOINT}?{urllib.parse.urlencode(params)}"
    request = urllib.request.Request(url, headers={"User-Agent": "EchoesOfEternity/1.0"})
    with urllib.request.urlopen(request, timeout=30) as response:
        if response.status != 200:
            print(f"Street View Static returned HTTP {response.status}")
            return 1
        data = response.read()

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_bytes(data)
    print(f"[OK] Wrote {OUTPUT.relative_to(BACKEND_DIR.parent)} ({len(data) // 1024} KB)")
    print(f"     Panorama {opening['pano_id']} — {opening['title']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
