const CACHE_NAME = 'misa-anti-cache-v4';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap'
];

// Install event
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        // Không return catch, lỗi 1 link cũng không sao
        return cache.addAll(urlsToCache).catch(err => console.log('Cache addAll error', err));
      })
  );
  self.skipWaiting();
});

// Activate event (xóa cache cũ)
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event (Network First, fallback to Cache)
self.addEventListener('fetch', event => {
  const url = event.request.url;

  // Bỏ qua POST request (doPost) và tất cả request đến Google domains (GAS API)
  if (event.request.method !== 'GET') return;
  if (url.includes('script.google.com') || url.includes('googleapis.com') || url.includes('google.com/macros')) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        return response;
      })
      .catch(async () => {
        // Mất mạng, trả về từ Cache
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // Nếu không có trong cache, fallback về trang chủ (index.html)
        const fallbackResponse = await caches.match('./index.html');
        if (fallbackResponse) {
          return fallbackResponse;
        }
        
        return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
      })
  );
});
