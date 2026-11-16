import { createBrowserClient } from '@supabase/ssr';

// Fallback resiliente para despliegues en AWS (Amplify, ECS, EC2, CloudFront)
// Si las variables NEXT_PUBLIC_* no se inyectaron en el paso de compilación de AWS,
// se usan los valores del proyecto oficial para evitar conexión a 'placeholder'.
const SUPABASE_URL = (
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qgtaylkiuzvasnlodawd.supabase.co'
).replace(/\/+$/, '');

const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'sb_publishable_0n3AFfT4NUXb7vD0qQETiQ_AddxgAZf';

// Cliente de Supabase para el NAVEGADOR (componentes cliente)
// WebSockets / Realtime - Canal bidireccional de baja latencia
export const supabase = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});


