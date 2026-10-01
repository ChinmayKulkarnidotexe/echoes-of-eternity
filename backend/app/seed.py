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
    """Make the gallery match this build's catalogue.

    Self-healing for the same reason the monument seed is: an "insert only when
    empty" guard meant that a database seeded with an earlier, shorter gallery
    kept serving it forever, no matter how many works were added here. Painting
    rows are pure seed data, so a mismatched set is replaced wholesale.

    Images are served from ``frontend/public/paintings`` rather than hot-linked
    from Wikimedia, so the gallery still loads with no internet.
    """
    expected = [
        {
            "title": "The Starry Night",
            "artist": "Vincent van Gogh",
            "year": "1889",
            "facts_text": (
                "Painted in June 1889 from the Saint-Paul-de-Mausole asylum in "
                "Saint-Remy-de-Provence shortly after Van Gogh severed part of his ear. "
                "It depicts his idealised night view before sunrise, dominated by swirling "
                "sky vortices, eleven radiant stars, and a luminous crescent moon. The "
                "towering dark cypress tree in the foreground connects heaven and earth, "
                "often interpreted as a symbol of mourning and eternity. The post-"
                "impressionist masterpiece is held in the permanent collection of the "
                "Museum of Modern Art (MoMA) in New York City."
            ),
            "image_path": "/paintings/starry_night.jpg",
        },
        {
            "title": "Mona Lisa (La Gioconda)",
            "artist": "Leonardo da Vinci",
            "year": "1503-1519",
            "facts_text": (
                "Believed to be a portrait of Lisa Gherardini, wife of Florentine silk "
                "merchant Francesco del Giocondo. Painted in oil on a white Lombardy poplar "
                "panel, it is world-renowned for Leonardo's masterly application of sfumato "
                "(the subtle blurring of edges without sharp outlines). Her ambiguous smile "
                "appears to shift depending on where the viewer focuses. It has been on "
                "permanent display at the Musee du Louvre in Paris since 1797 and is viewed "
                "by approximately 6 million visitors per year."
            ),
            "image_path": "/paintings/mona_lisa.jpg",
        },
        {
            "title": "The Great Wave off Kanagawa",
            "artist": "Katsushika Hokusai",
            "year": "c. 1831",
            "facts_text": (
                "The first print in Hokusai's renowned series 'Thirty-Six Views of Mount "
                "Fuji'. It captures a gigantic rogue wave clawing over three fast cargo "
                "boats (oshiokuri-bune) in Sagami Bay, with a snow-capped Mount Fuji "
                "standing small and still in the background. Hokusai made groundbreaking "
                "use of imported Prussian blue synthetic pigment, which resisted fading "
                "far better than traditional Japanese organic indigo. It is one of the "
                "most reproduced images in art history."
            ),
            "image_path": "/paintings/great_wave.jpg",
        },
        {
            "title": "Girl with a Pearl Earring",
            "artist": "Johannes Vermeer",
            "year": "c. 1665",
            "facts_text": (
                "Known as the 'Mona Lisa of the North', this Dutch Golden Age masterpiece "
                "is a 'tronie' - a study of an idealised or exotic character - rather than "
                "a formal commissioned portrait. The young woman wears an oriental blue and "
                "yellow turban and a captivatingly large tear-drop pearl earring. Vermeer "
                "achieved luminous realism with just two quick strokes of lead white paint "
                "for the pearl's reflection. It resides in the Mauritshuis museum in The "
                "Hague, Netherlands."
            ),
            "image_path": "/paintings/pearl_earring.jpg",
        },
        {
            "title": "The Card Players",
            "artist": "Paul Cezanne",
            "year": "c. 1894-1895",
            "facts_text": (
                "Masterpiece from Cezanne's landmark series depicting Provencal peasant card "
                "players at Le Jas de Bouffan. Celebrated for its monumental geometry and "
                "earthy tones, which heralded early Cubism. One version sold privately to the "
                "Royal Family of Qatar for a figure reported at over $250 million."
            ),
            "image_path": "/paintings/card_players.jpg",
        },
        {
            "title": "Interchange",
            "artist": "Willem de Kooning",
            "year": "1955",
            "facts_text": (
                "Monumental abstract expressionist oil canvas marking De Kooning's transition "
                "into dynamic urban landscape painting. Its kinetic sweeps of peach, orange and "
                "blue evoke the chaotic vitality of post-war New York City. It sold in 2015 for "
                "$300 million, among the highest prices ever paid for a painting."
            ),
            "image_path": "/paintings/interchange.jpg",
        },
        {
            "title": "The Red Vineyard at Arles",
            "artist": "Vincent van Gogh",
            "year": "1888",
            "facts_text": (
                "Painted in Arles in November 1888 under a blazing golden sun, capturing grape "
                "harvesters among red vines. It is celebrated as the only painting Van Gogh is "
                "known to have officially sold during his lifetime, bought by Anna Boch in 1890. "
                "It now hangs in the Pushkin Museum in Moscow."
            ),
            "image_path": "/paintings/red_vineyard.jpg",
        },
        {
            "title": "Salvator Mundi",
            "artist": "Leonardo da Vinci",
            "year": "c. 1499-1510",
            "facts_text": (
                "Renaissance work portraying Christ as Saviour of the World, raising two fingers "
                "in blessing and holding a celestial rock crystal orb. Renowned for Leonardo's "
                "sfumato, though its attribution remains debated among scholars. It sold at "
                "auction in 2017 for $450.3 million, the highest price ever paid for a painting."
            ),
            "image_path": "/paintings/salvator_mundi.jpg",
        },
        {
            "title": "Rooftops in The Hague",
            "artist": "Vincent van Gogh",
            "year": "1882",
            "facts_text": (
                "An intimate early perspective study in watercolour and gouache, painted from "
                "Van Gogh's attic studio on Schenkweg in The Hague. It captures red tiled roofs, "
                "carpentry sheds and smoking chimneys, and shows his early mastery of perspective "
                "years before the colour of his Provence work."
            ),
            "image_path": "/paintings/rooftops_hague.jpg",
        },
    ]

    current = [p.title for p in db.query(Painting).order_by(Painting.id).all()]
    if current == [p["title"] for p in expected]:
        return 0

    if current:
        print(f"[seed] Replacing gallery seeded by an earlier build ({len(current)} works)")
        for painting in db.query(Painting).all():
            db.delete(painting)
        db.flush()

    for row in expected:
        db.add(Painting(**row))
    return len(expected)


def seed_data(db: Session) -> None:
    """Make the database match this build's configured monument.

    This is deliberately self-healing rather than merely idempotent. A plain
    "skip if any row exists" guard leaves an earlier build's monument in place
    forever, which is exactly how a database seeded for a different monument
    survives a rewrite of this file. Monument and POI rows are pure seed data —
    nothing user-generated lives in them — so replacing a mismatched monument is
    safe. The gallery is replaced on the same terms, and for the same reason:
    a database seeded with an earlier, shorter catalogue otherwise keeps
    serving it no matter what this file says.
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
