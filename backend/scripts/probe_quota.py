"""Probe which Gemini models still have free-tier quota today.

One tiny call per model. Run before a demo to pick a model that will actually
answer:  .venv/Scripts/python.exe -m scripts.probe_quota
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

from app.config import settings  # noqa: E402

CANDIDATES = [
    "gemini-3.8-flash",
    "gemini-flash-latest",
    "gemini-flash-lite-latest",
    "gemini-3.1-flash-lite",
    "gemini-3.5-flash-lite",
    "gemini-3.5-flash",
]


def main() -> int:
    if not settings.GEMINI_API_KEY:
        print("GEMINI_API_KEY is not set.")
        return 1

    import google.generativeai as genai

    genai.configure(api_key=settings.GEMINI_API_KEY)

    for name in CANDIDATES:
        try:
            model = genai.GenerativeModel(model_name=name)
            response = model.generate_content("Reply with the single word: ready")
            print(f"[OK]   {name:<28} -> {(response.text or '').strip()[:30]}")
        except Exception as exc:
            text = str(exc)
            if "429" in text:
                quota = re.search(r"quota_value:\s*(\d+)", text)
                per = re.search(r"quota_id:\s*\"([^\"]+)\"", text)
                print(
                    f"[QUOTA] {name:<28} -> exhausted"
                    + (f" (limit {quota.group(1)}" if quota else "")
                    + (f", {per.group(1)})" if per else ")")
                )
            elif "404" in text:
                print(f"[404]  {name:<28} -> not available to this key")
            else:
                print(f"[ERR]  {name:<28} -> {text[:90]}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
