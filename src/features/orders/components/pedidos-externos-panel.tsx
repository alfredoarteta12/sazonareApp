'use client';

import { useState } from 'react';
import { Pedido } from '../hooks/use-realtime-orders';
import { parseDetallePedido } from '../utils/parse-order-detail';
import { formatearHoraColombia } from '@/lib/date-utils';

interface PedidosExternosPanelProps {
  pedidos: Pedido[];
  tipo: 'LLEVAR' | 'DOMICILIO';
  onNuevoPedido: (tipo: 'LLEVAR' | 'DOMICILIO') => void;
  onAbrirDetalle: (pedido: Pedido) => void;
}

const ESTADO_BADGE: Record<string, { texto: string; clase: string }> = {
  PENDIENTE: {
    texto: '⏳ Pendiente',
    clase: 'bg-amber-950 text-amber-300 border-amber-800',
  },
  PREPARANDO: {
    texto: '🔥 En Cocina',
    clase: 'bg-blue-950 text-blue-300 border-blue-800',
  },
  HECHO: {
    texto: '🛎️ ¡Listo!',
    clase: 'bg-emerald-950 text-emerald-300 border-emerald-600 animate-pulse font-bold',
  },
  ENTREGADO: {
    texto: '📦 Entregado',
    clase: 'bg-zinc-800 text-zinc-300 border-zinc-700',
  },
  PAGADO: {
    texto: '✓ Cobrado',
    clase: 'bg-emerald-950 text-emerald-400 border-emerald-700 font-bold',
  },
  CANCELADO: {
    texto: '❌ Cancelado',
    clase: 'bg-rose-950 text-rose-300 border-rose-800',
  },
};

