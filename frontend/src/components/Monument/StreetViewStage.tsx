import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Compass } from 'lucide-react';
import type { Hotspot, LatLng } from '../../types';
import { loadGoogleMaps } from '../../lib/loaders';
import { easeInOut, lerp, lerpHeading } from '../../lib/geo';
import { HotspotLayer, type PanoView } from './HotspotLayer';

export interface StreetViewTarget {
  panoId: string;
  heading: number;
  pitch: number;
  zoom: number;
  /** Ease into the point of view instead of snapping to it. */
  settle?: boolean;
}

interface Props {
  target: StreetViewTarget | null;
  /**
   * Guided-tour mode. The visitor keeps full look-around (dragging a panorama
   * is always available and is exactly what we want), but cannot walk to
   * another panorama or click through a navigation arrow.
   */
  locked: boolean;
  hotspots?: Hotspot[];
  activeHotspotId?: string | null;
  onHotspotSelect?: (hotspot: Hotspot) => void;
  onPanoChange?: (panoId: string, position: LatLng) => void;
  onReady?: () => void;
  onError?: (message: string) => void;
}

const SETTLE_MS = 2200;
/** How far off the final heading an arrival starts, for a gentle camera settle. */
const SETTLE_HEADING_OFFSET = 7;

export const StreetViewStage: React.FC<Props> = ({
  target,
  locked,
  hotspots,
  activeHotspotId,
  onHotspotSelect,
  onPanoChange,
  onReady,
  onError,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const panoRef = useRef<any>(null);
  const tweenRef = useRef<number | null>(null);
  const viewRef = useRef<PanoView>({
    origin: { lat: 0, lng: 0 },
    heading: 0,
    pitch: 0,
    zoom: 1,
    width: 0,
    height: 0,
  });
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [veiled, setVeiled] = useState(false);

  const stopTween = useCallback(() => {
    if (tweenRef.current !== null) {
      cancelAnimationFrame(tweenRef.current);
      tweenRef.current = null;
    }
  }, []);

  /** Keep `viewRef` in step with the live panorama so hotspots track the view. */
  const syncView = useCallback(() => {
    const pano = panoRef.current;
    const container = containerRef.current;
    if (!pano || !container) return;
    const pov = pano.getPov?.();
    const position = pano.getPosition?.();
    viewRef.current = {
      origin: position
        ? { lat: position.lat(), lng: position.lng() }
        : viewRef.current.origin,
      heading: pov?.heading ?? viewRef.current.heading,
      pitch: pov?.pitch ?? viewRef.current.pitch,
      zoom: pano.getZoom?.() ?? viewRef.current.zoom,
      width: container.clientWidth,
      height: container.clientHeight,
    };
  }, []);

  // -------------------------------------------------------------------------
  // Create the panorama exactly once and keep it alive for the whole session.
  // Re-creating it on every mode change would re-bill a panorama load and lose
  // wherever the visitor had turned to look.
  // -------------------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;

    loadGoogleMaps()
      .then((maps) => {
        if (cancelled || !containerRef.current || panoRef.current) return;

        const pano = new maps.StreetViewPanorama(containerRef.current, {
          pano: target?.panoId,
          pov: { heading: target?.heading ?? 0, pitch: target?.pitch ?? 0 },
          zoom: target?.zoom ?? 1,
          disableDefaultUI: true,
          addressControl: false,
          fullscreenControl: false,
          enableCloseButton: false,
          imageDateControl: false,
          motionTracking: false,
          motionTrackingControl: false,
          showRoadLabels: false,
          panControl: false,
          zoomControl: false,
          // Movement controls are driven by the `locked` effect below.
          clickToGo: false,
          linksControl: false,
          scrollwheel: false,
        });
        panoRef.current = pano;

        pano.addListener('pov_changed', syncView);
        pano.addListener('zoom_changed', syncView);

        // `position_changed` fires before the new panorama id is swapped in, so
        // reading getPano() there reports the panorama we just left. Listening
        // to both and reporting on each keeps the free-roam vantage rail
        // pointing at where the visitor actually is.
        const report = () => {
          syncView();
          const position = pano.getPosition?.();
          if (position) {
            onPanoChange?.(pano.getPano?.() ?? '', {
              lat: position.lat(),
              lng: position.lng(),
            });
          }
        };
        pano.addListener('position_changed', report);
        pano.addListener('pano_changed', report);
        pano.addListener('status_changed', () => {
          if (pano.getStatus?.() !== 'OK') {
            const message = `Street View returned status "${pano.getStatus?.()}" for this panorama.`;
            setError(message);
            onError?.(message);
          }
        });

        syncView();
        setReady(true);
        onReady?.();
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : String(err);
        console.error('Street View failed to load:', err);
        setError(message);
        onError?.(message);
      });

    return () => {
      cancelled = true;
      stopTween();
      const pano = panoRef.current;
      if (pano && window.google?.maps?.event) {
        window.google.maps.event.clearInstanceListeners(pano);
      }
      panoRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -------------------------------------------------------------------------
  // Movement lock. Looking around is always allowed; walking is not, until the
  // guided tour hands over to free roam.
  // -------------------------------------------------------------------------
  useEffect(() => {
    const pano = panoRef.current;
    if (!pano || !ready) return;
    // Only movement is toggled. Google's own chrome — the close button, the
    // fullscreen and motion-tracking toggles, the pan and zoom widgets — stays
    // off in both modes: it clutters the frame and offers exits out of the
    // experience. Dragging to look and clicking the ground arrows to walk is
    // the whole control surface the visitor needs.
    pano.setOptions({
      clickToGo: !locked,
      linksControl: !locked,
      scrollwheel: !locked,
    });
  }, [locked, ready]);

  // -------------------------------------------------------------------------
  // Move to the requested target. A short veil covers the panorama swap so a
  // stop change reads as a cut in a film rather than a texture pop.
  // -------------------------------------------------------------------------
  useEffect(() => {
    const pano = panoRef.current;
    if (!pano || !ready || !target) return;

    stopTween();

    const samePano = pano.getPano?.() === target.panoId;
    if (!samePano) setVeiled(true);

    const applyTarget = () => {
      if (!panoRef.current) return;
      if (!samePano) panoRef.current.setPano(target.panoId);

      if (target.settle) {
        // Arrive looking slightly short of the subject, then ease onto it.
        const fromHeading = target.heading - SETTLE_HEADING_OFFSET;
        const fromPitch = target.pitch * 0.72;
        const fromZoom = Math.max(0, target.zoom - 0.35);
        panoRef.current.setPov({ heading: fromHeading, pitch: fromPitch });
        panoRef.current.setZoom(fromZoom);

        const startedAt = performance.now();
        const step = () => {
          const active = panoRef.current;
          if (!active) return;
          const t = Math.min(1, (performance.now() - startedAt) / SETTLE_MS);
          const eased = easeInOut(t);
          active.setPov({
            heading: lerpHeading(fromHeading, target.heading, eased),
            pitch: lerp(fromPitch, target.pitch, eased),
          });
          active.setZoom(lerp(fromZoom, target.zoom, eased));
          tweenRef.current = t < 1 ? requestAnimationFrame(step) : null;
        };
        tweenRef.current = requestAnimationFrame(step);
      } else {
        panoRef.current.setPov({ heading: target.heading, pitch: target.pitch });
        panoRef.current.setZoom(target.zoom);
      }

      syncView();
      if (!samePano) {
        // Give the first tiles a moment before lifting the veil.
        window.setTimeout(() => setVeiled(false), 260);
      }
    };

    if (samePano) {
      applyTarget();
    } else {
      const handle = window.setTimeout(applyTarget, 180);
      return () => window.clearTimeout(handle);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target?.panoId, target?.heading, target?.pitch, target?.zoom, ready]);

  /** A deliberate drag outranks the arrival animation. */
  const handlePointerDown = useCallback(() => stopTween(), [stopTween]);

  // Keep the projection honest when the window resizes.
  useEffect(() => {
    const handleResize = () => syncView();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [syncView]);

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#05070c]">
      <div
        ref={containerRef}
        className="w-full h-full streetview-canvas"
        onPointerDown={handlePointerDown}
      />

      {/* Hotspots are projected from the live point of view, so they stay pinned
          to the real feature as the visitor looks around. */}
      {ready && hotspots && hotspots.length > 0 && (
        <HotspotLayer
          hotspots={hotspots}
          viewRef={viewRef}
          activeHotspotId={activeHotspotId}
          onSelect={onHotspotSelect}
        />
      )}

      {/* Transition veil between stops */}
      <div
        className="absolute inset-0 pointer-events-none bg-[#05070c] transition-opacity duration-300"
        style={{ opacity: veiled ? 1 : 0 }}
      />

      {!ready && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#05070c]">
          <div className="orbit-spinner" aria-hidden="true">
            <span />
            <span />
          </div>
          <p className="text-sm text-amber-200/80 font-light">Loading Street View imagery…</p>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center p-8 bg-[#05070c]/95">
          <div
            className="max-w-md rounded-2xl p-6 flex flex-col gap-3 text-center"
            style={{
              background: 'rgba(20,14,6,0.9)',
              border: '1px solid rgba(212,175,55,0.25)',
            }}
          >
            <Compass className="w-6 h-6 mx-auto text-amber-400/70" strokeWidth={1.25} />
            <h3 className="font-display text-amber-200 text-xl" style={{ fontWeight: 400 }}>
              Street View unavailable
            </h3>
            <p className="text-xs text-stone-400 leading-relaxed">{error}</p>
            <p className="text-[11px] text-stone-600 leading-relaxed">
              Check that <strong>VITE_GOOGLE_MAPS_API_KEY</strong> is set in{' '}
              <code>frontend/.env</code> and that the Maps JavaScript API is enabled with billing
              active on the Google Cloud project.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
