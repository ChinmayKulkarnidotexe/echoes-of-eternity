import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Landmark, Play, RotateCcw } from 'lucide-react';
import type { ExperienceBundle, ExperienceMode, Hotspot, LatLng } from '../../types';
import { fetchExperience } from '../../services/api';
import { primeVoices, speak, stopSpeaking } from '../../services/speech';
import { bearing, distanceMeters, pitchToLookAt } from '../../lib/geo';
import { useNarration } from '../../hooks/useNarration';
import { AerialOrbitView } from './AerialOrbitView';
import { StreetViewStage, type StreetViewTarget } from './StreetViewStage';
import { HotspotCard } from './HotspotCard';
import { NarrationBar } from './NarrationBar';
import { ModeStepper } from './ModeStepper';
import { FreeRoamHud } from './FreeRoamHud';

interface Props {
  monumentId?: number;
  onBack: () => void;
}

interface Transition {
  title: string;
  caption: string;
}

const TRANSITION_MS = 2300;

const FREE_ROAM_WELCOME =
  'She is yours now. Walk the path with the arrows on the ground, look wherever you like, ' +
  'and tap any marker to hear what it is. Ask me anything while you explore.';

/**
 * The monument experience: three modes that hand off to each other.
 *
 *   1. Aerial orbit over Google's Photorealistic 3D Tiles, narrated.
 *   2. A guided Street View walk — one full circuit of the statue, about three
 *      minutes, with look-around but no walking.
 *   3. Free roam in the same panorama network, with clickable hotspots.
 *
 * The Street View panorama is created once and deliberately kept mounted from
 * the moment the walk starts: a panorama load is a billable Google request, and
 * tearing the stage down between modes would pay for the same imagery twice.
 */
