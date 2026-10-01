# 🏛️ Echoes of Eternity — Immersive AI Heritage & Art Experience

**ACM x MLH Hack Days 2026 · NMAMIT · Track 1: "What is Earth without art?"**
**Team Size:** 2 Developers · **Build Window:** 6 Hours · **Gemini Integration:** Compulsory

---

## Overview

**Echoes of Eternity** transforms passive cultural exploration into an engaging, multi-sensory virtual journey:

1. **Monument Experience** — The **Statue of Liberty**, in three modes that hand off to each other automatically.
2. **Fine Art Gallery** — Inspect public-domain masterpieces (*The Starry Night*, *Mona Lisa*, *The Great Wave*, *Girl with a Pearl Earring*) in an interactive Three.js 3D orbit/tilt viewer.
3. **Gemini AI Docent** — In both places, listen to audio narration and ask free-form questions via voice or text, answered by Google Gemini grounded strictly in verified historical facts.

---

## The Monument Experience

Three modes run in sequence. Each one ends by handing over to the next, and the
stage rail across the top lets you jump back to anything you have already seen.

| Mode | What happens | Imagery |
|---|---|---|
| **1 · Aerial Orbit** | A slow automatic orbit of Liberty Island while the guide narrates three opening beats (~45 s). Hands over to the walk. | Google Photorealistic 3D Tiles, rendered with CesiumJS |
| **2 · Guided Walk** | The guide walks you once around the statue — 11 verified vantage points, ~3 minutes. You can look anywhere you like; you cannot walk off on your own. | Google Street View |
| **3 · Free Roam** | The island is yours. Walk the panorama network, and click any of the 5 hotspots for a card with its story and its own question box. | Google Street View |

Hotspots are projected into the panorama from real world positions and heights,
so the torch marker floats at the torch (90 m up) rather than sitting on the
horizon. They are placed anatomically rather than stacked on the central axis:
the statue faces south-east, so her right arm — the one holding the torch —
points south-west, and the tablet in her left arm points north-east. Offsetting
along those bearings separates the markers horizontally as well as vertically
from every vantage point on the walkway. Every heading in the tour is a true
bearing toward the statue's axis.

**Only the Statue of Liberty is listed.** A monument needs its Street View
coverage verified and its tour script written in `backend/app/tour_data.py`
before it can appear; listing one without that would offer a tour that cannot
run. Add the route there first, then add the card in `MonumentsPage.tsx`.

---

## Google API usage & caching

Billing-sensitive work is done once by the backend and shared, rather than by
every browser tab:

| Google surface | Billing | What we do |
|---|---|---|
| **Photorealistic 3D Tiles** | Per *root tileset* request; one root request covers ≥3 h of tile traffic | The backend fetches the root document at most once per 2 h 30 m and serves that cached copy at `/maps/3dtiles/root.json`, with child URIs rewritten to absolute Google URLs. The root endpoint rejects a caller-supplied `session` (HTTP 400), so sharing the **document** is the only way for browsers to share one billable session. Tile traffic itself goes browser→Google directly and is not billed per tile. |
| **Street View metadata** | Free | Used only to resolve and verify the tour route. Results are cached permanently, so `/maps/streetview/verify` costs nothing after the first run. |
| **Street View panoramas** | Per panorama load, in the browser | The tour uses 11 fixed, pre-resolved panorama IDs — no live lookups. The panorama object is created once and kept alive across the walk and free roam, so switching modes never re-bills the same imagery. |
| **Street View Static** | Per image | Used exactly once, at build time, by `scripts/capture_plate.py` to save the catalogue card's image as a local file. Nothing calls it at runtime. |

`GET /maps/quota` reports what has been spent and what is cached.
The cache lives in `backend/.cache/` and is gitignored (it holds a live session token).

