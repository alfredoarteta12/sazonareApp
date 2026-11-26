import {
  Alergeno,
  AdicionPlatillo,
  DetalleGastronomico,
  Modelo3DConfig,
} from '../types/producto-interactivo';

export const ALERGENOS_CATALOGO: Record<string, Alergeno> = {
  gluten: {
    id: 'gluten',
    nombre: 'Gluten',
    icono: '🌾',
    badgeColor: 'bg-amber-950/70 text-amber-300 border-amber-600',
    descripcion: 'Contiene harinas o pan con gluten.',
  },
  lacteos: {
    id: 'lacteos',
    nombre: 'Lácteos',
    icono: '🧀',
    badgeColor: 'bg-blue-950/70 text-blue-300 border-blue-600',
    descripcion: 'Contiene queso derretido o derivados lácteos.',
  },
  huevo: {
    id: 'huevo',
    nombre: 'Huevo',
    icono: '🍳',
    badgeColor: 'bg-yellow-950/70 text-yellow-300 border-yellow-600',
    descripcion: 'Contiene huevo en salsas o preparación.',
  },
  soya: {
    id: 'soya',
    nombre: 'Soya',
    icono: '🌱',
    badgeColor: 'bg-emerald-950/70 text-emerald-300 border-emerald-600',
    descripcion: 'Presente en adobos o salsas especiales.',
  },
  frutosSecos: {
    id: 'frutosSecos',
    nombre: 'Frutos Secos',
    icono: '🥜',
    badgeColor: 'bg-orange-950/70 text-orange-300 border-orange-600',
    descripcion: 'Trazas o frutos secos en elaboración.',
  },
  picante: {
    id: 'picante',
    nombre: 'Picante Bravo 🔥',
    icono: '🌶️',
    badgeColor: 'bg-rose-950/70 text-rose-300 border-rose-600',
    descripcion: 'Contiene toques o salsas de ají picante.',
  },
};

export const ADICIONES_POPULARES: AdicionPlatillo[] = [
  {
    id: 'adic-queso-costeno',
    nombre: 'Queso Costeño Asado a la Plancha',
    precioCOP: 4000,
    icono: '🧀',
    categoria: 'quesos',
  },
  {
    id: 'adic-tocineta',
    nombre: 'Tocineta Ahumada Caramelizada',
    precioCOP: 4500,
    icono: '🥓',
    categoria: 'carnes',
  },
  {
    id: 'adic-carne-extra',
    nombre: 'Carne de Res Artesanal (150g extra)',
    precioCOP: 7500,
    icono: '🥩',
    categoria: 'carnes',
  },
  {
    id: 'adic-huevo',
    nombre: 'Huevo Frito con Yema Tierna',
    precioCOP: 2500,
    icono: '🍳',
    categoria: 'acompanamientos',
  },
  {
    id: 'adic-papas-criollas',
    nombre: 'Papas Criollas Doradas con Sal Marina',
    precioCOP: 5000,
    icono: '🥔',
    categoria: 'acompanamientos',
  },
  {
    id: 'adic-salsa-tartara',
    nombre: 'Salsa Tártara de la Casa (Envase extra)',
    precioCOP: 2000,
    icono: '🍶',
    categoria: 'salsas',
  },
  {
    id: 'adic-cebolla-caramelizada',
    nombre: 'Cebolla Caramelizada al Vino Dulce',
    precioCOP: 3000,
    icono: '🧅',
    categoria: 'vegetales',
  },
];

export const PREFERENCIAS_COCINA_CHIPS: string[] = [
  'Sin cebolla',
  'Sin tomate',
  'Sin lechuga',
  'Salsas aparte',
  'Término 3/4',
  'Bien cocido',
  'Término medio',
  'Sin salsas',
  'Poco picante',
  'Empaque para llevar',
];

// Modelos 3D optimizados en GLB con soporte AR para Android (Scene Viewer) y iOS (Quick Look)
const MODELO_3D_HAMBURGUESA: Modelo3DConfig = {
  glb: '/models/burger.glb',
  poster: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
  alt: 'Hamburguesa Artesanal Sazonare en 3D con Realidad Aumentada',
};

