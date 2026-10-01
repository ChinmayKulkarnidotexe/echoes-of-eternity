import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import type { Painting } from '../../types';
import { fetchPaintingInfo, askQuestion } from '../../services/api';

interface Props {
  painting: Painting;
}

type Status = 'idle' | 'loading' | 'speaking' | 'listening' | 'thinking' | 'answering';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export const GalleryVoicePanel: React.FC<Props> = ({ painting }) => {
  const [status, setStatus] = useState<Status>('loading');
  const [narration, setNarration] = useState('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [showPanel, setShowPanel] = useState(true);
  const recognitionRef = useRef<any>(null);
  const uttRef = useRef<SpeechSynthesisUtterance | null>(null);

  // ── Text-to-Speech ──────────────────────────────────────────
  const speak = useCallback((text: string, onDone?: () => void) => {
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate  = 0.9;
    utt.pitch = 1.0;
    utt.volume = 1.0;

    // Prefer a natural English voice
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      const pick =
        voices.find(v => v.lang === 'en-GB' && v.localService) ||
        voices.find(v => v.lang.startsWith('en') && v.localService) ||
        voices.find(v => v.lang.startsWith('en'));
      if (pick) utt.voice = pick;
    };

    if (window.speechSynthesis.getVoices().length > 0) {
      loadVoices();
    } else {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    utt.onstart = () => setStatus('speaking');
    utt.onend   = () => { setStatus('idle'); onDone?.(); };
    utt.onerror = () => setStatus('idle');
    uttRef.current = utt;
    window.speechSynthesis.speak(utt);
  }, []);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis.cancel();
    setStatus('idle');
  }, []);

  // ── Load narration + auto-speak on mount ───────────────────
  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    setQuestion('');
    setAnswer('');

    fetchPaintingInfo(painting.id)
      .then(res => {
        if (cancelled) return;
        setNarration(res.narration);
        // Small delay so the scene finishes loading
        setTimeout(() => {
          if (!cancelled) speak(res.narration);
        }, 1800);
      })
      .catch(() => {
        if (cancelled) return;
        const fallback = `Welcome. Before you stands "${painting.title}" by ${painting.artist}, created in ${painting.year}. ${painting.facts_text}`;
        setNarration(fallback);
        setTimeout(() => { if (!cancelled) speak(fallback); }, 1800);
      });

    return () => {
      cancelled = true;
      window.speechSynthesis.cancel();
      if (recognitionRef.current) recognitionRef.current.abort();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [painting.id]);

  // ── Voice recognition ──────────────────────────────────────
  const startListening = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      alert('Speech recognition requires Chrome or Edge. Please try in one of those browsers.');
      return;
    }
    stopSpeaking();
    setStatus('listening');
    setQuestion('');
    setAnswer('');

    const rec = new SR();
    rec.lang = 'en-US';
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    recognitionRef.current = rec;

    rec.onresult = async (e: any) => {
      const q: string = e.results[0][0].transcript;
      setQuestion(q);
      setStatus('thinking');

      try {
        const res = await askQuestion('painting', painting.id, q);
        setAnswer(res.answer);
        setStatus('answering');
        speak(res.answer, () => setStatus('idle'));
      } catch {
        const err = "I'm sorry, I couldn't retrieve an answer right now. Please try again.";
        setAnswer(err);
        speak(err);
      }
    };

    rec.onerror = () => setStatus('idle');
    rec.onend   = () => {
      if (status === 'listening') setStatus('idle');
    };

    rec.start();
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }
    setStatus('idle');
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 z-40 flex flex-col items-center gap-3 pb-5 pointer-events-none">

      {/* ── Q&A display panel ── */}
      {showPanel && (question || answer || status === 'thinking') && (
        <div className="pointer-events-auto w-full max-w-2xl px-4">
          <div
            className="rounded-2xl p-4 flex flex-col gap-2.5"
            style={{
              background: 'rgba(8,5,3,0.94)',
              border: '1px solid rgba(212,175,55,0.22)',
              backdropFilter: 'blur(24px)',
              boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
            }}
          >
            {question && (
              <div className="flex items-start gap-3">
                <span
                  className="text-[9px] font-semibold tracking-[0.2em] uppercase mt-1 shrink-0 px-1.5 py-0.5 rounded"
                  style={{ background: 'rgba(212,175,55,0.12)', color: '#d4af37' }}
                >
                  You
                </span>
                <p className="text-sm text-stone-300 font-light italic">"{question}"</p>
              </div>
            )}

            {status === 'thinking' && (
              <div className="flex items-center gap-2 text-xs text-stone-500 pl-8">
                <Loader2 className="w-3 h-3 animate-spin text-amber-500" />
                Consulting the archives…
              </div>
            )}

            {answer && (
              <div className="flex items-start gap-3">
                <span
                  className="text-[9px] font-semibold tracking-[0.2em] uppercase mt-1 shrink-0 px-1.5 py-0.5 rounded"
                  style={{ background: 'rgba(140,100,220,0.15)', color: '#a78bfa' }}
                >
                  AI
                </span>
                <p className="text-sm text-stone-100 font-light leading-relaxed">{answer}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Controls bar ── */}
      <div
        className="pointer-events-auto flex items-center gap-3 px-5 py-2.5 rounded-full"
        style={{
          background: 'rgba(10,7,5,0.92)',
          border: '1px solid rgba(255,255,255,0.09)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
        }}
      >
        {/* Narrate / Stop */}
        <button
          id="btn-narrate"
          onClick={status === 'speaking' ? stopSpeaking : () => speak(narration)}
          disabled={status === 'loading' || status === 'thinking' || status === 'listening'}
          className="flex items-center gap-1.5 text-xs font-medium transition-all disabled:opacity-30"
          style={{ color: status === 'speaking' ? '#f5c842' : '#a8a090' }}
          title={status === 'speaking' ? 'Stop narration' : 'Hear narration'}
        >
          {status === 'speaking' ? (
            <><VolumeX className="w-4 h-4" /> Stop</>
          ) : status === 'loading' ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Loading…</>
          ) : (
            <><Volume2 className="w-4 h-4" /> Narrate</>
          )}
        </button>

        <div className="w-px h-3.5 bg-stone-700" />

        {/* Status text */}
        <div className="text-[11px] min-w-[90px] text-center">
          {status === 'listening' && (
            <span className="flex items-center gap-1.5 text-red-400">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> Listening…
            </span>
          )}
          {status === 'thinking' && (
            <span className="flex items-center gap-1.5 text-amber-400">
              <Loader2 className="w-3 h-3 animate-spin" /> Thinking…
            </span>
          )}
          {status === 'answering' && (
            <span className="flex items-center gap-1.5 text-violet-300">
              <Volume2 className="w-3 h-3" /> Answering…
            </span>
          )}
          {(status === 'idle' || status === 'speaking') && (
            <span className="text-stone-600">Drag · Scroll</span>
          )}
        </div>

        <div className="w-px h-3.5 bg-stone-700" />

        {/* Mic / Ask */}
        <button
          id="btn-ask"
          onClick={status === 'listening' ? stopListening : startListening}
          disabled={status === 'loading' || status === 'thinking' || status === 'speaking'}
          className="flex items-center gap-1.5 text-xs font-medium transition-all disabled:opacity-30"
          style={{ color: status === 'listening' ? '#f87171' : '#a8a090' }}
          title="Ask a question by voice"
        >
          {status === 'listening' ? (
            <><MicOff className="w-4 h-4" /> Cancel</>
          ) : (
            <><Mic className="w-4 h-4" /> Ask</>
          )}
        </button>

        {/* Toggle panel visibility */}
        {(question || answer) && (
          <>
            <div className="w-px h-3.5 bg-stone-700" />
            <button
              onClick={() => setShowPanel(p => !p)}
              className="text-stone-600 hover:text-stone-400 transition-colors"
              title={showPanel ? 'Hide response' : 'Show response'}
            >
              {showPanel ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </button>
          </>
        )}
      </div>
    </div>
  );
};
