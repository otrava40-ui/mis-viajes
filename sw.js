// Service worker: la app abre al instante y funciona sin conexión.
// Si cambias algún archivo, sube este número para que los móviles se actualicen.
const VERSION = 'mis-viajes-v2';
const BASICOS = ['./', 'index.html', 'css/app.css', 'js/config.js', 'js/countries.js', 'js/store.js', 'js/map.js', 'js/intro.js', 'js/app.js', 'vendor/d3.min.js', 'manifest.webmanifest', 'icons/icon-192.png'];
const MAPA = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json';

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(BASICOS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  // Archivos de la app y el mapa: primero internet (para tener lo último), si no hay, la copia guardada
  if (url.origin === location.origin || e.request.url === MAPA) {
    e.respondWith(
      fetch(e.request).then(r => {
        if (r.ok) { const copia = r.clone(); caches.open(VERSION).then(c => c.put(e.request, copia)); }
        return r;
      }).catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('index.html')))
    );
  }
});
