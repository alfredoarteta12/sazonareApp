'use client';

import { useState, useTransition, useEffect } from 'react';
import {
  getDatosCierreHoy,
  registrarCierreCaja,
  DatosCierreHoy,
} from '../actions/cierre-caja-actions';
import { TicketReporteZModal, CierreCajaData } from './ticket-reporte-z-modal';

interface ArqueoCajaModalProps {
  onCerrar: () => void;
  onCierreCompletado?: () => void;
}

const DENOMINACIONES_BILLETES = [
  { label: '$100.000', valor: 100000 },
  { label: '$50.000', valor: 50000 },
  { label: '$20.000', valor: 20000 },
  { label: '$10.000', valor: 10000 },
  { label: '$5.000', valor: 5000 },
  { label: '$2.000', valor: 2000 },
];

const DENOMINACIONES_MONEDAS = [
  { label: '$1.000', valor: 1000 },
  { label: '$500', valor: 500 },
  { label: '$200', valor: 200 },
  { label: '$100', valor: 100 },
  { label: '$50', valor: 50 },
];

export function ArqueoCajaModal({ onCerrar, onCierreCompletado }: ArqueoCajaModalProps) {
  const [cargando, setCargando] = useState(true);
  const [datosHoy, setDatosHoy] = useState<DatosCierreHoy | null>(null);
  const [isPending, startTransition] = useTransition();

  // Estados del formulario
  const [responsable, setResponsable] = useState('');
  const [baseInicial, setBaseInicial] = useState<number | string>(100000);
  const [retiros, setRetiros] = useState<number | string>('');
  const [efectivoReal, setEfectivoReal] = useState<number | string>('');
  const [observaciones, setObservaciones] = useState('');

  // Contador de billetes y monedas
  const [mostrarCalculadora, setMostrarCalculadora] = useState(false);
  const [conteoBilletes, setConteoBilletes] = useState<Record<number, number>>({});

  // Modal de ticket Z generado
  const [cierreGenerado, setCierreGenerado] = useState<CierreCajaData | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    async function cargar() {
      setCargando(true);
      const res = await getDatosCierreHoy();
      if (res.success && res.data) {
        setDatosHoy(res.data);
        setResponsable(res.data.responsableSugerido || 'Administrador');

        // Si ya hay un cierre hoy, inicializar con esos datos
        if (res.data.cierreExistente) {
          setBaseInicial(res.data.cierreExistente.baseInicial);
          setRetiros(res.data.cierreExistente.retiros || '');
          setEfectivoReal(res.data.cierreExistente.efectivoReal || '');
          setResponsable(res.data.cierreExistente.responsable);
          setObservaciones(res.data.cierreExistente.observaciones || '');
        }
      }
      setCargando(false);
    }
    cargar();
  }, []);

  // Actualizar efectivoReal cuando se usan las denominaciones
  const actualizarConteo = (valor: number, cantidad: number) => {
    const nuevoConteo = { ...conteoBilletes, [valor]: Math.max(0, cantidad) };
    setConteoBilletes(nuevoConteo);

    let sumaTotal = 0;
    for (const [v, c] of Object.entries(nuevoConteo)) {
      sumaTotal += Number(v) * (c || 0);
    }
    setEfectivoReal(sumaTotal === 0 ? '' : sumaTotal);
  };

  const ventasEfectivo = datosHoy?.ventasEfectivo || 0;
  const ventasTransf = datosHoy?.ventasTransf || 0;
  const totalVentas = datosHoy?.totalVentas || 0;
  const efectivoEsperado = (Number(baseInicial) || 0) + ventasEfectivo - (Number(retiros) || 0);
  const diferencia = (Number(efectivoReal) || 0) - efectivoEsperado;

  const diferenciaEsCero = Math.abs(diferencia) < 0.01;
  const diferenciaEsSobrante = diferencia > 0.01;
  const diferenciaEsFaltante = diferencia < -0.01;

  const handleGuardarCierre = () => {
    setErrorMsg('');
    if (!responsable.trim()) {
      setErrorMsg('Por favor ingresa el nombre del responsable del arqueo.');
      return;
    }

    startTransition(async () => {
      const res = await registrarCierreCaja({
        responsable,
        baseInicial: Number(baseInicial) || 0,
        retiros: Number(retiros) || 0,
        efectivoReal: Number(efectivoReal) || 0,
        observaciones: observaciones.trim() || undefined,
      });

      if (res.success && res.data) {
        setCierreGenerado(res.data as CierreCajaData);
        setBaseInicial(100000);
        setRetiros('');
        setEfectivoReal('');
        setObservaciones('');
        setConteoBilletes({});
        if (onCierreCompletado) onCierreCompletado();
      } else {
        setErrorMsg(res.error || 'Ocurrió un error al registrar el cierre.');
      }
    });
  };

  if (cierreGenerado) {
    return (
      <TicketReporteZModal
        cierre={cierreGenerado}
        onCerrar={() => {
          setCierreGenerado(null);
          onCerrar();
        }}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-2 sm:p-4 backdrop-blur-sm">
      <div className="fixed inset-0" onClick={onCerrar} />

      <div className="relative z-10 flex max-h-[94dvh] w-full max-w-2xl flex-col rounded-3xl border border-zinc-800 bg-zinc-950 p-4 sm:p-6 shadow-2xl pb-safe">
        {/* Cabecera del Modal */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-500/10 border border-orange-500/30 text-2xl">
              🔒
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-white text-base sm:text-lg">
                  Arqueo y Cierre de Caja Diario
                </h3>
                {datosHoy?.yaCerrado && (
                  <span className="rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                    Cerrado Hoy
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400">
                Auditoría de efectivo físico vs. ventas del sistema (Reporte Z)
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

        {/* CONTENIDO SCROLLEABLE */}
        <div className="flex-1 overflow-y-auto py-4 space-y-5 no-scrollbar">
          {cargando ? (
            <div className="py-16 text-center text-zinc-400">
              <div className="h-8 w-8 mx-auto mb-3 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
              <p className="text-sm font-semibold">Calculando ventas del turno...</p>
            </div>
          ) : (
            <>
              {/* ALERTA DE PEDIDOS PENDIENTES SI LOS HAY */}
              {datosHoy && datosHoy.pedidosPendientes > 0 && (
                <div className="rounded-2xl border border-amber-900/60 bg-amber-950/30 p-3.5 flex items-start gap-3">
                  <span className="text-xl">⚠️</span>
                  <div className="text-xs text-amber-200">
                    <p className="font-bold">Hay {datosHoy.pedidosPendientes} pedidos en cocina/mesa aún sin cobrar.</p>
                    <p className="text-amber-300/80 mt-0.5">
                      Para un arqueo exacto, asegúrate de marcar como PAGADO o CANCELAR las comandas que no correspondan antes de cerrar la caja.
                    </p>
                  </div>
                </div>
              )}

              {/* RESUMEN DE VENTAS DEL SISTEMA */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-3">
                  <span className="text-[11px] font-semibold text-zinc-400">💵 Ventas Efectivo:</span>
                  <p className="text-lg font-black text-white mt-0.5">${ventasEfectivo.toFixed(2)}</p>
                </div>
                <div className="rounded-2xl border border-blue-900/40 bg-blue-950/20 p-3">
                  <span className="text-[11px] font-semibold text-blue-300">📲 Ventas Transf:</span>
                  <p className="text-lg font-black text-blue-200 mt-0.5">${ventasTransf.toFixed(2)}</p>
                </div>
                <div className="col-span-2 sm:col-span-1 rounded-2xl border border-emerald-900/40 bg-emerald-950/20 p-3">
                  <span className="text-[11px] font-semibold text-emerald-300">💰 Total Ventas:</span>
                  <p className="text-lg font-black text-emerald-300 mt-0.5">${totalVentas.toFixed(2)}</p>
                  <p className="text-[10px] text-zinc-400">{datosHoy?.totalPedidos} pedidos pagados</p>
                </div>
              </div>

              {/* FORMULARIO DE ARQUEO */}
              <div className="space-y-4 rounded-3xl border border-zinc-800 bg-zinc-900/40 p-4 sm:p-5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Datos del Arqueo de Efectivo
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Responsable */}
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                      Cajero / Responsable
                    </label>
                    <input
                      type="text"
                      value={responsable}
                      onChange={(e) => setResponsable(e.target.value)}
                      placeholder="Ej: Administrador / Samuel"
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-sm text-white focus:border-orange-500 focus:outline-none"
                    />
                  </div>

                  {/* Base Inicial */}
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                      Base Inicial de Caja (Fondo de cambio)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-2.5 text-zinc-500 text-sm">$</span>
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        placeholder="100000"
                        value={baseInicial === 0 || baseInicial === '0' ? '' : baseInicial}
                        onChange={(e) => setBaseInicial(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full rounded-xl border border-zinc-800 bg-zinc-900 pl-8 pr-3.5 py-2 text-sm font-bold text-white focus:border-orange-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Retiros o Gastos Menores */}
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                      Retiros / Gastos de Caja Menor (Salidas)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-2.5 text-zinc-500 text-sm">$</span>
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        placeholder="0"
                        value={retiros === 0 || retiros === '0' ? '' : retiros}
                        onChange={(e) => setRetiros(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full rounded-xl border border-zinc-800 bg-zinc-900 pl-8 pr-3.5 py-2 text-sm font-bold text-rose-300 focus:border-orange-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Efectivo Físico Contado */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-medium text-zinc-300">
                        Efectivo Físico Contado (En mano)
                      </label>
                      <button
                        type="button"
                        onClick={() => setMostrarCalculadora(!mostrarCalculadora)}
                        className="text-[11px] font-bold text-orange-400 hover:text-orange-300 transition-colors"
                      >
                        {mostrarCalculadora ? 'Ocultar contador' : '🧮 Contar billetes/monedas'}
                      </button>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3.5 top-2.5 text-zinc-500 text-sm">$</span>
                      <input
                        type="number"
                        min="0"
                        step="500"
                        placeholder="0"
                        value={efectivoReal === 0 || efectivoReal === '0' ? '' : efectivoReal}
                        onChange={(e) => setEfectivoReal(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full rounded-xl border border-zinc-800 bg-zinc-900 pl-8 pr-3.5 py-2 text-sm font-black text-emerald-300 focus:border-orange-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* CALCULADORA DE DENOMINACIONES COLOMBIANAS */}
                {mostrarCalculadora && (
                  <div className="rounded-2xl border border-orange-500/30 bg-orange-950/10 p-4 space-y-4 animate-in fade-in">
                    <div className="flex items-center justify-between border-b border-orange-500/20 pb-2">
                      <p className="text-xs font-black text-orange-400 uppercase tracking-wider">
                        Contador de Denominaciones (COP)
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setConteoBilletes({});
                          setEfectivoReal('');
                        }}
                        className="text-[10px] text-zinc-400 hover:text-white"
                      >
                        Reiniciar conteo
                      </button>
                    </div>

                    {/* Billetes */}
                    <div>
                      <p className="text-[11px] font-bold text-zinc-300 mb-2">💵 Billetes:</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {DENOMINACIONES_BILLETES.map((d) => (
                          <div key={d.valor} className="flex items-center gap-2 rounded-xl bg-zinc-900 border border-zinc-800 p-2">
                            <span className="text-xs font-bold text-white w-16">{d.label}:</span>
                            <input
                              type="number"
                              min="0"
                              placeholder="0"
                              value={conteoBilletes[d.valor] ? conteoBilletes[d.valor] : ''}
                              onChange={(e) => actualizarConteo(d.valor, e.target.value === '' ? 0 : parseInt(e.target.value) || 0)}
                              className="w-full rounded-lg bg-zinc-950 border border-zinc-800 px-2 py-1 text-xs text-center text-white focus:border-orange-500 focus:outline-none"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Monedas */}
                    <div>
                      <p className="text-[11px] font-bold text-zinc-300 mb-2">🪙 Monedas:</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {DENOMINACIONES_MONEDAS.map((d) => (
                          <div key={d.valor} className="flex items-center gap-2 rounded-xl bg-zinc-900 border border-zinc-800 p-2">
                            <span className="text-xs font-bold text-white w-16">{d.label}:</span>
                            <input
                              type="number"
                              min="0"
                              placeholder="0"
                              value={conteoBilletes[d.valor] ? conteoBilletes[d.valor] : ''}
                              onChange={(e) => actualizarConteo(d.valor, e.target.value === '' ? 0 : parseInt(e.target.value) || 0)}
                              className="w-full rounded-lg bg-zinc-950 border border-zinc-800 px-2 py-1 text-xs text-center text-white focus:border-orange-500 focus:outline-none"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* COMPARATIVA AUTOMÁTICA Y CUADRE */}
                <div
                  className={`rounded-2xl border p-4 sm:p-5 transition-all ${
                    diferenciaEsCero
                      ? 'border-emerald-500/40 bg-emerald-950/20'
                      : diferenciaEsSobrante
                      ? 'border-blue-500/40 bg-blue-950/20'
                      : 'border-rose-500/40 bg-rose-950/20'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold text-zinc-400">
                        Efectivo Esperado (Base + Ventas - Retiros):
                      </p>
                      <p className="text-lg font-black text-white">
                        ${efectivoEsperado.toFixed(2)}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xs font-semibold text-zinc-400">
                        Diferencia de Caja:
                      </p>
                      <p
                        className={`text-xl font-black ${
                          diferenciaEsCero
                            ? 'text-emerald-400'
                            : diferenciaEsSobrante
                            ? 'text-blue-400'
                            : 'text-rose-400'
                        }`}
                      >
                        {diferencia >= 0 ? '+' : ''}${diferencia.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-zinc-800 flex items-center gap-2 text-xs font-bold">
                    {diferenciaEsCero && (
                      <span className="text-emerald-400">
                        🟢 ¡Cuadre Exacto! El efectivo físico coincide perfectamente con el sistema.
                      </span>
                    )}
                    {diferenciaEsSobrante && (
                      <span className="text-blue-300">
                        🔵 Sobrante de caja: Tienes ${diferencia.toFixed(2)} más de lo registrado.
                      </span>
                    )}
                    {diferenciaEsFaltante && (
                      <span className="text-rose-400">
                        🔴 Faltante de caja: Hacen falta ${Math.abs(diferencia).toFixed(2)} en efectivo.
                      </span>
                    )}
                  </div>
                </div>

                {/* Observaciones */}
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                    Observaciones o Justificación de Descuadre (Opcional)
                  </label>
                  <textarea
                    rows={2}
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    placeholder="Ej: Se compraron bolsas de hielo por $10.000 (factura anexa)..."
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:border-orange-500 focus:outline-none"
                  />
                </div>

                {errorMsg && (
                  <p className="text-xs font-bold text-rose-400">{errorMsg}</p>
                )}
              </div>
            </>
          )}
        </div>

        {/* Acciones Inferiores */}
        <div className="flex gap-3 pt-4 border-t border-zinc-800">
          <button
            type="button"
            onClick={onCerrar}
            disabled={isPending}
            className="flex-1 rounded-xl bg-zinc-900 border border-zinc-800 py-3 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            Cancelar
          </button>

          {datosHoy?.cierreExistente && (
            <button
              type="button"
              onClick={() => setCierreGenerado(datosHoy.cierreExistente as CierreCajaData)}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-zinc-800 border border-zinc-700 px-4 py-3 text-xs font-bold text-zinc-200 hover:bg-zinc-700 hover:text-white transition-colors"
            >
              <span>🖨️</span> Ver Ticket Z de Hoy
            </button>
          )}

          <button
            type="button"
            onClick={handleGuardarCierre}
            disabled={isPending || cargando}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 py-3 text-xs font-bold text-white shadow-lg shadow-orange-500/25 hover:from-orange-600 hover:to-amber-600 active:scale-95 transition-all disabled:opacity-50"
          >
            {isPending ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Registrando...</span>
              </>
            ) : (
              <>
                <span>🔒</span>
                <span>Confirmar y Cerrar Caja</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

