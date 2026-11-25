'use client';

import { BebidaInventarioDTO } from '../types/inventario';
import { formatearCOP } from '@/lib/currency';
import { Wine, Plus, Scale, Pencil, Trash2, Link2, AlertCircle, ShieldAlert } from 'lucide-react';

interface InventarioTablaProps {
  bebidas: BebidaInventarioDTO[];
  onAbastecer: (bebida: BebidaInventarioDTO) => void;
  onAjustar: (bebida: BebidaInventarioDTO) => void;
  onEditar: (bebida: BebidaInventarioDTO) => void;
  onEliminar: (id: string, nombre: string) => void;
}

export function InventarioTabla({
  bebidas,
  onAbastecer,
  onAjustar,
  onEditar,
  onEliminar,
}: InventarioTablaProps) {
  return (
    <div className="rounded-2xl border-2 border-zinc-800 bg-zinc-950 overflow-hidden shadow-[5px_5px_0px_0px_#18181b]">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b-2 border-zinc-800 bg-zinc-900 text-[11px] font-display font-black uppercase tracking-wider text-zinc-300">
            <tr>
              <th className="px-4 py-3.5">Bebida / Presentación</th>
              <th className="px-4 py-3.5 text-center">Stock Actual</th>
              <th className="px-4 py-3.5 text-right">Costo Unit.</th>
              <th className="px-4 py-3.5 text-right">Precio Venta</th>
              <th className="px-4 py-3.5 text-right">Margen Unit.</th>
              <th className="px-4 py-3.5 text-right">Total Costo</th>
              <th className="px-4 py-3.5 text-right">Total Venta</th>
              <th className="px-4 py-3.5 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-zinc-900">
            {bebidas.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-zinc-500 font-medium">
                  No se encontraron bebidas registradas con los filtros actuales.
                </td>
              </tr>
            ) : (
              bebidas.map((b) => (
                <tr key={b.id} className="hover:bg-zinc-900/50 transition-colors">
                  {/* Nombre y Enlace al Menú */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-900 border-2 border-zinc-700 text-zinc-300">
                        <Wine className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-display font-black text-white text-sm tracking-tight">{b.nombre}</p>
                        {b.productoNombre ? (
                          <span className="inline-flex items-center gap-1 rounded bg-blue-950/80 border border-blue-700 px-1.5 py-0.5 text-[9px] font-bold text-blue-300 mt-0.5">
                            <Link2 className="h-2.5 w-2.5" />
                            {b.productoNombre}
                          </span>
                        ) : (
                          <span className="text-[10px] text-zinc-500">Solo inventario</span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Stock y Estado */}
                  <td className="px-4 py-3.5 text-center">
                    <div className="inline-flex flex-col items-center">
                      <span
                        className={`rounded-lg px-2.5 py-0.5 text-xs font-black uppercase tracking-wider border-2 ${
                          b.estadoStock === 'AGOTADO'
                            ? 'bg-rose-500 text-black border-rose-400 shadow-[2px_2px_0px_0px_#fff] animate-pulse'
                            : b.estadoStock === 'BAJO'
                            ? 'bg-amber-400 text-black border-amber-300 shadow-[2px_2px_0px_0px_#fff]'
                            : 'bg-emerald-950 text-emerald-300 border-emerald-700'
                        }`}
                      >
                        {b.stockActual} uds
                      </span>
                      <span className="text-[10px] text-zinc-500 font-bold mt-1">
                        Mín: {b.stockMinimo}
                      </span>
                    </div>
                  </td>

                  {/* Costo Unitario */}
                  <td className="px-4 py-3.5 text-right font-medium text-zinc-300">
                    {formatearCOP(b.costoUnitario)}
                  </td>

                  {/* Precio Venta */}
                  <td className="px-4 py-3.5 text-right font-black text-white">
                    {formatearCOP(b.precioVenta)}
                  </td>

                  {/* Margen Unitario */}
                  <td className="px-4 py-3.5 text-right font-bold text-emerald-400">
                    +{formatearCOP(b.margenUnitario)}
                  </td>

                  {/* Valor en Costo (Total por producto) */}
                  <td className="px-4 py-3.5 text-right font-extrabold text-amber-400">
                    {formatearCOP(b.valorCostoTotal)}
                  </td>

                  {/* Valor en Venta (Total por producto) */}
                  <td className="px-4 py-3.5 text-right font-black text-emerald-400">
                    {formatearCOP(b.valorVentaTotal)}
                  </td>

                  {/* Botones de Acción */}
                  <td className="px-4 py-3.5 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      {/* Abastecer (+ unidades) */}
                      <button
                        type="button"
                        onClick={() => onAbastecer(b)}
                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-500 border-2 border-emerald-400 px-2.5 py-1 text-[11px] font-black uppercase text-black shadow-[2px_2px_0px_0px_#fff] hover:bg-emerald-400 active:translate-x-[1px] active:translate-y-[1px] transition-all"
                        title="Abastecer stock"
                      >
                        <Plus className="h-3 w-3 stroke-[3]" />
                        Surtir
                      </button>

                      {/* Ajustar Stock Manual */}
                      <button
                        type="button"
                        onClick={() => onAjustar(b)}
                        className="inline-flex items-center gap-1 rounded-lg bg-zinc-900 border-2 border-zinc-700 px-2 py-1 text-[11px] font-bold text-zinc-200 hover:border-zinc-500 hover:text-white active:translate-x-[1px] active:translate-y-[1px] transition-all"
                        title="Ajuste manual de conteo o merma"
                      >
                        <Scale className="h-3 w-3" />
                        Ajuste
                      </button>

                      {/* Editar */}
                      <button
                        type="button"
                        onClick={() => onEditar(b)}
                        className="rounded-lg bg-zinc-900 border-2 border-zinc-800 p-1.5 text-zinc-400 hover:text-white hover:border-zinc-600 transition-all active:translate-x-[1px] active:translate-y-[1px]"
                        title="Editar precios o datos"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>

                      {/* Eliminar */}
                      <button
                        type="button"
                        onClick={() => onEliminar(b.id, b.nombre)}
                        className="rounded-lg bg-zinc-900 border-2 border-zinc-800 p-1.5 text-zinc-500 hover:text-rose-400 hover:border-rose-700 transition-all active:translate-x-[1px] active:translate-y-[1px]"
                        title="Eliminar del inventario"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

