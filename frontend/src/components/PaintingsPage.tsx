import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import type { Painting } from '../types';
import { fetchPaintings } from '../services/api';
import { PaintingViewer } from './Gallery/PaintingViewer';

interface Props {
  onBack: () => void;
}

export const PaintingsPage: React.FC<Props> = ({ onBack }) => {
  const [paintings, setPaintings] = useState<Painting[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  useEffect(() => {
    fetchPaintings().then(setPaintings);
  }, []);

  // ── Full-screen 3D Grand Gallery Room ────────────────────────
  if (selectedIndex !== null && paintings.length > 0) {
    return (
      <div className="fixed inset-0 z-[200] bg-[#04050a]">
        <PaintingViewer
          paintings={paintings}
          initialIndex={selectedIndex}
          onClose={() => setSelectedIndex(null)}
        />
      </div>
    );
  }

  // ── Paintings grid ─────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#080a0f] flex flex-col">
      {/* Header */}
      <header
        className="sticky top-0 z-50 flex items-center justify-between px-6 py-5 border-b border-white/[0.06]"
        style={{ background: 'rgba(8,10,15,0.92)', backdropFilter: 'blur(24px)' }}
      >
        <button
          id="back-from-paintings"
          onClick={onBack}
          className="flex items-center gap-2 text-stone-400 hover:text-violet-300 transition-colors text-sm font-light"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <div className="flex flex-col items-center">
          <h1 className="font-display text-gold-shimmer text-2xl" style={{ fontWeight: 300 }}>
            Echoes of Eternity
          </h1>
          <p className="text-[10px] text-stone-500 tracking-[0.25em] uppercase mt-0.5">Masterpiece Gallery</p>
        </div>

        <div className="w-16" />
      </header>

      {/* Main */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-5 py-12">
        {/* Heading */}
        <div className="animate-fade-up text-center mb-10 flex flex-col items-center gap-3">
          <h2
            className="font-display text-stone-100"
            style={{ fontSize: 'clamp(1.8rem, 5vw, 3rem)', fontWeight: 300 }}
          >
            Curated Masterpieces
          </h2>
          <div className="w-16 h-px bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />
          <p className="text-sm text-stone-400 font-light max-w-lg">
            Step inside our 3D Grand Gallery hall with high-ceiling skylights, dedicated exhibition bays, and 3D museum stands.
          </p>

          {/* Quick Enter 3D Room CTA */}
          {paintings.length > 0 && (
            <button
              id="enter-3d-gallery-btn"
              onClick={() => setSelectedIndex(0)}
              className="mt-3 flex items-center gap-2.5 px-6 py-3 rounded-full text-sm font-medium text-amber-100 transition-all hover:scale-105 active:scale-98 shadow-xl"
              style={{
                background: 'linear-gradient(135deg, rgba(212,175,55,0.3) 0%, rgba(180,120,40,0.2) 100%)',
                border: '1px solid rgba(212,175,55,0.45)',
                boxShadow: '0 0 25px rgba(212,175,55,0.18)',
              }}
            >
              <span className="text-base">🏛️</span>
              <span>Enter 3D Grand Gallery Tour</span>
              <span className="text-xs text-amber-300 font-mono ml-1 px-2 py-0.5 rounded-full bg-black/40 border border-amber-500/20">
                3D Exhibition Hall
              </span>
            </button>
          )}
        </div>

        {/* Grid */}
        {paintings.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-stone-600 font-light">
            Loading masterpieces…
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 animate-fade-in">
            {paintings.map((painting, i) => (
              <button
                key={painting.id}
                id={`painting-card-${painting.id}`}
                onClick={() => setSelectedIndex(i)}
                className="painting-card group relative rounded-2xl overflow-hidden cursor-pointer text-left"
                style={{
                  aspectRatio: '3/4',
                  animationDelay: `${i * 0.07}s`,
                  border: '1px solid rgba(255,255,255,0.07)',
                }}
              >
                {/* Painting image */}
                <img
                  src={painting.image_path}
                  alt={painting.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />

                {/* Persistent dark bottom fade */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

                {/* Hover overlay — title + artist slide up */}
                <div className="overlay absolute inset-x-0 bottom-0 p-5 flex flex-col gap-1 pointer-events-none">
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.65) 60%, transparent 100%)',
                    }}
                  />
                  <div className="relative z-10 flex flex-col gap-1.5">
                    <p
                      className="font-display text-white"
                      style={{ fontSize: '1.1rem', fontWeight: 400, lineHeight: 1.2 }}
                    >
                      {painting.title}
                    </p>
                    <p className="text-xs text-violet-300 font-light">
                      by {painting.artist}
                      <span className="text-stone-500 ml-1.5">· {painting.year}</span>
                    </p>
                    <div
                      className="flex items-center gap-1.5 mt-1 text-[10px] text-stone-400"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400/70 inline-block" />
                      Enter gallery room
                    </div>
                  </div>
                </div>

                {/* Hover border glow */}
                <div
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{ boxShadow: 'inset 0 0 0 1.5px rgba(140,100,220,0.5)' }}
                />
              </button>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center text-[11px] text-stone-700 py-6 tracking-widest uppercase">
        Echoes of Eternity · ACM × MLH Hack Days 2026
      </footer>
    </div>
  );
};
