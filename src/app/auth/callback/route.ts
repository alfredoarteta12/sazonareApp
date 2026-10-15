import { createSupabaseServerClient } from '@/lib/supabase-server';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Ruta de callback para Google OAuth
// Supabase redirige aquí después de autenticar al usuario
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data?.user) {
      const user = data.user;
      const userEmail = user.email || '';
      const userName =
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        userEmail.split('@')[0] ||
        'Usuario';

      try {
        // Verificar si ya existe perfil con este ID
        let perfil = await prisma.perfil.findUnique({
          where: { id: user.id },
        });

        if (!perfil) {
          // Verificar si ya había sido pre-registrado por correo desde el panel de empleados
          const preRegistrado = await prisma.perfil.findUnique({
            where: { email: userEmail },
          });

          if (preRegistrado) {
            // Actualizar su ID de Supabase Auth
            perfil = await prisma.perfil.update({
              where: { email: userEmail },
              data: {
                id: user.id,
                nombre: userName || preRegistrado.nombre,
              },
            });
          } else {
            // Si es el primer usuario del sistema, se convierte en ADMIN automáticamente
            const totalPerfiles = await prisma.perfil.count();
            const rolInicial = totalPerfiles === 0 ? 'ADMIN' : 'MESERO';

            perfil = await prisma.perfil.create({
              data: {
                id: user.id,
                email: userEmail,
                nombre: userName,
                role: rolInicial,
                activo: true,
              },
            });
          }
        }

        // Redirección inteligente según el rol asignado
        if (perfil.role === 'ADMIN') {
          return NextResponse.redirect(`${origin}/admin`);
        } else if (perfil.role === 'COCINA') {
          return NextResponse.redirect(`${origin}/cocina`);
        } else {
          return NextResponse.redirect(`${origin}/mesero`);
        }
      } catch (dbError) {
        console.error('Error al sincronizar perfil en callback:', dbError);
        return NextResponse.redirect(`${origin}/mesero`);
      }
    }
  }

  // Si hay error, redirigir al login con mensaje
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}

