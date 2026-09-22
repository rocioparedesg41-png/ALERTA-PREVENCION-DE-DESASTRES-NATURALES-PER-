import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldAlert,
  MapPin,
  Radio,
  Send,
  PhoneCall,
  FileText,
  AlertOctagon,
  ExternalLink,
  ChevronRight,
  Compass,
  Map,
  BookOpen,
  Backpack,
  PhoneForwarded,
  Layers,
  Sparkles,
  Smartphone,
  BookMarked,
  Download,
  AlertCircle,
} from 'lucide-react';
import { DepartmentData, DistrictData, DisasterType, ProvinceData } from './types/disasters';
import { PERU_DEPARTMENTS, findClosestDistrict } from './data/peruData';
import { LoginCover } from './components/LoginCover';
import { HeaderNav } from './components/HeaderNav';
import { AlarmBanner } from './components/AlarmBanner';
import { LocationSelector } from './components/LocationSelector';
import { PeruMapViewer } from './components/PeruMapViewer';
import { MapErrorBoundary } from './components/MapErrorBoundary';
import { DisasterRiskCard } from './components/DisasterRiskCard';
import { InfographicViewer } from './components/InfographicViewer';
import { ChecklistOk } from './components/ChecklistOk';
import { SosModal } from './components/SosModal';
import { OfficialEntitiesModal } from './components/OfficialEntitiesModal';
import { TermsModal } from './components/TermsModal';
import { LiveNewsModal } from './components/LiveNewsModal';
import { Reporte24Horas } from './components/Reporte24Horas';
import { ManualModal } from './components/ManualModal';
import { ShieldModal } from './components/ShieldModal';
import { DownloadModal } from './components/DownloadModal';
import { alarmManager } from './utils/audioAlarm';
import {
  EventoSismicoDetectado,
  verificarSismoEnUbicacion,
  verificarSismosEnRegion24h,
  dispararAlarmaSismica,
  simularSismoEnUbicacion,
} from './servicios/monitoreoSismico';

export type AppTab = 'ubicacion' | 'mapa' | 'infografias' | 'mochila' | 'emergencia';

