/**
 * ============================================================================
 * Servicio de Monitoreo Sísmico Continuo y Detección en Tiempo Real (SASPE / IGP)
 * Archivo: src/servicios/monitoreoSismico.ts
 * 
 * Monitorea continuamente los sismos reportados por el Instituto Geofísico del Perú (IGP / CENSIS)
 * y evalúa si impactan la ubicación seleccionada o georreferenciada por el usuario (GPS).
 * 
 * FUNCIONAMIENTO EN SEGUNDO PLANO Y SIN CONEXIÓN (OFFLINE):
 * 1. EN SEGUNDO PLANO (Aunque el usuario no esté en la app / pestaña minimizada / pantalla bloqueada):
 *    - Notificaciones de sistema con sonido de sirena y vibración prolongada (Notification API + SW).
 *    - MediaSession y WakeLock activo para mantener la sirena sonando.
 *    - Service Worker Background Sync & Periodic Sync para comprobación continua.
 * 2. SIN CONEXIÓN A INTERNET (OFFLINE):
 *    - Sensor acelerómetro inercial telúrico local (DeviceMotionEvent): detecta ondas sísmicas
 *      físicas en el dispositivo si tiembla la tierra en la ubicación seleccionada o georreferenciada.
 *    - Caché local de los últimos sismos y radios geodinámicos en localStorage.
 *    - Sirena Web Audio API sintetizada y archivo local /alarma.mp3 precacheados.
 * ============================================================================
 */

import { alarmManager } from '../utils/audioAlarm';

export interface EventoSismicoDetectado {
  id: string;
  codigo: string;
  magnitud: number;
  profundidad: number;
  referencia: string;
  latitud: number;
  longitud: number;
  distanciaKm: number;
  intensidad: string;
  fechaHoraLocal: string;
  timestampMs: number;
  esSimulacro?: boolean;
  esSensorOffline?: boolean;
  ubicacionAfectada: {
    departamento: string;
    provincia: string;
    distrito: string;
  };
  mensajeAlerta: string;
}

export interface UbicacionMonitoreo {
  departamento: string;
  provincia: string;
  distrito: string;
  lat: number;
  lng: number;
}

const CLAVE_SISMOS_SILENCIADOS = 'sismos_silenciados_alerta_peru';
const CLAVE_CACHE_SISMOS = 'cache_sismos_igp_local';
const CLAVE_UBICACION_ACTIVA = 'alerta_peru_ubicacion_activa';

// Estado del detector inercial acelerométrico local (offline)
let sensorInercialIniciado = false;
let ultimaUbicacionGuardada: UbicacionMonitoreo | null = null;
let contadorMuestrasSismicas = 0;
let ultimoDisparoOfflineMs = 0;

/**
 * Calcula la distancia ortodrómica en kilómetros entre dos coordenadas GPS (Haversine)
 */
export function calcularDistanciaEpicentroKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radio medio de la Tierra en km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Normaliza texto para comparaciones sin tildes ni mayúsculas
 */
function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Obtiene la lista de IDs de sismos silenciados o reconocidos por el usuario
 */
