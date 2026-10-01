from sqlalchemy.orm import Session
from app.models import Monument, POI, Painting

def seed_data(db: Session):
    """Seed the initial monument, POIs, and gallery paintings if database is empty."""
    # Check if already seeded
    if db.query(Monument).first():
        return

    # 1. Monument: Taj Mahal, Agra, India
    # Google Street View verified coordinates: 27.1751448, 78.0421422
    taj_mahal = Monument(
        name="Taj Mahal",
        description="An immense mausoleum of white marble, built in Agra between 1631 and 1648 by order of the Mughal emperor Shah Jahan in memory of his favourite wife Mumtaz Mahal. A jewel of Muslim art in India and universally admired masterpiece of world heritage.",
        street_view_lat=27.1751448,
        street_view_lng=78.0421422,
    )
    db.add(taj_mahal)
    db.flush()

    pois = [
        POI(
            monument_id=taj_mahal.id,
            name="The Great Gate (Darwaza-i-Rauza)",
            facts_text=(
                "The Darwaza-i-Rauza is the monumental main gateway to the Taj Mahal complex. "
                "Constructed primarily of red sandstone with inlaid white marble, its vaulted archway (iwan) "
                "features intricate Quranic inscriptions in thuluth script that grow larger as they ascend, "
                "creating the optical illusion that all letters are the exact same size from ground level. "
                "Passing through this threshold symbolizes leaving the worldly realm to enter paradise."
            ),
            pano_heading=0.0,
            pano_pitch=8.0,
            pano_lat=27.173150,
            pano_lng=78.042142,
            order_index=1,
        ),
        POI(
            monument_id=taj_mahal.id,
            name="Charbagh & The Long Reflecting Pool",
            facts_text=(
                "The Charbagh (four-fold garden) is divided into four main quadrants by raised pathways and water channels, "
                "reflecting the Quranic description of the Garden of Eden with rivers of water, milk, wine, and honey. "
                "The central lotus-shaped marble pool (Hawd al-Kawthar) is engineered to capture an unbroken, crystalline "
                "reflection of the white dome regardless of the sun's position. The gardens were originally planted with fruit trees, cypress, and fragrant roses."
            ),
            pano_heading=0.0,
            pano_pitch=0.0,
            pano_lat=27.174100,
            pano_lng=78.042142,
            order_index=2,
        ),
        POI(
            monument_id=taj_mahal.id,
            name="The Main Mausoleum & Central Dome",
            facts_text=(
                "The iconic white dome rises nearly 35 metres (115 ft) on a cylindrical drum above the plinth. "
                "It is faced with translucent white Makrana marble brought over 300 km from Rajasthan by bullock carts. "
                "The surfaces are embellished with Pietra Dura (parchin kari) floral inlays using 28 kinds of precious and semi-precious stones, "
                "including lapis lazuli from Afghanistan, jade and crystal from China, turquoise from Tibet, and carnelian from Arabia. "
                "The four minarets stand at over 40 metres tall and lean slightly outwards to prevent damage to the central dome in an earthquake."
            ),
            pano_heading=0.0,
            pano_pitch=14.0,
            pano_lat=27.175000,
            pano_lng=78.042142,
            order_index=3,
        ),
        POI(
            monument_id=taj_mahal.id,
            name="Yamuna Riverfront & Mosque Terrace",
            facts_text=(
                "Perched on the northern sandstone terrace overlooking the holy Yamuna River, this vantage point was chosen "
                "to provide natural flood defense and serene backlighting during sunrise and moonlit nights. "
                "Flanking the mausoleum are two identical red sandstone buildings: the Mosque on the west (oriented towards Mecca) "
                "and the Jawab (mirror/guest house) on the east, built strictly to preserve architectural bilateral symmetry."
            ),
            pano_heading=180.0,
            pano_pitch=-4.0,
            pano_lat=27.175500,
            pano_lng=78.042142,
            order_index=4,
        ),
    ]
    for poi in pois:
        db.add(poi)

    # 2. Public Domain Gallery Paintings
    paintings = [
        Painting(
            title="The Starry Night",
            artist="Vincent van Gogh",
            year="1889",
            facts_text=(
                "Painted in June 1889 from the Saint-Paul-de-Mausole asylum in Saint-Rémy-de-Provence shortly after Van Gogh severed his ear. "
                "It depicts his idealized night view before sunrise, dominated by swirling sky vortices, eleven radiant stars, and a luminous crescent moon. "
                "The towering dark cypress tree in the foreground connects heaven and earth, often interpreted as a symbol of mourning and eternity. "
                "The post-impressionist masterpiece is held in the permanent collection of the Museum of Modern Art (MoMA) in New York."
            ),
            image_path="https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg/1280px-Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg",
        ),
        Painting(
            title="Mona Lisa (La Gioconda)",
            artist="Leonardo da Vinci",
            year="1503–1519",
            facts_text=(
                "Believed to be a portrait of Lisa Gherardini, wife of Florentine silk merchant Francesco del Giocondo. "
                "Painted in oil on a white Lombardy poplar panel, it is world-renowned for Leonardo's masterly application of sfumato "
                "(the subtle blurring of edges and transitions without sharp outlines). Her ambiguous smile changes expression "
                "depending on where the viewer focuses their gaze. Displayed in the Louvre Museum in Paris behind bulletproof glass."
            ),
            image_path="https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg/800px-Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg",
        ),
        Painting(
            title="Under the Wave off Kanagawa (The Great Wave)",
            artist="Katsushika Hokusai",
            year="c. 1831",
            facts_text=(
                "The first print in Hokusai's renowned series 'Thirty-Six Views of Mount Fuji'. "
                "It captures a gigantic rogue wave clawing over three fast cargo boats (oshiokuri-bune) battling the rough waters of Sagami Bay, "
                "with a snow-capped Mount Fuji standing small and still in the background. Hokusai made groundbreaking use of newly imported "
                "Prussian blue synthetic pigment, which did not fade like traditional organic blue dyes."
            ),
            image_path="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Tsunami_by_hokusai_19th_century.jpg/1280px-Tsunami_by_hokusai_19th_century.jpg",
        ),
        Painting(
            title="Girl with a Pearl Earring",
            artist="Johannes Vermeer",
            year="c. 1665",
            facts_text=(
                "Known as the 'Mona Lisa of the North', this masterpiece is a Dutch Golden Age 'tronie' (a study of an idealized or exotic character), "
                "not a formal commissioned portrait. The young woman wears an oriental blue and yellow turban and a captivatingly large tear-drop pearl earring. "
                "Vermeer achieved luminous realism with just two quick strokes of lead white paint for the pearl's reflection. "
                "It resides in the Mauritshuis museum in The Hague, Netherlands."
            ),
            image_path="https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/1665_Girl_with_a_Pearl_Earring.jpg/800px-1665_Girl_with_a_Pearl_Earring.jpg",
        ),
    ]
    for p in paintings:
        db.add(p)

    db.commit()