const MODELO_3D_PIZZA: Modelo3DConfig = {
  glb: '/models/pizza.glb',
  poster: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
  alt: 'Porción de Pizza Artesanal en 3D con Realidad Aumentada',
};

const MODELO_3D_PERRO: Modelo3DConfig = {
  glb: '/models/perro.glb',
  poster: 'https://images.unsplash.com/photo-1619740455993-9e612b1af08a?auto=format&fit=crop&w=800&q=80',
  alt: 'Perro Caliente Especial Street en 3D con Realidad Aumentada',
};

const MODELO_3D_SALCHIPAPA: Modelo3DConfig = {
  glb: '/models/salchipapa.glb',
  poster: 'https://images.unsplash.com/photo-1585109649139-366815a0d713?auto=format&fit=crop&w=800&q=80',
  alt: 'Salchipapa Salvaje Street en 3D con Realidad Aumentada',
};

const MODELO_3D_BEBIDA: Modelo3DConfig = {
  glb: '',
  poster: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=800&q=80',
  alt: 'Bebida fría refrescante Sazonare',
};

export const PLATILLOS_METADATA_BASE: Record<string, Partial<DetalleGastronomico>> = {
  'hamburguesa-sazonare': {
    nombre: 'Hamburguesa Sazonare Especial',
    descripcionChef:
      'Nuestra hamburguesa insignia: 180g de carne angus molida a mano, sellada a la plancha de hierro fundido con queso cheddar derretido, tocineta ahumada crujiente, cebolla frita crocante y salsa tártara secreta de la casa en pan brioche artesanal tostado.',
    tiempoMinutos: 15,
    caloriasAprox: 720,
    nivelPicante: 0,
    esEspecialidad: true,
    ingredientes: [
      'Carne de res 100% artesanal (180g)',
      'Queso cheddar fundido',
      'Tocineta ahumada crujiente',
      'Cebolla frita crocante al estilo street',
      'Lechuga batavia fresca y tomate milano',
      'Pan brioche artesanal con mantequilla dorada',
      'Salsa tártara y salsa dulce de la casa',
    ],
    alergenos: [
      ALERGENOS_CATALOGO.gluten,
      ALERGENOS_CATALOGO.lacteos,
      ALERGENOS_CATALOGO.huevo,
    ],
    fotosHD: [
      'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1553979459-d2229ba7433b?auto=format&fit=crop&w=1200&q=80',
    ],
    modelo3D: MODELO_3D_HAMBURGUESA,
  },
  salvajada: {
    nombre: 'Salvajada Familiar Sazonare',
    descripcionChef:
      'La reina de la noche para compartir: cama generosa de papas francesas crocantes coronada con trozos jugosos de carne asada, pechuga a la parrilla, chorizo santarrosano, tocineta picada, maíz dulce desgranado, baño abundante de queso costeño gratinado y lluvia de papita chip.',
    tiempoMinutos: 20,
    caloriasAprox: 1250,
    nivelPicante: 1,
    esEspecialidad: true,
    ingredientes: [
      'Papas a la francesa crocantes',
      'Carne de res seleccionada al carbón',
      'Pechuga de pollo a la plancha marinada',
      'Chorizo santarrosano artesanal',
      'Tocineta ahumada picada',
      'Maíz dulce tierno desgranado',
      'Queso costeño fundido y gratinado',
      'Salsas de la casa y papitas fósforo',
    ],
    alergenos: [
      ALERGENOS_CATALOGO.lacteos,
      ALERGENOS_CATALOGO.huevo,
    ],
    fotosHD: [
      'https://images.unsplash.com/photo-1585109649139-366815a0d713?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=1200&q=80',
    ],
    modelo3D: MODELO_3D_SALCHIPAPA,
  },
  salchipapa: {
    nombre: 'Salchipapa Salvaje Street',
    descripcionChef:
      'Papas doradas con salchicha manguera prémium, trozos de pechuga de pollo marinada, tocineta crujiente, queso costeño rallado en abundancia y salsa tártara de la abuela.',
    tiempoMinutos: 12,
    caloriasAprox: 890,
    nivelPicante: 0,
    esEspecialidad: true,
    ingredientes: [
      'Papas francesas o criollas doradas',
      'Salchicha especial tipo manguera',
      'Trozos de pechuga de pollo a la plancha',
      'Tocineta frita picada',
      'Queso costeño fresco rallado en lluvia',
      'Trío de salsas caseras',
    ],
    alergenos: [ALERGENOS_CATALOGO.lacteos, ALERGENOS_CATALOGO.huevo],
    fotosHD: [
      'https://images.unsplash.com/photo-1585109649139-366815a0d713?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?auto=format&fit=crop&w=1200&q=80',
    ],
    modelo3D: MODELO_3D_SALCHIPAPA,
  },
  pizza: {
    nombre: 'Porción de Pizza Artesanal',
    descripcionChef:
      'Masa crujiente horneada a la piedra, bañada con salsa pomodoro napolitana, abundante queso mozzarella fundido, pepperoni doradito y toque de orégano y albahaca fresca.',
    tiempoMinutos: 10,
    caloriasAprox: 460,
    nivelPicante: 0,
    esEspecialidad: true,
    ingredientes: [
      'Masa artesanal de fermentación lenta',
      'Salsa napolitana de tomates frescos',
      'Queso mozzarella premium fundido',
      'Pepperoni curado especiado',
      'Hojas de albahaca fresca y orégano',
    ],
    alergenos: [ALERGENOS_CATALOGO.gluten, ALERGENOS_CATALOGO.lacteos],
    fotosHD: [
      'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=1200&q=80',
    ],
    modelo3D: MODELO_3D_PIZZA,
  },
  perro: {
    nombre: 'Perro Caliente Especial Street',
    descripcionChef:
      'Pan suave al vapor con salchicha jumbo seleccionada a la plancha, lluvia abundante de papitas fósforo crujientes, queso costeño rallado, salsa tártara y salsa de piña casera.',
    tiempoMinutos: 10,
    caloriasAprox: 580,
    nivelPicante: 0,
    esEspecialidad: true,
    ingredientes: [
      'Pan brioche suave para perro',
      'Salchicha jumbo ahumada',
      'Papitas fósforo super crocantes',
      'Queso costeño fresco rallado',
      'Dúo de salsas especiales de la casa',
    ],
    alergenos: [ALERGENOS_CATALOGO.gluten, ALERGENOS_CATALOGO.lacteos, ALERGENOS_CATALOGO.huevo],
    fotosHD: [
      'https://images.unsplash.com/photo-1619740455993-9e612b1af08a?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1627054234038-08579ad06c3a?auto=format&fit=crop&w=1200&q=80',
    ],
    modelo3D: MODELO_3D_PERRO,
  },
};

