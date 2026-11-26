'use client';

import React from 'react';
import { Modal } from '@/components/ui/modal';
import { formatearCOP } from '@/lib/currency';
import { ItemCarrito } from '@/features/orders/actions/order-mutations';
import { ShoppingBag, Plus, Minus, ArrowRight } from 'lucide-react';

interface CarritoModalProps {
  isOpen: boolean;
  onClose: () => void;
  carrito: ItemCarrito[];
  mesa: number;
  nombreCliente: string;
  setNombreCliente: (nombre: string) => void;
  notasPedido: string;
  setNotasPedido: (notas: string) => void;
  onCambiarCantidad: (itemId: string | undefined, delta: number) => void;
  onEnviarPedido: () => void;
  isPending: boolean;
}

export function CarritoModal({
  isOpen,
  onClose,
  carrito,
  mesa,
  nombreCliente,
  setNombreCliente,
  notasPedido,
  setNotasPedido,
  onCambiarCantidad,
  onEnviarPedido,
  isPending,
}: CarritoModalProps) {
  const totalCarrito = carrito.reduce((acc, item) => acc + item.precio * item.cantidad, 0);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Tu Pedido • Mesa ${mesa}`}
      icon={<ShoppingBag className="w-5 h-5 text-orange-400" />}
      size="lg"
      footer={
        <div className="w-full space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-display text-xs font-black uppercase text-zinc-400">Total a Pagar:</span>
            <span className="font-display text-xl font-black text-amber-400">{formatearCOP(totalCarrito)}</span>
          </div>

          <button
            type="button"
            onClick={onEnviarPedido}
            disabled={isPending || carrito.length === 0}
            className="neo-btn-primary w-full rounded-xl py-3.5 text-xs sm:text-sm font-black uppercase tracking-wider disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <span>{isPending ? 'Enviando...' : `🛎️ Enviar Pedido a mi Mesero (${formatearCOP(totalCarrito)})`}</span>
            {!isPending && <ArrowRight className="w-4 h-4 stroke-[3]" />}
          </button>
        </div>
      }
    >
      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1 no-scrollbar">
        {/* Lista de platillos en el carrito */}
        <div className="space-y-2">
          {carrito.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border-2 border-zinc-800 bg-zinc-900/80 p-3.5 flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <p className="font-display text-xs font-black uppercase text-white truncate">{item.nombre}</p>
                {item.notas && (
                  <p className="text-[10px] text-orange-400 font-bold italic mt-0.5 line-clamp-2">
                    📝 {item.notas}
                  </p>
                )}
                <p className="font-display text-xs font-black text-amber-400 mt-1">
                  {formatearCOP(item.precio * item.cantidad)}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => onCambiarCantidad(item.id, -1)}
                  className="neo-btn h-7 w-7 rounded-lg bg-zinc-800 text-xs font-black text-white hover:bg-zinc-700 flex items-center justify-center"
                >
                  <Minus className="w-3 h-3 stroke-[3]" />
                </button>
                <span className="font-display text-xs font-black text-white w-4 text-center">
                  {item.cantidad}
                </span>
                <button
                  type="button"
                  onClick={() => onCambiarCantidad(item.id, 1)}
                  className="neo-btn h-7 w-7 rounded-lg bg-zinc-800 text-xs font-black text-white hover:bg-zinc-700 flex items-center justify-center"
                >
                  <Plus className="w-3 h-3 stroke-[3]" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Datos opcionales del cliente */}
        <div className="pt-3 border-t-2 border-zinc-800 space-y-2.5">
          <div>
            <label className="block font-display text-[11px] font-black uppercase tracking-wider text-zinc-400 mb-1">
              Tu Nombre (Opcional):
            </label>
            <input
              type="text"
              placeholder="Ej: Carlos"
              value={nombreCliente}
              onChange={(e) => setNombreCliente(e.target.value)}
              className="w-full rounded-xl border-2 border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-orange-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-display text-[11px] font-black uppercase tracking-wider text-zinc-400 mb-1">
              Nota general para el mesero:
            </label>
            <input
              type="text"
              placeholder="Ej: Traer servilletas y vasos con hielo..."
              value={notasPedido}
              onChange={(e) => setNotasPedido(e.target.value)}
              className="w-full rounded-xl border-2 border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-orange-500 focus:outline-none"
            />
          </div>

          <div className="rounded-xl border-2 border-blue-900/60 bg-blue-950/30 p-2.5 text-[11px] text-blue-300 flex items-center gap-2">
            <span>ℹ️</span>
            <span>
              Tu pedido llegará primero al <strong>Mesero</strong>, quien lo revisará y enviará formalmente a Cocina.
            </span>
          </div>
        </div>
      </div>
    </Modal>
  );
}
