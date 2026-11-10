'use client';

import { useEffect } from 'react';

/**
 * Componente de anclaje de historial para pantallas operativas del restaurante (Mesero, Admin, Cocina).
 *
 * En dispositivos móviles (Android / iOS) o navegadores de escritorio, cuando un empleado
 * desliza hacia atrás o pulsa el botón 'Atrás', el navegador intenta retroceder en el historial
 * hacia la página de login.
 *
 * Este componente intercepta el evento 'popstate' e impide que el usuario salga
 * accidentalmente de su panel de trabajo.
 */
export function DashboardHistoryLock() {
  useEffect(() => {
    // 1. Añadimos un estado centinela al historial del navegador
    window.history.pushState({ dashboardLock: true }, '', window.location.href);

    // 2. Interceptamos el retroceso ('Atrás')
    const handlePopState = () => {
      // Re-anclamos la navegación en la pantalla de trabajo actual
      window.history.pushState({ dashboardLock: true }, '', window.location.href);
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  return null;
}