function obtenerSismosSilenciados(): string[] {
  try {
    const raw = localStorage.getItem(CLAVE_SISMOS_SILENCIADOS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Marca un sismo como atendido/silenciado por el usuario
 */
export function marcarSismoComoAtendido(id: string): void {
  try {
    const silenciados = obtenerSismosSilenciados();
    if (!silenciados.includes(id)) {
      silenciados.push(id);
      localStorage.setItem(CLAVE_SISMOS_SILENCIADOS, JSON.stringify(silenciados.slice(-50)));
    }
  } catch {
    // Ignorar errores de localStorage
  }
}

/**
 * Guarda la ubicación activa en localStorage y la envía al Service Worker
 * para que pueda seguir monitoreando en segundo plano cuando el usuario sale de la app.
 */
export function registrarUbicacionEnSegundoPlano(ubicacion: UbicacionMonitoreo): void {
  ultimaUbicacionGuardada = ubicacion;
  try {
    localStorage.setItem(CLAVE_UBICACION_ACTIVA, JSON.stringify(ubicacion));
  } catch {}

  // Enviar coordenadas al Service Worker
  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator && navigator.serviceWorker.controller) {
    try {
      navigator.serviceWorker.controller.postMessage({
        type: 'ACTUALIZAR_UBICACION_MONITOREO',
        payload: ubicacion,
      });
    } catch {}
  }

  // Activar detector físico inercial local (funciona con o sin internet)
  iniciarDetectorInercialOffline(ubicacion);
}

/**
 * Detector Sísmico Inercial Nativo del Dispositivo (Modo Offline / Sin Internet):
 * Utiliza el acelerómetro (DeviceMotionEvent) del teléfono o dispositivo.
 * Si ocurre un movimiento sísmico real en el suelo o superficie mientras no hay internet,
 * detecta las aceleraciones dinámicas anómalas sostenidas y dispara la alarma sonora de inmediato.
 */
export function iniciarDetectorInercialOffline(ubicacion: UbicacionMonitoreo): void {
  if (sensorInercialIniciado || typeof window === 'undefined') return;
  if (!('DeviceMotionEvent' in window)) return;

  try {
    sensorInercialIniciado = true;

    window.addEventListener('devicemotion', (event) => {
      // Leer aceleración eliminando gravedad si está disponible
      const acc = event.acceleration;
      const accGrav = event.accelerationIncludingGravity;

      let magAceleracion = 0;
      if (acc && acc.x !== null && acc.y !== null && acc.z !== null) {
        magAceleracion = Math.sqrt(acc.x * acc.x + acc.y * acc.y + acc.z * acc.z);
      } else if (accGrav && accGrav.x !== null && accGrav.y !== null && accGrav.z !== null) {
        // Estimar aceleración dinámica restando la gravedad (aprox 9.8 m/s²)
        const total = Math.sqrt(accGrav.x * accGrav.x + accGrav.y * accGrav.y + accGrav.z * accGrav.z);
        magAceleracion = Math.abs(total - 9.806);
      }

      // Umbral sísmico: aceleración telúrica mayor a 2.6 m/s² (intensidad Mercalli IV-V)
      if (magAceleracion > 2.6) {
        contadorMuestrasSismicas++;
        // Requiere 3 muestras anómalas consecutivas para evitar falsos positivos por un simple toque
        if (contadorMuestrasSismicas >= 3) {
          const now = Date.now();
          if (now - ultimoDisparoOfflineMs > 60000) { // Cooldown de 60s
            ultimoDisparoOfflineMs = now;
            contadorMuestrasSismicas = 0;

            const ubi = ultimaUbicacionGuardada || ubicacion;
            const eventoOffline: EventoSismicoDetectado = {
              id: `sensor-inercial-offline-${now}`,
              codigo: `SENS-OFFLINE`,
              magnitud: 5.5,
              profundidad: 15,
              referencia: `Detección local in situ en ${ubi.distrito}, ${ubi.provincia}`,
              latitud: ubi.lat,
              longitud: ubi.lng,
              distanciaKm: 0,
              intensidad: 'IV - V (Percibido localmente)',
              fechaHoraLocal: new Date().toLocaleTimeString(),
              timestampMs: now,
              esSensorOffline: true,
              ubicacionAfectada: {
                departamento: ubi.departamento,
                provincia: ubi.provincia,
                distrito: ubi.distrito,
              },
              mensajeAlerta: `¡ALERTA SÍSMICA IN SITU DETECTADA (MODO OFFLINE)! Se detectaron ondas sísmicas en ${ubi.distrito} (${ubi.provincia}). Activa zonas seguras inmediatamente.`,
            };

            console.warn('[monitoreoSismico] ¡Ondas sísmicas detectadas por acelerómetro local!', eventoOffline);
            dispararAlarmaSismica(eventoOffline);
          }
        }
      } else {
        if (contadorMuestrasSismicas > 0) {
          contadorMuestrasSismicas = Math.max(0, contadorMuestrasSismicas - 1);
        }
      }
    });
  } catch (err) {
    console.warn('[monitoreoSismico] Sensor inercial no disponible:', err);
  }
}

/**
 * Genera un evento sísmico de prueba/simulacro para la ubicación activa del usuario
 */
export function simularSismoEnUbicacion(
  ubicacion: UbicacionMonitoreo,
  magnitud: number = 6.3
): EventoSismicoDetectado {
  const now = Date.now();
  return {
    id: `prueba-sismo-${now}`,
    codigo: `PRUEBA-SASPE`,
    magnitud,
    profundidad: 20,
    referencia: `Simulación de prueba sísmica en ${ubicacion.distrito}, ${ubicacion.provincia}`,
    latitud: ubicacion.lat,
    longitud: ubicacion.lng,
    distanciaKm: 18,
    intensidad: 'V Fuerte (Simulacro)',
    fechaHoraLocal: new Date().toLocaleTimeString(),
    timestampMs: now,
    esSimulacro: true,
    ubicacionAfectada: {
      departamento: ubicacion.departamento,
      provincia: ubicacion.provincia,
      distrito: ubicacion.distrito,
    },
    mensajeAlerta: `¡PRUEBA DE ALARMA SÍSMICA! Sismo simulado de M ${magnitud.toFixed(1)} en ${ubicacion.distrito} (${ubicacion.provincia}). Verificación de sonido, vibración y tiempo de evacuación.`,
  };
}

/**
 * Consulta el endpoint de sismos del IGP y evalúa si hay un sismo
 * que afecte a la ubicación seleccionada o georreferenciada.
 * Si no hay internet, revisa la base de datos en caché local.
 */
export async function verificarSismoEnUbicacion(
  ubicacion: UbicacionMonitoreo
): Promise<EventoSismicoDetectado | null> {
  // Asegurar registro de ubicación en segundo plano y sensor inercial
  registrarUbicacionEnSegundoPlano(ubicacion);

  try {
    let listaSismos: any[] = [];
    let obtenidoDeRed = false;

    // 1. Intentar obtener sismos más recientes de la red (si hay internet)
    if (typeof navigator === 'undefined' || navigator.onLine) {
      try {
        let res = await fetch('/api/sismos-igp', {
          headers: { Accept: 'application/json' },
          signal: AbortSignal.timeout(5000),
        }).catch(() => null);

        if (!res || !res.ok) {
          res = await fetch('https://ultimosismo.igp.gob.pe/api/ultimo-sismo/ajaxb/2026', {
            headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' },
            signal: AbortSignal.timeout(5000),
          }).catch(() => null);
        }

        if (res && res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            listaSismos = data;
            obtenidoDeRed = true;
            try {
              localStorage.setItem(CLAVE_CACHE_SISMOS, JSON.stringify(data));
            } catch {}
          }
        }
      } catch (netErr) {
        // Falló la red
      }
    }

    // 2. Si no hay internet o falló la red, usar la caché local persistente (Offline)
    if (!obtenidoDeRed) {
      try {
        const rawCache = localStorage.getItem(CLAVE_CACHE_SISMOS);
        if (rawCache) {
          listaSismos = JSON.parse(rawCache);
          console.log('[monitoreoSismico] Verificando sismos en modo sin conexión (caché local)');
        }
      } catch {}
    }

    if (!Array.isArray(listaSismos) || listaSismos.length === 0) return null;

    const silenciados = obtenerSismosSilenciados();
    const nowMs = Date.now();
    const ventanaTiempoMs = 24 * 60 * 60 * 1000; // Últimas 24 horas

    const depNorm = normalizar(ubicacion.departamento);
    const provNorm = normalizar(ubicacion.provincia);
    const distNorm = normalizar(ubicacion.distrito);

    for (const sismo of listaSismos) {
      if (!sismo.codigo || !sismo.latitud || !sismo.longitud) continue;

      const idEvento = `igp-${String(sismo.codigo).trim()}`;
      if (silenciados.includes(idEvento)) {
        continue; // Ya fue atendido o silenciado por el usuario
      }

      // Parsear fecha y hora
      const fechaStr = String(sismo.fecha_local || '').slice(0, 10);
      const horaStr = String(sismo.hora_local || '').slice(0, 8);
      const isoLocal = `${fechaStr}T${horaStr}-05:00`;
      let sismoMs = new Date(isoLocal).getTime();
      if (isNaN(sismoMs) && sismo.createdAt) {
        sismoMs = new Date(sismo.createdAt).getTime();
      }

      // Si es muy antiguo (más de 24 horas), descartar
      if (!isNaN(sismoMs) && nowMs - sismoMs > ventanaTiempoMs) {
        continue;
      }

      const latS = parseFloat(sismo.latitud);
      const lngS = parseFloat(sismo.longitud);
      if (isNaN(latS) || isNaN(lngS)) continue;

      const mag = parseFloat(sismo.magnitud || '0');
      const distanciaKm = calcularDistanciaEpicentroKm(ubicacion.lat, ubicacion.lng, latS, lngS);

      // Determinar radio de impacto según magnitud sísmica oficial
      let radioImpactoKm = 60;
      if (mag >= 6.5) radioImpactoKm = 380;
      else if (mag >= 5.5) radioImpactoKm = 240;
      else if (mag >= 4.5) radioImpactoKm = 150;
      else if (mag >= 4.0) radioImpactoKm = 90;

      const refNorm = normalizar(sismo.referencia || '');
      const coincideGeografia =
        refNorm.includes(distNorm) ||
        refNorm.includes(provNorm) ||
        refNorm.includes(depNorm);

      // Si está dentro del radio de percepción o coincide la jurisdicción
      if (distanciaKm <= radioImpactoKm || (coincideGeografia && distanciaKm <= 300)) {
        return {
          id: idEvento,
          codigo: String(sismo.codigo).trim(),
          magnitud: mag,
          profundidad: parseFloat(sismo.profundidad || '15'),
          referencia: sismo.referencia || 'Territorio Peruano',
          latitud: latS,
          longitud: lngS,
          distanciaKm,
          intensidad: sismo.intensidad || (mag >= 5 ? 'V' : 'III - IV'),
          fechaHoraLocal: `${fechaStr} ${horaStr}`,
          timestampMs: isNaN(sismoMs) ? nowMs : sismoMs,
          ubicacionAfectada: {
            departamento: ubicacion.departamento,
            provincia: ubicacion.provincia,
            distrito: ubicacion.distrito,
          },
          mensajeAlerta: `Sismo de M ${mag.toFixed(1)} a ${distanciaKm} km de tu ubicación (${ubicacion.distrito}, ${ubicacion.provincia}). Epicentro: ${sismo.referencia}. Mantén la calma y dirígete a zona segura.`,
        };
      }
    }

    return null;
  } catch (error) {
    console.warn('[monitoreoSismico] Error al verificar sismos en la ubicación:', error);
    return null;
  }
}

/**
 * Disparador unificado de alarma sísmica:
 * Inicia el audio de la sirena en bucle, vibración y emite la notificación del sistema
 * (para que alerte incluso si el usuario no tiene abierta la aplicación).
 */
export async function dispararAlarmaSismica(sismo: EventoSismicoDetectado): Promise<void> {
  console.log('[monitoreoSismico] ¡Activando Alarma Sísmica!', sismo);

  // 1. Activar sirena sonora con Web Audio API y audio loop
  await alarmManager.startAlarm();

  // 2. Notificación en segundo plano a nivel de sistema operativo
  if (typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'default') {
      try {
        await Notification.requestPermission();
      } catch {}
    }

    if (Notification.permission === 'granted') {
      const titulo = `🚨 ¡ALARMA SÍSMICA OFICIAL EN ${sismo.ubicacionAfectada.distrito.toUpperCase()}!`;
      const opciones: any = {
        body: `Sismo M ${sismo.magnitud.toFixed(1)} a ${sismo.distanciaKm} km de tu ubicación. ¡Evacúa a zona segura de inmediato!`,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-192x192.png',
        tag: 'alarma-sismica-activa',
        renotify: true,
        requireInteraction: true, // No desaparece hasta que el usuario la atienda
      };

      try {
        if ('serviceWorker' in navigator && navigator.serviceWorker.ready) {
          const reg = await navigator.serviceWorker.ready;
          reg.showNotification(titulo, opciones);
        } else {
          new Notification(titulo, opciones);
        }
      } catch (notifErr) {
        console.warn('[monitoreoSismico] No se pudo lanzar la notificación de sistema:', notifErr);
      }
    }
  }

  // 3. Emitir evento en window para sincronizar interfaces en tiempo real
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('alarma-sismica-disparada', { detail: sismo })
    );
  }
}
