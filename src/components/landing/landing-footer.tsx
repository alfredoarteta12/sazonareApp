import Link from 'next/link';
import { BotonInstalarPwa } from '@/components/boton-instalar-pwa';
import {
  Flame,
  Smartphone,
  ChefHat,
  ShieldCheck,
  QrCode,
  MapPin,
  Clock,
  CheckCircle2,
} from 'lucide-react';

export function LandingFooter() {
  return (
    <footer className="border-t-2 border-zinc-800 bg-[#08080a] text-zinc-400">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Columna 1: Marca y Propósito */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500 text-black border-2 border-black shadow-[2px_2px_0px_0px_#fff]">
                <Flame className="w-5 h-5 fill-black" />
              </div>
              <span className="font-display text-xl font-black uppercase tracking-tight text-white">
                Sazonare<span className="text-orange-500">Food</span>
              </span>
            </div>
            <p className="text-xs leading-relaxed text-zinc-400 font-medium">
              Plataforma street food y gastronómica de alta velocidad: comandas táctiles en terraza, monitor KDS en cocina, arqueo diario y cobro flexible para restaurantes.
            </p>
            <div className="pt-2">
              <BotonInstalarPwa variante="default" />
            </div>
          </div>

          {/* Columna 2: Accesos al Personal */}
          <div className="space-y-3">
            <h4 className="font-display text-xs font-black uppercase tracking-wider text-white">
              Estaciones de Trabajo
            </h4>
            <ul className="space-y-2 text-xs font-semibold">
              <li>
                <Link
                  href="/login?rol=mesero"
                  className="hover:text-blue-400 transition-colors flex items-center gap-2 group"
                >
                  <Smartphone className="w-4 h-4 text-blue-400" />
                  <span>Estación de Mesero (POS)</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/login?rol=cocina"
                  className="hover:text-amber-400 transition-colors flex items-center gap-2 group"
                >
                  <ChefHat className="w-4 h-4 text-amber-400" />
                  <span>Monitor KDS de Cocina</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/login?rol=admin"
                  className="hover:text-orange-400 transition-colors flex items-center gap-2 group"
                >
                  <ShieldCheck className="w-4 h-4 text-orange-400" />
                  <span>Panel Administrativo & Caja</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/cliente"
                  className="hover:text-emerald-400 text-emerald-400 font-bold transition-colors flex items-center gap-2 group"
                >
                  <QrCode className="w-4 h-4 text-emerald-400" />
                  <span>Portal Clientes (QR Mesa)</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Columna 3: Información y Horarios */}
          <div className="space-y-3">
            <h4 className="font-display text-xs font-black uppercase tracking-wider text-white">
              Ubicación & Horarios
            </h4>
            <ul className="space-y-2 text-xs text-zinc-400">
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-orange-400 shrink-0" />
                <span>Barranquilla, Colombia</span>
              </li>
              <li className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Lunes a Domingo: 4:00 PM – 12:00 AM</span>
              </li>
              <li className="pt-1 text-emerald-400 font-bold uppercase tracking-wider text-[11px]">
                💵 Pesos Colombianos ($ COP)
              </li>
              <li className="text-blue-400 font-bold uppercase tracking-wider text-[11px]">
                📲 Efectivo & Transferencias (Nequi / Daviplata)
              </li>
            </ul>
          </div>

          {/* Columna 4: Seguridad & Tecnología */}
          <div className="space-y-3">
            <h4 className="font-display text-xs font-black uppercase tracking-wider text-white">
              Garantía Operativa
            </h4>
            <div className="neo-box rounded-xl p-3.5 space-y-2 text-xs border-2 border-zinc-800">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="font-display uppercase text-[11px]">Tiempo Real AWS</span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Auditoría relacional, protección anti-descuadres en caja y comunicación directa entre mesa y cocina sin caídas.
              </p>
            </div>
          </div>
        </div>

        {/* Barra inferior */}
        <div className="border-t-2 border-zinc-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <p className="text-zinc-500">
            © {new Date().getFullYear()} SazonareFood. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-4 text-zinc-500 font-semibold">
            <span className="neo-sticker text-[9px] bg-zinc-900 text-orange-400 border-zinc-700 shadow-none">
              v0.1.0 • STREET EDITION
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
