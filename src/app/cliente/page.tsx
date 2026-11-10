import { Metadata } from 'next';
import { getTodosLosProductos, getCategorias } from '@/features/menu/actions/menu-queries';
import { ClientePortal } from '@/features/cliente/components/cliente-portal';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Carta Digital & Pedidos en Mesa | SazonareFood',
  description: 'Explora nuestra carta, conoce las promociones del día y realiza tu pedido en mesa directamente al mesero.',
};

interface ClientePageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ClientePage({ searchParams }: ClientePageProps) {
  const params = await searchParams;
  const mesaParam = typeof params.mesa === 'string' ? parseInt(params.mesa, 10) : undefined;
  const mesaInicial = mesaParam && !isNaN(mesaParam) && mesaParam > 0 ? mesaParam : undefined;

  const [productosRes, categoriasRes] = await Promise.all([
    getTodosLosProductos(),
    getCategorias(),
  ]);

  const productos = productosRes.success && productosRes.data ? productosRes.data : [];
  const categorias = categoriasRes.success && categoriasRes.data ? categoriasRes.data : [];

  return (
    <main className="min-h-screen bg-black text-white">
      <ClientePortal
        productosIniciales={productos}
        categorias={categorias}
        mesaInicial={mesaInicial}
      />
    </main>
  );
}
