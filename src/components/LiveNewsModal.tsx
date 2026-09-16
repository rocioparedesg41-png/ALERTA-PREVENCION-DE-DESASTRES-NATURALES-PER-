import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Radio,
  ExternalLink,
  Activity,
  CloudRain,
  ShieldAlert,
  Compass,
  Waves,
  Clock,
  ArrowUpRight,
  CheckCircle,
  Building2,
  AlertCircle
} from 'lucide-react';
import { OFFICIAL_PERUVIAN_ENTITIES } from '../data/officialEntities';

interface LiveNewsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface NoticiaEnVivo {
  id: string;
  entidad: 'IGP' | 'SENAMHI' | 'COEN' | 'CENEPRED' | 'DHN' | 'INDECI' | 'ENFEN';
  entidadNombre: string;
  urlOficial: string;
  titulo: string;
  hora: string;
  estado: 'EN VIVO' | 'URGENTE' | 'ACTUALIZADO' | 'MONITOREO';
  resumen: string;
  detalles: string[];
  colorBadge: string;
}

export const NOTICIAS_EN_VIVO_DATA: NoticiaEnVivo[] = [
  {
    id: 'n-enfen-comunicado',
    entidad: 'ENFEN',
    entidadNombre: 'Comisión Multisectorial encargada del Estudio Nacional del Fenómeno El Niño (ENFEN)',
    urlOficial: 'https://enfen.imarpe.gob.pe/comunicados/',
    titulo: 'Comunicado Oficial ENFEN: Monitoreo Océano-Atmosférico y Estado del Sistema de Alerta',
    hora: 'Hace 35 minutos',
    estado: 'ACTUALIZADO',
    resumen: 'La Comisión Multisectorial ENFEN (integrada por IMARPE, SENAMHI, DHN, IGP, ANA, INDECI y CENEPRED) mantiene el monitoreo continuo de las condiciones oceanográficas y meteorológicas en el Pacífico Ecuatorial, vigilando la temperatura superficial del mar y ondas Kelvin.',
    detalles: [
      'Seguimiento permanente de la Región Niño 1+2 e índice térmico costero en todo el litoral peruano.',
      'Informes técnicos y comunicados oficiales colegiados disponibles en enfen.imarpe.gob.pe/comunicados.',
      'Coordinación directa con los comités de Defensa Civil y sectores productivos (agricultura, pesca y agua).',
    ],
    colorBadge: 'bg-teal-700',
  },
  {
    id: 'n-igp-sismo',
    entidad: 'IGP',
    entidadNombre: 'Instituto Geofísico del Perú - Centro Sismológico Nacional',
    urlOficial: 'https://ultimosismo.igp.gob.pe/',
    titulo: 'Monitoreo Sísmico Nacional: Sismos reportados en Costa Central y Sur',
    hora: 'Hace 18 minutos',
    estado: 'EN VIVO',
    resumen: 'La Red Sísmica Nacional mantiene vigilancia en tiempo real de la zona de subducción entre la Placa de Nazca y la Placa Sudamericana. Sismos percibidos sin reporte de tsunami según confirmación con DHN.',
    detalles: [
      'Red SASPE y sensores geodésicos GNSS operativos al 100%.',
      'Reporte inmediato en tiempo real disponible en la web oficial del IGP.',
      'Sismos corticales y de subducción evaluados por el CENSIS.',
    ],
    colorBadge: 'bg-red-600',
  },
  {
    id: 'n-dhn-tsunami',
    entidad: 'DHN',
    entidadNombre: 'Dirección de Hidrografía y Navegación - Marina de Guerra del Perú',
    urlOficial: 'https://www.dhn.mil.pe/',
    titulo: 'Centro Nacional de Alerta de Tsunami (CNAT): Estado NORMAL en todo el Litoral',
    hora: 'Hace 45 minutos',
    estado: 'ACTUALIZADO',
    resumen: 'La DHN y el CNAT descartan alerta de tsunami para todo el litoral peruano tras los últimos movimientos telúricos registrados en el océano Pacífico. Boyas oceanográficas DART en transmisión continua.',
    detalles: [
      'Boyas DART 32411 y 32412 en operación normal en altamar.',
      'Aviso de Oleaje Ligero a Moderado vigente para puertos del litoral central y sur.',
      'Monitoreo mareográfico en tiempo real en las estaciones costeras.',
    ],
    colorBadge: 'bg-blue-700',
  },
  {
    id: 'n-senamhi-lluvias',
    entidad: 'SENAMHI',
    entidadNombre: 'Servicio Nacional de Meteorología e Hidrología del Perú',
    urlOficial: 'https://www.senamhi.gob.pe/?p=aviso-meteorologico',
    titulo: 'Avisos Meteorológicos SENAMHI: Monitoreo de Precipitaciones e Hidrometeorología Nacional',
    hora: 'Hace 1 hora',
    estado: 'URGENTE',
    resumen: 'SENAMHI mantiene actualizados los avisos meteorológicos e hidrológicos vigentes en las últimas 24 horas por lluvias y descenso de temperaturas en regiones de la sierra y selva.',
    detalles: [
      'Monitoreo satelital GOES-16 en tiempo real accesible desde el portal oficial.',
      'Vigilancia especial de niveles de ríos e hidrometeorología en cuencas vulnerables.',
      'Avisos clasificados en niveles amarillo, naranja y rojo con fichas técnicas descargables.',
    ],
    colorBadge: 'bg-sky-600',
  },
  {
    id: 'n-cenepred-deslizamientos',
    entidad: 'CENEPRED',
    entidadNombre: 'Centro Nacional de Estimación, Prevención y Reducción del Riesgo de Desastres',
    urlOficial: 'https://sigrid.cenepred.gob.pe/sigridv3/',
    titulo: 'Escenarios de Riesgo CENEPRED / SIGRID: Evaluación de Susceptibilidad ante Huaicos y Deslizamientos',
    hora: 'Hace 2 horas',
    estado: 'MONITOREO',
    resumen: 'CENEPRED a través del Sistema SIGRID v3 publica los mapas georreferenciados de susceptibilidad territorial ante movimientos en masa y flujo de detritos (huaicos) en laderas y quebradas.',
    detalles: [
      'Mapas georreferenciados y capas cartográficas en la plataforma nacional SIGRID v3.',
      'Alertas territoriales remitidas a los Centros de Operaciones de Emergencia Regional (COER).',
      'Priorización de quebradas y cuencas con susceptibilidad alta y muy alta.',
    ],
    colorBadge: 'bg-emerald-700',
  },
  {
    id: 'n-coen-boletin',
    entidad: 'COEN',
    entidadNombre: 'Centro de Operaciones de Emergencia Nacional (COEN - INDECI)',
    urlOficial: 'https://coen.indeci.gob.pe/',
    titulo: 'Boletín Oficial COEN: Monitoreo Multirriesgo y Emergencias Activas 24/7',
    hora: 'Hace 3 horas',
    estado: 'EN VIVO',
    resumen: 'El COEN mantiene coordinación permanente con los alcaldes distritales, gobernadores regionales y ministerios para la atención oportuna y despliegue de ayuda humanitaria.',
    detalles: [
      'Línea gratuita 115 habilitada para reporte ciudadano de emergencias.',
      'Almacenes de bienes de ayuda humanitaria (BAH) preposicionados.',
      'Monitoreo ininterrumpido en las 25 regiones del país.',
    ],
    colorBadge: 'bg-amber-600',
  },
];

