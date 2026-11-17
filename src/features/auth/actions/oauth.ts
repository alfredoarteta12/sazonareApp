'use server';

import { createSupabaseServerClient } from '@/lib/supabase-server';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';

export async function signInWithGoogle() {
  const supabase = await createSupabaseServerClient();
  const headersList = await headers();

  // Detectar el host y protocolo real del navegador (indispensable para AWS / CloudFront)
  const host = headersList.get('x-forwarded-host') || headersList.get('host');
  const proto = headersList.get('x-forwarded-proto') || 'https';
  
  // Construir origen dinámico: si está en AWS usará el dominio de AWS, si está en localhost usará localhost
  let origin = '';
  if (host) {
    const isLocal = host.includes('localhost') || host.includes('127.0.0.1');
    origin = `${isLocal ? 'http' : proto}://${host}`;
  } else if (process.env.NEXT_PUBLIC_SITE_URL) {
    origin = process.env.NEXT_PUBLIC_SITE_URL.replace(/\/+$/, '');
  } else {
    origin = 'http://localhost:3000';
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (data.url) {
    redirect(data.url);
  }
}

export async function signUpWithEmail(formData: { email: string; password: string; nombre: string }) {
  const supabase = await createSupabaseServerClient();
  const email = formData.email.trim().toLowerCase();
  const password = formData.password;
  const nombre = formData.nombre.trim();

  if (!email || !password || !nombre) {
    return { success: false, error: 'Todos los campos son obligatorios.' };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: nombre,
      },
    },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  if (data.user) {
    try {
      // Si es el primer usuario, se le asigna rol ADMIN automáticamente
      const totalPerfiles = await prisma.perfil.count();
      const rolInicial = totalPerfiles === 0 ? 'ADMIN' : 'MESERO';

      const perfil = await prisma.perfil.upsert({
        where: { email },
        update: { id: data.user.id, nombre },
        create: {
          id: data.user.id,
          email,
          nombre,
          role: rolInicial,
          activo: true,
        },
      });

      const destino =
        perfil.role === 'ADMIN' ? '/admin' : perfil.role === 'COCINA' ? '/cocina' : '/mesero';
      return { success: true, redirectTo: destino };
    } catch (e: any) {
      console.error('Error al sincronizar perfil en signUp:', e);
      return { success: true, redirectTo: '/mesero' };
    }
  }

  return { success: true, redirectTo: '/mesero' };
}

export async function signInWithEmail(formData: { email: string; password: string }): Promise<{
  success: boolean;
  error?: string;
  redirectTo?: string;
}> {
  const supabase = await createSupabaseServerClient();
  const email = formData.email.trim().toLowerCase();
  const password = formData.password;

  if (!email || !password) {
    return { success: false, error: 'Por favor ingresa correo y contraseña.' };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { success: false, error: 'Credenciales inválidas. Revisa tu correo o contraseña.' };
  }

  if (data.user) {
    try {
      let perfil = await prisma.perfil.findUnique({
        where: { id: data.user.id },
      });

      // Si no existe perfil por ID, buscar si ya fue pre-registrado por correo
      if (!perfil) {
        const preRegistrado = await prisma.perfil.findFirst({
          where: { email: { equals: email, mode: 'insensitive' } },
        });

        if (preRegistrado) {
          if (preRegistrado.id !== data.user.id) {
            try {
              await prisma.pedido.updateMany({
                where: { creadoPorId: preRegistrado.id },
                data: { creadoPorId: data.user.id },
              });
              await prisma.cierreCaja.updateMany({
                where: { responsableId: preRegistrado.id },
                data: { responsableId: data.user.id },
              });
              perfil = await prisma.perfil.update({
                where: { id: preRegistrado.id },
                data: { id: data.user.id },
              });
            } catch {
              perfil = preRegistrado;
            }
          } else {
            perfil = preRegistrado;
          }
        } else {
          const total = await prisma.perfil.count();
          perfil = await prisma.perfil.create({
            data: {
              id: data.user.id,
              email,
              nombre: data.user.user_metadata?.full_name || email.split('@')[0],
              role: total === 0 ? 'ADMIN' : 'MESERO',
              activo: true,
            },
          });
        }
      }

      if (!perfil.activo) {
        await supabase.auth.signOut();
        return { success: false, error: 'Tu cuenta de empleado ha sido desactivada.' };
      }

      const destino =
        perfil.role === 'ADMIN' ? '/admin' : perfil.role === 'COCINA' ? '/cocina' : '/mesero';
      return { success: true, redirectTo: destino };
    } catch (e: any) {
      console.error('Error al sincronizar perfil en signIn:', e);
      return { success: true, redirectTo: '/mesero' };
    }
  }

  return { success: true, redirectTo: '/mesero' };
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/login?mensaje=sesion_cerrada');
}
