'use client';

import { Pedido } from '../hooks/use-realtime-orders';
import { parseDetallePedido } from '../utils/parse-order-detail';

interface TicketReciboModalProps {
  pedido: Pedido;
  nombreMesero?: string;
  onCerrar: () => void;
}

export function TicketReciboModal({ pedido, nombreMesero, onCerrar }: TicketReciboModalProps) {
  const items = parseDetallePedido(pedido.detalle, pedido.total);

  // Fecha legible
  const fecha = new Date(pedido.createdAt);
  const fechaFormateada = fecha.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const horaFormateada = fecha.toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Cálculos de IVA y propinas sugeridas
  const subtotalSinIva = pedido.total / 1.16;
  const ivaCalculado = pedido.total - subtotalSinIva;
  const propina10 = pedido.total * 0.1;
  const propina15 = pedido.total * 0.15;

  const handleImprimir = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      {/* Fondo clickeable para cerrar */}
      <div className="fixed inset-0" onClick={onCerrar} />

      {/* Contenedor del Modal */}
      <div className="relative z-10 flex max-h-[92vh] w-full max-w-md flex-col rounded-3xl border border-zinc-800 bg-zinc-950 p-5 shadow-2xl">
        {/* Cabecera del modal (no se imprime) */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="text-xl">🧾</span>
            <h3 className="font-bold text-white text-base">Comprobante de Cuenta</h3>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            className="rounded-lg p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* CONTENEDOR DEL TICKET (Diseño térmico blanco para impresión y previsualización) */}
        <div className="flex-1 overflow-y-auto py-4">
          <div
            id="ticket-imprimible"
            className="mx-auto w-full max-w-[340px] rounded-xl bg-white p-5 text-black shadow-lg font-mono text-xs leading-relaxed"
          >
            {/* Header del Ticket */}
            <div className="text-center pb-3 border-b border-dashed border-zinc-400">
              <h2 className="text-base font-black tracking-wide uppercase">Sazonare</h2>
              <p className="text-[11px] text-zinc-600 font-sans">Restaurante & Terraza</p>
              <p className="text-[10px] text-zinc-500 font-sans mt-0.5">Zona de Terraza Exterior</p>
              <p className="text-[10px] text-zinc-500 font-sans">Tel: (555) 019-2834</p>
            </div>

            {/* Metadatos del Pedido */}
            <div className="py-2.5 border-b border-dashed border-zinc-400 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-zinc-600">Ticket:</span>
                <span className="font-bold">#{pedido.id.slice(0, 8).toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-600">Mesa:</span>
                <span className="font-bold">Mesa {pedido.mesa} (Terraza)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-600">Fecha:</span>
                <span>{fechaFormateada} - {horaFormateada}</span>
              </div>
              {nombreMesero && (
                <div className="flex justify-between">
                  <span className="text-zinc-600">Atendido por:</span>
                  <span className="font-medium truncate max-w-[150px]">{nombreMesero}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-zinc-600">Estado:</span>
                <span className={`font-bold uppercase tracking-wider text-[10px] ${
                  pedido.estado === 'PAGADO' ? 'text-emerald-700 font-black' : ''
                }`}>
                  {pedido.estado} {pedido.metodoPago ? `(${pedido.metodoPago})` : ''}
                </span>
              </div>
            </div>

            {/* Sello de Pago si la orden ya está pagada */}
            {pedido.estado === 'PAGADO' && (
              <div className="my-2 rounded border-2 border-dashed border-emerald-600 bg-emerald-50/70 p-2 text-center text-emerald-800">
                <p className="text-xs font-black uppercase tracking-widest">★ CUENTA PAGADA ★</p>
                <p className="text-[10px] font-bold">MÉTODO: {pedido.metodoPago || 'EFECTIVO'}</p>
              </div>
            )}


            {/* Lista Desglosada de Platillos */}
            <div className="py-3 border-b border-dashed border-zinc-400">
              <div className="flex justify-between text-[10px] font-bold uppercase text-zinc-600 pb-1.5 border-b border-zinc-200">
                <span className="w-8">Cant</span>
                <span className="flex-1 px-1">Descripción</span>
                <span className="w-16 text-right">Importe</span>
              </div>

              <div className="space-y-1.5 pt-2">
                {items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start text-[11px]">
                    <span className="w-8 font-bold">{item.cantidad}x</span>
                    <div className="flex-1 px-1 leading-snug">
                      <p className="font-semibold text-zinc-900">{item.nombre}</p>
                      {item.precioUnitario > 0 && (
                        <p className="text-[10px] text-zinc-500 font-sans">
                          ${item.precioUnitario.toFixed(2)} c/u
                        </p>
                      )}
                    </div>
                    <span className="w-16 text-right font-bold text-zinc-900">
                      {item.subtotal > 0 ? `$${item.subtotal.toFixed(2)}` : '—'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Resumen de Totales */}
            <div className="py-3 border-b border-dashed border-zinc-400 space-y-1 text-[11px]">
              <div className="flex justify-between text-zinc-600">
                <span>Subtotal (Base):</span>
                <span>${subtotalSinIva.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-zinc-600">
                <span>IVA (16% Incluido):</span>
                <span>${ivaCalculado.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-baseline pt-2 border-t border-zinc-300 text-sm font-black">
                <span className="text-base uppercase">Total:</span>
                <span className="text-lg font-black">${pedido.total.toFixed(2)}</span>
              </div>
            </div>

            {/* Propinas Sugeridas */}
            <div className="py-2.5 border-b border-dashed border-zinc-400 text-[10px] text-zinc-600 space-y-0.5">
              <p className="font-bold uppercase tracking-wider text-zinc-800">Propina Sugerida (Voluntaria):</p>
              <div className="flex justify-between">
                <span>10%: ${propina10.toFixed(2)}</span>
                <span>Total: ${(pedido.total + propina10).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>15%: ${propina15.toFixed(2)}</span>
                <span>Total: ${(pedido.total + propina15).toFixed(2)}</span>
              </div>
            </div>

            {/* Mensaje de Despedida */}
            <div className="pt-3 text-center text-[10px] text-zinc-600 font-sans space-y-1">
              <p className="font-bold text-zinc-800">¡GRACIAS POR SU PREFERENCIA!</p>
              <p>Esperamos que haya disfrutado de nuestra Terraza.</p>
              <p className="text-[9px] text-zinc-400 mt-1">Este documento es un comprobante de consumo interno.</p>
            </div>
          </div>
        </div>

        {/* Botones de acción inferiores (no se imprimen) */}
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
            <span>🖨️</span> Imprimir Ticket
          </button>
        </div>
      </div>
    </div>
  );
}

