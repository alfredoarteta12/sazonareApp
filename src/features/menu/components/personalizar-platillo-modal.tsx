'use client';

import { useState } from 'react';
import { AdicionItem, ItemCarrito } from '@/features/orders/actions/order-mutations';

interface ProductoBase {
  id: string;
  nombre: string;
  precio: number;
  categoriaNombre?: string;
}

interface PersonalizarPlatilloModalProps {
  producto: ProductoBase;
  itemExistente?: ItemCarrito;
  onConfirmar: (item: ItemCarrito) => void;
  onCerrar: () => void;
}

// Opciones de adiciones populares en restaurante
const ADICIONES_PREDEFINIDAS: AdicionItem[] = [
  { id: 'toci', nombre: 'Tocineta crocante', precio: 4.0 },
  { id: 'queso', nombre: 'Queso cheddar extra', precio: 3.0 },
  { id: 'huevo', nombre: 'Huevo frito', precio: 2.5 },
  { id: 'papas', nombre: 'Papas francesas extra', precio: 5.0 },
  { id: 'carne', nombre: 'Proteína / Carne extra', precio: 8.0 },
  { id: 'aguacate', nombre: 'Aguacate / Guacamole', precio: 3.5 },
  { id: 'aros', nombre: 'Aros de cebolla extra', precio: 4.0 },
  { id: 'salsa', nombre: 'Salsa especial de la casa', precio: 1.5 },
];

// Modificadores rápidos sin costo
const MODIFICADORES_RAPIDOS = [
  'Sin cebolla',
  'Sin tomate',
  'Sin salsas',
  'Salsas aparte',
  'Término 3/4',
  'Bien cocido',
  'Término medio',
  'Poco picante',
  'Pan bien tostado',
  'Para compartir',
];

