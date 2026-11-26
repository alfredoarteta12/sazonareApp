const CACHE_NAME = 'sazonare-pwa-v2';

// 1. Instalación del Service Worker
self.addEventListener('install', () => {
  self.skipWaiting();
});

// 2. Activación y limpieza de cachés obsoletas
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cache) => {
            if (cache !== CACHE_NAME) {
              return caches.delete(cache);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// 3. Interceptor de peticiones seguro
self.addEventListener('fetch', (event) => {
  // Solo procesar peticiones GET
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Ignorar protocolos no soportados (chrome-extension, etc.)
  if (!url.protocol.startsWith('http')) return;

  // NO interceptar API, Supabase, autenticación, ni peticiones internas de Next.js Server Actions / RSC
  if (
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/auth') ||
    url.hostname.includes('supabase') ||
    event.request.headers.get('RSC') ||
    event.request.headers.get('Next-Router-State-Tree') ||
    event.request.headers.get('Next-Action')
  ) {
    return;
  }

  // Network First seguro: si la red falla, busca en caché. Si no está en caché, no rompe con undefined
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Clonar en caché solo recursos estáticos seguros
        if (
          networkResponse.status === 200 &&
          (url.pathname.startsWith('/icons/') ||
            url.pathname.startsWith('/fonts/') ||
            url.pathname.endsWith('.png') ||
            url.pathname.endsWith('.svg') ||
            url.pathname.endsWith('.woff2'))
        ) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(async () => {
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }

        // Si es navegación a una página y no hay red, responder amigablemente
        if (event.request.mode === 'navigate') {
          return new Response(
            '<html><body style="background:#08080a;color:#fff;font-family:sans-serif;text-align:center;padding:40px;"><h2>Sin conexión a internet</h2><p>Por favor revisa tu conexión a la red local de la terraza.</p></body></html>',
            { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
          );
        }

        // Devolver Response válida con error 503 para evitar "Failed to convert value to Response"
        return new Response('', { status: 503, statusText: 'Offline or Network Error' });
      })
  );
});
