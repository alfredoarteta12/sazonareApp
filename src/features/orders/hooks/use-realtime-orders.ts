'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { OrderStatus, TipoPedido, MetodoPago } from '@prisma/client';

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

    const url = incluirEntregados ? '/api/pedidos/activos?todosHoy=true' : '/api/pedidos/activos';

    try {
      const res = await fetch(url, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
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

      // Optimización de re-render: solo actualizar estado si hubo cambios reales
      setPedidos((prev) => {
        if (prev.length === filtrados.length) {
          let sinCambios = true;
          for (let i = 0; i < prev.length; i++) {
            if (
              prev[i].id !== filtrados[i].id ||
              prev[i].estado !== filtrados[i].estado ||
              prev[i].total !== filtrados[i].total ||
              prev[i].metodoPago !== filtrados[i].metodoPago ||
              prev[i].updatedAt !== filtrados[i].updatedAt
            ) {
              sinCambios = false;
              break;
            }
          }
          if (sinCambios) return prev;
        }
        return filtrados;
      });

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

    // Sincronización inmediata al montar
    sincronizarPedidos();

    // Polling inteligente cada 2.5 segundos
    // En segundo plano o pestaña oculta se reduce para optimizar batería y recursos de red
    let timerId: NodeJS.Timeout;

    const tick = async () => {
      if (!activo) return;
      await sincronizarPedidos();
      if (!activo) return;
      const actualMs = typeof document !== 'undefined' && document.hidden ? 8000 : 2500;
      timerId = setTimeout(tick, actualMs);
    };

    timerId = setTimeout(tick, 2500);

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
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilidad);
      }
    };
  }, [sincronizarPedidos]);

  return { pedidos, cargando, error, refrescar: sincronizarPedidos };
}
