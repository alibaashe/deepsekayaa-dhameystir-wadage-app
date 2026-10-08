import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { MapPin, Navigation, Compass, Plus, Minus, Crosshair } from 'lucide-react';
import { useRide } from '../../context/RideContext';
import { RIDER_MAP_STYLE } from './mapStyles';
import { findNearestHargeisaPlace } from '../../utils/geo';
import { RealisticVehicleMarker } from './RealisticVehicleMarker';

interface RiderMapProps {
  height?: string;
  selectableMode?: 'pickup' | 'dropoff' | null;
}

const GOOGLE_MAPS_KEY =
  (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  'AIzaSyBAOVGm7NLFbVZdx2GCsn5_YjdYQVry_4w';

export const RiderMap: React.FC<RiderMapProps> = ({
  height = '100%',
  selectableMode = null,
}) => {
  const {
    pickupLocation,
    dropoffLocation,
    drivers,
    setPickupLocation,
    setDropoffLocation,
    currentRide,
  } = useRide();

  const containerRef = useRef<HTMLDivElement>(null);
  const mapDomRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);

  const [isSdkLoaded, setIsSdkLoaded] = useState<boolean>(
    typeof window !== 'undefined' && !!(window.google && window.google.maps)
  );

  const [center, setCenter] = useState<{ lat: number; lng: number }>(() => ({
    lat: pickupLocation?.lat || 9.5600,
    lng: pickupLocation?.lng || 44.0650,
  }));
  const [zoom, setZoom] = useState<number>(14);

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

    const scriptId = 'google-maps-js-sdk';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
        GOOGLE_MAPS_KEY
      )}&libraries=geometry,places`;
      script.async = true;
      script.onload = () => setIsSdkLoaded(true);
      script.onerror = () => setIsSdkLoaded(false);
      document.head.appendChild(script);
    }
  }, []);

  // Initialize Map with High-Contrast Rider Overview Style
  useEffect(() => {
    if (!isSdkLoaded || !mapDomRef.current || googleMapRef.current) return;

    try {
      const gMap = new google.maps.Map(mapDomRef.current, {
        center: { lat: center.lat, lng: center.lng },
        zoom: zoom,
        disableDefaultUI: true,
        gestureHandling: 'greedy',
        styles: RIDER_MAP_STYLE, // High contrast booking overview style
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

      gMap.addListener('click', (e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
          handleLocationSelect(e.latLng.lat(), e.latLng.lng());
        }
      });
    } catch (e) {
      console.warn('[RiderMap] Google Maps initialization notice:', e);
    }
  }, [isSdkLoaded]);

  const handleLocationSelect = useCallback(
    (lat: number, lng: number) => {
      const nearest = findNearestHargeisaPlace(lat, lng);
      const newLoc = {
        id: `loc_rider_${Date.now()}`,
        name: nearest.name,
        address: nearest.address,
        lat,
        lng,
      };

      if (selectableMode === 'dropoff') {
        setDropoffLocation(newLoc);
      } else {
        setPickupLocation(newLoc);
      }
    },
    [selectableMode, setDropoffLocation, setPickupLocation]
  );

  // Center update when pickup/dropoff changes
  useEffect(() => {
    if (pickupLocation?.lat && pickupLocation?.lng) {
      setCenter({ lat: pickupLocation.lat, lng: pickupLocation.lng });
      if (googleMapRef.current) {
        googleMapRef.current.panTo({ lat: pickupLocation.lat, lng: pickupLocation.lng });
      }
    }
  }, [pickupLocation?.lat, pickupLocation?.lng]);

  // Convert Lat/Lng to Screen Pixels
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
  // HIGH-PERFORMANCE RENDER LOOP FOR LIVE DRIVER FLEET TRACKING
  // ----------------------------------------------------
  // We maintain animated driver positions using requestAnimationFrame interpolation (lerp)
  // to achieve zero frame drops even during rapid WebSocket updates.
  const [animatedDriverPositions, setAnimatedDriverPositions] = useState<
    Array<{ id: string; lat: number; lng: number; heading: number; model: string; color: string }>
  >([]);

  const driverTargetsRef = useRef<
    Map<string, { lat: number; lng: number; heading: number; model: string; color: string }>
  >(new Map());
  const driverCurrentsRef = useRef<
    Map<string, { lat: number; lng: number; heading: number; model: string; color: string }>
  >(new Map());

  // Update target positions from driver props
  useEffect(() => {
    drivers.forEach((drv) => {
      if (drv.status === 'available' || drv.id === currentRide?.assignedDriverId) {
        const lat = drv.currentLocation?.lat ?? 9.5600;
        const lng = drv.currentLocation?.lng ?? 44.0650;
        const heading = drv.currentHeading ?? 0;
        const model = drv.vehicle?.model || 'Toyota Vitz';
        const color = drv.vehicle?.color || 'White';

        driverTargetsRef.current.set(drv.id, { lat, lng, heading, model, color });
        if (!driverCurrentsRef.current.has(drv.id)) {
          driverCurrentsRef.current.set(drv.id, { lat, lng, heading, model, color });
        }
      }
    });
  }, [drivers, currentRide?.assignedDriverId]);

  // requestAnimationFrame interpolation loop
  useEffect(() => {
    let animId: number;

    const animateLoop = () => {
      const updated: Array<{
        id: string;
        lat: number;
        lng: number;
        heading: number;
        model: string;
        color: string;
      }> = [];

      driverTargetsRef.current.forEach((target, id) => {
        const curr = driverCurrentsRef.current.get(id);
        if (curr) {
          // Smooth linear interpolation (lerp factor 0.1)
          const newLat = curr.lat + (target.lat - curr.lat) * 0.12;
          const newLng = curr.lng + (target.lng - curr.lng) * 0.12;
          const newHeading = curr.heading + (target.heading - curr.heading) * 0.12;

          driverCurrentsRef.current.set(id, {
            lat: newLat,
            lng: newLng,
            heading: newHeading,
            model: target.model,
            color: target.color,
          });

          updated.push({
            id,
            lat: newLat,
            lng: newLng,
            heading: newHeading,
            model: target.model,
            color: target.color,
          });
        }
      });

      setAnimatedDriverPositions(updated);
      animId = requestAnimationFrame(animateLoop);
    };

    animId = requestAnimationFrame(animateLoop);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full relative overflow-hidden select-none font-sans bg-slate-100"
      style={{ height }}
    >
      {/* Real Google Map Instance */}
      <div ref={mapDomRef} className="absolute inset-0 w-full h-full z-0" />

      {/* OVERLAY MAP MARKERS */}
      <div className="absolute inset-0 pointer-events-none z-10">
        {/* 1. DISTINCT PICKUP POINT PIN WITH PULSING RING ANIMATION */}
        {pickupLocation && (() => {
          const pt = toScreenCoord(pickupLocation.lat, pickupLocation.lng);
          return (
            <div
              className="absolute -translate-x-1/2 -translate-y-full pointer-events-none z-30"
              style={{ left: `${pt.x}px`, top: `${pt.y}px` }}
            >
              <div className="relative flex flex-col items-center">
                {/* Pulsing Aura Ring Animation */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-blue-500/25 animate-ping pointer-events-none" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-blue-500/40 animate-pulse pointer-events-none" />

                {/* Pickup Label Badge */}
                <div className="relative bg-[#0066FF] text-white text-[11px] font-extrabold px-3 py-1 rounded-2xl shadow-2xl whitespace-nowrap mb-1 border border-blue-300/40 flex items-center gap-1.5 after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-[5px] after:border-transparent after:border-t-[#0066FF]">
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  <span>Pickup Point</span>
                </div>

                {/* Sleek Pin Head */}
                <div className="w-6 h-6 rounded-full bg-[#0066FF] border-2 border-white shadow-xl flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-white" />
                </div>
              </div>
            </div>
          );
        })()}

        {/* 2. DISTINCT DESTINATION PIN */}
        {dropoffLocation && (() => {
          const pt = toScreenCoord(dropoffLocation.lat, dropoffLocation.lng);
          return (
            <div
              className="absolute -translate-x-1/2 -translate-y-full pointer-events-none z-30"
              style={{ left: `${pt.x}px`, top: `${pt.y}px` }}
            >
              <div className="relative flex flex-col items-center">
                {/* Dropoff Label Badge */}
                <div className="px-2.5 py-1 bg-slate-900 text-emerald-400 text-[11px] font-extrabold rounded-2xl shadow-2xl mb-1 border border-emerald-500/40 whitespace-nowrap flex items-center gap-1">
                  <span>🏁 {dropoffLocation.name || 'Destination'}</span>
                </div>

                {/* Destination Pin Icon */}
                <div className="w-8 h-8 rounded-full bg-emerald-600 border-2 border-white flex items-center justify-center text-white shadow-2xl">
                  <MapPin className="w-4 h-4 fill-current" />
                </div>
              </div>
            </div>
          );
        })()}

        {/* 3. OPTIMIZED LIVE DRIVER FLEET TRACKING MARKERS */}
        {animatedDriverPositions.map((drv) => {
          const pt = toScreenCoord(drv.lat, drv.lng);
          const isAssigned = drv.id === currentRide?.assignedDriverId;

          return (
            <div
              key={`fleet_${drv.id}`}
              className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-transform duration-75 ease-linear z-20"
              style={{ left: `${pt.x}px`, top: `${pt.y}px` }}
            >
              <RealisticVehicleMarker
                color={drv.color}
                model={drv.model}
                heading={drv.heading}
                isAssigned={isAssigned}
                size="sm"
              />
            </div>
          );
        })}
      </div>

      {/* RIDER FLOATING CONTROLS */}
      <div className="absolute right-3 top-16 z-30 pointer-events-auto flex flex-col space-y-2">
        <button
          type="button"
          onClick={() => {
            if (pickupLocation && googleMapRef.current) {
              googleMapRef.current.panTo({ lat: pickupLocation.lat, lng: pickupLocation.lng });
              googleMapRef.current.setZoom(16);
            }
          }}
          className="w-10 h-10 rounded-full bg-white text-slate-800 shadow-xl border border-slate-200 flex items-center justify-center hover:bg-slate-50 active:scale-95 transition cursor-pointer"
          title="Locate Pickup"
        >
          <Crosshair className="w-5 h-5 text-blue-600" />
        </button>

        <button
          type="button"
          onClick={() => setZoom((z) => Math.min(19, z + 1))}
          className="w-10 h-10 rounded-full bg-white text-slate-800 shadow-xl border border-slate-200 flex items-center justify-center hover:bg-slate-50 active:scale-95 transition cursor-pointer font-extrabold"
        >
          <Plus className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={() => setZoom((z) => Math.max(10, z - 1))}
          className="w-10 h-10 rounded-full bg-white text-slate-800 shadow-xl border border-slate-200 flex items-center justify-center hover:bg-slate-50 active:scale-95 transition cursor-pointer font-extrabold"
        >
          <Minus className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
