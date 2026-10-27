'use client';

import { useState } from 'react';
import { TicketReciboModal } from '@/features/orders/components/ticket-recibo-modal';
import { Pedido } from '@/features/orders/hooks/use-realtime-orders';

interface BotonReciboProps {
  pedido: Pedido;
}

export function BotonRecibo({ pedido }: BotonReciboProps) {
  const [abierto, setAbierto] = useState(false);

  // Nombre del mesero real que tomó la comanda o fallback a Caja si no fue asignado
  const nombreMeseroReal = pedido.nombreMesero || (pedido as any).creadoPor || 'Caja / Admin';

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="rounded-lg bg-zinc-900 border border-zinc-800 px-2 py-1 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-zinc-800 hover:border-zinc-700 transition-colors"
        title="Ver e imprimir ticket"
      >
        🧾 Recibo
      </button>

      {abierto && (
        <TicketReciboModal
          pedido={pedido}
          nombreMesero={nombreMeseroReal}
          onCerrar={() => setAbierto(false)}
        />
      )}
    </>
  );
}
