import logging
from functools import lru_cache
from app.config import settings

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# System prompt that grounds every Gemini interaction in the project persona
# ---------------------------------------------------------------------------
SYSTEM_INSTRUCTION = (
    "You are the AI tour guide for 'Echoes of Eternity', an immersive virtual heritage "
    "and fine-art experience. You speak with the warmth and knowledge of a seasoned museum "
    "docent. Address the visitor directly using second-person ('you', 'notice', 'before you'). "
    "Always ground your answers strictly in the FACTS provided. If the facts are insufficient, "
    "supplement with general art-history knowledge but clearly indicate when you do so. "
    "Keep all responses concise (2-4 sentences) since they will be read aloud via text-to-speech."
)

# ---------------------------------------------------------------------------
# Pre-cached fallback narrations (PRD §12 Risk Mitigation)
# Used when GEMINI_API_KEY is absent or the API is unreachable.
# ---------------------------------------------------------------------------
PRECACHED_NARRATIONS: dict[str, str] = {
    # Statue of Liberty POIs
    "Statue of Liberty - The Pedestal & Fort Wood": (
        "Welcome to the base of Lady Liberty! You are standing on Fort Wood, "
        "a former military fortification whose star-shaped walls now serve as the "
        "pedestal's foundation. The granite pedestal itself rises 89 feet and was "
        "funded by everyday Americans through a campaign led by Joseph Pulitzer."
    ),
    "Statue of Liberty - The Copper Exterior & Crown": (
        "Look up and notice the statue's distinctive green patina. The exterior "
        "is made of roughly 300 copper sheets, each just 2.4 millimeters thick — "
        "about the width of two pennies stacked together. Over time, oxidation "
        "transformed the original reddish-brown copper into this iconic verdigris."
    ),
    "Statue of Liberty - The Torch & Flame": (
        "Before you is the torch, the most recognizable symbol of enlightenment. "
        "The current flame is covered in 24-karat gold leaf and was installed in "
        "1986 during the centennial restoration. The original 1886 torch is now on "
        "display in the lobby of the pedestal."
    ),
    "Statue of Liberty - The Tablet & Broken Chains": (
        "Notice the tabula ansata in Liberty's left hand inscribed with 'JULY IV MDCCLXXVI' — "
        "July 4, 1776, the date of American independence. At her feet lie broken chains "
        "and shackles, a powerful symbol of freedom from oppression that sculptor "
        "Frédéric Auguste Bartholdi intentionally placed there."
    ),
    # Paintings
    "The Starry Night": (
        "Vincent van Gogh painted 'The Starry Night' in June 1889 from his asylum "
        "room in Saint-Rémy-de-Provence. The swirling sky and vibrant blues reflect "
        "his intense emotional vision and spiritual wonder."
    ),
    "Mona Lisa (La Gioconda)": (
        "Painted by Leonardo da Vinci between 1503 and 1519, the Mona Lisa is "
        "celebrated for her enigmatic expression and Leonardo's pioneering sfumato "
        "technique, seamlessly blending light and shadow."
    ),
    "The Great Wave off Kanagawa": (
        "Hokusai's iconic woodblock print from circa 1831 depicts towering rogue "
        "waves framing Mount Fuji. The bold use of imported Prussian blue pigment "
        "transformed Japanese art and captivated Western impressionists."
    ),
    "Girl with a Pearl Earring": (
        "Known as the 'Mona Lisa of the North', Vermeer's masterpiece is a Dutch "
        "Golden Age 'tronie' — a character study rather than a portrait. The luminous "
        "pearl earring was rendered with just two strokes of lead white."
    ),
    "The Card Players": (
        "Paul Cézanne painted 'The Card Players' in the mid-1890s, portraying farmhands from "
        "his family estate absorbed in quiet concentration. Its solemn geometry and earthy tones "
        "laid the cornerstone for the birth of modern cubism."
    ),
    "Interchange": (
        "Created in 1955, Willem de Kooning's 'Interchange' is a landmark of Abstract Expressionism. "
        "Its violent, kinetic sweeps of peach, orange, and blue evoke the chaotic vitality of "
        "post-war New York City, making it one of the most valuable paintings in history."
    ),
    "The Red Vineyard at Arles": (
        "Painted in November 1888, 'The Red Vineyard' is celebrated as the only artwork Vincent van Gogh "
        "officially sold during his lifetime. The fiery red vines under a radiant sunset capture the raw, "
        "passionate energy of his beloved Provence."
    ),
    "Salvator Mundi": (
        "Attributed to Leonardo da Vinci circa 1500, 'Salvator Mundi' depicts Christ as Savior of the World. "
        "Holding an orb of celestial crystal and raising two fingers in blessing, it exemplifies Leonardo's "
        "ethereal sfumato and sold for a record $450.3 million."
    ),
    "Rooftops in The Hague": (
        "Painted in May 1882 from his attic window on Schenkweg, this delicate watercolor and gouache study "
        "reveals Van Gogh's early mastery of perspective, capturing red tiled rooftops, carpenter yards, and "
        "rising chimneys across industrial Holland."
    ),
}


