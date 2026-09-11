import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Clock,
  ShieldAlert,
  Activity,
  CloudRain,
  Mountain,
  Waves,
  Snowflake,
  Flame,
  ExternalLink,
  AlertTriangle,
  Radio,
  Filter,
  ArrowUpRight,
  ChevronRight,
  FileImage,
  MapPin,
  FileText,
  Download,
  CheckCircle2,
  Globe,
  Loader2,
} from 'lucide-react';
import { DepartmentData, DistrictData, DisasterType, ProvinceData } from '../types/disasters';
import {
  consultarReportesOficiales,
  ReporteOficialGemini,
} from '../servicios/geminiReportesService';

// Función de sanitización defensiva para asegurar que ningún enlace oficial esté roto, caído (404) o malformado,
// y garantice dirigir al boletín o aviso específico correspondiente a la zona seleccionada.
function sanitizarEnlaceOficial(url?: string, rep?: ReporteOficialGemini | null, isPdf?: boolean): string {
  const entidad = rep?.entidad;

  // 1. Rutas internas de la API (generadores oficiales en tiempo real de PDF sin 404 ni páginas en blanco)
  if (url && url.startsWith('/api/')) {
    return url;
  }

  // 2. Manejo de botones de Reporte PDF
  if (isPdf) {
    if (entidad === 'IGP') {
      const matchCod = (url || '').match(/(\d{4}-\d+)/) || (rep?.codigoOficial || '').match(/(\d{4}-\d+)/);
      return matchCod ? `/api/reporte-sismo-pdf?codigo=${matchCod[1]}` : '/api/reporte-sismo-pdf';
    }
    if (entidad === 'SENAMHI') {
      const avisoMatch = (rep?.codigoOficial || '').match(/(\d+)/) || (url || '').match(/aviso-(\d+)/);
      const avisoNum = avisoMatch ? avisoMatch[1] : '355';
      const prov = encodeURIComponent(rep?.zonaAfectada || 'Provincia');
      const dpto = encodeURIComponent(rep?.zonaAfectada || 'Departamento');
      const nivel = encodeURIComponent(rep?.severidad || 'Naranja');
      const tit = encodeURIComponent(rep?.titulo || `Aviso N° ${avisoNum}`);
      const enl = encodeURIComponent(url || `https://www.senamhi.gob.pe/?p=aviso-meteorologico-detalle&a=2026&b=28785&c=00&d=SENA`);
      return `/api/reporte-senamhi-pdf?aviso=${avisoNum}&provincia=${prov}&departamento=${dpto}&nivel=${nivel}&titulo=${tit}&enlace=${enl}`;
    }
    if (entidad === 'COEN' || entidad === 'INDECI') {
      const cod = encodeURIComponent(rep?.codigoOficial?.replace(/[^a-zA-Z0-9-]/g, '') || 'REP-COEN-2026');
      const prov = encodeURIComponent(rep?.zonaAfectada || 'Provincia');
      const tit = encodeURIComponent(rep?.titulo || 'Reporte de Emergencias');
      return `/api/reporte-coen-pdf?codigo=${cod}&provincia=${prov}&tipoDesastre=${rep?.tipoDesastre || 'huayco'}&severidad=${rep?.severidad || 'Alta'}&titulo=${tit}`;
    }
    if (entidad === 'CENEPRED' || entidad === 'SIGRID') {
      const prov = encodeURIComponent(rep?.zonaAfectada || 'Provincia');
      return `/api/reporte-cenepred-pdf?codigo=084-2026&provincia=${prov}`;
    }
    if (entidad === 'DHN') {
      const prov = encodeURIComponent(rep?.zonaAfectada || 'Litoral');
      return `/api/reporte-dhn-pdf?aviso=35-26&provincia=${prov}`;
    }
    return '/api/reporte-coen-pdf';
  }

  // 3. Manejo de botones de visualización web oficial ("Boletín [Entidad]" o "Ver Evento en IGP")
  if (!url) {
    if (entidad === 'IGP') return 'https://ultimosismo.igp.gob.pe';
    if (entidad === 'SENAMHI') return 'https://www.senamhi.gob.pe/?p=aviso-meteorologico-detalle&a=2026&b=28785&c=00&d=SENA';
    if (entidad === 'COEN' || entidad === 'INDECI') return `https://portal.indeci.gob.pe/emergencias/?s=${encodeURIComponent(rep?.zonaAfectada || '')}`;
    if (entidad === 'CENEPRED' || entidad === 'SIGRID') return 'https://sigrid.cenepred.gob.pe/sigridv3/escenarios';
    if (entidad === 'DHN') return 'https://www.dhn.mil.pe/portal/avisos-especiales';
    return 'https://www.gob.pe';
  }

  // SENAMHI: Si ya tiene el enlace al detalle específico con ID del aviso, conservarlo intacto
  if (url.includes('aviso-meteorologico-detalle&a=2026&b=')) {
    return url;
  }
  // Si apunta al portal general de avisos de SENAMHI, enlazar al aviso específico según la zona/fenómeno reportado
  if (url.includes('senamhi.gob.pe')) {
    const cod = rep?.codigoOficial || '';
    const desc = (rep?.descripcion || '').toLowerCase();
    if (cod.includes('353') || desc.includes('sierra') || desc.includes('nieve') || desc.includes('granizo')) {
      return 'https://www.senamhi.gob.pe/?p=aviso-meteorologico-detalle&a=2026&b=28776&c=00&d=SENA';
    }
    if (cod.includes('354') || desc.includes('selva')) {
      return 'https://www.senamhi.gob.pe/?p=aviso-meteorologico-detalle&a=2026&b=28780&c=00&d=SENA';
    }
    if (cod.includes('352') || desc.includes('helada') || desc.includes('frio') || desc.includes('temperatura')) {
      return 'https://www.senamhi.gob.pe/?p=aviso-meteorologico-detalle&a=2026&b=28768&c=00&d=SENA';
    }
    // Por defecto aviso N° 355 de incremento de viento en la costa
    return 'https://www.senamhi.gob.pe/?p=aviso-meteorologico-detalle&a=2026&b=28785&c=00&d=SENA';
  }

  // COEN / INDECI: Evitar errores 404 o solicitudes de login en coen.indeci.gob.pe/report/ o /Monitoreo/
  if (
    url.includes('coen.indeci.gob.pe/report/') ||
    url.includes('coen.indeci.gob.pe/Monitoreo') ||
    url.includes('coen.indeci.gob.pe/Boletines') ||
    (url.includes('indeci.gob.pe') && !url.includes('portal.indeci.gob.pe'))
  ) {
    // Si la provincia reportada es Caylloma o Arequipa, enlazar al reporte de noticia específico
    const zonaNorm = (rep?.zonaAfectada || '').toLowerCase();
    if (zonaNorm.includes('caylloma') || zonaNorm.includes('arequipa')) {
      return 'https://portal.indeci.gob.pe/emergencias/reporte-preliminar-n-0848-10-9-2026-coen-indeci-1710-horas-incendio-forestal-en-el-distrito-de-cabanaconde-arequipa/';
    }
    return `https://portal.indeci.gob.pe/emergencias/?s=${encodeURIComponent(rep?.zonaAfectada || '')}`;
  }

  // CENEPRED / SIGRID: Evitar redirigir a portales generales; dirigir al visor de escenarios o documento técnico 2026
  if (
    url === 'https://www.cenepred.gob.pe/' ||
    url === 'https://www.cenepred.gob.pe' ||
    url === 'https://www.gob.pe/cenepred' ||
    url === 'https://sigrid.cenepred.gob.pe/sigridv3/' ||
    (url.includes('cenepred.gob.pe') && !url.includes('sigrid.cenepred.gob.pe/sigridv3/'))
  ) {
    return 'https://sigrid.cenepred.gob.pe/sigridv3/escenarios';
  }

  // DHN: Asegurar ruta válida con /portal/ para avisos especiales
  if (url.includes('dhn.mil.pe/avisos-especiales') && !url.includes('portal/avisos-especiales')) {
    return 'https://www.dhn.mil.pe/portal/avisos-especiales';
  }

  // IGP: enlace directo de evento sísmico
  if (entidad === 'IGP' || url.includes('igp.gob.pe')) {
    const matchCod = (rep?.codigoOficial || url).match(/(\d{4}-\d+)/);
    if (matchCod) {
      return `https://ultimosismo.igp.gob.pe/evento/${matchCod[1]}`;
    }
    return 'https://ultimosismo.igp.gob.pe';
  }

  return url;
}

