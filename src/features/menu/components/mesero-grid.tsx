'use client';

import { useState, useTransition, useCallback, useEffect } from 'react';
import { crearPedido, ItemCarrito } from '@/features/orders/actions/order-mutations';
import { useRealtimeOrders, Pedido, TipoPedido } from '@/features/orders/hooks/use-realtime-orders';
import { CroquisTerraza } from '@/features/orders/components/croquis-terraza';
import { TicketReciboModal } from '@/features/orders/components/ticket-recibo-modal';
import { MesaDetalleModal } from '@/features/orders/components/mesa-detalle-modal';
import { PedidosExternosPanel } from '@/features/orders/components/pedidos-externos-panel';
import {
  DatosPedidoExternoModal,
  DatosPedidoExterno,
} from '@/features/orders/components/datos-pedido-externo-modal';
import { waiterAudio } from '@/features/orders/utils/audio-alerts';

interface Producto {
  id: string;
  nombre: string;
  precio: number;
  categoriaId: string;
  categoria: { id: string; nombre: string };
}

interface MeseroGridProps {
  productos: Producto[];
  nombreMesero?: string;
}

export function MeseroGrid({ productos, nombreMesero }: MeseroGridProps) {
  // Vistas disponibles: 'croquis' (Terraza) | 'llevar' | 'domicilio' | 'menu'
  const [vista, setVista] = useState<'croquis' | 'llevar' | 'domicilio' | 'menu'>('croquis');
  const [tipoPedido, setTipoPedido] = useState<TipoPedido>('MESA');
  const [mesa, setMesa] = useState<number>(1);

  // Datos del cliente para pedidos externos (Llevar y Domicilio)
  const [datosExternos, setDatosExternos] = useState<DatosPedidoExterno>({
    tipoPedido: 'LLEVAR',
    cliente: '',
    telefono: '',
    direccion: '',
    notas: '',
  });

  const [modalDatosExternos, setModalDatosExternos] = useState<{
    abierto: boolean;
    tipo: 'LLEVAR' | 'DOMICILIO';
  } | null>(null);

  // Indicaciones o descripción general de la comanda para cocina
  const [notasComanda, setNotasComanda] = useState('');

  // Modal para ver y cobrar cualquier pedido seleccionado (Terraza, Llevar o Domicilio)
  const [pedidoDetalleSeleccionado, setPedidoDetalleSeleccionado] = useState<Pedido | null>(null);

  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
  const [categoriaActiva, setCategoriaActiva] = useState<string>('todas');
  const [carritoAbiertoEnMovil, setCarritoAbiertoEnMovil] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [mensaje, setMensaje] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);
  const [pedidoRecienteRecibo, setPedidoRecienteRecibo] = useState<Pedido | null>(null);

  // Alertas de cocina lista (Visual y Sonido)
  const [pedidoListoAlerta, setPedidoListoAlerta] = useState<Pedido | null>(null);
  const [destelloVisual, setDestelloVisual] = useState<boolean>(false);
  const [sonidoHabilitado, setSonidoHabilitado] = useState<boolean>(() => waiterAudio.isEnabled());

  // Callback cuando cocina marca un pedido como HECHO (Listo para servir o despachar)
  const handlePedidoListo = useCallback((pedido: Pedido) => {
    setPedidoListoAlerta(pedido);
    setDestelloVisual(true);
    setTimeout(() => setDestelloVisual(false), 3000);

    // Timbre metálico de mostrador de restaurante (🛎️ Ding-Ding!)
    waiterAudio.playReadyBell();
  }, []);

  // Escuchamos pedidos en tiempo real con callback de aviso para meseros
  const { pedidos: pedidosActivos } = useRealtimeOrders(undefined, {
    incluirEntregados: true,
    onPedidoListo: handlePedidoListo,
  });

  // Desbloqueo automático del AudioContext en el primer toque de pantalla
  useEffect(() => {
    const desbloquear = () => {
      waiterAudio.unlock();
    };
    window.addEventListener('click', desbloquear, { once: true });
    window.addEventListener('touchstart', desbloquear, { once: true });
    return () => {
      window.removeEventListener('click', desbloquear);
      window.removeEventListener('touchstart', desbloquear);
    };
  }, []);

  const toggleSonido = () => {
    const nuevo = !sonidoHabilitado;
    setSonidoHabilitado(nuevo);
    waiterAudio.setEnabled(nuevo);
    if (nuevo) {
      waiterAudio.unlock();
      waiterAudio.playReadyBell();
    }
  };

  // Contadores para insignias de pedidos activos
  const pedidosLlevarActivos = pedidosActivos.filter(
    (p) =>
      (p.tipoPedido === 'LLEVAR' || p.detalle.includes('[PARA LLEVAR')) &&
      p.estado !== 'PAGADO' &&
      p.estado !== 'CANCELADO'
  ).length;

  const pedidosDomicilioActivos = pedidosActivos.filter(
    (p) =>
      (p.tipoPedido === 'DOMICILIO' || p.detalle.includes('[DOMICILIO')) &&
      p.estado !== 'PAGADO' &&
      p.estado !== 'CANCELADO'
  ).length;

  // Iniciar toma de pedido para llevar
  const iniciarPedidoLlevar = () => {
    setModalDatosExternos({ abierto: true, tipo: 'LLEVAR' });
  };

  // Iniciar toma de pedido para domicilio
  const iniciarPedidoDomicilio = () => {
    setModalDatosExternos({ abierto: true, tipo: 'DOMICILIO' });
  };

  // Confirmar datos del cliente y pasar al menú
  const handleConfirmarDatosExternos = (datos: DatosPedidoExterno) => {
    setDatosExternos(datos);
    setTipoPedido(datos.tipoPedido);
    if (datos.notas) {
      setNotasComanda(datos.notas);
    }
    setModalDatosExternos(null);
    setVista('menu');
  };

  // Agregar cualquier producto directamente al carrito con 1 solo toque (comidas y bebidas)
  const handleClickProducto = (producto: Producto) => {
    setCarrito((prev) => {
      const existente = prev.find((i) => i.productoId === producto.id);
      if (existente) {
        return prev.map((i) =>
          i.id === existente.id ? { ...i, cantidad: i.cantidad + 1 } : i
        );
      }
      return [
        ...prev,
        {
          id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          productoId: producto.id,
          nombre: producto.nombre,
          precio: producto.precio,
          cantidad: 1,
        },
      ];
    });
  };

  const decrementarCantidad = (itemId: string) => {
    setCarrito((prev) => {
      const item = prev.find((i) => i.id === itemId);
      if (item && item.cantidad > 1) {
        return prev.map((i) => (i.id === itemId ? { ...i, cantidad: i.cantidad - 1 } : i));
      }
      return prev.filter((i) => i.id !== itemId);
    });
  };

  const incrementarCantidad = (itemId: string) => {
    setCarrito((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, cantidad: i.cantidad + 1 } : i))
    );
  };

  const totalCantidad = carrito.reduce((acc, i) => acc + i.cantidad, 0);
  const totalCarrito = carrito.reduce((acc, i) => acc + i.precio * i.cantidad, 0);

  // Categorías únicas
  const categorias = ['todas', ...new Set(productos.map((p) => p.categoria.nombre))];

  const productosFiltrados =
    categoriaActiva === 'todas'
      ? productos
      : productos.filter((p) => p.categoria.nombre === categoriaActiva);

  const enviarPedido = () => {
    if (carrito.length === 0) return;
    startTransition(async () => {
      const notasFinales =
        notasComanda.trim() || (tipoPedido !== 'MESA' ? datosExternos.notas : undefined);

      const result = await crearPedido({
        tipoPedido,
        mesa: tipoPedido === 'MESA' ? mesa : 0,
        cliente: tipoPedido !== 'MESA' ? datosExternos.cliente : undefined,
        telefono: tipoPedido !== 'MESA' ? datosExternos.telefono : undefined,
        direccion: tipoPedido === 'DOMICILIO' ? datosExternos.direccion : undefined,
        notas: notasFinales || undefined,
        items: carrito,
      });

      if (result.success && result.pedido) {
        setCarrito([]);
        setNotasComanda('');
        const destinoTexto =
          tipoPedido === 'MESA'
            ? `Mesa ${mesa} - Terraza`
            : tipoPedido === 'LLEVAR'
            ? `Para Llevar ${datosExternos.cliente ? `(${datosExternos.cliente})` : ''}`
            : `Domicilio ${datosExternos.cliente ? `(${datosExternos.cliente})` : ''}`;

        setMensaje({ tipo: 'exito', texto: `✅ Comanda enviada a Cocina (${destinoTexto})` });
        setCarritoAbiertoEnMovil(false);
        // Abrir automáticamente el ticket/recibo para que el mesero lo pueda imprimir si lo desea
        setPedidoRecienteRecibo(result.pedido as unknown as Pedido);
      } else {
        setMensaje({ tipo: 'error', texto: result.error || 'Error al enviar comanda' });
      }
      setTimeout(() => setMensaje(null), 5000);
    });
  };

  // Contenido del Carrito (desktop y móvil) - función directa para preservar foco del teclado
  const renderContenidoCarrito = () => (
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
              onClick={() => {
                setCarrito([]);
                setNotasComanda('');
              }}
              className="text-xs text-zinc-500 hover:text-rose-400 underline transition-colors ml-1"
            >
              Vaciar
            </button>
          )}
        </div>
        <button
          onClick={() => setCarritoAbiertoEnMovil(false)}
          className="lg:hidden rounded-lg p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Indicador de Destino del Pedido (Mesa / Llevar / Domicilio) */}
      <div className={`my-3.5 rounded-2xl border p-3 transition-all ${
        tipoPedido === 'LLEVAR'
          ? 'bg-amber-950/20 border-amber-800/60'
          : tipoPedido === 'DOMICILIO'
          ? 'bg-cyan-950/20 border-cyan-800/60'
          : 'bg-zinc-900 border-zinc-800'
      }`}>
        <div className="flex items-center justify-between mb-1.5">
          <span className={`text-[10px] font-black uppercase tracking-wider ${
            tipoPedido === 'LLEVAR'
              ? 'text-amber-400'
              : tipoPedido === 'DOMICILIO'
              ? 'text-cyan-400'
              : 'text-zinc-400'
          }`}>
            {tipoPedido === 'LLEVAR'
              ? '🛍️ Para Llevar (Mostrador)'
              : tipoPedido === 'DOMICILIO'
              ? '🛵 Pedido a Domicilio'
              : '🍽️ Mesa de Terraza'}
          </span>

          {tipoPedido === 'MESA' ? (
            <button
              type="button"
              onClick={() => setVista('croquis')}
              className="text-[11px] font-bold text-orange-400 hover:underline"
            >
              Cambiar Mesa 🌿
            </button>
          ) : (
            <button
              type="button"
              onClick={() =>
                setModalDatosExternos({
                  abierto: true,
                  tipo: tipoPedido as 'LLEVAR' | 'DOMICILIO',
                })
              }
              className="text-[11px] font-bold text-orange-400 hover:underline"
            >
              Editar Datos ✏️
            </button>
          )}
        </div>

        {tipoPedido === 'MESA' ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">⛱️</span>
              <div>
                <p className="text-base font-black text-white">Mesa {mesa}</p>
                <p className="text-[11px] text-zinc-400">Terraza Exterior</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setMesa((m) => Math.max(1, m - 1))}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800 text-sm font-bold text-white hover:bg-zinc-700"
              >
                -
              </button>
              <span className="w-8 text-center font-bold text-white">{mesa}</span>
              <button
                type="button"
                onClick={() => setMesa((m) => Math.min(5, m + 1))}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800 text-sm font-bold text-white hover:bg-zinc-700"
              >
                +
              </button>
            </div>
          </div>
        ) : tipoPedido === 'LLEVAR' ? (
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🛍️</span>
            <div className="min-w-0">
              <p className="text-sm font-black text-white truncate">
                {datosExternos.cliente || 'Cliente Mostrador'}
              </p>
              {datosExternos.telefono && (
                <p className="text-[11px] text-zinc-400 truncate">📞 {datosExternos.telefono}</p>
              )}
              {datosExternos.notas && (
                <p className="text-[10px] text-amber-300/80 truncate">Nota: {datosExternos.notas}</p>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xl">🛵</span>
              <p className="text-sm font-black text-white truncate">
                {datosExternos.cliente || 'Cliente Domicilio'}
              </p>
            </div>
            {datosExternos.direccion && (
              <p className="text-xs text-cyan-300 font-semibold leading-tight break-words">
                📍 {datosExternos.direccion}
              </p>
            )}
            {datosExternos.telefono && (
              <p className="text-[11px] text-zinc-400">📞 {datosExternos.telefono}</p>
            )}
            {datosExternos.notas && (
              <p className="text-[10px] text-zinc-400 italic">Nota: {datosExternos.notas}</p>
            )}
          </div>
        )}
      </div>

      {/* Lista de productos en la comanda */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {carrito.length === 0 ? (
          <div className="py-12 text-center text-zinc-500">
            <p className="text-3xl mb-1">🍔</p>
            <p className="text-xs">No hay platillos en la orden.</p>
            <p className="text-[11px] text-zinc-600 mt-1">Toca cualquier producto para agregarlo.</p>
          </div>
        ) : (
          carrito.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl bg-zinc-900 border border-zinc-800/80 p-2.5 shadow-sm"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white leading-tight truncate">{item.nombre}</p>
                  <p className="text-xs text-orange-400 font-black mt-0.5">
                    ${(item.precio * item.cantidad).toFixed(2)}
                    <span className="text-zinc-500 font-normal text-[10px] ml-1">
                      (${item.precio.toFixed(2)} c/u)
                    </span>
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => decrementarCantidad(item.id!)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-800 text-sm font-bold text-zinc-300 hover:bg-rose-950 hover:text-rose-300 transition-colors active:scale-90"
                  >
                    -
                  </button>
                  <span className="w-5 text-center text-xs font-black text-white">{item.cantidad}</span>
                  <button
                    type="button"
                    onClick={() => incrementarCantidad(item.id!)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-800 text-sm font-bold text-zinc-300 hover:bg-emerald-950 hover:text-emerald-300 transition-colors active:scale-90"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Indicaciones / Descripción general de la comanda para cocina */}
      {carrito.length > 0 && (
        <div className="mt-2.5 pt-2.5 border-t border-zinc-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
              <span>📝</span>
              <span>Indicaciones para Cocina</span>
            </label>
            {notasComanda && (
              <button
                type="button"
                onClick={() => setNotasComanda('')}
                className="text-[10px] text-zinc-500 hover:text-rose-400 font-semibold"
              >
                Limpiar
              </button>
            )}
          </div>

          {/* Chips rápidos de 1 toque */}
          <div className="flex flex-wrap gap-1">
            {[
              'Sin salsas',
              'Sin cebolla',
              'Sin tomate',
              'Sin lechuga',
              'Salsas aparte',
              'Término 3/4',
              'Bien cocido',
              'Sin hielo',
            ].map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => {
                  setNotasComanda((prev) => {
                    if (!prev.trim()) return chip;
                    if (prev.toLowerCase().includes(chip.toLowerCase())) return prev;
                    return `${prev.trim()}, ${chip}`;
                  });
                }}
                className="rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-[10px] font-semibold text-zinc-400 hover:border-orange-500 hover:text-white transition-all active:scale-95"
              >
                + {chip}
              </button>
            ))}
          </div>

          <textarea
            rows={2}
            placeholder="Ej: Una hamburguesa sin salsas, salsa aparte, bebida bien fría..."
            value={notasComanda}
            onChange={(e) => setNotasComanda(e.target.value)}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 p-2 text-xs text-white placeholder-zinc-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 resize-none"
          />
        </div>
      )}

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
          className={`w-full rounded-xl py-3 text-sm font-bold text-white shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 ${
            tipoPedido === 'LLEVAR'
              ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20'
              : tipoPedido === 'DOMICILIO'
              ? 'bg-cyan-600 hover:bg-cyan-500 shadow-cyan-600/20'
              : 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/20'
          }`}
        >
          {isPending ? 'Enviando a cocina...' : '🚀 Enviar Comanda'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="relative flex h-full flex-col">
      {/* DESTELLO VISUAL DE PANTALLA COMPLETA AL ESTAR LISTO UN PEDIDO */}
      {destelloVisual && (
        <div className="pointer-events-none fixed inset-0 z-50 border-8 sm:border-[12px] border-blue-400/90 bg-blue-500/15 shadow-[inset_0_0_90px_rgba(59,130,246,0.6)] transition-all duration-300 animate-pulse" />
      )}

      {/* BANNER FLOTANTE SUPERIOR CUANDO COCINA MARCA UN PEDIDO LISTO */}
      {pedidoListoAlerta && (
        <div className="fixed top-4 left-4 right-4 sm:left-1/2 sm:-translate-x-1/2 sm:w-auto sm:min-w-[440px] z-50 flex items-center justify-between gap-4 rounded-2xl border-2 border-blue-400 bg-zinc-950/95 px-5 py-3.5 shadow-2xl shadow-blue-500/50 backdrop-blur-md animate-bounce">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-3xl animate-bounce shrink-0">🛎️</span>
            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase tracking-wider text-blue-400">
                ¡Comanda Lista en Barra de Cocina!
              </p>
              <p className="text-base font-extrabold text-white truncate">
                {pedidoListoAlerta.tipoPedido === 'LLEVAR' ||
                pedidoListoAlerta.detalle.includes('[PARA LLEVAR')
                  ? `🛍️ Para Llevar ${pedidoListoAlerta.cliente ? `(${pedidoListoAlerta.cliente})` : ''}`
                  : pedidoListoAlerta.tipoPedido === 'DOMICILIO' ||
                    pedidoListoAlerta.detalle.includes('[DOMICILIO')
                  ? `🛵 Domicilio ${pedidoListoAlerta.cliente ? `(${pedidoListoAlerta.cliente})` : ''}`
                  : `Mesa ${pedidoListoAlerta.mesa} (Terraza)`}
              </p>
              <p className="text-xs text-zinc-300 truncate">{pedidoListoAlerta.detalle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setPedidoDetalleSeleccionado(pedidoListoAlerta);
                setPedidoListoAlerta(null);
              }}
              className="rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-extrabold text-white hover:bg-blue-500 transition-colors shadow-md shadow-blue-600/30"
            >
              Ver Pedido 🍽️
            </button>
            <button
              type="button"
              onClick={() => setPedidoListoAlerta(null)}
              className="rounded-xl bg-zinc-800 border border-zinc-700 px-2.5 py-1.5 text-xs font-bold text-zinc-300 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* BARRA SUPERIOR DE NAVEGACIÓN ENTRE TERRAZA, LLEVAR, DOMICILIOS Y MENÚ */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-2xl bg-zinc-950 border border-zinc-800 p-1">
            <button
              type="button"
              onClick={() => setVista('croquis')}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                vista === 'croquis'
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <span>🌿</span> Terraza (5 Mesas)
            </button>

            <button
              type="button"
              onClick={() => setVista('llevar')}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                vista === 'llevar'
                  ? 'bg-amber-500 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <span>🛍️</span> Para Llevar
              {pedidosLlevarActivos > 0 && (
                <span className="rounded-full bg-amber-400 text-black text-[10px] font-black px-1.5 py-0.2">
                  {pedidosLlevarActivos}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setVista('domicilio')}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                vista === 'domicilio'
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <span>🛵</span> Domicilios
              {pedidosDomicilioActivos > 0 && (
                <span className="rounded-full bg-cyan-400 text-black text-[10px] font-black px-1.5 py-0.2">
                  {pedidosDomicilioActivos}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setVista('menu')}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                vista === 'menu'
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <span>🍔</span> Menú ({tipoPedido === 'MESA' ? `Mesa ${mesa}` : tipoPedido === 'LLEVAR' ? 'Para Llevar' : 'Domicilio'})
            </button>
          </div>

          {/* Control de sonido para el timbre de cocina */}
          <button
            type="button"
            onClick={toggleSonido}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all ${
              sonidoHabilitado
                ? 'border-blue-800/80 bg-blue-950/40 text-blue-300 hover:bg-blue-900/50'
                : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white'
            }`}
            title={sonidoHabilitado ? 'Timbre de cocina activo (clic para silenciar)' : 'Silenciado (clic para activar)'}
          >
            <span>{sonidoHabilitado ? '🔔 Timbre Activo' : '🔇 Silenciado'}</span>
          </button>
        </div>

        {vista === 'menu' && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (tipoPedido === 'LLEVAR') setVista('llevar');
                else if (tipoPedido === 'DOMICILIO') setVista('domicilio');
                else setVista('croquis');
              }}
              className="flex items-center gap-1 rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <span>←</span> Volver a {tipoPedido === 'LLEVAR' ? 'Para Llevar' : tipoPedido === 'DOMICILIO' ? 'Domicilios' : 'Terraza'}
            </button>
          </div>
        )}
      </div>

      {/* VISTA 1: CROQUIS DE LA TERRAZA (5 MESAS) */}
      {vista === 'croquis' && (
        <div className="flex-1 overflow-hidden">
          <CroquisTerraza
            pedidosActivos={pedidosActivos}
            onSeleccionarMesaParaMenu={(num) => {
              setTipoPedido('MESA');
              setMesa(num);
              setVista('menu');
            }}
            nombreMesero={nombreMesero}
          />
        </div>
      )}

      {/* VISTA 2: PANEL DE PEDIDOS PARA LLEVAR */}
      {vista === 'llevar' && (
        <div className="flex-1 overflow-hidden">
          <PedidosExternosPanel
            pedidos={pedidosActivos}
            tipo="LLEVAR"
            onNuevoPedido={() => iniciarPedidoLlevar()}
            onAbrirDetalle={(p) => setPedidoDetalleSeleccionado(p)}
          />
        </div>
      )}

      {/* VISTA 3: PANEL DE PEDIDOS A DOMICILIO */}
      {vista === 'domicilio' && (
        <div className="flex-1 overflow-hidden">
          <PedidosExternosPanel
            pedidos={pedidosActivos}
            tipo="DOMICILIO"
            onNuevoPedido={() => iniciarPedidoDomicilio()}
            onAbrirDetalle={(p) => setPedidoDetalleSeleccionado(p)}
          />
        </div>
      )}

      {/* VISTA 4: MENÚ DE PRODUCTOS Y CARRITO */}
      {vista === 'menu' && (
        <div className="relative flex flex-1 flex-col lg:flex-row gap-4 lg:gap-6 overflow-hidden">
          {/* PANEL DEL MENÚ */}
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* Banner indicador de Destino en el Menú */}
            <div className={`mb-3 flex items-center justify-between rounded-2xl border px-4 py-2.5 shrink-0 ${
              tipoPedido === 'LLEVAR'
                ? 'bg-amber-950/20 border-amber-800/60'
                : tipoPedido === 'DOMICILIO'
                ? 'bg-cyan-950/20 border-cyan-800/60'
                : 'bg-zinc-950 border-zinc-800'
            }`}>
              <div className="flex items-center gap-2">
                <span className="text-xl">
                  {tipoPedido === 'LLEVAR' ? '🛍️' : tipoPedido === 'DOMICILIO' ? '🛵' : '⛱️'}
                </span>
                <div>
                  <p className="text-xs font-extrabold text-white">
                    Tomando Orden para:{' '}
                    <span className={tipoPedido === 'LLEVAR' ? 'text-amber-400' : tipoPedido === 'DOMICILIO' ? 'text-cyan-400' : 'text-orange-400'}>
                      {tipoPedido === 'MESA'
                        ? `Mesa ${mesa} (Terraza)`
                        : tipoPedido === 'LLEVAR'
                        ? `Para Llevar ${datosExternos.cliente ? `(${datosExternos.cliente})` : ''}`
                        : `Domicilio ${datosExternos.cliente ? `(${datosExternos.cliente})` : ''}`}
                    </span>
                  </p>
                  <p className="text-[10px] text-zinc-400">
                    {tipoPedido === 'DOMICILIO' && datosExternos.direccion
                      ? `📍 ${datosExternos.direccion}`
                      : 'Toca los platillos para agregarlos o indicar si van sin salsas'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {tipoPedido === 'MESA' ? (
                  <button
                    type="button"
                    onClick={() => setVista('croquis')}
                    className="text-xs font-bold text-orange-400 hover:underline"
                  >
                    Cambiar Mesa 🌿
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      setModalDatosExternos({
                        abierto: true,
                        tipo: tipoPedido as 'LLEVAR' | 'DOMICILIO',
                      })
                    }
                    className="text-xs font-bold text-orange-400 hover:underline"
                  >
                    Editar Datos ✏️
                  </button>
                )}
              </div>
            </div>

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
                  const cantidadEnCarrito = carrito
                    .filter((i) => i.productoId === producto.id)
                    .reduce((acc, i) => acc + i.cantidad, 0);

                  return (
                    <button
                      key={producto.id}
                      type="button"
                      onClick={() => handleClickProducto(producto)}
                      className={`relative flex flex-col justify-between rounded-2xl border p-3 sm:p-4 text-left transition-all active:scale-95 min-h-[110px] sm:min-h-[120px] ${
                        cantidadEnCarrito > 0
                          ? 'border-orange-500 bg-orange-950/30'
                          : 'border-zinc-800/80 bg-zinc-950 hover:border-zinc-700'
                      }`}
                    >
                      {cantidadEnCarrito > 0 && (
                        <span className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white shadow-md">
                          {cantidadEnCarrito}
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
                      <div className="mt-2 flex items-center justify-between">
                        <p className="text-base sm:text-lg font-bold text-orange-400">
                          ${producto.precio.toFixed(2)}
                        </p>
                        <span className="text-[11px] font-bold text-zinc-500 hover:text-orange-300">
                          + Agregar
                        </span>
                      </div>
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

          {/* PANEL LATERAL DEL CARRITO (Desktop >= lg) */}
          <div className="hidden lg:flex w-80 xl:w-96 flex-col rounded-2xl border border-zinc-800 bg-zinc-950 p-5 shadow-xl shrink-0">
            {renderContenidoCarrito()}
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
                <span className="text-sm font-semibold truncate">
                  {tipoPedido === 'MESA'
                    ? `Mesa ${mesa}`
                    : tipoPedido === 'LLEVAR'
                    ? 'Para Llevar'
                    : 'Domicilio'}{' '}
                  • {totalCantidad > 0 ? 'Ver Comanda' : 'Abrir Comanda'}
                </span>
              </div>
              <span className="text-sm sm:text-base font-extrabold shrink-0">
                {totalCantidad > 0 ? `$${totalCarrito.toFixed(2)} →` : 'Comanda'}
              </span>
            </button>
          </div>

          {/* DRAWER DEL CARRITO EN MÓVIL */}
          {carritoAbiertoEnMovil && (
            <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/80 backdrop-blur-sm transition-opacity duration-200">
              <div
                className="flex-1"
                onClick={() => setCarritoAbiertoEnMovil(false)}
              />
              <div className="w-full max-h-[85dvh] sm:max-h-[85vh] rounded-t-3xl border-t border-zinc-800 bg-zinc-950 p-4 sm:p-5 shadow-2xl flex flex-col transition-transform duration-300">
                <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-zinc-800 shrink-0" />
                <div className="flex-1 overflow-hidden flex flex-col">
                  {renderContenidoCarrito()}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL PARA CAPTURAR DATOS DE CLIENTE (LLEVAR / DOMICILIO) */}
      {modalDatosExternos?.abierto && (
        <DatosPedidoExternoModal
          tipoInicial={modalDatosExternos.tipo}
          datosIniciales={datosExternos}
          onConfirmar={handleConfirmarDatosExternos}
          onCerrar={() => setModalDatosExternos(null)}
        />
      )}

      {/* MODAL PARA VER DETALLE Y COBRAR CUALQUIER PEDIDO (TERRAZA, LLEVAR O DOMICILIO) */}
      {pedidoDetalleSeleccionado && (
        <MesaDetalleModal
          mesa={pedidoDetalleSeleccionado.mesa}
          pedido={pedidoDetalleSeleccionado}
          nombreMesero={nombreMesero}
          onCerrar={() => setPedidoDetalleSeleccionado(null)}
          onAgregarPlatillos={() => {
            setTipoPedido((pedidoDetalleSeleccionado.tipoPedido as TipoPedido) || 'MESA');
            if (pedidoDetalleSeleccionado.mesa > 0) {
              setMesa(pedidoDetalleSeleccionado.mesa);
            }
            setDatosExternos({
              tipoPedido: (pedidoDetalleSeleccionado.tipoPedido as 'LLEVAR' | 'DOMICILIO') || 'LLEVAR',
              cliente: pedidoDetalleSeleccionado.cliente || '',
              telefono: pedidoDetalleSeleccionado.telefono || '',
              direccion: pedidoDetalleSeleccionado.direccion || '',
              notas: pedidoDetalleSeleccionado.notas || '',
            });
            setPedidoDetalleSeleccionado(null);
            setVista('menu');
          }}
        />
      )}

      {/* MODAL DEL RECIBO RECIÉN CREADO SI EL MESERO ENVIÓ COMANDA */}
      {pedidoRecienteRecibo && (
        <TicketReciboModal
          pedido={pedidoRecienteRecibo}
          nombreMesero={nombreMesero}
          onCerrar={() => setPedidoRecienteRecibo(null)}
        />
      )}
    </div>
  );
}
