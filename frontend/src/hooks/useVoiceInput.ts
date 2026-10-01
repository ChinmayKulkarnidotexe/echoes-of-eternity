import { useCallback, useEffect, useRef, useState } from 'react';
import { stopSpeaking } from '../services/speech';

export type VoiceState = 'idle' | 'starting' | 'listening' | 'unsupported' | 'error';

interface VoiceInput {
  state: VoiceState;
  /** Short, human-readable explanation when something went wrong. */
  message: string | null;
  listening: boolean;
  toggle: () => void;
  stop: () => void;
  dismiss: () => void;
}

/** How long to wait for speech before giving up and telling the visitor. */
const LISTEN_TIMEOUT_MS = 9000;

const ERROR_MESSAGES: Record<string, string> = {
  'not-allowed': 'Microphone access was blocked. Allow it in your browser’s address bar, then try again.',
  'service-not-allowed': 'Your browser blocked the speech service. Try Chrome, or type your question instead.',
  'no-speech': 'I didn’t catch anything. Try again, a little closer to the microphone.',
  'audio-capture': 'No microphone was found. Plug one in, or type your question instead.',
  network: 'Speech recognition needs an internet connection and could not reach the service.',
  aborted: '',
};

/**
 * Microphone input for asking the guide a question.
 *
 * Written to fail loudly. The previous implementation created a recogniser once,
 * flipped a `listening` flag on click, and listened only for `result` and
 * `error`. Chrome's Web Speech API routinely ends a session without firing
 * either — most often while a permission prompt is still unanswered — which
 * left the button stuck in its listening state for good, and every later click
 * called `stop()` on a recogniser that had already finished. From the outside
 * the microphone simply never worked.
 *
 * So: a fresh recogniser per attempt, an `end` handler that always resets, a
 * watchdog for the case where nothing at all comes back, and a visible message
 * on every failure path.
 */
export function useVoiceInput(onTranscript: (text: string) => void): VoiceInput {
  const [state, setState] = useState<VoiceState>('idle');
  const [message, setMessage] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const timeoutRef = useRef<number | null>(null);
  const gotResultRef = useRef(false);
  const transcriptRef = useRef(onTranscript);
  transcriptRef.current = onTranscript;

  const clearWatchdog = useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const teardown = useCallback(() => {
    clearWatchdog();
    const recognition = recognitionRef.current;
    recognitionRef.current = null;
    if (!recognition) return;
    // Drop the handlers before aborting, so the teardown does not re-enter.
    recognition.onresult = null;
    recognition.onerror = null;
    recognition.onend = null;
    try {
      recognition.abort();
    } catch {
      /* already finished */
    }
  }, [clearWatchdog]);

  const stop = useCallback(() => {
    teardown();
    setState('idle');
  }, [teardown]);

  const start = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setState('unsupported');
      setMessage('This browser has no speech recognition. Chrome supports it — or type your question.');
      return;
    }

    teardown();
    setMessage(null);
    gotResultRef.current = false;
    setState('starting');

    // The guide talking over the visitor is both rude and a recognition
    // problem: the microphone hears the narration and transcribes that.
    stopSpeaking();

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onaudiostart = () => setState('listening');
    recognition.onspeechstart = () => clearWatchdog();

    recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript?.trim();
      if (transcript) {
        gotResultRef.current = true;
        transcriptRef.current(transcript);
      }
    };

    recognition.onerror = (event: any) => {
      const code = event?.error ?? 'unknown';
      const text = ERROR_MESSAGES[code];
      if (text) {
        setState('error');
        setMessage(text);
      } else if (text === undefined) {
        setState('error');
        setMessage(`Speech recognition failed (${code}). Type your question instead.`);
      }
    };

    // Always fires, whatever happened — this is what keeps the button from
    // sticking in its listening state.
    recognition.onend = () => {
      clearWatchdog();
      recognitionRef.current = null;
      setState((current) => (current === 'error' ? current : 'idle'));
      if (!gotResultRef.current) {
        setMessage((current) =>
          current ?? 'I didn’t catch anything. Try again, or type your question.',
        );
      }
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
    } catch (error: any) {
      setState('error');
      setMessage(`Could not start the microphone (${error?.name ?? 'error'}).`);
      return;
    }

    // Chrome can leave a session open indefinitely while a permission prompt
    // sits unanswered, firing neither `error` nor `end`. Without this the UI
    // would wait forever.
    timeoutRef.current = window.setTimeout(() => {
      if (gotResultRef.current) return;
      teardown();
      setState('error');
      setMessage(
        'The microphone never started. Check that this site is allowed to use it, or type your question.',
      );
    }, LISTEN_TIMEOUT_MS);
  }, [teardown, clearWatchdog]);

  const toggle = useCallback(() => {
    if (state === 'listening' || state === 'starting') stop();
    else start();
  }, [state, start, stop]);

  const dismiss = useCallback(() => setMessage(null), []);

  useEffect(() => () => teardown(), [teardown]);

  return {
    state,
    message,
    listening: state === 'listening' || state === 'starting',
    toggle,
    stop,
    dismiss,
  };
}
