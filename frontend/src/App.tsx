import { useState, useEffect } from 'react';
import { Navbar } from './components/Navigation/Navbar';
import { StreetViewPanel } from './components/StreetView/StreetViewPanel';
import { GalleryGrid } from './components/Gallery/GalleryGrid';
import { PaintingViewer } from './components/Gallery/PaintingViewer';
import { GuidePanel } from './components/AIGuide/GuidePanel';
import type { POI, Painting } from './types';
import { fetchMonumentPois, fetchNarration, fetchPaintings, fetchPaintingInfo } from './services/api';
import { Landmark, Palette, MapPin } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<'monument' | 'gallery'>('monument');

  // Monument Tour State
  const [pois, setPois] = useState<POI[]>([]);
  const [currentPoiIndex, setCurrentPoiIndex] = useState(0);
  const [isTourPlaying, setIsTourPlaying] = useState(false);
  const [poiNarration, setPoiNarration] = useState('');

  // Gallery State
  const [paintings, setPaintings] = useState<Painting[]>([]);
  const [selectedPainting, setSelectedPainting] = useState<Painting | null>(null);
  const [paintingNarration, setPaintingNarration] = useState('');

  // 1. Initial Load of POIs and Paintings
  useEffect(() => {
    fetchMonumentPois(1).then((data) => {
      setPois(data);
      if (data.length > 0) {
        loadPoiNarration(data[0].id);
      }
    });

    fetchPaintings().then((data) => {
      setPaintings(data);
      if (data.length > 0) {
        setSelectedPainting(data[0]);
        loadPaintingNarration(data[0].id);
      }
    });
  }, []);

  // 2. Load POI Narration
  const loadPoiNarration = async (poiId: number) => {
    const res = await fetchNarration(poiId);
    setPoiNarration(res.narration);
  };

  // 3. Load Painting Narration
  const loadPaintingNarration = async (paintingId: number) => {
    const res = await fetchPaintingInfo(paintingId);
    setPaintingNarration(res.narration);
  };

  // 4. Handle POI Selection
  const handleSelectPoi = (index: number) => {
    setCurrentPoiIndex(index);
    if (pois[index]) {
      loadPoiNarration(pois[index].id);
    }
  };

  // 5. Handle Painting Selection
  const handleSelectPainting = (painting: Painting) => {
    setSelectedPainting(painting);
    loadPaintingNarration(painting.id);
  };

  // 6. Guided Tour Auto-Advance Logic
  useEffect(() => {
    if (!isTourPlaying || pois.length === 0) return;

    const timer = setInterval(() => {
      setCurrentPoiIndex((prev) => {
        const next = (prev + 1) % pois.length;
        loadPoiNarration(pois[next].id);
        return next;
      });
    }, 12000); // Advance every 12 seconds during automated tour

    return () => clearInterval(timer);
  }, [isTourPlaying, pois]);

  const activePoi = pois[currentPoiIndex] || pois[0];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-purple-600 selection:text-white">
      {/* Navigation */}
      <Navbar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
        {/* Tab 1: Monument Walkthrough */}
        {activeTab === 'monument' && (
          <div className="flex flex-col gap-6 animate-fadeIn">
            {/* Monument Header Summary */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-slate-900/90 via-purple-950/20 to-slate-900/90 border border-slate-800 p-4 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
                  <Landmark className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-bold text-white">Statue of Liberty</h2>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800/60 font-medium">
                      UNESCO World Heritage Site
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-purple-400" /> Liberty Island, New York Harbor, USA
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Stop {currentPoiIndex + 1} of {pois.length}</span>
              </div>
            </div>

            {/* Interactive Grid: Street View + AI Guide */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Street View Panorama & POIs */}
              <div className="lg:col-span-8 flex flex-col gap-4">
                <StreetViewPanel
                  pois={pois}
                  currentPoiIndex={currentPoiIndex}
                  onSelectPoi={handleSelectPoi}
                  isTourPlaying={isTourPlaying}
                  onToggleTour={() => setIsTourPlaying(!isTourPlaying)}
                />

                {/* Current POI Info Card */}
                {activePoi && (
                  <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-purple-600/30 text-purple-400 text-xs inline-flex items-center justify-center font-mono">
                          {currentPoiIndex + 1}
                        </span>
                        {activePoi.name}
                      </h4>
                      <span className="text-[11px] text-slate-400 font-mono">
                        Pano: ({activePoi.pano_heading}°, {activePoi.pano_pitch}°)
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {activePoi.facts_text}
                    </p>
                  </div>
                )}
              </div>

              {/* Right Column: AI Guide & Voice Q&A */}
              <div className="lg:col-span-4 sticky top-24">
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
          </div>
        )}

        {/* Tab 2: Art Gallery */}
        {activeTab === 'gallery' && (
          <div className="flex flex-col gap-6 animate-fadeIn">
            {/* Gallery Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-slate-900/90 via-purple-950/20 to-slate-900/90 border border-slate-800 p-4 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
                  <Palette className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-white">Virtual Fine Art Gallery</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Interactive 3D textured orbit inspection & AI docent narration
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-purple-300 border border-slate-700">
                  Track 1: "What is Earth without art?"
                </span>
              </div>
            </div>

            {/* 3D Viewer & AI Guide Split (when a painting is selected) */}
            {selectedPainting && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-8 flex flex-col gap-4">
                  <PaintingViewer
                    painting={selectedPainting}
                    onClose={() => setSelectedPainting(null)}
                  />
                </div>

                <div className="lg:col-span-4 sticky top-24">
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
            )}

            {/* Gallery Grid */}
            <GalleryGrid
              paintings={paintings}
              selectedPaintingId={selectedPainting?.id || null}
              onSelectPainting={handleSelectPainting}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-800/80 py-4 px-6 text-center text-xs text-slate-500 bg-slate-950/80">
        ACM x MLH Hack Days 2026 · Echoes of Eternity · Powered by Google Maps & Google Gemini API
      </footer>
    </div>
  );
}

export default App;
