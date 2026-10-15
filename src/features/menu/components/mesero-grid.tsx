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
  const [isPending, startTransition] = useTransition();
  const [mensaje, setMensaje] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);

  // Obtener categorías únicas
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
      return [...prev, { productoId: producto.id, nombre: producto.nombre, precio: producto.precio, cantidad: 1 }];
    });
  };

  const quitarDelCarrito = (productoId: string) => {
    setCarrito((prev) => {
      const existente = prev.find((i) => i.productoId === productoId);
      if (existente && existente.cantidad > 1) {
        return prev.map((i) => i.productoId === productoId ? { ...i, cantidad: i.cantidad - 1 } : i);
      }
      return prev.filter((i) => i.productoId !== productoId);
    });
  };

  const totalCarrito = carrito.reduce((acc, i) => acc + i.precio * i.cantidad, 0);

  const enviarPedido = () => {
    if (carrito.length === 0) return;
    startTransition(async () => {
      const result = await crearPedido(mesa, carrito);
      if (result.success) {
        setCarrito([]);
        setMensaje({ tipo: 'exito', texto: `✅ Comanda enviada para Mesa ${mesa}` });
      } else {
        setMensaje({ tipo: 'error', texto: result.error || 'Error al enviar' });
      }
      setTimeout(() => setMensaje(null), 3000);
    });
  };

  return (
    <div className="flex h-full gap-6">
      {/* Panel izquierdo: Menú */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Filtro de categorías */}
        <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
          {categorias.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoriaActiva(cat)}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                categoriaActiva === cat
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                  : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800 border border-zinc-800'
              }`}
            >
              {cat === 'todas' ? '🍽️ Todas' : cat}
            </button>
          ))}
        </div>

        {/* Grid de productos */}
        <div className="grid gap-3 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 pr-1">
          {productosFiltrados.map((producto) => {
            const enCarrito = carrito.find((i) => i.productoId === producto.id);
            return (
              <button
                key={producto.id}
                onClick={() => agregarAlCarrito(producto)}
                className={`relative rounded-2xl border p-4 text-left transition-all active:scale-95 ${
                  enCarrito
                    ? 'border-orange-500 bg-orange-950/30'
                    : 'border-zinc-800/80 bg-zinc-950 hover:border-zinc-700'
                }`}
              >
                {enCarrito && (
                  <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white shadow">
                    {enCarrito.cantidad}
                  </span>
                )}
                <p className="font-semibold text-white">{producto.nombre}</p>
                <p className="mt-1 text-xs text-zinc-400">{producto.categoria.nombre}</p>
                <p className="mt-3 text-lg font-bold text-orange-400">${producto.precio.toFixed(2)}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Panel derecho: Carrito */}
      <div className="flex w-80 flex-col rounded-2xl border border-zinc-800 bg-zinc-950 p-5 shadow-xl">
        <h2 className="mb-4 text-lg font-bold text-white flex items-center gap-2">
          🛒 Comanda actual
        </h2>

        {/* Selector de mesa */}
        <div className="mb-4">
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Número de Mesa
          </label>
          <input
            type="number"
            min={1}
            max={99}
            value={mesa}
            onChange={(e) => setMesa(Number(e.target.value))}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-center text-lg font-bold text-white focus:border-orange-500 focus:outline-none"
          />
        </div>

        {/* Items del carrito */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {carrito.length === 0 ? (
            <div className="py-12 text-center text-zinc-500">
              <p className="text-3xl mb-1">👈</p>
              <p className="text-xs">Toca los platillos para agregarlos</p>
            </div>
          ) : (
            carrito.map((item) => (
              <div key={item.productoId} className="flex items-center gap-2 rounded-xl bg-zinc-900 border border-zinc-800/60 p-2.5">
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-white">{item.nombre}</p>
                  <p className="text-xs text-zinc-400">${item.precio.toFixed(2)} c/u</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => quitarDelCarrito(item.productoId)}
                    className="flex h-6 w-6 items-center justify-center rounded-lg bg-zinc-800 text-sm font-bold text-zinc-300 hover:bg-rose-950 hover:text-rose-400 transition-colors"
                  >
                    -
                  </button>
                  <span className="w-5 text-center text-sm font-bold text-white">{item.cantidad}</span>
                  <button
                    onClick={() => agregarAlCarrito({ id: item.productoId, nombre: item.nombre, precio: item.precio, categoriaId: '', categoria: { id: '', nombre: '' } })}
                    className="flex h-6 w-6 items-center justify-center rounded-lg bg-zinc-800 text-sm font-bold text-zinc-300 hover:bg-emerald-950 hover:text-emerald-400 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Total y botón de envío */}
        <div className="mt-4 border-t border-zinc-800 pt-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-400">Total a pagar</span>
            <span className="text-2xl font-bold text-white">${totalCarrito.toFixed(2)}</span>
          </div>

          {mensaje && (
            <div className={`mb-3 rounded-xl p-2.5 text-center text-xs font-semibold ${
              mensaje.tipo === 'exito' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-rose-950 text-rose-300 border border-rose-800'
            }`}>
              {mensaje.texto}
            </div>
          )}

          <button
            onClick={enviarPedido}
            disabled={carrito.length === 0 || isPending}
            className="w-full rounded-xl bg-orange-500 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/20 transition-all hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
          >
            {isPending ? 'Enviando...' : '🚀 Enviar Comanda'}
          </button>
        </div>
      </div>
    </div>
  );
}
