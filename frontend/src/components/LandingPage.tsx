import React from 'react';
import { ArrowRight, Landmark, Palette } from 'lucide-react';

interface Props {
  onSelect: (view: 'monuments' | 'paintings') => void;
}

const ROUTES = [
  {
    id: 'monuments' as const,
    index: '01',
    Icon: Landmark,
    title: 'Monuments',
    line: 'Liberty Island, New York Harbour',
    blurb:
      'Orbit the statue from above, then walk the island with a guide who knows what to point at.',
  },
  {
    id: 'paintings' as const,
    index: '02',
    Icon: Palette,
    title: 'Paintings',
    line: 'Four works, examined closely',
    blurb:
      'Van Gogh, Leonardo, Hokusai and Vermeer, turned to the light and talked through.',
  },
];

export const LandingPage: React.FC<Props> = ({ onSelect }) => {
  return (
    <div
      id="landing-page"
      className="relative w-full min-h-screen flex flex-col overflow-hidden bg-[#080a0f]"
    >
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/hero_bg.jpg')", opacity: 0.38 }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#080a0f]/70 via-[#080a0f]/85 to-[#080a0f]" />

      <main className="relative z-10 flex-1 w-full max-w-5xl mx-auto px-7 flex flex-col justify-center gap-16 py-20">
        <header className="animate-fade-up flex flex-col gap-5 max-w-2xl">
          <span className="text-[10px] font-medium tracking-[0.32em] uppercase text-amber-400/70">
            ACM × MLH Hack Days 2026
          </span>
          <h1
            className="font-display text-stone-100"
            style={{
              fontSize: 'clamp(2.8rem, 9vw, 5.5rem)',
              lineHeight: 0.98,
              fontWeight: 300,
              letterSpacing: '-0.02em',
            }}
          >
            Echoes of&nbsp;Eternity
          </h1>
          <p className="text-sm text-stone-400 font-light leading-relaxed max-w-md">
            Heritage is usually handed to you as a photograph and a plaque. Here you walk through
            it, on real imagery, with a guide that answers questions.
          </p>
        </header>

        <nav className="animate-fade-up-delay-1 flex flex-col">
          {ROUTES.map(({ id, index, Icon, title, line, blurb }) => (
            <button
              key={id}
              id={`btn-${id}`}
              onClick={() => onSelect(id)}
              className="route-row group flex items-start gap-5 sm:gap-8 py-7 text-left border-t border-white/[0.07] last:border-b"
            >
              <span className="text-[10px] font-mono text-stone-700 pt-2 w-6 shrink-0">
                {index}
              </span>

              <Icon
                className="w-5 h-5 text-amber-400/50 shrink-0 mt-1.5 transition-colors group-hover:text-amber-300"
                strokeWidth={1.25}
                aria-hidden="true"
              />

              <span className="flex-1 flex flex-col gap-1.5 min-w-0">
                <span
                  className="font-display text-stone-100 group-hover:text-amber-100 transition-colors"
                  style={{ fontSize: '1.75rem', fontWeight: 400, lineHeight: 1.1 }}
                >
                  {title}
                </span>
                <span className="text-[11px] text-amber-600/60 tracking-wide">{line}</span>
                <span className="text-[13px] text-stone-500 font-light leading-relaxed max-w-md mt-1">
                  {blurb}
                </span>
              </span>

              <ArrowRight
                className="w-4 h-4 text-stone-700 shrink-0 mt-2 transition-all group-hover:text-amber-300 group-hover:translate-x-1"
                strokeWidth={1.5}
                aria-hidden="true"
              />
            </button>
          ))}
        </nav>
      </main>

      <footer className="relative z-10 px-7 pb-8">
        <p className="text-[10px] text-stone-700 tracking-[0.22em] uppercase">
          Google Maps Platform · Gemini
        </p>
      </footer>
    </div>
  );
};
