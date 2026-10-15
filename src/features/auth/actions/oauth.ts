'use server';

import { createSupabaseServerClient } from '@/lib/supabase-server';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';

export async function signInWithGoogle() {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
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

      if (perfil.role === 'ADMIN') {
        redirect('/admin');
      } else if (perfil.role === 'COCINA') {
        redirect('/cocina');
      } else {
        redirect('/mesero');
      }
    } catch (e: any) {
      if (e?.digest?.startsWith('NEXT_REDIRECT')) throw e;
      console.error('Error al sincronizar perfil en signUp:', e);
    }
  }

  redirect('/mesero');
}

export async function signInWithEmail(formData: { email: string; password: string }) {
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

      // Si no existe perfil en DB pero existe en Supabase Auth, crearlo
      if (!perfil) {
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

      if (perfil.role === 'ADMIN') {
        redirect('/admin');
      } else if (perfil.role === 'COCINA') {
        redirect('/cocina');
      } else {
        redirect('/mesero');
      }
    } catch (e: any) {
      if (e?.digest?.startsWith('NEXT_REDIRECT')) throw e;
      console.error('Error al redirigir usuario en signIn:', e);
    }
  }

  redirect('/mesero');
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect('/login');
}
