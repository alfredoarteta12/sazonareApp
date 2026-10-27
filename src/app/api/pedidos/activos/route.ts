import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { getRangoDiaColombia } from '@/lib/date-utils';

export const dynamic = 'force-dynamic';

// API Route para obtener pedidos activos (usado por cocina y mesero)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const todosHoy = searchParams.get('todosHoy') === 'true';

    let whereClause: Record<string, unknown> = {
      estado: {
        notIn: ['ENTREGADO', 'CANCELADO', 'PAGADO'],
      },
    };

    if (todosHoy) {
      const { inicio: inicioHoy, fin: finHoy } = getRangoDiaColombia();
      whereClause = {
        createdAt: { gte: inicioHoy, lte: finHoy },
        estado: { not: 'CANCELADO' },
      };
    }

    const pedidos = await prisma.pedido.findMany({
      where: whereClause,
      include: {
        pagos: true,
        creadoPor: {
          select: { nombre: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const serialized = pedidos.map((p) => {
      let efec = 0;
      let transf = 0;
      for (const pg of p.pagos) {
        const monto = Number(pg.monto);
        if (pg.metodoPago === 'TRANSFERENCIA') transf += monto;
        else efec += monto;
      }
      const metodoPago = efec > 0 && transf > 0 ? 'DIVIDIDO' : transf > 0 ? 'TRANSFERENCIA' : 'EFECTIVO';
      const nombreMesero = p.creadoPor?.nombre || p.creadoPor?.email?.split('@')[0] || null;

      return {
        ...p,
        total: Number(p.total),
        metodoPago,
        nombreMesero,
        pagoEfectivo: efec,
        pagoTransferencia: transf,
        pagos: p.pagos.map((pg) => ({
          ...pg,
          monto: Number(pg.monto),
          montoRecibido: pg.montoRecibido ? Number(pg.montoRecibido) : null,
          cambio: pg.cambio ? Number(pg.cambio) : null,
        })),
      };
    });

    return NextResponse.json(serialized);
  } catch (error) {
    console.error('Error al obtener pedidos activos:', error);
    return NextResponse.json(
      { error: 'No se pudieron obtener los pedidos' },
      { status: 500 }
    );
  }
}
