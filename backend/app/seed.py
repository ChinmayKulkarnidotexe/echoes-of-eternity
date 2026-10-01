from sqlalchemy.orm import Session

from app.models import Monument, POI, Painting
from app.tour_data import FREE_ROAM_POIS, STATUE_CENTER, TOUR_WAYPOINTS

MONUMENT_NAME = "Statue of Liberty"

MONUMENT_DESCRIPTION = (
    "A colossal neoclassical sculpture on Liberty Island in New York Harbour. "
    "Designed by French sculptor Frederic Auguste Bartholdi with an internal iron "
    "framework by Gustave Eiffel, it was dedicated on 28 October 1886 as a gift "
    "from the people of France to the United States. Its formal name is "
    "'Liberty Enlightening the World'."
)


def _build_pois(monument_id: int) -> list[POI]:
    """Derive the database POIs from the authored, coverage-verified tour data.

    Keeping one source of truth means the facts behind ``/narrate/{poi_id}`` and
    the facts behind a free-roam hotspot card can never drift apart. Each POI
    borrows the heading of the nearest tour stop so the legacy Street View
    endpoints still return a usable point of view.
    """
    front = TOUR_WAYPOINTS[0]
    pois: list[POI] = []
    for index, hotspot in enumerate(FREE_ROAM_POIS, start=1):
        pois.append(
            POI(
                monument_id=monument_id,
                name=hotspot["name"],
                facts_text=hotspot["facts"],
                pano_lat=front["lat"],
                pano_lng=front["lng"],
                pano_heading=front["heading"],
                # Look up at whatever this feature's height demands.
                pano_pitch=round(min(60.0, hotspot["height_m"] * 0.5), 1),
                order_index=index,
            )
        )
    return pois


def _seed_paintings(db: Session) -> int:
    """Insert the gallery only when it is empty — existing rows are left alone."""
    if db.query(Painting).first():
        return 0

    paintings = [
        Painting(
            title="The Starry Night",
            artist="Vincent van Gogh",
            year="1889",
            facts_text=(
                "Painted in June 1889 from the Saint-Paul-de-Mausole asylum in "
                "Saint-Remy-de-Provence shortly after Van Gogh severed part of his ear. "
                "It depicts his idealised night view before sunrise, dominated by swirling "
                "sky vortices, eleven radiant stars, and a luminous crescent moon. The "
                "towering dark cypress tree in the foreground connects heaven and earth, "
                "often interpreted as a symbol of mourning and eternity. The post-"
                "impressionist masterpiece is held in the permanent collection of the "
                "Museum of Modern Art (MoMA) in New York City."
            ),
            image_path="https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg/1280px-Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg",
        ),
        Painting(
            title="Mona Lisa (La Gioconda)",
            artist="Leonardo da Vinci",
            year="1503-1519",
            facts_text=(
                "Believed to be a portrait of Lisa Gherardini, wife of Florentine silk "
                "merchant Francesco del Giocondo. Painted in oil on a white Lombardy poplar "
                "panel, it is world-renowned for Leonardo's masterly application of sfumato "
                "(the subtle blurring of edges without sharp outlines). Her ambiguous smile "
                "appears to shift depending on where the viewer focuses. It has been on "
                "permanent display at the Musee du Louvre in Paris since 1797 and is viewed "
                "by approximately 6 million visitors per year."
            ),
            image_path="https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg/800px-Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg",
        ),
        Painting(
            title="The Great Wave off Kanagawa",
            artist="Katsushika Hokusai",
            year="c. 1831",
            facts_text=(
                "The first print in Hokusai's renowned series 'Thirty-Six Views of Mount "
                "Fuji'. It captures a gigantic rogue wave clawing over three fast cargo "
                "boats (oshiokuri-bune) in Sagami Bay, with a snow-capped Mount Fuji "
                "standing small and still in the background. Hokusai made groundbreaking "
                "use of imported Prussian blue synthetic pigment, which resisted fading "
                "far better than traditional Japanese organic indigo. It is one of the "
                "most reproduced images in art history."
            ),
            image_path="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Tsunami_by_hokusai_19th_century.jpg/1280px-Tsunami_by_hokusai_19th_century.jpg",
        ),
        Painting(
            title="Girl with a Pearl Earring",
            artist="Johannes Vermeer",
            year="c. 1665",
            facts_text=(
                "Known as the 'Mona Lisa of the North', this Dutch Golden Age masterpiece "
                "is a 'tronie' - a study of an idealised or exotic character - rather than "
                "a formal commissioned portrait. The young woman wears an oriental blue and "
                "yellow turban and a captivatingly large tear-drop pearl earring. Vermeer "
                "achieved luminous realism with just two quick strokes of lead white paint "
                "for the pearl's reflection. It resides in the Mauritshuis museum in The "
                "Hague, Netherlands."
            ),
            image_path="https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/1665_Girl_with_a_Pearl_Earring.jpg/800px-1665_Girl_with_a_Pearl_Earring.jpg",
        ),
    ]
    for painting in paintings:
        db.add(painting)
    return len(paintings)


def seed_data(db: Session) -> None:
    """Make the database match this build's configured monument.

    This is deliberately self-healing rather than merely idempotent. A plain
    "skip if any row exists" guard leaves an earlier build's monument in place
    forever, which is exactly how a database seeded for a different monument
    survives a rewrite of this file. Monument and POI rows are pure seed data —
    nothing user-generated lives in them — so replacing a mismatched monument is
    safe. The gallery is only ever inserted when empty, never replaced.
    """
    monument = db.query(Monument).filter(Monument.name == MONUMENT_NAME).first()
    stale = db.query(Monument).filter(Monument.name != MONUMENT_NAME).all()

    for other in stale:
        # Cascades to that monument's POIs via the relationship's delete-orphan.
        print(f"[seed] Removing monument seeded by an earlier build: {other.name}")
        db.delete(other)
    if stale:
        db.flush()

    if monument is None:
        monument = Monument(
            name=MONUMENT_NAME,
            description=MONUMENT_DESCRIPTION,
            street_view_lat=STATUE_CENTER["lat"],
            street_view_lng=STATUE_CENTER["lng"],
        )
        db.add(monument)
        db.flush()
        print(f"[seed] Inserted monument: {MONUMENT_NAME}")
    else:
        monument.description = MONUMENT_DESCRIPTION
        monument.street_view_lat = STATUE_CENTER["lat"]
        monument.street_view_lng = STATUE_CENTER["lng"]

    # Re-derive POIs whenever the authored set has changed shape.
    expected_names = [hotspot["name"] for hotspot in FREE_ROAM_POIS]
    current_names = [poi.name for poi in sorted(monument.pois, key=lambda p: p.order_index)]
    if current_names != expected_names:
        for poi in list(monument.pois):
            db.delete(poi)
        db.flush()
        for poi in _build_pois(monument.id):
            db.add(poi)
        print(f"[seed] Rebuilt {len(expected_names)} POIs for {MONUMENT_NAME}")

    added_paintings = _seed_paintings(db)

    db.commit()
    print(
        f"[OK] Database ready: {MONUMENT_NAME}, {len(expected_names)} POIs, "
        f"{db.query(Painting).count()} paintings"
        + (f" ({added_paintings} inserted)" if added_paintings else "")
    )
