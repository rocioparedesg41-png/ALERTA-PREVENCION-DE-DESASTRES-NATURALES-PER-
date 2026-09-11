/**
 * ============================================================================
 * Servicio de Alarma Sonora de Emergencia (TypeScript Puro)
 * Archivo: src/servicios/alarma.ts
 * 
 * GUÍA DE IMPORTACIÓN Y USO:
 * Importa este módulo en cualquier componente o servicio que requiera emitir una alarma
 * audible persistente (por ejemplo en src/components/AlarmBanner.tsx, src/App.tsx o
 * tras recibir una notificación push desde el Service Worker):
 * 
 * import { reproducirAlarma, detenerAlarma, estaAlarmaSonando } from './servicios/alarma';
 * 
 * // Para iniciar la alarma en bucle infinito ante un sismo o desastre:
 * await reproducirAlarma();
 * 
 * // Para silenciar la alarma y reiniciar a segundo cero:
 * detenerAlarma();
 * ============================================================================
 */

export interface EstadoAlarma {
  reproduciendo: boolean;
  volumen: number;
  enBucle: boolean;
  errorAutoplay: boolean;
}

// Instancia singleton única del elemento de audio HTML
let audioInstancia: HTMLAudioElement | null = null;
let errorAutoplayDetectado: boolean = false;

/**
 * Obtiene o inicializa perezosamente la instancia del elemento HTMLAudioElement.
 * Apunta de manera predeterminada al archivo estático '/alarma.mp3' ubicado en la carpeta public.
 */
function obtenerInstanciaAudio(): HTMLAudioElement {
  if (!audioInstancia && typeof window !== 'undefined') {
    audioInstancia = new Audio('/alarma.mp3');
    audioInstancia.preload = 'auto';
    audioInstancia.loop = true; // Bucle infinito por requerimiento de emergencia
    audioInstancia.volume = 1.0; // Volumen máximo para alertas críticas

    // Escuchador de respaldo para garantizar el bucle infinito en navegadores antiguos
    audioInstancia.addEventListener('ended', () => {
      if (audioInstancia && audioInstancia.loop) {
        audioInstancia.currentTime = 0;
        audioInstancia.play().catch((err) => {
          console.warn('[alarma.ts] Error al reiniciar bucle de audio:', err);
        });
      }
    });
  }
  return audioInstancia as HTMLAudioElement;
}

/**
 * Reproduce el sonido de alarma en bucle infinito (loop = true).
 * Incorpora manejo de errores estricto para las políticas de Autoplay impuestas
 * por los navegadores modernos (capturando el rechazo de la promesa devuelta por audio.play()).
 * 
 * @returns Promesa que resuelve a `true` si el audio comenzó a reproducirse exitosamente,
 *          o `false` si el navegador bloqueó la reproducción automática hasta que medie interacción del usuario.
 */
export async function reproducirAlarma(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  const audio = obtenerInstanciaAudio();
  if (!audio) return false;

  // Garantizar bucle infinito
  audio.loop = true;

  try {
    errorAutoplayDetectado = false;
    const playPromise = audio.play();

    if (playPromise !== undefined) {
      await playPromise;
      console.log('[alarma.ts] Alarma sonora de emergencia activada en bucle infinito.');
      return true;
    }
    return true;
  } catch (error: unknown) {
    errorAutoplayDetectado = true;
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.warn(
      '[alarma.ts] Bloqueo de política de reproducción automática (Autoplay Policy). ' +
      'El navegador requiere un gesto de usuario previo para emitir sonido:',
      errorMsg
    );
    return false;
  }
}

/**
 * Detiene la reproducción de la alarma inmediatamente y reinicia el cabezal de tiempo a cero.
 */
export function detenerAlarma(): void {
  if (typeof window === 'undefined' || !audioInstancia) return;

  try {
    audioInstancia.pause();
    audioInstancia.currentTime = 0;
    console.log('[alarma.ts] Alarma sonora silenciada y reiniciada a segundo 0.');
  } catch (err) {
    console.error('[alarma.ts] Error al detener la alarma:', err);
  }
}

/**
 * Consulta el estado actual de la alarma.
 */
export function obtenerEstadoAlarma(): EstadoAlarma {
  const audio = audioInstancia;
  return {
    reproduciendo: Boolean(audio && !audio.paused && audio.currentTime > 0),
    volumen: audio ? audio.volume : 1.0,
    enBucle: audio ? audio.loop : true,
    errorAutoplay: errorAutoplayDetectado,
  };
}

/**
 * Verifica de forma booleana simple si la alarma está actualmente sonando.
 */
export function estaAlarmaSonando(): boolean {
  return Boolean(audioInstancia && !audioInstancia.paused && !audioInstancia.ended);
}

/**
 * Permite ajustar el volumen de la alarma (de 0.0 a 1.0).
 */
export function configurarVolumenAlarma(nivel: number): void {
  const audio = obtenerInstanciaAudio();
  if (audio) {
    audio.volume = Math.max(0, Math.min(1, nivel));
  }
}
