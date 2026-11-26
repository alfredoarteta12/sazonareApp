'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import * as THREE from 'three';
import { Sparkles, Camera, RotateCw, Image as ImageIcon, Box, ZoomIn, Play, Pause, RefreshCw } from 'lucide-react';
import { Modelo3DConfig } from '../types/producto-interactivo';

interface Visor3DArProps {
  nombrePlato: string;
  modelo3D?: Modelo3DConfig;
  fotosHD: string[];
  className?: string;
}

export function Visor3DAr({ nombrePlato, modelo3D, fotosHD, className = '' }: Visor3DArProps) {
  const [modo, setModo] = useState<'3d' | 'fotos'>('3d');
  const [fotoActivaIndex, setFotoActivaIndex] = useState(0);
  const [autoRotando, setAutoRotando] = useState(true);
  const [zoomNivel, setZoomNivel] = useState(1);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const groupRef = useRef<THREE.Group | null>(null);

  // Manejo de interacción táctil y mouse para giro 360°
  const isDraggingRef = useRef(false);
  const previousPointerXRef = useRef(0);
  const previousPointerYRef = useRef(0);

  // 1. Inicialización y Render Loop 3D con Three.js
  useEffect(() => {
    if (modo !== '3d' || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const width = canvas.clientWidth || 400;
    const height = canvas.clientHeight || 280;

    // Escena, Cámara y Renderizador
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 1.1, 2.7);
    camera.lookAt(0, 0.05, 0);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(width, height, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Iluminación de estudio gastronómico (Garantiza cero pantallas oscuras)
    const ambientLight = new THREE.AmbientLight(0xffffff, 2.4);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xfff3e0, 2.8);
    mainLight.position.set(3, 5, 4);
    scene.add(mainLight);

    const sideLight = new THREE.DirectionalLight(0xff9900, 1.8);
    sideLight.position.set(-4, 2, -2);
    scene.add(sideLight);

    // Grupo contenedor del platillo para rotación en 360°
    const hamburguesa = new THREE.Group();
    groupRef.current = hamburguesa;

    // Pan Brioche Superior
    const panGeo = new THREE.SphereGeometry(0.85, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.48);
    const panMat = new THREE.MeshStandardMaterial({
      color: 0xc8782a,
      roughness: 0.35,
      metalness: 0.08,
    });
    const panSuperior = new THREE.Mesh(panGeo, panMat);
    panSuperior.position.y = 0.38;
    hamburguesa.add(panSuperior);

    // Semillas de sésamo
    const sesamoGeo = new THREE.SphereGeometry(0.022, 6, 6);
    const sesamoMat = new THREE.MeshStandardMaterial({ color: 0xfff4dc, roughness: 0.4 });
    for (let i = 0; i < 24; i++) {
      const sesamo = new THREE.Mesh(sesamoGeo, sesamoMat);
      const theta = (i / 24) * Math.PI * 2 + (Math.sin(i) * 0.5);
      const phi = 0.25 + (i % 3) * 0.15;
      sesamo.position.set(
        0.82 * Math.sin(phi) * Math.cos(theta),
        0.38 + 0.82 * Math.cos(phi),
        0.82 * Math.sin(phi) * Math.sin(theta)
      );
      sesamo.scale.set(1.5, 0.8, 1);
      hamburguesa.add(sesamo);
    }

    // Queso Cheddar Fundido
    const quesoGeo = new THREE.BoxGeometry(1.3, 0.06, 1.3);
    const quesoMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.2,
      metalness: 0.1,
    });
    const queso = new THREE.Mesh(quesoGeo, quesoMat);
    queso.position.y = 0.25;
    queso.rotation.y = Math.PI / 4;
    hamburguesa.add(queso);

    // Carne Artesanal a la Parrilla
    const carneGeo = new THREE.CylinderGeometry(0.88, 0.9, 0.26, 32);
    const carneMat = new THREE.MeshStandardMaterial({
      color: 0x3d1d11,
      roughness: 0.8,
      metalness: 0.05,
    });
    const carne = new THREE.Mesh(carneGeo, carneMat);
    carne.position.y = 0.1;
    hamburguesa.add(carne);

    // Rodaja de Tomate Fresco
    const tomateGeo = new THREE.CylinderGeometry(0.85, 0.85, 0.08, 24);
    const tomateMat = new THREE.MeshStandardMaterial({
      color: 0xd92d20,
      roughness: 0.25,
      metalness: 0.1,
    });
    const tomate = new THREE.Mesh(tomateGeo, tomateMat);
    tomate.position.y = -0.07;
    hamburguesa.add(tomate);

    // Lechuga Ondulada
    const lechugaGeo = new THREE.TorusGeometry(0.88, 0.09, 12, 32);
    const lechugaMat = new THREE.MeshStandardMaterial({
      color: 0x47a836,
      roughness: 0.6,
    });
    const lechuga = new THREE.Mesh(lechugaGeo, lechugaMat);
    lechuga.position.y = -0.14;
    lechuga.rotation.x = Math.PI / 2;
    hamburguesa.add(lechuga);

    // Pan Brioche Inferior (Base)
    const panInfGeo = new THREE.CylinderGeometry(0.85, 0.82, 0.22, 32);
    const panInferior = new THREE.Mesh(panInfGeo, panMat);
    panInferior.position.y = -0.27;
    hamburguesa.add(panInferior);

    // Tabla / Plato de Madera
    const platoGeo = new THREE.CylinderGeometry(1.2, 1.25, 0.07, 36);
    const platoMat = new THREE.MeshStandardMaterial({
      color: 0x221a15,
      roughness: 0.7,
    });
    const plato = new THREE.Mesh(platoGeo, platoMat);
    plato.position.y = -0.42;
    hamburguesa.add(plato);

    scene.add(hamburguesa);

    // Ciclo de Animación a 60 FPS
    let estaMontado = true;
    const animate = () => {
      if (!estaMontado) return;
      animFrameRef.current = requestAnimationFrame(animate);

      if (autoRotando && !isDraggingRef.current && hamburguesa) {
        hamburguesa.rotation.y += 0.015;
      }

      renderer.render(scene, camera);
    };

    animate();

    // Redimensionamiento responsivo
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
  }, [modo, autoRotando]);

  // Controles de puntero táctil y ratón para rotar 360° con inercia
  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    previousPointerXRef.current = e.clientX;
    previousPointerYRef.current = e.clientY;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current || !groupRef.current) return;
    const deltaX = e.clientX - previousPointerXRef.current;
    const deltaY = e.clientY - previousPointerYRef.current;

    groupRef.current.rotation.y += deltaX * 0.018;
    groupRef.current.rotation.x = Math.max(-0.4, Math.min(0.6, groupRef.current.rotation.x + deltaY * 0.01));

    previousPointerXRef.current = e.clientX;
    previousPointerYRef.current = e.clientY;
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  // Botón de Realidad Aumentada (Scene Viewer Android / Quick Look iOS)
  const handleActivarAR = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const glbUrl = `${origin}/models/burger.glb`;
    const isAndroid = /android/i.test(navigator.userAgent);
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);

    if (isAndroid) {
      const intentUrl = `intent://arvr.google.com/scene-viewer/1.0?file=${encodeURIComponent(
        glbUrl
      )}&mode=ar_only&resizable=false#Intent;scheme=https;package=com.google.ar.core;action=android.intent.action.VIEW;end;`;
      window.location.href = intentUrl;
    } else if (isIOS) {
      alert('📱 Para ver en AR en iPhone: apunta la cámara hacia una superficie plana bien iluminada.');
    } else {
      alert('📱 Para proyectar en tu mesa con Realidad Aumentada (AR), abre esta página desde tu celular Android o iPhone.');
    }
  };

  return (
    <div className={`relative overflow-hidden rounded-2xl border-2 border-zinc-700 bg-zinc-950 ${className}`}>
      {/* Selector de Pestañas 3D / Galería */}
      <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 rounded-xl border-2 border-zinc-700 bg-zinc-900/95 p-1 backdrop-blur-md">
        <button
          type="button"
          onClick={() => setModo('3d')}
          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-black uppercase tracking-wider transition-all ${
            modo === '3d'
              ? 'bg-orange-500 text-black shadow-[2px_2px_0px_0px_#000]'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Box className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>3D Interactivo</span>
        </button>
        <button
          type="button"
          onClick={() => setModo('fotos')}
          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-black uppercase tracking-wider transition-all ${
            modo === 'fotos'
              ? 'bg-orange-500 text-black shadow-[2px_2px_0px_0px_#000]'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Fotos HD ({fotosHD.length})</span>
        </button>
      </div>

      {/* Badge Estado Interactivo */}
      <div className="absolute top-3 right-3 z-20">
        <span className="neo-sticker text-[9px] bg-amber-400 text-black border-black shadow-[2px_2px_0px_0px_#000] flex items-center gap-1">
          <Sparkles className="w-3 h-3 fill-black" />
          {modo === '3d' ? (autoRotando ? '360° Girando' : '360° Manual') : 'Ángulos HD'}
        </span>
      </div>

      {/* CONTENIDO PRINCIPAL: THREE.JS CANVAS O FOTOS */}
      <div className="relative h-64 sm:h-80 w-full bg-gradient-to-b from-[#141419] to-[#0a0a0d] flex items-center justify-center overflow-hidden">
        {modo === '3d' ? (
          <div className="relative h-full w-full touch-none select-none">
            <canvas
              ref={canvasRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              className="h-full w-full cursor-grab active:cursor-grabbing outline-none block"
            />

            {/* Controles flotantes */}
            <div className="absolute bottom-3 left-3 z-20 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setAutoRotando((r) => !r)}
                title={autoRotando ? 'Pausar giro automático' : 'Activar giro automático'}
                className="flex items-center gap-1.5 rounded-xl border-2 border-zinc-700 bg-zinc-900/90 px-2.5 py-1.5 text-[11px] font-black text-zinc-300 hover:text-white backdrop-blur-md active:scale-95"
              >
                {autoRotando ? <Pause className="w-3.5 h-3.5 text-amber-400" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
                <span className="font-display">{autoRotando ? 'Pausa' : 'Girar'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (groupRef.current) {
                    groupRef.current.rotation.set(0, 0, 0);
                  }
                }}
                title="Restablecer posición inicial"
                className="flex items-center gap-1 rounded-xl border-2 border-zinc-700 bg-zinc-900/90 px-2 py-1.5 text-[11px] font-bold text-zinc-400 hover:text-white backdrop-blur-md active:scale-95"
              >
                <RefreshCw className="w-3 h-3 text-orange-400" />
                <span className="hidden sm:inline text-[10px]">Centrar</span>
              </button>

              <div className="hidden sm:flex items-center gap-1 rounded-xl border-2 border-zinc-700 bg-zinc-900/90 px-2 py-1.5 text-[11px] font-bold text-zinc-400 backdrop-blur-md">
                <RotateCw className="w-3 h-3 text-orange-400" />
                <span className="text-[10px]">Arrastra con el dedo o ratón</span>
              </div>
            </div>

            {/* Botón Destacado: Ver en mi mesa (Realidad Aumentada) */}
            <div className="absolute bottom-3 right-3 z-20">
              <button
                type="button"
                onClick={handleActivarAR}
                className="neo-btn flex items-center gap-1.5 rounded-xl border-2 border-black bg-gradient-to-r from-orange-500 to-amber-400 px-3.5 py-1.5 text-xs font-black uppercase text-black shadow-[3px_3px_0px_0px_#fff] active:scale-95 transition-all"
              >
                <Camera className="w-4 h-4 stroke-[2.5]" />
                <span className="font-display">Ver en mi Mesa (AR)</span>
              </button>
            </div>
          </div>
        ) : (
          /* Galería Fotográfica HD */
          <div className="relative h-full w-full flex items-center justify-center p-4">
            <div
              className="relative h-full w-full max-w-md overflow-hidden rounded-xl cursor-zoom-in transition-transform duration-300"
              onClick={() => setZoomNivel((z) => (z === 1 ? 1.5 : 1))}
            >
              <Image
                src={fotosHD[fotoActivaIndex] || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd'}
                alt={`${nombrePlato} - Perspectiva ${fotoActivaIndex + 1}`}
                fill
                sizes="(max-width: 768px) 100vw, 500px"
                className={`object-cover transition-transform duration-300 ${zoomNivel > 1 ? 'scale-150' : 'scale-100'}`}
                priority
              />
              <div className="absolute bottom-2 right-2 rounded-lg bg-black/75 px-2 py-1 text-[10px] font-black text-white flex items-center gap-1">
                <ZoomIn className="w-3 h-3" />
                <span>{zoomNivel > 1 ? 'Zoom 1.5x' : 'Toca para Zoom'}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Miniaturas de Fotografías HD */}
      {fotosHD.length > 1 && (
        <div className="flex items-center gap-2 border-t-2 border-zinc-800 bg-zinc-900/60 p-2.5 overflow-x-auto no-scrollbar">
          <span className="text-[10px] font-display font-black uppercase text-zinc-500 shrink-0">Ángulos:</span>
          {fotosHD.map((foto, index) => (
            <button
              key={index}
              type="button"
              onClick={() => {
                setFotoActivaIndex(index);
                setModo('fotos');
              }}
              className={`relative h-12 w-14 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                modo === 'fotos' && fotoActivaIndex === index
                  ? 'border-orange-500 scale-105 shadow-[2px_2px_0px_0px_#f97316]'
                  : 'border-zinc-700 opacity-60 hover:opacity-100'
              }`}
            >
              <Image
                src={foto}
                alt={`Miniatura ${index + 1}`}
                fill
                sizes="60px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
