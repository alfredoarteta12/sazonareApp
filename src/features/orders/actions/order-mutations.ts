'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { OrderStatus } from '@prisma/client';

// Tipos para las acciones
export interface AdicionItem {
  id?: string;
  nombre: string;
  precio: number;
}

export interface ItemCarrito {
  id?: string;
  productoId: string;
  nombre: string;
  precio: number;
  precioUnitario?: number;
  adiciones?: AdicionItem[];
  notas?: string;
  cantidad: number;
}

export interface ParametrosCrearPedido {
  tipoPedido?: 'MESA' | 'LLEVAR' | 'DOMICILIO';
  mesa?: number;
  cliente?: string;
  telefono?: string;
  direccion?: string;
  notas?: string;
  items: ItemCarrito[];
}

/**
 * Crea un nuevo pedido desde la estación de mesero (Mesa, Para Llevar o Domicilio)
 */
export async function crearPedido(
  paramsOmesa: number | ParametrosCrearPedido,
  itemsLegacy?: ItemCarrito[]
) {
  let tipoPedido: 'MESA' | 'LLEVAR' | 'DOMICILIO' = 'MESA';
  let mesa = 1;
  let cliente: string | undefined;
  let telefono: string | undefined;
  let direccion: string | undefined;
  let notas: string | undefined;
  let items: ItemCarrito[] = [];

  if (typeof paramsOmesa === 'number') {
    mesa = paramsOmesa;
    items = itemsLegacy || [];
    tipoPedido = 'MESA';
  } else {
    tipoPedido = paramsOmesa.tipoPedido || 'MESA';
    mesa = paramsOmesa.mesa || 0;
    cliente = paramsOmesa.cliente?.trim();
    telefono = paramsOmesa.telefono?.trim();
    direccion = paramsOmesa.direccion?.trim();
    notas = paramsOmesa.notas?.trim();
    items = paramsOmesa.items || [];
  }

  if (tipoPedido === 'MESA' && (!mesa || mesa < 1)) {
    return { success: false, error: 'Número de mesa inválido.' };
  }
  if (tipoPedido === 'DOMICILIO' && (!direccion || direccion.length < 3)) {
    return { success: false, error: 'Debes indicar una dirección válida para el domicilio.' };
  }
  if (!items || items.length === 0) {
    return { success: false, error: 'El carrito está vacío.' };
  }

  try {
    const detalleItems = items
      .map((item) => {
        const pUnitario = item.precioUnitario ?? item.precio;
        const adicStr =
          item.adiciones && item.adiciones.length > 0
            ? ` [+ ${item.adiciones.map((a) => `${a.nombre} (+$${a.precio.toFixed(2)})`).join(' + ')}]`
            : '';
        const notaStr = item.notas && item.notas.trim() ? ` {Nota: ${item.notas.trim()}}` : '';
        return `${item.cantidad}x ${item.nombre} ($${pUnitario.toFixed(2)})${adicStr}${notaStr}`;
      })
      .join(', ');

    const total = items.reduce((acc, item) => {
      const pUnitario = item.precioUnitario ?? item.precio;
      return acc + pUnitario * item.cantidad;
    }, 0);

    // Prefijo descriptivo en detalle para compatibilidad universal
    let prefijo = '';
    if (tipoPedido === 'LLEVAR') {
      prefijo = `[PARA LLEVAR${cliente ? ` - Cliente: ${cliente}` : ''}] `;
    } else if (tipoPedido === 'DOMICILIO') {
      prefijo = `[DOMICILIO - ${cliente ? `Cliente: ${cliente} | ` : ''}Dir: ${direccion}${telefono ? ` | Tel: ${telefono}` : ''}] `;
    }

    const detalle = `${prefijo}${detalleItems}${notas ? ` (Nota: ${notas})` : ''}`;

    const pedido = await prisma.pedido.create({
      data: {
        mesa: tipoPedido === 'MESA' ? mesa : 0,
        tipoPedido,
        cliente: cliente || null,
        telefono: telefono || null,
        direccion: direccion || null,
        notas: notas || null,
        detalle,
        total,
        estado: 'PENDIENTE',
      },
    });

    revalidatePath('/admin');
    revalidatePath('/cocina');
    revalidatePath('/mesero');
    return { success: true, pedido };
  } catch (error) {
    console.error('Error al crear pedido:', error);
    return { success: false, error: 'No se pudo crear el pedido.' };
  }
}


/**
 * Marca directamente un pedido como ENTREGADO
 */
export async function marcarComoEntregado(pedidoId: string) {
  try {
    const pedido = await prisma.pedido.update({
      where: { id: pedidoId },
      data: { estado: 'ENTREGADO' },
    });
    revalidatePath('/cocina');
    revalidatePath('/admin');
    revalidatePath('/mesero');
    return { success: true, pedido };
  } catch (error) {
    console.error('Error al marcar pedido como entregado:', error);
    return { success: false, error: 'No se pudo actualizar el pedido.' };
  }
}

/**
 * Cobra el pedido (Efectivo o Transferencia) y libera la mesa dejándola disponible nuevamente
 */
export async function cobrarPedidoYLiberarMesa(
  pedidoId: string,
  metodoPago: 'EFECTIVO' | 'TRANSFERENCIA',
  montoRecibido?: number
) {
  try {
    const pedido = await prisma.pedido.findUnique({ where: { id: pedidoId } });
    if (!pedido) return { success: false, error: 'Pedido no encontrado.' };

    const cambio =
      metodoPago === 'EFECTIVO' && montoRecibido && montoRecibido >= pedido.total
        ? montoRecibido - pedido.total
        : 0;

    const notaPago =
      metodoPago === 'EFECTIVO' && montoRecibido
        ? `[PAGADO: EFECTIVO | Pagó con: $${montoRecibido.toFixed(2)} | Cambio: $${cambio.toFixed(2)}]`
        : `[PAGADO: TRANSFERENCIA]`;

    const actualizado = await prisma.pedido.update({
      where: { id: pedidoId },
      data: {
        estado: 'PAGADO',
        metodoPago,
        detalle: `${notaPago} ${pedido.detalle}`,
      },
    });

    revalidatePath('/mesero');
    revalidatePath('/cocina');
    revalidatePath('/admin');
    return { success: true, pedido: actualizado, cambio };
  } catch (error) {
    console.error('Error al cobrar y liberar mesa:', error);
    return { success: false, error: 'No se pudo registrar el cobro.' };
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

