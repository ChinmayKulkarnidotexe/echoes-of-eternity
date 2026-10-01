import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import type { Painting, LanguageOption, AccentOption } from '../../types';
import { X, ZoomIn, ZoomOut, RotateCcw, Eye, BookOpen, Globe } from 'lucide-react';
import { GalleryVoicePanel } from './GalleryVoicePanel';
import { DEFAULT_LANGUAGE, DEFAULT_ACCENT } from '../../data/languages';
import { getMuseumHeaders } from '../../utils/i18nHeaders';

interface Props {
  painting: Painting;
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
  ctx.quadraticCurveTo(x, y, x + r, y);
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
  // Outer gold rim
  ctx.strokeStyle = '#c8922a';
  ctx.lineWidth = 7;
  roundRect(ctx, 18, 18, W - 36, H - 36, 28);
  ctx.stroke();

  // Inner hairline gold frame
  ctx.strokeStyle = '#5a4018';
  ctx.lineWidth = 2;
  roundRect(ctx, 32, 32, W - 64, H - 64, 20);
  ctx.stroke();

  // Corner decorative diamond marks
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
  ctx.font = 'bold 50px Georgia, serif';
  let y = wrapText(ctx, painting.title, 75, 180, W - 150, 60);

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

  // Fetch verified museum catalog details
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

  // Gold center accent on divider
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
    // Diamond bullet
    ctx.fillStyle = '#d4af37';
    drawDiamond(ctx, 84, y - 9, 8);

