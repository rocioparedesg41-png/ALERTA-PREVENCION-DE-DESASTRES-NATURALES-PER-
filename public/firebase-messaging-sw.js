/**
 * ============================================================================
 * Service Worker de Firebase Cloud Messaging (FCM) para Notificaciones en Segundo Plano
 * Archivo: public/firebase-messaging-sw.js
 * 
 * GUÍA DE INTEGRACIÓN Y REGISTRO:
 * Para registrar este Service Worker en tu aplicación Vite/TypeScript, importa o llama
 * en tu archivo principal (ej. src/main.tsx o src/servicios/notificaciones.ts):
 * 
 * if ('serviceWorker' in navigator) {
 *   navigator.serviceWorker.register('/firebase-messaging-sw.js')
 *     .then((registration) => console.log('SW de Alerta registrado con éxito:', registration))
 *     .catch((err) => console.error('Error al registrar SW:', err));
 * }
 * ============================================================================
 */

// Importación de las librerías oficiales y estables de Firebase v10 en modo compat para Service Workers
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Configuración básica de Firebase (puedes reemplazar estos valores con las credenciales de tu consola de Firebase)
const firebaseConfig = {
  apiKey: 'AIzaSyDummyKeyForFCMWorkerInitialization123456',
  authDomain: 'alerta-desastres-peru.firebaseapp.com',
  projectId: 'alerta-desastres-peru',
  storageBucket: 'alerta-desastres-peru.appspot.com',
  messagingSenderId: '100000000000',
  appId: '1:100000000000:web:abcdef1234567890'
};

// Inicialización de la app Firebase en el ámbito del Service Worker
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const messaging = firebase.messaging();

/**
 * Escucha eventos de mensajes push en segundo plano cuando la aplicación web o móvil
 * está cerrada o en segundo plano en el dispositivo del usuario.
 */
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Mensaje push de alerta recibido en segundo plano:', payload);

  // 1. Extraer carga útil (payload.data)
  const data = payload.data || {};

  // 2. Extracción estricta de las coordenadas y radio de peligro del desastre
  const latitud = data.latitud || data.lat || data.latitude || '-12.0464';
  const longitud = data.longitud || data.lng || data.longitude || '-77.0428';
  const radioPeligro = data.radio_peligro || data.radio || data.dangerRadius || '50 km';
  const tipoDesastre = data.tipo_desastre || data.disasterType || 'Peligro Geodinámico';
  const departamento = data.departamento || data.region || 'Perú';
  const severidad = data.severidad || data.nivel || 'EXTREMO';

  // 3. Título de la notificación nativa
  const notificationTitle = payload.notification?.title ||
    data.title ||
    `🚨 ¡ALERTA NACIONAL: ${tipoDesastre.toUpperCase()} EN ${departamento.toUpperCase()}!`;

  // 4. Opciones de notificación nativa del sistema operativo
  const notificationOptions = {
    body: payload.notification?.body ||
      data.body ||
      `Coordenadas epicentro/área: Lat ${latitud}, Lng ${longitud}. Radio de peligro: ${radioPeligro}. Inicie protocolos de evacuación inmediata.`,
    icon: '/evacuacion_sismo.jpg',
    badge: '/favicon.ico',
    // Patrón de vibración prolongada para alertar al usuario (Vibrar 500ms, pausa 200ms, vibrar 1000ms...)
    vibrate: [500, 200, 500, 200, 1000, 300, 1500],
    tag: 'alerta-desastre-peru-critico',
    renotify: true,
    requireInteraction: true, // La alerta persiste en pantalla hasta que el usuario interactúe
    data: {
      latitud: Number(latitud),
      longitud: Number(longitud),
      radio_peligro: radioPeligro,
      tipo_desastre: tipoDesastre,
      departamento: departamento,
      severidad: severidad,
      url: '/',
      timestamp: Date.now()
    },
    actions: [
      { action: 'ver_mapa', title: '📍 Ver Rutas de Evacuación' },
      { action: 'abrir_alerta', title: '🚨 Abrir Alerta Perú' }
    ]
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

/**
 * Evento 'push' nativo de respaldo en caso de recibir cargas push estándar directas
 */
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const rawData = event.data.json();
    if (rawData && rawData.data) {
      const data = rawData.data;
      const lat = data.latitud || data.lat || '-12.0464';
      const lng = data.longitud || data.lng || '-77.0428';
      const radio = data.radio_peligro || data.radio || '50 km';
      const tipo = data.tipo_desastre || 'Alerta de Emergencia';

      event.waitUntil(
        self.registration.showNotification(`⚠️ ALERTA EN VIVO: ${tipo.toUpperCase()}`, {
          body: `Ubicación crítica: Lat ${lat}, Lng ${lng} • Radio: ${radio}.`,
          icon: '/evacuacion_sismo.jpg',
          badge: '/favicon.ico',
          vibrate: [500, 250, 500, 250, 1000],
          tag: 'alerta-desastre-push-directo',
          data: { latitud: lat, longitud: lng, radio_peligro: radio }
        })
      );
    }
  } catch (err) {
    console.warn('[firebase-messaging-sw.js] Manejo secundario de push fallback:', err);
  }
});

/**
 * Al hacer clic en la notificación del sistema operativo:
 * Abre la app o enfoca la ventana existente y transmite las coordenadas recibidas
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const disasterData = event.notification.data || {};
  const targetUrl = disasterData.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Si ya hay una pestaña abierta, enfocarla y enviarle el mensaje
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.postMessage({
            type: 'ALERTA_DESASTRE_FCM',
            payload: disasterData
          });
          return client.focus();
        }
      }
      // Si la aplicación estaba cerrada, abrir una nueva ventana
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
