import * as THREE from 'three';

export type TipoPlatillo3D = 'pizza' | 'hamburguesa' | 'salchipapa' | 'perro' | 'bebida';

/**
 * Detecta el tipo de platillo a partir de su nombre o categoría
 */
export function detectarTipoPlatillo(nombre: string, categoria: string = ''): TipoPlatillo3D {
  const texto = `${nombre} ${categoria}`.toLowerCase();

  if (texto.includes('pizza')) return 'pizza';
  if (
    texto.includes('salchipapa') ||
    texto.includes('salchi') ||
    texto.includes('salvajada') ||
    texto.includes('papa francesa') ||
    texto.includes('papas') ||
    texto.includes('mazorca')
  ) {
    return 'salchipapa';
  }
  if (texto.includes('perro') || texto.includes('hot dog') || texto.includes('choripan')) {
    return 'perro';
  }
  if (
    texto.includes('bebida') ||
    texto.includes('gaseosa') ||
    texto.includes('jugo') ||
    texto.includes('coca cola') ||
    texto.includes('agua') ||
    texto.includes('cerveza') ||
    texto.includes('refresco')
  ) {
    return 'bebida';
  }

  // Por defecto, platos street food tipo hamburguesa o sándwich
  return 'hamburguesa';
}

/**
 * Retorna la ruta del archivo GLB profesional alojado en public/models si existe
 */
export function obtenerRutaModeloGLB(tipo: TipoPlatillo3D): string | null {
  switch (tipo) {
    case 'pizza':
      return '/models/pizza.glb';
    case 'perro':
      return '/models/perro.glb';
    case 'salchipapa':
      return '/models/salchipapa.glb';
    case 'hamburguesa':
      return '/models/burger.glb';
    case 'bebida':
      return null;
    default:
      return null;
  }
}

/**
 * Construye un modelo 3D procedural realista 100% mediante código WebGL/Three.js
 * Carga en 3ms, pesa 0 KB de descarga en red y responde a adiciones en tiempo real.
 */
export function crearPlato3D(
  nombre: string,
  categoria: string = '',
  adiciones: string[] = []
): THREE.Group {
  const tipo = detectarTipoPlatillo(nombre, categoria);
  const platoGroup = new THREE.Group();

  switch (tipo) {
    case 'pizza':
      construirPizzaSlice3D(platoGroup, adiciones);
      break;
    case 'salchipapa':
      construirSalchipapa3D(platoGroup, adiciones);
      break;
    case 'perro':
      construirPerroCaliente3D(platoGroup, adiciones);
      break;
    case 'bebida':
      construirBebida3D(platoGroup);
      break;
    case 'hamburguesa':
    default:
      construirHamburguesa3D(platoGroup, adiciones);
      break;
  }

  return platoGroup;
}

