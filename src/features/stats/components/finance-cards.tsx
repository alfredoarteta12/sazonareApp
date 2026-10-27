import { getDailyFinancials } from '../actions/get-financial-reports';
import { formatearCOP } from '@/lib/currency';

function StatCard({
  titulo,
  valor,
  subtitulo,
  color,
  icono,
}: {
  titulo: string;
  valor: string;
  subtitulo: string;
  color: string;
  icono: string;
}) {
  return (
    <div className={`rounded-2xl border p-6 ${color}`}>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-zinc-400">{titulo}</span>
        <span className="text-2xl">{icono}</span>
      </div>
      <p className="text-3xl font-bold tracking-tight text-white">{valor}</p>
      <p className="mt-1 text-sm text-zinc-500">{subtitulo}</p>
    </div>
  );
}

export async function FinanceCards() {
  const result = await getDailyFinancials();

  if (!result.success || !result.data) {
    return (
      <div className="rounded-xl border border-red-900/50 bg-red-950/30 p-4 text-red-400">
        Error al cargar datos financieros
      </div>
    );
  }

  const { ingresoNeto, pedidosExitosos, dineroCancelado, pedidosCancelados } = result.data;
  const totalOperaciones = pedidosExitosos + pedidosCancelados;
  const tasaExito = totalOperaciones > 0 ? ((pedidosExitosos / totalOperaciones) * 100).toFixed(1) : '100';

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        titulo="Ingreso Neto del Día"
        valor={formatearCOP(ingresoNeto)}
        subtitulo={`${pedidosExitosos} pedidos completados`}
        color="bg-zinc-950 border-emerald-900/40 shadow-lg shadow-emerald-950/10"
        icono="💰"
      />
      <StatCard
        titulo="Pérdidas por Cancelaciones"
        valor={formatearCOP(dineroCancelado)}
        subtitulo={`${pedidosCancelados} pedidos cancelados`}
        color="bg-zinc-950 border-rose-900/40 shadow-lg shadow-rose-950/10"
        icono="📉"
      />
      <StatCard
        titulo="Total Facturado (Bruto)"
        valor={formatearCOP(ingresoNeto + dineroCancelado)}
        subtitulo={`${totalOperaciones} operaciones totales`}
        color="bg-zinc-950 border-blue-900/40 shadow-lg shadow-blue-950/10"
        icono="📊"
      />
      <StatCard
        titulo="Tasa de Éxito"
        valor={`${tasaExito}%`}
        subtitulo="Pedidos completados vs cancelados"
        color="bg-zinc-950 border-purple-900/40 shadow-lg shadow-purple-950/10"
        icono="🎯"
      />
    </div>
  );
}
