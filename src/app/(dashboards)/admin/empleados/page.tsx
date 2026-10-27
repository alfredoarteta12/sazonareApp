import { getEmpleados } from '@/features/empleados/actions/empleados-actions';
import { EmpleadosManager } from '@/features/empleados/components/empleados-manager';
import { signOut } from '@/features/auth/actions/oauth';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { BotonInstalarPwa } from '@/components/boton-instalar-pwa';

export const dynamic = 'force-dynamic';

export default async function EmpleadosPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Protección estricta: Solo usuarios con rol ADMIN pueden gestionar personal
  const perfil = await prisma.perfil.findUnique({
    where: { id: user.id },
  });

  if (perfil && perfil.role !== 'ADMIN') {
    redirect('/mesero');
  }

  const res = await getEmpleados();
  const empleados = res.success && res.data ? res.data : [];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header exclusivo de Administrador */}
      <header className="border-b border-zinc-800 bg-zinc-950 px-3.5 py-3 sm:px-6 sm:py-4 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-orange-500/10 border border-orange-500/30 text-lg sm:text-xl">
                👑
              </div>
              <div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <h1 className="text-base sm:text-lg font-bold text-white">Administración General</h1>
                  <span className="rounded bg-orange-950 border border-orange-800 px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-orange-400">
                    Admin
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-zinc-400">SazonareFood — Control de Personal y Roles</p>
              </div>
            </div>

            <div className="flex items-center gap-2 md:hidden">
              <BotonInstalarPwa />
              <form action={signOut}>
                <button type="submit" className="text-[11px] text-zinc-500 hover:text-rose-400 transition-colors">
                  Salir
                </button>
              </form>
            </div>
          </div>

          <div className="flex items-center justify-between md:justify-end gap-3">
            {/* Navegación interna del Administrador */}
            <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar rounded-xl bg-zinc-900 border border-zinc-800 p-1 w-full sm:w-auto">
              <a
                href="/admin"
                className="rounded-lg px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-zinc-400 hover:text-white transition-colors whitespace-nowrap"
              >
                📊 Caja y Reportes
              </a>
              <a
                href="/admin/menu"
                className="rounded-lg px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-zinc-400 hover:text-white transition-colors whitespace-nowrap"
              >
                🍽️ Menú y Platos
              </a>
              <a
                href="/admin/empleados"
                className="rounded-lg bg-zinc-800 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-white shadow-sm whitespace-nowrap"
              >
                👥 Personal
              </a>
            </nav>

            <div className="hidden md:flex items-center gap-3">
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
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 sm:space-y-8 p-3 sm:p-6 pb-12">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Gestión de Empleados</h2>
          <p className="text-sm text-zinc-400">
            Registra a tus meseros y cocineros para que accedan al sistema con sus permisos respectivos.
          </p>
        </div>

        <EmpleadosManager empleadosIniciales={empleados} />
      </main>
    </div>
  );
}
