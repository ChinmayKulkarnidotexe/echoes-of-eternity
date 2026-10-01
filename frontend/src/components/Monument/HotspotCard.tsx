import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, Mic, MicOff, Send, Sparkles, Volume2, VolumeX, X } from 'lucide-react';
import type { Hotspot } from '../../types';
import { askQuestion } from '../../services/api';
import { speak, stopSpeaking } from '../../services/speech';
import { useVoiceInput } from '../../hooks/useVoiceInput';
import { hotspotIcon } from './icons';

interface Props {
  hotspot: Hotspot;
  onClose: () => void;
}

/**
 * The free-roam pop-up card: what the visitor gets for clicking a hotspot.
 *
 * It carries its own question box so a visitor can interrogate the specific
 * feature they clicked — the answer is grounded server-side in that hotspot's
 * facts via `/ask` with `context_type: "hotspot"`.
 */
export const HotspotCard: React.FC<Props> = ({ hotspot, onClose }) => {
  const Icon = hotspotIcon(hotspot.icon);
  const [speaking, setSpeaking] = useState(false);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);

  // Read the summary aloud on open — the guide "noticing" what you pointed at.
  useEffect(() => {
    setAnswer(null);
    setQuestion('');
    const handle = speak(`${hotspot.name}. ${hotspot.summary}`);
    setSpeaking(true);
    handle.done.then(() => setSpeaking(false));
    return () => {
      handle.cancel();
      setSpeaking(false);
    };
  }, [hotspot.id, hotspot.name, hotspot.summary]);

  const askingRef = useRef(false);
  const hotspotIdRef = useRef(hotspot.id);
  hotspotIdRef.current = hotspot.id;

  const sendQuestion = useCallback(async (text: string) => {
    const asked = text.trim();
    if (!asked || askingRef.current) return;
    askingRef.current = true;
    setAsking(true);
    setAnswer(null);
    try {
      const response = await askQuestion('hotspot', hotspotIdRef.current, asked);
      setAnswer(response.answer);
      const handle = speak(response.answer);
      setSpeaking(true);
      handle.done.then(() => setSpeaking(false));
    } finally {
      askingRef.current = false;
      setAsking(false);
    }
  }, []);

  const voice = useVoiceInput(
    useCallback(
      (transcript: string) => {
        setQuestion(transcript);
        sendQuestion(transcript);
      },
      [sendQuestion],
    ),
  );

  const toggleAudio = () => {
    if (speaking) {
      stopSpeaking();
      setSpeaking(false);
      return;
    }
    const handle = speak(answer ?? `${hotspot.name}. ${hotspot.facts}`);
    setSpeaking(true);
    handle.done.then(() => setSpeaking(false));
  };

  return (
    <div
      className="hotspot-card absolute z-40 flex flex-col gap-3 rounded-2xl p-5"
      style={{
        background: 'rgba(14,11,7,0.94)',
        border: '1px solid rgba(212,175,55,0.28)',
        backdropFilter: 'blur(22px)',
        boxShadow: '0 28px 70px rgba(0,0,0,0.65)',
      }}
      role="dialog"
      aria-label={hotspot.name}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span
            className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0 text-amber-300/90"
            style={{
              background: 'rgba(212,175,55,0.13)',
              border: '1px solid rgba(212,175,55,0.3)',
            }}
            aria-hidden="true"
          >
            <Icon className="w-4 h-4" strokeWidth={1.5} />
          </span>
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] uppercase tracking-[0.22em] text-amber-500/70">
              {hotspot.category}
            </span>
            <h3
              className="font-display text-amber-100"
              style={{ fontSize: '1.3rem', fontWeight: 400, lineHeight: 1.15 }}
            >
              {hotspot.name}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={toggleAudio}
            className="p-2 rounded-lg text-stone-400 hover:text-amber-200 hover:bg-white/5 transition-colors"
            title={speaking ? 'Stop narration' : 'Read aloud'}
          >
            {speaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-stone-400 hover:text-amber-200 hover:bg-white/5 transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="h-px bg-gradient-to-r from-amber-500/25 via-amber-500/10 to-transparent" />

      {/* Facts */}
      <p className="text-[13px] text-stone-300 font-light leading-relaxed">{hotspot.facts}</p>

      {/* Ask about this specific feature */}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          sendQuestion(question);
        }}
        className="flex items-center gap-2 pt-1"
      >
        <div className="relative flex-1">
          <input
            type="text"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder={
              voice.listening ? 'Listening…' : `Ask about the ${hotspot.label.toLowerCase()}…`
            }
            className="w-full rounded-xl pl-3 pr-9 py-2.5 text-xs text-stone-100 placeholder-stone-600 focus:outline-none transition-colors"
            style={{
              background: 'rgba(0,0,0,0.45)',
              border: `1px solid ${
                voice.listening ? 'rgba(244,113,133,0.5)' : 'rgba(212,175,55,0.18)'
              }`,
            }}
          />
          <button
            type="button"
            onClick={voice.toggle}
            disabled={voice.state === 'unsupported'}
            className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-all ${
              voice.listening
                ? 'bg-rose-600/80 text-white mic-pulse'
                : 'text-stone-500 hover:text-amber-200 disabled:opacity-30'
            }`}
            title={
              voice.state === 'unsupported'
                ? 'Speech recognition is not available in this browser'
                : voice.listening
                  ? 'Listening — click to stop'
                  : 'Ask with your voice'
            }
          >
            {voice.listening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
          </button>
        </div>
        <button
          type="submit"
          disabled={!question.trim() || asking}
          className="px-3.5 py-2.5 rounded-xl text-xs font-medium text-amber-950 disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0"
          style={{ background: 'linear-gradient(135deg, #e8c35a, #c9a84c)' }}
        >
          {asking ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Send className="w-3.5 h-3.5" />
          )}
        </button>
      </form>

      {voice.message && (
        <button
          onClick={voice.dismiss}
          className="text-[11px] text-rose-300/80 leading-relaxed text-left"
        >
          {voice.message}
        </button>
      )}

      {answer && (
        <div
          className="rounded-xl p-3.5 flex flex-col gap-1.5 animate-fade-in"
          style={{
            background: 'rgba(212,175,55,0.07)',
            border: '1px solid rgba(212,175,55,0.18)',
          }}
        >
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-400/80 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3" />
            Your guide
          </span>
          <p className="text-xs text-stone-200 leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  );
};
