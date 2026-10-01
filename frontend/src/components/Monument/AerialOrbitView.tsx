import React, { useEffect, useRef, useState } from 'react';
import { Orbit } from 'lucide-react';
import type { AerialConfig } from '../../types';
import { GOOGLE_MAPS_API_KEY, loadCesium } from '../../lib/loaders';
import { TILES_ROOT_URL } from '../../services/api';

type LoadState = 'loading' | 'ready' | 'failed';

/**
 * Tileset settings chosen for how this scene is actually used: one fixed orbit
 * around one building, watched for under a minute.
 *
 * `cacheBytes` is raised well above Cesium's default so the tiles for a full
 * revolution stay resident — the camera comes back round to where it started,
 * and without the headroom it re-downloads imagery it had a moment ago.
 * `skipLevelOfDetail` lets the renderer jump straight to detailed tiles instead
 * of walking down the tree, which is what makes the opening shot sharp sooner.
 */
const TILESET_TUNING = {
  maximumScreenSpaceError: 16,
  cacheBytes: 768 * 1024 * 1024,
  maximumCacheOverflowBytes: 256 * 1024 * 1024,
  skipLevelOfDetail: true,
  preloadWhenHidden: true,
  preferLeaves: true,
};

interface Props {
  config: AerialConfig;
  /** Pauses the orbit without tearing the scene down. */
  paused?: boolean;
  onReady?: () => void;
  onFailed?: (reason: string) => void;
}

/**
 * Mode 1 — a slow automatic orbit of the monument over Google's Photorealistic
 * 3D Tiles, rendered with CesiumJS.
 *
 * Two things here are load-bearing for cost. First, the tileset is loaded from
 * the backend's cached root document rather than from tile.googleapis.com, so
 * every visitor shares one billable root-tileset request (see
 * `maps_service.get_tiles_root`). Second, camera input is disabled and the orbit
 * is driven from a single requestAnimationFrame loop — nothing re-initialises
 * the scene while the visitor watches.
 */
