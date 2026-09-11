import { OfficialEntity } from '../types/disasters';

export interface EmergencyPhone {
  number: string;
  name: string;
  acronym: string;
  category: 'policia' | 'bomberos' | 'salud' | 'defensa_civil' | 'vial' | 'social';
  description: string;
  availableHours: string;
}

export const PERU_EMERGENCY_PHONES: EmergencyPhone[] = [
  {
    number: '105',
    name: 'Policía Nacional del Perú',
    acronym: 'PNP',
    category: 'policia',
    description: 'Central de Emergencias Policiales, rescate, orden público y seguridad ciudadana.',
    availableHours: '24 horas / 365 días',
  },
  {
    number: '116',
    name: 'Cuerpo General de Bomberos Voluntarios del Perú',
    acronym: 'CGBVP',
    category: 'bomberos',
    description: 'Atención de incendios, fugas de gas, rescate en estructuras colapsadas y materiales peligrosos.',
    availableHours: '24 horas / Gratuito',
  },
  {
    number: '106',
    name: 'Sistema de Atención Móvil de Urgencia',
    acronym: 'SAMU',
    category: 'salud',
    description: 'Ambulancias médicas de emergencia, soporte vital avanzado y traslado a hospitales MINSA.',
    availableHours: '24 horas / Gratuito',
  },
  {
    number: '115',
    name: 'Instituto Nacional de Defensa Civil',
    acronym: 'INDECI / COEN',
    category: 'defensa_civil',
    description: 'Central de reporte de desastres naturales, sismos, huaicos, activación de ayuda humanitaria.',
    availableHours: '24 horas nacional',
  },
  {
    number: '110',
    name: 'Policía de Carreteras',
    acronym: 'POLCAR',
    category: 'vial',
    description: 'Auxilio mecánico y rescate en vías interprovinciales por huaicos, derrumbes y nevadas.',
    availableHours: '24 horas nacional',
  },
  {
    number: '100',
    name: 'Línea de Emergencia y Apoyo Social',
    acronym: 'LÍNEA 100',
    category: 'social',
    description: 'Soporte a personas en situación de vulnerabilidad extrema, niños y adultos mayores.',
    availableHours: '24 horas / Confidencial',
  },
  {
    number: '111',
    name: 'Cruz Roja Peruana',
    acronym: 'CRUZ ROJA',
    category: 'salud',
    description: 'Primeros auxilios comunitarios, albergues temporales y asistencia humanitaria.',
    availableHours: '24 horas',
  },
];

export const OFFICIAL_PERUVIAN_ENTITIES: OfficialEntity[] = [
  {
    acronym: 'IGP',
    name: 'Instituto Geofísico del Perú',
    role: 'Monitoreo Sísmico Nacional y Vulcanológico',
    url: 'https://ultimosismo.igp.gob.pe/',
    badgeColor: 'bg-red-600',
    iconName: 'Activity',
    lastReport: 'Red Sísmica Nacional y Centro Vulcanológico Nacional (CENVUL) 100% operativos.',
  },
  {
    acronym: 'SENAMHI',
    name: 'Servicio Nacional de Meteorología e Hidrología',
    role: 'Monitoreo Climatológico, Lluvias e Hidrología',
    url: 'https://www.senamhi.gob.pe/?p=aviso-meteorologico',
    badgeColor: 'bg-sky-600',
    iconName: 'CloudRain',
    lastReport: 'Avisos meteorológicos e hidrológicos vigentes a nivel nacional en las últimas 24 horas.',
  },
  {
    acronym: 'INDECI',
    name: 'Instituto Nacional de Defensa Civil',
    role: 'Preparación, Respuesta y Ayuda Humanitaria',
    url: 'https://www.gob.pe/indeci',
    badgeColor: 'bg-amber-600',
    iconName: 'ShieldAlert',
    lastReport: 'Activación de protocolos de contingencia en quebradas críticas y almacenes de emergencia.',
  },
  {
    acronym: 'COEN',
    name: 'Centro de Operaciones de Emergencia Nacional',
    role: 'Coordinación y Evaluación de Daños en Tiempo Real',
    url: 'https://coen.indeci.gob.pe/',
    badgeColor: 'bg-rose-700',
    iconName: 'Radio',
    lastReport: 'Boletín Diario de Emergencias COEN: Monitoreo ininterrumpido en las 25 regiones.',
  },
  {
    acronym: 'CENEPRED',
    name: 'Centro Nacional de Estimación y Prevención de Desastres',
    role: 'Gestión Prospectiva y Reactiva del Riesgo',
    url: 'https://sigrid.cenepred.gob.pe/sigridv3/',
    badgeColor: 'bg-emerald-700',
    iconName: 'Compass',
    lastReport: 'Escenarios de Riesgo y Susceptibilidad por Movimientos en Masa en el Sistema SIGRID.',
  },
  {
    acronym: 'SIGRID',
    name: 'Sistema de Información para la Gestión del Riesgo',
    role: 'Cartografía y Geoinformación de Desastres',
    url: 'https://sigrid.cenepred.gob.pe/sigridv3/',
    badgeColor: 'bg-indigo-700',
    iconName: 'Map',
    lastReport: 'Capas georreferenciadas de peligros geológicos e hidrometeorológicos en línea.',
  },
  {
    acronym: 'DHN',
    name: 'Dirección de Hidrografía y Navegación (Marina de Guerra)',
    role: 'Centro Nacional de Alerta de Tsunami (CNAT)',
    url: 'https://www.dhn.mil.pe/',
    badgeColor: 'bg-blue-800',
    iconName: 'Waves',
    lastReport: 'Monitoreo mareográfico boyas DART litoral peruano: Estado Normal.',
  },
];
