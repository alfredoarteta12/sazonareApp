'use client';

import { useState } from 'react';

export interface DatosPedidoExterno {
  tipoPedido: 'LLEVAR' | 'DOMICILIO';
  cliente: string;
  telefono: string;
  direccion: string;
  notas: string;
}

interface DatosPedidoExternoModalProps {
  tipoInicial: 'LLEVAR' | 'DOMICILIO';
  datosIniciales?: Partial<DatosPedidoExterno>;
  onConfirmar: (datos: DatosPedidoExterno) => void;
  onCerrar: () => void;
}

export function DatosPedidoExternoModal({
  tipoInicial,
  datosIniciales,
  onConfirmar,
  onCerrar,
}: DatosPedidoExternoModalProps) {
  const [tipo, setTipo] = useState<'LLEVAR' | 'DOMICILIO'>(tipoInicial);
  const [cliente, setCliente] = useState(datosIniciales?.cliente || '');
  const [telefono, setTelefono] = useState(datosIniciales?.telefono || '');
  const [direccion, setDireccion] = useState(datosIniciales?.direccion || '');
  const [notas, setNotas] = useState(datosIniciales?.notas || '');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (tipo === 'DOMICILIO' && (!direccion || direccion.trim().length < 4)) {
      setError('Por favor ingresa la dirección de entrega para el domicilio.');
      return;
    }

    onConfirmar({
      tipoPedido: tipo,
      cliente: cliente.trim(),
      telefono: telefono.trim(),
      direccion: direccion.trim(),
      notas: notas.trim(),
    });
  };

  const esLlevar = tipo === 'LLEVAR';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm">
      <div className="fixed inset-0" onClick={onCerrar} />

      <div className="relative z-10 w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-950 p-5 sm:p-6 shadow-2xl">
        {/* Cabecera */}
        <div className="flex items-center justify-between pb-3.5 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl border text-xl ${
              esLlevar
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
            }`}>
              {esLlevar ? '🛍️' : '🛵'}
            </div>
            <div>
              <h3 className="text-base font-black text-white">
                {esLlevar ? 'Pedido Para Llevar' : 'Pedido a Domicilio'}
              </h3>
              <p className="text-xs text-zinc-400">Datos del cliente y entrega</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCerrar}
            className="rounded-xl p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Toggle para alternar entre Llevar o Domicilio */}
        <div className="my-4 grid grid-cols-2 gap-2 rounded-2xl bg-zinc-900 border border-zinc-800 p-1">
          <button
            type="button"
            onClick={() => setTipo('LLEVAR')}
            className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-all ${
              tipo === 'LLEVAR'
                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <span>🛍️</span> Para Llevar
          </button>

          <button
            type="button"
            onClick={() => setTipo('DOMICILIO')}
            className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-all ${
              tipo === 'DOMICILIO'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <span>🛵</span> Domicilio
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {error && (
            <div className="rounded-xl bg-rose-950/80 border border-rose-800 p-2.5 text-xs font-semibold text-rose-300 text-center">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Nombre del Cliente {esLlevar ? '(Opcional)' : ''}
            </label>
            <input
              type="text"
              placeholder="Ej: Carlos Gómez"
              value={cliente}
              onChange={(e) => setCliente(e.target.value)}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-xs sm:text-sm text-white placeholder-zinc-500 focus:border-orange-500 focus:outline-none"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Teléfono de Contacto {esLlevar ? '(Opcional)' : ''}
            </label>
            <input
              type="tel"
              placeholder="Ej: 300 123 4567"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-xs sm:text-sm text-white placeholder-zinc-500 focus:border-orange-500 focus:outline-none"
            />
          </div>

          {!esLlevar && (
            <div>
              <label className="block text-xs font-semibold text-cyan-300 mb-1">
                Dirección de Entrega *
              </label>
              <textarea
                rows={2}
                placeholder="Ej: Carrera 45 # 72-10 Edificio Prado Apto 302"
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                required
                className="w-full rounded-xl border border-cyan-800/60 bg-zinc-900 px-3.5 py-2 text-xs sm:text-sm text-white placeholder-zinc-500 focus:border-cyan-500 focus:outline-none"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Notas adicionales {esLlevar ? '(Empaque, cubiertos...)' : '(Instrucciones de llegada...)'}
            </label>
            <input
              type="text"
              placeholder={esLlevar ? 'Ej: Empacar salsas aparte, no cebolla' : 'Ej: Timbre no sirve, dejar en portería'}
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-xs sm:text-sm text-white placeholder-zinc-500 focus:border-orange-500 focus:outline-none"
            />
          </div>

          {/* Botones */}
          <div className="pt-3 border-t border-zinc-800 flex gap-2">
            <button
              type="button"
              onClick={onCerrar}
              className="flex-1 rounded-xl bg-zinc-900 border border-zinc-800 py-2.5 text-xs font-bold text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={`flex-1 rounded-xl py-2.5 text-xs font-extrabold text-white shadow-lg transition-all active:scale-95 ${
                esLlevar
                  ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/30'
                  : 'bg-cyan-600 hover:bg-cyan-500 shadow-cyan-600/30'
              }`}
            >
              Armar Menú 🍽️
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

