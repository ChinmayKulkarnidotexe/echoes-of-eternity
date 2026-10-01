import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import type { Painting, LanguageOption, AccentOption } from '../../types';
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Eye,
  BookOpen, Globe,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Layers,
} from 'lucide-react';
import { PaintingAskBar } from './PaintingAskBar';
import { LanguageDropdownUpward } from '../LanguageDropdownUpward';
import { DEFAULT_LANGUAGE, DEFAULT_ACCENT } from '../../data/languages';
import { getMuseumHeaders } from '../../utils/i18nHeaders';

interface Props {
  paintings?: Painting[];
  painting?: Painting;
  initialIndex?: number;
  onClose: () => void;
}

interface PaintingDetail {
  medium: string;
  location: string;
  facts: string[];
}

// ── Verified museum catalog details for each painting ────────
const DETAILS_BY_KEY: Record<string, PaintingDetail> = {
  starry: {
    medium: 'Oil on canvas · 73.7 × 92.1 cm',
    location: 'Museum of Modern Art, New York',
    facts: [
      'Painted while Van Gogh was a patient at the Saint-Paul-de-Mausole asylum.',
      'The swirling sky contains 11 stars and a crescent moon.',
      "Van Gogh considered it a failure; today it is MoMA's crown jewel.",
      'The cypress tree was a symbol of death in 19th-century Europe.',
    ],
  },
  mona: {
    medium: 'Oil on poplar panel · 77 × 53 cm',
    location: 'Musée du Louvre, Paris',
    facts: [
      'Worked on for over 16 years; Leonardo never delivered it to the patron.',
      'Her ambiguous smile shifts depending on where the viewer focuses.',
      'She has no visible eyebrows or eyelashes, which was high Florentine fashion.',
      'Protected behind custom triple-laminated bulletproof glass at the Louvre.',
    ],
  },
  wave: {
    medium: 'Woodblock print · 25.7 × 37.9 cm',
    location: 'Metropolitan Museum of Art, New York',
    facts: [
      "First of Hokusai's 'Thirty-Six Views of Mount Fuji' series, c. 1831.",
      'The Prussian blue pigment was a newly imported synthetic dye.',
      'Three boats of Oshiokuri fishermen are visible battling the wave.',
      'One of over 5,000 prints — Hokusai never considered it his best work.',
    ],
  },
  pearl: {
    medium: 'Oil on canvas · 44.5 × 39 cm',
    location: 'Mauritshuis, The Hague',
    facts: [
      "Not an actual portrait, but a 'tronie' — a study of an idealized character.",
      'Painted using genuine lapis lazuli ultramarine, an exceptionally costly pigment.',
      'The famous earring was painted with just two quick strokes of lead white paint.',
      "Known as the 'Mona Lisa of the North'; Vermeer left only 36 known works.",
    ],
  },
  card_players: {
    medium: 'Oil on canvas · 47.5 × 57 cm',
    location: "Musée d'Orsay, Paris",
    facts: [
      'Models were farmhands on the Cézanne family estate at Le Jas de Bouffan.',
      'Depicts silent, monumental concentration rather than traditional tavern drama.',
      'Part of a famous series of 5 paintings, one of which sold for over $250 million.',
      'Its pure planar geometry directly inspired Picasso and the birth of Cubism.',
    ],
  },
  interchange: {
    medium: 'Oil on canvas · 200.7 × 175.3 cm',
    location: 'Private collection · Art Institute of Chicago',
    facts: [
      "Marked De Kooning's transition from the 'Woman' series into abstract urban landscapes.",
      'Sold privately in September 2015 to Kenneth C. Griffin for $300 million.',
      'Kinetic brushwork in flesh tones, fiery orange, and blues captures 1950s NYC.',
      'Painted using commercial house painter brushes alongside traditional artist oils.',
    ],
  },
  red_vineyard: {
    medium: 'Oil on canvas · 75 × 93 cm',
    location: 'Pushkin State Museum of Fine Arts, Moscow',
    facts: [
      'Painted in Arles in November 1888 while living with Paul Gauguin.',
      'The only artwork documented as officially sold during Van Gogh’s lifetime.',
      'Purchased for 400 Belgian francs in 1890 by impressionist painter Anna Boch.',
      'Captures harvesters under a glowing sun amid vibrant wine-red foliage.',
    ],
  },
  salvator_mundi: {
    medium: 'Oil on walnut panel · 65.6 × 45.4 cm',
    location: 'Private collection (Louvre Abu Dhabi)',
    facts: [
      'Depicts Christ in blessing, holding a crystalline orb representing the heavens.',
      "Sold at Christie's New York in 2017 for $450.3 million, an all-time world record.",
      'Features Leonardo’s peerless sfumato and scientifically accurate crystal inclusions.',
      'Long believed lost or destroyed; rediscovered and authenticated in 2008.',
    ],
  },
  rooftops: {
    medium: 'Watercolor, gouache & pencil · 39 × 55.5 cm',
    location: 'Van Gogh Museum / Private collection',
    facts: [
      'Painted in May 1882 from the attic window of Van Gogh’s Schenkweg studio.',
      'One of his earliest ambitious perspective experiments using a handmade frame.',
      'Depicts the carpentry yard, laundry lines, and smoking chimneys of The Hague.',
      'Reflects young Van Gogh’s deep empathy for the everyday working-class world.',
    ],
  },
};

function getPaintingDetails(painting: Painting): PaintingDetail {
  const t = (painting.title || '').toLowerCase();
  if (t.includes('starry') || painting.id === 1) return DETAILS_BY_KEY.starry;
  if (t.includes('mona') || t.includes('gioconda') || painting.id === 2) return DETAILS_BY_KEY.mona;
  if (t.includes('wave') || t.includes('kanagawa') || painting.id === 3) return DETAILS_BY_KEY.wave;
  if (t.includes('pearl') || t.includes('earring') || painting.id === 4) return DETAILS_BY_KEY.pearl;
  if (t.includes('card') || t.includes('player') || painting.id === 5) return DETAILS_BY_KEY.card_players;
  if (t.includes('interchange') || painting.id === 6) return DETAILS_BY_KEY.interchange;
  if (t.includes('vineyard') || painting.id === 7) return DETAILS_BY_KEY.red_vineyard;
  if (t.includes('salvator') || t.includes('mundi') || painting.id === 8) return DETAILS_BY_KEY.salvator_mundi;
  if (t.includes('roof') || t.includes('hague') || painting.id === 9) return DETAILS_BY_KEY.rooftops;

  return {
    medium: 'Masterpiece · Fine Art',
    location: 'Permanent Collection',
    facts: painting.facts_text
      ? [painting.facts_text]
      : ['A celebrated work of historic cultural significance.'],
  };
}