/**
 * Resuelve y genera el detalle gastronómico enriquecido para cualquier producto de la base de datos
 */
export function obtenerDetalleGastronomico(producto: {
  id: string;
  nombre: string;
  precio: number;
  imagen?: string | null;
  categoria?: { id: string; nombre: string };
}): DetalleGastronomico {
  const nombreNormalizado = producto.nombre.toLowerCase();
  const catNormalizada = producto.categoria?.nombre?.toLowerCase() || '';

  // 1. Coincidencia específica
  let metaBase: Partial<DetalleGastronomico> | undefined;

  if (nombreNormalizado.includes('pizza') || catNormalizada.includes('pizza')) {
    metaBase = PLATILLOS_METADATA_BASE['pizza'];
  } else if (nombreNormalizado.includes('hamburguesa') || nombreNormalizado.includes('burger')) {
    metaBase = PLATILLOS_METADATA_BASE['hamburguesa-sazonare'];
  } else if (nombreNormalizado.includes('salvajada') || catNormalizada.includes('salvajada')) {
    metaBase = PLATILLOS_METADATA_BASE['salvajada'];
  } else if (
    nombreNormalizado.includes('salchipapa') ||
    nombreNormalizado.includes('salchi') ||
    catNormalizada.includes('salchipapa') ||
    catNormalizada.includes('salchi') ||
    catNormalizada.includes('mazorca')
  ) {
    metaBase = PLATILLOS_METADATA_BASE['salchipapa'];
  } else if (nombreNormalizado.includes('perro') || nombreNormalizado.includes('hot dog') || catNormalizada.includes('perro')) {
    metaBase = PLATILLOS_METADATA_BASE['perro'];
  }

  // 2. Fallback inteligente según categoría
  const esBebida = catNormalizada.includes('bebida') || catNormalizada.includes('jugo') || catNormalizada.includes('gaseosa');
  const esComidaRapida = !esBebida;
  const esPizza = nombreNormalizado.includes('pizza') || catNormalizada.includes('pizza');
  const esPerro = nombreNormalizado.includes('perro') || nombreNormalizado.includes('hot dog') || catNormalizada.includes('perro');
  const esSalchipapa =
    nombreNormalizado.includes('salchipapa') ||
    nombreNormalizado.includes('salchi') ||
    nombreNormalizado.includes('salvajada') ||
    nombreNormalizado.includes('papa') ||
    catNormalizada.includes('salchipapa') ||
    catNormalizada.includes('salvajada') ||
    catNormalizada.includes('salchi') ||
    catNormalizada.includes('mazorca');

  const fotosHD: string[] = [];
  if (producto.imagen) {
    fotosHD.push(producto.imagen);
  }
  if (metaBase?.fotosHD) {
    fotosHD.push(...metaBase.fotosHD.filter((f) => !fotosHD.includes(f)));
  }
  if (fotosHD.length === 0) {
    if (esBebida) {
      fotosHD.push('https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=1200&q=80');
    } else if (esPizza) {
      fotosHD.push('https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=80');
    } else if (esPerro) {
      fotosHD.push('https://images.unsplash.com/photo-1619740455993-9e612b1af08a?auto=format&fit=crop&w=1200&q=80');
    } else if (esSalchipapa) {
      fotosHD.push('https://images.unsplash.com/photo-1585109649139-366815a0d713?auto=format&fit=crop&w=1200&q=80');
    } else {
      fotosHD.push('https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=80');
    }
  }

  const ingredientesFallback = esBebida
    ? ['Bebida fría servida a temperatura óptima', 'Hielo al gusto', 'Presentación en botella o lata sellada']
    : [
        'Ingredientes frescos del día seleccionados por el chef',
        'Cocción al momento en parrilla de hierro fundido',
        'Salsas tradicionales de la casa',
        'Acompañamiento a elección',
      ];

  const alergenosFallback = esBebida
    ? []
    : [ALERGENOS_CATALOGO.gluten, ALERGENOS_CATALOGO.lacteos];

  return {
    id: producto.id,
    nombre: producto.nombre,
    descripcionChef:
      metaBase?.descripcionChef ||
      `Especialidad de la casa elaborada con ingredientes frescos y sazón tradicional. Preparado al instante en nuestra cocina para ofrecerte la mejor textura y sabor street food.`,
    tiempoMinutos: metaBase?.tiempoMinutos || (esBebida ? 3 : 15),
    caloriasAprox: metaBase?.caloriasAprox || (esBebida ? 140 : 650),
    nivelPicante: metaBase?.nivelPicante ?? 0,
    esEspecialidad: metaBase?.esEspecialidad ?? true,
    esVeggie: false,
    ingredientes: metaBase?.ingredientes || ingredientesFallback,
    alergenos: metaBase?.alergenos || alergenosFallback,
    adicionesDisponibles: esBebida ? [] : ADICIONES_POPULARES,
    preferenciasSugeridas: esBebida
      ? ['Con hielo', 'Sin hielo', 'Vaso aparte', 'Bien fría', 'Para llevar']
      : PREFERENCIAS_COCINA_CHIPS,
    fotosHD,
    modelo3D:
      metaBase?.modelo3D ||
      (esPizza
        ? MODELO_3D_PIZZA
        : esPerro
        ? MODELO_3D_PERRO
        : esSalchipapa
        ? MODELO_3D_SALCHIPAPA
        : esComidaRapida
        ? MODELO_3D_HAMBURGUESA
        : undefined),
  };
}
