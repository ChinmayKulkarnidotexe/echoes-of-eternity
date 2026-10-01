import React, { useEffect, useRef, useState } from 'react';
import type { POI } from '../../types';
import { Play, Pause, ChevronRight, ChevronLeft, Compass, AlertTriangle } from 'lucide-react';

interface Props {
  pois: POI[];
  currentPoiIndex: number;
  onSelectPoi: (index: number) => void;
  isTourPlaying: boolean;
  onToggleTour: () => void;
}

export const StreetViewPanel: React.FC<Props> = ({
  pois,
  currentPoiIndex,
  onSelectPoi,
  isTourPlaying,
  onToggleTour,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const panoramaRef = useRef<any>(null);
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const currentPoi = pois[currentPoiIndex] || pois[0];
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  // Load Google Maps JavaScript API if API Key is supplied
  useEffect(() => {
    if (!apiKey) {
      setLoadError("No VITE_GOOGLE_MAPS_API_KEY detected in .env. Running in interactive visual preview mode.");
      return;
    }

    if ((window as any).google?.maps) {
      setMapsLoaded(true);
      return;
    }

    const scriptId = 'google-maps-script';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => setMapsLoaded(true);
      script.onerror = () => setLoadError("Failed to load Google Maps script. Check billing/key restrictions.");
      document.head.appendChild(script);
    }
  }, [apiKey]);

  // Initialize Street View Panorama when API is loaded
  useEffect(() => {
    if (!mapsLoaded || !mapContainerRef.current || !currentPoi) return;

    try {
      const google = (window as any).google;
      const initialPos = {
        lat: currentPoi.pano_lat || 27.1751448,
        lng: currentPoi.pano_lng || 78.0421422,
      };

      if (!panoramaRef.current) {
        panoramaRef.current = new google.maps.StreetViewPanorama(mapContainerRef.current, {
          position: initialPos,
          pov: {
            heading: currentPoi.pano_heading || 0,
            pitch: currentPoi.pano_pitch || 0,
          },
          zoom: 1,
          addressControl: false,
          linksControl: true,
          panControl: true,
          enableCloseButton: false,
          fullscreenControl: false,
        });
      } else {
        panoramaRef.current.setPosition(initialPos);
        panoramaRef.current.setPov({
          heading: currentPoi.pano_heading || 0,
          pitch: currentPoi.pano_pitch || 0,
        });
      }
    } catch (err: any) {
      console.warn("Street View init error:", err);
      setLoadError("Street View initialization error: " + err.message);
    }
  }, [mapsLoaded, currentPoi]);

  // Fallback high-res photographic views for offline/no-key development
  const fallbackImages: Record<number, string> = {
    1: "https://images.unsplash.com/photo-1605130284535-11dd9eedc58a?auto=format&fit=crop&w=1920&q=80", // Pedestal
    2: "https://images.unsplash.com/photo-1503572649817-3e3e0c53c891?auto=format&fit=crop&w=1920&q=80", // Copper Exterior
    3: "https://images.unsplash.com/photo-1485738422979-f5c462d49f04?auto=format&fit=crop&w=1920&q=80", // Torch
    4: "https://images.unsplash.com/photo-1492666673288-3c4b4f1a5765?auto=format&fit=crop&w=1920&q=80", // Tablet
  };

  return (
    <div className="relative w-full h-[65vh] min-h-[420px] rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl flex flex-col">
      {/* Real Google Maps Container */}
      {mapsLoaded ? (
        <div ref={mapContainerRef} className="w-full h-full" />
      ) : (
        /* Visual Interactive Fallback View */
        <div className="relative w-full h-full overflow-hidden group">
          <img
            src={fallbackImages[currentPoi?.id || 1] || fallbackImages[1]}
            alt={currentPoi?.name}
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-black/60 pointer-events-none" />

          {/* Fallback Notice Overlay */}
          <div className="absolute top-4 left-4 z-10 bg-amber-950/80 border border-amber-600/50 backdrop-blur-md px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs text-amber-200">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              {loadError || "Street View ready for VITE_GOOGLE_MAPS_API_KEY. Showing verified visual POI."}
            </span>
          </div>
        </div>
      )}

      {/* Top Overlay: POI Name & Heading */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-3">
        <div className="bg-slate-900/85 backdrop-blur-md border border-slate-700/60 px-4 py-2 rounded-xl text-white shadow-lg flex items-center gap-2.5">
          <Compass className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Heading</span>
          <span className="text-sm font-mono font-bold text-emerald-300">{currentPoi?.pano_heading}°</span>
        </div>
      </div>

      {/* Bottom Tour Control Bar */}
      <div className="absolute bottom-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 backdrop-blur-lg border border-slate-700/70 p-3 rounded-2xl shadow-2xl">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onSelectPoi(Math.max(0, currentPoiIndex - 1))}
            disabled={currentPoiIndex === 0}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors"
            title="Previous POI"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            onClick={onToggleTour}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all shadow-md ${
              isTourPlaying
                ? 'bg-amber-600 hover:bg-amber-500 text-white'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            {isTourPlaying ? (
              <>
                <Pause className="w-4 h-4 fill-current" /> Pause Guided Tour
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" /> Start Guided Tour
              </>
            )}
          </button>

          <button
            onClick={() => onSelectPoi(Math.min(pois.length - 1, currentPoiIndex + 1))}
            disabled={currentPoiIndex === pois.length - 1}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors"
            title="Next POI"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* POI Hotspots / Steps */}
        <div className="flex items-center gap-2 overflow-x-auto py-1">
          {pois.map((poi, idx) => (
            <button
              key={poi.id}
              onClick={() => onSelectPoi(idx)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                idx === currentPoiIndex
                  ? 'bg-purple-600 text-white shadow-lg ring-2 ring-purple-400'
                  : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-slate-900/60 inline-flex items-center justify-center text-[10px]">
                {idx + 1}
              </span>
              <span>{poi.name.split('(')[0].trim()}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
