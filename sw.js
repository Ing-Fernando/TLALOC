const CACHE_NAME = 'tlaloc-offline-auto';
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
  // Solo interceptar peticiones GET
  if (event.request.method !== 'GET') return;

  // 1. Para consultas de clima (Open-Meteo): red primero, respaldo vacío si no hay señal
  if (event.request.url.includes('open-meteo.com')) {
    event.respondWith(
      fetch(event.request).catch(
        () => new Response('{}', { headers: { 'Content-Type': 'application/json' } })
      )
    );
    return;
  }

  // 2. Para archivos de la app e imágenes: RED PRIMERO (actualiza caché solo) y CACHÉ SI NO HAY SEÑAL
  event.respondWith(
    fetch(event.request)
      .then((networkResp) => {
        if (networkResp && networkResp.status === 200) {
          const copia = networkResp.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copia));
        }
        return networkResp;
      })
      .catch(() => caches.match(event.request))
  );
});
