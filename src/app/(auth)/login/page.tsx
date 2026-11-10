import { AuthForm } from '@/features/auth/components/auth-form';
import { BotonInstalarPwa } from '@/components/boton-instalar-pwa';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface LoginPageProps {
  searchParams: Promise<{
    mensaje?: string;
    error?: string;
  }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Si ya tiene sesión activa, redirigir automáticamente según su rol
  if (user) {
    const perfil = await prisma.perfil.findUnique({
      where: { id: user.id },
    });

    if (perfil?.role === 'ADMIN') {
      redirect('/admin');
    } else if (perfil?.role === 'COCINA') {
      redirect('/cocina');
    } else {
      redirect('/mesero');
    }
  }

  // Configuración de notificaciones visuales según el motivo de redirección
  let alerta: { icono: string; titulo: string; descripcion: string; clases: string } | null = null;

  if (params.mensaje === 'sesion_cerrada') {
    alerta = {
      icono: '👋',
      titulo: 'Sesión Finalizada',
      descripcion: 'Has cerrado sesión correctamente. Ingresa de nuevo cuando lo desees.',
      clases: 'border-emerald-500/40 bg-emerald-950/40 text-emerald-200',
    };
  } else if (params.mensaje === 'sesion_requerida') {
    alerta = {
      icono: '🔒',
      titulo: 'Acceso Protegido',
      descripcion: 'Debes iniciar sesión para acceder al panel del restaurante.',
      clases: 'border-amber-500/40 bg-amber-950/40 text-amber-200',
    };
  } else if (params.error === 'cuenta_desactivada') {
    alerta = {
      icono: '⛔',
      titulo: 'Cuenta Inactiva',
      descripcion: 'Tu cuenta de empleado ha sido desactivada. Comunícate con el administrador.',
      clases: 'border-rose-500/40 bg-rose-950/40 text-rose-200',
    };
  }

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-black px-3.5 py-6 sm:px-4 sm:py-8 text-white">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="mb-5 sm:mb-6 text-center">
          <div className="mb-2 sm:mb-3 inline-flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-3xl bg-orange-500 text-3xl sm:text-4xl shadow-lg shadow-orange-500/20">
            🍔
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">SazonareFood</h1>
          <p className="mt-1 text-xs sm:text-sm text-zinc-400">Sistema ERP & POS para Restaurante</p>
        </div>

        {/* Banner para instalar PWA */}
        <div className="mb-4">
          <BotonInstalarPwa variante="destacado" />
        </div>

        {/* Notificación de Estado / Cierre de Sesión / Acceso Protegido */}
        {alerta && (
          <div
            className={`mb-4 flex items-start gap-3 rounded-2xl border p-4 text-xs font-semibold shadow-lg animate-in fade-in slide-in-from-top-2 ${alerta.clases}`}
          >
            <span className="text-xl shrink-0">{alerta.icono}</span>
            <div className="min-w-0">
              <p className="font-bold text-sm">{alerta.titulo}</p>
              <p className="opacity-90 mt-0.5 leading-relaxed">{alerta.descripcion}</p>
            </div>
          </div>
        )}

        {/* Card de acceso y registro */}
        <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5 sm:p-8 shadow-2xl shadow-black">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-white">Acceso al Sistema</h2>
            <p className="text-xs text-zinc-400 mt-1">
              Ingresa con tus credenciales o regístrate para iniciar como Administrador.
            </p>
          </div>

          <AuthForm />

          <p className="mt-6 text-center text-xs text-zinc-500">
            👑 El primer usuario registrado recibe el rol de Administrador.
          </p>
        </div>

        {/* Monitor de cocina - Acceso sin login */}
        <div className="mt-6 text-center">
          <a
            href="/cocina"
            className="text-sm text-zinc-400 underline-offset-4 hover:text-orange-400 hover:underline transition-colors"
          >
            📺 Abrir monitor de preparación de cocina (acceso público)
          </a>
        </div>
      </div>
    </div>
  );
}
