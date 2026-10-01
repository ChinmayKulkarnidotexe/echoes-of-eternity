import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Loader2, ChevronDown, ChevronUp, Globe } from 'lucide-react';
import type { Painting, LanguageOption, AccentOption } from '../../types';
import { fetchPaintingInfo, askQuestion } from '../../services/api';
import { LanguageDropdownUpward } from '../LanguageDropdownUpward';

interface Props {
  painting: Painting;
  currentLanguage: LanguageOption;
  currentAccent: AccentOption;
  onSelectLanguage: (lang: LanguageOption, accent: AccentOption) => void;
  isOpenDropdown?: boolean;
  onToggleDropdown?: () => void;
  onNarrationLoaded?: (narration: string, factsText: string) => void;
}

type Status = 'idle' | 'loading' | 'speaking' | 'listening' | 'thinking' | 'answering';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export const GalleryVoicePanel: React.FC<Props> = ({
  painting,
  currentLanguage,
  currentAccent,
  onSelectLanguage,
  isOpenDropdown,
  onToggleDropdown,
  onNarrationLoaded,
}) => {
  const [internalDropdownOpen, setInternalDropdownOpen] = useState(false);
  const isDropdownOpen = isOpenDropdown !== undefined ? isOpenDropdown : internalDropdownOpen;
  const toggleDropdown = onToggleDropdown || (() => setInternalDropdownOpen((prev) => !prev));
  const closeDropdown = () => {
    if (onToggleDropdown && isOpenDropdown) onToggleDropdown();
    setInternalDropdownOpen(false);
  };
  const [status, setStatus] = useState<Status>('loading');
  const [narration, setNarration] = useState('');
  const [question, setQuestion] = useState('');
  const [translatedQuestion, setTranslatedQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [showPanel, setShowPanel] = useState(true);
  const recognitionRef = useRef<any>(null);
  const uttRef = useRef<SpeechSynthesisUtterance | null>(null);

  // ── Text-to-Speech (TTS) in chosen language & accent ───────
  const speak = useCallback(
    (text: string, onDone?: () => void) => {
      window.speechSynthesis.cancel();
      if (!text || !text.trim()) return;

      const utt = new SpeechSynthesisUtterance(text);
      utt.lang = currentAccent.code;
      utt.rate = 0.92;
      utt.pitch = 1.0;
      utt.volume = 1.0;

      const norm = currentAccent.code.replace('_', '-').toLowerCase();
      const langPrefix = norm.split('-')[0];

      const applyVoiceAndSpeak = () => {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          // 1. Exact locale match (e.g. en-GB, es-ES)
          let pick = voices.find(
            (v) => v.lang.replace('_', '-').toLowerCase() === norm && v.localService,
          );
          if (!pick) {
            pick = voices.find((v) => v.lang.replace('_', '-').toLowerCase() === norm);
          }
          // 2. Language prefix match (e.g. es, fr, en)
          if (!pick) {
            pick = voices.find(
              (v) => v.lang.replace('_', '-').toLowerCase().startsWith(langPrefix) && v.localService,
            );
          }
          if (!pick) {
            pick = voices.find((v) =>
              v.lang.replace('_', '-').toLowerCase().startsWith(langPrefix),
            );
          }
          if (pick) utt.voice = pick;
        }

        utt.onstart = () => setStatus('speaking');
        utt.onend = () => {
          setStatus('idle');
          onDone?.();
        };
        utt.onerror = () => setStatus('idle');
        uttRef.current = utt;
        window.speechSynthesis.speak(utt);
      };

      if (window.speechSynthesis.getVoices().length > 0) {
        applyVoiceAndSpeak();
      } else {
        window.speechSynthesis.onvoiceschanged = applyVoiceAndSpeak;
      }
    },
    [currentAccent.code],
  );

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis.cancel();
    setStatus('idle');
  }, []);

  // ── Load Narration in chosen language on mount & change ────
  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    setQuestion('');
    setAnswer('');
    setTranslatedQuestion('');

    fetchPaintingInfo(painting.id, currentAccent.code)
      .then((res) => {
        if (cancelled) return;
        setNarration(res.narration);
        onNarrationLoaded?.(res.narration, res.facts_text);
        // Small delay so the 3D room finishes loading
        setTimeout(() => {
          if (!cancelled) speak(res.narration);
        }, 1200);
      })
      .catch(() => {
        if (cancelled) return;
        const fallback = `Welcome. Before you stands "${painting.title}" by ${painting.artist}, created in ${painting.year}. ${painting.facts_text}`;
        setNarration(fallback);
        setTimeout(() => {
          if (!cancelled) speak(fallback);
        }, 1200);
      });

    return () => {
      cancelled = true;
      window.speechSynthesis.cancel();
      if (recognitionRef.current) recognitionRef.current.abort();
    };
  }, [painting.id, currentAccent.code, speak, onNarrationLoaded]);

  // ── Voice Recognition (Audio Input) in chosen accent ──────
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
    setTranslatedQuestion('');

    const rec = new SR();
    rec.lang = currentAccent.code; // Speech recognition in the chosen language & accent!
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    recognitionRef.current = rec;

    rec.onresult = async (e: any) => {
      const q: string = e.results[0][0].transcript;
      setQuestion(q);
      setStatus('thinking');

      try {
        // Backend translates question to English -> asks Gemini -> translates answer back to chosen language
        const res = await askQuestion('painting', painting.id, q, currentAccent.code);
        setAnswer(res.answer);
        if (res.translated_question && res.translated_question.toLowerCase() !== q.toLowerCase()) {
          setTranslatedQuestion(res.translated_question);
        } else {
          setTranslatedQuestion('');
        }
        setStatus('answering');
        speak(res.answer, () => setStatus('idle'));
      } catch {
        const err = "I'm sorry, I couldn't retrieve an answer right now. Please try again.";
        setAnswer(err);
        speak(err);
      }
    };

    rec.onerror = () => setStatus('idle');
    rec.onend = () => {
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
      {/* ── Q&A Display Panel ── */}
      {showPanel && (question || answer || status === 'thinking') && (
        <div className="pointer-events-auto w-full max-w-2xl px-4 animate-fade-in">
          <div
            className="rounded-2xl p-4 flex flex-col gap-2.5"
            style={{
              background: 'rgba(8,5,3,0.95)',
              border: '1px solid rgba(212,175,55,0.22)',
              backdropFilter: 'blur(24px)',
              boxShadow: '0 8px 40px rgba(0,0,0,0.65)',
            }}
          >
            {question && (
              <div className="flex flex-col gap-1">
                <div className="flex items-start gap-3">
                  <span
                    className="text-[9px] font-semibold tracking-[0.2em] uppercase mt-1 shrink-0 px-1.5 py-0.5 rounded"
                    style={{ background: 'rgba(212,175,55,0.15)', color: '#d4af37' }}
                  >
                    You ({currentAccent.name})
                  </span>
                  <p className="text-sm text-stone-200 font-light italic">"{question}"</p>
                </div>
                {translatedQuestion && (
                  <p className="text-[11px] text-stone-500 pl-11 font-mono">
                    Translated for Gemini: "{translatedQuestion}"
                  </p>
                )}
              </div>
            )}

            {status === 'thinking' && (
              <div className="flex items-center gap-2 text-xs text-amber-400 pl-11 py-1">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                <span>Translating & consulting Gemini AI docent…</span>
              </div>
            )}

            {answer && (
              <div className="flex items-start gap-3 pt-1 border-t border-white/[0.06]">
                <span
                  className="text-[9px] font-semibold tracking-[0.2em] uppercase mt-1 shrink-0 px-1.5 py-0.5 rounded"
                  style={{ background: 'rgba(140,100,220,0.2)', color: '#c4b5fd' }}
                >
                  AI Guide
                </span>
                <p className="text-sm text-stone-100 font-light leading-relaxed">{answer}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Main Controls Bar ── */}
      <div
        className="pointer-events-auto flex items-center gap-2.5 px-4 py-2 rounded-full"
        style={{
          background: 'rgba(12, 9, 6, 0.94)',
          border: '1px solid rgba(212,175,55,0.25)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 6px 30px rgba(0,0,0,0.6)',
        }}
      >
        {/* Language & Accent Selector Button with Upward Dropdown */}
        <div className="relative">
          <button
            id="btn-language-selector"
            onClick={toggleDropdown}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
              isDropdownOpen
                ? 'text-amber-100 bg-amber-500/25 border-amber-500/50 shadow-md shadow-amber-500/10'
                : 'text-amber-200 hover:text-amber-100 bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30'
            } border`}
            title={`Language: ${currentLanguage.name} (${currentAccent.name}). Click to choose.`}
          >
            <Globe className="w-3.5 h-3.5 text-amber-400" />
            <span>{currentAccent.flag}</span>
            <span className="max-w-[110px] truncate text-[11px] font-serif">
              {currentLanguage.nativeName}
            </span>
            <span className="text-[10px] font-mono text-amber-400/80">({currentAccent.code})</span>
          </button>

          {/* Upward Dropdown Menu */}
          <LanguageDropdownUpward
            isOpen={isDropdownOpen}
            onClose={closeDropdown}
            currentLanguage={currentLanguage}
            currentAccent={currentAccent}
            onSelect={(lang, acc) => {
              onSelectLanguage(lang, acc);
              closeDropdown();
            }}
          />
        </div>

        <div className="w-px h-3.5 bg-stone-700" />

        {/* Narrate / Stop Button */}
        <button
          id="btn-narrate"
          onClick={status === 'speaking' ? stopSpeaking : () => speak(narration)}
          disabled={status === 'loading' || status === 'thinking' || status === 'listening'}
          className="flex items-center gap-1.5 text-xs font-medium transition-all disabled:opacity-30 px-2 py-1 rounded-lg hover:bg-white/[0.04]"
          style={{ color: status === 'speaking' ? '#f5c842' : '#d6d0c4' }}
          title={status === 'speaking' ? 'Stop narration' : 'Hear narration in chosen language'}
        >
          {status === 'speaking' ? (
            <>
              <VolumeX className="w-4 h-4 text-amber-400" /> Stop
            </>
          ) : status === 'loading' ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-amber-500" /> Loading…
            </>
          ) : (
            <>
              <Volume2 className="w-4 h-4 text-amber-300" /> Narrate
            </>
          )}
        </button>

        <div className="w-px h-3.5 bg-stone-700" />

        {/* Status Indicator */}
        <div className="text-[11px] min-w-[85px] text-center">
          {status === 'listening' && (
            <span className="flex items-center gap-1.5 text-red-400 justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> Listening…
            </span>
          )}
          {status === 'thinking' && (
            <span className="flex items-center gap-1.5 text-amber-400 justify-center">
              <Loader2 className="w-3 h-3 animate-spin" /> Translating…
            </span>
          )}
          {status === 'answering' && (
            <span className="flex items-center gap-1.5 text-violet-300 justify-center">
              <Volume2 className="w-3 h-3" /> Speaking…
            </span>
          )}
          {(status === 'idle' || status === 'speaking') && (
            <span className="text-stone-500 text-[10px]">Drag · Orbit</span>
          )}
        </div>

        <div className="w-px h-3.5 bg-stone-700" />

        {/* Mic / Ask Button */}
        <button
          id="btn-ask"
          onClick={status === 'listening' ? stopListening : startListening}
          disabled={status === 'loading' || status === 'thinking' || status === 'speaking'}
          className="flex items-center gap-1.5 text-xs font-medium transition-all disabled:opacity-30 px-2.5 py-1 rounded-full border"
          style={{
            color: status === 'listening' ? '#f87171' : '#fef08a',
            background: status === 'listening' ? 'rgba(239,68,68,0.15)' : 'rgba(212,175,55,0.12)',
            borderColor: status === 'listening' ? 'rgba(239,68,68,0.4)' : 'rgba(212,175,55,0.3)',
          }}
          title={`Ask question in ${currentLanguage.nativeName} (${currentAccent.name})`}
        >
          {status === 'listening' ? (
            <>
              <MicOff className="w-4 h-4 text-red-400 animate-pulse" /> Stop Mic
            </>
          ) : (
            <>
              <Mic className="w-4 h-4 text-amber-300" /> Ask AI
            </>
          )}
        </button>

        {/* Toggle Panel Visibility */}
        {(question || answer) && (
          <>
            <div className="w-px h-3.5 bg-stone-700" />
            <button
              onClick={() => setShowPanel((p) => !p)}
              className="text-stone-400 hover:text-stone-200 transition-colors p-1"
              title={showPanel ? 'Hide response panel' : 'Show response panel'}
            >
              {showPanel ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </button>
          </>
        )}
      </div>
    </div>
  );
};
