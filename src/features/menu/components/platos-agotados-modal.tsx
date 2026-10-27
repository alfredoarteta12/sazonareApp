'use client';

import { useState, useEffect, useTransition } from 'react';
import { toggleDisponibilidad, getTodosLosProductos } from '../actions/menu-queries';
import { supabase } from '@/lib/supabase';
import { formatearCOP } from '@/lib/currency';

export interface ProductoAgotadoItem {
  id: string;
  nombre: string;
  precio: number;
  disponible: boolean;
  categoriaId: string;
  categoria: { id: string; nombre: string };
}

interface PlatosAgotadosModalProps {
  onCerrar: () => void;
  productosIniciales?: ProductoAgotadoItem[];
}

export function PlatosAgotadosModal({ onCerrar, productosIniciales }: PlatosAgotadosModalProps) {
  const [productos, setProductos] = useState<ProductoAgotadoItem[]>(productosIniciales || []);
  const [cargando, setCargando] = useState(!productosIniciales || productosIniciales.length === 0);
  const [busqueda, setBusqueda] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todas');
  const [soloAgotados, setSoloAgotados] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Carga inicial directa con Server Action (independiente de sesión)
  useEffect(() => {
    if (!productosIniciales || productosIniciales.length === 0) {
      getTodosLosProductos()
        .then((res) => {
          if (res.success && res.data) {
            setProductos(res.data);
          }
          setCargando(false);
        })
        .catch((err) => {
          console.error('Error al cargar productos:', err);
          setCargando(false);
        });
    }
  }, [productosIniciales]);

  // Sincronización en tiempo real vía Supabase Realtime
  useEffect(() => {
    const canal = supabase
      .channel('cambios-modal-agotados')
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
          } else if (payload.eventType === 'INSERT' || payload.eventType === 'DELETE') {
            getTodosLosProductos().then((res) => {
              if (res.success && res.data) setProductos(res.data);
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, []);

  // Alternar disponibilidad con actualización optimista instantánea
  const handleToggle = (id: string) => {
    setProductos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, disponible: !p.disponible } : p))
    );

    startTransition(async () => {
      const res = await toggleDisponibilidad(id);
      if (!res.success) {
        // Revertir en caso de error
        setProductos((prev) =>
          prev.map((p) => (p.id === id ? { ...p, disponible: !p.disponible } : p))
        );
      }
    });
  };

  const categorias = ['todas', ...new Set(productos.map((p) => p.categoria.nombre))];
  const totalAgotados = productos.filter((p) => !p.disponible).length;

  const productosFiltrados = productos.filter((p) => {
    const coincideBusqueda = p.nombre.toLowerCase().includes(busqueda.toLowerCase());
    const coincideCategoria = filtroCategoria === 'todas' || p.categoria.nombre === filtroCategoria;
    const coincideAgotados = !soloAgotados || !p.disponible;
    return coincideBusqueda && coincideCategoria && coincideAgotados;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-2 sm:p-5 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onCerrar} />

      <div className="relative z-10 flex h-[92dvh] max-h-[800px] w-full max-w-3xl flex-col rounded-3xl border border-zinc-800 bg-zinc-950 p-3.5 sm:p-6 shadow-2xl overflow-hidden pb-safe">
        {/* Cabecera */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/30 text-2xl">
              🚫
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white">
                  Control de Platos Agotados
                </h3>
                {totalAgotados > 0 && (
                  <span className="rounded-full bg-rose-500/20 border border-rose-500/40 px-2.5 py-0.5 text-xs font-black text-rose-300">
                    {totalAgotados} {totalAgotados === 1 ? 'agotado' : 'agotados'}
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400">
                Se refleja al instante en las pantallas de meseros y comandas.
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

        {/* Buscador y Filtros */}
        <div className="py-3.5 space-y-3 shrink-0 border-b border-zinc-800/80">
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-zinc-500">
              🔍
            </span>
            <input
              type="text"
              placeholder="Buscar platillo por nombre (ej: hamburguesa, limonada, papas)..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 py-2.5 pl-10 pr-4 text-xs sm:text-sm text-white placeholder-zinc-500 focus:border-orange-500 focus:outline-none"
            />
            {busqueda && (
              <button
                type="button"
                onClick={() => setBusqueda('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          {/* Chips de categorías y filtro de agotados */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <button
              type="button"
              onClick={() => setSoloAgotados(!soloAgotados)}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all border shrink-0 ${
                soloAgotados
                  ? 'bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-600/30'
                  : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
              }`}
            >
              🔴 Solo Agotados ({totalAgotados})
            </button>

            <div className="h-4 w-px bg-zinc-800 shrink-0 mx-1" />

            {categorias.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setFiltroCategoria(cat)}
                className={`whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-semibold transition-all border shrink-0 ${
                  filtroCategoria === cat
                    ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                    : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white hover:bg-zinc-800'
                }`}
              >
                {cat === 'todas' ? '🍽️ Todas' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Lista de productos con interruptores */}
        <div className="flex-1 overflow-y-auto py-3 space-y-2 pr-1">
          {cargando ? (
            <div className="py-20 text-center text-zinc-500">
              <p className="text-sm">Cargando catálogo de productos...</p>
            </div>
          ) : productosFiltrados.length === 0 ? (
            <div className="py-16 text-center text-zinc-500">
              <p className="text-3xl mb-1">🔍</p>
              <p className="text-sm font-semibold">No se encontraron productos con ese filtro.</p>
            </div>
          ) : (
            productosFiltrados.map((prod) => (
              <div
                key={prod.id}
                className={`flex items-center justify-between rounded-2xl border p-3 sm:p-3.5 transition-all ${
                  prod.disponible
                    ? 'border-zinc-800/80 bg-zinc-900/50 hover:border-zinc-700'
                    : 'border-rose-900/60 bg-rose-950/20 ring-1 ring-rose-500/30'
                }`}
              >
                <div className="min-w-0 pr-3">
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-zinc-800 px-2 py-0.5 text-[10px] font-semibold text-zinc-400">
                      {prod.categoria.nombre}
                    </span>
                    {!prod.disponible && (
                      <span className="rounded-md bg-rose-500/20 border border-rose-500/40 px-2 py-0.5 text-[10px] font-black text-rose-300 uppercase">
                        Agotado
                      </span>
                    )}
                  </div>
                  <p className="text-sm sm:text-base font-bold text-white truncate mt-1">
                    {prod.nombre}
                  </p>
                  <p className="text-xs text-orange-400 font-semibold mt-0.5">
                    {formatearCOP(prod.precio)}
                  </p>
                </div>

                {/* Botón táctil grande de alternancia */}
                <button
                  type="button"
                  onClick={() => handleToggle(prod.id)}
                  disabled={isPending}
                  className={`shrink-0 flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-extrabold transition-all active:scale-95 border ${
                    prod.disponible
                      ? 'bg-emerald-950/70 border-emerald-800/80 text-emerald-300 hover:bg-emerald-900/80 hover:border-emerald-600'
                      : 'bg-rose-600 border-rose-500 text-white shadow-lg shadow-rose-600/30 animate-pulse'
                  }`}
                >
                  <span className="text-base">{prod.disponible ? '🟢' : '🔴'}</span>
                  <span>{prod.disponible ? 'Disponible' : 'AGOTADO'}</span>
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer del Modal */}
        <div className="pt-3 border-t border-zinc-800 flex items-center justify-between shrink-0">
          <p className="text-[11px] text-zinc-500">
            Toca el botón para alternar el estado del platillo.
          </p>
          <button
            type="button"
            onClick={onCerrar}
            className="rounded-xl bg-zinc-800 px-4 py-2 text-xs font-bold text-white hover:bg-zinc-700 transition-colors"
          >
            Listo ✓
          </button>
        </div>
      </div>
    </div>
  );
}

