"""Tiny dependency-free disk cache.

Every byte we are allowed to keep from Google or Gemini lands here, so a demo
run — or twenty of them — costs zero upstream requests. Keeping this a plain
JSON-on-disk store (rather than another DB table) means it survives schema
resets and can be inspected or wiped with a file manager mid-hackathon.
"""

from __future__ import annotations

import hashlib
import json
import logging
import os
import re
import tempfile
import threading
import time
from pathlib import Path
from typing import Any, Callable, Optional

from app.config import settings

logger = logging.getLogger(__name__)

_LOCK = threading.Lock()
_SAFE = re.compile(r"[^a-zA-Z0-9._-]+")


def _cache_root() -> Path:
    root = Path(settings.CACHE_DIR)
    root.mkdir(parents=True, exist_ok=True)
    return root


def _path_for(namespace: str, key: str) -> Path:
    ns = _SAFE.sub("_", namespace) or "default"
    folder = _cache_root() / ns
    folder.mkdir(parents=True, exist_ok=True)

    safe = _SAFE.sub("_", key)
    # Long or exotic keys (lat/lng tuples, tile paths) get a stable hash suffix
    # so the filename stays short but never collides.
    if len(safe) > 80 or safe != key:
        digest = hashlib.sha1(key.encode("utf-8")).hexdigest()[:12]
        safe = f"{safe[:60]}-{digest}"
    return folder / f"{safe}.json"


def read(namespace: str, key: str, ttl_seconds: int = 0) -> Optional[Any]:
    """Return the cached value, or None when absent or expired.

    ``ttl_seconds=0`` means the entry never expires.
    """
    path = _path_for(namespace, key)
    if not path.exists():
        return None
    try:
        with path.open("r", encoding="utf-8") as fh:
            envelope = json.load(fh)
    except (json.JSONDecodeError, OSError) as exc:
        logger.warning("Discarding unreadable cache entry %s: %s", path.name, exc)
        return None

    if ttl_seconds and time.time() - envelope.get("stored_at", 0) > ttl_seconds:
        return None
    return envelope.get("value")


def write(namespace: str, key: str, value: Any) -> Any:
    """Persist *value* and return it unchanged (so calls can be inlined)."""
    path = _path_for(namespace, key)
    envelope = {"stored_at": time.time(), "key": key, "value": value}
    with _LOCK:
        try:
            # Write to a temp file in the same folder, then replace, so a crash
            # mid-write can never leave a half-written cache entry behind.
            fd, tmp = tempfile.mkstemp(dir=str(path.parent), suffix=".tmp")
            with os.fdopen(fd, "w", encoding="utf-8") as fh:
                json.dump(envelope, fh, ensure_ascii=False, indent=1)
            os.replace(tmp, path)
        except OSError as exc:
            logger.warning("Could not write cache entry %s: %s", path.name, exc)
    return value


def delete(namespace: str, key: str) -> bool:
    """Remove a cache entry. Returns True when something was actually removed.

    Writing ``None`` over an entry would also make :func:`read` miss, but it
    leaves a null-valued file behind that reads like a real (if empty) cache
    entry when you go looking — so invalidation removes the file outright.
    """
    path = _path_for(namespace, key)
    with _LOCK:
        try:
            path.unlink()
            return True
        except FileNotFoundError:
            return False
        except OSError as exc:
            logger.warning("Could not delete cache entry %s: %s", path.name, exc)
            return False


def get_or_set(
    namespace: str,
    key: str,
    producer: Callable[[], Any],
    ttl_seconds: int = 0,
) -> tuple[Any, bool]:
    """Return ``(value, was_cached)``, calling *producer* only on a cache miss.

    A producer that returns None is treated as a failure and is not cached, so a
    transient Google/Gemini outage doesn't poison the cache for the whole demo.
    """
    hit = read(namespace, key, ttl_seconds)
    if hit is not None:
        return hit, True

    value = producer()
    if value is None:
        return None, False
    return write(namespace, key, value), False


def stats() -> dict[str, int]:
    """Entry count per namespace — surfaced on /health for a quick sanity check."""
    root = _cache_root()
    out: dict[str, int] = {}
    for child in sorted(root.iterdir()) if root.exists() else []:
        if child.is_dir():
            out[child.name] = len(list(child.glob("*.json")))
    return out
