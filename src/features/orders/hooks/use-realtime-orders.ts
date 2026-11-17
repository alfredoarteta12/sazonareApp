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

    // Generador de cache-buster de alta entropía para anular cualquier proxy o CloudFront en AWS
    const base = incluirEntregados ? '/api/pedidos/activos?todosHoy=true' : '/api/pedidos/activos';
    const sep = base.includes('?') ? '&' : '?';
    const cacheBuster = `_cb=${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const url = `${base}${sep}${cacheBuster}`;

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

      // Detectar novedades y cambios de estado en tiempo real (a partir del 2do ciclo)
      if (!primeraCargaRef.current) {
        const mapaAnterior = pedidosPreviosMapRef.current;

        for (const pedido of filtrados) {
          const estadoAnterior = mapaAnterior.get(pedido.id);

          // 1. Nueva comanda para Cocina (!incluirEntregados):
          // Ya sea que entró directo en PENDIENTE o el mesero aprobó una orden SOLICITADO
          if (
            !incluirEntregados &&
            (!estadoAnterior || estadoAnterior === 'SOLICITADO') &&
            pedido.estado === 'PENDIENTE'
          ) {
            onNuevoPedidoRef.current?.(pedido);
          }

          // 2. Nueva orden solicitada por cliente en mesa (vista Mesero: incluirEntregados):
          if (incluirEntregados && !estadoAnterior && pedido.estado === 'SOLICITADO') {
            onNuevoPedidoRef.current?.(pedido);
          }

          // 3. Pedido terminado en cocina (pasó a HECHO) -> Timbre Ding-Ding para Mesero
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

      // Optimización reactiva: evitar re-renders si la lista de datos no tuvo cambios reales
      setPedidos((prev) => {
        if (prev.length === filtrados.length) {
          let cambioDetectado = false;
          for (let i = 0; i < prev.length; i++) {
            const pViejo = prev[i];
            const pNuevo = filtrados[i];
            if (
              pViejo.id !== pNuevo.id ||
              pViejo.estado !== pNuevo.estado ||
              pViejo.total !== pNuevo.total ||
              pViejo.updatedAt !== pNuevo.updatedAt ||
              pViejo.detalle !== pNuevo.detalle ||
              pViejo.metodoPago !== pNuevo.metodoPago
            ) {
              cambioDetectado = true;
              break;
            }
          }
          if (!cambioDetectado) {
            return prev; // Mantiene misma referencia en memoria -> cero re-render en React
          }
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

    // Sincronización inicial inmediata
    sincronizarPedidos();

    // Loop reactivo de alta velocidad para AWS (cada 1.2 segundos activo / 5 segundos en background)
    let timerId: NodeJS.Timeout;

    const tick = async () => {
      if (!activo) return;
      await sincronizarPedidos();
      if (!activo) return;
      const intervaloMs = typeof document !== 'undefined' && document.hidden ? 5000 : 1200;
      timerId = setTimeout(tick, intervaloMs);
    };

    timerId = setTimeout(tick, 1200);

    // Si la pantalla se desbloquea o la app pasa a primer plano, forzar refresco inmediato
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
