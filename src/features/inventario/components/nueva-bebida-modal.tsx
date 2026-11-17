'use client';

import { useState } from 'react';
import { ProductoOpcion, CrearBebidaPayload } from '../types/inventario';
import { formatearCOP } from '@/lib/currency';

interface NuevaBebidaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CrearBebidaPayload) => Promise<boolean>;
  productosDisponibles: ProductoOpcion[];
  isPending: boolean;
}

export function NuevaBebidaModal({
  isOpen,
  onClose,
  onSubmit,
  productosDisponibles,
  isPending,
}: NuevaBebidaModalProps) {
  const [nombre, setNombre] = useState('');
  const [stockInicial, setStockInicial] = useState<number | ''>('');
  const [stockMinimo, setStockMinimo] = useState<number | ''>(5);
  const [costoUnitario, setCostoUnitario] = useState<number | ''>('');
  const [precioVenta, setPrecioVenta] = useState<number | ''>('');
  const [productoId, setProductoId] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    const exito = await onSubmit({
      nombre: nombre.trim(),
      stockInicial: Number(stockInicial) || 0,
      stockMinimo: Number(stockMinimo) || 5,
      costoUnitario: Number(costoUnitario) || 0,
      precioVenta: Number(precioVenta) || 0,
      productoId: productoId || undefined,
    });

    if (exito) {
      setNombre('');
      setStockInicial('');
      setStockMinimo(5);
      setCostoUnitario('');
      setPrecioVenta('');
      setProductoId('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-3xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span>🥤</span> Registrar Nueva Bebida en Inventario
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
              placeholder="Ej: Coca-Cola 400ml, Cerveza Corona, Agua Manantial"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-xs text-white focus:border-orange-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">
                Stock Inicial (Unidades) *
              </label>
              <input
                type="number"
                min="0"
                required
                placeholder="Ej: 24"
                value={stockInicial}
                onChange={(e) =>
                  setStockInicial(e.target.value === '' ? '' : Number(e.target.value))
                }
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-xs text-white focus:border-orange-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">
                Stock Mínimo de Alerta
              </label>
              <input
                type="number"
                min="1"
                placeholder="Ej: 6"
                value={stockMinimo}
                onChange={(e) =>
                  setStockMinimo(e.target.value === '' ? '' : Number(e.target.value))
                }
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-xs text-white focus:border-orange-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">
                Costo de Compra Unitario (COP) *
              </label>
              <input
                type="number"
                min="0"
                step="100"
                required
                placeholder="Ej: 2500"
                value={costoUnitario}
                onChange={(e) =>
                  setCostoUnitario(e.target.value === '' ? '' : Number(e.target.value))
                }
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-xs text-white focus:border-orange-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">
                Precio de Venta al Público (COP) *
              </label>
              <input
                type="number"
                min="0"
                step="100"
                required
                placeholder="Ej: 5000"
                value={precioVenta}
                onChange={(e) =>
                  setPrecioVenta(e.target.value === '' ? '' : Number(e.target.value))
                }
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-xs text-white focus:border-orange-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Vinculación opcional con producto del menú */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">
              Vincular a Platillo/Bebida del Menú (Opcional)
            </label>
            <select
              value={productoId}
              onChange={(e) => setProductoId(e.target.value)}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-xs text-white focus:border-orange-500 focus:outline-none"
            >
              <option value="">-- Sin vincular directamente (Solo inventario) --</option>
              {productosDisponibles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre} ({formatearCOP(p.precio)})
                </option>
              ))}
            </select>
            <p className="text-[10px] text-zinc-500 mt-1">
              💡 Al vincularlo, cuando el stock llegue a 0 se marcará automáticamente como &quot;Agotado&quot; en la carta y cocina.
            </p>
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
              {isPending ? 'Guardando...' : 'Guardar Bebida'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
