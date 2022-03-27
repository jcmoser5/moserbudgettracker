const CACHE_NAME = 'Budget-Cache';
const DATA_CACHE_NAME = 'Budget-Data-Cache';
const FILES_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  '/js/index.js',
  '/js/idb.js',
  '/css/styles.css',
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-128x128.png',
  '/icons/icon-144x144.png',
  '/icons/icon-152x152.png',
  '/icons/icon-192x192.png',
  '/icons/icon-384x384.png',
  '/icons/icon-512x512.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Files pre-cached successfully');
      return cache.addAll(FILES_TO_CACHE);
    })
  );

  e.waitUntil(
    caches.open(DATA_CACHE_NAME).then(cache => {
      return fetch('/api/transaction').then(response => {
        if (response.status === 200) {
          cache.put('api/transaction', response.clone());
        }
        return response;
      });
    })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(keyList => {
      return Promise.all(
        keyList.map(key => {
          if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
            console.log('Removing old cache data', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', function (e) {
  if (e.request.url.includes('/api/') && e.request.method === 'GET') {
    e.respondWith(
      caches.open(DATA_CACHE_NAME).then(cache => {
        return fetch(e.request).then(response => {
          if (response.status === 200) {
            cache.put(e.request.url, response.clone());
          }
          return response;
        })
          .catch(err => {
            return cache.match(e.request);
          });
        })
        .catch(err => console.log(err))
    );
    return;
  }

  e.respondWith(
    fetch(e.request).catch(function () {
      return caches.match(e.request).then(function (response) {
        if (response) {
          return response;
        } else if (e.request.headers.get('accept').includes('text/html')) {
          return caches.match('/');
        }
      });
    })
  );
}); 