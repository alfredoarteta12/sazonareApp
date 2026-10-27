'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { OrderStatus } from '@prisma/client';

// Tipos para las acciones
export interface ItemCarrito {
  id?: string;
  productoId: string;
  nombre: string;
  precio: number;
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

export interface DatosPagoDividido {
  efectivo: number;
  transferencia: number;
  efectivoRecibido?: number;
}

/**
 * Crea un nuevo pedido desde la estación de mesero (Mesa, Para Llevar o Domicilio)
 * Normalización 1FN: Inserta el pedido y además crea cada fila atómica en DetallePedido.
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
        const notaStr = item.notas && item.notas.trim() ? ` {Nota: ${item.notas.trim()}}` : '';
        return `${item.cantidad}x ${item.nombre} ($${item.precio.toFixed(2)})${notaStr}`;
      })
      .join(', ');

    const total = items.reduce((acc, item) => acc + item.precio * item.cantidad, 0);

    // Prefijo descriptivo en detalle para compatibilidad universal
    let prefijo = '';
    if (tipoPedido === 'LLEVAR') {
      prefijo = `[PARA LLEVAR${cliente ? ` - Cliente: ${cliente}` : ''}] `;
    } else if (tipoPedido === 'DOMICILIO') {
      prefijo = `[DOMICILIO - ${cliente ? `Cliente: ${cliente} | ` : ''}Dir: ${direccion}${telefono ? ` | Tel: ${telefono}` : ''}] `;
    }

    const detalle = `${prefijo}${detalleItems}${notas ? ` (Nota: ${notas})` : ''}`;

    // Creación atómica de Pedido y de cada fila normalizada en DetallePedido
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
        items: {
          create: items.map((item) => ({
            productoId: item.productoId && item.productoId.length > 5 ? item.productoId : null,
            nombre: item.nombre,
            precioUnitario: item.precio,
            cantidad: item.cantidad,
            subtotal: item.precio * item.cantidad,
            notas: item.notas || null,
          })),
        },
      },
      include: {
        items: true,
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
 * Cobra el pedido (Efectivo, Transferencia o Pago Dividido) y libera la mesa
 * Normalización 3FN: Registra la transacción en la tabla Pago y los montos divididos.
 */
export async function cobrarPedidoYLiberarMesa(
  pedidoId: string,
  metodoPago: 'EFECTIVO' | 'TRANSFERENCIA' | 'DIVIDIDO',
  montoRecibido?: number,
  datosDividido?: DatosPagoDividido
) {
  try {
    const pedido = await prisma.pedido.findUnique({ where: { id: pedidoId } });
    if (!pedido) return { success: false, error: 'Pedido no encontrado.' };

    let pagoEfectivo = 0;
    let pagoTransferencia = 0;
    let cambio = 0;
    let notaPago = '';
    const nuevosPagos: {
      metodoPago: string;
      monto: number;
      montoRecibido?: number | null;
      cambio?: number | null;
    }[] = [];

    if (metodoPago === 'EFECTIVO') {
      pagoEfectivo = pedido.total;
      pagoTransferencia = 0;
      cambio = montoRecibido && montoRecibido >= pedido.total ? montoRecibido - pedido.total : 0;
      notaPago = montoRecibido
        ? `[PAGADO: EFECTIVO | Pagó con: $${montoRecibido.toFixed(2)} | Cambio: $${cambio.toFixed(2)}]`
        : `[PAGADO: EFECTIVO]`;
      nuevosPagos.push({
        metodoPago: 'EFECTIVO',
        monto: pedido.total,
        montoRecibido: montoRecibido || pedido.total,
        cambio,
      });
    } else if (metodoPago === 'TRANSFERENCIA') {
      pagoEfectivo = 0;
      pagoTransferencia = pedido.total;
      cambio = 0;
      notaPago = `[PAGADO: TRANSFERENCIA]`;
      nuevosPagos.push({
        metodoPago: 'TRANSFERENCIA',
        monto: pedido.total,
      });
    } else if (metodoPago === 'DIVIDIDO') {
      if (!datosDividido) {
        return { success: false, error: 'Se requieren los montos para registrar el pago dividido.' };
      }
      pagoEfectivo = Number(datosDividido.efectivo) || 0;
      pagoTransferencia = Number(datosDividido.transferencia) || 0;

      const sumaDesglose = Math.round((pagoEfectivo + pagoTransferencia) * 100) / 100;
      const totalRedondeado = Math.round(pedido.total * 100) / 100;

      if (sumaDesglose !== totalRedondeado) {
        return {
          success: false,
          error: `La suma de Efectivo ($${pagoEfectivo.toFixed(2)}) y Transferencia ($${pagoTransferencia.toFixed(2)}) debe coincidir con el total ($${pedido.total.toFixed(2)}).`,
        };
      }

      const rec = Number(datosDividido.efectivoRecibido) || pagoEfectivo;
      cambio = rec >= pagoEfectivo ? rec - pagoEfectivo : 0;

      notaPago = `[PAGADO: DIVIDIDO | Efec: $${pagoEfectivo.toFixed(2)} (Recibió: $${rec.toFixed(2)}, Cambio: $${cambio.toFixed(2)}) + Transf: $${pagoTransferencia.toFixed(2)}]`;

      if (pagoEfectivo > 0) {
        nuevosPagos.push({
          metodoPago: 'EFECTIVO',
          monto: pagoEfectivo,
          montoRecibido: rec,
          cambio,
        });
      }
      if (pagoTransferencia > 0) {
        nuevosPagos.push({
          metodoPago: 'TRANSFERENCIA',
          monto: pagoTransferencia,
        });
      }
    }

    const actualizado = await prisma.pedido.update({
      where: { id: pedidoId },
      data: {
        estado: 'PAGADO',
        metodoPago,
        pagoEfectivo,
        pagoTransferencia,
        detalle: `${notaPago} ${pedido.detalle}`,
        pagos: {
          create: nuevosPagos,
        },
      },
      include: {
        pagos: true,
        items: true,
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

/**
 * Elimina permanentemente un pedido duplicado o erróneo de la base de datos (Exclusivo Administrador)
 */
export async function eliminarPedido(pedidoId: string) {
  try {
    const pedido = await prisma.pedido.findUnique({
      where: { id: pedidoId },
    });

    if (!pedido) {
      return { success: false, error: 'El pedido no existe o ya fue eliminado.' };
    }

    await prisma.pedido.delete({
      where: { id: pedidoId },
    });

    revalidatePath('/admin');
    revalidatePath('/cocina');
    revalidatePath('/mesero');

    return { success: true };
  } catch (error) {
    console.error('Error al eliminar pedido:', error);
    return { success: false, error: 'No se pudo eliminar el pedido de la base de datos.' };
  }
}
