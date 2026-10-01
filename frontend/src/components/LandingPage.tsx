import React from 'react';

interface Props {
  onSelect: (view: 'monuments' | 'paintings') => void;
}

export const LandingPage: React.FC<Props> = ({ onSelect }) => {
  return (
    <div
      id="landing-page"
      className="relative w-full min-h-screen flex flex-col items-center justify-center overflow-hidden"
    >
      {/* Background image with dark overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/hero_bg.jpg')" }}
      />
      {/* Deep gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />
      {/* Subtle vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.75) 100%)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-12 px-6 text-center">
        {/* Eyebrow */}
        <p
          className="animate-fade-up text-xs font-medium tracking-[0.35em] uppercase text-amber-400/80"
          style={{ letterSpacing: '0.35em' }}
        >
          An Immersive Heritage Experience
        </p>

        {/* Title */}
        <div className="animate-fade-up-delay-1 flex flex-col items-center gap-3">
          <h1
            className="font-display text-gold-shimmer"
            style={{
              fontSize: 'clamp(3rem, 10vw, 7.5rem)',
              lineHeight: 1.05,
              fontWeight: 300,
              letterSpacing: '-0.01em',
            }}
          >
            Echoes of Eternity
          </h1>
          <div className="w-24 h-px bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />
          <p className="text-sm text-stone-400 font-light tracking-wide max-w-md">
            Journey through the world's greatest monuments and masterpiece paintings
          </p>
        </div>

        {/* Two big buttons */}
        <div className="animate-fade-up-delay-2 flex flex-col sm:flex-row items-center gap-5 w-full max-w-2xl mt-2">
          {/* Monuments Button */}
          <button
            id="btn-monuments"
            onClick={() => onSelect('monuments')}
            className="hero-btn group relative flex-1 w-full sm:w-auto flex flex-col items-center justify-center gap-4 rounded-2xl py-10 px-8 cursor-pointer"
            style={{
              background:
                'linear-gradient(135deg, rgba(30,20,10,0.85) 0%, rgba(50,35,15,0.85) 100%)',
              border: '1px solid rgba(212,175,55,0.3)',
              boxShadow: '0 8px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
            }}
          >
            {/* Icon */}
            <span
              className="animate-float"
              style={{ fontSize: '3rem', lineHeight: 1, filter: 'drop-shadow(0 4px 16px rgba(212,175,55,0.4))' }}
            >
              🏛️
            </span>

            <div className="flex flex-col items-center gap-1.5">
              <span
                className="font-display text-amber-200 group-hover:text-amber-100 transition-colors"
                style={{ fontSize: '1.75rem', fontWeight: 400, lineHeight: 1.1 }}
              >
                Monuments
              </span>
              <span className="text-xs text-stone-500 tracking-wide font-light">
                3D immersive street view
              </span>
            </div>

            {/* Glow line at bottom */}
            <div
              className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 group-hover:w-3/4 h-px bg-amber-400/60 transition-all duration-500 ease-out rounded-full"
            />
          </button>

          {/* Divider */}
          <div className="hidden sm:flex flex-col items-center gap-2">
            <div className="w-px h-12 bg-gradient-to-b from-transparent via-stone-600 to-transparent" />
            <span className="text-xs text-stone-600 font-light">or</span>
            <div className="w-px h-12 bg-gradient-to-b from-transparent via-stone-600 to-transparent" />
          </div>

          {/* Paintings Button */}
          <button
            id="btn-paintings"
            onClick={() => onSelect('paintings')}
            className="hero-btn group relative flex-1 w-full sm:w-auto flex flex-col items-center justify-center gap-4 rounded-2xl py-10 px-8 cursor-pointer"
            style={{
              background:
                'linear-gradient(135deg, rgba(10,15,30,0.85) 0%, rgba(20,25,50,0.85) 100%)',
              border: '1px solid rgba(120,100,200,0.3)',
              boxShadow: '0 8px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
            }}
          >
            {/* Icon */}
            <span
              className="animate-float"
              style={{
                fontSize: '3rem',
                lineHeight: 1,
                filter: 'drop-shadow(0 4px 16px rgba(140,110,220,0.45))',
                animationDelay: '0.7s',
              }}
            >
              🎨
            </span>

            <div className="flex flex-col items-center gap-1.5">
              <span
                className="font-display text-violet-200 group-hover:text-violet-100 transition-colors"
                style={{ fontSize: '1.75rem', fontWeight: 400, lineHeight: 1.1 }}
              >
                Paintings
              </span>
              <span className="text-xs text-stone-500 tracking-wide font-light">
                Curated masterpiece gallery
              </span>
            </div>

            {/* Glow line at bottom */}
            <div
              className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 group-hover:w-3/4 h-px bg-violet-400/60 transition-all duration-500 ease-out rounded-full"
            />
          </button>
        </div>

        {/* Subtle footnote */}
        <p className="animate-fade-up-delay-3 text-[11px] text-stone-600 tracking-widest uppercase">
          Powered by Google Maps · Gemini AI
        </p>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#080a0f] to-transparent pointer-events-none" />
    </div>
  );
};
