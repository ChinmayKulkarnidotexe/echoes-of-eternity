from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import POI, Painting
from app.schemas import AskRequest, AskResponse
from app.gemini_service import answer_question
from app.tour_data import AERIAL, FREE_ROAM_POIS, TOUR_WAYPOINTS

from app.translation_service import translate_text

router = APIRouter()

MONUMENT_NAME = "Statue of Liberty"


def _resolve_monument_context(context_type: str, context_id) -> tuple[str, str]:
    """Resolve a tour stop / free-roam hotspot slug to (title, grounding facts).

    These contexts live in ``tour_data`` rather than the database because they
    are authored alongside the verified panorama route, so they are looked up
    here instead of via SQLAlchemy.
    """
    key = str(context_id)

    if context_type == "waypoint":
        match = next((w for w in TOUR_WAYPOINTS if w["id"] == key), None)
        if match:
            return f"{MONUMENT_NAME} — {match['title']}", match["facts"]

    if context_type == "hotspot":
        match = next((p for p in FREE_ROAM_POIS if p["id"] == key), None)
        if match:
            return f"{MONUMENT_NAME} — {match['name']}", match["facts"]

    if context_type == "monument":
        # Whole-monument questions are grounded in every fact we hold, so the
        # guide can answer "how tall is she?" from any mode.
        facts = " ".join(
            [beat["facts"] for beat in AERIAL["beats"]]
            + [w["facts"] for w in TOUR_WAYPOINTS]
        )
        return MONUMENT_NAME, facts

    raise HTTPException(
        status_code=404,
        detail=f"No {context_type} context found for id '{key}'.",
    )


@router.post("/ask", response_model=AskResponse)
def ask_guide(payload: AskRequest, db: Session = Depends(get_db)):
    """Ask a free-form question grounded in the caller's current context.

    The single ``/ask`` endpoint serves every flow — the caller specifies
    ``context_type`` and ``context_id`` so the backend can look up the correct
    grounding facts:

    * ``poi`` / ``painting`` — integer ids, looked up in the database
    * ``waypoint`` / ``hotspot`` — slugs from the authored monument tour
    * ``monument`` — grounded in the monument's entire fact set

    When ``target_lang`` is anything but English the question makes a round trip
    through Google Translate:

    1. Translate the visitor's question into English.
    2. Answer with Gemini, grounded strictly in the facts above.
    3. Translate the answer back into the visitor's language.

    Grounding stays in English throughout, so a question asked in Spanish is
    answered from the same verified facts as one asked in English.
    """
    if payload.context_type == "poi":
        poi = db.query(POI).filter(POI.id == payload.context_id).first()
        if not poi:
            raise HTTPException(status_code=404, detail="POI not found")
        context_title = f"{poi.monument.name} - {poi.name}"
        facts_text = poi.facts_text

    elif payload.context_type == "painting":
        painting = db.query(Painting).filter(Painting.id == payload.context_id).first()
        if not painting:
            raise HTTPException(status_code=404, detail="Painting not found")
        context_title = f"{painting.title} by {painting.artist}"
        facts_text = painting.facts_text

    elif payload.context_type in ("waypoint", "hotspot", "monument"):
        context_title, facts_text = _resolve_monument_context(
            payload.context_type, payload.context_id
        )

    else:
        raise HTTPException(
            status_code=400,
            detail="context_type must be one of: poi, painting, waypoint, hotspot, monument.",
        )

    target_lang = payload.target_lang or "en"

    # Step 1: Translate incoming question to English if needed
    en_question = payload.question
    translated_question = None
    if target_lang.lower().split("-")[0] != "en":
        en_question = translate_text(payload.question, target_lang="en", source_lang=target_lang)
        translated_question = en_question

    # Step 2: Gemini answers the question in English grounded on facts
    en_answer = answer_question(
        context_title=context_title,
        facts_text=facts_text,
        question=en_question,
        context_type=payload.context_type,
    )

    # Step 3: Translate answer back to target language if needed
    final_answer = en_answer
    if target_lang.lower().split("-")[0] != "en":
        final_answer = translate_text(en_answer, target_lang=target_lang, source_lang="en")

    return AskResponse(
        question=payload.question,
        answer=final_answer,
        context_type=payload.context_type,
        context_id=payload.context_id,
        context_title=context_title,
        translated_question=translated_question,
        target_lang=target_lang,
    )
