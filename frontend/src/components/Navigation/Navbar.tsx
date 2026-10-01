import React from 'react';
import { Landmark, Palette, Sparkles } from 'lucide-react';

interface Props {
  activeTab: 'monument' | 'gallery';
  onTabChange: (tab: 'monument' | 'gallery') => void;
}

export const Navbar: React.FC<Props> = ({ activeTab, onTabChange }) => {
  return (
    <header className="w-full bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 sticky top-0 z-50 px-4 lg:px-8 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Logo & Tagline */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-500 p-0.5 shadow-lg shadow-purple-900/30 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-purple-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black tracking-tight text-white m-0">
                AURA
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800/50">
                ACM x MLH Hack Days '26
              </span>
            </div>
            <p className="text-[11px] text-slate-400 m-0">
              Immersive AI Heritage & Fine Art Experience
            </p>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800">
          <button
            onClick={() => onTabChange('monument')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'monument'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Landmark className="w-4 h-4" />
            <span>Monument Tour</span>
          </button>

          <button
            onClick={() => onTabChange('gallery')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'gallery'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>Art Gallery (3D)</span>
          </button>
        </div>
      </div>
    </header>
  );
};