// ==========================================
// 1. PORCIÓN DE PIZZA ARTESANAL 3D
// ==========================================
function construirPizzaSlice3D(grupo: THREE.Group, adiciones: string[]) {
  const pizzaGroup = new THREE.Group();
  pizzaGroup.position.y = -0.05;

  // 1.1 Base de Masa Triangular con Borde Curvo
  const masaShape = new THREE.Shape();
  masaShape.moveTo(0, -0.9); // Punta de la porción
  masaShape.lineTo(-0.75, 0.7); // Esquina izquierda de la corteza
  masaShape.quadraticCurveTo(0, 0.92, 0.75, 0.7); // Borde curvo de la corteza
  masaShape.lineTo(0, -0.9);

  const extrudeSettings = {
    depth: 0.09,
    bevelEnabled: true,
    bevelSegments: 3,
    steps: 1,
    bevelSize: 0.025,
    bevelThickness: 0.025,
  };

  const masaGeo = new THREE.ExtrudeGeometry(masaShape, extrudeSettings);
  const masaMat = new THREE.MeshStandardMaterial({
    color: 0xdfa054, // Masa dorada horneada
    roughness: 0.65,
    metalness: 0.05,
  });
  const masaMesh = new THREE.Mesh(masaGeo, masaMat);
  masaMesh.rotation.x = -Math.PI / 2;
  masaMesh.position.y = -0.05;
  pizzaGroup.add(masaMesh);

  // 1.2 Borde Grueso y Esponjoso de la Corteza (Crust Rim)
  const bordeGeo = new THREE.TorusGeometry(0.78, 0.09, 14, 28, Math.PI * 0.58);
  const bordeMat = new THREE.MeshStandardMaterial({
    color: 0xb56d22, // Tostado con toques dorados
    roughness: 0.55,
  });
  const bordeMesh = new THREE.Mesh(bordeGeo, bordeMat);
  bordeMesh.rotation.x = -Math.PI / 2;
  bordeMesh.rotation.z = -Math.PI * 0.79;
  bordeMesh.position.set(0, 0.06, 0.64);
  pizzaGroup.add(bordeMesh);

  // 1.3 Capa de Salsa Napolitana de Tomate
  const salsaShape = new THREE.Shape();
  salsaShape.moveTo(0, -0.84);
  salsaShape.lineTo(-0.68, 0.62);
  salsaShape.quadraticCurveTo(0, 0.8, 0.68, 0.62);
  salsaShape.lineTo(0, -0.84);

  const salsaGeo = new THREE.ExtrudeGeometry(salsaShape, {
    depth: 0.03,
    bevelEnabled: false,
  });
  const salsaMat = new THREE.MeshStandardMaterial({
    color: 0x991b1b, // Rojo tomate concentrado brillante
    roughness: 0.35,
    metalness: 0.1,
  });
  const salsaMesh = new THREE.Mesh(salsaGeo, salsaMat);
  salsaMesh.rotation.x = -Math.PI / 2;
  salsaMesh.position.y = 0.045;
  pizzaGroup.add(salsaMesh);

  // 1.4 Queso Mozzarella Fundido Dorado con Hilos
  const tieneExtraQueso = adiciones.some((a) => a.includes('queso'));
  const grosorQueso = tieneExtraQueso ? 0.05 : 0.035;

  const quesoShape = new THREE.Shape();
  quesoShape.moveTo(0, -0.87); // Se desborda un poco en la punta
  quesoShape.lineTo(-0.69, 0.61);
  quesoShape.quadraticCurveTo(0, 0.78, 0.69, 0.61);
  quesoShape.lineTo(0, -0.87);

  const quesoGeo = new THREE.ExtrudeGeometry(quesoShape, {
    depth: grosorQueso,
    bevelEnabled: true,
    bevelSegments: 2,
    bevelSize: 0.02,
    bevelThickness: 0.015,
  });
  const quesoMat = new THREE.MeshStandardMaterial({
    color: tieneExtraQueso ? 0xf59e0b : 0xfde047, // Amarillo mozzarella caliente
    roughness: 0.28,
    metalness: 0.08,
  });
  const quesoMesh = new THREE.Mesh(quesoGeo, quesoMat);
  quesoMesh.rotation.x = -Math.PI / 2;
  quesoMesh.position.y = 0.07;
  pizzaGroup.add(quesoMesh);

  // 1.5 Rodajas de Pepperoni con Esquinas Levantadas
  const peppGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.024, 20);
  const peppMat = new THREE.MeshStandardMaterial({
    color: 0x881337, // Rojo vino especiado
    roughness: 0.45,
    metalness: 0.12,
  });

  const posicionesPepp = [
    { x: 0, z: -0.4, rot: 0.05 },
    { x: -0.28, z: 0.05, rot: -0.08 },
    { x: 0.28, z: 0.1, rot: 0.12 },
    { x: -0.38, z: 0.45, rot: 0.06 },
    { x: 0.36, z: 0.48, rot: -0.1 },
    { x: 0.02, z: 0.25, rot: 0.02 },
  ];

  posicionesPepp.forEach((pos) => {
    const slice = new THREE.Mesh(peppGeo, peppMat);
    slice.position.set(pos.x, 0.11 + (tieneExtraQueso ? 0.02 : 0), pos.z);
    slice.rotation.y = pos.rot;
    slice.rotation.z = (Math.random() - 0.5) * 0.08;
    pizzaGroup.add(slice);
  });

  // 1.6 Hojas de Albahaca y Toques de Orégano
  const albahacaGeo = new THREE.SphereGeometry(0.06, 6, 4);
  const albahacaMat = new THREE.MeshStandardMaterial({
    color: 0x15803d, // Verde albahaca fresca
    roughness: 0.4,
  });
  const posicionesVerdes = [
    { x: 0.12, z: -0.15 },
    { x: -0.14, z: 0.3 },
    { x: -0.08, z: -0.55 },
    { x: 0.22, z: 0.35 },
  ];
  posicionesVerdes.forEach((pos) => {
    const hoja = new THREE.Mesh(albahacaGeo, albahacaMat);
    hoja.position.set(pos.x, 0.12 + (tieneExtraQueso ? 0.02 : 0), pos.z);
    hoja.scale.set(1.4, 0.2, 0.8);
    hoja.rotation.y = Math.random() * Math.PI;
    pizzaGroup.add(hoja);
  });

  // 1.7 Plato rústico de piedra o madera negra
  const platoGeo = new THREE.CylinderGeometry(1.25, 1.3, 0.06, 36);
  const platoMat = new THREE.MeshStandardMaterial({
    color: 0x1c1917, // Piedra volcánica / madera oscura
    roughness: 0.85,
  });
  const plato = new THREE.Mesh(platoGeo, platoMat);
  plato.position.y = -0.1;
  pizzaGroup.add(plato);

  grupo.add(pizzaGroup);
}

