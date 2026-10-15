import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// API Route para obtener pedidos activos (usado por el hook useRealtimeOrders)
// Esta ruta no requiere autenticación para que el monitor de cocina pueda accederla
export async function GET() {
  try {
    const pedidos = await prisma.pedido.findMany({
      where: {
        estado: {
          notIn: ['ENTREGADO', 'CANCELADO'],
        },
      },
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

