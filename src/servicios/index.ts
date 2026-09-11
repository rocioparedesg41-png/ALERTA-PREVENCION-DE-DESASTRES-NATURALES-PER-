/**
 * ============================================================================
 * Módulo Principal de Servicios del Sistema de Alerta Perú
 * Archivo: src/servicios/index.ts
 * 
 * Centraliza la inicialización de geolocalización, alarma sonora en bucle
 * y registro del Service Worker de Firebase Cloud Messaging (FCM) en segundo plano.
 * ============================================================================
 */

import { reproducirAlarma, detenerAlarma, estaAlarmaSonando, obtenerEstadoAlarma } from './alarma';
import { obtenerUbicacionActual, leerUltimaUbicacionAlmacenada } from './ubicacion';

export * from './alarma';
export * from './ubicacion';

/**
 * Inicializa todos los servicios de fondo de la aplicación:
 * 1. Registra el Service Worker de FCM (/firebase-messaging-sw.js).
 * 2. Comprueba si existe una 'ultima_ubicacion' guardada en localStorage.
 * 3. Escucha mensajes provenientes del Service Worker para reaccionar a alertas.
 */
export function inicializarServiciosSegundoPlano(): void {
  if (typeof window === 'undefined') return;

  // 1. Registro del Service Worker de segundo plano
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/firebase-messaging-sw.js')
        .then((registro) => {
          console.log('[Servicios] Firebase Messaging Service Worker registrado correctamente:', registro.scope);
        })
        .catch((error) => {
          console.warn('[Servicios] No se pudo registrar el Service Worker (esperado en algunos entornos de preview):', error);
        });

      // Escuchar mensajes emitidos desde el Service Worker cuando el usuario hace clic en una notificación
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'ALERTA_DESASTRE_FCM') {
          console.log('[Servicios] Mensaje recibido del Service Worker:', event.data.payload);
          // Disparar evento personalizado en window para que los componentes reaccionen
          window.dispatchEvent(
            new CustomEvent('alerta-fcm-recibida', { detail: event.data.payload })
          );
        }
      });
    });
  }

  // 2. Comprobación de última ubicación conocida
  const ultima = leerUltimaUbicacionAlmacenada();
  if (ultima) {
    console.log('[Servicios] Última ubicación recuperada de localStorage:', ultima.lat, ultima.lng);
  }
}
