import type {
  AskContextType,
  AskResponse,
  ExperienceBundle,
  NarrationResponse,
  POI,
  Painting,
  TilesSessionStatus,
} from '../types';
import { FALLBACK_EXPERIENCE } from './fallbackExperience';
import { readCache, writeCache } from '../lib/clientCache';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// ---------------------------------------------------------------------------
// Fallback data — lets the frontend run even when the backend is offline
// (PRD §12: Risk Mitigation)
// ---------------------------------------------------------------------------
const FALLBACK_POIS: POI[] = [
  {
    id: 1,
    monument_id: 1,
    name: "The Pedestal & Fort Wood",
    facts_text:
      "The statue stands atop a granite pedestal resting on the star-shaped walls of Fort Wood, a military fortification completed in 1811. The pedestal was funded by over 120,000 everyday Americans.",
    pano_heading: 0,
    pano_pitch: 15,
    pano_lat: 40.6891,
    pano_lng: -74.0446,
    order_index: 1,
  },
  {
    id: 2,
    monument_id: 1,
    name: "The Copper Exterior & Crown",
    facts_text:
      "The exterior consists of ~300 copper sheets each only 2.4 mm thick. The crown has 25 windows and 7 rays representing the seven continents and oceans.",
    pano_heading: 45,
    pano_pitch: 30,
    pano_lat: 40.6893,
    pano_lng: -74.0444,
    order_index: 2,
  },
  {
    id: 3,
    monument_id: 1,
    name: "The Torch & Flame",
    facts_text:
      "The current flame is covered in 24-karat gold leaf, installed during the 1984-1986 centennial restoration. The original copper-and-glass torch is displayed in the pedestal lobby.",
    pano_heading: 350,
    pano_pitch: 45,
    pano_lat: 40.6894,
    pano_lng: -74.0445,
    order_index: 3,
  },
  {
    id: 4,
    monument_id: 1,
    name: "The Tablet & Broken Chains",
    facts_text:
      "Liberty holds a tablet inscribed 'JULY IV MDCCLXXVI' (July 4, 1776). At her feet lie broken chains and shackles symbolising the abolition of slavery.",
    pano_heading: 180,
    pano_pitch: 5,
    pano_lat: 40.689,
    pano_lng: -74.0447,
    order_index: 4,
  },
];

const FALLBACK_PAINTINGS: Painting[] = [
  {
    id: 1,
    title: "The Starry Night",
    artist: "Vincent van Gogh",
    year: "1889",
    facts_text:
      "Painted in June 1889 from the asylum in Saint-Rémy. Swirling sky vortices, 11 stars, and a towering cypress connecting heaven and earth.",
    image_path: "/paintings/starry_night.jpg",
  },
  {
    id: 2,
    title: "Mona Lisa (La Gioconda)",
    artist: "Leonardo da Vinci",
    year: "1503–1519",
    facts_text:
      "Portrait of Lisa Gherardini using sfumato technique. Her ambiguous smile shifts depending on where the viewer focuses.",
    image_path: "/paintings/mona_lisa.jpg",
  },
  {
    id: 3,
    title: "The Great Wave off Kanagawa",
    artist: "Katsushika Hokusai",
    year: "c. 1831",
    facts_text:
      "First print in 'Thirty-Six Views of Mount Fuji'. Rogue waves over cargo boats with Mt. Fuji in the background. Prussian blue pigment.",
    image_path: "/paintings/great_wave.jpg",
  },
  {
    id: 4,
    title: "Girl with a Pearl Earring",
    artist: "Johannes Vermeer",
    year: "c. 1665",
    facts_text:
      "Dutch Golden Age 'tronie'. The luminous pearl earring was painted with just two strokes of lead white. Resides in the Mauritshuis, The Hague.",
    image_path: "/paintings/pearl_earring.jpg",
  },
  {
    id: 5,
    title: "The Card Players",
    artist: "Paul Cézanne",
    year: "c. 1894–1895",
    facts_text:
      "Masterpiece from Cézanne's landmark series depicting Provençal peasant card players at Le Jas de Bouffan. Celebrated for its monumental geometry that heralded early Cubism.",
    image_path: "/paintings/card_players.jpg",
  },
  {
    id: 6,
    title: "Interchange",
    artist: "Willem de Kooning",
    year: "1955",
    facts_text:
      "Monumental abstract expressionist oil canvas marking De Kooning's transition into dynamic urban landscape painting. Sold in 2015 for $300 million.",
    image_path: "/paintings/interchange.jpg",
  },
  {
    id: 7,
    title: "The Red Vineyard at Arles",
    artist: "Vincent van Gogh",
    year: "1888",
    facts_text:
      "Painted in Arles in November 1888 under a blazing golden sun, capturing grape harvesters among red vines. Celebrated as the only painting officially sold during Van Gogh's lifetime.",
    image_path: "/paintings/red_vineyard.jpg",
  },
  {
    id: 8,
    title: "Salvator Mundi",
    artist: "Leonardo da Vinci",
    year: "c. 1499–1510",
    facts_text:
      "Renaissance masterpiece portraying Christ in blessing holding a celestial rock crystal orb. Renowned for Leonardo's sfumato and sold at auction for $450.3 million.",
    image_path: "/paintings/salvator_mundi.jpg",
  },
  {
    id: 9,
    title: "Rooftops in The Hague",
    artist: "Vincent van Gogh",
    year: "1882",
    facts_text:
      "Intimate early perspective study in watercolor and gouache painted from Van Gogh's attic studio on Schenkweg in The Hague, capturing red roofs, carpentry sheds, and smoking chimneys.",
    image_path: "/paintings/rooftops_hague.jpg",
  },
];

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

