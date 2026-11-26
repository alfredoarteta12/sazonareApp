'use client';

import React, { useState, useMemo } from 'react';
import { Modal } from '@/components/ui/modal';
import { formatearCOP } from '@/lib/currency';
import { Visor3DAr } from './visor-3d-ar';
import {
  DetalleGastronomico,
  AdicionPlatillo,
  PersonalizacionProducto,
} from '../types/producto-interactivo';
import { obtenerDetalleGastronomico } from '../utils/gastronomia-data';
import { Clock, Flame, Plus, Minus, Check, ShoppingBag, Utensils } from 'lucide-react';

interface ProductoDetalleModalProps {
  isOpen: boolean;
  onClose: () => void;
  producto: {
    id: string;
    nombre: string;
    precio: number;
    imagen?: string | null;
    disponible: boolean;
    categoria: { id: string; nombre: string };
  } | null;
  onAgregarAlCarrito: (personalizacion: PersonalizacionProducto) => void;
}

export function ProductoDetalleModal({
  isOpen,
  onClose,
  producto,
  onAgregarAlCarrito,
}: ProductoDetalleModalProps) {
  const [cantidad, setCantidad] = useState(1);
  const [adicionesSeleccionadas, setAdicionesSeleccionadas] = useState<Record<string, number>>({});
  const [preferenciasSeleccionadas, setPreferenciasSeleccionadas] = useState<string[]>([]);
  const [notaEspecial, setNotaEspecial] = useState('');

  // Detalle gastronómico enriquecido
  const detalle: DetalleGastronomico | null = useMemo(() => {
    if (!producto) return null;
    return obtenerDetalleGastronomico(producto);
  }, [producto]);

  // Manejo de adiciones (+ / -)
  const handleModificarAdicion = (adicionId: string, delta: number) => {
    setAdicionesSeleccionadas((prev) => {
      const actual = prev[adicionId] || 0;
      const nueva = Math.max(0, actual + delta);
      if (nueva === 0) {
        const copia = { ...prev };
        delete copia[adicionId];
        return copia;
      }
      return { ...prev, [adicionId]: nueva };
    });
  };

  // Manejo de chips de preferencias
  const togglePreferencia = (pref: string) => {
    setPreferenciasSeleccionadas((prev) =>
      prev.includes(pref) ? prev.filter((p) => p !== pref) : [...prev, pref]
    );
  };

  // Cálculos de precios en COP
  const precioBase = producto?.precio || 0;
  const precioAdiciones = useMemo(() => {
    if (!detalle) return 0;
    return Object.entries(adicionesSeleccionadas).reduce((acc, [adicionId, cant]) => {
      const adicion = detalle.adicionesDisponibles.find((a) => a.id === adicionId);
      return acc + (adicion ? adicion.precioCOP * cant : 0);
    }, 0);
  }, [detalle, adicionesSeleccionadas]);

  const precioTotalUnitario = precioBase + precioAdiciones;
  const precioTotalGeneral = precioTotalUnitario * cantidad;

  // Confirmar y agregar
  const handleConfirmar = () => {
    if (!producto || !detalle) return;

    const listaAdiciones = Object.entries(adicionesSeleccionadas)
      .map(([adicionId, cant]) => {
        const adicion = detalle.adicionesDisponibles.find((a) => a.id === adicionId);
        return adicion ? { adicion, cantidad: cant } : null;
      })
      .filter(Boolean) as { adicion: AdicionPlatillo; cantidad: number }[];

    onAgregarAlCarrito({
      adiciones: listaAdiciones,
      preferencias: preferenciasSeleccionadas,
      notaEspecial: notaEspecial.trim(),
      cantidad,
      precioBaseCOP: precioBase,
      precioAdicionesCOP: precioAdiciones,
      precioTotalUnitarioCOP: precioTotalUnitario,
      precioTotalGeneralCOP: precioTotalGeneral,
    });

    // Resetear estados al cerrar
    setCantidad(1);
    setAdicionesSeleccionadas({});
    setPreferenciasSeleccionadas([]);
    setNotaEspecial('');
    onClose();
  };

  if (!producto || !detalle) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={producto.nombre}
      icon="🍔"
      size="xl"
      footer={
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
          {/* Selector de Cantidad */}
          <div className="flex items-center justify-between sm:justify-start w-full sm:w-auto gap-3">
            <span className="font-display text-xs font-black uppercase text-zinc-400">Cantidad:</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCantidad((c) => Math.max(1, c - 1))}
                className="neo-btn h-9 w-9 rounded-xl bg-zinc-800 text-sm font-black text-white hover:bg-zinc-700 flex items-center justify-center border-2 border-zinc-700"
              >
                <Minus className="w-4 h-4 stroke-[3]" />
              </button>
              <span className="font-display text-base font-black text-white w-7 text-center">
                {cantidad}
              </span>
              <button
                type="button"
                onClick={() => setCantidad((c) => c + 1)}
                className="neo-btn h-9 w-9 rounded-xl bg-zinc-800 text-sm font-black text-white hover:bg-zinc-700 flex items-center justify-center border-2 border-zinc-700"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
              </button>
            </div>
          </div>

          {/* Botón de Agregar a Comanda */}
          <button
            type="button"
            onClick={handleConfirmar}
            disabled={!producto.disponible}
            className="neo-btn-primary w-full sm:w-auto rounded-xl px-5 py-3 text-xs sm:text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2"
          >
            <ShoppingBag className="w-4 h-4 stroke-[3]" />
            <span>
              {producto.disponible
                ? `Añadir a mi Pedido • ${formatearCOP(precioTotalGeneral)}`
                : 'Plato Agotado en Cocina'}
            </span>
          </button>
        </div>
      }
    >
      <div className="space-y-4 max-h-[68vh] overflow-y-auto pr-1 no-scrollbar">
        {/* 1. VISOR 3D & REALIDAD AUMENTADA / GALERÍA */}
        <Visor3DAr
          nombrePlato={producto.nombre}
          modelo3D={detalle.modelo3D}
          fotosHD={detalle.fotosHD}
        />

        {/* 2. ENCABEZADO Y DATOS TÉCNICOS */}
        <div className="rounded-xl border-2 border-zinc-800 bg-zinc-900/60 p-3.5 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="neo-sticker text-[9px] bg-orange-500 text-black border-black">
              {producto.categoria.nombre}
            </span>
            <div className="flex items-center gap-3 text-xs text-zinc-400 font-bold">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-orange-400" />
                {detalle.tiempoMinutos} min
              </span>
              <span className="flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                ~{detalle.caloriasAprox} kcal
              </span>
            </div>
          </div>

          <p className="text-xs text-zinc-300 leading-relaxed italic">
            "{detalle.descripcionChef}"
          </p>

          {/* Badges de Alérgenos */}
          {detalle.alergenos.length > 0 && (
            <div className="pt-2 border-t border-zinc-800/80">
              <span className="text-[10px] font-display font-black uppercase tracking-wider text-zinc-400 block mb-1.5">
                Alérgenos identificados:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {detalle.alergenos.map((al) => (
                  <span
                    key={al.id}
                    title={al.descripcion}
                    className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[10px] font-bold ${al.badgeColor}`}
                  >
                    <span>{al.icono}</span>
                    <span>{al.nombre}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 3. INGREDIENTES PRINCIPALES */}
        <div className="rounded-xl border-2 border-zinc-800 bg-zinc-900/60 p-3.5 space-y-2">
          <span className="font-display text-xs font-black uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
            <Utensils className="w-3.5 h-3.5" />
            Ingredientes Principales
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-zinc-300">
            {detalle.ingredientes.map((ing, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <span className="text-orange-500 font-black">•</span>
                <span>{ing}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 4. ADICIONES INTERACTIVAS CON CÁLCULO EN COP */}
        {detalle.adicionesDisponibles.length > 0 && (
          <div className="rounded-xl border-2 border-zinc-800 bg-zinc-900/60 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-display text-xs font-black uppercase tracking-wider text-amber-400">
                Adiciones & Extras Street Food
              </span>
              <span className="text-[10px] text-zinc-400 font-bold">Personaliza tu sabor</span>
            </div>

            <div className="space-y-1.5">
              {detalle.adicionesDisponibles.map((adic) => {
                const cant = adicionesSeleccionadas[adic.id] || 0;
                return (
                  <div
                    key={adic.id}
                    className={`flex items-center justify-between rounded-xl border-2 p-2.5 transition-all ${
                      cant > 0
                        ? 'border-orange-500 bg-orange-950/20 shadow-[2px_2px_0px_0px_#f97316]'
                        : 'border-zinc-800/80 bg-zinc-950/40 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">{adic.icono}</span>
                      <div>
                        <p className="text-xs font-bold text-white">{adic.nombre}</p>
                        <p className="text-[11px] font-display font-black text-amber-400">
                          +{formatearCOP(adic.precioCOP)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {cant > 0 && (
                        <button
                          type="button"
                          onClick={() => handleModificarAdicion(adic.id, -1)}
                          className="h-7 w-7 rounded-lg bg-zinc-800 text-white font-black hover:bg-zinc-700 flex items-center justify-center text-xs"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {cant > 0 && (
                        <span className="font-display text-xs font-black text-white w-4 text-center">
                          {cant}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleModificarAdicion(adic.id, 1)}
                        className={`neo-btn h-7 px-2.5 rounded-lg text-xs font-black flex items-center gap-1 ${
                          cant > 0
                            ? 'bg-orange-500 text-black'
                            : 'bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700'
                        }`}
                      >
                        <Plus className="w-3 h-3 stroke-[3]" />
                        <span>{cant > 0 ? 'Más' : 'Añadir'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 5. PREFERENCIAS DE COCINA RÁPIDAS (CHIPS ONE-TOUCH) */}
        <div className="rounded-xl border-2 border-zinc-800 bg-zinc-900/60 p-3.5 space-y-2">
          <span className="font-display text-xs font-black uppercase tracking-wider text-zinc-300 block">
            Indicaciones para la Cocina:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {detalle.preferenciasSugeridas.map((pref) => {
              const activa = preferenciasSeleccionadas.includes(pref);
              return (
                <button
                  key={pref}
                  type="button"
                  onClick={() => togglePreferencia(pref)}
                  className={`neo-btn rounded-lg border-2 px-2.5 py-1 text-[11px] font-black uppercase tracking-wider transition-all flex items-center gap-1 ${
                    activa
                      ? 'border-black bg-orange-500 text-black shadow-[2px_2px_0px_0px_#fff]'
                      : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700 hover:text-white'
                  }`}
                >
                  {activa && <Check className="w-3 h-3 stroke-[3]" />}
                  <span>{pref}</span>
                </button>
              );
            })}
          </div>

          <input
            type="text"
            placeholder="Nota especial (ej: poco picante, servir primero a los niños...)"
            value={notaEspecial}
            onChange={(e) => setNotaEspecial(e.target.value)}
            className="w-full mt-2 rounded-xl border-2 border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-orange-500 focus:outline-none"
          />
        </div>
      </div>
    </Modal>
  );
}
