import { TipoMovimientoInventario } from '@prisma/client';

export type EstadoStock = 'OPTIMO' | 'BAJO' | 'AGOTADO';

export type FiltroEstadoStock = 'TODOS' | EstadoStock;

export interface ProductoOpcion {
  id: string;
  nombre: string;
  precio: number;
}

export interface BebidaInventarioDTO {
  id: string;
  nombre: string;
  stockActual: number;
  stockMinimo: number;
  costoUnitario: number;
  precioVenta: number;
  valorCostoTotal: number;
  valorVentaTotal: number;
  margenUnitario: number;
  margenTotal: number;
  estadoStock: EstadoStock;
  productoId?: string | null;
  productoNombre?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ResumenInventario {
  totalItems: number;
  totalUnidades: number;
  valorCostoTotal: number;
  valorVentaTotal: number;
  gananciaProyectada: number;
  margenPorcentual: number;
  totalAgotadas: number;
  totalBajoStock: number;
  bebidas: BebidaInventarioDTO[];
}

export interface MovimientoInventarioDTO {
  id: string;
  bebidaId: string;
  bebidaNombre?: string;
  tipo: TipoMovimientoInventario;
  cantidad: number;
  stockAnterior: number;
  stockNuevo: number;
  costoUnitarioMomento: number;
  motivo?: string | null;
  pedidoId?: string | null;
  responsable?: string | null;
  createdAt: string;
}

export interface CrearBebidaPayload {
  nombre: string;
  stockInicial?: number;
  stockMinimo?: number;
  costoUnitario: number;
  precioVenta: number;
  productoId?: string;
}

export interface AbastecerPayload {
  id: string;
  cantidad: number;
  nuevoCostoUnitario?: number;
  motivo?: string;
}

export interface AjustarStockPayload {
  id: string;
  nuevoStock: number;
  motivo: string;
}

export interface ActualizarBebidaPayload {
  id: string;
  nombre: string;
  stockMinimo: number;
  costoUnitario: number;
  precioVenta: number;
  productoId?: string | null;
}

export interface MensajeFeedback {
  tipo: 'exito' | 'error';
  texto: string;
}
