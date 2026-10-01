import type { POI, Painting, NarrationResponse, AskResponse } from '../types';

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
): Promise<NarrationResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/painting-info/${paintingId}`);
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
  contextType: "poi" | "painting",
  contextId: number,
  question: string,
): Promise<AskResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        context_type: contextType,
        context_id: contextId,
        question,
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
