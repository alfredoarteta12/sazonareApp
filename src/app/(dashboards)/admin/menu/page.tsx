import { getCategorias, getTodosLosProductos } from '@/features/menu/actions/menu-queries';
import { MenuManager } from '@/features/menu/components/menu-manager';
import { signOut } from '@/features/auth/actions/oauth';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function AdminMenuPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Protección estricta: Solo usuarios con rol ADMIN pueden administrar el menú
  const perfil = await prisma.perfil.findUnique({
    where: { id: user.id },
  });

  if (perfil && perfil.role !== 'ADMIN') {
    redirect('/mesero');
  }

  const [categoriasRes, productosRes] = await Promise.all([
    getCategorias(),
    getTodosLosProductos(),
  ]);

  const categorias = categoriasRes.success && categoriasRes.data ? categoriasRes.data : [];
  const productos = productosRes.success && productosRes.data ? productosRes.data : [];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header exclusivo de Administrador */}
      <header className="border-b border-zinc-800 bg-zinc-950 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 border border-orange-500/30 text-xl">
              👑
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-white">Administración General</h1>
                <span className="rounded bg-orange-950 border border-orange-800 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-orange-400">
                  Admin
                </span>
              </div>
              <p className="text-xs text-zinc-400">SazonareFood — Catálogo de Menú y Precios</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Navegación interna del Administrador */}
            <nav className="flex items-center gap-1 rounded-xl bg-zinc-900 border border-zinc-800 p-1">
              <a
                href="/admin"
                className="rounded-lg px-3 py-1.5 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
              >
                📊 Caja y Reportes
              </a>
              <a
                href="/admin/menu"
                className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-white shadow-sm"
              >
                🍽️ Menú y Platos
              </a>
              <a
                href="/admin/empleados"
                className="rounded-lg px-3 py-1.5 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
              >
                👥 Personal
              </a>
            </nav>

            <div className="h-6 w-px bg-zinc-800" />

            <div className="text-right">
              <p className="text-xs font-semibold text-zinc-200">{perfil?.nombre || user.email}</p>
              <form action={signOut}>
                <button type="submit" className="text-[11px] text-zinc-500 hover:text-rose-400 transition-colors">
                  Cerrar sesión
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-8 p-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Administrador del Menú</h2>
          <p className="text-sm text-zinc-400">
            Crea categorías, platillos, edita precios o marca productos agotados en tiempo real.
          </p>
        </div>

        <MenuManager
          categoriasIniciales={categorias}
          productosIniciales={productos}
        />
      </main>
    </div>
  );
}