export default function App() {
  // Authentication state - Se inicia siempre en la portada de inicio según requerimiento
  const [currentUser, setCurrentUser] = useState<{ email: string; name: string } | null>(null);

  // Active Application Tab (eliminates long landing page scrolling)
  const [activeTab, setActiveTab] = useState<AppTab>('ubicacion');

  // Selected Geography: Configura la vista inicial exclusivamente por defecto en Lima, Lima, Lima
  const [selectedDept, setSelectedDept] = useState<DepartmentData>(() => {
    return PERU_DEPARTMENTS.find((d) => d.id === 'lima' || d.name.toLowerCase() === 'lima') || PERU_DEPARTMENTS[0];
  });

  const [selectedProv, setSelectedProv] = useState<ProvinceData>(() => {
    const limaDept = PERU_DEPARTMENTS.find((d) => d.id === 'lima' || d.name.toLowerCase() === 'lima') || PERU_DEPARTMENTS[0];
    return limaDept.provinces.find((p) => p.name.toLowerCase() === 'lima') || limaDept.provinces[0];
  });

  const [selectedDist, setSelectedDist] = useState<DistrictData>(() => {
    const limaDept = PERU_DEPARTMENTS.find((d) => d.id === 'lima' || d.name.toLowerCase() === 'lima') || PERU_DEPARTMENTS[0];
    const limaProv = limaDept.provinces.find((p) => p.name.toLowerCase() === 'lima') || limaDept.provinces[0];
    return (
      limaProv.districts.find((di) => di.name.toLowerCase() === 'lima' || di.name.toLowerCase().includes('cercado')) ||
      limaProv.districts[0]
    );
  });

  // Active Disaster
  const [activeDisaster, setActiveDisaster] = useState<DisasterType>(() => 'sismo');

  // Active Seismic Event detected at user location
  const [activeSeismicEvent, setActiveSeismicEvent] = useState<EventoSismicoDetectado | null>(null);

  // Modals state
  const [isSosOpen, setIsSosOpen] = useState(false);
  const [isPhonesOpen, setIsPhonesOpen] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [isLiveNewsOpen, setIsLiveNewsOpen] = useState(false);
  const [isShieldOpen, setIsShieldOpen] = useState(false);
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);

  // Monitoreo y Verificación Continua de Sismos en la Ubicación Seleccionada o Georreferenciada
  useEffect(() => {
    let cancelado = false;

    const revisarSismosEnUbicacion = async () => {
      try {
        const evento = await verificarSismoEnUbicacion({
          departamento: selectedDept.name,
          provincia: selectedProv.name,
          distrito: selectedDist.name,
          lat: selectedDist.lat,
          lng: selectedDist.lng,
        });

        if (!cancelado && evento) {
          console.log('[Sismo] ¡Evento sísmico detectado en tu ubicación!', evento);
          setActiveSeismicEvent(evento);
          setActiveDisaster('sismo');
          await dispararAlarmaSismica(evento);
        }
      } catch (err) {
        console.warn('[Sismo] Error en verificación sísmica periódica:', err);
      }
    };

    // Verificación inmediata al cargar o al cambiar la ubicación
    revisarSismosEnUbicacion();

    // Verificación recurrente en segundo plano cada 45 segundos
    const intervalo = setInterval(revisarSismosEnUbicacion, 45000);

    // Escuchar eventos globales de alarma sísmica
    const onAlarmaSismica = (e: any) => {
      if (e.detail) {
        setActiveSeismicEvent(e.detail);
        setActiveDisaster('sismo');
      }
    };
    window.addEventListener('alarma-sismica-disparada', onAlarmaSismica);

    return () => {
      cancelado = true;
      clearInterval(intervalo);
      window.removeEventListener('alarma-sismica-disparada', onAlarmaSismica);
    };
  }, [selectedDept.name, selectedProv.name, selectedDist.name, selectedDist.lat, selectedDist.lng]);

  // Verificación si hay sismo en la región en las últimas 24 horas (activa el icono de admiración que late de reporte 24h)
  const [haySismoEnRegion24h, setHaySismoEnRegion24h] = useState<boolean>(false);

  useEffect(() => {
    let cancelado = false;
    verificarSismosEnRegion24h(selectedDept.name)
      .then((eventos) => {
        if (!cancelado) setHaySismoEnRegion24h(eventos.length > 0);
      })
      .catch(() => {
        if (!cancelado) setHaySismoEnRegion24h(false);
      });

    const intervaloRegion = setInterval(() => {
      verificarSismosEnRegion24h(selectedDept.name)
        .then((eventos) => {
          if (!cancelado) setHaySismoEnRegion24h(eventos.length > 0);
        })
        .catch(() => {});
    }, 45000);

    return () => {
      cancelado = true;
      clearInterval(intervaloRegion);
    };
  }, [selectedDept.name]);

  // Solicitar permiso de notificaciones para que la alarma suene en segundo plano
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  const handleProbarAlarmaSismica = async () => {
    const sismoPrueba = simularSismoEnUbicacion(
      {
        departamento: selectedDept.name,
        provincia: selectedProv.name,
        distrito: selectedDist.name,
        lat: selectedDist.lat,
        lng: selectedDist.lng,
      },
      6.3
    );
    setActiveSeismicEvent(sismoPrueba);
    setActiveDisaster('sismo');
    await dispararAlarmaSismica(sismoPrueba);
  };

  // Dark and Light Mode state with persistence and automatic system detection
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem('alerta_peru_theme');
      if (saved === 'dark' || saved === 'light') {
        return saved;
      }
      // Detección automática según sistema operativo del dispositivo (iOS, Android, Windows, Mac)
      if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
      return 'light';
    } catch (e) {
      return 'light';
    }
  });

  useEffect(() => {
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      if (metaThemeColor) metaThemeColor.setAttribute('content', '#0b0f19');
    } else {
      document.documentElement.classList.remove('dark');
      if (metaThemeColor) metaThemeColor.setAttribute('content', '#0f172a');
    }
    try {
      localStorage.setItem('alerta_peru_theme', theme);
    } catch (e) {}
  }, [theme]);

  // Escuchar cambios de preferencia de sistema si el usuario no ha forzado un tema manualmente
  useEffect(() => {
    try {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleSystemThemeChange = (e: MediaQueryListEvent) => {
        const saved = localStorage.getItem('alerta_peru_theme');
        if (!saved) {
          setTheme(e.matches ? 'dark' : 'light');
        }
      };
      mediaQuery.addEventListener('change', handleSystemThemeChange);
      return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
    } catch (e) {}
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // When user logs in
  const handleLoginSuccess = (user: { email: string; name: string }) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('peru_alerta_auth_user', JSON.stringify(user));
    } catch (e) {}
  };

  // Logout
  const handleLogout = () => {
    alarmManager.stopAlarm();
    setCurrentUser(null);
    try {
      localStorage.removeItem('peru_alerta_auth_user');
    } catch (e) {}
  };

  // Change location handler
  const handleLocationChange = (dept: DepartmentData, prov: ProvinceData, dist: DistrictData) => {
    setSelectedDept(dept);
    setSelectedProv(prov);
    setSelectedDist(dist);

    // If active disaster is not relevant to this district, switch to primary
    const normActive = activeDisaster.toLowerCase();
    const hasDisaster = dist?.predominantDisasters?.some(
      (d) => d.toLowerCase() === normActive
    );
    if (!hasDisaster) {
      const newDisaster = dist?.predominantDisasters?.[0] || 'sismo';
      setActiveDisaster(newDisaster);
    }
  };

  // If user is not logged in, render the interactive cover with video & translucent glassmorphism
  if (!currentUser) {
    return (
      <LoginCover
        onLoginSuccess={handleLoginSuccess}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    );
  }

  const tabsConfig = [
    {
      id: 'ubicacion' as AppTab,
      label: 'Ubicación y Riesgos',
      icon: MapPin,
      badge: haySismoEnRegion24h ? '¡Sismo 24h!' : `${selectedDept.name}`,
      isSismoAlert: haySismoEnRegion24h,
    },
    {
      id: 'mapa' as AppTab,
      label: 'Mapa y Evacuación',
      icon: Map,
      badge: 'Cartografía',
    },
    {
      id: 'infografias' as AppTab,
      label: 'Infografías y Protocolos',
      icon: BookOpen,
      badge: 'INDECI',
    },
    {
      id: 'mochila' as AppTab,
      label: 'Mochila de Emergencia',
      icon: Backpack,
      badge: '72 Horas',
    },
    {
      id: 'emergencia' as AppTab,
      label: 'Central SOS y Teléfonos',
      icon: PhoneForwarded,
      badge: '105 / 116 / 106',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 font-sans selection:bg-red-600 selection:text-white pb-20 transition-colors duration-200">
      {/* Top Header Navigation */}
      <HeaderNav
        user={currentUser}
        theme={theme}
        onToggleTheme={toggleTheme}
        onLogout={handleLogout}
        onOpenSos={() => setIsSosOpen(true)}
        onOpenPhones={() => setIsPhonesOpen(true)}
        onOpenTerms={() => setIsTermsOpen(true)}
        onOpenManual={() => setIsManualOpen(true)}
        onOpenLiveNews={() => setIsLiveNewsOpen(true)}
        onOpenShieldModal={() => setIsShieldOpen(true)}
        onOpenDownload={() => setIsDownloadOpen(true)}
      />

      {/* Synchronized Siren Alarm Banner */}
      <AlarmBanner
        locationName={selectedDist.name}
        departmentName={selectedDept.name}
        activeSeismicEvent={activeSeismicEvent}
        onDeactivateSeismicEvent={() => setActiveSeismicEvent(null)}
        onTriggerTestAlarm={handleProbarAlarmaSismica}
        currentThreat={{
          type: activeDisaster.toUpperCase(),
          intensity: 'ALTA PRIORIDAD',
          message: activeSeismicEvent
            ? activeSeismicEvent.mensajeAlerta
            : `Alerta Geodinámica en ${selectedDist.name} (${selectedProv.name}, ${selectedDept.name}) con protocolos activos de Defensa Civil e IGP.`,
        }}
      />

      {/* Main Tabbed Application Container */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 pt-5 pb-28 sm:pb-32">
        {/* Navigation Tabs Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-1.5 mb-6">
          <div className="flex items-center justify-between gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {tabsConfig.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 min-w-[135px] sm:min-w-0 py-2.5 px-3 rounded-lg font-medium text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer select-none relative ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-red-400' : 'text-slate-400'}`} />
                  <span className="truncate">{tab.label}</span>
                  {(tab as any).isSismoAlert && (
                    <AlertCircle className="w-3.5 h-3.5 text-red-500 animate-bounce shrink-0" />
                  )}
                  {tab.badge && (
                    <span
                      className={`hidden lg:inline-block text-[10px] px-1.5 py-0.5 rounded font-mono ${
                        (tab as any).isSismoAlert
                          ? 'bg-red-600 text-white font-bold animate-pulse'
                          : isActive
                          ? 'bg-slate-800 text-slate-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                  {isActive && (
                    <motion.div
                      layoutId="activeTabIndicator"
                      className="absolute -bottom-1 left-4 right-4 h-0.5 bg-red-600 rounded-full"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Current Active Location Mini-Status Bar */}
        <div className="bg-white rounded-lg border border-slate-200 px-4 py-3 mb-6 flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs">
          <div className="flex items-center gap-2 text-slate-700">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Jurisdicción Activa:</span>
            <span className="font-bold text-slate-900">
              {selectedDist.name}, {selectedProv.name} ({selectedDept.name})
            </span>
            <span className="hidden sm:inline text-slate-300">•</span>
            <span className="hidden sm:inline text-slate-500 font-mono">
              Altitud: {selectedDist.altitudeMeters ?? 0} m s. n. m.
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Si hay sismo en la región en las últimas 24h, botón con ícono de admiración que late hacia el reporte 24h */}
            {haySismoEnRegion24h && (
              <button
                type="button"
                onClick={() => {
                  setActiveTab('ubicacion');
                  setTimeout(() => {
                    const el = document.getElementById('seccion-reporte-24-horas');
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }, 100);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-red-600 hover:bg-red-700 text-white font-bold text-[10px] uppercase tracking-wider animate-pulse shadow-xs cursor-pointer transition-colors"
                title={`¡Sismo detectado en la región ${selectedDept.name} en las últimas 24 horas! Clic para ver reporte de 24 horas.`}
              >
                <AlertCircle className="w-3.5 h-3.5 animate-bounce shrink-0" />
                <span>Reportes 24h: ¡Sismo en su región!</span>
              </button>
            )}

            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Amenaza:</span>
            <span className="px-2.5 py-0.5 rounded font-bold uppercase text-[10px] bg-red-50 text-red-700 border border-red-200 tracking-wide">
              {activeDisaster}
            </span>
          </div>
        </div>

        {/* Tab Content Panels (Tabbed Application Layout) */}
        <div className="transition-all duration-300">
          <AnimatePresence mode="wait">
            {/* TAB 1: Ubicación & Riesgo Geodinámico */}
            {activeTab === 'ubicacion' && (
              <motion.div
                key="tab-ubicacion"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <LocationSelector
                  selectedDept={selectedDept}
                  selectedProv={selectedProv}
                  selectedDist={selectedDist}
                  onSelectLocation={handleLocationChange}
                />

                {/* Sección de reporte de tipo de desastre reportado durante las últimas 24 horas */}
                <Reporte24Horas
                  district={selectedDist}
                  province={selectedProv}
                  department={selectedDept}
                  onSelectDisaster={(disaster) => {
                    setActiveTab('ubicacion');
                    setActiveDisaster(disaster);
                    setTimeout(() => {
                      const el = document.getElementById('seccion-protocolo-riesgo');
                      if (el) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }, 120);
                  }}
                  onViewInfographic={(disaster) => {
                    setActiveDisaster(disaster);
                    setActiveTab('infografias');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  onOpenLiveNewsModal={() => setIsLiveNewsOpen(true)}
                />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  <div className="lg:col-span-7">
                    <DisasterRiskCard
                      district={selectedDist}
                      activeDisaster={activeDisaster}
                      onSelectDisaster={(disaster) => setActiveDisaster(disaster)}
                      onViewInfographic={(disaster) => {
                        setActiveDisaster(disaster);
                        setActiveTab('infografias');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                    />
                  </div>
                  <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
                    <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                      <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center font-bold">
                        <Layers className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">Protocolos y Módulos de Emergencia</h4>
                        <p className="text-[11px] text-slate-500">Herramientas operativas de respuesta rápida</p>
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      <button
                        type="button"
                        onClick={() => setActiveTab('mapa')}
                        className="w-full text-left p-3.5 bg-white border border-slate-200 rounded-lg hover:border-red-400 hover:bg-slate-50 transition-colors group flex items-center justify-between cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-md bg-slate-100 group-hover:bg-red-50 flex items-center justify-center transition-colors">
                            <Map className="w-4 h-4 text-slate-700 group-hover:text-red-600" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-800 group-hover:text-red-600 transition-colors">PLAN DE EVACUACIÓN Y RUTAS</div>
                            <div className="text-[11px] text-slate-500">Puntos de reunión cercanos e iluminación</div>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 group-hover:text-red-600 transition-all" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveTab('infografias')}
                        className="w-full text-left p-3.5 bg-white border border-slate-200 rounded-lg hover:border-red-400 hover:bg-slate-50 transition-colors group flex items-center justify-between cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-md bg-slate-100 group-hover:bg-red-50 flex items-center justify-center transition-colors">
                            <BookOpen className="w-4 h-4 text-slate-700 group-hover:text-red-600" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-800 group-hover:text-red-600 transition-colors">INFOGRAFÍA OFICIAL INDECI</div>
                            <div className="text-[11px] text-slate-500">Protocolos ante {activeDisaster.toUpperCase()}</div>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 group-hover:text-red-600 transition-all" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveTab('mochila')}
                        className="w-full text-left p-3.5 bg-white border border-slate-200 rounded-lg hover:border-red-400 hover:bg-slate-50 transition-colors group flex items-center justify-between cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-md bg-slate-100 group-hover:bg-red-50 flex items-center justify-center transition-colors">
                            <Backpack className="w-4 h-4 text-slate-700 group-hover:text-red-600" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-800 group-hover:text-red-600 transition-colors">MOCHILA DE EMERGENCIA</div>
                            <div className="text-[11px] text-slate-500">Checklist interactivo de 72 horas</div>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 group-hover:text-red-600 transition-all" />
                      </button>
                    </div>

                    {/* Network & Infrastructure Status Widget (Professional Polish) */}
                    <div className="p-4 bg-zinc-900 rounded-xl text-white mt-4">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                        Estado de Redes Nacionales
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <div className="text-[11px] text-slate-300">Telecomunicaciones</div>
                          <div className="text-xs font-bold text-green-400 flex items-center gap-1.5 mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                            OPERATIVO
                          </div>
                        </div>
                        <div>
                          <div className="text-[11px] text-slate-300">Monitoreo IGP</div>
                          <div className="text-xs font-bold text-green-400 flex items-center gap-1.5 mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                            ACTIVO
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB 2: Mapa y Rutas de Evacuación */}
            {activeTab === 'mapa' && (
              <motion.div
                key="tab-mapa"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <MapErrorBoundary>
                  <PeruMapViewer
                    district={selectedDist}
                    departmentName={selectedDept.name}
                    provinceName={selectedProv.name}
                    onLocationDetected={(dept, prov, dist) => {
                      setSelectedDept(dept);
                      setSelectedProv(prov);
                      setSelectedDist(dist);
                    }}
                  />
                </MapErrorBoundary>
              </motion.div>
            )}

            {/* TAB 3: Infografías y Protocolos INDECI */}
            {activeTab === 'infografias' && (
              <motion.div
                key="tab-infografias"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <InfographicViewer
                  activeDisaster={activeDisaster}
                  onSelectDisaster={(disaster) => setActiveDisaster(disaster)}
                />
              </motion.div>
            )}

            {/* TAB 4: Mochila de Emergencia 72h */}
            {activeTab === 'mochila' && (
              <motion.div
                key="tab-mochila"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <ChecklistOk
                  activeDisaster={activeDisaster}
                  districtName={selectedDist.name}
                />
              </motion.div>
            )}

            {/* TAB 5: Central SOS y Teléfonos de Emergencia */}
            {activeTab === 'emergencia' && (
              <motion.div
                key="tab-emergencia"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                {/* Offline SOS Card */}
                <div className="bg-white rounded-xl border border-slate-200 border-l-4 border-l-red-600 p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="w-10 h-10 rounded-lg bg-red-50 border border-red-200 flex items-center justify-center text-red-600 mb-4">
                      <Send className="w-5 h-5" />
                    </div>
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider">Protocolo Primario</span>
                      <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-[10px] font-bold">OFFLINE ACTIVO</span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mb-2">
                      Mensajería de Emergencia SOS Offline
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed mb-4">
                      Envíe un mensaje SMS preformateado con su ubicación GPS exacta y distrito ({selectedDist.name}) a sus dos contactos de confianza, funcionando 100% sin internet ni red de datos móviles.
                    </p>
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs font-mono text-slate-700 mb-4">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">PLANTILLA SMS AUTOMÁTICA:</p>
                      "EMERGENCIA PERÚ: Necesito ayuda inmediata en {selectedDist.name} ({selectedProv.name}, {selectedDept.name}). Coordenadas aprox: Lat {selectedDist.lat?.toFixed?.(4) ?? selectedDist.lat}, Lng {selectedDist.lng?.toFixed?.(4) ?? selectedDist.lng}."
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <a
                      href={`sms:?body=${encodeURIComponent(`[ALERTA DESASTRE PERÚ] Necesito ayuda inmediata en ${selectedDist.name} (${selectedProv.name}, ${selectedDept.name}). Coordenadas: ${selectedDist.lat?.toFixed?.(4) ?? selectedDist.lat}, ${selectedDist.lng?.toFixed?.(4) ?? selectedDist.lng}`)}`}
                      className="py-2.5 px-3 bg-red-600 hover:bg-red-700 active:scale-[0.99] text-white font-bold text-xs rounded-lg shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer text-center"
                    >
                      <Smartphone className="w-4 h-4" />
                      Enviar SMS Directo
                    </a>
                    <button
                      type="button"
                      onClick={() => setIsSosOpen(true)}
                      className="py-2.5 px-3 bg-slate-900 hover:bg-slate-800 active:scale-[0.99] text-white font-bold text-xs rounded-lg shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                      Configurar Contactos SOS
                    </button>
                  </div>
                </div>

                {/* Emergency Lines Directory */}
                <div className="bg-white rounded-xl border border-slate-200 border-l-4 border-l-slate-800 p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800 mb-4">
                      <PhoneCall className="w-5 h-5 text-red-600" />
                    </div>
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Contactos Críticos</span>
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-[10px] font-bold">24 HORAS</span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mb-2">
                      Líneas Telefónicas Gratuitas Nacionales
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed mb-4">
                      Centrales de despacho para rescate, primeros auxilios, evacuación médica y seguridad ciudadana disponibles 24/7 en todo el Perú.
                    </p>

                    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden mb-4">
                      <div className="flex items-center justify-between p-3 border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <div>
                          <span className="text-sm font-bold text-slate-800 block">Policía Nacional (PNP)</span>
                          <span className="text-[10px] text-slate-500">Emergencias policiales y orden público</span>
                        </div>
                        <a href="tel:105" className="text-sm font-bold text-red-600 px-2.5 py-1 bg-red-50 hover:bg-red-100 rounded-md transition-colors">
                          105
                        </a>
                      </div>
                      <div className="flex items-center justify-between p-3 border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <div>
                          <span className="text-sm font-bold text-slate-800 block">Bomberos Voluntarios</span>
                          <span className="text-[10px] text-slate-500">Rescate vehicular, incendios y materiales</span>
                        </div>
                        <a href="tel:116" className="text-sm font-bold text-red-600 px-2.5 py-1 bg-red-50 hover:bg-red-100 rounded-md transition-colors">
                          116
                        </a>
                      </div>
                      <div className="flex items-center justify-between p-3 hover:bg-slate-50 transition-colors">
                        <div>
                          <span className="text-sm font-bold text-slate-800 block">SAMU Salud</span>
                          <span className="text-[10px] text-slate-500">Ambulancias y soporte vital avanzado</span>
                        </div>
                        <a href="tel:106" className="text-sm font-bold text-red-600 px-2.5 py-1 bg-red-50 hover:bg-red-100 rounded-md transition-colors">
                          106
                        </a>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsPhonesOpen(true)}
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 active:scale-[0.99] text-white font-bold text-xs rounded-lg shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <PhoneCall className="w-4 h-4 text-red-400" />
                    Directorio Completo de Organismos Científicos
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer with Subtle, Professional Authorship */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-12 mt-12 border-t border-slate-200 text-xs text-slate-600 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <p className="font-bold text-slate-800">
            Alerta y Prevención de Desastres naturales en Perú &copy; 2026 • Sistema de Alerta Temprana
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-slate-500 font-medium">
              Autoría, Desarrollo y Dirección Técnica:
            </span>
            <span
              style={{ fontFamily: "'Playfair Display', 'Cinzel', Georgia, serif" }}
              className="text-xs font-bold tracking-wider text-slate-800 bg-white border border-slate-200 px-3 py-0.5 rounded-full shadow-2xs"
            >
              Ing. Rocío Paredes Gamarra • Casa Serpentis
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          <button
            type="button"
            onClick={() => setIsTermsOpen(true)}
            className="text-slate-600 hover:text-red-600 transition-colors underline cursor-pointer font-medium"
          >
            Términos, Condiciones y Medalla
          </button>
          <span className="text-slate-300">•</span>
          <button
            type="button"
            onClick={() => setIsManualOpen(true)}
            className="text-slate-700 hover:text-red-600 transition-colors underline cursor-pointer font-bold flex items-center gap-1 text-red-700"
          >
            <BookMarked className="w-3.5 h-3.5 text-red-600" />
            <span>Manual de Uso</span>
          </button>
          <span className="text-slate-300">•</span>
          <button
            type="button"
            onClick={() => setIsPhonesOpen(true)}
            className="text-slate-600 hover:text-red-600 transition-colors underline cursor-pointer font-medium"
          >
            Organismos Científicos
          </button>
          <span className="text-slate-300">•</span>
          <button
            type="button"
            onClick={() => setIsLiveNewsOpen(true)}
            className="text-red-600 hover:text-red-700 transition-colors font-bold underline cursor-pointer flex items-center gap-1"
          >
            <Radio className="w-3 h-3 animate-pulse" />
            <span>Noticias en Vivo y Comunicados Oficiales</span>
          </button>
        </div>
      </footer>

      {/* Live Emergency Ticker Footer */}
      <footer
        className="h-11 bg-slate-950 text-white flex items-center px-3 sm:px-6 shrink-0 fixed bottom-0 left-0 right-0 z-30 shadow-2xl border-t border-slate-800 transition-colors hover:bg-slate-900 cursor-pointer select-none"
        onClick={() => setIsLiveNewsOpen(true)}
        title="Haga clic aquí para abrir todas las noticias en vivo de las páginas oficiales"
      >
        <div className="flex items-center gap-2.5 sm:gap-3.5 w-full overflow-hidden max-w-7xl mx-auto">
          {/* Botón de acceso a noticias en vivo oficial */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsLiveNewsOpen(true);
            }}
            className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-[10px] sm:text-[11px] font-black italic rounded shrink-0 uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <Radio className="w-3 h-3 text-white animate-pulse" />
            <span>NOTICIAS EN VIVO</span>
            <ExternalLink className="w-3 h-3 text-red-200 ml-0.5" />
          </button>

          {/* Texto de noticias con scroll libre de obstrucciones de Netlify */}
          <div className="text-[11px] sm:text-xs whitespace-nowrap opacity-90 tracking-tight overflow-x-auto scrollbar-none py-1 flex items-center gap-6">
            <span>
              Sismo percibido en costa central • IGP y DHN descartan alerta de tsunami para litoral peruano • SENAMHI emite aviso meteorológico N° 214 por lluvias intensas en selva norte • CENEPRED alerta 691 distritos por peligro de deslizamientos • COEN-INDECI en monitoreo 24/7 permanente • [Haga clic aquí para ver las noticias oficiales completas] •
            </span>
          </div>

          <span className="hidden lg:inline-block text-[10px] uppercase font-bold text-slate-400 shrink-0 ml-auto bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
            Click para ver fuentes ↗
          </span>
        </div>
      </footer>

      {/* Interactive Modals */}
      <SosModal
        isOpen={isSosOpen}
        onClose={() => setIsSosOpen(false)}
        district={selectedDist}
        provinceName={selectedProv.name}
        departmentName={selectedDept.name}
      />

      <OfficialEntitiesModal
        isOpen={isPhonesOpen}
        onClose={() => setIsPhonesOpen(false)}
      />

      <TermsModal
        isOpen={isTermsOpen}
        onClose={() => setIsTermsOpen(false)}
      />

      {/* Modal de Manual de Uso Oficial SAPDENP (al costado de Términos y Condiciones) */}
      <ManualModal
        isOpen={isManualOpen}
        onClose={() => setIsManualOpen(false)}
        onNavigateTab={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenDownloadModal={() => setIsDownloadOpen(true)}
        onOpenSos={() => setIsSosOpen(true)}
        onOpenPhones={() => setIsPhonesOpen(true)}
        onOpenLiveNews={() => setIsLiveNewsOpen(true)}
      />

      <LiveNewsModal
        isOpen={isLiveNewsOpen}
        onClose={() => setIsLiveNewsOpen(false)}
      />

      {/* Modal para ampliar el Escudo Oficial SAPDENP */}
      <ShieldModal
        isOpen={isShieldOpen}
        onClose={() => setIsShieldOpen(false)}
      />

      {/* Modal de Descarga e Instalación (Web • Android • iOS) */}
      <DownloadModal
        isOpen={isDownloadOpen}
        onClose={() => setIsDownloadOpen(false)}
      />
    </div>
  );
}