// ==========================================
// 2. HAMBURGUESA SAZONARE ARTESANAL 3D
// ==========================================
function construirHamburguesa3D(grupo: THREE.Group, adiciones: string[]) {
  const burger = new THREE.Group();

  const tieneDobleCarne = adiciones.some((a) => a.includes('carne'));
  const tieneTocineta = adiciones.some((a) => a.includes('tocineta'));
  const tieneExtraQueso = adiciones.some((a) => a.includes('queso'));

  let yOffset = -0.27;

  // 2.1 Plato de presentación rústico
  const platoGeo = new THREE.CylinderGeometry(1.2, 1.25, 0.07, 36);
  const platoMat = new THREE.MeshStandardMaterial({ color: 0x221a15, roughness: 0.7 });
  const plato = new THREE.Mesh(platoGeo, platoMat);
  plato.position.y = yOffset - 0.12;
  burger.add(plato);

  // 2.2 Pan Brioche Inferior
  const panMat = new THREE.MeshStandardMaterial({
    color: 0xc8782a,
    roughness: 0.35,
    metalness: 0.08,
  });
  const panInfGeo = new THREE.CylinderGeometry(0.85, 0.82, 0.22, 32);
  const panInferior = new THREE.Mesh(panInfGeo, panMat);
  panInferior.position.y = yOffset;
  burger.add(panInferior);

  yOffset += 0.16;

  // 2.3 Lechuga Ondulada Fresca
  const lechugaGeo = new THREE.TorusGeometry(0.88, 0.09, 12, 32);
  const lechugaMat = new THREE.MeshStandardMaterial({ color: 0x47a836, roughness: 0.6 });
  const lechuga = new THREE.Mesh(lechugaGeo, lechugaMat);
  lechuga.position.y = yOffset;
  lechuga.rotation.x = Math.PI / 2;
  burger.add(lechuga);

  yOffset += 0.07;

  // 2.4 Rodaja de Tomate Rojo
  const tomateGeo = new THREE.CylinderGeometry(0.85, 0.85, 0.08, 24);
  const tomateMat = new THREE.MeshStandardMaterial({
    color: 0xd92d20,
    roughness: 0.25,
    metalness: 0.1,
  });
  const tomate = new THREE.Mesh(tomateGeo, tomateMat);
  tomate.position.y = yOffset;
  burger.add(tomate);

  yOffset += 0.15;

  // 2.5 Primera Carne a la Parrilla
  const carneGeo = new THREE.CylinderGeometry(0.88, 0.9, 0.24, 32);
  const carneMat = new THREE.MeshStandardMaterial({
    color: 0x3d1d11,
    roughness: 0.8,
    metalness: 0.05,
  });
  const carne1 = new THREE.Mesh(carneGeo, carneMat);
  carne1.position.y = yOffset;
  burger.add(carne1);

  yOffset += 0.14;

  // 2.6 Queso Cheddar Fundido
  const quesoMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    roughness: 0.2,
    metalness: 0.1,
  });
  const quesoGeo = new THREE.BoxGeometry(1.3, 0.05, 1.3);
  const queso = new THREE.Mesh(quesoGeo, quesoMat);
  queso.position.y = yOffset;
  queso.rotation.y = Math.PI / 4;
  burger.add(queso);

  // 2.7 Si tiene doble carne añadida
  if (tieneDobleCarne) {
    yOffset += 0.16;
    const carne2 = new THREE.Mesh(carneGeo, carneMat);
    carne2.position.y = yOffset;
    burger.add(carne2);

    yOffset += 0.12;
    const queso2 = new THREE.Mesh(quesoGeo, quesoMat);
    queso2.position.y = yOffset;
    queso2.rotation.y = Math.PI / 3;
    burger.add(queso2);
  }

  // 2.8 Si tiene tocineta caramelizada añadida
  if (tieneTocineta) {
    yOffset += 0.08;
    const tocMat = new THREE.MeshStandardMaterial({ color: 0x7c2d12, roughness: 0.4 });
    const tocGeo = new THREE.BoxGeometry(1.2, 0.04, 0.35);
    const toc1 = new THREE.Mesh(tocGeo, tocMat);
    toc1.position.y = yOffset;
    toc1.rotation.y = 0.3;
    burger.add(toc1);

    const toc2 = new THREE.Mesh(tocGeo, tocMat);
    toc2.position.y = yOffset + 0.02;
    toc2.rotation.y = -0.5;
    burger.add(toc2);
  }

  // 2.9 Si tiene queso costeño extra
  if (tieneExtraQueso && !tieneDobleCarne) {
    yOffset += 0.08;
    const quesoCostenoMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.3 });
    const quesoCosteno = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.07, 1.15), quesoCostenoMat);
    quesoCosteno.position.y = yOffset;
    quesoCosteno.rotation.y = 0.8;
    burger.add(quesoCosteno);
  }

  yOffset += 0.16;

  // 2.10 Pan Brioche Superior con Semillas de Sésamo
  const panSupGeo = new THREE.SphereGeometry(0.85, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.48);
  const panSuperior = new THREE.Mesh(panSupGeo, panMat);
  panSuperior.position.y = yOffset;
  burger.add(panSuperior);

  const sesamoGeo = new THREE.SphereGeometry(0.022, 6, 6);
  const sesamoMat = new THREE.MeshStandardMaterial({ color: 0xfff4dc, roughness: 0.4 });
  for (let i = 0; i < 26; i++) {
    const sesamo = new THREE.Mesh(sesamoGeo, sesamoMat);
    const theta = (i / 26) * Math.PI * 2 + Math.sin(i) * 0.5;
    const phi = 0.22 + (i % 3) * 0.15;
    sesamo.position.set(
      0.82 * Math.sin(phi) * Math.cos(theta),
      yOffset + 0.82 * Math.cos(phi),
      0.82 * Math.sin(phi) * Math.sin(theta)
    );
    sesamo.scale.set(1.5, 0.8, 1);
    burger.add(sesamo);
  }

  grupo.add(burger);
}

