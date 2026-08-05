/* Service Worker for Alerta Game PWA */
const CACHE_NAME = 'alerta-game-cache-v2';

// Em produção (Vite), apenas os arquivos públicos essenciais existem como rotas estáticas
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg'
];

// Install Event - Precache static shell assets
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Precaching app shell assets');
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Precache partial error:', err);
      });
    })
  );
});

// Activate Event - Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Stale-while-revalidate & Fallbacks seguros
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Ignorar chamadas não-HTTP/HTTPS e requisições para APIs em tempo real (Firestore, Cloud Functions)
  if (!url.protocol.startsWith('http')) return;
  if (url.hostname.includes('firestore.googleapis.com') || url.hostname.includes('cloudfunctions.net')) {
    return; // Deixa o navegador/SDK manipular diretamente
  }

  // 1. Navegação de Páginas HTML (Network First -> Fallback para index.html)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          }
          return networkResponse;
        })
        .catch(async () => {
          const cachedNavigate = await caches.match(event.request);
          if (cachedNavigate) return cachedNavigate;
          
          const indexFallback = await caches.match('/index.html') || await caches.match('/');
          if (indexFallback) return indexFallback;

          return new Response('Conteúdo offline indisponível', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
          });
        })
    );
    return;
  }

  // 2. Assets Estáticos e Imagens de Notícias (Stale-While-Revalidate com suporte a CORS/CDNs)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          // Aceita respostas normais (basic), cors e opacas (304/opaque)
          if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque' || networkResponse.type === 'cors')) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          }
          return networkResponse;
        })
        .catch(() => {
          return cachedResponse || new Response('', { status: 408, statusText: 'Request Timeout' });
        });

      return cachedResponse || fetchPromise;
    })
  );
});

// Handle Push Notifications
self.addEventListener('push', (event) => {
  let data = { title: 'Alerta Game Nova Oferta!', body: 'Novo desconto disponível na Steam!' };
  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: '/icon.svg',
    badge: '/icon.svg',
    vibrate: [100, 50, 100],
    data: { url: data.url || '/' },
    actions: [
      { action: 'open', title: 'Ver Oferta' },
      { action: 'close', title: 'Fechar' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle Notification Click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        if (clientList.length > 0) {
          return clientList[0].focus();
        }
        return clients.openWindow(event.notification.data.url || '/');
      })
    );
  }
});
