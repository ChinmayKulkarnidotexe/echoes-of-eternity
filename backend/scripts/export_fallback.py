"""Regenerate the frontend's offline copy of the experience bundle.

The frontend ships a generated TypeScript copy of ``GET /experience/1`` so the
monument experience still runs with FastAPI down (PRD section 12) and so the
frontend can be demoed on its own. Run this after editing ``app/tour_data.py``:

    cd backend
    .venv/Scripts/python.exe -m scripts.export_fallback

It builds the bundle in-process, so the backend does not need to be running and
no Google or Gemini request is made beyond what is already cached.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

from app.database import Base, SessionLocal, engine  # noqa: E402
from app.experience_service import MONUMENT_ID, build_experience  # noqa: E402
from app.seed import seed_data  # noqa: E402

OUTPUT = BACKEND_DIR.parent / "frontend" / "src" / "services" / "fallbackExperience.ts"

HEADER = '''/**
 * Offline copy of GET /experience/1 — generated, do not edit by hand.
 *
 * The monument experience falls back to this when FastAPI is unreachable, which
 * is the risk mitigation the PRD asks for in section 12 and also lets the
 * frontend be demoed on its own. Regenerate after editing app/tour_data.py:
 *
 *     cd backend && .venv/Scripts/python.exe -m scripts.export_fallback
 *
 * It is typed as ExperienceBundle, so drift between this copy and the backend's
 * payload shape surfaces as a build error rather than a runtime surprise.
 */

import type { ExperienceBundle } from '../types';

export const FALLBACK_EXPERIENCE: ExperienceBundle = '''


def main() -> int:
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        seed_data(db)
        bundle = build_experience(db, MONUMENT_ID)

    bundle.pop("from_cache", None)

    body = json.dumps(bundle, ensure_ascii=False, indent=2)
    # Indent the literal so it sits naturally under the export statement.
    body = "\n".join(("  " + line) if line else line for line in body.split("\n")).lstrip()

    OUTPUT.write_text(HEADER + body + ";\n", encoding="utf-8")

    print(f"[OK] Wrote {OUTPUT.relative_to(BACKEND_DIR.parent)}")
    print(
        f"     {len(bundle['tour']['waypoints'])} tour stops, "
        f"{len(bundle['aerial']['beats'])} aerial beats, "
        f"{len(bundle['free_roam']['pois'])} hotspots"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
