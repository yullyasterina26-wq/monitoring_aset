const CACHE_PREFIX = 'monitoring-aset-';
const SHELL_CACHE = `${CACHE_PREFIX}shell-v1`;
const ASSET_CACHE = `${CACHE_PREFIX}assets-v1`;
const PUBLIC_DATA_CACHE = `${CACHE_PREFIX}public-data-v1`;
const SHELL_URLS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/offline.html',
  '/icons/pwa-192.svg',
  '/icons/pwa-512.svg',
];

async function limitCacheEntries(cache, maximum) {
  const keys = await cache.keys();
  while (keys.length > maximum) {
    await cache.delete(keys.shift());
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key.startsWith(CACHE_PREFIX) && ![SHELL_CACHE, ASSET_CACHE, PUBLIC_DATA_CACHE].includes(key))
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

function isPublicCatalogPath(pathname) {
  return pathname === '/api/categories' ||
    pathname === '/api/categories/' ||
    pathname === '/api/assets' ||
    pathname === '/api/assets/' ||
    /^\/api\/assets\/(?:by-code\/[^/]+|\d+)\/?$/.test(pathname);
}

async function networkFirst(request, cacheName, fallbackUrl) {
  const cache = await caches.open(cacheName);
  let response;
  try {
    response = await fetch(request);
  } catch {
    const cachedResponse = await cache.match(request) || (fallbackUrl && await cache.match(fallbackUrl));
    if (cachedResponse) return cachedResponse;
    if (cacheName === PUBLIC_DATA_CACHE) {
      return Response.json(
        { message: 'Data ini belum tersedia offline. Hubungkan perangkat ke internet lalu coba lagi.' },
        { status: 503 }
      );
    }
    return Response.error();
  }

  if (!response.ok && response.status >= 500) {
    const cachedResponse = await cache.match(request);
    if (cachedResponse) return cachedResponse;
  }

  const cacheControl = response.headers.get('Cache-Control') || '';
  if (
    response.ok &&
    response.type === 'basic' &&
    !/\b(?:private|no-store)\b/i.test(cacheControl)
  ) {
    try {
      await cache.put(request, response.clone());
      await limitCacheEntries(cache, cacheName === PUBLIC_DATA_CACHE ? 40 : 80);
    } catch (error) {
      console.warn('Gagal menyimpan cache PWA:', error);
    }
  }
  return response;
}

async function cacheFirst(request) {
  const cache = await caches.open(ASSET_CACHE);
  const cachedResponse = await cache.match(request);
  if (cachedResponse) return cachedResponse;

  const response = await fetch(request);
  if (response.ok && response.type === 'basic') {
    await cache.put(request, response.clone());
    await limitCacheEntries(cache, 80);
  }
  return response;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  if (isPublicCatalogPath(url.pathname)) {
    event.respondWith(networkFirst(request, PUBLIC_DATA_CACHE));
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, SHELL_CACHE, '/'));
    return;
  }

  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(cacheFirst(request));
  }
});
