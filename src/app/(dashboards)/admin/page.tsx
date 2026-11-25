import { Suspense } from 'react';
import Link from 'next/link';
import { getPeriodFinancials } from '@/features/stats/actions/get-financial-reports';
import { VentasPeriodoPanel } from '@/features/stats/components/ventas-periodo-panel';
import { signOut } from '@/features/auth/actions/oauth';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { formatearFechaLargaColombia } from '@/lib/date-utils';
import { BotonInstalarPwa } from '@/components/boton-instalar-pwa';
import { DashboardHistoryLock } from '@/components/dashboard-history-lock';
import { Crown, BarChart3, UtensilsCrossed, Wine, Users, LogOut } from 'lucide-react';

export const dynamic = 'force-dynamic';

async function SeccionVentasPeriodo() {
  const result = await getPeriodFinancials('dia');

  if (!result.success || !result.data) {
    return (
      <div className="rounded-2xl border-2 border-red-800 bg-red-950/40 p-6 text-center text-red-300 font-bold shadow-[4px_4px_0px_0px_#991b1b]">
        Error al cargar las métricas de ventas. Intenta recargar la página.
      </div>
    );
  }

  return <VentasPeriodoPanel reporteInicial={result.data} />;
}

export default async function AdminPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?mensaje=sesion_requerida');
  }

  // Protección estricta: Solo usuarios con rol ADMIN pueden ver este dashboard
  const perfil = await prisma.perfil.findUnique({
    where: { id: user.id },
  });

  if (perfil && perfil.role !== 'ADMIN') {
    redirect('/mesero');
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <DashboardHistoryLock />
      {/* Header exclusivo de Administrador */}
      <header className="border-b-2 border-zinc-800 bg-zinc-950 px-3.5 py-3 sm:px-6 sm:py-4 shadow-[0_4px_0_0_#18181b]">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-orange-500 text-black border-2 border-orange-400 shadow-[3px_3px_0px_0px_#fff]">
                <Crown className="h-5 w-5 stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-display text-base sm:text-lg font-black uppercase tracking-tight text-white">
                    Administración General
                  </h1>
                  <span className="neo-sticker bg-orange-500 text-black border-2 border-orange-400 text-[10px] font-black uppercase tracking-wider px-2 py-0.5">
                    Admin
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-zinc-400 font-medium">SazonareFood — Cierre de caja y estadísticas</p>
              </div>
            </div>

            <div className="flex items-center gap-2 md:hidden">
              <BotonInstalarPwa />
              <form action={signOut}>
                <button type="submit" className="flex items-center gap-1 text-[11px] font-bold text-zinc-400 hover:text-rose-400 transition-colors">
                  <LogOut className="h-3.5 w-3.5" />
                  Salir
                </button>
              </form>
            </div>
          </div>

          <div className="flex items-center justify-between md:justify-end gap-3">
            {/* Navegación interna del Administrador */}
            <nav className="flex items-center gap-1.5 overflow-x-auto no-scrollbar rounded-xl bg-zinc-900/90 border-2 border-zinc-800 p-1.5 w-full sm:w-auto shadow-[3px_3px_0px_0px_#18181b]">
              <Link
                href="/admin"
                className="inline-flex items-center gap-1.5 rounded-lg bg-orange-500 text-black border-2 border-orange-400 px-3 py-1.5 text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_#fff] whitespace-nowrap active:translate-x-[1px] active:translate-y-[1px]"
              >
                <BarChart3 className="h-3.5 w-3.5 stroke-[2.5]" />
                Caja y Reportes
              </Link>
              <Link
                href="/admin/menu"
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors whitespace-nowrap"
              >
                <UtensilsCrossed className="h-3.5 w-3.5" />
                Menú y Platos
              </Link>
              <Link
                href="/admin/inventario"
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors whitespace-nowrap"
              >
                <Wine className="h-3.5 w-3.5" />
                Inventario Bebidas
              </Link>
              <Link
                href="/admin/empleados"
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors whitespace-nowrap"
              >
                <Users className="h-3.5 w-3.5" />
                Personal
              </Link>
            </nav>

            <div className="hidden md:flex items-center gap-3">
              <BotonInstalarPwa />

              <div className="h-6 w-px bg-zinc-800" />

              <div className="text-right">
                <p className="text-xs font-bold text-zinc-200">{perfil?.nombre || user.email}</p>
                <form action={signOut}>
                  <button type="submit" className="inline-flex items-center gap-1 text-[11px] font-bold text-zinc-500 hover:text-rose-400 transition-colors">
                    <LogOut className="h-3 w-3" />
                    Cerrar sesión
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 sm:space-y-8 p-3 sm:p-6 pb-12">
        <div className="border-l-4 border-orange-500 pl-4 py-1">
          <h2 className="font-display text-2xl sm:text-3xl font-black uppercase tracking-tight text-white">
            {formatearFechaLargaColombia()}
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 font-medium">Balance financiero y movimientos en tiempo real (Colombia - UTC-5)</p>
        </div>

        {/* Panel unificado de Ventas por Período (Día / Semana / Mes) */}
        <Suspense fallback={
          <div className="space-y-6">
            <div className="h-20 animate-pulse rounded-3xl bg-zinc-900" />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-28 animate-pulse rounded-2xl bg-zinc-900" />
              ))}
            </div>
            <div className="h-64 animate-pulse rounded-3xl bg-zinc-900" />
            <div className="h-96 animate-pulse rounded-3xl bg-zinc-900" />
          </div>
        }>
          <SeccionVentasPeriodo />
        </Suspense>
      </main>
    </div>
  );
}
