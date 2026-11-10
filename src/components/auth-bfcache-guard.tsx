'use client';

import { useEffect } from 'react';

/**
 * Escucha el evento 'pageshow' del navegador.
 * Cuando el usuario pulsa el botón 'Atrás' o 'Adelante', los navegadores móviles y de escritorio
 * pueden intentar restaurar la página desde la memoria (BFCache - Back/Forward Cache).
 * Si event.persisted es true, forzamos la recarga desde el servidor para que
 * el Middleware y los Server Components evalúen la autenticación real.
 */
export function AuthBfcacheGuard() {
  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        window.location.reload();
      }
    };

    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, []);

  return null;
}
