import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// La página raíz redirige de forma inteligente según el rol del usuario
export default async function Home() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const perfil = await prisma.perfil.findUnique({
    where: { id: user.id },
  });

  if (perfil?.role === 'ADMIN') {
    redirect('/admin');
  } else if (perfil?.role === 'COCINA') {
    redirect('/cocina');
  } else {
    redirect('/mesero');
  }
}
