'use client';

import { useState, useEffect, useCallback, useTransition } from 'react';
import { useRealtimeOrders, Pedido } from '../hooks/use-realtime-orders';
import { avanzarEstadoPedido } from '../actions/order-mutations';
import { kitchenAudio } from '../utils/audio-alerts';
import { formatearHoraColombia } from '@/lib/date-utils';
import { parseDetallePedido } from '../utils/parse-order-detail';
import { PlatosAgotadosModal } from '@/features/menu/components/platos-agotados-modal';
import { formatearCOP } from '@/lib/currency';
import {
  Bell,
  Flame,
  CheckCircle2,
  Clock,
  ShoppingBag,
  Bike,
  Volume2,
  VolumeX,
  Slash,
  Sparkles,
  FileText,
  ChefHat,
  UtensilsCrossed,
} from 'lucide-react';

const ESTADO_CONFIG = {
  SOLICITADO: {
    label: 'Solicitado por Cliente',
    icon: Bell,
    color: 'bg-zinc-950 text-purple-200 border-2 border-purple-500 shadow-[4px_4px_0px_0px_#a855f7]',
    badge: 'bg-purple-400',
    badgeText: 'bg-purple-950 text-purple-300 border-2 border-purple-700',
  },
  PENDIENTE: {
    label: 'Pendiente',
    icon: Clock,
    color: 'bg-zinc-950 text-amber-200 border-2 border-amber-400 shadow-[4px_4px_0px_0px_#f59e0b]',
    badge: 'bg-amber-400',
    badgeText: 'bg-amber-950 text-amber-300 border-2 border-amber-700',
  },
  PREPARANDO: {
    label: 'En preparación',
    icon: Flame,
    color: 'bg-zinc-950 text-blue-200 border-2 border-blue-500 shadow-[4px_4px_0px_0px_#3b82f6]',
    badge: 'bg-blue-400',
    badgeText: 'bg-blue-950 text-blue-300 border-2 border-blue-700',
  },
  HECHO: {
    label: 'Listo para servir',
    icon: CheckCircle2,
    color: 'bg-zinc-950 text-emerald-200 border-2 border-emerald-500 shadow-[4px_4px_0px_0px_#10b981]',
    badge: 'bg-emerald-400',
    badgeText: 'bg-emerald-950 text-emerald-300 border-2 border-emerald-700',
  },
  ENTREGADO: {
    label: 'Entregado',
    icon: CheckCircle2,
    color: 'bg-zinc-950 text-zinc-400 border-2 border-zinc-800 shadow-[3px_3px_0px_0px_#27272a]',
    badge: 'bg-zinc-600',
    badgeText: 'bg-zinc-900 text-zinc-400 border-2 border-zinc-700',
  },
  CANCELADO: {
    label: 'Cancelado',
    icon: Slash,
    color: 'bg-zinc-950 text-rose-200 border-2 border-rose-500 shadow-[4px_4px_0px_0px_#f43f5e]',
    badge: 'bg-rose-400',
    badgeText: 'bg-rose-950 text-rose-300 border-2 border-rose-700',
  },
  PAGADO: {
    label: 'Pagado',
    icon: CheckCircle2,
    color: 'bg-zinc-950 text-emerald-200 border-2 border-emerald-500 shadow-[4px_4px_0px_0px_#10b981]',
    badge: 'bg-emerald-400',
    badgeText: 'bg-emerald-950 text-emerald-300 border-2 border-emerald-700',
  },
};

const BOTON_AVANZAR = {
  PENDIENTE: { texto: 'Iniciar Preparación', color: 'bg-amber-400 text-black border-amber-300 shadow-[3px_3px_0px_0px_#fff] hover:bg-amber-300' },
  PREPARANDO: { texto: 'Marcar como Listo', color: 'bg-emerald-500 text-black border-emerald-400 shadow-[3px_3px_0px_0px_#fff] hover:bg-emerald-400' },
  HECHO: { texto: 'Marcar Entregado', color: 'bg-zinc-800 text-white border-zinc-600 shadow-[3px_3px_0px_0px_#52525b] hover:bg-zinc-700' },
};

