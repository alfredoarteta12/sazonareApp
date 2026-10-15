'use client';

import { useState, useTransition } from 'react';
import { Pedido } from '../hooks/use-realtime-orders';
import { OrderStatusStepper } from './order-status-stepper';
import { TicketReciboModal } from './ticket-recibo-modal';
import { parseDetallePedido } from '../utils/parse-order-detail';
import { marcarComoEntregado, cobrarPedidoYLiberarMesa } from '../actions/order-mutations';

interface MesaDetalleModalProps {
  mesa: number;
  pedido: Pedido;
  nombreMesero?: string;
  onCerrar: () => void;
  onAgregarPlatillos: (mesa: number) => void;
}

export function MesaDetalleModal({
  mesa,
  pedido: pedidoInicial,
  nombreMesero,
  onCerrar,
  onAgregarPlatillos,
}: MesaDetalleModalProps) {
  const [pedido, setPedido] = useState<Pedido>(pedidoInicial);
  const [mostrandoRecibo, setMostrandoRecibo] = useState(false);
  const [modoCobro, setModoCobro] = useState(pedidoInicial.estado === 'ENTREGADO');
  const [metodoPago, setMetodoPago] = useState<'EFECTIVO' | 'TRANSFERENCIA'>('EFECTIVO');
  const [montoRecibido, setMontoRecibido] = useState<string>('');
  const [isPending, startTransition] = useTransition();
  const [mensaje, setMensaje] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);

  const items = parseDetallePedido(pedido.detalle, pedido.total);

  // Cálculo del tiempo transcurrido
  const fechaPedido = new Date(pedido.createdAt);
  const ahora = new Date();
  const minutosTranscurridos = Math.max(0, Math.floor((ahora.getTime() - fechaPedido.getTime()) / 60000));

  // Cálculo de cambio si es efectivo
  const valorEfectivo = parseFloat(montoRecibido) || 0;
  const cambio = valorEfectivo >= pedido.total ? valorEfectivo - pedido.total : 0;
  const dineroInsuficiente = metodoPago === 'EFECTIVO' && valorEfectivo > 0 && valorEfectivo < pedido.total;

  const handleMarcarEntregado = () => {
    startTransition(async () => {
      const res = await marcarComoEntregado(pedido.id);
      if (res.success && res.pedido) {
        setPedido(res.pedido as unknown as Pedido);
        setModoCobro(true); // Abrir directamente apartado de cobro
        setMensaje({ tipo: 'exito', texto: '✅ Comanda servida en la mesa. Lista para cobro.' });
        setTimeout(() => setMensaje(null), 3500);
      } else {
        setMensaje({ tipo: 'error', texto: res.error || 'Error al actualizar' });
      }
    });
  };

  const handleProcesarCobro = () => {
    if (metodoPago === 'EFECTIVO' && valorEfectivo < pedido.total && valorEfectivo > 0) {
      setMensaje({ tipo: 'error', texto: 'El monto en efectivo ingresado es menor al total.' });
      return;
    }

    startTransition(async () => {
      const efectivoFinal = metodoPago === 'EFECTIVO' ? (valorEfectivo > 0 ? valorEfectivo : pedido.total) : undefined;
      const res = await cobrarPedidoYLiberarMesa(pedido.id, metodoPago, efectivoFinal);

      if (res.success && res.pedido) {
        setPedido(res.pedido as unknown as Pedido);
        setMensaje({
          tipo: 'exito',
          texto: `🎉 ¡Mesa ${mesa} cobrada (${metodoPago}) y liberada con éxito!`,
        });
        // Esperamos 1.5s para que vea el mensaje y cerramos modal para ver la mesa libre
        setTimeout(() => {
          onCerrar();
        }, 1600);
      } else {
        setMensaje({ tipo: 'error', texto: res.error || 'Error al procesar el cobro.' });
      }
    });
  };

  if (mostrandoRecibo) {
    return (
      <TicketReciboModal
        pedido={pedido}
        nombreMesero={nombreMesero}
        onCerrar={() => setMostrandoRecibo(false)}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-4 backdrop-blur-sm">
      <div className="fixed inset-0" onClick={onCerrar} />

      <div className="relative z-10 flex max-h-[92vh] w-full max-w-lg flex-col rounded-3xl border border-zinc-800 bg-zinc-950 p-4 sm:p-6 shadow-2xl">
        {/* Cabecera */}
        <div className="flex items-center justify-between pb-3.5 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-500/10 border border-orange-500/30 text-2xl">
              🌿
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white">Mesa {mesa}</h3>
                <span className="rounded-full bg-orange-500/20 px-2 py-0.5 text-[10px] font-bold text-orange-400 border border-orange-500/30">
                  Terraza
                </span>
                {pedido.estado === 'PAGADO' && (
                  <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                    ✓ Pagada
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400">
                Orden iniciada hace {minutosTranscurridos} {minutosTranscurridos === 1 ? 'minuto' : 'minutos'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCerrar}
            className="rounded-xl p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Contenido deslizable */}
        <div className="flex-1 overflow-y-auto py-4 space-y-5 pr-1">
          {/* LÍNEA DE TIEMPO DEL ESTADO */}
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">
              Estado de la Mesa
            </p>
            <OrderStatusStepper estado={pedido.estado} />
          </div>

          {/* MENSAJES DE ALERTA */}
          {mensaje && (
            <div
              className={`rounded-2xl p-3 text-center text-xs font-bold border transition-all ${
                mensaje.tipo === 'exito'
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700 shadow-lg shadow-emerald-950/40'
                  : 'bg-rose-950/80 text-rose-300 border-rose-800 shadow-lg shadow-rose-950/40'
              }`}
            >
              {mensaje.texto}
            </div>
          )}

          {/* SECCIÓN / APARTADO DE PAGO (Efectivo o Transferencia) */}
          {pedido.estado !== 'PAGADO' && (
            <div className="rounded-2xl border-2 border-orange-500/30 bg-gradient-to-b from-orange-950/10 to-zinc-900/40 p-4 shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">💳</span>
                  <h4 className="text-sm font-extrabold text-white">
                    Apartado de Cobro & Liberar Mesa
                  </h4>
                </div>
                <span className="text-xs font-bold text-orange-400">
                  Total: ${pedido.total.toFixed(2)}
                </span>
              </div>

              {/* Selector de Método de Pago */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setMetodoPago('EFECTIVO')}
                  className={`flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 text-xs font-bold transition-all border ${
                    metodoPago === 'EFECTIVO'
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/30 ring-2 ring-emerald-400/30'
                      : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white hover:bg-zinc-800'
                  }`}
                >
                  <span className="text-base">💵</span> Efectivo
                </button>

                <button
                  type="button"
                  onClick={() => setMetodoPago('TRANSFERENCIA')}
                  className={`flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 text-xs font-bold transition-all border ${
                    metodoPago === 'TRANSFERENCIA'
                      ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/30 ring-2 ring-blue-400/30'
                      : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white hover:bg-zinc-800'
                  }`}
                >
                  <span className="text-base">📲</span> Transferencia
                </button>
              </div>

              {/* DETALLES DE EFECTIVO */}
              {metodoPago === 'EFECTIVO' ? (
                <div className="space-y-2.5 rounded-xl bg-black/40 border border-zinc-800 p-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400">Efectivo recibido:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-zinc-400 font-bold">$</span>
                      <input
                        type="number"
                        step="any"
                        placeholder={pedido.total.toFixed(2)}
                        value={montoRecibido}
                        onChange={(e) => setMontoRecibido(e.target.value)}
                        className="w-28 rounded-lg bg-zinc-900 border border-zinc-700 px-2 py-1 text-right text-sm font-bold text-white focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Botones de sugerencia rápida de billetes */}
                  <div className="flex gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setMontoRecibido(pedido.total.toString())}
                      className="flex-1 rounded-lg bg-zinc-800/80 border border-zinc-700/80 py-1 text-[11px] font-bold text-zinc-300 hover:bg-zinc-700"
                    >
                      Exacto
                    </button>
                    {[100, 200, 500].map((billete) => (
                      <button
                        key={billete}
                        type="button"
                        onClick={() => setMontoRecibido(billete.toString())}
                        className="flex-1 rounded-lg bg-zinc-800/80 border border-zinc-700/80 py-1 text-[11px] font-bold text-zinc-300 hover:bg-zinc-700"
                      >
                        ${billete}
                      </button>
                    ))}
                  </div>

                  {/* Cálculo de vuelto/cambio */}
                  <div className="flex items-center justify-between pt-2 border-t border-zinc-800 text-xs">
                    <span className="font-semibold text-zinc-300">Cambio a entregar:</span>
                    <span
                      className={`text-sm font-black ${
                        dineroInsuficiente ? 'text-rose-400' : 'text-emerald-400'
                      }`}
                    >
                      {dineroInsuficiente
                        ? `Faltan $${(pedido.total - valorEfectivo).toFixed(2)}`
                        : `$${cambio.toFixed(2)}`}
                    </span>
                  </div>
                </div>
              ) : (
                /* DETALLES DE TRANSFERENCIA */
                <div className="rounded-xl bg-black/40 border border-zinc-800 p-3 text-xs text-zinc-300 space-y-1">
                  <p className="font-semibold text-blue-400 flex items-center gap-1.5">
                    <span>✓</span> Pago por Transferencia Bancaria
                  </p>
                  <p className="text-[11px] text-zinc-400">
                    Solicita al cliente el comprobante o notificación bancaria por el importe total de{' '}
                    <strong className="text-white">${pedido.total.toFixed(2)}</strong> antes de liberar la mesa.
                  </p>
                </div>
              )}

              {/* Botón de Confirmación de Cobro */}
              <button
                type="button"
                onClick={handleProcesarCobro}
                disabled={isPending || dineroInsuficiente}
                className="mt-3 w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 py-3 text-xs sm:text-sm font-extrabold text-white shadow-lg shadow-emerald-600/30 hover:from-emerald-500 hover:to-emerald-400 active:scale-98 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span>💰</span>
                {isPending
                  ? 'Registrando cobro...'
                  : `Confirmar Pago (${metodoPago}) y Liberar Mesa ${mesa}`}
              </button>
            </div>
          )}

          {/* DETALLE DE PLATILLOS */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Platillos en Comanda
              </p>
              <span className="text-xs font-bold text-zinc-300">
                {items.reduce((acc, i) => acc + i.cantidad, 0)} ítems
              </span>
            </div>

            <div className="space-y-2">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-3 rounded-xl bg-zinc-900 border border-zinc-800/80 p-3"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-orange-500/10 text-orange-400 font-bold text-xs border border-orange-500/20">
                      {item.cantidad}x
                    </span>
                    <span className="text-sm font-semibold text-white truncate">{item.nombre}</span>
                  </div>
                  {item.subtotal > 0 && (
                    <span className="text-sm font-bold text-orange-400 shrink-0">
                      ${item.subtotal.toFixed(2)}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Total acumulado */}
            <div className="mt-3 flex items-center justify-between rounded-xl bg-zinc-900/90 border border-zinc-800 p-3.5">
              <span className="text-sm font-semibold text-zinc-300">Total comanda</span>
              <span className="text-xl font-black text-white">${pedido.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Acciones del pie */}
        <div className="pt-3.5 border-t border-zinc-800 space-y-2 shrink-0">
          {/* Botón para marcar entregado si aún está en preparación */}
          {pedido.estado !== 'ENTREGADO' && pedido.estado !== 'PAGADO' && pedido.estado !== 'CANCELADO' && (
            <button
              type="button"
              onClick={handleMarcarEntregado}
              disabled={isPending}
              className={`w-full py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
                pedido.estado === 'HECHO'
                  ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 animate-pulse'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
              }`}
            >
              <span>🍽️</span> {isPending ? 'Actualizando...' : 'Confirmar Comanda Servida en Mesa'}
            </button>
          )}

          <div className="flex gap-2">
            {pedido.estado !== 'PAGADO' && (
              <button
                type="button"
                onClick={() => {
                  onCerrar();
                  onAgregarPlatillos(mesa);
                }}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-zinc-900 border border-zinc-700 py-2.5 text-xs font-bold text-zinc-200 hover:bg-zinc-800 hover:text-white transition-colors"
              >
                <span>➕</span> Agregar Platillos
              </button>
            )}

            <button
              type="button"
              onClick={() => setMostrandoRecibo(true)}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-orange-500 py-2.5 text-xs font-bold text-white shadow-lg shadow-orange-500/30 hover:bg-orange-600 active:scale-95 transition-all"
            >
              <span>🧾</span> Ver Recibo / Ticket
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
