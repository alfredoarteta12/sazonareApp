'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { Role } from '@prisma/client';
import { randomUUID } from 'crypto';

export async function getEmpleados() {
  try {
    const empleados = await prisma.perfil.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, data: empleados };
  } catch (error) {
    console.error('Error al obtener empleados:', error);
    return { success: false, error: 'No se pudieron cargar los empleados.' };
  }
}

export async function crearEmpleado(formData: {
  nombre: string;
  email: string;
  role: Role;
}) {
  const { nombre, email, role } = formData;

  if (!email || !nombre) {
    return { success: false, error: 'El nombre y correo son obligatorios.' };
  }

  const emailClean = email.trim().toLowerCase();

  try {
    const existente = await prisma.perfil.findUnique({
      where: { email: emailClean },
    });

    if (existente) {
      return { success: false, error: 'Ya existe un empleado con este correo.' };
    }

    const nuevoEmpleado = await prisma.perfil.create({
      data: {
        id: randomUUID(),
        email: emailClean,
        nombre: nombre.trim(),
        role: role || 'MESERO',
        activo: true,
      },
    });

    revalidatePath('/admin');
    revalidatePath('/admin/empleados');
    return { success: true, data: nuevoEmpleado };
  } catch (error) {
    console.error('Error al registrar empleado:', error);
    return { success: false, error: 'Error al registrar el empleado en la base de datos.' };
  }
}

export async function actualizarRolEmpleado(id: string, nuevoRol: Role) {
  try {
    const actualizado = await prisma.perfil.update({
      where: { id },
      data: { role: nuevoRol },
    });

    revalidatePath('/admin/empleados');
    return { success: true, data: actualizado };
  } catch (error) {
    console.error('Error al actualizar rol:', error);
    return { success: false, error: 'No se pudo actualizar el rol.' };
  }
}

export async function toggleActivoEmpleado(id: string) {
  try {
    const empleado = await prisma.perfil.findUnique({ where: { id } });
    if (!empleado) return { success: false, error: 'Empleado no encontrado.' };

    const actualizado = await prisma.perfil.update({
      where: { id },
      data: { activo: !empleado.activo },
    });

    revalidatePath('/admin/empleados');
    return { success: true, data: actualizado };
  } catch (error) {
    console.error('Error al cambiar estado de empleado:', error);
    return { success: false, error: 'No se pudo cambiar el estado.' };
  }
}

export async function eliminarEmpleado(id: string) {
  try {
    await prisma.perfil.delete({
      where: { id },
    });

    revalidatePath('/admin/empleados');
    return { success: true };
  } catch (error) {
    console.error('Error al eliminar empleado:', error);
    return { success: false, error: 'No se pudo eliminar el empleado.' };
  }
}

