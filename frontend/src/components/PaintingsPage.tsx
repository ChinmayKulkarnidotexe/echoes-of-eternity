import React, { useState, useEffect } from 'react';
import { ArrowLeft, X } from 'lucide-react';
import type { Painting } from '../types';
import { fetchPaintings } from '../services/api';
import { PaintingViewer } from './Gallery/PaintingViewer';
import { GuidePanel } from './AIGuide/GuidePanel';
import { fetchPaintingInfo } from '../services/api';

interface Props {
  onBack: () => void;
}

export const PaintingsPage: React.FC<Props> = ({ onBack }) => {
  const [paintings, setPaintings] = useState<Painting[]>([]);
  const [selectedPainting, setSelectedPainting] = useState<Painting | null>(null);
  const [paintingNarration, setPaintingNarration] = useState('');

  useEffect(() => {
    fetchPaintings().then(setPaintings);
  }, []);

  const handleSelectPainting = async (p: Painting) => {
    setSelectedPainting(p);
    const res = await fetchPaintingInfo(p.id);
    setPaintingNarration(res.narration);
  };

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

      {/* 3D viewer modal overlay */}
      {selectedPainting && (
        <div
          className="fixed inset-0 z-[100] flex items-start justify-center pt-6 pb-6 px-4 overflow-y-auto"
          style={{ background: 'rgba(4,5,8,0.95)', backdropFilter: 'blur(16px)' }}
        >
          {/* Close button */}
          <button
            id="close-painting-viewer"
            onClick={() => setSelectedPainting(null)}
            className="fixed top-5 right-5 z-[110] flex items-center gap-1.5 text-xs text-stone-400 hover:text-white transition-colors px-3 py-2 rounded-full"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <X className="w-4 h-4" />
            Close
          </button>

          <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-6 items-start mt-10">
            <div className="lg:col-span-8">
              <PaintingViewer painting={selectedPainting} onClose={() => setSelectedPainting(null)} />
            </div>
            <div className="lg:col-span-4">
              <GuidePanel
                contextType="painting"
                contextId={selectedPainting.id}
                title={`${selectedPainting.title} (${selectedPainting.artist})`}
                narration={paintingNarration}
                factsText={selectedPainting.facts_text}
                autoPlayAudio={false}
              />
            </div>
          </div>
        </div>
      )}

      {/* Main */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-5 py-12">
        {/* Heading */}
        <div className="animate-fade-up text-center mb-12 flex flex-col items-center gap-3">
          <h2 className="font-display text-stone-100" style={{ fontSize: 'clamp(1.8rem, 5vw, 3rem)', fontWeight: 300 }}>
            Curated Masterpieces
          </h2>
          <div className="w-16 h-px bg-gradient-to-r from-transparent via-violet-400/50 to-transparent" />
          <p className="text-sm text-stone-500 font-light">
            Hover to reveal the artwork · Click to enter the 3D inspection viewer
          </p>
        </div>

        {/* Paintings grid */}
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
                onClick={() => handleSelectPainting(painting)}
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
                  {/* Blur glass pill */}
                  <div
                    className="absolute inset-0"
                    style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.6) 60%, transparent 100%)' }}
                  />
                  <div className="relative z-10 flex flex-col gap-1">
                    <p className="font-display text-white" style={{ fontSize: '1.1rem', fontWeight: 400, lineHeight: 1.2 }}>
                      {painting.title}
                    </p>
                    <p className="text-xs text-violet-300 font-light">
                      by {painting.artist}
                      <span className="text-stone-500 ml-1.5">· {painting.year}</span>
                    </p>
                  </div>
                </div>

                {/* Hover border glow */}
                <div
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{ boxShadow: 'inset 0 0 0 1.5px rgba(140,100,220,0.45)' }}
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
