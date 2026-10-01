// Web Speech API wrapper for the AI guide's voice (TTS) and the visitor's mic (STT).

export interface SpeakHandle {
  /** Resolves when the utterance finishes or is cancelled. Pausing does not settle it. */
  done: Promise<void>;
  cancel: () => void;
  pause: () => void;
  resume: () => void;
  isPaused: () => boolean;
}

export function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

/**
 * Pick the most natural-sounding English voice available.
 *
 * Voice lists populate asynchronously in Chrome, so this is re-read on every
 * call rather than cached — the first utterance of a session often runs before
 * `getVoices()` has anything in it.
 */
function pickVoice(): SpeechSynthesisVoice | null {
  if (!isSpeechSupported()) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;

  const english = voices.filter((v) => v.lang.startsWith('en'));
  const pool = english.length ? english : voices;

  // Ordered by how much they sound like a person reading aloud.
  const preferred = [
    /Google UK English Female/i,
    /Microsoft (Aria|Jenny|Libby|Sonia|Emma)/i,
    /Natural/i,
    /Google US English/i,
    /Samantha/i,
    /Daniel/i,
  ];
  for (const pattern of preferred) {
    const match = pool.find((v) => pattern.test(v.name));
    if (match) return match;
  }
  return pool[0] ?? null;
}

/** Nudge Chrome into populating its voice list as early as possible. */
export function primeVoices(): void {
  if (!isSpeechSupported()) return;
  window.speechSynthesis.getVoices();
}

interface SpeakOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  /**
   * Fires as the voice crosses each word, with the character offset reached.
   * The guided tour uses this to keep its caption in step with the audio, and
   * to know where to restart from after a pause.
   */
  onBoundary?: (charIndex: number) => void;
}

/**
 * Speak `text`, returning a handle that can be paused, resumed and cancelled.
 *
 * Pausing does *not* use `speechSynthesis.pause()`. That call is unreliable for
 * Chrome's remote voices — the ones that sound best, and the ones this guide
 * picks first: the speech often carries on regardless, and a later `resume()`
 * can restart audio the visitor thought they had stopped. Instead a pause
 * cancels the utterance and remembers how far the voice got, and a resume
 * speaks the remainder. The visitor hears a clean stop and a continuation from
 * roughly the right word, which is what they asked for.
 */
export function speak(text: string, options: SpeakOptions = {}): SpeakHandle {
  if (!isSpeechSupported() || !text.trim()) {
    return {
      done: Promise.resolve(),
      cancel: () => {},
      pause: () => {},
      resume: () => {},
      isPaused: () => false,
    };
  }

  let settled = false;
  let paused = false;
  let charOffset = 0;
  let keepAlive = 0;

  let resolveDone: () => void = () => {};
  const done = new Promise<void>((resolve) => {
    resolveDone = () => {
      if (settled) return;
      settled = true;
      window.clearInterval(keepAlive);
      resolve();
    };
  });

  const speakFrom = (offset: number) => {
    const remaining = text.slice(offset);
    if (!remaining.trim()) {
      resolveDone();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(remaining);
    utterance.rate = options.rate ?? 1.02;
    utterance.pitch = options.pitch ?? 1.0;
    utterance.volume = options.volume ?? 1.0;

    const voice = pickVoice();
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    }

    utterance.onboundary = (event) => {
      charOffset = offset + (event.charIndex ?? 0);
      options.onBoundary?.(charOffset);
    };
    // A pause cancels the utterance, which fires end/error. Those must not be
    // mistaken for the line finishing, or the tour would advance while paused.
    utterance.onend = () => {
      if (!paused) resolveDone();
    };
    utterance.onerror = (event) => {
      if (paused) return;
      if (event.error && event.error !== 'interrupted' && event.error !== 'canceled') {
        console.warn('Speech synthesis error:', event.error);
      }
      resolveDone();
    };

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  // Chrome stops synthesising after roughly 15 seconds and never fires `end`.
  // Several tour lines run right at that boundary, so a periodic nudge keeps
  // the voice alive — but only while actually speaking, never while paused.
  keepAlive = window.setInterval(() => {
    if (settled) {
      window.clearInterval(keepAlive);
      return;
    }
    if (paused) return;
    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
      window.speechSynthesis.resume();
    }
  }, 10_000);

  speakFrom(0);

  return {
    done,
    cancel: () => {
      paused = false;
      window.clearInterval(keepAlive);
      window.speechSynthesis.cancel();
      resolveDone();
    },
    pause: () => {
      if (paused || settled) return;
      paused = true;
      window.speechSynthesis.cancel();
    },
    resume: () => {
      if (!paused || settled) return;
      paused = false;
      speakFrom(charOffset);
    },
    isPaused: () => paused,
  };
}

export function stopSpeaking(): void {
  if (isSpeechSupported()) window.speechSynthesis.cancel();
}

// ---------------------------------------------------------------------------
// Legacy helper retained for the paintings gallery, which calls it directly.
// ---------------------------------------------------------------------------
export function speakText(text: string, onEnd?: () => void): SpeechSynthesisUtterance | null {
  if (!isSpeechSupported()) {
    onEnd?.();
    return null;
  }
  const handle = speak(text);
  if (onEnd) handle.done.then(onEnd);
  return null;
}

// ---------------------------------------------------------------------------
// Speech recognition (visitor questions)
// ---------------------------------------------------------------------------
export function createSpeechRecognition(
  onTranscript: (text: string) => void,
  onError?: (err: any) => void,
) {
  if (typeof window === 'undefined') return null;

  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!SpeechRecognition) {
    console.warn('Web Speech API (SpeechRecognition) is not supported in this browser.');
    return null;
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = 'en-US';

  recognition.onresult = (event: any) => {
    onTranscript(event.results[0][0].transcript);
  };
  recognition.onerror = (event: any) => {
    console.warn('Speech recognition error:', event.error);
    onError?.(event.error);
  };

  return recognition;
}
