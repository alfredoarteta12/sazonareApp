'use client';

import { useRealtimeOrders, Pedido } from '../hooks/use-realtime-orders';
import { avanzarEstadoPedido } from '../actions/order-mutations';
import { useTransition } from 'react';

const ESTADO_CONFIG = {
  PENDIENTE: { label: '⏳ Pendiente', color: 'bg-amber-950/30 text-amber-200 border-amber-800/70', badge: 'bg-amber-400', badgeText: 'bg-amber-950/60 text-amber-300 border-amber-800/50' },
  PREPARANDO: { label: '🔥 Preparando', color: 'bg-blue-950/30 text-blue-200 border-blue-800/70', badge: 'bg-blue-400', badgeText: 'bg-blue-950/60 text-blue-300 border-blue-800/50' },
  HECHO: { label: '✅ Listo', color: 'bg-emerald-950/30 text-emerald-200 border-emerald-800/70', badge: 'bg-emerald-400', badgeText: 'bg-emerald-950/60 text-emerald-300 border-emerald-800/50' },
  ENTREGADO: { label: '🎉 Entregado', color: 'bg-zinc-950 text-zinc-400 border-zinc-800', badge: 'bg-zinc-600', badgeText: 'bg-zinc-900 text-zinc-400 border-zinc-800' },
  CANCELADO: { label: '❌ Cancelado', color: 'bg-rose-950/30 text-rose-200 border-rose-800/70', badge: 'bg-rose-400', badgeText: 'bg-rose-950/60 text-rose-300 border-rose-800/50' },
};

const BOTON_AVANZAR = {
  PENDIENTE: 'Iniciar Preparación',
  PREPARANDO: 'Marcar como Listo',
  HECHO: 'Marcar Entregado',
};

function TarjetaPedido({ pedido }: { pedido: Pedido }) {
  const [isPending, startTransition] = useTransition();
  const config = ESTADO_CONFIG[pedido.estado];
  const puedeAvanzar = pedido.estado !== 'ENTREGADO' && pedido.estado !== 'CANCELADO';

  const handleAvanzar = () => {
    startTransition(async () => {
      await avanzarEstadoPedido(pedido.id);
    });
  };

  return (
    <div className={`rounded-2xl border p-5 shadow-lg backdrop-blur-sm transition-all ${config.color}`}>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${config.badge} animate-pulse`} />
          <span className="text-lg font-bold text-white">Mesa {pedido.mesa}</span>
        </div>
        <span className={`rounded-full border px-3 py-0.5 text-xs font-semibold ${config.badgeText}`}>
          {config.label}
        </span>
      </div>

      <p className="mb-4 text-sm leading-relaxed text-zinc-200">{pedido.detalle}</p>

      <div className="mb-4 flex items-center justify-between text-xs text-zinc-400">
        <span>{new Date(pedido.createdAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</span>
        <span className="font-bold text-base text-white">${pedido.total.toFixed(2)}</span>
      </div>

      {puedeAvanzar && (
        <button
          onClick={handleAvanzar}
          disabled={isPending}
          className="w-full rounded-xl bg-zinc-900 border border-zinc-700/80 px-4 py-2.5 text-sm font-semibold text-white shadow transition-all hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
        >
          {isPending ? 'Actualizando...' : BOTON_AVANZAR[pedido.estado as keyof typeof BOTON_AVANZAR]}
        </button>
      )}
    </div>
  );
}

export function KitchenMonitor() {
  const { pedidos, cargando, error } = useRealtimeOrders();

  if (cargando) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
          <p className="text-zinc-400">Cargando comandas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-900/60 bg-red-950/40 p-6 text-center text-red-400">
        <p className="font-semibold">Error de conexión</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  if (pedidos.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 text-zinc-600">
        <span className="text-5xl">🍽️</span>
        <p className="text-lg font-medium text-zinc-400">Sin comandas activas</p>
        <p className="text-sm text-zinc-500">Los pedidos aparecerán aquí en tiempo real</p>
      </div>
    );
  }

  // Agrupar por estado para mostrar primero los más urgentes
  const pendientes = pedidos.filter((p) => p.estado === 'PENDIENTE');
  const preparando = pedidos.filter((p) => p.estado === 'PREPARANDO');
  const hechos = pedidos.filter((p) => p.estado === 'HECHO');

  return (
    <div className="space-y-8">
      {pendientes.length > 0 && (
        <section>
          <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
            <span>⏳ Pendientes</span>
            <span className="rounded-full bg-amber-950/80 border border-amber-800 px-2 py-0.5 text-xs text-amber-300">
              {pendientes.length}
            </span>
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {pendientes.map((p) => <TarjetaPedido key={p.id} pedido={p} />)}
          </div>
        </section>
      )}

      {preparando.length > 0 && (
        <section>
          <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-2">
            <span>🔥 En preparación</span>
            <span className="rounded-full bg-blue-950/80 border border-blue-800 px-2 py-0.5 text-xs text-blue-300">
              {preparando.length}
            </span>
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {preparando.map((p) => <TarjetaPedido key={p.id} pedido={p} />)}
          </div>
        </section>
      )}

      {hechos.length > 0 && (
        <section>
          <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
            <span>✅ Listos para entregar</span>
            <span className="rounded-full bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 text-xs text-emerald-300">
              {hechos.length}
            </span>
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {hechos.map((p) => <TarjetaPedido key={p.id} pedido={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}
