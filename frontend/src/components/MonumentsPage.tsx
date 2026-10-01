import React, { useEffect } from 'react';
import { ArrowLeft, ArrowRight, Compass, Footprints, Orbit } from 'lucide-react';
import { preconnectImageryHosts, warmUpRuntimes } from '../lib/loaders';
import { fetchExperience } from '../services/api';

export interface MonumentData {
  id: number;
  name: string;
  subtitle: string;
  location: string;
  era: string;
  description: string;
  image: string;
  stops: number;
  hotspots: number;
}

/**
 * The monument catalogue.
 *
 * Only the Statue of Liberty is listed, and deliberately so: each monument needs
 * a hand-verified Street View route and an authored tour script in the backend's
 * `tour_data.py`, so listing a monument without one would offer the visitor a
 * tour that cannot run. Add the route there first, then add the card here.
 */
export const MONUMENTS: MonumentData[] = [
  {
    id: 1,
    name: 'Statue of Liberty',
    subtitle: 'Liberty Enlightening the World',
    location: 'Liberty Island, New York Harbour',
    era: '1875–1886',
    description:
      'Bartholdi’s colossus stands on Gustave Eiffel’s iron frame, ninety-three metres from the base of her pedestal to the tip of her torch. She was shipped from France in two hundred and fourteen crates and riveted together on a disused harbour fort.',
    // A still of the exact panorama the guided walk opens on, captured once at
    // build time by scripts/capture_plate.py. A stock photograph here showed
    // the Manhattan skyline rather than the monument; this shows the visitor
    // precisely what they are about to step into, and loads from our own origin.
    image: '/liberty-plate.jpg',
    stops: 11,
    hotspots: 5,
  },
];

const STAGES = [
  { Icon: Orbit, label: 'Aerial orbit', detail: 'Photorealistic 3D tiles' },
  { Icon: Footprints, label: 'Guided walk', detail: 'Eleven stops, three minutes' },
  { Icon: Compass, label: 'Free roam', detail: 'Five points of interest' },
];

interface Props {
  onBack: () => void;
  onSelectMonument: (monument: MonumentData) => void;
}

export const MonumentsPage: React.FC<Props> = ({ onBack, onSelectMonument }) => {
  const monument = MONUMENTS[0];

  // The visitor spends a few seconds on this page deciding. Spend them fetching
  // the six-megabyte renderer, the Maps API and the tour bundle, so the
  // experience opens on imagery instead of a loading spinner.
  useEffect(() => {
    preconnectImageryHosts();
    warmUpRuntimes();
    fetchExperience(MONUMENTS[0].id).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-[#080a0f] flex flex-col">
      <header className="flex items-center justify-between px-7 py-6">
        <button
          id="back-from-monuments"
          onClick={onBack}
          className="flex items-center gap-2 text-stone-500 hover:text-amber-200 transition-colors text-xs font-light tracking-wide"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back</span>
        </button>

        <span className="text-[10px] text-stone-700 tracking-[0.3em] uppercase">
          Echoes of Eternity
        </span>
      </header>

      <main className="flex-1 w-full max-w-6xl mx-auto px-7 pb-16 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Plate */}
          <button
            id={`monument-card-${monument.id}`}
            onClick={() => onSelectMonument(monument)}
            className="monument-plate group relative lg:col-span-7 overflow-hidden rounded-sm text-left animate-fade-in"
            style={{ aspectRatio: '4/5' }}
            aria-label={`Enter the ${monument.name} experience`}
          >
            <img
              src={monument.image}
              alt=""
              className="w-full h-full object-cover"
              loading="eager"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#080a0f] via-[#080a0f]/15 to-transparent" />
            <div className="absolute inset-0 ring-1 ring-inset ring-white/[0.08]" />

            <div className="absolute inset-x-0 bottom-0 p-7 flex items-end justify-between gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-amber-400/70 tracking-[0.28em] uppercase">
                  {monument.era}
                </span>
                <span
                  className="font-display text-stone-100"
                  style={{ fontSize: '1.05rem', fontWeight: 400, letterSpacing: '0.01em' }}
                >
                  {monument.location}
                </span>
              </div>
              <span className="monument-plate-cue flex items-center justify-center w-11 h-11 rounded-full shrink-0 text-amber-100">
                <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
              </span>
            </div>
          </button>

          {/* Caption */}
          <div className="lg:col-span-5 flex flex-col gap-7 animate-fade-up">
            <div className="flex flex-col gap-4">
              <h1
                className="font-display text-stone-100"
                style={{
                  fontSize: 'clamp(2.4rem, 6vw, 4rem)',
                  fontWeight: 300,
                  lineHeight: 1.02,
                  letterSpacing: '-0.015em',
                }}
              >
                {monument.name}
              </h1>
              <p
                className="font-display text-amber-200/60 italic"
                style={{ fontSize: '1.05rem', fontWeight: 300 }}
              >
                {monument.subtitle}
              </p>
            </div>

            <div className="w-10 h-px bg-amber-400/30" />

            <p className="text-[13px] text-stone-400 font-light leading-[1.85] max-w-sm">
              {monument.description}
            </p>

            <dl className="flex flex-col gap-3.5 pt-1">
              {STAGES.map(({ Icon, label, detail }, index) => (
                <div key={label} className="flex items-baseline gap-4">
                  <span className="text-[10px] font-mono text-stone-700 w-4 shrink-0">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <Icon
                    className="w-3.5 h-3.5 text-amber-400/50 shrink-0 translate-y-0.5"
                    strokeWidth={1.5}
                    aria-hidden="true"
                  />
                  <div className="flex flex-col">
                    <dt className="text-xs text-stone-300 font-light">{label}</dt>
                    <dd className="text-[11px] text-stone-600 font-light">{detail}</dd>
                  </div>
                </div>
              ))}
            </dl>

            <button
              onClick={() => onSelectMonument(monument)}
              className="group self-start flex items-center gap-3 pt-2 text-sm text-amber-200 font-light tracking-wide"
            >
              <span className="border-b border-amber-400/30 group-hover:border-amber-400/70 transition-colors pb-0.5">
                Enter the experience
              </span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>

        {/* Adding a monument is a backend job first, so say so plainly. */}
        <p className="mt-16 text-[11px] text-stone-700 font-light max-w-md leading-relaxed">
          One monument is live. Each additional site needs its Street View coverage verified and
          its tour written before it can be listed here.
        </p>
      </main>
    </div>
  );
};
