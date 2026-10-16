'use client';

import { useEffect } from 'react';

export function PwaProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[PWA] Service Worker registrado exitosamente:', registration.scope);
        })
        .catch((error) => {
          console.error('[PWA] Error al registrar Service Worker:', error);
        });
    }
  }, []);

  return <>{children}</>;
}
