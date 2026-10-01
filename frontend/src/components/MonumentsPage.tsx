import React from 'react';
import { ArrowLeft } from 'lucide-react';

export interface MonumentData {
  id: number;
  name: string;
  location: string;
  era: string;
  description: string;
  image: string;
  pois?: number; // number of POIs / stops
}

// Rich monument catalog with fallback Unsplash images
export const MONUMENTS: MonumentData[] = [
  {
    id: 1,
    name: 'Taj Mahal',
    location: 'Agra, India',
    era: '1632 – 1653',
    description: 'A UNESCO World Heritage ivory-white marble mausoleum built by Emperor Shah Jahan.',
    image: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=800&q=80',
    pois: 4,
  },
  {
    id: 2,
    name: 'Colosseum',
    location: 'Rome, Italy',
    era: '70 – 80 AD',
    description: 'The largest ancient amphitheatre ever built, once hosting gladiatorial contests.',
    image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=800&q=80',
    pois: 3,
  },
  {
    id: 3,
    name: 'Machu Picchu',
    location: 'Cusco, Peru',
    era: 'c. 1450 AD',
    description: 'An Incan citadel set high in the Andes Mountains, rediscovered in 1911.',
    image: 'https://images.unsplash.com/photo-1587595431973-160d0d94add1?auto=format&fit=crop&w=800&q=80',
    pois: 4,
  },
  {
    id: 4,
    name: 'Angkor Wat',
    location: 'Siem Reap, Cambodia',
    era: '12th Century',
    description: "The world's largest religious monument, a magnificent Khmer temple complex.",
    image: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&fit=crop&w=800&q=80',
    pois: 3,
  },
  {
    id: 5,
    name: 'Parthenon',
    location: 'Athens, Greece',
    era: '447 – 432 BC',
    description: 'A former temple dedicated to the goddess Athena, crowning the Acropolis.',
    image: 'https://images.unsplash.com/photo-1555993539-1732b0258235?auto=format&fit=crop&w=800&q=80',
    pois: 3,
  },
  {
    id: 6,
    name: 'Chichen Itza',
    location: 'Yucatán, Mexico',
    era: '5th – 13th Century',
    description: 'A large pre-Columbian city built by the Maya civilization at its peak.',
    image: 'https://images.unsplash.com/photo-1518638150340-f706e86654de?auto=format&fit=crop&w=800&q=80',
    pois: 3,
  },
];

interface Props {
  onBack: () => void;
  onSelectMonument: (monument: MonumentData) => void;
}

export const MonumentsPage: React.FC<Props> = ({ onBack, onSelectMonument }) => {
  return (
    <div className="min-h-screen bg-[#080a0f] flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-5 border-b border-white/[0.06]"
        style={{ background: 'rgba(8,10,15,0.92)', backdropFilter: 'blur(24px)' }}
      >
        <button
          id="back-from-monuments"
          onClick={onBack}
          className="flex items-center gap-2 text-stone-400 hover:text-amber-300 transition-colors text-sm font-light"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <div className="flex flex-col items-center">
          <h1 className="font-display text-gold-shimmer text-2xl" style={{ fontWeight: 300 }}>
            Echoes of Eternity
          </h1>
          <p className="text-[10px] text-stone-500 tracking-[0.25em] uppercase mt-0.5">Monuments</p>
        </div>

        <div className="w-16" /> {/* spacer */}
      </header>

      {/* Main */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-5 py-12">
        {/* Section heading */}
        <div className="animate-fade-up text-center mb-12 flex flex-col items-center gap-3">
          <h2 className="font-display text-stone-100" style={{ fontSize: 'clamp(1.8rem, 5vw, 3rem)', fontWeight: 300 }}>
            Choose a Monument
          </h2>
          <div className="w-16 h-px bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />
          <p className="text-sm text-stone-500 font-light">
            Click any monument to begin your 3D immersive street-view experience
          </p>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
          {MONUMENTS.map((monument, i) => (
            <button
              key={monument.id}
              id={`monument-card-${monument.id}`}
              onClick={() => onSelectMonument(monument)}
              className="monument-card group relative rounded-2xl overflow-hidden cursor-pointer text-left"
              style={{
                background: 'rgba(15,12,8,0.9)',
                border: '1px solid rgba(255,255,255,0.07)',
                animationDelay: `${i * 0.07}s`,
              }}
            >
              {/* Image */}
              <div className="relative w-full overflow-hidden" style={{ aspectRatio: '4/3' }}>
                <img
                  src={monument.image}
                  alt={monument.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0805]/90 via-transparent to-transparent" />

                {/* Era badge */}
                <div
                  className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-medium text-amber-300/80 tracking-wide"
                  style={{ background: 'rgba(20,15,5,0.75)', border: '1px solid rgba(212,175,55,0.2)', backdropFilter: 'blur(8px)' }}
                >
                  {monument.era}
                </div>

                {/* POI count */}
                <div
                  className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] text-stone-400"
                  style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}
                >
                  <span className="text-amber-400">◎</span>
                  <span>{monument.pois} view points</span>
                </div>

                {/* Hover: explore CTA */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div
                    className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium text-white"
                    style={{ background: 'rgba(212,175,55,0.2)', border: '1px solid rgba(212,175,55,0.5)', backdropFilter: 'blur(12px)' }}
                  >
                    <span>Explore in 3D</span>
                    <span>→</span>
                  </div>
                </div>
              </div>

              {/* Info */}
              <div className="p-5 flex flex-col gap-2">
                <h3 className="font-display text-stone-100 group-hover:text-amber-200 transition-colors"
                  style={{ fontSize: '1.3rem', fontWeight: 400 }}>
                  {monument.name}
                </h3>
                <p className="text-xs text-amber-600/70 tracking-wide flex items-center gap-1.5">
                  <span>📍</span>
                  {monument.location}
                </p>
                <p className="text-xs text-stone-500 font-light leading-relaxed mt-1">
                  {monument.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-[11px] text-stone-700 py-6 tracking-widest uppercase">
        Echoes of Eternity · ACM × MLH Hack Days 2026
      </footer>
    </div>
  );
};
