'use client';

import { useState } from 'react';
import { Pedido } from '../hooks/use-realtime-orders';
import { MesaDetalleModal } from './mesa-detalle-modal';
import { formatearCOP } from '@/lib/currency';

interface CroquisTerrazaProps {
  pedidosActivos: Pedido[];
  onSeleccionarMesaParaMenu: (mesa: number) => void;
  nombreMesero?: string;
}

// Configuración de las 5 mesas de la terraza
const MESAS_TERRAZA = [
  { id: 1, nombre: 'Mesa 1', capacidad: '4 personas', zona: 'Terraza Jardín' },
  { id: 2, nombre: 'Mesa 2', capacidad: '4 personas', zona: 'Terraza Jardín' },
  { id: 3, nombre: 'Mesa 3', capacidad: '6 personas (Central)', zona: 'Terraza Principal' },
  { id: 4, nombre: 'Mesa 4', capacidad: '2-4 personas', zona: 'Terraza Vista' },
  { id: 5, nombre: 'Mesa 5', capacidad: '4 personas', zona: 'Terraza Vista' },
];

export function CroquisTerraza({
  pedidosActivos,
  onSeleccionarMesaParaMenu,
  nombreMesero,
}: CroquisTerrazaProps) {
  const [mesaSeleccionadaDetalle, setMesaSeleccionadaDetalle] = useState<{
    numero: number;
    pedido: Pedido;
  } | null>(null);

  // Obtener el pedido activo actual de cada mesa (excluye CANCELADO y PAGADO)
  const getPedidoMesa = (numeroMesa: number) => {
    return pedidosActivos.find(
      (p) => p.mesa === numeroMesa && p.estado !== 'CANCELADO' && p.estado !== 'PAGADO'
    );
  };

  // Obtener el último pedido pagado de la mesa (para reimprimir ticket si lo necesitan)
  const getUltimoPedidoPagado = (numeroMesa: number) => {
    return pedidosActivos.find(
      (p) => p.mesa === numeroMesa && p.estado === 'PAGADO'
    );
  };

  // Contadores para el resumen en vivo
  const totalMesas = MESAS_TERRAZA.length;
  let mesasEnCocina = 0;
  let mesasListas = 0;
  let mesasServidas = 0;

  MESAS_TERRAZA.forEach((m) => {
    const p = getPedidoMesa(m.id);
    if (p) {
      if (p.estado === 'PENDIENTE' || p.estado === 'PREPARANDO') mesasEnCocina++;
      if (p.estado === 'HECHO') mesasListas++;
      if (p.estado === 'ENTREGADO') mesasServidas++;
    }
  });

  const mesasLibres = totalMesas - (mesasEnCocina + mesasListas + mesasServidas);

  const handleClickMesa = (numeroMesa: number) => {
    const pedido = getPedidoMesa(numeroMesa);
    if (!pedido) {
      // Si la mesa está libre, ir directo al menú para esa mesa
      onSeleccionarMesaParaMenu(numeroMesa);
    } else {
      // Si la mesa tiene pedido activo, abrir el modal de estado y recibo
      setMesaSeleccionadaDetalle({ numero: numeroMesa, pedido });
    }
  };


  return (
    <div className="flex h-full flex-col space-y-3 sm:space-y-6 overflow-y-auto pr-1 pb-10">
      {/* BANNER DE CABECERA CON RESUMEN EN TIEMPO REAL */}
      <div className="rounded-3xl border border-zinc-800 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 p-3.5 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="flex h-10 w-10 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl bg-orange-500/10 border border-orange-500/30 text-xl sm:text-3xl shadow-inner">
              🌿
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-xl font-black text-white tracking-tight">
                  Plano de Mesas • Terraza
                </h2>
                <span className="rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                  5 Mesas
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Selecciona una mesa para tomar comandas, monitorear el estado o cobrar.
              </p>
            </div>
          </div>

          {/* BADGES DE ESTADO RÁPIDO */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs">
            <span className="flex items-center gap-1.5 rounded-xl bg-emerald-950/40 border border-emerald-800/60 px-2.5 sm:px-3 py-1 sm:py-1.5 font-bold text-emerald-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              {mesasLibres} {mesasLibres === 1 ? 'Libre' : 'Libres'}
            </span>

            {mesasEnCocina > 0 && (
              <span className="flex items-center gap-1.5 rounded-xl bg-amber-950/40 border border-amber-800/60 px-2.5 sm:px-3 py-1 sm:py-1.5 font-bold text-amber-300">
                <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                {mesasEnCocina} En Cocina
              </span>
            )}

            {mesasListas > 0 && (
              <span className="flex items-center gap-1.5 rounded-xl bg-blue-950/60 border border-blue-500 px-2.5 sm:px-3 py-1 sm:py-1.5 font-black text-blue-300 shadow-md shadow-blue-500/20 animate-bounce">
                <span>🍽️</span> {mesasListas} ¡Lista(s)!
              </span>
            )}
          </div>
        </div>
      </div>

      {/* PLANO / CROQUIS INTERACTIVO DE LAS 5 MESAS DE LA TERRAZA */}
      <div className="flex-1 rounded-3xl border border-zinc-800/80 bg-zinc-950/70 p-3.5 sm:p-8 backdrop-blur-md">
        <div className="mb-3 sm:mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Distribución de Terraza Exterior
            </span>
            <span className="text-sm">⛱️</span>
          </div>
          <p className="text-[11px] text-zinc-500 hidden sm:block">
            Toca una mesa libre para abrir el menú • Toca una mesa ocupada para ver su cuenta
          </p>
        </div>

        {/* Cuadrícula visual de las 5 mesas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
          {MESAS_TERRAZA.map((mesa) => {
            const pedido = getPedidoMesa(mesa.id);
            const estaOcupada = !!pedido;
            const esListo = pedido?.estado === 'HECHO';
            const esPreparando = pedido?.estado === 'PREPARANDO' || pedido?.estado === 'PENDIENTE';
            const esServido = pedido?.estado === 'ENTREGADO';

            // Tiempo transcurrido si está ocupada
            let minutos = 0;
            if (pedido) {
              const diffMs = new Date().getTime() - new Date(pedido.createdAt).getTime();
              minutos = Math.max(0, Math.floor(diffMs / 60000));
            }

            return (
              <div
                key={mesa.id}
                onClick={() => handleClickMesa(mesa.id)}
                className={`group relative flex flex-col justify-between rounded-3xl border p-5 cursor-pointer transition-all duration-300 active:scale-95 select-none ${
                  esListo
                    ? 'border-blue-500 bg-blue-950/30 ring-2 ring-blue-400/80 shadow-2xl shadow-blue-500/20'
                    : esPreparando
                    ? 'border-amber-600/70 bg-amber-950/20 shadow-lg shadow-amber-950/30 hover:border-amber-500'
                    : esServido
                    ? 'border-zinc-700 bg-zinc-900/60 hover:border-zinc-600'
                    : 'border-zinc-800/80 bg-zinc-900/30 hover:border-emerald-500/60 hover:bg-emerald-950/10'
                }`}
              >
                {/* Badge flotante de estado en la esquina */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-semibold text-zinc-400 group-hover:text-zinc-300">
                    {mesa.zona}
                  </span>

                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                      esListo
                        ? 'bg-blue-500 text-white shadow-md animate-pulse'
                        : esPreparando
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : esServido
                        ? 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    }`}
                  >
                    {esListo && '🍽️ ¡Listo para servir!'}
                    {esPreparando && '🔥 En Cocina'}
                    {esServido && '✅ Comensales en Mesa'}
                    {!estaOcupada && '🟢 Libre'}
                  </span>
                </div>

                {/* DIBUJO / REPRESENTACIÓN VISUAL DE LA MESA Y SILLAS */}
                <div className="my-2 flex flex-col items-center justify-center py-2">
                  <div className="relative flex items-center justify-center">
                    {/* Silla superior */}
                    <div className="absolute -top-2 h-2 w-10 rounded-t-md bg-zinc-700/80" />
                    {/* Silla inferior */}
                    <div className="absolute -bottom-2 h-2 w-10 rounded-b-md bg-zinc-700/80" />
                    {/* Silla izquierda */}
                    <div className="absolute -left-2 h-10 w-2 rounded-l-md bg-zinc-700/80" />
                    {/* Silla derecha */}
                    <div className="absolute -right-2 h-10 w-2 rounded-r-md bg-zinc-700/80" />

                    {/* Tablero central de la mesa */}
                    <div
                      className={`relative flex h-24 w-28 sm:h-28 sm:w-32 flex-col items-center justify-center rounded-2xl border shadow-inner transition-transform group-hover:scale-105 ${
                        esListo
                          ? 'border-blue-400 bg-gradient-to-br from-blue-900/60 to-blue-950 text-white'
                          : esPreparando
                          ? 'border-amber-500/50 bg-gradient-to-br from-amber-950/40 to-zinc-900 text-amber-200'
                          : esServido
                          ? 'border-zinc-700 bg-gradient-to-br from-zinc-800 to-zinc-900 text-zinc-200'
                          : 'border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-950 text-white'
                      }`}
                    >
                      <span className="text-2xl sm:text-3xl mb-0.5">
                        {esListo ? '🍽️' : esPreparando ? '🍳' : esServido ? '🍷' : '⛱️'}
                      </span>
                      <p className="text-base sm:text-lg font-black tracking-tight">{mesa.nombre}</p>
                      <p className="text-[10px] text-zinc-400 font-medium">{mesa.capacidad}</p>
                    </div>
                  </div>
                </div>

                {/* DETALLES Y ACCIÓN INFERIOR */}
                <div className="mt-3 pt-3 border-t border-zinc-800/80">
                  {pedido ? (
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <p className="font-extrabold text-white text-sm">
                          {formatearCOP(pedido.total)}
                        </p>
                        <p className="text-[11px] text-zinc-400">
                          {minutos} min transcurridos
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="rounded-xl bg-orange-500/10 border border-orange-500/30 px-2.5 py-1 text-[11px] font-bold text-orange-400 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                          Ver Cuenta 🧾
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex flex-col">
                        <span className="text-emerald-400 font-bold text-[11px]">🟢 Disponible</span>
                        {getUltimoPedidoPagado(mesa.id) && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const pagado = getUltimoPedidoPagado(mesa.id);
                              if (pagado) setMesaSeleccionadaDetalle({ numero: mesa.id, pedido: pagado });
                            }}
                            className="text-[10px] text-zinc-500 hover:text-orange-400 underline text-left transition-colors"
                          >
                            Último ticket 🧾
                          </button>
                        )}
                      </div>
                      <span className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 text-[11px] font-bold text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                        Tomar Orden ➕
                      </span>
                    </div>
                  )}

                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL DE DETALLE DE LA MESA Y RECIBO SI HAY MESA SELECCIONADA CON PEDIDO */}
      {mesaSeleccionadaDetalle && (
        <MesaDetalleModal
          mesa={mesaSeleccionadaDetalle.numero}
          pedido={mesaSeleccionadaDetalle.pedido}
          nombreMesero={nombreMesero}
          onCerrar={() => setMesaSeleccionadaDetalle(null)}
          onAgregarPlatillos={(mesaNum) => {
            setMesaSeleccionadaDetalle(null);
            onSeleccionarMesaParaMenu(mesaNum);
          }}
        />
      )}
    </div>
  );
}