// ==========================================
// 3. SALCHIPAPA / SALVAJADA STREET FOOD 3D
// ==========================================
function construirSalchipapa3D(grupo: THREE.Group, adiciones: string[]) {
  const salchipapa = new THREE.Group();
  salchipapa.position.y = -0.15;

  // 3.1 Canasta / Bandeja Street Food
  const bandejaGeo = new THREE.CylinderGeometry(1.2, 1.05, 0.3, 32);
  const bandejaMat = new THREE.MeshStandardMaterial({
    color: 0x991b1b, // Bandeja roja street clásica
    roughness: 0.3,
    metalness: 0.1,
  });
  const bandeja = new THREE.Mesh(bandejaGeo, bandejaMat);
  bandeja.position.y = -0.1;
  salchipapa.add(bandeja);

  // Papel parafinado a cuadros en el fondo
  const papelGeo = new THREE.CylinderGeometry(1.15, 1.15, 0.02, 32);
  const papelMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f4, roughness: 0.9 });
  const papel = new THREE.Mesh(papelGeo, papelMat);
  papel.position.y = 0.05;
  salchipapa.add(papel);

  // 3.2 Montaña de Papas a la Francesa Crujientes
  const papaGeo = new THREE.BoxGeometry(0.1, 0.1, 0.75);
  const papaMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15, // Papa dorada
    roughness: 0.6,
  });

  // Generamos una pila de 32 papas cruzadas en bloque
  for (let i = 0; i < 32; i++) {
    const papa = new THREE.Mesh(papaGeo, papaMat);
    const angulo = Math.random() * Math.PI * 2;
    const radio = Math.random() * 0.65;
    const altura = 0.08 + Math.random() * 0.28;

    papa.position.set(Math.cos(angulo) * radio, altura, Math.sin(angulo) * radio);
    papa.rotation.set(
      (Math.random() - 0.5) * 0.5,
      Math.random() * Math.PI,
      (Math.random() - 0.5) * 0.5
    );
    salchipapa.add(papa);
  }

  // 3.3 Rodajas de Salchicha Asada / Ranchera
  const salchichaGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.1, 16);
  const salchichaMat = new THREE.MeshStandardMaterial({
    color: 0x831843, // Salchicha dorada a la plancha
    roughness: 0.5,
  });

  for (let i = 0; i < 18; i++) {
    const salchicha = new THREE.Mesh(salchichaGeo, salchichaMat);
    const angulo = Math.random() * Math.PI * 2;
    const radio = Math.random() * 0.6;
    const altura = 0.2 + Math.random() * 0.25;

    salchicha.position.set(Math.cos(angulo) * radio, altura, Math.sin(angulo) * radio);
    salchicha.rotation.set(
      (Math.random() - 0.5) * 0.8,
      Math.random() * Math.PI,
      (Math.random() - 0.5) * 0.8
    );
    salchipapa.add(salchicha);
  }

  // 3.4 Lluvia de Queso Costeño Rallado (cubitos blancos)
  const quesoCuboGeo = new THREE.BoxGeometry(0.04, 0.04, 0.04);
  const quesoCuboMat = new THREE.MeshStandardMaterial({ color: 0xfef9c3, roughness: 0.5 });
  for (let i = 0; i < 35; i++) {
    const cubito = new THREE.Mesh(quesoCuboGeo, quesoCuboMat);
    const r = Math.random() * 0.7;
    const theta = Math.random() * Math.PI * 2;
    cubito.position.set(Math.cos(theta) * r, 0.25 + Math.random() * 0.22, Math.sin(theta) * r);
    salchipapa.add(cubito);
  }

  // 3.5 Tiras de Salsas (Salsa Tártara y Salsa Rosada)
  const salsaRosadaMat = new THREE.MeshStandardMaterial({ color: 0xf472b6, roughness: 0.3 });
  const salsaTartaraMat = new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.3 });

  for (let s = 0; s < 4; s++) {
    const curvaPuntos = [];
    const offsetX = (s - 1.5) * 0.3;
    for (let p = -4; p <= 4; p++) {
      const z = p * 0.15;
      const x = offsetX + Math.sin(p * 1.5) * 0.08;
      const y = 0.35 + Math.cos(p * 0.5) * 0.06;
      curvaPuntos.push(new THREE.Vector3(x, y, z));
    }
    const path = new THREE.CatmullRomCurve3(curvaPuntos);
    const tuboGeo = new THREE.TubeGeometry(path, 16, 0.022, 6, false);
    const salsaTubo = new THREE.Mesh(tuboGeo, s % 2 === 0 ? salsaRosadaMat : salsaTartaraMat);
    salchipapa.add(salsaTubo);
  }

  grupo.add(salchipapa);
}

