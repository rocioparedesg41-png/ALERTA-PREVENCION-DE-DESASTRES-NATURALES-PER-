import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { motion, AnimatePresence } from 'motion/react';
import {
  Map,
  Navigation,
  ShieldCheck,
  Footprints,
  Layers,
  Compass,
  Eye,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  Crosshair,
  Maximize2,
  Minimize2,
  Loader2,
  X,
} from 'lucide-react';
import { DepartmentData, DistrictData, ProvinceData } from '../types/disasters';
import { PERU_DEPARTMENTS, findClosestDistrict } from '../data/peruData';

interface PeruMapViewerProps {
  district: DistrictData;
  departmentName: string;
  provinceName: string;
  onLocationDetected?: (department: DepartmentData, province: ProvinceData, district: DistrictData) => void;
}

const DEPT_CAPITALS: { name: string; lat: number; lng: number; region: string }[] = [
  { name: 'Amazonas (Chachapoyas)', lat: -6.2317, lng: -77.8689, region: 'Selva' },
  { name: 'Áncash (Huaraz)', lat: -9.5278, lng: -77.5278, region: 'Sierra' },
  { name: 'Apurímac (Abancay)', lat: -13.6339, lng: -72.8814, region: 'Sierra' },
  { name: 'Arequipa', lat: -16.4090, lng: -71.5375, region: 'Sierra' },
  { name: 'Ayacucho', lat: -13.1588, lng: -74.2239, region: 'Sierra' },
  { name: 'Cajamarca', lat: -7.1617, lng: -78.5128, region: 'Sierra' },
  { name: 'Callao (Prov. Constitucional)', lat: -12.0566, lng: -77.1181, region: 'Costa' },
  { name: 'Cusco', lat: -13.5319, lng: -71.9675, region: 'Sierra' },
  { name: 'Huancavelica', lat: -12.7864, lng: -74.9756, region: 'Sierra' },
  { name: 'Huánuco', lat: -9.9306, lng: -76.2422, region: 'Sierra' },
  { name: 'Ica', lat: -14.0678, lng: -75.7286, region: 'Costa' },
  { name: 'Junín (Huancayo)', lat: -12.0651, lng: -75.2049, region: 'Sierra' },
  { name: 'La Libertad (Trujillo)', lat: -8.1091, lng: -79.0299, region: 'Costa' },
  { name: 'Lambayeque (Chiclayo)', lat: -6.7714, lng: -79.8409, region: 'Costa' },
  { name: 'Lima', lat: -12.0464, lng: -77.0428, region: 'Costa' },
  { name: 'Loreto (Iquitos)', lat: -3.7437, lng: -73.2538, region: 'Selva' },
  { name: 'Madre de Dios (Pto. Maldonado)', lat: -12.5933, lng: -69.1891, region: 'Selva' },
  { name: 'Moquegua', lat: -17.1956, lng: -70.9356, region: 'Costa' },
  { name: 'Pasco (Cerro de Pasco)', lat: -10.6675, lng: -76.2561, region: 'Sierra' },
  { name: 'Piura', lat: -5.1945, lng: -80.6328, region: 'Costa' },
  { name: 'Puno', lat: -15.8422, lng: -70.0219, region: 'Sierra' },
  { name: 'San Martín (Moyobamba)', lat: -6.0342, lng: -76.9714, region: 'Selva' },
  { name: 'Tacna', lat: -18.0146, lng: -70.2536, region: 'Costa' },
  { name: 'Tumbes', lat: -3.5669, lng: -80.4515, region: 'Costa' },
  { name: 'Ucayali (Pucallpa)', lat: -8.3791, lng: -74.5539, region: 'Selva' },
];

export type MapLayerMode = 'calles' | 'topografico' | 'satelite';