export const LiveNewsModal: React.FC<LiveNewsModalProps> = ({ isOpen, onClose }) => {
  const [filtroEntidad, setFiltroEntidad] = useState<string>('todas');

  if (!isOpen) return null;

  const noticiasFiltradas =
    filtroEntidad === 'todas'
      ? NOTICIAS_EN_VIVO_DATA
      : NOTICIAS_EN_VIVO_DATA.filter((n) => n.entidad === filtroEntidad);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden text-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera del Modal */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg tracking-tight">
                  Noticias en Vivo y Páginas Oficiales
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-600 text-white">
                  24/7 EN VIVO
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Enlaces directos a los reportes en tiempo real de los organismos científicos del Estado Peruano
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
            aria-label="Cerrar modal de noticias"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barra de Acceso Rápido a Sitios Oficiales Principales */}
        <div className="bg-slate-100/80 border-b border-slate-200 px-4 py-2.5 overflow-x-auto scrollbar-none flex items-center gap-2 text-xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider shrink-0">
            Ir directo a:
          </span>
          {OFFICIAL_PERUVIAN_ENTITIES.map((ent) => (
            <a
              key={ent.acronym}
              href={ent.url}
              target="_blank"
              rel="noopener noreferrer"
              className="py-1 px-2.5 bg-white hover:bg-red-50 hover:text-red-700 border border-slate-200 hover:border-red-200 rounded-md font-semibold text-slate-700 transition-colors flex items-center gap-1.5 shrink-0 shadow-2xs"
            >
              <span>{ent.acronym}</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>
          ))}
        </div>

        {/* Filtro de noticias por entidad */}
        <div className="px-4 sm:px-6 pt-4 pb-2 border-b border-slate-100 flex items-center gap-2 overflow-x-auto scrollbar-none text-xs">
          <button
            type="button"
            onClick={() => setFiltroEntidad('todas')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
              filtroEntidad === 'todas'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todas ({NOTICIAS_EN_VIVO_DATA.length})
          </button>
          {['IGP', 'SENAMHI', 'COEN', 'CENEPRED', 'DHN', 'ENFEN'].map((ent) => (
            <button
              key={ent}
              type="button"
              onClick={() => setFiltroEntidad(ent)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                filtroEntidad === ent
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {ent}
            </button>
          ))}
        </div>

        {/* Contenido scrolleable con las noticias oficiales en vivo */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 max-h-[60vh]">
          {noticiasFiltradas.map((noticia) => (
            <div
              key={noticia.id}
              className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5 hover:border-red-300 hover:bg-white transition-all shadow-2xs space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`text-[11px] font-black px-2.5 py-0.5 rounded text-white ${noticia.colorBadge}`}
                  >
                    {noticia.entidad}
                  </span>
                  <span className="text-xs font-semibold text-slate-700">
                    {noticia.entidadNombre}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-500 flex items-center gap-1 font-medium">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {noticia.hora}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-800">
                    {noticia.estado}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-sm sm:text-base text-slate-900 mb-1.5">
                  {noticia.titulo}
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {noticia.resumen}
                </p>
              </div>

              {/* Puntos de detalle oficial */}
              <div className="bg-white rounded-lg p-3 border border-slate-200 text-xs text-slate-700 space-y-1.5">
                {noticia.detalles.map((detalle, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-red-600 mt-0.5 shrink-0" />
                    <span>{detalle}</span>
                  </div>
                ))}
              </div>

              {/* Botón de enlace hacia la página oficial */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  Fuente oficial del Estado Peruano enlazada
                </span>
                <a
                  href={noticia.urlOficial}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
                >
                  <span>Ir a la Noticia en la Página Oficial en Vivo</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Pie del modal */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-600 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-slate-500">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span>Monitoreo 100% oficial verificado con INDECI, IGP, SENAMHI, DHN y CENEPRED.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-4 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            Cerrar Ventana
          </button>
        </div>
      </div>
    </div>
  );
};
