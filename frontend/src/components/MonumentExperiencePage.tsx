import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import type { POI } from '../types';
import { fetchMonumentPois, fetchNarration } from '../services/api';
import { StreetViewPanel } from './StreetView/StreetViewPanel';
import { GuidePanel } from './AIGuide/GuidePanel';
import type { MonumentData } from './MonumentsPage';

interface Props {
  monument: MonumentData;
  onBack: () => void;
}

export const MonumentExperiencePage: React.FC<Props> = ({ monument, onBack }) => {
  const [pois, setPois] = useState<POI[]>([]);
  const [currentPoiIndex, setCurrentPoiIndex] = useState(0);
  const [isTourPlaying, setIsTourPlaying] = useState(false);
  const [poiNarration, setPoiNarration] = useState('');

  useEffect(() => {
    fetchMonumentPois(monument.id).then((data) => {
      setPois(data);
      if (data.length > 0) {
        loadPoiNarration(data[0].id);
      }
    });
  }, [monument.id]);

  const loadPoiNarration = async (poiId: number) => {
    const res = await fetchNarration(poiId);
    setPoiNarration(res.narration);
  };

  const handleSelectPoi = (index: number) => {
    setCurrentPoiIndex(index);
    if (pois[index]) loadPoiNarration(pois[index].id);
  };

  // Auto-advance tour
  useEffect(() => {
    if (!isTourPlaying || pois.length === 0) return;
    const timer = setInterval(() => {
      setCurrentPoiIndex((prev) => {
        const next = (prev + 1) % pois.length;
        loadPoiNarration(pois[next].id);
        return next;
      });
    }, 12000);
    return () => clearInterval(timer);
  }, [isTourPlaying, pois]);

  const activePoi = pois[currentPoiIndex] || pois[0];

  return (
    <div className="min-h-screen bg-[#080a0f] flex flex-col">
      {/* Header */}
      <header
        className="sticky top-0 z-50 flex items-center justify-between px-6 py-5 border-b border-white/[0.06]"
        style={{ background: 'rgba(8,10,15,0.92)', backdropFilter: 'blur(24px)' }}
      >
        <button
          id="back-from-experience"
          onClick={onBack}
          className="flex items-center gap-2 text-stone-400 hover:text-amber-300 transition-colors text-sm font-light"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Monuments</span>
        </button>

        <div className="flex flex-col items-center">
          <h1 className="font-display text-gold-shimmer text-2xl" style={{ fontWeight: 300 }}>
            {monument.name}
          </h1>
          <p className="text-[10px] text-stone-500 tracking-[0.2em] uppercase mt-0.5">
            {monument.location}
          </p>
        </div>

        <div className="text-xs text-stone-500 font-light">
          {pois.length > 0 && (
            <span>{currentPoiIndex + 1} / {pois.length} stops</span>
          )}
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-5 py-8 flex flex-col gap-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Street View + POI info */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            <StreetViewPanel
              pois={pois}
              currentPoiIndex={currentPoiIndex}
              onSelectPoi={handleSelectPoi}
              isTourPlaying={isTourPlaying}
              onToggleTour={() => setIsTourPlaying(!isTourPlaying)}
            />

            {/* Active POI card */}
            {activePoi && (
              <div
                className="rounded-2xl p-5 flex flex-col gap-2"
                style={{
                  background: 'rgba(15,12,8,0.8)',
                  border: '1px solid rgba(212,175,55,0.12)',
                  backdropFilter: 'blur(16px)',
                }}
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-display text-amber-200 flex items-center gap-3" style={{ fontSize: '1.1rem', fontWeight: 400 }}>
                    <span
                      className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-mono text-amber-400"
                      style={{ background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.25)' }}
                    >
                      {currentPoiIndex + 1}
                    </span>
                    {activePoi.name}
                  </h4>
                  <span className="text-[10px] text-stone-600 font-mono">
                    {activePoi.pano_heading}° heading
                  </span>
                </div>
                <p className="text-sm text-stone-400 font-light leading-relaxed">
                  {activePoi.facts_text}
                </p>
              </div>
            )}
          </div>

          {/* AI Guide panel */}
          <div className="lg:col-span-4 lg:sticky lg:top-24">
            {activePoi && (
              <GuidePanel
                contextType="poi"
                contextId={activePoi.id}
                title={activePoi.name}
                narration={poiNarration}
                factsText={activePoi.facts_text}
                autoPlayAudio={isTourPlaying}
              />
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-[11px] text-stone-700 py-6 tracking-widest uppercase">
        Echoes of Eternity · ACM × MLH Hack Days 2026
      </footer>
    </div>
  );
};
