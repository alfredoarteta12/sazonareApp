'use client';

import { useState } from 'react';
import Link from 'next/link';
import { signOut } from '@/features/auth/actions/oauth';
import { BotonInstalarPwa } from '@/components/boton-instalar-pwa';

interface LandingNavbarProps {
  usuarioActual?: {
    nombre: string;
    email: string;
    role: 'ADMIN' | 'MESERO' | 'COCINA';
  } | null;
}

export function LandingNavbar({ usuarioActual }: LandingNavbarProps) {
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);
  const [dropdownAccesoAbierto, setDropdownAccesoAbierto] = useState(false);

  const rutaPanel =
    usuarioActual?.role === 'ADMIN'
      ? '/admin'
      : usuarioActual?.role === 'COCINA'
      ? '/cocina'
      : '/mesero';

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-zinc-800/80 bg-black/80 backdrop-blur-xl transition-all">
        <div className="mx-auto flex h-16 sm:h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo y Marca */}
          <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group">
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 text-xl sm:text-2xl shadow-lg shadow-orange-500/25 group-hover:scale-105 transition-transform">
              🍔
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base sm:text-xl font-black tracking-tight text-white group-hover:text-orange-400 transition-colors">
                  SazonareFood
                </span>
                <span className="rounded-md bg-orange-500/10 border border-orange-500/20 px-1.5 py-0.2 text-[9px] font-bold text-orange-400 uppercase tracking-wider">
                  POS
                </span>
              </div>
              <p className="hidden xs:block text-[10px] sm:text-xs text-zinc-400 font-medium">
                Alta Cocina & Tecnología en Vivo
              </p>
            </div>
          </Link>

          {/* Enlaces de Navegación (Desktop) */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-zinc-300">
            <a href="#menu" className="hover:text-orange-400 transition-colors">
              🍽️ Nuestra Carta
            </a>
            <a href="#modulos" className="hover:text-orange-400 transition-colors">
              ⚙️ Sistemas del Restaurante
            </a>
            <a href="#experiencia" className="hover:text-orange-400 transition-colors">
              ✨ Experiencia
            </a>
            <Link
              href="/cliente"
              className="flex items-center gap-1.5 text-zinc-300 hover:text-orange-400 transition-colors"
            >
              <span>🛎️ Pedir en Mesa</span>
              <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.2 text-[10px] font-extrabold text-emerald-400">
                Cliente
              </span>
            </Link>
          </nav>

          {/* Botones de Acción / Login (Desktop) */}
          <div className="hidden md:flex items-center gap-3">
            <BotonInstalarPwa />

            {usuarioActual ? (
              <div className="flex items-center gap-2.5 pl-2 border-l border-zinc-800">
                <div className="text-right">
                  <p className="text-xs font-bold text-white truncate max-w-[130px]">
                    {usuarioActual.nombre}
                  </p>
                  <span className="inline-block rounded bg-zinc-900 border border-zinc-700/60 px-1.5 py-0.2 text-[9px] font-black uppercase tracking-wider text-orange-400">
                    {usuarioActual.role}
                  </span>
                </div>
                <Link
                  href={rutaPanel}
                  className="rounded-xl bg-orange-500 hover:bg-orange-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-orange-500/20 transition-all hover:scale-105 active:scale-95"
                >
                  🚀 Mi Panel
                </Link>
                <form action={signOut}>
                  <button
                    type="submit"
                    className="rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-red-950/30 hover:border-red-900/60 hover:text-red-400 px-3 py-2 text-xs font-semibold text-zinc-400 transition-colors"
                    title="Cerrar sesión"
                  >
                    Salir
                  </button>
                </form>
              </div>
            ) : (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setDropdownAccesoAbierto(!dropdownAccesoAbierto)}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-orange-500/20 transition-all hover:scale-105 active:scale-95"
                >
                  <span>🔐 Iniciar Sesión</span>
                  <span className="text-[10px]">▼</span>
                </button>

                {/* Dropdown de Roles */}
                {dropdownAccesoAbierto && (
                  <div className="absolute right-0 mt-2 w-60 rounded-2xl border border-zinc-800 bg-zinc-950 p-2 shadow-2xl shadow-black z-50 animate-in fade-in slide-in-from-top-2">
                    <p className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-zinc-500">
                      Selecciona tu estación
                    </p>
                    <Link
                      href="/login?rol=mesero"
                      onClick={() => setDropdownAccesoAbierto(false)}
                      className="flex items-center gap-3 rounded-xl p-2.5 hover:bg-zinc-900 transition-colors group"
                    >
                      <span className="text-xl">📱</span>
                      <div>
                        <p className="text-xs font-bold text-white group-hover:text-blue-400">
                          Meseros & Salón
                        </p>
                        <p className="text-[10px] text-zinc-400">Comandas y cobros en terraza</p>
                      </div>
                    </Link>

                    <Link
                      href="/login?rol=admin"
                      onClick={() => setDropdownAccesoAbierto(false)}
                      className="flex items-center gap-3 rounded-xl p-2.5 hover:bg-zinc-900 transition-colors group"
                    >
                      <span className="text-xl">👑</span>
                      <div>
                        <p className="text-xs font-bold text-white group-hover:text-orange-400">
                          Administración
                        </p>
                        <p className="text-[10px] text-zinc-400">Cierre Z, finanzas y menú</p>
                      </div>
                    </Link>

                    <Link
                      href="/login?rol=cocina"
                      onClick={() => setDropdownAccesoAbierto(false)}
                      className="flex items-center gap-3 rounded-xl p-2.5 hover:bg-zinc-900 transition-colors group"
                    >
                      <span className="text-xl">👨‍🍳</span>
                      <div>
                        <p className="text-xs font-bold text-white group-hover:text-amber-400">
                          Monitor de Cocina
                        </p>
                        <p className="text-[10px] text-zinc-400">Pantalla KDS en tiempo real</p>
                      </div>
                    </Link>

                    <Link
                      href="/cliente"
                      onClick={() => setDropdownAccesoAbierto(false)}
                      className="flex items-center justify-between rounded-xl p-2.5 hover:bg-zinc-900/60 transition-colors border-t border-zinc-900 mt-1 group"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">🍽️</span>
                        <div>
                          <p className="text-xs font-bold text-zinc-300 group-hover:text-purple-300">
                            Carta Clientes
                          </p>
                          <p className="text-[10px] text-zinc-500">Pedidos directos desde la mesa</p>
                        </div>
                      </div>
                      <span className="rounded bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 text-[9px] font-bold text-emerald-400">
                        Activo
                      </span>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Botón Menú Móvil */}
          <div className="flex md:hidden items-center gap-2">
            <BotonInstalarPwa />
            <button
              type="button"
              onClick={() => setMenuMovilAbierto(!menuMovilAbierto)}
              className="rounded-xl border border-zinc-800 bg-zinc-900 p-2 text-zinc-300 hover:text-white"
              aria-label="Abrir menú"
            >
              {menuMovilAbierto ? '✕' : '☰'}
            </button>
          </div>
        </div>

        {/* Menú Desplegable en Móvil */}
        {menuMovilAbierto && (
          <div className="md:hidden border-t border-zinc-800 bg-zinc-950 p-4 space-y-3 animate-in fade-in">
            {usuarioActual ? (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-3 mb-2 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-white">{usuarioActual.nombre}</p>
                  <p className="text-[10px] text-orange-400 font-black uppercase">
                    {usuarioActual.role}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={rutaPanel}
                    onClick={() => setMenuMovilAbierto(false)}
                    className="rounded-xl bg-orange-500 px-3 py-1.5 text-xs font-bold text-white"
                  >
                    🚀 Mi Panel
                  </Link>
                  <form action={signOut}>
                    <button
                      type="submit"
                      className="rounded-xl bg-zinc-800 px-2.5 py-1.5 text-xs font-semibold text-zinc-300"
                    >
                      Salir
                    </button>
                  </form>
                </div>
              </div>
            ) : (
              <div className="space-y-1.5 pb-2 border-b border-zinc-800">
                <p className="text-[10px] font-black uppercase text-zinc-500 px-2">
                  Iniciar Sesión por Área:
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <Link
                    href="/login?rol=mesero"
                    onClick={() => setMenuMovilAbierto(false)}
                    className="rounded-xl border border-zinc-800 bg-zinc-900 p-2 text-center text-xs font-bold text-white hover:border-blue-500"
                  >
                    📱 Mesero
                  </Link>
                  <Link
                    href="/login?rol=admin"
                    onClick={() => setMenuMovilAbierto(false)}
                    className="rounded-xl border border-zinc-800 bg-zinc-900 p-2 text-center text-xs font-bold text-white hover:border-orange-500"
                  >
                    👑 Admin
                  </Link>
                  <Link
                    href="/login?rol=cocina"
                    onClick={() => setMenuMovilAbierto(false)}
                    className="rounded-xl border border-zinc-800 bg-zinc-900 p-2 text-center text-xs font-bold text-white hover:border-amber-500"
                  >
                    👨‍🍳 Cocina
                  </Link>
                </div>
              </div>
            )}

            <div className="space-y-2 pt-1 text-sm font-semibold text-zinc-300">
              <a
                href="#menu"
                onClick={() => setMenuMovilAbierto(false)}
                className="block py-2 px-3 rounded-xl hover:bg-zinc-900"
              >
                🍽️ Nuestra Carta
              </a>
              <a
                href="#modulos"
                onClick={() => setMenuMovilAbierto(false)}
                className="block py-2 px-3 rounded-xl hover:bg-zinc-900"
              >
                ⚙️ Sistemas del Restaurante
              </a>
              <a
                href="#experiencia"
                onClick={() => setMenuMovilAbierto(false)}
                className="block py-2 px-3 rounded-xl hover:bg-zinc-900"
              >
                ✨ Experiencia
              </a>
              <Link
                href="/cliente"
                onClick={() => setMenuMovilAbierto(false)}
                className="w-full text-left py-2.5 px-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 font-bold flex items-center justify-between hover:bg-orange-500/20"
              >
                <span className="flex items-center gap-2">
                  <span>🛎️</span>
                  <span>Pedir en Mesa (Cliente)</span>
                </span>
                <span className="rounded bg-emerald-500/20 border border-emerald-500/40 px-1.5 py-0.5 text-[9px] font-black text-emerald-400">
                  Activo
                </span>
              </Link>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
