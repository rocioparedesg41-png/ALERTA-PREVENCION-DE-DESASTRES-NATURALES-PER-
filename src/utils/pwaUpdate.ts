/**
 * ============================================================================
 * Gestor de Actualización Automática y Sincronización PWA (Web / iOS / Android)
 * Archivo: src/utils/pwaUpdate.ts
 * 
 * Garantiza que la aplicación instalada o descargada en Android, iPhone/iOS y Web:
 * 1. Se actualice automáticamente cada vez que se agreguen o actualicen cambios en el código.
 * 2. Revise si hay versiones nuevas al cargar, al cambiar de visibilidad (abrir la app),
 *    y de manera periódica en segundo plano.
 * 3. Proporcione una función para forzar la búsqueda de actualizaciones al instante.
 * ============================================================================
 */

export interface EstadoActualizacionPWA {
  disponible: boolean;
  actualizando: boolean;
  ultimaComprobacion: Date;
  versionActual: string;
  mensaje: string;
}

type ListenerActualizacion = (estado: EstadoActualizacionPWA) => void;

class PWAUpdateManager {
  private registration: ServiceWorkerRegistration | null = null;
  private listeners: Set<ListenerActualizacion> = new Set();
  private estado: EstadoActualizacionPWA = {
    disponible: false,
    actualizando: false,
    ultimaComprobacion: new Date(),
    versionActual: '2026.09-v2.1',
    mensaje: 'Aplicación sincronizada y al día.',
  };
  private intervaloCheckId: any = null;

  constructor() {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      this.iniciar();
    }
  }

  public subscribe(cb: ListenerActualizacion) {
    this.listeners.add(cb);
    cb(this.estado);
    return () => {
      this.listeners.delete(cb);
    };
  }

  private notify() {
    this.listeners.forEach((cb) => cb(this.estado));
  }

  public getEstado(): EstadoActualizacionPWA {
    return this.estado;
  }

  private iniciar(): void {
    window.addEventListener('load', () => {
      this.registrarServiceWorker();
    });

    // Comprobar actualización al volver a la app (cuando el usuario regresa a la pantalla)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.buscarActualizacionesSilenciosas();
      }
    });

    // Comprobación periódica cada 60 segundos
    this.intervaloCheckId = setInterval(() => {
      this.buscarActualizacionesSilenciosas();
    }, 60000);

    // Cuando el nuevo Service Worker toma el control, recargar limpiamente si fue activado
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('[PWA Update] Nuevo Service Worker activado. Sincronizando interfaz...');
      this.estado = {
        ...this.estado,
        disponible: false,
        actualizando: false,
        mensaje: 'Nueva versión aplicada con éxito.',
      };
      this.notify();
    });
  }

  private async registrarServiceWorker(): Promise<void> {
    try {
      const reg = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/',
        updateViaCache: 'none', // Forzar siempre comprobación de byte a byte del SW
      });

      this.registration = reg;
      console.log('[PWA Update] Service Worker registrado con éxito en scope:', reg.scope);

      // Comprobar si hay una actualización pendiente
      reg.addEventListener('updatefound', () => {
        const nuevoWorker = reg.installing;
        if (!nuevoWorker) return;

        nuevoWorker.addEventListener('statechange', () => {
          if (nuevoWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // Hay una nueva versión lista
              console.log('[PWA Update] Nueva versión detectada y descargada.');
              this.estado = {
                ...this.estado,
                disponible: true,
                mensaje: '¡Hay una nueva actualización lista para aplicarse!',
              };
              this.notify();

              // Solicitar activación inmediata
              nuevoWorker.postMessage({ action: 'skipWaiting' });
            } else {
              console.log('[PWA Update] Contenido cacheado para uso offline por primera vez.');
            }
          }
        });
      });

      // Búsqueda inicial de actualización
      await reg.update().catch(() => {});
    } catch (err) {
      console.warn('[PWA Update] Error al registrar Service Worker:', err);
    }
  }

  public async buscarActualizacionesSilenciosas(): Promise<void> {
    if (!this.registration) return;
    try {
      this.estado.ultimaComprobacion = new Date();
      await this.registration.update();
    } catch (e) {
      // Sin conexión o fallo temporal
    }
  }

  /**
   * Forzar búsqueda y aplicación inmediata de actualizaciones (invocada desde el modal de descarga)
   */
  public async forzarActualizacion(): Promise<{
    exito: boolean;
    hayNuevaVersion: boolean;
    mensaje: string;
  }> {
    if (typeof window === 'undefined') {
      return { exito: false, hayNuevaVersion: false, mensaje: 'No soportado en este entorno.' };
    }

    this.estado = {
      ...this.estado,
      actualizando: true,
      mensaje: 'Buscando actualizaciones en el servidor...',
    };
    this.notify();

    if (!('serviceWorker' in navigator)) {
      this.estado = {
        ...this.estado,
        actualizando: false,
        mensaje: 'Tu navegador no soporta Service Workers, pero carga siempre la versión web más reciente.',
      };
      this.notify();
      return { exito: true, hayNuevaVersion: false, mensaje: this.estado.mensaje };
    }

    try {
      if (!this.registration) {
        this.registration = await navigator.serviceWorker.getRegistration();
      }

      if (this.registration) {
        await this.registration.update();

        // Si hay un worker esperando, pedirle que se active
        if (this.registration.waiting) {
          this.registration.waiting.postMessage({ action: 'skipWaiting' });
          this.estado = {
            ...this.estado,
            disponible: false,
            actualizando: false,
            ultimaComprobacion: new Date(),
            mensaje: '¡Nueva versión instalada y sincronizada exitosamente!',
          };
          this.notify();
          setTimeout(() => {
            window.location.reload();
          }, 400);
          return { exito: true, hayNuevaVersion: true, mensaje: this.estado.mensaje };
        }
      }

      // Si no había SW esperando, verificar caché de navegación
      if ('caches' in window) {
        // Limpiar cachés de páginas viejas para asegurar frescura total
        const keys = await caches.keys();
        for (const key of keys) {
          if (!key.includes('v2')) {
            await caches.delete(key);
          }
        }
      }

      this.estado = {
        ...this.estado,
        actualizando: false,
        disponible: false,
        ultimaComprobacion: new Date(),
        mensaje: '¡Tu aplicación ya tiene la versión más reciente y está 100% sincronizada!',
      };
      this.notify();

      return {
        exito: true,
        hayNuevaVersion: false,
        mensaje: this.estado.mensaje,
      };
    } catch (err: any) {
      this.estado = {
        ...this.estado,
        actualizando: false,
        mensaje: 'No se pudo conectar al servidor. Si estás sin conexión, se usa la versión local.',
      };
      this.notify();
      return {
        exito: false,
        hayNuevaVersion: false,
        mensaje: this.estado.mensaje,
      };
    }
  }
}

export const pwaUpdateManager = new PWAUpdateManager();
