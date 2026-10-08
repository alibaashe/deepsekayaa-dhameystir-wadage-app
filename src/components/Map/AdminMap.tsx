import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Radio, Eye, Layers, Flame, Shield, MapPin, ZoomIn, ZoomOut, RefreshCw } from 'lucide-react';
import { useRide } from '../../context/RideContext';
import { ADMIN_MAP_STYLE } from './mapStyles';
import { RealisticVehicleMarker } from './RealisticVehicleMarker';
import { getGoogleMapsApiKey } from '../../utils/googleMapsKey';

interface AdminMapProps {
  height?: string;
  showSurgeHeatmap?: boolean;
}

// Pre-defined Hargeisa Geofence Dispatch Zones
const HARGEISA_GEOFENCE_ZONES = [
  {
    id: 'zone_airport',
    name: 'Egal Int. Airport Zone',
    color: '#3B82F6', // Blue
    center: { lat: 9.5167, lng: 44.0889 },
    radiusMeters: 1800,
  },
  {
    id: 'zone_downtown',
    name: 'Downtown Commercial Core',
    color: '#10B981', // Emerald Green
    center: { lat: 9.5600, lng: 44.0650 },
    radiusMeters: 2200,
  },
  {
    id: 'zone_university',
    name: 'University & Medical District',
    color: '#8B5CF6', // Purple
    center: { lat: 9.5720, lng: 44.0450 },
    radiusMeters: 1600,
  },
];

// Demand Heatmap Hotspots
const DEMAND_HOTSPOTS = [
  { id: 'heat_1', lat: 9.5610, lng: 44.0660, intensity: 'extreme', label: 'Surge 2.2x' },
  { id: 'heat_2', lat: 9.5180, lng: 44.0890, intensity: 'high', label: 'Surge 1.6x' },
  { id: 'heat_3', lat: 9.5730, lng: 44.0460, intensity: 'high', label: 'Surge 1.4x' },
  { id: 'heat_4', lat: 9.5450, lng: 44.0750, intensity: 'extreme', label: 'Surge 2.5x' },
];

