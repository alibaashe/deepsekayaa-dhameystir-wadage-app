import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import {
  Compass,
  Search,
  Volume2,
  VolumeX,
  AlertTriangle,
  GitFork,
  X,
  Fuel,
  Utensils,
  Landmark,
  Building2,
  Check,
} from 'lucide-react';
import { useRide } from '../../context/RideContext';
import { DRIVER_MAP_STYLE } from './mapStyles';
import { RealisticVehicleMarker } from './RealisticVehicleMarker';
import { voiceNavigationService } from '../../services/voiceNavigationService';
import { getGoogleMapsApiKey } from '../../utils/googleMapsKey';

interface DriverMapProps {
  height?: string;
  showSurgeHeatmap?: boolean;
}

export const DriverMap: React.FC<DriverMapProps> = ({ height = '100%' }) => {
  const {
    pickupLocation,
    dropoffLocation,
    currentRide,
    roadRoute,
    roadDistanceKm,
    roadDurationMins,
    driverGpsStatus,
    drivers,
  } = useRide();

  const containerRef = useRef<HTMLDivElement>(null);
  const mapDomRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const polylineRef = useRef<google.maps.Polyline | null>(null);

  const [isSdkLoaded, setIsSdkLoaded] = useState<boolean>(
    typeof window !== 'undefined' && !!(window.google && window.google.maps)
  );

  const [center, setCenter] = useState<{ lat: number; lng: number }>(() => ({
    lat: pickupLocation?.lat || 9.5600,
    lng: pickupLocation?.lng || 44.0650,
  }));
  const [zoom, setZoom] = useState<number>(16);

  // HUD and Navigation States
  const [is3DMode, setIs3DMode] = useState<boolean>(true);
  const [isVoiceMuted, setIsVoiceMuted] = useState<boolean>(false);
  const [showSearchPopover, setShowSearchPopover] = useState<boolean>(false);
  const [showHazardModal, setShowHazardModal] = useState<boolean>(false);
  const [hazardSuccessMsg, setHazardSuccessMsg] = useState<string | null>(null);
  const [isNavActive, setIsNavActive] = useState<boolean>(true);

  // Smooth vehicle heading & position
  const liveDriverPos = useMemo(() => {
    if (driverGpsStatus?.active && driverGpsStatus.lat) {
      return {
        lat: driverGpsStatus.lat,
        lng: driverGpsStatus.lng,
        heading: driverGpsStatus.heading || 0,
      };
    }
    const assignedDriver = currentRide?.assignedDriverId
      ? drivers.find((d) => d.id === currentRide.assignedDriverId)
      : undefined;
    if (assignedDriver) {
      return {
        lat: assignedDriver.currentLocation?.lat ?? 9.5600,
        lng: assignedDriver.currentLocation?.lng ?? 44.0650,
        heading: assignedDriver.currentHeading ?? 0,
      };
    }
    return {
      lat: pickupLocation?.lat || 9.5600,
      lng: pickupLocation?.lng || 44.0650,
      heading: 0,
    };
  }, [driverGpsStatus, currentRide?.assignedDriverId, drivers, pickupLocation]);

  // Speedometer calculation
  const currentSpeed = useMemo(() => {
    if (driverGpsStatus?.speed && driverGpsStatus.speed > 0) {
      return Math.round(driverGpsStatus.speed * 2.23694); // m/s to mph
    }
    return 24; // Default driving speed mph
  }, [driverGpsStatus?.speed]);

  // Container dimensions
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: typeof window !== 'undefined' ? window.innerWidth : 800,
    height: typeof window !== 'undefined' ? window.innerHeight : 600,
  });

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({
          width: rect.width || window.innerWidth || 800,
          height: rect.height || window.innerHeight || 600,
        });
      }
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Initialize Google Maps SDK with Minimalist Driver Map Style
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.google && window.google.maps) {
      setIsSdkLoaded(true);
      return;
    }

    const key = getGoogleMapsApiKey();
    const scriptId = 'google-maps-js-sdk';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
        key
      )}&libraries=geometry,places`;
      script.async = true;
      script.onload = () => setIsSdkLoaded(true);
      script.onerror = () => setIsSdkLoaded(false);
      document.head.appendChild(script);
    }
  }, []);

  // Initialize Google Map Instance
  useEffect(() => {
    if (!isSdkLoaded || !mapDomRef.current || googleMapRef.current) return;

    try {
      const gMap = new google.maps.Map(mapDomRef.current, {
        center: { lat: liveDriverPos.lat, lng: liveDriverPos.lng },
        zoom: 16,
        disableDefaultUI: true,
        gestureHandling: 'greedy',
        styles: DRIVER_MAP_STYLE, // Minimalist 2D style without POI clutter
      });

      googleMapRef.current = gMap;

      // Draw bold navigation polyline
      const poly = new google.maps.Polyline({
        map: gMap,
        strokeColor: '#2563EB', // Smooth bold blue routing polyline
        strokeOpacity: 0.95,
        strokeWeight: 8,
      });
      polylineRef.current = poly;
    } catch (e) {
      console.warn('[DriverMap] Google Maps initialization notice:', e);
    }
  }, [isSdkLoaded]);

  // Dynamic Polyline Updates (Smooth automatic re-calculation without lagging)
  useEffect(() => {
    const poly = polylineRef.current;
    if (!poly) return;

    if (roadRoute?.coordinates && roadRoute.coordinates.length > 1) {
      const path = roadRoute.coordinates.map(([lng, lat]) => ({ lat, lng }));
      poly.setPath(path);
    } else if (pickupLocation && dropoffLocation) {
      poly.setPath([
        { lat: pickupLocation.lat, lng: pickupLocation.lng },
        { lat: dropoffLocation.lat, lng: dropoffLocation.lng },
      ]);
    } else if (liveDriverPos && pickupLocation) {
      poly.setPath([
        { lat: liveDriverPos.lat, lng: liveDriverPos.lng },
        { lat: pickupLocation.lat, lng: pickupLocation.lng },
      ]);
    }
  }, [roadRoute, pickupLocation, dropoffLocation, liveDriverPos]);

  // Center map on live driver telematics
  useEffect(() => {
    if (googleMapRef.current && liveDriverPos) {
      googleMapRef.current.panTo({ lat: liveDriverPos.lat, lng: liveDriverPos.lng });
    }
  }, [liveDriverPos.lat, liveDriverPos.lng]);

  const handleToggleVoice = () => {
    const muted = voiceNavigationService.toggleMute();
    setIsVoiceMuted(muted);
    if (!muted) {
      voiceNavigationService.speak(
        'Voice navigation active. In 300 feet, turn left on 15th Street.',
        'en',
        true
      );
    }
  };

  const handleReportHazard = (type: string) => {
    setShowHazardModal(false);
    setHazardSuccessMsg(`Reported ${type} on route. Other Wadaag drivers notified.`);
    setTimeout(() => setHazardSuccessMsg(null), 4000);
  };

  const cx = dimensions.width / 2;
  const cy = dimensions.height / 2;

  return (
    <div
      ref={containerRef}
      className="w-full relative overflow-hidden select-none font-sans bg-slate-900"
      style={{ height }}
    >
      {/* 3D DRIVING CAMERA & VECTOR MAP CANVAS CONTAINER */}
      <div
        className="absolute inset-0 w-full h-full overflow-hidden"
        style={{
          transform: is3DMode
            ? 'perspective(850px) rotateX(32deg) translateY(-20px) scale(1.12)'
            : 'none',
          transformOrigin: '50% 68%',
          transition: 'transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Google Map SDK Canvas Element */}
        <div ref={mapDomRef} className="absolute inset-0 w-full h-full z-0" />

        {/* VEHICLE AVATAR MARKER (Crisp top-down avatar with smooth heading rotation around center pivot) */}
        <div
          className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20 transition-all duration-300 ease-out"
          style={{
            left: `${cx}px`,
            top: `${cy + 90}px`,
            transformOrigin: '50% 50%', // Rotate around center pivot point
          }}
        >
          <RealisticVehicleMarker
            color="White"
            model="Toyota Vitz"
            heading={liveDriverPos.heading}
            isAssigned={true}
            size="md"
          />
        </div>
      </div>

      {/* =========================================================================
          MAP CONTROLS AND OVERLAYS
          ========================================================================= */}

      {/* 2. SPEED LIMIT & SPEEDOMETER BADGE (BOTTOM-LEFT) */}
      <div className="absolute left-3 bottom-20 z-30 pointer-events-auto flex items-center space-x-2">
        <div className="w-11 h-12 bg-white border-2 border-slate-900 rounded-xl flex flex-col items-center justify-center shadow-xl">
          <span className="text-[7.5px] font-black uppercase text-slate-800 leading-none">
            Speed
          </span>
          <span className="text-[15px] font-black font-mono text-slate-950 leading-tight">25</span>
        </div>

        <div className="px-2.5 py-1.5 bg-slate-900/90 text-white rounded-xl shadow-xl border border-slate-700/80 flex flex-col items-center">
          <span className="text-sm font-black font-mono text-emerald-400 leading-none">
            {currentSpeed}
          </span>
          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tight">mph</span>
        </div>
      </div>

      {/* 3. RIGHT FLOATING ACTION STACK */}
      <div className="absolute right-3 top-36 z-30 pointer-events-auto flex flex-col space-y-2.5">
        <button
          type="button"
          onClick={() => {
            if (googleMapRef.current && liveDriverPos) {
              googleMapRef.current.panTo({ lat: liveDriverPos.lat, lng: liveDriverPos.lng });
              googleMapRef.current.setZoom(17);
            }
          }}
          className="w-11 h-11 rounded-full bg-white text-slate-800 shadow-xl border border-slate-200 flex items-center justify-center hover:bg-slate-50 active:scale-95 transition cursor-pointer"
          title="Recenter Camera"
        >
          <Compass className="w-5 h-5 text-red-500" />
        </button>

        <button
          type="button"
          onClick={() => setShowSearchPopover(!showSearchPopover)}
          className={`w-11 h-11 rounded-full shadow-xl border flex items-center justify-center active:scale-95 transition cursor-pointer ${
            showSearchPopover
              ? 'bg-blue-600 text-white border-blue-500'
              : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
          }`}
          title="Search Places Along Route"
        >
          <Search className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={handleToggleVoice}
          className={`w-11 h-11 rounded-full shadow-xl border flex items-center justify-center active:scale-95 transition cursor-pointer ${
            !isVoiceMuted
              ? 'bg-white text-slate-800 border-slate-200'
              : 'bg-slate-800 text-slate-400 border-slate-700'
          }`}
          title={isVoiceMuted ? 'Unmute Voice' : 'Mute Voice'}
        >
          {!isVoiceMuted ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
        </button>

        <button
          type="button"
          onClick={() => setShowHazardModal(!showHazardModal)}
          className="w-11 h-11 rounded-full bg-white text-amber-500 shadow-xl border border-slate-200 flex items-center justify-center hover:bg-slate-50 active:scale-95 transition cursor-pointer"
          title="Report Hazard"
        >
          <AlertTriangle className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={() => setIs3DMode(!is3DMode)}
          className={`w-11 h-11 rounded-full shadow-xl border flex flex-col items-center justify-center active:scale-95 transition cursor-pointer font-black text-xs ${
            is3DMode
              ? 'bg-[#004D40] text-emerald-300 border-emerald-500'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
          title={is3DMode ? '3D Perspective' : '2D Flat View'}
        >
          <span>{is3DMode ? '3D' : '2D'}</span>
        </button>
      </div>

      {/* SEARCH POPOVER */}
      {showSearchPopover && (
        <div className="absolute right-16 top-48 z-40 w-48 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-2 space-y-1.5 animate-fadeIn pointer-events-auto">
          <div className="flex items-center justify-between pb-1 border-b border-slate-200 dark:border-slate-800 px-1">
            <span className="text-[10px] font-black uppercase text-slate-500">
              Search on Route
            </span>
            <button
              type="button"
              onClick={() => setShowSearchPopover(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          {[
            { label: 'Gas Stations (Shidaal)', icon: Fuel, color: 'text-amber-500' },
            { label: 'Restaurants (Cunto)', icon: Utensils, color: 'text-emerald-500' },
            { label: 'ATMs (Zaad & eDahab)', icon: Landmark, color: 'text-blue-500' },
            { label: 'Mosques (Masaajid)', icon: Building2, color: 'text-purple-500' },
          ].map((item, idx) => (
            <button
              key={`search_${idx}`}
              type="button"
              onClick={() => {
                setShowSearchPopover(false);
                voiceNavigationService.speak(`Searching for nearby ${item.label}.`, 'en');
              }}
              className="w-full flex items-center space-x-2 px-2 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 text-left cursor-pointer"
            >
              <item.icon className={`w-3.5 h-3.5 ${item.color}`} />
              <span className="truncate">{item.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* HAZARD MODAL */}
      {showHazardModal && (
        <div className="absolute right-16 top-64 z-40 w-52 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-2xl border border-amber-500/40 p-2.5 space-y-2 animate-fadeIn pointer-events-auto">
          <div className="flex items-center justify-between pb-1 border-b border-slate-200 dark:border-slate-800">
            <span className="text-[10px] font-black uppercase text-amber-500 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              <span>Report Hazard</span>
            </span>
            <button
              type="button"
              onClick={() => setShowHazardModal(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          {[
            '🚨 Police Radar / Checkpoint',
            '🚧 Road Work / Dhisme',
            '🚗 Heavy Traffic Jam',
            '💥 Accident on Road',
          ].map((h, idx) => (
            <button
              key={`h_${idx}`}
              type="button"
              onClick={() => handleReportHazard(h)}
              className="w-full px-2 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-amber-500/20 text-slate-800 dark:text-slate-200 text-xs font-bold text-left cursor-pointer transition"
            >
              {h}
            </button>
          ))}
        </div>
      )}

      {/* HAZARD SUCCESS TOAST */}
      {hazardSuccessMsg && (
        <div className="absolute top-24 inset-x-4 z-50 max-w-sm mx-auto bg-amber-500 text-slate-950 px-4 py-2 rounded-2xl shadow-2xl text-xs font-black flex items-center justify-center space-x-2 animate-slideDown">
          <Check className="w-4 h-4" />
          <span>{hazardSuccessMsg}</span>
        </div>
      )}

      {/* 4. BOTTOM ROUTE & ETA SUMMARY BAR */}
      <div className="absolute bottom-3 inset-x-3 z-30 pointer-events-auto max-w-sm mx-auto">
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-3xl p-3 shadow-2xl border border-slate-200/90 dark:border-slate-800 flex items-center justify-between gap-3">
          <button
            type="button"
            className="w-9 h-9 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center hover:bg-slate-200 active:scale-95 transition cursor-pointer"
            title="Alternative Routes"
          >
            <GitFork className="w-4 h-4" />
          </button>

          <div className="text-center flex-1">
            <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono leading-none">
              {roadDurationMins ? `${roadDurationMins} min` : '2 min'}
            </div>
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-0.5">
              {roadDistanceKm ? `${roadDistanceKm.toFixed(1)} km` : '0.1 mi'} •{' '}
              {new Date(Date.now() + 2 * 60000).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setIsNavActive(false);
              voiceNavigationService.speak('Navigation ended', 'en');
            }}
            className="px-4 py-2 rounded-2xl bg-red-50 hover:bg-red-100 text-red-600 font-black text-xs border border-red-200 shadow-sm active:scale-95 transition cursor-pointer"
          >
            Exit
          </button>
        </div>
      </div>
    </div>
  );
};
