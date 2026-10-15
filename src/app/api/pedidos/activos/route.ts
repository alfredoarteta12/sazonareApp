import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

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
      const inicioHoy = new Date();
      inicioHoy.setHours(0, 0, 0, 0);
      whereClause = {
        createdAt: { gte: inicioHoy },
        estado: { not: 'CANCELADO' },
      };
    }

    const pedidos = await prisma.pedido.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(pedidos);
  } catch (error) {
    console.error('Error al obtener pedidos activos:', error);
    return NextResponse.json(
      { error: 'No se pudieron obtener los pedidos' },
      { status: 500 }
    );
  }
}


