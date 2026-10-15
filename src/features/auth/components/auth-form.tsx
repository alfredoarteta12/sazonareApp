'use client';

import { useState, useTransition } from 'react';
import { signInWithGoogle, signInWithEmail, signUpWithEmail } from '../actions/oauth';

export function AuthForm() {
  const [modo, setModo] = useState<'login' | 'registro'>('login');
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    startTransition(async () => {
      if (modo === 'registro') {
        const res = await signUpWithEmail({ nombre, email, password });
        if (res && !res.success) {
          setErrorMsg(res.error || 'Error al registrar.');
        }
      } else {
        const res = await signInWithEmail({ email, password });
        if (res && !res.success) {
          setErrorMsg(res.error || 'Error al iniciar sesión.');
        }
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Pestañas Iniciar Sesión / Registrarse */}
      <div className="grid grid-cols-2 rounded-xl bg-zinc-900 p-1 text-sm font-semibold text-zinc-400 border border-zinc-800">
        <button
          type="button"
          onClick={() => {
            setModo('login');
            setErrorMsg(null);
          }}
          className={`rounded-lg py-2 transition-all ${
            modo === 'login' ? 'bg-zinc-800 text-white shadow-sm' : 'hover:text-zinc-200'
          }`}
        >
          Iniciar Sesión
        </button>
        <button
          type="button"
          onClick={() => {
            setModo('registro');
            setErrorMsg(null);
          }}
          className={`rounded-lg py-2 transition-all ${
            modo === 'registro' ? 'bg-zinc-800 text-white shadow-sm' : 'hover:text-zinc-200'
          }`}
        >
          Crear Cuenta
        </button>
      </div>

      {errorMsg && (
        <div className="rounded-xl border border-red-900/50 bg-red-950/50 p-3 text-xs font-semibold text-red-400">
          {errorMsg}
        </div>
      )}

      {/* Formulario de Email */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {modo === 'registro' && (
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Nombre Completo
            </label>
            <input
              type="text"
              required
              placeholder="Ej: Administrador General"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900/80 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-orange-500 focus:outline-none"
            />
          </div>
        )}

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Correo Electrónico
          </label>
          <input
            type="email"
            required
            placeholder="admin@sazonare.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900/80 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-orange-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Contraseña
          </label>
          <input
            type="password"
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900/80 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-orange-500 focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-xl bg-orange-500 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-orange-600 disabled:opacity-50 active:scale-95"
        >
          {isPending
            ? 'Cargando...'
            : modo === 'registro'
            ? 'Registrarme como Administrador'
            : 'Entrar al Sistema'}
        </button>
      </form>

      {/* Separador */}
      <div className="relative my-4 flex items-center justify-center">
        <div className="w-full border-t border-zinc-800" />
        <span className="absolute bg-zinc-950 px-3 text-xs font-medium uppercase text-zinc-500">o</span>
      </div>

      {/* Botón de Google OAuth */}
      <button
        type="button"
        onClick={() => signInWithGoogle()}
        className="flex w-full items-center justify-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 px-6 py-3 text-sm font-semibold text-zinc-200 shadow-sm transition-all hover:bg-zinc-800 active:scale-95"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
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
        Continuar con Google
      </button>
    </div>
  );
}
