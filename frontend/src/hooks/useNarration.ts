import { useEffect, useRef, useState } from 'react';
import { isSpeechSupported, speak, stopSpeaking, type SpeakHandle } from '../services/speech';

interface Options {
  /** Changes whenever a new line should begin. */
  legKey: string;
  text: string;
  /** Fallback length for this leg when there is no voice to wait on. */
  dwellMs: number;
  active: boolean;
  paused: boolean;
  muted: boolean;
  /** Quiet beat between the voice stopping and the next leg starting. */
  holdMs?: number;
  onComplete: () => void;
}

interface Narration {
  /** 0–1 through the current line. */
  progress: number;
  speaking: boolean;
}

/** Average speaking rate used to estimate a line's length, in words/second. */
const WORDS_PER_SECOND = 2.6;
const DEFAULT_HOLD_MS = 1400;
/** Hard ceiling, so a voice that dies silently can never stall the tour. */
const STALL_GUARD_MULTIPLIER = 2.4;
/**
 * Floor on how long a stop is held, as a fraction of its expected length.
 *
 * Speech synthesis reports `end` immediately when it cannot actually play —
 * a machine with no audio output, a backgrounded tab, or a browser that has
 * not yet granted autoplay. Without a floor the tour reads that as "line
 * finished" eleven times in a row and the whole three-minute walk flashes past
 * in twenty seconds. The floor keeps the pacing watchable even in silence.
 */
const MIN_LEG_FRACTION = 0.85;

/**
 * Drives one leg of narration and reports when it is finished.
 *
 * The tour advances on the voice actually finishing rather than on a fixed
 * timer, which is what keeps the pacing from feeling mechanical — but every
 * exit route is covered: a muted visitor falls back to a reading-speed timer,
 * and a hard stall guard fires if the speech engine goes quiet without
 * reporting completion (which Chrome does occasionally on long sessions).
 */
export function useNarration({
  legKey,
  text,
  dwellMs,
  active,
  paused,
  muted,
  holdMs = DEFAULT_HOLD_MS,
  onComplete,
}: Options): Narration {
  const [progress, setProgress] = useState(0);
  const [speaking, setSpeaking] = useState(false);

  const pausedRef = useRef(paused);
  const completeRef = useRef(onComplete);
  const handleRef = useRef<SpeakHandle | null>(null);
  pausedRef.current = paused;
  completeRef.current = onComplete;

  useEffect(() => {
    if (!active || !text) {
      setProgress(0);
      setSpeaking(false);
      return;
    }

    let cancelled = false;
    let finished = false;
    let frame: number | null = null;
    const timers: number[] = [];

    // Clock that excludes time spent paused, so progress, the caption and the
    // stall guard all respect a visitor who stepped away mid-sentence.
    const startedAt = performance.now();
    let pausedTotal = 0;
    let pausedSince: number | null = null;
    const elapsed = () => {
      const now = performance.now();
      const frozen = pausedSince === null ? 0 : now - pausedSince;
      return now - startedAt - pausedTotal - frozen;
    };

    const estimatedMs = Math.max(
      3500,
      (text.trim().split(/\s+/).length / WORDS_PER_SECOND) * 1000,
    );

    const minimumLegMs = Math.min(dwellMs, estimatedMs) * MIN_LEG_FRACTION;

    const finish = () => {
      if (finished || cancelled) return;
      finished = true;
      setProgress(1);
      // Never advance before the stop has had its minimum time on screen, even
      // if the voice claimed to finish instantly because it never played.
      const remaining = Math.max(0, minimumLegMs - elapsed());

      // The closing beat must honour a pause too, or a visitor who hits pause
      // just as a line ends still gets moved to the next stop.
      const tryComplete = () => {
        if (cancelled) return;
        if (pausedRef.current) {
          timers.push(window.setTimeout(tryComplete, 250));
          return;
        }
        completeRef.current();
      };
      timers.push(window.setTimeout(tryComplete, remaining + holdMs));
    };

    setProgress(0);

    let boundaryFraction = 0;
    const useVoice = !muted && isSpeechSupported();

    if (useVoice) {
      const handle = speak(text, {
        onBoundary: (charIndex) => {
          boundaryFraction = Math.min(1, charIndex / Math.max(1, text.length));
        },
      });
      handleRef.current = handle;
      setSpeaking(true);
      // A pause never settles this promise, so the tour cannot advance while
      // the visitor has it held.
      handle.done.then(() => {
        if (cancelled) return;
        setSpeaking(false);
        finish();
      });
      // If the leg begins while already paused, hold the voice immediately.
      if (pausedRef.current) handle.pause();
    } else {
      setSpeaking(false);
      // No voice: hold for the authored dwell, which was written to match how
      // long the line takes to read. The rAF loop below enforces it so that the
      // hold honours pauses too.
    }

    const tick = () => {
      if (cancelled) return;

      if (pausedRef.current) {
        if (pausedSince === null) pausedSince = performance.now();
      } else if (pausedSince !== null) {
        pausedTotal += performance.now() - pausedSince;
        pausedSince = null;
      }

      if (!finished) {
        const timeFraction = elapsed() / estimatedMs;
        // Prefer real boundary events where the browser emits them; otherwise
        // fall back to the time estimate. Never reach 1 before the voice does.
        const next = Math.min(0.985, Math.max(boundaryFraction, timeFraction));
        setProgress(next);

        if (!useVoice && elapsed() >= Math.max(dwellMs, estimatedMs * 0.9)) {
          finish();
        } else if (
          useVoice &&
          elapsed() > Math.max(dwellMs, estimatedMs) * STALL_GUARD_MULTIPLIER
        ) {
          handleRef.current?.cancel();
          setSpeaking(false);
          finish();
        }
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      if (frame !== null) cancelAnimationFrame(frame);
      timers.forEach(window.clearTimeout);
      handleRef.current?.cancel();
      handleRef.current = null;
      setSpeaking(false);
    };
    // `paused` is handled through a ref and its own effect so pausing never
    // restarts the line from the beginning.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [legKey, active, muted, text, dwellMs, holdMs]);

  // Hold and release the voice through the handle rather than the global
  // speechSynthesis pause/resume, which Chrome does not honour for the remote
  // voices this guide prefers.
  useEffect(() => {
    if (!active) return;
    const handle = handleRef.current;
    if (!handle) return;
    if (paused) handle.pause();
    else handle.resume();
  }, [paused, active]);

  // Silence the guide the moment the experience is left.
  useEffect(() => () => stopSpeaking(), []);

  return { progress, speaking };
}
