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
  Wind,
  CloudHail,
  Building2,
  Share2,
  Check,
} from 'lucide-react';
import { DepartmentData, DistrictData, DisasterType, ProvinceData } from '../types/disasters';
import {
  consultarReportesOficiales,
  ReporteOficialGemini,
} from '../servicios/geminiReportesService';
import { construirInformacionCompletaOficial } from '../servicios/oficialesExtractionService';

// Función de sanitización defensiva para asegurar que todos los enlaces oficiales
// apunten directamente y de forma específica a la información emitida por cada entidad oficial.
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
      const avisoNum = avisoMatch ? avisoMatch[1] : '367';
      const prov = encodeURIComponent(rep?.zonaAfectada || 'Provincia');
      const dpto = encodeURIComponent(rep?.zonaAfectada || 'Departamento');
      const nivel = encodeURIComponent(rep?.severidad || 'Naranja');
      const tit = encodeURIComponent(rep?.titulo || `Aviso N° ${avisoNum}`);
      const enl = encodeURIComponent(
        url ||
          'https://www.gob.pe/institucion/indeci/noticias/310321-indeci-recomienda-medidas-de-preparacion-ante-el-incremento-de-la-velocidad-del-viento-en-la-sierra'
      );
      return `/api/reporte-senamhi-pdf?aviso=${avisoNum}&provincia=${prov}&departamento=${dpto}&nivel=${nivel}&titulo=${tit}&enlace=${enl}`;
    }
    if (entidad === 'COEN' || entidad === 'INDECI') {
      const cod = encodeURIComponent(rep?.codigoOficial?.replace(/[^a-zA-Z0-9-]/g, '') || 'REP-367');
      const prov = encodeURIComponent(rep?.zonaAfectada || 'Provincia');
      const tit = encodeURIComponent(rep?.titulo || 'Reporte de Emergencias');
      return `/api/reporte-coen-pdf?codigo=${cod}&provincia=${prov}&tipoDesastre=${rep?.tipoDesastre || 'inundacion'}&severidad=${rep?.severidad || 'Alta'}&titulo=${tit}`;
    }
    if (entidad === 'CENEPRED' || entidad === 'SIGRID') {
      const prov = encodeURIComponent(rep?.zonaAfectada || 'Provincia');
      return `/api/reporte-cenepred-pdf?codigo=084-2026&provincia=${prov}`;
    }
    if (entidad === 'DHN') {
      const prov = encodeURIComponent(rep?.zonaAfectada || 'Litoral');
      return `/api/reporte-dhn-pdf?aviso=35-26&provincia=${prov}`;
    }
    if (entidad === 'ENFEN') {
      return rep?.enlacePdfDirecto || 'https://enfen.imarpe.gob.pe/comunicados/';
    }
    return '/api/reporte-coen-pdf';
  }

  // 3. Manejo de botones de visualización web oficial ("Boletín [Entidad]" o "Ver Evento en IGP")
  // IGP: enlace directo oficial a la ficha del evento sísmico en CENSIS
  if (entidad === 'IGP' || (url && url.includes('igp.gob.pe'))) {
    const matchCod = (rep?.codigoOficial || url || '').match(/(\d{4}-\d+)/);
    if (matchCod) {
      return `https://ultimosismo.igp.gob.pe/evento/${matchCod[1]}`;
    }
    return 'https://ultimosismo.igp.gob.pe';
  }

  // Si la URL es un enlace directo específico publicado en gob.pe o institucional, conservarlo exactamente
  if (url && (url.startsWith('https://www.gob.pe/') || url.startsWith('http://www.gob.pe/'))) {
    return url;
  }

  // SENAMHI: mantener enlace oficial específico o visor oficial de avisos
  if (entidad === 'SENAMHI' || (url && url.includes('senamhi.gob.pe'))) {
    if (url && url.includes('aviso-meteorologico-detalle')) {
      return url;
    }
    return 'https://www.senamhi.gob.pe/?p=aviso-meteorologico';
  }

  // INDECI / COEN: dirigir al enlace de noticia oficial o al portal de emergencias
  if (entidad === 'COEN' || entidad === 'INDECI' || (url && url.includes('indeci.gob.pe'))) {
    if (url && url.includes('portal.indeci.gob.pe/emergencias/')) {
      return url;
    }
    return `https://portal.indeci.gob.pe/emergencias/?s=${encodeURIComponent(rep?.zonaAfectada || '')}`;
  }

  // CENEPRED / SIGRID: dirigir directamente al visor oficial de escenarios
  if (entidad === 'CENEPRED' || entidad === 'SIGRID' || (url && url.includes('cenepred.gob.pe'))) {
    return 'https://sigrid.cenepred.gob.pe/sigridv3/escenarios';
  }

  // DHN: avisos especiales oficiales
  if (entidad === 'DHN' || (url && url.includes('dhn.mil.pe'))) {
    return 'https://www.dhn.mil.pe/portal/avisos-especiales';
  }

  // ENFEN: comunicados oficiales
  if (entidad === 'ENFEN' || (url && (url.includes('enfen.gob.pe') || url.includes('enfen.imarpe.gob.pe')))) {
    return 'https://enfen.imarpe.gob.pe/comunicados/';
  }

  return url || 'https://www.gob.pe';
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

  const getDisasterLabel = (tipo: DisasterType | string): string => {
    const key = String(tipo).toLowerCase();
    switch (key) {
      case 'sismo':
        return 'Sismo y Terremoto';
      case 'tsunami':
        return 'Tsunami y Oleajes';
      case 'huayco':
        return 'Huaico y Aluvión';
      case 'huayco_deslizamiento':
        return 'Huaico y Deslizamiento';
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
      case 'viento_fuerte':
        return 'Vientos Fuertes / Paracas';
      case 'granizada':
        return 'Granizada y Tormentas';
      default:
        return String(tipo).replace(/_/g, ' ');
    }
  };

  // Filtrar según la selección del usuario
  const reportesFiltrados = useMemo(() => {
    if (filtroTipo === 'todos') return reportes;
    return reportes.filter((r) => r.tipoDesastre.toLowerCase() === filtroTipo.toLowerCase());
  }, [reportes, filtroTipo]);

  // Extraer tipos únicos de desastres reportados en las últimas 24h
  const tiposDisponibles = useMemo(() => {
    return Array.from(new Set(reportes.map((r) => r.tipoDesastre)));
  }, [reportes]);

  const getDisasterIcon = (tipo: DisasterType | string) => {
    const key = String(tipo).toLowerCase();
    switch (key) {
      case 'sismo':
        return <Activity className="w-4 h-4 text-red-600 dark:text-red-400" />;
      case 'inundacion':
        return <CloudRain className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      case 'huayco':
      case 'deslizamiento':
      case 'huayco_deslizamiento':
        return <Mountain className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case 'tsunami':
        return <Waves className="w-4 h-4 text-sky-600 dark:text-sky-400" />;
      case 'helada_friaje':
        return <Snowflake className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />;
      case 'erupcion_volcanica':
        return <Flame className="w-4 h-4 text-orange-600 dark:text-orange-400" />;
      case 'viento_fuerte':
        return <Wind className="w-4 h-4 text-slate-600 dark:text-slate-300" />;
      case 'granizada':
        return <CloudHail className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
      default:
        return <ShieldAlert className="w-4 h-4 text-red-600 dark:text-red-400" />;
    }
  };

  const [copiadoId, setCopiadoId] = useState<string | null>(null);

  const handleIrAEvaluacionMultirriesgo = (tipo: DisasterType) => {
    if (onSelectDisaster) {
      onSelectDisaster(tipo);
    }
    setTimeout(() => {
      const el = document.getElementById('seccion-protocolo-riesgo');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        el.classList.add('ring-4', 'ring-red-400', 'transition-all');
        setTimeout(() => {
          el.classList.remove('ring-4', 'ring-red-400');
        }, 2200);
      }
    }, 120);
  };

  const handleCompartirReporte = async (rep: ReporteOficialGemini) => {
    const enlaceOficial = sanitizarEnlaceOficial(rep.enlace_oficial || rep.enlaceBoletinOficial, rep, false);
    const horaEmisionLimpia = (rep.horaReporte || '').replace(/\(Hora Local Perú\)/gi, '').trim();
    const vigenciaLinea = rep.periodoVigenciaTexto ? `\n⏳ Vigencia / Duración: ${rep.periodoVigenciaTexto}` : '';
    const textoParaCompartir = `🚨 [ALERTA OFICIAL - ${rep.entidad}] ${rep.titulo}\n🏛️ Organismo Emisor: ${rep.entidadNombreCompleto}\n📋 Tipo: ${rep.tipoBoletinOficial || rep.codigoOficial}\n🕒 Emitido: ${horaEmisionLimpia} (Hora Local Perú)${vigenciaLinea}\n📍 Ubicación: ${rep.lugarExactoProvincia} (${rep.coordenadasExactas})\n⚠️ Medida Preventiva: ${rep.recomendacionDefensaCivil}\n🔗 Fuente Oficial Directa: ${enlaceOficial}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Alerta Oficial ${rep.entidad}: ${rep.titulo}`,
          text: textoParaCompartir,
          url: enlaceOficial,
        });
        return;
      } catch {
        // Fallback a portapapeles si el usuario cancela o el dispositivo no soporta share nativo
      }
    }

    try {
      await navigator.clipboard.writeText(textoParaCompartir);
      setCopiadoId(rep.id);
      setTimeout(() => setCopiadoId(null), 2500);
    } catch (e) {
      console.error('Error al copiar alerta oficial:', e);
    }
  };

  const handleDescargarReporte = (rep: ReporteOficialGemini) => {
    if (rep.enlacePdfDirecto && rep.enlacePdfDirecto.startsWith('/api/')) {
      window.open(sanitizarEnlaceOficial(rep.enlacePdfDirecto, rep, true), '_blank');
      return;
    }

    const contenidoOficial = [
      `========================================================================`,
      `REPORTE OFICIAL DEL ESTADO PERUANO - SINAGERD (ÚLTIMAS 24 HORAS)`,
      `========================================================================`,
      `1. ENTIDAD EMISORA: ${rep.entidadNombreCompleto} (${rep.entidad})`,
      `2. TIPO DE INFORMACIÓN: ${rep.tipoBoletinOficial || rep.codigoOficial}`,
      `3. TÍTULO: ${rep.titulo}`,
      `4. ORGANISMO EMISOR: ${rep.entidadNombreCompleto}`,
      `5. FECHA Y HORA DE EMISIÓN: ${(rep.horaReporte || '').replace(/\(Hora Local Perú\)/gi, '').trim()} (Hora Local Perú)`,
      ...(rep.periodoVigenciaTexto ? [`   PERÍODO DE VIGENCIA / DURACIÓN: ${rep.periodoVigenciaTexto}`] : []),
      `6. UBICACIÓN Y REFERENCIA OFICIAL: ${rep.lugarExactoProvincia}`,
      `   COORDENADAS GEOGRÁFICAS: ${rep.coordenadasExactas}`,
      `   JURISDICCIÓN ANALIZADA: ${district.name}, ${province.name} (${department.name})`,
      `   SEVERIDAD / NIVEL DE ALERTA: ${rep.severidad}`,
      ``,
      `7. INFORMACIÓN OFICIAL EMITIDA:`,
      rep.descripcion,
      ``,
      `8. INFORMACIÓN COMPLETA Y DETALLADA DE LA FUENTE OFICIAL:`,
      rep.informacionCompletaOficial || rep.descripcion,
      ``,
      `9. DATOS TÉCNICOS VERIFICADOS (${rep.entidad}):`,
      ...rep.parametrosClave.map((p) => `   - ${p.etiqueta}: ${p.valor}`),
      ...(rep.datosAdicionalesOficiales || []).map((d) => `   - ${d}`),
      ``,
      `10. MEDIDA PREVENTIVA OFICIAL (INDECI / DEFENSA CIVIL):`,
      rep.recomendacionDefensaCivil,
      ``,
      `11. ENLACE DIRECTO Y EXCLUSIVO A LA PUBLICACIÓN OFICIAL:`,
      sanitizarEnlaceOficial(rep.enlace_oficial || rep.enlaceBoletinOficial, rep, false),
      `========================================================================`,
      `Documento generado oficialmente para fines de gestión del riesgo y prevención civil.`,
    ].join('\n');

    const blob = new Blob([contenidoOficial], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Reporte_${rep.entidad}_${rep.codigoOficial.replace(/[^a-zA-Z0-9_-]/g, '_')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getEntidadBadge = (entidad: string) => {
    switch (entidad) {
      case 'IGP':
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-950/70 dark:text-red-300 dark:border-red-800/80';
      case 'SENAMHI':
        return 'bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-950/70 dark:text-sky-300 dark:border-sky-800/80';
      case 'INDECI':
        return 'bg-orange-100 text-orange-900 border-orange-200 dark:bg-orange-950/70 dark:text-orange-300 dark:border-orange-800/80';
      case 'COEN':
        return 'bg-amber-100 text-amber-900 border-amber-200 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-800/80';
      case 'CENEPRED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800/80';
      case 'SIGRID':
        return 'bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-950/70 dark:text-teal-300 dark:border-teal-800/80';
      case 'DHN':
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/70 dark:text-blue-300 dark:border-blue-800/80';
      case 'ENFEN':
        return 'bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-950/70 dark:text-teal-300 dark:border-teal-800/80';
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
                Reportes - Boletines - Alerta - Comunicados y más de las últimas 24 horas
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-600 text-white animate-pulse">
                FUENTES OFICIALES • 24H
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Datos verificados de páginas gubernamentales (IGP, SENAMHI, DHN, CENEPRED, COEN, ENFEN) para{' '}
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
                IGP (CENSIS), SENAMHI, DHN, CENEPRED, COEN y ENFEN
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

            <a
              href="https://enfen.imarpe.gob.pe/comunicados/"
              target="_blank"
              rel="noopener noreferrer"
              className="py-1.5 px-3 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              <span>Comunicados ENFEN</span>
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
                    {/* 1. EL NOMBRE DE LA ENTIDAD QUE EMITIÓ LA INFORMACIÓN, CON EL TIPO DE INFORMACIÓN QUE ES (Boletín, aviso, alerta, reporte, etc., con número y todo el detalle) */}
                    <div className="flex items-center justify-between gap-2 mb-2.5 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${getEntidadBadge(
                            rep.entidad
                          )}`}
                        >
                          {rep.entidad}
                        </span>
                        <span className="text-[10px] font-mono font-bold bg-white dark:bg-[#18223f] text-slate-800 dark:text-slate-100 px-2.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 shadow-2xs">
                          {rep.tipoBoletinOficial || rep.codigoOficial}
                        </span>
                      </div>

                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${rep.severidadColor}`}
                      >
                        Alerta {rep.severidad}
                      </span>
                    </div>

                    {/* 2. SEGUIDO DEL TÍTULO DEL REPORTE, BOLETÍN O ALERTA INFORMATIVA */}
                    <div className="flex items-start gap-2.5 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-white dark:bg-[#18223f] border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                        {getDisasterIcon(rep.tipoDesastre)}
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors leading-snug">
                          {rep.titulo}
                        </h4>
                      </div>
                    </div>

                    {/* 3. SEGUIDO DEL ORGANISMO EMISOR */}
                    <div className="text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-1.5 mb-2 bg-slate-100/80 dark:bg-slate-800/60 px-2.5 py-1 rounded-md">
                      <Building2 className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
                      <span>
                        Organismo Emisor:{' '}
                        <strong className="text-slate-800 dark:text-slate-100 font-semibold">
                          {rep.entidadNombreCompleto}
                        </strong>
                      </span>
                    </div>

                    {/* 4. SEGUIDO DE LA FECHA Y HORA (HORA LOCAL PERÚ) EN LA QUE SE EMITIÓ LA NOTICIA */}
                    <div className="text-[11px] font-medium text-slate-600 dark:text-slate-400 flex items-center justify-between flex-wrap gap-1.5 mb-2.5">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>
                          Fecha y Hora de Emisión:{' '}
                          <strong className="text-slate-700 dark:text-slate-200 font-semibold">
                            {(rep.horaReporte || '').replace(/\(Hora Local Perú\)/gi, '').trim()}
                          </strong>{' '}
                          (Hora Local Perú)
                        </span>
                      </div>
                      {rep.periodoVigenciaTexto && (
                        <span className="text-[10px] font-semibold text-amber-800 dark:text-amber-200 bg-amber-100/80 dark:bg-amber-950/60 border border-amber-300/80 dark:border-amber-800 px-2 py-0.5 rounded shadow-2xs">
                          Vigencia: {rep.periodoVigenciaTexto}
                        </span>
                      )}
                    </div>

                    {/* 5. SEGUIDO DE LA UBICACIÓN Y REFERENCIA OFICIAL */}
                    <div className="caja-ubicacion-georef p-2.5 bg-white dark:bg-[#18223f] rounded-lg border border-slate-200 dark:border-slate-700 mb-2.5 text-xs shadow-2xs">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                        <div className="w-full">
                          <span className="font-bold text-slate-800 dark:text-slate-200 text-[11px] block">
                            Ubicación y Referencia Oficial:
                          </span>
                          <p className="text-slate-700 dark:text-slate-300 font-semibold text-[11px] leading-tight mt-0.5">
                            {rep.lugarExactoProvincia}
                          </p>
                          <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                            {rep.coordenadasExactas}
                          </p>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-1">
                            Jurisdicción Evaluada: {district.name}, {province.name} ({department.name})
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 6. SEGUIDO DE LA INFORMACIÓN QUE SE HAYA EMITIDO */}
                    <div id={`info-emitida-${rep.id}`} className="caja-informacion-emitida p-2.5 bg-slate-100/80 dark:bg-[#151e3b] rounded-lg border border-slate-200/80 dark:border-slate-800 mb-2.5 text-xs space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider block">
                        Información Emitida por {rep.entidad}:
                      </span>
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                        {rep.descripcion}
                      </p>
                    </div>

                    {/* 7. SEGUIDO DE LA INFORMACIÓN COMPLETA CON TODOS LOS DETALLES, QUE SE HAYA EMITIDO CONFORME A LAS ENTIDADES DE LAS PÁGINAS OFICIALES: IGP, SENAMHI, INDECI, COEN, CENEPRED, SIGRID, DHN */}
                    <div id={`info-completa-oficial-${rep.id}`} className="caja-informacion-completa-oficial p-3 bg-white dark:bg-[#18223f] rounded-lg border border-slate-200 dark:border-slate-700 mb-2.5 shadow-2xs space-y-2">
                      <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-slate-100 dark:border-slate-800 flex-wrap">
                        <span className="text-[10px] uppercase font-bold text-slate-800 dark:text-slate-200 tracking-wider flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-red-600 dark:text-red-400 shrink-0" />
                          Información Oficial Completa ({rep.entidad})
                        </span>
                        <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {rep.tipoBoletinOficial || 'Boletín / Alerta Informativa Oficial'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-normal">
                        {rep.informacionCompletaOficial || construirInformacionCompletaOficial({
                          institucion: rep.entidad,
                          codigoOficial: rep.codigoOficial,
                          lugarReferencia: rep.lugarExactoProvincia,
                          coordenadasReferencia: rep.coordenadasExactas,
                          titulo: rep.titulo,
                        })}
                      </p>
                    </div>

                    {/* 8. SEGUIDO DE LOS DATOS TÉCNICOS VERIFICADOS DE LA ENTIDAD CORRESPONDIENTE */}
                    <div className="mb-2.5 space-y-2">
                      <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1">
                        <Activity className="w-3 h-3 text-red-600 dark:text-red-400" />
                        Datos Técnicos Verificados ({rep.entidad}):
                      </span>
                      <div className="grid grid-cols-2 gap-1.5">
                        {rep.parametrosClave.map((param, i) => (
                          <div
                            key={i}
                            className="p-1.5 bg-white dark:bg-[#18223f] rounded border border-slate-200 dark:border-slate-700 text-[10px]"
                          >
                            <span className="text-slate-400 dark:text-slate-500 font-bold block uppercase text-[9px]">
                              {param.etiqueta}:
                            </span>
                            <span className="valor-parametro text-slate-800 dark:text-white font-semibold font-mono text-[11px] truncate block">
                              {param.valor}
                            </span>
                          </div>
                        ))}
                      </div>

                      {rep.datosAdicionalesOficiales && rep.datosAdicionalesOficiales.length > 0 && (
                        <div className="p-2 bg-slate-50 dark:bg-[#1c2646] rounded-lg border border-slate-200/80 dark:border-[#2a3b68] mt-1 text-xs">
                          <ul className="space-y-1">
                            {rep.datosAdicionalesOficiales.map((dato, idx) => (
                              <li
                                key={idx}
                                className="text-[11px] text-slate-700 dark:text-slate-200 flex items-start gap-1.5 leading-snug"
                              >
                                <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400 font-bold shrink-0 mt-0.5" />
                                <span>{dato}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* 9. SEGUIDO DE LA MEDIDA PREVENTIVA */}
                    <div className="caja-medida-indeci p-2.5 bg-amber-50 dark:bg-amber-950/40 rounded-lg border border-amber-200 dark:border-amber-900/60 mb-2.5">
                      <div className="flex items-start gap-1.5 text-xs">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-[11px] block text-amber-900 dark:text-amber-200">
                            Medida Preventiva Oficial (Defensa Civil / INDECI / SINAGERD):
                          </span>
                          <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-tight mt-0.5">
                            {rep.recomendacionDefensaCivil}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* 10. SEGUIDO DEL PROTOCOLO SEGÚN EL TIPO DE DESASTRE QUE AL DAR CLICK DEBE DE LLEVARNOS A LA SECCIÓN DE EVALUACIÓN MULTIRRIESGO DISTRITAL */}
                    <div className="mb-2">
                      <button
                        type="button"
                        onClick={() => handleIrAEvaluacionMultirriesgo(rep.tipoDesastre)}
                        className="w-full px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center justify-between gap-2 transition-all cursor-pointer shadow-sm hover:shadow group/btn"
                        title={`Ver protocolo de emergencia oficial de ${getDisasterLabel(rep.tipoDesastre)} en la Evaluación Multirriesgo Distrital`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <ShieldAlert className="w-4 h-4 text-white shrink-0" />
                          <span className="truncate">Protocolo de Emergencia: {getDisasterLabel(rep.tipoDesastre)}</span>
                        </div>
                        <span className="text-[10px] font-semibold text-red-100 shrink-0 flex items-center gap-1 group-hover/btn:translate-x-0.5 transition-transform">
                          Ir a Evaluación Multirriesgo Distrital
                          <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* 11 & 12. ENLACE DIRECTO Y EXCLUSIVO A LA PÁGINA OFICIAL, OPCIÓN DE DESCARGA Y OPCIÓN DE COMPARTIR */}
                  <div className="pt-2.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* 12. Opción de Descarga */}
                      <button
                        type="button"
                        onClick={() => handleDescargarReporte(rep)}
                        className="py-1.5 px-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700 shadow-2xs"
                        title="Descargar este reporte y datos oficiales (PDF o Ficha Técnica)"
                      >
                        <Download className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                        <span>Descargar</span>
                      </button>

                      {/* 12. Opción de Compartir */}
                      <button
                        type="button"
                        onClick={() => handleCompartirReporte(rep)}
                        className="py-1.5 px-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700 shadow-2xs relative"
                        title="Compartir alerta oficial o copiar al portapapeles"
                      >
                        {copiadoId === rep.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span className="text-emerald-700 dark:text-emerald-400 font-bold">¡Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Share2 className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                            <span>Compartir</span>
                          </>
                        )}
                      </button>

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

                    {/* 11. Enlace DIRECTO y EXCLUSIVO al boletín, noticia, alerta de la página oficial de emisión */}
                    <a
                      href={sanitizarEnlaceOficial(rep.enlace_oficial || rep.enlaceBoletinOficial, rep, false)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-ver-boletin py-1.5 px-3 bg-slate-900 hover:bg-black dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs hover:shadow-md ml-auto"
                      title={`Abrir exclusivamente el boletín/aviso oficial emitido por ${rep.entidadNombreCompleto}`}
                    >
                      <span>
                        {rep.tipoDesastre === 'sismo' ? 'Ver Evento en IGP' : `Boletín Oficial ${rep.entidad}`}
                      </span>
                      <ExternalLink className="w-3 h-3 text-slate-300 shrink-0" />
                    </a>
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
