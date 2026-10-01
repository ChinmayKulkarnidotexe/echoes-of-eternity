import React, { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, Loader2, X, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import type { AccentOption, LanguageOption, Painting } from '../../types';
import { askQuestion } from '../../services/api';
import { DEFAULT_ACCENT, DEFAULT_LANGUAGE } from '../../data/languages';

interface Props {
  painting: Painting;
  /**
   * The language and regional accent chosen in the viewer.
   *
   * All three legs of the conversation follow this: the question is sent with
   * `target_lang` so the backend translates it into English for grounding and
   * the answer back out again, the microphone listens in the chosen locale, and
   * the answer is spoken by a voice matching that accent. Without it the picker
   * only relabelled the plaque in the room.
   */
  language?: LanguageOption;
  accent?: AccentOption;
}

/** Best available voice for a locale, falling back to the base language. */
function pickVoiceForLocale(localeCode: string): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis?.getVoices() ?? [];
  if (!voices.length) return null;
  const exact = voices.find((v) => v.lang.toLowerCase() === localeCode.toLowerCase());
  if (exact) return exact;
  const base = localeCode.split('-')[0].toLowerCase();
  return voices.find((v) => v.lang.toLowerCase().startsWith(base)) ?? null;
}

const SUGGESTIONS: Record<string, string[]> = {
  starry: [
    'What do the sky swirls symbolize?',
    'What was Van Gogh’s mental state while painting this?',
    'Why is the cypress tree in the foreground?',
  ],
  mona: [
    'Why does her enigmatic smile shift?',
    'Who was the real Mona Lisa?',
    'What is Leonardo’s sfumato technique?',
  ],
  wave: [
    'What boats are battling the rogue wave?',
    'Why is Mount Fuji depicted so small?',
    'What made the Prussian blue pigment revolutionary?',
  ],
  pearl: [
    'Is the famous pearl earring actually real?',
    'What is a Dutch golden age "tronie"?',
    'Which rare mineral was used for her blue turban?',
  ],
};

function getSuggestions(painting: Painting): string[] {
  const t = (painting.title || '').toLowerCase();
  if (t.includes('starry') || painting.id === 1) return SUGGESTIONS.starry;
  if (t.includes('mona') || t.includes('gioconda') || painting.id === 2) return SUGGESTIONS.mona;
  if (t.includes('wave') || t.includes('kanagawa') || painting.id === 3) return SUGGESTIONS.wave;
  if (t.includes('pearl') || t.includes('earring') || painting.id === 4) return SUGGESTIONS.pearl;
  return ['What is the historical significance?', 'Tell me an interesting detail about this work'];
}

