import { Suspense } from 'react';
import { FinanceCards } from '@/features/stats/components/finance-cards';
import { getDailyOrders } from '@/features/stats/actions/get-financial-reports';
import { signOut } from '@/features/auth/actions/oauth';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { BotonRecibo } from '@/features/stats/components/boton-recibo';


export const dynamic = 'force-dynamic';

async function TablaOrdenesHoy() {
  const result = await getDailyOrders();

  if (!result.success || !result.data) {
    return <p className="text-red-400">Error al cargar pedidos del día.</p>;
  }

  const pedidos = result.data;

  const ESTADO_BADGE: Record<string, string> = {
    PENDIENTE: 'bg-amber-950 text-amber-300 border border-amber-800',
    PREPARANDO: 'bg-blue-950 text-blue-300 border border-blue-800',
    HECHO: 'bg-emerald-950 text-emerald-300 border border-emerald-800',
    ENTREGADO: 'bg-zinc-900 text-zinc-400 border border-zinc-800',
    PAGADO: 'bg-emerald-950 text-emerald-300 border border-emerald-600 font-bold',
    CANCELADO: 'bg-rose-950 text-rose-300 border border-rose-800',
  };


  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950">
      <div className="border-b border-zinc-800/80 px-6 py-4">
        <h2 className="font-semibold text-white">Registro del Día</h2>
        <p className="text-xs text-zinc-500">{pedidos.length} operaciones registradas</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-zinc-900 text-xs font-semibold uppercase tracking-wider text-zinc-400">
            <tr>
              <th className="px-6 py-3 text-left">Hora</th>
              <th className="px-6 py-3 text-left">Mesa</th>
              <th className="px-6 py-3 text-left">Detalle</th>
              <th className="px-6 py-3 text-right">Total</th>
              <th className="px-6 py-3 text-center">Estado</th>
              <th className="px-6 py-3 text-center">Ticket</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-900">
            {pedidos.map((pedido) => (
              <tr key={pedido.id} className="hover:bg-zinc-900/50 transition-colors">
                <td className="px-6 py-3 text-zinc-400">
                  {new Date(pedido.createdAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                </td>
                <td className="px-6 py-3 font-semibold text-white">Mesa {pedido.mesa}</td>
                <td className="max-w-xs px-6 py-3 text-zinc-300 truncate">{pedido.detalle}</td>
                <td className="px-6 py-3 text-right font-bold text-white">
                  ${pedido.total.toFixed(2)}
                </td>
                <td className="px-6 py-3 text-center">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${ESTADO_BADGE[pedido.estado]}`}>
                    {pedido.estado}
                  </span>
                </td>
                <td className="px-6 py-3 text-center">
                  <BotonRecibo
                    pedido={{
                      ...pedido,
                      createdAt: pedido.createdAt.toISOString(),
                      updatedAt: pedido.updatedAt.toISOString(),
                    }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>


        {pedidos.length === 0 && (
          <div className="py-12 text-center text-zinc-500">
            <p className="text-4xl mb-2">📋</p>
            <p>Sin operaciones registradas hoy</p>
          </div>
        )}
      </div>
    </div>
  );
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
            {new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </h2>
          <p className="text-sm text-zinc-400">Balance financiero y movimientos del día</p>
        </div>

        {/* KPIs financieros */}
        <Suspense fallback={
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl bg-zinc-900" />
            ))}
          </div>
        }>
          <FinanceCards />
        </Suspense>

        {/* Tabla de pedidos del día */}
        <Suspense fallback={
          <div className="h-64 animate-pulse rounded-2xl bg-zinc-900" />
        }>
          <TablaOrdenesHoy />
        </Suspense>
      </main>
    </div>
  );
}
