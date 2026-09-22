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
  AlertCircle,
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
  ChevronDown,
  Layers,
  Compass,
} from 'lucide-react';
import { DepartmentData, DistrictData, DisasterType, ProvinceData } from '../types/disasters';
import {
  consultarReportesOficiales,
  consultarReportes24hRegion,
  ReporteOficialGemini,
} from '../servicios/geminiReportesService';
import { construirInformacionCompletaOficial, tieneAccesoMaritimo } from '../servicios/oficialesExtractionService';
import { verificarSismosEnRegion24h, EventoSismicoDetectado } from '../servicios/monitoreoSismico';

// Orden oficial estricto especificado por el usuario
const ORDEN_OFICIAL_ENTIDADES: readonly string[] = [
  'IGP',
  'SENAMHI',
  'INDECI',
  'COEN',
  'ENFEN',
  'CENEPRED',
  'DHN',
  'SIGRID',
];

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
  // Pestaña activa: "distrito_provincia" o "region"
  const [vistaActiva, setVistaActiva] = useState<'distrito_provincia' | 'region'>('distrito_provincia');

  const [reportesLocal, setReportesLocal] = useState<ReporteOficialGemini[]>([]);
  const [reportesRegion, setReportesRegion] = useState<ReporteOficialGemini[]>([]);
  const [cargandoLocal, setCargandoLocal] = useState<boolean>(true);
  const [cargandoRegion, setCargandoRegion] = useState<boolean>(true);
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');
  const [detallesExpandidos, setDetallesExpandidos] = useState<Record<string, boolean>>({});

  // Carga de reportes locales filtrados por provincia y distrito
  useEffect(() => {
    let isMounted = true;
    setCargandoLocal(true);

    consultarReportesOficiales(district, province, department)
      .then((data) => {
        if (isMounted) {
          setReportesLocal(data);
          setCargandoLocal(false);
        }
      })
      .catch((err) => {
        console.error('Error al obtener reportes oficiales de distrito/provincia 24h:', err);
        if (isMounted) {
          setReportesLocal([]);
          setCargandoLocal(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [district.name, province.name, department.name, district.lat, district.lng]);

  // Carga de reportes netamente de la región (departamento) en las últimas 24 horas
  useEffect(() => {
    let isMounted = true;
    setCargandoRegion(true);

    consultarReportes24hRegion(department, province, district)
      .then((data) => {
        if (isMounted) {
          setReportesRegion(data);
          setCargandoRegion(false);
        }
      })
      .catch((err) => {
        console.error('Error al obtener reportes oficiales de la región 24h:', err);
        if (isMounted) {
          setReportesRegion([]);
          setCargandoRegion(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [district.name, province.name, department.name, district.lat, district.lng]);

  // Monitoreo estricto de sismos en la región (departamento) en las últimas 24 horas:
  // El icono de admiración que late de reporte de las últimas 24 horas se activa si hay sismo en su región en las últimas 24 horas.
  const [sismosRegion24h, setSismosRegion24h] = useState<EventoSismicoDetectado[]>([]);
  const haySismoEnRegion24h = sismosRegion24h.length > 0;

  useEffect(() => {
    let isMounted = true;
    verificarSismosEnRegion24h(department.name)
      .then((eventos) => {
        if (isMounted) {
          setSismosRegion24h(eventos);
        }
      })
      .catch((err) => {
        console.error('Error al verificar sismos en la región 24h:', err);
        if (isMounted) setSismosRegion24h([]);
      });

    // Reverificar periódicamente cada 60 segundos
    const interval = setInterval(() => {
      verificarSismosEnRegion24h(department.name)
        .then((eventos) => {
          if (isMounted) setSismosRegion24h(eventos);
        })
        .catch(() => {});
    }, 60000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [department.name]);

  const reportesActuales = vistaActiva === 'distrito_provincia' ? reportesLocal : reportesRegion;
  const cargando = vistaActiva === 'distrito_provincia' ? cargandoLocal : cargandoRegion;

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

  // Ordenar estrictamente según las entidades solicitadas:
  // IGP, SENAMHI, INDECI, COEN, ENFEN, CENEPRED, DHN y SIGRID
  const reportesFiltrados = useMemo(() => {
    const vistosId = new Set<string>();
    const vistosTitulos = new Set<string>();
    const unicos = reportesActuales.filter((r) => {
      const idLimpio = String(r.id || '').trim();
      const tituloNorm = String(r.titulo || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      const clave = `${r.entidad}_${tituloNorm}`;

      if (vistosId.has(idLimpio) || vistosTitulos.has(clave)) {
        return false;
      }
      vistosId.add(idLimpio);
      vistosTitulos.add(clave);
      return true;
    });

    // Ordenamiento por el orden estricto de entidades
    const ordenados = [...unicos].sort((a, b) => {
      const idxA = ORDEN_OFICIAL_ENTIDADES.indexOf(a.entidad);
      const idxB = ORDEN_OFICIAL_ENTIDADES.indexOf(b.entidad);
      const posA = idxA === -1 ? 99 : idxA;
      const posB = idxB === -1 ? 99 : idxB;
      if (posA !== posB) return posA - posB;
      return (b.fechaHoraRegistroIso || '').localeCompare(a.fechaHoraRegistroIso || '');
    });

    if (filtroTipo === 'todos') return ordenados;
    return ordenados.filter((r) => r.tipoDesastre.toLowerCase() === filtroTipo.toLowerCase());
  }, [reportesActuales, filtroTipo]);

  // Extraer tipos únicos de desastres reportados en las últimas 24h
  const tiposDisponibles = useMemo(() => {
    return Array.from(new Set(reportesActuales.map((r) => r.tipoDesastre)));
  }, [reportesActuales]);

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

  const toggleDetalles = (id: string) => {
    setDetallesExpandidos((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

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
    const ref = rep.referenciaOficial || rep.lugarExactoProvincia || `${district.name}, ${province.name} - ${department.name}`;
    const fechaHora = rep.fechaHoraOrigenLocal || rep.horaReporte;
    const coords = rep.latitudLongitud || rep.coordenadasExactas;
    const prof = rep.profundidadTexto || (rep.entidad === 'IGP' ? '30 km' : 'Superficie (0 km)');
    const intensidad = rep.intensidadMaxima || `II-III ${district.name}`;
    const medida = rep.recomendacionDefensaCivil;

    const textoParaCompartir = [
      `🚨 [ALERTA OFICIAL - ${rep.entidad}]`,
      `- Nombre de la entidad: ${rep.entidad} (${rep.entidadNombreCompleto})`,
      `Referencia: ${ref}`,
      `Fecha y hora origen local: ${fechaHora}`,
      `Latitud y Longitud (º): ${coords}`,
      `Profundidad: ${prof}`,
      `Intensidad máxima (MM): ${intensidad}`,
      `Medida Preventiva Oficial (Defensa Civil / INDECI / SINAGERD): ${medida}`,
      `Protocolo de Emergencia: ${getDisasterLabel(rep.tipoDesastre)}`,
      `Enlace directo oficial: ${enlaceOficial}`,
    ].join('\n');

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Alerta Oficial ${rep.entidad}: ${rep.titulo}`,
          text: textoParaCompartir,
          url: enlaceOficial,
        });
        return;
      } catch {
        // Fallback a portapapeles
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

    const ref = rep.referenciaOficial || rep.lugarExactoProvincia || `${district.name}, ${province.name} - ${department.name}`;
    const fechaHora = rep.fechaHoraOrigenLocal || rep.horaReporte;
    const coords = rep.latitudLongitud || rep.coordenadasExactas;
    const prof = rep.profundidadTexto || (rep.entidad === 'IGP' ? '30 km' : 'Superficie (0 km)');
    const intensidad = rep.intensidadMaxima || `II-III ${district.name}`;
    const medida = rep.recomendacionDefensaCivil;
    const enlaceOficial = sanitizarEnlaceOficial(rep.enlace_oficial || rep.enlaceBoletinOficial, rep, false);

    const contenidoOficial = [
      `========================================================================`,
      `REPORTE OFICIAL DEL ESTADO PERUANO - SINAGERD (ÚLTIMAS 24 HORAS)`,
      `========================================================================`,
      `- Nombre de la entidad: ${rep.entidad} (${rep.entidadNombreCompleto})`,
      `Referencia:`,
      `${ref}`,
      `Fecha y hora origen local:`,
      `${fechaHora}`,
      `Latitud y Longitud (º):`,
      `${coords}`,
      `Profundidad:`,
      `${prof}`,
      `Intensidad máxima (MM):`,
      `${intensidad}`,
      `Medida Preventiva Oficial (Defensa Civil / INDECI / SINAGERD):`,
      `${medida}`,
      `Protocolo de Emergencia:`,
      `${getDisasterLabel(rep.tipoDesastre)}`,
      `Enlace directo al reporte emitido por la entidad competente:`,
      `${enlaceOficial}`,
      `========================================================================`,
      `DESCRIPCIÓN Y DETALLES OFICIALES:`,
      rep.informacionCompletaOficial || rep.descripcion,
      `========================================================================`,
      `Documento oficial para la gestión reactiva y preventiva del riesgo de desastres.`,
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

  const esCostera = useMemo(
    () => tieneAccesoMaritimo(department.name, province.name),
    [department.name, province.name]
  );
  const institucionesTexto = esCostera
    ? 'IGP, SENAMHI, INDECI, COEN, ENFEN, CENEPRED, DHN y SIGRID'
    : 'IGP, SENAMHI, INDECI, COEN, ENFEN, CENEPRED y SIGRID';

  return (
    <div
      id="seccion-reporte-24-horas"
      className="w-full bg-white dark:bg-[#0b132b] border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-6 shadow-sm space-y-4 transition-colors"
    >
      {/* Encabezado principal de la sección de 24 Horas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-start sm:items-center gap-3">
          {/* Icono de admiración que late de reporte de las últimas 24 horas: se activa si hay sismo en su región en las últimas 24 horas */}
          <div className="relative">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border transition-all ${
                haySismoEnRegion24h
                  ? 'bg-red-600 text-white border-red-500 shadow-md ring-4 ring-red-400/40 animate-pulse'
                  : 'bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-900 text-red-600 dark:text-red-400'
              }`}
            >
              {haySismoEnRegion24h ? (
                <AlertCircle className="w-5 h-5 text-white animate-bounce" />
              ) : (
                <Clock className="w-5 h-5" />
              )}
            </div>
            {haySismoEnRegion24h && (
              <span
                className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-600 border-2 border-white dark:border-[#0b132b] flex items-center justify-center animate-ping"
                title="¡Sismo detectado en su región en las últimas 24 horas!"
              />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                Reportes - Boletines - Alerta - Comunicados y más de las últimas 24 horas
              </h3>

              {/* Icono de admiración que late: se activa si hay sismo en su región en las últimas 24 horas */}
              {haySismoEnRegion24h ? (
                <button
                  type="button"
                  onClick={() => {
                    setVistaActiva('region');
                    setFiltroTipo('sismo');
                  }}
                  className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-600 hover:bg-red-700 text-white shadow-sm ring-2 ring-red-300 dark:ring-red-700 flex items-center gap-1.5 animate-pulse cursor-pointer transition-colors"
                  title={`¡Sismo detectado en la región ${department.name} en las últimas 24 horas! Clic para ver reporte IGP.`}
                >
                  <AlertCircle className="w-3.5 h-3.5 text-white shrink-0 animate-bounce" />
                  <span>¡SISMO EN SU REGIÓN (24H)!</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping shrink-0" />
                </button>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-600 text-white animate-pulse">
                  FUENTES OFICIALES • 24H
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Información oficial relevante de: <strong>IGP, SENAMHI, INDECI, COEN, ENFEN, CENEPRED, DHN y SIGRID</strong>.
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

      {/* Pestañas de navegación: Provincia/Distrito vs Sección de la Región */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 overflow-x-auto">
        <button
          type="button"
          onClick={() => {
            setVistaActiva('distrito_provincia');
            setFiltroTipo('todos');
          }}
          className={`flex-1 min-w-[240px] py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            vistaActiva === 'distrito_provincia'
              ? 'bg-white dark:bg-[#18223f] text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-slate-700'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <MapPin className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
          <span className="truncate">
            Filtro Local 24h: {district.name}, {province.name}
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
            {reportesLocal.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setVistaActiva('region');
            setFiltroTipo('todos');
          }}
          className={`flex-1 min-w-[260px] py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer relative ${
            vistaActiva === 'region'
              ? 'bg-white dark:bg-[#18223f] text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-slate-700'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          {haySismoEnRegion24h ? (
            <span className="relative flex items-center justify-center">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 animate-bounce shrink-0" />
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-600 animate-ping" />
            </span>
          ) : (
            <Compass className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
          )}
          <span className="truncate">
            Reportes de las últimas 24 horas de la región ({department.name})
          </span>
          {haySismoEnRegion24h && (
            <span className="px-1.5 py-0.5 text-[9px] font-black uppercase rounded bg-red-600 text-white animate-pulse">
              ¡Sismo 24h!
            </span>
          )}
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
            {reportesRegion.length}
          </span>
        </button>
      </div>

      {/* Banner de Sismo Regional en las últimas 24h (activado cuando hay sismo en la región) */}
      {haySismoEnRegion24h && vistaActiva === 'region' && (
        <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl flex items-start justify-between gap-3 text-xs shadow-2xs">
          <div className="flex items-start gap-2.5">
            <div className="p-2 rounded-lg bg-red-600 text-white shrink-0 mt-0.5 animate-pulse">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-black text-red-800 dark:text-red-200 text-xs uppercase tracking-wide">
                  Actividad Sísmica Instrumental Registrada en las Últimas 24 Horas
                </span>
                <span className="px-2 py-0.5 bg-red-600 text-white font-bold text-[10px] rounded uppercase animate-pulse">
                  IGP • CENSIS
                </span>
              </div>
              <p className="text-red-700 dark:text-red-300 text-xs">
                El Centro Sismológico Nacional (CENSIS - IGP) registró {sismosRegion24h.length}{' '}
                {sismosRegion24h.length === 1 ? 'evento sísmico' : 'eventos sísmicos'} en la región{' '}
                <strong>{department.name}</strong> en las últimas 24 horas:
              </p>
              <div className="pt-1 space-y-1">
                {sismosRegion24h.map((s, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 text-[11px] font-mono font-semibold text-red-900 dark:text-red-100 bg-white/80 dark:bg-red-950/60 p-2 rounded-lg border border-red-200 dark:border-red-900/70"
                  >
                    <span className="font-bold text-red-600 dark:text-red-400">M {s.magnitud.toFixed(1)}</span>
                    <span>•</span>
                    <span>{s.fechaHoraLocal}</span>
                    <span>•</span>
                    <span className="truncate">{s.referencia}</span>
                    <span className="text-[10px] text-slate-500 font-sans ml-auto">Prof: {s.profundidad} km</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Indicador de carga sutil */}
      {cargando && (
        <div className="py-8 flex flex-col items-center justify-center gap-2 text-slate-500 dark:text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin text-red-600 dark:text-red-500" />
          <span className="text-xs font-medium">
            {vistaActiva === 'distrito_provincia'
              ? `Consultando reportes oficiales para ${district.name} y ${province.name}...`
              : `Consultando reportes oficiales de las últimas 24 horas para la región ${department.name}...`}
          </span>
        </div>
      )}

      {/* Si no hay reportes oficiales en las últimas 24h, mostrar mensaje limpio y oficial */}
      {!cargando && reportesActuales.length === 0 && (
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
                {institucionesTexto}
              </strong>{' '}
              no reportan eventos críticos vigentes durante las últimas 24 horas para{' '}
              <strong className="text-slate-900 dark:text-white">
                {vistaActiva === 'distrito_provincia'
                  ? `${district.name} (${province.name}, ${department.name})`
                  : `la región ${department.name}`}
              </strong>.
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
      {!cargando && reportesActuales.length > 0 && (
        <>
          {/* Resumen numérico y filtros */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
            <div className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2">
              <span className="font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                {reportesFiltrados.length}{' '}
                {reportesFiltrados.length === 1 ? 'reporte oficial' : 'reportes oficiales'}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                {vistaActiva === 'distrito_provincia'
                  ? `filtro estricto provincia y distrito (${district.name}, ${province.name})`
                  : `eventos netamente ocurridos en la región ${department.name}`}
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
                  Todos ({reportesActuales.length})
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

          {/* Listado de tarjetas en el orden estricto de las 8 entidades oficiales */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            <AnimatePresence>
              {reportesFiltrados.map((rep) => {
                const ref = rep.referenciaOficial || rep.lugarExactoProvincia || `${district.name}, ${province.name} - ${department.name}`;
                const fechaHora = rep.fechaHoraOrigenLocal || rep.horaReporte;
                const coords = rep.latitudLongitud || rep.coordenadasExactas;
                const prof = rep.profundidadTexto || (rep.entidad === 'IGP' ? '30 km' : 'Superficie / Nivel de Terreno (0 km)');
                const intensidad = rep.intensidadMaxima || (rep.entidad === 'IGP' ? `II-III ${district.name}` : `Nivel ${rep.severidad} - ${district.name}`);
                const isExpandido = Boolean(detallesExpandidos[rep.id]);

                return (
                  <motion.div
                    key={rep.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="tarjeta-reporte-24h rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#111a36] hover:bg-white dark:hover:bg-[#162044] hover:border-red-300 dark:hover:border-red-500/50 p-4 transition-all shadow-2xs flex flex-col justify-between space-y-3 relative group"
                  >
                    <div className="space-y-2.5">
                      {/* 1. NOMBRE DE LA ENTIDAD: IGP, SENAMHI, INDECI, COEN, ENFEN, CENEPRED, DHN y SIGRID */}
                      <div className="flex items-center justify-between gap-2 flex-wrap pb-2 border-b border-slate-200 dark:border-slate-800">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                            Nombre de la entidad:
                          </span>
                          <span
                            className={`text-xs font-black px-2.5 py-0.5 rounded border uppercase tracking-wider ${getEntidadBadge(
                              rep.entidad
                            )}`}
                          >
                            {rep.entidad}
                          </span>
                          <span className="text-[11px] text-slate-700 dark:text-slate-200 font-semibold truncate max-w-[220px]">
                            {rep.entidadNombreCompleto}
                          </span>
                        </div>

                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${rep.severidadColor}`}
                        >
                          {rep.severidad}
                        </span>
                      </div>

                      {/* 2. REFERENCIA */}
                      <div className="bg-white dark:bg-[#18223f] p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                        <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider block">
                          Referencia:
                        </span>
                        <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                          {ref}
                        </p>
                      </div>

                      {/* 3. FECHA Y HORA ORIGEN LOCAL */}
                      <div className="bg-slate-100/90 dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
                        <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider block">
                          Fecha y hora origen local:
                        </span>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 font-mono mt-0.5">
                          {fechaHora}
                        </p>
                      </div>

                      {/* 4. LATITUD Y LONGITUD (º) */}
                      <div className="bg-white dark:bg-[#18223f] p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
                        <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider block">
                          Latitud y Longitud (º):
                        </span>
                        <p className="text-xs font-mono font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                          {coords}
                        </p>
                      </div>

                      {/* 5. PROFUNDIDAD */}
                      <div className="bg-slate-100/90 dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
                        <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider block">
                          Profundidad:
                        </span>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                          {prof}
                        </p>
                      </div>

                      {/* 6. INTENSIDAD MÁXIMA (MM) */}
                      <div className="bg-white dark:bg-[#18223f] p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
                        <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider block">
                          Intensidad máxima (MM):
                        </span>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                          {intensidad}
                        </p>
                      </div>

                      {/* 7. MEDIDA PREVENTIVA OFICIAL (DEFENSA CIVIL / INDECI / SINAGERD) */}
                      <div className="caja-medida-indeci p-2.5 bg-amber-50 dark:bg-amber-950/40 rounded-lg border border-amber-200 dark:border-amber-900/60 text-xs">
                        <div className="flex items-start gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-[11px] block text-amber-900 dark:text-amber-200">
                              Medida Preventiva Oficial (Defensa Civil / INDECI / SINAGERD):
                            </span>
                            <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-tight mt-0.5">
                              {rep.recomendacionDefensaCivil || 'Mantener la calma, ubicarse en la zona segura interna y revisar la mochila de emergencia.'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* 8. PROTOCOLO DE EMERGENCIA: [TIPO] E IR A EVALUACIÓN MULTIRRIESGO DISTRITAL */}
                      <div>
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

                      {/* Botón desplegable para ver detalles oficiales completos y parámetros técnicos */}
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() => toggleDetalles(rep.id)}
                          className="w-full py-1.5 px-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded text-[11px] font-semibold flex items-center justify-between transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
                        >
                          <span className="flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                            {isExpandido ? 'Ocultar detalles oficiales completos' : 'Ver detalles oficiales completos emitidos'}
                          </span>
                          <ChevronDown
                            className={`w-3.5 h-3.5 transition-transform ${isExpandido ? 'rotate-180' : ''}`}
                          />
                        </button>

                        {isExpandido && (
                          <div className="mt-2 p-3 bg-white dark:bg-[#18223f] rounded-lg border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                                Información Oficial Completa ({rep.entidad}):
                              </span>
                              <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed mt-1">
                                {rep.informacionCompletaOficial || rep.descripcion}
                              </p>
                            </div>

                            {rep.parametrosClave && rep.parametrosClave.length > 0 && (
                              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                                  Parámetros Técnicos Verificados:
                                </span>
                                <div className="grid grid-cols-2 gap-1.5">
                                  {rep.parametrosClave.map((param, i) => (
                                    <div
                                      key={i}
                                      className="p-1.5 bg-slate-50 dark:bg-[#131b33] rounded border border-slate-200 dark:border-slate-700 text-[10px]"
                                    >
                                      <span className="text-slate-400 dark:text-slate-500 font-bold block uppercase text-[9px]">
                                        {param.etiqueta}:
                                      </span>
                                      <span className="text-slate-800 dark:text-white font-semibold font-mono text-[11px] truncate block">
                                        {param.valor}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 9. OPCIÓN DE DESCARGA Y COMPARTIR EL INFORME, INFOGRAFÍA */}
                    {/* 10. ENLACE DIRECTO AL REPORTE EMITIDO POR LA ENTIDAD COMPETENTE */}
                    <div className="pt-2.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* Opción de Descarga */}
                        <button
                          type="button"
                          onClick={() => handleDescargarReporte(rep)}
                          className="py-1.5 px-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700 shadow-2xs"
                          title="Descargar este reporte y datos oficiales (PDF o Ficha Técnica)"
                        >
                          <Download className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                          <span>Descargar</span>
                        </button>

                        {/* Opción de Compartir */}
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

                        {/* Infografía */}
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

                      {/* Enlace directo al reporte emitido por la entidad competente */}
                      <a
                        href={sanitizarEnlaceOficial(rep.enlace_oficial || rep.enlaceBoletinOficial, rep, false)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-ver-boletin py-1.5 px-3 bg-slate-900 hover:bg-black dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs hover:shadow-md ml-auto"
                        title={`Abrir exclusivamente el reporte oficial emitido por ${rep.entidadNombreCompleto}`}
                      >
                        <span>
                          {rep.tipoDesastre === 'sismo' ? 'Ver Evento en IGP' : `Reporte Oficial ${rep.entidad}`}
                        </span>
                        <ExternalLink className="w-3 h-3 text-slate-300 shrink-0" />
                      </a>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </>
      )}
    </div>
  );
};
