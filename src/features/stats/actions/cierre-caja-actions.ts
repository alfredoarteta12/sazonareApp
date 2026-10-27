'use server';

import { prisma } from '@/lib/prisma';
import { getRangoDiaColombia } from '@/lib/date-utils';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';

export interface DatosCierreHoy {
  yaCerrado: boolean;
  cierreExistente?: {
    id: string;
    fecha: string;
    responsable: string;
    responsableId?: string | null;
    baseInicial: number;
    ventasEfectivo: number;
    ventasTransf: number;
    totalVentas: number;
    retiros: number;
    efectivoEsperado: number;
    efectivoReal: number;
    diferencia: number;
    totalPedidos: number;
    ticketPromedio: number;
    observaciones: string | null;
    createdAt: string;
  };
  ventasEfectivo: number;
  ventasTransf: number;
  totalVentas: number;
  totalPedidos: number;
  ticketPromedio: number;
  pedidosPendientes: number;
  responsableSugerido: string;
}

/**
 * Obtiene el balance del día actual para preparar el Arqueo y Cierre de Caja
 */
export async function getDatosCierreHoy(): Promise<{
  success: boolean;
  data?: DatosCierreHoy;
  error?: string;
}> {
  try {
    const { inicio, fin } = getRangoDiaColombia();

    // Obtener usuario autenticado para sugerir responsable
    let responsableSugerido = 'Administrador';
    let responsableUserId: string | null = null;
    try {
      const supabase = await createSupabaseServerClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        responsableUserId = user.id;
        const perfil = await prisma.perfil.findUnique({ where: { id: user.id } });
        if (perfil?.nombre) {
          responsableSugerido = perfil.nombre;
        } else if (user.email) {
          responsableSugerido = user.email.split('@')[0];
        }
      }
    } catch (e) {
      // Si falla auth, mantiene el default
    }

    // Verificar si ya se registró un cierre hoy
    const cierreHoy = await prisma.cierreCaja.findFirst({
      where: {
        createdAt: {
          gte: inicio,
          lte: fin,
        },
      },
      include: {
        responsable: {
          select: { nombre: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Obtener pedidos del día con pagos normalizados
    const pedidos = await prisma.pedido.findMany({
      where: {
        createdAt: {
          gte: inicio,
          lte: fin,
        },
      },
      include: {
        pagos: true,
      },
    });

    let ventasEfectivo = 0;
    let ventasTransf = 0;
    let totalVentas = 0;
    let totalPedidos = 0;
    let pedidosPendientes = 0;

    for (const p of pedidos) {
      const totalNum = Number(p.total);

      if (p.estado === 'PAGADO') {
        totalVentas += totalNum;
        totalPedidos++;

        let efec = 0;
        let transf = 0;
        if (p.pagos && p.pagos.length > 0) {
          for (const pg of p.pagos) {
            const m = Number(pg.monto);
            if (pg.metodoPago === 'TRANSFERENCIA') transf += m;
            else efec += m;
          }
        } else if (p.detalle?.includes('TRANSFERENCIA')) {
          transf = totalNum;
        } else {
          efec = totalNum;
        }

        ventasEfectivo += efec;
        ventasTransf += transf;
      } else if (p.estado !== 'CANCELADO') {
        pedidosPendientes++;
      }
    }

    const ticketPromedio = totalPedidos > 0 ? totalVentas / totalPedidos : 0;

    return {
      success: true,
      data: {
        yaCerrado: !!cierreHoy,
        cierreExistente: cierreHoy
          ? {
              id: cierreHoy.id,
              fecha: cierreHoy.fecha.toISOString(),
              responsable: cierreHoy.responsable?.nombre || 'Administrador',
              responsableId: cierreHoy.responsableId,
              baseInicial: Number(cierreHoy.baseInicial),
              ventasEfectivo: Number(cierreHoy.ventasEfectivo),
              ventasTransf: Number(cierreHoy.ventasTransf),
              totalVentas: Number(cierreHoy.totalVentas),
              retiros: Number(cierreHoy.retiros),
              efectivoEsperado: Number(cierreHoy.efectivoEsperado),
              efectivoReal: Number(cierreHoy.efectivoReal),
              diferencia: Number(cierreHoy.diferencia),
              totalPedidos: cierreHoy.totalPedidos,
              ticketPromedio: Number(cierreHoy.ticketPromedio),
              observaciones: cierreHoy.observaciones,
              createdAt: cierreHoy.createdAt.toISOString(),
            }
          : undefined,
        ventasEfectivo,
        ventasTransf,
        totalVentas,
        totalPedidos,
        ticketPromedio,
        pedidosPendientes,
        responsableSugerido,
      },
    };
  } catch (error) {
    console.error('Error al obtener datos de cierre:', error);
    return { success: false, error: 'No se pudieron calcular los datos de cierre.' };
  }
}

export interface RegistrarCierreInput {
  responsable?: string;
  responsableId?: string;
  baseInicial: number;
  retiros: number;
  efectivoReal: number;
  observaciones?: string;
}

/**
 * Registra formalmente el Cierre de Caja (Reporte Z) en la base de datos
 */
export async function registrarCierreCaja(input: RegistrarCierreInput) {
  try {
    const { inicio, fin } = getRangoDiaColombia();

    // Obtener ID del empleado autenticado
    let responsableId = input.responsableId || null;
    let responsableNombre = input.responsable || 'Administrador';

    if (!responsableId) {
      try {
        const supabase = await createSupabaseServerClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          responsableId = user.id;
          const perfil = await prisma.perfil.findUnique({ where: { id: user.id } });
          if (perfil?.nombre) responsableNombre = perfil.nombre;
        }
      } catch (e) {
        // Auth opcional
      }
    }

    // Recalcular métricas del día directamente en el servidor para máxima integridad
    const pedidos = await prisma.pedido.findMany({
      where: {
        createdAt: {
          gte: inicio,
          lte: fin,
        },
        estado: 'PAGADO',
      },
      include: {
        pagos: true,
      },
    });

    let ventasEfectivo = 0;
    let ventasTransf = 0;
    let totalVentas = 0;
    const totalPedidos = pedidos.length;

    for (const p of pedidos) {
      const totalNum = Number(p.total);
      totalVentas += totalNum;

      let efec = 0;
      let transf = 0;
      if (p.pagos && p.pagos.length > 0) {
        for (const pg of p.pagos) {
          const m = Number(pg.monto);
          if (pg.metodoPago === 'TRANSFERENCIA') transf += m;
          else efec += m;
        }
      } else if (p.detalle?.includes('TRANSFERENCIA')) {
        transf = totalNum;
      } else {
        efec = totalNum;
      }

      ventasEfectivo += efec;
      ventasTransf += transf;
    }

    const ticketPromedio = totalPedidos > 0 ? totalVentas / totalPedidos : 0;
    const baseInicial = Number(input.baseInicial) || 0;
    const retiros = Number(input.retiros) || 0;
    const efectivoReal = Number(input.efectivoReal) || 0;

    const efectivoEsperado = baseInicial + ventasEfectivo - retiros;
    const diferencia = efectivoReal - efectivoEsperado;

    const cierre = await prisma.cierreCaja.create({
      data: {
        responsableId,
        baseInicial,
        ventasEfectivo,
        ventasTransf,
        totalVentas,
        retiros,
        efectivoEsperado,
        efectivoReal,
        diferencia,
        totalPedidos,
        ticketPromedio,
        observaciones: input.observaciones?.trim() || null,
      },
      include: {
        responsable: {
          select: { nombre: true },
        },
      },
    });

    revalidatePath('/admin');

    return {
      success: true,
      data: {
        id: cierre.id,
        fecha: cierre.fecha.toISOString(),
        responsable: cierre.responsable?.nombre || responsableNombre,
        responsableId: cierre.responsableId,
        baseInicial: Number(cierre.baseInicial),
        ventasEfectivo: Number(cierre.ventasEfectivo),
        ventasTransf: Number(cierre.ventasTransf),
        totalVentas: Number(cierre.totalVentas),
        retiros: Number(cierre.retiros),
        efectivoEsperado: Number(cierre.efectivoEsperado),
        efectivoReal: Number(cierre.efectivoReal),
        diferencia: Number(cierre.diferencia),
        totalPedidos: cierre.totalPedidos,
        ticketPromedio: Number(cierre.ticketPromedio),
        observaciones: cierre.observaciones,
        createdAt: cierre.createdAt.toISOString(),
      },
    };
  } catch (error) {
    console.error('Error al registrar cierre de caja:', error);
    return { success: false, error: 'No se pudo guardar el cierre de caja.' };
  }
}

/**
 * Obtiene el historial de todos los Cierres de Caja para auditoría
 */
export async function getHistorialCierres(limit = 30) {
  try {
    const cierres = await prisma.cierreCaja.findMany({
      take: limit,
      include: {
        responsable: {
          select: { nombre: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data: cierres.map((c) => ({
        id: c.id,
        fecha: c.fecha.toISOString(),
        responsable: c.responsable?.nombre || 'Administrador',
        responsableId: c.responsableId,
        baseInicial: Number(c.baseInicial),
        ventasEfectivo: Number(c.ventasEfectivo),
        ventasTransf: Number(c.ventasTransf),
        totalVentas: Number(c.totalVentas),
        retiros: Number(c.retiros),
        efectivoEsperado: Number(c.efectivoEsperado),
        efectivoReal: Number(c.efectivoReal),
        diferencia: Number(c.diferencia),
        totalPedidos: c.totalPedidos,
        ticketPromedio: Number(c.ticketPromedio),
        observaciones: c.observaciones,
        createdAt: c.createdAt.toISOString(),
      })),
    };
  } catch (error) {
    console.error('Error al obtener historial de cierres:', error);
    return { success: false, error: 'No se pudo obtener el historial de cierres.' };
  }
}
