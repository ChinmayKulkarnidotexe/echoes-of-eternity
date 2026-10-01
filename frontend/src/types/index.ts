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
  context_id: number;
  title: string;
  narration: string;
  facts_text: string;
}

export interface AskResponse {
  question: string;
  answer: string;
  context_type: 'poi' | 'painting';
  context_id: number;
  context_title: string;
}