export const PaintingAskBar: React.FC<Props> = ({
  painting,
  language = DEFAULT_LANGUAGE,
  accent = DEFAULT_ACCENT,
}) => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastQ, setLastQ] = useState('');
  const [answer, setAnswer] = useState('');
  const [showAnswer, setShowAnswer] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const recognitionRef = useRef<any>(null);
  const suggestions = getSuggestions(painting);

  // Reset answer when active painting changes
  useEffect(() => {
    setShowAnswer(false);
    setLastQ('');
    setAnswer('');
    setInput('');
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  }, [painting.id]);

  const handleSend = async (questionText?: string) => {
    const q = (questionText || input).trim();
    if (!q || loading) return;

    setInput('');
    setLastQ(q);
    setLoading(true);
    setShowAnswer(true);
    setAnswer('');
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);

    try {
      const res = await askQuestion('painting', painting.id, q, language.id);
      setAnswer(res.answer);
    } catch {
      setAnswer('Could not retrieve an answer at this moment. Please try asking again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleSpeech = () => {
    if (!answer) return;
    if (isSpeaking) {
      window.speechSynthesis?.cancel();
      setIsSpeaking(false);
      return;
    }
    window.speechSynthesis?.cancel();
    const utt = new SpeechSynthesisUtterance(answer);
    utt.rate = 0.95;
    utt.pitch = 1.0;
    // Speak the answer in the chosen language and regional accent.
    utt.lang = accent.code;
    const voice = pickVoiceForLocale(accent.code);
    if (voice) utt.voice = voice;
    utt.onend = () => setIsSpeaking(false);
    utt.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis?.speak(utt);
  };

  const toggleMic = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.abort();
      setIsListening(false);
      return;
    }

    const rec = new SR();
    // Listen in the visitor's own language and accent, not always US English.
    rec.lang = accent.code;
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    recognitionRef.current = rec;

    setIsListening(true);
    rec.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setIsListening(false);
      handleSend(transcript);
    };
    rec.onerror = () => setIsListening(false);
    rec.onend = () => setIsListening(false);
    rec.start();
  };

  return (
    <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-30 w-full max-w-xl px-4 flex flex-col items-center gap-2 pointer-events-none">
      {/* ── Answer Bubble (when open) ─────────────────────────── */}
      {showAnswer && (
        <div
          className="pointer-events-auto w-full rounded-2xl p-4 flex flex-col gap-2.5 animate-fade-in shadow-2xl transition-all"
          style={{
            background: 'rgba(14,11,9,0.95)',
            border: '1px solid rgba(212,175,55,0.3)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 12px 40px rgba(0,0,0,0.7), 0 0 25px rgba(212,175,55,0.12)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[11px] font-mono uppercase tracking-wider text-amber-300">
                Curator Insight
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {answer && (
                <button
                  onClick={toggleSpeech}
                  className="p-1 rounded-full text-stone-400 hover:text-amber-300 transition-colors"
                  title={isSpeaking ? 'Stop Audio' : 'Listen to Answer'}
                >
                  {isSpeaking ? (
                    <VolumeX className="w-3.5 h-3.5 text-amber-400" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5" />
                  )}
                </button>
              )}
              <button
                onClick={() => {
                  setShowAnswer(false);
                  window.speechSynthesis?.cancel();
                  setIsSpeaking(false);
                }}
                className="p-1 rounded-full text-stone-400 hover:text-white transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* User Question */}
          {lastQ && (
            <p className="text-xs text-stone-400 italic">
              "{lastQ}"
            </p>
          )}

          {/* Answer Body */}
          {loading ? (
            <div className="flex items-center gap-2 py-2 text-xs text-amber-300/80">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
              <span>Analyzing masterpiece archives…</span>
            </div>
          ) : (
            <p className="text-xs text-stone-200 font-light leading-relaxed max-h-40 overflow-y-auto pr-1">
              {answer}
            </p>
          )}
        </div>
      )}

      {/* ── Suggested Questions Chips ─────────────────────────── */}
      {!showAnswer && (
        <div className="pointer-events-auto flex items-center justify-center gap-1.5 flex-wrap max-w-full">
          {suggestions.slice(0, 2).map((sugg, i) => (
            <button
              key={i}
              onClick={() => handleSend(sugg)}
              className="text-[11px] text-stone-300 hover:text-amber-200 px-3 py-1 rounded-full transition-all border border-white/10 hover:border-amber-500/40"
              style={{
                background: 'rgba(18,14,10,0.85)',
                backdropFilter: 'blur(12px)',
              }}
            >
              ✦ {sugg}
            </button>
          ))}
        </div>
      )}

      {/* ── The Ask Input Bar ─────────────────────────────────── */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="pointer-events-auto w-full flex items-center gap-2 px-3 py-1.5 rounded-full shadow-2xl transition-all"
        style={{
          background: 'rgba(16,13,10,0.92)',
          border: '1px solid rgba(212,175,55,0.35)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 8px 30px rgba(0,0,0,0.6), 0 0 20px rgba(212,175,55,0.08)',
        }}
      >
        <Sparkles className="w-4 h-4 text-amber-400/80 ml-1.5 shrink-0" />

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Ask about ${painting.title}…`}
          className="flex-1 bg-transparent text-xs text-stone-100 placeholder-stone-500 focus:outline-none py-1.5 font-light"
        />

        {/* Mic Speech-to-Text Button */}
        <button
          type="button"
          onClick={toggleMic}
          className={`p-1.5 rounded-full transition-all ${
            isListening
              ? 'bg-red-500/30 text-red-300 animate-pulse'
              : 'text-stone-400 hover:text-amber-300'
          }`}
          title={isListening ? 'Listening…' : 'Ask by voice'}
        >
          {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
        </button>

        {/* Send Button */}
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="p-1.5 rounded-full bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 disabled:opacity-40 disabled:hover:bg-amber-500/20 transition-all border border-amber-500/30"
          title="Send Question"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
