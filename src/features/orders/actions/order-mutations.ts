'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { OrderStatus } from '@prisma/client';

// Tipos para las acciones
interface ItemCarrito {
  productoId: string;
  nombre: string;
  precio: number;
  cantidad: number;
}

/**
 * Crea un nuevo pedido desde la estación de mesero
 */
export async function crearPedido(mesa: number, items: ItemCarrito[]) {
  if (!mesa || mesa < 1) {
    return { success: false, error: 'Número de mesa inválido.' };
  }
  if (!items || items.length === 0) {
    return { success: false, error: 'El carrito está vacío.' };
  }

  try {
    const detalle = items
      .map((item) => `${item.cantidad}x ${item.nombre}`)
      .join(', ');
    const total = items.reduce((acc, item) => acc + item.precio * item.cantidad, 0);

    const pedido = await prisma.pedido.create({
      data: {
        mesa,
        detalle,
        total,
        estado: 'PENDIENTE',
      },
    });

    revalidatePath('/admin');
    return { success: true, pedido };
  } catch (error) {
    console.error('Error al crear pedido:', error);
    return { success: false, error: 'No se pudo crear el pedido.' };
  }
}

/**
 * Avanza el estado de un pedido al siguiente paso
 * PENDIENTE -> PREPARANDO -> HECHO -> ENTREGADO
 */
export async function avanzarEstadoPedido(pedidoId: string) {
  const flujo: Record<string, OrderStatus> = {
    PENDIENTE: 'PREPARANDO',
    PREPARANDO: 'HECHO',
    HECHO: 'ENTREGADO',
  };

  try {
    const pedido = await prisma.pedido.findUnique({ where: { id: pedidoId } });
    if (!pedido) return { success: false, error: 'Pedido no encontrado.' };

    const siguienteEstado = flujo[pedido.estado];
    if (!siguienteEstado) return { success: false, error: 'Este pedido ya fue entregado o cancelado.' };

    const actualizado = await prisma.pedido.update({
      where: { id: pedidoId },
      data: { estado: siguienteEstado },
    });

    revalidatePath('/cocina');
    revalidatePath('/admin');
    return { success: true, pedido: actualizado };
  } catch (error) {
    console.error('Error al avanzar estado:', error);
    return { success: false, error: 'No se pudo actualizar el pedido.' };
  }
}

/**
 * Cancela un pedido con un motivo (para auditoría contable)
 * Los pedidos NUNCA se eliminan, solo se marcan como CANCELADO
 */
export async function cancelarPedido(pedidoId: string, motivo: string) {
  if (!motivo || motivo.trim().length === 0) {
    return { success: false, error: 'Debes especificar un motivo de cancelación.' };
  }

  try {
    const original = await prisma.pedido.findUnique({
      where: { id: pedidoId },
      select: { detalle: true, estado: true },
    });

    if (!original) return { success: false, error: 'Pedido no encontrado.' };
    if (original.estado === 'CANCELADO') return { success: false, error: 'El pedido ya está cancelado.' };
    if (original.estado === 'ENTREGADO') return { success: false, error: 'No se puede cancelar un pedido ya entregado.' };

    const pedidoCancelado = await prisma.pedido.update({
      where: { id: pedidoId },
      data: {
        estado: 'CANCELADO',
        detalle: `[CANCELADO - Motivo: ${motivo.trim()}]\n${original.detalle}`,
      },
    });

    revalidatePath('/admin');
    return { success: true, pedido: pedidoCancelado };
  } catch (error) {
    console.error('Error al cancelar pedido:', error);
    return { success: false, error: 'No se pudo cancelar el pedido.' };
  }
}

