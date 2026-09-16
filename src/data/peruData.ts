import { DepartmentData, DisasterInfo, DisasterType, ProvinceData, DistrictData } from '../types/disasters';
import completeDepartmentsJson from './peruDepartmentsComplete.json';
import { getDisasterTypesForDistrict } from './disasterTypes';

export const DISASTER_PROTOCOLS: Record<string, DisasterInfo> = {
  sismo: {
    type: 'sismo',
    title: 'Sismo y Terremoto',
    riskLevel: 'Alto',
    infographicFile: '/evacuacion_sismo.jpg',
    description: 'Liberación súbita de energía tectónica por la subducción de la Placa de Nazca bajo la Placa Sudamericana.',
    primaryCause: 'Cinturón de Fuego del Pacífico y Falla de Subducción Peruana',
    warningTime: '15 a 45 segundos (SASPE / Red Sísmica Nacional)',
    recommendedActions: [
      'Conservar la calma y ubicarse inmediatamente en zonas seguras internas (columnas y muros portantes).',
      'Agacharse, cubrirse y sujetarse fuertemente durante la vibración.',
      'No usar ascensores ni escaleras durante el movimiento telúrico.',
      'Cortar suministros de gas, agua y fluido eléctrico antes de evacuar.',
      'Dirigirse hacia el punto de reunión seguro con la mochila de emergencia.',
    ],
    backpackItems: [
      { id: 'b_agua', label: 'Agua potable en botella (2 litros por persona)', category: 'esencial', required: true },
      { id: 'b_alimentos', label: 'Alimentos no perecibles (enlatados con abrelatas, barras energéticas)', category: 'esencial', required: true },
      { id: 'b_radio', label: 'Radio portatil a pilas / dínamo FM/AM y baterías de repuesto', category: 'esencial', required: true },
      { id: 'b_linterna', label: 'Linterna LED de alta potencia con pilas adicionales', category: 'esencial', required: true },
      { id: 'b_silbato', label: 'Silbato de rescate para localización bajo escombros', category: 'esencial', required: true },
      { id: 'b_botiquin', label: 'Botiquín de primeros auxilios (gasas, antisépticos, analgésicos, vendas)', category: 'medico', required: true },
      { id: 'b_documentos', label: 'Copia de DNI, carnés médicos y llaves en bolsa hermética Ziploc', category: 'esencial', required: true },
      { id: 'b_mantas', label: 'Manta térmica aluminizada de rescate', category: 'especifico', required: true },
      { id: 'b_cuerda', label: 'Cuerda de polipropileno de alta resistencia (10 metros)', category: 'especifico', required: false },
      { id: 'b_cuchillo', label: 'Navaja multiherramienta suiza / alicate', category: 'especifico', required: false },
      { id: 'b_mascarillas', label: 'Mascarillas KN95 antipolvo para escombros', category: 'medico', required: true },
    ],
  },
  tsunami: {
    type: 'tsunami',
    title: 'Tsunami / Maremoto',
    riskLevel: 'Extremo',
    infographicFile: '/evacuacion_tsunamis.jpg',
    description: 'Tren de olas gigantes generado por sismos submarinos de gran magnitud (M > 7.0) cercanos al litoral.',
    primaryCause: 'Fosa de subducción marina peruano-chilena',
    warningTime: '10 a 25 minutos para costas cercanas',
    recommendedActions: [
      'Si siente un sismo que dificulta mantenerse en pie o nota retiro del mar, evacue de inmediato a pie.',
      'Moverse rápidamente hacia cotas superiores a los 30 metros sobre el nivel del mar.',
      'No utilizar vehículos automotores para evitar congestionamiento de vías de evacuación.',
      'Permanecer en la zona alta hasta que la Dirección de Hidrografía y Navegación (DHN) levante la alerta.',
    ],
    backpackItems: [
      { id: 't_chaleco', label: 'Chaleco salvavidas o flotador personal reflectivo', category: 'especifico', required: true },
      { id: 't_bolsas', label: 'Bolsas secas estancas impermeables para documentos y equipos', category: 'especifico', required: true },
      { id: 't_agua', label: 'Agua embotellada sellada herméticamente', category: 'esencial', required: true },
      { id: 't_silbato', label: 'Silbato náutico de alta potencia sin bola', category: 'esencial', required: true },
      { id: 't_botiquin', label: 'Botiquín para heridas cortantes e hipotermia', category: 'medico', required: true },
      { id: 't_linterna', label: 'Linterna sumergible estanca / luz estroboscópica', category: 'esencial', required: true },
      { id: 't_calzado', label: 'Zapatos cerrados de suela de tracción antideslizante', category: 'especifico', required: true },
      { id: 't_manta', label: 'Manta térmica para prevención de shock por hipotermia', category: 'especifico', required: true },
    ],
  },
  huayco: {
    type: 'huayco',
    title: 'Huaico / Flujo de Detritos',
    riskLevel: 'Alto',
    infographicFile: '/evacuacion_huayco_.png',
    description: 'Flujo violento de agua, lodo, rocas y troncos que desciende a gran velocidad por quebradas secas reactivadas.',
    primaryCause: 'Lluvias torrenciales estacionales en cuenca media y alta de los Andes',
    warningTime: '5 a 15 minutos tras el rugido o advertencia de vigía de quebrada',
    recommendedActions: [
      'Nunca correr hacia abajo en la dirección del cauce del aluvión.',
      'Evacuar perpendicularmente subiendo hacia laderas firmes y zonas altas.',
      'Alejarse de puentes, riberas y lechos de quebradas secas.',
      'No intentar cruzar la corriente de lodo ni a pie ni en vehículo.',
      'Reunirse en el punto seguro de la colina designado por Defensa Civil.',
    ],
    backpackItems: [
      { id: 'h_botas', label: 'Botas de jebe de caña alta o calzado impermeable', category: 'especifico', required: true },
      { id: 'h_casco', label: 'Casco de protección contra caída de piedras y rocas', category: 'especifico', required: true },
      { id: 'h_impermeable', label: 'Poncho impermeable de lluvia grueso', category: 'especifico', required: true },
      { id: 'h_agua', label: 'Pastillas purificadoras de agua y 2L de agua embotellada', category: 'esencial', required: true },
      { id: 'h_linterna', label: 'Linterna frontal de cabeza (manos libres)', category: 'esencial', required: true },
      { id: 'h_botiquin', label: 'Botiquín con vendas elásticas, gasas y antiséptico', category: 'medico', required: true },
      { id: 'h_silbato', label: 'Silbato de socorro montañero', category: 'esencial', required: true },
    ],
  },
  huayco_deslizamiento: {
    type: 'huayco_deslizamiento',
    title: 'Huaico y Deslizamiento de Masa',
    riskLevel: 'Alto',
    infographicFile: '/evacuacion_huayco_.png',
    description: 'Flujo violento de agua, lodo, detritos y desprendimiento de laderas inestables por lluvias torrenciales y laderas empinadas.',
    primaryCause: 'Lluvias estacionales torrenciales en cuencas medias y altas de los Andes y gradiente topográfica',
    warningTime: '5 a 15 minutos tras rugido, tremor o alerta temprana comunitaria',
    recommendedActions: [
      'Nunca correr ladera abajo en la dirección del cauce del aluvión o quebrada.',
      'Evacuar perpendicularmente hacia laderas altas y terreno rocoso consolidado.',
      'Alejarse inmediatamente de cauces secos, riberas y puentes vehiculares o peatonales.',
      'No intentar cruzar la masa de lodo ni a pie ni en vehículos particulares.',
      'Reunirse en el punto de encuentro elevado coordinado por INDECI y Defensa Civil.',
    ],
    backpackItems: [
      { id: 'hd_botas', label: 'Botas de jebe o calzado de caña alta con tracción', category: 'especifico', required: true },
      { id: 'hd_casco', label: 'Casco de protección contra caída de piedras y rocas', category: 'especifico', required: true },
      { id: 'hd_impermeable', label: 'Poncho o casaca impermeable de alta visibilidad', category: 'especifico', required: true },
      { id: 'hd_agua', label: 'Pastillas purificadoras y agua potable sellada', category: 'esencial', required: true },
      { id: 'hd_linterna', label: 'Linterna frontal de cabeza (manos libres)', category: 'esencial', required: true },
      { id: 'hd_botiquin', label: 'Botiquín con gasas estériles, vendas y desinfectante', category: 'medico', required: true },
      { id: 'hd_silbato', label: 'Silbato de socorro de alta frecuencia', category: 'esencial', required: true },
    ],
  },
  inundacion: {
    type: 'inundacion',
    title: 'Inundación Ribereña / Pluvial',
    riskLevel: 'Alto',
    infographicFile: '/evacuacion_inundaciones.png',
    description: 'Desborde de ríos o acumulación de agua por precipitaciones anómalas y crecidas extraordinarias.',
    primaryCause: 'Fenómeno El Niño, Ondas Kelvin y Lluvias Monzónicas Amazónicas',
    warningTime: '1 a 6 horas según monitoreo hidrológico SENAMHI',
    recommendedActions: [
      'Bajar la llave general de electricidad y cerrar el paso de gas antes de abandonar la vivienda.',
      'Subir víveres y pertenencias de valor a pisos altos o colinas elevadas.',
      'No caminar sobre aguas estancadas por riesgo de cables energizados y sumideros.',
      'Beber exclusivamente agua hervida o clorada para prevenir cólera y leptospirosis.',
    ],
    backpackItems: [
      { id: 'i_cloro', label: 'Gotero con cloro / pastillas de dióxido de cloro para desinfección de agua', category: 'medico', required: true },
      { id: 'i_repelente', label: 'Repelente contra mosquitos (Dengue, Malaria, Zika)', category: 'medico', required: true },
      { id: 'i_impermeable', label: 'Ropa de cambio completa en bolsa hermética estanca', category: 'especifico', required: true },
      { id: 'i_linterna', label: 'Linterna recargable resistente a la lluvia', category: 'esencial', required: true },
      { id: 'i_alimentos', label: 'Barras energéticas y alimentos enlatados resistentes al agua', category: 'esencial', required: true },
      { id: 'i_botiquin', label: 'Antidiarreicos, suero de rehidratación oral y antibióticos tópicos', category: 'medico', required: true },
    ],
  },
  helada_friaje: {
    type: 'helada_friaje',
    title: 'Helada y Friaje',
    riskLevel: 'Alto',
    infographicFile: '/evacuacion_heladas_friajes.jpg',
    description: 'Descenso extremo de temperaturas bajo cero en la Sierra (Heladas) o incursión de aire polar antártico en la Selva (Friaje).',
    primaryCause: 'Anticiclón del Atlántico Sur y masa de aire polar continental',
    warningTime: '24 a 72 horas (Alertas Naranja/Roja SENAMHI)',
    recommendedActions: [
      'Vestir en capas térmicas (estilo cebolla) protegiendo cabeza, cuello, manos y pies.',
      'Resguardar ganado y camélidos en cobertizos protegidos con forraje y agua tibia.',
      'Evitar el uso de braseros o carbón en habitaciones cerradas por riesgo de monóxido de carbono.',
      'Aislar paredes y tuberías con cartón, madera o plásticos térmicos.',
    ],
    backpackItems: [
      { id: 'hf_mantas', label: 'Mantas térmicas polares de lana y cobijas aluminizadas', category: 'especifico', required: true },
      { id: 'hf_guantes', label: 'Guantes de lana/cuero, chullos y medias térmicas adicionales', category: 'especifico', required: true },
      { id: 'hf_calentador', label: 'Parches o almohadillas térmicas químicas instantáneas', category: 'especifico', required: true },
      { id: 'hf_termo', label: 'Termo metálico con infusión o agua caliente', category: 'esencial', required: true },
      { id: 'hf_botiquin', label: 'Antigripales, pomadas descongestionantes y termómetro digital', category: 'medico', required: true },
      { id: 'hf_alimentos', label: 'Frutos secos, chocolate cusqueño y alimentos calóricos', category: 'esencial', required: true },
    ],
  },
  sequia: {
    type: 'sequia',
    title: 'Sequía Meteorológica y Agrícola',
    riskLevel: 'Medio',
    infographicFile: '/evacuacion_sequia.jpg',
    description: 'Déficit severo y prolongado de precipitaciones que impacta el suministro hídrico, agricultura y ganadería.',
    primaryCause: 'Patrones climáticos anómalos, El Niño Modoki y oscilaciones atmosféricas',
    warningTime: 'Semanas a meses de seguimiento estacional',
    recommendedActions: [
      'Racionar y almacenar agua en recipientes limpios con tapa hermética.',
      'Reutilizar aguas grises de lavandería para limpieza de inodoros.',
      'Instalar sistemas de riego tecnificado por goteo en horarios nocturnos.',
      'Prohibir quemas de pastizales y fogatas para prevenir incendios forestales.',
    ],
    backpackItems: [
      { id: 'sq_pastillas', label: 'Pastillas purificadoras y sales de rehidratación oral', category: 'medico', required: true },
      { id: 'sq_almacen', label: 'Bidón colapsable para almacenamiento de 10L de agua', category: 'especifico', required: true },
      { id: 'sq_sombrero', label: 'Sombrero de ala ancha con protección UV y protector solar SPF 50+', category: 'especifico', required: true },
      { id: 'sq_lentes', label: 'Gafas con filtro solar UV400 contra radiación extrema', category: 'especifico', required: true },
    ],
  },
  erupcion_volcanica: {
    type: 'erupcion_volcanica',
    title: 'Erupción Volcánica / Emisión de Cenizas',
    riskLevel: 'Extremo',
    infographicFile: '/evacuacion_erupciones.jpg',
    description: 'Explosiones y eyección de ceniza, gases tóxicos y flujos piroclásticos por reactivación volcánica activa.',
    primaryCause: 'Arco Volcánico de los Andes Centrales del Sur (IGP - Observatorio Vulcanológico)',
    warningTime: 'Minutos a días según enjambres sísmicos volcánicos',
    recommendedActions: [
      'Cubrirse boca y nariz con mascarillas N95 o pañuelos húmedos de doble tela.',
      'Usar gafas herméticas de seguridad; evitar bajo cualquier circunstancia lentes de contacto.',
      'Sellar rendijas de puertas y ventanas con cinta adhesiva y telas húmedas.',
      'Proteger y tapar herméticamente depósitos de agua potable y fuentes de comida.',
      'Barrer la ceniza de techos ligeros de inmediato para evitar colapsos estructurales.',
    ],
    backpackItems: [
      { id: 'v_mascarilla', label: 'Mascarillas de protección respiratoria certificadas N95 / FFP2 (mínimo 4 uds)', category: 'especifico', required: true },
      { id: 'v_gafas', label: 'Gafas protectoras herméticas de policarbonato (antiparras)', category: 'especifico', required: true },
      { id: 'v_colirio', label: 'Frasco de solución oftálmica estéril / lágrimas artificiales', category: 'medico', required: true },
      { id: 'v_cinta', label: 'Cinta adhesiva duct-tape gruesa y plásticos para sellar ventanas', category: 'especifico', required: true },
      { id: 'v_escobilla', label: 'Cepillo / escobilla suave para limpieza de ceniza', category: 'especifico', required: false },
      { id: 'v_agua', label: 'Agua embotellada protegida en empaque sellado', category: 'esencial', required: true },
    ],
  },
  deslizamiento: {
    type: 'deslizamiento',
    title: 'Deslizamiento de Masa Terrestre',
    riskLevel: 'Alto',
    infographicFile: '/evacuacion_huayco_.png',
    description: 'Desprendimiento violento de rocas y laderas inestables por saturación de humedad y gradiente empinada.',
    primaryCause: 'Sobresaturación de suelos por lluvias y sismicidad asociada',
    warningTime: 'Inmediata o minutos tras crujidos del suelo',
    recommendedActions: [
      'Evacuar de inmediato al observar grietas en paredes o desprendimiento de terrones.',
      'Alejarse del pie de taludes empinados y acantilados.',
      'Alertar a vecinos mediante silbatos o sirenas comunitarias.',
    ],
    backpackItems: [
      { id: 'd_casco', label: 'Casco de protección de cabeza y linterna frontal', category: 'especifico', required: true },
      { id: 'd_silbato', label: 'Silbato de advertencia de rescate', category: 'esencial', required: true },
      { id: 'd_botiquin', label: 'Botiquín para traumatismos y vendajes', category: 'medico', required: true },
      { id: 'd_cuerda', label: 'Cuerda y arnés o cinta de sujeción', category: 'especifico', required: false },
    ],
  },
  viento_fuerte: {
    type: 'viento_fuerte',
    title: 'Vientos Fuertes / Paracas',
    riskLevel: 'Alto',
    infographicFile: '/evacuacion_heladas_friajes.jpg',
    description: 'Ráfagas intensas de viento (más de 40 km/h) con levantamiento de polvo y arena, afectando techos ligeros y visibilidad.',
    primaryCause: 'Gradientes de presión atmosférica entre el anticiclón del Pacífico Sur y cordillera andina (SENAMHI)',
    warningTime: 'Horas a 2 días según aviso meteorológico SENAMHI',
    recommendedActions: [
      'Asegurar y fijar techos de calamina, cartón o madera con pernos o sacos de arena.',
      'Alejarse de árboles altos, postes eléctricos, letreros y cables de alta tensión.',
      'Cerrar y asegurar puertas y ventanas, protegiendo vidrios con cinta adhesiva.',
      'Suspender actividades al aire libre y deportes en zonas expuestas durante la alerta.',
    ],
    backpackItems: [
      { id: 'vf_gafas', label: 'Gafas de seguridad herméticas antipolvo / arena', category: 'especifico', required: true },
      { id: 'vf_mascarilla', label: 'Mascarilla KN95 contra partículas suspendidas', category: 'esencial', required: true },
      { id: 'vf_linterna', label: 'Linterna recargable con batería de repuesto', category: 'esencial', required: true },
      { id: 'vf_cuerda', label: 'Cuerda de amarre y cinta aislante gruesa', category: 'especifico', required: true },
    ],
  },
  granizada: {
    type: 'granizada',
    title: 'Granizada y Tormentas Eléctricas',
    riskLevel: 'Alto',
    infographicFile: '/evacuacion_heladas_friajes.jpg',
    description: 'Precipitación de trozos compactos de hielo acompañada de descargas eléctricas en valles y quebradas andinas.',
    primaryCause: 'Nubes cumulonimbus de gran desarrollo vertical en la Sierra central y sur',
    warningTime: 'Minutos a pocas horas según radar y avisos de corto plazo SENAMHI',
    recommendedActions: [
      'Refugiarse inmediatamente en construcciones sólidas con techo resistente.',
      'Evitar refugiarse debajo de árboles aislados o estructuras metálicas altas.',
      'Limpiar canaletas y desagües de techos para prevenir acumulación y colapso por peso.',
      'Desconectar artefactos eléctricos para evitar daños por sobretensión de rayos.',
    ],
    backpackItems: [
      { id: 'gr_casco', label: 'Casco o gorro grueso de protección craneal', category: 'especifico', required: true },
      { id: 'gr_impermeable', label: 'Poncho impermeable térmico para lluvia y granizo', category: 'esencial', required: true },
      { id: 'gr_botas', label: 'Botas de jebe antideslizantes', category: 'esencial', required: true },
      { id: 'gr_linterna', label: 'Linterna frontal manos libres', category: 'especifico', required: true },
    ],
  },
};

