'use client';

import { ResumenInventario } from '../types/inventario';
import { formatearCOP } from '@/lib/currency';
import { Package, Coins, TrendingUp, AlertTriangle } from 'lucide-react';

interface InventarioMetricasProps {
  resumen: ResumenInventario;
}

export function InventarioMetricas({ resumen }: InventarioMetricasProps) {
  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      {/* Costo Total del Inventario */}
      <div className="rounded-2xl border-2 border-zinc-700 bg-zinc-950 p-4 sm:p-5 relative shadow-[4px_4px_0px_0px_#52525b] hover:shadow-[6px_6px_0px_0px_#71717a] transition-all">
        <div className="flex items-center justify-between text-zinc-400 mb-1.5">
          <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-zinc-400">
            Valor al Costo
          </span>
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-300">
            <Package className="h-4 w-4" />
          </div>
        </div>
        <p className="font-display text-xl sm:text-2xl font-black text-white tracking-tight">
          {formatearCOP(resumen.valorCostoTotal)}
        </p>
        <p className="text-[10px] sm:text-[11px] text-zinc-400 font-medium mt-1">
          Inversión en {resumen.totalUnidades} bebidas almacenadas
        </p>
      </div>

      {/* Valor Total a la Venta */}
      <div className="rounded-2xl border-2 border-emerald-500/80 bg-zinc-950 p-4 sm:p-5 relative shadow-[4px_4px_0px_0px_#10b981] hover:shadow-[6px_6px_0px_0px_#34d399] transition-all">
        <div className="flex items-center justify-between text-emerald-400 mb-1.5">
          <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-emerald-400">
            Valor a la Venta
          </span>
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-950/60 border border-emerald-700 text-emerald-300">
            <Coins className="h-4 w-4" />
          </div>
        </div>
        <p className="font-display text-xl sm:text-2xl font-black text-emerald-400 tracking-tight">
          {formatearCOP(resumen.valorVentaTotal)}
        </p>
        <p className="text-[10px] sm:text-[11px] text-emerald-400/80 font-medium mt-1">
          Venta proyectada en carta
        </p>
      </div>

      {/* Ganancia Proyectada */}
      <div className="rounded-2xl border-2 border-orange-500/80 bg-zinc-950 p-4 sm:p-5 relative shadow-[4px_4px_0px_0px_#f97316] hover:shadow-[6px_6px_0px_0px_#fb923c] transition-all">
        <div className="flex items-center justify-between text-orange-400 mb-1.5">
          <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-orange-400">
            Margen Proyectado
          </span>
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-950/60 border border-orange-700 text-orange-300">
            <TrendingUp className="h-4 w-4" />
          </div>
        </div>
        <p className="font-display text-xl sm:text-2xl font-black text-orange-400 tracking-tight">
          +{formatearCOP(resumen.gananciaProyectada)}
        </p>
        <p className="text-[10px] sm:text-[11px] text-orange-300/80 font-medium mt-1">
          Rentabilidad estimada: {resumen.margenPorcentual}%
        </p>
      </div>

      {/* Alertas de Stock */}
      <div className="rounded-2xl border-2 border-zinc-700 bg-zinc-950 p-4 sm:p-5 relative shadow-[4px_4px_0px_0px_#eab308] hover:shadow-[6px_6px_0px_0px_#facc15] transition-all">
        <div className="flex items-center justify-between text-amber-400 mb-1.5">
          <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-amber-400">
            Alertas de Stock
          </span>
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-950/60 border border-amber-700 text-amber-300">
            <AlertTriangle className="h-4 w-4" />
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <span
            className={`rounded-lg px-2.5 py-1 text-xs font-black uppercase tracking-wider border-2 ${
              resumen.totalAgotadas > 0
                ? 'bg-rose-500 text-black border-rose-400 shadow-[2px_2px_0px_0px_#fff]'
                : 'bg-zinc-900 border-zinc-800 text-zinc-500'
            }`}
          >
            {resumen.totalAgotadas} agotadas
          </span>
          <span
            className={`rounded-lg px-2.5 py-1 text-xs font-black uppercase tracking-wider border-2 ${
              resumen.totalBajoStock > 0
                ? 'bg-amber-400 text-black border-amber-300 shadow-[2px_2px_0px_0px_#fff]'
                : 'bg-zinc-900 border-zinc-800 text-zinc-500'
            }`}
          >
            {resumen.totalBajoStock} bajas
          </span>
        </div>
      </div>
    </div>
  );
}