export const AdminMap: React.FC<AdminMapProps> = ({
  height = '100%',
  showSurgeHeatmap = true,
}) => {
  const { drivers } = useRide();

  const containerRef = useRef<HTMLDivElement>(null);
  const mapDomRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);

  const [isSdkLoaded, setIsSdkLoaded] = useState<boolean>(
    typeof window !== 'undefined' && !!(window.google && window.google.maps)
  );

  const [center, setCenter] = useState<{ lat: number; lng: number }>({
    lat: 9.5600,
    lng: 44.0650,
  });
  const [zoom, setZoom] = useState<number>(13);
  const [showGeofences, setShowGeofences] = useState<boolean>(true);
  const [showHeatmapOverlay, setShowHeatmapOverlay] = useState<boolean>(showSurgeHeatmap);

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

  // Initialize Google Maps SDK
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

  // Initialize Map with Sleek Dark-Mode Style
  useEffect(() => {
    if (!isSdkLoaded || !mapDomRef.current || googleMapRef.current) return;

    try {
      const gMap = new google.maps.Map(mapDomRef.current, {
        center: { lat: center.lat, lng: center.lng },
        zoom: zoom,
        disableDefaultUI: true,
        gestureHandling: 'greedy',
        styles: ADMIN_MAP_STYLE, // Sleek dark-mode / cloud style
      });

      googleMapRef.current = gMap;

      gMap.addListener('dragend', () => {
        const c = gMap.getCenter();
        if (c) setCenter({ lat: c.lat(), lng: c.lng() });
      });

      gMap.addListener('zoom_changed', () => {
        const z = gMap.getZoom();
        if (z !== undefined) setZoom(z);
      });
    } catch (e) {
      console.warn('[AdminMap] Google Maps initialization notice:', e);
    }
  }, [isSdkLoaded]);

  // Convert Lat/Lng to Screen Offset
  const toScreenCoord = useCallback(
    (lat: number, lng: number) => {
      const scale = Math.pow(2, zoom);
      const centerRad = (center.lat * Math.PI) / 180;
      const pointRad = (lat * Math.PI) / 180;

      const x = ((lng - center.lng) / 360) * scale * 256 + dimensions.width / 2;
      const y =
        (((Math.asinh(Math.tan(centerRad)) - Math.asinh(Math.tan(pointRad))) / Math.PI) *
          scale *
          256) /
          2 +
        dimensions.height / 2;

      return { x, y };
    },
    [center, zoom, dimensions]
  );

  // ----------------------------------------------------
  // MARKER CLUSTERING ALGORITHM FOR HIGH-DENSITY FLEETS
  // ----------------------------------------------------
  const clusteredDrivers = useMemo(() => {
    const clusterPixelDistance = zoom < 12 ? 90 : zoom < 14 ? 65 : 45;

    const clusters: Array<{
      id: string;
      lat: number;
      lng: number;
      count: number;
      driversList: typeof drivers;
      isCluster: boolean;
    }> = [];

    const activeDrivers = drivers.filter((d) => d.status === 'available' || d.status === 'busy');

    activeDrivers.forEach((drv) => {
      const lat = drv.currentLocation?.lat ?? 9.5600;
      const lng = drv.currentLocation?.lng ?? 44.0650;
      const pt = toScreenCoord(lat, lng);

      let foundCluster = false;
      for (const cl of clusters) {
        const clPt = toScreenCoord(cl.lat, cl.lng);
        const dist = Math.hypot(clPt.x - pt.x, clPt.y - pt.y);

        if (dist < clusterPixelDistance) {
          cl.driversList.push(drv);
          cl.count += 1;
          cl.lat = (cl.lat * (cl.count - 1) + lat) / cl.count;
          cl.lng = (cl.lng * (cl.count - 1) + lng) / cl.count;
          cl.isCluster = cl.count > 1;
          foundCluster = true;
          break;
        }
      }

      if (!foundCluster) {
        clusters.push({
          id: `cl_${drv.id}`,
          lat,
          lng,
          count: 1,
          driversList: [drv],
          isCluster: false,
        });
      }
    });

    return clusters;
  }, [drivers, zoom, toScreenCoord]);

  return (
    <div
      ref={containerRef}
      className="w-full relative overflow-hidden select-none font-sans bg-slate-950 text-white"
      style={{ height }}
    >
      {/* Real Google Maps Native Canvas */}
      <div ref={mapDomRef} className="absolute inset-0 w-full h-full z-0" />

      {/* OVERLAY MAP GRAPHICS & CLUSTERS */}
      <div className="absolute inset-0 pointer-events-none z-10">
        {/* 1. GEOFENCING DISPATCH ZONES */}
        {showGeofences &&
          HARGEISA_GEOFENCE_ZONES.map((zone) => {
            const pt = toScreenCoord(zone.center.lat, zone.center.lng);
            const radiusPx = (zone.radiusMeters / 156543.03392) * Math.pow(2, zoom);

            return (
              <div key={zone.id} className="absolute inset-0 pointer-events-none">
                <svg className="w-full h-full absolute inset-0">
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={Math.max(10, radiusPx)}
                    fill={zone.color}
                    fillOpacity="0.12"
                    stroke={zone.color}
                    strokeWidth="2"
                    strokeDasharray="6 6"
                  />
                </svg>
                <div
                  className="absolute -translate-x-1/2 -translate-y-1/2 bg-slate-900/90 text-white text-[10px] font-black px-2 py-0.5 rounded-lg border border-slate-700 shadow-xl whitespace-nowrap"
                  style={{ left: `${pt.x}px`, top: `${pt.y - radiusPx - 10}px` }}
                >
                  <span style={{ color: zone.color }}>🛡️ {zone.name}</span>
                </div>
              </div>
            );
          })}

        {/* 2. DEMAND HEATMAPS */}
        {showHeatmapOverlay &&
          DEMAND_HOTSPOTS.map((spot) => {
            const pt = toScreenCoord(spot.lat, spot.lng);
            return (
              <div
                key={spot.id}
                className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                style={{ left: `${pt.x}px`, top: `${pt.y}px` }}
              >
                <div className="w-28 h-28 rounded-full bg-gradient-to-r from-red-600/35 via-amber-500/25 to-transparent animate-pulse filter blur-md" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-950/90 text-red-300 text-[9.5px] font-black px-2 py-0.5 rounded-full border border-red-500/50 shadow-2xl whitespace-nowrap flex items-center gap-1">
                  <Flame className="w-3 h-3 text-red-500 fill-red-500" />
                  <span>{spot.label}</span>
                </div>
              </div>
            );
          })}

        {/* 3. CLUSTER MARKERS (Agile high-density fleet bubbles) */}
        {clusteredDrivers.map((item) => {
          const pt = toScreenCoord(item.lat, item.lng);

          if (item.isCluster) {
            const isLargeCluster = item.count > 20;
            const isMediumCluster = item.count > 8;

            return (
              <div
                key={item.id}
                onClick={() => {
                  setCenter({ lat: item.lat, lng: item.lng });
                  setZoom((z) => Math.min(18, z + 2));
                }}
                className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto cursor-pointer z-30 transition-transform hover:scale-110 active:scale-95"
                style={{ left: `${pt.x}px`, top: `${pt.y}px` }}
              >
                <div
                  className={`relative flex items-center justify-center rounded-full font-black text-white shadow-2xl border-2 transition-all ${
                    isLargeCluster
                      ? 'w-12 h-12 bg-red-600/90 border-red-400 text-sm shadow-red-500/50'
                      : isMediumCluster
                      ? 'w-10 h-10 bg-amber-600/90 border-amber-400 text-xs shadow-amber-500/50'
                      : 'w-8 h-8 bg-emerald-600/90 border-emerald-400 text-[11px] shadow-emerald-500/50'
                  }`}
                >
                  <div className="absolute inset-0 rounded-full bg-white/20 animate-ping opacity-30" />
                  <span>{item.count}</span>
                </div>
              </div>
            );
          }

          // Single Driver Vehicle Marker
          const singleDriver = item.driversList[0];
          return (
            <div
              key={item.id}
              className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20"
              style={{ left: `${pt.x}px`, top: `${pt.y}px` }}
            >
              <RealisticVehicleMarker
                color={singleDriver.vehicle?.color || 'White'}
                model={singleDriver.vehicle?.model || 'Toyota Vitz'}
                heading={singleDriver.currentHeading || 0}
                driverName={singleDriver.name}
                showDetails={zoom >= 14}
                size="sm"
              />
            </div>
          );
        })}
      </div>

      {/* ADMIN FLOATING DASHBOARD CONTROLS */}
      <div className="absolute right-4 top-4 z-30 pointer-events-auto flex flex-col space-y-2">
        <button
          type="button"
          onClick={() => setShowGeofences(!showGeofences)}
          className={`px-3 py-1.5 rounded-xl text-xs font-black shadow-2xl border flex items-center gap-1.5 transition cursor-pointer ${
            showGeofences
              ? 'bg-blue-600 text-white border-blue-400'
              : 'bg-slate-900/90 text-slate-400 border-slate-800 hover:text-white'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Geofences</span>
        </button>

        <button
          type="button"
          onClick={() => setShowHeatmapOverlay(!showHeatmapOverlay)}
          className={`px-3 py-1.5 rounded-xl text-xs font-black shadow-2xl border flex items-center gap-1.5 transition cursor-pointer ${
            showHeatmapOverlay
              ? 'bg-red-600 text-white border-red-400'
              : 'bg-slate-900/90 text-slate-400 border-slate-800 hover:text-white'
          }`}
        >
          <Flame className="w-3.5 h-3.5" />
          <span>Heatmap</span>
        </button>

        <div className="flex flex-col bg-slate-900/90 rounded-xl border border-slate-800 p-1 space-y-1 shadow-2xl">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(19, z + 1))}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition cursor-pointer"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(10, z - 1))}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition cursor-pointer"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
