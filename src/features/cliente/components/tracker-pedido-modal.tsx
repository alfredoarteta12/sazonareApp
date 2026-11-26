'use client';

import React from 'react';
import { Modal } from '@/components/ui/modal';
import { formatearCOP } from '@/lib/currency';

interface PedidoActivoInfo {
  id: string;
  mesa: number;
  total: number;
  estado: string;
  cliente?: string | null;
  detalle?: string | null;
  createdAt?: string;
}

interface TrackerPedidoModalProps {
  isOpen: boolean;
  onClose: () => void;
  pedido: PedidoActivoInfo | null;
}

export function TrackerPedidoModal({ isOpen, onClose, pedido }: TrackerPedidoModalProps) {
  if (!pedido) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Estado de tu Orden en Vivo"
      icon="🛎️"
      size="md"
      footer={
        <button
          type="button"
          onClick={onClose}
          className="neo-btn w-full rounded-xl bg-zinc-900 hover:bg-zinc-800 py-3 text-xs font-black uppercase text-zinc-300 border-2 border-zinc-700"
        >
          Seguir Viendo la Carta
        </button>
      }
    >
      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1 no-scrollbar">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
          <span className="neo-sticker text-[9px] bg-purple-500 text-black border-black">
            MESA {pedido.mesa} • EN TIEMPO REAL
          </span>
          <span className="text-[11px] font-display font-black text-amber-400">
            {formatearCOP(pedido.total)}
          </span>
        </div>

        {/* Stepper Visual Neo-Brutalist */}
        <div className="space-y-2.5">
          {/* Paso 1 */}
          <div
            className={`flex items-start gap-3 rounded-xl border-2 p-3 transition-all ${
              pedido.estado === 'SOLICITADO'
                ? 'border-purple-500 bg-purple-950/40 text-purple-200 shadow-[2px_2px_0px_0px_#a855f7]'
                : 'border-zinc-800/80 bg-zinc-900/40 opacity-70'
            }`}
          >
            <span className="text-xl">🛎️</span>
            <div>
              <p className="font-display text-xs font-black uppercase text-white">
                Paso 1: Solicitud Recibida por Mesero
              </p>
              <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                {pedido.estado === 'SOLICITADO'
                  ? 'Tu mesero tiene tu comanda en pantalla y la está revisando para mandarla a Cocina.'
                  : '✓ Comanda aprobada por el mesero.'}
              </p>
            </div>
          </div>

          {/* Paso 2 */}
          <div
            className={`flex items-start gap-3 rounded-xl border-2 p-3 transition-all ${
              pedido.estado === 'PENDIENTE' || pedido.estado === 'PREPARANDO'
                ? 'border-amber-500 bg-amber-950/40 text-amber-200 shadow-[2px_2px_0px_0px_#f59e0b]'
                : pedido.estado === 'HECHO' || pedido.estado === 'ENTREGADO' || pedido.estado === 'PAGADO'
                ? 'border-zinc-800/80 bg-zinc-900/40 opacity-70'
                : 'border-zinc-900 bg-zinc-950 opacity-40'
            }`}
          >
            <span className="text-xl">👨‍🍳</span>
            <div>
              <p className="font-display text-xs font-black uppercase text-white">
                Paso 2: En Cocina
              </p>
              <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                {pedido.estado === 'PREPARANDO'
                  ? '🔥 El chef está cocinando tus platillos en este momento.'
                  : pedido.estado === 'PENDIENTE'
                  ? 'Comanda enviada a cocina. Esperando turno de preparación.'
                  : pedido.estado === 'HECHO' || pedido.estado === 'ENTREGADO' || pedido.estado === 'PAGADO'
                  ? '✓ Preparación finalizada.'
                  : 'En espera de aprobación del mesero.'}
              </p>
            </div>
          </div>

          {/* Paso 3 */}
          <div
            className={`flex items-start gap-3 rounded-xl border-2 p-3 transition-all ${
              pedido.estado === 'HECHO'
                ? 'border-blue-500 bg-blue-950/40 text-blue-200 shadow-[2px_2px_0px_0px_#3b82f6]'
                : pedido.estado === 'ENTREGADO' || pedido.estado === 'PAGADO'
                ? 'border-zinc-800/80 bg-zinc-900/40 opacity-70'
                : 'border-zinc-900 bg-zinc-950 opacity-40'
            }`}
          >
            <span className="text-xl">🍽️</span>
            <div>
              <p className="font-display text-xs font-black uppercase text-white">
                Paso 3: Listo para Servir
              </p>
              <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                {pedido.estado === 'HECHO'
                  ? '🛎️ ¡Tu comida está lista! El mesero la está trayendo a tu mesa.'
                  : pedido.estado === 'ENTREGADO' || pedido.estado === 'PAGADO'
                  ? '✓ Comida entregada en mesa.'
                  : 'En espera de que cocina termine.'}
              </p>
            </div>
          </div>

          {/* Paso 4 */}
          <div
            className={`flex items-start gap-3 rounded-xl border-2 p-3 transition-all ${
              pedido.estado === 'ENTREGADO'
                ? 'border-emerald-500 bg-emerald-950/40 text-emerald-200 shadow-[2px_2px_0px_0px_#10b981]'
                : pedido.estado === 'PAGADO'
                ? 'border-zinc-800 bg-zinc-900 text-zinc-400'
                : 'border-zinc-900 bg-zinc-950 opacity-40'
            }`}
          >
            <span className="text-xl">🍷</span>
            <div>
              <p className="font-display text-xs font-black uppercase text-white">
                Paso 4: Servido en Mesa
              </p>
              <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                {pedido.estado === 'ENTREGADO'
                  ? '¡Buen provecho! Cuando desees la cuenta, pídesela a tu mesero (pago en efectivo o transferencia).'
                  : pedido.estado === 'PAGADO'
                  ? '💰 ¡Cuenta pagada! Gracias por tu visita.'
                  : 'En espera de ser servido.'}
              </p>
            </div>
          </div>
        </div>

        {/* Resumen */}
        {pedido.detalle && (
          <div className="rounded-xl border-2 border-zinc-800 bg-[#08080a] p-3 space-y-1 text-xs">
            <span className="font-display text-[10px] font-black text-zinc-400 uppercase tracking-wider">
              Resumen de la Orden
            </span>
            <p className="text-zinc-300 text-[11px] leading-relaxed line-clamp-3">
              {pedido.detalle}
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}