// ==========================================
// 4. PERRO CALIENTE / HOT DOG STREET FOOD 3D
// ==========================================
function construirPerroCaliente3D(grupo: THREE.Group, adiciones: string[]) {
  const hotdog = new THREE.Group();
  hotdog.position.y = -0.1;

  // 4.1 Plato o Barqueta
  const barquetaGeo = new THREE.BoxGeometry(1.6, 0.12, 0.9);
  const barquetaMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.8 });
  const barqueta = new THREE.Mesh(barquetaGeo, barquetaMat);
  barqueta.position.y = -0.2;
  hotdog.add(barqueta);

  // 4.2 Pan de Perro Suave (mitad izquierda y derecha)
  const panMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.45 });
  const panLatGeo = new THREE.CylinderGeometry(0.24, 0.24, 1.35, 20);

  const panIzq = new THREE.Mesh(panLatGeo, panMat);
  panIzq.rotation.x = Math.PI / 2;
  panIzq.position.set(-0.24, 0, 0);
  hotdog.add(panIzq);

  const panDer = new THREE.Mesh(panLatGeo, panMat);
  panDer.rotation.x = Math.PI / 2;
  panDer.position.set(0.24, 0, 0);
  hotdog.add(panDer);

  // Base del pan que une
  const panBaseGeo = new THREE.BoxGeometry(0.5, 0.18, 1.35);
  const panBase = new THREE.Mesh(panBaseGeo, panMat);
  panBase.position.set(0, -0.1, 0);
  hotdog.add(panBase);

  // 4.3 Salchicha Jumbo Jugosa
  const salchichaMat = new THREE.MeshStandardMaterial({
    color: 0x991b1b,
    roughness: 0.35,
    metalness: 0.1,
  });
  const salchichaCilGeo = new THREE.CylinderGeometry(0.17, 0.17, 1.48, 24);
  const salchicha = new THREE.Mesh(salchichaCilGeo, salchichaMat);
  salchicha.rotation.x = Math.PI / 2;
  salchicha.position.set(0, 0.06, 0);
  hotdog.add(salchicha);

  // 4.4 Papitas Fósforo / Papitas Chip Crujientes
  const chipsMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.5 });
  const chipGeo = new THREE.BoxGeometry(0.04, 0.04, 0.18);
  for (let i = 0; i < 40; i++) {
    const chip = new THREE.Mesh(chipGeo, chipsMat);
    chip.position.set(
      (Math.random() - 0.5) * 0.35,
      0.18 + Math.random() * 0.1,
      (Math.random() - 0.5) * 1.1
    );
    chip.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
    hotdog.add(chip);
  }

  // 4.5 Rayado Zigzag de Mostaza y Ketchup
  const mostazaMat = new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.25 });
  const salsaCurva = [];
  for (let z = -0.55; z <= 0.55; z += 0.08) {
    const x = Math.sin(z * 18) * 0.16;
    salsaCurva.push(new THREE.Vector3(x, 0.26, z));
  }
  const salsaPath = new THREE.CatmullRomCurve3(salsaCurva);
  const salsaGeo = new THREE.TubeGeometry(salsaPath, 24, 0.024, 6, false);
  const mostazaMesh = new THREE.Mesh(salsaGeo, mostazaMat);
  hotdog.add(mostazaMesh);

  grupo.add(hotdog);
}