export const PeruMapViewer: React.FC<PeruMapViewerProps> = ({
  district,
  departmentName,
  provinceName,
  onLocationDetected,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layersGroupRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const fullscreenWrapperRef = useRef<HTMLDivElement | null>(null);

  const [selectedSafeZone, setSelectedSafeZone] = useState<number>(0);
  const [showEvacuationRadius, setShowEvacuationRadius] = useState<boolean>(true);
  const [showRoutes, setShowRoutes] = useState<boolean>(true);
  const [mapMode, setMapMode] = useState<MapLayerMode>('calles');
  const [isNationalView, setIsNationalView] = useState<boolean>(false);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locationStatus, setLocationStatus] = useState<string | null>(null);
  const [userGps, setUserGps] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [detectedLocation, setDetectedLocation] = useState<{
    districtName: string;
    provinceName: string;
    departmentName: string;
    altitude: number;
    region: string;
    coords: { lat: number; lng: number };
  } | null>(null);

  // ─────────────────────────────────────────────────────────────────────────────
  // FIX PRINCIPAL: useLayoutEffect para capturar el reflow sincrónico del DOM
  // antes de que el navegador pinte, garantizando que invalidateSize lea las
  // dimensiones reales del contenedor una vez que isFullScreen cambia.
  // ─────────────────────────────────────────────────────────────────────────────
  useLayoutEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    // Serie escalonada de invalidaciones para cubrir el reflow completo del DOM
    const delays = [0, 80, 200, 400, 700];
    const timers = delays.map((delay) =>
      setTimeout(() => {
        try {
          map.invalidateSize({ pan: false, animate: false });
        } catch {}
      }, delay)
    );

    return () => timers.forEach(clearTimeout);
  }, [isFullScreen]);

  // ResizeObserver para cambios de tamaño del contenedor (modo normal)
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    let resizeTimer: ReturnType<typeof setTimeout> | null = null;

    const safeInvalidate = () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        try {
          mapInstanceRef.current?.invalidateSize({ pan: false });
        } catch {}
      }, 100);
    };

    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      try {
        observer = new ResizeObserver((entries) => {
          for (const entry of entries) {
            const { width, height } = entry.contentRect;
            if (width > 50 && height > 50) safeInvalidate();
          }
        });
        observer.observe(container);
      } catch {}
    }

    window.addEventListener('resize', safeInvalidate, { passive: true });

    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', safeInvalidate);
      if (resizeTimer) clearTimeout(resizeTimer);
    };
  }, []);

  // Atajo ESC para salir de fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullScreen) setIsFullScreen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullScreen]);

  // ─────────────────────────────────────────────────────────────────────────────
  // FIX: toggleFullScreen simplificado — el useLayoutEffect [isFullScreen]
  // ya se encarga de todas las invalidaciones. Aquí solo se cambia el estado.
  // ─────────────────────────────────────────────────────────────────────────────
  const toggleFullScreen = () => {
    setIsFullScreen((prev) => {
      const next = !prev;
      if (next) {
        // Scroll suave al inicio del wrapper para que el fullscreen sea visible
        setTimeout(() => {
          try {
            fullscreenWrapperRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          } catch {}
        }, 60);
      }
      return next;
    });
  };

  const handleGeolocateExactUser = () => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (typeof window === 'undefined' || !navigator.geolocation) {
      setLocationStatus('La geolocalización no es compatible con este navegador.');
      map.flyTo([district.lat, district.lng], 14, { animate: true });
      setTimeout(() => setLocationStatus(null), 4000);
      return;
    }

    setIsLocating(true);
    setLocationStatus('Conectando con sensor GPS de alta precisión...');

    navigator.geolocation.getCurrentPosition(
      (position: GeolocationPosition) => {
        const { latitude, longitude, accuracy } = position.coords;
        setIsLocating(false);
        setIsNationalView(false);
        setUserGps({ lat: latitude, lng: longitude, accuracy });

        const closest = findClosestDistrict(latitude, longitude);
        if (closest) {
          setDetectedLocation({
            districtName: closest.district.name,
            provinceName: closest.province.name,
            departmentName: closest.department.name,
            altitude: closest.district.altitudeMeters,
            region: closest.district.region,
            coords: { lat: latitude, lng: longitude },
          });
          setLocationStatus(
            `Ubicación GPS fijada: ${closest.district.name}, ${closest.province.name} (±${Math.round(accuracy)}m)`
          );
          onLocationDetected?.(closest.department, closest.province, closest.district);
        } else {
          setDetectedLocation({
            districtName: 'Ubicación GPS Actual',
            provinceName: 'GPS',
            departmentName: 'Perú',
            altitude: district.altitudeMeters,
            region: district.region,
            coords: { lat: latitude, lng: longitude },
          });
          setLocationStatus(`Ubicación GPS exacta fijada (±${Math.round(accuracy)}m)`);
        }

        map.flyTo([latitude, longitude], 16, { animate: true, duration: 1.2 });
        setTimeout(() => map.invalidateSize(true), 150);

        try {
          localStorage.setItem(
            'ultima_ubicacion',
            JSON.stringify({
              lat: latitude,
              lng: longitude,
              precisionMetros: accuracy,
              districtName: closest?.district.name || '',
              provinceName: closest?.province.name || '',
              departmentName: closest?.department.name || '',
              timestamp: Date.now(),
            })
          );
        } catch {}

        setTimeout(() => setLocationStatus(null), 5000);
      },
      (error: GeolocationPositionError) => {
        setIsLocating(false);
        let errorMsg = 'No se pudo obtener la posición GPS.';
        if (error.code === error.PERMISSION_DENIED) {
          errorMsg = 'Permiso GPS denegado. Mostrando sede municipal del distrito.';
        } else if (error.code === error.TIMEOUT) {
          errorMsg = 'Tiempo de espera agotado al conectar satélites GPS.';
        }
        setLocationStatus(errorMsg);
        map.flyTo([district.lat, district.lng], 14, { animate: true });
        setTimeout(() => setLocationStatus(null), 5000);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const getTileConfig = (mode: MapLayerMode) => {
    switch (mode) {
      case 'satelite':
        return {
          url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          subdomains: 'abc',
          maxZoom: 18,
        };
      case 'topografico':
        return {
          url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
          subdomains: 'abc',
          maxZoom: 18,
        };
      default:
        return {
          url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
          subdomains: 'abc',
          maxZoom: 19,
        };
    }
  };

  // Inicialización del mapa Leaflet (solo una vez)
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [district.lat, district.lng],
      zoom: 13,
      zoomControl: false,
      attributionControl: false,
    });

    const config = getTileConfig(mapMode);
    const tileLayer = L.tileLayer(config.url, {
      maxZoom: config.maxZoom,
      subdomains: config.subdomains,
      updateWhenIdle: false,
      updateWhenZooming: true,
      keepBuffer: 4,
    });

    tileLayer.addTo(map);
    tileLayerRef.current = tileLayer;

    L.control.attribution({ position: 'bottomright', prefix: 'IGN Perú • INDECI' }).addTo(map);

    const layersGroup = L.layerGroup().addTo(map);
    layersGroupRef.current = layersGroup;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Actualizar tiles al cambiar de modo
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    tileLayerRef.current.setUrl(getTileConfig(mapMode).url);
  }, [mapMode]);

  // Redibujar capas al cambiar parámetros
  useEffect(() => {
    const map = mapInstanceRef.current;
    const group = layersGroupRef.current;
    if (!map || !group) return;

    group.clearLayers();

    if (isNationalView) {
      map.flyToBounds([[-18.5, -81.5], [-0.03, -68.5]], { duration: 1.2 });

      DEPT_CAPITALS.forEach((cap) => {
        const isCurrent = cap.name.toLowerCase().includes(departmentName.toLowerCase());
        const markerHtml = `
          <div style="
            background: ${isCurrent ? '#D20103' : '#002B5B'};
            color: white; padding: 3px 7px; border-radius: 9999px;
            border: 2px solid white; font-size: 10px; font-weight: bold;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3); white-space: nowrap;
            display: flex; align-items: center; gap: 3px;">
            <span>${isCurrent ? '⭐' : '🏛️'}</span>
            <span>${cap.name}</span>
          </div>`;
        const icon = L.divIcon({ html: markerHtml, className: 'dept-capital-pin', iconSize: [120, 24], iconAnchor: [60, 12] });
        const marker = L.marker([cap.lat, cap.lng], { icon });
        marker.bindPopup(`
          <div style="font-family:sans-serif;padding:4px;font-size:12px;">
            <strong style="color:#002B5B;">Departamento: ${cap.name}</strong><br/>
            <span style="color:#475569;">Región Natural: ${cap.region}</span><br/>
            <span style="color:#64748b;">GPS: ${cap.lat.toFixed(4)}°, ${cap.lng.toFixed(4)}°</span>
          </div>`);
        group.addLayer(marker);
      });
    } else {
      map.flyTo([district.lat, district.lng], 13, { duration: 1.0 });

      if (showEvacuationRadius) {
        const circle500 = L.circle([district.lat, district.lng], {
          radius: 500, color: '#ef4444', weight: 1.5,
          fillColor: '#ef4444', fillOpacity: 0.12, dashArray: '5, 5',
        });
        circle500.bindTooltip('Perímetro de Evacuación Inmediata: 500m');
        group.addLayer(circle500);

        const circle1000 = L.circle([district.lat, district.lng], {
          radius: 1000, color: '#f59e0b', weight: 1,
          fillColor: '#f59e0b', fillOpacity: 0.05, dashArray: '6, 6',
        });
        circle1000.bindTooltip('Zona de Influencia Extendida: 1,000m');
        group.addLayer(circle1000);
      }

      const municipalMarkerHtml = `
        <div style="position:relative;display:flex;align-items:center;justify-content:center;">
          <div style="position:absolute;width:34px;height:34px;border-radius:50%;background:rgba(220,38,38,0.35);animation:ping 2s cubic-bezier(0,0,0.2,1) infinite;"></div>
          <div style="width:28px;height:28px;border-radius:50%;background:#dc2626;border:2.5px solid #ffffff;box-shadow:0 4px 10px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;color:white;font-size:13px;">🏛️</div>
        </div>`;
      const municipalIcon = L.divIcon({ html: municipalMarkerHtml, className: 'municipal-district-pin', iconSize: [34, 34], iconAnchor: [17, 17] });
      const municipalMarker = L.marker([district.lat, district.lng], { icon: municipalIcon });
      municipalMarker.bindPopup(`
        <div style="font-family:sans-serif;padding:6px;font-size:12px;min-width:175px;">
          <div style="font-weight:800;color:#dc2626;font-size:13px;">🏛️ Sede Municipal / Centro Oficial</div>
          <div style="margin-top:4px;color:#1e293b;"><strong>Distrito:</strong> ${district.name}</div>
          <div style="color:#475569;"><strong>Provincia:</strong> ${provinceName}</div>
          <div style="color:#475569;"><strong>Departamento:</strong> ${departmentName}</div>
          <div style="color:#002B5B;font-weight:bold;margin-top:2px;">Altitud: ${district.altitudeMeters} m s.n.m.</div>
        </div>`);
      group.addLayer(municipalMarker);

      if (userGps) {
        const circlePrecision = L.circle([userGps.lat, userGps.lng], {
          radius: Math.max(userGps.accuracy, 15),
          color: '#2563eb', weight: 1.5, fillColor: '#3b82f6', fillOpacity: 0.15, dashArray: '4, 4',
        });
        circlePrecision.bindTooltip(`Radio de precisión GPS: ±${Math.round(userGps.accuracy)}m`);
        group.addLayer(circlePrecision);

        const userPinHtml = `
          <div style="position:relative;width:24px;height:24px;">
            <div style="position:absolute;inset:-6px;border-radius:9999px;background-color:rgba(37,99,235,0.45);animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></div>
            <div style="position:relative;width:24px;height:24px;border-radius:9999px;background-color:#2563eb;border:3px solid #ffffff;box-shadow:0 4px 8px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;">
              <div style="width:7px;height:7px;border-radius:9999px;background-color:#ffffff;"></div>
            </div>
          </div>`;
        const userIcon = L.divIcon({ html: userPinHtml, className: 'user-exact-gps-pin', iconSize: [24, 24], iconAnchor: [12, 12] });
        const userMarker = L.marker([userGps.lat, userGps.lng], { icon: userIcon, zIndexOffset: 1000 });
        userMarker.bindPopup(`
          <div style="font-family:sans-serif;padding:6px;font-size:12px;min-width:175px;">
            <div style="font-weight:800;color:#2563eb;font-size:13px;">📍 Mi Ubicación GPS Real</div>
            <div style="color:#0f172a;font-weight:600;margin-top:4px;">(Tú estás aquí)</div>
            <div style="color:#475569;margin-top:2px;"><strong>Coordenadas:</strong> ${userGps.lat.toFixed(5)}°, ${userGps.lng.toFixed(5)}°</div>
            <div style="color:#16a34a;font-weight:600;">Precisión: ±${Math.round(userGps.accuracy)} metros</div>
          </div>`);
        group.addLayer(userMarker);
      }

      const startLat = userGps ? userGps.lat : district.lat;
      const startLng = userGps ? userGps.lng : district.lng;

      district.safeZones.forEach((sz, idx) => {
        let szLat = sz.lat;
        let szLng = sz.lng;
        if (typeof szLat !== 'number' || typeof szLng !== 'number') {
          const angle = (idx * (Math.PI * 2)) / district.safeZones.length + 0.5;
          const dLat = (sz.distanceMeters / 111000) * Math.cos(angle);
          const dLng = (sz.distanceMeters / (111000 * Math.cos((district.lat * Math.PI) / 180))) * Math.sin(angle);
          szLat = district.lat + dLat;
          szLng = district.lng + dLng;
        }

        const isSelected = selectedSafeZone === idx;
        const dLatM = (szLat - startLat) * 111000;
        const dLngM = (szLng - startLng) * (111000 * Math.cos((startLat * Math.PI) / 180));
        const realDistMeters = Math.round(Math.sqrt(dLatM * dLatM + dLngM * dLngM));
        const walkingMinutes = Math.max(1, Math.round(realDistMeters / 70));

        if (showRoutes) {
          const routeGlow = L.polyline([[startLat, startLng], [szLat, szLng]], {
            color: isSelected ? '#ffffff' : '#052e16', weight: isSelected ? 7 : 5, opacity: 0.7,
          });
          group.addLayer(routeGlow);

          const routePolyline = L.polyline([[startLat, startLng], [szLat, szLng]], {
            color: isSelected ? '#dc2626' : '#16a34a', weight: isSelected ? 4 : 3,
            opacity: 0.95, dashArray: isSelected ? undefined : '7, 5',
          });
          group.addLayer(routePolyline);

          const midLat = (startLat + szLat) / 2;
          const midLng = (startLng + szLng) / 2;
          const badgeHtml = `
            <div style="background:${isSelected ? '#991b1b' : '#15803d'};color:white;font-size:10px;font-weight:800;padding:2px 7px;border-radius:9999px;border:1.5px solid white;box-shadow:0 2px 5px rgba(0,0,0,0.35);white-space:nowrap;display:flex;align-items:center;gap:3px;cursor:pointer;">
              <span>🚶</span><span>${realDistMeters}m • ~${walkingMinutes} min</span>
            </div>`;
          const distBadge = L.marker([midLat, midLng], {
            icon: L.divIcon({ html: badgeHtml, className: 'evac-dist-badge', iconSize: [110, 20], iconAnchor: [55, 10] }),
          });
          distBadge.on('click', () => setSelectedSafeZone(idx));
          group.addLayer(distBadge);
        }

        const szHtml = `
          <div style="background:${isSelected ? '#0f172a' : '#16a34a'};color:white;padding:3px 8px;border-radius:6px;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.25);font-size:11px;font-weight:700;display:flex;align-items:center;gap:4px;cursor:pointer;white-space:nowrap;">
            <span>${sz.type === 'Zona Alta' ? '⛰️' : '🛡️'}</span>
            <span>${sz.name.slice(0, 16)}</span>
          </div>`;
        const szIcon = L.divIcon({ html: szHtml, className: 'safe-zone-pin', iconSize: [120, 26], iconAnchor: [60, 13] });
        const szMarker = L.marker([szLat, szLng], { icon: szIcon });
        szMarker.on('click', () => setSelectedSafeZone(idx));
        szMarker.bindPopup(`
          <div style="font-family:sans-serif;padding:4px;font-size:12px;">
            <strong style="color:#059669;font-size:13px;">🛡️ ${sz.name}</strong><br/>
            <span style="color:#334155;font-weight:bold;">Tipo: ${sz.type}</span><br/>
            <span style="color:#475569;">Distancia: ~${realDistMeters}m (~${walkingMinutes} min a pie)</span><br/>
            <p style="margin-top:4px;color:#1e293b;font-size:11px;">${sz.routeDescription}</p>
          </div>`);
        group.addLayer(szMarker);
      });
    }

    setTimeout(() => { map.invalidateSize(); }, 150);
  }, [district, departmentName, provinceName, selectedSafeZone, showEvacuationRadius, showRoutes, isNationalView, userGps]);

  const handleZoomIn = () => mapInstanceRef.current?.zoomIn();
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut();

  const handleResetToDistrict = () => {
    setIsNationalView(false);
    if (detectedLocation) {
      mapInstanceRef.current?.flyTo([detectedLocation.coords.lat, detectedLocation.coords.lng], 16, { animate: true });
    } else {
      mapInstanceRef.current?.flyTo([district.lat, district.lng], 13, { animate: true });
    }
  };

  const handleToggleRoutes = () => {
    if (isNationalView) {
      setIsNationalView(false);
      setShowRoutes(true);
      mapInstanceRef.current?.flyTo([district.lat, district.lng], 13, { duration: 1.0 });
    } else {
      setShowRoutes(!showRoutes);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // FIX: Altura del contenedor Leaflet calculada explícitamente en inline style.
  // En modo fullscreen se usa calc(100vh - Npx) en lugar de '100%', porque
  // '100%' requiere que TODOS los ancestros tengan altura explícita definida.
  // calc(100vh - 120px) descuenta la barra superior del fullscreen (header ~72px
  // + barra inferior GPS ~48px). Esto garantiza que Leaflet siempre tenga una
  // altura concreta en píxeles que pueda leer con getBoundingClientRect().
  // ─────────────────────────────────────────────────────────────────────────────
  const mapCanvasHeight = isFullScreen ? 'calc(100vh - 120px)' : '500px';

  return (
    <div className="w-full bg-white border border-slate-200 rounded-xl p-4 sm:p-6 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-50 border border-red-200 flex items-center justify-center text-red-600 shrink-0">
            <Map className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2 flex-wrap">
              Cartografía y Rutas de Evacuación
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-50 text-green-700 border border-green-200 uppercase">
                IGN / OSM / ESRI
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Visualización cartográfica real de los 24 departamentos, 196 provincias y 1,893 distritos con rutas seguras.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsNationalView(!isNationalView)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-colors cursor-pointer ${
              isNationalView ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            {isNationalView ? 'Enfocar Mi Distrito' : 'Ver Todo el Perú (24 Dptos)'}
          </button>

          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
            {(['calles', 'topografico', 'satelite'] as MapLayerMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setMapMode(mode)}
                className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer capitalize ${
                  mapMode === mode ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleToggleRoutes}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs ${
              showRoutes && !isNationalView
                ? 'bg-emerald-600 border-emerald-700 text-white ring-2 ring-emerald-400/40'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Footprints className="w-3.5 h-3.5" />
            {showRoutes && !isNationalView ? 'Rutas Activas (3)' : 'Ver Rutas'}
          </button>

          <button
            type="button"
            onClick={toggleFullScreen}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-900 hover:bg-black text-white flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
          >
            <Maximize2 className="w-3.5 h-3.5 text-red-400" />
            Visión Completa
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

        {/* ─── Wrapper Fullscreen ───────────────────────────────────────────────
            FIX: En modo fullscreen usamos position:fixed con dimensiones exactas
            en inline style (no solo clases Tailwind) para garantizar que el
            navegador aplique el tamaño antes de que Leaflet llame a getBoundingClientRect.
            La clase CSS solo maneja la transición visual; el tamaño real viene del style.
        ─────────────────────────────────────────────────────────────────────── */}
        <div
          ref={fullscreenWrapperRef}
          className={isFullScreen ? 'fixed inset-0 z-50 flex flex-col' : 'lg:col-span-7 relative'}
          style={
            isFullScreen
              ? { top: 0, left: 0, width: '100vw', height: '100vh', background: '#0f172a' }
              : {}
          }
        >
          {/* Barra superior en fullscreen */}
          {isFullScreen && (
            <div className="bg-slate-950 border-b border-slate-800 px-4 py-3 flex items-center justify-between gap-3 text-white shrink-0" style={{ height: '60px' }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-400">
                  <Map className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold flex items-center gap-2">
                    Visión Completa: Cartografía y Rutas
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-600 text-white uppercase">Pantalla Completa</span>
                  </h4>
                  <p className="text-[11px] text-slate-400 hidden sm:block">
                    {isNationalView
                      ? '24 departamentos de la República del Perú'
                      : detectedLocation
                      ? `GPS: ${detectedLocation.districtName} • ${detectedLocation.provinceName}`
                      : `${district.name} • ${provinceName} • ${departmentName}`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="hidden md:flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-700 text-xs">
                  {(['calles', 'topografico', 'satelite'] as MapLayerMode[]).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setMapMode(mode)}
                      className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                        mapMode === mode ? 'bg-red-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {mode.charAt(0).toUpperCase() + mode.slice(1)}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleToggleRoutes}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-1.5 cursor-pointer ${
                    showRoutes && !isNationalView
                      ? 'bg-emerald-600 border-emerald-500 text-white'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <Footprints className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Rutas</span>
                </button>

                <button
                  type="button"
                  onClick={toggleFullScreen}
                  className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all hover:scale-105 active:scale-95"
                >
                  <Minimize2 className="w-4 h-4" />
                  Regresar
                </button>
              </div>
            </div>
          )}

          {/* Contenedor del mapa con controles flotantes */}
          <div
            className="relative bg-slate-100 dark:bg-slate-900 overflow-hidden"
            style={{
              // FIX CLAVE: altura explícita en píxeles/calc, nunca '100%' sin ancestro con altura fija
              width: '100%',
              height: isFullScreen ? 'calc(100vh - 108px)' : '500px',
              minHeight: '500px',
              borderRadius: isFullScreen ? 0 : '0.75rem',
              border: isFullScreen ? 'none' : '1px solid #e2e8f0',
            }}
          >
            {/* Controles flotantes top-right */}
            <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-1.5">
              <button
                type="button"
                onClick={toggleFullScreen}
                className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-black text-white border border-slate-700 shadow-md flex items-center justify-center cursor-pointer transition-transform hover:scale-105"
              >
                {isFullScreen ? <Minimize2 className="w-4 h-4 text-red-400" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button type="button" onClick={handleZoomIn} className="w-8 h-8 rounded-lg bg-white/95 hover:bg-white text-slate-800 border border-slate-200 shadow-sm flex items-center justify-center cursor-pointer">
                <ZoomIn className="w-4 h-4" />
              </button>
              <button type="button" onClick={handleZoomOut} className="w-8 h-8 rounded-lg bg-white/95 hover:bg-white text-slate-800 border border-slate-200 shadow-sm flex items-center justify-center cursor-pointer">
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleGeolocateExactUser}
                disabled={isLocating}
                className="w-8 h-8 rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm flex items-center justify-center cursor-pointer disabled:opacity-75"
              >
                {isLocating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Crosshair className="w-4 h-4" />}
              </button>
              <button type="button" onClick={handleResetToDistrict} className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-slate-800 text-white shadow-sm flex items-center justify-center cursor-pointer">
                <Navigation className="w-4 h-4 text-slate-200" />
              </button>
            </div>

            {/* Status Tag top-left */}
            <div className="absolute top-3 left-3 z-[1000] bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs shadow-sm space-y-0.5">
              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${detectedLocation ? 'bg-emerald-600' : 'bg-red-600'} animate-pulse`} />
                {isNationalView
                  ? 'Panorama Nacional: 24 Departamentos'
                  : detectedLocation
                  ? `${detectedLocation.districtName}, ${detectedLocation.provinceName}`
                  : `${district.name}, ${provinceName}`}
              </div>
              <div className="text-[11px] text-slate-600 dark:text-slate-300">
                {isNationalView
                  ? '196 Provincias • 1,893 Distritos'
                  : detectedLocation
                  ? `Alt: ${detectedLocation.altitude} m s.n.m. • ${detectedLocation.region} • GPS`
                  : `Alt: ${district.altitudeMeters} m s.n.m. • ${district.region}`}
              </div>
            </div>

            {/* GPS status notification */}
            {locationStatus && (
              <div className="absolute top-16 left-3 right-14 z-[1000] bg-slate-900/95 text-white text-xs px-3 py-2 rounded-lg shadow-lg border border-slate-700 flex items-center gap-2">
                <Crosshair className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span>{locationStatus}</span>
              </div>
            )}

            {/* HUD routes banner */}
            <div className="absolute bottom-12 left-3 right-3 sm:right-auto z-[1000] pointer-events-none">
              {showRoutes && !isNationalView ? (
                <div className="bg-slate-900/90 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 shadow-lg border border-slate-700 pointer-events-auto">
                  <Footprints className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>Rutas Activas:</strong> 3 caminos a zonas seguras en {detectedLocation ? detectedLocation.districtName : district.name}.</span>
                </div>
              ) : isNationalView ? (
                <div className="bg-slate-900/90 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 shadow-lg border border-slate-700 pointer-events-auto">
                  <Compass className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>Panorama Nacional: 24 departamentos.</span>
                </div>
              ) : null}
            </div>

            {/* ─── Canvas Leaflet ────────────────────────────────────────────────
                FIX: position:absolute + inset:0 hace que el canvas ocupe
                exactamente el contenedor padre (que sí tiene altura explícita).
                Leaflet leerá las dimensiones correctas en getBoundingClientRect.
            ──────────────────────────────────────────────────────────────────── */}
            <div
              id="leaflet-map-canvas-container"
              ref={mapContainerRef}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                width: '100%',
                height: '100%',
                zIndex: 0,
              }}
            />

            {/* Barra GPS inferior */}
            <div
              className="absolute bottom-0 left-0 right-0 bg-white dark:bg-slate-900 px-3.5 py-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300 z-[500]"
              style={{ height: '36px' }}
            >
              <span className="font-mono truncate">
                {detectedLocation
                  ? `GPS: ${detectedLocation.coords.lat.toFixed(4)}°S, ${detectedLocation.coords.lng.toFixed(4)}°W (${detectedLocation.districtName})`
                  : `GPS: ${district.lat.toFixed(4)}°S, ${district.lng.toFixed(4)}°W (${district.name})`}
              </span>
              <div className="flex items-center gap-3 shrink-0 ml-2">
                {isFullScreen && (
                  <span className="text-slate-400 hidden sm:inline text-[10px]">
                    Presione <kbd className="px-1.5 py-0.5 bg-slate-800 text-slate-200 rounded border border-slate-700 font-mono">ESC</kbd> para salir
                  </span>
                )}
                <span className="text-slate-700 dark:text-slate-200 font-semibold whitespace-nowrap">IGN Perú / OSM / ESRI</span>
              </div>
            </div>
          </div>
        </div>

        {/* Safe Zones Panel */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-green-600" />
              Zonas Seguras Designadas ({district.safeZones.length})
            </h4>
            <span className="text-[11px] text-slate-500 font-medium">Distrito de {district.name}</span>
          </div>

          <div className="space-y-2.5">
            {district.safeZones.map((sz, idx) => {
              const isSelected = selectedSafeZone === idx;
              return (
                <motion.div
                  key={idx}
                  whileHover={{ scale: 1.005 }}
                  onClick={() => {
                    setSelectedSafeZone(idx);
                    const angle = (idx * (Math.PI * 2)) / district.safeZones.length + 0.5;
                    const dLat = (sz.distanceMeters / 111000) * Math.cos(angle);
                    const dLng = (sz.distanceMeters / (111000 * Math.cos((district.lat * Math.PI) / 180))) * Math.sin(angle);
                    mapInstanceRef.current?.panTo([district.lat + dLat, district.lng + dLng]);
                  }}
                  className={`p-3.5 rounded-xl border transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-slate-50 border-2 border-slate-900 text-slate-900 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="font-bold text-xs sm:text-sm text-slate-900 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-600" />
                      {sz.name}
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 whitespace-nowrap">
                      {sz.type}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 mb-2 leading-relaxed">{sz.routeDescription}</p>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                    <span className="flex items-center gap-1 text-slate-900 font-bold font-mono">
                      <Footprints className="w-3.5 h-3.5 text-slate-600" />
                      Distancia: ~{sz.distanceMeters} metros
                    </span>
                    <span className="font-medium text-slate-600">
                      Tiempo: ~{Math.ceil(sz.distanceMeters / 70)} min a pie
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1.5">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-orange-500" />
              Recomendación Oficial de Evacuación
            </div>
            <p className="leading-relaxed">
              Desplácese con paso firme sin correr. Lleve su mochila de emergencia en la espalda. Siga las flechas verdes del mapa hacia los puntos de reunión oficiales.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
