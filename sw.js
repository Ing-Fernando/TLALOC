const CACHE_NAME = 'tlaloc-v2.0';
const ARCHIVOS_BASE = [
  './',
  './index.html',
  './manifest.json',
  './icono.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ARCHIVOS_BASE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Para consultas a APIs de clima, intentar red primero y si no hay señal responder vacío sin romper la app
  if (event.request.url.includes('open-meteo.com')) {
    event.respondWith(
      fetch(event.request).catch(() => new Response('{}', { headers: { 'Content-Type': 'application/json' } }))
    );
    return;
  }

  // Para archivos de la app e imágenes: caché primero, luego red (guardando nuevas imágenes automáticamente)
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return (
        cached ||
        fetch(event.request).then((networkResp) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResp.clone());
            return networkResp;
          });
        })
      );
    })
  );
});