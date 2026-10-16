import { Suspense } from 'react';
import { getPeriodFinancials } from '@/features/stats/actions/get-financial-reports';
import { VentasPeriodoPanel } from '@/features/stats/components/ventas-periodo-panel';
import { signOut } from '@/features/auth/actions/oauth';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { formatearFechaLargaColombia } from '@/lib/date-utils';
import { BotonInstalarPwa } from '@/components/boton-instalar-pwa';

export const dynamic = 'force-dynamic';

async function SeccionVentasPeriodo() {
  const result = await getPeriodFinancials('dia');

  if (!result.success || !result.data) {
    return (
      <div className="rounded-2xl border border-red-900/50 bg-red-950/20 p-6 text-center text-red-400">
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
    redirect('/login');
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
              <p className="text-xs text-zinc-400">SazonareFood — Cierre de caja y estadísticas</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Navegación interna del Administrador */}
            <nav className="flex items-center gap-1 rounded-xl bg-zinc-900 border border-zinc-800 p-1">
              <a
                href="/admin"
                className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-white shadow-sm"
              >
                📊 Caja y Reportes
              </a>
              <a
                href="/admin/menu"
                className="rounded-lg px-3 py-1.5 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
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

            <BotonInstalarPwa />

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
          <h2 className="text-2xl font-bold tracking-tight text-white capitalize">
            {formatearFechaLargaColombia()}
          </h2>
          <p className="text-sm text-zinc-400">Balance financiero y movimientos en tiempo real (Colombia - UTC-5)</p>
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
