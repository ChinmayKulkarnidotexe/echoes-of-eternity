# Echoes of Eternity — Immersive AI Heritage & Art Experience

**ACM x MLH Hack Days 2026 · NMAMIT · Track 1: "What is Earth without art?"**
**Team Size:** 2 Developers · **Build Window:** 6 Hours · **Gemini Integration:** Compulsory

---

## Overview

**Echoes of Eternity** transforms passive cultural exploration into an engaging, multi-sensory virtual journey:

1. **Monument Experience** — The **Statue of Liberty**, in three modes that hand off to each other automatically.
2. **The Grand Gallery** — A Three.js museum hall with skylights, exhibition bays and 3D plinths, holding nine public-domain masterpieces you can walk up to and examine.
3. **Gemini AI Docent** — In both places, listen to audio narration and ask free-form questions by voice or text, answered by Google Gemini grounded strictly in verified facts.
4. **Speaks your language** — Narration, answers and the microphone all follow a chosen language and regional accent, with the gallery's plaques and headings localised to match.

---

## Voice: language & accent

The gallery carries a language picker (`LanguageDropdownUpward`, backed by
`src/data/languages.ts`) offering a language and a regional accent — the accent
is a BCP 47 locale such as `en-GB` or `es-MX`, not just a flag.

That choice drives four things at once, and all four have to agree or the
feature is only cosmetic:

| What | How the locale is used |
|---|---|
| **Questions** | `askQuestion(..., language.id)` sends `target_lang`; the backend translates to English, grounds the answer in the English facts, and translates the answer back |
| **Answers spoken** | `utterance.lang` is set to the accent code and a matching `SpeechSynthesisVoice` is selected, falling back to the base language when the exact locale has no voice installed |
| **Microphone** | `recognition.lang` is set to the accent code, so the visitor is transcribed in their own language |
| **The room itself** | The plinth plaque texture is rebuilt per language, and museum headings come from `getMuseumHeaders(langId)` |

