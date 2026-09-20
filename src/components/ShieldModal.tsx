import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Shield, ZoomIn, Info, CheckCircle2 } from 'lucide-react';

interface ShieldModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShieldModal: React.FC<ShieldModalProps> = ({ isOpen, onClose }) => {
  // ESC key listener to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          id="modal-escudo-sapsenp"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg bg-slate-900 border border-amber-500/40 rounded-2xl shadow-2xl overflow-hidden my-auto text-white"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/80">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white leading-tight tracking-wide">
                    Escudo Oficial SAPDENP
                  </h3>
                  <p className="text-[11px] text-amber-300 font-medium">
                    Sistema de Alerta y Prevención de Desastres Naturales
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Cerrar visualizador"
                aria-label="Cerrar modal de escudo"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Shield High-Resolution Display Container */}
            <div className="relative p-6 sm:p-8 flex flex-col items-center justify-center bg-radial from-slate-800/80 via-slate-900 to-slate-950">
              <div className="relative group max-w-[320px] sm:max-w-[360px] w-full">
                {/* Subtle back illumination glow */}
                <div className="absolute -inset-2 bg-gradient-to-tr from-amber-500/20 via-blue-500/20 to-red-500/20 rounded-full blur-xl opacity-80 pointer-events-none" />

                {/* Exact unchanged shield image provided by user */}
                <motion.img
                  src="/escudo_sapsenp.png"
                  alt="Escudo Oficial SAPDENP - Alerta y Prevención de Desastres Naturales del Perú"
                  className="relative z-10 w-full h-auto object-contain drop-shadow-[0_15px_30px_rgba(0,0,0,0.8)] select-none"
                  referrerPolicy="no-referrer"
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3 }}
                />
              </div>

              {/* Description Card */}
              <div className="mt-6 w-full bg-slate-950/70 border border-slate-800 rounded-xl p-4 text-xs space-y-2.5">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-[11px] uppercase tracking-wider">
                  <Info className="w-3.5 h-3.5" />
                  <span>Insignia Oficial de Protección Civil</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Emblema institucional que representa la soberanía, la vigilancia geodinámica continua y los protocolos de evacuación temprana para los 24 departamentos, la Provincia Constitucional del Callao, 196 provincias y 1893 distritos del Perú.
                </p>
                <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-[11px]">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Monitoreo 24/7 SINAGERD</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Protocolos INDECI validados</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
              <span className="text-[11px]">Click fuera o presiona ESC para cerrar</span>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Aceptar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
