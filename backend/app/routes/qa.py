from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import POI, Painting
from app.schemas import AskRequest, AskResponse
from app.gemini_service import answer_question

router = APIRouter()


@router.post("/ask", response_model=AskResponse)
def ask_guide(payload: AskRequest, db: Session = Depends(get_db)):
    """Ask a free-form question grounded in the current POI or Painting context.

    The single ``/ask`` endpoint serves both monument and gallery flows —
    the caller specifies ``context_type`` ("poi" | "painting") and
    ``context_id`` so the backend can look up the correct grounding facts.
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

    answer = answer_question(
        context_title=context_title,
        facts_text=facts_text,
        question=payload.question,
        context_type=payload.context_type,
    )

    return AskResponse(
        question=payload.question,
        answer=answer,
        context_type=payload.context_type,
        context_id=payload.context_id,
        context_title=context_title,
    )
