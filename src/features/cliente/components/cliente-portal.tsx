'use client';

import { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { formatearCOP } from '@/lib/currency';
import { crearPedidoCliente, ItemCarrito } from '@/features/orders/actions/order-mutations';

export interface ProductoCliente {
  id: string;
  nombre: string;
  precio: number;
  imagen?: string | null;
  disponible: boolean;
  categoriaId: string;
  categoria: { id: string; nombre: string };
}

interface ClientePortalProps {
  productosIniciales: ProductoCliente[];
  categorias: { id: string; nombre: string }[];
  mesaInicial?: number;
}

const PROMOCIONES_CASA = [
  {
    id: 'promo-1',
    titulo: '🍔 Combo Pareja Sazonare',
    descripcion: '2 Hamburguesas Especiales + Papas Francesas + 2 Bebidas',
    precioPromo: 42000,
    precioAntes: 48000,
    badge: 'Popular 🔥',
  },
  {
    id: 'promo-2',
    titulo: '🥓 Salvajada Familiar',
    descripcion: 'Para 3-4 personas: Carnes mixtas, tocineta, queso gratinado y papas',
    precioPromo: 58000,
    precioAntes: 65000,
    badge: 'Para Compartir ✨',
  },
  {
    id: 'promo-3',
    titulo: '🥤 Refresco Refrescante',
    descripcion: 'Pide cualquier plato fuerte y añade gaseosa o jugo natural con descuento',
    precioPromo: 4000,
    precioAntes: 6000,
    badge: 'Acompañamiento ❄️',
  },
];

const CHIPS_NOTAS_RAPIDAS = [
  'Sin salsas',
  'Sin cebolla',
  'Sin tomate',
  'Sin lechuga',
  'Salsas aparte',
  'Término 3/4',
  'Bien cocido',
  'Sin hielo',
];

export function ClientePortal({
  productosIniciales,
  categorias,
  mesaInicial = 1,
}: ClientePortalProps) {
  const [productos, setProductos] = useState<ProductoCliente[]>(productosIniciales);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>('todas');
  const [busqueda, setBusqueda] = useState<string>('');
  const [mesa, setMesa] = useState<number>(mesaInicial);

  // Carrito de compras
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
  const [mostrarModalCarrito, setMostrarModalCarrito] = useState(false);
  const [nombreCliente, setNombreCliente] = useState('');
  const [notasPedido, setNotasPedido] = useState('');
  const [isPending, startTransition] = useTransition();

  // Modal para agregar platillo con notas personalizadas
  const [platilloPersonalizar, setPlatilloPersonalizar] = useState<ProductoCliente | null>(null);
  const [notaPlatillo, setNotaPlatillo] = useState('');
  const [cantidadPersonalizar, setCantidadPersonalizar] = useState(1);

  // Estado del pedido activo enviado
  const [pedidoActivo, setPedidoActivo] = useState<{
    id: string;
    mesa: number;
    total: number;
    estado: string;
    cliente?: string | null;
    detalle?: string | null;
    createdAt?: string;
  } | null>(null);

  const [mostrarTracker, setMostrarTracker] = useState(false);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  // 1. Cargar pedido guardado en sesión local
  useEffect(() => {
    try {
      const guardado = localStorage.getItem(`sazonare_pedido_cliente_m${mesa}`);
      if (guardado) {
        const parsed = JSON.parse(guardado);
        if (parsed?.id && parsed.estado !== 'PAGADO' && parsed.estado !== 'CANCELADO') {
          setPedidoActivo(parsed);
          setMostrarTracker(true);
        }
      }
    } catch (e) {
      // Ignorar error de parsing
    }
  }, [mesa]);

  // 2. Sincronización de disponibilidad de productos en cocina
  useEffect(() => {
    let activo = true;

    // Sincronización periódica resiliente (compatible con AWS y Supabase)
    const sincronizarProductos = async () => {
      try {
        const res = await fetch('/api/productos', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (!activo) return;
        setProductos((prev) =>
          prev.map((p) => {
            const actualizado = data.find((d: any) => d.id === p.id);
            if (actualizado && actualizado.disponible !== p.disponible) {
              return { ...p, disponible: actualizado.disponible, precio: Number(actualizado.precio) };
            }
            return p;
          })
        );
      } catch (e) {}
    };

    const intervalo = setInterval(sincronizarProductos, 12000);

    // Canal opcional en tiempo real
    const canalProductos = supabase
      .channel('cambios-productos-cliente')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'Producto' },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            const prodActualizado = payload.new as any;
            setProductos((prev) =>
              prev.map((p) =>
                p.id === prodActualizado.id
                  ? {
                      ...p,
                      disponible: prodActualizado.disponible,
                      precio: Number(prodActualizado.precio),
                      nombre: prodActualizado.nombre,
                    }
                  : p
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      activo = false;
      clearInterval(intervalo);
      supabase.removeChannel(canalProductos);
    };
  }, []);

  // 3. Sincronización en tiempo real del estado del pedido activo del cliente (Polling AWS + Supabase)
  useEffect(() => {
    if (!pedidoActivo?.id) return;
    let activo = true;

    const verificarEstado = async () => {
      try {
        const res = await fetch('/api/pedidos/activos?todosHoy=true', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (!activo) return;

        const actual = data.find((p: any) => p.id === pedidoActivo.id);
        if (actual && actual.estado !== pedidoActivo.estado) {
          setPedidoActivo((prev) => {
            if (!prev) return null;
            const updated = {
              ...prev,
              estado: actual.estado,
              total: Number(actual.total),
              detalle: actual.detalle || prev.detalle,
            };
            try {
              localStorage.setItem(`sazonare_pedido_cliente_m${mesa}`, JSON.stringify(updated));
            } catch (e) {}
            return updated;
          });
        }
      } catch (e) {}
    };

    const intervalo = setInterval(verificarEstado, 3500);

    const canalPedido = supabase
      .channel(`seguimiento-pedido-${pedidoActivo.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'Pedido',
          filter: `id=eq.${pedidoActivo.id}`,
        },
        (payload) => {
          const nuevo = payload.new as any;
          setPedidoActivo((prev) => {
            if (!prev) return null;
            const updated = {
              ...prev,
              estado: nuevo.estado,
              total: Number(nuevo.total),
              detalle: nuevo.detalle || prev.detalle,
            };
            try {
              localStorage.setItem(`sazonare_pedido_cliente_m${mesa}`, JSON.stringify(updated));
            } catch (e) {}
            return updated;
          });
        }
      )
      .subscribe();

    return () => {
      activo = false;
      clearInterval(intervalo);
      supabase.removeChannel(canalPedido);
    };
  }, [pedidoActivo?.id, pedidoActivo?.estado, mesa]);

  // Filtro de productos
  const productosFiltrados = productos.filter((p) => {
    const coincideCat =
      categoriaSeleccionada === 'todas' || p.categoria.id === categoriaSeleccionada;
    const coincideBusqueda =
      busqueda === '' ||
      p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.categoria.nombre.toLowerCase().includes(busqueda.toLowerCase());
    return coincideCat && coincideBusqueda;
  });

  const totalCarrito = carrito.reduce((acc, item) => acc + item.precio * item.cantidad, 0);
  const totalItemsCarrito = carrito.reduce((acc, item) => acc + item.cantidad, 0);

  // Manejador: Abrir modal de notas
  const handleAbrirPersonalizar = (prod: ProductoCliente) => {
    if (!prod.disponible) return;
    setPlatilloPersonalizar(prod);
    setNotaPlatillo('');
    setCantidadPersonalizar(1);
  };

  // Manejador: Agregar al carrito
  const handleConfirmarAgregarPlatillo = () => {
    if (!platilloPersonalizar) return;

    const nuevoItem: ItemCarrito = {
      id: `cli-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      productoId: platilloPersonalizar.id,
      nombre: platilloPersonalizar.nombre,
      precio: platilloPersonalizar.precio,
      cantidad: cantidadPersonalizar,
      notas: notaPlatillo.trim() || undefined,
    };

    setCarrito((prev) => [...prev, nuevoItem]);
    setPlatilloPersonalizar(null);
  };

  // Manejador: Modificar cantidad en carrito
  const handleCambiarCantidad = (itemId: string | undefined, delta: number) => {
    if (!itemId) return;
    setCarrito((prev) =>
      prev
        .map((item) => {
          if (item.id === itemId) {
            const nueva = item.cantidad + delta;
            return nueva > 0 ? { ...item, cantidad: nueva } : null;
          }
          return item;
        })
        .filter(Boolean) as ItemCarrito[]
    );
  };

  // Manejador: Enviar pedido a mesero
  const handleEnviarPedido = () => {
    if (carrito.length === 0) return;

    startTransition(async () => {
      const res = await crearPedidoCliente({
        mesa,
        cliente: nombreCliente.trim() || undefined,
        notas: notasPedido.trim() || undefined,
        items: carrito,
      });

      if (res.success && res.pedido) {
        setPedidoActivo(res.pedido);
        try {
          localStorage.setItem(`sazonare_pedido_cliente_m${mesa}`, JSON.stringify(res.pedido));
        } catch (e) {}
        setCarrito([]);
        setMostrarModalCarrito(false);
        setMostrarTracker(true);
        setMensajeExito('¡Tu orden ha sido enviada al Mesero! En breve la confirmará.');
        setTimeout(() => setMensajeExito(null), 5000);
      } else {
        alert(res.error || 'Error al enviar pedido.');
      }
    });
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col pb-28 selection:bg-orange-500 selection:text-white">
      {/* 1. HEADER DEL CLIENTE */}
      <header className="sticky top-0 z-40 w-full border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-md px-4 py-3">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500 text-lg shadow-md shadow-orange-500/20">
              🍔
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-black text-white group-hover:text-orange-400 transition-colors">
                SazonareFood
              </h1>
              <p className="text-[10px] text-zinc-400">Carta Digital en Mesa</p>
            </div>
          </Link>

          {/* Selector de Mesa */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-bold text-zinc-200">
              <span>📍</span>
              <span className="text-zinc-400">Mesa:</span>
              <select
                value={mesa}
                onChange={(e) => setMesa(Number(e.target.value))}
                className="bg-transparent font-black text-orange-400 focus:outline-none cursor-pointer"
              >
                <option value={1} className="bg-zinc-950 text-white">Mesa 1</option>
                <option value={2} className="bg-zinc-950 text-white">Mesa 2</option>
                <option value={3} className="bg-zinc-950 text-white">Mesa 3 (Central)</option>
                <option value={4} className="bg-zinc-950 text-white">Mesa 4</option>
                <option value={5} className="bg-zinc-950 text-white">Mesa 5</option>
              </select>
            </div>

            {pedidoActivo && (
              <button
                type="button"
                onClick={() => setMostrarTracker(true)}
                className="flex items-center gap-1.5 rounded-xl border border-purple-500/60 bg-purple-950/40 px-3 py-1.5 text-xs font-black text-purple-200 animate-pulse"
              >
                <span>🛎️</span>
                <span className="hidden sm:inline">Mi Pedido</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* BANNER DE NOTIFICACIÓN DE ÉXITO */}
      {mensajeExito && (
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-4 py-2.5 text-center text-xs font-black text-white shadow-lg animate-in fade-in">
          🎉 {mensajeExito}
        </div>
      )}

      <main className="mx-auto w-full max-w-5xl px-4 pt-4 sm:pt-6 space-y-6">
        {/* 2. BANNER DE PROMOCIONES DE LA CASA */}
        <section className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
              <span>🔥</span>
              <span>Promociones & Especialidades del Chef</span>
            </h2>
            <span className="text-[10px] text-zinc-500 font-semibold">Ofertas válidas hoy</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {PROMOCIONES_CASA.map((promo) => (
              <div
                key={promo.id}
                className="rounded-2xl border border-orange-500/30 bg-gradient-to-br from-orange-950/20 via-zinc-900/60 to-zinc-950 p-3.5 flex flex-col justify-between shadow-lg"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="rounded-md bg-orange-500/20 border border-orange-500/40 px-2 py-0.5 text-[9px] font-black uppercase text-orange-300">
                      {promo.badge}
                    </span>
                    <span className="text-xs text-zinc-500 line-through">
                      {formatearCOP(promo.precioAntes)}
                    </span>
                  </div>
                  <h3 className="text-sm font-black text-white">{promo.titulo}</h3>
                  <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                    {promo.descripcion}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-zinc-800/80 flex items-center justify-between">
                  <span className="text-base font-black text-orange-400">
                    {formatearCOP(promo.precioPromo)}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const nuevoItem: ItemCarrito = {
                        id: `promo-${Date.now()}`,
                        productoId: promo.id,
                        nombre: promo.titulo,
                        precio: promo.precioPromo,
                        cantidad: 1,
                        notas: 'Promoción especial',
                      };
                      setCarrito((prev) => [...prev, nuevoItem]);
                    }}
                    className="rounded-xl bg-orange-500 hover:bg-orange-600 px-3 py-1.5 text-[11px] font-bold text-white transition-all active:scale-95"
                  >
                    + Pedir Promo
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 3. BUSCADOR Y CATEGORÍAS */}
        <div className="space-y-3 pt-2">
          {/* Barra de Búsqueda */}
          <div className="relative">
            <span className="absolute left-3.5 top-2.5 text-zinc-500 text-sm">🔍</span>
            <input
              type="text"
              placeholder="Buscar platillo, hamburguesa, bebida..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full rounded-2xl border border-zinc-800 bg-zinc-900/90 pl-9 pr-4 py-2 text-sm text-white placeholder-zinc-500 focus:border-orange-500 focus:outline-none"
            />
            {busqueda && (
              <button
                type="button"
                onClick={() => setBusqueda('')}
                className="absolute right-3.5 top-2 text-xs text-zinc-500 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          {/* Categorías (Pills Horizontales) */}
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            <button
              type="button"
              onClick={() => setCategoriaSeleccionada('todas')}
              className={`whitespace-nowrap rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all border shrink-0 ${
                categoriaSeleccionada === 'todas'
                  ? 'bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/20'
                  : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
              }`}
            >
              🍽️ Todos
            </button>
            {categorias.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoriaSeleccionada(cat.id)}
                className={`whitespace-nowrap rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all border shrink-0 ${
                  categoriaSeleccionada === cat.id
                    ? 'bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/20'
                    : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                }`}
              >
                {cat.nombre}
              </button>
            ))}
          </div>
        </div>

        {/* 4. CUADRÍCULA DE PLATILLOS */}
        <section className="space-y-3">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>{productosFiltrados.length} platillos disponibles</span>
            <span className="text-[11px] text-zinc-500">Toca un plato para personalizarlo</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {productosFiltrados.map((prod) => (
              <div
                key={prod.id}
                className={`rounded-2xl border p-4 flex flex-col justify-between transition-all ${
                  prod.disponible
                    ? 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 hover:bg-zinc-900/80 shadow-md'
                    : 'border-zinc-900 bg-zinc-950/30 opacity-60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="rounded-md bg-zinc-800/80 px-2 py-0.5 text-[10px] font-semibold text-zinc-400">
                      {prod.categoria.nombre}
                    </span>
                    {!prod.disponible && (
                      <span className="rounded-md bg-rose-950 border border-rose-800 px-2 py-0.5 text-[9px] font-black uppercase text-rose-300">
                        Agotado en Cocina
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-white">{prod.nombre}</h3>
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between">
                  <span className="text-lg font-black text-orange-400">
                    {formatearCOP(prod.precio)}
                  </span>

                  {prod.disponible ? (
                    <button
                      type="button"
                      onClick={() => handleAbrirPersonalizar(prod)}
                      className="rounded-xl bg-orange-500 hover:bg-orange-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-md shadow-orange-500/20 transition-all active:scale-95 flex items-center gap-1"
                    >
                      <span>+</span>
                      <span>Pedir</span>
                    </button>
                  ) : (
                    <span className="text-xs text-zinc-600 font-semibold">No disponible</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* 5. BARRA FLOTANTE INFERIOR DEL CARRITO */}
      {carrito.length > 0 && !mostrarModalCarrito && !mostrarTracker && (
        <div className="fixed bottom-4 left-4 right-4 z-40 max-w-lg mx-auto animate-in slide-in-from-bottom-3">
          <div className="rounded-2xl border border-orange-500/40 bg-zinc-950/95 backdrop-blur-xl p-3.5 shadow-2xl shadow-orange-500/25 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black text-orange-400 flex items-center gap-1.5">
                <span>🛒</span>
                <span>{totalItemsCarrito} {totalItemsCarrito === 1 ? 'platillo' : 'platillos'}</span>
              </p>
              <p className="text-base font-black text-white">{formatearCOP(totalCarrito)}</p>
            </div>

            <button
              type="button"
              onClick={() => setMostrarModalCarrito(true)}
              className="rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 px-4 py-2 text-xs font-black text-white shadow-lg shadow-orange-500/25 transition-all active:scale-95 flex items-center gap-1.5"
            >
              <span>Ver mi Pedido</span>
              <span>→</span>
            </button>
          </div>
        </div>
      )}

      {/* 6. MODAL PARA PERSONALIZAR PLATILLO CON NOTAS */}
      {platilloPersonalizar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-950 p-5 sm:p-6 shadow-2xl animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex items-start justify-between border-b border-zinc-800 pb-3">
              <div>
                <span className="text-[10px] font-semibold text-zinc-400 uppercase">
                  {platilloPersonalizar.categoria.nombre}
                </span>
                <h3 className="text-lg font-bold text-white mt-0.5">
                  {platilloPersonalizar.nombre}
                </h3>
                <p className="text-base font-black text-orange-400 mt-1">
                  {formatearCOP(platilloPersonalizar.precio)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPlatilloPersonalizar(null)}
                className="rounded-xl p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-900"
              >
                ✕
              </button>
            </div>

            {/* Cantidad */}
            <div className="flex items-center justify-between rounded-xl bg-zinc-900 p-3">
              <span className="text-xs font-bold text-zinc-300">Cantidad</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setCantidadPersonalizar((c) => Math.max(1, c - 1))}
                  className="h-8 w-8 rounded-lg bg-zinc-800 font-bold text-zinc-200 hover:text-white"
                >
                  -
                </button>
                <span className="text-sm font-black text-white w-6 text-center">
                  {cantidadPersonalizar}
                </span>
                <button
                  type="button"
                  onClick={() => setCantidadPersonalizar((c) => c + 1)}
                  className="h-8 w-8 rounded-lg bg-zinc-800 font-bold text-zinc-200 hover:text-white"
                >
                  +
                </button>
              </div>
            </div>

            {/* Chips de notas rápidas */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Indicaciones especiales para la comanda:
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {CHIPS_NOTAS_RAPIDAS.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => {
                      setNotaPlatillo((prev) => {
                        if (!prev.trim()) return chip;
                        if (prev.toLowerCase().includes(chip.toLowerCase())) return prev;
                        return `${prev.trim()}, ${chip}`;
                      });
                    }}
                    className="rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-1 text-[11px] font-semibold text-zinc-400 hover:border-orange-500 hover:text-white transition-all active:scale-95"
                  >
                    + {chip}
                  </button>
                ))}
              </div>
              <input
                type="text"
                placeholder="Ej: Término 3/4, salsa de ajo aparte..."
                value={notaPlatillo}
                onChange={(e) => setNotaPlatillo(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-orange-500 focus:outline-none"
              />
            </div>

            <div className="flex gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setPlatilloPersonalizar(null)}
                className="flex-1 rounded-xl bg-zinc-900 py-2.5 text-xs font-semibold text-zinc-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarAgregarPlatillo}
                className="flex-1 rounded-xl bg-orange-500 hover:bg-orange-600 py-2.5 text-xs font-black text-white shadow-md shadow-orange-500/25"
              >
                Agregar • {formatearCOP(platilloPersonalizar.precio * cantidadPersonalizar)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. MODAL DEL CARRITO / CONFIRMAR PEDIDO AL MESERO */}
      {mostrarModalCarrito && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="w-full max-w-lg rounded-3xl border border-zinc-800 bg-zinc-950 p-5 sm:p-6 shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xl">🛒</span>
                <h3 className="text-base font-bold text-white">Tu Pedido para Mesa {mesa}</h3>
              </div>
              <button
                type="button"
                onClick={() => setMostrarModalCarrito(false)}
                className="rounded-xl p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-900"
              >
                ✕
              </button>
            </div>

            {/* Lista de platillos en el carrito */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 no-scrollbar">
              {carrito.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-3 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{item.nombre}</p>
                    {item.notas && (
                      <p className="text-[10px] text-orange-300 italic">📝 {item.notas}</p>
                    )}
                    <p className="text-xs font-black text-orange-400 mt-0.5">
                      {formatearCOP(item.precio * item.cantidad)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCambiarCantidad(item.id, -1)}
                      className="h-7 w-7 rounded-lg bg-zinc-800 text-xs font-bold text-zinc-300 hover:bg-zinc-700"
                    >
                      -
                    </button>
                    <span className="text-xs font-bold text-white w-4 text-center">
                      {item.cantidad}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCambiarCantidad(item.id, 1)}
                      className="h-7 w-7 rounded-lg bg-zinc-800 text-xs font-bold text-zinc-300 hover:bg-zinc-700"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Datos opcionales del cliente */}
            <div className="mt-4 pt-3 border-t border-zinc-800 space-y-2 shrink-0">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                  Tu Nombre (Opcional):
                </label>
                <input
                  type="text"
                  placeholder="Ej: Carlos"
                  value={nombreCliente}
                  onChange={(e) => setNombreCliente(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                  Nota general para el mesero:
                </label>
                <input
                  type="text"
                  placeholder="Ej: Traer servilletas y vasos con hielo..."
                  value={notasPedido}
                  onChange={(e) => setNotasPedido(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-orange-500 focus:outline-none"
                />
              </div>

              {/* Total y botón de envío */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs font-semibold text-zinc-400">Total a Pagar:</span>
                <span className="text-lg font-black text-white">{formatearCOP(totalCarrito)}</span>
              </div>

              <div className="rounded-xl border border-blue-900/40 bg-blue-950/20 p-2.5 text-[11px] text-blue-300 flex items-center gap-2">
                <span>ℹ️</span>
                <span>
                  Tu pedido llegará primero al <strong>Mesero</strong>, quien lo revisará y enviará formalmente a Cocina.
                </span>
              </div>

              <button
                type="button"
                onClick={handleEnviarPedido}
                disabled={isPending}
                className="w-full rounded-2xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 py-3 text-xs sm:text-sm font-black text-white shadow-xl shadow-orange-500/25 transition-all active:scale-95 disabled:opacity-50"
              >
                {isPending ? 'Enviando...' : `🛎️ Enviar Pedido a mi Mesero (${formatearCOP(totalCarrito)})`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. MODAL DE SEGUIMIENTO EN VIVO (LIVE TRACKER) */}
      {mostrarTracker && pedidoActivo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-950 p-5 sm:p-6 shadow-2xl animate-in fade-in space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400">
                  Mesa {pedidoActivo.mesa} • Comanda en Vivo
                </span>
                <h3 className="text-base font-bold text-white">Estado de tu Orden</h3>
              </div>
              <button
                type="button"
                onClick={() => setMostrarTracker(false)}
                className="rounded-xl p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-900"
              >
                ✕
              </button>
            </div>

            {/* Stepper Visual de 4 Pasos */}
            <div className="space-y-4 py-2">
              <div
                className={`flex items-start gap-3 rounded-2xl border p-3.5 transition-all ${
                  pedidoActivo.estado === 'SOLICITADO'
                    ? 'border-purple-500 bg-purple-950/30 text-purple-200'
                    : 'border-zinc-800/60 bg-zinc-900/40 opacity-70'
                }`}
              >
                <span className="text-2xl">🛎️</span>
                <div>
                  <p className="text-xs font-black uppercase text-white">
                    Paso 1: Solicitud Recibida por Mesero
                  </p>
                  <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                    {pedidoActivo.estado === 'SOLICITADO'
                      ? 'Tu mesero tiene tu comanda en pantalla y la está revisando para mandarla a Cocina.'
                      : '✓ Comanda aprobada por el mesero.'}
                  </p>
                </div>
              </div>

              <div
                className={`flex items-start gap-3 rounded-2xl border p-3.5 transition-all ${
                  pedidoActivo.estado === 'PENDIENTE' || pedidoActivo.estado === 'PREPARANDO'
                    ? 'border-amber-500 bg-amber-950/30 text-amber-200'
                    : pedidoActivo.estado === 'HECHO' || pedidoActivo.estado === 'ENTREGADO' || pedidoActivo.estado === 'PAGADO'
                    ? 'border-zinc-800/60 bg-zinc-900/40 opacity-70'
                    : 'border-zinc-900 bg-zinc-950 opacity-40'
                }`}
              >
                <span className="text-2xl">👨‍🍳</span>
                <div>
                  <p className="text-xs font-black uppercase text-white">
                    Paso 2: En Cocina
                  </p>
                  <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                    {pedidoActivo.estado === 'PREPARANDO'
                      ? '🔥 El chef está cocinando tus platillos en este momento.'
                      : pedidoActivo.estado === 'PENDIENTE'
                      ? 'Comanda enviada a cocina. Esperando turno de preparación.'
                      : pedidoActivo.estado === 'HECHO' || pedidoActivo.estado === 'ENTREGADO' || pedidoActivo.estado === 'PAGADO'
                      ? '✓ Preparación finalizada.'
                      : 'En espera de aprobación del mesero.'}
                  </p>
                </div>
              </div>

              <div
                className={`flex items-start gap-3 rounded-2xl border p-3.5 transition-all ${
                  pedidoActivo.estado === 'HECHO'
                    ? 'border-blue-500 bg-blue-950/30 text-blue-200'
                    : pedidoActivo.estado === 'ENTREGADO' || pedidoActivo.estado === 'PAGADO'
                    ? 'border-zinc-800/60 bg-zinc-900/40 opacity-70'
                    : 'border-zinc-900 bg-zinc-950 opacity-40'
                }`}
              >
                <span className="text-2xl">🍽️</span>
                <div>
                  <p className="text-xs font-black uppercase text-white">
                    Paso 3: Listo para Servir
                  </p>
                  <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                    {pedidoActivo.estado === 'HECHO'
                      ? '🛎️ ¡Tu comida está lista! El mesero la está trayendo a tu mesa.'
                      : pedidoActivo.estado === 'ENTREGADO' || pedidoActivo.estado === 'PAGADO'
                      ? '✓ Comida entregada en mesa.'
                      : 'En espera de que cocina termine.'}
                  </p>
                </div>
              </div>

              <div
                className={`flex items-start gap-3 rounded-2xl border p-3.5 transition-all ${
                  pedidoActivo.estado === 'ENTREGADO'
                    ? 'border-emerald-500 bg-emerald-950/30 text-emerald-200'
                    : pedidoActivo.estado === 'PAGADO'
                    ? 'border-zinc-800 bg-zinc-900 text-zinc-400'
                    : 'border-zinc-900 bg-zinc-950 opacity-40'
                }`}
              >
                <span className="text-2xl">🍷</span>
                <div>
                  <p className="text-xs font-black uppercase text-white">
                    Paso 4: Servido en Mesa
                  </p>
                  <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                    {pedidoActivo.estado === 'ENTREGADO'
                      ? '¡Buen provecho! Cuando desees la cuenta, pídesela a tu mesero (pago en efectivo o transferencia).'
                      : pedidoActivo.estado === 'PAGADO'
                      ? '💰 ¡Cuenta pagada! Gracias por tu visita.'
                      : 'En espera de ser servido.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Detalle del Pedido */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-3.5 space-y-1 text-xs">
              <span className="text-[10px] font-bold text-zinc-400 uppercase">Resumen</span>
              <p className="text-zinc-300 text-[11px] leading-relaxed line-clamp-3">
                {pedidoActivo.detalle}
              </p>
              <div className="flex items-center justify-between pt-2 border-t border-zinc-800 font-bold">
                <span className="text-zinc-400">Total:</span>
                <span className="text-sm font-black text-orange-400">
                  {formatearCOP(pedidoActivo.total)}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setMostrarTracker(false)}
              className="w-full rounded-2xl bg-zinc-900 hover:bg-zinc-800 py-2.5 text-xs font-bold text-zinc-300"
            >
              Seguir Viendo la Carta
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
