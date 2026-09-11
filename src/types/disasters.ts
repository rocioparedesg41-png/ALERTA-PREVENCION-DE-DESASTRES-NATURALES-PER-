export type NaturalRegion = 'Costa' | 'Sierra' | 'Selva';

export type DisasterType =
  | 'sismo'
  | 'tsunami'
  | 'huayco'
  | 'inundacion'
  | 'helada_friaje'
  | 'sequia'
  | 'erupcion_volcanica'
  | 'deslizamiento';

export interface DisasterInfo {
  type: DisasterType;
  title: string;
  riskLevel: 'Bajo' | 'Medio' | 'Alto' | 'Extremo';
  infographicFile: string;
  description: string;
  primaryCause: string;
  warningTime: string;
  recommendedActions: string[];
  backpackItems: {
    id: string;
    label: string;
    category: 'esencial' | 'medico' | 'especifico';
    required: boolean;
  }[];
}

export interface DistrictData {
  name: string;
  lat: number;
  lng: number;
  altitudeMeters: number;
  region: NaturalRegion;
  climateType: string; // From the 38 climate classifications of Peru
  predominantDisasters: DisasterType[];
  activeThreat?: {
    type: DisasterType;
    intensity: string;
    message: string;
  };
  safeZones: {
    name: string;
    type: 'Punto de Encuentro' | 'Zona Alta' | 'Refugio Temporal' | 'Estadio/Parque';
    lat: number;
    lng: number;
    distanceMeters: number;
    routeDescription: string;
  }[];
}

export interface ProvinceData {
  name: string;
  districts: DistrictData[];
}

export interface DepartmentData {
  id: string;
  name: string;
  capital: string;
  region: NaturalRegion;
  provinces: ProvinceData[];
}

export interface EmergencyContact {
  id: 'contact1' | 'contact2';
  name: string;
  phone: string;
  relationship: string;
}

export interface OfficialEntity {
  acronym: string;
  name: string;
  role: string;
  url: string;
  badgeColor: string;
  iconName: string;
  lastReport: string;
}
