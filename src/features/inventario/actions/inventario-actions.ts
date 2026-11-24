'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { TipoMovimientoInventario } from '@prisma/client';

export * from '../types/inventario';
import type {
  BebidaInventarioDTO,
  ResumenInventario,
} from '../types/inventario';

/**
 * Obtiene todas las bebidas con valoración en Pesos Colombianos (COP) y métricas globales
 */
export async function getInventarioBebidas(): Promise<{
  success: boolean;
  data?: ResumenInventario;
  error?: string;
}> {
  try {
    const bebidas = await prisma.inventarioBebida.findMany({
      include: {
        producto: {
          select: { id: true, nombre: true, disponible: true },
        },
      },
      orderBy: [{ stockActual: 'asc' }, { nombre: 'asc' }],
    });

    let totalUnidades = 0;
    let valorCostoTotal = 0;
    let valorVentaTotal = 0;
    let totalAgotadas = 0;
    let totalBajoStock = 0;

    const items: BebidaInventarioDTO[] = bebidas.map((b) => {
      const costo = Number(b.costoUnitario);
      const precio = Number(b.precioVenta);
      const stock = b.stockActual;
      const costoTotal = Number((stock * costo).toFixed(2));
      const ventaTotal = Number((stock * precio).toFixed(2));
      const margenUni = precio - costo;
      const margenTot = ventaTotal - costoTotal;

      totalUnidades += stock;
      valorCostoTotal += costoTotal;
      valorVentaTotal += ventaTotal;

      let estadoStock: 'OPTIMO' | 'BAJO' | 'AGOTADO' = 'OPTIMO';
      if (stock === 0) {
        estadoStock = 'AGOTADO';
        totalAgotadas++;
      } else if (stock <= b.stockMinimo) {
        estadoStock = 'BAJO';
        totalBajoStock++;
      }

      return {
        id: b.id,
        nombre: b.nombre,
        stockActual: stock,
        stockMinimo: b.stockMinimo,
        costoUnitario: costo,
        precioVenta: precio,
        valorCostoTotal: costoTotal,
        valorVentaTotal: ventaTotal,
        margenUnitario: margenUni,
        margenTotal: margenTot,
        estadoStock,
        productoId: b.productoId,
        productoNombre: b.producto?.nombre || null,
        createdAt: b.createdAt.toISOString(),
        updatedAt: b.updatedAt.toISOString(),
      };
    });

    const gananciaProyectada = Number((valorVentaTotal - valorCostoTotal).toFixed(2));
    const margenPorcentual =
      valorCostoTotal > 0
        ? Number(((gananciaProyectada / valorCostoTotal) * 100).toFixed(1))
        : 0;

    return {
      success: true,
      data: {
        totalItems: items.length,
        totalUnidades,
        valorCostoTotal: Number(valorCostoTotal.toFixed(2)),
        valorVentaTotal: Number(valorVentaTotal.toFixed(2)),
        gananciaProyectada,
        margenPorcentual,
        totalAgotadas,
        totalBajoStock,
        bebidas: items,
      },
    };
  } catch (error: any) {
    console.error('Error al obtener inventario de bebidas:', error);
    return { success: false, error: 'No se pudo cargar el inventario.' };
  }
}

/**
 * Registra una nueva bebida en el inventario
 */
