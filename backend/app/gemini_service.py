import logging
import re
import threading
import time
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
#
# Google retires Gemini model names on a rolling basis, and a retired name fails
# at call time with a 404 rather than at configuration time — which, on stage,
# looks exactly like "the AI is broken". So the configured model is tried first
# and a short list of current flash models backs it up.
# ---------------------------------------------------------------------------
# Ordered by quality, but filtered by what the free tier will actually serve:
# the headline flash models are capped at twenty requests per *day*, which a
# single afternoon of testing exhausts, so the lite models sit behind them as
# working backups. Verify with: python -m scripts.probe_quota
FALLBACK_MODELS = [
    "gemini-3.5-flash",
    "gemini-flash-lite-latest",
    "gemini-3.1-flash-lite",
]

# The free tier caps requests per minute as well as per day, so calls are spaced
# out rather than fired in a burst. This is why narration polishing is off by
# default (see settings.GEMINI_POLISH_NARRATION): the daily allowance is better
# spent on the visitor's live questions than on rewriting a script that is
# already written.
_FREE_TIER_RPM = 5
_MIN_INTERVAL_S = 60.0 / _FREE_TIER_RPM
_RATE_LOCK = threading.Lock()
_last_call_at = 0.0


def _throttle() -> None:
    """Space calls out so we stay inside the free-tier requests-per-minute limit."""
    global _last_call_at
    with _RATE_LOCK:
        wait = _MIN_INTERVAL_S - (time.monotonic() - _last_call_at)
        if wait > 0:
            time.sleep(wait)
        _last_call_at = time.monotonic()


def _retry_delay_seconds(error: Exception) -> float | None:
    """Pull Google's suggested retry delay out of a 429, if it offered one."""
    text = str(error)
    if "429" not in text and "quota" not in text.lower():
        return None
    match = re.search(r"retry_delay\s*{\s*seconds:\s*(\d+)", text)
    if match:
        return float(match.group(1)) + 1.0
    match = re.search(r"retry in ([\d.]+)s", text)
    if match:
        return float(match.group(1)) + 1.0
    return float(_MIN_INTERVAL_S)


def _is_daily_quota(error: Exception) -> bool:
    """A per-day cap is not worth waiting out — switch models instead."""
    return "PerDay" in str(error)


def _is_missing_model(error: Exception) -> bool:
    text = str(error)
    return "404" in text or "not found" in text.lower() or "no longer available" in text.lower()


def _generate(prompt: str, *, attempts: int = 3) -> str | None:
    """Generate text, pacing for the free tier and rotating models when needed.

    A per-minute 429 is worth sleeping through. A per-*day* quota or a retired
    model is not — those rotate to the next candidate immediately, so a demo
    keeps working on a different model rather than stalling for a minute and
    then failing anyway.
    """
    for attempt in range(attempts):
        model = _get_gemini_model()
        if model is None:
            return None

        _throttle()
        try:
            response = model.generate_content(prompt)
            if response and response.text:
                return response.text.strip()
            return None
        except Exception as exc:
            if _is_missing_model(exc) or _is_daily_quota(exc):
                reason = "model retired" if _is_missing_model(exc) else "daily quota spent"
                if _rotate_model(reason):
                    continue
                raise

            delay = _retry_delay_seconds(exc)
            if delay is None or attempt == attempts - 1:
                raise
            logger.warning(
                "Gemini rate-limited; waiting %.0fs before retry %d/%d.",
                delay,
                attempt + 2,
                attempts,
            )
            time.sleep(delay)
    return None


def _candidate_models() -> list[str]:
    ordered = [settings.GEMINI_MODEL] if settings.GEMINI_MODEL else []
    for name in FALLBACK_MODELS:
        if name not in ordered:
            ordered.append(name)
    return ordered


# Index into _candidate_models() of the model we are currently using. It only
# ever moves forward, when a model turns out to be retired or out of quota.
_model_index = 0
_model_cache: dict[str, object] = {}


def _build_model(name: str):
    import google.generativeai as genai

    genai.configure(api_key=settings.GEMINI_API_KEY)
    return genai.GenerativeModel(model_name=name, system_instruction=SYSTEM_INSTRUCTION)


