'use client';

import { useState } from 'react';
import Link from 'next/link';
import { signOut } from '@/features/auth/actions/oauth';
import { BotonInstalarPwa } from '@/components/boton-instalar-pwa';
import {
  Flame,
  Utensils,
  ChefHat,
  Smartphone,
  Shield,
  ChevronDown,
  LogOut,
  Sparkles,
  Menu,
  X,
  QrCode,
} from 'lucide-react';

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
      <header className="sticky top-0 z-50 w-full border-b-2 border-zinc-800 bg-[#08080a]/90 backdrop-blur-xl transition-all">
        <div className="mx-auto flex h-16 sm:h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo y Marca Neo-Brutalist */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 text-black border-2 border-black shadow-[3px_3px_0px_0px_#fff] group-hover:translate-x-0.5 group-hover:translate-y-0.5 group-hover:shadow-[1px_1px_0px_0px_#fff] transition-all">
              <Flame className="w-5 h-5 sm:w-6 sm:h-6 fill-black text-black stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display text-lg sm:text-2xl font-black uppercase tracking-tight text-white group-hover:text-orange-400 transition-colors">
                  Sazonare<span className="text-orange-500">Food</span>
                </span>
                <span className="neo-sticker text-[9px] bg-orange-500 text-black border-black shadow-[1.5px_1.5px_0px_0px_#000] rotate-[-2deg]">
                  STREET POS
                </span>
              </div>
              <p className="hidden xs:block text-[10px] sm:text-xs text-zinc-400 font-semibold uppercase tracking-wider">
                Gastronomía Urbana & Tiempo Real
              </p>
            </div>
          </Link>

          {/* Enlaces de Navegación (Desktop) */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-black uppercase tracking-wider text-zinc-300">
            <a
              href="#menu"
              className="flex items-center gap-1.5 hover:text-orange-400 transition-colors py-1"
            >
              <Utensils className="w-4 h-4 text-orange-500" />
              <span>Carta & Menú</span>
            </a>
            <a
              href="#modulos"
              className="flex items-center gap-1.5 hover:text-orange-400 transition-colors py-1"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Ecosistema</span>
            </a>
            <Link
              href="/cliente"
              className="flex items-center gap-2 rounded-xl bg-zinc-900 border-2 border-emerald-500/80 px-3 py-1.5 text-emerald-400 shadow-[3px_3px_0px_0px_#10b981] hover:bg-emerald-950/40 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
            >
              <QrCode className="w-4 h-4" />
              <span>Pedir en Mesa</span>
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            </Link>
          </nav>

          {/* Botones de Acción / Login (Desktop) */}
          <div className="hidden md:flex items-center gap-3">
            <BotonInstalarPwa />

            {usuarioActual ? (
              <div className="flex items-center gap-3 pl-3 border-l-2 border-zinc-800">
                <div className="text-right">
                  <p className="text-xs font-black text-white uppercase tracking-tight truncate max-w-[130px]">
                    {usuarioActual.nombre}
                  </p>
                  <span className="neo-sticker text-[8px] bg-zinc-800 text-orange-400 border-orange-500/50 shadow-none">
                    {usuarioActual.role}
                  </span>
                </div>
                <Link
                  href={rutaPanel}
                  className="neo-btn-primary rounded-xl px-4 py-2 text-xs uppercase tracking-wider"
                >
                  ⚡ Mi Estación
                </Link>
                <form action={signOut}>
                  <button
                    type="submit"
                    className="flex h-9 w-9 items-center justify-center rounded-xl border-2 border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-rose-400 hover:border-rose-700/60 transition-colors"
                    title="Cerrar sesión"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </form>
              </div>
            ) : (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setDropdownAccesoAbierto(!dropdownAccesoAbierto)}
                  className="neo-btn-primary flex items-center gap-2 rounded-xl px-4 py-2 text-xs uppercase tracking-wider"
                >
                  <span>Entrar al POS</span>
                  <ChevronDown className="w-3.5 h-3.5 stroke-[3]" />
                </button>

                {/* Dropdown de Roles Neo-Brutalist */}
                {dropdownAccesoAbierto && (
                  <div className="absolute right-0 mt-3 w-64 rounded-2xl border-2 border-zinc-700 bg-zinc-950 p-2.5 shadow-[6px_6px_0px_0px_#f97316] z-50 animate-in fade-in zoom-in-95">
                    <p className="px-3 py-1.5 font-display text-[10px] font-black uppercase tracking-wider text-zinc-500 border-b border-zinc-800 mb-1">
                      Selecciona tu estación
                    </p>
                    <Link
                      href="/login?rol=mesero"
                      onClick={() => setDropdownAccesoAbierto(false)}
                      className="flex items-center gap-3 rounded-xl p-2.5 hover:bg-zinc-900 border border-transparent hover:border-zinc-700 transition-all group"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-400">
                        <Smartphone className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-display text-xs font-black text-white uppercase group-hover:text-blue-400">
                          Meseros & Salón
                        </p>
                        <p className="text-[10px] text-zinc-400">Toma táctil y cobros</p>
                      </div>
                    </Link>

                    <Link
                      href="/login?rol=cocina"
                      onClick={() => setDropdownAccesoAbierto(false)}
                      className="flex items-center gap-3 rounded-xl p-2.5 hover:bg-zinc-900 border border-transparent hover:border-zinc-700 transition-all group"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400">
                        <ChefHat className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-display text-xs font-black text-white uppercase group-hover:text-amber-400">
                          Monitor de Cocina
                        </p>
                        <p className="text-[10px] text-zinc-400">KDS en tiempo real</p>
                      </div>
                    </Link>

                    <Link
                      href="/login?rol=admin"
                      onClick={() => setDropdownAccesoAbierto(false)}
                      className="flex items-center gap-3 rounded-xl p-2.5 hover:bg-zinc-900 border border-transparent hover:border-zinc-700 transition-all group"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/15 border border-orange-500/30 text-orange-400">
                        <Shield className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-display text-xs font-black text-white uppercase group-hover:text-orange-400">
                          Administración
                        </p>
                        <p className="text-[10px] text-zinc-400">Caja, Kardex y Carta</p>
                      </div>
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
              className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-zinc-700 bg-zinc-900 text-white shadow-[2px_2px_0px_0px_#f97316]"
              aria-label="Abrir menú"
            >
              {menuMovilAbierto ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Menú Desplegable en Móvil */}
        {menuMovilAbierto && (
          <div className="md:hidden border-t-2 border-zinc-800 bg-zinc-950 p-4 space-y-3 animate-in fade-in">
            {usuarioActual ? (
              <div className="rounded-xl border-2 border-zinc-700 bg-zinc-900 p-3 mb-2 flex items-center justify-between">
                <div>
                  <p className="font-display text-xs font-black text-white uppercase">{usuarioActual.nombre}</p>
                  <span className="neo-sticker text-[8px] bg-orange-500 text-black border-black mt-1">
                    {usuarioActual.role}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={rutaPanel}
                    onClick={() => setMenuMovilAbierto(false)}
                    className="neo-btn-primary rounded-xl px-3 py-1.5 text-xs uppercase"
                  >
                    Entrar
                  </Link>
                  <form action={signOut}>
                    <button
                      type="submit"
                      className="rounded-xl border-2 border-zinc-700 bg-zinc-800 px-2.5 py-1.5 text-xs font-bold text-zinc-300"
                    >
                      Salir
                    </button>
                  </form>
                </div>
              </div>
            ) : (
              <div className="space-y-2 pb-3 border-b-2 border-zinc-800">
                <p className="font-display text-[10px] font-black uppercase text-zinc-500 px-1">
                  Acceso a Estaciones:
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <Link
                    href="/login?rol=mesero"
                    onClick={() => setMenuMovilAbierto(false)}
                    className="rounded-xl border-2 border-zinc-700 bg-zinc-900 p-2.5 text-center text-[11px] font-black uppercase text-white hover:border-blue-500 shadow-[2px_2px_0px_0px_#3b82f6]"
                  >
                    Mesero
                  </Link>
                  <Link
                    href="/login?rol=cocina"
                    onClick={() => setMenuMovilAbierto(false)}
                    className="rounded-xl border-2 border-zinc-700 bg-zinc-900 p-2.5 text-center text-[11px] font-black uppercase text-white hover:border-amber-500 shadow-[2px_2px_0px_0px_#f59e0b]"
                  >
                    Cocina
                  </Link>
                  <Link
                    href="/login?rol=admin"
                    onClick={() => setMenuMovilAbierto(false)}
                    className="rounded-xl border-2 border-zinc-700 bg-zinc-900 p-2.5 text-center text-[11px] font-black uppercase text-white hover:border-orange-500 shadow-[2px_2px_0px_0px_#f97316]"
                  >
                    Admin
                  </Link>
                </div>
              </div>
            )}

            <div className="space-y-2 pt-1 font-display text-xs font-black uppercase tracking-wider text-zinc-300">
              <a
                href="#menu"
                onClick={() => setMenuMovilAbierto(false)}
                className="block py-2 px-3 rounded-xl hover:bg-zinc-900"
              >
                🍽️ Carta & Especialidades
              </a>
              <a
                href="#modulos"
                onClick={() => setMenuMovilAbierto(false)}
                className="block py-2 px-3 rounded-xl hover:bg-zinc-900"
              >
                ⚡ Ecosistema del Restaurante
              </a>
              <Link
                href="/cliente"
                onClick={() => setMenuMovilAbierto(false)}
                className="w-full text-left py-3 px-3.5 rounded-xl bg-orange-500 text-black border-2 border-black font-black flex items-center justify-between shadow-[3px_3px_0px_0px_#fff]"
              >
                <span className="flex items-center gap-2">
                  <QrCode className="w-4 h-4" />
                  <span>Pedir en Mesa (QR Cliente)</span>
                </span>
                <span className="h-2 w-2 rounded-full bg-black animate-ping" />
              </Link>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
