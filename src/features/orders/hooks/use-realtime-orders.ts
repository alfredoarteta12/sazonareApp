'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { OrderStatus, TipoPedido, MetodoPago } from '@prisma/client';
import { supabase } from '@/lib/supabase';

export type { TipoPedido, MetodoPago };

export interface Pedido {
  id: string;
  mesa: number;
  tipoPedido?: TipoPedido | string | null;
  cliente?: string | null;
  telefono?: string | null;
  direccion?: string | null;
  notas?: string | null;
  detalle: string;
  total: number;
  metodoPago?: string | null;
  pagoEfectivo?: number | null;
  pagoTransferencia?: number | null;
  nombreMesero?: string | null;
  creadoPor?: { nombre: string } | string | null;
  pagos?: {
    id: string;
    metodoPago: MetodoPago;
    monto: number;
    montoRecibido?: number | null;
    cambio?: number | null;
  }[];
  estado: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

export function useRealtimeOrders(
  onNuevoPedido?: (pedido: Pedido) => void,
  options?: {
    incluirEntregados?: boolean;
    onPedidoListo?: (pedido: Pedido) => void;
  }
) {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const onNuevoPedidoRef = useRef(onNuevoPedido);
  useEffect(() => {
    onNuevoPedidoRef.current = onNuevoPedido;
  }, [onNuevoPedido]);

  const onPedidoListoRef = useRef(options?.onPedidoListo);
  useEffect(() => {
    onPedidoListoRef.current = options?.onPedidoListo;
  }, [options?.onPedidoListo]);

  const incluirEntregados = options?.incluirEntregados ?? false;
  const primeraCargaRef = useRef(true);
  const pedidosPreviosMapRef = useRef<Map<string, OrderStatus>>(new Map());
  const ejecutandoFetchRef = useRef(false);

  const sincronizarPedidos = useCallback(async () => {
    if (ejecutandoFetchRef.current) return;
    ejecutandoFetchRef.current = true;

    // Cache-buster con timestamp para forzar petición real sin que AWS o el navegador almacenen caché
    const base = incluirEntregados ? '/api/pedidos/activos?todosHoy=true' : '/api/pedidos/activos';
    const sep = base.includes('?') ? '&' : '?';
    const url = `${base}${sep}_t=${Date.now()}`;

    try {
      const res = await fetch(url, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
          Pragma: 'no-cache',
        },
      });

      if (!res.ok) throw new Error('Error al cargar pedidos');
      const data: Pedido[] = await res.json();

      const normalizados: Pedido[] = data.map((p) => ({
        ...p,
        total: Number(p.total),
        detalle: p.detalle || '',
      }));

      const filtrados = normalizados.filter((p) =>
        incluirEntregados
          ? p.estado !== 'CANCELADO'
          : p.estado !== 'ENTREGADO' &&
            p.estado !== 'CANCELADO' &&
            p.estado !== 'PAGADO' &&
            p.estado !== 'SOLICITADO'
      );

      // Detectar novedades y cambios de estado respecto al ciclo anterior (a partir del segundo ciclo)
      if (!primeraCargaRef.current) {
        const mapaAnterior = pedidosPreviosMapRef.current;

        for (const pedido of filtrados) {
          const estadoAnterior = mapaAnterior.get(pedido.id);

          // 1. Nuevo pedido para cocina (!incluirEntregados):
          // O es un nuevo pedido que entró directo en PENDIENTE, o pasó de SOLICITADO a PENDIENTE
          if (
            !incluirEntregados &&
            (!estadoAnterior || estadoAnterior === 'SOLICITADO') &&
            pedido.estado === 'PENDIENTE'
          ) {
            onNuevoPedidoRef.current?.(pedido);
          }

          // 2. Nuevo pedido solicitado por cliente en mesa para meseros (incluirEntregados):
          if (incluirEntregados && !estadoAnterior && pedido.estado === 'SOLICITADO') {
            onNuevoPedidoRef.current?.(pedido);
          }

          // 3. Pedido listo en cocina (pasó a HECHO) -> campanilla Ding-Ding para mesero
          if (pedido.estado === 'HECHO' && estadoAnterior && estadoAnterior !== 'HECHO') {
            onPedidoListoRef.current?.(pedido);
          }
        }
      }

      // Actualizar el mapa de estados conocidos
      const nuevoMapa = new Map<string, OrderStatus>();
      for (const p of filtrados) {
        nuevoMapa.set(p.id, p.estado);
      }
      pedidosPreviosMapRef.current = nuevoMapa;
      primeraCargaRef.current = false;

      // Actualizar estado siempre con la lista fresca de pedidos
      setPedidos(filtrados);
      setError(null);
      setCargando(false);
    } catch (err: any) {
      setError(err.message || 'Error de conexión');
      setCargando(false);
    } finally {
      ejecutandoFetchRef.current = false;
    }
  }, [incluirEntregados]);

  useEffect(() => {
    let activo = true;
    primeraCargaRef.current = true;
    pedidosPreviosMapRef.current.clear();

    // 1. Carga inicial inmediata al montar
    sincronizarPedidos();

    // 2. Suscripción en TIEMPO REAL NATIVO (WebSockets vía Supabase Realtime)
    // Permite recibir novedades en <100ms instantáneamente en cualquier dispositivo
    const canal = supabase
      .channel(`pedidos-live-${incluirEntregados ? 'mesero' : 'cocina'}-${Date.now()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'Pedido' },
        (payload) => {
          if (!activo) return;

          if (payload.eventType === 'INSERT') {
            const raw = payload.new as any;
            const nuevo: Pedido = {
              ...raw,
              total: Number(raw.total),
              detalle: raw.detalle || '',
            };

            // Notificación instantánea sonora y visual
            if (!incluirEntregados && nuevo.estado === 'PENDIENTE') {
              onNuevoPedidoRef.current?.(nuevo);
            }
            if (incluirEntregados && nuevo.estado === 'SOLICITADO') {
              onNuevoPedidoRef.current?.(nuevo);
            }

            sincronizarPedidos();
          } else if (payload.eventType === 'UPDATE') {
            const raw = payload.new as any;
            const estadoAnterior = pedidosPreviosMapRef.current.get(raw.id);
            const nuevoEstado = raw.estado;
            const nuevo: Pedido = {
              ...raw,
              total: Number(raw.total),
              detalle: raw.detalle || '',
            };

            // Notificación instantánea de transición de estado
            if (
              !incluirEntregados &&
              (!estadoAnterior || estadoAnterior === 'SOLICITADO') &&
              nuevoEstado === 'PENDIENTE'
            ) {
              onNuevoPedidoRef.current?.(nuevo);
            }
            if (incluirEntregados && nuevoEstado === 'HECHO' && estadoAnterior !== 'HECHO') {
              onPedidoListoRef.current?.(nuevo);
            }

            sincronizarPedidos();
          } else if (payload.eventType === 'DELETE') {
            sincronizarPedidos();
          }
        }
      )
      .subscribe();

    // 3. Polling de respaldo resiliente (compatible con AWS Amplify / CloudFront)
    // Garantiza sincronización periódica si se produce alguna reconexión WebSocket
    let timerId: NodeJS.Timeout;

    const tick = async () => {
      if (!activo) return;
      await sincronizarPedidos();
      if (!activo) return;
      const actualMs = typeof document !== 'undefined' && document.hidden ? 8000 : 3500;
      timerId = setTimeout(tick, actualMs);
    };

    timerId = setTimeout(tick, 3500);

    // Si la pestaña vuelve al frente (visibilidad), forzar refresco inmediato
    const handleVisibilidad = () => {
      if (typeof document !== 'undefined' && !document.hidden && activo) {
        sincronizarPedidos();
      }
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilidad);
    }

    return () => {
      activo = false;
      clearTimeout(timerId);
      supabase.removeChannel(canal);
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilidad);
      }
    };
  }, [sincronizarPedidos, incluirEntregados]);

  return { pedidos, cargando, error, refrescar: sincronizarPedidos };
}
