from sqlalchemy.orm import Session
from app.models import Monument, POI, Painting


def seed_data(db: Session) -> None:
    """Seed the database with the Statue of Liberty POIs and gallery paintings.

    This function is idempotent — it only inserts data when the tables are empty.
    """
    if db.query(Monument).first():
        return

    # ------------------------------------------------------------------
    # 1. Monument — Statue of Liberty, Liberty Island, New York
    #    Google Street View verified entry point: 40.6892, -74.0445
    # ------------------------------------------------------------------
    statue = Monument(
        name="Statue of Liberty",
        description=(
            "A colossal neoclassical sculpture on Liberty Island in New York Harbor. "
            "Designed by French sculptor Frédéric Auguste Bartholdi and built by "
            "Gustave Eiffel, it was dedicated on October 28, 1886. The statue is a "
            "symbol of freedom and democracy, gifted by France to the United States."
        ),
        street_view_lat=40.6892,
        street_view_lng=-74.0445,
    )
    db.add(statue)
    db.flush()  # populate statue.id

    # ------------------------------------------------------------------
    # POIs — 4 points of interest around the Statue of Liberty
    # Coordinates are verified Street View panorama locations on Liberty Island.
    # ------------------------------------------------------------------
    pois = [
        POI(
            monument_id=statue.id,
            name="The Pedestal & Fort Wood",
            facts_text=(
                "The Statue of Liberty stands atop a concrete-and-granite pedestal "
                "that itself rests on the star-shaped walls of the former Fort Wood, "
                "a military fortification completed in 1811. The pedestal, designed by "
                "architect Richard Morris Hunt, is 89 feet (27 m) tall. Funding for "
                "the pedestal was raised through a grassroots campaign championed by "
                "newspaper publisher Joseph Pulitzer, who published the names of every "
                "donor — no matter how small the contribution — in his paper 'The World'. "
                "Over 120,000 people contributed, most giving less than a dollar."
            ),
            pano_lat=40.6891,
            pano_lng=-74.0446,
            pano_heading=0.0,
            pano_pitch=15.0,
            order_index=1,
        ),
        POI(
            monument_id=statue.id,
            name="The Copper Exterior & Crown",
            facts_text=(
                "The statue's exterior skin consists of approximately 300 shaped copper "
                "sheets (called 'saddles'), each only 3/32 of an inch (2.4 mm) thick — "
                "roughly the thickness of two U.S. pennies. Originally reddish-brown, "
                "the copper oxidised over about 20 years to develop its signature green "
                "patina (verdigris), which actually acts as a protective layer against "
                "further corrosion. The crown features 25 windows and 7 rays representing "
                "the seven continents and oceans of the world. Visitors can climb 354 "
                "steps from the pedestal to the crown."
            ),
            pano_lat=40.6893,
            pano_lng=-74.0444,
            pano_heading=45.0,
            pano_pitch=30.0,
            order_index=2,
        ),
        POI(
            monument_id=statue.id,
            name="The Torch & Flame",
            facts_text=(
                "The torch is the statue's most iconic element, symbolising enlightenment "
                "lighting the path to freedom. The original 1886 torch was replaced during "
                "the 1984-1986 centennial restoration. The current flame is covered in "
                "24-karat gold leaf and is lit by external lamps reflected off the gold "
                "surface. The original copper-and-glass torch is now on display in the "
                "pedestal's lobby museum. At its highest point the torch reaches 305 feet "
                "(93 m) above ground level."
            ),
            pano_lat=40.6894,
            pano_lng=-74.0445,
            pano_heading=350.0,
            pano_pitch=45.0,
            order_index=3,
        ),
        POI(
            monument_id=statue.id,
            name="The Tablet & Broken Chains",
            facts_text=(
                "In her left hand the statue holds a tabula ansata — a tablet evoking the "
                "concept of law — inscribed with 'JULY IV MDCCLXXVI' (July 4, 1776), the "
                "date of the American Declaration of Independence. At her feet lie broken "
                "chains and shackles, symbolising the abolition of slavery and freedom from "
                "oppression. Sculptor Bartholdi and political activist Édouard de Laboulaye "
                "conceived the statue partly as a celebration of the end of the American "
                "Civil War and the abolition of slavery (13th Amendment, 1865). The statue's "
                "full formal name is 'Liberty Enlightening the World' (La Liberté éclairant "
                "le monde)."
            ),
            pano_lat=40.6890,
            pano_lng=-74.0447,
            pano_heading=180.0,
            pano_pitch=5.0,
            order_index=4,
        ),
    ]
    for poi in pois:
        db.add(poi)

    # ------------------------------------------------------------------
    # 2. Paintings — 4 public-domain masterpieces (Wikimedia Commons)
    # ------------------------------------------------------------------
    paintings = [
        Painting(
            title="The Starry Night",
            artist="Vincent van Gogh",
            year="1889",
            facts_text=(
                "Painted in June 1889 from the Saint-Paul-de-Mausole asylum in "
                "Saint-Rémy-de-Provence shortly after Van Gogh severed part of his ear. "
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
            year="1503–1519",
            facts_text=(
                "Believed to be a portrait of Lisa Gherardini, wife of Florentine silk "
                "merchant Francesco del Giocondo. Painted in oil on a white Lombardy poplar "
                "panel, it is world-renowned for Leonardo's masterly application of sfumato "
                "(the subtle blurring of edges without sharp outlines). Her ambiguous smile "
                "appears to shift depending on where the viewer focuses. It has been on "
                "permanent display at the Musée du Louvre in Paris since 1797 and is viewed "
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
                "is a 'tronie' — a study of an idealised or exotic character — rather than "
                "a formal commissioned portrait. The young woman wears an oriental blue and "
                "yellow turban and a captivatingly large tear-drop pearl earring. Vermeer "
                "achieved luminous realism with just two quick strokes of lead white paint "
                "for the pearl's reflection. It resides in the Mauritshuis museum in The "
                "Hague, Netherlands."
            ),
            image_path="https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/1665_Girl_with_a_Pearl_Earring.jpg/800px-1665_Girl_with_a_Pearl_Earring.jpg",
        ),
    ]
    for p in paintings:
        db.add(p)

    db.commit()
    print("[OK] Database seeded: 1 monument, 4 POIs, 4 paintings.")
