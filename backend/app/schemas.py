from typing import Optional, List, Literal
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
class AskRequest(BaseModel):
    context_type: Literal["poi", "painting"]
    context_id: int
    question: str

class AskResponse(BaseModel):
    question: str
    answer: str
    context_type: str
    context_id: int
    context_title: str

class NarrationResponse(BaseModel):
    context_type: str
    context_id: int
    title: str
    narration: str
    facts_text: str
