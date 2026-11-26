export interface Alergeno {
  id: string;
  nombre: string;
  icono: string;
  badgeColor: string;
  descripcion?: string;
}

export interface AdicionPlatillo {
  id: string;
  nombre: string;
  precioCOP: number;
  icono: string;
  categoria?: 'quesos' | 'carnes' | 'salsas' | 'vegetales' | 'acompanamientos';
}

export interface Modelo3DConfig {
  glb: string;
  usdz?: string;
  poster?: string;
  alt: string;
  scale?: string;
  cameraOrbit?: string;
}

export interface DetalleGastronomico {
  id: string;
  nombre: string;
  descripcionChef: string;
  tiempoMinutos: number;
  caloriasAprox: number;
  nivelPicante: number; // 0: Sin picante, 1: Suave, 2: Medio, 3: Bravo
  esEspecialidad: boolean;
  esVeggie?: boolean;
  ingredientes: string[];
  alergenos: Alergeno[];
  adicionesDisponibles: AdicionPlatillo[];
  preferenciasSugeridas: string[];
  fotosHD: string[];
  modelo3D?: Modelo3DConfig;
}

export interface AdicionSeleccionada {
  adicion: AdicionPlatillo;
  cantidad: number;
}

export interface PersonalizacionProducto {
  adiciones: AdicionSeleccionada[];
  preferencias: string[];
  notaEspecial: string;
  cantidad: number;
  precioBaseCOP: number;
  precioAdicionesCOP: number;
  precioTotalUnitarioCOP: number;
  precioTotalGeneralCOP: number;
}
