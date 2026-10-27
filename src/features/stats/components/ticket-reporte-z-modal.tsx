'use client';

import { formatearFechaColombia, formatearHoraColombia } from '@/lib/date-utils';
import { formatearCOP } from '@/lib/currency';

export interface CierreCajaData {
  id: string;
  fecha: string;
  responsable: string;
  baseInicial: number;
  ventasEfectivo: number;
  ventasTransf: number;
  totalVentas: number;
  retiros: number;
  efectivoEsperado: number;
  efectivoReal: number;
  diferencia: number;
  totalPedidos: number;
  ticketPromedio: number;
  observaciones: string | null;
  createdAt: string;
}

interface TicketReporteZModalProps {
  cierre: CierreCajaData;
  onCerrar: () => void;
}

export function TicketReporteZModal({ cierre, onCerrar }: TicketReporteZModalProps) {
  const fechaFormateada = formatearFechaColombia(cierre.fecha);
  const horaFormateada = formatearHoraColombia(cierre.createdAt);

  const diferenciaEsCero = Math.abs(cierre.diferencia) < 0.01;
  const diferenciaEsSobrante = cierre.diferencia > 0.01;
  const diferenciaEsFaltante = cierre.diferencia < -0.01;

  const handleImprimir = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-2 sm:p-4 backdrop-blur-sm animate-in fade-in">
      {/* Fondo clickeable para cerrar */}
      <div className="fixed inset-0" onClick={onCerrar} />

      {/* Contenedor del Modal */}
      <div className="relative z-10 flex max-h-[92dvh] w-full max-w-md flex-col rounded-3xl border border-zinc-800 bg-zinc-950 p-4 sm:p-5 shadow-2xl">
        {/* Cabecera del modal (no se imprime) */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="text-xl">📜</span>
            <div>
              <h3 className="font-bold text-white text-base">Corte de Caja (Reporte Z)</h3>
              <p className="text-[11px] text-zinc-400">Auditoría contable y arqueo físico (COP)</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            className="rounded-lg p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* CONTENEDOR DEL TICKET (Formato térmico blanco 80mm/58mm) */}
        <div className="flex-1 overflow-y-auto py-4">
          <div
            id="ticket-reporte-z"
            className="mx-auto w-full max-w-[340px] rounded-xl bg-white p-5 text-black shadow-lg font-mono text-xs leading-relaxed"
          >
            {/* Header del Ticket Z */}
            <div className="text-center pb-3 border-b border-dashed border-zinc-400">
              <h2 className="text-base font-black tracking-wide uppercase">Sazonare</h2>
              <p className="text-[11px] text-zinc-600 font-sans">Restaurante & Terraza</p>
              <p className="text-[10px] font-black uppercase tracking-wider text-zinc-800 mt-1 border-y border-zinc-300 py-0.5">
                ★★★ REPORTE Z - CIERRE DIARIO ★★★
              </p>
              <p className="text-[10px] text-zinc-500 font-sans mt-0.5">
                {fechaFormateada} - {horaFormateada}
              </p>
            </div>

            {/* Metadatos del Cierre */}
            <div className="py-2.5 border-b border-dashed border-zinc-400 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-zinc-600">ID Corte:</span>
                <span className="font-bold">#Z-{cierre.id.slice(0, 8).toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-600">Responsable:</span>
                <span className="font-bold truncate max-w-[170px]">{cierre.responsable}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-600">Total Pedidos:</span>
                <span className="font-bold">{cierre.totalPedidos} comandas</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-600">Ticket Promedio:</span>
                <span className="font-bold">{formatearCOP(cierre.ticketPromedio)}</span>
              </div>
            </div>

            {/* RESUMEN DE VENTAS POR MEDIO */}
            <div className="py-3 border-b border-dashed border-zinc-400 space-y-1.5 text-[11px]">
              <p className="font-black uppercase text-[10px] tracking-wider text-zinc-800 pb-1 border-b border-zinc-200">
                1. RESUMEN DE VENTAS
              </p>
              <div className="flex justify-between">
                <span className="text-zinc-700">💵 Ventas en Efectivo:</span>
                <span className="font-bold">{formatearCOP(cierre.ventasEfectivo)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-700">📲 Transf. (Nequi/Davi/Banc):</span>
                <span className="font-bold">{formatearCOP(cierre.ventasTransf)}</span>
              </div>
              <div className="flex justify-between items-baseline pt-1.5 border-t border-zinc-300 text-sm font-black">
                <span className="text-xs uppercase">TOTAL VENTAS NETAS:</span>
                <span className="text-base font-black">{formatearCOP(cierre.totalVentas)}</span>
              </div>
            </div>

            {/* ARQUEO DE CAJA FÍSICA */}
            <div className="py-3 border-b-2 border-dashed border-zinc-400 space-y-1.5 text-[11px]">
              <p className="font-black uppercase text-[10px] tracking-wider text-zinc-800 pb-1 border-b border-zinc-200">
                2. AUDITORÍA DE EFECTIVO (ARQUEO)
              </p>
              <div className="flex justify-between">
                <span className="text-zinc-600">(+) Base Inicial de Caja:</span>
                <span className="font-medium">{formatearCOP(cierre.baseInicial)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-600">(+) Ventas en Efectivo:</span>
                <span className="font-medium">{formatearCOP(cierre.ventasEfectivo)}</span>
              </div>
              {cierre.retiros > 0 && (
                <div className="flex justify-between text-rose-700">
                  <span>(-) Retiros / Salidas:</span>
                  <span className="font-medium">-{formatearCOP(cierre.retiros)}</span>
                </div>
              )}
              <div className="flex justify-between pt-1 border-t border-zinc-200 font-bold">
                <span>(=) Efectivo Físico Esperado:</span>
                <span>{formatearCOP(cierre.efectivoEsperado)}</span>
              </div>
              <div className="flex justify-between font-black text-xs pt-1">
                <span>Efectivo Real en Mano:</span>
                <span className="text-sm underline">{formatearCOP(cierre.efectivoReal)}</span>
              </div>

              {/* RESULTADO DEL CUADRE */}
              <div
                className={`mt-2 p-2 rounded border text-center ${
                  diferenciaEsCero
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                    : diferenciaEsSobrante
                    ? 'border-blue-600 bg-blue-50 text-blue-900'
                    : 'border-rose-600 bg-rose-50 text-rose-900'
                }`}
              >
                <p className="text-[11px] font-black uppercase">
                  {diferenciaEsCero && '✔ CAJA CUADRADA EXACTA'}
                  {diferenciaEsSobrante && '▲ SOBRANTE DE CAJA'}
                  {diferenciaEsFaltante && '▼ FALTANTE DE CAJA'}
                </p>
                <p className="text-xs font-bold">
                  Diferencia: {cierre.diferencia >= 0 ? '+' : ''}{formatearCOP(cierre.diferencia)}
                </p>
              </div>
            </div>

            {/* Observaciones si las hay */}
            {cierre.observaciones && (
              <div className="py-2.5 border-b border-dashed border-zinc-400 text-[10px] font-sans">
                <p className="font-bold text-zinc-800 uppercase">Observaciones / Novedades:</p>
                <p className="italic text-zinc-700 mt-0.5 whitespace-pre-wrap">{cierre.observaciones}</p>
              </div>
            )}

            {/* Firmas de Responsabilidad */}
            <div className="pt-8 pb-3 space-y-8 text-[10px] text-zinc-600">
              <div className="border-t border-zinc-400 text-center pt-1">
                <p className="font-bold text-zinc-800 uppercase">{cierre.responsable}</p>
                <p>Cajero / Administrador Responsable</p>
              </div>
              <div className="border-t border-zinc-400 text-center pt-1">
                <p className="font-bold text-zinc-800 uppercase">Revisado Por</p>
                <p>Auditoría / Gerencia</p>
              </div>
            </div>

            <div className="text-center text-[9px] text-zinc-400 pt-1">
              *** FIN DEL REPORTE Z OFICIAL ***
            </div>
          </div>
        </div>

        {/* Acciones Inferiores (No se imprimen) */}
        <div className="flex gap-2.5 pt-3 border-t border-zinc-800">
          <button
            type="button"
            onClick={onCerrar}
            className="flex-1 rounded-xl bg-zinc-900 border border-zinc-800 py-2.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            Cerrar
          </button>
          <button
            type="button"
            onClick={handleImprimir}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 py-2.5 text-xs font-bold text-white shadow-lg shadow-orange-500/30 hover:from-orange-600 hover:to-amber-600 active:scale-95 transition-all"
          >
            <span>🖨️</span> Imprimir Reporte Z
          </button>
        </div>
      </div>
    </div>
  );
}
