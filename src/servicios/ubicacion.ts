/**
 * ============================================================================
 * Servicio de Geolocalización y Coordenadas GPS (TypeScript Puro)
 * Archivo: src/servicios/ubicacion.ts
 * 
 * GUÍA DE IMPORTACIÓN Y USO:
 * Importa este módulo en los componentes de selección de ubicación o servicios de fondo
 * (por ejemplo en src/components/LocationSelector.tsx o al recibir alertas remotas):
 * 
 * import { obtenerUbicacionActual, leerUltimaUbicacionAlmacenada } from './servicios/ubicacion';
 * 
 * // Para consultar el GPS con alta precisión y guardar en localStorage ('ultima_ubicacion'):
 * try {
 *   const coords = await obtenerUbicacionActual();
 *   console.log('GPS actual:', coords.lat, coords.lng);
 * } catch (error) {
 *   console.warn('No se pudo obtener el GPS:', error.mensaje);
 * }
 * ============================================================================
 */

export interface CoordenadasGPS {
  lat: number;
  lng: number;
  precisionMetros?: number;
  altitud?: number | null;
  timestamp: number;
}

export interface RegistroUbicacionLocal {
  lat: number;
  lng: number;
  latitud: number;
  longitud: number;
  precisionMetros?: number;
  timestamp: number;
  fechaISO: string;
}

export interface ErrorGeolocalizacion {
  codigo: number;
  mensaje: string;
  detalleOriginal?: string;
}

export const CLAVE_LOCALSTORAGE_UBICACION = 'ultima_ubicacion';

/**
 * Consulta de forma óptima el GPS del dispositivo utilizando `navigator.geolocation.getCurrentPosition`
 * con alta precisión activada (enableHighAccuracy: true).
 * 
 * Almacena de inmediato las coordenadas actuales (latitud y longitud) en el `localStorage`
 * bajo la clave obligatoria `'ultima_ubicacion'`.
 * 
 * @param timeoutMs Tiempo máximo de espera para la respuesta del sensor GPS (por defecto 12000 ms).
 * @returns Promesa que resuelve a un objeto tipado `CoordenadasGPS` con `lat`, `lng`, precisión y timestamp.
 */
export function obtenerUbicacionActual(timeoutMs: number = 12000): Promise<CoordenadasGPS> {
  return new Promise((resolve, reject) => {
    // 1. Validar compatibilidad de la API en el entorno del navegador
    if (typeof window === 'undefined' || !navigator.geolocation) {
      const error: ErrorGeolocalizacion = {
        codigo: 0,
        mensaje: 'La API de geolocalización no es soportada por este navegador o dispositivo.',
      };
      return reject(error);
    }

    // 2. Configuración óptima del sensor GPS
    const opcionesGPS: PositionOptions = {
      enableHighAccuracy: true, // Activación explícita de GPS de alta precisión
      timeout: timeoutMs,      // Tiempo de corte para evitar bloqueos
      maximumAge: 30000,       // Acepta lecturas cacheadas de máximo 30 segundos para mayor velocidad
    };

    navigator.geolocation.getCurrentPosition(
      (position: GeolocationPosition) => {
        const coords: CoordenadasGPS = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          precisionMetros: position.coords.accuracy,
          altitud: position.coords.altitude,
          timestamp: position.timestamp || Date.now(),
        };

        // 3. Almacenar de inmediato en localStorage bajo la clave 'ultima_ubicacion'
        try {
          const registroParaGuardar: RegistroUbicacionLocal = {
            lat: coords.lat,
            lng: coords.lng,
            latitud: coords.lat,
            longitud: coords.lng,
            precisionMetros: coords.precisionMetros,
            timestamp: coords.timestamp,
            fechaISO: new Date(coords.timestamp).toISOString(),
          };

          localStorage.setItem(
            CLAVE_LOCALSTORAGE_UBICACION,
            JSON.stringify(registroParaGuardar)
          );
          console.log('[ubicacion.ts] Coordenadas GPS guardadas en localStorage bajo "ultima_ubicacion":', registroParaGuardar);
        } catch (storageErr) {
          console.warn('[ubicacion.ts] No se pudo escribir en localStorage:', storageErr);
        }

        resolve(coords);
      },
      (errorPosicion: GeolocationPositionError) => {
        let mensajeExplicativo = 'Error desconocido al consultar el sensor GPS.';
        switch (errorPosicion.code) {
          case errorPosicion.PERMISSION_DENIED:
            mensajeExplicativo = 'Permiso de geolocalización denegado por el usuario o por la política del sistema.';
            break;
          case errorPosicion.POSITION_UNAVAILABLE:
            mensajeExplicativo = 'La posición GPS no está disponible actualmente (señal débil o satélites no alcanzados).';
            break;
          case errorPosicion.TIMEOUT:
            mensajeExplicativo = 'Se agotó el tiempo de espera al intentar obtener la posición GPS del dispositivo.';
            break;
        }

        const errorTipado: ErrorGeolocalizacion = {
          codigo: errorPosicion.code,
          mensaje: mensajeExplicativo,
          detalleOriginal: errorPosicion.message,
        };

        console.warn('[ubicacion.ts] Falla al consultar GPS:', errorTipado);
        reject(errorTipado);
      },
      opcionesGPS
    );
  });
}

/**
 * Lee la última ubicación registrada desde el `localStorage` bajo la clave `'ultima_ubicacion'`.
 * Permite a la app restaurar las últimas coordenadas conocidas de manera síncrona al iniciar
 * o cuando no hay conexión GPS disponible.
 * 
 * @returns RegistroUbicacionLocal o null si aún no existe registro previo.
 */
export function leerUltimaUbicacionAlmacenada(): RegistroUbicacionLocal | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = localStorage.getItem(CLAVE_LOCALSTORAGE_UBICACION);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as RegistroUbicacionLocal;
    if (typeof parsed?.lat === 'number' && typeof parsed?.lng === 'number') {
      return parsed;
    }
    return null;
  } catch (err) {
    console.warn('[ubicacion.ts] Error al leer ultima_ubicacion desde localStorage:', err);
    return null;
  }
}

/**
 * Borra el registro de última ubicación guardado en el dispositivo.
 */
export function limpiarUltimaUbicacionAlmacenada(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(CLAVE_LOCALSTORAGE_UBICACION);
  } catch (err) {
    console.warn('[ubicacion.ts] Error al limpiar ultima_ubicacion:', err);
  }
}
