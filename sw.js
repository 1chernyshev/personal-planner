/* Atlas Service Worker — offline + instant load */
const CACHE = 'atlas-v6';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png',
  './favicon-32.png',
  './favicon-64.png',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache =>
      /* Cache local assets — if external (Supabase SDK) fails, don't break install */
      Promise.all(ASSETS.map(url => cache.add(url).catch(() => null)))
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  /* Network-first for Supabase API (always fresh data) */
  if (url.hostname.includes('supabase.co')) {
    event.respondWith(fetch(req).catch(() => new Response(JSON.stringify({error: 'offline'}), {headers: {'Content-Type': 'application/json'}})));
    return;
  }

  /* Stale-while-revalidate for everything else (instant load, refresh in background) */
  event.respondWith(
    caches.match(req).then(cached => {
      const fetched = fetch(req).then(res => {
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy));
        }
        return res;
      }).catch(() => cached);
      return cached || fetched;
    })
  );
});
