import { AuthForm } from '@/features/auth/components/auth-form';
import { BotonInstalarPwa } from '@/components/boton-instalar-pwa';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  Flame,
  ArrowLeft,
  ShieldCheck,
  Lock,
  Sparkles,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react';

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
  let alerta: {
    icono: typeof CheckCircle2;
    titulo: string;
    descripcion: string;
    clases: string;
  } | null = null;

  if (params.mensaje === 'sesion_cerrada') {
    alerta = {
      icono: CheckCircle2,
      titulo: 'Sesión Finalizada',
      descripcion: 'Has cerrado sesión correctamente. Ingresa de nuevo cuando lo desees.',
      clases: 'border-2 border-emerald-500 bg-zinc-950 text-emerald-200 shadow-[4px_4px_0px_0px_#10b981]',
    };
  } else if (params.mensaje === 'sesion_requerida') {
    alerta = {
      icono: Lock,
      titulo: 'Acceso Protegido',
      descripcion: 'Debes iniciar sesión para acceder al panel del restaurante.',
      clases: 'border-2 border-amber-400 bg-zinc-950 text-amber-200 shadow-[4px_4px_0px_0px_#f59e0b]',
    };
  } else if (params.error === 'cuenta_desactivada') {
    alerta = {
      icono: ShieldAlert,
      titulo: 'Cuenta Inactiva',
      descripcion: 'Tu cuenta de empleado ha sido desactivada. Comunícate con el administrador.',
      clases: 'border-2 border-rose-500 bg-zinc-950 text-rose-200 shadow-[4px_4px_0px_0px_#f43f5e]',
    };
  }

  return (
    <div className="relative min-h-[100dvh] flex flex-col items-center justify-center bg-[#08080a] px-3.5 py-6 sm:px-4 sm:py-10 text-white overflow-hidden">
      {/* Fondo gráfico urbano con micro-grid y resplandor sutil */}
      <div className="absolute inset-0 bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none opacity-40" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] bg-orange-600/10 rounded-full blur-[130px] pointer-events-none" />

      {/* Insignias urbanas decorativas en esquinas superiores (pantallas medianas) */}
      <div className="hidden lg:flex fixed top-6 left-6 items-center gap-2">
        <span className="neo-sticker bg-zinc-900 text-zinc-400 border-2 border-zinc-800 text-[10px] font-black uppercase tracking-wider px-3 py-1 shadow-[2px_2px_0px_0px_#f97316]">
          SAZONARE // RESTAURANT OS
        </span>
      </div>
      <div className="hidden lg:flex fixed top-6 right-6 items-center gap-2">
        <span className="neo-sticker bg-zinc-900 text-orange-400 border-2 border-zinc-800 text-[10px] font-black uppercase tracking-wider px-3 py-1 shadow-[2px_2px_0px_0px_#fff]">
          TERMINAL POS // UTC-5
        </span>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Cabecera / Identidad de Marca Neo-Brutalist */}
        <div className="mb-5 sm:mb-6 text-center">
          <div className="mb-3 inline-flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-orange-500 text-black border-2 border-orange-400 shadow-[5px_5px_0px_0px_#fff] transition-transform hover:-rotate-3">
            <Flame className="h-9 w-9 sm:h-11 sm:w-11 stroke-[2.5]" />
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-black uppercase tracking-tight text-white">
            SazonareFood
          </h1>
          <div className="mt-1.5 flex items-center justify-center gap-2">
            <span className="neo-sticker bg-zinc-900 border-2 border-zinc-800 text-zinc-300 text-[10px] sm:text-xs font-black uppercase tracking-wider px-2.5 py-0.5 shadow-[2px_2px_0px_0px_#f97316]">
              STREET FOOD EDITION
            </span>
          </div>
        </div>

        {/* Banner para instalar PWA */}
        <div className="mb-4">
          <BotonInstalarPwa variante="destacado" />
        </div>

        {/* Notificación de Estado / Cierre de Sesión / Acceso Protegido */}
        {alerta && (
          <div
            className={`mb-4 flex items-start gap-3 rounded-2xl p-4 text-xs font-semibold animate-in fade-in slide-in-from-top-2 ${alerta.clases}`}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-black/40 border border-white/20">
              <alerta.icono className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="font-display font-black text-sm uppercase tracking-wider">{alerta.titulo}</p>
              <p className="opacity-90 mt-0.5 leading-relaxed font-medium">{alerta.descripcion}</p>
            </div>
          </div>
        )}

        {/* Tarjeta de Acceso Principal (Neo-Brutalist Card con sombra dura naranja) */}
        <div className="relative rounded-3xl border-2 border-zinc-700 bg-zinc-950 p-5 sm:p-8 shadow-[8px_8px_0px_0px_#f97316]">
          {/* Badge de esquina estilo sticker */}
          <div className="absolute -top-3.5 right-6">
            <span className="neo-sticker bg-yellow-400 text-black border-2 border-black text-[10px] font-black uppercase tracking-wider px-3 py-1 shadow-[2px_2px_0px_0px_#fff] flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 stroke-[3]" /> STAFF ACCESS ONLY
            </span>
          </div>

          <div className="mb-6">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500 text-black border border-orange-400">
                <Lock className="h-4 w-4 stroke-[2.5]" />
              </div>
              <div>
                <h2 className="font-display text-xl font-black uppercase tracking-tight text-white">
                  Acceso al Sistema
                </h2>
                <p className="text-xs text-zinc-400 font-medium">
                  Ingresa con tus credenciales de empleado o admin.
                </p>
              </div>
            </div>

            {/* Badges de Roles del Sistema */}
            <div className="mt-4 flex flex-wrap gap-1.5">
              <span className="neo-sticker bg-orange-500 text-black border-2 border-orange-400 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_#fff]">
                👑 Admin
              </span>
              <span className="neo-sticker bg-blue-500 text-white border-2 border-blue-400 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_#fff]">
                📱 Mesero
              </span>
              <span className="neo-sticker bg-emerald-500 text-black border-2 border-emerald-400 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_#fff]">
                👨‍🍳 Cocina
              </span>
              <span className="neo-sticker bg-zinc-900 border-2 border-zinc-700 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                🍽️ Clientes
              </span>
            </div>
          </div>

          <AuthForm />

          {/* Caja informativa de redirección */}
          <div className="mt-6 flex items-start gap-2.5 rounded-xl border-2 border-zinc-800 bg-zinc-900/60 p-3 shadow-[2px_2px_0px_0px_#18181b]">
            <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-zinc-400 font-medium leading-relaxed">
              El sistema detecta automáticamente tu rol asignado y te redirige a tu estación de trabajo (Admin, Mesero o Cocina).
            </p>
          </div>
        </div>

        {/* Retorno a la Página Principal */}
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="neo-btn inline-flex items-center gap-2 rounded-xl border-2 border-zinc-800 bg-zinc-950 px-4 py-2 text-xs font-display font-black uppercase tracking-wider text-zinc-300 hover:text-white hover:border-zinc-600 shadow-[3px_3px_0px_0px_#18181b] active:translate-x-[1px] active:translate-y-[1px] transition-all"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Volver a la página principal</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
