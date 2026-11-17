'use client';

import { useState, useTransition, useEffect, useMemo } from 'react';
import {
  ResumenInventario,
  BebidaInventarioDTO,
  crearBebidaInventario,
  abastecerBebidaInventario,
  ajustarStockManual,
  actualizarBebidaInventario,
  eliminarBebidaInventario,
  getMovimientosInventario,
  getInventarioBebidas,
} from '../actions/inventario-actions';
import { formatearCOP, formatearCOPCompleto } from '@/lib/currency';

interface ProductoOpcion {
  id: string;
  nombre: string;
  precio: number;
}

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
  const [filtroEstado, setFiltroEstado] = useState<'TODOS' | 'AGOTADO' | 'BAJO' | 'OPTIMO'>('TODOS');
  const [isPending, startTransition] = useTransition();
  const [mensaje, setMensaje] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);

  // Modales
  const [modalNuevaBebida, setModalNuevaBebida] = useState(false);
  const [modalAbastecer, setModalAbastecer] = useState<BebidaInventarioDTO | null>(null);
  const [modalAjuste, setModalAjuste] = useState<BebidaInventarioDTO | null>(null);
  const [modalEditar, setModalEditar] = useState<BebidaInventarioDTO | null>(null);
  const [modalKardex, setModalKardex] = useState<boolean>(false);
  const [movimientos, setMovimientos] = useState<any[]>([]);
  const [cargandoMovimientos, setCargandoMovimientos] = useState(false);

  // Formularios
  const [formNombre, setFormNombre] = useState('');
  const [formStock, setFormStock] = useState<number | ''>('');
  const [formStockMin, setFormStockMin] = useState<number | ''>(5);
  const [formCosto, setFormCosto] = useState<number | ''>('');
  const [formPrecio, setFormPrecio] = useState<number | ''>('');
  const [formProductoId, setFormProductoId] = useState('');

  // Form Abastecer
  const [abastecerCantidad, setAbastecerCantidad] = useState<number | ''>('');
  const [abastecerNuevoCosto, setAbastecerNuevoCosto] = useState<number | ''>('');
  const [abastecerMotivo, setAbastecerMotivo] = useState('Compra a distribuidor');

  // Form Ajuste
  const [ajusteNuevoStock, setAjusteNuevoStock] = useState<number | ''>('');
  const [ajusteMotivo, setAjusteMotivo] = useState('Conteo físico de inventario');

  // Form Editar
  const [editNombre, setEditNombre] = useState('');
  const [editStockMin, setEditStockMin] = useState<number>(5);
  const [editCosto, setEditCosto] = useState<number>(0);
  const [editPrecio, setEditPrecio] = useState<number>(0);
  const [editProductoId, setEditProductoId] = useState<string>('');

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

  // Filtrado de bebidas
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

  // Manejo de crear nueva bebida
  const handleCrear = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNombre.trim()) {
      mostrarMensaje('error', 'Ingresa el nombre de la bebida.');
      return;
    }

    startTransition(async () => {
      const res = await crearBebidaInventario({
        nombre: formNombre.trim(),
        stockActual: Number(formStock) || 0,
        stockMinimo: Number(formStockMin) || 5,
        costoUnitario: Number(formCosto) || 0,
        precioVenta: Number(formPrecio) || 0,
        productoId: formProductoId || null,
      });

      if (res.success) {
        mostrarMensaje('exito', `✅ "${formNombre}" agregada al inventario correctamente.`);
        setModalNuevaBebida(false);
        setFormNombre('');
        setFormStock('');
        setFormCosto('');
        setFormPrecio('');
        setFormProductoId('');
        const fresh = await getInventarioBebidas();
        if (fresh.data) setResumen(fresh.data);
      } else {
        mostrarMensaje('error', res.error || 'Error al registrar bebida.');
      }
    });
  };

  // Manejo de abastecimiento
  const handleAbastecerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalAbastecer) return;
    const cant = Number(abastecerCantidad);
    if (!cant || cant <= 0) {
      mostrarMensaje('error', 'La cantidad debe ser mayor a 0.');
      return;
    }

    startTransition(async () => {
      const res = await abastecerBebidaInventario({
        id: modalAbastecer.id,
        cantidad: cant,
        nuevoCostoUnitario: abastecerNuevoCosto ? Number(abastecerNuevoCosto) : undefined,
        motivo: abastecerMotivo,
      });

      if (res.success) {
        mostrarMensaje(
          'exito',
          `✅ Se agregaron +${cant} unidades a "${modalAbastecer.nombre}".`
        );
        setModalAbastecer(null);
        setAbastecerCantidad('');
        setAbastecerNuevoCosto('');
        const fresh = await getInventarioBebidas();
        if (fresh.data) setResumen(fresh.data);
      } else {
        mostrarMensaje('error', res.error || 'Error al abastecer.');
      }
    });
  };

  // Manejo de ajuste manual
  const handleAjusteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalAjuste) return;
    if (ajusteNuevoStock === '' || Number(ajusteNuevoStock) < 0) {
      mostrarMensaje('error', 'Ingresa un stock válido.');
      return;
    }

    startTransition(async () => {
      const res = await ajustarStockManual({
        id: modalAjuste.id,
        nuevoStock: Number(ajusteNuevoStock),
        motivo: ajusteMotivo,
      });

      if (res.success) {
        mostrarMensaje('exito', `✅ Stock de "${modalAjuste.nombre}" ajustado a ${ajusteNuevoStock} unidades.`);
        setModalAjuste(null);
        setAjusteNuevoStock('');
        const fresh = await getInventarioBebidas();
        if (fresh.data) setResumen(fresh.data);
      } else {
        mostrarMensaje('error', res.error || 'Error al ajustar stock.');
      }
    });
  };

  // Manejo de editar
  const handleEditarSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalEditar) return;

    startTransition(async () => {
      const res = await actualizarBebidaInventario({
        id: modalEditar.id,
        nombre: editNombre,
        stockMinimo: editStockMin,
        costoUnitario: editCosto,
        precioVenta: editPrecio,
        productoId: editProductoId || null,
      });

      if (res.success) {
        mostrarMensaje('exito', '✅ Bebida actualizada correctamente.');
        setModalEditar(null);
        const fresh = await getInventarioBebidas();
        if (fresh.data) setResumen(fresh.data);
      } else {
        mostrarMensaje('error', res.error || 'Error al actualizar.');
      }
    });
  };

  // Manejo de eliminar
  const handleEliminar = (id: string, nombre: string) => {
    if (!confirm(`¿Estás seguro de eliminar "${nombre}" del inventario de bebidas?`)) return;

    startTransition(async () => {
      const res = await eliminarBebidaInventario(id);
      if (res.success) {
        mostrarMensaje('exito', `🗑️ "${nombre}" eliminada del inventario.`);
        const fresh = await getInventarioBebidas();
        if (fresh.data) setResumen(fresh.data);
      } else {
        mostrarMensaje('error', res.error || 'Error al eliminar.');
      }
    });
  };

  // Abrir historial de movimientos
  const abrirKardex = async (bebidaId?: string) => {
    setModalKardex(true);
    setCargandoMovimientos(true);
    const res = await getMovimientosInventario(bebidaId);
    if (res.success && res.data) {
      setMovimientos(res.data);
    }
    setCargandoMovimientos(false);
  };

  return (
    <div className="space-y-6">
      {/* MENSAJE FLOTANTE */}
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

      {/* TARJETAS DE VALORACIÓN TOTAL EN PESOS COLOMBIANOS (COP) */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        {/* Costo Total del Inventario */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-5 relative overflow-hidden">
          <div className="flex items-center justify-between text-zinc-400 mb-1">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider">
              Valor Total al Costo
            </span>
            <span className="text-lg">🏷️</span>
          </div>
          <p className="text-xl sm:text-2xl font-black text-white">
            {formatearCOP(resumen.valorCostoTotal)}
          </p>
          <p className="text-[10px] sm:text-[11px] text-zinc-400 mt-1">
            Inversión en {resumen.totalUnidades} bebidas almacenadas
          </p>
        </div>

        {/* Valor Total a la Venta */}
        <div className="rounded-2xl border border-emerald-900/40 bg-emerald-950/20 p-4 sm:p-5 relative overflow-hidden">
          <div className="flex items-center justify-between text-emerald-400 mb-1">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider">
              Valor Total a la Venta
            </span>
            <span className="text-lg">💰</span>
          </div>
          <p className="text-xl sm:text-2xl font-black text-emerald-400">
            {formatearCOP(resumen.valorVentaTotal)}
          </p>
          <p className="text-[10px] sm:text-[11px] text-emerald-300/70 mt-1">
            Venta proyectada en carta
          </p>
        </div>

        {/* Ganancia Proyectada */}
        <div className="rounded-2xl border border-orange-900/40 bg-orange-950/20 p-4 sm:p-5 relative overflow-hidden">
          <div className="flex items-center justify-between text-orange-400 mb-1">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider">
              Margen Proyectado
            </span>
            <span className="text-lg">📈</span>
          </div>
          <p className="text-xl sm:text-2xl font-black text-orange-400">
            +{formatearCOP(resumen.gananciaProyectada)}
          </p>
          <p className="text-[10px] sm:text-[11px] text-orange-300/70 mt-1">
            Rentabilidad promedio: {resumen.margenPorcentual}%
          </p>
        </div>

        {/* Alertas de Stock */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-5">
          <div className="flex items-center justify-between text-zinc-400 mb-1">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider">
              Alertas de Stock
            </span>
            <span className="text-lg">⚠️</span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span
              className={`rounded-lg px-2.5 py-1 text-xs font-black border ${
                resumen.totalAgotadas > 0
                  ? 'bg-rose-950/80 border-rose-600 text-rose-300'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-500'
              }`}
            >
              🚫 {resumen.totalAgotadas} agotadas
            </span>
            <span
              className={`rounded-lg px-2.5 py-1 text-xs font-black border ${
                resumen.totalBajoStock > 0
                  ? 'bg-amber-950/80 border-amber-600 text-amber-300'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-500'
              }`}
            >
              ⚠️ {resumen.totalBajoStock} bajas
            </span>
          </div>
        </div>
      </div>

      {/* BARRA DE HERRAMIENTAS Y ACCIONES */}
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

          {/* Filtro por estado */}
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value as any)}
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
            onClick={() => abrirKardex()}
            className="flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs font-bold text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all active:scale-95"
          >
            <span>📜</span>
            <span>Historial de Movimientos</span>
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

      {/* TABLA PRINCIPAL DE INVENTARIO */}
      <div className="rounded-3xl border border-zinc-800 bg-zinc-950 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-zinc-800 bg-zinc-900/80 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              <tr>
                <th className="px-4 py-3.5">Bebida / Presentación</th>
                <th className="px-4 py-3.5 text-center">Stock Actual</th>
                <th className="px-4 py-3.5 text-right">Costo Unitario</th>
                <th className="px-4 py-3.5 text-right">Precio Venta</th>
                <th className="px-4 py-3.5 text-right">Valor en Costo (Total)</th>
                <th className="px-4 py-3.5 text-right">Valor en Venta (Total)</th>
                <th className="px-4 py-3.5 text-center">Acciones Rápidas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {bebidasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-zinc-500">
                    No se encontraron bebidas registradas con los filtros actuales.
                  </td>
                </tr>
              ) : (
                bebidasFiltradas.map((b) => (
                  <tr key={b.id} className="hover:bg-zinc-900/40 transition-colors">
                    {/* Nombre y Enlace al Menú */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🥤</span>
                        <div>
                          <p className="font-bold text-white text-sm">{b.nombre}</p>
                          {b.productoNombre ? (
                            <span className="inline-flex items-center gap-1 rounded bg-blue-950/60 border border-blue-800/60 px-1.5 py-0.5 text-[9px] font-bold text-blue-300 mt-0.5">
                              🔗 Vinculado a: {b.productoNombre}
                            </span>
                          ) : (
                            <span className="text-[10px] text-zinc-500">Solo inventario</span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Stock y Estado */}
                    <td className="px-4 py-3.5 text-center">
                      <div className="inline-flex flex-col items-center">
                        <span
                          className={`rounded-full px-3 py-0.5 text-xs font-black border ${
                            b.estadoStock === 'AGOTADO'
                              ? 'bg-rose-950 text-rose-300 border-rose-700 animate-pulse'
                              : b.estadoStock === 'BAJO'
                              ? 'bg-amber-950 text-amber-300 border-amber-700'
                              : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                          }`}
                        >
                          {b.stockActual} uds
                        </span>
                        <span className="text-[10px] text-zinc-500 mt-0.5">
                          Mín: {b.stockMinimo}
                        </span>
                      </div>
                    </td>

                    {/* Costo Unitario */}
                    <td className="px-4 py-3.5 text-right font-medium text-zinc-300">
                      {formatearCOP(b.costoUnitario)}
                    </td>

                    {/* Precio Venta */}
                    <td className="px-4 py-3.5 text-right font-bold text-white">
                      {formatearCOP(b.precioVenta)}
                    </td>

                    {/* Valor en Costo (Total por producto) */}
                    <td className="px-4 py-3.5 text-right font-extrabold text-amber-400">
                      {formatearCOP(b.valorCostoTotal)}
                    </td>

                    {/* Valor en Venta (Total por producto) */}
                    <td className="px-4 py-3.5 text-right font-extrabold text-emerald-400">
                      {formatearCOP(b.valorVentaTotal)}
                    </td>

                    {/* Botones de Acción */}
                    <td className="px-4 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Abastecer (+ unidades) */}
                        <button
                          type="button"
                          onClick={() => {
                            setModalAbastecer(b);
                            setAbastecerCantidad('');
                            setAbastecerNuevoCosto(b.costoUnitario);
                          }}
                          className="rounded-lg bg-emerald-950/60 border border-emerald-800 px-2.5 py-1 text-[11px] font-bold text-emerald-300 hover:bg-emerald-900 transition-colors"
                          title="Abastecer stock"
                        >
                          + Surtir
                        </button>

                        {/* Ajustar Stock Manual */}
                        <button
                          type="button"
                          onClick={() => {
                            setModalAjuste(b);
                            setAjusteNuevoStock(b.stockActual);
                          }}
                          className="rounded-lg bg-zinc-900 border border-zinc-700 px-2 py-1 text-[11px] font-medium text-zinc-300 hover:bg-zinc-800 transition-colors"
                          title="Ajuste manual de conteo"
                        >
                          ⚖️ Ajuste
                        </button>

                        {/* Editar */}
                        <button
                          type="button"
                          onClick={() => {
                            setModalEditar(b);
                            setEditNombre(b.nombre);
                            setEditStockMin(b.stockMinimo);
                            setEditCosto(b.costoUnitario);
                            setEditPrecio(b.precioVenta);
                            setEditProductoId(b.productoId || '');
                          }}
                          className="rounded-lg bg-zinc-900 border border-zinc-800 p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                          title="Editar bebida"
                        >
                          ✏️
                        </button>

                        {/* Eliminar */}
                        <button
                          type="button"
                          onClick={() => handleEliminar(b.id, b.nombre)}
                          className="rounded-lg bg-zinc-900 border border-zinc-800 p-1 text-zinc-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                          title="Eliminar bebida"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: REGISTRAR NUEVA BEBIDA */}
      {modalNuevaBebida && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-3xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>🥤</span> Registrar Nueva Bebida en Inventario
              </h3>
              <button
                type="button"
                onClick={() => setModalNuevaBebida(false)}
                className="text-zinc-500 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCrear} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  Nombre de la Bebida *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Coca-Cola 400ml, Cerveza Corona, Agua 600ml"
                  value={formNombre}
                  onChange={(e) => setFormNombre(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-xs text-white focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">
                    Stock Inicial (Unidades) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="Ej: 24"
                    value={formStock}
                    onChange={(e) => setFormStock(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-xs text-white focus:border-orange-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">
                    Stock Mínimo de Alerta
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Ej: 6"
                    value={formStockMin}
                    onChange={(e) => setFormStockMin(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-xs text-white focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">
                    Costo de Compra Unitario (COP) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    required
                    placeholder="Ej: 2500"
                    value={formCosto}
                    onChange={(e) => setFormCosto(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-xs text-white focus:border-orange-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">
                    Precio de Venta al Público (COP) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    required
                    placeholder="Ej: 5000"
                    value={formPrecio}
                    onChange={(e) => setFormPrecio(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-xs text-white focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Vinculación opcional con producto del menú */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  Vincular a Platillo/Bebida del Menú (Opcional)
                </label>
                <select
                  value={formProductoId}
                  onChange={(e) => setFormProductoId(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-xs text-white focus:border-orange-500 focus:outline-none"
                >
                  <option value="">-- Sin vincular directamente (Solo inventario) --</option>
                  {productosDisponibles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} ({formatearCOP(p.precio)})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-zinc-500 mt-1">
                  💡 Al vincularlo, cuando el stock llegue a 0 se marcará automáticamente como "Agotado" en la carta y cocina.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setModalNuevaBebida(false)}
                  className="rounded-xl border border-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-xl bg-orange-600 hover:bg-orange-500 px-5 py-2 text-xs font-bold text-white transition-all disabled:opacity-50"
                >
                  {isPending ? 'Guardando...' : 'Guardar Bebida'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ABASTECER STOCK */}
      {modalAbastecer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>📦</span> Abastecer Stock • {modalAbastecer.nombre}
              </h3>
              <button
                type="button"
                onClick={() => setModalAbastecer(null)}
                className="text-zinc-500 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAbastecerSubmit} className="space-y-4">
              <div className="rounded-xl bg-zinc-900/60 p-3 flex justify-between text-xs">
                <span className="text-zinc-400">Stock Actual:</span>
                <span className="font-black text-white">{modalAbastecer.stockActual} unidades</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  Cantidad a Ingresar (Unidades) *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  placeholder="Ej: 24 (una paca/caja)"
                  value={abastecerCantidad}
                  onChange={(e) =>
                    setAbastecerCantidad(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  Costo de Compra Unitario (COP)
                </label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  placeholder={`Actual: ${formatearCOP(modalAbastecer.costoUnitario)}`}
                  value={abastecerNuevoCosto}
                  onChange={(e) =>
                    setAbastecerNuevoCosto(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
                <p className="text-[10px] text-zinc-500 mt-0.5">
                  Deja vacío si el precio de compra no cambió.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  Motivo / Proveedor
                </label>
                <input
                  type="text"
                  value={abastecerMotivo}
                  onChange={(e) => setAbastecerMotivo(e.target.value)}
                  placeholder="Ej: Factura Distribuidor Bavária, Éxito, etc."
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setModalAbastecer(null)}
                  className="rounded-xl border border-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-500 px-5 py-2 text-xs font-bold text-white transition-all disabled:opacity-50"
                >
                  {isPending ? 'Ingresando...' : '+ Confirmar Ingreso'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: AJUSTE MANUAL */}
      {modalAjuste && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>⚖️</span> Ajuste Manual • {modalAjuste.nombre}
              </h3>
              <button
                type="button"
                onClick={() => setModalAjuste(null)}
                className="text-zinc-500 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAjusteSubmit} className="space-y-4">
              <div className="rounded-xl bg-zinc-900/60 p-3 flex justify-between text-xs">
                <span className="text-zinc-400">Stock Actual en Sistema:</span>
                <span className="font-black text-white">{modalAjuste.stockActual} unidades</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  Nuevo Stock Real Contado *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={ajusteNuevoStock}
                  onChange={(e) =>
                    setAjusteNuevoStock(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-xs text-white focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  Motivo de la Corrección *
                </label>
                <input
                  type="text"
                  required
                  value={ajusteMotivo}
                  onChange={(e) => setAjusteMotivo(e.target.value)}
                  placeholder="Ej: Conteo físico fin de semana, Botella rota, etc."
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-xs text-white focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setModalAjuste(null)}
                  className="rounded-xl border border-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-xl bg-amber-600 hover:bg-amber-500 px-5 py-2 text-xs font-bold text-white transition-all disabled:opacity-50"
                >
                  {isPending ? 'Guardando...' : 'Aplicar Ajuste'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR BEBIDA */}
      {modalEditar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>✏️</span> Editar Bebida
              </h3>
              <button
                type="button"
                onClick={() => setModalEditar(null)}
                className="text-zinc-500 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditarSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  required
                  value={editNombre}
                  onChange={(e) => setEditNombre(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-xs text-white focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">
                    Costo Compra (COP) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    required
                    value={editCosto}
                    onChange={(e) => setEditCosto(Number(e.target.value))}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-xs text-white focus:border-orange-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">
                    Precio Venta (COP) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    required
                    value={editPrecio}
                    onChange={(e) => setEditPrecio(Number(e.target.value))}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-xs text-white focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  Stock Mínimo de Alerta
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={editStockMin}
                  onChange={(e) => setEditStockMin(Number(e.target.value))}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-xs text-white focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  Vincular a Platillo/Bebida del Menú
                </label>
                <select
                  value={editProductoId}
                  onChange={(e) => setEditProductoId(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-xs text-white focus:border-orange-500 focus:outline-none"
                >
                  <option value="">-- Sin vincular directamente --</option>
                  {productosDisponibles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} ({formatearCOP(p.precio)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setModalEditar(null)}
                  className="rounded-xl border border-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-xl bg-orange-600 hover:bg-orange-500 px-5 py-2 text-xs font-bold text-white transition-all disabled:opacity-50"
                >
                  {isPending ? 'Guardando...' : 'Actualizar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: HISTORIAL DE MOVIMIENTOS (KARDEX AUDITADO) */}
      {modalKardex && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-3xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 shrink-0">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>📜</span> Kardex • Auditoría de Movimientos de Bebidas
              </h3>
              <button
                type="button"
                onClick={() => setModalKardex(false)}
                className="text-zinc-500 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {cargandoMovimientos ? (
                <div className="py-12 text-center text-zinc-500">Cargando movimientos...</div>
              ) : movimientos.length === 0 ? (
                <div className="py-12 text-center text-zinc-500">
                  No hay movimientos registrados en el inventario aún.
                </div>
              ) : (
                movimientos.map((m) => (
                  <div
                    key={m.id}
                    className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-3 flex items-center justify-between gap-3 text-xs"
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
                        {m.tipo === 'VENTA' ? '📉' : m.tipo === 'ENTRADA' ? '📥' : '⚖️'}
                      </span>
                      <div className="min-w-0">
                        <p className="font-bold text-white truncate">{m.bebidaNombre}</p>
                        <p className="text-[11px] text-zinc-400">
                          {m.motivo || m.tipo} {m.pedidoId ? `• Pedido #${m.pedidoId.slice(0, 6)}` : ''}
                        </p>
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

            <div className="pt-2 border-t border-zinc-800 text-right shrink-0">
              <button
                type="button"
                onClick={() => setModalKardex(false)}
                className="rounded-xl border border-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-300 hover:text-white"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