// ── Canvas helper functions ──────────────────────────────────
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y + r, x + r, y);
  ctx.closePath();
}

function drawDiamond(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(cx, cy - r);
  ctx.lineTo(cx + r, cy);
  ctx.lineTo(cx, cy + r);
  ctx.lineTo(cx - r, cy);
  ctx.closePath();
  ctx.fill();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  startY: number,
  maxWidth: number,
  lineHeight: number,
): number {
  const words = text.split(' ');
  let line = '';
  let y = startY;
  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line, x, y);
      line = word;
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  if (line) {
    ctx.fillText(line, x, y);
  }
  return y;
}

// ── Ultra High-DPI canvas texture for the 3D museum stand ────
function buildLabelTexture(
  painting: Painting,
  langId: string = 'en',
  customFacts?: string[],
): THREE.CanvasTexture {
  const W = 1024;
  const H = 1480;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d')!;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  const headers = getMuseumHeaders(langId);

  // 1. Base dark background with warm vignette
  ctx.fillStyle = '#0d0a08';
  ctx.fillRect(0, 0, W, H);

  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, 'rgba(28, 22, 16, 0.95)');
  grad.addColorStop(0.5, 'rgba(14, 11, 9, 0.98)');
  grad.addColorStop(1, 'rgba(8, 6, 5, 1)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // 2. Elegant double borders
  ctx.strokeStyle = '#c8922a';
  ctx.lineWidth = 7;
  roundRect(ctx, 18, 18, W - 36, H - 36, 28);
  ctx.stroke();

  ctx.strokeStyle = '#5a4018';
  ctx.lineWidth = 2;
  roundRect(ctx, 32, 32, W - 64, H - 64, 20);
  ctx.stroke();

  ctx.fillStyle = '#d4af37';
  drawDiamond(ctx, 42, 42, 6);
  drawDiamond(ctx, W - 42, 42, 6);
  drawDiamond(ctx, 42, H - 42, 6);
  drawDiamond(ctx, W - 42, H - 42, 6);

  // 3. Header: "MUSEUM LABEL" (translated)
  ctx.fillStyle = '#d4af37';
  ctx.font = 'bold 26px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText(headers.museumLabel, 75, 110);

  // 4. Painting Title
  ctx.fillStyle = '#fbf7ee';
  ctx.font = 'bold 48px Georgia, serif';
  let y = wrapText(ctx, painting.title, 75, 180, W - 150, 58);

  // 5. Artist Name
  ctx.fillStyle = '#c8b69b';
  ctx.font = 'italic 34px Georgia, serif';
  y += 26;
  ctx.fillText(painting.artist, 75, y);

  // 6. Year
  ctx.fillStyle = '#948575';
  ctx.font = '26px Arial, sans-serif';
  y += 42;
  ctx.fillText(painting.year, 75, y);

  const details = getPaintingDetails(painting);
  const factsList = customFacts && customFacts.length > 0 ? customFacts : details.facts;

  // 7. Medium & Dimensions
  ctx.fillStyle = '#c98936';
  ctx.font = '26px Arial, sans-serif';
  y += 46;
  ctx.fillText(details.medium, 75, y);

  // 8. Museum Location
  ctx.fillStyle = '#857766';
  ctx.font = '24px Arial, sans-serif';
  y += 38;
  ctx.fillText(details.location, 75, y);

  // 9. Horizontal Divider
  y += 44;
  ctx.strokeStyle = '#3e2e18';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(75, y);
  ctx.lineTo(W - 75, y);
  ctx.stroke();

  ctx.fillStyle = '#d4af37';
  drawDiamond(ctx, W / 2, y, 7);

  // 10. Header: "DID YOU KNOW" (translated)
  y += 58;
  ctx.fillStyle = '#d4af37';
  ctx.font = 'bold 25px Georgia, serif';
  ctx.fillText(headers.didYouKnow, 75, y);

  // 11. Iconic Facts with Gold Diamond Bullets
  y += 52;
  for (const fact of factsList) {
    ctx.fillStyle = '#d4af37';
    drawDiamond(ctx, 84, y - 9, 8);

    ctx.fillStyle = '#ded9ce';
    ctx.font = '28px Georgia, serif';
    const nextY = wrapText(ctx, fact, 118, y, W - 195, 42);
    y = nextY + 38;
  }

  const texture = new THREE.CanvasTexture(c);
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  return texture;
}

// ── Realistic Wood Parquet Floor Texture ─────────────────────
function createWoodParquetTexture(): THREE.CanvasTexture {
  const S = 1024;
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const ctx = c.getContext('2d')!;

  ctx.fillStyle = '#221914';
  ctx.fillRect(0, 0, S, S);

  const tile = 128;
  const plankW = 32;

  for (let y = 0; y < S; y += tile) {
    for (let x = 0; x < S; x += tile) {
      const isHorizontal = ((x / tile) + (y / tile)) % 2 === 0;

      for (let p = 0; p < tile; p += plankW) {
        const shade = 34 + Math.floor(Math.random() * 18);
        const redShade = shade + 8;
        ctx.fillStyle = `rgb(${redShade}, ${shade}, ${Math.max(16, shade - 10)})`;

        if (isHorizontal) {
          ctx.fillRect(x, y + p, tile, plankW - 2);
          ctx.strokeStyle = '#140e0b';
          ctx.lineWidth = 2;
          ctx.strokeRect(x, y + p, tile, plankW - 2);
        } else {
          ctx.fillRect(x + p, y, plankW - 2, tile);
          ctx.strokeStyle = '#140e0b';
          ctx.lineWidth = 2;
          ctx.strokeRect(x + p, y, plankW - 2, tile);
        }
      }
    }
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(5, 7);
  return tex;
}

// ── Skylight Texture ─────────────────────────────────────────
function createSkylightTexture(): THREE.CanvasTexture {
  const S = 512;
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const ctx = c.getContext('2d')!;

  ctx.fillStyle = '#eaf2f8';
  ctx.fillRect(0, 0, S, S);

  const grad = ctx.createRadialGradient(S / 2, S / 2, 40, S / 2, S / 2, S / 2);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(0.7, '#d6e6f5');
  grad.addColorStop(1, '#b0cbe3');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, S, S);

  ctx.strokeStyle = '#32363e';
  ctx.lineWidth = 14;
  const step = 64;
  for (let i = step; i < S; i += step) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, S);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(S, i);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 6);
  return tex;
}

