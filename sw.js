const CACHE_NAME = 'misa-anti-cache-v1';
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
  // Bỏ qua các POST request (doPost)
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Nếu lấy được từ mạng, lưu vào cache (tùy chọn)
        return response;
      })
      .catch(() => {
        // Mất mạng, trả về từ Cache
        return caches.match(event.request).then(response => {
           if (response) return response;
           // Nếu không có trong cache, trả về index.html (để làm SPA offline fallback)
           if (event.request.url.includes('.html') || event.request.url === self.registration.scope) {
             return caches.match('./index.html');
           }
        });
      })
  );
});
