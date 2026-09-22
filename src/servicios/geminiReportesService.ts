/**
 * ============================================================================
 * Servicio de Formateo y Validación Inteligente con Gemini AI
 * Archivo: src/servicios/geminiReportesService.ts
 * 
 * Rol de Gemini AI:
 * Actúa ÚNICAMENTE como el formateador inteligente para estructurar y validar
 * el JSON final que alimenta a las tarjetas de la interfaz frontend.
 * 
 * Fuentes sincronizadas (7 instituciones oficiales de desastres naturales en Perú):
 * 1. IGP (Sismos en tiempo real - https://igp.gob.pe[AÑO]-[ID_DEL_EVENTO])
 * 2. SENAMHI (Avisos Meteorológicos e Hidrológicos - https://senamhi.gob.pe[AÑO][NÚMERO_AVISO])
 * 3. INDECI y COEN (Reportes de Emergencia Nacional - https://indeci.gob.pe[NOMBRE_DEL_REPORTE].pdf)
 * 4. CENEPRED y SIGRID (Alertas y Escenarios de Riesgo - https://cenepred.gob.pe)
 * 5. DHN (Alertas de Tsunami y Oleaje - https://dhn.mil.pe[ARCHIVO].pdf)
 * 
 * Cumple con:
 * - Filtro Estricto de 24 Horas: Eliminación automática de eventos mayores a 24 horas.
 * - Sincronización Geográfica: Cruce con Departamento y Provincia del usuario.
 * - Control de Vacío y Cero Alucinaciones: Retorno de [] si no hay alertas reales.
 * ============================================================================
 */

import { DepartmentData, DistrictData, DisasterType, ProvinceData } from '../types/disasters';
import {
  AlertaOficialCruda,
  CriteriosUbicacion,
  construirInformacionCompletaOficial,
  extraerAlertas8Instituciones,
} from './oficialesExtractionService';

export interface ParametroClave {
  etiqueta: string;
  valor: string;
}

export interface ReporteOficialGemini {
  id: string;
  tipoDesastre: DisasterType;
  codigoOficial: string;
  titulo: string;
  entidad: 'IGP' | 'SENAMHI' | 'COEN' | 'INDECI' | 'CENEPRED' | 'SIGRID' | 'DHN' | 'ENFEN';
  entidadNombreCompleto: string;
  entidadUrl: string;
  enlace_oficial: string; // Enlace directo obligatorio
  enlaceBoletinOficial: string;
  enlacePdfDirecto?: string;
  enlaceCatalogoOficial?: string;
  horaReporte: string;
  fechaHoraRegistroIso?: string;
  haceCuanto: string;
  severidad: 'Extrema' | 'Alta' | 'Moderada' | 'Informativa';
  severidadColor: string;
  lugarExactoProvincia: string;
  coordenadasExactas: string;
  descripcion: string;
  parametrosClave: ParametroClave[];
  datosAdicionalesOficiales: string[];
  zonaAfectada: string;
  recomendacionDefensaCivil: string;
  boletinNombre: string;
  esSismoReal?: boolean;
  tipoBoletinOficial?: string;
  informacionCompletaOficial?: string;
  periodoVigenciaTexto?: string;
  esLocal?: boolean;
  distanciaKmUsuario?: number;
}

export interface ConsultaReportesPayload {
  departamento: string;
  provincia: string;
  distrito: string;
  lat: number;
  lng: number;
  altitudeMeters: number;
  regionNatural: 'Costa' | 'Sierra' | 'Selva';
  currentTimeIso: string;
}

/**
 * System Instructions de Gemini como formateador inteligente estricto
 */
export const GEMINI_FORMATTER_INSTRUCTION = `Eres el Formateador y Validador Inteligente Oficial de Alertas de Desastres del Perú.
Tu única función es estructurar y validar el JSON final para las tarjetas de la interfaz frontend basándote EXCLUSIVAMENTE en las alertas oficiales extraídas de las instituciones gubernamentales del Perú:
1. IGP: https://ultimosismo.igp.gob.pe/evento/[CODIGO]
2. SENAMHI: https://www.senamhi.gob.pe/?p=aviso-meteorologico
3. INDECI y COEN: https://coen.indeci.gob.pe/report/
4. CENEPRED y SIGRID: https://sigrid.cenepred.gob.pe/sigridv3/documento/17791
5. DHN: https://www.dhn.mil.pe/portal/avisos-especiales
6. ENFEN: https://enfen.imarpe.gob.pe/comunicados/

REGLAS OBLIGATORIAS:
- FILTRO ESTRICTO DE 24 HORAS: Ninguna alerta puede superar las 24 horas de antigüedad respecto a la hora actual.
- CONTROL DE VACÍO Y CERO ALUCINACIONES: Si la lista de alertas extraídas recibida está vacía o ninguna alerta afecta a la provincia y departamento seleccionados, DEBES RETORNAR ESTRICTAMENTE UN ARREGLO VACÍO: [].
- PROHIBIDO inventar eventos ficticios, sismos inexistentes o enlaces truncados/rotos.
- Cada objeto debe incluir obligatoriamente el campo "enlace_oficial" con el enlace provisto en la alerta extraída.`;

/**
 * Formateador determinista de respaldo: Aplica las mismas reglas exactas de formateo
 * para asegurar que las tarjetas frontend reciban datos idénticos aun si la llamada AI demora.
 */