// ── Station Configuration Interface ─────────────────────────
interface StationConfig {
  paintingPos: THREE.Vector3;
  paintingRotY: number;
  standPos: THREE.Vector3;
  standRotY: number;
  baseTheta: number; // Natural view angle facing the artwork
  standFocusPos: THREE.Vector3;
}

// 4 Exhibition bays in the Grand Museum Hall
const STATIONS: StationConfig[] = [
  // 0. West Wall (Bay 1) — Starry Night
  {
    paintingPos: new THREE.Vector3(-9.82, 3.8, -5.5),
    paintingRotY: Math.PI / 2,
    standPos: new THREE.Vector3(-9.2, 0, -3.1),
    standRotY: Math.PI / 2 - 0.35,
    baseTheta: Math.PI / 2, // camera in +X looking -X
    standFocusPos: new THREE.Vector3(-9.2, 1.5, -3.1),
  },
  // 1. North Honor Wall (Center) — Mona Lisa
  {
    paintingPos: new THREE.Vector3(0, 3.8, -14.82),
    paintingRotY: 0,
    standPos: new THREE.Vector3(2.5, 0, -14.2),
    standRotY: -0.35,
    baseTheta: 0, // camera in +Z looking -Z
    standFocusPos: new THREE.Vector3(2.5, 1.5, -14.2),
  },
  // 2. East Wall (Bay 1) — The Great Wave
  {
    paintingPos: new THREE.Vector3(9.82, 3.8, -5.5),
    paintingRotY: -Math.PI / 2,
    standPos: new THREE.Vector3(9.2, 0, -3.1),
    standRotY: -Math.PI / 2 + 0.35,
    baseTheta: -Math.PI / 2, // camera in -X looking +X
    standFocusPos: new THREE.Vector3(9.2, 1.5, -3.1),
  },
  // 3. East Wall (Bay 2) — Girl with a Pearl Earring
  {
    paintingPos: new THREE.Vector3(9.82, 3.8, 5.5),
    paintingRotY: -Math.PI / 2,
    standPos: new THREE.Vector3(9.2, 0, 7.9),
    standRotY: -Math.PI / 2 - 0.35,
    baseTheta: -Math.PI / 2, // camera in -X looking +X
    standFocusPos: new THREE.Vector3(9.2, 1.5, 7.9),
  },
];

