import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Cliente de Supabase para el SERVIDOR (Server Actions, middleware)
// Maneja sesiones desde cookies de forma segura
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  const url = (
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qgtaylkiuzvasnlodawd.supabase.co'
  ).replace(/\/+$/, '');

  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    'sb_publishable_0n3AFfT4NUXb7vD0qQETiQ_AddxgAZf';

  return createServerClient(url, anonKey, {
    cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // El método set fue llamado desde un Server Component.
            // Esto puede ignorarse si tienes middleware refrescando sesiones.
          }
        },
      },
    }
  );
}

