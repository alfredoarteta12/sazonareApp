'use client';

import { useState, useEffect } from 'react';
import { getHistorialCierres } from '../actions/cierre-caja-actions';
import { TicketReporteZModal, CierreCajaData } from './ticket-reporte-z-modal';
import { formatearFechaColombia, formatearHoraColombia } from '@/lib/date-utils';
import { formatearCOP } from '@/lib/currency';

interface HistorialCierresModalProps {
  onCerrar: () => void;
}

export function HistorialCierresModal({ onCerrar }: HistorialCierresModalProps) {
  const [cargando, setCargando] = useState(true);
  const [cierres, setCierres] = useState<CierreCajaData[]>([]);
  const [cierreSeleccionado, setCierreSeleccionado] = useState<CierreCajaData | null>(null);

  useEffect(() => {
    async function cargar() {
      setCargando(true);
      const res = await getHistorialCierres(50);
      if (res.success && res.data) {
        setCierres(res.data as CierreCajaData[]);
      }
      setCargando(false);
    }
    cargar();
  }, []);

  if (cierreSeleccionado) {
    return (
      <TicketReporteZModal
        cierre={cierreSeleccionado}
        onCerrar={() => setCierreSeleccionado(null)}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-4 backdrop-blur-sm">
      <div className="fixed inset-0" onClick={onCerrar} />

      <div className="relative z-10 flex max-h-[92vh] w-full max-w-4xl flex-col rounded-3xl border border-zinc-800 bg-zinc-950 p-5 sm:p-6 shadow-2xl">
        {/* Cabecera del Modal */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-zinc-900 border border-zinc-800 text-2xl">
              📜
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base sm:text-lg">
                Historial de Cierres de Caja (Reportes Z)
              </h3>
              <p className="text-xs text-zinc-400">
                Auditoría histórica de arqueos y cuadres de caja diarios
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            className="rounded-xl p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* CONTENIDO DE LA TABLA */}
        <div className="flex-1 overflow-y-auto py-4">
          {cargando ? (
            <div className="py-20 text-center text-zinc-400">
              <div className="h-8 w-8 mx-auto mb-3 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
              <p className="text-sm font-semibold">Cargando historial de cierres...</p>
            </div>
          ) : cierres.length === 0 ? (
            <div className="py-20 text-center text-zinc-500">
              <p className="text-4xl mb-2">📦</p>
              <p className="text-sm font-semibold">Aún no se han registrado cierres de caja.</p>
              <p className="text-xs text-zinc-600 mt-1">
                Usa el botón &quot;Arqueo y Cierre de Caja&quot; al finalizar el turno para generar el primer Reporte Z.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-zinc-800">
              <table className="w-full text-sm">
                <thead className="bg-zinc-900/90 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  <tr>
                    <th className="px-4 py-3 text-left">Fecha / Hora</th>
                    <th className="px-4 py-3 text-left">Responsable</th>
                    <th className="px-4 py-3 text-right">Base</th>
                    <th className="px-4 py-3 text-right">Ventas Efectivo</th>
                    <th className="px-4 py-3 text-right">Total Ventas</th>
                    <th className="px-4 py-3 text-right">Efectivo Real</th>
                    <th className="px-4 py-3 text-center">Diferencia</th>
                    <th className="px-4 py-3 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900">
                  {cierres.map((c) => {
                    const difEsCero = Math.abs(c.diferencia) < 0.01;
                    const difEsSobrante = c.diferencia > 0.01;

                    return (
                      <tr key={c.id} className="hover:bg-zinc-900/50 transition-colors">
                        <td className="px-4 py-3 text-xs text-zinc-300 whitespace-nowrap">
                          {formatearFechaColombia(c.fecha)} • {formatearHoraColombia(c.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-xs font-semibold text-white whitespace-nowrap">
                          {c.responsable}
                        </td>
                        <td className="px-4 py-3 text-xs text-right text-zinc-400 whitespace-nowrap">
                          {formatearCOP(c.baseInicial)}
                        </td>
                        <td className="px-4 py-3 text-xs text-right font-bold text-zinc-200 whitespace-nowrap">
                          {formatearCOP(c.ventasEfectivo)}
                        </td>
                        <td className="px-4 py-3 text-xs text-right font-black text-emerald-400 whitespace-nowrap">
                          {formatearCOP(c.totalVentas)}
                        </td>
                        <td className="px-4 py-3 text-xs text-right font-black text-white whitespace-nowrap">
                          {formatearCOP(c.efectivoReal)}
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                              difEsCero
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                                : difEsSobrante
                                ? 'bg-blue-950 text-blue-300 border border-blue-700'
                                : 'bg-rose-950 text-rose-300 border border-rose-800'
                            }`}
                          >
                            {c.diferencia >= 0 ? '+' : ''}{formatearCOP(c.diferencia)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setCierreSeleccionado(c)}
                            className="rounded-lg bg-orange-500/10 border border-orange-500/30 px-2.5 py-1 text-xs font-bold text-orange-400 hover:bg-orange-500 hover:text-white transition-all shadow-sm"
                          >
                            🖨️ Ver Reporte Z
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Acciones Inferiores */}
        <div className="pt-3 border-t border-zinc-800 flex justify-end">
          <button
            type="button"
            onClick={onCerrar}
            className="rounded-xl bg-zinc-900 border border-zinc-800 px-5 py-2.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