The browser caches too: the experience bundle sits in `localStorage` for twelve
hours so a reload renders instantly, the 3D Tiles root is served with a
`Cache-Control` lifetime matching its session, Cesium gets a large tile cache so
a full orbit never re-downloads imagery it just showed, and the monument
catalogue preconnects to Google's imagery hosts and begins fetching CesiumJS and
the Maps API while the visitor is still reading the page.

### Where Gemini is spent

The Gemini free tier is much tighter than the per-minute limits suggest — the
headline flash models allow roughly **twenty requests per day, per model**. The
budget therefore goes where the model is doing genuinely unscripted work:

| Surface | Uses Gemini? |
|---|---|
| Visitor questions — `/ask`, from the hotspot card and the free-roam bar | **Yes, live**, grounded in that hotspot's or waypoint's verified facts |
| The guided-tour narration | No, by default. The script in `tour_data.py` is written to be spoken, and polishing it costs fourteen requests. Set `GEMINI_POLISH_NARRATION=1` to enable it; results cache permanently. |

If a model is retired or its daily quota runs out, the backend rotates to the
next candidate rather than failing. Check what a key can still serve:

```bash
cd backend
.venv/Scripts/python.exe -m scripts.probe_quota   # which models have quota left
.venv/Scripts/python.exe -m scripts.check_gemini  # end-to-end narration + Q&A
```

---

## Project Structure

```
acm-mlh-hackathon/
├── .gitignore
├── README.md
├── TEAM_SPLIT_GUIDE.md
├── PRD_heritage_gallery_experience.md
├── start-dev.ps1                   # One-click dev launcher (PowerShell)
│
├── frontend/                       # React + TypeScript + Three.js + Tailwind CSS
│   ├── .env / .env.example
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   └── src/
│       ├── types/index.ts
│       ├── lib/
│       │   ├── geo.ts              # Bearings, distances, panorama projection
│       │   └── loaders.ts          # Single-flight Maps JS + CesiumJS loaders
│       ├── hooks/
│       │   └── useNarration.ts     # Paces each narration leg off the voice
│       ├── services/
│       │   ├── api.ts              # API client with offline fallbacks
│       │   ├── fallbackExperience.ts  # Generated offline copy of /experience/1
│       │   └── speech.ts           # Web Speech API (TTS & STT)
│       ├── components/
│       │   ├── Monument/
│       │   │   ├── MonumentExperience.tsx  # Three-mode orchestrator
│       │   │   ├── AerialOrbitView.tsx     # Mode 1 — Cesium + 3D Tiles orbit
│       │   │   ├── StreetViewStage.tsx     # Modes 2 & 3 — one shared panorama
│       │   │   ├── HotspotLayer.tsx        # World-positioned hotspots
│       │   │   ├── HotspotCard.tsx         # Free-roam pop-up card
│       │   │   ├── FreeRoamHud.tsx         # POI index, vantage rail, ask bar
│       │   │   ├── NarrationBar.tsx        # Captions + transport controls
│       │   │   └── ModeStepper.tsx         # Stage rail / navigation
│       │   ├── Navigation/Navbar.tsx
│       │   ├── Gallery/GalleryGrid.tsx
│       │   ├── Gallery/PaintingViewer.tsx
│       │   └── AIGuide/GuidePanel.tsx
│       ├── App.tsx
│       ├── main.tsx
│       └── index.css
│
└── backend/                        # Python FastAPI + Gemini AI + SQLAlchemy
    ├── .env / .env.example
    ├── requirements.txt
    ├── .cache/                     # Cached Google/Gemini responses (gitignored)
    ├── scripts/
    │   └── export_fallback.py      # Regenerates the frontend offline bundle
    └── app/
        ├── __init__.py
        ├── config.py
        ├── cache.py                # Disk cache with TTLs
        ├── database.py
        ├── models.py               # Monument, POI, Painting
        ├── schemas.py              # Pydantic request/response models
        ├── seed.py                 # Self-healing Statue of Liberty seed
        ├── tour_data.py            # Authored, coverage-verified tour content
        ├── maps_service.py         # Street View + 3D Tiles access, cached
        ├── experience_service.py   # Assembles the three-mode bundle
        ├── gemini_service.py       # Gemini prompts, system instruction, fallbacks
        ├── main.py                 # FastAPI app with async lifespan
        └── routes/
            ├── __init__.py
            ├── monuments.py        # GET /monuments/{id}, /monuments/{id}/pois, /narrate/{poi_id}
            ├── experience.py       # GET /experience/{id}, 3D Tiles root, quota
            ├── paintings.py        # GET /paintings, /painting-info/{id}
            └── qa.py               # POST /ask
```

