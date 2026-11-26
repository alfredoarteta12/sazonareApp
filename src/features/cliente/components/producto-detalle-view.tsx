'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatearCOP } from '@/lib/currency';
import { Visor3DAr } from './visor-3d-ar';
import { DetalleGastronomico } from '../types/producto-interactivo';
import {
  Flame,
  Clock,
  ArrowLeft,
  ShoppingBag,
  Sparkles,
  Utensils,
  MapPin,
  Share2,
  Check,
} from 'lucide-react';

interface ProductoDetalleViewProps {
  producto: {
    id: string;
    nombre: string;
    precio: number;
    disponible: boolean;
    categoria: { id: string; nombre: string };
  };
  detalle: DetalleGastronomico;
  mesaInicial?: number;
}

export function ProductoDetalleView({
  producto,
  detalle,
  mesaInicial = 1,
}: ProductoDetalleViewProps) {
  const router = useRouter();
  const [copiado, setCopiado] = useState(false);

  const handleCompartir = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${producto.nombre} en 3D & AR | SazonareFood`,
          text: `¡Mira este platillo en 3D y proyéctalo en tu mesa con Realidad Aumentada!`,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setCopiado(true);
        setTimeout(() => setCopiado(false), 2500);
      }
    } catch (e) {
      // Ignorar cancelación de compartir
    }
  };

  return (
    <div className="min-h-screen bg-[#08080a] text-[#f4f4f5] pb-24 selection:bg-orange-500 selection:text-black">
      {/* HEADER SUPERIOR */}
      <header className="sticky top-0 z-40 w-full border-b-2 border-zinc-800 bg-[#08080a]/90 backdrop-blur-md px-4 py-3">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link
            href={`/cliente?mesa=${mesaInicial}`}
            className="flex items-center gap-2 text-xs font-black uppercase text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4 stroke-[3]" />
            <span className="font-display">Volver a la Carta</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCompartir}
              className="flex items-center gap-1.5 rounded-xl border-2 border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-black text-zinc-300 hover:text-white"
            >
              {copiado ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
              <span className="font-display">{copiado ? 'Enlace Copiado' : 'Compartir'}</span>
            </button>

            <div className="flex items-center gap-1.5 rounded-xl border-2 border-orange-500 bg-zinc-900 px-3 py-1.5 text-xs font-black text-orange-400 shadow-[2px_2px_0px_0px_#f97316]">
              <MapPin className="w-3.5 h-3.5" />
              <span>Mesa {mesaInicial}</span>
            </div>
          </div>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="mx-auto max-w-4xl px-4 pt-6 space-y-6">
        {/* TÍTULO Y BADGES */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="neo-sticker text-[9px] bg-orange-500 text-black border-black">
              {producto.categoria.nombre}
            </span>
            <span className="neo-sticker text-[9px] bg-amber-400 text-black border-black flex items-center gap-1">
              <Sparkles className="w-3 h-3 fill-black" />
              Experiencia 3D & AR
            </span>
            {!producto.disponible && (
              <span className="neo-sticker text-[9px] bg-rose-950 text-rose-300 border-rose-700">
                Agotado en Cocina
              </span>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <h1 className="font-display text-2xl sm:text-4xl font-black uppercase tracking-tight text-white">
              {producto.nombre}
            </h1>
            <span className="font-display text-2xl sm:text-3xl font-black text-amber-400">
              {formatearCOP(producto.precio)}
            </span>
          </div>
        </div>

        {/* VISOR 3D & REALIDAD AUMENTADA A PANTALLA COMPLETA */}
        <Visor3DAr
          nombrePlato={producto.nombre}
          categoria={producto.categoria?.nombre || ''}
          adiciones={[]}
          modelo3D={detalle.modelo3D}
          fotosHD={detalle.fotosHD}
          className="shadow-[6px_6px_0px_0px_#f97316]"
        />

        {/* DESCRIPCIÓN DEL CHEF Y TIEMPOS */}
        <div className="neo-box rounded-2xl border-2 border-zinc-800 bg-zinc-900/90 p-5 space-y-4 shadow-[4px_4px_0px_0px_#27272a]">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <span className="font-display text-xs font-black uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
              <Flame className="w-4 h-4 fill-orange-400" />
              Ficha del Chef Sazonare
            </span>
            <div className="flex items-center gap-3 text-xs text-zinc-400 font-bold">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-orange-400" />
                {detalle.tiempoMinutos} min aprox
              </span>
              <span>~{detalle.caloriasAprox} kcal</span>
            </div>
          </div>

          <p className="text-sm text-zinc-300 leading-relaxed italic">
            "{detalle.descripcionChef}"
          </p>

          {/* Alérgenos */}
          {detalle.alergenos.length > 0 && (
            <div className="pt-2">
              <span className="text-[10px] font-display font-black uppercase tracking-wider text-zinc-400 block mb-2">
                Alérgenos e Información Nutricional:
              </span>
              <div className="flex flex-wrap gap-2">
                {detalle.alergenos.map((al) => (
                  <span
                    key={al.id}
                    className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1 text-xs font-bold ${al.badgeColor}`}
                  >
                    <span>{al.icono}</span>
                    <span>{al.nombre}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* INGREDIENTES */}
        <div className="neo-box rounded-2xl border-2 border-zinc-800 bg-zinc-900/90 p-5 space-y-3">
          <h2 className="font-display text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
            <Utensils className="w-4 h-4 text-orange-400" />
            Ingredientes y Elaboración
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-zinc-300">
            {detalle.ingredientes.map((ing, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="text-orange-500 font-black">•</span>
                <span>{ing}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ADICIONES DISPONIBLES EN CARTA */}
        {detalle.adicionesDisponibles.length > 0 && (
          <div className="neo-box rounded-2xl border-2 border-zinc-800 bg-zinc-900/90 p-5 space-y-3">
            <h2 className="font-display text-sm font-black uppercase tracking-wider text-amber-400">
              Adiciones Street Food Disponibles
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {detalle.adicionesDisponibles.map((adic) => (
                <div
                  key={adic.id}
                  className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950/60 p-2.5 text-xs"
                >
                  <span className="flex items-center gap-1.5 text-zinc-200">
                    <span>{adic.icono}</span>
                    <span>{adic.nombre}</span>
                  </span>
                  <span className="font-display font-black text-amber-400">
                    +{formatearCOP(adic.precioCOP)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* BARRA INFERIOR DE ACCIÓN PARA PEDIR */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t-2 border-zinc-800 bg-[#08080a]/95 backdrop-blur-md p-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
          <div>
            <span className="font-display text-[10px] font-black uppercase text-zinc-400 block">
              Precio en Carta:
            </span>
            <span className="font-display text-xl sm:text-2xl font-black text-amber-400">
              {formatearCOP(producto.precio)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.push(`/cliente?mesa=${mesaInicial}`)}
              className="neo-btn rounded-xl bg-orange-500 hover:bg-orange-400 text-black px-5 py-3 text-xs sm:text-sm font-black uppercase tracking-wider border-2 border-black shadow-[3px_3px_0px_0px_#fff] flex items-center gap-2"
            >
              <ShoppingBag className="w-4 h-4 stroke-[3]" />
              <span>Pedir en Mesa {mesaInicial}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
