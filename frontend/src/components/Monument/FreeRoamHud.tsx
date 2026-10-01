import React, { useCallback, useRef, useState } from 'react';
import {
  Loader2,
  MapPin,
  Mic,
  MicOff,
  RotateCcw,
  Send,
  Sparkles,
  Volume2,
  VolumeX,
} from 'lucide-react';
import type { Hotspot, RoamPano } from '../../types';
import { askQuestion } from '../../services/api';
import { speak, stopSpeaking } from '../../services/speech';
import { useVoiceInput } from '../../hooks/useVoiceInput';
import { hotspotIcon } from './icons';

interface Props {
  monumentName: string;
  hotspots: Hotspot[];
  panos: RoamPano[];
  currentPanoId: string | null;
  activeHotspotId: string | null;
  muted: boolean;
  onToggleMute: () => void;
  onSelectHotspot: (hotspot: Hotspot) => void;
  onJumpToPano: (panoId: string, heading: number) => void;
  onReplayTour: () => void;
}

/**
 * Free-roam controls: the hotspot index, the vantage-point rail, and an ask box.
 *
 * The vantage rail only ever jumps between the eleven panoramas the tour already
 * verified, so a visitor cannot wander into a dead pano — and because the walk
 * has already loaded them, moving along the rail costs nothing new.
 */