export function PersonalizarPlatilloModal({
  producto,
  itemExistente,
  onConfirmar,
  onCerrar,
}: PersonalizarPlatilloModalProps) {
  const [cantidad, setCantidad] = useState(itemExistente?.cantidad || 1);
  const [adicionesSeleccionadas, setAdicionesSeleccionadas] = useState<AdicionItem[]>(
    itemExistente?.adiciones || []
  );
  const [modificadoresActivos, setModificadoresActivos] = useState<string[]>(() => {
    if (!itemExistente?.notas) return [];
    return MODIFICADORES_RAPIDOS.filter((mod) => itemExistente.notas?.includes(mod));
  });

  // Nota personalizada libre
  const [notaLibre, setNotaLibre] = useState<string>(() => {
    if (!itemExistente?.notas) return '';
    let restante = itemExistente.notas;
    MODIFICADORES_RAPIDOS.forEach((mod) => {
      restante = restante.replace(mod, '').replace(/,\s*,/g, ',').trim();
    });
    return restante.replace(/^,\s*|,\s*$/g, '').trim();
  });

  // Estado para agregar adición personalizada sobre la marcha
  const [mostrarNuevaAdicion, setMostrarNuevaAdicion] = useState(false);
  const [nombreNuevaAdicion, setNombreNuevaAdicion] = useState('');
  const [precioNuevaAdicion, setPrecioNuevaAdicion] = useState('');

  // Toggle de adición
  const toggleAdicion = (adicion: AdicionItem) => {
    setAdicionesSeleccionadas((prev) => {
      const existe = prev.some((a) => a.nombre.toLowerCase() === adicion.nombre.toLowerCase());
      if (existe) {
        return prev.filter((a) => a.nombre.toLowerCase() !== adicion.nombre.toLowerCase());
      }
      return [...prev, adicion];
    });
  };

  // Toggle de modificador rápido sin costo
  const toggleModificador = (mod: string) => {
    setModificadoresActivos((prev) =>
      prev.includes(mod) ? prev.filter((m) => m !== mod) : [...prev, mod]
    );
  };

  // Agregar adición personalizada
  const handleCrearAdicionPersonalizada = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreNuevaAdicion.trim()) return;
    const precio = parseFloat(precioNuevaAdicion) || 0;
    const nueva: AdicionItem = {
      id: `custom-${Date.now()}`,
      nombre: nombreNuevaAdicion.trim(),
      precio,
    };
    setAdicionesSeleccionadas((prev) => [...prev, nueva]);
    setNombreNuevaAdicion('');
    setPrecioNuevaAdicion('');
    setMostrarNuevaAdicion(false);
  };

  // Cálculos de precio
  const sumaAdiciones = adicionesSeleccionadas.reduce((acc, a) => acc + a.precio, 0);
  const precioUnitario = producto.precio + sumaAdiciones;
  const precioTotal = precioUnitario * cantidad;

  // Construcción de la nota consolidada
  const construirNotaFinal = () => {
    const partes: string[] = [...modificadoresActivos];
    if (notaLibre.trim()) {
      partes.push(notaLibre.trim());
    }
    return partes.join(', ');
  };

  const handleGuardar = () => {
    const notaFinal = construirNotaFinal();
    const itemResultante: ItemCarrito = {
      id: itemExistente?.id || `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      productoId: producto.id,
      nombre: producto.nombre,
      precio: producto.precio,
      precioUnitario,
      adiciones: adicionesSeleccionadas,
      notas: notaFinal || undefined,
      cantidad,
    };
    onConfirmar(itemResultante);
  };

  // Agregar rápido directo (sin cambios)
  const handleAgregarDirecto = () => {
    onConfirmar({
      id: itemExistente?.id || `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      productoId: producto.id,
      nombre: producto.nombre,
      precio: producto.precio,
      precioUnitario: producto.precio,
      adiciones: [],
      notas: undefined,
      cantidad: 1,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-4 backdrop-blur-sm">
      <div className="fixed inset-0" onClick={onCerrar} />

      <div className="relative z-10 flex max-h-[92vh] w-full max-w-lg flex-col rounded-3xl border border-zinc-800 bg-zinc-950 p-4 sm:p-6 shadow-2xl">
        {/* Cabecera */}
        <div className="flex items-start justify-between pb-3.5 border-b border-zinc-800 shrink-0">
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400">
              {producto.categoriaNombre || 'Platillo'} • {itemExistente ? 'Modificar Orden' : 'Personalizar'}
            </span>
            <h3 className="text-lg sm:text-xl font-black text-white truncate">
              {producto.nombre}
            </h3>
            <p className="text-xs text-zinc-400 font-semibold mt-0.5">
              Precio base: <span className="text-white">${producto.precio.toFixed(2)}</span>
            </p>
          </div>

          <button
            type="button"
            onClick={onCerrar}
            className="rounded-xl p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Contenido desplazable */}
        <div className="flex-1 overflow-y-auto py-4 space-y-5 pr-1">
          {/* Botón rápido si es nuevo y no quiere personalizar */}
          {!itemExistente && adicionesSeleccionadas.length === 0 && modificadoresActivos.length === 0 && !notaLibre && (
            <button
              type="button"
              onClick={handleAgregarDirecto}
              className="w-full flex items-center justify-between rounded-2xl bg-zinc-900 border border-zinc-800 p-3 hover:border-orange-500/50 hover:bg-zinc-800/80 transition-all text-left group"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-xl">⚡</span>
                <div>
                  <p className="text-xs font-bold text-white group-hover:text-orange-400 transition-colors">
                    Agregar Normal (Sin Cambios)
                  </p>
                  <p className="text-[11px] text-zinc-400">Sin adiciones ni notas especiales</p>
                </div>
              </div>
              <span className="rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30 px-3 py-1 text-xs font-bold">
                +${producto.precio.toFixed(2)}
              </span>
            </button>
          )}

          {/* 1. ADICIONES CON COSTO */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-extrabold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                <span>🥓</span> Adiciones y Extras
              </label>
              <button
                type="button"
                onClick={() => setMostrarNuevaAdicion(!mostrarNuevaAdicion)}
                className="text-[11px] font-bold text-orange-400 hover:underline"
              >
                {mostrarNuevaAdicion ? '✕ Cancelar' : '➕ Otra adición'}
              </button>
            </div>

            {/* Formulario para agregar adición personalizada */}
            {mostrarNuevaAdicion && (
              <form
                onSubmit={handleCrearAdicionPersonalizada}
                className="mb-3 rounded-2xl bg-zinc-900/90 border border-orange-500/40 p-3 flex gap-2 items-center"
              >
                <input
                  type="text"
                  placeholder="Nombre adición (ej: Jalapeños)"
                  value={nombreNuevaAdicion}
                  onChange={(e) => setNombreNuevaAdicion(e.target.value)}
                  className="flex-1 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
                  autoFocus
                />
                <input
                  type="number"
                  step="0.5"
                  placeholder="Precio ($)"
                  value={precioNuevaAdicion}
                  onChange={(e) => setPrecioNuevaAdicion(e.target.value)}
                  className="w-24 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-orange-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-orange-600 transition-colors"
                >
                  Agregar
                </button>
              </form>
            )}

            {/* Chips de adiciones */}
            <div className="grid grid-cols-2 gap-2">
              {ADICIONES_PREDEFINIDAS.map((adicion) => {
                const seleccionada = adicionesSeleccionadas.some(
                  (a) => a.nombre.toLowerCase() === adicion.nombre.toLowerCase()
                );
                return (
                  <button
                    key={adicion.id}
                    type="button"
                    onClick={() => toggleAdicion(adicion)}
                    className={`flex items-center justify-between rounded-xl border p-2.5 text-left transition-all text-xs active:scale-95 ${
                      seleccionada
                        ? 'border-orange-500 bg-orange-950/30 text-white shadow-sm ring-1 ring-orange-500'
                        : 'border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:border-zinc-700'
                    }`}
                  >
                    <span className="font-semibold truncate">{adicion.nombre}</span>
                    <span
                      className={`font-bold ml-1 shrink-0 ${
                        seleccionada ? 'text-orange-400' : 'text-zinc-400'
                      }`}
                    >
                      +${adicion.precio.toFixed(2)}
                    </span>
                  </button>
                );
              })}

              {/* Mostrar adiciones personalizadas creadas que no estén en la lista por defecto */}
              {adicionesSeleccionadas
                .filter(
                  (a) =>
                    !ADICIONES_PREDEFINIDAS.some(
                      (p) => p.nombre.toLowerCase() === a.nombre.toLowerCase()
                    )
                )
                .map((adicion) => (
                  <button
                    key={adicion.id || adicion.nombre}
                    type="button"
                    onClick={() => toggleAdicion(adicion)}
                    className="flex items-center justify-between rounded-xl border border-orange-500 bg-orange-950/30 text-white p-2.5 text-left text-xs ring-1 ring-orange-500"
                  >
                    <span className="font-semibold truncate">★ {adicion.nombre}</span>
                    <span className="font-bold text-orange-400 ml-1 shrink-0">
                      +${adicion.precio.toFixed(2)}
                    </span>
                  </button>
                ))}
            </div>
          </div>

          {/* 2. MODIFICADORES RÁPIDOS (PREFERENCIAS SIN COSTO) */}
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-zinc-300 mb-2">
              🏷️ Preferencias de Cocina (1 Toque)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {MODIFICADORES_RAPIDOS.map((mod) => {
                const activo = modificadoresActivos.includes(mod);
                return (
                  <button
                    key={mod}
                    type="button"
                    onClick={() => toggleModificador(mod)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all border ${
                      activo
                        ? 'bg-amber-500 text-black border-amber-400 shadow-sm font-bold'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                    }`}
                  >
                    {activo ? `✓ ${mod}` : mod}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. DESCRIPCIÓN O NOTA PERSONALIZADA LIBRE */}
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-zinc-300 mb-1.5">
              📝 Nota Especial / Instrucción para Cocina
            </label>
            <textarea
              rows={2}
              placeholder="Ej: La carne bien dorada, alérgica al cilantro, salsa tártara aparte..."
              value={notaLibre}
              onChange={(e) => setNotaLibre(e.target.value)}
              className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 p-3 text-xs sm:text-sm text-white placeholder-zinc-500 focus:border-orange-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Pie: Selector de Cantidad y Botón de Confirmación */}
        <div className="pt-3.5 border-t border-zinc-800 shrink-0 space-y-3">
          <div className="flex items-center justify-between">
            {/* Control de cantidad */}
            <div className="flex items-center gap-2 rounded-2xl bg-zinc-900 border border-zinc-800 p-1">
              <button
                type="button"
                onClick={() => setCantidad((c) => Math.max(1, c - 1))}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-800 text-sm font-black text-white hover:bg-zinc-700 active:scale-90"
              >
                -
              </button>
              <span className="w-8 text-center text-sm font-black text-white">{cantidad}</span>
              <button
                type="button"
                onClick={() => setCantidad((c) => c + 1)}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-800 text-sm font-black text-white hover:bg-zinc-700 active:scale-90"
              >
                +
              </button>
            </div>

            {/* Resumen de precio */}
            <div className="text-right">
              <p className="text-[11px] text-zinc-400">
                ${precioUnitario.toFixed(2)} c/u {sumaAdiciones > 0 ? `(+$${sumaAdiciones.toFixed(2)} adic)` : ''}
              </p>
              <p className="text-xl font-black text-white">
                ${precioTotal.toFixed(2)}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGuardar}
            className="w-full rounded-2xl bg-orange-500 py-3 text-xs sm:text-sm font-black text-white shadow-lg shadow-orange-500/30 transition-all hover:bg-orange-600 active:scale-95 flex items-center justify-center gap-2"
          >
            <span>{itemExistente ? '💾' : '🛒'}</span>
            <span>
              {itemExistente ? 'Guardar Cambios' : 'Agregar a la Comanda'} • ${precioTotal.toFixed(2)}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

