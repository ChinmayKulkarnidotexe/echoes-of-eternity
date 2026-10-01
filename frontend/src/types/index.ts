export interface POI {
  id: number;
  monument_id: number;
  name: string;
  facts_text: string;
  pano_heading: number;
  pano_pitch: number;
  pano_lat?: number;
  pano_lng?: number;
  order_index: number;
}

export interface Monument {
  id: number;
  name: string;
  description?: string;
  street_view_lat: number;
  street_view_lng: number;
  pois?: POI[];
}

export interface Painting {
  id: number;
  title: string;
  artist: string;
  year: string;
  facts_text: string;
  image_path: string;
}

export interface NarrationResponse {
  context_type: 'poi' | 'painting';
  context_id: number | string;
  title: string;
  narration: string;
  facts_text: string;
  lang?: string;
}

export type AskContextType = 'poi' | 'painting' | 'waypoint' | 'hotspot' | 'monument';

export interface AskResponse {
  question: string;
  answer: string;
  context_type: AskContextType;
  context_id: number | string;
  context_title: string;
  translated_question?: string;
  target_lang?: string;
}

// ---------------------------------------------------------------------------
// Voice — language and accent selection for narration (TTS) and questions (STT)
// ---------------------------------------------------------------------------

export interface AccentOption {
  code: string;       // BCP 47 locale e.g. 'en-US', 'en-GB'
  name: string;       // Country / Region name e.g. 'United States'
  flag: string;       // Emoji flag e.g. '🇺🇸'
}

export interface LanguageOption {
  id: string;         // 'en', 'es', etc.
  name: string;       // 'English', 'Spanish'
  nativeName: string; // 'English', 'Español'
  flag: string;
  accents: AccentOption[];
}

// ---------------------------------------------------------------------------
// Monument experience — the three-mode bundle served by GET /experience/{id}
// ---------------------------------------------------------------------------

/** The three modes run in order, then free roam continues indefinitely. */
export type ExperienceMode = 'aerial' | 'tour' | 'freeroam';

export interface LatLng {
  lat: number;
  lng: number;
}

export interface AerialBeat {
  id: string;
  index: number;
  title: string;
  narration: string;
  facts: string;
}

export interface AerialConfig {
  center: LatLng & { height_m: number };
  orbit: {
    radius_m: number;
    pitch_deg: number;
    start_heading_deg: number;
    revolution_seconds: number;
    direction: number;
  };
  beats: AerialBeat[];
}

export interface TourWaypoint {
  id: string;
  index: number;
  /** Pre-resolved panorama id — the tour never performs a live lookup. */
  pano_id: string;
  lat: number;
  lng: number;
  heading: number;
  pitch: number;
  zoom: number;
  /** Upper bound on how long to hold here if speech never reports completion. */
  dwell_s: number;
  title: string;
  subtitle: string;
  distance_to_statue_m: number;
  narration: string;
  facts: string;
}

export interface Hotspot {
  id: string;
  name: string;
  label: string;
  icon: string;
  lat: number;
  lng: number;
  /** Metres above island ground, so the hotspot floats at the real feature. */
  height_m: number;
  category: string;
  summary: string;
  facts: string;
}

export interface RoamPano {
  pano_id: string;
  lat: number;
  lng: number;
  label: string;
  heading_to_statue: number;
}

export interface FreeRoamConfig {
  start_pano_id: string;
  start_heading: number;
  start_pitch: number;
  pois: Hotspot[];
  panos: RoamPano[];
}

export interface ExperienceBundle {
  version: number;
  monument: {
    id: number;
    name: string;
    location: string;
    era: string;
    description: string;
    center: LatLng;
  };
  aerial: AerialConfig;
  tour: {
    waypoints: TourWaypoint[];
    estimated_seconds: number;
  };
  free_roam: FreeRoamConfig;
  /** Whether the tour script itself was rewritten by Gemini, or shipped authored. */
  narration_source: 'gemini' | 'authored';
  /** Whether the backend can answer free-form questions live. */
  live_answers?: boolean;
  from_cache?: boolean;
}

export interface TilesSessionStatus {
  active: boolean;
  session_prefix?: string;
  age_seconds?: number;
  expires_in_seconds?: number;
  ttl_seconds?: number;
}
