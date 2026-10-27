import { KitchenMonitor } from '@/features/orders/components/kitchen-monitor';
import { BotonInstalarPwa } from '@/components/boton-instalar-pwa';

// Monitor de Cocina - Acceso PÚBLICO, sin login requerido
// Diseñado para tablets o pantallas estáticas en área de preparación
export default function CocinaPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-950 px-3.5 py-3 sm:px-6 sm:py-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <span className="text-xl sm:text-2xl shrink-0">👨‍🍳</span>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold text-white truncate">Monitor de Cocina</h1>
              <p className="text-[11px] sm:text-xs text-zinc-400 truncate">SazonareFood — Comandas en tiempo real</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <BotonInstalarPwa />
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs sm:text-sm font-medium text-emerald-400">En vivo</span>
            </div>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="p-3 sm:p-6 pb-12">
        <KitchenMonitor />
      </main>
    </div>
  );
}
