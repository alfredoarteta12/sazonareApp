'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Sparkles, Camera, RotateCw, Image as ImageIcon, Box, ZoomIn, Play, Pause, Loader2 } from 'lucide-react';
import { Modelo3DConfig } from '../types/producto-interactivo';

interface Visor3DArProps {
  nombrePlato: string;
  modelo3D?: Modelo3DConfig;
  fotosHD: string[];
  className?: string;
}

export function Visor3DAr({ nombrePlato, modelo3D, fotosHD, className = '' }: Visor3DArProps) {
  const [modo, setModo] = useState<'3d' | 'fotos'>(modelo3D ? '3d' : 'fotos');
  const [fotoActivaIndex, setFotoActivaIndex] = useState(0);
  const [modelViewerCargado, setModelViewerCargado] = useState(false);
  const [modeloListo, setModeloListo] = useState(false);
  const [autoRotando, setAutoRotando] = useState(true);
  const [zoomNivel, setZoomNivel] = useState(1);
  const modelViewerRef = useRef<any>(null);

  // 1. Cargar e inicializar @google/model-viewer dinámicamente en el cliente
  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('@google/model-viewer')
        .then(() => {
          setModelViewerCargado(true);
        })
        .catch((err) => {
          console.error('Error al inicializar model-viewer:', err);
        });
    }
  }, []);

  // 2. Configurar propiedades DOM directas de model-viewer para auto-rotación garantizada
  useEffect(() => {
    const el = modelViewerRef.current;
    if (!el) return;

    el.autoRotate = autoRotando;
    el.cameraControls = true;
    el.rotationPerSecond = '30deg';

    if (el.loaded) {
      setModeloListo(true);
    }

    const handleLoad = () => {
      setModeloListo(true);
      el.autoRotate = autoRotando;
    };

    const handleError = () => {
      setModeloListo(true);
    };

    el.addEventListener('load', handleLoad);
    el.addEventListener('error', handleError);

    // Timeout de seguridad: quitar el spinner en máx 2.5s
    const timer = setTimeout(() => {
      setModeloListo(true);
    }, 2500);

    return () => {
      el.removeEventListener('load', handleLoad);
      el.removeEventListener('error', handleError);
      clearTimeout(timer);
    };
  }, [modo, modelViewerCargado, autoRotando]);

  const toggleAutoRotacion = () => {
    const nuevo = !autoRotando;
    setAutoRotando(nuevo);
    if (modelViewerRef.current) {
      modelViewerRef.current.autoRotate = nuevo;
      if (nuevo) {
        modelViewerRef.current.setAttribute('auto-rotate', '');
      } else {
        modelViewerRef.current.removeAttribute('auto-rotate');
      }
    }
  };

  const handleActivarAR = () => {
    if (modelViewerRef.current && typeof modelViewerRef.current.activateAR === 'function') {
      modelViewerRef.current.activateAR();
    }
  };

  return (
    <div className={`relative overflow-hidden rounded-2xl border-2 border-zinc-700 bg-zinc-950 ${className}`}>
      {/* Selector de Pestañas 3D / Galería */}
      <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 rounded-xl border-2 border-zinc-700 bg-zinc-900/95 p-1 backdrop-blur-md">
        {modelo3D && (
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
            <span>3D / AR</span>
          </button>
        )}
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
          {modo === '3d' ? (modeloListo ? '360° Activo' : 'Cargando...') : 'Ángulos HD'}
        </span>
      </div>

      {/* CONTENIDO PRINCIPAL: 3D o FOTOS */}
      <div className="relative h-64 sm:h-80 w-full bg-gradient-to-b from-zinc-900 to-zinc-950 flex items-center justify-center">
        {modo === '3d' && modelo3D ? (
          <div className="relative h-full w-full">
            {/* Indicador no invasivo de progreso (no bloquea interacción) */}
            {!modeloListo && (
              <div className="pointer-events-none absolute top-12 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 rounded-full border border-orange-500/50 bg-black/85 px-3 py-1 backdrop-blur-md animate-pulse shadow-lg">
                <Loader2 className="w-3.5 h-3.5 text-orange-400 animate-spin" />
                <span className="font-display text-[10px] font-black uppercase tracking-wider text-orange-300">
                  Iniciando 3D...
                </span>
              </div>
            )}

            <model-viewer
              ref={modelViewerRef}
              src={modelo3D.glb}
              ios-src={modelo3D.usdz}
              poster={modelo3D.poster || fotosHD[0]}
              alt={modelo3D.alt || `Modelo 3D de ${nombrePlato}`}
              camera-controls
              touch-action="pan-y"
              auto-rotate=""
              rotation-per-second="30deg"
              camera-orbit="auto auto auto"
              bounds="tight"
              scale={modelo3D.scale || '1 1 1'}
              ar
              ar-modes="webxr scene-viewer quick-look"
              ar-scale="auto"
              shadow-intensity="1.5"
              exposure="1.1"
              loading="eager"
              reveal="auto"
              style={{ width: '100%', height: '100%', outline: 'none' }}
            >
              {/* Slot para botón AR nativo */}
              <button slot="ar-button" type="button" className="hidden" id="native-ar-button">
                AR
              </button>
            </model-viewer>

            {/* Controles flotantes para el modelo 3D */}
            <div className="absolute bottom-3 left-3 z-20 flex items-center gap-2">
              <button
                type="button"
                onClick={toggleAutoRotacion}
                title={autoRotando ? 'Pausar auto-rotación' : 'Activar auto-rotación'}
                className="flex items-center gap-1 rounded-xl border-2 border-zinc-700 bg-zinc-900/90 px-2.5 py-1.5 text-[11px] font-black text-zinc-300 hover:text-white backdrop-blur-md active:scale-95"
              >
                {autoRotando ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline font-display">{autoRotando ? 'Pausa' : 'Girar'}</span>
              </button>

              <div className="flex items-center gap-1 rounded-xl border-2 border-zinc-700 bg-zinc-900/90 px-2 py-1.5 text-[11px] font-bold text-zinc-400 backdrop-blur-md">
                <RotateCw className="w-3 h-3 text-orange-400" />
                <span className="text-[10px]">Arrastra con el dedo para rotar</span>
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

      {/* Miniaturas de Fotografías HD (siempre accesibles) */}
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
