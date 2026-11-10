import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Si no se han configurado aún las variables de entorno, continuar sin bloquear
  if (!supabaseUrl || !supabaseAnonKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresca la sesión del usuario si expiró
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Rutas públicas que no requieren autenticación (La página principal '/' y '/login' son públicas)
  // NOTA: '/cocina' ahora es una zona protegida que requiere login (rol COCINA o ADMIN)
  const publicRoutes = ['/login', '/api/pedidos/activos', '/api/productos', '/auth'];
  const isPublicRoute = pathname === '/' || publicRoutes.some((route) => pathname.startsWith(route));

  // Helper para aplicar cabeceras que prohíben estrictamente el guardado en BFCache del navegador
  const aplicarHeadersSeguridad = (res: NextResponse) => {
    res.headers.set(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0'
    );
    res.headers.set('Pragma', 'no-cache');
    res.headers.set('Expires', '0');
    return res;
  };

  // Helper para redirigir preservando cookies actualizadas de Supabase y headers anti-cache
  const redirigirConSeguridad = (url: URL) => {
    const redirectResponse = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
    });
    return aplicarHeadersSeguridad(redirectResponse);
  };

  // 1. Si no hay usuario y la ruta no es pública -> Redirigir al login con mensaje
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('mensaje', 'sesion_requerida');
    return redirigirConSeguridad(url);
  }

  // 2. Si hay usuario activo y está en /login (o pulsa 'Atrás' en el navegador) -> Redirigir fuera del login
  if (user && pathname === '/login') {
    const url = request.nextUrl.clone();
    url.pathname = '/mesero';
    url.search = '';
    return redirigirConSeguridad(url);
  }

  return aplicarHeadersSeguridad(supabaseResponse);
}

export const config = {
  matcher: [
    /*
     * Aplica el middleware a todas las rutas EXCEPTO:
     * - Archivos estáticos (_next/static, _next/image, favicon.ico, etc.)
     * - Rutas de API internas
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

