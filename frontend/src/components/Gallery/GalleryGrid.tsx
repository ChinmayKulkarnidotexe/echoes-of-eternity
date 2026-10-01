import React from 'react';
import type { Painting } from '../../types';
import { Eye, Sparkles } from 'lucide-react';

interface Props {
  paintings: Painting[];
  selectedPaintingId: number | null;
  onSelectPainting: (painting: Painting) => void;
}

export const GalleryGrid: React.FC<Props> = ({
  paintings,
  selectedPaintingId,
  onSelectPainting,
}) => {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            Curated Masterpiece Gallery
          </h2>
          <p className="text-xs text-slate-400">
            Select a painting to enter the Three.js 3D inspection viewer and hear AI audio narration.
          </p>
        </div>
        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-purple-950/80 border border-purple-800/60 text-purple-300">
          {paintings.length} Artworks
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {paintings.map((painting) => {
          const isSelected = selectedPaintingId === painting.id;
          return (
            <div
              key={painting.id}
              onClick={() => onSelectPainting(painting)}
              className={`group relative rounded-2xl overflow-hidden cursor-pointer border transition-all duration-300 flex flex-col bg-slate-900/60 backdrop-blur-sm hover:-translate-y-1 hover:shadow-2xl ${
                isSelected
                  ? 'border-purple-500 ring-2 ring-purple-500/50 shadow-purple-900/30'
                  : 'border-slate-800 hover:border-slate-600'
              }`}
            >
              {/* Artwork Image Container */}
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-950">
                <img
                  src={painting.image_path}
                  alt={painting.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-black/20 opacity-60 group-hover:opacity-40 transition-opacity" />

                {/* Inspect Badge on hover */}
                <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600/90 backdrop-blur-md text-white text-xs font-medium shadow-lg">
                  <Eye className="w-3.5 h-3.5" /> Inspect 3D
                </div>
              </div>

              {/* Artwork Metadata */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors line-clamp-1">
                    {painting.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {painting.artist} · <span className="text-slate-500">{painting.year}</span>
                  </p>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1 text-[11px] text-purple-400">
                    <Sparkles className="w-3 h-3" /> Gemini Guided
                  </span>
                  <span className="font-semibold text-slate-300 group-hover:text-white transition-colors">
                    View & Narration →
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
