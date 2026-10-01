import type { POI, Painting, NarrationResponse, AskResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Built-in fallback data (PRD Risk Mitigation: works even without backend running)
const FALLBACK_POIS: POI[] = [
  {
    id: 1,
    monument_id: 1,
    name: "The Great Gate (Darwaza-i-Rauza)",
    facts_text: "The main gateway to the Taj Mahal complex, built in red sandstone with Quranic calligraphic arches.",
    pano_heading: 0,
    pano_pitch: 8,
    pano_lat: 27.173150,
    pano_lng: 78.042142,
    order_index: 1,
  },
  {
    id: 2,
    monument_id: 1,
    name: "Charbagh & The Long Reflecting Pool",
    facts_text: "The Persian-style quad garden with reflecting pool creating the famous mirrored vista of the white marble dome.",
    pano_heading: 0,
    pano_pitch: 0,
    pano_lat: 27.174100,
    pano_lng: 78.042142,
    order_index: 2,
  },
  {
    id: 3,
    monument_id: 1,
    name: "The Main Mausoleum & Central Dome",
    facts_text: "The iconic 35-meter white marble dome decorated with Pietra Dura inlays of 28 types of precious stones.",
    pano_heading: 0,
    pano_pitch: 14,
    pano_lat: 27.175000,
    pano_lng: 78.042142,
    order_index: 3,
  },
  {
    id: 4,
    monument_id: 1,
    name: "Yamuna Riverfront & Mosque Terrace",
    facts_text: "The northern sandstone terrace overlooking the Yamuna River, flanked by the Mosque and mirror Jawab.",
    pano_heading: 180,
    pano_pitch: -4,
    pano_lat: 27.175500,
    pano_lng: 78.042142,
    order_index: 4,
  },
];

const FALLBACK_PAINTINGS: Painting[] = [
  {
    id: 1,
    title: "The Starry Night",
    artist: "Vincent van Gogh",
    year: "1889",
    facts_text: "Painted in June 1889 from Saint-Paul asylum in Saint-Rémy. Swirling night sky with 11 stars and a cypress tree.",
    image_path: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg/1280px-Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg",
  },
  {
    id: 2,
    title: "Mona Lisa (La Gioconda)",
    artist: "Leonardo da Vinci",
    year: "1503–1519",
    facts_text: "Portrait of Lisa Gherardini using sfumato technique to blur outlines, known for her subtle shifting smile.",
    image_path: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg/800px-Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg",
  },
  {
    id: 3,
    title: "Under the Wave off Kanagawa",
    artist: "Katsushika Hokusai",
    year: "c. 1831",
    facts_text: "Iconic Japanese woodblock print showing towering rogue waves framing Mount Fuji with synthetic Prussian blue pigment.",
    image_path: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Tsunami_by_hokusai_19th_century.jpg/1280px-Tsunami_by_hokusai_19th_century.jpg",
  },
  {
    id: 4,
    title: "Girl with a Pearl Earring",
    artist: "Johannes Vermeer",
    year: "c. 1665",
    facts_text: "Dutch Golden Age tronie painting of a girl with a turban and oversized pearl earring created with lead white highlights.",
    image_path: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/1665_Girl_with_a_Pearl_Earring.jpg/800px-1665_Girl_with_a_Pearl_Earring.jpg",
  },
];

export async function fetchMonumentPois(monumentId: number = 1): Promise<POI[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/monuments/${monumentId}/pois`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn("Backend unavailable, using fallback POIs:", err);
    return FALLBACK_POIS;
  }
}

export async function fetchNarration(poiId: number): Promise<NarrationResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/narrate/${poiId}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn("Backend unavailable, using fallback narration:", err);
    const poi = FALLBACK_POIS.find((p) => p.id === poiId) || FALLBACK_POIS[0];
    return {
      context_type: 'poi',
      context_id: poi.id,
      title: poi.name,
      narration: `Welcome to ${poi.name}. Take in the view! ${poi.facts_text}`,
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
    console.warn("Backend unavailable, using fallback paintings:", err);
    return FALLBACK_PAINTINGS;
  }
}

export async function fetchPaintingInfo(paintingId: number): Promise<NarrationResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/painting-info/${paintingId}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn("Backend unavailable, using fallback painting info:", err);
    const painting = FALLBACK_PAINTINGS.find((p) => p.id === paintingId) || FALLBACK_PAINTINGS[0];
    return {
      context_type: 'painting',
      context_id: painting.id,
      title: `${painting.title} by ${painting.artist}`,
      narration: `Before you is '${painting.title}' created by ${painting.artist} around ${painting.year}. ${painting.facts_text}`,
      facts_text: painting.facts_text,
    };
  }
}

export async function askQuestion(
  contextType: 'poi' | 'painting',
  contextId: number,
  question: string
): Promise<AskResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        context_type: contextType,
        context_id: contextId,
        question: question,
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn("Backend unavailable, using fallback answer:", err);
    return {
      question,
      answer: `Great question! In our archives, this work is treasured for its artistry and cultural heritage. You asked "${question}" — notice the intricate details and colors that define this historical treasure.`,
      context_type: contextType,
      context_id: contextId,
      context_title: "Heritage Item",
    };
  }
}
