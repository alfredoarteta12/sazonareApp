'use client';

import { useState, useTransition } from 'react';
import { crearPedido } from '@/features/orders/actions/order-mutations';

interface Producto {
  id: string;
  nombre: string;
  precio: number;
  categoriaId: string;
  categoria: { id: string; nombre: string };
}

interface ItemCarrito {
  productoId: string;
  nombre: string;
  precio: number;
  cantidad: number;
}

interface MeseroGridProps {
  productos: Producto[];
}

export function MeseroGrid({ productos }: MeseroGridProps) {
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
  const [mesa, setMesa] = useState<number>(1);
  const [categoriaActiva, setCategoriaActiva] = useState<string>('todas');
  const [carritoAbiertoEnMovil, setCarritoAbiertoEnMovil] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [mensaje, setMensaje] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);

  // Categorías únicas
  const categorias = ['todas', ...new Set(productos.map((p) => p.categoria.nombre))];

  const productosFiltrados =
    categoriaActiva === 'todas'
      ? productos
      : productos.filter((p) => p.categoria.nombre === categoriaActiva);

  const agregarAlCarrito = (producto: Producto) => {
    setCarrito((prev) => {
      const existente = prev.find((i) => i.productoId === producto.id);
      if (existente) {
        return prev.map((i) =>
          i.productoId === producto.id ? { ...i, cantidad: i.cantidad + 1 } : i
        );
      }
      return [
        ...prev,
        {
          productoId: producto.id,
          nombre: producto.nombre,
          precio: producto.precio,
          cantidad: 1,
        },
      ];
    });
  };

  const quitarDelCarrito = (productoId: string) => {
    setCarrito((prev) => {
      const existente = prev.find((i) => i.productoId === productoId);
      if (existente && existente.cantidad > 1) {
        return prev.map((i) =>
          i.productoId === productoId ? { ...i, cantidad: i.cantidad - 1 } : i
        );
      }
      return prev.filter((i) => i.productoId !== productoId);
    });
  };

  const totalCantidad = carrito.reduce((acc, i) => acc + i.cantidad, 0);
  const totalCarrito = carrito.reduce((acc, i) => acc + i.precio * i.cantidad, 0);

  const enviarPedido = () => {
    if (carrito.length === 0) return;
    startTransition(async () => {
      const result = await crearPedido(mesa, carrito);
      if (result.success) {
        setCarrito([]);
        setMensaje({ tipo: 'exito', texto: `✅ Comanda enviada a Cocina (Mesa ${mesa})` });
        setCarritoAbiertoEnMovil(false);
      } else {
        setMensaje({ tipo: 'error', texto: result.error || 'Error al enviar comanda' });
      }
      setTimeout(() => setMensaje(null), 4000);
    });
  };

  // Contenido reutilizable del carrito (usado tanto en sidebar desktop como en drawer móvil)
  const ContenidoCarrito = () => (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span>🛒 Comanda</span>
            <span className="rounded-full bg-orange-500/20 text-orange-400 text-xs px-2 py-0.5 font-bold">
              {totalCantidad} {totalCantidad === 1 ? 'ítem' : 'ítems'}
            </span>
          </h2>
          {carrito.length > 0 && (
            <button
              type="button"
              onClick={() => setCarrito([])}
              className="text-xs text-zinc-500 hover:text-rose-400 underline transition-colors ml-1"
            >
              Vaciar
            </button>
          )}
        </div>
        {/* Botón cerrar en móvil */}
        <button
          onClick={() => setCarritoAbiertoEnMovil(false)}
          className="lg:hidden rounded-lg p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Selector de mesa */}
      <div className="my-4">
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Mesa Número
        </label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMesa((m) => Math.max(1, m - 1))}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 text-lg font-bold hover:bg-zinc-800 active:scale-95 text-white"
          >
            -
          </button>
          <input
            type="number"
            min={1}
            max={99}
            value={mesa}
            onChange={(e) => setMesa(Math.max(1, Number(e.target.value)))}
            className="flex-1 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-center text-xl font-bold text-white focus:border-orange-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setMesa((m) => m + 1)}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 text-lg font-bold hover:bg-zinc-800 active:scale-95 text-white"
          >
            +
          </button>
        </div>
      </div>

      {/* Lista de productos en la comanda */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {carrito.length === 0 ? (
          <div className="py-12 text-center text-zinc-500">
            <p className="text-3xl mb-1">🍔</p>
            <p className="text-xs">No hay platillos en la orden.</p>
            <p className="text-[11px] text-zinc-600 mt-1">Toca los platillos para agregarlos.</p>
          </div>
        ) : (
          carrito.map((item) => (
            <div
              key={item.productoId}
              className="flex items-center justify-between gap-2 rounded-xl bg-zinc-900 border border-zinc-800/80 p-2.5"
            >
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-semibold text-white">{item.nombre}</p>
                <p className="text-xs text-orange-400 font-bold">
                  ${(item.precio * item.cantidad).toFixed(2)}
                  <span className="text-zinc-500 font-normal text-[11px] ml-1">
                    (${item.precio.toFixed(2)} c/u)
                  </span>
                </p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => quitarDelCarrito(item.productoId)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-800 text-sm font-bold text-zinc-300 hover:bg-rose-950 hover:text-rose-300 transition-colors active:scale-90"
                >
                  -
                </button>
                <span className="w-6 text-center text-sm font-bold text-white">{item.cantidad}</span>
                <button
                  type="button"
                  onClick={() =>
                    agregarAlCarrito({
                      id: item.productoId,
                      nombre: item.nombre,
                      precio: item.precio,
                      categoriaId: '',
                      categoria: { id: '', nombre: '' },
                    })
                  }
                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-800 text-sm font-bold text-zinc-300 hover:bg-emerald-950 hover:text-emerald-300 transition-colors active:scale-90"
                >
                  +
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Resumen total y botón de envío */}
      <div className="mt-4 border-t border-zinc-800 pt-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-medium text-zinc-400">Total a pagar</span>
          <span className="text-2xl font-bold text-white">${totalCarrito.toFixed(2)}</span>
        </div>

        {mensaje && (
          <div
            className={`mb-3 rounded-xl p-2.5 text-center text-xs font-semibold ${
              mensaje.tipo === 'exito'
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                : 'bg-rose-950 text-rose-300 border border-rose-800'
            }`}
          >
            {mensaje.texto}
          </div>
        )}

        <button
          type="button"
          onClick={enviarPedido}
          disabled={carrito.length === 0 || isPending}
          className="w-full rounded-xl bg-orange-500 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/20 transition-all hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
        >
          {isPending ? 'Enviando a cocina...' : '🚀 Enviar Comanda'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="relative flex h-full flex-col lg:flex-row gap-4 lg:gap-6">
      {/* PANEL DEL MENÚ (Siempre visible a pantalla completa en móvil y adaptable en desktop) */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Filtro horizontal de categorías */}
        <div className="mb-3 flex gap-2 overflow-x-auto pb-1 no-scrollbar shrink-0">
          {categorias.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoriaActiva(cat)}
              className={`whitespace-nowrap rounded-xl px-3.5 py-2 text-xs sm:text-sm font-semibold transition-all border ${
                categoriaActiva === cat
                  ? 'bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/20'
                  : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800 border-zinc-800'
              }`}
            >
              {cat === 'todas' ? '🍽️ Todas' : cat}
            </button>
          ))}
        </div>

        {/* Cuadrícula táctil de productos */}
        <div className="flex-1 overflow-y-auto pb-24 lg:pb-0 pr-1">
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3">
            {productosFiltrados.map((producto) => {
              const enCarrito = carrito.find((i) => i.productoId === producto.id);
              return (
                <button
                  key={producto.id}
                  type="button"
                  onClick={() => agregarAlCarrito(producto)}
                  className={`relative flex flex-col justify-between rounded-2xl border p-3 sm:p-4 text-left transition-all active:scale-95 min-h-[110px] sm:min-h-[120px] ${
                    enCarrito
                      ? 'border-orange-500 bg-orange-950/30'
                      : 'border-zinc-800/80 bg-zinc-950 hover:border-zinc-700'
                  }`}
                >
                  {enCarrito && (
                    <span className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white shadow-md">
                      {enCarrito.cantidad}
                    </span>
                  )}
                  <div>
                    <span className="text-[10px] sm:text-xs text-zinc-400 font-medium line-clamp-1">
                      {producto.categoria.nombre}
                    </span>
                    <p className="font-bold text-white text-xs sm:text-sm line-clamp-2 mt-0.5">
                      {producto.nombre}
                    </p>
                  </div>
                  <p className="mt-2 text-base sm:text-lg font-bold text-orange-400">
                    ${producto.precio.toFixed(2)}
                  </p>
                </button>
              );
            })}
          </div>

          {productosFiltrados.length === 0 && (
            <div className="py-16 text-center text-zinc-500">
              <p className="text-3xl mb-1">🍽️</p>
              <p className="text-sm">No hay platillos en esta categoría</p>
            </div>
          )}
        </div>
      </div>

      {/* PANEL LATERAL DEL CARRITO (Sólo en Desktop / Pantallas grandes >= lg) */}
      <div className="hidden lg:flex w-80 xl:w-96 flex-col rounded-2xl border border-zinc-800 bg-zinc-950 p-5 shadow-xl shrink-0">
        <ContenidoCarrito />
      </div>

      {/* BOTÓN FLOTANTE INFERIOR EN TELÉFONOS (Móvil < lg) */}
      <div className="lg:hidden fixed bottom-4 left-3 right-3 z-40">
        <button
          type="button"
          onClick={() => setCarritoAbiertoEnMovil(true)}
          className={`w-full flex items-center justify-between rounded-2xl px-4 py-3.5 shadow-2xl active:scale-98 transition-all font-bold ${
            totalCantidad > 0
              ? 'bg-orange-500 text-white shadow-orange-500/40 ring-2 ring-orange-400/50'
              : 'bg-zinc-900/95 text-zinc-300 border border-zinc-800 backdrop-blur-md'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-black ${
                totalCantidad > 0 ? 'bg-white text-orange-600' : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              {totalCantidad}
            </span>
            <span className="text-sm font-semibold">
              Mesa {mesa} • {totalCantidad > 0 ? 'Ver Comanda' : 'Abrir Comanda'}
            </span>
          </div>
          <span className="text-sm sm:text-base font-extrabold">
            {totalCantidad > 0 ? `$${totalCarrito.toFixed(2)} →` : 'Mesa ' + mesa}
          </span>
        </button>
      </div>

      {/* DRAWER / MODAL DEL CARRITO EN MÓVIL (< lg) */}
      {carritoAbiertoEnMovil && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/80 backdrop-blur-sm transition-opacity duration-200">
          {/* Fondo para cerrar al tocar afuera */}
          <div
            className="flex-1"
            onClick={() => setCarritoAbiertoEnMovil(false)}
          />

          {/* Contenedor del Drawer con altura dinámica */}
          <div className="w-full max-h-[85dvh] sm:max-h-[85vh] rounded-t-3xl border-t border-zinc-800 bg-zinc-950 p-4 sm:p-5 shadow-2xl flex flex-col transition-transform duration-300">
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-zinc-800 shrink-0" />
            <div className="flex-1 overflow-hidden flex flex-col">
              <ContenidoCarrito />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
