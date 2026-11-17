'use client';

import { useState, useTransition, useEffect, useMemo } from 'react';
import {
  ResumenInventario,
  BebidaInventarioDTO,
  ProductoOpcion,
  MovimientoInventarioDTO,
  FiltroEstadoStock,
  CrearBebidaPayload,
  AbastecerPayload,
  AjustarStockPayload,
  ActualizarBebidaPayload,
  MensajeFeedback,
} from '../types/inventario';
import {
  crearBebidaInventario,
  abastecerBebidaInventario,
  ajustarStockManual,
  actualizarBebidaInventario,
  eliminarBebidaInventario,
  getMovimientosInventario,
  getInventarioBebidas,
} from '../actions/inventario-actions';

import { InventarioMetricas } from './inventario-metricas';
import { InventarioTabla } from './inventario-tabla';
import { NuevaBebidaModal } from './nueva-bebida-modal';
import { AbastecerModal } from './abastecer-modal';
import { AjusteStockModal } from './ajuste-stock-modal';
import { EditarBebidaModal } from './editar-bebida-modal';
import { KardexHistorialModal } from './kardex-historial-modal';

interface InventarioManagerProps {
  resumenInicial: ResumenInventario;
  productosDisponibles: ProductoOpcion[];
}

export function InventarioManager({
  resumenInicial,
  productosDisponibles,
}: InventarioManagerProps) {
  const [resumen, setResumen] = useState<ResumenInventario>(resumenInicial);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstadoStock>('TODOS');
  const [isPending, startTransition] = useTransition();
  const [mensaje, setMensaje] = useState<MensajeFeedback | null>(null);

  // Modales
  const [modalNuevaBebida, setModalNuevaBebida] = useState(false);
  const [modalAbastecer, setModalAbastecer] = useState<BebidaInventarioDTO | null>(null);
  const [modalAjuste, setModalAjuste] = useState<BebidaInventarioDTO | null>(null);
  const [modalEditar, setModalEditar] = useState<BebidaInventarioDTO | null>(null);
  const [modalKardex, setModalKardex] = useState<boolean>(false);
  const [movimientos, setMovimientos] = useState<MovimientoInventarioDTO[]>([]);
  const [cargandoMovimientos, setCargandoMovimientos] = useState(false);

  // Sincronización en tiempo real reactiva con AWS (cada 2 segundos)
  useEffect(() => {
    let activo = true;

    const refrescarInventario = async () => {
      try {
        const res = await getInventarioBebidas();
        if (activo && res.success && res.data) {
          setResumen(res.data);
        }
      } catch (e) {}
    };

    const intervalo = setInterval(refrescarInventario, 2000);
    return () => {
      activo = false;
      clearInterval(intervalo);
    };
  }, []);

  const mostrarMensaje = (tipo: 'exito' | 'error', texto: string) => {
    setMensaje({ tipo, texto });
    setTimeout(() => setMensaje(null), 4500);
  };

  const refrescarDatos = async () => {
    const res = await getInventarioBebidas();
    if (res.data) setResumen(res.data);
  };

  // Filtrado de bebidas por búsqueda y estado
  const bebidasFiltradas = useMemo(() => {
    return resumen.bebidas.filter((b) => {
      const coincideBusqueda =
        busqueda.trim() === '' ||
        b.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        (b.productoNombre && b.productoNombre.toLowerCase().includes(busqueda.toLowerCase()));

      const coincideEstado =
        filtroEstado === 'TODOS' || b.estadoStock === filtroEstado;

      return coincideBusqueda && coincideEstado;
    });
  }, [resumen.bebidas, busqueda, filtroEstado]);

  // Handlers para cada acción
  const handleCrearBebida = async (payload: CrearBebidaPayload): Promise<boolean> => {
    return new Promise((resolve) => {
      startTransition(async () => {
        const res = await crearBebidaInventario({
          nombre: payload.nombre,
          stockActual: payload.stockInicial || 0,
          stockMinimo: payload.stockMinimo || 5,
          costoUnitario: payload.costoUnitario,
          precioVenta: payload.precioVenta,
          productoId: payload.productoId || null,
        });

        if (res.success) {
          mostrarMensaje('exito', `✅ "${payload.nombre}" agregada al inventario correctamente.`);
          await refrescarDatos();
          resolve(true);
        } else {
          mostrarMensaje('error', res.error || 'Error al registrar bebida.');
          resolve(false);
        }
      });
    });
  };

  const handleAbastecer = async (payload: AbastecerPayload): Promise<boolean> => {
    return new Promise((resolve) => {
      startTransition(async () => {
        const res = await abastecerBebidaInventario(payload);

        if (res.success) {
          mostrarMensaje('exito', `✅ Se surtieron +${payload.cantidad} unidades correctamente.`);
          await refrescarDatos();
          resolve(true);
        } else {
          mostrarMensaje('error', res.error || 'Error al abastecer.');
          resolve(false);
        }
      });
    });
  };

  const handleAjuste = async (payload: AjustarStockPayload): Promise<boolean> => {
    return new Promise((resolve) => {
      startTransition(async () => {
        const res = await ajustarStockManual(payload);

        if (res.success) {
          mostrarMensaje('exito', `✅ Stock ajustado a ${payload.nuevoStock} unidades.`);
          await refrescarDatos();
          resolve(true);
        } else {
          mostrarMensaje('error', res.error || 'Error al ajustar stock.');
          resolve(false);
        }
      });
    });
  };

  const handleEditar = async (payload: ActualizarBebidaPayload): Promise<boolean> => {
    return new Promise((resolve) => {
      startTransition(async () => {
        const res = await actualizarBebidaInventario(payload);

        if (res.success) {
          mostrarMensaje('exito', '✅ Bebida actualizada correctamente.');
          await refrescarDatos();
          resolve(true);
        } else {
          mostrarMensaje('error', res.error || 'Error al actualizar bebida.');
          resolve(false);
        }
      });
    });
  };

  const handleEliminar = (id: string, nombre: string) => {
    if (!confirm(`¿Estás seguro de eliminar "${nombre}" del inventario de bebidas?`)) return;

    startTransition(async () => {
      const res = await eliminarBebidaInventario(id);
      if (res.success) {
        mostrarMensaje('exito', `🗑️ "${nombre}" eliminada del inventario.`);
        await refrescarDatos();
      } else {
        mostrarMensaje('error', res.error || 'Error al eliminar.');
      }
    });
  };

  const handleAbrirKardex = async (bebidaId?: string) => {
    setModalKardex(true);
    setCargandoMovimientos(true);
    const res = await getMovimientosInventario(bebidaId);
    if (res.success && res.data) {
      setMovimientos(res.data as MovimientoInventarioDTO[]);
    }
    setCargandoMovimientos(false);
  };

  return (
    <div className="space-y-6">
      {/* MENSAJE FLOTANTE DE NOTIFICACIÓN */}
      {mensaje && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-3 rounded-2xl border p-4 text-xs font-bold shadow-2xl backdrop-blur-md animate-in slide-in-from-top-3 ${
            mensaje.tipo === 'exito'
              ? 'border-emerald-500/50 bg-emerald-950/90 text-emerald-200'
              : 'border-rose-500/50 bg-rose-950/90 text-rose-200'
          }`}
        >
          <span>{mensaje.texto}</span>
        </div>
      )}

      {/* METRICAS Y VALORACIÓN GLOBAL EN COP */}
      <InventarioMetricas resumen={resumen} />

      {/* BARRA DE HERRAMIENTAS Y FILTROS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-zinc-800 bg-zinc-950 p-3 sm:p-4">
        <div className="flex flex-1 items-center gap-2">
          {/* Buscador */}
          <div className="relative flex-1 max-w-md">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 text-xs">
              🔍
            </span>
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar bebida por nombre..."
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 pl-9 pr-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:border-orange-500 focus:outline-none transition-colors"
            />
          </div>

          {/* Filtro por estado de stock */}
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value as FiltroEstadoStock)}
            className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs font-semibold text-zinc-300 focus:border-orange-500 focus:outline-none"
          >
            <option value="TODOS">Todos los estados</option>
            <option value="AGOTADO">🚫 Agotados (0 stock)</option>
            <option value="BAJO">⚠️ Bajo Stock (≤ mínimo)</option>
            <option value="OPTIMO">✅ Stock Óptimo</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          {/* Botón Ver Kardex / Auditoría */}
          <button
            type="button"
            onClick={() => handleAbrirKardex()}
            className="flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs font-bold text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all active:scale-95"
          >
            <span>📜</span>
            <span>Historial / Kardex</span>
          </button>

          {/* Botón Nueva Bebida */}
          <button
            type="button"
            onClick={() => setModalNuevaBebida(true)}
            className="flex items-center gap-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 px-4 py-2 text-xs font-black text-white shadow-lg shadow-orange-600/20 transition-all active:scale-95"
          >
            <span>➕</span>
            <span>Registrar Bebida</span>
          </button>
        </div>
      </div>

      {/* TABLA MODULAR DE BEBIDAS */}
      <InventarioTabla
        bebidas={bebidasFiltradas}
        onAbastecer={(b) => setModalAbastecer(b)}
        onAjustar={(b) => setModalAjuste(b)}
        onEditar={(b) => setModalEditar(b)}
        onEliminar={handleEliminar}
      />

      {/* MODALES MODULARES */}
      <NuevaBebidaModal
        isOpen={modalNuevaBebida}
        onClose={() => setModalNuevaBebida(false)}
        onSubmit={handleCrearBebida}
        productosDisponibles={productosDisponibles}
        isPending={isPending}
      />

      <AbastecerModal
        bebida={modalAbastecer}
        onClose={() => setModalAbastecer(null)}
        onSubmit={handleAbastecer}
        isPending={isPending}
      />

      <AjusteStockModal
        bebida={modalAjuste}
        onClose={() => setModalAjuste(null)}
        onSubmit={handleAjuste}
        isPending={isPending}
      />

      <EditarBebidaModal
        bebida={modalEditar}
        onClose={() => setModalEditar(null)}
        onSubmit={handleEditar}
        productosDisponibles={productosDisponibles}
        isPending={isPending}
      />

      <KardexHistorialModal
        isOpen={modalKardex}
        onClose={() => setModalKardex(false)}
        movimientos={movimientos}
        cargando={cargandoMovimientos}
      />
    </div>
  );
}
