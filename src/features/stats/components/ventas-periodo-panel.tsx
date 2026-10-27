'use client';

import { useState, useTransition } from 'react';
import {
  getPeriodFinancials,
  PeriodoReporte,
  ReportePeriodoData,
} from '../actions/get-financial-reports';
import { BotonRecibo } from './boton-recibo';
import { ArqueoCajaModal } from './arqueo-caja-modal';
import { HistorialCierresModal } from './historial-cierres-modal';
import { eliminarPedido } from '@/features/orders/actions/order-mutations';
import { formatearHoraColombia, formatearFechaColombia } from '@/lib/date-utils';
import { formatearCOP } from '@/lib/currency';

interface VentasPeriodoPanelProps {
  reporteInicial: ReportePeriodoData;
}

export function VentasPeriodoPanel({ reporteInicial }: VentasPeriodoPanelProps) {
  const [periodo, setPeriodo] = useState<PeriodoReporte>('dia');
  const [reporte, setReporte] = useState<ReportePeriodoData>(reporteInicial);
  const [isPending, startTransition] = useTransition();
  const [busqueda, setBusqueda] = useState('');
  const [mostrarArqueo, setMostrarArqueo] = useState(false);
  const [mostrarHistorial, setMostrarHistorial] = useState(false);
  const [pedidoAEliminar, setPedidoAEliminar] = useState<ReportePeriodoData['pedidos'][0] | null>(null);
  const [eliminando, setEliminando] = useState(false);
  const [errorEliminacion, setErrorEliminacion] = useState('');

  const handleConfirmarEliminar = async () => {
    if (!pedidoAEliminar) return;
    setEliminando(true);
    setErrorEliminacion('');
    try {
      const res = await eliminarPedido(pedidoAEliminar.id);
      if (res.success) {
        // Refrescar métricas del período actual inmediatamente
        const nuevo = await getPeriodFinancials(periodo);
        if (nuevo.success && nuevo.data) {
          setReporte(nuevo.data);
        }
        setPedidoAEliminar(null);
      } else {
        setErrorEliminacion(res.error || 'No se pudo eliminar el pedido.');
      }
    } catch (err) {
      setErrorEliminacion('Ocurrió un error inesperado al eliminar.');
    } finally {
      setEliminando(false);
    }
  };

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
      {/* SELECTOR DE PERÍODO (DÍA / SEMANA / MES) Y ARQUEO */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 rounded-3xl border border-zinc-800 bg-zinc-950 p-4 sm:p-5 shadow-xl">
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
            Horario oficial de Colombia (America/Bogota) • Agregaciones en tiempo real (COP)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Botones de Arqueo y Cierre de Caja */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setMostrarArqueo(true)}
              className="flex items-center gap-1.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 px-3.5 py-2 text-xs font-bold text-white shadow-lg shadow-orange-500/25 hover:from-orange-600 hover:to-amber-600 active:scale-95 transition-all"
            >
              <span>🔒</span>
              <span>Arqueo y Cierre</span>
            </button>

            <button
              type="button"
              onClick={() => setMostrarHistorial(true)}
              className="flex items-center gap-1.5 rounded-2xl bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
              title="Ver auditoría e historial de Reportes Z"
            >
              <span>📜</span>
              <span>Historial Z</span>
            </button>
          </div>

          <div className="hidden sm:block h-6 w-px bg-zinc-800" />

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
              <span>📈</span> Esta Semana
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
            {formatearCOP(reporte.ingresoNeto)}
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
              <span className="text-white">{formatearCOP(reporte.totalEfectivo)}</span>
            </div>
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-zinc-400 flex items-center gap-1">📲 Transf:</span>
              <span className="text-blue-300">{formatearCOP(reporte.totalTransferencia)}</span>
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
            {formatearCOP(reporte.ticketPromedio)}
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
            {formatearCOP(reporte.dineroCancelado)}
          </p>
          <p className="text-[11px] text-rose-300/80 mt-1">
            {reporte.pedidosCancelados} pedidos anulados
          </p>
        </div>
      </div>

      {/* GRÁFICA DE BARRAS INTERACTIVA */}
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
              Pico: {formatearCOP(maxVentaDesglose)}
            </span>
          </div>

          <div className="flex items-end justify-between gap-2 sm:gap-4 h-48 pt-6 pb-2 px-2 border-b border-zinc-800">
            {reporte.desglose.map((item, idx) => {
              const alturaPct = Math.max(Math.round((item.total / maxVentaDesglose) * 100), 4);
              return (
                <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                  {/* Tooltip flotante */}
                  <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 bg-zinc-900 border border-zinc-700 px-2.5 py-1 rounded-xl shadow-lg whitespace-nowrap">
                    <p className="text-xs font-bold text-white">{formatearCOP(item.total)}</p>
                    <span className="text-[10px] text-zinc-400">
                      {item.cantidad} {item.cantidad === 1 ? 'pedido' : 'pedidos'}
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

          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Buscar por mesa, producto, método..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900 pl-3 pr-8 py-1.5 text-xs text-white placeholder-zinc-500 focus:border-orange-500 focus:outline-none"
            />
            {busqueda && (
              <button
                type="button"
                onClick={() => setBusqueda('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-white"
                title="Limpiar búsqueda"
              >
                ✕
              </button>
            )}
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
                <th className="px-6 py-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900">
              {pedidosFiltrados.map((pedido) => (
                <tr key={pedido.id} className="hover:bg-zinc-900/50 transition-colors">
                  <td className="px-6 py-3 text-xs text-zinc-400 whitespace-nowrap">
                    {formatearFechaColombia(pedido.createdAt)} • {formatearHoraColombia(pedido.createdAt)}
                  </td>
                  <td className="px-6 py-3 font-semibold text-white whitespace-nowrap">
                    {pedido.tipoPedido === 'LLEVAR' || pedido.detalle.includes('[PARA LLEVAR') ? (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-xs font-bold text-amber-300">
                        🛍️ Llevar
                      </span>
                    ) : pedido.tipoPedido === 'DOMICILIO' || pedido.detalle.includes('[DOMICILIO') ? (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-cyan-500/15 border border-cyan-500/30 px-2 py-0.5 text-xs font-bold text-cyan-300">
                        🛵 Domicilio
                      </span>
                    ) : (
                      <span>Mesa {pedido.mesa}</span>
                    )}
                  </td>
                  <td className="max-w-xs px-6 py-3 text-zinc-300 truncate">{pedido.detalle}</td>
                  <td className="px-6 py-3 text-xs whitespace-nowrap">
                    {pedido.metodoPago === 'DIVIDIDO' ? (
                      <span
                        className="inline-flex items-center gap-1 rounded-md bg-purple-950/70 border border-purple-800/80 px-2 py-0.5 font-bold text-purple-300 cursor-help"
                        title={`Efectivo: ${formatearCOP(pedido.pagoEfectivo)} | Transf: ${formatearCOP(pedido.pagoTransferencia)}`}
                      >
                        ⚖️ Dividido
                      </span>
                    ) : pedido.metodoPago === 'TRANSFERENCIA' || pedido.detalle.includes('TRANSFERENCIA') ? (
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
                    {formatearCOP(pedido.total)}
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
                    <div className="flex items-center justify-center gap-1.5">
                      <BotonRecibo
                        pedido={{
                          ...pedido,
                          pagoEfectivo: pedido.pagoEfectivo,
                          pagoTransferencia: pedido.pagoTransferencia,
                          estado: pedido.estado as any,
                          updatedAt: pedido.createdAt,
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setErrorEliminacion('');
                          setPedidoAEliminar(pedido);
                        }}
                        className="rounded-lg bg-rose-500/10 border border-rose-500/30 px-2.5 py-1 text-xs font-bold text-rose-400 hover:text-white hover:bg-rose-600 hover:border-rose-600 transition-all shadow-sm active:scale-95"
                        title="Eliminar comanda duplicada o errónea"
                      >
                        🗑️ Eliminar
                      </button>
                    </div>
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

      {/* MODAL DE ARQUEO Y CIERRE DE CAJA */}
      {mostrarArqueo && (
        <ArqueoCajaModal
          onCerrar={() => setMostrarArqueo(false)}
          onCierreCompletado={() => {
            cambiarPeriodo(periodo);
          }}
        />
      )}

      {/* MODAL DE HISTORIAL DE REPORTES Z */}
      {mostrarHistorial && (
        <HistorialCierresModal
          onCerrar={() => setMostrarHistorial(false)}
        />
      )}

      {/* MODAL DE CONFIRMACIÓN PARA ELIMINAR PEDIDO */}
      {pedidoAEliminar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm animate-in fade-in">
          <div
            className="fixed inset-0"
            onClick={() => !eliminando && setPedidoAEliminar(null)}
          />

          <div className="relative z-10 w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/15 border border-rose-500/30 text-2xl text-rose-400">
                🗑️
              </div>
              <div>
                <h3 className="font-extrabold text-white text-base">¿Eliminar Comanda?</h3>
                <p className="text-xs text-zinc-400">Eliminación permanente para pedidos duplicados</p>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-400">Mesa / Destino:</span>
                <span className="font-bold text-white">
                  {pedidoAEliminar.tipoPedido === 'LLEVAR'
                    ? '🛍️ Para Llevar'
                    : pedidoAEliminar.tipoPedido === 'DOMICILIO'
                    ? '🛵 Domicilio'
                    : `🍽️ Mesa ${pedidoAEliminar.mesa}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Total:</span>
                <span className="font-black text-emerald-400">{formatearCOP(pedidoAEliminar.total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Estado:</span>
                <span className="font-bold text-zinc-200">{pedidoAEliminar.estado}</span>
              </div>
              <div className="pt-2 border-t border-zinc-800 text-zinc-300">
                <p className="font-semibold text-zinc-400 mb-1">Detalle de la orden:</p>
                <p className="italic bg-zinc-950 p-2.5 rounded-xl text-zinc-200 border border-zinc-800/80 line-clamp-3">
                  {pedidoAEliminar.detalle}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200/90 leading-relaxed">
              ⚠️ <strong>Atención:</strong> Esta comanda se borrará por completo de la base de datos, del monitor de cocina y de las estadísticas de ventas. Úsala si el mesero se equivocó y envió el mismo pedido varias veces.
            </div>

            {errorEliminacion && (
              <p className="text-xs font-bold text-rose-400">{errorEliminacion}</p>
            )}

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                disabled={eliminando}
                onClick={() => setPedidoAEliminar(null)}
                className="flex-1 rounded-xl bg-zinc-900 border border-zinc-800 py-2.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={eliminando}
                onClick={handleConfirmarEliminar}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-rose-600 py-2.5 text-xs font-bold text-white shadow-lg shadow-rose-600/30 hover:bg-rose-700 active:scale-95 transition-all disabled:opacity-50"
              >
                {eliminando ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Eliminando...</span>
                  </>
                ) : (
                  <>
                    <span>🗑️</span>
                    <span>Sí, Eliminar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
