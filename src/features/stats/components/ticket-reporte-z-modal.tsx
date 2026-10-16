'use client';

import { formatearFechaColombia, formatearHoraColombia } from '@/lib/date-utils';

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

  const handleImprimir = () => {
    window.print();
  };

  const diferenciaEsCero = Math.abs(cierre.diferencia) < 0.01;
  const diferenciaEsSobrante = cierre.diferencia > 0.01;
  const diferenciaEsFaltante = cierre.diferencia < -0.01;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm">
      <div className="fixed inset-0" onClick={onCerrar} />

      <div className="relative z-10 flex max-h-[94vh] w-full max-w-md flex-col rounded-3xl border border-zinc-800 bg-zinc-950 p-5 shadow-2xl">
        {/* Cabecera del modal (no imprimible) */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="text-xl">🖨️</span>
            <div>
              <h3 className="font-bold text-white text-base">Reporte Z — Cierre Diario</h3>
              <p className="text-[11px] text-zinc-400">Comprobante fiscal y auditoría de arqueo</p>
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

        {/* CONTENEDOR DEL REPORTE Z TÉRMICO */}
        <div className="flex-1 overflow-y-auto py-4">
          <div
            id="reporte-z-imprimible"
            className="mx-auto w-full max-w-[340px] rounded-xl bg-white p-5 text-black shadow-lg font-mono text-xs leading-relaxed"
          >
            {/* Header del Negocio */}
            <div className="text-center pb-3 border-b-2 border-dashed border-zinc-400">
              <h2 className="text-base font-black tracking-wide uppercase">SAZONARE</h2>
              <p className="text-[11px] text-zinc-700 font-sans font-semibold">RESTAURANTE & TERRAZA</p>
              <p className="text-[10px] text-zinc-500 font-sans mt-0.5">Zona de Terraza Exterior</p>
              <p className="text-[10px] text-zinc-500 font-sans">NIT: 901.458.239-1</p>
              <p className="text-[10px] text-zinc-500 font-sans">Colombia (America/Bogota)</p>
            </div>

            {/* Título Oficial Reporte Z */}
            <div className="py-2.5 text-center border-b border-dashed border-zinc-400 bg-zinc-50 my-1 rounded">
              <p className="text-[13px] font-black tracking-wider uppercase">★★★ REPORTE Z ★★★</p>
              <p className="text-[10px] font-bold text-zinc-700">CIERRE Y ARQUEO DIARIO DE CAJA</p>
            </div>

            {/* Metadatos del Cierre */}
            <div className="py-2.5 border-b border-dashed border-zinc-400 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-zinc-600">Folio Cierre:</span>
                <span className="font-bold">#Z-{cierre.id.slice(0, 8).toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-600">Fecha Turno:</span>
                <span className="font-bold">{fechaFormateada}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-600">Hora Cierre:</span>
                <span className="font-medium">{horaFormateada}</span>
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
                <span className="font-bold">${cierre.ticketPromedio.toFixed(2)}</span>
              </div>
            </div>

            {/* RESUMEN DE VENTAS POR MEDIO */}
            <div className="py-3 border-b border-dashed border-zinc-400 space-y-1.5 text-[11px]">
              <p className="font-black uppercase text-[10px] tracking-wider text-zinc-800 pb-1 border-b border-zinc-200">
                1. RESUMEN DE VENTAS
              </p>
              <div className="flex justify-between">
                <span className="text-zinc-700">💵 Ventas en Efectivo:</span>
                <span className="font-bold">${cierre.ventasEfectivo.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-700">📲 Transf. (Nequi/Davi/Banc):</span>
                <span className="font-bold">${cierre.ventasTransf.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-baseline pt-1.5 border-t border-zinc-300 text-sm font-black">
                <span className="text-xs uppercase">TOTAL VENTAS NETAS:</span>
                <span className="text-base font-black">${cierre.totalVentas.toFixed(2)}</span>
              </div>
            </div>

            {/* ARQUEO DE CAJA FÍSICA */}
            <div className="py-3 border-b-2 border-dashed border-zinc-400 space-y-1.5 text-[11px]">
              <p className="font-black uppercase text-[10px] tracking-wider text-zinc-800 pb-1 border-b border-zinc-200">
                2. AUDITORÍA DE EFECTIVO (ARQUEO)
              </p>
              <div className="flex justify-between">
                <span className="text-zinc-600">(+) Base Inicial de Caja:</span>
                <span className="font-medium">${cierre.baseInicial.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-600">(+) Ventas en Efectivo:</span>
                <span className="font-medium">${cierre.ventasEfectivo.toFixed(2)}</span>
              </div>
              {cierre.retiros > 0 && (
                <div className="flex justify-between text-rose-700">
                  <span>(-) Retiros / Salidas:</span>
                  <span className="font-medium">-${cierre.retiros.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between pt-1 border-t border-zinc-200 font-bold">
                <span>(=) Efectivo Físico Esperado:</span>
                <span>${cierre.efectivoEsperado.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-black text-xs pt-1">
                <span>Efectivo Real en Mano:</span>
                <span className="text-sm underline">${cierre.efectivoReal.toFixed(2)}</span>
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
                  Diferencia: {cierre.diferencia >= 0 ? '+' : ''}${cierre.diferencia.toFixed(2)}
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

            {/* Líneas de Firma */}
            <div className="pt-6 pb-2 text-center text-[10px] font-sans space-y-6">
              <div>
                <p className="text-zinc-500">__________________________________</p>
                <p className="font-bold text-zinc-800 uppercase mt-1">Firma Cajero / Administrador</p>
                <p className="text-[9px] text-zinc-500">{cierre.responsable}</p>
              </div>
            </div>

            {/* Footer de Auditoría */}
            <div className="pt-3 border-t border-dashed border-zinc-300 text-center text-[9px] text-zinc-500 font-sans space-y-0.5">
              <p className="font-bold uppercase text-zinc-700">DOCUMENTO DE AUDITORÍA INTERNA</p>
              <p>Generado automáticamente por SazonareFood POS</p>
              <p>Fin de jornada registrado satisfactoriamente.</p>
            </div>
          </div>
        </div>

        {/* Acciones inferiores (no imprimibles) */}
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
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-orange-500 py-2.5 text-xs font-bold text-white shadow-lg shadow-orange-500/30 hover:bg-orange-600 active:scale-95 transition-all"
          >
            <span>🖨️</span> Imprimir Reporte Z
          </button>
        </div>
      </div>
    </div>
  );
}

