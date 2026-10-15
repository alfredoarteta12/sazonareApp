import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...');

  // Categorías del menú
  const categorias = await Promise.all([
    prisma.categoria.upsert({
      where: { nombre: 'Hamburguesas' },
      update: {},
      create: { nombre: 'Hamburguesas' },
    }),
    prisma.categoria.upsert({
      where: { nombre: 'Bebidas' },
      update: {},
      create: { nombre: 'Bebidas' },
    }),
    prisma.categoria.upsert({
      where: { nombre: 'Acompañamientos' },
      update: {},
      create: { nombre: 'Acompañamientos' },
    }),
    prisma.categoria.upsert({
      where: { nombre: 'Postres' },
      update: {},
      create: { nombre: 'Postres' },
    }),
  ]);

  const [hamburguesas, bebidas, acompañamientos, postres] = categorias;

  // Productos
  await prisma.producto.createMany({
    skipDuplicates: true,
    data: [
      { nombre: 'Hamburguesa Clásica', precio: 85.0, categoriaId: hamburguesas.id },
      { nombre: 'Hamburguesa BBQ', precio: 95.0, categoriaId: hamburguesas.id },
      { nombre: 'Hamburguesa Doble', precio: 110.0, categoriaId: hamburguesas.id },
      { nombre: 'Hamburguesa Vegana', precio: 90.0, categoriaId: hamburguesas.id },
      { nombre: 'Refresco', precio: 25.0, categoriaId: bebidas.id },
      { nombre: 'Agua Mineral', precio: 20.0, categoriaId: bebidas.id },
      { nombre: 'Jugo Natural', precio: 35.0, categoriaId: bebidas.id },
      { nombre: 'Malteada', precio: 55.0, categoriaId: bebidas.id },
      { nombre: 'Papas Fritas', precio: 40.0, categoriaId: acompañamientos.id },
      { nombre: 'Aros de Cebolla', precio: 45.0, categoriaId: acompañamientos.id },
      { nombre: 'Ensalada', precio: 50.0, categoriaId: acompañamientos.id },
      { nombre: 'Pay de Queso', precio: 45.0, categoriaId: postres.id },
      { nombre: 'Brownie', precio: 40.0, categoriaId: postres.id },
    ],
  });

  console.log('✅ Seed completado exitosamente.');
  console.log('⚠️  Recuerda crear el usuario Admin manualmente en Supabase Auth y en la tabla Perfil.');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

