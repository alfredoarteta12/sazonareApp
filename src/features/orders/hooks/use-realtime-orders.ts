'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { OrderStatus } from '@prisma/client';

export interface Pedido {
  id: string;
  mesa: number;
  detalle: string;
  total: number;
  estado: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

export function useRealtimeOrders(onNuevoPedido?: (pedido: Pedido) => void) {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const onNuevoPedidoRef = useRef(onNuevoPedido);
  useEffect(() => {
    onNuevoPedidoRef.current = onNuevoPedido;
  }, [onNuevoPedido]);

  useEffect(() => {
    // Carga inicial de pedidos activos
    fetch('/api/pedidos/activos')
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
      .channel('cambios-comandas')
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
                .filter((p) => p.estado !== 'ENTREGADO' && p.estado !== 'CANCELADO')
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, []);

  return { pedidos, cargando, error };
}

