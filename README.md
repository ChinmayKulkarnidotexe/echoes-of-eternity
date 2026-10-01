# 🏛️ AURA — Immersive AI Heritage & Art Experience
**ACM x MLH Hack Days 2026 · NMAMIT · Track 1: "What is Earth without art?"**  
**Team Size:** 2 Developers · **Build Window:** 6 Hours · **Gemini Integration:** Compulsory  

---

## 🌟 Overview

**AURA** transforms passive cultural exploration into an engaging, multi-sensory virtual journey:
1. **Monument Walkthrough:** Explore a real-world monument (The Taj Mahal) using Google Street View panoramas, auto-guided across 4 key Points of Interest (POIs) with synchronized headings and camera pitch.
2. **Fine Art Gallery:** Inspect public-domain masterpieces (e.g. *The Starry Night*, *Mona Lisa*, *The Great Wave*, *Girl with a Pearl Earring*) in an interactive 3D textured orbit/tilt plane viewer powered by Three.js.
3. **Grounded Gemini Docent:** In both modes, visitors can listen to audio tour narration and ask free-form questions via voice (Speech-to-Text) or text, answered in real-time by Google Gemini grounded strictly in historical facts.

---

## 📂 Project Architecture & Directory Structure

```
acm-mlh-hackathon/
├── .gitignore                      # Ignore node_modules, .venv, *.db, .env
├── PRD_heritage_gallery_experience.md # Hackathon Product Requirements Document
├── README.md                       # Main documentation & quickstart
├── TEAM_SPLIT_GUIDE.md             # 6-Hour synchronized task breakdown for 2 devs
│
├── frontend/                       # [Person A] React + TypeScript + Three.js + Tailwind
│   ├── .env.example                # VITE_GOOGLE_MAPS_API_KEY, VITE_API_BASE_URL
│   ├── index.html                  # HTML entrypoint
│   ├── package.json                # Dependencies: three, lucide-react, @tailwindcss/vite
│   ├── vite.config.ts              # Vite + React + Tailwind v4 config
│   ├── src/
│   │   ├── types/index.ts          # Shared TypeScript interfaces (POI, Painting, Q&A)
│   │   ├── services/
│   │   │   ├── api.ts              # API client with offline fallback data
│   │   │   └── speech.ts           # Web Speech API (TTS & STT)
│   │   ├── components/
│   │   │   ├── Navigation/
│   │   │   │   └── Navbar.tsx      # Tab switcher & header branding
│   │   │   ├── StreetView/
│   │   │   │   └── StreetViewPanel.tsx # Google Street View & POI controls
│   │   │   ├── Gallery/
│   │   │   │   ├── GalleryGrid.tsx # Art grid cards
│   │   │   │   └── PaintingViewer.tsx # Three.js 3D textured tilt/orbit viewer
│   │   │   └── AIGuide/
│   │   │       └── GuidePanel.tsx  # Narration, audio player, voice STT Q&A
│   │   ├── App.tsx                 # Main layout & tour auto-advance state
│   │   ├── main.tsx                # React root mount
│   │   └── index.css               # Tailwind CSS theme & custom styling
│   └── dist/                       # Production build artifact
│
└── backend/                        # [Person B] Python FastAPI + Gemini AI + DB
    ├── .env.example                # GEMINI_API_KEY, DATABASE_URL, GEMINI_MODEL
    ├── requirements.txt            # fastapi, uvicorn, sqlalchemy, google-generativeai
    └── app/
        ├── config.py               # Settings & environment variables
        ├── database.py             # SQLAlchemy session & SQLite / Postgres engine
        ├── models.py               # Monument, POI, and Painting ORM models
        ├── schemas.py              # Pydantic request/response schemas
        ├── seed.py                 # Initial data: Taj Mahal POIs + 4 paintings
        ├── gemini_service.py       # Gemini API client, prompts & fallback cache
        ├── main.py                 # FastAPI application & CORS setup
        └── routes/
            ├── monuments.py        # /monuments/{id}/pois, /narrate/{poi_id}
            ├── paintings.py        # /paintings, /painting-info/{id}
            └── qa.py               # /ask (grounded Q&A endpoint)
```

---

## ⚡ Quickstart

### 1. Backend Setup (Person B)
```bash
cd backend

# Create virtual environment (if not already created)
python -m venv .venv

# Activate virtual environment
# Windows PowerShell:
.venv\Scripts\Activate.ps1
# Windows CMD:
# .venv\Scripts\activate.bat
# Linux/macOS:
# source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
# Copy .env.example to .env and insert your GEMINI_API_KEY
cp .env.example .env

# Run FastAPI server
uvicorn app.main:app --reload --port 8000
```
- API will be live at: `http://localhost:8000`
- Interactive Swagger docs at: `http://localhost:8000/docs`

### 2. Frontend Setup (Person A)
```bash
cd frontend

# Install dependencies
npm install

# Configure environment variables
# Copy .env.example to .env and insert your VITE_GOOGLE_MAPS_API_KEY (optional for preview)
cp .env.example .env

# Start development server
npm run dev
```
- Web application will be live at: `http://localhost:5173`

---

## 🧪 Testing & Verification

1. **Verify Backend Health & Seed:**
   ```bash
   curl http://localhost:8000/health
   curl http://localhost:8000/monuments/1/pois
   curl http://localhost:8000/paintings
   ```
2. **Verify AI Grounding Q&A:**
   ```bash
   curl -X POST http://localhost:8000/ask \
     -H "Content-Type: application/json" \
     -d '{"context_type": "poi", "context_id": 1, "question": "What is written on the gateway?"}'
   ```
3. **Verify Frontend Build:**
   ```bash
   cd frontend
   npm run build
   ```

---

## 👥 Hackathon 6-Hour Team Split

See **[TEAM_SPLIT_GUIDE.md](file:///e:/Coding%20Stuff/acm-mlh-hackathon/TEAM_SPLIT_GUIDE.md)** for the complete hour-by-hour synchronization schedule, risk mitigations, and demo rehearsal script.
