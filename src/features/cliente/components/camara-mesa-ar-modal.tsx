'use client';

import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import {
  Camera,
  X,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Sparkles,
  RefreshCw,
  Share2,
  ExternalLink,
} from 'lucide-react';
import { Modelo3DConfig } from '../types/producto-interactivo';
import { crearPlato3D, detectarTipoPlatillo, obtenerRutaModeloGLB } from '../utils/modelos-procedurales';

interface CamaraMesaArModalProps {
  isOpen: boolean;
  onClose: () => void;
  nombrePlato: string;
  categoria?: string;
  adiciones?: string[];
  modelo3D?: Modelo3DConfig;
}

export function CamaraMesaArModal({
  isOpen,
  onClose,
  nombrePlato,
  categoria = '',
  adiciones = [],
  modelo3D,
}: CamaraMesaArModalProps) {
  const [permisoCamara, setPermisoCamara] = useState<'pendiente' | 'concedido' | 'denegado'>('pendiente');
  const [escala, setEscala] = useState(1);
  const [rotando, setRotando] = useState(true);
  const [fotoTomada, setFotoTomada] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const modelGroupRef = useRef<THREE.Group | null>(null);

  // Control de arrastre táctil / mouse
  const isDraggingRef = useRef(false);
  const lastPointerRef = useRef({ x: 0, y: 0 });

  // 1. Inicializar cámara del celular (Facing Mode: environment / trasera)
  useEffect(() => {
    if (!isOpen) return;

    let streamActivo: MediaStream | null = null;

    async function iniciarCamara() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        streamActivo = stream;
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        setPermisoCamara('concedido');
      } catch (err) {
        console.warn('Acceso a cámara no disponible o denegado:', err);
        setPermisoCamara('denegado');
      }
    }

    iniciarCamara();

    return () => {
      if (streamActivo) {
        streamActivo.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isOpen]);

  // 2. Montar Escena Three.js transparente sobre la cámara
  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const width = canvas.clientWidth || window.innerWidth;
    const height = canvas.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 1.4, 2.8);
    camera.lookAt(0, -0.1, 0);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(width, height, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Iluminación ambiental cálida y focos directos para simular luz de mesa
    const ambientLight = new THREE.AmbientLight(0xffffff, 2.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfff7ed, 3.0);
    dirLight.position.set(2, 6, 3);
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0xffedd5, 1.5);
    fillLight.position.set(-2, 3, -1);
    scene.add(fillLight);

    // Sombra de contacto suave en la mesa
    const shadowGeo = new THREE.CylinderGeometry(1.2, 1.3, 0.01, 32);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.35,
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.position.y = -0.52;
    scene.add(shadowMesh);

    // Contenedor del modelo
    const rootGroup = new THREE.Group();
    modelGroupRef.current = rootGroup;
    scene.add(rootGroup);

    // Modelo inicial procedural
    const proceduralMesh = crearPlato3D(nombrePlato, categoria, adiciones);
    rootGroup.add(proceduralMesh);

    // Carga de modelo GLB profesional
    const tipo = detectarTipoPlatillo(nombrePlato, categoria);
    const rutaGLB = obtenerRutaModeloGLB(tipo) || modelo3D?.glb;

    let estaMontado = true;

    if (rutaGLB) {
      const loader = new GLTFLoader();
      loader.load(
        rutaGLB,
        (gltf) => {
          if (!estaMontado || !rootGroup) return;

          const box = new THREE.Box3().setFromObject(gltf.scene);
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z);
          const scale = 1.9 / (maxDim || 1);

          gltf.scene.scale.setScalar(scale);
          gltf.scene.position.x = -center.x * scale;
          gltf.scene.position.y = -center.y * scale;
          gltf.scene.position.z = -center.z * scale;

          while (rootGroup.children.length > 0) {
            rootGroup.remove(rootGroup.children[0]);
          }
          rootGroup.add(gltf.scene);
        },
        undefined,
        (err) => {
          console.warn('Fallback procedural en AR:', err);
        }
      );
    }

    // Render loop a 60 FPS
    const animate = () => {
      if (!estaMontado) return;
      animFrameRef.current = requestAnimationFrame(animate);

      if (rotando && !isDraggingRef.current && rootGroup) {
        rootGroup.rotation.y += 0.01;
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!canvas) return;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (w > 0 && h > 0) {
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h, false);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      estaMontado = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, [isOpen, nombrePlato, categoria, rotando]);

  // Aplicar zoom de escala
  useEffect(() => {
    if (modelGroupRef.current) {
      modelGroupRef.current.scale.setScalar(escala);
    }
  }, [escala]);

  // Controles táctiles para mover y rotar sobre la mesa
  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    lastPointerRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current || !modelGroupRef.current) return;
    const deltaX = e.clientX - lastPointerRef.current.x;
    const deltaY = e.clientY - lastPointerRef.current.y;

    modelGroupRef.current.rotation.y += deltaX * 0.02;
    modelGroupRef.current.position.y = Math.max(-1.5, Math.min(1.0, modelGroupRef.current.position.y - deltaY * 0.005));

    lastPointerRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  // Capturar Foto AR (Combina Video + Canvas 3D)
  const handleTomarFoto = () => {
    const video = videoRef.current;
    const canvas3D = canvasRef.current;
    if (!canvas3D) return;

    const captureCanvas = document.createElement('canvas');
    captureCanvas.width = canvas3D.width;
    captureCanvas.height = canvas3D.height;
    const ctx = captureCanvas.getContext('2d');
    if (!ctx) return;

    if (video && video.videoWidth > 0) {
      ctx.drawImage(video, 0, 0, captureCanvas.width, captureCanvas.height);
    } else {
      ctx.fillStyle = '#111827';
      ctx.fillRect(0, 0, captureCanvas.width, captureCanvas.height);
    }

    ctx.drawImage(canvas3D, 0, 0, captureCanvas.width, captureCanvas.height);

    const dataUrl = captureCanvas.toDataURL('image/jpeg', 0.92);
    setFotoTomada(dataUrl);
  };

  // Intento de Google Scene Viewer nativo para Android
  const handleGoogleSceneViewer = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const tipo = detectarTipoPlatillo(nombrePlato, categoria);
    const rutaRelativa = obtenerRutaModeloGLB(tipo) || modelo3D?.glb || '/models/burger.glb';
    const glbUrl = `${origin}${rutaRelativa}`;

    const intentUrl = `intent://arvr.google.com/scene-viewer/1.0?file=${encodeURIComponent(
      glbUrl
    )}&mode=ar_preferred&title=${encodeURIComponent(
      nombrePlato
    )}&resizable=true#Intent;scheme=https;package=com.google.android.googlequicksearchbox;action=android.intent.action.VIEW;S.browser_fallback_url=${encodeURIComponent(
      window.location.href
    )};end;`;

    window.location.href = intentUrl;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black text-white select-none">
      {/* 1. Header con Controles y Cierre */}
      <div className="absolute top-0 inset-x-0 z-30 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent backdrop-blur-xs">
        <div className="flex items-center gap-2">
          <span className="neo-sticker text-[10px] bg-amber-400 text-black border-black shadow-[2px_2px_0px_0px_#000] flex items-center gap-1 font-display font-black uppercase">
            <Sparkles className="w-3 h-3 fill-black" />
            Cámara en mi Mesa
          </span>
          <span className="text-xs font-black uppercase text-zinc-200 hidden sm:inline">
            {nombrePlato}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Botón Scene Viewer para Android */}
          <button
            type="button"
            onClick={handleGoogleSceneViewer}
            title="Abrir en Google ARCore nativo"
            className="flex items-center gap-1 rounded-xl border border-zinc-700 bg-zinc-900/80 px-2.5 py-1.5 text-[11px] font-bold text-zinc-300 hover:text-white backdrop-blur-md active:scale-95"
          >
            <ExternalLink className="w-3.5 h-3.5 text-orange-400" />
            <span className="hidden sm:inline">Google AR</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full border-2 border-zinc-700 bg-zinc-900/90 p-2 text-zinc-300 hover:text-white hover:border-orange-500 backdrop-blur-md active:scale-95 transition-all"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* 2. Capa de Video (Cámara en vivo) */}
      <div className="relative flex-1 w-full h-full overflow-hidden flex items-center justify-center">
        {permisoCamara === 'concedido' ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-zinc-950 to-zinc-900">
            <Camera className="w-12 h-12 text-orange-400 mb-3 animate-pulse" />
            <h3 className="font-display text-lg font-black uppercase text-white mb-1">
              {permisoCamara === 'denegado' ? 'Acceso a Cámara Bloqueado' : 'Conectando con tu Cámara...'}
            </h3>
            <p className="text-xs text-zinc-400 max-w-sm mb-4">
              {permisoCamara === 'denegado'
                ? 'Para ver este platillo en tu mesa, activa el permiso de cámara en los ajustes de tu navegador o pulsa en Google AR.'
                : 'Acepta la solicitud de permisos en tu pantalla para proyectar el platillo.'}
            </p>
            <button
              type="button"
              onClick={handleGoogleSceneViewer}
              className="neo-btn rounded-xl border-2 border-black bg-orange-500 px-4 py-2 text-xs font-black uppercase text-black"
            >
              Probar Google ARCore Nativo
            </button>
          </div>
        )}

        {/* 3. Canvas 3D de Three.js (Transparente sobre la cámara) */}
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing touch-none z-10"
        />

        {/* Guía en pantalla para el usuario */}
        <div className="absolute top-20 inset-x-0 z-20 flex justify-center pointer-events-none">
          <span className="rounded-full bg-black/60 border border-zinc-700/80 px-4 py-1 text-[11px] font-bold text-zinc-300 backdrop-blur-md">
            👆 Arrastra con el dedo para ubicarlo sobre tu mesa
          </span>
        </div>
      </div>

      {/* 4. Barra Inferior de Herramientas (Zoom, Rotación y Captura) */}
      <div className="absolute bottom-0 inset-x-0 z-30 flex items-center justify-between p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent pb-6 backdrop-blur-xs">
        {/* Controles de Escala */}
        <div className="flex items-center gap-1.5 rounded-2xl border-2 border-zinc-700 bg-zinc-900/90 p-1.5 backdrop-blur-md">
          <button
            type="button"
            onClick={() => setEscala((e) => Math.max(0.4, Number((e - 0.15).toFixed(2))))}
            title="Reducir tamaño"
            className="rounded-xl p-2 text-zinc-300 hover:text-white hover:bg-zinc-800 active:scale-95"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-[11px] font-display font-black text-amber-400 px-1 min-w-[36px] text-center">
            {Math.round(escala * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setEscala((e) => Math.min(2.2, Number((e + 0.15).toFixed(2))))}
            title="Aumentar tamaño"
            className="rounded-xl p-2 text-zinc-300 hover:text-white hover:bg-zinc-800 active:scale-95"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>

        {/* Botón Principal: Tomar Foto en la Mesa */}
        <button
          type="button"
          onClick={handleTomarFoto}
          className="neo-btn flex items-center gap-2 rounded-2xl border-2 border-black bg-gradient-to-r from-orange-500 to-amber-400 px-5 py-3 text-sm font-black uppercase text-black shadow-[4px_4px_0px_0px_#fff] active:scale-95 transition-transform"
        >
          <Camera className="w-5 h-5 stroke-[2.5]" />
          <span className="font-display">Tomar Foto</span>
        </button>

        {/* Giro automático / Centrar */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setRotando((r) => !r)}
            title={rotando ? 'Pausar giro' : 'Girar platillo'}
            className="rounded-2xl border-2 border-zinc-700 bg-zinc-900/90 p-3 text-zinc-300 hover:text-white backdrop-blur-md active:scale-95"
          >
            <RotateCw className={`w-4 h-4 text-orange-400 ${rotando ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 5. Modal de Vista Previa de la Foto Capturada */}
      {fotoTomada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="relative w-full max-w-sm rounded-2xl border-2 border-zinc-700 bg-zinc-900 p-4 space-y-4 shadow-[6px_6px_0px_0px_#f97316]">
            <div className="flex items-center justify-between">
              <span className="font-display text-sm font-black uppercase text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                ¡Tu plato en la mesa!
              </span>
              <button
                type="button"
                onClick={() => setFotoTomada(null)}
                className="rounded-full p-1 text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative w-full aspect-4/3 rounded-xl overflow-hidden border-2 border-zinc-800">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={fotoTomada} alt="Captura AR en la mesa" className="w-full h-full object-cover" />
            </div>

            <div className="flex items-center gap-2">
              <a
                href={fotoTomada}
                download={`${nombrePlato.toLowerCase().replace(/\s+/g, '-')}-en-mi-mesa.jpg`}
                className="neo-btn flex-1 flex items-center justify-center gap-1.5 rounded-xl border-2 border-black bg-amber-400 px-3 py-2 text-xs font-black uppercase text-black"
              >
                Guardar Foto
              </a>
              {typeof navigator !== 'undefined' && 'share' in navigator && (
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const res = await fetch(fotoTomada);
                      const blob = await res.blob();
                      const file = new File([blob], 'plato-sazonare.jpg', { type: 'image/jpeg' });
                      await navigator.share({
                        title: `${nombrePlato} en mi mesa | SazonareFood`,
                        files: [file],
                      });
                    } catch {}
                  }}
                  className="rounded-xl border-2 border-zinc-700 bg-zinc-800 p-2.5 text-zinc-200 hover:text-white"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