// Aliases para soportar mayúsculas y variantes en DISASTER_PROTOCOLS
Object.keys(DISASTER_PROTOCOLS).forEach((key) => {
  const upper = key.toUpperCase();
  if (!DISASTER_PROTOCOLS[upper]) {
    DISASTER_PROTOCOLS[upper] = { ...DISASTER_PROTOCOLS[key] };
  }
});
DISASTER_PROTOCOLS['HUAYCO_DESLIZAMIENTO'] = DISASTER_PROTOCOLS['huayco_deslizamiento'];
DISASTER_PROTOCOLS['VIENTO_FUERTE'] = DISASTER_PROTOCOLS['viento_fuerte'];
DISASTER_PROTOCOLS['GRANIZADA'] = DISASTER_PROTOCOLS['granizada'];
DISASTER_PROTOCOLS['HELADA_FRIAJE'] = DISASTER_PROTOCOLS['helada_friaje'];
DISASTER_PROTOCOLS['ERUPCION_VOLCANICA'] = DISASTER_PROTOCOLS['erupcion_volcanica'];

// Helper seguro para obtener el protocolo de cualquier desastre en minúsculas o mayúsculas
export function getDisasterProtocol(type?: string | DisasterType): DisasterInfo {
  if (!type) return DISASTER_PROTOCOLS.sismo;
  const keyLower = String(type).toLowerCase().trim();
  if (DISASTER_PROTOCOLS[keyLower]) return DISASTER_PROTOCOLS[keyLower];
  if (DISASTER_PROTOCOLS[String(type)]) return DISASTER_PROTOCOLS[String(type)];
  if (keyLower.includes('huayco') || keyLower.includes('deslizamiento')) {
    return DISASTER_PROTOCOLS.huayco_deslizamiento || DISASTER_PROTOCOLS.huayco;
  }
  if (keyLower.includes('volcan')) return DISASTER_PROTOCOLS.erupcion_volcanica;
  if (keyLower.includes('viento')) return DISASTER_PROTOCOLS.viento_fuerte;
  if (keyLower.includes('graniz')) return DISASTER_PROTOCOLS.granizada;
  if (keyLower.includes('frio') || keyLower.includes('helada') || keyLower.includes('friaje')) {
    return DISASTER_PROTOCOLS.helada_friaje;
  }
  return DISASTER_PROTOCOLS.sismo;
}

