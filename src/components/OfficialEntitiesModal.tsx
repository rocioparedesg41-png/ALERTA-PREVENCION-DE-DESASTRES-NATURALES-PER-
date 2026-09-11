import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PhoneCall, ExternalLink, ShieldCheck, X, Activity, Radio, Waves, Compass, CloudRain, Map } from 'lucide-react';
import { PERU_EMERGENCY_PHONES, OFFICIAL_PERUVIAN_ENTITIES } from '../data/officialEntities';

interface OfficialEntitiesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OfficialEntitiesModal: React.FC<OfficialEntitiesModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'Activity':
        return <Activity className="w-5 h-5" />;
      case 'CloudRain':
        return <CloudRain className="w-5 h-5" />;
      case 'Waves':
        return <Waves className="w-5 h-5" />;
      case 'Compass':
        return <Compass className="w-5 h-5" />;
      case 'Map':
        return <Map className="w-5 h-5" />;
      case 'Radio':
        return <Radio className="w-5 h-5" />;
      default:
        return <ShieldCheck className="w-5 h-5" />;
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative max-w-3xl w-full bg-white border border-slate-200 border-t-4 border-t-red-600 rounded-xl shadow-2xl p-5 sm:p-6 my-8 max-h-[90vh] overflow-y-auto text-slate-900"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 mb-5 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-50 border border-red-200 flex items-center justify-center text-red-600 shrink-0">
                <PhoneCall className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  Líneas de Auxilio y Organismos Científicos del Perú
                </h3>
                <p className="text-xs text-slate-600">
                  Marcación de emergencia y portales oficiales del Estado Peruano
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Section 1: Emergency Phone Numbers */}
          <div className="mb-6">
            <h4 className="text-xs font-bold text-red-600 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <PhoneCall className="w-3.5 h-3.5" />
              Centrales de Emergencia Nacional (Marcación Directa)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PERU_EMERGENCY_PHONES.map((phone) => (
                <div
                  key={phone.number}
                  className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 shadow-xs"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-bold text-xs sm:text-sm text-slate-900">{phone.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 font-mono font-bold">
                        {phone.acronym}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 line-clamp-1">{phone.description}</p>
                    <span className="text-[10px] text-green-700 font-semibold">
                      {phone.availableHours}
                    </span>
                  </div>

                  <a
                    href={`tel:${phone.number}`}
                    className="shrink-0 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-mono font-bold text-xs rounded-lg shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    {phone.number}
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Official Peruvian Entities */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-red-600" />
              Instituciones Científicas y de Gestión del Riesgo
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {OFFICIAL_PERUVIAN_ENTITIES.map((entity) => (
                <div
                  key={entity.acronym}
                  className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between shadow-xs"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="font-bold text-xs sm:text-sm text-slate-900 flex items-center gap-2">
                        <span className={`p-1.5 rounded-md ${entity.badgeColor} text-white`}>
                          {renderIcon(entity.iconName)}
                        </span>
                        {entity.acronym}
                      </span>
                      <a
                        href={entity.url}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2 py-1 rounded bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-medium flex items-center gap-1 transition-colors"
                      >
                        Portal Web
                        <ExternalLink className="w-3 h-3 text-slate-400" />
                      </a>
                    </div>
                    <div className="text-xs font-semibold text-slate-800 mb-0.5">{entity.name}</div>
                    <div className="text-[11px] text-slate-600 mb-2">{entity.role}</div>
                  </div>

                  <div className="pt-2 border-t border-slate-200 text-[10px] text-slate-500">
                    Último reporte: {entity.lastReport}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
