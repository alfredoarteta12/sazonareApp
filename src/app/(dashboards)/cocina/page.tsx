import { KitchenMonitor } from '@/features/orders/components/kitchen-monitor';

// Monitor de Cocina - Acceso PÚBLICO, sin login requerido
// Diseñado para tablets o pantallas estáticas en área de preparación
export default function CocinaPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-950 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">👨‍🍳</span>
            <div>
              <h1 className="text-lg font-bold text-white">Monitor de Cocina</h1>
              <p className="text-xs text-zinc-400">SazonareFood — Comandas en tiempo real</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-sm font-medium text-emerald-400">En vivo</span>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="p-6">
        <KitchenMonitor />
      </main>
    </div>
  );
}
