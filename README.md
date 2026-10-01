# 🏛️ Echoes of Eternity — Immersive AI Heritage & Art Experience

**ACM x MLH Hack Days 2026 · NMAMIT · Track 1: "What is Earth without art?"**
**Team Size:** 2 Developers · **Build Window:** 6 Hours · **Gemini Integration:** Compulsory

---

## Overview

**Echoes of Eternity** transforms passive cultural exploration into an engaging, multi-sensory virtual journey:

1. **Monument Walkthrough** — Explore the **Statue of Liberty** using Google Street View panoramas, auto-guided across 4 Points of Interest (POIs) with synchronised headings and camera pitch.
2. **Fine Art Gallery** — Inspect public-domain masterpieces (*The Starry Night*, *Mona Lisa*, *The Great Wave*, *Girl with a Pearl Earring*) in an interactive Three.js 3D orbit/tilt viewer.
3. **Gemini AI Docent** — In both modes, listen to audio narration and ask free-form questions via voice or text, answered by Google Gemini grounded strictly in verified historical facts.

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
│       ├── services/
│       │   ├── api.ts              # API client with offline fallbacks
│       │   └── speech.ts           # Web Speech API (TTS & STT)
│       ├── components/
│       │   ├── Navigation/Navbar.tsx
│       │   ├── StreetView/StreetViewPanel.tsx
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
    └── app/
        ├── __init__.py
        ├── config.py
        ├── database.py
        ├── models.py               # Monument, POI, Painting
        ├── schemas.py              # Pydantic request/response models
        ├── seed.py                 # Statue of Liberty POIs + 4 paintings
        ├── gemini_service.py       # Gemini prompts, system instruction, fallbacks
        ├── main.py                 # FastAPI app with async lifespan
        └── routes/
            ├── __init__.py
            ├── monuments.py        # GET /monuments/{id}, /monuments/{id}/pois, /narrate/{poi_id}
            ├── paintings.py        # GET /paintings, /painting-info/{id}
            └── qa.py               # POST /ask
```

---

## API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/monuments/{id}` | GET | Full monument metadata with POIs |
| `/monuments/{id}/pois` | GET | Ordered POI list with pano coordinates |
| `/narrate/{poi_id}` | GET | Gemini narration for a specific POI |
| `/paintings` | GET | All gallery paintings |
| `/painting-info/{id}` | GET | Gemini narration for a painting |
| `/ask` | POST | Grounded Q&A — body: `{context_type, context_id, question}` |
| `/health` | GET | Health check |

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
| No Google Maps API key | Frontend shows high-res photographic fallback with full POI controls |
| Gemini rate limit / no key | Backend returns pre-cached narrations; frontend has offline fallback data |
| Database setup delays | SQLite is used by default — zero config, works instantly |
| Venue wifi drops | Everything runs on localhost; record a backup demo video |
