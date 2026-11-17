'use client';

import { useState, useEffect } from 'react';
import { BebidaInventarioDTO, AjustarStockPayload } from '../types/inventario';

interface AjusteStockModalProps {
  bebida: BebidaInventarioDTO | null;
  onClose: () => void;
  onSubmit: (payload: AjustarStockPayload) => Promise<boolean>;
  isPending: boolean;
}

export function AjusteStockModal({
  bebida,
  onClose,
  onSubmit,
  isPending,
}: AjusteStockModalProps) {
  const [nuevoStock, setNuevoStock] = useState<number | ''>('');
  const [motivo, setMotivo] = useState('Conteo físico de inventario');

  useEffect(() => {
    if (bebida) {
      setNuevoStock(bebida.stockActual);
      setMotivo('Conteo físico de inventario');
    }
  }, [bebida]);

  if (!bebida) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (nuevoStock === '' || Number(nuevoStock) < 0) return;
    if (!motivo.trim()) return;

    const exito = await onSubmit({
      id: bebida.id,
      nuevoStock: Number(nuevoStock),
      motivo: motivo.trim(),
    });

    if (exito) {
      onClose();
    }
  };

  const diferencia = nuevoStock !== '' ? Number(nuevoStock) - bebida.stockActual : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span>⚖️</span> Ajuste Manual • {bebida.nombre}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-500 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-xl bg-zinc-900/60 p-3 flex justify-between text-xs">
            <span className="text-zinc-400">Stock Actual en Sistema:</span>
            <span className="font-black text-white">{bebida.stockActual} unidades</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">
              Nuevo Stock Real Contado *
            </label>
            <input
              type="number"
              min="0"
              required
              value={nuevoStock}
              onChange={(e) =>
                setNuevoStock(e.target.value === '' ? '' : Number(e.target.value))
              }
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-xs text-white focus:border-orange-500 focus:outline-none"
            />
            {diferencia !== 0 && (
              <p
                className={`text-[11px] font-bold mt-1.5 ${
                  diferencia > 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                Variación: {diferencia > 0 ? `+${diferencia}` : diferencia} unidades (
                {diferencia > 0 ? 'Entrada por sobrante' : 'Salida por merma/pérdida'})
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">
              Motivo de la Corrección *
            </label>
            <input
              type="text"
              required
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ej: Conteo físico fin de semana, Botella rota, etc."
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-xs text-white focus:border-orange-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-xl bg-amber-600 hover:bg-amber-500 px-5 py-2 text-xs font-bold text-white transition-all disabled:opacity-50"
            >
              {isPending ? 'Guardando...' : 'Aplicar Ajuste'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