Translation happens in `backend/app/translation_service.py`; grounding stays in
English throughout, so a question asked in Spanish is answered from exactly the
same verified facts as one asked in English.

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
│       │   ├── useNarration.ts     # Paces each narration leg off the voice
│       │   └── useVoiceInput.ts    # Microphone capture that fails loudly
│       ├── data/languages.ts       # Languages + regional accents (BCP 47)
│       ├── utils/i18nHeaders.ts    # Localised museum headings
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
│       │   ├── Gallery/
│       │   │   ├── PaintingViewer.tsx      # The 3D Grand Gallery hall
│       │   │   ├── PaintingAskBar.tsx      # Curator Q&A, localised voice I/O
│       │   │   ├── GalleryVoicePanel.tsx   # (unused — see Dead code below)
│       │   │   └── GalleryGrid.tsx         # (unused)
│       │   ├── LanguageDropdownUpward.tsx  # Language + accent picker
│       │   ├── LanguageSelectorModal.tsx   # (unused — modal variant)
│       │   ├── LandingPage.tsx
│       │   ├── MonumentsPage.tsx
│       │   ├── PaintingsPage.tsx
│       │   ├── Navigation/Navbar.tsx       # (unused)
│       │   └── AIGuide/GuidePanel.tsx      # (unused)
│       ├── App.tsx
│       ├── main.tsx
│       └── index.css
│
└── backend/                        # Python FastAPI + Gemini AI + SQLAlchemy
    ├── .env / .env.example
    ├── requirements.txt
    ├── .cache/                     # Cached Google/Gemini responses (gitignored)
    ├── scripts/
    │   ├── export_fallback.py      # Regenerates the frontend offline bundle
    │   ├── capture_plate.py        # One-off: saves the catalogue card image
    │   ├── check_gemini.py         # End-to-end Gemini smoke test
    │   ├── probe_quota.py          # Which Gemini models still have quota today
    │   └── list_models.py          # Models this key may call
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
        ├── gemini_service.py       # Gemini prompts, pacing, model rotation
        ├── translation_service.py  # Google Translate, for non-English visitors
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
| `/ask` | POST | Grounded Q&A — body: `{context_type, context_id, question, target_lang}`. `context_type` is `poi`, `painting`, `waypoint`, `hotspot` or `monument`; the last three take string ids from `tour_data.py`. A non-English `target_lang` round-trips through Google Translate around the English grounding |
| `/painting-info/{id}?lang=` | GET | Painting narration, optionally translated |
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
cp .env.example .env                # Add GEMINI_API_KEY and GOOGLE_MAPS_API
uvicorn app.main:app --reload --port 8000
```

API docs → [http://localhost:8000/docs](http://localhost:8000/docs)

`backend/.env` keys:

| Key | Purpose |
|---|---|
| `GOOGLE_MAPS_API` | Street View, Photorealistic 3D Tiles, Translate |
| `GEMINI_API_KEY` | Live answers to visitor questions |
| `GEMINI_MODEL` | Defaults to `gemini-3.5-flash`; a retired name rotates automatically |
| `GEMINI_POLISH_NARRATION` | `1` lets Gemini rewrite the tour script. Off by default — see *Where Gemini is spent* |

On Windows, `start-dev.ps1` launches both servers and first clears any stale
`uvicorn` worker still holding port 8000 — one of those surviving a closed
terminal looks exactly like the backend serving outdated data.

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
| Gemini rate limit / no key | Every line of narration is hand-written and demo-ready; Gemini is reserved for live questions, and a retired model or spent daily quota rotates to the next candidate automatically |
| Street View coverage changes | All 11 panorama IDs are pinned, not looked up live; `/maps/streetview/verify` confirms they still resolve |
| Speech cuts out mid-sentence | Chrome stops synthesising after ~15 s; a keepalive prevents it, and the tour advances on a stall guard if the voice dies silently |
| Tour races past when there is no audio | Speech reports `end` immediately when it cannot play (no output device, backgrounded tab). Each stop has a minimum on-screen time, so the walk stays watchable in silence |
| Microphone silently does nothing | Every voice session has an `end` handler, a 9-second watchdog and a visible message, so a blocked permission says so instead of sticking on "listening" |
| Database holds an earlier build's data | Both the monument and the gallery seeds replace a set that does not match this build, rather than skipping because rows already exist |
| Painting images unreachable | All nine are local files under `frontend/public/paintings`, not hot-linked |
| Database setup delays | SQLite is used by default — zero config, works instantly |
| Venue wifi drops | Everything runs on localhost; record a backup demo video |

---

## What changed, and why

The reasoning behind the less obvious decisions, so nobody re-litigates them
from scratch:

**The monument experience was rebuilt as three modes.** It replaced a single
Street View panel with POI buttons. `MonumentExperiencePage.tsx` and
`StreetView/StreetViewPanel.tsx` were removed.

**The database held the wrong monument.** The seed had been rewritten for the
Statue of Liberty but only ran when the tables were empty, so an earlier build's
Taj Mahal data survived every restart. `seed.py` is now self-healing: it
replaces a monument that does not match this build, while leaving the gallery
alone.

**Only one monument is listed, deliberately.** Each site needs verified Street
View coverage and an authored script in `tour_data.py` first; listing one
without that offers a tour that cannot run.

**Hotspots are placed anatomically, not stacked.** Seven markers on the central
axis piled up on screen. Five now sit on the statue's own geometry — she faces
south-east, so the torch arm points south-west and the tablet north-east — which
separates them horizontally from every vantage point.

**Gemini is spent on questions, not narration.** The free tier allows roughly
twenty requests per *day* per model. Polishing the fourteen tour lines would
consume most of that to rewrite prose already written for speech.

**Pause stopped using `speechSynthesis.pause()`.** Chrome does not honour it for
the remote voices this guide prefers, so a keepalive nudge was restarting
narration the visitor had stopped. A pause now cancels and remembers the
character offset; resume speaks the remainder.

**Emoji were replaced with Lucide icons** throughout the monument flow and the
landing and catalogue pages, and the pages were rebuilt to read as editorial
layouts rather than generated ones.

**`.gitignore` was swallowing `frontend/src/lib/`** via an unanchored Python
`lib/` rule. The Python entries are now anchored to `backend/`.

**The catalogue card image is a local file.** The stock photograph there showed
the Manhattan skyline rather than the monument; `scripts/capture_plate.py`
captured the panorama the walk actually opens on, once, at build time.

**The gallery had lost five of its nine paintings.** The images, the frontend
fallback list and all nine precached narrations were present, but `seed.py` still
held only the original four and hot-linked them from Wikimedia — so the backend
served four, and the extra five appeared only when the backend was *down* and the
offline fallback kicked in. The painting seed is now self-healing like the
monument one, and serves local images from `frontend/public/paintings`.

**The stash-pop merge.** Two files conflicted — `backend/app/routes/qa.py`
(docstring only; both code paths had already merged) and
`frontend/src/types/index.ts` (purely additive). Both sides were kept. The merge
had also left the gallery's language picker rendering nothing and its ask bar
hardcoded to English, so the picker only relabelled the plaque; the dropdown is
mounted again and the locale now reaches the question, the answer's voice and
the microphone.

---

## Known loose ends

Honest notes on the current state, rather than a clean-looking omission:

- **Dead components.** `GalleryVoicePanel`, `GalleryGrid`, `GuidePanel`,
  `LanguageSelectorModal` and `Navbar` are no longer referenced by anything —
  the 3D gallery superseded the grid-and-panel layout. They still compile.
  `GalleryVoicePanel` is the only caller of `fetchPaintingInfo`, so that API
  helper is currently unused too. Delete them, or wire one back in; leaving them
  is the one thing that will mislead a reader.
- **Three speech implementations.** `services/speech.ts` (monuments, with the
  pause/resume and keepalive work) and the inline implementations inside
  `PaintingAskBar` and `GalleryVoicePanel`. They behave differently under pause.
  Consolidating onto `speech.ts` with a locale argument would give the monument
  side language support too, which it does not currently have.
- **Monument narration is English only.** The language picker lives in the
  gallery; the monument tour always speaks English.
- **`google.generativeai` is deprecated.** It works, but Google has ended
  support in favour of `google.genai`. Worth migrating after the hackathon.
- **Voice input's happy path is unverified.** The failure handling was tested;
  actual transcription needs a real microphone and a granted permission prompt.
