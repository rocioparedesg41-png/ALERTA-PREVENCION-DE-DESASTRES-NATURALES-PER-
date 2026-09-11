import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileText, ShieldCheck, X, Award, CheckCircle } from 'lucide-react';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TermsModal: React.FC<TermsModalProps> = ({ isOpen, onClose }) => {
  const [isMedalExpanded, setIsMedalExpanded] = React.useState(false);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        {/* Lightbox / Modal when user clicks on medal */}
        {isMedalExpanded && (
          <div
            className="fixed inset-0 z-60 bg-black/95 backdrop-blur-lg flex flex-col items-center justify-center p-4 cursor-pointer"
            onClick={() => setIsMedalExpanded(false)}
          >
            <div className="relative max-w-xl sm:max-w-2xl w-full flex flex-col items-center">
              <img
                src="/medallarpg.jpg?v=2026"
                alt="Medalla Casa Serpentis - Ing. Rocío Paredes Gamarra"
                className="w-full max-h-[75vh] object-contain rounded-2xl shadow-[0_0_60px_rgba(70,130,180,0.5)] border-4 border-[#4682B4]/90 bg-white p-2"
              />
              <p
                style={{ fontFamily: "'Cinzel', 'Playfair Display', Georgia, serif" }}
                className="mt-5 text-base sm:text-lg font-bold text-[#93C5FD] tracking-widest text-center"
              >
                Casa Serpentis • Ing. Rocío Paredes Gamarra
              </p>
              <p className="text-xs text-slate-400 text-center mt-1">
                Toca o haz clic en cualquier lugar para cerrar
              </p>
            </div>
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative max-w-2xl w-full bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-5 sm:p-6 my-8 max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-blue-900/30 border border-[#4682B4]/50 flex items-center justify-center text-[#93C5FD]">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-white">
                  Términos, Condiciones y Autoría Intelectual
                </h3>
                <p className="text-xs text-slate-400">
                  Sistema de Alerta de Desastres Naturales del Perú
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Author Highlight Card in Elegant Steel Blue Style */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-slate-950 via-[#0B1933] to-slate-950 border border-[#4682B4]/50 mb-5 shadow-lg">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
              {/* Clickable medal image that expands on click */}
              <div
                className="relative group cursor-pointer flex-shrink-0"
                onClick={() => setIsMedalExpanded(true)}
                title="Haga clic para ampliar la medalla"
              >
                <img
                  src="/medallarpg.jpg?v=2026"
                  alt="Medalla Casa Serpentis - Ing. Rocío Paredes Gamarra"
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-contain border-2 border-[#4682B4]/80 shadow-[0_0_15px_rgba(70,130,180,0.3)] bg-white p-0.5 group-hover:scale-105 group-hover:border-[#93C5FD] transition-all duration-300"
                />
                <div className="absolute inset-0 rounded-xl bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-[10px] text-[#93C5FD] font-bold">
                  🔍 Ampliar
                </div>
              </div>

              <div className="text-center sm:text-left space-y-1">
                <div className="text-[11px] font-bold text-[#7EB0D5] uppercase tracking-widest font-mono">
                  Autoría, Desarrollo y Dirección Técnica:
                </div>
                <h4
                  style={{ fontFamily: "'Cinzel', 'Playfair Display', Georgia, serif" }}
                  className="text-base sm:text-lg font-black text-[#93C5FD] tracking-wider drop-shadow-sm"
                >
                  Ing. Rocío Paredes Gamarra • Casa Serpentis
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed font-normal">
                  Ingeniera ambiental con conocimientos en Gestión de Riesgos de Desastres, tecnologías de la información y georreferenciación peruana, especialización en programación y desarrollo de aplicaciones.
                </p>
                <p className="text-xs italic text-[#BFDBFE]/90 pt-1 font-serif">
                  “Siempre encuentro una forma más inteligente y eficiente de hacer las cosas.”
                </p>
              </div>
            </div>
          </div>

          {/* Terms Content */}
          <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
            <section>
              <h5 className="font-bold text-white mb-1 flex items-center gap-1.5 text-sm">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                1. Propósito Cívico y Humanitario
              </h5>
              <p>
                La presente plataforma "Alerta y Prevención de Desastres naturales en Perú" ha sido diseñada con la finalidad de salvaguardar la vida humana, facilitar la preparación ante emergencias y proveer información geocientífica inmediata a la población peruana de las 25 regiones políticas (Costa, Sierra y Selva).
              </p>
            </section>

            <section>
              <h5 className="font-bold text-white mb-1 flex items-center gap-1.5 text-sm">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                2. Autonomía y Funcionamiento Offline
              </h5>
              <p>
                Considerando la recurrente caída de redes de telecomunicaciones móviles e internet tras eventos sísmicos de gran magnitud o deslizamientos torrenciales en el Perú, los módulos de mochila de emergencia, mapas cartográficos vectoriales, alarmas y mensajería SOS operan de manera autónoma sin requerir conectividad a internet.
              </p>
            </section>

            <section>
              <h5 className="font-bold text-white mb-1 flex items-center gap-1.5 text-sm">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                3. Sincronización con Fuentes Oficiales
              </h5>
              <p>
                Los protocolos y criterios sísmicos, meteorológicos y vulcanológicos aquí implementados se encuentran armonizados con las directrices técnicas del Instituto Geofísico del Perú (IGP), el Servicio Nacional de Meteorología e Hidrología (SENAMHI), el Instituto Nacional de Defensa Civil (INDECI), el COEN y el CENEPRED.
              </p>
            </section>

            <section>
              <h5 className="font-bold text-white mb-1 flex items-center gap-1.5 text-sm">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                4. Responsabilidad Ciudadana
              </h5>
              <p>
                El usuario se compromete a utilizar la herramienta con responsabilidad cívica y a no emitir falsas alarmas de SOS que puedan distraer los recursos de rescate de la Policía Nacional (105), Bomberos (116) o SAMU (106).
              </p>
            </section>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors cursor-pointer"
            >
              Cerrar y Aceptar
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
