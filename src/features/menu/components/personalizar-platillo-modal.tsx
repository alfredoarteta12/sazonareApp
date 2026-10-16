'use client';

import { useState } from 'react';
import { ItemCarrito } from '@/features/orders/actions/order-mutations';

interface ProductoBase {
  id: string;
  nombre: string;
  precio: number;
  categoriaNombre?: string;
}

interface PersonalizarPlatilloModalProps {
  producto: ProductoBase;
  itemExistente?: ItemCarrito;
  onConfirmar: (item: ItemCarrito) => void;
  onCerrar: () => void;
}

// Indicaciones rápidas comunes de preparación (sin costo)
const MODIFICADORES_RAPIDOS = [
  'Sin salsas',
  'Sin cebolla',
  'Sin tomate',
  'Salsas aparte',
  'Término 3/4',
  'Bien cocido',
  'Término medio',
  'Poco picante',
  'Poco ripio',
  'Pan bien tostado',
];

export function PersonalizarPlatilloModal({
  producto,
  itemExistente,
  onConfirmar,
  onCerrar,
}: PersonalizarPlatilloModalProps) {
  const [cantidad, setCantidad] = useState(itemExistente?.cantidad || 1);
  const [modificadoresActivos, setModificadoresActivos] = useState<string[]>(() => {
    if (!itemExistente?.notas) return [];
    return MODIFICADORES_RAPIDOS.filter((mod) => itemExistente.notas?.includes(mod));
  });

  // Nota personalizada libre
  const [notaLibre, setNotaLibre] = useState<string>(() => {
    if (!itemExistente?.notas) return '';
    let restante = itemExistente.notas;
    MODIFICADORES_RAPIDOS.forEach((mod) => {
      restante = restante.replace(mod, '').replace(/,\s*,/g, ',').trim();
    });
    return restante.replace(/^,\s*|,\s*$/g, '').trim();
  });

  // Toggle de modificador rápido sin costo
  const toggleModificador = (mod: string) => {
    setModificadoresActivos((prev) =>
      prev.includes(mod) ? prev.filter((m) => m !== mod) : [...prev, mod]
    );
  };

  // Construcción de la nota consolidada
  const construirNotaFinal = () => {
    const partes: string[] = [...modificadoresActivos];
    if (notaLibre.trim()) {
      partes.push(notaLibre.trim());
    }
    return partes.join(', ');
  };

  const handleGuardar = () => {
    const notaFinal = construirNotaFinal();
    const itemResultante: ItemCarrito = {
      id: itemExistente?.id || `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      productoId: producto.id,
      nombre: producto.nombre,
      precio: producto.precio,
      notas: notaFinal || undefined,
      cantidad,
    };
    onConfirmar(itemResultante);
  };

  // Agregar rápido directo (sin cambios)
  const handleAgregarDirecto = () => {
    onConfirmar({
      id: itemExistente?.id || `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      productoId: producto.id,
      nombre: producto.nombre,
      precio: producto.precio,
      notas: undefined,
      cantidad: 1,
    });
  };

  const precioTotal = producto.precio * cantidad;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-4 backdrop-blur-sm">
      <div className="fixed inset-0" onClick={onCerrar} />

      <div className="relative z-10 flex max-h-[92vh] w-full max-w-md flex-col rounded-3xl border border-zinc-800 bg-zinc-950 p-4 sm:p-6 shadow-2xl">
        {/* Cabecera */}
        <div className="flex items-start justify-between pb-3.5 border-b border-zinc-800 shrink-0">
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400">
              {producto.categoriaNombre || 'Platillo'} • {itemExistente ? 'Modificar Indicaciones' : 'Indicaciones de Cocina'}
            </span>
            <h3 className="text-lg font-black text-white truncate">
              {producto.nombre}
            </h3>
            <p className="text-xs text-zinc-400 font-semibold mt-0.5">
              Precio: <span className="text-white">${producto.precio.toFixed(2)}</span>
            </p>
          </div>

          <button
            type="button"
            onClick={onCerrar}
            className="rounded-xl p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Contenido desplazable */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          {/* Botón rápido si es nuevo y no tiene indicaciones */}
          {!itemExistente && modificadoresActivos.length === 0 && !notaLibre && (
            <button
              type="button"
              onClick={handleAgregarDirecto}
              className="w-full flex items-center justify-between rounded-2xl bg-zinc-900 border border-zinc-800 p-3 hover:border-orange-500/50 hover:bg-zinc-800/80 transition-all text-left group"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-xl">⚡</span>
                <div>
                  <p className="text-xs font-bold text-white group-hover:text-orange-400 transition-colors">
                    Agregar Normal (Sin Cambios)
                  </p>
                  <p className="text-[11px] text-zinc-400">Preparación estándar de la casa</p>
                </div>
              </div>
              <span className="rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30 px-3 py-1 text-xs font-bold">
                +${producto.precio.toFixed(2)}
              </span>
            </button>
          )}

          {/* INDICACIONES RÁPIDAS DE 1 TOQUE (Sin salsas, etc.) */}
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-zinc-300 mb-2">
              🏷️ Preferencias Rápidas de Preparación
            </label>
            <div className="flex flex-wrap gap-1.5">
              {MODIFICADORES_RAPIDOS.map((mod) => {
                const activo = modificadoresActivos.includes(mod);
                return (
                  <button
                    key={mod}
                    type="button"
                    onClick={() => toggleModificador(mod)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all border ${
                      activo
                        ? 'bg-amber-500 text-black border-amber-400 shadow-sm font-bold'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                    }`}
                  >
                    {activo ? `✓ ${mod}` : mod}
                  </button>
                );
              })}
            </div>
          </div>

          {/* DESCRIPCIÓN O NOTA PERSONALIZADA LIBRE */}
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-zinc-300 mb-1.5">
              📝 Descripción / Instrucción Especial
            </label>
            <textarea
              rows={2}
              placeholder="Ej: Sin mayonesa, salsa tártara aparte, el pan bien dorado..."
              value={notaLibre}
              onChange={(e) => setNotaLibre(e.target.value)}
              className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 p-3 text-xs sm:text-sm text-white placeholder-zinc-500 focus:border-orange-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Pie: Selector de Cantidad y Botón de Confirmación */}
        <div className="pt-3.5 border-t border-zinc-800 shrink-0 space-y-3">
          <div className="flex items-center justify-between">
            {/* Control de cantidad */}
            <div className="flex items-center gap-2 rounded-2xl bg-zinc-900 border border-zinc-800 p-1">
              <button
                type="button"
                onClick={() => setCantidad((c) => Math.max(1, c - 1))}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-800 text-sm font-black text-white hover:bg-zinc-700 active:scale-90"
              >
                -
              </button>
              <span className="w-8 text-center text-sm font-black text-white">{cantidad}</span>
              <button
                type="button"
                onClick={() => setCantidad((c) => c + 1)}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-800 text-sm font-black text-white hover:bg-zinc-700 active:scale-90"
              >
                +
              </button>
            </div>

            {/* Resumen de precio */}
            <div className="text-right">
              <p className="text-[11px] text-zinc-400">
                ${producto.precio.toFixed(2)} c/u
              </p>
              <p className="text-xl font-black text-white">
                ${precioTotal.toFixed(2)}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGuardar}
            className="w-full rounded-2xl bg-orange-500 py-3 text-xs sm:text-sm font-black text-white shadow-lg shadow-orange-500/30 transition-all hover:bg-orange-600 active:scale-95 flex items-center justify-center gap-2"
          >
            <span>{itemExistente ? '💾' : '🛒'}</span>
            <span>
              {itemExistente
                ? 'Guardar Cambios'
                : modificadoresActivos.length > 0 || notaLibre.trim()
                ? 'Agregar con Indicación'
                : 'Agregar a la Comanda'}{' '}
              • ${precioTotal.toFixed(2)}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
