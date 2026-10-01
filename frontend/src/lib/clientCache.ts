/**
 * Small localStorage cache for data the backend already treats as stable.
 *
 * The backend caches aggressively, but every page reload still pays a network
 * round trip before the experience can show anything. Keeping the last good
 * payload here means a reload renders from the previous answer immediately and
 * refreshes in the background.
 *
 * Everything here is best-effort: storage can be full, disabled, or throw in a
 * private window, and in every one of those cases the caller should simply go
 * to the network.
 */

const PREFIX = 'echoes:v1:';

interface Envelope<T> {
  storedAt: number;
  value: T;
}

export function readCache<T>(key: string, maxAgeMs: number): T | null {
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const envelope = JSON.parse(raw) as Envelope<T>;
    if (!envelope || typeof envelope.storedAt !== 'number') return null;
    if (Date.now() - envelope.storedAt > maxAgeMs) return null;
    return envelope.value;
  } catch {
    return null;
  }
}

export function writeCache<T>(key: string, value: T): void {
  try {
    const envelope: Envelope<T> = { storedAt: Date.now(), value };
    window.localStorage.setItem(PREFIX + key, JSON.stringify(envelope));
  } catch {
    // Quota exceeded or storage unavailable — the network path still works, so
    // there is nothing useful to do here.
  }
}

export function clearCache(key: string): void {
  try {
    window.localStorage.removeItem(PREFIX + key);
  } catch {
    /* ignore */
  }
}
