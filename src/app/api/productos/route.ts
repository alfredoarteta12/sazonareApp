import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET() {
  try {
    const productos = await prisma.producto.findMany({
      include: { categoria: true },
      orderBy: [{ categoria: { nombre: 'asc' } }, { nombre: 'asc' }],
    });
    return NextResponse.json(
      productos.map((p) => ({
        ...p,
        precio: Number(p.precio),
      })),
      {
        headers: {
          'Cache-Control': 'private, no-cache, no-store, max-age=0, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
          'Surrogate-Control': 'no-store',
          'CDN-Cache-Control': 'no-store',
        },
      }
    );
  } catch (error) {
    console.error('Error al obtener productos:', error);
    return NextResponse.json({ error: 'Error al cargar productos' }, { status: 500 });
  }
}
