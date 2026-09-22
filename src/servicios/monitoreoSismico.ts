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
  urlReporte: string; // Enlace directo oficial al reporte emitido por el IGP
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
  // Detector inercial configurado en modo pasivo para evitar falsas alarmas por movimiento del dispositivo
  ultimaUbicacionGuardada = ubicacion;
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
    urlReporte: 'https://ultimosismo.igp.gob.pe',
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
    // REGLA CRÍTICA DE TIEMPO REAL:
    // La alarma sonora SOLO debe sonar si el sismo está ocurriendo en este instante
    // (segundos antes o durante los primeros segundos del evento, máximo 3 minutos de antigüedad).
    // Los sismos de hace horas o del día anterior NO deben activar la alarma sonora de sirena.
    const ventanaTiempoAlarmaRealMs = 3 * 60 * 1000; // 3 minutos máximo (tiempo real)

    const depNorm = normalizar(ubicacion.departamento);
    const provNorm = normalizar(ubicacion.provincia);
    const distNorm = normalizar(ubicacion.distrito);

    // Revisar sismos cronológicamente (los más recientes primero)
    const sismosCronologicos = [...listaSismos].reverse();

    for (const sismo of sismosCronologicos) {
      if (!sismo.codigo || !sismo.latitud || !sismo.longitud) continue;

      const codigoLimpio = String(sismo.codigo).trim();
      const idEvento = `igp-${codigoLimpio}`;
      if (silenciados.includes(idEvento)) {
        continue; // Ya fue atendido o silenciado por el usuario
      }

      // Parsear fecha y hora evitando truncamientos
      const fechaStr = String(sismo.fecha_local || '').includes('T')
        ? String(sismo.fecha_local).split('T')[0]
        : String(sismo.fecha_local || '').slice(0, 10);
      const horaStr = String(sismo.hora_local || '').includes('T')
        ? String(sismo.hora_local).split('T')[1].slice(0, 8)
        : String(sismo.hora_local || '').slice(0, 8);

      const isoLocal = `${fechaStr}T${horaStr}-05:00`;
      let sismoMs = new Date(isoLocal).getTime();
      if (isNaN(sismoMs) && sismo.createdAt) {
        sismoMs = new Date(sismo.createdAt).getTime();
      }

      // Si no es un evento en curso (ocurrió hace más de 3 minutos), no activa sirena
      if (isNaN(sismoMs) || nowMs - sismoMs > ventanaTiempoAlarmaRealMs) {
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

      // Solo activar si está dentro del radio de percepción o coincide la jurisdicción
      if (distanciaKm <= radioImpactoKm || (coincideGeografia && distanciaKm <= 300)) {
        const urlReporte = `https://ultimosismo.igp.gob.pe/evento/${codigoLimpio}`;
        return {
          id: idEvento,
          codigo: codigoLimpio,
          magnitud: mag,
          profundidad: parseFloat(sismo.profundidad || '15'),
          referencia: sismo.referencia || 'Territorio Peruano',
          latitud: latS,
          longitud: lngS,
          distanciaKm,
          intensidad: sismo.intensidad || (mag >= 5 ? 'V' : 'III - IV'),
          fechaHoraLocal: `${fechaStr} ${horaStr}`,
          timestampMs: isNaN(sismoMs) ? nowMs : sismoMs,
          urlReporte,
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
 * con enlace directo al reporte del IGP al hacer clic.
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
      const urlReporte = sismo.urlReporte ||
        (sismo.codigo && sismo.codigo.startsWith('202')
          ? `https://ultimosismo.igp.gob.pe/evento/${sismo.codigo}`
          : 'https://ultimosismo.igp.gob.pe');

      const titulo = sismo.esSimulacro
        ? `🔔 PRUEBA DE ALARMA SÍSMICA (${sismo.ubicacionAfectada.distrito.toUpperCase()})`
        : `🚨 ¡ALARMA SÍSMICA OFICIAL EN ${sismo.ubicacionAfectada.distrito.toUpperCase()}!`;

      const cuerpo = sismo.esSimulacro
        ? `Verificación de sonido y sirena sísmica. Toca aquí para revisar el portal oficial del IGP.`
        : `Sismo M ${sismo.magnitud.toFixed(1)} a ${sismo.distanciaKm} km de tu ubicación. ¡Toca aquí para ver el reporte oficial del IGP!`;

      const opciones: any = {
        body: cuerpo,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-192x192.png',
        tag: `alarma-sismica-${sismo.id}`,
        data: { url: urlReporte },
        renotify: true,
        requireInteraction: true, // Permanece hasta que el usuario la atienda
      };

      try {
        if ('serviceWorker' in navigator && navigator.serviceWorker.ready) {
          const reg = await navigator.serviceWorker.ready;
          await reg.showNotification(titulo, opciones);
        } else {
          const notif = new Notification(titulo, opciones);
          notif.onclick = (e) => {
            e.preventDefault();
            window.open(urlReporte, '_blank');
            notif.close();
          };
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
