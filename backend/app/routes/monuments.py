from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Monument, POI
from app.schemas import MonumentRead, POIRead, NarrationResponse
from app.gemini_service import generate_narration

router = APIRouter()


@router.get("/monuments/{monument_id}", response_model=MonumentRead)
def get_monument(monument_id: int, db: Session = Depends(get_db)):
    """Return full monument metadata including its POIs."""
    monument = db.query(Monument).filter(Monument.id == monument_id).first()
    if not monument:
        raise HTTPException(status_code=404, detail="Monument not found")
    return monument


@router.get("/monuments/{monument_id}/pois", response_model=list[POIRead])
def get_monument_pois(monument_id: int, db: Session = Depends(get_db)):
    """Return the ordered list of POIs with Street View panorama coordinates."""
    monument = db.query(Monument).filter(Monument.id == monument_id).first()
    if not monument:
        raise HTTPException(status_code=404, detail="Monument not found")
    return monument.pois


@router.get("/narrate/{poi_id}", response_model=NarrationResponse)
def narrate_poi(poi_id: int, db: Session = Depends(get_db)):
    """Generate a Gemini AI narration grounded in the POI's verified facts."""
    poi = db.query(POI).filter(POI.id == poi_id).first()
    if not poi:
        raise HTTPException(status_code=404, detail="POI not found")

    narration_text = generate_narration(
        context_title=f"{poi.monument.name} - {poi.name}",
        facts_text=poi.facts_text,
        context_type="monument point of interest",
    )

    return NarrationResponse(
        context_type="poi",
        context_id=poi.id,
        title=f"{poi.monument.name} - {poi.name}",
        narration=narration_text,
        facts_text=poi.facts_text,
    )
