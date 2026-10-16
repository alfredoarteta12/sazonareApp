import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'SazonareFood - POS & Comandas',
    short_name: 'Sazonare',
    description: 'Sistema POS y Comandas en Tiempo Real para Restaurante & Terraza',
    start_url: '/',
    id: '/',
    display: 'standalone',
    display_override: ['standalone', 'minimal-ui', 'window-controls-overlay'],
    background_color: '#09090b',
    theme_color: '#09090b',
    orientation: 'any',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
    categories: ['food', 'productivity', 'business'],
    shortcuts: [
      {
        name: 'Tomar Pedidos (Meseros)',
        short_name: 'Meseros',
        description: 'Toma rápida de comandas en sala y terraza',
        url: '/mesero',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
      },
      {
        name: 'Monitor de Cocina (KDS)',
        short_name: 'Cocina',
        description: 'Pantalla de preparación en tiempo real',
        url: '/cocina',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
      },
      {
        name: 'Administración y Caja',
        short_name: 'Admin',
        description: 'Arqueo de caja, reportes y ventas',
        url: '/admin',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
      },
    ],
  };
}
