export const OFFICIAL_SOURCES = {
  DHN: {
    name: 'DHN - Dirección de Hidrografía y Navegación',
    baseUrl: 'https://www.dhn.mil.pe',
    reportesUrl: 'https://www.dhn.mil.pe/aviso_peligro_maritimo',
    boletinUrl: 'https://www.dhn.mil.pe/maregrafo_tiempo_real',
  },
  IGP: {
    name: 'IGP - Instituto Geofísico del Perú',
    baseUrl: 'https://www.igp.gob.pe',
    reportesUrl: 'https://ultimosismo.igp.gob.pe',
    boletinUrl: 'https://www.igp.gob.pe/servicios/sismicidad-en-tiempo-real',
  },
  SENAMHI: {
    name: 'SENAMHI',
    baseUrl: 'https://www.senamhi.gob.pe',
    reportesUrl: 'https://www.senamhi.gob.pe/?p=pronostico-detalle-turistico',
    boletinUrl: 'https://www.senamhi.gob.pe/main.php?dp=lima&p=aviso-meteorologico',
  },
  INDECI: {
    name: 'INDECI',
    baseUrl: 'https://www.indeci.gob.pe',
    reportesUrl: 'https://www.indeci.gob.pe/emergencias-y-desastres/reporte-de-emergencias/',
    boletinUrl: 'https://www.indeci.gob.pe/boletin-informativo/',
  },
  COEN: {
    name: 'COEN - Centro de Operaciones de Emergencia Nacional',
    baseUrl: 'https://www.indeci.gob.pe',
    reportesUrl: 'https://www.indeci.gob.pe/emergencias-y-desastres/reporte-de-emergencias/',
    boletinUrl: 'https://www.indeci.gob.pe/boletines-coen/',
  },
  CENEPRED: {
    name: 'CENEPRED',
    baseUrl: 'https://www.cenepred.gob.pe',
    reportesUrl: 'https://www.cenepred.gob.pe/web/informes-tecnicos/',
    boletinUrl: 'https://sigrid.cenepred.gob.pe/sigridv3/',
  },
  SIGRID: {
    name: 'SIGRID - CENEPRED',
    baseUrl: 'https://sigrid.cenepred.gob.pe',
    reportesUrl: 'https://sigrid.cenepred.gob.pe/sigridv3/territorio',
    boletinUrl: 'https://sigrid.cenepred.gob.pe/sigridv3/',
  },
  ENFEN: {
    name: 'ENFEN - Comisión Multisectorial del Estudio Nacional del Fenómeno El Niño',
    baseUrl: 'https://enfen.imarpe.gob.pe/',
    reportesUrl: 'https://enfen.imarpe.gob.pe/comunicados/',
    boletinUrl: 'https://enfen.imarpe.gob.pe/comunicados/',
  },
} as const;