'use client';

import { useState, useTransition, useEffect } from 'react';
import {
  crearCategoria,
  eliminarCategoria,
  crearProducto,
  actualizarProducto,
  toggleDisponibilidad,
  eliminarProducto,
} from '../actions/menu-queries';
import { supabase } from '@/lib/supabase';

interface Categoria {
  id: string;
  nombre: string;
  _count?: { productos: number };
}

interface Producto {
  id: string;
  nombre: string;
  precio: number;
  disponible: boolean;
  categoriaId: string;
  categoria: { id: string; nombre: string };
}

export function MenuManager({
  categoriasIniciales,
  productosIniciales,
}: {
  categoriasIniciales: Categoria[];
  productosIniciales: Producto[];
}) {
  const [categorias, setCategorias] = useState<Categoria[]>(categoriasIniciales);
  const [productos, setProductos] = useState<Producto[]>(productosIniciales);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>('todas');

  useEffect(() => {
    setProductos(productosIniciales);
  }, [productosIniciales]);

  // Sincronización en tiempo real vía Supabase
  useEffect(() => {
    const canal = supabase
      .channel('cambios-admin-menu-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'Producto' },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            const actualizado = payload.new as { id: string; disponible: boolean };
            setProductos((prev) =>
              prev.map((p) =>
                p.id === actualizado.id ? { ...p, disponible: actualizado.disponible } : p
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, []);

  // Estados para crear categoría
  const [nuevaCategoria, setNuevaCategoria] = useState('');

  // Estados para crear producto
  const [mostrarFormProducto, setMostrarFormProducto] = useState(false);
  const [nombreProducto, setNombreProducto] = useState('');
  const [precioProducto, setPrecioProducto] = useState('');
  const [categoriaProductoId, setCategoriaProductoId] = useState(
    categoriasIniciales[0]?.id || ''
  );

  // Edición inline de precio
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [precioEditado, setPrecioEditado] = useState('');

  const [mensaje, setMensaje] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  // Filtrado de productos
  const productosFiltrados =
    categoriaSeleccionada === 'todas'
      ? productos
      : productos.filter((p) => p.categoriaId === categoriaSeleccionada);

  // Crear Categoría
  const handleCrearCategoria = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaCategoria.trim()) return;

    startTransition(async () => {
      const res = await crearCategoria(nuevaCategoria);
      if (res.success && res.data) {
        setCategorias((prev) => [...prev, { ...res.data, _count: { productos: 0 } }]);
        setNuevaCategoria('');
        setMensaje({ tipo: 'exito', texto: '✅ Categoría creada exitosamente.' });
      } else {
        setMensaje({ tipo: 'error', texto: res.error || 'Error al crear categoría.' });
      }
      setTimeout(() => setMensaje(null), 3000);
    });
  };

  // Eliminar Categoría
  const handleEliminarCategoria = (id: string, nombre: string) => {
    if (!confirm(`¿Eliminar la categoría "${nombre}" y todos sus platillos?`)) return;

    startTransition(async () => {
      const res = await eliminarCategoria(id);
      if (res.success) {
        setCategorias((prev) => prev.filter((c) => c.id !== id));
        setProductos((prev) => prev.filter((p) => p.categoriaId !== id));
        if (categoriaSeleccionada === id) setCategoriaSeleccionada('todas');
        setMensaje({ tipo: 'exito', texto: `Categoría "${nombre}" eliminada.` });
      } else {
        setMensaje({ tipo: 'error', texto: res.error || 'Error al eliminar.' });
      }
      setTimeout(() => setMensaje(null), 3000);
    });
  };

  // Crear Producto
  const handleCrearProducto = (e: React.FormEvent) => {
    e.preventDefault();
    const precioNum = parseFloat(precioProducto);
    if (!nombreProducto.trim() || isNaN(precioNum) || !categoriaProductoId) return;

    startTransition(async () => {
      const res = await crearProducto({
        nombre: nombreProducto.trim(),
        precio: precioNum,
        categoriaId: categoriaProductoId,
      });

      if (res.success && res.data) {
        setProductos((prev) => [...prev, res.data as Producto]);
        setNombreProducto('');
        setPrecioProducto('');
        setMostrarFormProducto(false);
        setMensaje({ tipo: 'exito', texto: '✅ Platillo agregado al menú.' });
      } else {
        setMensaje({ tipo: 'error', texto: res.error || 'Error al crear platillo.' });
      }
      setTimeout(() => setMensaje(null), 3000);
    });
  };

  // Toggle Disponible / Agotado
  const handleToggleDisponibilidad = (id: string) => {
    startTransition(async () => {
      const res = await toggleDisponibilidad(id);
      if (res.success && res.data) {
        setProductos((prev) =>
          prev.map((p) => (p.id === id ? { ...p, disponible: res.data.disponible } : p))
        );
      }
    });
  };

  // Actualizar Precio Inline
  const handleGuardarPrecio = (id: string) => {
    const nuevoPrecio = parseFloat(precioEditado);
    if (isNaN(nuevoPrecio) || nuevoPrecio <= 0) return;

    startTransition(async () => {
      const res = await actualizarProducto(id, { precio: nuevoPrecio });
      if (res.success && res.data) {
        setProductos((prev) =>
          prev.map((p) => (p.id === id ? { ...p, precio: res.data.precio } : p))
        );
        setEditandoId(null);
      }
    });
  };

  // Eliminar Producto
  const handleEliminarProducto = (id: string, nombre: string) => {
    if (!confirm(`¿Estás seguro de eliminar "${nombre}" del menú?`)) return;

    startTransition(async () => {
      const res = await eliminarProducto(id);
      if (res.success) {
        setProductos((prev) => prev.filter((p) => p.id !== id));
        setMensaje({ tipo: 'exito', texto: `Platillo "${nombre}" eliminado.` });
        setTimeout(() => setMensaje(null), 3000);
      }
    });
  };

  return (
    <div className="space-y-8">
      {/* Alerta de notificación */}
      {mensaje && (
        <div
          className={`rounded-xl p-3.5 text-sm font-semibold border ${
            mensaje.tipo === 'exito'
              ? 'bg-emerald-950/70 border-emerald-800 text-emerald-300'
              : 'bg-rose-950/70 border-rose-800 text-rose-300'
          }`}
        >
          {mensaje.texto}
        </div>
      )}

      {/* SECCIÓN 1: GESTIÓN DE CATEGORÍAS */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-sm">
        <h2 className="text-base font-bold text-white mb-1">📂 Categorías del Menú</h2>
        <p className="text-xs text-zinc-400 mb-4">
          Organiza tus platillos en secciones (Hamburguesas, Bebidas, Postres, etc.).
        </p>

        {/* Input para agregar categoría */}
        <form onSubmit={handleCrearCategoria} className="flex gap-2 max-w-md mb-5">
          <input
            type="text"
            required
            placeholder="Nueva categoría (ej. Tacos, Pizzas)"
            value={nuevaCategoria}
            onChange={(e) => setNuevaCategoria(e.target.value)}
            className="flex-1 rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-sm text-white placeholder-zinc-500 focus:border-orange-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={isPending}
            className="rounded-xl bg-orange-500 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-orange-600 disabled:opacity-50 active:scale-95 transition-all"
          >
            + Agregar
          </button>
        </form>

        {/* Badges de categorías */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setCategoriaSeleccionada('todas')}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all border ${
              categoriaSeleccionada === 'todas'
                ? 'bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/20'
                : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-700'
            }`}
          >
            🍽️ Todas ({productos.length})
          </button>

          {categorias.map((cat) => (
            <div
              key={cat.id}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-1 text-xs font-semibold transition-all ${
                categoriaSeleccionada === cat.id
                  ? 'bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/20'
                  : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <button
                type="button"
                onClick={() => setCategoriaSeleccionada(cat.id)}
                className="hover:underline"
              >
                {cat.nombre} ({productos.filter((p) => p.categoriaId === cat.id).length})
              </button>
              <button
                type="button"
                onClick={() => handleEliminarCategoria(cat.id, cat.nombre)}
                disabled={isPending}
                className="ml-1 text-zinc-500 hover:text-rose-400 text-sm font-bold leading-none"
                title="Eliminar categoría"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* SECCIÓN 2: GESTIÓN DE PRODUCTOS */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-base font-bold text-white">🍔 Platillos y Productos</h2>
            <p className="text-xs text-zinc-400">
              Mostrando {productosFiltrados.length} platillos. Los cambios se reflejan al instante en la estación de meseros.
            </p>
          </div>

          <button
            onClick={() => setMostrarFormProducto(!mostrarFormProducto)}
            className="rounded-xl bg-orange-500 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-orange-600 active:scale-95 transition-all self-start"
          >
            {mostrarFormProducto ? '✕ Cerrar formulario' : '➕ Nuevo Platillo'}
          </button>
        </div>

        {/* Formulario colapsable para crear producto */}
        {mostrarFormProducto && (
          <form
            onSubmit={handleCrearProducto}
            className="mb-8 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 grid gap-4 sm:grid-cols-3"
          >
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Nombre del Platillo
              </label>
              <input
                type="text"
                required
                placeholder="Ej: Tacos al Pastor (Orden de 4)"
                value={nombreProducto}
                onChange={(e) => setNombreProducto(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-orange-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Precio ($)
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                required
                placeholder="Ej: 85.00"
                value={precioProducto}
                onChange={(e) => setPrecioProducto(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-orange-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Categoría
              </label>
              <select
                value={categoriaProductoId}
                onChange={(e) => setCategoriaProductoId(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none"
              >
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setMostrarFormProducto(false)}
                className="rounded-xl bg-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="rounded-xl bg-orange-500 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-orange-600 disabled:opacity-50"
              >
                {isPending ? 'Guardando...' : 'Guardar Platillo'}
              </button>
            </div>
          </form>
        )}

        {/* Grid de Platillos */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {productosFiltrados.map((producto) => (
            <div
              key={producto.id}
              className={`rounded-2xl border p-4 transition-all ${
                producto.disponible
                  ? 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700'
                  : 'border-zinc-900 bg-zinc-950/40 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="rounded-lg bg-zinc-800 px-2.5 py-0.5 text-[11px] font-semibold text-zinc-400">
                  {producto.categoria.nombre}
                </span>

                {/* Botón de Disponibilidad (Switch rápido) */}
                <button
                  onClick={() => handleToggleDisponibilidad(producto.id)}
                  disabled={isPending}
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider transition-all border ${
                    producto.disponible
                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800 hover:bg-emerald-900'
                      : 'bg-rose-950/80 text-rose-300 border-rose-800 hover:bg-rose-900'
                  }`}
                  title="Clic para cambiar entre Disponible y Agotado"
                >
                  {producto.disponible ? '🟢 Disponible' : '🔴 Agotado'}
                </button>
              </div>

              <h3 className="font-bold text-white text-base mb-1">{producto.nombre}</h3>

              {/* Precio y edición inline */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-800/80">
                {editandoId === producto.id ? (
                  <div className="flex items-center gap-1.5">
                    <span className="text-zinc-500 text-sm">$</span>
                    <input
                      type="number"
                      step="0.5"
                      autoFocus
                      value={precioEditado}
                      onChange={(e) => setPrecioEditado(e.target.value)}
                      className="w-20 rounded-lg border border-orange-500 bg-zinc-900 px-2 py-1 text-sm font-bold text-white focus:outline-none"
                    />
                    <button
                      onClick={() => handleGuardarPrecio(producto.id)}
                      className="rounded-lg bg-orange-500 px-2 py-1 text-xs font-bold text-white"
                    >
                      ✓
                    </button>
                    <button
                      onClick={() => setEditandoId(null)}
                      className="rounded-lg bg-zinc-800 px-2 py-1 text-xs font-semibold text-zinc-400"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setEditandoId(producto.id);
                      setPrecioEditado(producto.precio.toString());
                    }}
                    className="flex items-center gap-1 group text-left"
                    title="Clic para editar precio"
                  >
                    <span className="text-lg font-bold text-orange-400 group-hover:text-orange-300">
                      ${producto.precio.toFixed(2)}
                    </span>
                    <span className="text-[11px] text-zinc-600 group-hover:text-zinc-400 ml-1">✏️</span>
                  </button>
                )}

                <button
                  onClick={() => handleEliminarProducto(producto.id, producto.nombre)}
                  disabled={isPending}
                  className="text-xs font-medium text-zinc-600 hover:text-rose-400 transition-colors"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>

        {productosFiltrados.length === 0 && (
          <div className="py-16 text-center text-zinc-600">
            <p className="text-4xl mb-2">🍽️</p>
            <p className="text-sm font-medium text-zinc-400">No hay platillos en esta categoría</p>
            <button
              onClick={() => setMostrarFormProducto(true)}
              className="mt-3 text-xs text-orange-400 hover:underline"
            >
              + Agregar el primer platillo
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

