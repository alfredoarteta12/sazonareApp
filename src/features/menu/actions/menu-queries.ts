'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export interface ProductoSerializado {
  id: string;
  nombre: string;
  precio: number;
  imagen: string | null;
  disponible: boolean;
  categoriaId: string;
  categoria: {
    id: string;
    nombre: string;
  };
}

/**
 * Obtiene los productos disponibles para la estación de mesero
 */
export async function getProductos() {
  try {
    const productos = await prisma.producto.findMany({
      where: { disponible: true },
      include: { categoria: true },
      orderBy: [{ categoria: { nombre: 'asc' } }, { nombre: 'asc' }],
    });
    return {
      success: true,
      data: productos.map((p) => ({
        ...p,
        precio: Number(p.precio),
      })),
    };
  } catch (error) {
    console.error('Error al obtener productos:', error);
    return { success: false, error: 'No se pudieron cargar los productos.' };
  }
}

/**
 * Obtiene todos los productos (disponibles y agotados) para el panel de administración
 */
export async function getTodosLosProductos() {
  try {
    const productos = await prisma.producto.findMany({
      include: { categoria: true },
      orderBy: [{ categoria: { nombre: 'asc' } }, { nombre: 'asc' }],
    });
    return {
      success: true,
      data: productos.map((p) => ({
        ...p,
        precio: Number(p.precio),
      })),
    };
  } catch (error) {
    console.error('Error al obtener productos para admin:', error);
    return { success: false, error: 'No se pudieron cargar los productos.' };
  }
}

/**
 * Obtiene todas las categorías con el conteo de sus productos
 */
export async function getCategorias() {
  try {
    const categorias = await prisma.categoria.findMany({
      include: {
        _count: {
          select: { productos: true },
        },
      },
      orderBy: { nombre: 'asc' },
    });
    return { success: true, data: categorias };
  } catch (error) {
    console.error('Error al obtener categorías:', error);
    return { success: false, error: 'No se pudieron cargar las categorías.' };
  }
}

/**
 * Crea una nueva categoría en el menú
 */
export async function crearCategoria(nombre: string) {
  const nombreLimpio = nombre.trim();
  if (!nombreLimpio) {
    return { success: false, error: 'El nombre de la categoría es obligatorio.' };
  }

  try {
    const categoria = await prisma.categoria.create({
      data: { nombre: nombreLimpio },
    });
    revalidatePath('/admin/menu');
    revalidatePath('/mesero');
    return { success: true, data: categoria };
  } catch (error) {
    console.error('Error al crear categoría:', error);
    return { success: false, error: 'Ya existe una categoría con este nombre.' };
  }
}

/**
 * Elimina una categoría y sus productos asociados en cascada
 */
export async function eliminarCategoria(id: string) {
  try {
    await prisma.categoria.delete({
      where: { id },
    });
    revalidatePath('/admin/menu');
    revalidatePath('/mesero');
    return { success: true };
  } catch (error) {
    console.error('Error al eliminar categoría:', error);
    return { success: false, error: 'No se pudo eliminar la categoría.' };
  }
}

/**
 * Crea un nuevo producto en el menú
 */
export async function crearProducto(data: {
  nombre: string;
  precio: number;
  categoriaId: string;
}) {
  const { nombre, precio, categoriaId } = data;
  if (!nombre || !nombre.trim()) {
    return { success: false, error: 'El nombre del platillo es obligatorio.' };
  }
  if (isNaN(precio) || precio <= 0) {
    return { success: false, error: 'El precio debe ser un número mayor a 0.' };
  }
  if (!categoriaId) {
    return { success: false, error: 'Debes seleccionar una categoría.' };
  }

  try {
    const producto = await prisma.producto.create({
      data: {
        nombre: nombre.trim(),
        precio: Number(precio),
        categoriaId,
        disponible: true,
      },
      include: { categoria: true },
    });
    revalidatePath('/admin/menu');
    revalidatePath('/mesero');
    return {
      success: true,
      data: {
        ...producto,
        precio: Number(producto.precio),
      },
    };
  } catch (error) {
    console.error('Error al crear producto:', error);
    return { success: false, error: 'No se pudo crear el producto.' };
  }
}

/**
 * Actualiza los datos de un producto (nombre, precio, categoría)
 */
export async function actualizarProducto(
  id: string,
  data: { nombre?: string; precio?: number; categoriaId?: string }
) {
  try {
    const producto = await prisma.producto.update({
      where: { id },
      data: {
        ...(data.nombre && { nombre: data.nombre.trim() }),
        ...(data.precio !== undefined && { precio: Number(data.precio) }),
        ...(data.categoriaId && { categoriaId: data.categoriaId }),
      },
      include: { categoria: true },
    });
    revalidatePath('/admin/menu');
    revalidatePath('/mesero');
    return {
      success: true,
      data: {
        ...producto,
        precio: Number(producto.precio),
      },
    };
  } catch (error) {
    console.error('Error al actualizar producto:', error);
    return { success: false, error: 'No se pudo actualizar el producto.' };
  }
}

/**
 * Alterna la disponibilidad de un producto (Disponible / Agotado)
 */
export async function toggleDisponibilidad(productoId: string) {
  try {
    const producto = await prisma.producto.findUnique({ where: { id: productoId } });
    if (!producto) return { success: false, error: 'Producto no encontrado.' };

    const actualizado = await prisma.producto.update({
      where: { id: productoId },
      data: { disponible: !producto.disponible },
      include: { categoria: true },
    });

    revalidatePath('/admin/menu');
    revalidatePath('/mesero');
    revalidatePath('/cocina');
    return {
      success: true,
      data: {
        ...actualizado,
        precio: Number(actualizado.precio),
      },
    };
  } catch (error) {
    console.error('Error al cambiar disponibilidad:', error);
    return { success: false, error: 'No se pudo actualizar el estado del producto.' };
  }
}

/**
 * Fija explícitamente la disponibilidad de un producto (true o false)
 */
export async function setDisponibilidadProducto(productoId: string, disponible: boolean) {
  try {
    const actualizado = await prisma.producto.update({
      where: { id: productoId },
      data: { disponible },
      include: { categoria: true },
    });

    revalidatePath('/admin/menu');
    revalidatePath('/mesero');
    revalidatePath('/cocina');
    return {
      success: true,
      data: {
        ...actualizado,
        precio: Number(actualizado.precio),
      },
    };
  } catch (error) {
    console.error('Error al fijar disponibilidad de producto:', error);
    return { success: false, error: 'No se pudo actualizar el estado del producto.' };
  }
}

/**
 * Elimina un producto del menú
 */
export async function eliminarProducto(productoId: string) {
  try {
    await prisma.producto.delete({
      where: { id: productoId },
    });
    revalidatePath('/admin/menu');
    revalidatePath('/mesero');
    return { success: true };
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    return { success: false, error: 'No se pudo eliminar el producto.' };
  }
}