export function PedidosExternosPanel({
  pedidos,
  tipo,
  onNuevoPedido,
  onAbrirDetalle,
}: PedidosExternosPanelProps) {
  const [filtro, setFiltro] = useState<'activos' | 'todos'>('activos');
  const [busqueda, setBusqueda] = useState('');

  const esLlevar = tipo === 'LLEVAR';

  // Filtrar según el tipo de pedido
  const pedidosFiltradosPorTipo = pedidos.filter((p) => {
    if (esLlevar) {
      return (
        p.tipoPedido === 'LLEVAR' ||
        (p.detalle && p.detalle.includes('[PARA LLEVAR'))
      );
    } else {
      return (
        p.tipoPedido === 'DOMICILIO' ||
        (p.detalle && p.detalle.includes('[DOMICILIO'))
      );
    }
  });

  // Filtrar activos (pendientes, en preparación, listos, o entregados sin cobrar) vs todos
  const pedidosMostrados = pedidosFiltradosPorTipo.filter((p) => {
    if (filtro === 'activos') {
      if (p.estado === 'CANCELADO' || p.estado === 'PAGADO') return false;
    }

    if (busqueda.trim()) {
      const term = busqueda.toLowerCase();
      const matchCliente = p.cliente?.toLowerCase().includes(term);
      const matchDir = p.direccion?.toLowerCase().includes(term);
      const matchTel = p.telefono?.includes(term);
      const matchDetalle = p.detalle.toLowerCase().includes(term);
      return matchCliente || matchDir || matchTel || matchDetalle;
    }

    return true;
  });

  const conteoActivos = pedidosFiltradosPorTipo.filter(
    (p) => p.estado !== 'PAGADO' && p.estado !== 'CANCELADO'
  ).length;

  const conteoListos = pedidosFiltradosPorTipo.filter(
    (p) => p.estado === 'HECHO'
  ).length;

  return (
    <div className="flex h-full flex-col space-y-4 overflow-y-auto pr-1">
      {/* CABECERA CON RESUMEN Y BOTÓN DE NUEVA ORDEN */}
      <div className="rounded-3xl border border-zinc-800 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 p-4 sm:p-5 shadow-xl shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl border text-2xl sm:text-3xl shadow-inner ${
              esLlevar
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
            }`}>
              {esLlevar ? '🛍️' : '🛵'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  {esLlevar ? 'Pedidos Para Llevar' : 'Pedidos a Domicilio'}
                </h2>
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${
                  esLlevar
                    ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                    : 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                }`}>
                  {conteoActivos} {conteoActivos === 1 ? 'activo' : 'activos'}
                </span>
                {conteoListos > 0 && (
                  <span className="rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-0.5 text-[10px] font-black animate-pulse">
                    🛎️ {conteoListos} para entregar
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                {esLlevar
                  ? 'Gestiona pedidos para recoger en mostrador con cobro y ticket térmico'
                  : 'Despacho de pedidos a domicilio con dirección, teléfono y cobro'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onNuevoPedido(tipo)}
              className={`flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-xs sm:text-sm font-extrabold text-white shadow-xl transition-all active:scale-95 ${
                esLlevar
                  ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/30'
                  : 'bg-cyan-600 hover:bg-cyan-500 shadow-cyan-600/30'
              }`}
            >
              <span>➕</span>
              <span>{esLlevar ? 'Nuevo Para Llevar' : 'Nuevo Domicilio'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* BARRA DE FILTROS Y BÚSQUEDA */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shrink-0">
        <div className="flex items-center gap-1.5 rounded-2xl bg-zinc-950 border border-zinc-800 p-1">
          <button
            type="button"
            onClick={() => setFiltro('activos')}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
              filtro === 'activos'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Activos en Curso ({conteoActivos})
          </button>
          <button
            type="button"
            onClick={() => setFiltro('todos')}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
              filtro === 'todos'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Historial de Hoy ({pedidosFiltradosPorTipo.length})
          </button>
        </div>

        <div className="w-full sm:w-72">
          <input
            type="text"
            placeholder={esLlevar ? 'Buscar por cliente o platillo...' : 'Buscar por cliente, dirección, tel...'}
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:border-orange-500 focus:outline-none"
          />
        </div>
      </div>

      {/* LISTA / GRID DE PEDIDOS */}
      {pedidosMostrados.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-800 bg-zinc-950/60 p-10 text-center">
          <span className="text-4xl mb-2">{esLlevar ? '🛍️' : '🛵'}</span>
          <h3 className="text-base font-bold text-white">
            {busqueda
              ? 'No se encontraron pedidos con ese criterio'
              : filtro === 'activos'
              ? `No hay pedidos de ${esLlevar ? 'para llevar' : 'domicilio'} en curso`
              : 'Sin pedidos registrados hoy'}
          </h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm">
            {filtro === 'activos'
              ? 'Crea una nueva comanda con el botón superior para enviar la orden a cocina.'
              : 'Los pedidos despachados o completados aparecerán aquí.'}
          </p>
          <button
            type="button"
            onClick={() => onNuevoPedido(tipo)}
            className="mt-4 rounded-xl bg-zinc-900 border border-zinc-700 px-4 py-2 text-xs font-bold text-white hover:bg-zinc-800 transition-colors"
          >
            ➕ Tomar {esLlevar ? 'Pedido Para Llevar' : 'Nuevo Domicilio'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
          {pedidosMostrados.map((pedido) => {
            const items = parseDetallePedido(pedido.detalle, pedido.total);
            const badge = ESTADO_BADGE[pedido.estado] || {
              texto: pedido.estado,
              clase: 'bg-zinc-900 text-zinc-300 border-zinc-800',
            };

            const esListo = pedido.estado === 'HECHO';
            const esCobrado = pedido.estado === 'PAGADO';

            return (
              <div
                key={pedido.id}
                className={`relative flex flex-col justify-between rounded-3xl border p-4 sm:p-5 transition-all shadow-lg ${
                  esListo
                    ? 'border-emerald-500/80 bg-emerald-950/20 shadow-emerald-950/40 ring-1 ring-emerald-500/50'
                    : esCobrado
                    ? 'border-zinc-800/80 bg-zinc-950/60 opacity-80'
                    : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700'
                }`}
              >
                <div>
                  {/* Fila superior: Tipo, Cliente y Estado */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-xl ${
                        esLlevar
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                          : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
                      }`}>
                        {esLlevar ? '🛍️' : '🛵'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-black text-white truncate">
                          {pedido.cliente || (esLlevar ? 'Mostrador' : 'Domicilio')}
                        </p>
                        <p className="text-[11px] text-zinc-400">
                          🕒 {formatearHoraColombia(pedido.createdAt)}
                        </p>
                      </div>
                    </div>

                    <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${badge.clase}`}>
                      {badge.texto}
                    </span>
                  </div>

                  {/* Datos de Entrega si es Domicilio */}
                  {!esLlevar && (
                    <div className="mb-3 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 p-2.5 space-y-1 text-xs">
                      {pedido.direccion && (
                        <div className="flex items-start gap-1.5">
                          <span className="shrink-0 text-cyan-400">📍</span>
                          <span className="font-semibold text-zinc-200 leading-tight break-words">
                            {pedido.direccion}
                          </span>
                        </div>
                      )}
                      {pedido.telefono && (
                        <div className="flex items-center gap-1.5">
                          <span className="shrink-0 text-zinc-400">📞</span>
                          <a
                            href={`tel:${pedido.telefono}`}
                            className="font-bold text-cyan-400 hover:underline"
                          >
                            {pedido.telefono}
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Notas de comanda si existen */}
                  {pedido.notas && (
                    <div className="mb-3 rounded-xl bg-amber-950/40 border border-amber-800/60 px-2.5 py-1.5 text-xs text-amber-200 flex items-start gap-1.5">
                      <span className="shrink-0">⚠️</span>
                      <span className="font-medium text-[11px]">{pedido.notas}</span>
                    </div>
                  )}

                  {/* Lista de platillos */}
                  <div className="space-y-2 mb-4 max-h-48 overflow-y-auto pr-1">
                    {items.map((item, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl bg-zinc-900/90 border border-zinc-800/80 p-2 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-200 font-semibold truncate">
                            <span className="font-bold text-orange-400">{item.cantidad}x</span>{' '}
                            {item.nombre}
                          </span>
                          {item.subtotal > 0 && (
                            <span className="font-bold text-white shrink-0 ml-2">
                              ${item.subtotal.toFixed(2)}
                            </span>
                          )}
                        </div>

                        {item.adiciones && item.adiciones.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {item.adiciones.map((adic, aIdx) => (
                              <span
                                key={aIdx}
                                className="rounded bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.2 text-[10px] font-bold text-amber-300"
                              >
                                🥓 {adic}
                              </span>
                            ))}
                          </div>
                        )}

                        {item.notas && (
                          <p className="text-[11px] text-zinc-400 italic bg-zinc-950/60 rounded px-1.5 py-0.5 border border-zinc-800/60">
                            📝 {item.notas}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pie: Total y Acciones */}
                <div className="pt-3 border-t border-zinc-800/80">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-zinc-400">Total a pagar:</span>
                    <span className="text-lg font-black text-white">
                      ${pedido.total.toFixed(2)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => onAbrirDetalle(pedido)}
                      className={`flex items-center justify-center gap-1.5 rounded-xl py-2 px-2 text-xs font-bold transition-all active:scale-95 ${
                        esListo
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30'
                          : pedido.estado !== 'PAGADO'
                          ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-500/20'
                          : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
                      }`}
                    >
                      <span>{esListo ? '🛎️' : pedido.estado !== 'PAGADO' ? '💵' : '🔍'}</span>
                      <span className="truncate">
                        {esListo
                          ? 'Entregar'
                          : pedido.estado !== 'PAGADO'
                          ? 'Cobrar'
                          : 'Ver Detalle'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onAbrirDetalle(pedido)}
                      className="flex items-center justify-center gap-1.5 rounded-xl bg-zinc-900 border border-zinc-800 py-2 px-2 text-xs font-bold text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
                    >
                      <span>🧾</span>
                      <span className="truncate">Ticket</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

