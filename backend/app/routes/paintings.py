from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Painting
from app.schemas import PaintingRead, NarrationResponse
from app.gemini_service import generate_narration

router = APIRouter()


@router.get("/paintings", response_model=list[PaintingRead])
def get_paintings(db: Session = Depends(get_db)):
    """Return every painting in the gallery."""
    return db.query(Painting).all()


from typing import Optional
from app.translation_service import translate_text

@router.get("/painting-info/{painting_id}", response_model=NarrationResponse)
def get_painting_info(
    painting_id: int,
    lang: Optional[str] = "en",
    db: Session = Depends(get_db),
):
    """Generate a Gemini AI narration grounded in the painting's verified facts, in the chosen language."""
    painting = db.query(Painting).filter(Painting.id == painting_id).first()
    if not painting:
        raise HTTPException(status_code=404, detail="Painting not found")

    narration_text = generate_narration(
        context_title=painting.title,
        facts_text=painting.facts_text,
        context_type="fine art painting",
    )

    facts = painting.facts_text
    if lang and lang.lower().split("-")[0] != "en":
        narration_text = translate_text(narration_text, target_lang=lang, source_lang="en")
        facts = translate_text(facts, target_lang=lang, source_lang="en")

    return NarrationResponse(
        context_type="painting",
        context_id=painting.id,
        title=f"{painting.title} by {painting.artist} ({painting.year})",
        narration=narration_text,
        facts_text=facts,
        lang=lang or "en",
    )
