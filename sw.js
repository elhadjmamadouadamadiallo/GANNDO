// ===================================================================
//  GANNDO — Service Worker
//  Rôle : rendre l'app installable et utilisable hors-ligne (coquille).
//  Il NE touche jamais aux appels à l'IA (requêtes POST) ni aux
//  ressources externes : il ne met en cache que les fichiers de l'app.
// ===================================================================

const CACHE = 'ganndo-v8';
const FICHIERS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable.png'
];

// Installation : on met en cache la coquille de l'app
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(FICHIERS)).then(() => self.skipWaiting())
  );
});

// Activation : on supprime les anciens caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((cles) => Promise.all(cles.map((k) => (k === CACHE ? null : caches.delete(k)))))
      .then(() => self.clients.claim())
  );
});

// Récupération : réseau d'abord, cache en secours (pour le hors-ligne)
self.addEventListener('fetch', (e) => {
  const req = e.request;

  // On ne touche PAS aux appels à GANNDO (POST) ni aux domaines externes
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== location.origin) return;

  e.respondWith(
    fetch(req)
      .then((res) => {
        // On ne met en cache que les réponses valides (pas les 404/500)
        if (res && res.ok){
          const copie = res.clone();
          caches.open(CACHE)
            .then((c) => c.put(req, copie))
            .catch((err) => console.warn('[SW] Échec mise en cache :', err));
        }
        return res;
      })
      .catch(() => caches.match(req).then((r) => r || caches.match('./index.html')))
  );
});
