'use server';

import { prisma } from '@/lib/prisma';
import { getRangoDiaColombia } from '@/lib/date-utils';

export async function getDailyFinancials() {
  try {
    const { inicio: inicioHoy, fin: finHoy } = getRangoDiaColombia();

    const [ventasNetas, perdidas, pedidosPorEstado] = await Promise.all([
      prisma.pedido.aggregate({
        _sum: { total: true },
        _count: { id: true },
        where: {
          createdAt: { gte: inicioHoy, lte: finHoy },
          estado: { not: 'CANCELADO' },
        },
      }),
      prisma.pedido.aggregate({
        _sum: { total: true },
        _count: { id: true },
        where: {
          createdAt: { gte: inicioHoy, lte: finHoy },
          estado: 'CANCELADO',
        },
      }),
      prisma.pedido.groupBy({
        by: ['estado'],
        _count: { id: true },
        where: { createdAt: { gte: inicioHoy, lte: finHoy } },
      }),
    ]);

    return {
      success: true,
      data: {
        ingresoNeto: ventasNetas._sum.total || 0,
        pedidosExitosos: ventasNetas._count.id,
        dineroCancelado: perdidas._sum.total || 0,
        pedidosCancelados: perdidas._count.id,
        distribucion: pedidosPorEstado,
      },
    };
  } catch (error) {
    console.error('Error al obtener financieros:', error);
    return { success: false, error: 'No se pudieron obtener los datos financieros.' };
  }
}

/**
 * Obtiene todos los pedidos del día con detalle completo para el cierre de caja
 */
export async function getDailyOrders() {
  try {
    const { inicio: inicioHoy, fin: finHoy } = getRangoDiaColombia();

    const pedidos = await prisma.pedido.findMany({
      where: {
        createdAt: { gte: inicioHoy, lte: finHoy },
      },
      orderBy: { createdAt: 'desc' },
    });

    return { success: true, data: pedidos };

  } catch (error) {
    console.error('Error al obtener pedidos del día:', error);
    return { success: false, error: 'No se pudieron obtener los pedidos.' };
  }
}