export const AerialOrbitView: React.FC<Props> = ({ config, paused = false, onReady, onFailed }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  const frameRef = useRef<number | null>(null);
  const pausedRef = useRef(paused);
  const [state, setState] = useState<LoadState>('loading');
  const [detail, setDetail] = useState<string>('Loading Google Photorealistic 3D Tiles…');
  const [sharedSession, setSharedSession] = useState(false);

  pausedRef.current = paused;

  useEffect(() => {
    let cancelled = false;
    let viewer: any = null;

    async function boot() {
      if (!containerRef.current) return;

      if (!GOOGLE_MAPS_API_KEY) {
        throw new Error('VITE_GOOGLE_MAPS_API_KEY is not set in frontend/.env');
      }

      const Cesium = await loadCesium();
      if (cancelled || !containerRef.current) return;

      // `globe: false` is required for Photorealistic 3D Tiles — the tiles carry
      // their own terrain, and leaving the ellipsoid on makes it poke through.
      viewer = new Cesium.Viewer(containerRef.current, {
        globe: false,
        baseLayerPicker: false,
        geocoder: false,
        homeButton: false,
        sceneModePicker: false,
        navigationHelpButton: false,
        animation: false,
        timeline: false,
        fullscreenButton: false,
        infoBox: false,
        selectionIndicator: false,
        requestRenderMode: false,
      });
      viewerRef.current = viewer;

      viewer.scene.skyAtmosphere.show = false;
      viewer.scene.backgroundColor = Cesium.Color.fromCssColorString('#05070c');
      // The visitor only watches in this mode; the tour and free roam are where
      // they get the controls.
      viewer.scene.screenSpaceCameraController.enableInputs = false;
      viewer.cesiumWidget.creditContainer.style.display = 'none';

      const tileset = await loadTileset(Cesium);
      if (cancelled) return;
      viewer.scene.primitives.add(tileset);

      // Put the camera on its mark first: Cesium only requests the tiles the
      // current view needs, so nothing streams until it knows where to look.
      setDetail('Framing the monument…');
      placeCamera(Cesium, viewer, config.orbit.start_heading_deg);

      setDetail('Streaming the island…');
      await waitForTiles(tileset);
      if (cancelled) return;

      // Reveal only once there is something photoreal to reveal — the opening
      // shot is the first thing anyone sees of this project.
      setState('ready');
      onReady?.();
      startOrbit(Cesium, viewer);
    }

    /** Resolve when the first full set of tiles is up, or after a hard cap. */
    function waitForTiles(tileset: any): Promise<void> {
      return new Promise((resolve) => {
        let settled = false;
        let timeout = 0;
        let removeListener: (() => void) | undefined;
        const finish = () => {
          if (settled) return;
          settled = true;
          window.clearTimeout(timeout);
          removeListener?.();
          resolve();
        };
        // Never hold the experience hostage to a slow network.
        timeout = window.setTimeout(finish, 9000);
        removeListener = tileset.initialTilesLoaded?.addEventListener?.(finish);
        if (tileset.tilesLoaded) finish();
      });
    }

    /**
     * Prefer the backend's cached root tileset; fall back to Cesium's own loader.
     *
     * The fallback is correct but mints a fresh billable session on every page
     * load, so it is genuinely a fallback and not an equivalent path.
     */
    async function loadTileset(Cesium: any) {
      try {
        const resource = new Cesium.Resource({
          url: TILES_ROOT_URL,
          // Child URIs in the cached document are absolute Google URLs carrying
          // the session; Cesium derives them from this resource and so appends
          // the key to each one.
          queryParameters: { key: GOOGLE_MAPS_API_KEY },
        });
        const tileset = await Cesium.Cesium3DTileset.fromUrl(resource, {
          showCreditsOnScreen: false,
          credit: new Cesium.Credit('Google', false),
          ...TILESET_TUNING,
        });
        setSharedSession(true);
        return tileset;
      } catch (error) {
        console.warn(
          'Cached 3D Tiles root unavailable — falling back to a direct session. ' +
            'This costs one billable root request per page load.',
          error,
        );
        setSharedSession(false);
        return Cesium.createGooglePhotorealistic3DTileset({
          key: GOOGLE_MAPS_API_KEY,
          onlyUsingWithGoogleGeocoder: true,
          ...TILESET_TUNING,
        });
      }
    }

    function placeCamera(Cesium: any, activeViewer: any, headingDeg: number) {
      const { center, orbit } = config;
      activeViewer.camera.lookAt(
        Cesium.Cartesian3.fromDegrees(center.lng, center.lat, center.height_m),
        new Cesium.HeadingPitchRange(
          Cesium.Math.toRadians(headingDeg),
          Cesium.Math.toRadians(orbit.pitch_deg),
          orbit.radius_m,
        ),
      );
    }

    function startOrbit(Cesium: any, activeViewer: any) {
      const { orbit } = config;
      const startedAt = performance.now();
      let pausedForMs = 0;
      let pausedAt: number | null = null;

      const tick = () => {
        if (!viewerRef.current || viewerRef.current.isDestroyed()) return;

        if (pausedRef.current) {
          if (pausedAt === null) pausedAt = performance.now();
        } else if (pausedAt !== null) {
          pausedForMs += performance.now() - pausedAt;
          pausedAt = null;
        }

        const elapsed = (performance.now() - startedAt - pausedForMs) / 1000;
        const revolutions = elapsed / orbit.revolution_seconds;
        const heading =
          orbit.start_heading_deg + revolutions * 360 * (orbit.direction >= 0 ? 1 : -1);
        placeCamera(Cesium, activeViewer, heading);
        frameRef.current = requestAnimationFrame(tick);
      };
      frameRef.current = requestAnimationFrame(tick);
    }

    boot().catch((error: unknown) => {
      if (cancelled) return;
      const message = error instanceof Error ? error.message : String(error);
      console.error('Aerial view failed:', error);
      setState('failed');
      setDetail(message);
      onFailed?.(message);
    });

    return () => {
      cancelled = true;
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
      const active = viewerRef.current ?? viewer;
      if (active && !active.isDestroyed?.()) {
        try {
          active.camera.lookAtTransform(window.Cesium.Matrix4.IDENTITY);
        } catch {
          // The camera may already be torn down; destroying the viewer is what matters.
        }
        active.destroy();
      }
      viewerRef.current = null;
    };
    // config is stable for the lifetime of an experience; callbacks are refs in
    // practice. Re-running this effect would re-create the whole Cesium scene.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#05070c]">
      <div ref={containerRef} className="w-full h-full aerial-canvas" />

      {/* Cinematic vignette + letterbox so the orbit reads as an opening shot */}
      {state === 'ready' && (
        <>
          <div
            className="absolute inset-0 pointer-events-none animate-fade-in"
            style={{
              background:
                'radial-gradient(ellipse at center, transparent 45%, rgba(3,5,10,0.72) 100%)',
            }}
          />
          <div className="absolute top-0 left-0 right-0 h-20 pointer-events-none bg-gradient-to-b from-[#05070c] via-[#05070c]/50 to-transparent" />
        </>
      )}

      {state === 'loading' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-[#05070c]">
          <div className="orbit-spinner" aria-hidden="true">
            <span />
            <span />
          </div>
          <p className="text-sm text-amber-200/80 font-light tracking-wide">{detail}</p>
          <p className="text-[11px] text-stone-600 tracking-[0.2em] uppercase">
            Google Photorealistic 3D Tiles
          </p>
        </div>
      )}

      {state === 'failed' && (
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <div
            className="max-w-md rounded-2xl p-6 flex flex-col gap-3 text-center"
            style={{
              background: 'rgba(20,14,6,0.9)',
              border: '1px solid rgba(212,175,55,0.25)',
              backdropFilter: 'blur(14px)',
            }}
          >
            <Orbit className="w-6 h-6 mx-auto text-amber-400/70" strokeWidth={1.25} />
            <h3 className="font-display text-amber-200 text-xl" style={{ fontWeight: 400 }}>
              Aerial view unavailable
            </h3>
            <p className="text-xs text-stone-400 leading-relaxed">{detail}</p>
            <p className="text-[11px] text-stone-600 leading-relaxed">
              The 3D Tiles orbit needs the <strong>Map Tiles API</strong> enabled on your Google
              Cloud project. The guided walk and free roam use the Street View API and are
              unaffected — the tour will begin shortly.
            </p>
          </div>
        </div>
      )}

      {/* Attribution is a condition of using Google's imagery, so it stays
          visible whenever the scene is actually rendering. */}
      {state === 'ready' && (
        <div className="absolute bottom-3 right-4 z-20 flex items-center gap-2 text-[10px] text-stone-400/80">
          <span>Imagery © Google</span>
          {sharedSession && (
            <span
              className="px-1.5 py-0.5 rounded text-[9px] text-emerald-300/70"
              style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}
              title="Loaded from the backend's cached root tileset — one shared billable session"
            >
              cached session
            </span>
          )}
        </div>
      )}
    </div>
  );
};
