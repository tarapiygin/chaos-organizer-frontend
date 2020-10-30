const version = 'v2';
const cacheName = `app-${version}`;
const files = [
  '/chaos-organizer-frontend/',
  '/chaos-organizer-frontend/favicon.ico',
  '/chaos-organizer-frontend/main.css',
  '/chaos-organizer-frontend/main.js',
];

async function putFilesToCache(data) {
  const cache = await caches.open(cacheName);
  if (cache) await cache.addAll(data);
}

async function removeOldCache(retain) {
  const keys = await caches.keys();
  return Promise.all(
    keys.filter((key) => !retain.includes(key))
      .map((key) => caches.delete(key)),
  );
}

self.addEventListener('install', (evt) => {
  evt.waitUntil((async () => {
    await putFilesToCache(files);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (evt) => {
  evt.waitUntil((async () => {
    await removeOldCache([cacheName]);
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (evt) => {
  const requestUrl = new URL(evt.request.url);
  if (requestUrl.pathname.startsWith('/api') || evt.request.method !== 'GET' || requestUrl.href.startsWith('https://api-maps.yandex.ru')) {
    return;
  }

  evt.respondWith((async () => {
    const cache = await caches.open(cacheName);
    const client = await clients.get(evt.clientId);
    try {
      const response = await fetch(evt.request);
      if (response.ok) {
        evt.waitUntil(cache.put(evt.request, response.clone()));
        if (client) client.postMessage({ status: 'ok' });
      }
      return response;
    } catch (e) {
      const cachedResponse = await cache.match(evt.request);
      if (client) client.postMessage({ status: 'error', error: e.message });
      if (cachedResponse) return cachedResponse;
      throw new Error(e.message);
    }
  })());
});

self.addEventListener('fetch', (evt) => {
  const requestUrl = new URL(evt.request.url);
  if (requestUrl.pathname.startsWith('/api/sse') || evt.request.method !== 'GET' || requestUrl.href.startsWith('https://api-maps.yandex.ru')) {
    return;
  }
  if (!requestUrl.pathname.startsWith('/api')) {
    return;
  }

  evt.respondWith((async () => {
    const cache = await caches.open(cacheName);
    const client = await clients.get(evt.clientId);
    try {
      const response = await fetch(evt.request);
      if (response.ok) {
        evt.waitUntil(cache.put(evt.request, response.clone()));
        if (client) client.postMessage({ status: 'ok' });
        return response;
      }
      throw new Error();
    } catch (e) {
      const cachedResponse = await cache.match(evt.request);
      if (client) client.postMessage({ status: 'error', error: e.message });
      if (cachedResponse) return cachedResponse;
      throw new Error(e.message);
    }
  })());
});
