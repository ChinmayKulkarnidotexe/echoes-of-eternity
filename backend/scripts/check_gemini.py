"""Smoke-test the configured Gemini key and model.

Run before a demo:  .venv/Scripts/python.exe -m scripts.check_gemini
"""

from __future__ import annotations

import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

from app.config import settings  # noqa: E402
from app.gemini_service import answer_question, polish_narration  # noqa: E402


def main() -> int:
    if not settings.GEMINI_API_KEY:
        print("[FAIL] GEMINI_API_KEY is not set in backend/.env")
        return 1

    print(f"Model: {settings.GEMINI_MODEL}")

    polished = polish_narration(
        title="The Torch",
        authored=(
            "The flame above you is not the original. Bartholdi's torch leaked for a "
            "century, so in 1986 it was replaced with a copper flame sheathed in gold leaf."
        ),
        facts="The 1986 flame is copper covered in 24-karat gold leaf, lit by external floodlights.",
    )
    if polished is None:
        print("[FAIL] polish_narration returned None - the API call did not succeed.")
        print("       Check the key, the model name, and that the Generative Language API is enabled.")
        return 1
    print(f"[OK] narration polish -> {polished[:140]}")

    answer = answer_question(
        context_title="Statue of Liberty - The Broken Chains",
        facts_text=(
            "A broken shackle and chain lie at the statue's feet, visible in full only from the air. "
            "De Laboulaye proposed the statue in 1865, the year slavery was abolished."
        ),
        question="Why are the chains hidden from view?",
        context_type="hotspot",
    )
    print(f"[OK] grounded answer   -> {answer[:140]}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
