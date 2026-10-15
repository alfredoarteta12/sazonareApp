'use client';

import { useState, useTransition } from 'react';
import { Pedido } from '../hooks/use-realtime-orders';
import { OrderStatusStepper } from './order-status-stepper';
import { TicketReciboModal } from './ticket-recibo-modal';
import { parseDetallePedido } from '../utils/parse-order-detail';
import { marcarComoEntregado } from '../actions/order-mutations';

interface MesaDetalleModalProps {
  mesa: number;
  pedido: Pedido;
  nombreMesero?: string;
  onCerrar: () => void;
  onAgregarPlatillos: (mesa: number) => void;
}

export function MesaDetalleModal({
  mesa,
  pedido,
  nombreMesero,
  onCerrar,
  onAgregarPlatillos,
}: MesaDetalleModalProps) {
  const [mostrandoRecibo, setMostrandoRecibo] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [mensaje, setMensaje] = useState<string | null>(null);

  const items = parseDetallePedido(pedido.detalle, pedido.total);

  // Cálculo del tiempo transcurrido
  const fechaPedido = new Date(pedido.createdAt);
  const ahora = new Date();
  const minutosTranscurridos = Math.max(0, Math.floor((ahora.getTime() - fechaPedido.getTime()) / 60000));

  const handleMarcarEntregado = () => {
    startTransition(async () => {
      const res = await marcarComoEntregado(pedido.id);
      if (res.success) {
        setMensaje('✅ Comanda marcada como entregada.');
        setTimeout(() => setMensaje(null), 3000);
      } else {
        setMensaje(res.error || 'Error al actualizar');
      }
    });
  };

  if (mostrandoRecibo) {
    return (
      <TicketReciboModal
        pedido={pedido}
        nombreMesero={nombreMesero}
        onCerrar={() => setMostrandoRecibo(false)}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="fixed inset-0" onClick={onCerrar} />

      <div className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col rounded-3xl border border-zinc-800 bg-zinc-950 p-5 sm:p-6 shadow-2xl">
        {/* Cabecera */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-500/10 border border-orange-500/30 text-2xl">
              🌿
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white">Mesa {mesa}</h3>
                <span className="rounded-full bg-orange-500/20 px-2 py-0.5 text-[10px] font-bold text-orange-400 border border-orange-500/30">
                  Terraza
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Orden iniciada hace {minutosTranscurridos} {minutosTranscurridos === 1 ? 'minuto' : 'minutos'}
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

        {/* Contenido deslizable */}
        <div className="flex-1 overflow-y-auto py-5 space-y-6 pr-1">
          {/* LÍNEA DE TIEMPO DEL ESTADO */}
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">
              Estado de Preparación
            </p>
            <OrderStatusStepper estado={pedido.estado} />
          </div>

          {/* DETALLE DE PLATILLOS */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Platillos en Comanda
              </p>
              <span className="text-xs font-bold text-zinc-300">
                {items.reduce((acc, i) => acc + i.cantidad, 0)} ítems
              </span>
            </div>

            <div className="space-y-2">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-3 rounded-xl bg-zinc-900 border border-zinc-800/80 p-3"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-orange-500/10 text-orange-400 font-bold text-xs border border-orange-500/20">
                      {item.cantidad}x
                    </span>
                    <span className="text-sm font-semibold text-white truncate">{item.nombre}</span>
                  </div>
                  {item.subtotal > 0 && (
                    <span className="text-sm font-bold text-orange-400 shrink-0">
                      ${item.subtotal.toFixed(2)}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Total acumulado */}
            <div className="mt-4 flex items-center justify-between rounded-xl bg-zinc-900/90 border border-zinc-800 p-3.5">
              <span className="text-sm font-semibold text-zinc-300">Total acumulado</span>
              <span className="text-xl font-black text-white">${pedido.total.toFixed(2)}</span>
            </div>
          </div>

          {mensaje && (
            <div className="rounded-xl bg-emerald-950 border border-emerald-800 p-2.5 text-center text-xs font-semibold text-emerald-300">
              {mensaje}
            </div>
          )}
        </div>

        {/* Acciones del pie */}
        <div className="pt-4 border-t border-zinc-800 space-y-2">
          {/* Botón para marcar entregado si ya está listo o preparando */}
          {pedido.estado !== 'ENTREGADO' && pedido.estado !== 'CANCELADO' && (
            <button
              type="button"
              onClick={handleMarcarEntregado}
              disabled={isPending}
              className={`w-full py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
                pedido.estado === 'HECHO'
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 animate-pulse'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
              }`}
            >
              <span>🍽️</span> {isPending ? 'Actualizando...' : 'Confirmar Comanda Servida en Mesa'}
            </button>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                onCerrar();
                onAgregarPlatillos(mesa);
              }}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-zinc-900 border border-zinc-700 py-2.5 text-xs font-bold text-zinc-200 hover:bg-zinc-800 hover:text-white transition-colors"
            >
              <span>➕</span> Agregar Platillos
            </button>

            <button
              type="button"
              onClick={() => setMostrandoRecibo(true)}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-orange-500 py-2.5 text-xs font-bold text-white shadow-lg shadow-orange-500/30 hover:bg-orange-600 active:scale-95 transition-all"
            >
              <span>🧾</span> Ver Recibo / Ticket
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

