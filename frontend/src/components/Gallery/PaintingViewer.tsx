import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import type { Painting } from '../../types';
import { X, RotateCcw, ZoomIn, ZoomOut, Move } from 'lucide-react';

interface Props {
  painting: Painting;
  onClose: () => void;
}

export const PaintingViewer: React.FC<Props> = ({ painting, onClose }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x080b12);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 4.5);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    rendererRef.current = renderer;

    mountRef.current.appendChild(renderer.domElement);

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xfffaed, 1.8);
    directionalLight.position.set(2, 4, 3);
    scene.add(directionalLight);

    const rimLight = new THREE.DirectionalLight(0x7c3aed, 0.6);
    rimLight.position.set(-3, -2, -2);
    scene.add(rimLight);

    // 5. Texture & Plane Mesh
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');

    loader.load(
      painting.image_path,
      (texture) => {
        texture.generateMipmaps = true;
        texture.minFilter = THREE.LinearMipmapLinearFilter;

        const imgAspect = texture.image.width / texture.image.height;
        let planeW = 3.2;
        let planeH = 3.2 / imgAspect;

        if (planeH > 2.6) {
          planeH = 2.6;
          planeW = planeH * imgAspect;
        }

        const geometry = new THREE.PlaneGeometry(planeW, planeH, 32, 32);
        const material = new THREE.MeshStandardMaterial({
          map: texture,
          roughness: 0.35,
          metalness: 0.05,
          side: THREE.DoubleSide,
        });

        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);
        meshRef.current = mesh;
        setLoading(false);
      },
      undefined,
      (err) => {
        console.warn("Failed to load high-res texture, using fallback color:", err);
        const geometry = new THREE.PlaneGeometry(3, 2);
        const material = new THREE.MeshStandardMaterial({ color: 0x4f46e5 });
        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);
        meshRef.current = mesh;
        setLoading(false);
      }
    );

    // Mouse Drag Interaction for Tilt/Orbit
    let isDragging = false;
    let prevMousePos = { x: 0, y: 0 };

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMousePos = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging || !meshRef.current) return;
      const deltaX = e.clientX - prevMousePos.x;
      const deltaY = e.clientY - prevMousePos.y;

      meshRef.current.rotation.y += deltaX * 0.008;
      meshRef.current.rotation.x += deltaY * 0.008;

      // Clamp tilt angles
      meshRef.current.rotation.x = Math.max(-0.6, Math.min(0.6, meshRef.current.rotation.x));
      meshRef.current.rotation.y = Math.max(-0.8, Math.min(0.8, meshRef.current.rotation.y));

      prevMousePos = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (!cameraRef.current) return;
      cameraRef.current.position.z += e.deltaY * 0.003;
      cameraRef.current.position.z = Math.max(1.8, Math.min(6.5, cameraRef.current.position.z));
      setZoomLevel(Number((4.5 / cameraRef.current.position.z).toFixed(1)));
    };

    const domElement = renderer.domElement;
    domElement.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    domElement.addEventListener('wheel', onWheel, { passive: false });

    // Animation Loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!mountRef.current || !cameraRef.current || !rendererRef.current) return;
      const newW = mountRef.current.clientWidth;
      const newH = mountRef.current.clientHeight;
      cameraRef.current.aspect = newW / newH;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(newW, newH);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      domElement.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      domElement.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', handleResize);
      if (mountRef.current && domElement) {
        mountRef.current.removeChild(domElement);
      }
      renderer.dispose();
    };
  }, [painting]);

  const resetView = () => {
    if (meshRef.current) {
      meshRef.current.rotation.set(0, 0, 0);
    }
    if (cameraRef.current) {
      cameraRef.current.position.set(0, 0, 4.5);
      setZoomLevel(1);
    }
  };

  const adjustZoom = (delta: number) => {
    if (!cameraRef.current) return;
    cameraRef.current.position.z = Math.max(1.8, Math.min(6.5, cameraRef.current.position.z + delta));
    setZoomLevel(Number((4.5 / cameraRef.current.position.z).toFixed(1)));
  };

  return (
    <div className="relative w-full h-[65vh] min-h-[420px] rounded-2xl overflow-hidden bg-slate-950 border border-purple-900/50 shadow-2xl flex flex-col">
      {/* 3D Canvas Mount Point */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Loading Indicator */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm z-30">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-medium text-purple-300">Loading High-Definition Texture...</p>
          </div>
        </div>
      )}

      {/* Top Header Bar */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
        <div className="pointer-events-auto bg-slate-900/85 backdrop-blur-md border border-slate-700/60 px-4 py-2 rounded-xl text-white shadow-xl flex items-center gap-3">
          <div>
            <h3 className="text-sm font-bold text-white">{painting.title}</h3>
            <p className="text-xs text-purple-300 font-medium">
              {painting.artist} · {painting.year}
            </p>
          </div>
        </div>

        <div className="pointer-events-auto flex items-center gap-2">
          <button
            onClick={resetView}
            className="p-2.5 rounded-xl bg-slate-900/85 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 transition-all shadow-lg"
            title="Reset Perspective"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-2.5 rounded-xl bg-red-950/80 hover:bg-red-900 text-red-200 border border-red-700/60 transition-all shadow-lg"
            title="Exit 3D Inspection"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bottom Floating Toolbar */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 bg-slate-900/90 backdrop-blur-lg border border-slate-700/70 px-4 py-2 rounded-2xl shadow-2xl">
        <span className="text-xs text-slate-400 flex items-center gap-1.5 hidden sm:flex">
          <Move className="w-3.5 h-3.5 text-purple-400" /> Drag to tilt/orbit
        </span>
        <div className="h-4 w-px bg-slate-700 hidden sm:block" />
        <button
          onClick={() => adjustZoom(0.5)}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <span className="text-xs font-mono font-semibold text-purple-300 w-12 text-center">
          {zoomLevel}x
        </span>
        <button
          onClick={() => adjustZoom(-0.5)}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