export async function crearBebidaInventario(data: {
  nombre: string;
  stockActual: number;
  stockMinimo?: number;
  costoUnitario: number;
  precioVenta: number;
  productoId?: string | null;
}) {
  const nombreLimpio = data.nombre.trim();
  if (!nombreLimpio) {
    return { success: false, error: 'El nombre de la bebida es obligatorio.' };
  }
  if (data.stockActual < 0) {
    return { success: false, error: 'El stock inicial no puede ser negativo.' };
  }
  if (data.costoUnitario < 0 || data.precioVenta < 0) {
    return { success: false, error: 'Los precios no pueden ser negativos.' };
  }

  try {
    const existente = await prisma.inventarioBebida.findFirst({
      where: { nombre: { equals: nombreLimpio, mode: 'insensitive' } },
    });

    if (existente) {
      return { success: false, error: 'Ya existe una bebida con este nombre en el inventario.' };
    }

    const bebida = await prisma.inventarioBebida.create({
      data: {
        nombre: nombreLimpio,
        stockActual: data.stockActual,
        stockMinimo: data.stockMinimo && data.stockMinimo > 0 ? data.stockMinimo : 5,
        costoUnitario: data.costoUnitario,
        precioVenta: data.precioVenta,
        productoId: data.productoId || null,
        movimientos: {
          create: {
            tipo: TipoMovimientoInventario.ENTRADA,
            cantidad: data.stockActual,
            stockAnterior: 0,
            stockNuevo: data.stockActual,
            costoUnitarioMomento: data.costoUnitario,
            motivo: 'Inventario inicial',
          },
        },
      },
    });

    // Si está vinculada a un producto del menú y el stock inicial es > 0, asegurar que esté disponible
    if (data.productoId && data.stockActual > 0) {
      await prisma.producto.update({
        where: { id: data.productoId },
        data: { disponible: true },
      }).catch(() => {});
    }

    revalidatePath('/admin');
    revalidatePath('/admin/inventario');
    revalidatePath('/admin/menu');
    revalidatePath('/mesero');
    return { success: true, data: bebida };
  } catch (error: any) {
    console.error('Error al crear bebida en inventario:', error);
    return { success: false, error: error.message || 'No se pudo crear la bebida.' };
  }
}

/**
 * Abastece / compra nuevas unidades de una bebida (+ unidades)
 */
export async function abastecerBebidaInventario(data: {
  id: string;
  cantidad: number;
  nuevoCostoUnitario?: number;
  motivo?: string;
}) {
  const { id, cantidad, nuevoCostoUnitario, motivo } = data;
  if (!id) return { success: false, error: 'ID de bebida inválido.' };
  if (!cantidad || cantidad <= 0) {
    return { success: false, error: 'La cantidad a ingresar debe ser mayor a 0.' };
  }

  try {
    const bebida = await prisma.inventarioBebida.findUnique({ where: { id } });
    if (!bebida) return { success: false, error: 'Bebida no encontrada.' };

    const stockAnterior = bebida.stockActual;
    const stockNuevo = stockAnterior + cantidad;
    const costoFinal = nuevoCostoUnitario && nuevoCostoUnitario > 0 ? nuevoCostoUnitario : Number(bebida.costoUnitario);

    const actualizada = await prisma.inventarioBebida.update({
      where: { id },
      data: {
        stockActual: stockNuevo,
        costoUnitario: costoFinal,
        movimientos: {
          create: {
            tipo: TipoMovimientoInventario.ENTRADA,
            cantidad,
            stockAnterior,
            stockNuevo,
            costoUnitarioMomento: costoFinal,
            motivo: motivo?.trim() || 'Abastecimiento de stock',
          },
        },
      },
    });

    // Si estaba agotada y ahora tiene stock, reactivar en el menú automáticamente
    if (bebida.productoId && stockAnterior === 0 && stockNuevo > 0) {
      await prisma.producto.update({
        where: { id: bebida.productoId },
        data: { disponible: true },
      }).catch(() => {});
    }

    revalidatePath('/admin');
    revalidatePath('/admin/inventario');
    revalidatePath('/mesero');
    revalidatePath('/cocina');
    return { success: true, data: actualizada };
  } catch (error: any) {
    console.error('Error al abastecer bebida:', error);
    return { success: false, error: error.message || 'Error al actualizar el stock.' };
  }
}

/**
 * Ajusta manualmente el stock por conteo físico o corrección de descuadre
 */
