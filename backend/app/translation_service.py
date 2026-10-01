import logging
import requests
from typing import Optional

logger = logging.getLogger(__name__)

def translate_text(text: str, target_lang: str, source_lang: str = "auto") -> str:
    """
    Translates text using Google Translate service.
    Falls back gracefully to Gemini translation or the original text if needed.
    """
    if not text or not text.strip():
        return text

    # Extract base language code (e.g. 'es-ES' -> 'es', 'zh-CN' -> 'zh-CN' or 'zh')
    t_clean = target_lang.strip()
    # Normalize for Google Translate
    if t_clean.lower() in ("zh-cn", "zh-hans", "zh"):
        tl = "zh-CN"
    elif t_clean.lower() in ("zh-tw", "zh-hant", "zh-hk"):
        tl = "zh-TW"
    else:
        tl = t_clean.split("-")[0].lower() if "-" in t_clean else t_clean.lower()

    s_clean = source_lang.strip()
    if s_clean.lower() == "auto":
        sl = "auto"
    elif s_clean.lower() in ("zh-cn", "zh-hans"):
        sl = "zh-CN"
    elif s_clean.lower() in ("zh-tw", "zh-hant", "zh-hk"):
        sl = "zh-TW"
    else:
        sl = s_clean.split("-")[0].lower() if "-" in s_clean else s_clean.lower()

    # If source and target are the same language, no translation needed
    if sl == tl and sl != "auto":
        return text
    if sl == "en" and tl == "en":
        return text

    # 1. Google Translate API (fast, free, high quality)
    try:
        url = "https://translate.googleapis.com/translate_a/single"
        params = {
            "client": "gtx",
            "sl": sl,
            "tl": tl,
            "dt": "t",
            "q": text,
        }
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        }
        resp = requests.get(url, params=params, headers=headers, timeout=6)
        if resp.status_code == 200:
            data = resp.json()
            if data and data[0]:
                translated = "".join([part[0] for part in data[0] if part and part[0]])
                if translated.strip():
                    return translated.strip()
    except Exception as exc:
        logger.warning(f"Google Translate endpoint error: {exc}")

    # 2. Fallback to Gemini translation
    try:
        from app.gemini_service import _get_gemini_model
        model = _get_gemini_model()
        if model:
            prompt = (
                f"You are a professional translator. Translate the following text into the language with code '{tl}'. "
                f"Preserve the tone, facts, and clarity. Output ONLY the translated text without explanations, quotes, or markdown:\n\n"
                f"{text}"
            )
            res = model.generate_content(prompt)
            if res and res.text:
                return res.text.strip()
    except Exception as exc:
        logger.error(f"Gemini fallback translation error: {exc}")

    return text
