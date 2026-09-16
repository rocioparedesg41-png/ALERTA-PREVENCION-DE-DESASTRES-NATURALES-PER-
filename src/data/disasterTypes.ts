// src/data/disasterTypes.ts

export type DisasterType =
  | 'SISMO'
  | 'TSUNAMI'
  | 'ERUPCION_VOLCANICA'
  | 'HUAYCO_DESLIZAMIENTO'
  | 'INUNDACION'
  | 'HELADA_FRIAJE'
  | 'SEQUIA'
  | 'VIENTO_FUERTE'
  | 'GRANIZADA';

/**
 * Reglas geográficas para asignar tipos de desastre por región, altitud y departamento.
 * Cubre los 24 departamentos + Callao con sus variantes por zona geográfica.
 */
export interface DisasterRules {
  disasters: DisasterType[];
}

// Regla 1: Costa con acceso al Pacífico → riesgo de TSUNAMI
const COASTAL_DEPARTMENTS_WITH_TSUNAMI = [
  'Lima', 'Callao', 'Ica', 'Arequipa', 'Moquegua', 'Tacna',
  'Piura', 'Tumbes', 'La Libertad', 'Lambayeque', 'Áncash',
];

// Distritos costeros específicos con alta exposición a tsunami
// Fuente: INDECI / Plataforma del Estado Peruano
export const TSUNAMI_RISK_DISTRICTS = new Set([
  // Lima Metropolitana
  'Chorrillos', 'Villa El Salvador', 'Lurín', 'Ancón', 'Santa Rosa',
  'Pucusana', 'Punta Hermosa', 'San Bartolo', 'Miraflores', 'Barranco',
  'Magdalena del Mar', 'San Miguel', 'La Molina',
  // Callao
  'Callao', 'La Punta', 'Ventanilla', 'Mi Perú', 'Bellavista',
  'Carmen de La Legua Reynoso',
  // Lima Provincias - Norte
  'Supe Puerto', 'Supe', 'Paramonga', 'Barranca', 'Chancay',
  'Huacho', 'Caleta de Carquín', 'Vegueta',
  // Lima Provincias - Sur
  'Cerro Azul', 'Asia', 'Mala', 'Chilca',
  // Ica
  'Paracas', 'Pisco', 'Ica', 'Nasca', 'Marcona',
  // Arequipa costa
  'Camaná', 'Quilca', 'Ocoña', 'Atico', 'Chala', 'Mollendo', 'Mejía',
  // Moquegua / Tacna costa
  'Ilo', 'El Algarrobal', 'Pacocha', 'Sama', 'Vila Vila',
  // La Libertad
  'Trujillo', 'Huanchaco', 'Salaverry', 'Moche', 'Víctor Larco Herrera',
  // Lambayeque
  'Chiclayo', 'Pimentel', 'Santa Rosa', 'Monsefú',
  // Piura
  'Piura', 'Paita', 'Sechura', 'Talara', 'Los Órganos', 'Máncora',
  // Tumbes
  'Tumbes', 'Zorritos', 'Corrales', 'La Cruz',
  // Áncash
  'Chimbote', 'Nuevo Chimbote', 'Huarmey', 'Casma', 'Samanco',
]);