export function formatearAlertasCrudas(
  alertas: AlertaOficialCruda[],
  criterios: CriteriosUbicacion
): ReporteOficialGemini[] {
  if (!alertas || alertas.length === 0) {
    return [];
  }

  return alertas.map((alerta) => {
    let severidadColor = 'bg-blue-600 text-white';
    if (alerta.severidad === 'Extrema') {
      severidadColor = 'bg-red-600 text-white';
    } else if (alerta.severidad === 'Alta') {
      severidadColor = 'bg-amber-500 text-white';
    } else if (alerta.severidad === 'Moderada') {
      severidadColor = 'bg-amber-400 text-slate-900';
    }

    return {
      id: alerta.id,
      tipoDesastre: alerta.tipoDesastre,
      codigoOficial: alerta.codigoOficial,
      titulo: `${alerta.institucion}: ${alerta.titulo}`,
      entidad: alerta.institucion,
      entidadNombreCompleto: alerta.nombreInstitucionCompleto,
      entidadUrl: alerta.urlInstitucion,
      enlace_oficial: alerta.enlace_oficial,
      enlaceBoletinOficial: alerta.enlace_oficial,
      enlacePdfDirecto: alerta.enlacePdfDirecto,
      enlaceCatalogoOficial: alerta.enlaceVisorPlataforma || alerta.urlInstitucion,
      horaReporte: `${alerta.fechaLocalPerú} - ${alerta.horaLocalPerú}`,
      fechaHoraRegistroIso: new Date(alerta.timestampPublicacionMs).toISOString(),
      haceCuanto: alerta.tiempoTranscurrido,
      severidad: alerta.severidad,
      severidadColor,
      lugarExactoProvincia: alerta.lugarReferencia,
      coordenadasExactas: alerta.coordenadasReferencia,
      descripcion: alerta.descripcionOficial,
      parametrosClave: alerta.parametrosTecnicos,
      datosAdicionalesOficiales: alerta.datosVerificados,
      zonaAfectada: `${criterios.distrito}, ${criterios.provincia}`,
      recomendacionDefensaCivil: alerta.medidaDefensaCivil,
      boletinNombre: `${alerta.institucion} ${alerta.codigoOficial}`,
      esSismoReal: alerta.institucion === 'IGP',
      tipoBoletinOficial: alerta.tipoBoletinOficial || `Boletín / Alerta Informativa (${alerta.institucion})`,
      informacionCompletaOficial: construirInformacionCompletaOficial(alerta),
      periodoVigenciaTexto: alerta.periodoVigenciaTexto,
      esLocal: alerta.esLocal !== false,
      distanciaKmUsuario: alerta.distanciaKmUsuario,
    };
  });
}

/**
 * Deduplicación estricta de reportes oficiales para garantizar cero repetición
 * de información en la interfaz de usuario.
 */
export function deduplicarReportesOficiales(reportes: ReporteOficialGemini[]): ReporteOficialGemini[] {
  const vistos = new Set<string>();
  const vistosTitulos = new Set<string>();
  const resultado: ReporteOficialGemini[] = [];

  for (const r of reportes) {
    const idLimpio = String(r.id || '').trim();
    const tituloLimpio = String(r.titulo || '').toLowerCase().replace(/\s+/g, ' ').trim();
    const claveTitulo = `${r.entidad}_${tituloLimpio}`;

    if (vistos.has(idLimpio) || vistosTitulos.has(claveTitulo)) {
      continue;
    }

    vistos.add(idLimpio);
    vistosTitulos.add(claveTitulo);
    resultado.push(r);
  }

  return resultado;
}

/**
 * Consulta y sincronización unificada de las 8 instituciones:
 * 1. Extrae alertas reales de las instituciones bajo filtro de 24h y geografía pertinente.
 * 2. Si no hay alertas reales, retorna [] de inmediato (Control de Vacío).
 * 3. Si hay alertas, utiliza a Gemini como formateador inteligente estructurando el JSON.
 */
export async function consultarReportesOficiales(
  district: DistrictData,
  province: ProvinceData,
  department: DepartmentData
): Promise<ReporteOficialGemini[]> {
  const currentTime = new Date();
  const criterios: CriteriosUbicacion = {
    departamento: department.name,
    provincia: province.name,
    distrito: district.name,
    lat: district.lat,
    lng: district.lng,
    altitudeMeters: district.altitudeMeters,
    regionNatural: district.region,
    currentTimeIso: currentTime.toISOString(),
  };

  // 1. Conexión directa y extracción de las 8 instituciones oficiales (IGP, SENAMHI, INDECI, COEN, CENEPRED, SIGRID, DHN, ENFEN)
  const alertasCrudas24h = await extraerAlertas8Instituciones(criterios);

  // REGLA DE VACÍO: Si no hay alertas reales en las últimas 24h para esta zona, retornar []
  if (alertasCrudas24h.length === 0) {
    return [];
  }

  // 2. Utilizar Gemini como formateador inteligente a través del endpoint backend
  try {
    const query = new URLSearchParams({
      departamento: criterios.departamento,
      provincia: criterios.provincia,
      distrito: criterios.distrito,
      currentTimeIso: criterios.currentTimeIso,
    }).toString();

    const res = await fetch(`/api/reportes-oficiales-gemini?${query}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        alertasCrudas: alertasCrudas24h,
        criterios,
      }),
      signal: AbortSignal.timeout(6000),
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.reportes) && data.reportes.length > 0) {
        // Validación estricta final de enlaces oficiales y deduplicación
        const validos = data.reportes.filter((r: ReporteOficialGemini) => Boolean(r.enlace_oficial));
        return deduplicarReportesOficiales(validos);
      }
    }
  } catch (error) {
    // Si la llamada remota a Gemini se demora o está en entorno desconectado,
    // el formateador determinista entrega la estructura con las mismas reglas
  }

  // 3. Formateo y validación de respaldo idéntica con deduplicación
  const respaldo = formatearAlertasCrudas(alertasCrudas24h, criterios);
  return deduplicarReportesOficiales(respaldo);
}
