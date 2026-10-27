'use server';

import { prisma } from '@/lib/prisma';
import { getRangoDiaColombia, getRangoSemanaColombia, getRangoMesColombia } from '@/lib/date-utils';

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
        ingresoNeto: Number(ventasNetas._sum.total || 0),
        pedidosExitosos: ventasNetas._count.id,
        dineroCancelado: Number(perdidas._sum.total || 0),
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
      include: {
        pagos: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data: pedidos.map((p) => ({
        ...p,
        total: Number(p.total),
        detalle: p.detalle || '',
        pagos: p.pagos.map((pg) => ({
          ...pg,
          monto: Number(pg.monto),
          montoRecibido: pg.montoRecibido ? Number(pg.montoRecibido) : null,
          cambio: pg.cambio ? Number(pg.cambio) : null,
        })),
      })),
    };
  } catch (error) {
    console.error('Error al obtener pedidos del día:', error);
    return { success: false, error: 'No se pudieron obtener los pedidos.' };
  }
}

export type PeriodoReporte = 'dia' | 'semana' | 'mes';

export interface ReportePeriodoData {
  periodo: PeriodoReporte;
  rangoTexto: string;
  ingresoNeto: number;
  pedidosExitosos: number;
  ticketPromedio: number;
  totalEfectivo: number;
  totalTransferencia: number;
  dineroCancelado: number;
  pedidosCancelados: number;
  desglose: {
    etiqueta: string;
    total: number;
    cantidad: number;
  }[];
  pedidos: {
    id: string;
    mesa: number;
    tipoPedido?: string | null;
    cliente?: string | null;
    telefono?: string | null;
    direccion?: string | null;
    notas?: string | null;
    detalle: string;
    total: number;
    metodoPago: string | null;
    pagoEfectivo: number;
    pagoTransferencia: number;
    estado: string;
    createdAt: string;
  }[];
}

/**
 * Obtiene el reporte financiero consolidado por Día, Semana o Mes en horario de Colombia
 */
export async function getPeriodFinancials(periodo: PeriodoReporte = 'dia'): Promise<{
  success: boolean;
  data?: ReportePeriodoData;
  error?: string;
}> {
  try {
    let rango: { inicio: Date; fin: Date };
    let rangoTexto = '';

    if (periodo === 'semana') {
      rango = getRangoSemanaColombia();
      rangoTexto = 'Esta Semana (Lunes a Domingo)';
    } else if (periodo === 'mes') {
      rango = getRangoMesColombia();
      rangoTexto = 'Este Mes (Completo)';
    } else {
      rango = getRangoDiaColombia();
      rangoTexto = 'Hoy';
    }

    // Consulta indexada a Supabase con pagos normalizados
    const pedidos = await prisma.pedido.findMany({
      where: {
        createdAt: {
          gte: rango.inicio,
          lte: rango.fin,
        },
      },
      include: {
        pagos: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    let ingresoNeto = 0;
    let pedidosExitosos = 0;
    let totalEfectivo = 0;
    let totalTransferencia = 0;
    let dineroCancelado = 0;
    let pedidosCancelados = 0;

    // Desglose agrupado por fecha
    const mapaDesglose: Record<string, { total: number; cantidad: number }> = {};

    for (const p of pedidos) {
      const totalNum = Number(p.total);

      if (p.estado === 'CANCELADO') {
        dineroCancelado += totalNum;
        pedidosCancelados++;
      } else {
        ingresoNeto += totalNum;
        pedidosExitosos++;

        // Desglose exacto mediante la entidad normalizada Pago
        let efec = 0;
        let transf = 0;
        if (p.pagos && p.pagos.length > 0) {
          for (const pg of p.pagos) {
            const montoPg = Number(pg.monto);
            if (pg.metodoPago === 'TRANSFERENCIA') {
              transf += montoPg;
            } else {
              efec += montoPg;
            }
          }
        } else if (p.detalle?.includes('TRANSFERENCIA')) {
          transf += totalNum;
        } else {
          efec += totalNum;
        }

        totalEfectivo += efec;
        totalTransferencia += transf;

        // Agrupación para gráfica
        const fechaEtiqueta = new Intl.DateTimeFormat('es-CO', {
          timeZone: 'America/Bogota',
          weekday: periodo === 'semana' ? 'short' : undefined,
          day: 'numeric',
          month: periodo === 'mes' ? 'short' : undefined,
        }).format(p.createdAt);

        if (!mapaDesglose[fechaEtiqueta]) {
          mapaDesglose[fechaEtiqueta] = { total: 0, cantidad: 0 };
        }
        mapaDesglose[fechaEtiqueta].total += totalNum;
        mapaDesglose[fechaEtiqueta].cantidad++;
      }
    }

    const ticketPromedio = pedidosExitosos > 0 ? ingresoNeto / pedidosExitosos : 0;

    const desglose = Object.entries(mapaDesglose).map(([etiqueta, val]) => ({
      etiqueta,
      total: val.total,
      cantidad: val.cantidad,
    }));

    return {
      success: true,
      data: {
        periodo,
        rangoTexto,
        ingresoNeto,
        pedidosExitosos,
        ticketPromedio,
        totalEfectivo,
        totalTransferencia,
        dineroCancelado,
        pedidosCancelados,
        desglose,
        pedidos: pedidos.map((p) => {
          let efec = 0;
          let transf = 0;
          if (p.pagos && p.pagos.length > 0) {
            for (const pg of p.pagos) {
              const montoPg = Number(pg.monto);
              if (pg.metodoPago === 'TRANSFERENCIA') transf += montoPg;
              else efec += montoPg;
            }
          } else if (p.detalle?.includes('TRANSFERENCIA')) {
            transf = Number(p.total);
          } else {
            efec = Number(p.total);
          }

          let metodoPagoLabel: 'DIVIDIDO' | 'TRANSFERENCIA' | 'EFECTIVO' = 'EFECTIVO';
          if (efec > 0 && transf > 0) {
            metodoPagoLabel = 'DIVIDIDO';
          } else if (transf > 0) {
            metodoPagoLabel = 'TRANSFERENCIA';
          }

          return {
            id: p.id,
            mesa: p.mesa,
            tipoPedido: p.tipoPedido,
            cliente: p.cliente,
            telefono: p.telefono,
            direccion: p.direccion,
            notas: p.notas,
            detalle: p.detalle || '',
            total: Number(p.total),
            metodoPago: metodoPagoLabel,
            pagoEfectivo: efec,
            pagoTransferencia: transf,
            estado: p.estado,
            createdAt: p.createdAt.toISOString(),
          };
        }),
      },
    };
  } catch (error) {
    console.error('Error al obtener reporte por período:', error);
    return { success: false, error: 'No se pudieron calcular las ventas del período.' };
  }
}
