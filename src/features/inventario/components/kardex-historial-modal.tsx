'use client';

import { useState, useMemo } from 'react';
import { MovimientoInventarioDTO } from '../types/inventario';

interface KardexHistorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  movimientos: MovimientoInventarioDTO[];
  cargando: boolean;
}

export function KardexHistorialModal({
  isOpen,
  onClose,
  movimientos,
  cargando,
}: KardexHistorialModalProps) {
  const [filtroTipo, setFiltroTipo] = useState<string>('TODOS');
  const [busqueda, setBusqueda] = useState<string>('');

  const movimientosFiltrados = useMemo(() => {
    return movimientos.filter((m) => {
      const coincideTipo = filtroTipo === 'TODOS' || m.tipo === filtroTipo;
      const coincideBusqueda =
        !busqueda.trim() ||
        (m.bebidaNombre && m.bebidaNombre.toLowerCase().includes(busqueda.toLowerCase())) ||
        (m.motivo && m.motivo.toLowerCase().includes(busqueda.toLowerCase()));
      return coincideTipo && coincideBusqueda;
    });
  }, [movimientos, filtroTipo, busqueda]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-3xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800 shrink-0">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span>📜</span> Kardex • Auditoría de Movimientos de Bebidas
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-500 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Filtros de Kardex */}
        <div className="flex items-center gap-2 shrink-0">
          <input
            type="text"
            placeholder="Buscar por bebida o motivo..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="flex-1 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:border-orange-500 focus:outline-none"
          />
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-zinc-300 focus:border-orange-500 focus:outline-none"
          >
            <option value="TODOS">Todos los tipos</option>
            <option value="VENTA">📉 Venta (Comanda)</option>
            <option value="ENTRADA">📥 Entrada / Abastecimiento</option>
            <option value="AJUSTE">⚖️ Ajuste Manual</option>
            <option value="MERMA">🗑️ Merma / Pérdida</option>
            <option value="DEVOLUCION">🔄 Devolución</option>
          </select>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[250px]">
          {cargando ? (
            <div className="py-16 text-center text-zinc-500">
              <span className="inline-block animate-spin mr-2">⏳</span>
              Cargando movimientos de auditoría...
            </div>
          ) : movimientosFiltrados.length === 0 ? (
            <div className="py-16 text-center text-zinc-500">
              No se encontraron registros en el historial con los filtros actuales.
            </div>
          ) : (
            movimientosFiltrados.map((m) => (
              <div
                key={m.id}
                className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-3 flex items-center justify-between gap-3 text-xs hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-sm font-black border ${
                      m.tipo === 'VENTA'
                        ? 'bg-rose-950/60 border-rose-800 text-rose-300'
                        : m.tipo === 'ENTRADA' || m.tipo === 'DEVOLUCION'
                        ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                        : 'bg-amber-950/60 border-amber-800 text-amber-300'
                    }`}
                  >
                    {m.tipo === 'VENTA'
                      ? '📉'
                      : m.tipo === 'ENTRADA'
                      ? '📥'
                      : m.tipo === 'DEVOLUCION'
                      ? '🔄'
                      : '⚖️'}
                  </span>
                  <div className="min-w-0">
                    <p className="font-bold text-white truncate">{m.bebidaNombre}</p>
                    <p className="text-[11px] text-zinc-400">
                      {m.motivo || m.tipo}
                    </p>
                    <span className="text-[10px] text-zinc-500">
                      {new Date(m.createdAt).toLocaleString('es-CO', {
                        timeZone: 'America/Bogota',
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span
                    className={`font-black text-sm ${
                      m.cantidad < 0 ? 'text-rose-400' : 'text-emerald-400'
                    }`}
                  >
                    {m.cantidad > 0 ? `+${m.cantidad}` : m.cantidad} uds
                  </span>
                  <p className="text-[10px] text-zinc-500">
                    Stock: {m.stockAnterior} → {m.stockNuevo}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="pt-2 border-t border-zinc-800 flex items-center justify-between shrink-0">
          <span className="text-xs text-zinc-500">
            {movimientosFiltrados.length} movimientos listados
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-300 hover:text-white transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
