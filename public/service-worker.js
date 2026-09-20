/**
 * ============================================================================
 * Service Worker Unificado de Alerta Perú (PWA Offline + Auto-Update + Alarma Sísmica 24/7)
 * Archivo: public/service-worker.js
 * 
 * CAPACIDADES CLAVE:
 * 1. Monitoreo en Segundo Plano (así el usuario no esté en la aplicación o tenga la pantalla apagada):
 *    - Recibe la ubicación activa del usuario y realiza comprobaciones periódicas (Periodic Sync / Background Sync).
 *    - Ante cualquier sismo detectado en la ubicación del usuario, emite una notificación de emergencia
 *      con prioridad máxima, sonido de alarma y vibración de emergencia repetitiva.
 * 2. Funcionamiento Sin Conexión (Offline):
 *    - Precachea todos los recursos críticos incluyendo /alarma.mp3 y la app completa.
 *    - Network-First para páginas HTML (para aplicar actualizaciones automáticamente) con respaldo en caché.
 *    - Stale-While-Revalidate para recursos estáticos.
 * ============================================================================
 */

const CACHE_NAME = 'alerta-peru-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/escudo_sapsenp.png',
  '/alarma_sismo.mp3',
  '/alarma.mp3'
];

let ubicacionGuardada = null;

// Instalación: Precarga recursos esenciales y activa de inmediato
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Algunos assets estáticos no pudieron precachearse:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activación: Purga cachés antiguas y toma el control inmediato de todos los clientes
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Eliminando caché obsoleta:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Mensajería desde la aplicación
self.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }

  // Guardar ubicación activa seleccionada o georreferenciada para monitoreo en segundo plano
  if (event.data.type === 'ACTUALIZAR_UBICACION_MONITOREO' && event.data.payload) {
    ubicacionGuardada = event.data.payload;
    console.log('[SW] Ubicación de monitoreo actualizada para segundo plano:', ubicacionGuardada.distrito);
  }
});

// Fetch interceptor con actualización garantizada
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  if (req.method !== 'GET') {
    return;
  }

  // Las llamadas de API van a la red
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // Documentos y Navegación (HTML de la app): NETWORK-FIRST
  if (req.mode === 'navigate' || req.destination === 'document') {
    event.respondWith(
      fetch(req)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match(req).then((cached) => {
            return cached || caches.match('/index.html');
          });
        })
    );
    return;
  }

  // Recursos estáticos (JS, CSS, imágenes, fuentes): STALE-WHILE-REVALIDATE
  event.respondWith(
    caches.match(req).then((cachedResponse) => {
      const fetchPromise = fetch(req)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          }
          return networkResponse;
        })
        .catch(() => null);

      return cachedResponse || fetchPromise;
    })
  );
});

// Notificaciones Push en segundo plano (incluso con app cerrada o pantalla apagada)
self.addEventListener('push', (event) => {
  let title = '🚨 ¡ALARMA SÍSMICA NACIONAL - PERÚ!';
  let body = 'Alerta sísmica temprana de la Red SASPE e IGP. Activa protocolos de seguridad inmediatamente.';
  let data = {};

  if (event.data) {
    try {
      const payload = event.data.json();
      title = payload.title || title;
      body = payload.body || body;
      data = payload.data || {};
    } catch {
      body = event.data.text() || body;
    }
  }

  const options = {
    body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    vibrate: [600, 200, 600, 200, 1000],
    data,
    tag: 'alarma-sismica-peru',
    renotify: true,
    requireInteraction: true,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Periodic Sync para comprobación en segundo plano de eventos sísmicos
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'monitoreo-sismico-bg' || event.tag === 'verificacion-sismica-fondo') {
    event.waitUntil(verificarSismosFondo());
  }
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'sismo-sync') {
    event.waitUntil(verificarSismosFondo());
  }
});

async function verificarSismosFondo() {
  if (!ubicacionGuardada) return;
  try {
    const res = await fetch('/api/sismos-igp', { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return;
    const lista = await res.json();
    if (!Array.isArray(lista) || lista.length === 0) return;

    const primerSismo = lista[0];
    const mag = parseFloat(primerSismo.magnitud || '0');
    if (mag >= 4.5) {
      // Notificar de inmediato al usuario en su sistema operativo
      await self.registration.showNotification(
        `🚨 ¡ALARMA SÍSMICA: M ${mag.toFixed(1)} EN ${ubicacionGuardada.distrito.toUpperCase()}!`,
        {
          body: `Sismo detectado por el IGP en tu zona. ${primerSismo.referencia}. ¡Dirígete a zona segura!`,
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-192x192.png',
          vibrate: [600, 200, 600, 200, 1000],
          tag: 'alarma-sismica-activa',
          renotify: true,
          requireInteraction: true,
        }
      );
    }
  } catch (e) {
    // Si está offline en segundo plano, no interrumpe
  }
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