const normalizeStr = (str: string) =>
  (str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

/**
 * Determina los tipos de desastre para un distrito dado su contexto geográfico.
 * Lógica basada en: región natural, altitud, departamento y nombre del distrito.
 */
export const getDisasterTypesForDistrict = (params: {
  districtName: string;
  provinceName: string;
  departmentName: string;
  region: string;          // 'Costa' | 'Sierra' | 'Selva'
  altitudeMeters: number;
}): DisasterType[] => {
  const { districtName, provinceName, departmentName, region, altitudeMeters } = params;
  const disasters = new Set<DisasterType>();

  const normDist = normalizeStr(districtName);
  const normProv = normalizeStr(provinceName);
  const normDept = normalizeStr(departmentName);

  // ── SISMO: todo el territorio peruano está en el Cinturón de Fuego del Pacífico ──
  disasters.add('SISMO');

  // ── TSUNAMI: distritos con litoral en la costa del Pacífico ──────────────
  const deptHasCoast = COASTAL_DEPARTMENTS_WITH_TSUNAMI.some(
    (d) => normDept.includes(normalizeStr(d))
  );
  const isTsunamiDistrict = Array.from(TSUNAMI_RISK_DISTRICTS).some(
    (td) => normDist === normalizeStr(td)
  );
  if (
    region === 'Costa' &&
    deptHasCoast &&
    (isTsunamiDistrict || altitudeMeters <= 20)
  ) {
    disasters.add('TSUNAMI');
  }

  // ── ERUPCIÓN VOLCÁNICA: departamentos y provincias con volcanes activos ───
  const VOLCANIC_DEPTS = ['arequipa', 'moquegua', 'tacna', 'puno', 'cusco', 'ayacucho'];
  const VOLCANIC_PROVINCES = [
    'caylloma', 'castilla', 'condesuyos',
    'general sanchez cerro', 'mariscal nieto',
    'candarave', 'tarata', 'tacna',
    'el collao', 'chucuito',
  ];
  if (
    VOLCANIC_DEPTS.some((d) => normDept.includes(d)) ||
    VOLCANIC_PROVINCES.some((p) => normProv.includes(p))
  ) {
    disasters.add('ERUPCION_VOLCANICA');
  }

  // ── HUAYCO / DESLIZAMIENTO: quebradas activas, cuencas torrenciales y laderas ──
  // Toda la Sierra y Selva Alta; y en la Costa distritos en quebradas críticas (Chosica, Chaclacayo, etc.)
  if (region === 'Sierra' || region === 'Selva') {
    disasters.add('HUAYCO_DESLIZAMIENTO');
  }
  const QUEBRADA_KEYWORDS = [
    'chosica', 'lurigancho', 'chaclacayo', 'cieneguilla', 'santa eulalia', 'ricardo palma',
    'san bartolome', 'matucana', 'san mateo', 'independencia', 'los olivos', 'comas',
    'carabayllo', 'san juan de lurigancho', 'ate', 'rimac', 'villa maria del triunfo',
    'san juan de miraflores', 'punta hermosa', 'san bartolo', 'pucusana', 'chilca', 'mala', 'asia',
    'quebrada', 'aluvion', 'huayco', 'deslizamiento',
  ];
  if (QUEBRADA_KEYWORDS.some((kw) => normDist.includes(kw))) {
    disasters.add('HUAYCO_DESLIZAMIENTO');
  }

  // ── INUNDACIÓN: desbordes fluviales (ríos), zonas bajas y Fenómeno El Niño ──
  if (altitudeMeters <= 500 && region !== 'Sierra') {
    disasters.add('INUNDACION');
  }
  // Selva: inundación fluvial permanente por crecida de ríos
  if (region === 'Selva') {
    disasters.add('INUNDACION');
  }
  // Costa: inundación por lluvias extraordinarias / desborde
  if (region === 'Costa') {
    disasters.add('INUNDACION');
  }
  // Distritos específicos con desborde fluvial de río (ej. Río Rímac en Lurigancho/Chosica)
  const RIVER_FLOOD_KEYWORDS = ['lurigancho', 'chosica', 'chaclacayo', 'rimac', 'san martin de porres', 'callao', 'santa eulalia'];
  if (RIVER_FLOOD_KEYWORDS.some((kw) => normDist.includes(kw))) {
    disasters.add('INUNDACION');
  }

  // ── HELADA / FRIAJE: altitud >3500 msnm (Sierra) o Selva en friaje ───────
  if (altitudeMeters >= 3500) {
    disasters.add('HELADA_FRIAJE');
  }
  // Selva: friaje de mayo a agosto
  const FRIAJE_DEPTS = ['loreto', 'ucayali', 'madre de dios', 'san martin', 'amazonas'];
  if (FRIAJE_DEPTS.some((d) => normDept.includes(d)) && region === 'Selva') {
    disasters.add('HELADA_FRIAJE');
  }

  // ── SEQUÍA: zonas áridas y altiplano ──────────────────────────────────────
  const SEQUIA_DEPTS = ['ica', 'arequipa', 'moquegua', 'tacna', 'puno', 'ayacucho', 'huancavelica', 'apurimac'];
  if (SEQUIA_DEPTS.some((d) => normDept.includes(d))) {
    disasters.add('SEQUIA');
  }

  // ── VIENTOS FUERTES: altiplano > 4000 msnm y costa norte ─────────────────
  if (altitudeMeters >= 4000) {
    disasters.add('VIENTO_FUERTE');
  }
  const WIND_COASTAL_DEPTS = ['piura', 'tumbes', 'lambayeque', 'la libertad'];
  if (WIND_COASTAL_DEPTS.some((d) => normDept.includes(d)) && region === 'Costa') {
    disasters.add('VIENTO_FUERTE');
  }

  // ── GRANIZADA: Sierra media y alta (2500-4800 msnm) ──────────────────────
  if (altitudeMeters >= 2500 && altitudeMeters <= 4800 && region === 'Sierra') {
    disasters.add('GRANIZADA');
  }

  return Array.from(disasters);
};

// Labels para mostrar en la UI
export const DISASTER_LABELS: Record<DisasterType, string> = {
  SISMO: 'SISMO',
  TSUNAMI: 'TSUNAMI',
  ERUPCION_VOLCANICA: 'ERUPCIÓN VOLCÁNICA',
  HUAYCO_DESLIZAMIENTO: 'HUAYCO / DESLIZAMIENTO',
  INUNDACION: 'INUNDACIÓN',
  HELADA_FRIAJE: 'HELADA / FRIAJE',
  SEQUIA: 'SEQUÍA',
  VIENTO_FUERTE: 'VIENTO FUERTE',
  GRANIZADA: 'GRANIZADA',
};

// Colores para los badges de la UI
export const DISASTER_COLORS: Record<DisasterType, { bg: string; text: string; dot: string }> = {
  SISMO:                { bg: 'bg-red-100',    text: 'text-red-700',    dot: 'bg-red-500'    },
  TSUNAMI:              { bg: 'bg-blue-100',   text: 'text-blue-700',   dot: 'bg-blue-500'   },
  ERUPCION_VOLCANICA:   { bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-500' },
  HUAYCO_DESLIZAMIENTO: { bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-600' },
  INUNDACION:           { bg: 'bg-cyan-100',   text: 'text-cyan-700',   dot: 'bg-cyan-500'   },
  HELADA_FRIAJE:        { bg: 'bg-sky-100',    text: 'text-sky-700',    dot: 'bg-sky-400'    },
  SEQUIA:               { bg: 'bg-amber-100',  text: 'text-amber-700',  dot: 'bg-amber-500'  },
  VIENTO_FUERTE:        { bg: 'bg-slate-100',  text: 'text-slate-700',  dot: 'bg-slate-500'  },
  GRANIZADA:            { bg: 'bg-purple-100', text: 'text-purple-700', dot: 'bg-purple-500' },
};