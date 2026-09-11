import React from 'react';
import { motion } from 'motion/react';
import { AlertOctagon, ShieldAlert, Waves, Mountain, CloudRain, Snowflake, SunMedium, Flame, ChevronRight, FileImage } from 'lucide-react';
import { DisasterType, DistrictData } from '../types/disasters';
import { DISASTER_PROTOCOLS } from '../data/peruData';

interface DisasterRiskCardProps {
  district: DistrictData;
  activeDisaster: DisasterType;
  onSelectDisaster: (type: DisasterType) => void;
  onViewInfographic?: (type: DisasterType) => void;
}

export const DisasterRiskCard: React.FC<DisasterRiskCardProps> = ({
  district,
  activeDisaster,
  onSelectDisaster,
  onViewInfographic,
}) => {
  const getDisasterIcon = (type: DisasterType) => {
    switch (type) {
      case 'sismo':
        return <ActivityIcon className="w-4 h-4" />;
      case 'tsunami':
        return <Waves className="w-4 h-4" />;
      case 'huayco':
        return <Mountain className="w-4 h-4" />;
      case 'inundacion':
        return <CloudRain className="w-4 h-4" />;
      case 'helada_friaje':
        return <Snowflake className="w-4 h-4" />;
      case 'sequia':
        return <SunMedium className="w-4 h-4" />;
      case 'erupcion_volcanica':
        return <Flame className="w-4 h-4" />;
      default:
        return <ShieldAlert className="w-4 h-4" />;
    }
  };

  const currentProtocol = DISASTER_PROTOCOLS[activeDisaster] || DISASTER_PROTOCOLS.sismo;
  // Garantizar que el desastre activo siempre esté visible entre las opciones
  const availableDisasters = Array.from(new Set([...district.predominantDisasters, activeDisaster]));

  return (
    <div
      id="seccion-protocolo-riesgo"
      className="w-full bg-white border border-slate-200 border-t-4 border-t-red-600 rounded-xl p-4 sm:p-6 shadow-sm scroll-mt-24 transition-all"
    >
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-50 border border-red-200 flex items-center justify-center text-red-600 shrink-0">
            <AlertOctagon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2 flex-wrap">
              Evaluación Multirriesgo Distrital
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200 uppercase">
                Peligro Geodinámico
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Cálculo de riesgo oficial para el distrito de{' '}
              <strong className="text-slate-800 font-bold">{district.name}</strong>.
            </p>
          </div>
        </div>

        {onViewInfographic && (
          <button
            type="button"
            onClick={() => onViewInfographic(activeDisaster)}
            className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-xs"
            title="Ver Infografía Oficial INDECI y Mochila"
          >
            <FileImage className="w-3.5 h-3.5 text-white" />
            <span>Ver Infografía Oficial</span>
          </button>
        )}
      </div>

      {/* Disasters tabs for this district */}
      <div className="mb-5">
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
          Desastres Prioritarios y Monitoreados en esta Zona:
        </div>
        <div className="flex flex-wrap gap-2">
          {availableDisasters.map((dtype) => {
            const proto = DISASTER_PROTOCOLS[dtype] || DISASTER_PROTOCOLS.sismo;
            const isSelected = activeDisaster === dtype;
            return (
              <motion.button
                key={dtype}
                type="button"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => onSelectDisaster(dtype)}
                className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-xs border border-slate-900 ring-2 ring-red-500/50'
                    : 'bg-white text-slate-700 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {getDisasterIcon(dtype)}
                <span>{proto.title}</span>
                {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Current Protocol details */}
      <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
          <div>
            <span className="text-[10px] uppercase tracking-wider font-bold text-red-600">
              Protocolo Activo
            </span>
            <h4 className="text-base sm:text-lg font-bold text-slate-900">{currentProtocol.title}</h4>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded text-xs font-bold bg-red-50 text-red-700 border border-red-200">
              Riesgo: {currentProtocol.riskLevel}
            </span>
            <span className="px-2.5 py-1 rounded text-xs font-medium bg-white text-slate-700 border border-slate-200">
              Aviso SAT: {currentProtocol.warningTime}
            </span>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          {currentProtocol.description}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          <div className="bg-white rounded-lg p-3 border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Causa Geofísica Principal:
            </span>
            <span className="text-xs text-slate-800 font-medium">{currentProtocol.primaryCause}</span>
          </div>
          <div className="bg-white rounded-lg p-3 border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Microclima Distrital Asociado:
            </span>
            <span className="text-xs text-slate-800 font-medium">{district.climateType}</span>
          </div>
        </div>

        {/* Recommended Actions Bullet points */}
        <div className="pt-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
            Acciones Clave Recomendadas por INDECI:
          </span>
          <ul className="space-y-1.5">
            {currentProtocol.recommendedActions.map((act, i) => (
              <li key={i} className="text-xs text-slate-700 flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-600 mt-1.5 shrink-0" />
                <span>{act}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

// Activity Icon helper
function ActivityIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}
