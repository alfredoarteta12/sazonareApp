'use client';

import { useState, useTransition, useEffect } from 'react';
import { signInWithEmail, signUpWithEmail } from '../actions/oauth';
import { supabase } from '@/lib/supabase';
import { Mail, Lock, User, LogIn, UserPlus, ArrowRight } from 'lucide-react';

export function AuthForm() {
  const [modo, setModo] = useState<'login' | 'registro'>('login');
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Si el navegador ya tiene sesión activa en Supabase, no permitir ver el login
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        window.location.replace('/mesero');
      }
    });
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    startTransition(async () => {
      if (modo === 'registro') {
        const res = await signUpWithEmail({ nombre, email, password });
        if (res && !res.success) {
          setErrorMsg(res.error || 'Error al registrar.');
        } else if (res?.success && res.redirectTo) {
          // Reemplazar la entrada en el historial para que 'Atrás' no regrese al login
          window.location.replace(res.redirectTo);
        }
      } else {
        const res = await signInWithEmail({ email, password });
        if (res && !res.success) {
          setErrorMsg(res.error || 'Error al iniciar sesión.');
        } else if (res?.success && res.redirectTo) {
          // Reemplazar la entrada en el historial para que 'Atrás' no regrese al login
          window.location.replace(res.redirectTo);
        }
      }
    });
  };

  const handleGoogleLogin = async () => {
    setErrorMsg(null);
    try {
      const redirectOrigin =
        typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${redirectOrigin}/auth/callback`,
        },
      });

      if (error) {
        if (error.message.includes('not enabled') || error.message.includes('Unsupported provider')) {
          setErrorMsg('⚠️ Google OAuth aún no está activado en Supabase. Debes habilitar el proveedor Google en Authentication > Providers con tu Client ID y Secret.');
        } else {
          setErrorMsg(`Error de Google: ${error.message}`);
        }
      } else if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error al conectar con Google.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Pestañas Iniciar Sesión / Registrarse */}
      <div className="grid grid-cols-2 rounded-xl bg-zinc-900 border-2 border-zinc-800 p-1.5 shadow-[3px_3px_0px_0px_#18181b]">
        <button
          type="button"
          onClick={() => {
            setModo('login');
            setErrorMsg(null);
          }}
          className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-display font-black uppercase tracking-wider transition-all ${
            modo === 'login'
              ? 'bg-orange-500 text-black border-2 border-orange-400 shadow-[2px_2px_0px_0px_#fff] active:translate-x-[1px] active:translate-y-[1px]'
              : 'text-zinc-400 hover:text-white border-2 border-transparent'
          }`}
        >
          <LogIn className="h-3.5 w-3.5 stroke-[2.5]" />
          <span>Iniciar Sesión</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setModo('registro');
            setErrorMsg(null);
          }}
          className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-display font-black uppercase tracking-wider transition-all ${
            modo === 'registro'
              ? 'bg-orange-500 text-black border-2 border-orange-400 shadow-[2px_2px_0px_0px_#fff] active:translate-x-[1px] active:translate-y-[1px]'
              : 'text-zinc-400 hover:text-white border-2 border-transparent'
          }`}
        >
          <UserPlus className="h-3.5 w-3.5 stroke-[2.5]" />
          <span>Crear Cuenta</span>
        </button>
      </div>

      {errorMsg && (
        <div className="rounded-xl border-2 border-rose-500 bg-rose-950/80 p-3.5 text-xs font-bold text-rose-200 leading-relaxed shadow-[3px_3px_0px_0px_#f43f5e]">
          {errorMsg}
        </div>
      )}

      {/* Formulario de Email */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {modo === 'registro' && (
          <div>
            <label className="mb-1.5 block font-display text-[11px] font-black uppercase tracking-wider text-zinc-300">
              Nombre Completo
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-500">
                <User className="h-4 w-4" />
              </div>
              <input
                type="text"
                required
                placeholder="Ej: Administrador General"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full rounded-xl border-2 border-zinc-700 bg-zinc-900/90 pl-10 pr-3.5 py-2.5 text-sm font-medium text-white placeholder-zinc-500 focus:border-orange-500 focus:shadow-[3px_3px_0px_0px_#f97316] outline-none transition-all"
              />
            </div>
          </div>
        )}

        <div>
          <label className="mb-1.5 block font-display text-[11px] font-black uppercase tracking-wider text-zinc-300">
            Correo Electrónico
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-500">
              <Mail className="h-4 w-4" />
            </div>
            <input
              type="email"
              required
              placeholder="admin@sazonare.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border-2 border-zinc-700 bg-zinc-900/90 pl-10 pr-3.5 py-2.5 text-sm font-medium text-white placeholder-zinc-500 focus:border-orange-500 focus:shadow-[3px_3px_0px_0px_#f97316] outline-none transition-all"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block font-display text-[11px] font-black uppercase tracking-wider text-zinc-300">
            Contraseña
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-500">
              <Lock className="h-4 w-4" />
            </div>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border-2 border-zinc-700 bg-zinc-900/90 pl-10 pr-3.5 py-2.5 text-sm font-medium text-white placeholder-zinc-500 focus:border-orange-500 focus:shadow-[3px_3px_0px_0px_#f97316] outline-none transition-all"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="neo-btn w-full rounded-xl bg-orange-500 text-black border-2 border-orange-400 py-3.5 text-xs font-display font-black uppercase tracking-wider shadow-[4px_4px_0px_0px_#fff] hover:bg-orange-400 active:translate-x-[2px] active:translate-y-[2px] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
        >
          {isPending ? (
            'Procesando...'
          ) : modo === 'registro' ? (
            <>
              <span>Registrarme como Administrador</span>
              <ArrowRight className="h-4 w-4 stroke-[3]" />
            </>
          ) : (
            <>
              <span>Entrar al Sistema</span>
              <ArrowRight className="h-4 w-4 stroke-[3]" />
            </>
          )}
        </button>
      </form>

      {/* Separador */}
      <div className="relative my-4 flex items-center justify-center">
        <div className="w-full border-t-2 border-zinc-800" />
        <span className="neo-sticker absolute bg-zinc-950 px-3 py-0.5 text-[10px] font-black uppercase text-zinc-400 border-2 border-zinc-800">
          o
        </span>
      </div>

      {/* Botón de Google OAuth */}
      <button
        type="button"
        onClick={handleGoogleLogin}
        className="neo-btn flex w-full items-center justify-center gap-2.5 rounded-xl border-2 border-zinc-700 bg-zinc-900 px-6 py-3 text-xs font-display font-black uppercase tracking-wider text-zinc-200 shadow-[3px_3px_0px_0px_#52525b] hover:bg-zinc-800 hover:border-zinc-500 active:translate-x-[2px] active:translate-y-[2px] transition-all"
      >
        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        <span>Continuar con Google</span>
      </button>
    </div>
  );
}