// División oficial de Perú con evaluación multirriesgo INDECI por distrito
export const PERU_DEPARTMENTS: DepartmentData[] = (completeDepartmentsJson as unknown as DepartmentData[]).map((dept) => ({
  ...dept,
  provinces: dept.provinces.map((prov) => ({
    ...prov,
    districts: prov.districts.map((dist) => {
      // Normalizar nombre de distrito con nombres populares / duales
      const formattedName =
        dist.name === 'Lurigancho' || dist.name === 'Lurigancho-Chosica'
          ? 'Lurigancho (Chosica)'
          : dist.name;

      // Identificar todos los tipos de desastres de acuerdo al departamento, provincia y distrito
      const identifiedDisasters = getDisasterTypesForDistrict({
        districtName: formattedName,
        provinceName: prov.name,
        departmentName: dept.name,
        region: dist.region || dept.region,
        altitudeMeters: dist.altitudeMeters || 0,
      });

      return {
        ...dist,
        name: formattedName,
        // Convertimos a minúsculas para compatibilidad estándar con el resto de componentes y tipos
        predominantDisasters: identifiedDisasters.map((d) => d.toLowerCase() as DisasterType),
      };
    }),
  })),
}));

// Normalizador de texto para búsqueda (remueve tildes, diacríticos y espacios sobrantes)
const normalizeSearchText = (text: string) =>
  (text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

// Aliases populares de ciudades / distritos para búsqueda rápida
const POPULAR_ALIASES: Record<string, string[]> = {
  chosica: ['lurigancho', 'chosica', 'lurigancho (chosica)'],
  lurigancho: ['chosica', 'lurigancho (chosica)'],
  chimbote: ['santa', 'chimbote'],
  pucallpa: ['calleria', 'coronel portillo', 'pucallpa'],
  tarapoto: ['san martin', 'tarapoto'],
  huacho: ['huaura', 'huacho'],
  cuzco: ['cusco'],
};

// Helper to quickly search districts, provinces, and departments
export function searchLocations(query: string) {
  const q = normalizeSearchText(query);
  if (!q) return [];
  const results: {
    department: DepartmentData;
    province: ProvinceData;
    district: DistrictData;
  }[] = [];

  for (const dept of PERU_DEPARTMENTS) {
    const normDept = normalizeSearchText(dept.name);
    for (const prov of dept.provinces) {
      const normProv = normalizeSearchText(prov.name);
      for (const dist of prov.districts) {
        const normDist = normalizeSearchText(dist.name);
        const normClimate = normalizeSearchText(dist.climateType || '');

        // Verificar coincidencia por alias
        let matchesAlias = false;
        for (const [aliasKey, aliasTargets] of Object.entries(POPULAR_ALIASES)) {
          if (q.includes(aliasKey) || aliasKey.includes(q)) {
            if (aliasTargets.some((target) => normDist.includes(target) || normProv.includes(target))) {
              matchesAlias = true;
              break;
            }
          }
        }

        if (
          normDist.includes(q) ||
          normProv.includes(q) ||
          normDept.includes(q) ||
          normClimate.includes(q) ||
          matchesAlias ||
          dist.predominantDisasters.some((d) => normalizeSearchText(d).includes(q))
        ) {
          results.push({ department: dept, province: prov, district: dist });
        }
      }
    }
  }

  // Priorizar resultados donde el nombre del distrito coincide exactamente o empieza con la consulta
  return results.sort((a, b) => {
    const aNorm = normalizeSearchText(a.district.name);
    const bNorm = normalizeSearchText(b.district.name);
    const aStarts = aNorm.startsWith(q) || (q.includes('chosic') && aNorm.includes('chosica'));
    const bStarts = bNorm.startsWith(q) || (q.includes('chosic') && bNorm.includes('chosica'));
    if (aStarts && !bStarts) return -1;
    if (!aStarts && bStarts) return 1;
    return 0;
  });
}

/**
 * Calcula con fórmula de Haversine el distrito peruano más cercano a las coordenadas GPS dadas.
 */
export function findClosestDistrict(lat: number, lng: number) {
  let closest: {
    department: DepartmentData;
    province: typeof PERU_DEPARTMENTS[0]['provinces'][0];
    district: typeof PERU_DEPARTMENTS[0]['provinces'][0]['districts'][0];
    distanceKm: number;
  } | null = null;

  let minDistance = Infinity;

  for (const dept of PERU_DEPARTMENTS) {
    for (const prov of dept.provinces) {
      for (const dist of prov.districts) {
        const dLat = (dist.lat - lat) * (Math.PI / 180);
        const dLng = (dist.lng - lng) * (Math.PI / 180);
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(lat * (Math.PI / 180)) *
            Math.cos(dist.lat * (Math.PI / 180)) *
            Math.sin(dLng / 2) *
            Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distanceKm = 6371 * c;

        if (distanceKm < minDistance) {
          minDistance = distanceKm;
          closest = { department: dept, province: prov, district: dist, distanceKm };
        }
      }
    }
  }

  return closest;
}

