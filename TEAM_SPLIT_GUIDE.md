# 🤝 6-Hour MVP Team Split & Execution Guide
**Project:** AURA — Immersive AI Heritage & Art Experience  
**Hackathon:** ACM x MLH Hack Days 2026 · NMAMIT · Track 1 ("What is Earth without art?")  
**Build Time:** 6 Hours · **Team Size:** 2 People · **Gemini AI:** Compulsory  

---

## 👥 Role Allocation

| Teammate | Focus Area | Primary Stack | Key Responsibilities |
|---|---|---|---|
| **Person A** | **Frontend Experience** | React, TypeScript, Three.js, Tailwind CSS, Web Speech API | Street View walkthrough, POI hotspots, auto-tour playback, 3D painting orbit viewer, voice STT/TTS UI |
| **Person B** | **Backend, Data & AI** | Python, FastAPI, SQLAlchemy, PostgreSQL / SQLite, Google Gemini API | API endpoints, database schema & seeding, Gemini prompt engineering, grounding facts, pre-cached fallback responses |

---

## ⏱️ Hour-by-Hour Synchronized Timeline

```
Hour 1 ─────────► Hour 2 ─────────► Hour 3 ─────────► Hour 4 ─────────► Hour 5 ─────────► Hour 6
[Person A: Maps]  [Hotspots & Tour] [Voice & Speech]   [API Wiring]      [3D Gallery]      [Joint Polish]
[Person B: API]   [DB & Seeding]    [Gemini Prompts]   [Endpoint Finish] [Integration]     [Backup Video]
                                                                                     ▲
                                                                          Shared Demo Milestone
```

### 🕒 Hour 1: Environment & Core Canvases
- **Person A (Frontend):**
  - Run `cd frontend && npm run dev` (starts on `http://localhost:5173`).
  - Configure `VITE_GOOGLE_MAPS_API_KEY` in `frontend/.env`.
  - Verify `StreetViewPanorama` loads at Taj Mahal coordinates (`lat: 27.1751448, lng: 78.0421422`).
  - Test heading/pitch transitions.
- **Person B (Backend):**
  - Run `cd backend && .venv\Scripts\uvicorn app.main:app --reload` (starts on `http://localhost:8000`).
  - Verify Swagger UI at `http://localhost:8000/docs`.
  - Add `GEMINI_API_KEY` to `backend/.env`.
  - Test test endpoint `/monuments/1/pois` to ensure database auto-created and seeded.

---

### 🕒 Hour 2: POI Navigation & Database Grounding
- **Person A (Frontend):**
  - Connect `pois` state to `StreetViewPanel`.
  - Implement POI step indicators, Previous / Next buttons, and smooth panorama panning on POI click.
  - Test responsive layout on laptop screen.
- **Person B (Backend):**
  - Inspect `backend/app/seed.py`: refine grounding `facts_text` for Taj Mahal POIs and 4 paintings.
  - Test database queries and verify relationships (`monument.pois`).
  - Test switching between SQLite (local development) and PostgreSQL (if using external instance).

---

### 🕒 Hour 3: Web Speech & Prompt Engineering
- **Person A (Frontend):**
  - Verify Web Speech API Text-to-Speech (`speechSynthesis`) in `frontend/src/services/speech.ts`.
  - Test microphone Speech-to-Text (`webkitSpeechRecognition`) for hands-free voice questions.
  - Implement the 12-second auto-advance tour timer when "Start Guided Tour" is active.
- **Person B (Backend):**
  - Refine Gemini prompts in `backend/app/gemini_service.py` for `/narrate/{poi_id}` and `/ask`.
  - Test prompt grounding: ensure responses cite specific facts (e.g. Makrana marble, Pietra Dura, Quranic calligraphic scale).
  - Verify offline/fallback behavior works even without network connection.

---

### 🕒 Hour 4: Monument API Integration & Mid-Point Milestone
- **Person A & Person B (Joint Integration):**
  - Wire frontend `api.ts` directly to live FastAPI backend (`http://localhost:8000`).
  - Verify Flow A end-to-end:
    1. Monument loads at Stop 1.
    2. Backend returns Gemini-grounded narration.
    3. Voice docent speaks the narration aloud.
    4. User speaks or types a question (e.g. *"Who built this and why?"*).
    5. Gemini replies with grounded docent answer.
    6. Tour advances to Stop 2 smoothly.

---

### 🕒 Hour 5: Fine Art Gallery & Three.js 3D Viewer
- **Person A (Frontend):**
  - Polish the 3D Painting Viewer (`PaintingViewer.tsx`): verify smooth mouse tilt/drag orbit and wheel zoom on high-res artwork textures.
  - Wire gallery thumbnail clicks to open 3D inspector.
  - Connect `/painting-info/{id}` narration into `GuidePanel`.
- **Person B (Backend):**
  - Ensure high-resolution public-domain image links from Wikimedia load cleanly without CORS issues.
  - Add fallback responses in `PRECACHED_NARRATIONS` for each painting.
  - Add error logging and latency monitoring for Gemini requests.

---

### 🕒 Hour 6: Demo Rehearsal & Backup Video Recording
- **Person A & Person B (Joint Polish):**
  - Test full judge walkthrough:
    - Monument Flow (3-4 POIs + 1 live voice question).
    - Gallery Flow (2-3 paintings + 3D orbit + 1 live question).
  - **CRITICAL (PRD Section 12):** Screen record a full 2-minute clean demo video using OBS / Windows Game Bar (`Win + Alt + R`) and save to `demo_backup.mp4`.
  - Commit all final changes to git: `git commit -m "Final Hackathon MVP"`.

---

## 📡 API Contract Reference

| Endpoint | Method | Input | Output / Sample Response |
|---|---|---|---|
| `/monuments/{id}/pois` | GET | `id: int` | `[{"id": 1, "name": "The Great Gate", "pano_heading": 0, "pano_pitch": 8, "facts_text": "..."}]` |
| `/narrate/{poi_id}` | GET | `poi_id: int` | `{"context_type": "poi", "context_id": 1, "title": "...", "narration": "..."}` |
| `/paintings` | GET | none | `[{"id": 1, "title": "The Starry Night", "artist": "Vincent van Gogh", "year": "1889", "image_path": "..."}]` |
| `/painting-info/{id}` | GET | `id: int` | `{"context_type": "painting", "context_id": 1, "title": "...", "narration": "..."}` |
| `/ask` | POST | `{"context_type": "poi", "context_id": 1, "question": "Why marble?"}` | `{"question": "...", "answer": "...", "context_title": "..."}` |

---

## 🛡️ Risk Mitigation Quick Reference

1. **Google Maps Billing / API Key Issue:**
   - The frontend automatically detects missing or invalid keys and falls back to high-res photographic POI preview without crashing.
2. **Gemini Latency or Rate Limits:**
   - Backend `gemini_service.py` automatically falls back to curated `PRECACHED_NARRATIONS` if API key is absent or network fails.
3. **Venue Wi-Fi Dropping:**
   - Everything runs 100% locally on `localhost:5173` and `localhost:8000`.
   - Backup video ensures your pitch succeeds regardless of venue connection.