// ==========================================
// 5. BEBIDA FRÍA / VASO REFRESCANTE 3D
// ==========================================
function construirBebida3D(grupo: THREE.Group) {
  const bebida = new THREE.Group();
  bebida.position.y = -0.05;

  // 5.1 Vaso de Cristal Transparente
  const vasoGeo = new THREE.CylinderGeometry(0.55, 0.42, 1.25, 32, 1, true);
  const vasoMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.1,
    metalness: 0.05,
    transparent: true,
    opacity: 0.38,
    side: THREE.DoubleSide,
  });
  const vaso = new THREE.Mesh(vasoGeo, vasoMat);
  vaso.position.y = 0;
  bebida.add(vaso);

  // Fondo de cristal grueso
  const fondoGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.08, 32);
  const fondo = new THREE.Mesh(fondoGeo, vasoMat);
  fondo.position.y = -0.6;
  bebida.add(fondo);

  // 5.2 Líquido Refrescante (Cola helada con reflejos ambarinos)
  const liquidoGeo = new THREE.CylinderGeometry(0.52, 0.41, 1.05, 32);
  const liquidoMat = new THREE.MeshStandardMaterial({
    color: 0x3b1408, // Cola / Te helado oscuro
    roughness: 0.2,
    metalness: 0.1,
    transparent: true,
    opacity: 0.88,
  });
  const liquido = new THREE.Mesh(liquidoGeo, liquidoMat);
  liquido.position.y = -0.06;
  bebida.add(liquido);

  // 5.3 Cubos de Hielo Flotantes
  const hieloMat = new THREE.MeshStandardMaterial({
    color: 0xe0f2fe,
    roughness: 0.1,
    transparent: true,
    opacity: 0.75,
  });
  const hieloGeo = new THREE.BoxGeometry(0.24, 0.24, 0.24);

  const hielo1 = new THREE.Mesh(hieloGeo, hieloMat);
  hielo1.position.set(0.12, 0.38, 0.08);
  hielo1.rotation.set(0.2, 0.4, 0.1);
  bebida.add(hielo1);

  const hielo2 = new THREE.Mesh(hieloGeo, hieloMat);
  hielo2.position.set(-0.16, 0.36, -0.1);
  hielo2.rotation.set(-0.3, 0.2, 0.4);
  bebida.add(hielo2);

  const hielo3 = new THREE.Mesh(hieloGeo, hieloMat);
  hielo3.position.set(0.04, 0.45, -0.14);
  hielo3.rotation.set(0.4, -0.3, 0.1);
  bebida.add(hielo3);

  // 5.4 Pitillo / Popote Rayado
  const pitilloGeo = new THREE.CylinderGeometry(0.035, 0.035, 1.5, 16);
  const pitilloMat = new THREE.MeshStandardMaterial({
    color: 0xf97316, // Naranja Sazonare
    roughness: 0.3,
  });
  const pitillo = new THREE.Mesh(pitilloGeo, pitilloMat);
  pitillo.position.set(0.18, 0.35, 0.12);
  pitillo.rotation.set(0.2, 0, -0.25);
  bebida.add(pitillo);

  // 5.5 Rodaja de Limón en el Borde
  const limonGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.03, 16);
  const limonMat = new THREE.MeshStandardMaterial({ color: 0x84cc16, roughness: 0.35 });
  const limon = new THREE.Mesh(limonGeo, limonMat);
  limon.position.set(-0.46, 0.58, 0.15);
  limon.rotation.set(0.4, 0.8, 1.2);
  bebida.add(limon);

  grupo.add(bebida);
}