export const MonumentExperience: React.FC<Props> = ({ monumentId = 1, onBack }) => {
  const [bundle, setBundle] = useState<ExperienceBundle | null>(null);
  const [online, setOnline] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [started, setStarted] = useState(false);
  const [mode, setMode] = useState<ExperienceMode>('aerial');
  const [unlocked, setUnlocked] = useState<Set<ExperienceMode>>(new Set(['aerial']));
  const [transition, setTransition] = useState<Transition | null>(null);

  const [beatIndex, setBeatIndex] = useState(0);
  const [waypointIndex, setWaypointIndex] = useState(0);

  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(false);
  const [aerialFailed, setAerialFailed] = useState(false);

  const [streetViewEntered, setStreetViewEntered] = useState(false);
  const [svTarget, setSvTarget] = useState<StreetViewTarget | null>(null);
  const [panoPosition, setPanoPosition] = useState<LatLng | null>(null);
  const [currentPanoId, setCurrentPanoId] = useState<string | null>(null);
  const [activeHotspot, setActiveHotspot] = useState<Hotspot | null>(null);

  const aerialFallbackTimer = useRef<number | null>(null);

  // -------------------------------------------------------------------------
  // Load the whole experience in one request
  // -------------------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;
    primeVoices();
    fetchExperience(monumentId)
      .then(({ bundle: loaded, online: isOnline }) => {
        if (cancelled) return;
        setBundle(loaded);
        setOnline(isOnline);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setLoadError(error instanceof Error ? error.message : String(error));
      });
    return () => {
      cancelled = true;
      stopSpeaking();
    };
  }, [monumentId]);

  const unlock = useCallback((next: ExperienceMode) => {
    setUnlocked((previous) => {
      if (previous.has(next)) return previous;
      const updated = new Set(previous);
      updated.add(next);
      return updated;
    });
  }, []);

  /** Cross-fade to a new mode behind a full-screen title card. */
  const goToMode = useCallback(
    (next: ExperienceMode, card?: Transition) => {
      stopSpeaking();
      unlock(next);
      if (!card) {
        setMode(next);
        return;
      }
      setTransition(card);
      window.setTimeout(() => {
        setMode(next);
        setTransition(null);
      }, TRANSITION_MS);
    },
    [unlock],
  );

  // -------------------------------------------------------------------------
  // Mode 1 — aerial orbit narration
  // -------------------------------------------------------------------------
  const beats = bundle?.aerial.beats ?? [];
  const beat = beats[Math.min(beatIndex, Math.max(0, beats.length - 1))];

  const beginWalk = useCallback(() => {
    if (!bundle) return;
    const first = bundle.tour.waypoints[0];
    setWaypointIndex(0);
    setStreetViewEntered(true);
    setSvTarget({
      panoId: first.pano_id,
      heading: first.heading,
      pitch: first.pitch,
      zoom: first.zoom,
      settle: true,
    });
    goToMode('tour', {
      title: 'Down to the walkway',
      caption: 'Your guide will walk you once around her. Look wherever you like as we go.',
    });
  }, [bundle, goToMode]);

  const handleBeatComplete = useCallback(() => {
    if (beatIndex < beats.length - 1) {
      setBeatIndex((index) => index + 1);
    } else {
      beginWalk();
    }
  }, [beatIndex, beats.length, beginWalk]);

  const aerialNarration = useNarration({
    legKey: `aerial-${beat?.id ?? 'none'}`,
    text: beat?.narration ?? '',
    dwellMs: 17000,
    active: started && mode === 'aerial' && !transition && !!beat,
    paused,
    muted,
    onComplete: handleBeatComplete,
  });

  // If the 3D Tiles orbit cannot render at all, don't trap the visitor on a
  // dead screen — narrate the opening beat and move on to the walk.
  useEffect(() => {
    if (!aerialFailed || mode !== 'aerial' || !started) return;
    aerialFallbackTimer.current = window.setTimeout(beginWalk, 9000);
    return () => {
      if (aerialFallbackTimer.current !== null) {
        window.clearTimeout(aerialFallbackTimer.current);
        aerialFallbackTimer.current = null;
      }
    };
  }, [aerialFailed, mode, started, beginWalk]);

  // -------------------------------------------------------------------------
  // Mode 2 — guided walk
  // -------------------------------------------------------------------------
  const waypoints = bundle?.tour.waypoints ?? [];
  const waypoint = waypoints[Math.min(waypointIndex, Math.max(0, waypoints.length - 1))];

  const enterFreeRoam = useCallback(() => {
    if (!bundle) return;
    setStreetViewEntered(true);
    // Skipping the walk should not lock it away — the stepper still offers it,
    // so someone who jumped ahead can come back and take the tour properly.
    unlock('tour');
    // Start free roam from wherever the walk finished so no new panorama has to
    // be fetched; only a cold entry falls back to the configured start point.
    if (!currentPanoId) {
      setSvTarget({
        panoId: bundle.free_roam.start_pano_id,
        heading: bundle.free_roam.start_heading,
        pitch: bundle.free_roam.start_pitch,
        zoom: 1,
        settle: true,
      });
    } else {
      setSvTarget(null);
    }
    goToMode('freeroam', {
      title: 'Free roam',
      caption: 'Walk where you like. Tap a marker for its story, or ask your guide a question.',
    });
  }, [bundle, currentPanoId, goToMode, unlock]);

  const handleWaypointComplete = useCallback(() => {
    if (waypointIndex < waypoints.length - 1) {
      setWaypointIndex((index) => index + 1);
    } else {
      enterFreeRoam();
    }
  }, [waypointIndex, waypoints.length, enterFreeRoam]);

  const tourNarration = useNarration({
    legKey: `tour-${waypoint?.id ?? 'none'}`,
    text: waypoint?.narration ?? '',
    dwellMs: (waypoint?.dwell_s ?? 16) * 1000,
    active: started && mode === 'tour' && !transition && !!waypoint,
    paused,
    muted,
    onComplete: handleWaypointComplete,
  });

  // Move the camera as the walk advances.
  useEffect(() => {
    if (mode !== 'tour' || !waypoint) return;
    setSvTarget({
      panoId: waypoint.pano_id,
      heading: waypoint.heading,
      pitch: waypoint.pitch,
      zoom: waypoint.zoom,
      settle: true,
    });
  }, [mode, waypoint]);

  // -------------------------------------------------------------------------
  // Mode 3 — free roam
  // -------------------------------------------------------------------------
  const [freeRoamGreeted, setFreeRoamGreeted] = useState(false);

  useEffect(() => {
    if (mode !== 'freeroam' || freeRoamGreeted || transition) return;
    setFreeRoamGreeted(true);
    if (!muted) speak(FREE_ROAM_WELCOME);
  }, [mode, freeRoamGreeted, transition, muted]);

  /** Turn to face a hotspot without loading a new panorama. */
  const lookAtHotspot = useCallback(
    (hotspot: Hotspot) => {
      if (!panoPosition || !currentPanoId) return;
      const groundDistance = distanceMeters(panoPosition, hotspot);
      setSvTarget({
        panoId: currentPanoId,
        heading: bearing(panoPosition, hotspot),
        pitch: pitchToLookAt(groundDistance, hotspot.height_m),
        zoom: groundDistance > 120 ? 1.6 : 1.1,
        settle: true,
      });
    },
    [panoPosition, currentPanoId],
  );

  const jumpToPano = useCallback(
    (panoId: string, heading: number) => {
      setActiveHotspot(null);
      setSvTarget({ panoId, heading, pitch: 12, zoom: 0.9, settle: true });
    },
    [],
  );

  const handlePanoChange = useCallback((panoId: string, position: LatLng) => {
    if (panoId) setCurrentPanoId(panoId);
    setPanoPosition(position);
  }, []);

  const replayTour = useCallback(() => {
    setWaypointIndex(0);
    setActiveHotspot(null);
    setFreeRoamGreeted(false);
    setPaused(false);
    const first = bundle?.tour.waypoints[0];
    if (first) {
      setSvTarget({
        panoId: first.pano_id,
        heading: first.heading,
        pitch: first.pitch,
        zoom: first.zoom,
        settle: true,
      });
    }
    goToMode('tour', {
      title: 'From the top',
      caption: 'Replaying the guided walk around the monument.',
    });
  }, [bundle, goToMode]);

  const handleStepperSelect = useCallback(
    (next: ExperienceMode) => {
      if (next === mode) return;
      stopSpeaking();
      setActiveHotspot(null);
      setPaused(false);
      if (next === 'aerial') {
        setBeatIndex(0);
        setMode('aerial');
        return;
      }
      if (next === 'tour') {
        replayTour();
        return;
      }
      enterFreeRoam();
    },
    [mode, replayTour, enterFreeRoam],
  );

  const toggleMute = useCallback(() => {
    setMuted((previous) => {
      if (!previous) stopSpeaking();
      return !previous;
    });
  }, []);

  // -------------------------------------------------------------------------
  // Derived display state
  // -------------------------------------------------------------------------
  const caption = useMemo(() => {
    if (mode === 'aerial' && beat) {
      return {
        eyebrow: 'Aerial orbit · Photorealistic 3D Tiles',
        title: beat.title,
        text: beat.narration,
        progress: aerialNarration.progress,
        step: { current: beatIndex + 1, total: beats.length },
        speaking: aerialNarration.speaking,
      };
    }
    if (mode === 'tour' && waypoint) {
      return {
        eyebrow: `Guided walk · ${waypoint.subtitle}`,
        title: waypoint.title,
        text: waypoint.narration,
        progress: tourNarration.progress,
        step: { current: waypointIndex + 1, total: waypoints.length },
        speaking: tourNarration.speaking,
      };
    }
    return null;
  }, [
    mode,
    beat,
    beatIndex,
    beats.length,
    aerialNarration.progress,
    aerialNarration.speaking,
    waypoint,
    waypointIndex,
    waypoints.length,
    tourNarration.progress,
    tourNarration.speaking,
  ]);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  if (loadError) {
    return (
      <div className="min-h-screen bg-[#05070c] flex flex-col items-center justify-center gap-4 p-8 text-center">
        <Landmark className="w-7 h-7 text-amber-400/60" strokeWidth={1.25} />
        <h2 className="font-display text-amber-200 text-2xl" style={{ fontWeight: 300 }}>
          Could not load the experience
        </h2>
        <p className="text-xs text-stone-500 max-w-md">{loadError}</p>
        <button
          onClick={onBack}
          className="mt-2 px-5 py-2.5 rounded-xl text-sm text-stone-300 hover:text-amber-200 transition-colors"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          Go back
        </button>
      </div>
    );
  }

  if (!bundle) {
    return (
      <div className="min-h-screen bg-[#05070c] flex flex-col items-center justify-center gap-5">
        <div className="orbit-spinner" aria-hidden="true">
          <span />
          <span />
        </div>
        <p className="text-sm text-amber-200/70 font-light tracking-wide">
          Preparing the monument…
        </p>
      </div>
    );
  }

  const showStreetView = streetViewEntered;
  const streetViewVisible = mode === 'tour' || mode === 'freeroam';

  return (
    <div className="fixed inset-0 bg-[#05070c] overflow-hidden">
      {/* ---------------------------------------------------------------- Stage */}
      {mode === 'aerial' && (
        <AerialOrbitView
          config={bundle.aerial}
          paused={paused || !started}
          onFailed={() => setAerialFailed(true)}
        />
      )}

      {showStreetView && (
        <div
          className="absolute inset-0 transition-opacity duration-500"
          style={{
            opacity: streetViewVisible ? 1 : 0,
            pointerEvents: streetViewVisible ? 'auto' : 'none',
          }}
          aria-hidden={!streetViewVisible}
        >
          <StreetViewStage
            target={svTarget}
            locked={mode === 'tour'}
            hotspots={mode === 'freeroam' ? bundle.free_roam.pois : undefined}
            activeHotspotId={activeHotspot?.id ?? null}
            onHotspotSelect={setActiveHotspot}
            onPanoChange={handlePanoChange}
          />
        </div>
      )}

      {/* --------------------------------------------------------------- Header */}
      <header className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between gap-4 px-5 py-4 pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto">
          <button
            id="exit-experience"
            onClick={onBack}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-light text-stone-300 hover:text-amber-200 transition-colors"
            style={{
              background: 'rgba(10,8,5,0.7)',
              border: '1px solid rgba(255,255,255,0.08)',
              backdropFilter: 'blur(18px)',
            }}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Leave</span>
          </button>

          <div className="hidden md:flex flex-col leading-tight">
            <h1
              className="font-display text-gilt"
              style={{ fontSize: '1.15rem', fontWeight: 300 }}
            >
              {bundle.monument.name}
            </h1>
            <span className="text-[9px] text-stone-600 tracking-[0.18em] uppercase">
              {bundle.monument.location}
            </span>
          </div>
        </div>

        <div className="pointer-events-auto">
          <ModeStepper active={mode} unlocked={unlocked} onSelect={handleStepperSelect} />
        </div>

        <div className="hidden lg:flex items-center gap-2 pointer-events-auto">
          {!online && (
            <span
              className="px-2.5 py-1.5 rounded-lg text-[10px] text-amber-300/80"
              style={{
                background: 'rgba(120,80,10,0.3)',
                border: '1px solid rgba(212,175,55,0.22)',
              }}
              title="FastAPI is not reachable — running on the bundled offline tour script"
            >
              offline script
            </span>
          )}
          <span
            className="px-2.5 py-1.5 rounded-lg text-[10px] text-stone-500"
            style={{
              background: 'rgba(10,8,5,0.7)',
              border: '1px solid rgba(255,255,255,0.07)',
            }}
            title={
              bundle.live_answers
                ? 'Your questions are answered live by Gemini, grounded in this monument’s verified facts'
                : 'No Gemini key configured — questions fall back to the verified notes'
            }
          >
            {bundle.live_answers ? 'Ask anything · Gemini' : 'Offline answers'}
          </span>
        </div>
      </header>

      {/* ------------------------------------------------------- Caption + HUD */}
      {caption && !transition && started && (
        <NarrationBar
          eyebrow={caption.eyebrow}
          title={caption.title}
          text={caption.text}
          progress={caption.progress}
          step={caption.step}
          speaking={caption.speaking}
          paused={paused}
          muted={muted}
          onTogglePause={() => setPaused((previous) => !previous)}
          onToggleMute={toggleMute}
          onSkip={mode === 'aerial' ? beginWalk : enterFreeRoam}
          skipLabel={mode === 'aerial' ? 'Start the walk' : 'Skip to free roam'}
          // From the orbit you can drop into either of the stages below it, so
          // a visitor who already knows the monument — or a judge with three
          // minutes — is never made to sit through the walk first.
          onSecondarySkip={mode === 'aerial' ? enterFreeRoam : undefined}
          secondarySkipLabel="Straight to free roam"
        />
      )}

      {mode === 'freeroam' && !transition && (
        <FreeRoamHud
          monumentName={bundle.monument.name}
          hotspots={bundle.free_roam.pois}
          panos={bundle.free_roam.panos}
          currentPanoId={currentPanoId}
          activeHotspotId={activeHotspot?.id ?? null}
          muted={muted}
          onToggleMute={toggleMute}
          onSelectHotspot={(hotspot) => {
            setActiveHotspot(hotspot);
            lookAtHotspot(hotspot);
          }}
          onJumpToPano={jumpToPano}
          onReplayTour={replayTour}
        />
      )}

      {activeHotspot && mode === 'freeroam' && (
        <HotspotCard hotspot={activeHotspot} onClose={() => setActiveHotspot(null)} />
      )}

      {/* --------------------------------------------------- Mode title card */}
      {transition && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#05070c]/92 animate-fade-in">
          <div className="flex flex-col items-center gap-4 px-8 text-center max-w-lg">
            <div className="w-10 h-px bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />
            <h2
              className="font-display text-gilt"
              style={{ fontSize: 'clamp(1.8rem, 5vw, 3rem)', fontWeight: 300 }}
            >
              {transition.title}
            </h2>
            <p className="text-sm text-stone-400 font-light leading-relaxed">
              {transition.caption}
            </p>
            <div className="transition-rule mt-2" aria-hidden="true" />
          </div>
        </div>
      )}

      {/* ------------------------------------------------------ Start overlay */}
      {!started && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#05070c]/90 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-7 px-8 text-center max-w-xl animate-fade-up">
            <p className="text-[10px] font-medium tracking-[0.35em] uppercase text-amber-400/75">
              {bundle.monument.era} · {bundle.monument.location}
            </p>
            <h1
              className="font-display text-gilt"
              style={{ fontSize: 'clamp(2.4rem, 8vw, 5rem)', fontWeight: 300, lineHeight: 1.05 }}
            >
              {bundle.monument.name}
            </h1>
            <div className="w-20 h-px bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />

            <p className="text-sm text-stone-400 font-light leading-relaxed">
              An orbit from above, a guided walk once around her, then the island is yours. Your
              guide speaks aloud — headphones are worth it.
            </p>

            <button
              id="begin-experience"
              onClick={() => {
                primeVoices();
                setStarted(true);
              }}
              className="begin-button group flex items-center gap-3 px-7 py-3.5 rounded-full text-amber-950 text-sm font-medium"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Begin the experience</span>
            </button>

            <div className="flex items-center gap-5 text-[10px] text-stone-600 tracking-wider uppercase">
              <span>Aerial orbit</span>
              <span className="w-1 h-1 rounded-full bg-stone-700" />
              <span>
                {Math.round(bundle.tour.estimated_seconds / 60)} min walk ·{' '}
                {bundle.tour.waypoints.length} stops
              </span>
              <span className="w-1 h-1 rounded-full bg-stone-700" />
              <span>{bundle.free_roam.pois.length} hotspots</span>
            </div>
          </div>
        </div>
      )}

      {/* Paused scrim — makes it obvious the tour is waiting, not broken */}
      {paused && started && !transition && mode !== 'freeroam' && (
        <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
          <div
            className="flex items-center gap-2.5 px-5 py-3 rounded-2xl"
            style={{
              background: 'rgba(10,8,5,0.8)',
              border: '1px solid rgba(212,175,55,0.22)',
              backdropFilter: 'blur(16px)',
            }}
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400/70" />
            <span className="text-xs text-amber-100/80 font-light tracking-wide">
              Tour paused — look around as long as you like
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
