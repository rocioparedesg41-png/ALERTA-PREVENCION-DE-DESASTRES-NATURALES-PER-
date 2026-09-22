import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Download,
  Smartphone,
  Laptop,
  Apple,
  Share2,
  PlusSquare,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  HardDrive,
  WifiOff,
  Sparkles,
  Layers,
  RefreshCw,
} from 'lucide-react';
import { pwaUpdateManager, EstadoActualizacionPWA } from '../utils/pwaUpdate';

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type PlatformTab = 'android' | 'ios' | 'web';

export const DownloadModal: React.FC<DownloadModalProps> = ({ isOpen, onClose }) => {
  const [activePlatform, setActivePlatform] = useState<PlatformTab>(() => {
    // Auto-detect user device platform
    if (typeof navigator !== 'undefined') {
      const ua = navigator.userAgent.toLowerCase();
      if (/iphone|ipad|ipod/.test(ua)) return 'ios';
      if (/android/.test(ua)) return 'android';
    }
    return 'android';
  });

  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [installStatus, setInstallStatus] = useState<string>('');
  const [updateState, setUpdateState] = useState<EstadoActualizacionPWA>(() =>
    pwaUpdateManager.getEstado()
  );
  const [isUpdatingNow, setIsUpdatingNow] = useState(false);

  useEffect(() => {
    const unsub = pwaUpdateManager.subscribe((estado) => {
      setUpdateState(estado);
    });

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
      setInstallStatus('¡Aplicación instalada con éxito en tu dispositivo!');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Check if running in standalone mode (already installed)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      unsub();
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleForceUpdate = async () => {
    setIsUpdatingNow(true);
    try {
      const res = await pwaUpdateManager.forzarActualizacion();
      setInstallStatus(res.mensaje);
      setTimeout(() => {
        setIsUpdatingNow(false);
      }, 1000);
    } catch {
      setIsUpdatingNow(false);
    }
  };

  const handleNativeInstall = async () => {
    if (installPrompt) {
      try {
        installPrompt.prompt();
        const { outcome } = await installPrompt.userChoice;
        if (outcome === 'accepted') {
          setIsInstalled(true);
          setInstallStatus('Instalación aceptada.');
        }
        setInstallPrompt(null);
      } catch (err) {
        console.error('Error invoking install prompt:', err);
      }
    } else {
      setInstallStatus(
        'Sigue las instrucciones detalladas a continuación para agregar la aplicación a tu pantalla de inicio en segundos.'
      );
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        id="modal-descarga-instalacion"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-auto text-slate-900 dark:text-slate-100"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-white shadow-xs">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold leading-tight text-slate-900 dark:text-white">
                  Descargar e Instalar Aplicación
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Acceso offline en tiempo real para Android, iOS y Web (PWA Oficial)
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
              title="Cerrar ventana"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-5 sm:p-6 space-y-5 max-h-[80vh] overflow-y-auto">
            {/* Key Advantages Pills */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs">
                <WifiOff className="w-4 h-4 text-amber-500 shrink-0" />
                <span className="font-semibold">Funciona 100% Sin Internet</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="font-semibold">Sirena y Alarma Sísmica</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs">
                <HardDrive className="w-4 h-4 text-blue-500 shrink-0" />
                <span className="font-semibold">Cartografía y Rutas Offline</span>
              </div>
            </div>

            {/* Auto-Update & Real-Time Sync Status Panel */}
            <div className="p-3.5 sm:p-4 rounded-xl bg-slate-900 text-white border border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                  <span className="font-bold text-slate-100 tracking-wide uppercase text-[11px]">
                    Sincronización Continua Activa (Web, iOS y Android)
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                    {updateState.versionActual}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed max-w-lg">
                  Cada vez que agregues o actualices contenido en la aplicación, tu versión descargada
                  se actualizará automáticamente en segundo plano sin perder datos guardados.
                </p>
                <div className="text-[10px] text-slate-400">
                  Última comprobación: {updateState.ultimaComprobacion.toLocaleTimeString()}
                </div>
              </div>

              <button
                type="button"
                onClick={handleForceUpdate}
                disabled={isUpdatingNow}
                className="px-3.5 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isUpdatingNow ? 'animate-spin' : ''}`} />
                <span>{isUpdatingNow ? 'Verificando...' : 'Buscar Actualización'}</span>
              </button>
            </div>

            {/* Platform Selector Tabs */}
            <div className="flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setActivePlatform('android')}
                className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activePlatform === 'android'
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span>Android</span>
              </button>

              <button
                type="button"
                onClick={() => setActivePlatform('ios')}
                className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activePlatform === 'ios'
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Apple className="w-4 h-4" />
                <span>iPhone / iOS</span>
              </button>

              <button
                type="button"
                onClick={() => setActivePlatform('web')}
                className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activePlatform === 'web'
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Laptop className="w-4 h-4" />
                <span>Web / PC</span>
              </button>
            </div>

            {/* Platform Instructions View */}
            {activePlatform === 'android' && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-sm text-emerald-900 dark:text-emerald-300">
                      Instalación Rápida en Dispositivos Android
                    </h4>
                    <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                      Instala la app directamente sin ocupar espacio innecesario en tu almacenamiento.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleNativeInstall}
                    className="w-full sm:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm flex items-center justify-center gap-2 transition-colors cursor-pointer shrink-0"
                  >
                    <Download className="w-4 h-4" />
                    <span>Instalar Ahora en Android</span>
                  </button>
                </div>

                <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3 bg-slate-50/50 dark:bg-slate-950/40">
                  <h5 className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Instrucciones manuales paso a paso (Google Chrome / Brave / Edge):
                  </h5>
                  <ol className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300 list-decimal list-inside">
                    <li className="leading-relaxed">
                      Abre este sitio web en el navegador <strong>Google Chrome</strong> en tu celular Android.
                    </li>
                    <li className="leading-relaxed">
                      Toca el menú de opciones en la esquina superior derecha (los <strong>tres puntos verticales ⋮</strong>).
                    </li>
                    <li className="leading-relaxed">
                      Selecciona la opción <strong>"Instalar aplicación"</strong> o <strong>"Agregar a la pantalla principal"</strong>.
                    </li>
                    <li className="leading-relaxed">
                      Confirma tocando <strong>"Instalar"</strong>. La aplicación aparecerá con su ícono oficial en tu pantalla de inicio y funcionará como una aplicación nativa.
                    </li>
                  </ol>
                </div>
              </div>
            )}

            {activePlatform === 'ios' && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-white">
                    <Apple className="w-4 h-4" />
                    <span>Instalación Oficial en iPhone e iPad (Safari)</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Apple permite instalar esta aplicación como PWA nativa a pantalla completa a través de Safari:
                  </p>
                </div>

                <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3 bg-slate-50/50 dark:bg-slate-950/40">
                  <h5 className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Pasos en iOS Safari:
                  </h5>
                  <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300">
                    <div className="flex items-start gap-3 p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <div className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-950/50 text-red-600 flex items-center justify-center font-bold shrink-0">
                        1
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900 dark:text-white">Abre en Safari</p>
                        <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                          Asegúrate de estar navegando desde el navegador <strong>Safari</strong> de tu iPhone o iPad.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <div className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-950/50 text-red-600 flex items-center justify-center font-bold shrink-0">
                        2
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-white">
                          <span>Toca el botón Compartir</span>
                          <Share2 className="w-3.5 h-3.5 text-blue-500" />
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                          En la barra inferior de navegación de Safari, presiona el ícono del cuadrado con la flecha apuntando hacia arriba.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <div className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-950/50 text-red-600 flex items-center justify-center font-bold shrink-0">
                        3
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-white">
                          <span>Selecciona "Agregar al inicio"</span>
                          <PlusSquare className="w-3.5 h-3.5 text-emerald-500" />
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                          Desplázate por el menú hacia abajo y presiona <strong>"Agregar al inicio"</strong> (o "Add to Home Screen").
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <div className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-950/50 text-red-600 flex items-center justify-center font-bold shrink-0">
                        4
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900 dark:text-white">Toca "Agregar"</p>
                        <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                          En la esquina superior derecha, pulsa <strong>"Agregar"</strong>. La app se abrirá a pantalla completa sin barra de direcciones.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activePlatform === 'web' && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-sm text-blue-900 dark:text-blue-300">
                      Instalación en Ordenador / Escritorio
                    </h4>
                    <p className="text-xs text-blue-700 dark:text-blue-400 mt-0.5">
                      Compatible con Windows, macOS, Chromebooks y Linux vía Chrome o Microsoft Edge.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleNativeInstall}
                    className="w-full sm:w-auto px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm flex items-center justify-center gap-2 transition-colors cursor-pointer shrink-0"
                  >
                    <Laptop className="w-4 h-4" />
                    <span>Instalar en PC / Mac</span>
                  </button>
                </div>

                <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3 bg-slate-50/50 dark:bg-slate-950/40">
                  <h5 className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Instalación rápida desde la barra del navegador:
                  </h5>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    1. En la barra de direcciones de tu navegador (Chrome / Edge), haz clic en el ícono de <strong>Instalar aplicación ⨁</strong> ubicado a la derecha de la URL.
                  </p>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    2. Haz clic en <strong>"Instalar"</strong>. La plataforma se ejecutará como un programa de escritorio independiente con acceso rápido desde tu barra de tareas o menú de inicio.
                  </p>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    3. También puedes guardar este sitio en marcadores presionando <strong>Ctrl + D</strong> (Windows) o <strong>Cmd + D</strong> (Mac).
                  </p>
                </div>
              </div>
            )}

            {/* Status message if any */}
            {installStatus && (
              <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-center text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                {installStatus}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 sm:px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              PWA Certificada • Cumplimiento SINAGERD
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-black dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs transition-colors cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
