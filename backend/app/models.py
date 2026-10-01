from sqlalchemy import Column, Integer, String, Float, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Monument(Base):
    __tablename__ = "monuments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    street_view_lat = Column(Float, nullable=False)
    street_view_lng = Column(Float, nullable=False)

    pois = relationship("POI", back_populates="monument", cascade="all, delete-orphan", order_by="POI.order_index")

class POI(Base):
    __tablename__ = "pois"

    id = Column(Integer, primary_key=True, index=True)
    monument_id = Column(Integer, ForeignKey("monuments.id"), nullable=False)
    name = Column(String(255), nullable=False)
    facts_text = Column(Text, nullable=False)
    pano_heading = Column(Float, default=0.0)
    pano_pitch = Column(Float, default=0.0)
    pano_lat = Column(Float, nullable=True)
    pano_lng = Column(Float, nullable=True)
    order_index = Column(Integer, default=0)

    monument = relationship("Monument", back_populates="pois")

class Painting(Base):
    __tablename__ = "paintings"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    artist = Column(String(255), nullable=False)
    year = Column(String(50), nullable=False)
    facts_text = Column(Text, nullable=False)
    image_path = Column(String(500), nullable=False)
