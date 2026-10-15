'use client';

import { OrderStatus } from '@prisma/client';

interface OrderStatusStepperProps {
  estado: OrderStatus;
  size?: 'sm' | 'md' | 'lg';
}

const PASOS = [
  { key: 'PENDIENTE', label: 'Recibido', icon: '⏳', desc: 'Comanda en cola' },
  { key: 'PREPARANDO', label: 'En Cocina', icon: '🔥', desc: 'Chef preparando' },
  { key: 'HECHO', label: 'Listo', icon: '🍽️', desc: '¡Listo para servir!' },
  { key: 'ENTREGADO', label: 'Servido', icon: '✅', desc: 'En la mesa' },
] as const;

export function OrderStatusStepper({ estado, size = 'md' }: OrderStatusStepperProps) {
  if (estado === 'CANCELADO') {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-rose-950/40 border border-rose-800/80 px-3 py-2 text-rose-300">
        <span className="text-lg">❌</span>
        <div>
          <p className="text-xs font-bold uppercase tracking-wider">Comanda Cancelada</p>
          <p className="text-[11px] text-rose-400/80">Este pedido fue anulado</p>
        </div>
      </div>
    );
  }

  const indexActual = PASOS.findIndex((p) => p.key === estado);

  return (
    <div className="w-full">
      {/* Contenedor de la barra de progreso */}
      <div className="relative flex items-center justify-between">
        {/* Línea de fondo */}
        <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-1 bg-zinc-800 z-0 rounded-full" />

        {/* Línea activa rellena */}
        <div
          className="absolute left-4 top-1/2 -translate-y-1/2 h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-500 z-0 rounded-full transition-all duration-500"
          style={{
            width: indexActual <= 0 ? '0%' : `${(indexActual / (PASOS.length - 1)) * 100}%`,
          }}
        />

        {PASOS.map((paso, idx) => {
          const esCompletado = idx < indexActual;
          const esActual = idx === indexActual;
          const esFuturo = idx > indexActual;

          return (
            <div key={paso.key} className="relative z-10 flex flex-col items-center">
              <div
                className={`flex items-center justify-center rounded-full transition-all ${
                  size === 'sm' ? 'h-7 w-7 text-xs' : 'h-9 w-9 text-sm'
                } ${
                  esActual
                    ? 'bg-orange-500 text-white ring-4 ring-orange-500/30 scale-110 shadow-lg shadow-orange-500/40 font-bold animate-pulse'
                    : esCompletado
                    ? 'bg-emerald-600 text-white font-bold ring-2 ring-emerald-500/40'
                    : 'bg-zinc-900 border border-zinc-700 text-zinc-500'
                }`}
              >
                {esCompletado ? '✓' : paso.icon}
              </div>

              <span
                className={`mt-1.5 text-center transition-colors ${
                  size === 'sm' ? 'text-[10px]' : 'text-xs'
                } ${
                  esActual
                    ? 'font-extrabold text-orange-400'
                    : esCompletado
                    ? 'font-semibold text-emerald-400'
                    : 'font-medium text-zinc-500'
                }`}
              >
                {paso.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Mensaje descriptivo del estado actual */}
      <div className="mt-2.5 text-center">
        <span
          className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
            estado === 'HECHO'
              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/50 animate-bounce'
              : estado === 'PREPARANDO'
              ? 'bg-blue-950/80 text-blue-300 border border-blue-800'
              : estado === 'PENDIENTE'
              ? 'bg-amber-950/80 text-amber-300 border border-amber-800'
              : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
          }`}
        >
          {estado === 'HECHO' && '🍽️ ¡La comida está lista! Llevar a la mesa.'}
          {estado === 'PREPARANDO' && '🔥 El cocinero está preparando la orden.'}
          {estado === 'PENDIENTE' && '⏳ En espera de ser tomado por cocina.'}
          {estado === 'ENTREGADO' && '✅ Comanda servida en la mesa.'}
        </span>
      </div>
    </div>
  );
}

