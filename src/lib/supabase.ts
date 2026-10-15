import { createBrowserClient } from '@supabase/ssr';

// Cliente de Supabase para el NAVEGADOR (componentes cliente)
// Solo para WebSockets / Realtime - No tiene acceso a datos privados
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'
);

