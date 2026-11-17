'use client';

import { ResumenInventario } from '../types/inventario';
import { formatearCOP } from '@/lib/currency';

interface InventarioMetricasProps {
  resumen: ResumenInventario;
}

export function InventarioMetricas({ resumen }: InventarioMetricasProps) {
  return (
    <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
      {/* Costo Total del Inventario */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-5 relative overflow-hidden">
        <div className="flex items-center justify-between text-zinc-400 mb-1">
          <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider">
            Valor Total al Costo
          </span>
          <span className="text-lg">🏷️</span>
        </div>
        <p className="text-xl sm:text-2xl font-black text-white">
          {formatearCOP(resumen.valorCostoTotal)}
        </p>
        <p className="text-[10px] sm:text-[11px] text-zinc-400 mt-1">
          Inversión en {resumen.totalUnidades} bebidas almacenadas
        </p>
      </div>

      {/* Valor Total a la Venta */}
      <div className="rounded-2xl border border-emerald-900/40 bg-emerald-950/20 p-4 sm:p-5 relative overflow-hidden">
        <div className="flex items-center justify-between text-emerald-400 mb-1">
          <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider">
            Valor Total a la Venta
          </span>
          <span className="text-lg">💰</span>
        </div>
        <p className="text-xl sm:text-2xl font-black text-emerald-400">
          {formatearCOP(resumen.valorVentaTotal)}
        </p>
        <p className="text-[10px] sm:text-[11px] text-emerald-300/70 mt-1">
          Venta proyectada en carta
        </p>
      </div>

      {/* Ganancia Proyectada */}
      <div className="rounded-2xl border border-orange-900/40 bg-orange-950/20 p-4 sm:p-5 relative overflow-hidden">
        <div className="flex items-center justify-between text-orange-400 mb-1">
          <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider">
            Margen Proyectado
          </span>
          <span className="text-lg">📈</span>
        </div>
        <p className="text-xl sm:text-2xl font-black text-orange-400">
          +{formatearCOP(resumen.gananciaProyectada)}
        </p>
        <p className="text-[10px] sm:text-[11px] text-orange-300/70 mt-1">
          Rentabilidad promedio: {resumen.margenPorcentual}%
        </p>
      </div>

      {/* Alertas de Stock */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-5">
        <div className="flex items-center justify-between text-zinc-400 mb-1">
          <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider">
            Alertas de Stock
          </span>
          <span className="text-lg">⚠️</span>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <span
            className={`rounded-lg px-2.5 py-1 text-xs font-black border ${
              resumen.totalAgotadas > 0
                ? 'bg-rose-950/80 border-rose-600 text-rose-300'
                : 'bg-zinc-900 border-zinc-800 text-zinc-500'
            }`}
          >
            🚫 {resumen.totalAgotadas} agotadas
          </span>
          <span
            className={`rounded-lg px-2.5 py-1 text-xs font-black border ${
              resumen.totalBajoStock > 0
                ? 'bg-amber-950/80 border-amber-600 text-amber-300'
                : 'bg-zinc-900 border-zinc-800 text-zinc-500'
            }`}
          >
            ⚠️ {resumen.totalBajoStock} bajas
          </span>
        </div>
      </div>
    </div>
  );
}

