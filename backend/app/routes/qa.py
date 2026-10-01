from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import POI, Painting
from app.schemas import AskRequest, AskResponse
from app.gemini_service import answer_question

from app.translation_service import translate_text

router = APIRouter()


@router.post("/ask", response_model=AskResponse)
def ask_guide(payload: AskRequest, db: Session = Depends(get_db)):
    """Ask a free-form question grounded in the current POI or Painting context.

    1. Translates user question from chosen language to English via Google Translate.
    2. Searches/answers with Gemini grounded strictly in facts.
    3. Translates Gemini answer back to the chosen language via Google Translate.
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

    else:
        raise HTTPException(
            status_code=400,
            detail="context_type must be 'poi' or 'painting'.",
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
