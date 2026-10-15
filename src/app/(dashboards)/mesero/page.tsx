import { getProductos } from '@/features/menu/actions/menu-queries';
import { MeseroGrid } from '@/features/menu/components/mesero-grid';
import { signOut } from '@/features/auth/actions/oauth';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function MeseroPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Verificar que el empleado esté activo
  const perfil = await prisma.perfil.findUnique({
    where: { id: user.id },
  });

  if (perfil && !perfil.activo) {
    await supabase.auth.signOut();
    redirect('/login?error=cuenta_desactivada');
  }

  const { data: productos, error } = await getProductos();

  if (error || !productos) {
    return (
      <div className="flex h-screen items-center justify-center bg-black text-rose-400">
        <p>Error al cargar el menú. Recarga la página.</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-black text-white">
      {/* Header exclusivo de Estación de Mesero (POS táctil) */}
      <header className="border-b border-zinc-800 bg-zinc-950 px-4 py-2.5 sm:px-6 sm:py-3.5 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 border border-orange-500/30 text-lg sm:text-xl">
              🍔
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-bold text-white truncate">POS Comandas</h1>
                <span className="rounded bg-blue-950 border border-blue-800 px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-blue-400">
                  Mesero
                </span>
              </div>
              <p className="hidden sm:block text-xs text-zinc-400">Toma y envío de pedidos a cocina</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            {/* Si es Admin usando la vista de mesero, darle un botón para volver a su panel */}
            {perfil?.role === 'ADMIN' && (
              <a
                href="/admin"
                className="rounded-lg bg-zinc-900 border border-zinc-800 px-2.5 py-1 sm:px-3 sm:py-1.5 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                ← Admin
              </a>
            )}

            <div className="text-right">
              <p className="text-xs font-semibold text-zinc-200 truncate max-w-[110px] sm:max-w-[200px]">
                {perfil?.nombre || user.email?.split('@')[0]}
              </p>
              <form action={signOut}>
                <button type="submit" className="text-[11px] text-zinc-500 hover:text-rose-400 transition-colors">
                  Salir
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      {/* Panel de comandas táctil */}
      <main className="flex-1 overflow-hidden p-3 sm:p-6 bg-black">
        <MeseroGrid productos={productos} nombreMesero={perfil?.nombre || user.email?.split('@')[0]} />
      </main>

    </div>
  );
}
