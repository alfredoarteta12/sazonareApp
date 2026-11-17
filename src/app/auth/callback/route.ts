import { createSupabaseServerClient } from '@/lib/supabase-server';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Ruta de callback para Google OAuth
// Supabase redirige aquí después de autenticar al usuario
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  // Detectar el origen público real (crucial en AWS detrás de CloudFront / balanceadores)
  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https';
  const host = forwardedHost || request.headers.get('host');

  let origin = '';
  if (host) {
    const isLocal = host.includes('localhost') || host.includes('127.0.0.1');
    origin = `${isLocal ? 'http' : forwardedProto}://${host}`;
  } else if (process.env.NEXT_PUBLIC_SITE_URL) {
    origin = process.env.NEXT_PUBLIC_SITE_URL.replace(/\/+$/, '');
  } else {
    origin = requestUrl.origin;
  }

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data?.user) {
      const user = data.user;
      const userEmail = (user.email || '').trim().toLowerCase();
      const userName =
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        userEmail.split('@')[0] ||
        'Usuario';

      try {
        // 1. Verificar si ya existe perfil con este ID de Supabase Auth
        let perfil = await prisma.perfil.findUnique({
          where: { id: user.id },
        });

        // 2. Si no existe por ID, verificar si fue pre-registrado por correo desde /admin/empleados
        if (!perfil && userEmail) {
          const preRegistrado = await prisma.perfil.findFirst({
            where: {
              email: {
                equals: userEmail,
                mode: 'insensitive',
              },
            },
          });

          if (preRegistrado) {
            // Si el ID en base de datos es distinto al ID generado por Supabase Auth
            if (preRegistrado.id !== user.id) {
              try {
                // Actualizar relaciones previas para evitar error de clave foránea
                await prisma.pedido.updateMany({
                  where: { creadoPorId: preRegistrado.id },
                  data: { creadoPorId: user.id },
                });
                await prisma.cierreCaja.updateMany({
                  where: { responsableId: preRegistrado.id },
                  data: { responsableId: user.id },
                });

                perfil = await prisma.perfil.update({
                  where: { id: preRegistrado.id },
                  data: {
                    id: user.id,
                    email: userEmail,
                    nombre: userName || preRegistrado.nombre,
                  },
                });
              } catch (updateErr) {
                console.error('No se pudo migrar ID primario, preservando perfil pre-registrado:', updateErr);
                perfil = preRegistrado;
              }
            } else {
              perfil = preRegistrado;
            }
          } else {
            // Si es un usuario nuevo no pre-registrado:
            // Si es el primer usuario de la base de datos es ADMIN, de lo contrario MESERO
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

        // Si la cuenta del empleado está desactivada
        if (perfil && !perfil.activo) {
          await supabase.auth.signOut();
          return NextResponse.redirect(`${origin}/login?error=cuenta_desactivada`);
        }

        // Redirección garantizada según el rol
        if (perfil?.role === 'ADMIN') {
          return NextResponse.redirect(`${origin}/admin`);
        } else if (perfil?.role === 'COCINA') {
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

  // Si hay error en el intercambio de código, redirigir al login
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
