'use client';

import { useState, useTransition } from 'react';
import { Pedido } from '../hooks/use-realtime-orders';
import { OrderStatusStepper } from './order-status-stepper';
import { TicketReciboModal } from './ticket-recibo-modal';
import { parseDetallePedido } from '../utils/parse-order-detail';
import { marcarComoEntregado, cobrarPedidoYLiberarMesa } from '../actions/order-mutations';
import { formatearCOP } from '@/lib/currency';

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
  const [metodoPago, setMetodoPago] = useState<'EFECTIVO' | 'TRANSFERENCIA' | 'DIVIDIDO'>('EFECTIVO');
  const [montoRecibido, setMontoRecibido] = useState<string>('');

  // Estados para Pago Dividido
  const [montoDivididoEfectivo, setMontoDivididoEfectivo] = useState<string>('');
  const [montoDivididoTransf, setMontoDivididoTransf] = useState<string>('');
  const [efectivoRecibidoDividido, setEfectivoRecibidoDividido] = useState<string>('');

  const [isPending, startTransition] = useTransition();
  const [mensaje, setMensaje] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);

  const items = parseDetallePedido(pedido.detalle, pedido.total);

  // Cálculo del tiempo transcurrido
  const fechaPedido = new Date(pedido.createdAt);
  const ahora = new Date();
  const minutosTranscurridos = Math.max(0, Math.floor((ahora.getTime() - fechaPedido.getTime()) / 60000));

  // Cálculos para Efectivo Completo
  const valorEfectivo = parseFloat(montoRecibido) || 0;
  const cambio = valorEfectivo >= pedido.total ? valorEfectivo - pedido.total : 0;
  const dineroInsuficiente = metodoPago === 'EFECTIVO' && valorEfectivo > 0 && valorEfectivo < pedido.total;

  // Cálculos para Pago Dividido
  const valorDivididoEfectivo = parseFloat(montoDivididoEfectivo) || 0;
  const valorDivididoTransf = parseFloat(montoDivididoTransf) || 0;
  const sumaDividido = Math.round((valorDivididoEfectivo + valorDivididoTransf) * 100) / 100;
  const totalRedondeado = Math.round(pedido.total * 100) / 100;
  const cuadreExactoDividido = Math.abs(sumaDividido - totalRedondeado) < 0.01 && totalRedondeado > 0;

  const valorRecibidoDividido = parseFloat(efectivoRecibidoDividido) || 0;
  const efectivoDivididoInsuficiente =
    metodoPago === 'DIVIDIDO' &&
    valorRecibidoDividido > 0 &&
    valorRecibidoDividido < valorDivididoEfectivo;
  const cambioDividido =
    valorRecibidoDividido >= valorDivididoEfectivo
      ? valorRecibidoDividido - valorDivididoEfectivo
      : 0;

  const esLlevar = pedido.tipoPedido === 'LLEVAR' || pedido.detalle.includes('[PARA LLEVAR');
  const esDomicilio = pedido.tipoPedido === 'DOMICILIO' || pedido.detalle.includes('[DOMICILIO');

  const handleMarcarEntregado = () => {
    startTransition(async () => {
      const res = await marcarComoEntregado(pedido.id);
      if (res.success && res.pedido) {
        setPedido(res.pedido as unknown as Pedido);
        const textoExito = esLlevar
          ? '✅ Pedido entregado al cliente en mostrador.'
          : esDomicilio
          ? '✅ Domicilio despachado y entregado con éxito.'
          : '✅ Comanda servida en la mesa. Lista para cobro.';
        setMensaje({ tipo: 'exito', texto: textoExito });
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

    if (metodoPago === 'DIVIDIDO') {
      if (!cuadreExactoDividido) {
        setMensaje({
          tipo: 'error',
          texto: `La suma de Efectivo (${formatearCOP(valorDivididoEfectivo)}) y Transf (${formatearCOP(valorDivididoTransf)}) debe sumar exactamente ${formatearCOP(pedido.total)}.`,
        });
        return;
      }
      if (efectivoDivididoInsuficiente) {
        setMensaje({ tipo: 'error', texto: 'El efectivo recibido es menor a la porción en efectivo.' });
        return;
      }
    }

    startTransition(async () => {
      let res;
      if (metodoPago === 'DIVIDIDO') {
        res = await cobrarPedidoYLiberarMesa(pedido.id, 'DIVIDIDO', undefined, {
          efectivo: valorDivididoEfectivo,
          transferencia: valorDivididoTransf,
          efectivoRecibido: valorRecibidoDividido > 0 ? valorRecibidoDividido : valorDivididoEfectivo,
        });
      } else {
        const efectivoFinal =
          metodoPago === 'EFECTIVO'
            ? valorEfectivo > 0
              ? valorEfectivo
              : pedido.total
            : undefined;
        res = await cobrarPedidoYLiberarMesa(pedido.id, metodoPago, efectivoFinal);
      }

      if (res.success && res.pedido) {
        setPedido(res.pedido as unknown as Pedido);
        setMontoRecibido('');
        setMontoDivididoEfectivo('');
        setMontoDivididoTransf('');
        setEfectivoRecibidoDividido('');

        const textoCobro = esLlevar
          ? `🎉 ¡Pedido Para Llevar cobrado (${metodoPago}) con éxito!`
          : esDomicilio
          ? `🎉 ¡Domicilio cobrado (${metodoPago}) con éxito!`
          : `🎉 ¡Mesa ${mesa} cobrada (${metodoPago}) y liberada con éxito!`;
        setMensaje({
          tipo: 'exito',
          texto: textoCobro,
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

  const botonCobroDeshabilitado =
    isPending ||
    (metodoPago === 'EFECTIVO' && dineroInsuficiente) ||
    (metodoPago === 'DIVIDIDO' && (!cuadreExactoDividido || efectivoDivididoInsuficiente));

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-2 sm:p-4 backdrop-blur-sm">
      <div className="fixed inset-0" onClick={onCerrar} />

      <div className="relative z-10 flex max-h-[94dvh] w-full max-w-lg flex-col rounded-3xl border border-zinc-800 bg-zinc-950 p-3.5 sm:p-6 shadow-2xl pb-safe">
        {/* Cabecera */}
        <div className="flex items-center justify-between pb-3.5 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-500/10 border border-orange-500/30 text-2xl">
              {esLlevar ? '🛍️' : esDomicilio ? '🛵' : '🌿'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white">
                  {esLlevar
                    ? 'Para Llevar'
                    : esDomicilio
                    ? 'Domicilio'
                    : `Mesa ${mesa}`}
                </h3>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                  esLlevar
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    : esDomicilio
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                    : 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                }`}>
                  {esLlevar ? 'Mostrador' : esDomicilio ? 'Envío' : 'Terraza'}
                </span>
                {pedido.estado === 'PAGADO' && (
                  <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                    ✓ Pagado
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400">
                {pedido.cliente ? `Cliente: ${pedido.cliente} • ` : ''}
                Orden de hace {minutosTranscurridos} {minutosTranscurridos === 1 ? 'min' : 'mins'}
              </p>
              {esDomicilio && pedido.direccion && (
                <p className="text-[11px] text-cyan-300/90 truncate max-w-[280px]">
                  📍 {pedido.direccion} {pedido.telefono ? `• 📞 ${pedido.telefono}` : ''}
                </p>
              )}
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

          {/* SECCIÓN / APARTADO DE PAGO */}
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
                  Total: {formatearCOP(pedido.total)}
                </span>
              </div>

              {/* Selector de Método de Pago: Efectivo, Transferencia o Dividido */}
              <div className="grid grid-cols-3 gap-1.5 mb-3">
                <button
                  type="button"
                  onClick={() => setMetodoPago('EFECTIVO')}
                  className={`flex items-center justify-center gap-1 rounded-xl py-2 px-1 text-xs font-bold transition-all border ${
                    metodoPago === 'EFECTIVO'
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/30 ring-2 ring-emerald-400/30'
                      : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white hover:bg-zinc-800'
                  }`}
                >
                  <span className="text-sm">💵</span> Efectivo
                </button>

                <button
                  type="button"
                  onClick={() => setMetodoPago('TRANSFERENCIA')}
                  className={`flex items-center justify-center gap-1 rounded-xl py-2 px-1 text-xs font-bold transition-all border ${
                    metodoPago === 'TRANSFERENCIA'
                      ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/30 ring-2 ring-blue-400/30'
                      : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white hover:bg-zinc-800'
                  }`}
                >
                  <span className="text-sm">📲</span> Transf
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMetodoPago('DIVIDIDO');
                    // Sugerir 50% / 50% si están vacíos
                    if (!montoDivididoEfectivo && !montoDivididoTransf) {
                      const mitad = Math.round(pedido.total / 2);
                      const resto = Math.round(pedido.total - mitad);
                      setMontoDivididoEfectivo(mitad.toString());
                      setMontoDivididoTransf(resto.toString());
                    }
                  }}
                  className={`flex items-center justify-center gap-1 rounded-xl py-2 px-1 text-xs font-bold transition-all border ${
                    metodoPago === 'DIVIDIDO'
                      ? 'bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-600/30 ring-2 ring-purple-400/30'
                      : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white hover:bg-zinc-800'
                  }`}
                >
                  <span className="text-sm">⚖️</span> Dividido
                </button>
              </div>

              {/* DETALLES DE PAGO SEGÚN MÉTODO */}
              {metodoPago === 'EFECTIVO' ? (
                /* EFECTIVO COMPLETO */
                <div className="space-y-2.5 rounded-xl bg-black/40 border border-zinc-800 p-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400">Efectivo recibido:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-zinc-400 font-bold">$</span>
                      <input
                        type="number"
                        step="1000"
                        min="0"
                        placeholder={pedido.total > 0 ? pedido.total.toString() : '0'}
                        value={montoRecibido === '0' ? '' : montoRecibido}
                        onChange={(e) => setMontoRecibido(e.target.value)}
                        className="w-32 rounded-lg bg-zinc-900 border border-zinc-700 px-2 py-1 text-right text-sm font-bold text-white focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Sugerencias rápidas de billetes de Colombia */}
                  <div className="flex gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setMontoRecibido(pedido.total.toString())}
                      className="flex-1 rounded-lg bg-zinc-800/80 border border-zinc-700/80 py-1 text-[11px] font-bold text-zinc-300 hover:bg-zinc-700"
                    >
                      Exacto
                    </button>
                    {[10000, 20000, 50000, 100000].map((billete) => (
                      <button
                        key={billete}
                        type="button"
                        onClick={() => setMontoRecibido(billete.toString())}
                        className="flex-1 rounded-lg bg-zinc-800/80 border border-zinc-700/80 py-1 text-[11px] font-bold text-zinc-300 hover:bg-zinc-700"
                      >
                        {formatearCOP(billete)}
                      </button>
                    ))}
                  </div>

                  {/* Cálculo de cambio */}
                  <div className="flex items-center justify-between pt-2 border-t border-zinc-800 text-xs">
                    <span className="font-semibold text-zinc-300">Cambio a entregar:</span>
                    <span
                      className={`text-sm font-black ${
                        dineroInsuficiente ? 'text-rose-400' : 'text-emerald-400'
                      }`}
                    >
                      {dineroInsuficiente
                        ? `Faltan ${formatearCOP(pedido.total - valorEfectivo)}`
                        : formatearCOP(cambio)}
                    </span>
                  </div>
                </div>
              ) : metodoPago === 'TRANSFERENCIA' ? (
                /* TRANSFERENCIA COMPLETA */
                <div className="rounded-xl bg-black/40 border border-zinc-800 p-3 text-xs text-zinc-300 space-y-1">
                  <p className="font-semibold text-blue-400 flex items-center gap-1.5">
                    <span>✓</span> Pago 100% por Transferencia Bancaria (COP)
                  </p>
                  <p className="text-[11px] text-zinc-400">
                    Solicita al cliente el comprobante de Nequi, Daviplata o Bancolombia por el valor de{' '}
                    <strong className="text-white">{formatearCOP(pedido.total)}</strong> antes de liberar la mesa.
                  </p>
                </div>
              ) : (
                /* PAGO DIVIDIDO (EFECTIVO + TRANSFERENCIA) */
                <div className="space-y-3 rounded-xl bg-black/40 border border-zinc-800 p-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-purple-300 flex items-center gap-1">
                      <span>⚖️</span> Desglose Mixto (COP)
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const mitad = Math.round(pedido.total / 2);
                        const resto = Math.round(pedido.total - mitad);
                        setMontoDivididoEfectivo(mitad.toString());
                        setMontoDivididoTransf(resto.toString());
                      }}
                      className="text-[11px] font-bold text-purple-400 hover:text-purple-300 underline"
                    >
                      Dividir 50% / 50%
                    </button>
                  </div>

                  {/* Fila Efectivo */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-400 flex items-center gap-1">💵 Parte en Efectivo:</span>
                      <div className="flex items-center gap-1">
                        <span className="text-zinc-500 font-bold text-xs">$</span>
                        <input
                          type="number"
                          step="1000"
                          min="0"
                          placeholder="0"
                          value={montoDivididoEfectivo === '0' ? '' : montoDivididoEfectivo}
                          onChange={(e) => {
                            const val = e.target.value;
                            setMontoDivididoEfectivo(val);
                            const num = parseFloat(val) || 0;
                            if (num <= pedido.total) {
                              const resto = Math.max(0, Math.round(pedido.total - num));
                              setMontoDivididoTransf(resto > 0 ? resto.toString() : '');
                            }
                          }}
                          className="w-32 rounded-lg bg-zinc-900 border border-zinc-700 px-2 py-1 text-right text-sm font-bold text-white focus:border-purple-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Fila Transferencia */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-400 flex items-center gap-1">📲 Parte en Transf:</span>
                      <div className="flex items-center gap-1">
                        <span className="text-zinc-500 font-bold text-xs">$</span>
                        <input
                          type="number"
                          step="1000"
                          min="0"
                          placeholder="0"
                          value={montoDivididoTransf === '0' ? '' : montoDivididoTransf}
                          onChange={(e) => {
                            const val = e.target.value;
                            setMontoDivididoTransf(val);
                            const num = parseFloat(val) || 0;
                            if (num <= pedido.total) {
                              const resto = Math.max(0, Math.round(pedido.total - num));
                              setMontoDivididoEfectivo(resto > 0 ? resto.toString() : '');
                            }
                          }}
                          className="w-32 rounded-lg bg-zinc-900 border border-zinc-700 px-2 py-1 text-right text-sm font-bold text-white focus:border-purple-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Indicador reactivo de balance/cuadre */}
                  <div className="flex items-center justify-between pt-2 border-t border-zinc-800 text-xs">
                    <span className="text-zinc-400 font-medium">Total Asignado:</span>
                    <span
                      className={`font-black ${
                        cuadreExactoDividido ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {formatearCOP(sumaDividido)} / {formatearCOP(pedido.total)}
                      {cuadreExactoDividido
                        ? ' ✓ Cuadrado'
                        : ` (Faltan ${formatearCOP(pedido.total - sumaDividido)})`}
                    </span>
                  </div>

                  {/* Detalle de billetes / cambio para la porción en efectivo */}
                  {valorDivididoEfectivo > 0 && (
                    <div className="pt-2 border-t border-dashed border-zinc-800 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-zinc-400">Efectivo recibido:</span>
                        <div className="flex items-center gap-1">
                          <span className="text-zinc-500 font-bold text-xs">$</span>
                          <input
                            type="number"
                            step="1000"
                            min="0"
                            placeholder={valorDivididoEfectivo > 0 ? valorDivididoEfectivo.toString() : '0'}
                            value={efectivoRecibidoDividido === '0' ? '' : efectivoRecibidoDividido}
                            onChange={(e) => setEfectivoRecibidoDividido(e.target.value)}
                            className="w-32 rounded-lg bg-zinc-900 border border-zinc-700 px-2 py-1 text-right text-xs font-bold text-white focus:border-emerald-500 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-zinc-300">Cambio por efectivo:</span>
                        <span
                          className={`text-xs font-black ${
                            efectivoDivididoInsuficiente ? 'text-rose-400' : 'text-emerald-400'
                          }`}
                        >
                          {efectivoDivididoInsuficiente
                            ? `Faltan ${formatearCOP(valorDivididoEfectivo - valorRecibidoDividido)}`
                            : formatearCOP(cambioDividido)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Botón de Confirmación de Cobro */}
              <button
                type="button"
                onClick={handleProcesarCobro}
                disabled={botonCobroDeshabilitado}
                className="mt-3 w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 py-3 text-xs sm:text-sm font-extrabold text-white shadow-lg shadow-emerald-600/30 hover:from-emerald-500 hover:to-emerald-400 active:scale-98 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span>💰</span>
                {isPending
                  ? 'Registrando cobro...'
                  : `Confirmar Pago (${metodoPago}) y Liberar Mesa ${mesa}`}
              </button>
            </div>
          )}

          {/* NOTA O INSTRUCCIONES DE LA COMANDA */}
          {pedido.notas && (
            <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-3 text-xs text-amber-200 flex items-start gap-2.5">
              <span className="text-base shrink-0">📝</span>
              <div className="min-w-0">
                <p className="font-extrabold text-amber-400 uppercase tracking-wider text-[10px]">
                  Indicaciones de la Comanda:
                </p>
                <p className="font-semibold text-white mt-0.5 whitespace-pre-wrap text-xs sm:text-sm">
                  {pedido.notas}
                </p>
              </div>
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
                  className="rounded-xl bg-zinc-900 border border-zinc-800/80 p-3 space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-orange-500/10 text-orange-400 font-bold text-xs border border-orange-500/20">
                        {item.cantidad}x
                      </span>
                      <span className="text-sm font-semibold text-white truncate">{item.nombre}</span>
                    </div>
                    {item.subtotal > 0 && (
                      <span className="text-sm font-bold text-orange-400 shrink-0">
                        {formatearCOP(item.subtotal)}
                      </span>
                    )}
                  </div>

                  {/* Adiciones seleccionadas */}
                  {item.adiciones && item.adiciones.length > 0 && (
                    <div className="flex flex-wrap gap-1 ml-9">
                      {item.adiciones.map((adic, aIdx) => (
                        <span
                          key={aIdx}
                          className="rounded-md bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 text-[10px] font-bold text-amber-300"
                        >
                          🥓 {adic}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Nota especial */}
                  {item.notas && (
                    <p className="ml-9 text-[11px] text-zinc-400 italic bg-zinc-950/60 rounded px-2 py-0.5 border border-zinc-800/60">
                      📝 {item.notas}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Total acumulado */}
            <div className="mt-3 flex items-center justify-between rounded-xl bg-zinc-900/90 border border-zinc-800 p-3.5">
              <span className="text-sm font-semibold text-zinc-300">Total comanda</span>
              <span className="text-xl font-black text-white">{formatearCOP(pedido.total)}</span>
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
              <span>{esLlevar ? '🛍️' : esDomicilio ? '🛵' : '🍽️'}</span>{' '}
              {isPending
                ? 'Actualizando...'
                : esLlevar
                ? 'Confirmar Entrega en Mostrador'
                : esDomicilio
                ? 'Confirmar Despacho / Entrega Domicilio'
                : 'Confirmar Comanda Servida en Mesa'}
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
