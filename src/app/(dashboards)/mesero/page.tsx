import { getTodosLosProductos } from '@/features/menu/actions/menu-queries';
import { MeseroGrid } from '@/features/menu/components/mesero-grid';
import { signOut } from '@/features/auth/actions/oauth';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { BotonInstalarPwa } from '@/components/boton-instalar-pwa';

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

  const { data: productos, error } = await getTodosLosProductos();

  if (error || !productos) {
    return (
      <div className="flex h-screen items-center justify-center bg-black text-rose-400">
        <p>Error al cargar el menú. Recarga la página.</p>
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] min-h-[100dvh] w-full max-w-full flex-col bg-black text-white overflow-hidden">
      {/* Header exclusivo de Estación de Mesero (POS táctil) */}
      <header className="border-b border-zinc-800 bg-zinc-950 px-3 py-2 sm:px-6 sm:py-3.5 shadow-sm shrink-0">
        <div className="flex items-center justify-between gap-1.5 sm:gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 border border-orange-500/30 text-base sm:text-xl">
              🍔
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h1 className="text-xs sm:text-base font-bold text-white truncate">POS Comandas</h1>
                <span className="rounded bg-blue-950 border border-blue-800 px-1 sm:px-2 py-0.5 text-[8px] sm:text-[10px] font-bold uppercase tracking-wider text-blue-400">
                  Mesero
                </span>
              </div>
              <p className="hidden md:block text-xs text-zinc-400">Toma y envío de pedidos a cocina</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <BotonInstalarPwa />

            {/* Si es Admin usando la vista de mesero, darle un botón para volver a su panel */}
            {perfil?.role === 'ADMIN' && (
              <a
                href="/admin"
                className="rounded-lg bg-zinc-900 border border-zinc-800 px-2 py-1 sm:px-3 sm:py-1.5 text-[11px] sm:text-xs font-semibold text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                ← Admin
              </a>
            )}

            <div className="text-right">
              <p className="text-[11px] sm:text-xs font-semibold text-zinc-200 truncate max-w-[90px] sm:max-w-[160px]">
                {perfil?.nombre || user.email?.split('@')[0]}
              </p>
              <form action={signOut}>
                <button type="submit" className="text-[10px] sm:text-[11px] text-zinc-500 hover:text-rose-400 transition-colors">
                  Salir
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      {/* Panel de comandas táctil */}
      <main className="flex-1 overflow-hidden p-2 sm:p-4 md:p-6 bg-black flex flex-col">
        <MeseroGrid productos={productos} nombreMesero={perfil?.nombre || user.email?.split('@')[0]} />
      </main>

    </div>
  );
}
