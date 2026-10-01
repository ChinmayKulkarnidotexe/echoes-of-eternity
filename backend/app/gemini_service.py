import logging
from app.config import settings

logger = logging.getLogger(__name__)

# Fallback pre-cached narrations and responses in case of missing API key or network limits (PRD Section 12)
PRECACHED_NARRATIONS = {
    "Taj Mahal - Main Gateway (Darwaza-i-Rauza)": (
        "Welcome to the Great Gate, or Darwaza-i-Rauza. Before you stands the majestic gateway of the Taj Mahal. "
        "Notice the precision of the Arabic calligraphy framing the archway, inviting you into Paradise on Earth."
    ),
    "Taj Mahal - The Reflecting Pool (Charbagh)": (
        "Here at the Charbagh reflecting pool, the Mughal symmetry comes alive. "
        "The four quadrants symbolize the four rivers of paradise described in Islamic tradition, perfectly mirroring the white marble dome."
    ),
    "Taj Mahal - The Central Dome & Mausoleum": (
        "Standing directly before the central marble dome, you can appreciate the delicate pietra dura inlay work. "
        "Thousands of semi-precious stones form blooming vines, crafted by master artisans over 22 years."
    ),
    "The Starry Night": (
        "Vincent van Gogh painted 'The Starry Night' in June 1889 from his asylum room in Saint-Rémy-de-Provence. "
        "The swirling sky and vibrant ultramarine blues reflect his intense emotional vision and spiritual wonder."
    ),
    "Mona Lisa": (
        "Painted by Leonardo da Vinci between 1503 and 1519, the Mona Lisa is celebrated for her enigmatic expression "
        "and Leonardo's pioneering sfumato technique, seamlessly blending light and shadow."
    ),
    "The Great Wave off Kanagawa": (
        "Hokusai's iconic woodblock print from circa 1831 depicts towering rogue waves framing Mount Fuji. "
        "The bold use of imported Prussian blue pigment transformed Japanese art and captivated the Western impressionists."
    )
}

def _get_gemini_model():
    if not settings.GEMINI_API_KEY:
        logger.warning("GEMINI_API_KEY not configured. Operating in fallback mock mode.")
        return None
    try:
        import google.generativeai as genai
        genai.configure(api_key=settings.GEMINI_API_KEY)
        model = genai.GenerativeModel(settings.GEMINI_MODEL)
        return model
    except Exception as e:
        logger.error(f"Error initializing Gemini: {e}")
        return None

def generate_narration(context_title: str, facts_text: str, context_type: str = "monument") -> str:
    """Generate an engaging, natural tour-guide narration grounded strictly in facts_text."""
    model = _get_gemini_model()
    if not model:
        if context_title in PRECACHED_NARRATIONS:
            return PRECACHED_NARRATIONS[context_title]
        return (
            f"Welcome to {context_title}. This remarkable {context_type} is renowned for its historical and artistic value. "
            f"Key highlight: {facts_text.split('.')[0]}."
        )

    prompt = f"""You are an enthusiastic, expert, and warm audio-tour guide for a virtual museum and heritage experience.
Generate a captivating 2-3 sentence narration for a visitor who has just stopped at '{context_title}' ({context_type}).
Speak directly to the listener (use second person 'you', 'notice', 'before you').
Ground your narration STRICTLY on the verified facts below. Do not make up facts.

FACTS:
{facts_text}

Provide only the narration text to be spoken aloud. Keep it concise, engaging, and atmospheric."""

    try:
        response = model.generate_content(prompt)
        if response and response.text:
            return response.text.strip()
    except Exception as e:
        logger.error(f"Gemini narration generation failed: {e}")
    
    return PRECACHED_NARRATIONS.get(
        context_title,
        f"You are viewing {context_title}. Notice the intricate craftsmanship and historical significance: {facts_text}"
    )

def answer_question(context_title: str, facts_text: str, question: str, context_type: str = "item") -> str:
    """Answer a user question grounded in facts_text with a helpful museum docent persona."""
    model = _get_gemini_model()
    if not model:
        return (
            f"That's a wonderful question about {context_title}! Based on our records: {facts_text}. "
            f"Regarding '{question}', the historical evidence highlights the profound craftsmanship and cultural significance of this piece."
        )

    prompt = f"""You are a friendly, knowledgeable museum docent and heritage guide.
A visitor is currently examining '{context_title}' (a {context_type}) and asked:
"{question}"

Ground your answer using the verified facts below. If the answer cannot be fully determined from the facts, answer courteously using your art history knowledge while prioritizing the provided facts. Keep the answer concise (2-4 sentences max) suitable for speech audio.

GROUNDING FACTS:
{facts_text}

Answer directly and warmly:"""

    try:
        response = model.generate_content(prompt)
        if response and response.text:
            return response.text.strip()
    except Exception as e:
        logger.error(f"Gemini Q&A answer failed: {e}")
        return f"Regarding {question} at {context_title}: {facts_text[:200]}..."