export async function ajustarStockManual(data: {
  id: string;
  nuevoStock: number;
  motivo: string;
}) {
  const { id, nuevoStock, motivo } = data;
  if (!id) return { success: false, error: 'ID de bebida inválido.' };
  if (nuevoStock < 0) return { success: false, error: 'El stock no puede ser negativo.' };
  if (!motivo || !motivo.trim()) {
    return { success: false, error: 'Debes indicar el motivo del ajuste (ej: Conteo físico, Merma, etc).' };
  }

  try {
    const bebida = await prisma.inventarioBebida.findUnique({ where: { id } });
    if (!bebida) return { success: false, error: 'Bebida no encontrada.' };

    const stockAnterior = bebida.stockActual;
    const diferencia = nuevoStock - stockAnterior;
    if (diferencia === 0) {
      return { success: true, message: 'El stock no requería cambios.' };
    }

    const tipo = diferencia > 0 ? TipoMovimientoInventario.ENTRADA : TipoMovimientoInventario.AJUSTE;

    const actualizada = await prisma.inventarioBebida.update({
      where: { id },
      data: {
        stockActual: nuevoStock,
        movimientos: {
          create: {
            tipo,
            cantidad: diferencia,
            stockAnterior,
            stockNuevo: nuevoStock,
            costoUnitarioMomento: bebida.costoUnitario,
            motivo: motivo.trim(),
          },
        },
      },
    });

    // Si el nuevo stock es 0, marcar agotado en el menú
    if (bebida.productoId) {
      await prisma.producto.update({
        where: { id: bebida.productoId },
        data: { disponible: nuevoStock > 0 },
      }).catch(() => {});
    }

    revalidatePath('/admin');
    revalidatePath('/admin/inventario');
    revalidatePath('/mesero');
    revalidatePath('/cocina');
    return { success: true, data: actualizada };
  } catch (error: any) {
    console.error('Error al ajustar stock:', error);
    return { success: false, error: error.message || 'Error al ajustar el stock.' };
  }
}

/**
 * Actualiza los precios, stock mínimo o enlace de producto de una bebida
 */
export async function actualizarBebidaInventario(data: {
  id: string;
  nombre: string;
  stockMinimo: number;
  costoUnitario: number;
  precioVenta: number;
  productoId?: string | null;
}) {
  const { id, nombre, stockMinimo, costoUnitario, precioVenta, productoId } = data;
  if (!id || !nombre?.trim()) {
    return { success: false, error: 'Datos incompletos.' };
  }

  try {
    const actualizada = await prisma.inventarioBebida.update({
      where: { id },
      data: {
        nombre: nombre.trim(),
        stockMinimo: Math.max(1, stockMinimo),
        costoUnitario,
        precioVenta,
        productoId: productoId || null,
      },
    });

    revalidatePath('/admin');
    revalidatePath('/admin/inventario');
    return { success: true, data: actualizada };
  } catch (error: any) {
    console.error('Error al actualizar bebida:', error);
    return { success: false, error: 'Error al actualizar bebida.' };
  }
}

/**
 * Elimina una bebida del inventario
 */
export async function eliminarBebidaInventario(id: string) {
  try {
    await prisma.inventarioBebida.delete({ where: { id } });
    revalidatePath('/admin');
    revalidatePath('/admin/inventario');
    return { success: true };
  } catch (error) {
    console.error('Error al eliminar bebida:', error);
    return { success: false, error: 'No se pudo eliminar la bebida.' };
  }
}

/**
 * Obtiene el historial de movimientos (Kardex) para auditoría
 */
