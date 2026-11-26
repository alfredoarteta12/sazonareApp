import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getProductoPorId, getTodosLosProductos } from '@/features/menu/actions/menu-queries';
import { obtenerDetalleGastronomico } from '@/features/cliente/utils/gastronomia-data';
import { ProductoDetalleView } from '@/features/cliente/components/producto-detalle-view';
import { formatearCOP } from '@/lib/currency';

interface MenuIdPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: MenuIdPageProps): Promise<Metadata> {
  const { id } = await params;
  const res = await getProductoPorId(id);

  if (!res.success || !res.data) {
    return {
      title: 'Platillo en 3D & Realidad Aumentada | SazonareFood',
      description: 'Descubre nuestra carta interactiva en 360° y Realidad Aumentada.',
    };
  }

  const prod = res.data;
  return {
    title: `${prod.nombre} (${formatearCOP(prod.precio)}) en 3D & AR | SazonareFood`,
    description: `Explora el modelo 3D en 360° de ${prod.nombre} y proyéctalo sobre tu mesa con Realidad Aumentada antes de pedir.`,
    openGraph: {
      title: `${prod.nombre} • SazonareFood`,
      description: `Gira en 360° y proyéctalo en Realidad Aumentada sobre tu mesa. Precio: ${formatearCOP(prod.precio)}.`,
      images: prod.imagen ? [{ url: prod.imagen }] : undefined,
    },
  };
}

export default async function MenuIdPage({ params, searchParams }: MenuIdPageProps) {
  const { id } = await params;
  const sParams = await searchParams;
  const mesaParam = typeof sParams.mesa === 'string' ? parseInt(sParams.mesa, 10) : undefined;
  const mesaInicial = mesaParam && !isNaN(mesaParam) && mesaParam > 0 ? mesaParam : 1;

  // 1. Intentar cargar producto por ID
  let res = await getProductoPorId(id);
  let producto = res.success && res.data ? res.data : null;

  // 2. Si no coincide por ID directo (ej: si se pasó un slug o demo id), buscar en catálogo general
  if (!producto) {
    const todosRes = await getTodosLosProductos();
    if (todosRes.success && todosRes.data) {
      const normalizado = id.toLowerCase().replace(/-/g, ' ');
      producto = todosRes.data.find(
        (p) =>
          p.id === id ||
          p.nombre.toLowerCase().includes(normalizado) ||
          normalizado.includes(p.nombre.toLowerCase())
      ) || null;
    }
  }

  // 3. Si aún no existe, notFound
  if (!producto) {
    notFound();
  }

  // 4. Detalle gastronómico enriquecido con 3D/AR
  const detalle = obtenerDetalleGastronomico(producto);

  return (
    <main className="min-h-screen bg-[#08080a]">
      <ProductoDetalleView
        producto={producto}
        detalle={detalle}
        mesaInicial={mesaInicial}
      />
    </main>
  );
}
