import React, { useState } from 'react';
import { motion } from 'motion/react';
import { MapPin, Navigation, Search, Check, AlertCircle, Compass, Thermometer } from 'lucide-react';
import { DepartmentData, DistrictData, ProvinceData } from '../types/disasters';
import { PERU_DEPARTMENTS, searchLocations } from '../data/peruData';
import { obtenerUbicacionActual } from '../servicios/ubicacion';

interface LocationSelectorProps {
  selectedDept: DepartmentData;
  selectedProv: ProvinceData;
  selectedDist: DistrictData;
  onSelectLocation: (dept: DepartmentData, prov: ProvinceData, dist: DistrictData) => void;
}

export const LocationSelector: React.FC<LocationSelectorProps> = ({
  selectedDept,
  selectedProv,
  selectedDist,
  onSelectLocation,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ReturnType<typeof searchLocations>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoMessage, setGeoMessage] = useState<string | null>(null);

  const handleDeptChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const deptId = e.target.value;
    const dept = PERU_DEPARTMENTS.find((d) => d.id === deptId) || PERU_DEPARTMENTS[0];
    const prov = dept.provinces[0];
    const dist = prov.districts[0];
    onSelectLocation(dept, prov, dist);
  };

  const handleProvChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const provName = e.target.value;
    const prov = selectedDept.provinces.find((p) => p.name === provName) || selectedDept.provinces[0];
    const dist = prov.districts[0];
    onSelectLocation(selectedDept, prov, dist);
  };

  const handleDistChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const distName = e.target.value;
    const dist = selectedProv.districts.find((d) => d.name === distName) || selectedProv.districts[0];
    onSelectLocation(selectedDept, selectedProv, dist);
  };

  const handleSearchInput = (val: string) => {
    setSearchQuery(val);
    if (val.trim().length > 1) {
      const res = searchLocations(val);
      setSearchResults(res.slice(0, 8));
      setIsSearching(true);
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  };

  const handleSelectSearchResult = (result: (typeof searchResults)[0]) => {
    onSelectLocation(result.department, result.province, result.district);
    setSearchQuery('');
    setSearchResults([]);
    setIsSearching(false);
  };

  // Browser GPS Geolocation to find closest Peruvian district using pure TypeScript service
  const handleGeolocate = async () => {
    setGeoLoading(true);
    setGeoMessage(null);

    try {
      // Consulta de forma óptima el GPS con alta precisión y guarda en localStorage ('ultima_ubicacion')
      const coords = await obtenerUbicacionActual(12000);
      const userLat = coords.lat;
      const userLng = coords.lng;

      // Find closest district in Peru database using Haversine
      let closestDist: DistrictData | null = null;
      let closestDept: DepartmentData | null = null;
      let closestProv: ProvinceData | null = null;
      let minDistance = Infinity;

      for (const dept of PERU_DEPARTMENTS) {
        for (const prov of dept.provinces) {
          for (const dist of prov.districts) {
            const dLat = (dist.lat - userLat) * (Math.PI / 180);
            const dLng = (dist.lng - userLng) * (Math.PI / 180);
            const a =
              Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(userLat * (Math.PI / 180)) *
                Math.cos(dist.lat * (Math.PI / 180)) *
                Math.sin(dLng / 2) *
                Math.sin(dLng / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const distKm = 6371 * c;

            if (distKm < minDistance) {
              minDistance = distKm;
              closestDist = dist;
              closestDept = dept;
              closestProv = prov;
            }
          }
        }
      }

      setGeoLoading(false);
      if (closestDist && closestDept && closestProv) {
        onSelectLocation(closestDept, closestProv, closestDist);
        setGeoMessage(
          `¡Ubicación GPS fijada y guardada! Cercano a: ${closestDist.name}, ${closestProv.name}, ${closestDept.name} (~${Math.round(
            minDistance
          )} km).`
        );
        setTimeout(() => setGeoMessage(null), 6000);
      }
    } catch (err: unknown) {
      setGeoLoading(false);
      const errObj = err as { mensaje?: string };
      setGeoMessage(
        errObj?.mensaje || 'Permiso de GPS no concedido o fuera de rango. Puede seleccionar manualmente.'
      );
      setTimeout(() => setGeoMessage(null), 5000);
    }
  };

  return (
    <div className="w-full bg-white border border-slate-200 rounded-xl p-4 sm:p-6 shadow-sm">
      {/* Title & Geolocation Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-50 border border-red-200 flex items-center justify-center text-red-600 shrink-0">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              Ubicación Geográfica y Jurisdicción
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 uppercase">
                {selectedDist.region}
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Seleccione departamento, provincia y distrito para calibrar protocolos e hidrometeorología.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGeolocate}
          disabled={geoLoading}
          className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
        >
          <Navigation className={`w-3.5 h-3.5 ${geoLoading ? 'animate-spin' : ''}`} />
          {geoLoading ? 'Localizando GPS...' : 'GEOLOCALIZAR AHORA'}
        </button>
      </div>

      {geoMessage && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mb-4 p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 text-xs flex items-center gap-2 font-medium"
        >
          <Compass className="w-4 h-4 text-red-600 shrink-0" />
          <span>{geoMessage}</span>
        </motion.div>
      )}

      {/* Instant Search Bar with Magnifying Glass */}
      <div className="relative mb-5">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchInput(e.target.value)}
            placeholder="Buscar cualquier departamento, provincia o distrito (ej. Chosica, Callao, Ubinas, Puno, Belén...)"
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-red-500 focus:bg-white rounded-lg text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-red-500/20 transition-colors font-sans"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        </div>

        {/* Live Search Autocomplete Results */}
        {isSearching && searchResults.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-30 max-h-64 overflow-y-auto divide-y divide-slate-100">
            {searchResults.map((res, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectSearchResult(res)}
                className="w-full text-left px-4 py-2.5 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3 text-xs cursor-pointer"
              >
                <div>
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span>{res.district.name}</span>
                    <span className="text-slate-500 font-normal">
                      ({res.province.name} - {res.department.name})
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 line-clamp-1">
                    {res.district.climateType}
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                  {res.district.region}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Cascading Dropdowns: 24 Departamentos -> 196 Provincias (incl. Callao) -> 1,893 Distritos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Departamento */}
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Departamento (24 Departamentos)
          </label>
          <select
            value={selectedDept.id}
            onChange={handleDeptChange}
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-red-500/20 focus:border-red-500 cursor-pointer"
          >
            {PERU_DEPARTMENTS.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name} ({dept.region})
              </option>
            ))}
          </select>
        </div>

        {/* Provincia */}
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Provincia ({selectedDept.provinces.length} en {selectedDept.name})
          </label>
          <select
            value={selectedProv.name}
            onChange={handleProvChange}
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-red-500/20 focus:border-red-500 cursor-pointer"
          >
            {selectedDept.provinces.map((prov) => (
              <option key={prov.name} value={prov.name}>
                {prov.name}
              </option>
            ))}
          </select>
        </div>

        {/* Distrito */}
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Distrito ({selectedProv.districts.length} en {selectedProv.name})
          </label>
          <select
            value={selectedDist.name}
            onChange={handleDistChange}
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-900 font-bold focus:outline-none focus:ring-1 focus:ring-red-500/20 focus:border-red-500 cursor-pointer"
          >
            {selectedProv.districts.map((dist) => (
              <option key={dist.name} value={dist.name}>
                {dist.name} ({dist.altitudeMeters} msnm)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Hazards Detected for Selected District */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-slate-700">Desastres identificados en esta zona:</span>
        {selectedDist.predominantDisasters.map((hazard) => (
          <span
            key={hazard}
            className="px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-red-50 text-red-700 border border-red-200 flex items-center gap-1.5"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
            {hazard.replace('_', ' ')}
          </span>
        ))}
      </div>

      {/* Climate details tag line */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
        <div className="flex items-center gap-1.5">
          <Thermometer className="w-4 h-4 text-orange-500" />
          <span className="font-bold text-slate-800">Microclima:</span>
          <span className="text-slate-600">{selectedDist.climateType}</span>
        </div>
        <div className="text-[11px] font-mono text-slate-500">
          Altitud: <strong className="text-slate-800">{selectedDist.altitudeMeters} m s. n. m.</strong> | GPS:{' '}
          {selectedDist.lat.toFixed(4)}°, {selectedDist.lng.toFixed(4)}°
        </div>
      </div>
    </div>
  );
};
