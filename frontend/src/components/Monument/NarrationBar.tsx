import React, { useEffect, useRef, useState } from 'react';
import { ChevronsRight, Pause, Play, SkipForward, Volume2, VolumeX } from 'lucide-react';

interface Props {
  eyebrow: string;
  title: string;
  text: string;
  /** 0–1 through the current narration leg, for the thin progress rule. */
  progress: number;
  /** Which stop of how many — omitted in free roam. */
  step?: { current: number; total: number };
  speaking: boolean;
  paused: boolean;
  muted: boolean;
  onTogglePause: () => void;
  onToggleMute: () => void;
  onSkip?: () => void;
  skipLabel?: string;
  /** An optional second way out, for skipping more than one stage ahead. */
  onSecondarySkip?: () => void;
  secondarySkipLabel?: string;
}

/**
 * The caption rail along the bottom of the immersive view.
 *
 * Text types in rather than appearing all at once, pinned to the narration's
 * own progress, so the caption and the voice stay in step and the visitor's eye
 * is drawn down only as something new is said.
 */
export const NarrationBar: React.FC<Props> = ({
  eyebrow,
  title,
  text,
  progress,
  step,
  speaking,
  paused,
  muted,
  onTogglePause,
  onToggleMute,
  onSkip,
  skipLabel = 'Skip ahead',
  onSecondarySkip,
  secondarySkipLabel = 'Skip ahead',
}) => {
  const [revealed, setRevealed] = useState(0);
  const textRef = useRef(text);

  // Reset the type-on whenever the line changes.
  useEffect(() => {
    textRef.current = text;
    setRevealed(0);
  }, [text]);

  const voicePaced = speaking && !muted;

  // Voice-paced: follow the narration's own progress. This deliberately sets
  // state straight from the effect rather than through a timer — `progress`
  // ticks every animation frame, so any debounce here gets cleared by the next
  // tick before it can ever fire, and the caption stays empty. `progress` is
  // frozen while paused, so the caption stops with the voice.
  useEffect(() => {
    if (!voicePaced || paused) return;
    const wanted = Math.round(text.length * Math.min(1, progress * 1.08));
    setRevealed((current) => Math.max(current, wanted));
  }, [progress, voicePaced, paused, text]);

  // No voice to follow (muted, or speech unsupported): type at reading speed,
  // and stop typing while the tour is held.
  useEffect(() => {
    if (voicePaced || paused || revealed >= text.length) return;
    const handle = window.setTimeout(
      () => setRevealed((n) => Math.min(text.length, n + 2)),
      18,
    );
    return () => window.clearTimeout(handle);
  }, [revealed, text, voicePaced, paused]);

  return (
    <div className="absolute bottom-0 left-0 right-0 z-30 pointer-events-none">
      {/* Readability scrim behind the caption */}
      <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-[#05070c] via-[#05070c]/80 to-transparent" />

      <div className="relative max-w-5xl mx-auto px-5 pb-6 pt-10 flex flex-col gap-3">
        {/* Progress rule */}
        <div className="h-px w-full bg-white/[0.07] overflow-hidden rounded-full">
          <div
            className="h-full transition-[width] duration-300 ease-linear"
            style={{
              width: `${Math.min(100, Math.max(0, progress * 100))}%`,
              background: 'linear-gradient(90deg, rgba(212,175,55,0.3), #e8c35a)',
            }}
          />
        </div>

        <div className="flex items-end justify-between gap-6">
          <div className="flex flex-col gap-1.5 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-[10px] uppercase tracking-[0.26em] text-amber-500/75">
                {eyebrow}
              </span>
              {step && (
                <span className="text-[10px] text-stone-600 font-mono tracking-wider">
                  {String(step.current).padStart(2, '0')} / {String(step.total).padStart(2, '0')}
                </span>
              )}
              {speaking && !paused && (
                <span className="voice-wave" aria-label="Guide is speaking">
                  <i />
                  <i />
                  <i />
                  <i />
                </span>
              )}
            </div>

            <h2
              className="font-display text-amber-100 truncate"
              style={{ fontSize: 'clamp(1.25rem, 3vw, 1.9rem)', fontWeight: 300, lineHeight: 1.15 }}
            >
              {title}
            </h2>

            <p
              className="text-[13px] sm:text-sm text-stone-300/90 font-light leading-relaxed max-w-3xl"
              style={{ minHeight: '3.4em' }}
            >
              {text.slice(0, revealed)}
              {revealed < text.length && <span className="caret" aria-hidden="true" />}
            </p>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 pointer-events-auto shrink-0 pb-1">
            <button
              onClick={onToggleMute}
              className="p-2.5 rounded-xl text-stone-400 hover:text-amber-200 transition-colors"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
              title={muted ? 'Unmute the guide' : 'Mute the guide'}
            >
              {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <button
              onClick={onTogglePause}
              className="p-2.5 rounded-xl text-amber-950 transition-transform hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #e8c35a, #c9a84c)' }}
              title={paused ? 'Resume the tour' : 'Pause the tour'}
            >
              {paused ? (
                <Play className="w-4 h-4 fill-current" />
              ) : (
                <Pause className="w-4 h-4 fill-current" />
              )}
            </button>

            {onSkip && (
              <button
                onClick={onSkip}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-light text-stone-300 hover:text-amber-200 transition-colors whitespace-nowrap"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <span>{skipLabel}</span>
                <ChevronsRight className="w-3.5 h-3.5" />
              </button>
            )}

            {onSecondarySkip && (
              <button
                onClick={onSecondarySkip}
                className="hidden sm:flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-light text-stone-500 hover:text-amber-200 transition-colors whitespace-nowrap"
                style={{ border: '1px solid rgba(255,255,255,0.06)' }}
                title="Skip the guided walk and explore on your own"
              >
                <span>{secondarySkipLabel}</span>
                <SkipForward className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
