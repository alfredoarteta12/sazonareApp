'use client';

import { BebidaInventarioDTO } from '../types/inventario';
import { formatearCOP } from '@/lib/currency';

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
    <div className="rounded-3xl border border-zinc-800 bg-zinc-950 overflow-hidden shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-zinc-800 bg-zinc-900/80 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
            <tr>
              <th className="px-4 py-3.5">Bebida / Presentación</th>
              <th className="px-4 py-3.5 text-center">Stock Actual</th>
              <th className="px-4 py-3.5 text-right">Costo Unitario</th>
              <th className="px-4 py-3.5 text-right">Precio Venta</th>
              <th className="px-4 py-3.5 text-right">Margen Unitario</th>
              <th className="px-4 py-3.5 text-right">Valor en Costo</th>
              <th className="px-4 py-3.5 text-right">Valor en Venta</th>
              <th className="px-4 py-3.5 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {bebidas.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-zinc-500">
                  No se encontraron bebidas registradas con los filtros actuales.
                </td>
              </tr>
            ) : (
              bebidas.map((b) => (
                <tr key={b.id} className="hover:bg-zinc-900/40 transition-colors">
                  {/* Nombre y Enlace al Menú */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🥤</span>
                      <div>
                        <p className="font-bold text-white text-sm">{b.nombre}</p>
                        {b.productoNombre ? (
                          <span className="inline-flex items-center gap-1 rounded bg-blue-950/60 border border-blue-800/60 px-1.5 py-0.5 text-[9px] font-bold text-blue-300 mt-0.5">
                            🔗 Vinculado a: {b.productoNombre}
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
                        className={`rounded-full px-3 py-0.5 text-xs font-black border ${
                          b.estadoStock === 'AGOTADO'
                            ? 'bg-rose-950 text-rose-300 border-rose-700 animate-pulse'
                            : b.estadoStock === 'BAJO'
                            ? 'bg-amber-950 text-amber-300 border-amber-700'
                            : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                        }`}
                      >
                        {b.stockActual} uds
                      </span>
                      <span className="text-[10px] text-zinc-500 mt-0.5">
                        Mín: {b.stockMinimo}
                      </span>
                    </div>
                  </td>

                  {/* Costo Unitario */}
                  <td className="px-4 py-3.5 text-right font-medium text-zinc-300">
                    {formatearCOP(b.costoUnitario)}
                  </td>

                  {/* Precio Venta */}
                  <td className="px-4 py-3.5 text-right font-bold text-white">
                    {formatearCOP(b.precioVenta)}
                  </td>

                  {/* Margen Unitario */}
                  <td className="px-4 py-3.5 text-right font-semibold text-emerald-400">
                    +{formatearCOP(b.margenUnitario)}
                  </td>

                  {/* Valor en Costo (Total por producto) */}
                  <td className="px-4 py-3.5 text-right font-extrabold text-amber-400">
                    {formatearCOP(b.valorCostoTotal)}
                  </td>

                  {/* Valor en Venta (Total por producto) */}
                  <td className="px-4 py-3.5 text-right font-extrabold text-emerald-400">
                    {formatearCOP(b.valorVentaTotal)}
                  </td>

                  {/* Botones de Acción */}
                  <td className="px-4 py-3.5 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      {/* Abastecer (+ unidades) */}
                      <button
                        type="button"
                        onClick={() => onAbastecer(b)}
                        className="rounded-lg bg-emerald-950/60 border border-emerald-800 px-2.5 py-1 text-[11px] font-bold text-emerald-300 hover:bg-emerald-900 transition-colors"
                        title="Abastecer stock"
                      >
                        + Surtir
                      </button>

                      {/* Ajustar Stock Manual */}
                      <button
                        type="button"
                        onClick={() => onAjustar(b)}
                        className="rounded-lg bg-zinc-900 border border-zinc-700 px-2 py-1 text-[11px] font-medium text-zinc-300 hover:bg-zinc-800 transition-colors"
                        title="Ajuste manual de conteo o merma"
                      >
                        ⚖️ Ajuste
                      </button>

                      {/* Editar */}
                      <button
                        type="button"
                        onClick={() => onEditar(b)}
                        className="rounded-lg bg-zinc-900 border border-zinc-800 p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                        title="Editar precios o datos"
                      >
                        ✏️
                      </button>

                      {/* Eliminar */}
                      <button
                        type="button"
                        onClick={() => onEliminar(b.id, b.nombre)}
                        className="rounded-lg bg-zinc-900 border border-zinc-800 p-1 text-zinc-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                        title="Eliminar del inventario"
                      >
                        🗑️
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

