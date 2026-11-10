import Link from 'next/link';
import { BotonInstalarPwa } from '@/components/boton-instalar-pwa';

export function LandingFooter() {
  return (
    <footer className="border-t border-zinc-800 bg-zinc-950 text-zinc-400">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Columna 1: Marca y Propósito */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500 text-xl shadow-md shadow-orange-500/20">
                🍔
              </div>
              <span className="text-lg font-bold text-white">SazonareFood</span>
            </div>
            <p className="text-xs leading-relaxed text-zinc-400">
              Plataforma gastronómica de vanguardia: comandas táctiles en terraza, monitor KDS en cocina, arqueo diario y cobro flexible para restaurantes.
            </p>
            <div className="pt-2">
              <BotonInstalarPwa variante="default" />
            </div>
          </div>

          {/* Columna 2: Accesos al Personal */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-white">
              Estaciones de Trabajo
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link
                  href="/login?rol=mesero"
                  className="hover:text-orange-400 transition-colors flex items-center gap-1.5"
                >
                  <span>📱</span>
                  <span>Estación de Mesero (POS Comandas)</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/login?rol=cocina"
                  className="hover:text-amber-400 transition-colors flex items-center gap-1.5"
                >
                  <span>👨‍🍳</span>
                  <span>Monitor KDS de Cocina</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/login?rol=admin"
                  className="hover:text-orange-400 transition-colors flex items-center gap-1.5"
                >
                  <span>👑</span>
                  <span>Panel Administrativo & Cierre Z</span>
                </Link>
              </li>
              <li>
                <span className="text-zinc-600 flex items-center gap-1.5 cursor-not-allowed">
                  <span>🍽️</span>
                  <span>Portal Clientes QR (Próximamente)</span>
                </span>
              </li>
            </ul>
          </div>

          {/* Columna 3: Información y Horarios */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-white">
              Horarios y Servicio
            </h4>
            <ul className="space-y-1.5 text-xs text-zinc-400">
              <li>📍 Barranquilla, Colombia</li>
              <li>🕒 Lunes a Domingo: 4:00 PM – 12:00 AM</li>
              <li>📞 Atención y Pedidos a Domicilio</li>
              <li className="pt-1 text-emerald-400 font-semibold">
                💵 Pagos en Pesos Colombianos (COP)
              </li>
              <li className="text-blue-400 font-semibold">
                📲 Efectivo & Transferencias (Nequi / Daviplata)
              </li>
            </ul>
          </div>

          {/* Columna 4: Seguridad & Tecnología */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-white">
              Garantía Operativa
            </h4>
            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-3.5 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Tiempo Real Sincronizado</span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Auditoría relacional 3FN, protección anti-descuadres en caja y comunicación directa entre mesa y cocina.
              </p>
            </div>
          </div>
        </div>

        {/* Barra inferior de copyright */}
        <div className="pt-8 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <p>© {new Date().getFullYear()} SazonareFood. Todos los derechos reservados.</p>
          <div className="flex items-center gap-4 text-zinc-500 text-[11px]">
            <span>Moneda Oficial: COP ($)</span>
            <span>•</span>
            <span>Hora Oficial: Colombia (UTC-5)</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