export async function fetchMonumentPois(
  monumentId: number = 1,
): Promise<POI[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/monuments/${monumentId}/pois`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn("Backend unavailable — using fallback POIs:", err);
    return FALLBACK_POIS;
  }
}

export async function fetchNarration(poiId: number): Promise<NarrationResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/narrate/${poiId}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn("Backend unavailable — using fallback narration:", err);
    const poi = FALLBACK_POIS.find((p) => p.id === poiId) || FALLBACK_POIS[0];
    return {
      context_type: "poi",
      context_id: poi.id,
      title: poi.name,
      narration: `Welcome to ${poi.name}. ${poi.facts_text}`,
      facts_text: poi.facts_text,
    };
  }
}

export async function fetchPaintings(): Promise<Painting[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/paintings`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn("Backend unavailable — using fallback paintings:", err);
    return FALLBACK_PAINTINGS;
  }
}

export async function fetchPaintingInfo(
  paintingId: number,
  lang: string = "en",
): Promise<NarrationResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/painting-info/${paintingId}?lang=${encodeURIComponent(lang)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn("Backend unavailable — using fallback painting info:", err);
    const painting =
      FALLBACK_PAINTINGS.find((p) => p.id === paintingId) ||
      FALLBACK_PAINTINGS[0];
    return {
      context_type: "painting",
      context_id: painting.id,
      title: `${painting.title} by ${painting.artist}`,
      narration: `Before you is '${painting.title}' by ${painting.artist} (${painting.year}). ${painting.facts_text}`,
      facts_text: painting.facts_text,
    };
  }
}

export async function askQuestion(
  contextType: AskContextType,
  contextId: number | string,
  question: string,
  targetLang: string = "en",
): Promise<AskResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        context_type: contextType,
        context_id: contextId,
        question,
        target_lang: targetLang,
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn("Backend unavailable — using fallback answer:", err);
    return {
      question,
      answer:
        "Great question! This piece is treasured for its artistry and cultural heritage. " +
        "Notice the intricate details and craftsmanship that define this historical treasure.",
      context_type: contextType,
      context_id: contextId,
      context_title: "Heritage Item",
    };
  }
}

// ---------------------------------------------------------------------------
// Monument experience
// ---------------------------------------------------------------------------

/** URL the Cesium renderer should load the Photorealistic 3D Tiles root from.
 *
 * Pointing at the backend rather than tile.googleapis.com is deliberate: Google
 * bills the root tileset request and refuses a caller-supplied session token, so
 * the only way for repeated page loads to share one billable session is to share
 * the cached root document the backend holds.
 */
export const TILES_ROOT_URL = `${API_BASE_URL}/maps/3dtiles/root.json`;

/** How long a locally cached bundle is served before re-fetching. */
const EXPERIENCE_CACHE_MS = 12 * 60 * 60 * 1000;

/**
 * Fetch the full three-mode experience bundle in one request.
 *
 * Served from localStorage first when a recent copy is present, so a reload
 * renders immediately instead of waiting on a round trip; the network copy then
 * replaces it quietly. Falls back to the generated offline bundle so a dropped
 * backend degrades the narration source, not the experience.
 */
export async function fetchExperience(
  monumentId: number = 1,
): Promise<{ bundle: ExperienceBundle; online: boolean }> {
  const cacheKey = `experience:${monumentId}`;

  try {
    const res = await fetch(`${API_BASE_URL}/experience/${monumentId}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const bundle = (await res.json()) as ExperienceBundle;
    writeCache(cacheKey, bundle);
    return { bundle, online: true };
  } catch (err) {
    const cached = readCache<ExperienceBundle>(cacheKey, EXPERIENCE_CACHE_MS);
    if (cached) {
      console.warn('Backend unreachable — using the locally cached bundle:', err);
      return { bundle: cached, online: false };
    }
    console.warn('Backend unavailable — using the offline experience bundle:', err);
    return { bundle: FALLBACK_EXPERIENCE, online: false };
  }
}

/** The most recent bundle this browser holds, if any — used to render instantly. */
export function peekCachedExperience(monumentId: number = 1): ExperienceBundle | null {
  return readCache<ExperienceBundle>(`experience:${monumentId}`, EXPERIENCE_CACHE_MS);
}

/** Read the cached 3D Tiles session state. Never triggers a billable request. */
export async function fetchTilesSession(): Promise<TilesSessionStatus> {
  try {
    const res = await fetch(`${API_BASE_URL}/maps/tiles-session`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch {
    return { active: false };
  }
}
