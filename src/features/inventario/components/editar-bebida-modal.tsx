'use client';

import { useState, useEffect } from 'react';
import { BebidaInventarioDTO, ProductoOpcion, ActualizarBebidaPayload } from '../types/inventario';
import { formatearCOP } from '@/lib/currency';

interface EditarBebidaModalProps {
  bebida: BebidaInventarioDTO | null;
  onClose: () => void;
  onSubmit: (payload: ActualizarBebidaPayload) => Promise<boolean>;
  productosDisponibles: ProductoOpcion[];
  isPending: boolean;
}

export function EditarBebidaModal({
  bebida,
  onClose,
  onSubmit,
  productosDisponibles,
  isPending,
}: EditarBebidaModalProps) {
  const [nombre, setNombre] = useState('');
  const [costoUnitario, setCostoUnitario] = useState<number>(0);
  const [precioVenta, setPrecioVenta] = useState<number>(0);
  const [stockMinimo, setStockMinimo] = useState<number>(5);
  const [productoId, setProductoId] = useState<string>('');

  useEffect(() => {
    if (bebida) {
      setNombre(bebida.nombre);
      setCostoUnitario(bebida.costoUnitario);
      setPrecioVenta(bebida.precioVenta);
      setStockMinimo(bebida.stockMinimo);
      setProductoId(bebida.productoId || '');
    }
  }, [bebida]);

  if (!bebida) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    const exito = await onSubmit({
      id: bebida.id,
      nombre: nombre.trim(),
      costoUnitario,
      precioVenta,
      stockMinimo,
      productoId: productoId || null,
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
            <span>✏️</span> Editar Bebida • {bebida.nombre}
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
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">
              Nombre de la Bebida *
            </label>
            <input
              type="text"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-xs text-white focus:border-orange-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">
                Costo Compra (COP) *
              </label>
              <input
                type="number"
                min="0"
                step="100"
                required
                value={costoUnitario}
                onChange={(e) => setCostoUnitario(Number(e.target.value))}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-xs text-white focus:border-orange-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">
                Precio Venta (COP) *
              </label>
              <input
                type="number"
                min="0"
                step="100"
                required
                value={precioVenta}
                onChange={(e) => setPrecioVenta(Number(e.target.value))}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-xs text-white focus:border-orange-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">
              Stock Mínimo de Alerta
            </label>
            <input
              type="number"
              min="1"
              required
              value={stockMinimo}
              onChange={(e) => setStockMinimo(Number(e.target.value))}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-xs text-white focus:border-orange-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">
              Vincular a Platillo/Bebida del Menú
            </label>
            <select
              value={productoId}
              onChange={(e) => setProductoId(e.target.value)}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-xs text-white focus:border-orange-500 focus:outline-none"
            >
              <option value="">-- Sin vincular directamente --</option>
              {productosDisponibles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre} ({formatearCOP(p.precio)})
                </option>
              ))}
            </select>
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
              className="rounded-xl bg-orange-600 hover:bg-orange-500 px-5 py-2 text-xs font-bold text-white transition-all disabled:opacity-50"
            >
              {isPending ? 'Guardando...' : 'Actualizar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
