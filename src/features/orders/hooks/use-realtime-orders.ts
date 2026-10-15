'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { OrderStatus } from '@prisma/client';

export interface Pedido {
  id: string;
  mesa: number;
  detalle: string;
  total: number;
  metodoPago?: string | null;
  estado: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

export function useRealtimeOrders(
  onNuevoPedido?: (pedido: Pedido) => void,
  options?: { incluirEntregados?: boolean }
) {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const onNuevoPedidoRef = useRef(onNuevoPedido);
  useEffect(() => {
    onNuevoPedidoRef.current = onNuevoPedido;
  }, [onNuevoPedido]);

  const incluirEntregados = options?.incluirEntregados ?? false;

  useEffect(() => {
    // Carga inicial de pedidos
    const url = incluirEntregados ? '/api/pedidos/activos?todosHoy=true' : '/api/pedidos/activos';
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error('Error al cargar pedidos');
        return res.json();
      })
      .then((data: Pedido[]) => {
        setPedidos(data);
        setCargando(false);
      })
      .catch((err) => {
        setError(err.message);
        setCargando(false);
      });

    // Suscripción en tiempo real a cambios en la tabla Pedido
    const canal = supabase
      .channel(incluirEntregados ? 'cambios-mesas-terraza' : 'cambios-comandas')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'Pedido' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const nuevo = payload.new as Pedido;
            setPedidos((prev) => [nuevo, ...prev]);
            onNuevoPedidoRef.current?.(nuevo);
          } else if (payload.eventType === 'UPDATE') {
            setPedidos((prev) =>
              prev
                .map((p) => (p.id === (payload.new as Pedido).id ? (payload.new as Pedido) : p))
                .filter((p) =>
                  incluirEntregados
                    ? p.estado !== 'CANCELADO'
                    : p.estado !== 'ENTREGADO' && p.estado !== 'CANCELADO' && p.estado !== 'PAGADO'
                )
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, [incluirEntregados]);



  return { pedidos, cargando, error };
}

