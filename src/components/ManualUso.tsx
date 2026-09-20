import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  BookOpen,
  MapPin,
  Map,
  Volume2,
  Backpack,
  PhoneCall,
  Send,
  Radio,
  FileDown,
  Download,
  ShieldAlert,
  HelpCircle,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Smartphone,
  Info,
  Layers,
  Sparkles,
} from 'lucide-react';
import { AppTab } from '../App';

interface ManualUsoProps {
  onNavigateTab: (tab: AppTab) => void;
  onOpenDownloadModal: () => void;
  onOpenSos: () => void;
  onOpenPhones: () => void;
  onOpenLiveNews: () => void;
}

export const ManualUso: React.FC<ManualUsoProps> = ({
  onNavigateTab,
  onOpenDownloadModal,
  onOpenSos,
  onOpenPhones,
  onOpenLiveNews,
}) => {
  const [activeSection, setActiveSection] = useState<string>('intro');

  const manualSections = [
    {
      id: 'intro',
      title: '1. Introducción y Propósito de SAPDENP',
      icon: ShieldAlert,
      tag: 'General',
    },
    {
      id: 'ubicacion',
      title: '2. Selector Territorial y GPS (1893 Distritos)',
      icon: MapPin,
      tag: 'Jurisdicción',
    },
    {
      id: 'mapa',
      title: '3. Cartografía y Rutas de Evacuación',
      icon: Map,
      tag: 'Leaflet',
    },
    {
      id: 'alarma',
      title: '4. Alarma Sísmica y Sirena de Emergencia',
      icon: Volume2,
      tag: 'Acústica',
    },
    {
      id: 'infografias',
      title: '5. Protocolos e Infografías Oficiales INDECI',
      icon: BookOpen,
      tag: 'Prevención',
    },
    {
      id: 'mochila',
      title: '6. Mochila de Emergencia (72 Horas)',
      icon: Backpack,
      tag: 'Checklist',
    },
    {
      id: 'sos',
      title: '7. Central SOS y Líneas de Auxilio',
      icon: PhoneCall,
      tag: 'Rescate',
    },
    {
      id: 'reportes',
      title: '8. Reportes Oficiales en Tiempo Real 24h',
      icon: Radio,
      tag: 'IGP/SENAMHI',
    },
    {
      id: 'instalacion',
      title: '9. Descarga e Instalación (Web • iOS • Android)',
      icon: Download,
      tag: 'PWA Offline',
    },
  ];

  return (
    <div id="seccion-manual-de-uso" className="space-y-6">
      {/* Hero Header del Manual */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl p-6 sm:p-8 border border-slate-700 shadow-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-600/30 border border-red-500/50 flex items-center justify-center text-red-400 shrink-0">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30 text-[10px] font-bold uppercase tracking-wider">
                  Guía Oficial del Usuario
                </span>
                <span className="text-xs text-slate-400">Edición 2026</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black mt-1">
                Manual de Uso y Operaciones del Sistema
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
                Aprende a utilizar cada herramienta preventiva, la cartografía interactiva, los protocolos de evacuación y las funciones de comunicación de auxilio ante desastres naturales en el Perú.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onOpenDownloadModal}
              className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
            >
              <Download className="w-4 h-4" />
              <span>Instalar App Offline</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid: Navigation Sidebar & Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Sidebar Index */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm space-y-1.5 sticky top-20">
          <div className="px-2 py-1.5 mb-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Módulos del Manual
            </span>
            <span className="text-[10px] font-semibold text-red-600">9 Secciones</span>
          </div>

          {manualSections.map((sec) => {
            const Icon = sec.icon;
            const isActive = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => setActiveSection(sec.id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                  isActive
                    ? 'bg-red-600 text-white shadow-xs font-bold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  <span className="truncate">{sec.title}</span>
                </div>
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider shrink-0 ml-2 ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {sec.tag}
                </span>
              </button>
            );
          })}
        </div>

        {/* Content Panel */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm text-slate-800 dark:text-slate-200 space-y-6">
          {/* SECCIÓN 1: INTRO */}
          {activeSection === 'intro' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200 dark:border-slate-800">
                <ShieldAlert className="w-5 h-5 text-red-600" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  1. Introducción y Propósito del Sistema SAPDENP
                </h3>
              </div>
              <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                El <strong>SAPDENP (Sistema de Alerta y Prevención de Desastres Naturales del Perú)</strong> es una plataforma tecnológica integral diseñada para proporcionar a los ciudadanos, brigadistas, autoridades y familias peruanas información georreferenciada inmediata ante amenazas naturales.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <h4 className="font-bold text-xs text-red-600 uppercase tracking-wider mb-1">
                    Amenazas Monitoreadas
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Sismos de gran magnitud, tsunamis costeros, huaicos, inundaciones estacionales, heladas y friajes andinos/amazónicos, sequías y erupciones volcánicas activas en el sur del país.
                  </p>
                </div>
                <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <h4 className="font-bold text-xs text-blue-600 uppercase tracking-wider mb-1">
                    Cobertura Integral
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Datos adaptados a los 24 departamentos, la Provincia Constitucional del Callao, las 196 provincias y los 1,893 distritos del Perú con altitudes y coordenadas oficiales.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SECCIÓN 2: UBICACIÓN */}
          {activeSection === 'ubicacion' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200 dark:border-slate-800">
                <MapPin className="w-5 h-5 text-red-600" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  2. Selector Territorial y GPS
                </h3>
              </div>
              <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                La aplicación permite personalizar los protocolos y rutas de evacuación para el lugar exacto donde te encuentres:
              </p>
              <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300">
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <strong>Paso 1 - Selección Manual:</strong> Utiliza las tres listas desplegables para elegir tu <strong>Departamento</strong>, <strong>Provincia</strong> y <strong>Distrito</strong>. Automáticamente el sistema cargará la altitud (m s. n. m.), el nivel de riesgo y los peligros predominantes.
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <strong>Paso 2 - Geolocalización GPS:</strong> Presiona el botón con el ícono de brújula/GPS (<em>"Detectar mi ubicación GPS"</em>). Tu navegador solicitará permiso de ubicación y encontrará de manera automática tu distrito más cercano.
                </div>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => onNavigateTab('ubicacion')}
                  className="px-4 py-2 bg-slate-900 dark:bg-white dark:text-slate-900 text-white font-bold text-xs rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <span>Ir a Ubicación y Riesgos</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* SECCIÓN 3: MAPA */}
          {activeSection === 'mapa' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200 dark:border-slate-800">
                <Map className="w-5 h-5 text-red-600" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  3. Cartografía y Rutas de Evacuación (Leaflet)
                </h3>
              </div>
              <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                La pestaña <strong>"Mapa y Evacuación"</strong> integra un visor cartográfico interactivo basado en Leaflet con capas especializadas para emergencias:
              </p>
              <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300 list-disc list-inside">
                <li><strong>Capas Cartográficas:</strong> Alterna entre vista estándar de calles (OpenStreetMap) y vista satelital de alta resolución (Esri World Imagery).</li>
                <li><strong>Rutas de Evacuación:</strong> Líneas resaltadas que marcan los caminos seguros hacia zonas altas o explanadas libres de colapso.</li>
                <li><strong>Puntos de Encuentro Seguro:</strong> Parques, plazas principales, estadios y explanadas previamente inspeccionadas por Defensa Civil.</li>
                <li><strong>Centros de Salud y Hospitales:</strong> Ubicación georreferenciada de postas médicas, clínicas y hospitales de referencia con capacidad de atención de traumatología y triaje.</li>
              </ul>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => onNavigateTab('mapa')}
                  className="px-4 py-2 bg-slate-900 dark:bg-white dark:text-slate-900 text-white font-bold text-xs rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <span>Abrir Mapa Interactivo</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* SECCIÓN 4: ALARMA */}
          {activeSection === 'alarma' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200 dark:border-slate-800">
                <Volume2 className="w-5 h-5 text-red-600" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  4. Alarma Sísmica y Sirena de Emergencia
                </h3>
              </div>
              <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                La barra superior de advertencia reproduce una sirena estandarizada de emergencia para alertar a los miembros del hogar o brigada:
              </p>
              <div className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
                <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
                  <strong className="text-red-700 dark:text-red-300">Activación Sonora:</strong> En caso de simulacro o alerta en curso, puedes presionar el botón <strong>"ACTIVAR ALARMA"</strong> para reproducir el tono acústico de emergencia.
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
                  <strong>Silenciamiento:</strong> En cualquier momento puedes pausar la sirena presionando <strong>"SILENCIAR ALARMA"</strong>.
                </div>
              </div>
            </div>
          )}

          {/* SECCIÓN 5: INFOGRAFÍAS */}
          {activeSection === 'infografias' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200 dark:border-slate-800">
                <BookOpen className="w-5 h-5 text-red-600" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  5. Protocolos e Infografías Oficiales INDECI
                </h3>
              </div>
              <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                El módulo de infografías contiene los lineamientos técnicos aprobados por el Instituto Nacional de Defensa Civil (INDECI) para cada fase de la emergencia:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <span className="font-bold text-amber-700 dark:text-amber-300 block mb-1">1. PREPÁRATE (Antes)</span>
                  Identifica zonas seguras internas, elabora tu plan familiar y ten lista tu mochila de emergencia.
                </div>
                <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
                  <span className="font-bold text-red-700 dark:text-red-300 block mb-1">2. UBÍCATE (Durante)</span>
                  Mantén la calma, aléjate de ventanas, postes o repisas, y protégete en columnas o muros portantes.
                </div>
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                  <span className="font-bold text-emerald-700 dark:text-emerald-300 block mb-1">3. EVACÚA (Después)</span>
                  Desconecta gas y electricidad, camina con paso firme hacia el punto de reunión sin utilizar ascensores.
                </div>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => onNavigateTab('infografias')}
                  className="px-4 py-2 bg-slate-900 dark:bg-white dark:text-slate-900 text-white font-bold text-xs rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <span>Ver Infografías Oficiales</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* SECCIÓN 6: MOCHILA */}
          {activeSection === 'mochila' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200 dark:border-slate-800">
                <Backpack className="w-5 h-5 text-red-600" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  6. Mochila de Emergencia (72 Horas)
                </h3>
              </div>
              <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                La pestaña <strong>"Mochila de Emergencia"</strong> te permite verificar que tu kit familiar contenga todos los artículos de supervivencia para subsistir las primeras 72 horas:
              </p>
              <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300 list-disc list-inside">
                <li><strong>Artículos Esenciales:</strong> Agua embotellada no gasificada, alimentos enlatados con abre fácil, linterna a pilas o dínamo, radio portátil AM/FM, silbato y manta polar.</li>
                <li><strong>Botiquín de Primeros Auxilios:</strong> Alcohol, gasas estériles, vendas elásticas, analgésicos y medicamentos para familiares con condiciones crónicas.</li>
                <li><strong>Kit de Bioseguridad e Higiene:</strong> Mascarillas KN95, alcohol en gel, toallitas húmedas, bolsas de basura resistentes y papel higiénico.</li>
                <li><strong>Herramientas y Comunicación:</strong> Navaja multiusos, cinta aislante, cargador solar o powerbank portátil y libreta de teléfonos clave.</li>
              </ul>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => onNavigateTab('mochila')}
                  className="px-4 py-2 bg-slate-900 dark:bg-white dark:text-slate-900 text-white font-bold text-xs rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <span>Abrir Checklist de Mochila</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* SECCIÓN 7: SOS */}
          {activeSection === 'sos' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200 dark:border-slate-800">
                <PhoneCall className="w-5 h-5 text-red-600" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  7. Central SOS y Líneas de Auxilio
                </h3>
              </div>
              <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                En situaciones de riesgo inminente o corte de telecomunicaciones, la plataforma cuenta con mecanismos de auxilio directo:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-center">
                  <span className="text-2xl font-black text-red-600 block">105</span>
                  <span className="font-bold text-slate-900 dark:text-white mt-1 block">Policía Nacional</span>
                  <span className="text-slate-500 text-[11px]">Seguridad y rescate</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-center">
                  <span className="text-2xl font-black text-red-600 block">116</span>
                  <span className="font-bold text-slate-900 dark:text-white mt-1 block">Bomberos Perú</span>
                  <span className="text-slate-500 text-[11px]">Incendios y atrapamientos</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-center">
                  <span className="text-2xl font-black text-red-600 block">106</span>
                  <span className="font-bold text-slate-900 dark:text-white mt-1 block">SAMU</span>
                  <span className="text-slate-500 text-[11px]">Ambulancias de urgencia</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  type="button"
                  onClick={onOpenSos}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Probar Mensajería SOS Georreferenciada</span>
                </button>
                <button
                  type="button"
                  onClick={onOpenPhones}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-lg flex items-center gap-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  <PhoneCall className="w-4 h-4 text-red-600" />
                  <span>Directorio Telefónico Nacional</span>
                </button>
              </div>
            </div>
          )}

          {/* SECCIÓN 8: REPORTES */}
          {activeSection === 'reportes' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200 dark:border-slate-800">
                <Radio className="w-5 h-5 text-red-600" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  8. Reportes Oficiales en Tiempo Real 24h
                </h3>
              </div>
              <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                La plataforma sincroniza continuamente datos técnicos de los organismos científicos del Perú:
              </p>
              <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300 list-disc list-inside">
                <li><strong>IGP (Instituto Geofísico del Perú):</strong> Magnitud, profundidad focal, coordenadas epicentrales e intensidad instrumental.</li>
                <li><strong>SENAMHI (Servicio Nacional de Meteorología e Hidrología):</strong> Avisos de lluvias torrenciales, activación de quebradas e incremento de caudal de ríos.</li>
                <li><strong>DHN (Dirección de Hidrografía y Navegación):</strong> Monitoreo mareográfico y evaluación de alertas de tsunami para el litoral peruano.</li>
                <li><strong>Generación de Reportes PDF:</strong> Puedes generar e imprimir el reporte técnico instrumental oficial validado por CENSIS en formato PDF sin depender de servidores externos.</li>
              </ul>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onOpenLiveNews}
                  className="px-4 py-2 bg-slate-900 dark:bg-white dark:text-slate-900 text-white font-bold text-xs rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Radio className="w-4 h-4 text-red-400" />
                  <span>Ver Noticias y Fuentes en Vivo</span>
                </button>
              </div>
            </div>
          )}

          {/* SECCIÓN 9: INSTALACIÓN */}
          {activeSection === 'instalacion' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200 dark:border-slate-800">
                <Download className="w-5 h-5 text-red-600" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  9. Descarga e Instalación (Web • iOS • Android)
                </h3>
              </div>
              <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                Esta aplicación está diseñada con tecnología PWA (Progressive Web App), lo que significa que puedes instalarla directamente en cualquier dispositivo móvil o computadora y funcionará incluso cuando se corten el internet o la energía eléctrica.
              </p>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3 text-xs">
                <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-emerald-500" />
                  <span>Pasos para Instalar en tu Celular o Computadora:</span>
                </h4>
                <div className="space-y-2">
                  <p>
                    <strong>En Android (Chrome / Edge):</strong> Toca el menú de tres puntos (⋮) en la esquina superior de Chrome y pulsa <em>"Instalar aplicación"</em> o <em>"Agregar a la pantalla principal"</em>.
                  </p>
                  <p>
                    <strong>En iPhone / iPad (Safari):</strong> Toca el botón <em>Compartir ⎘</em> en la barra inferior de Safari, desliza hacia abajo y presiona <em>"Agregar al inicio (+)"</em>.
                  </p>
                  <p>
                    <strong>En PC / Laptop (Windows / Mac):</strong> Haz clic en el ícono de instalación ⨁ que aparece a la derecha en la barra de direcciones de tu navegador.
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onOpenDownloadModal}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Abrir Ventana de Descarga e Instalación</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