# ---------------------------------------------------------------------------
# Gemini client singleton
# ---------------------------------------------------------------------------
@lru_cache(maxsize=1)
def _get_gemini_model():
    """Return a configured Gemini GenerativeModel or None if the key is missing."""
    if not settings.GEMINI_API_KEY:
        logger.warning("GEMINI_API_KEY not set — running in pre-cached fallback mode.")
        return None
    try:
        import google.generativeai as genai

        genai.configure(api_key=settings.GEMINI_API_KEY)
        model = genai.GenerativeModel(
            model_name=settings.GEMINI_MODEL,
            system_instruction=SYSTEM_INSTRUCTION,
        )
        return model
    except Exception as exc:
        logger.error("Failed to initialise Gemini model: %s", exc)
        return None


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------
def generate_narration(
    context_title: str,
    facts_text: str,
    context_type: str = "monument",
) -> str:
    """Create an engaging 2-3 sentence narration grounded in *facts_text*."""
    model = _get_gemini_model()

    # ---------- Fallback path ----------
    if model is None:
        cached = PRECACHED_NARRATIONS.get(context_title)
        if cached:
            return cached
        # Generic fallback built from facts
        first_sentence = facts_text.split(".")[0].strip()
        return (
            f"Welcome to {context_title}. "
            f"This remarkable {context_type} is renowned for its historical and artistic significance. "
            f"{first_sentence}."
        )

    # ---------- Live Gemini path ----------
    prompt = (
        f"Generate a captivating 2-3 sentence narration for a visitor who has just "
        f"arrived at '{context_title}' (a {context_type}). "
        f"Ground your narration STRICTLY on the following verified facts.\n\n"
        f"FACTS:\n{facts_text}\n\n"
        f"Provide ONLY the narration text to be spoken aloud — no titles, bullets, "
        f"or markdown formatting."
    )

    try:
        response = model.generate_content(prompt)
        if response and response.text:
            return response.text.strip()
    except Exception as exc:
        logger.error("Gemini narration call failed: %s", exc)

    # If API call fails, still try cached / generic
    return PRECACHED_NARRATIONS.get(
        context_title,
        f"You are viewing {context_title}. {facts_text[:250]}",
    )


def answer_question(
    context_title: str,
    facts_text: str,
    question: str,
    context_type: str = "item",
) -> str:
    """Answer a visitor's free-form question grounded in *facts_text*."""
    model = _get_gemini_model()

    # ---------- Fallback path ----------
    if model is None:
        return (
            f"That's a great question about {context_title}! "
            f"Based on our records: {facts_text[:300]}. "
            f"The historical evidence highlights the profound craftsmanship and "
            f"cultural significance of this piece."
        )

    # ---------- Live Gemini path ----------
    prompt = (
        f"A visitor is currently examining '{context_title}' (a {context_type}) "
        f"and asked:\n\"{question}\"\n\n"
        f"Ground your answer using the verified facts below. If the answer cannot "
        f"be fully determined from the facts, supplement with your art-history "
        f"knowledge but prefer the provided facts. Keep the answer concise "
        f"(2-4 sentences) and suitable for text-to-speech.\n\n"
        f"GROUNDING FACTS:\n{facts_text}\n\n"
        f"Answer directly and warmly:"
    )

    try:
        response = model.generate_content(prompt)
        if response and response.text:
            return response.text.strip()
    except Exception as exc:
        logger.error("Gemini Q&A call failed: %s", exc)

    return (
        f"I'd love to tell you more about '{context_title}'. "
        f"Here's what we know: {facts_text[:250]}…"
    )
