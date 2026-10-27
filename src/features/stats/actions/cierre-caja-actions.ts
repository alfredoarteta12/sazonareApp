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
    try {
      const supabase = await createSupabaseServerClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
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
      orderBy: { createdAt: 'desc' },
    });

    // Obtener pedidos del día
    const pedidos = await prisma.pedido.findMany({
      where: {
        createdAt: {
          gte: inicio,
          lte: fin,
        },
      },
      select: {
        id: true,
        total: true,
        metodoPago: true,
        pagoEfectivo: true,
        pagoTransferencia: true,
        estado: true,
        detalle: true,
      },
    });

    let ventasEfectivo = 0;
    let ventasTransf = 0;
    let totalVentas = 0;
    let totalPedidos = 0;
    let pedidosPendientes = 0;

    for (const p of pedidos) {
      if (p.estado === 'PAGADO') {
        totalVentas += p.total;
        totalPedidos++;

        if (p.metodoPago === 'DIVIDIDO') {
          ventasEfectivo += p.pagoEfectivo ?? 0;
          ventasTransf += p.pagoTransferencia ?? 0;
        } else if (p.metodoPago === 'TRANSFERENCIA' || p.detalle.includes('TRANSFERENCIA')) {
          ventasTransf += p.total;
        } else {
          ventasEfectivo += p.total;
        }
      } else if (p.estado !== 'CANCELADO') {
        // Pedidos activos (PENDIENTE, PREPARANDO, HECHO, ENTREGADO) no pagados
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
              ...cierreHoy,
              fecha: cierreHoy.fecha.toISOString(),
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
  responsable: string;
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

    // Recalcular métricas del día directamente en el servidor para máxima integridad
    const pedidos = await prisma.pedido.findMany({
      where: {
        createdAt: {
          gte: inicio,
          lte: fin,
        },
        estado: 'PAGADO',
      },
      select: {
        total: true,
        metodoPago: true,
        pagoEfectivo: true,
        pagoTransferencia: true,
        detalle: true,
      },
    });

    let ventasEfectivo = 0;
    let ventasTransf = 0;
    let totalVentas = 0;
    const totalPedidos = pedidos.length;

    for (const p of pedidos) {
      totalVentas += p.total;
      if (p.metodoPago === 'DIVIDIDO') {
        ventasEfectivo += p.pagoEfectivo ?? 0;
        ventasTransf += p.pagoTransferencia ?? 0;
      } else if (p.metodoPago === 'TRANSFERENCIA' || p.detalle.includes('TRANSFERENCIA')) {
        ventasTransf += p.total;
      } else {
        ventasEfectivo += p.total;
      }
    }

    const ticketPromedio = totalPedidos > 0 ? totalVentas / totalPedidos : 0;
    const baseInicial = Number(input.baseInicial) || 0;
    const retiros = Number(input.retiros) || 0;
    const efectivoReal = Number(input.efectivoReal) || 0;

    const efectivoEsperado = baseInicial + ventasEfectivo - retiros;
    const diferencia = efectivoReal - efectivoEsperado;

    const cierre = await prisma.cierreCaja.create({
      data: {
        responsable: input.responsable.trim() || 'Administrador',
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
    });

    revalidatePath('/admin');

    return {
      success: true,
      data: {
        ...cierre,
        fecha: cierre.fecha.toISOString(),
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
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data: cierres.map((c) => ({
        ...c,
        fecha: c.fecha.toISOString(),
        createdAt: c.createdAt.toISOString(),
      })),
    };
  } catch (error) {
    console.error('Error al obtener historial de cierres:', error);
    return { success: false, error: 'No se pudo obtener el historial de cierres.' };
  }
}