def _get_gemini_model():
    """Return the current Gemini model, or None when no key is configured.

    Deliberately does *no* network call. An earlier version verified each
    candidate with a tiny probe generation, which was a nice idea until the free
    tier turned out to allow only twenty requests per day per model — the probe
    was spending the quota the visitor's questions needed. Models are now
    validated lazily, by actually being used.
    """
    if not settings.GEMINI_API_KEY:
        return None

    candidates = _candidate_models()
    if _model_index >= len(candidates):
        return None

    name = candidates[_model_index]
    if name not in _model_cache:
        try:
            _model_cache[name] = _build_model(name)
            logger.info("Gemini ready on model '%s'.", name)
        except Exception as exc:
            logger.error("Could not construct Gemini model '%s': %s", name, exc)
            return None
    return _model_cache[name]


def _rotate_model(reason: str) -> bool:
    """Move to the next candidate model. Returns False when none are left."""
    global _model_index
    candidates = _candidate_models()
    _model_index += 1
    if _model_index >= len(candidates):
        logger.error("No Gemini models left to try (%s).", reason)
        return False
    logger.warning(
        "Switching Gemini model to '%s' (%s).", candidates[_model_index], reason
    )
    return True

    logger.error("No usable Gemini model found — falling back to authored narration.")
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
        text = _generate(prompt)
        if text:
            return text
    except Exception as exc:
        logger.error("Gemini narration call failed: %s", exc)

    # If API call fails, still try cached / generic
    return PRECACHED_NARRATIONS.get(
        context_title,
        f"You are viewing {context_title}. {facts_text[:250]}",
    )


def _grounded_fallback(context_title: str, facts_text: str) -> str:
    """What the guide says when Gemini is unavailable.

    Deliberately plain. The temptation is to pad with "what a wonderful
    question!" and a sentence about craftsmanship and cultural significance,
    which says nothing and sounds like filler — so this hands over the verified
    facts instead, and says plainly where they came from. Two sentences of real
    information beat four of enthusiasm.
    """
    sentences = [s.strip() for s in facts_text.split(". ") if s.strip()]
    answer = ". ".join(sentences[:2]).rstrip(".")
    subject = context_title.split("—")[-1].strip() or context_title
    return (
        f"From the notes on {subject}: {answer}. "
        f"My connection to the wider archive is down, so that is from the "
        f"verified record rather than from me."
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
        return _grounded_fallback(context_title, facts_text)

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
        text = _generate(prompt)
        if text:
            return text
    except Exception as exc:
        logger.error("Gemini Q&A call failed: %s", exc)

    return _grounded_fallback(context_title, facts_text)


# ---------------------------------------------------------------------------
# Tour-script polish (used by experience_service)
#
# The monument tour ships with hand-written narration that is already good
# enough to demo. When a Gemini key is present we let the model tighten each
# line into spoken-docent voice; the result is cached permanently upstream in
# ``experience_service``, so this runs at most once per line per machine.
# ---------------------------------------------------------------------------
def polish_narration(title: str, authored: str, facts: str) -> str | None:
    """Rewrite *authored* in docent voice, or return None to keep the original."""
    model = _get_gemini_model()
    if model is None:
        return None

    prompt = (
        f"You are narrating a live walking tour and have arrived at '{title}'.\n\n"
        f"Below is the script a human guide wrote for this moment. Rewrite it so it "
        f"sounds natural spoken aloud: same facts, same order, same length "
        f"(within ten words), warm and direct, second person. Do not add facts that "
        f"are not in the script or the grounding notes. Do not add a greeting, a "
        f"sign-off, markdown, or stage directions. Return only the spoken words.\n\n"
        f"SCRIPT:\n{authored}\n\n"
        f"GROUNDING NOTES (for accuracy only, do not recite):\n{facts}\n"
    )

    try:
        text = _generate(prompt)
        if text:
            cleaned = text.strip('"')
            # Guard against the model ignoring the length instruction and
            # desynchronising the narration from the tour's pacing.
            if 0.5 <= len(cleaned.split()) / max(1, len(authored.split())) <= 1.8:
                return cleaned
            logger.warning("Discarding off-length polish for '%s'.", title)
    except Exception as exc:
        logger.error("Gemini polish call failed for '%s': %s", title, exc)

    return None