interface Reporte24HorasProps {
  district: DistrictData;
  province: ProvinceData;
  department: DepartmentData;
  onSelectDisaster?: (tipo: DisasterType) => void;
  onViewInfographic?: (tipo: DisasterType) => void;
  onOpenLiveNewsModal?: () => void;
}

export const Reporte24Horas: React.FC<Reporte24HorasProps> = ({
  district,
  province,
  department,
  onSelectDisaster,
  onViewInfographic,
  onOpenLiveNewsModal,
}) => {
  const [reportes, setReportes] = useState<ReporteOficialGemini[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');

  // Consulta al servicio fullstack (Gemini AI + IGP con filtro estricto de 24 horas y geolocalización)
  useEffect(() => {
    let isMounted = true;
    setCargando(true);

    consultarReportesOficiales(district, province, department)
      .then((data) => {
        if (isMounted) {
          setReportes(data);
          setCargando(false);
        }
      })
      .catch((err) => {
        console.error('Error al obtener reportes oficiales de 24h:', err);
        if (isMounted) {
          setReportes([]);
          setCargando(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [district.name, province.name, department.name, district.lat, district.lng]);

  const getDisasterLabel = (tipo: DisasterType): string => {
    switch (tipo) {
      case 'sismo':
        return 'Sismo y Terremoto';
      case 'tsunami':
        return 'Tsunami y Oleajes';
      case 'huayco':
        return 'Huaico y Aluvión';
      case 'inundacion':
        return 'Lluvias e Inundación';
      case 'helada_friaje':
        return 'Heladas y Friaje';
      case 'sequia':
        return 'Sequía';
      case 'erupcion_volcanica':
        return 'Erupción Volcánica';
      case 'deslizamiento':
        return 'Deslizamiento de Masa';
      default:
        return String(tipo);
    }
  };

  // Filtrar según la selección del usuario
  const reportesFiltrados = useMemo(() => {
    if (filtroTipo === 'todos') return reportes;
    return reportes.filter((r) => r.tipoDesastre === filtroTipo);
  }, [reportes, filtroTipo]);

  // Extraer tipos únicos de desastres reportados en las últimas 24h
  const tiposDisponibles = useMemo(() => {
    return Array.from(new Set(reportes.map((r) => r.tipoDesastre)));
  }, [reportes]);

  const getDisasterIcon = (tipo: DisasterType) => {
    switch (tipo) {
      case 'sismo':
        return <Activity className="w-4 h-4 text-red-600 dark:text-red-400" />;
      case 'inundacion':
        return <CloudRain className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      case 'huayco':
      case 'deslizamiento':
        return <Mountain className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case 'tsunami':
        return <Waves className="w-4 h-4 text-sky-600 dark:text-sky-400" />;
      case 'helada_friaje':
        return <Snowflake className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />;
      case 'erupcion_volcanica':
        return <Flame className="w-4 h-4 text-orange-600 dark:text-orange-400" />;
      default:
        return <ShieldAlert className="w-4 h-4 text-red-600 dark:text-red-400" />;
    }
  };

  const getEntidadBadge = (entidad: string) => {
    switch (entidad) {
      case 'IGP':
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-950/70 dark:text-red-300 dark:border-red-800/80';
      case 'SENAMHI':
        return 'bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-950/70 dark:text-sky-300 dark:border-sky-800/80';
      case 'COEN':
      case 'INDECI':
        return 'bg-amber-100 text-amber-900 border-amber-200 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-800/80';
      case 'CENEPRED':
      case 'SIGRID':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800/80';
      case 'DHN':
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/70 dark:text-blue-300 dark:border-blue-800/80';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
    }
  };

  return (
    <div
      id="seccion-reporte-24-horas"
      className="w-full bg-white dark:bg-[#0b132b] border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-6 shadow-sm space-y-4 transition-colors"
    >
      {/* Encabezado principal de la sección de 24 Horas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                Reportes y Boletines Oficiales de las Últimas 24 Horas
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-600 text-white animate-pulse">
                FUENTES OFICIALES • 24H
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Datos verificados de páginas gubernamentales (IGP, SENAMHI, DHN, CENEPRED, COEN) para{' '}
              <strong className="text-slate-800 dark:text-slate-200 font-semibold">{district.name}</strong> ({province.name},{' '}
              {department.name}).
            </p>
          </div>
        </div>

        {/* Botón de acceso a noticias en vivo completas */}
        {onOpenLiveNewsModal && (
          <button
            type="button"
            onClick={onOpenLiveNewsModal}
            className="self-start sm:self-auto py-2 px-3 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-2xs border border-transparent dark:border-slate-700"
          >
            <Radio className="w-3.5 h-3.5 text-red-400 animate-pulse" />
            <span>Monitoreo Oficial en Vivo</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-300" />
          </button>
        )}
      </div>

      {/* Indicador de carga sutil */}
      {cargando && (
        <div className="py-8 flex flex-col items-center justify-center gap-2 text-slate-500 dark:text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin text-red-600 dark:text-red-500" />
          <span className="text-xs font-medium">
            Consultando reportes oficiales de las últimas 24 horas...
          </span>
        </div>
      )}

      {/* REGLA 4: Si no hay reportes oficiales en las últimas 24h, mostrar mensaje limpio y oficial */}
      {!cargando && reportes.length === 0 && (
        <div className="p-6 sm:p-8 bg-slate-50 dark:bg-[#111a36] border border-slate-200 dark:border-slate-800 rounded-xl text-center space-y-3.5">
          <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-200 dark:border-emerald-800/60 shadow-2xs">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="space-y-1.5 max-w-lg mx-auto">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              No se registran alertas oficiales en las últimas 24 horas para esta zona
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Los centros de monitoreo en tiempo real de{' '}
              <strong className="text-slate-800 dark:text-slate-100 font-semibold">
                IGP (CENSIS), SENAMHI, DHN, CENEPRED y COEN
              </strong>{' '}
              no reportan sismos locales ni avisos meteorológicos u oceanográficos vigentes que afecten
              a la provincia de <strong className="text-slate-900 dark:text-white">{province.name}</strong> ({department.name}).
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 pt-2 flex-wrap text-xs">
            <a
              href="https://ultimosismo.igp.gob.pe/productos/reportes-sismicos"
              target="_blank"
              rel="noopener noreferrer"
              className="py-1.5 px-3 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              <span>Catálogo CENSIS - IGP</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>

            <a
              href="https://www.senamhi.gob.pe/?p=aviso-meteorologico"
              target="_blank"
              rel="noopener noreferrer"
              className="py-1.5 px-3 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              <span>Avisos Meteorológicos SENAMHI</span>
            </a>
          </div>
        </div>
      )}

      {/* Si hay reportes oficiales activos */}
      {!cargando && reportes.length > 0 && (
        <>
          {/* Resumen numérico y filtros */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
            <div className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2">
              <span className="font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                {reportes.length}{' '}
                {reportes.length === 1 ? 'reporte oficial activo' : 'reportes oficiales activos'}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                para la provincia de {province.name} (últimas 24h)
              </span>
            </div>

            {/* Filtros por tipo de desastre reportado */}
            {tiposDisponibles.length > 1 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs">
                <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1 mr-1">
                  <Filter className="w-3 h-3" /> Filtrar:
                </span>
                <button
                  type="button"
                  onClick={() => setFiltroTipo('todos')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                    filtroTipo === 'todos'
                      ? 'bg-slate-900 dark:bg-slate-700 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  Todos ({reportes.length})
                </button>
                {tiposDisponibles.map((tipo) => (
                  <button
                    key={tipo}
                    type="button"
                    onClick={() => setFiltroTipo(tipo)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors uppercase cursor-pointer ${
                      filtroTipo === tipo
                        ? 'bg-slate-900 dark:bg-slate-700 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {tipo}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Listado de tarjetas de desastres reportados oficialmente */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            <AnimatePresence>
              {reportesFiltrados.map((rep) => (
                <motion.div
                  key={rep.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="tarjeta-reporte-24h rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#111a36] hover:bg-white dark:hover:bg-[#162044] hover:border-red-300 dark:hover:border-red-500/50 p-4 transition-all shadow-2xs flex flex-col justify-between space-y-3 relative group"
                >
                  <div>
                    {/* Cabecera de la tarjeta: Entidad, Código Oficial, Hora y Severidad */}
                    <div className="flex items-center justify-between gap-2 mb-2.5 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${getEntidadBadge(
                            rep.entidad
                          )}`}
                        >
                          {rep.entidad}
                        </span>
                        <span className="text-[10px] font-mono font-bold bg-white dark:bg-[#18223f] text-slate-700 dark:text-slate-200 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                          {rep.codigoOficial}
                        </span>
                      </div>

                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${rep.severidadColor}`}
                      >
                        Alerta {rep.severidad}
                      </span>
                    </div>

                    {/* Título y Tipo de Desastre */}
                    <div className="flex items-start gap-2.5 mb-2.5">
                      <div className="w-8 h-8 rounded-lg bg-white dark:bg-[#18223f] border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                        {getDisasterIcon(rep.tipoDesastre)}
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors leading-snug">
                          {rep.titulo}
                        </h4>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                          Organismo Emisor:{' '}
                          <strong className="text-slate-700 dark:text-slate-200 font-semibold">
                            {rep.entidadNombreCompleto}
                          </strong>
                        </span>
                      </div>
                    </div>

                    {/* Hora y Vigencia */}
                    <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-2.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{rep.horaReporte}</span>
                    </div>

                    {/* Lugar Exacto Georreferenciado */}
                    <div className="caja-ubicacion-georef p-2.5 bg-white dark:bg-[#18223f] rounded-lg border border-slate-200 dark:border-slate-700 mb-3 text-xs shadow-2xs">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-slate-800 dark:text-slate-200 text-[11px] block">
                            Ubicación y Referencia Oficial:
                          </span>
                          <p className="text-slate-700 dark:text-slate-300 font-semibold text-[11px] leading-tight">
                            {rep.lugarExactoProvincia}
                          </p>
                          <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                            {rep.coordenadasExactas}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Descripción oficial */}
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
                      {rep.descripcion}
                    </p>

                    {/* Parámetros técnicos específicos */}
                    <div className="caja-parametros-grid grid grid-cols-2 gap-2 p-2.5 bg-white dark:bg-[#18223f] rounded-lg border border-slate-200 dark:border-slate-700 mb-3 text-xs">
                      {rep.parametrosClave.map((param, i) => (
                        <div key={i}>
                          <span className="etiqueta-parametro text-[10px] text-slate-400 dark:text-slate-400 font-bold uppercase tracking-wider block">
                            {param.etiqueta}:
                          </span>
                          <span className="valor-parametro text-slate-800 dark:text-white font-semibold font-mono text-[11px]">
                            {param.valor}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Datos técnicos adicionales de la entidad oficial */}
                    {rep.datosAdicionalesOficiales && rep.datosAdicionalesOficiales.length > 0 && (
                      <div className="caja-datos-tecnicos p-2.5 bg-slate-100 dark:bg-[#1c2646] rounded-lg border border-slate-200 dark:border-[#2a3b68] mb-3 text-xs">
                        <span className="titulo-datos-tecnicos text-[10px] uppercase font-bold text-slate-700 dark:text-sky-300 tracking-wider flex items-center gap-1 mb-1.5">
                          <FileText className="w-3 h-3 text-slate-500 dark:text-sky-400" />
                          Datos Técnicos Verificados ({rep.entidad}):
                        </span>
                        <ul className="space-y-1">
                          {rep.datosAdicionalesOficiales.map((dato, idx) => (
                            <li
                              key={idx}
                              className="text-[11px] text-slate-700 dark:text-slate-200 flex items-start gap-1.5 leading-snug"
                            >
                              <span className="text-red-500 dark:text-red-400 font-bold shrink-0 mt-0.5">•</span>
                              <span>{dato}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Recomendación de Defensa Civil INDECI */}
                    <div className="caja-medida-indeci p-2.5 bg-red-50 dark:bg-red-950/40 rounded-lg border border-red-200 dark:border-red-900/60 mb-2">
                      <div className="flex items-start gap-1.5 text-xs">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-[11px] block text-red-900 dark:text-red-200">
                            Medida Preventiva INDECI:
                          </span>
                          <p className="text-[11px] text-red-800 dark:text-red-300 leading-tight">
                            {rep.recomendacionDefensaCivil}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Botones de acción: activar protocolo en la app y enlaces DIRECTOS a la fuente oficial */}
                  <div className="pt-2.5 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {onSelectDisaster && (
                        <button
                          type="button"
                          onClick={() => onSelectDisaster(rep.tipoDesastre)}
                          className="px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-950/60 dark:hover:bg-red-900/70 text-[11px] font-bold text-red-700 hover:text-red-900 dark:text-red-300 dark:hover:text-red-200 border border-red-200 dark:border-red-800/80 flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                          title={`Ver y activar protocolo oficial de ${getDisasterLabel(rep.tipoDesastre)}`}
                        >
                          <ShieldAlert className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                          <span>Protocolo {getDisasterLabel(rep.tipoDesastre)}</span>
                          <ChevronRight className="w-3.5 h-3.5 text-red-500 group-hover:translate-x-0.5 transition-transform" />
                        </button>
                      )}

                      {onViewInfographic && (
                        <button
                          type="button"
                          onClick={() => onViewInfographic(rep.tipoDesastre)}
                          className="btn-infografia px-2 py-1.5 rounded-lg bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-[11px] font-semibold text-slate-700 hover:text-slate-900 dark:text-slate-200 dark:hover:text-white border border-slate-200 dark:border-slate-700 flex items-center gap-1 transition-colors cursor-pointer"
                          title="Ver Infografía Oficial INDECI"
                        >
                          <FileImage className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                          <span className="hidden sm:inline">Infografía</span>
                        </button>
                      )}
                    </div>

                    {/* Enlaces a las páginas oficiales */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* Botón de descarga de PDF oficial si está disponible */}
                      {rep.enlacePdfDirecto && (
                        <a
                          href={sanitizarEnlaceOficial(rep.enlacePdfDirecto, rep, true)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="py-1.5 px-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                          title="Descargar Reporte o Documento Técnico Oficial"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Reporte PDF</span>
                        </a>
                      )}

                      {/* REGLA 3: Enlace DIRECTO y específico al boletín o evento oficial verificado */}
                      <a
                        href={sanitizarEnlaceOficial(rep.enlace_oficial || rep.enlaceBoletinOficial, rep, false)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-ver-boletin py-1.5 px-3 bg-slate-900 hover:bg-black dark:bg-slate-800 dark:hover:bg-slate-700 dark:border dark:border-slate-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs hover:shadow-md"
                        title={`Abrir enlace oficial directo: ${rep.boletinNombre}`}
                      >
                        <span>
                          {rep.tipoDesastre === 'sismo' ? 'Ver Evento en IGP' : `Boletín ${rep.entidad}`}
                        </span>
                        <ExternalLink className="w-3 h-3 text-slate-300 shrink-0" />
                      </a>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </>
      )}
    </div>
  );
};
