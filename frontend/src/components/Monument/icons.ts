import {
  Compass,
  Crown,
  Flame,
  Footprints,
  Landmark,
  Link2Off,
  Orbit,
  ScrollText,
  type LucideIcon,
} from 'lucide-react';

/**
 * Icon registry for the monument experience.
 *
 * The backend sends a stable slug per hotspot (`flame`, `crown`, …) rather than
 * a glyph, so the visual language lives here in one place and the tour data
 * stays free of presentation detail.
 */
const HOTSPOT_ICONS: Record<string, LucideIcon> = {
  flame: Flame,
  crown: Crown,
  tablet: ScrollText,
  chains: Link2Off,
  pedestal: Landmark,
};

export function hotspotIcon(slug: string): LucideIcon {
  return HOTSPOT_ICONS[slug] ?? Compass;
}

export const MODE_ICONS = {
  aerial: Orbit,
  tour: Footprints,
  freeroam: Compass,
} as const;
