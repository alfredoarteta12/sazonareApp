import { AuthForm } from '@/features/auth/components/auth-form';
import { BotonInstalarPwa } from '@/components/boton-instalar-pwa';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black px-4 py-8 text-white">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="mb-6 text-center">
          <div className="mb-3 inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-orange-500 text-4xl shadow-lg shadow-orange-500/20">
            🍔
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">SazonareFood</h1>
          <p className="mt-1 text-sm text-zinc-400">Sistema ERP & POS para Restaurante</p>
          <div className="mt-3 flex justify-center">
            <BotonInstalarPwa />
          </div>
        </div>

        {/* Card de acceso y registro */}
        <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-8 shadow-2xl shadow-black">
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