export async function getMovimientosInventario(bebidaId?: string) {
  try {
    const where = bebidaId ? { bebidaId } : {};
    const movimientos = await prisma.movimientoInventario.findMany({
      where,
      include: {
        bebida: {
          select: { id: true, nombre: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return {
      success: true,
      data: movimientos.map((m) => ({
        id: m.id,
        bebidaId: m.bebidaId,
        bebidaNombre: m.bebida.nombre,
        tipo: m.tipo,
        cantidad: m.cantidad,
        stockAnterior: m.stockAnterior,
        stockNuevo: m.stockNuevo,
        costoUnitarioMomento: Number(m.costoUnitarioMomento),
        motivo: m.motivo,
        pedidoId: m.pedidoId,
        responsable: m.responsable,
        createdAt: m.createdAt.toISOString(),
      })),
    };
  } catch (error: any) {
    console.error('Error al obtener movimientos de inventario:', error);
    return { success: false, error: 'No se pudo obtener el historial de movimientos.' };
  }
}

/**
 * MOTOR DE DESCUENTO AUTOMÁTICO DE BEBIDAS:
 * Se invoca cada vez que se crea o confirma una comanda.
 * Para cada ítem solicitado, si corresponde a una bebida en el inventario,
 * descuenta las unidades y registra la venta con auditoría.
 */
export async function descontarBebidasDeComanda(
  items: { productoId?: string | null; nombre: string; cantidad: number }[],
  pedidoId: string,
  motivo?: string
) {
  if (!items || items.length === 0) return;

  try {
    // 1. Obtener todas las bebidas registradas en inventario
    const todasBebidas = await prisma.inventarioBebida.findMany();
    if (todasBebidas.length === 0) return;

    for (const item of items) {
      if (!item.cantidad || item.cantidad <= 0) continue;

      // Buscar coincidencia por productoId directo o por nombre (sin importar mayúsculas)
      const bebida = todasBebidas.find((b) => {
        if (item.productoId && b.productoId === item.productoId) return true;
        const nombreBebida = b.nombre.trim().toLowerCase();
        const nombreItem = item.nombre.trim().toLowerCase();
        return nombreBebida === nombreItem || nombreItem.includes(nombreBebida);
      });

      if (bebida) {
        const stockAnterior = bebida.stockActual;
        const stockNuevo = Math.max(0, stockAnterior - item.cantidad);
        const cantidadDescontada = stockAnterior - stockNuevo;

        await prisma.inventarioBebida.update({
          where: { id: bebida.id },
          data: {
            stockActual: stockNuevo,
            movimientos: {
              create: {
                tipo: TipoMovimientoInventario.VENTA,
                cantidad: -cantidadDescontada,
                stockAnterior,
                stockNuevo,
                costoUnitarioMomento: bebida.costoUnitario,
                motivo: motivo || 'Venta por comanda',
                pedidoId,
              },
            },
          },
        });

        // Si el stock llegó a cero, marcar automáticamente el producto como NO disponible en cocina y POS
        if (stockNuevo === 0 && bebida.productoId) {
          await prisma.producto.update({
            where: { id: bebida.productoId },
            data: { disponible: false },
          }).catch(() => {});
        }
      }
    }
  } catch (error) {
    console.error('Error al descontar bebidas de inventario:', error);
  }
}

/**
 * MOTOR DE RESTAURACIÓN DE BEBIDAS:
 * Se invoca cuando una comanda es cancelada.
 * Devuelve al inventario las bebidas que habían sido descontadas.
 */
export async function restaurarBebidasDeComanda(pedidoId: string, motivoCancelacion?: string) {
  if (!pedidoId) return;

  try {
    const movimientosVenta = await prisma.movimientoInventario.findMany({
      where: {
        pedidoId,
        tipo: TipoMovimientoInventario.VENTA,
      },
      include: { bebida: true },
    });

    for (const mov of movimientosVenta) {
      const unidadesADevolver = Math.abs(mov.cantidad);
      if (unidadesADevolver <= 0) continue;

      const stockAnterior = mov.bebida.stockActual;
      const stockNuevo = stockAnterior + unidadesADevolver;

      await prisma.inventarioBebida.update({
        where: { id: mov.bebidaId },
        data: {
          stockActual: stockNuevo,
          movimientos: {
            create: {
              tipo: TipoMovimientoInventario.DEVOLUCION,
              cantidad: unidadesADevolver,
              stockAnterior,
              stockNuevo,
              costoUnitarioMomento: mov.bebida.costoUnitario,
              motivo: `Devolución por cancelación: ${motivoCancelacion || 'Pedido anulado'}`,
              pedidoId,
            },
          },
        },
      });

      // Si estaba en 0 y se recuperó stock, reactivar producto en el menú
      if (mov.bebida.productoId && stockAnterior === 0 && stockNuevo > 0) {
        await prisma.producto.update({
          where: { id: mov.bebida.productoId },
          data: { disponible: true },
        }).catch(() => {});
      }
    }
  } catch (error) {
    console.error('Error al restaurar bebidas de comanda cancelada:', error);
  }
}
