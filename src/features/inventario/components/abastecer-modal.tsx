'use client';

import { useState, useEffect } from 'react';
import { BebidaInventarioDTO, AbastecerPayload } from '../types/inventario';
import { formatearCOP } from '@/lib/currency';

interface AbastecerModalProps {
  bebida: BebidaInventarioDTO | null;
  onClose: () => void;
  onSubmit: (payload: AbastecerPayload) => Promise<boolean>;
  isPending: boolean;
}

export function AbastecerModal({
  bebida,
  onClose,
  onSubmit,
  isPending,
}: AbastecerModalProps) {
  const [cantidad, setCantidad] = useState<number | ''>('');
  const [nuevoCosto, setNuevoCosto] = useState<number | ''>('');
  const [motivo, setMotivo] = useState('Compra a distribuidor');

  useEffect(() => {
    if (bebida) {
      setCantidad('');
      setNuevoCosto(bebida.costoUnitario);
      setMotivo('Compra a distribuidor');
    }
  }, [bebida]);

  if (!bebida) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cant = Number(cantidad);
    if (!cant || cant <= 0) return;

    const exito = await onSubmit({
      id: bebida.id,
      cantidad: cant,
      nuevoCostoUnitario: nuevoCosto ? Number(nuevoCosto) : undefined,
      motivo,
    });

    if (exito) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span>📦</span> Abastecer Stock • {bebida.nombre}
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
            <span className="text-zinc-400">Stock Actual:</span>
            <span className="font-black text-white">{bebida.stockActual} unidades</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">
              Cantidad a Ingresar (Unidades) *
            </label>
            <input
              type="number"
              min="1"
              required
              placeholder="Ej: 24 (una paca/caja)"
              value={cantidad}
              onChange={(e) =>
                setCantidad(e.target.value === '' ? '' : Number(e.target.value))
              }
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">
              Costo de Compra Unitario (COP)
            </label>
            <input
              type="number"
              min="0"
              step="100"
              placeholder={`Actual: ${formatearCOP(bebida.costoUnitario)}`}
              value={nuevoCosto}
              onChange={(e) =>
                setNuevoCosto(e.target.value === '' ? '' : Number(e.target.value))
              }
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
            />
            <p className="text-[10px] text-zinc-500 mt-0.5">
              Deja el mismo valor si el precio de compra no cambió.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">
              Motivo / Proveedor
            </label>
            <input
              type="text"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ej: Factura Distribuidor Bavária, Éxito, etc."
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
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
              className="rounded-xl bg-emerald-600 hover:bg-emerald-500 px-5 py-2 text-xs font-bold text-white transition-all disabled:opacity-50"
            >
              {isPending ? 'Ingresando...' : '+ Confirmar Ingreso'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
