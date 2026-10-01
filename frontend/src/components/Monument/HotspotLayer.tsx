import React, { useEffect, useRef } from 'react';
import type { Hotspot } from '../../types';
import { projectToScreen, type ProjectionView } from '../../lib/geo';
import { hotspotIcon } from './icons';

export type PanoView = ProjectionView;

interface Props {
  hotspots: Hotspot[];
  /** Live point of view, kept current by the panorama's own event listeners. */
  viewRef: React.RefObject<PanoView>;
  activeHotspotId?: string | null;
  onSelect?: (hotspot: Hotspot) => void;
}

/** Rough label footprint, in CSS pixels, used to detect a crowded cluster. */
const LABEL_WIDTH = 104;
const LABEL_HEIGHT = 34;

/**
 * Renders free-roam hotspots as HTML pinned to real-world positions.
 *
 * Positions are written straight to the DOM from a requestAnimationFrame loop
 * rather than through React state: the visitor drags the panorama continuously,
 * and re-rendering every hotspot each frame makes the labels visibly lag behind
 * the imagery they are supposed to be attached to.
 */
export const HotspotLayer: React.FC<Props> = ({
  hotspots,
  viewRef,
  activeHotspotId,
  onSelect,
}) => {
  const layerRef = useRef<HTMLDivElement>(null);
  const nodesRef = useRef<Map<string, HTMLButtonElement>>(new Map());
  const frameRef = useRef<number | null>(null);

  const activeRef = useRef(activeHotspotId);
  activeRef.current = activeHotspotId;

  useEffect(() => {
    // Reused between frames so the positioning loop allocates nothing.
    const placed: { x: number; y: number }[] = [];

    const tick = () => {
      const view = viewRef.current;
      const layer = layerRef.current;
      if (view && layer && view.width > 0) {
        placed.length = 0;

        // Project everything first, then lay the labels out nearest-first, so a
        // cluster collapses to dots instead of becoming a pile of overlapping
        // pills. Hotspot positions are spread around the statue's own geometry,
        // but a steep upward view can still bring two of them together.
        const points = [];
        for (const hotspot of hotspots) {
          const node = nodesRef.current.get(hotspot.id);
          if (!node) continue;
          const point = projectToScreen(
            { lat: hotspot.lat, lng: hotspot.lng, height_m: hotspot.height_m },
            view,
          );
          points.push({ hotspot, node, point });
        }

        // The selected hotspot always keeps its label; otherwise nearest wins.
        points.sort((a, b) => {
          if (a.hotspot.id === activeRef.current) return -1;
          if (b.hotspot.id === activeRef.current) return 1;
          return a.point.distance - b.point.distance;
        });

        for (const { hotspot, node, point } of points) {
          if (!point.visible) {
            node.style.opacity = '0';
            node.style.pointerEvents = 'none';
            continue;
          }

          const x = point.x * view.width;
          const y = point.y * view.height;

          const crowded = placed.some(
            (p) => Math.abs(p.x - x) < LABEL_WIDTH && Math.abs(p.y - y) < LABEL_HEIGHT,
          );
          node.classList.toggle(
            'hotspot-collapsed',
            crowded && hotspot.id !== activeRef.current,
          );
          placed.push({ x, y });

          node.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
          node.style.opacity = '1';
          node.style.pointerEvents = 'auto';
        }
      }
      frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    };
  }, [hotspots, viewRef]);

  return (
    <div ref={layerRef} className="absolute inset-0 pointer-events-none z-20">
      {hotspots.map((hotspot) => {
        const Icon = hotspotIcon(hotspot.icon);
        const isActive = activeHotspotId === hotspot.id;
        return (
          <button
            key={hotspot.id}
            id={`hotspot-${hotspot.id}`}
            ref={(node) => {
              if (node) nodesRef.current.set(hotspot.id, node);
              else nodesRef.current.delete(hotspot.id);
            }}
            onClick={() => onSelect?.(hotspot)}
            className={`hotspot group absolute top-0 left-0 flex items-center gap-2 rounded-full pl-1.5 pr-3 py-1.5 whitespace-nowrap ${
              isActive ? 'hotspot-active' : ''
            }`}
            style={{ opacity: 0, willChange: 'transform, opacity' }}
            aria-label={`${hotspot.name} — ${hotspot.summary}`}
          >
            <span className="hotspot-dot" aria-hidden="true">
              <Icon className="w-3 h-3" strokeWidth={1.75} />
            </span>
            <span className="hotspot-text flex flex-col items-start leading-tight">
              <span className="text-[11px] font-medium text-amber-100">{hotspot.label}</span>
              <span className="text-[9px] text-amber-200/45 tracking-wide">
                {hotspot.category}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
};
