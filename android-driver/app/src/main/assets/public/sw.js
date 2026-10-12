// Service Worker for Wadaage Taxi PWA
const CACHE_NAME = 'wadaage-taxi-v2';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// Background Push Notification Event
self.addEventListener('push', (event) => {
  let data = {
    title: '🚨 DALAB CUSUB! NEW RIDE ORDER',
    body: 'Dalab rakaab cusub ayaa soo gaadhay taleefankaaga.',
    icon: '/darwelllogo.png',
    badge: '/darwelllogo.png',
    vibrate: [800, 200, 800, 200, 1000, 200, 1000],
    data: { url: '/?app=driver' }
  };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (_e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/darwelllogo.png',
    badge: data.badge || '/darwelllogo.png',
    image: data.image || '/darwelllogo.png',
    vibrate: data.vibrate || [800, 200, 800, 200, 1000, 200, 1000],
    tag: 'wadaage-order-' + Date.now(),
    renotify: true,
    requireInteraction: true,
    data: data.data || { url: '/?app=driver' },
    actions: [
      { action: 'open_order', title: '🚖 Fur Dalabka (Open)' },
      { action: 'dismiss', title: 'Xidh (Dismiss)' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification Click Handler - Focus or Open App Tab
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const targetUrl = (event.notification.data && event.notification.data.url) ? event.notification.data.url : '/?app=driver';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          try {
            client.postMessage({ type: 'WAKE_AND_OPEN_ORDER', url: targetUrl });
          } catch (_e) {}
          if ('navigate' in client && targetUrl) {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
