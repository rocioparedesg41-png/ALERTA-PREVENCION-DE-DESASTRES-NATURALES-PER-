/**
 * ============================================================================
 * Servicio de Alarma Sonora de Emergencia (TypeScript Puro)
 * Archivo: src/servicios/alarma.ts
 * 
 * Gestiona la reproducción del archivo de audio de emergencia oficial
 * (/alarma_sismo.mp3 o /alarma.mp3) en bucle infinito (loop = true).
 * ============================================================================
 */

export interface EstadoAlarma {
  reproduciendo: boolean;
  volumen: number;
  enBucle: boolean;
  errorAutoplay: boolean;
}

let audioInstancia: HTMLAudioElement | null = null;
let errorAutoplayDetectado: boolean = false;

/**
 * Obtiene o inicializa la instancia del elemento HTMLAudioElement.
 * Prioriza '/alarma_sismo.mp3' y '/alarma.mp3' guardados en la carpeta /public.
 */
export function obtenerInstanciaAudio(): HTMLAudioElement {
  if (!audioInstancia && typeof window !== 'undefined') {
    audioInstancia = new Audio('/alarma_sismo.mp3');
    audioInstancia.preload = 'auto';
    audioInstancia.loop = true;
    audioInstancia.volume = 1.0;

    // Fallback a /alarma.mp3 si /alarma_sismo.mp3 encontrase algún problema
    audioInstancia.addEventListener('error', () => {
      console.warn('[alarma.ts] Falló carga de /alarma_sismo.mp3, intentando /alarma.mp3');
      if (audioInstancia) {
        audioInstancia.src = '/alarma.mp3';
        audioInstancia.load();
        audioInstancia.play().catch(() => {});
      }
    });

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
 * Reproduce el archivo de audio de alarma en bucle infinito.
 */
export async function reproducirAlarma(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  const audio = obtenerInstanciaAudio();
  if (!audio) return false;

  audio.loop = true;
  audio.volume = 1.0;

  try {
    errorAutoplayDetectado = false;
    audio.currentTime = 0;
    const playPromise = audio.play();

    if (playPromise !== undefined) {
      await playPromise;
      console.log('[alarma.ts] Alarma sonora activada con éxito en bucle.');
      return true;
    }
    return true;
  } catch (error: unknown) {
    errorAutoplayDetectado = true;
    console.warn('[alarma.ts] Intento con /alarma_sismo.mp3 bloqueado, reintentando con /alarma.mp3:', error);

    try {
      audio.src = '/alarma.mp3';
      audio.load();
      await audio.play();
      errorAutoplayDetectado = false;
      return true;
    } catch (e) {
      console.warn('[alarma.ts] Audio HTML bloqueado por navegador:', e);
      return false;
    }
  }
}

/**
 * Detiene la reproducción de la alarma inmediatamente y reinicia a cero.
 */
export function detenerAlarma(): void {
  if (typeof window === 'undefined' || !audioInstancia) return;

  try {
    audioInstancia.pause();
    audioInstancia.currentTime = 0;
    console.log('[alarma.ts] Alarma sonora silenciada.');
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