export const PaintingViewer: React.FC<Props> = ({
  paintings = [],
  painting,
  initialIndex = 0,
  onClose,
}) => {
  const allPaintings = paintings.length > 0 ? paintings : painting ? [painting] : [];
  const [currentIndex, setCurrentIndex] = useState(
    Math.max(0, Math.min(initialIndex, Math.max(0, allPaintings.length - 1))),
  );

  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const labelMeshRef = useRef<THREE.Mesh | null>(null);
  const animIdRef = useRef<number>(0);


  // Language & Accent State
  const [language, setLanguage] = useState<LanguageOption>(DEFAULT_LANGUAGE);
  const [accent, setAccent] = useState<AccentOption>(DEFAULT_ACCENT);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'both' | 'painting' | 'stand'>('both');
  const [showSketchfabModal, setShowSketchfabModal] = useState(false);

  // References for raycasting
  const canvasMeshesRef = useRef<(THREE.Mesh | null)[]>([]);
  const standGroupsRef = useRef<(THREE.Group | null)[]>([]);

  // ── True Spherical Orbit Camera State ───────────────────────
  // Target values (where camera wants to move to)
  const targetCenter = useRef(new THREE.Vector3(-9.5, 3.4, -4.3));
  const targetRadius = useRef(4.8);
  const targetTheta = useRef(Math.PI / 2);
  const targetPhi = useRef(Math.PI / 2);

  // Current values (smoothly lerped each frame in render loop)
  const currentCenter = useRef(new THREE.Vector3(-9.5, 3.4, -4.3));
  const currentRadius = useRef(4.8);
  const currentTheta = useRef(Math.PI / 2);
  const currentPhi = useRef(Math.PI / 2);

  // Mouse drag tracking
  const dragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });
  const downPos = useRef({ x: 0, y: 0 });

  const activePainting = allPaintings[currentIndex] || painting || null;

  // ── Update Camera Target Presets ────────────────────────────
  const applyViewMode = useCallback((stationIdx: number, view: 'both' | 'painting' | 'stand') => {
    const station = STATIONS[stationIdx % STATIONS.length];
    if (!station) return;

    if (view === 'painting') {
      // Direct close-up centered on the painting canvas
      targetCenter.current.copy(station.paintingPos);
      targetRadius.current = 3.3;
      targetTheta.current = station.baseTheta;
      targetPhi.current = Math.PI / 2;
    } else if (view === 'stand') {
      // Close-up angled onto the museum stanchion stand
      targetCenter.current.copy(station.standFocusPos);
      targetRadius.current = 1.85;
      targetTheta.current = station.baseTheta + (station.baseTheta === 0 ? -0.3 : 0.25);
      targetPhi.current = Math.PI / 2 - 0.22;
    } else {
      // Room View: wide overview framing both painting and stand
      const midpoint = new THREE.Vector3()
        .addVectors(station.paintingPos, station.standFocusPos)
        .multiplyScalar(0.5);
      targetCenter.current.copy(midpoint);
      targetRadius.current = 5.2;
      targetTheta.current = station.baseTheta;
      targetPhi.current = Math.PI / 2 - 0.05;
    }
  }, []);

  // Update target when station index or view mode changes
  useEffect(() => {
    applyViewMode(currentIndex, currentView);
  }, [currentIndex, currentView, applyViewMode]);

  // ── Station Navigation (Next / Prev) ────────────────────────
  const goToNext = useCallback(() => {
    if (allPaintings.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % allPaintings.length);
    setCurrentView('both');
  }, [allPaintings.length]);

  const goToPrev = useCallback(() => {
    if (allPaintings.length <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + allPaintings.length) % allPaintings.length);
    setCurrentView('both');
  }, [allPaintings.length]);

  // ── Keyboard Shortcuts (Arrow Keys & Mode Keys) ────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showSketchfabModal) return;
      if (e.key === 'ArrowRight') {
        goToNext();
      } else if (e.key === 'ArrowLeft') {
        goToPrev();
      } else if (e.key === '1' || e.key.toLowerCase() === 'r') {
        setCurrentView('both');
      } else if (e.key === '2' || e.key.toLowerCase() === 'a') {
        setCurrentView('painting');
      } else if (e.key === '3' || e.key.toLowerCase() === 's') {
        setCurrentView('stand');
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNext, goToPrev, onClose, showSketchfabModal]);

  // Repaint the stand's plaque whenever the work or the language changes, so the
  // label in the room is written in whatever language the visitor picked.
  useEffect(() => {
    if (!labelMeshRef.current || !activePainting) return;
    const newTex = buildLabelTexture(activePainting, language.id);
    const mat = labelMeshRef.current.material as THREE.MeshBasicMaterial;
    mat.map = newTex;
    mat.needsUpdate = true;
  }, [activePainting, language.id]);

  // ── Initialize Scene Once (Mounts 1 Time) ───────────────────
  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;
    const W = el.clientWidth || window.innerWidth;
    const H = el.clientHeight || window.innerHeight;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    rendererRef.current = renderer;
    el.appendChild(renderer.domElement);

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0e1015);
    scene.fog = new THREE.FogExp2(0x0e1015, 0.016);

    // Camera
    const camera = new THREE.PerspectiveCamera(46, W / H, 0.1, 100);
    cameraRef.current = camera;

    // Set initial position based on initialIndex
    const startStation = STATIONS[initialIndex % STATIONS.length] || STATIONS[0];
    const initialMid = new THREE.Vector3()
      .addVectors(startStation.paintingPos, startStation.standFocusPos)
      .multiplyScalar(0.5);

    targetCenter.current.copy(initialMid);
    currentCenter.current.copy(initialMid);
    targetRadius.current = 5.2;
    currentRadius.current = 5.2;
    targetTheta.current = startStation.baseTheta;
    currentTheta.current = startStation.baseTheta;
    targetPhi.current = Math.PI / 2 - 0.05;
    currentPhi.current = Math.PI / 2 - 0.05;

    camera.position.set(
      initialMid.x + 5.2 * Math.sin(Math.PI / 2 - 0.05) * Math.sin(startStation.baseTheta),
      initialMid.y + 5.2 * Math.cos(Math.PI / 2 - 0.05),
      initialMid.z + 5.2 * Math.sin(Math.PI / 2 - 0.05) * Math.cos(startStation.baseTheta),
    );
    camera.lookAt(initialMid);

    // ── 1. Architecture: Floor, Walls, Skylight ───────────────
    // Parquet Wood Floor
    const floorTex = createWoodParquetTexture();
    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTex,
      roughness: 0.35,
      metalness: 0.15,
    });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(20, 30), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, 0);
    floor.receiveShadow = true;
    scene.add(floor);

    // Charcoal Museum Walls
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x14161b,
      roughness: 0.88,
      metalness: 0.05,
    });

    // West Wall (Left)
    const westWall = new THREE.Mesh(new THREE.PlaneGeometry(30, 11), wallMat);
    westWall.position.set(-10, 5.5, 0);
    westWall.rotation.y = Math.PI / 2;
    westWall.receiveShadow = true;
    scene.add(westWall);

    // East Wall (Right)
    const eastWall = new THREE.Mesh(new THREE.PlaneGeometry(30, 11), wallMat);
    eastWall.position.set(10, 5.5, 0);
    eastWall.rotation.y = -Math.PI / 2;
    eastWall.receiveShadow = true;
    scene.add(eastWall);

    // North Wall (Honor Back Wall)
    const northWall = new THREE.Mesh(new THREE.PlaneGeometry(20, 11), wallMat);
    northWall.position.set(0, 5.5, -15);
    northWall.receiveShadow = true;
    scene.add(northWall);

    // South Wall (Entryway)
    const southWall = new THREE.Mesh(new THREE.PlaneGeometry(20, 11), wallMat);
    southWall.position.set(0, 5.5, 15);
    southWall.rotation.y = Math.PI;
    southWall.receiveShadow = true;
    scene.add(southWall);

    // Illuminated Entryway Arch at South Wall
    const doorLightMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(3.6, 6.2),
      new THREE.MeshBasicMaterial({ color: 0xfff3e0 }),
    );
    doorLightMesh.position.set(0, 3.1, 14.95);
    doorLightMesh.rotation.y = Math.PI;
    scene.add(doorLightMesh);

    // Coved Upper Ceiling Trim
    const covedMat = new THREE.MeshStandardMaterial({ color: 0xd8d4cb, roughness: 0.9 });
    const ceilingFrame = new THREE.Mesh(new THREE.PlaneGeometry(20, 30), covedMat);
    ceilingFrame.position.set(0, 11, 0);
    ceilingFrame.rotation.x = Math.PI / 2;
    scene.add(ceilingFrame);

    // Central Vaulted Arched Glass Skylight
    const skylightTex = createSkylightTexture();
    const skylightMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(8, 22),
      new THREE.MeshBasicMaterial({
        map: skylightTex,
        transparent: true,
        opacity: 0.92,
      }),
    );
    skylightMesh.position.set(0, 10.92, -1);
    skylightMesh.rotation.x = Math.PI / 2;
    scene.add(skylightMesh);

    // Central Exhibition Elements
    const platMat = new THREE.MeshStandardMaterial({ color: 0x16171b, roughness: 0.4, metalness: 0.3 });
    const platform = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.45, 8.4), platMat);
    platform.position.set(0, 0.225, -2);
    platform.receiveShadow = true;
    platform.castShadow = true;
    scene.add(platform);

    const benchMat = new THREE.MeshStandardMaterial({ color: 0x101012, roughness: 0.6, metalness: 0.1 });
    const bench = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.48, 2.6), benchMat);
    bench.position.set(0, 0.24, 6.5);
    bench.receiveShadow = true;
    bench.castShadow = true;
    scene.add(bench);

    // Perimeter Stanchion Rails
    const brassMat = new THREE.MeshStandardMaterial({ color: 0x7a602a, metalness: 0.85, roughness: 0.3 });
    const postGeo = new THREE.CylinderGeometry(0.035, 0.045, 0.65, 12);
    for (let z = -12; z <= 12; z += 3) {
      const postL = new THREE.Mesh(postGeo, brassMat);
      postL.position.set(-8.5, 0.325, z);
      scene.add(postL);

      const postR = new THREE.Mesh(postGeo, brassMat);
      postR.position.set(8.5, 0.325, z);
      scene.add(postR);
    }

    // Ambient & Skylight Lighting
    const skylightLight = new THREE.DirectionalLight(0xe8f0ff, 1.4);
    skylightLight.position.set(0, 10.5, 0);
    skylightLight.target.position.set(0, 0, 0);
    scene.add(skylightLight, skylightLight.target);

    const amb = new THREE.AmbientLight(0xfff1e0, 0.65);
    scene.add(amb);

    const doorPoint = new THREE.PointLight(0xffeedd, 1.8, 12, 1.2);
    doorPoint.position.set(0, 3.2, 13.5);
    scene.add(doorPoint);

    // ── 2. Build Painting Stations with Gilded Frames & Stands ──
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');

    const goldFrameMat = new THREE.MeshStandardMaterial({
      color: 0x9e7328,
      roughness: 0.32,
      metalness: 0.85,
    });
    const bronzeStandMat = new THREE.MeshStandardMaterial({
      color: 0x5a3d16,
      roughness: 0.35,
      metalness: 0.82,
    });
    const standFrameMat = new THREE.MeshStandardMaterial({
      color: 0x1f1810,
      roughness: 0.45,
      metalness: 0.65,
    });

    canvasMeshesRef.current = [];
    standGroupsRef.current = [];

    allPaintings.forEach((p, idx) => {
      const station = STATIONS[idx % STATIONS.length];
      if (!station) return;

      // Dedicated Spotlights
      const spot = new THREE.SpotLight(0xfff7e8, 5.8, 16, Math.PI / 7, 0.3, 1.0);
      const spotPos = station.paintingPos.clone().add(new THREE.Vector3(0, 4.5, 0));
      if (Math.abs(station.paintingRotY - Math.PI / 2) < 0.1) spotPos.x += 3.5;
      else if (Math.abs(station.paintingRotY) < 0.1) spotPos.z += 3.5;
      else spotPos.x -= 3.5;

      spot.position.copy(spotPos);
      spot.target.position.copy(station.paintingPos);
      spot.castShadow = true;
      spot.shadow.mapSize.set(1024, 1024);
      scene.add(spot, spot.target);

      const fillPt = new THREE.PointLight(0xffedd8, 1.8, 6, 1.2);
      const fillPos = station.paintingPos.clone();
      if (Math.abs(station.paintingRotY - Math.PI / 2) < 0.1) fillPos.x += 1.8;
      else if (Math.abs(station.paintingRotY) < 0.1) fillPos.z += 1.8;
      else fillPos.x -= 1.8;
      fillPt.position.copy(fillPos);
      scene.add(fillPt);

      // Painting Group
      const paintingGroup = new THREE.Group();
      paintingGroup.position.copy(station.paintingPos);
      paintingGroup.rotation.y = station.paintingRotY;

      loader.load(
        p.image_path,
        (tex) => {
          tex.generateMipmaps = true;
          tex.minFilter = THREE.LinearMipmapLinearFilter;
          tex.anisotropy = renderer.capabilities.getMaxAnisotropy();

          const aspect = tex.image.width / tex.image.height;
          let pw = 3.2;
          let ph = 3.2 / aspect;
          if (ph > 2.8) {
            ph = 2.8;
            pw = ph * aspect;
          }

          const canvasMesh = new THREE.Mesh(
            new THREE.PlaneGeometry(pw, ph),
            new THREE.MeshStandardMaterial({ map: tex, roughness: 0.45, metalness: 0.0 }),
          );
          canvasMesh.position.set(0, 0, 0.02);
          canvasMesh.castShadow = true;
          paintingGroup.add(canvasMesh);
          canvasMeshesRef.current[idx] = canvasMesh;

          // Ornate Frame
          const ft = 0.12;
          const fd = 0.16;
          const fTop = new THREE.Mesh(new THREE.BoxGeometry(pw + ft * 2, ft, fd), goldFrameMat);
          fTop.position.set(0, ph / 2 + ft / 2, -fd / 4);
          paintingGroup.add(fTop);

          const fBot = new THREE.Mesh(new THREE.BoxGeometry(pw + ft * 2, ft, fd), goldFrameMat);
          fBot.position.set(0, -ph / 2 - ft / 2, -fd / 4);
          paintingGroup.add(fBot);

          const fLeft = new THREE.Mesh(new THREE.BoxGeometry(ft, ph + ft * 2, fd), goldFrameMat);
          fLeft.position.set(-pw / 2 - ft / 2, 0, -fd / 4);
          paintingGroup.add(fLeft);

          const fRight = new THREE.Mesh(new THREE.BoxGeometry(ft, ph + ft * 2, fd), goldFrameMat);
          fRight.position.set(pw / 2 + ft / 2, 0, -fd / 4);
          paintingGroup.add(fRight);

          if (idx === allPaintings.length - 1) {
            setLoading(false);
          }
        },
        undefined,
        () => {
          const fallback = new THREE.Mesh(
            new THREE.PlaneGeometry(2.6, 2.6),
            new THREE.MeshStandardMaterial({ color: 0x3d284a }),
          );
          paintingGroup.add(fallback);
          canvasMeshesRef.current[idx] = fallback;
          setLoading(false);
        },
      );
      scene.add(paintingGroup);

      // 3D Bronze Stanchion Stand with High-DPI Plaque
      const standGroup = new THREE.Group();
      standGroup.position.copy(station.standPos);
      standGroup.rotation.y = station.standRotY;

      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.38, 0.08, 32), bronzeStandMat);
      base.position.set(0, 0.04, 0);
      standGroup.add(base);

      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.034, 1.45, 16), bronzeStandMat);
      pole.position.set(0, 0.76, 0);
      standGroup.add(pole);

      const plaqueG = new THREE.Group();
      plaqueG.position.set(0, 1.52, 0);
      plaqueG.rotation.x = -0.22;

      const plaqueW = 0.94;
      const plaqueH = 1.34;
      const plaqueD = 0.04;

      const plaqueBg = new THREE.Mesh(
        new THREE.BoxGeometry(plaqueW, plaqueH, plaqueD),
        standFrameMat,
      );
      plaqueG.add(plaqueBg);

      const bt = 0.03;
      const topRail = new THREE.Mesh(new THREE.BoxGeometry(plaqueW + 0.03, bt, bt * 1.5), bronzeStandMat);
      topRail.position.set(0, plaqueH / 2 + bt / 2, 0.005);
      plaqueG.add(topRail);

      const botRail = new THREE.Mesh(new THREE.BoxGeometry(plaqueW + 0.03, bt, bt * 1.5), bronzeStandMat);
      botRail.position.set(0, -plaqueH / 2 - bt / 2, 0.005);
      plaqueG.add(botRail);

      const lStile = new THREE.Mesh(new THREE.BoxGeometry(bt, plaqueH + bt * 2, bt * 1.5), bronzeStandMat);
      lStile.position.set(-plaqueW / 2 - bt / 2, 0, 0.005);
      plaqueG.add(lStile);

      const rStile = new THREE.Mesh(new THREE.BoxGeometry(bt, plaqueH + bt * 2, bt * 1.5), bronzeStandMat);
      rStile.position.set(plaqueW / 2 + bt / 2, 0, 0.005);
      plaqueG.add(rStile);

      const labelTex = buildLabelTexture(p);
      const labelMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(plaqueW - 0.02, plaqueH - 0.02),
        new THREE.MeshBasicMaterial({ map: labelTex }),
      );
      labelMesh.position.set(0, 0, plaqueD / 2 + 0.002);
      plaqueG.add(labelMesh);

      standGroup.add(plaqueG);
      scene.add(standGroup);
      standGroupsRef.current[idx] = standGroup;

      const standSpot = new THREE.SpotLight(0xfff3d8, 3.2, 8, Math.PI / 6.5, 0.4, 1.0);
      standSpot.position.copy(station.standPos).add(new THREE.Vector3(0.5, 3.2, 1.2));
      standSpot.target.position.copy(station.standPos).add(new THREE.Vector3(0, 1.4, 0));
      scene.add(standSpot, standSpot.target);
    });

    // ── 3. Render Loop: Continuous Smooth Spherical Interpolation ──
    const animate = () => {
      animIdRef.current = requestAnimationFrame(animate);

      // Smooth lerp of focal center, radius, azimuth theta, and polar phi
      const lerpSpeed = 0.065;
      currentCenter.current.lerp(targetCenter.current, lerpSpeed);
      currentRadius.current += (targetRadius.current - currentRadius.current) * lerpSpeed;
      currentTheta.current += (targetTheta.current - currentTheta.current) * lerpSpeed;
      currentPhi.current += (targetPhi.current - currentPhi.current) * lerpSpeed;

      if (cameraRef.current) {
        const center = currentCenter.current;
        const r = currentRadius.current;
        const th = currentTheta.current;
        const ph = currentPhi.current;

        // Spherical coordinate position
        cameraRef.current.position.set(
          center.x + r * Math.sin(ph) * Math.sin(th),
          center.y + r * Math.cos(ph),
          center.z + r * Math.sin(ph) * Math.cos(th),
        );
        cameraRef.current.lookAt(center);
      }

      renderer.render(scene, camera);
    };
    animate();

    // ── 4. Window Resize ───────────────────────────────────────
    const onResize = () => {
      if (!el || !cameraRef.current || !rendererRef.current) return;
      const nw = el.clientWidth;
      const nh = el.clientHeight;
      cameraRef.current.aspect = nw / nh;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(nw, nh);
    };
    window.addEventListener('resize', onResize);

    // ── 5. Full 3D Mouse Orbit Rotation & Raycast Click ────────
    const dom = renderer.domElement;
    const raycaster = new THREE.Raycaster();
    const mouseCoord = new THREE.Vector2();

    const onMouseDown = (e: MouseEvent) => {
      dragging.current = true;
      lastMouse.current = { x: e.clientX, y: e.clientY };
      downPos.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      const dx = e.clientX - lastMouse.current.x;
      const dy = e.clientY - lastMouse.current.y;
      lastMouse.current = { x: e.clientX, y: e.clientY };

      // Sensitivity factor
      const sensitivity = 0.005;

      // Rotate camera around target focal point in 3D
      targetTheta.current -= dx * sensitivity;
      targetPhi.current -= dy * sensitivity;

      // Clamp polar angle so user doesn't flip upside down
      targetPhi.current = Math.max(0.2, Math.min(Math.PI - 0.2, targetPhi.current));
    };

    const onMouseUp = (e: MouseEvent) => {
      dragging.current = false;
      const dist = Math.hypot(e.clientX - downPos.current.x, e.clientY - downPos.current.y);

      // Clean click (not a drag): raycast to focus painting or stand
      if (dist < 6 && cameraRef.current) {
        const rect = dom.getBoundingClientRect();
        mouseCoord.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouseCoord.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(mouseCoord, cameraRef.current);

        const currentCanvas = canvasMeshesRef.current[currentIndex];
        const currentStand = standGroupsRef.current[currentIndex];
        const targets = [currentCanvas, currentStand].filter(Boolean) as THREE.Object3D[];

        const hits = raycaster.intersectObjects(targets, true);
        if (hits.length > 0) {
          let hit = hits[0].object;
          let isStand = false;
          while (hit) {
            if (hit === currentStand) {
              isStand = true;
              break;
            }
            hit = hit.parent as THREE.Object3D;
          }
          if (isStand) {
            setCurrentView('stand');
          } else {
            setCurrentView('painting');
          }
        }
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      // Adjust target radius smoothly
      targetRadius.current = Math.max(1.6, Math.min(8.0, targetRadius.current + e.deltaY * 0.004));
    };

    dom.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    dom.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      cancelAnimationFrame(animIdRef.current);
      window.removeEventListener('resize', onResize);
      dom.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      dom.removeEventListener('wheel', onWheel);
      if (el.contains(dom)) el.removeChild(dom);
      renderer.dispose();
    };
  }, []); // Run ONCE on mount so scene is never torn down on station changes

  // ── Manual Zoom +/- Controls ────────────────────────────────
  const doZoom = (deltaFactor: number) => {
    targetRadius.current = Math.max(1.6, Math.min(8.0, targetRadius.current + deltaFactor));
  };

  const resetCam = () => {
    setCurrentView('both');
    applyViewMode(currentIndex, 'both');
  };

  return (
    <div className="relative w-full h-full select-none" style={{ minHeight: '100vh' }}>
      {/* Three.js Canvas Mount */}
      <div
        ref={mountRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        style={{ minHeight: '100vh' }}
      />

      {/* Loading Screen */}
      {loading && (
        <div
          className="absolute inset-0 z-50 flex flex-col items-center justify-center"
          style={{ background: 'rgba(8,6,8,0.97)' }}
        >
          <div className="w-12 h-12 border-2 border-amber-500/30 border-t-amber-400 rounded-full animate-spin mb-4" />
          <p className="font-display text-amber-200/90 text-xl font-light">
            Entering the Grand VR Museum Gallery…
          </p>
          <p className="text-xs text-stone-500 mt-2 font-light">
            Illuminating exhibition bays & museum stands
          </p>
        </div>
      )}

      {/* Top Header Bar */}
      <div
        className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-7 py-5 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, rgba(8,6,8,0.95) 0%, transparent 100%)' }}
      >
        {/* Active Painting Title & Bay Info */}
        <div className="flex flex-col gap-0.5 pointer-events-auto">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-mono px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Bay {currentIndex + 1} of {allPaintings.length}
            </span>
            <h2 className="font-display text-amber-100" style={{ fontSize: '1.45rem', fontWeight: 400 }}>
              {activePainting?.title || 'Masterpiece'}
            </h2>
          </div>
          <p className="text-xs text-stone-400 font-light">
            {activePainting?.artist} · {activePainting?.year}
          </p>
        </div>

        {/* View Mode Switcher (Room View / Artwork Focus / Stand Details) & Language Selector */}
        <div className="flex items-center gap-3">
          {/* Language Selector Button */}
          <button
            id="top-language-btn"
            onClick={() => setIsLangDropdownOpen((p) => !p)}
            className="pointer-events-auto flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium text-amber-200 hover:text-amber-100 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-all backdrop-blur-md shadow-sm"
            title="Change Language & Regional Accent"
          >
            <Globe className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-sm">{accent.flag}</span>
            <span className="font-serif">{language.nativeName}</span>
            <span className="text-[10px] text-amber-400/80 font-mono">({accent.name})</span>
          </button>

          {/* The picker itself. The button above only ever toggled a flag; the
              panel that acts on it has to be mounted for the choice to stick. */}
          <LanguageDropdownUpward
            isOpen={isLangDropdownOpen}
            onClose={() => setIsLangDropdownOpen(false)}
            currentLanguage={language}
            currentAccent={accent}
            onSelect={(nextLanguage, nextAccent) => {
              setLanguage(nextLanguage);
              setAccent(nextAccent);
              setIsLangDropdownOpen(false);
            }}
          />

          {/* Perspective switcher */}
          <div
            className="pointer-events-auto flex items-center gap-1 p-1 rounded-full"
            style={{
              background: 'rgba(18,14,10,0.88)',
              border: '1px solid rgba(212,175,55,0.25)',
              backdropFilter: 'blur(16px)',
            }}
          >
            <button
              id="view-overview"
              onClick={() => setCurrentView('both')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                currentView === 'both'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-[0_0_12px_rgba(212,175,55,0.2)]'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
              title="Overview of room and stand (Key: 1 or R)"
            >
              <Eye className="w-3.5 h-3.5" />
              Room View
            </button>
            <button
              id="view-painting"
              onClick={() => setCurrentView('painting')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                currentView === 'painting'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-[0_0_12px_rgba(212,175,55,0.2)]'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
              title="Focus close-up on artwork (Key: 2 or A)"
            >
              Artwork
            </button>
            <button
              id="view-stand"
              onClick={() => setCurrentView('stand')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                currentView === 'stand'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-[0_0_12px_rgba(212,175,55,0.2)]'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
              title="Read museum label stand details up close (Key: 3 or S)"
            >
              <BookOpen className="w-3.5 h-3.5" />
              Stand Details
            </button>
          </div>
        </div>

        {/* Right Actions */}
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Sketchfab Original 3D Room Embed Button */}
          <button
            id="open-sketchfab-modal"
            onClick={() => setShowSketchfabModal(true)}
            className="flex items-center gap-1.5 text-xs text-amber-300 hover:text-white transition-colors px-3 py-2 rounded-full"
            style={{
              background: 'rgba(212,175,55,0.12)',
              border: '1px solid rgba(212,175,55,0.3)',
              backdropFilter: 'blur(12px)',
            }}
            title="View original Sketchfab 3D room showcase"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Sketchfab 3D Room</span>
          </button>

          {/* Close Gallery */}
          <button
            id="close-gallery-room"
            onClick={onClose}
            className="flex items-center gap-1.5 text-xs text-stone-300 hover:text-white transition-colors px-4 py-2 rounded-full"
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.12)',
              backdropFilter: 'blur(12px)',
            }}
          >
            <X className="w-3.5 h-3.5" />
            Exit Gallery
          </button>
        </div>
      </div>

      {/* Floating Left / Right Painting Navigation Chevrons */}
      {allPaintings.length > 1 && !loading && (
        <>
          <button
            id="prev-painting-btn"
            onClick={goToPrev}
            className="absolute left-6 top-1/2 -translate-y-1/2 z-30 p-3.5 rounded-full text-stone-300 hover:text-amber-300 hover:scale-110 active:scale-95 transition-all shadow-xl group"
            style={{
              background: 'rgba(14,11,8,0.85)',
              border: '1px solid rgba(212,175,55,0.35)',
              backdropFilter: 'blur(16px)',
            }}
            title="Previous Masterpiece (← Arrow Key)"
          >
            <ChevronLeft className="w-6 h-6 transition-transform group-hover:-translate-x-0.5" />
          </button>

          <button
            id="next-painting-btn"
            onClick={goToNext}
            className="absolute right-6 top-1/2 -translate-y-1/2 z-30 p-3.5 rounded-full text-stone-300 hover:text-amber-300 hover:scale-110 active:scale-95 transition-all shadow-xl group"
            style={{
              background: 'rgba(14,11,8,0.85)',
              border: '1px solid rgba(212,175,55,0.35)',
              backdropFilter: 'blur(16px)',
            }}
            title="Next Masterpiece (→ Arrow Key)"
          >
            <ChevronRight className="w-6 h-6 transition-transform group-hover:translate-x-0.5" />
          </button>
        </>
      )}

      {/* Floating Zoom & Perspective Controls (Top-right) */}
      {!loading && (
        <div
          className="absolute top-24 right-7 z-30 flex flex-col items-center gap-1.5 p-2 rounded-2xl"
          style={{
            background: 'rgba(12,9,6,0.85)',
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(16px)',
          }}
        >
          <button
            id="zoom-in"
            onClick={() => doZoom(-0.7)}
            className="p-1.5 text-stone-400 hover:text-amber-300 transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            id="zoom-out"
            onClick={() => doZoom(0.7)}
            className="p-1.5 text-stone-400 hover:text-amber-300 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <div className="w-full h-px bg-stone-700/50" />
          <button
            id="reset-cam"
            onClick={resetCam}
            className="p-1.5 text-stone-400 hover:text-amber-300 transition-colors"
            title="Reset Perspective (Room View)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* AI Curator Ask Bar */}
      {!loading && activePainting && <PaintingAskBar painting={activePainting} />}

      {/* Bottom Masterpiece Quick-Jump Strip */}
      {allPaintings.length > 1 && !loading && (
        <div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-4 py-1.5 rounded-full shadow-2xl"
          style={{
            background: 'rgba(10,8,6,0.88)',
            border: '1px solid rgba(212,175,55,0.25)',
            backdropFilter: 'blur(20px)',
          }}
        >
          <span className="text-[10px] text-stone-400 font-mono tracking-wider uppercase mr-1">
            Masterpieces:
          </span>
          {allPaintings.map((p, idx) => (
            <button
              key={p.id || idx}
              onClick={() => {
                setCurrentIndex(idx);
                setCurrentView('both');
              }}
              className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                idx === currentIndex
                  ? 'bg-amber-500/25 text-amber-200 border border-amber-500/50 shadow-[0_0_12px_rgba(212,175,55,0.35)]'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-white/5 border border-transparent'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  idx === currentIndex ? 'bg-amber-400' : 'bg-stone-600'
                }`}
              />
              <span className="truncate max-w-[130px]">{p.title}</span>
            </button>
          ))}
        </div>
      )}

      {/* Subtle Interaction Guide at Bottom-Right */}
      {!loading && (
        <div className="absolute bottom-4 right-7 z-20 pointer-events-none hidden md:flex items-center gap-3 text-[11px] text-stone-500 font-light">
          <span>Drag mouse to orbit 360°</span>
          <span>·</span>
          <span>Wheel to zoom</span>
          <span>·</span>
          <span>Click canvas or stand to focus</span>
        </div>
      )}

      {/* ── Sketchfab Original Model Modal ────────────────────── */}
      {showSketchfabModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ background: 'rgba(4,3,5,0.92)', backdropFilter: 'blur(16px)' }}
        >
          <div
            className="relative w-full max-w-5xl h-[82vh] rounded-3xl overflow-hidden flex flex-col"
            style={{
              background: '#0d0f14',
              border: '1px solid rgba(212,175,55,0.3)',
              boxShadow: '0 25px 60px -15px rgba(0,0,0,0.8), 0 0 40px rgba(212,175,55,0.15)',
            }}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-black/40">
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 rounded-full text-[10px] font-mono uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Sketchfab 3D Embed
                </span>
                <h3 className="font-display text-stone-100 text-lg">
                  VR Gallery for Product Showcase 2021 by BehNaM
                </h3>
              </div>

              <div className="flex items-center gap-3">
                <a
                  href="https://sketchfab.com/3d-models/vr-gallery-for-product-showcase-2021-f2e60fcc4ab1467dbf8632fff422b4b7"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-xs text-amber-300 hover:text-white transition-colors px-3 py-1.5 rounded-full bg-white/5 border border-white/10"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Sketchfab Link</span>
                </a>
                <button
                  onClick={() => setShowSketchfabModal(false)}
                  className="p-1.5 rounded-full text-stone-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Content: The Exact Sketchfab Embed iframe */}
            <div className="flex-1 w-full h-full bg-black relative">
              <iframe
                title="VR Gallery for Product Showcase 2021"
                allowFullScreen
                allow="autoplay; fullscreen; xr-spatial-tracking"
                src="https://sketchfab.com/models/f2e60fcc4ab1467dbf8632fff422b4b7/embed?autostart=1"
                className="w-full h-full"
              />
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-white/[0.08] bg-black/60 flex items-center justify-between text-xs text-stone-400">
              <p>
                Interactive 3D tour features native fixed-station exhibition bays, 3D museum stands, and smooth orbit navigation.
              </p>
              <button
                onClick={() => setShowSketchfabModal(false)}
                className="px-4 py-1.5 rounded-full bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 transition-colors border border-amber-500/40 text-xs font-medium"
              >
                Back to Interactive Tour
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