function TarjetaPedido({
  pedido,
  esNuevo,
  onAvanzar,
}: {
  pedido: Pedido;
  esNuevo?: boolean;
  onAvanzar?: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const config = ESTADO_CONFIG[pedido.estado];
  const puedeAvanzar = pedido.estado !== 'ENTREGADO' && pedido.estado !== 'CANCELADO';

  const handleAvanzar = () => {
    startTransition(async () => {
      await avanzarEstadoPedido(pedido.id);
      onAvanzar?.();
    });
  };

  // Parsea cada platillo con sus adiciones, notas y cantidades
  const items = parseDetallePedido(pedido.detalle, pedido.total);

  return (
    <div
      className={`relative flex flex-col justify-between rounded-2xl p-5 transition-all ${config.color} ${
        esNuevo
          ? 'ring-4 ring-amber-400 shadow-[6px_6px_0px_0px_#f59e0b]'
          : ''
      }`}
    >
      {/* Badge flotante de nuevo pedido */}
      {esNuevo && (
        <span className="neo-sticker absolute -top-3.5 right-4 flex items-center gap-1.5 bg-amber-400 px-3 py-1 text-xs font-black uppercase tracking-wider text-black border-2 border-black shadow-[2px_2px_0px_0px_#fff] animate-bounce">
          <Sparkles className="h-3 w-3 stroke-[3]" /> ¡NUEVO!
        </span>
      )}

      <div>
        {/* Cabecera de la comanda */}
        <div className="mb-3.5 flex items-start justify-between gap-2">
          <div className="flex items-start gap-2.5 min-w-0">
            <span className={`mt-1.5 h-3 w-3 shrink-0 rounded-full ${config.badge} ${esNuevo ? 'animate-ping' : 'animate-pulse'}`} />
            <div className="min-w-0">
              {pedido.tipoPedido === 'LLEVAR' || pedido.detalle.includes('[PARA LLEVAR') ? (
                <div>
                  <span className="inline-flex items-center gap-1 rounded bg-amber-500/20 border-2 border-amber-500/60 px-2 py-0.5 text-xs font-black uppercase text-amber-300">
                    <ShoppingBag className="h-3 w-3" /> PARA LLEVAR
                  </span>
                  <p className="font-display text-sm font-black text-white mt-1 truncate">
                    {pedido.cliente ? `Cliente: ${pedido.cliente}` : 'Mostrador / Barra'}
                  </p>
                </div>
              ) : pedido.tipoPedido === 'DOMICILIO' || pedido.detalle.includes('[DOMICILIO') ? (
                <div>
                  <span className="inline-flex items-center gap-1 rounded bg-cyan-500/20 border-2 border-cyan-500/60 px-2 py-0.5 text-xs font-black uppercase text-cyan-300">
                    <Bike className="h-3 w-3" /> DOMICILIO
                  </span>
                  <p className="font-display text-sm font-black text-white mt-1 truncate">
                    {pedido.cliente ? `${pedido.cliente}` : 'Domicilio'}
                  </p>
                  {pedido.direccion && (
                    <p className="text-xs text-zinc-300 font-semibold truncate mt-0.5">
                      📍 {pedido.direccion}
                    </p>
                  )}
                  {pedido.telefono && (
                    <p className="text-[11px] text-zinc-400 font-bold mt-0.5">
                      📞 {pedido.telefono}
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <span className="font-display text-2xl font-black uppercase tracking-tight text-white">Mesa {pedido.mesa}</span>
                  <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Terraza Sazonare</p>
                </div>
              )}
            </div>
          </div>
          <span className={`shrink-0 neo-sticker text-[10px] font-black uppercase tracking-wider px-2.5 py-1 ${config.badgeText}`}>
            {config.label}
          </span>
        </div>

        {/* Indicaciones / Notas de la comanda para cocina */}
        {pedido.notas && (
          <div className="mb-3.5 rounded-xl bg-amber-500/15 border-2 border-amber-400 p-2.5 text-xs text-amber-200 flex items-start gap-2 shadow-[2px_2px_0px_0px_#f59e0b]">
            <FileText className="shrink-0 h-4 w-4 text-amber-400 mt-0.5" />
            <div className="min-w-0">
              <p className="font-black text-amber-400 uppercase tracking-wider text-[10px]">
                Indicaciones de la Comanda:
              </p>
              <p className="font-bold text-white text-xs sm:text-sm mt-0.5 whitespace-pre-wrap">
                {pedido.notas}
              </p>
            </div>
          </div>
        )}

        {/* Lista visual de platillos con adiciones y notas */}
        <div className="mb-4 space-y-2">
          {items.map((item, idx) => (
            <div
              key={idx}
              className="rounded-xl bg-black/70 border-2 border-zinc-800 p-2.5 space-y-1.5"
            >
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-orange-500 text-black text-xs font-black border border-orange-400 shadow-[1px_1px_0px_0px_#fff]">
                  {item.cantidad}x
                </span>
                <span className="font-display text-sm font-black text-white leading-snug">{item.nombre}</span>
              </div>

              {/* Adiciones destacadas para cocina */}
              {item.adiciones && item.adiciones.length > 0 && (
                <div className="flex flex-wrap gap-1 ml-8 pt-0.5">
                  {item.adiciones.map((adic, aIdx) => (
                    <span
                      key={aIdx}
                      className="inline-flex items-center gap-1 rounded bg-amber-500/20 border border-amber-400/60 px-2 py-0.5 text-xs font-black text-amber-300"
                    >
                      🥓 {adic}
                    </span>
                  ))}
                </div>
              )}

              {/* Nota o instrucción especial de preparación */}
              {item.notas && (
                <div className="ml-8 rounded-lg bg-zinc-900 border border-zinc-700 px-2 py-1 text-xs text-orange-200 flex items-center gap-1.5 font-medium">
                  <FileText className="h-3 w-3 text-orange-400 shrink-0" />
                  <span className="font-bold">{item.notas}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div>
        {/* Hora y total */}
        <div className="mb-4 flex items-center justify-between border-t-2 border-zinc-800 pt-3 text-xs text-zinc-400">
          <span className="flex items-center gap-1 font-bold text-zinc-400">
            <Clock className="h-3.5 w-3.5 text-zinc-400" />
            {formatearHoraColombia(pedido.createdAt)}
          </span>

          <span className="font-display text-base font-black text-white tracking-tight">{formatearCOP(pedido.total)}</span>
        </div>

        {/* Botón táctil para pasar de estado */}
        {puedeAvanzar && (
          <button
            type="button"
            onClick={handleAvanzar}
            disabled={isPending}
            className={`w-full rounded-xl border-2 px-4 py-2.5 text-xs font-black uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed active:translate-x-[2px] active:translate-y-[2px] ${
              BOTON_AVANZAR[pedido.estado as keyof typeof BOTON_AVANZAR]?.color || 'bg-zinc-800 text-white border-zinc-700'
            }`}
          >
            {isPending ? 'Actualizando...' : BOTON_AVANZAR[pedido.estado as keyof typeof BOTON_AVANZAR]?.texto}
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
  const [modalAgotadosAbierto, setModalAgotadosAbierto] = useState(false);
  const [conteoAgotados, setConteoAgotados] = useState(0);

  // Escuchar y contar platos agotados en tiempo real para AWS
  useEffect(() => {
    let activo = true;

    const cargarAgotados = () => {
      const url = `/api/productos?_cb=${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      fetch(url, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0' },
      })
        .then((res) => res.json())
        .then((data: any[]) => {
          if (activo && Array.isArray(data)) {
            setConteoAgotados(data.filter((p) => !p.disponible).length);
          }
        })
        .catch(() => {});
    };

    cargarAgotados();
    const intervalo = setInterval(cargarAgotados, 1500);

    return () => {
      activo = false;
      clearInterval(intervalo);
    };
  }, []);

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

  const { pedidos, cargando, error, refrescar } = useRealtimeOrders(handleNuevoPedido);

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
                Mesa {nuevoPedidoAlerta.mesa} • {formatearCOP(nuevoPedidoAlerta.total)}
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
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-zinc-800 bg-zinc-950 px-4 py-3 shadow-[4px_4px_0px_0px_#18181b]">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500 text-black font-black border border-orange-400">
            <ChefHat className="h-4 w-4" />
          </div>
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider">
            <span className="rounded-lg bg-amber-400 text-black border-2 border-amber-300 px-2.5 py-1 shadow-[2px_2px_0px_0px_#fff]">
              {pendientes.length} pendientes
            </span>
            <span className="rounded-lg bg-blue-500 text-white border-2 border-blue-400 px-2.5 py-1 shadow-[2px_2px_0px_0px_#fff]">
              {preparando.length} preparando
            </span>
            <span className="rounded-lg bg-emerald-500 text-black border-2 border-emerald-400 px-2.5 py-1 shadow-[2px_2px_0px_0px_#fff]">
              {hechos.length} listas
            </span>
          </div>
        </div>

        {/* Controles de sonido */}
        <div className="flex items-center gap-2">
          {!audioDesbloqueado ? (
            <button
              type="button"
              onClick={activarAudioManual}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-400 text-black border-2 border-amber-300 px-3 py-1.5 text-xs font-black uppercase tracking-wider shadow-[3px_3px_0px_0px_#fff] hover:bg-amber-300 transition-all animate-pulse"
            >
              <Bell className="h-3.5 w-3.5 stroke-[2.5]" />
              <span>Activar sonido de campana</span>
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={toggleSonido}
                className={`inline-flex items-center gap-1.5 rounded-xl border-2 px-3 py-1.5 text-xs font-black uppercase tracking-wider transition-all active:translate-x-[1px] active:translate-y-[1px] ${
                  sonidoHabilitado
                    ? 'border-emerald-400 bg-emerald-500 text-black shadow-[2px_2px_0px_0px_#fff]'
                    : 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:text-white'
                }`}
              >
                {sonidoHabilitado ? (
                  <>
                    <Volume2 className="h-3.5 w-3.5 stroke-[2.5]" />
                    <span>Timbre Activo</span>
                  </>
                ) : (
                  <>
                    <VolumeX className="h-3.5 w-3.5" />
                    <span>Silenciado</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={probarSonido}
                className="inline-flex items-center gap-1.5 rounded-xl border-2 border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-bold text-zinc-300 hover:bg-zinc-800 hover:text-white hover:border-zinc-500 transition-all active:translate-x-[1px] active:translate-y-[1px]"
                title="Probar sonido de campanilla"
              >
                <Volume2 className="h-3.5 w-3.5" />
                <span>Probar</span>
              </button>
            </>
          )}

          {/* Botón de Control de Platos Agotados */}
          <button
            type="button"
            onClick={() => setModalAgotadosAbierto(true)}
            className={`inline-flex items-center gap-2 rounded-xl border-2 px-3 py-1.5 text-xs font-black uppercase tracking-wider transition-all active:translate-x-[1px] active:translate-y-[1px] ${
              conteoAgotados > 0
                ? 'bg-rose-500 text-black border-rose-400 shadow-[3px_3px_0px_0px_#fff]'
                : 'border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-zinc-500 hover:text-white'
            }`}
            title="Marcar o reactivar productos agotados en cocina"
          >
            <Slash className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>Platos Agotados</span>
            {conteoAgotados > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-black text-[10px] font-black text-rose-400">
                {conteoAgotados}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* CUANDO NO HAY COMANDAS ACTIVAS */}
      {pedidos.length === 0 && (
        <div className="flex h-72 flex-col items-center justify-center gap-3 rounded-2xl border-2 border-zinc-800 bg-zinc-950/60 p-8 text-center shadow-[4px_4px_0px_0px_#18181b]">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-900 border-2 border-zinc-700 text-zinc-500 shadow-[3px_3px_0px_0px_#27272a]">
            <UtensilsCrossed className="h-8 w-8 stroke-[1.5]" />
          </div>
          <p className="font-display text-xl font-black uppercase tracking-tight text-white">Sin comandas activas</p>
          <p className="text-xs text-zinc-400 font-medium max-w-sm">
            Los pedidos nuevos aparecerán aquí automáticamente con alertas sonoras y destello visual.
          </p>
        </div>
      )}

      {/* LISTA DE COMANDAS AGRUPADAS POR PRIORIDAD */}
      {pendientes.length > 0 && (
        <section>
          <div className="mb-3.5 flex items-center gap-2">
            <span className="neo-sticker bg-amber-400 text-black border-2 border-amber-300 text-xs font-black uppercase tracking-wider px-3 py-1 shadow-[2px_2px_0px_0px_#fff]">
              Pendientes ({pendientes.length})
            </span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {pendientes.map((p) => (
              <TarjetaPedido
                key={p.id}
                pedido={p}
                esNuevo={nuevosPedidosIds.has(p.id)}
                onAvanzar={refrescar}
              />
            ))}
          </div>
        </section>
      )}

      {preparando.length > 0 && (
        <section>
          <div className="mb-3.5 flex items-center gap-2">
            <span className="neo-sticker bg-blue-500 text-white border-2 border-blue-400 text-xs font-black uppercase tracking-wider px-3 py-1 shadow-[2px_2px_0px_0px_#fff]">
              En preparación ({preparando.length})
            </span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {preparando.map((p) => (
              <TarjetaPedido
                key={p.id}
                pedido={p}
                esNuevo={nuevosPedidosIds.has(p.id)}
                onAvanzar={refrescar}
              />
            ))}
          </div>
        </section>
      )}

      {hechos.length > 0 && (
        <section>
          <div className="mb-3.5 flex items-center gap-2">
            <span className="neo-sticker bg-emerald-500 text-black border-2 border-emerald-400 text-xs font-black uppercase tracking-wider px-3 py-1 shadow-[2px_2px_0px_0px_#fff]">
              Listos para servir ({hechos.length})
            </span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {hechos.map((p) => (
              <TarjetaPedido
                key={p.id}
                pedido={p}
                esNuevo={nuevosPedidosIds.has(p.id)}
                onAvanzar={refrescar}
              />
            ))}
          </div>
        </section>
      )}

      {/* Modal de gestión de platos agotados */}
      {modalAgotadosAbierto && (
        <PlatosAgotadosModal onCerrar={() => setModalAgotadosAbierto(false)} />
      )}
    </div>
  );
}
