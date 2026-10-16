'use client';

import { useState, useEffect, useCallback, useTransition } from 'react';
import { useRealtimeOrders, Pedido } from '../hooks/use-realtime-orders';
import { avanzarEstadoPedido } from '../actions/order-mutations';
import { kitchenAudio } from '../utils/audio-alerts';
import { formatearHoraColombia } from '@/lib/date-utils';
import { parseDetallePedido } from '../utils/parse-order-detail';


const ESTADO_CONFIG = {
  PENDIENTE: {
    label: '⏳ Pendiente',
    color: 'bg-amber-950/25 text-amber-200 border-amber-800/70',
    badge: 'bg-amber-400',
    badgeText: 'bg-amber-950/60 text-amber-300 border-amber-800/50',
  },
  PREPARANDO: {
    label: '🔥 En preparación',
    color: 'bg-blue-950/25 text-blue-200 border-blue-800/70',
    badge: 'bg-blue-400',
    badgeText: 'bg-blue-950/60 text-blue-300 border-blue-800/50',
  },
  HECHO: {
    label: '✅ Listo para servir',
    color: 'bg-emerald-950/25 text-emerald-200 border-emerald-800/70',
    badge: 'bg-emerald-400',
    badgeText: 'bg-emerald-950/60 text-emerald-300 border-emerald-800/50',
  },
  ENTREGADO: {
    label: '🎉 Entregado',
    color: 'bg-zinc-950 text-zinc-400 border-zinc-800',
    badge: 'bg-zinc-600',
    badgeText: 'bg-zinc-900 text-zinc-400 border-zinc-800',
  },
  CANCELADO: {
    label: '❌ Cancelado',
    color: 'bg-rose-950/25 text-rose-200 border-rose-800/70',
    badge: 'bg-rose-400',
    badgeText: 'bg-rose-950/60 text-rose-300 border-rose-800/50',
  },
  PAGADO: {
    label: '💰 Pagado',
    color: 'bg-emerald-950/25 text-emerald-200 border-emerald-800/70',
    badge: 'bg-emerald-400',
    badgeText: 'bg-emerald-950/60 text-emerald-300 border-emerald-800/50',
  },
};


const BOTON_AVANZAR = {
  PENDIENTE: '🔥 Iniciar Preparación',
  PREPARANDO: '✅ Marcar como Listo',
  HECHO: '🍽️ Marcar Entregado',
};

