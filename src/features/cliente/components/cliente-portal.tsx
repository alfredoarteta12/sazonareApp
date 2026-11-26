'use client';

import React, { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { formatearCOP } from '@/lib/currency';
import { crearPedidoCliente, ItemCarrito } from '@/features/orders/actions/order-mutations';
import { ProductoDetalleModal } from './producto-detalle-modal';
import { CarritoModal } from './carrito-modal';
import { TrackerPedidoModal } from './tracker-pedido-modal';
import { PersonalizacionProducto } from '../types/producto-interactivo';
import {
  Flame,
  ShoppingBag,
  Search,
  Plus,
  ArrowRight,
  MapPin,
  Bell,
  Box,
  Sparkles,
} from 'lucide-react';

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

  // Modal interactivo 3D / AR / Detalle gastronómico
  const [platilloSeleccionado, setPlatilloSeleccionado] = useState<ProductoCliente | null>(null);

  // Estado del pedido activo enviado (Live Tracker)
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

  // 2. Sincronización de disponibilidad de productos en cocina para AWS
  useEffect(() => {
    let activo = true;

    const sincronizarProductos = async () => {
      try {
        const url = `/api/productos?_cb=${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        const res = await fetch(url, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
            Pragma: 'no-cache',
          },
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!activo || !Array.isArray(data)) return;
        setProductos((prev) =>
          prev.map((p) => {
            const actualizado = data.find((d: any) => d.id === p.id);
            if (actualizado && (actualizado.disponible !== p.disponible || actualizado.precio !== p.precio)) {
              return { ...p, disponible: actualizado.disponible, precio: Number(actualizado.precio) };
            }
            return p;
          })
        );
      } catch (e) {}
    };

    sincronizarProductos();
    const intervalo = setInterval(sincronizarProductos, 2500);

    return () => {
      activo = false;
      clearInterval(intervalo);
    };
  }, []);

  // 3. Sincronización en tiempo real del estado del pedido activo del cliente para AWS
  useEffect(() => {
    if (!pedidoActivo?.id) return;
    let activo = true;

    const verificarEstado = async () => {
      try {
        const url = `/api/pedidos/activos?todosHoy=true&_cb=${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        const res = await fetch(url, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
            Pragma: 'no-cache',
          },
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!activo || !Array.isArray(data)) return;

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

    verificarEstado();
    const intervalo = setInterval(verificarEstado, 1500);

    return () => {
      activo = false;
      clearInterval(intervalo);
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

  // Abrir modal interactivo
  const handleAbrirPlatillo = (prod: ProductoCliente) => {
    setPlatilloSeleccionado(prod);
  };

  // Manejador: Agregar al carrito con personalizaciones completas en COP
  const handleAgregarPersonalizado = (personalizacion: PersonalizacionProducto) => {
    if (!platilloSeleccionado) return;

    const partesNotas: string[] = [];

    // Adiciones seleccionadas
    if (personalizacion.adiciones.length > 0) {
      const adicStr = personalizacion.adiciones
        .map((a) => `${a.cantidad > 1 ? `${a.cantidad}x ` : ''}${a.adicion.nombre} (+${formatearCOP(a.adicion.precioCOP * a.cantidad)})`)
        .join(', ');
      partesNotas.push(`Extras: ${adicStr}`);
    }

    // Preferencias de cocina rápidas
    if (personalizacion.preferencias.length > 0) {
      partesNotas.push(personalizacion.preferencias.join(', '));
    }

    // Nota especial libre
    if (personalizacion.notaEspecial) {
      partesNotas.push(`Nota: ${personalizacion.notaEspecial}`);
    }

    const nuevoItem: ItemCarrito = {
      id: `cli-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      productoId: platilloSeleccionado.id,
      nombre: platilloSeleccionado.nombre,
      precio: personalizacion.precioTotalUnitarioCOP,
      cantidad: personalizacion.cantidad,
      notas: partesNotas.length > 0 ? partesNotas.join(' | ') : undefined,
    };

    setCarrito((prev) => [...prev, nuevoItem]);
    setMensajeExito(`¡${platilloSeleccionado.nombre} agregado al pedido!`);
    setTimeout(() => setMensajeExito(null), 3000);
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
    <div className="min-h-screen bg-[#08080a] text-[#f4f4f5] flex flex-col pb-28 selection:bg-orange-500 selection:text-black">
      {/* 1. HEADER NEO-BRUTALIST */}
      <header className="sticky top-0 z-40 w-full border-b-2 border-zinc-800 bg-[#08080a]/90 backdrop-blur-md px-4 py-3">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500 text-black border-2 border-black shadow-[2px_2px_0px_0px_#fff] group-hover:scale-105 transition-transform">
              <Flame className="w-5 h-5 fill-black" />
            </div>
            <div>
              <h1 className="font-display text-base font-black uppercase tracking-tight text-white group-hover:text-orange-400 transition-colors">
                Sazonare<span className="text-orange-500">Food</span>
              </h1>
              <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Carta Digital & 3D en Mesa</p>
            </div>
          </Link>

          {/* Selector de Mesa Neo-Brutalist */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-xl border-2 border-orange-500 bg-zinc-900 px-3 py-1.5 text-xs font-black text-zinc-200 shadow-[2px_2px_0px_0px_#f97316]">
              <MapPin className="w-3.5 h-3.5 text-orange-400" />
              <span className="text-zinc-400 font-display uppercase">Mesa:</span>
              <select
                value={mesa}
                onChange={(e) => setMesa(Number(e.target.value))}
                className="bg-transparent font-display font-black text-orange-400 focus:outline-none cursor-pointer"
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
                className="neo-btn flex items-center gap-1.5 rounded-xl border-2 border-purple-500 bg-purple-950/80 px-3 py-1.5 text-xs font-black text-purple-200 shadow-[2px_2px_0px_0px_#a855f7] animate-pulse"
              >
                <Bell className="w-3.5 h-3.5" />
                <span className="hidden sm:inline font-display uppercase">Mi Pedido</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* BANNER DE NOTIFICACIÓN DE ÉXITO */}
      {mensajeExito && (
        <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-2.5 text-center text-xs font-black text-black border-b-2 border-black shadow-lg animate-in fade-in uppercase font-display tracking-wider">
          🎉 {mensajeExito}
        </div>
      )}

      <main className="mx-auto w-full max-w-5xl px-4 pt-4 sm:pt-6 space-y-6">
        {/* 2. BANNER DE PROMOCIONES DE LA CASA */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xs sm:text-sm font-black uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
              <Flame className="w-4 h-4 fill-orange-400" />
              <span>Promociones & Especialidades Street</span>
            </h2>
            <span className="neo-sticker text-[8px] bg-zinc-900 text-zinc-400 border-zinc-700 shadow-none">
              VÁLIDAS HOY
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {PROMOCIONES_CASA.map((promo) => (
              <div
                key={promo.id}
                className="neo-box rounded-2xl border-2 border-orange-500/80 bg-zinc-900/90 p-4 flex flex-col justify-between shadow-[4px_4px_0px_0px_#f97316] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="neo-sticker text-[8px] bg-orange-500 text-black border-black shadow-none">
                      {promo.badge}
                    </span>
                    <span className="text-xs text-zinc-500 line-through font-bold">
                      {formatearCOP(promo.precioAntes)}
                    </span>
                  </div>
                  <h3 className="font-display text-base font-black uppercase tracking-tight text-white">{promo.titulo}</h3>
                  <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                    {promo.descripcion}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t-2 border-zinc-800 flex items-center justify-between">
                  <span className="font-display text-lg font-black text-amber-400">
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
                      setMensajeExito(`¡${promo.titulo} agregado al pedido!`);
                      setTimeout(() => setMensajeExito(null), 3000);
                    }}
                    className="neo-btn rounded-xl bg-orange-500 hover:bg-orange-400 text-black px-3.5 py-1.5 text-[11px] font-black uppercase tracking-wider border-2 border-black shadow-[2px_2px_0px_0px_#fff] active:scale-95"
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
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Buscar platillo, hamburguesa, bebida..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full rounded-2xl border-2 border-zinc-700 bg-zinc-900/90 pl-10 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:border-orange-500 focus:outline-none transition-colors"
            />
            {busqueda && (
              <button
                type="button"
                onClick={() => setBusqueda('')}
                className="absolute right-3.5 top-2.5 text-xs text-zinc-500 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          {/* Categorías (Pills Horizontales Neo-Brutalist) */}
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            <button
              type="button"
              onClick={() => setCategoriaSeleccionada('todas')}
              className={`neo-btn whitespace-nowrap rounded-xl px-4 py-2 font-display text-xs font-black uppercase tracking-wider transition-all border-2 shrink-0 ${
                categoriaSeleccionada === 'todas'
                  ? 'bg-orange-500 text-black border-black shadow-[3px_3px_0px_0px_#fff]'
                  : 'bg-zinc-900 text-zinc-400 border-zinc-700 hover:text-white'
              }`}
            >
              🍽️ Todos los platos
            </button>
            {categorias.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoriaSeleccionada(cat.id)}
                className={`neo-btn whitespace-nowrap rounded-xl px-4 py-2 font-display text-xs font-black uppercase tracking-wider transition-all border-2 shrink-0 ${
                  categoriaSeleccionada === cat.id
                    ? 'bg-orange-500 text-black border-black shadow-[3px_3px_0px_0px_#fff]'
                    : 'bg-zinc-900 text-zinc-400 border-zinc-700 hover:text-white'
                }`}
              >
                {cat.nombre}
              </button>
            ))}
          </div>
        </div>

        {/* 4. CUADRÍCULA DE PLATILLOS CON VISOR INTERACTIVO 3D/AR */}
        <section className="space-y-3">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="font-display font-black uppercase">{productosFiltrados.length} platillos en la carta</span>
            <span className="text-[11px] text-zinc-500 font-semibold flex items-center gap-1">
              <Box className="w-3.5 h-3.5 text-orange-400" />
              Toca para ver en 3D / AR y personalizar
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {productosFiltrados.map((prod) => (
              <div
                key={prod.id}
                onClick={() => handleAbrirPlatillo(prod)}
                className={`neo-box rounded-2xl border-2 p-4 sm:p-5 flex flex-col justify-between transition-all cursor-pointer group ${
                  prod.disponible
                    ? 'border-zinc-700 bg-zinc-900/90 shadow-[4px_4px_0px_0px_#f97316] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[6px_6px_0px_0px_#facc15]'
                    : 'border-zinc-800 bg-zinc-950/60 opacity-60 shadow-none'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-display text-[10px] font-black uppercase tracking-wider text-orange-400 border border-orange-500/30 bg-orange-950/40 px-2 py-0.5 rounded-lg">
                      {prod.categoria.nombre}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="neo-sticker text-[8px] bg-amber-400 text-black border-black shadow-none flex items-center gap-0.5 group-hover:scale-105 transition-transform">
                        <Sparkles className="w-2.5 h-2.5 fill-black" />
                        3D & AR
                      </span>
                      {!prod.disponible && (
                        <span className="neo-sticker text-[8px] bg-rose-950 text-rose-300 border-rose-700 shadow-none">
                          Agotado
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="font-display text-lg font-black uppercase tracking-tight text-white group-hover:text-orange-400 transition-colors">
                    {prod.nombre}
                  </h3>
                  <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2">
                    Especialidad de la casa. Toca para rotar en 360°, ver en tu mesa en AR y personalizar adiciones.
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t-2 border-zinc-800 flex items-center justify-between">
                  <span className="font-display text-xl font-black text-amber-400">
                    {formatearCOP(prod.precio)}
                  </span>

                  {prod.disponible ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAbrirPlatillo(prod);
                        }}
                        className="neo-btn rounded-xl bg-orange-500 hover:bg-orange-400 text-black px-3 py-1.5 text-xs font-black uppercase tracking-wider border-2 border-black shadow-[2px_2px_0px_0px_#fff] flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Ver & Pedir</span>
                      </button>
                    </div>
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
          <div className="rounded-2xl border-2 border-black bg-gradient-to-r from-orange-500 via-amber-400 to-orange-500 text-black p-4 shadow-[5px_5px_0px_0px_#fff] flex items-center justify-between gap-3">
            <div>
              <p className="font-display text-xs font-black uppercase tracking-wider flex items-center gap-1.5 text-black">
                <ShoppingBag className="w-4 h-4 stroke-[2.5]" />
                <span>{totalItemsCarrito} {totalItemsCarrito === 1 ? 'platillo' : 'platillos'}</span>
              </p>
              <p className="font-display text-lg font-black text-black">{formatearCOP(totalCarrito)}</p>
            </div>

            <button
              type="button"
              onClick={() => setMostrarModalCarrito(true)}
              className="neo-btn rounded-xl bg-black hover:bg-zinc-900 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-[2px_2px_0px_0px_#000] flex items-center gap-1.5"
            >
              <span>Ver mi Pedido</span>
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </button>
          </div>
        </div>
      )}

      {/* 6. MODAL INTERACTIVO DE DETALLE, VISOR 3D/AR Y PERSONALIZACIÓN */}
      <ProductoDetalleModal
        isOpen={!!platilloSeleccionado}
        onClose={() => setPlatilloSeleccionado(null)}
        producto={platilloSeleccionado}
        onAgregarAlCarrito={handleAgregarPersonalizado}
      />

      {/* 7. MODAL DEL CARRITO / CONFIRMAR PEDIDO */}
      <CarritoModal
        isOpen={mostrarModalCarrito}
        onClose={() => setMostrarModalCarrito(false)}
        carrito={carrito}
        mesa={mesa}
        nombreCliente={nombreCliente}
        setNombreCliente={setNombreCliente}
        notasPedido={notasPedido}
        setNotasPedido={setNotasPedido}
        onCambiarCantidad={handleCambiarCantidad}
        onEnviarPedido={handleEnviarPedido}
        isPending={isPending}
      />

      {/* 8. MODAL DE SEGUIMIENTO EN VIVO (LIVE TRACKER) */}
      <TrackerPedidoModal
        isOpen={mostrarTracker}
        onClose={() => setMostrarTracker(false)}
        pedido={pedidoActivo}
      />
    </div>
  );
}