export const FreeRoamHud: React.FC<Props> = ({
  monumentName,
  hotspots,
  panos,
  currentPanoId,
  activeHotspotId,
  muted,
  onToggleMute,
  onSelectHotspot,
  onJumpToPano,
  onReplayTour,
}) => {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);

  const askingRef = useRef(false);
  const mutedRef = useRef(muted);
  mutedRef.current = muted;

  const send = useCallback(async (text: string) => {
    const asked = text.trim();
    if (!asked || askingRef.current) return;
    askingRef.current = true;
    setAsking(true);
    setAnswer(null);
    try {
      const response = await askQuestion('monument', 1, asked);
      setAnswer(response.answer);
      if (!mutedRef.current) speak(response.answer);
      setQuestion('');
    } finally {
      askingRef.current = false;
      setAsking(false);
    }
  }, []);

  const voice = useVoiceInput(
    useCallback(
      (transcript: string) => {
        setQuestion(transcript);
        send(transcript);
      },
      [send],
    ),
  );

  return (
    <>
      {/* -------------------------------------------- Hotspot index (left rail) */}
      <aside className="absolute left-5 top-24 bottom-32 z-30 hidden lg:flex flex-col gap-2 w-56 pointer-events-none">
        <div className="flex items-center justify-between pointer-events-auto">
          <span className="text-[10px] uppercase tracking-[0.22em] text-amber-500/70">
            Points of interest
          </span>
          <button
            onClick={() => {
              if (!muted) stopSpeaking();
              onToggleMute();
            }}
            className="p-1.5 rounded-lg text-stone-500 hover:text-amber-200 transition-colors"
            title={muted ? 'Unmute the guide' : 'Mute the guide'}
          >
            {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
        </div>

        <div className="flex flex-col gap-1.5 overflow-y-auto pointer-events-auto pr-1 thin-scroll">
          {hotspots.map((hotspot) => {
            const isActive = hotspot.id === activeHotspotId;
            const Icon = hotspotIcon(hotspot.icon);
            return (
              <button
                key={hotspot.id}
                onClick={() => onSelectHotspot(hotspot)}
                className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all"
                style={{
                  background: isActive ? 'rgba(212,175,55,0.14)' : 'rgba(10,8,5,0.66)',
                  border: `1px solid ${isActive ? 'rgba(212,175,55,0.36)' : 'rgba(255,255,255,0.06)'}`,
                  backdropFilter: 'blur(14px)',
                }}
                title={`Look at ${hotspot.name}`}
              >
                <Icon
                  className="w-3.5 h-3.5 shrink-0 transition-colors"
                  strokeWidth={1.5}
                  style={{ color: isActive ? '#f0d894' : '#8c8375' }}
                  aria-hidden="true"
                />
                <span className="flex flex-col gap-0.5 min-w-0">
                  <span
                    className="text-[11px] font-medium truncate transition-colors"
                    style={{ color: isActive ? '#f0d894' : '#cfc4ad', lineHeight: 1.25 }}
                  >
                    {hotspot.label}
                  </span>
                  <span
                    className="text-[9px] truncate uppercase tracking-[0.12em]"
                    style={{ color: '#6b6457', lineHeight: 1.35 }}
                  >
                    {hotspot.category}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <button
          onClick={onReplayTour}
          className="pointer-events-auto flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-[11px] font-light text-stone-400 hover:text-amber-200 transition-colors mt-1"
          style={{
            background: 'rgba(10,8,5,0.66)',
            border: '1px solid rgba(255,255,255,0.06)',
            backdropFilter: 'blur(14px)',
          }}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Replay guided walk</span>
        </button>
      </aside>

      {/* ------------------------------------------------- Ask bar + vantage rail */}
      <div className="absolute bottom-0 left-0 right-0 z-30 pointer-events-none">
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#05070c] via-[#05070c]/70 to-transparent" />

        <div className="relative max-w-4xl mx-auto px-5 pb-6 pt-8 flex flex-col gap-3 pointer-events-auto">
          {answer && (
            <div
              className="rounded-2xl p-4 flex flex-col gap-1.5 animate-fade-in"
              style={{
                background: 'rgba(14,11,7,0.92)',
                border: '1px solid rgba(212,175,55,0.2)',
                backdropFilter: 'blur(20px)',
              }}
            >
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-400/80 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" />
                Your guide
              </span>
              <p className="text-[13px] text-stone-200 leading-relaxed">{answer}</p>
            </div>
          )}

          {/* Vantage points — the eleven verified panoramas from the walk */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 thin-scroll">
            <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-stone-600 shrink-0 pr-1">
              <MapPin className="w-3 h-3" />
              Vantage
            </span>
            {panos.map((pano, index) => {
              const isHere = pano.pano_id === currentPanoId;
              return (
                <button
                  key={pano.pano_id}
                  onClick={() => onJumpToPano(pano.pano_id, pano.heading_to_statue)}
                  className="shrink-0 flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[10px] transition-all whitespace-nowrap"
                  style={{
                    background: isHere ? 'rgba(212,175,55,0.16)' : 'rgba(10,8,5,0.7)',
                    border: `1px solid ${isHere ? 'rgba(212,175,55,0.4)' : 'rgba(255,255,255,0.06)'}`,
                    color: isHere ? '#f0d894' : '#9d9383',
                    backdropFilter: 'blur(14px)',
                  }}
                  title={pano.label}
                >
                  <span className="font-mono opacity-60">{String(index + 1).padStart(2, '0')}</span>
                  <span>{pano.label}</span>
                </button>
              );
            })}
          </div>

          {/* Ask anything about the monument */}
          <form
            onSubmit={(event) => {
              event.preventDefault();
              send(question);
            }}
            className="flex items-center gap-2"
          >
            <div className="relative flex-1">
              <input
                type="text"
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder={
                  voice.listening
                    ? 'Listening…'
                    : `Ask your guide anything about the ${monumentName}…`
                }
                className="w-full rounded-2xl pl-4 pr-10 py-3 text-xs sm:text-sm text-stone-100 placeholder-stone-600 focus:outline-none transition-colors"
                style={{
                  background: 'rgba(10,8,5,0.84)',
                  border: `1px solid ${
                    voice.listening ? 'rgba(244,113,133,0.5)' : 'rgba(212,175,55,0.18)'
                  }`,
                  backdropFilter: 'blur(20px)',
                }}
              />
              <button
                type="button"
                onClick={voice.toggle}
                disabled={voice.state === 'unsupported'}
                className={`absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-all ${
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
                {voice.listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            </div>
            <button
              type="submit"
              disabled={!question.trim() || asking}
              className="px-4 py-3 rounded-2xl text-xs font-medium text-amber-950 disabled:opacity-40 disabled:cursor-not-allowed transition-transform hover:scale-[1.03] shrink-0"
              style={{ background: 'linear-gradient(135deg, #f0d894, #c9a84c)' }}
            >
              {asking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </form>

          {/* Voice input never fails silently — say what went wrong. */}
          {voice.message ? (
            <button
              onClick={voice.dismiss}
              className="text-[11px] text-rose-300/80 text-center leading-relaxed px-2"
            >
              {voice.message}
            </button>
          ) : (
            <p className="text-[10px] text-stone-700 text-center tracking-wide">
              Drag to look around · click the ground arrows to walk · Imagery © Google
            </p>
          )}
        </div>
      </div>
    </>
  );
};
