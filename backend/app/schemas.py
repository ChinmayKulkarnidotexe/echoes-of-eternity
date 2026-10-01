from typing import Optional, List, Literal, Union
from pydantic import BaseModel

# POI Schemas
class POIBase(BaseModel):
    name: str
    facts_text: str
    pano_heading: float = 0.0
    pano_pitch: float = 0.0
    pano_lat: Optional[float] = None
    pano_lng: Optional[float] = None
    order_index: int = 0

class POIRead(POIBase):
    id: int
    monument_id: int

    class Config:
        from_attributes = True

# Monument Schemas
class MonumentBase(BaseModel):
    name: str
    description: Optional[str] = None
    street_view_lat: float
    street_view_lng: float

class MonumentRead(MonumentBase):
    id: int
    pois: List[POIRead] = []

    class Config:
        from_attributes = True

# Painting Schemas
class PaintingBase(BaseModel):
    title: str
    artist: str
    year: str
    facts_text: str
    image_path: str

class PaintingRead(PaintingBase):
    id: int

    class Config:
        from_attributes = True

# Q&A & Narration Schemas
#
# ``context_type`` grew beyond the PRD's two values so the monument experience
# can ground a question in a tour stop or a free-roam hotspot. Those live in
# ``tour_data`` and are keyed by slug, so ``context_id`` accepts a string too;
# the original int-keyed "poi" and "painting" contexts are unchanged.
ContextType = Literal["poi", "painting", "waypoint", "hotspot", "monument"]


class AskRequest(BaseModel):
    context_type: ContextType
    context_id: Union[int, str]
    question: str
    target_lang: Optional[str] = "en"

class AskResponse(BaseModel):
    question: str
    answer: str
    context_type: str
    context_id: Union[int, str]
    context_title: str
    translated_question: Optional[str] = None
    target_lang: Optional[str] = "en"

class NarrationResponse(BaseModel):
    context_type: str
    context_id: Union[int, str]
    title: str
    narration: str
    facts_text: str
    lang: Optional[str] = "en"