    // Fact text with clean word-wrap
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

export const PaintingViewer: React.FC<Props> = ({ painting, onClose }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const canvasMeshRef = useRef<THREE.Mesh | null>(null);
  const plaqueMeshRef = useRef<THREE.Group | null>(null);
  const labelMeshRef = useRef<THREE.Mesh | null>(null);
  const animIdRef = useRef<number>(0);

  // Language & Accent State
  const [language, setLanguage] = useState<LanguageOption>(DEFAULT_LANGUAGE);
  const [accent, setAccent] = useState<AccentOption>(DEFAULT_ACCENT);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(1.0);
  const [currentView, setCurrentView] = useState<'both' | 'painting' | 'stand'>('both');

  // Spherical camera orbit state
  const sph = useRef({ theta: 0.12, phi: Math.PI / 2, r: 5.4 });
  const lookTarget = useRef(new THREE.Vector3(0.5, 0.2, 0));
  const dragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });
  const downPos = useRef({ x: 0, y: 0 });

  const updateCamera = useCallback(() => {
    const cam = cameraRef.current;
    if (!cam) return;
    const { theta, phi, r } = sph.current;
    const target = lookTarget.current;
    cam.position.set(
      target.x + r * Math.sin(phi) * Math.sin(theta),
      target.y + r * Math.cos(phi),
      target.z + r * Math.sin(phi) * Math.cos(theta),
    );
    cam.lookAt(target);
  }, []);

  const focusPainting = useCallback(() => {
    setCurrentView('painting');
    lookTarget.current.set(0, 0.5, 0);
    sph.current = { theta: 0, phi: Math.PI / 2, r: 4.8 };
    setZoom(1.1);
    updateCamera();
  }, [updateCamera]);

  const focusStand = useCallback(() => {
    setCurrentView('stand');
    lookTarget.current.set(2.45, -0.38, 0.9);
    sph.current = { theta: -0.34, phi: Math.PI / 2 - 0.2, r: 2.1 };
    setZoom(2.6);
    updateCamera();
  }, [updateCamera]);

  const focusOverview = useCallback(() => {
    setCurrentView('both');
    lookTarget.current.set(0.6, 0.15, 0);
    sph.current = { theta: 0.12, phi: Math.PI / 2, r: 5.4 };
    setZoom(1.0);
    updateCamera();
  }, [updateCamera]);

  // Update Stand Plaque Canvas Texture on language change
  useEffect(() => {
    if (labelMeshRef.current) {
      const newTex = buildLabelTexture(painting, language.id);
      const mat = labelMeshRef.current.material as THREE.MeshBasicMaterial;
      mat.map = newTex;
      mat.needsUpdate = true;
    }
  }, [painting, language.id]);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;
    const W = el.clientWidth || window.innerWidth;
    const H = el.clientHeight || window.innerHeight;

    // ── Renderer ──────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.NoToneMapping;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    rendererRef.current = renderer;
    el.appendChild(renderer.domElement);

    // ── Scene ─────────────────────────────────────────────────
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x080608);
    scene.fog = new THREE.FogExp2(0x080608, 0.035);

    // ── Camera ────────────────────────────────────────────────
    const camera = new THREE.PerspectiveCamera(46, W / H, 0.1, 80);
    cameraRef.current = camera;
    updateCamera();

    // ── Room Architecture ─────────────────────────────────────
    // Polished dark floor
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(26, 26),
      new THREE.MeshStandardMaterial({ color: 0x0c0a0c, roughness: 0.28, metalness: 0.55 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -3.8;
    floor.receiveShadow = true;
    scene.add(floor);

    // Walls
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x0e0b0e, roughness: 0.88 });
    const backWall = new THREE.Mesh(new THREE.PlaneGeometry(26, 16), wallMat);
    backWall.position.set(0, 4, -7);
    backWall.receiveShadow = true;
    scene.add(backWall);

    [[-13, 0, Math.PI / 2], [13, 0, -Math.PI / 2]].forEach(([x, , ry]) => {
      const w = new THREE.Mesh(new THREE.PlaneGeometry(16, 16), wallMat);
      w.rotation.y = ry as number;
      w.position.set(x as number, 4, 0);
      scene.add(w);
    });

    const ceiling = new THREE.Mesh(
      new THREE.PlaneGeometry(26, 26),
      new THREE.MeshStandardMaterial({ color: 0x0a080b }),
    );
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = 8;
    scene.add(ceiling);

    // ── Rich Lighting Rig ─────────────────────────────────────
    scene.add(new THREE.AmbientLight(0xfff0e6, 0.58));

    // ① Main Painting Spotlight
    const spotMain = new THREE.SpotLight(0xfff6e4, 5.5, 24, Math.PI / 7.2, 0.28, 1.0);
    spotMain.position.set(0, 7, 3.8);
    spotMain.target.position.set(0, 0.5, 0);
    spotMain.castShadow = true;
    spotMain.shadow.mapSize.set(2048, 2048);
    scene.add(spotMain, spotMain.target);

    // ② Close Front Fill for painting brilliance
    const ptFront = new THREE.PointLight(0xffeedd, 2.8, 7, 1.0);
    ptFront.position.set(0, 0.8, 2.6);
    scene.add(ptFront);

    // ③ Left Kicker Light
    const spotLeft = new THREE.SpotLight(0xffe2c4, 2.5, 18, Math.PI / 8, 0.5, 1.2);
    spotLeft.position.set(-4.5, 5, 4);
    spotLeft.target.position.set(0, 0.5, 0);
    scene.add(spotLeft, spotLeft.target);

    // ④ Dedicated Museum Stand Spotlight
    const spotStand = new THREE.SpotLight(0xfff2d4, 4.8, 14, Math.PI / 6.5, 0.4, 1.0);
    spotStand.position.set(4.2, 4.8, 3.2);
    spotStand.target.position.set(2.45, -0.38, 0.9);
    scene.add(spotStand, spotStand.target);

    // ⑤ Stand Glow PointLight
    const ptStand = new THREE.PointLight(0xffdfa0, 2.6, 5.5, 1.0);
    ptStand.position.set(2.45, 0.35, 1.6);
    scene.add(ptStand);

    // ⑥ Rear depth rim
    const rimBack = new THREE.PointLight(0x351a4f, 2.0, 10, 1.2);
    rimBack.position.set(0, 1, -5);
    scene.add(rimBack);

    // ── 3D MUSEUM STAND WITH DETAILS PLAQUE ────────────────────
    const bronzeMat = new THREE.MeshStandardMaterial({
      color: 0x5a3d16,
      roughness: 0.35,
      metalness: 0.82,
    });
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x1f1810,
      roughness: 0.45,
      metalness: 0.65,
    });

    const standGroup = new THREE.Group();

    // 1. Heavy circular base plate
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.38, 0.08, 32), bronzeMat);
    base.position.set(2.45, -3.76, 0.9);
    base.receiveShadow = true;
    standGroup.add(base);

    const baseRing = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.04, 32), bronzeMat);
    baseRing.position.set(2.45, -3.71, 0.9);
    standGroup.add(baseRing);

    // 2. Upright stanchion post
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.034, 2.7, 16), bronzeMat);
    pole.position.set(2.45, -2.35, 0.9);
    pole.castShadow = true;
    standGroup.add(pole);

    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.06, 16), bronzeMat);
    collar.position.set(2.45, -0.98, 0.9);
    standGroup.add(collar);

    // 3. Plaque Group (angled toward viewer)
    const plaqueG = new THREE.Group();
    plaqueG.position.set(2.45, -0.38, 0.9);
    plaqueG.rotation.x = -0.2;
    plaqueG.rotation.y = -0.34;

    const plaqueWidth = 0.96;
    const plaqueHeight = 1.38;
    const plaqueDepth = 0.04;

    // Backing box
    const plaqueBg = new THREE.Mesh(
      new THREE.BoxGeometry(plaqueWidth, plaqueHeight, plaqueDepth),
      frameMat,
    );
    plaqueG.add(plaqueBg);

    // Raised bronze border trims
    const borderThick = 0.035;
    const borderDepth = 0.052;

    const topRail = new THREE.Mesh(
      new THREE.BoxGeometry(plaqueWidth + 0.04, borderThick, borderDepth),
      bronzeMat,
    );
    topRail.position.set(0, plaqueHeight / 2 + borderThick / 2, 0.006);
    plaqueG.add(topRail);

    const botRail = new THREE.Mesh(
      new THREE.BoxGeometry(plaqueWidth + 0.04, borderThick, borderDepth),
      bronzeMat,
    );
    botRail.position.set(0, -plaqueHeight / 2 - borderThick / 2, 0.006);
    plaqueG.add(botRail);

    const leftStile = new THREE.Mesh(
      new THREE.BoxGeometry(borderThick, plaqueHeight + borderThick * 2, borderDepth),
      bronzeMat,
    );
    leftStile.position.set(-plaqueWidth / 2 - borderThick / 2, 0, 0.006);
    plaqueG.add(leftStile);

    const rightStile = new THREE.Mesh(
      new THREE.BoxGeometry(borderThick, plaqueHeight + borderThick * 2, borderDepth),
      bronzeMat,
    );
    rightStile.position.set(plaqueWidth / 2 + borderThick / 2, 0, 0.006);
    plaqueG.add(rightStile);

    // 4. Baked High-DPI Museum Label Plaque Face
    const labelTex = buildLabelTexture(painting, language.id);
    const labelMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(plaqueWidth - 0.02, plaqueHeight - 0.02),
      new THREE.MeshBasicMaterial({ map: labelTex }),
    );
    labelMesh.position.set(0, 0, plaqueDepth / 2 + 0.002);
    plaqueG.add(labelMesh);
    labelMeshRef.current = labelMesh;

    plaqueMeshRef.current = plaqueG;
    standGroup.add(plaqueG);
    scene.add(standGroup);

    // ── Load Painting Texture ─────────────────────────────────
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');

    loader.load(
      painting.image_path,
      (tex) => {
        tex.generateMipmaps = true;
        tex.minFilter = THREE.LinearMipmapLinearFilter;
        tex.anisotropy = renderer.capabilities.getMaxAnisotropy();

        const aspect = tex.image.width / tex.image.height;
        let pw = 3.1;
        let ph = 3.1 / aspect;
        if (ph > 2.9) {
          ph = 2.9;
          pw = ph * aspect;
        }

        const canvasMesh = new THREE.Mesh(
          new THREE.PlaneGeometry(pw, ph),
          new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5, metalness: 0.0 }),
        );
        canvasMesh.position.set(0, 0.5, 0);
        canvasMesh.castShadow = true;
        scene.add(canvasMesh);
        canvasMeshRef.current = canvasMesh;

        // Elegant ornate gilded frame
        const frameGold = new THREE.MeshStandardMaterial({
          color: 0x9e7328,
          roughness: 0.32,
          metalness: 0.85,
        });
        const ft = 0.12;
        const fd = 0.16;

        const fTop = new THREE.Mesh(new THREE.BoxGeometry(pw + ft * 2, ft, fd), frameGold);
        fTop.position.set(0, 0.5 + ph / 2 + ft / 2, -fd / 4);
        scene.add(fTop);

        const fBot = new THREE.Mesh(new THREE.BoxGeometry(pw + ft * 2, ft, fd), frameGold);
        fBot.position.set(0, 0.5 - ph / 2 - ft / 2, -fd / 4);
        scene.add(fBot);

        const fLeft = new THREE.Mesh(new THREE.BoxGeometry(ft, ph + ft * 2, fd), frameGold);
        fLeft.position.set(-pw / 2 - ft / 2, 0.5, -fd / 4);
        scene.add(fLeft);

        const fRight = new THREE.Mesh(new THREE.BoxGeometry(ft, ph + ft * 2, fd), frameGold);
        fRight.position.set(pw / 2 + ft / 2, 0.5, -fd / 4);
        scene.add(fRight);

        setLoading(false);
      },
      undefined,
      () => {
        const fb = new THREE.Mesh(
          new THREE.PlaneGeometry(2.6, 3.2),
          new THREE.MeshStandardMaterial({ color: 0x4f3a6e }),
        );
        fb.position.set(0, 0.5, 0);
        scene.add(fb);
        setLoading(false);
      },
    );

    // ── Render Loop ───────────────────────────────────────────
    const animate = () => {
      animIdRef.current = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    // ── Resize ────────────────────────────────────────────────
    const onResize = () => {
      if (!el || !cameraRef.current || !rendererRef.current) return;
      const nw = el.clientWidth, nh = el.clientHeight;
      cameraRef.current.aspect = nw / nh;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(nw, nh);
    };
    window.addEventListener('resize', onResize);

    // ── Mouse / Touch Orbit Controls ──────────────────────────
    const dom = renderer.domElement;
    const raycaster = new THREE.Raycaster();
    const mouseCoord = new THREE.Vector2();

    const onDown = (e: MouseEvent) => {
      dragging.current = true;
      lastMouse.current = { x: e.clientX, y: e.clientY };
      downPos.current = { x: e.clientX, y: e.clientY };
    };

    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      const dx = e.clientX - lastMouse.current.x;
      const dy = e.clientY - lastMouse.current.y;
      lastMouse.current = { x: e.clientX, y: e.clientY };

      sph.current.theta -= dx * 0.005;
      sph.current.phi -= dy * 0.005;
      sph.current.theta = Math.max(-1.3, Math.min(1.3, sph.current.theta));
      sph.current.phi = Math.max(0.4, Math.min(1.9, sph.current.phi));
      updateCamera();
    };

    const onUp = (e: MouseEvent) => {
      dragging.current = false;

      // Click to focus: if not dragged, raycast click on Stand or Painting
      const dist = Math.hypot(e.clientX - downPos.current.x, e.clientY - downPos.current.y);
      if (dist < 6) {
        const rect = dom.getBoundingClientRect();
        mouseCoord.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouseCoord.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(mouseCoord, camera);

        const targets = [plaqueMeshRef.current, canvasMeshRef.current].filter(Boolean) as THREE.Object3D[];
        const hits = raycaster.intersectObjects(targets, true);
        if (hits.length > 0) {
          let hit = hits[0].object;
          let isStand = false;
          while (hit) {
            if (hit === plaqueMeshRef.current) {
              isStand = true;
              break;
            }
            hit = hit.parent as THREE.Object3D;
          }
          if (isStand) {
            focusStand();
          } else {
            focusPainting();
          }
        }
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      sph.current.r = Math.max(1.8, Math.min(9.5, sph.current.r + e.deltaY * 0.005));
      setZoom(+(5.4 / sph.current.r).toFixed(1));
      updateCamera();
    };

    dom.addEventListener('mousedown', onDown);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    dom.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      cancelAnimationFrame(animIdRef.current);
      window.removeEventListener('resize', onResize);
      dom.removeEventListener('mousedown', onDown);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      dom.removeEventListener('wheel', onWheel);
      if (el.contains(dom)) el.removeChild(dom);
      renderer.dispose();
    };
  }, [painting, updateCamera, focusPainting, focusStand]);

  const doZoom = (delta: number) => {
    sph.current.r = Math.max(1.8, Math.min(9.5, sph.current.r + delta));
    setZoom(+(5.4 / sph.current.r).toFixed(1));
    updateCamera();
  };

  const resetCam = () => {
    focusOverview();
  };

  return (
    <div className="relative w-full h-full" style={{ minHeight: '100vh' }}>
      {/* Three.js mount */}
      <div
        ref={mountRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        style={{ minHeight: '100vh' }}
      />

      {/* Loading Indicator */}
      {loading && (
        <div
          className="absolute inset-0 z-50 flex flex-col items-center justify-center"
          style={{ background: 'rgba(8,6,8,0.97)' }}
        >
          <div className="w-10 h-10 border-2 border-amber-500/30 border-t-amber-400 rounded-full animate-spin mb-4" />
          <p className="font-display text-amber-200/70 text-lg font-light">
            Illuminating the gallery & museum stand…
          </p>
        </div>
      )}

      {/* Top Header Bar */}
      <div
        className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-7 py-5 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, rgba(8,6,8,0.95) 0%, transparent 100%)' }}
      >
        <div className="flex flex-col gap-0.5">
          <h2 className="font-display text-amber-100" style={{ fontSize: '1.45rem', fontWeight: 400 }}>
            {painting.title}
          </h2>
          <p className="text-xs text-stone-400 font-light">
            {painting.artist} · {painting.year}
          </p>
        </div>

        {/* View mode switcher & Language Selector */}
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

          {/* Perspective switcher */}
          <div
            className="pointer-events-auto flex items-center gap-1 p-1 rounded-full"
            style={{
              background: 'rgba(18,14,10,0.85)',
              border: '1px solid rgba(212,175,55,0.25)',
              backdropFilter: 'blur(16px)',
            }}
          >
            <button
              id="view-overview"
              onClick={focusOverview}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                currentView === 'both'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
              title="Overview of room and stand"
            >
              <Eye className="w-3.5 h-3.5" />
              Room
            </button>
            <button
              id="view-painting"
              onClick={focusPainting}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                currentView === 'painting'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
              title="Focus close-up on artwork"
            >
              Artwork
            </button>
            <button
              id="view-stand"
              onClick={focusStand}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                currentView === 'stand'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
              title="Read museum label stand details up close"
            >
              <BookOpen className="w-3.5 h-3.5" />
              Stand Details
            </button>
          </div>
        </div>

        <button
          id="close-gallery-room"
          onClick={onClose}
          className="pointer-events-auto flex items-center gap-1.5 text-xs text-stone-300 hover:text-white transition-colors px-4 py-2 rounded-full"
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
            onClick={() => doZoom(-0.8)}
            className="p-1.5 text-stone-400 hover:text-amber-300 transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <span className="text-[10px] font-mono text-amber-400">{zoom}×</span>
          <button
            id="zoom-out"
            onClick={() => doZoom(0.8)}
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
            title="Reset Perspective"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Voice narration & Gemini AI audio Q&A Panel with upward Language Dropdown */}
      {!loading && (
        <GalleryVoicePanel
          painting={painting}
          currentLanguage={language}
          currentAccent={accent}
          onSelectLanguage={(newLang, newAccent) => {
            setLanguage(newLang);
            setAccent(newAccent);
          }}
          isOpenDropdown={isLangDropdownOpen}
          onToggleDropdown={() => setIsLangDropdownOpen((p) => !p)}
        />
      )}
    </div>
  );
};