---

## API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/experience/{id}` | GET | **The whole three-mode bundle in one call** — aerial, tour, free roam |
| `/experience/{id}/refresh` | POST | Drop the cached bundle and rebuild from `tour_data.py` |
| `/maps/3dtiles/root.json` | GET | Cached Photorealistic 3D Tiles root tileset (shared session) |
| `/maps/tiles-session` | GET | Cached session status — never triggers a billable request |
| `/maps/streetview/verify` | GET | Re-resolve every tour panorama (free, cached) |
| `/maps/quota` | GET | What has been spent against Google, and what is cached |
| `/monuments/{id}` | GET | Full monument metadata with POIs |
| `/monuments/{id}/pois` | GET | Ordered POI list with pano coordinates |
| `/narrate/{poi_id}` | GET | Gemini narration for a specific POI |
| `/paintings` | GET | All gallery paintings |
| `/painting-info/{id}` | GET | Gemini narration for a painting |
| `/ask` | POST | Grounded Q&A — body: `{context_type, context_id, question}`. `context_type` is `poi`, `painting`, `waypoint`, `hotspot` or `monument`; the last three take string ids from `tour_data.py` |
| `/health` | GET | Health check, key configuration and cache counts |

---

## Editing the tour

The tour script, the panorama route and the hotspots all live in one file:
`backend/app/tour_data.py`. After editing it:

```bash
cd backend
curl -X POST http://localhost:8000/experience/1/refresh   # rebuild the cached bundle
.venv/Scripts/python.exe -m scripts.export_fallback       # regenerate the offline copy
```

The bundle is cached on disk, so **a change to `tour_data.py` will not appear
until the cache is dropped** — restarting the server alone is not enough.

To check the route still resolves against Google (free, cached after the first run):

```bash
curl http://localhost:8000/maps/streetview/verify
```

---

## Quickstart

### Backend (Person B)

```bash
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1          # Windows
pip install -r requirements.txt
cp .env.example .env                # Add GEMINI_API_KEY
uvicorn app.main:app --reload --port 8000
```

API docs → [http://localhost:8000/docs](http://localhost:8000/docs)

### Frontend (Person A)

```bash
cd frontend
npm install
cp .env.example .env                # Add VITE_GOOGLE_MAPS_API_KEY (optional)
npm run dev
```

App → [http://localhost:5173](http://localhost:5173)

---

## Risk Mitigations

| Risk | Mitigation |
|---|---|
| Map Tiles API not enabled / 3D Tiles fail | The aerial view explains what is missing and hands over to the guided walk after a few seconds, rather than trapping the visitor on a dead screen |
| Backend offline | The frontend falls back to a generated offline copy of the experience bundle (`fallbackExperience.ts`) — all three modes still run |
| Gemini rate limit / no key | Every line of narration is hand-written and demo-ready; Gemini only polishes it, and the result is cached permanently |
| Street View coverage changes | All 11 panorama IDs are pinned, not looked up live; `/maps/streetview/verify` confirms they still resolve |
| Speech cuts out mid-sentence | Chrome stops synthesising after ~15 s; a pause/resume keepalive prevents it, and the tour advances on a stall guard if the voice dies silently |
| Database setup delays | SQLite is used by default — zero config, works instantly |
| Venue wifi drops | Everything runs on localhost; record a backup demo video |
