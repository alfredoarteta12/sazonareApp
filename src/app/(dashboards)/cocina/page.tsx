import { KitchenMonitor } from '@/features/orders/components/kitchen-monitor';
import { BotonInstalarPwa } from '@/components/boton-instalar-pwa';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { signOut } from '@/features/auth/actions/oauth';
import { DashboardHistoryLock } from '@/components/dashboard-history-lock';

export const dynamic = 'force-dynamic';

// Monitor de Cocina KDS - Acceso Protegido por autenticación (Rol COCINA o ADMIN)
export default async function CocinaPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?mensaje=sesion_requerida');
  }

  // Verificar perfil y permisos
  const perfil = await prisma.perfil.findUnique({
    where: { id: user.id },
  });

  if (perfil && perfil.role !== 'COCINA' && perfil.role !== 'ADMIN') {
    redirect('/mesero');
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <DashboardHistoryLock />
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-950 px-3.5 py-3 sm:px-6 sm:py-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <span className="text-xl sm:text-2xl shrink-0">👨‍🍳</span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-white truncate">Monitor de Cocina</h1>
                <span className="rounded bg-orange-950 border border-orange-800 px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-orange-400">
                  {perfil?.nombre || 'Cocina'}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-zinc-400 truncate">SazonareFood — Comandas en tiempo real</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <BotonInstalarPwa />
            <div className="hidden sm:flex items-center gap-1.5 sm:gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs sm:text-sm font-medium text-emerald-400">En vivo</span>
            </div>
            <form action={signOut}>
              <button
                type="submit"
                className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:border-red-900/50 hover:bg-red-950/20 hover:text-red-400 transition-colors"
              >
                Cerrar Sesión
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="p-3 sm:p-6 pb-12">
        <KitchenMonitor />
      </main>
    </div>
  );
}
