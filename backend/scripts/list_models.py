"""List the Gemini models this API key can call, so GEMINI_MODEL can be set to a real one."""

from __future__ import annotations

import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

from app.config import settings  # noqa: E402


def main() -> int:
    if not settings.GEMINI_API_KEY:
        print("GEMINI_API_KEY is not set.")
        return 1

    import google.generativeai as genai

    genai.configure(api_key=settings.GEMINI_API_KEY)
    usable = []
    for model in genai.list_models():
        if "generateContent" in getattr(model, "supported_generation_methods", []):
            usable.append(model.name)
    for name in sorted(usable):
        print(name)
    print(f"\n{len(usable)} models support generateContent")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