function TarjetaPedido({ pedido, esNuevo }: { pedido: Pedido; esNuevo?: boolean }) {
  const [isPending, startTransition] = useTransition();
  const config = ESTADO_CONFIG[pedido.estado];
  const puedeAvanzar = pedido.estado !== 'ENTREGADO' && pedido.estado !== 'CANCELADO';

  const handleAvanzar = () => {
    startTransition(async () => {
      await avanzarEstadoPedido(pedido.id);
    });
  };

  // Parsea cada platillo con sus adiciones, notas y cantidades
  const items = parseDetallePedido(pedido.detalle, pedido.total);

  return (
    <div
      className={`relative flex flex-col justify-between rounded-2xl border p-5 shadow-lg backdrop-blur-sm transition-all ${config.color} ${
        esNuevo
          ? 'ring-2 ring-amber-400 border-amber-400/80 shadow-2xl shadow-amber-500/30'
          : ''
      }`}
    >
      {/* Badge flotante de nuevo pedido */}
      {esNuevo && (
        <span className="absolute -top-3 right-4 flex items-center gap-1 rounded-full bg-amber-400 px-3 py-0.5 text-[11px] font-black uppercase tracking-wider text-black shadow-md animate-bounce">
          <span>🔔</span> ¡NUEVO!
        </span>
      )}

      <div>
        {/* Cabecera de la comanda */}
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 min-w-0">
            <span className={`mt-1 h-3 w-3 shrink-0 rounded-full ${config.badge} ${esNuevo ? 'animate-ping' : 'animate-pulse'}`} />
            <div className="min-w-0">
              {pedido.tipoPedido === 'LLEVAR' || pedido.detalle.includes('[PARA LLEVAR') ? (
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 text-xs font-black text-amber-300">
                    🛍️ PARA LLEVAR
                  </span>
                  <p className="text-sm font-bold text-white mt-0.5 truncate">
                    {pedido.cliente ? `Cliente: ${pedido.cliente}` : 'Mostrador / Barra'}
                  </p>
                </div>
              ) : pedido.tipoPedido === 'DOMICILIO' || pedido.detalle.includes('[DOMICILIO') ? (
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-500/20 border border-cyan-500/40 px-2 py-0.5 text-xs font-black text-cyan-300">
                    🛵 DOMICILIO
                  </span>
                  <p className="text-sm font-bold text-white mt-0.5 truncate">
                    {pedido.cliente ? `${pedido.cliente}` : 'Domicilio'}
                  </p>
                  {pedido.direccion && (
                    <p className="text-xs text-zinc-300 font-medium truncate">
                      📍 {pedido.direccion}
                    </p>
                  )}
                  {pedido.telefono && (
                    <p className="text-[11px] text-zinc-400">
                      📞 {pedido.telefono}
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <span className="text-xl font-black text-white">Mesa {pedido.mesa}</span>
                  <p className="text-[11px] text-zinc-400">Terraza</p>
                </div>
              )}
            </div>
          </div>
          <span className={`shrink-0 rounded-full border px-3 py-1 text-xs font-bold ${config.badgeText}`}>
            {config.label}
          </span>
        </div>

        {/* Nota especial de preparación si existe */}
        {pedido.notas && (
          <div className="mb-3 rounded-xl bg-amber-950/40 border border-amber-700/60 p-2 text-xs text-amber-200 flex items-start gap-1.5">
            <span className="shrink-0">⚠️</span>
            <span className="font-semibold">{pedido.notas}</span>
          </div>
        )}

        {/* Lista visual de platillos con adiciones y notas */}
        <div className="mb-4 space-y-2">
          {items.map((item, idx) => (
            <div
              key={idx}
              className="rounded-xl bg-black/50 border border-zinc-800/80 p-2.5 space-y-1"
            >
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-orange-500/20 text-orange-400 text-xs font-black border border-orange-500/30">
                  {item.cantidad}x
                </span>
                <span className="text-sm font-bold text-white leading-snug">{item.nombre}</span>
              </div>

              {/* Adiciones destacadas para cocina */}
              {item.adiciones && item.adiciones.length > 0 && (
                <div className="flex flex-wrap gap-1 ml-8 pt-0.5">
                  {item.adiciones.map((adic, aIdx) => (
                    <span
                      key={aIdx}
                      className="inline-flex items-center gap-1 rounded-md bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 text-xs font-black text-amber-300"
                    >
                      🥓 {adic}
                    </span>
                  ))}
                </div>
              )}

              {/* Nota o instrucción especial de preparación */}
              {item.notas && (
                <div className="ml-8 rounded-lg bg-zinc-900 border border-zinc-700/70 px-2 py-1 text-xs text-orange-200 flex items-center gap-1.5 font-medium">
                  <span className="shrink-0">📝</span>
                  <span className="italic font-semibold">{item.notas}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div>
        {/* Hora y total */}
        <div className="mb-4 flex items-center justify-between border-t border-zinc-800/60 pt-3 text-xs text-zinc-400">
          <span>
            🕒 {formatearHoraColombia(pedido.createdAt)}
          </span>

          <span className="text-base font-extrabold text-white">${pedido.total.toFixed(2)}</span>
        </div>

        {/* Botón táctil para pasar de estado */}
        {puedeAvanzar && (
          <button
            type="button"
            onClick={handleAvanzar}
            disabled={isPending}
            className="w-full rounded-xl bg-zinc-900 border border-zinc-700/80 px-4 py-2.5 text-sm font-bold text-white shadow transition-all hover:bg-zinc-800 hover:border-zinc-500 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
          >
            {isPending ? 'Actualizando...' : BOTON_AVANZAR[pedido.estado as keyof typeof BOTON_AVANZAR]}
          </button>
        )}
      </div>
    </div>
  );
}

export function KitchenMonitor() {
  const [nuevoPedidoAlerta, setNuevoPedidoAlerta] = useState<Pedido | null>(null);
  const [destelloPantalla, setDestelloPantalla] = useState(false);
  const [nuevosPedidosIds, setNuevosPedidosIds] = useState<Set<string>>(new Set());
  const [sonidoHabilitado, setSonidoHabilitado] = useState(true);
  const [audioDesbloqueado, setAudioDesbloqueado] = useState(false);

  // Inicializar estado del sonido al montar
  useEffect(() => {
    setSonidoHabilitado(kitchenAudio.isEnabled());
    setAudioDesbloqueado(kitchenAudio.isUnlocked());

    // Al primer clic en cualquier parte de la pantalla, desbloquear el AudioContext del navegador
    const desbloquearPorGesto = () => {
      kitchenAudio.unlock().then((ok) => {
        if (ok) setAudioDesbloqueado(true);
      });
    };

    window.addEventListener('click', desbloquearPorGesto, { once: true });
    window.addEventListener('touchstart', desbloquearPorGesto, { once: true });

    return () => {
      window.removeEventListener('click', desbloquearPorGesto);
      window.removeEventListener('touchstart', desbloquearPorGesto);
    };
  }, []);

  // Callback ejecutado en tiempo real al llegar un nuevo pedido vía Supabase Realtime
  const handleNuevoPedido = useCallback((pedido: Pedido) => {
    // 1. Sonido de campana de cocina
    kitchenAudio.playOrderChime();

    // 2. Destello visual en los bordes de la pantalla
    setDestelloPantalla(true);
    setTimeout(() => {
      setDestelloPantalla(false);
    }, 2800);

    // 3. Banner superior flotante
    setNuevoPedidoAlerta(pedido);
    setTimeout(() => {
      setNuevoPedidoAlerta((curr) => (curr?.id === pedido.id ? null : curr));
    }, 8000);

    // 4. Resaltar la tarjeta con halo y badge por 30 segundos
    setNuevosPedidosIds((prev) => new Set(prev).add(pedido.id));
    setTimeout(() => {
      setNuevosPedidosIds((prev) => {
        const next = new Set(prev);
        next.delete(pedido.id);
        return next;
      });
    }, 30000);
  }, []);

  const { pedidos, cargando, error } = useRealtimeOrders(handleNuevoPedido);

  const activarAudioManual = async () => {
    const ok = await kitchenAudio.unlock();
    setAudioDesbloqueado(ok);
    kitchenAudio.playOrderChime();
  };

  const toggleSonido = () => {
    const nuevoEstado = !sonidoHabilitado;
    kitchenAudio.setEnabled(nuevoEstado);
    setSonidoHabilitado(nuevoEstado);
    if (nuevoEstado) {
      kitchenAudio.unlock();
      kitchenAudio.playOrderChime();
    }
  };

  const probarSonido = async () => {
    await kitchenAudio.unlock();
    setAudioDesbloqueado(true);
    kitchenAudio.playOrderChime();
  };

  if (cargando) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
          <p className="text-zinc-400">Cargando comandas en vivo...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-900/60 bg-red-950/40 p-6 text-center text-red-400">
        <p className="font-semibold">Error de conexión con cocina</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  // Agrupar por estado para mostrar primero los más urgentes
  const pendientes = pedidos.filter((p) => p.estado === 'PENDIENTE');
  const preparando = pedidos.filter((p) => p.estado === 'PREPARANDO');
  const hechos = pedidos.filter((p) => p.estado === 'HECHO');

  return (
    <div className="relative space-y-6">
      {/* DESTELLO VISUAL DE PANTALLA COMPLETA AL LLEGAR PEDIDO */}
      {destelloPantalla && (
        <div className="pointer-events-none fixed inset-0 z-50 border-8 sm:border-[12px] border-amber-400/90 bg-amber-500/10 shadow-[inset_0_0_80px_rgba(245,158,11,0.5)] transition-all duration-300 animate-pulse" />
      )}

      {/* BANNER FLOTANTE SUPERIOR CON DETALLES DEL NUEVO PEDIDO */}
      {nuevoPedidoAlerta && (
        <div className="fixed top-4 left-4 right-4 sm:left-1/2 sm:-translate-x-1/2 sm:w-auto sm:min-w-[420px] z-50 flex items-center justify-between gap-4 rounded-2xl border-2 border-amber-400 bg-zinc-950/95 px-5 py-3.5 shadow-2xl shadow-amber-500/40 backdrop-blur-md">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-3xl animate-bounce shrink-0">🔔</span>
            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase tracking-wider text-amber-400">
                ¡Nueva Comanda Recibida!
              </p>
              <p className="text-base font-extrabold text-white truncate">
                Mesa {nuevoPedidoAlerta.mesa} • ${nuevoPedidoAlerta.total.toFixed(2)}
              </p>
              <p className="text-xs text-zinc-300 truncate">{nuevoPedidoAlerta.detalle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setNuevoPedidoAlerta(null)}
            className="shrink-0 rounded-xl bg-amber-950/80 border border-amber-800 px-3 py-1.5 text-xs font-bold text-amber-200 hover:bg-amber-900 transition-colors"
          >
            Enterado ✓
          </button>
        </div>
      )}

      {/* BARRA DE ESTADO Y CONTROLES DE AUDIO PARA COCINEROS */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-800/80 bg-zinc-950 px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Comandas activas:
          </span>
          <div className="flex items-center gap-2 text-xs font-bold">
            <span className="rounded-lg bg-amber-950/60 border border-amber-800/60 px-2.5 py-1 text-amber-300">
              ⏳ {pendientes.length} pendientes
            </span>
            <span className="rounded-lg bg-blue-950/60 border border-blue-800/60 px-2.5 py-1 text-blue-300">
              🔥 {preparando.length} preparando
            </span>
            <span className="rounded-lg bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-1 text-emerald-300">
              ✅ {hechos.length} listas
            </span>
          </div>
        </div>

        {/* Controles de sonido */}
        <div className="flex items-center gap-2">
          {!audioDesbloqueado ? (
            <button
              type="button"
              onClick={activarAudioManual}
              className="flex items-center gap-2 rounded-xl bg-amber-500/20 border border-amber-500/50 px-3 py-1.5 text-xs font-bold text-amber-300 hover:bg-amber-500/30 transition-all animate-pulse"
            >
              <span>🔔</span>
              <span>Activar sonido de campana</span>
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={toggleSonido}
                className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all ${
                  sonidoHabilitado
                    ? 'border-emerald-800/80 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/50'
                    : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white'
                }`}
              >
                <span>{sonidoHabilitado ? '🔔 Timbre activado' : '🔇 Silenciado'}</span>
              </button>
              <button
                type="button"
                onClick={probarSonido}
                className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all active:scale-95"
                title="Probar sonido de campanilla"
              >
                🔊 Probar timbre
              </button>
            </>
          )}
        </div>
      </div>

      {/* CUANDO NO HAY COMANDAS ACTIVAS */}
      {pedidos.length === 0 && (
        <div className="flex h-64 flex-col items-center justify-center gap-3 text-zinc-600">
          <span className="text-5xl">🍽️</span>
          <p className="text-lg font-medium text-zinc-300">Sin comandas activas</p>
          <p className="text-sm text-zinc-500">
            Los pedidos nuevos aparecerán aquí con alerta sonora y visual
          </p>
        </div>
      )}

      {/* LISTA DE COMANDAS AGRUPADAS POR PRIORIDAD */}
      {pendientes.length > 0 && (
        <section>
          <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
            <span>⏳ Pendientes por preparar</span>
            <span className="rounded-full bg-amber-950/80 border border-amber-800 px-2 py-0.5 text-xs text-amber-300">
              {pendientes.length}
            </span>
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {pendientes.map((p) => (
              <TarjetaPedido key={p.id} pedido={p} esNuevo={nuevosPedidosIds.has(p.id)} />
            ))}
          </div>
        </section>
      )}

      {preparando.length > 0 && (
        <section>
          <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-2">
            <span>🔥 En preparación</span>
            <span className="rounded-full bg-blue-950/80 border border-blue-800 px-2 py-0.5 text-xs text-blue-300">
              {preparando.length}
            </span>
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {preparando.map((p) => (
              <TarjetaPedido key={p.id} pedido={p} esNuevo={nuevosPedidosIds.has(p.id)} />
            ))}
          </div>
        </section>
      )}

      {hechos.length > 0 && (
        <section>
          <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
            <span>✅ Listos para servir</span>
            <span className="rounded-full bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 text-xs text-emerald-300">
              {hechos.length}
            </span>
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {hechos.map((p) => (
              <TarjetaPedido key={p.id} pedido={p} esNuevo={nuevosPedidosIds.has(p.id)} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
