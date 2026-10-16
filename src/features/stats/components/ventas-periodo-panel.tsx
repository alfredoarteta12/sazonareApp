'use client';

import { useState, useTransition, useEffect } from 'react';
import {
  getPeriodFinancials,
  PeriodoReporte,
  ReportePeriodoData,
} from '../actions/get-financial-reports';
import { BotonRecibo } from './boton-recibo';
import { formatearHoraColombia, formatearFechaColombia } from '@/lib/date-utils';

interface VentasPeriodoPanelProps {
  reporteInicial: ReportePeriodoData;
}

export function VentasPeriodoPanel({ reporteInicial }: VentasPeriodoPanelProps) {
  const [periodo, setPeriodo] = useState<PeriodoReporte>('dia');
  const [reporte, setReporte] = useState<ReportePeriodoData>(reporteInicial);
  const [isPending, startTransition] = useTransition();
  const [busqueda, setBusqueda] = useState('');

  const cambiarPeriodo = (nuevoPeriodo: PeriodoReporte) => {
    setPeriodo(nuevoPeriodo);
    startTransition(async () => {
      const res = await getPeriodFinancials(nuevoPeriodo);
      if (res.success && res.data) {
        setReporte(res.data);
      }
    });
  };

  // Encontrar el valor máximo de ventas en el desglose para escalar las barras de la gráfica
  const maxVentaDesglose = Math.max(...reporte.desglose.map((d) => d.total), 1);

  // Filtrado de pedidos en la tabla
  const pedidosFiltrados = reporte.pedidos.filter((p) => {
    if (!busqueda.trim()) return true;
    const term = busqueda.toLowerCase();
    return (
      p.detalle.toLowerCase().includes(term) ||
      `mesa ${p.mesa}`.includes(term) ||
      (p.metodoPago && p.metodoPago.toLowerCase().includes(term)) ||
      p.estado.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* SELECTOR DE PERÍODO (DÍA / SEMANA / MES) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-3xl border border-zinc-800 bg-zinc-950 p-4 sm:p-5 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">📊</span>
            <h3 className="text-base sm:text-lg font-black text-white">
              Reporte de Ventas por Período
            </h3>
            <span className="rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
              {reporte.rangoTexto}
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Horario oficial de Colombia (America/Bogota) • Agregaciones en tiempo real
          </p>
        </div>

        {/* Tabs de período */}
        <div className="flex items-center gap-1.5 rounded-2xl bg-zinc-900 border border-zinc-800 p-1">
          <button
            type="button"
            onClick={() => cambiarPeriodo('dia')}
            disabled={isPending}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
              periodo === 'dia'
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <span>📅</span> Hoy
          </button>

          <button
            type="button"
            onClick={() => cambiarPeriodo('semana')}
            disabled={isPending}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
              periodo === 'semana'
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <span>📆</span> Esta Semana
          </button>

          <button
            type="button"
            onClick={() => cambiarPeriodo('mes')}
            disabled={isPending}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
              periodo === 'mes'
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <span>🗓️</span> Este Mes
          </button>
        </div>
      </div>

      {/* CARDS DE RESUMEN FINANCIERO DEL PERÍODO */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Ingreso Neto */}
        <div className="rounded-2xl border border-emerald-900/50 bg-gradient-to-br from-zinc-950 via-zinc-900 to-emerald-950/20 p-4 sm:p-5 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Ventas Netas
            </span>
            <span className="text-xl">💰</span>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white">
            ${reporte.ingresoNeto.toFixed(2)}
          </p>
          <p className="text-[11px] text-emerald-400 font-semibold mt-1">
            {reporte.pedidosExitosos} pedidos completados
          </p>
        </div>

        {/* Efectivo vs Transferencia */}
        <div className="rounded-2xl border border-blue-900/50 bg-gradient-to-br from-zinc-950 via-zinc-900 to-blue-950/20 p-4 sm:p-5 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Desglose de Pago
            </span>
            <span className="text-xl">💳</span>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-zinc-400 flex items-center gap-1">💵 Efectivo:</span>
              <span className="text-white">${reporte.totalEfectivo.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-zinc-400 flex items-center gap-1">📲 Transf:</span>
              <span className="text-blue-300">${reporte.totalTransferencia.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Ticket Promedio */}
        <div className="rounded-2xl border border-amber-900/50 bg-gradient-to-br from-zinc-950 via-zinc-900 to-amber-950/20 p-4 sm:p-5 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Ticket Promedio
            </span>
            <span className="text-xl">🧾</span>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white">
            ${reporte.ticketPromedio.toFixed(2)}
          </p>
          <p className="text-[11px] text-zinc-400 mt-1">Promedio por comanda</p>
        </div>

        {/* Cancelaciones */}
        <div className="rounded-2xl border border-rose-900/50 bg-gradient-to-br from-zinc-950 via-zinc-900 to-rose-950/20 p-4 sm:p-5 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Cancelaciones
            </span>
            <span className="text-xl">📉</span>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-rose-400">
            ${reporte.dineroCancelado.toFixed(2)}
          </p>
          <p className="text-[11px] text-rose-300/80 mt-1">
            {reporte.pedidosCancelados} pedidos anulados
          </p>
        </div>
      </div>

      {/* GRÁFICA DE BARRAS INTERACTIVA (CSS Puro Ultrarrápido) */}
      {reporte.desglose.length > 0 && (
        <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5 sm:p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h4 className="font-extrabold text-white text-base">
                Evolución de Ventas ({reporte.rangoTexto})
              </h4>
              <p className="text-xs text-zinc-400">Total recaudado por fecha</p>
            </div>
            <span className="text-xs font-bold text-zinc-400">
              Pico: ${maxVentaDesglose.toFixed(2)}
            </span>
          </div>

          <div className="flex items-end justify-between gap-2 sm:gap-4 h-48 pt-6 pb-2 px-2 border-b border-zinc-800">
            {reporte.desglose.map((item, idx) => {
              const alturaPct = Math.max(12, Math.round((item.total / maxVentaDesglose) * 100));

              return (
                <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
                  {/* Tooltip con valor flotante */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity mb-2 text-center pointer-events-none">
                    <span className="rounded-lg bg-zinc-800 border border-zinc-700 px-2 py-0.5 text-[10px] font-bold text-white shadow-md">
                      ${item.total.toFixed(2)} ({item.cantidad})
                    </span>
                  </div>

                  {/* Barra visual */}
                  <div
                    className="w-full max-w-[48px] rounded-t-xl bg-gradient-to-t from-orange-600 via-orange-500 to-amber-400 transition-all duration-500 group-hover:brightness-125 shadow-md shadow-orange-500/20"
                    style={{ height: `${alturaPct}%` }}
                  />

                  {/* Etiqueta de fecha */}
                  <span className="mt-2 text-[10px] sm:text-xs font-semibold text-zinc-400 truncate max-w-[50px] sm:max-w-none capitalize">
                    {item.etiqueta}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TABLA DE OPERACIONES DEL PERÍODO */}
      <div className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-zinc-800/80 px-6 py-4">
          <div>
            <h4 className="font-bold text-white text-base">
              Movimientos del Período ({reporte.pedidos.length})
            </h4>
            <p className="text-xs text-zinc-500">Historial completo en horario de Colombia</p>
          </div>

          <div className="w-full sm:w-64">
            <input
              type="text"
              placeholder="Buscar por mesa, producto, método..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:border-orange-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-zinc-900/80 text-xs font-semibold uppercase tracking-wider text-zinc-400">
              <tr>
                <th className="px-6 py-3 text-left">Fecha / Hora</th>
                <th className="px-6 py-3 text-left">Mesa</th>
                <th className="px-6 py-3 text-left">Detalle</th>
                <th className="px-6 py-3 text-left">Método</th>
                <th className="px-6 py-3 text-right">Total</th>
                <th className="px-6 py-3 text-center">Estado</th>
                <th className="px-6 py-3 text-center">Ticket</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900">
              {pedidosFiltrados.map((pedido) => (
                <tr key={pedido.id} className="hover:bg-zinc-900/50 transition-colors">
                  <td className="px-6 py-3 text-xs text-zinc-400 whitespace-nowrap">
                    {formatearFechaColombia(pedido.createdAt)} • {formatearHoraColombia(pedido.createdAt)}
                  </td>
                  <td className="px-6 py-3 font-semibold text-white whitespace-nowrap">
                    Mesa {pedido.mesa}
                  </td>
                  <td className="max-w-xs px-6 py-3 text-zinc-300 truncate">{pedido.detalle}</td>
                  <td className="px-6 py-3 text-xs whitespace-nowrap">
                    {pedido.metodoPago === 'TRANSFERENCIA' || pedido.detalle.includes('TRANSFERENCIA') ? (
                      <span className="rounded-md bg-blue-950/70 border border-blue-800/80 px-2 py-0.5 font-bold text-blue-300">
                        📲 Transf
                      </span>
                    ) : (
                      <span className="rounded-md bg-emerald-950/70 border border-emerald-800/80 px-2 py-0.5 font-bold text-emerald-300">
                        💵 Efectivo
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-right font-extrabold text-white whitespace-nowrap">
                    ${pedido.total.toFixed(2)}
                  </td>
                  <td className="px-6 py-3 text-center whitespace-nowrap">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                        pedido.estado === 'PAGADO'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-600'
                          : pedido.estado === 'CANCELADO'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
                      }`}
                    >
                      {pedido.estado}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-center whitespace-nowrap">
                    <BotonRecibo
                      pedido={{
                        ...pedido,
                        estado: pedido.estado as any,
                        updatedAt: pedido.createdAt,
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {pedidosFiltrados.length === 0 && (
            <div className="py-12 text-center text-zinc-500">
              <p className="text-3xl mb-1">📋</p>
              <p className="text-sm">No hay operaciones registradas en este período</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
