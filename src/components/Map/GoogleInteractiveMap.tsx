// Wadaage Mobility - Interactive Maps Engine (Hargeisa, Somaliland)
import * as React from 'react';
import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  Crosshair,
  Layers,
  Compass,
  Plus,
  Minus,
  MapPin,
  Car as CarIcon,
  Maximize2,
  Navigation,
} from 'lucide-react';
import { useRide } from '../../context/RideContext';
import { findNearestHargeisaPlace } from '../../utils/geo';
import { HARGEISA_VERIFIED_LANDMARKS } from '../../data/hargeisaKeyLandmarks';
import { RealisticVehicleMarker } from './RealisticVehicleMarker';

interface GoogleInteractiveMapProps {
  showSurgeHeatmap?: boolean;
  selectableMode?: 'pickup' | 'dropoff' | null;
  height?: string;
  onModeChange?: (mode: 'pickup' | 'dropoff') => void;
}

// Google Maps API Key resolved from Vite env or process env
const RAW_GOOGLE_MAPS_KEY =
  (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (process.env as any).GOOGLE_MAPS_API_KEY ||
  (process.env as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';

const GOOGLE_MAPS_KEY = String(RAW_GOOGLE_MAPS_KEY).trim();

// Clean, modern Google Maps styling for high clarity & road visibility
const CLEAN_GOOGLE_MAP_STYLES: google.maps.MapTypeStyle[] = [
  {
    featureType: 'poi',
    elementType: 'labels.text',
    stylers: [{ visibility: 'on' }],
  },
  {
    featureType: 'poi.business',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ lightness: 10 }, { visibility: 'simplified' }],
  },
  {
    featureType: 'road.arterial',
    elementType: 'geometry',
    stylers: [{ color: '#f5f5f5' }, { visibility: 'simplified' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#fcd34d' }],
  },
  {
    featureType: 'transit',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#c4e0e5' }],
  },
];

// Dark theme map styling for night mode
const DARK_GOOGLE_MAP_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#1d2c4d' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8ec3b9' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1a3646' }] },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#2b3955' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#405785' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#0e1626' }],
  },
];

// Spherical Mercator Math Helpers for High-Precision Slippy Google Map Tiles
function latLngToTile(lat: number, lng: number, zoom: number) {
  const n = Math.pow(2, zoom);
  const rad = (lat * Math.PI) / 180;
  const x = Math.floor(((lng + 180) / 360) * n);
  const y = Math.floor(((1 - Math.asinh(Math.tan(rad)) / Math.PI) / 2) * n);
  return { x, y };
}

function latLngToPixel(lat: number, lng: number, zoom: number) {
  const n = Math.pow(2, zoom);
  const rad = (lat * Math.PI) / 180;
  const x = ((lng + 180) / 360) * n * 256;
  const y = ((1 - Math.asinh(Math.tan(rad)) / Math.PI) / 2) * n * 256;
  return { x, y };
}

function pixelToLatLng(x: number, y: number, zoom: number) {
  const n = Math.pow(2, zoom);
  const lng = (x / (n * 256)) * 360 - 180;
  const rad = Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / (n * 256))));
  const lat = (rad * 180) / Math.PI;
  return { lat, lng };
}

// Global script loader promise to prevent duplicate script tags
let googleMapsLoaderPromise: Promise<boolean> | null = null;

function loadGoogleMapsSdk(apiKey: string): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if (!apiKey || !apiKey.trim()) return Promise.resolve(false);
  if ((window as any).__googleMapsAuthFailed) return Promise.resolve(false);
  if (window.google && window.google.maps) return Promise.resolve(true);

  if (googleMapsLoaderPromise) return googleMapsLoaderPromise;

  googleMapsLoaderPromise = new Promise((resolve) => {
    // Intercept auth errors
    const previousAuthFailure = (window as any).gm_authFailure;
    (window as any).gm_authFailure = () => {
      console.warn('[Google Maps] gm_authFailure intercepted. Activating high-performance raster mapping.');
      (window as any).__googleMapsAuthFailed = true;
      if (previousAuthFailure) previousAuthFailure();
      resolve(false);
    };

    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(true));
      existingScript.addEventListener('error', () => resolve(false));
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places,geometry,marker&loading=async`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.warn('[Google Maps SDK] Script failed to load. Using live raster tiles.');
      resolve(false);
    };
    document.head.appendChild(script);
  });

  return googleMapsLoaderPromise;
}

export const GoogleInteractiveMap: React.FC<GoogleInteractiveMapProps> = ({
  selectableMode = null,
  height = '100%',
}) => {
  const {
    pickupLocation,
    dropoffLocation,
    drivers,
    setPickupLocation,
    setDropoffLocation,
    currentRide,
    roadRoute,
    role,
    driverGpsStatus,
  } = useRide();

  const containerRef = useRef<HTMLDivElement>(null);
  const mapDomRef = useRef<HTMLDivElement>(null);
  const googleMapInstanceRef = useRef<google.maps.Map | null>(null);
  const trafficLayerRef = useRef<google.maps.TrafficLayer | null>(null);
  const overlayRef = useRef<google.maps.OverlayView | null>(null);

  const [isSdkLoaded, setIsSdkLoaded] = useState<boolean>(
    typeof window !== 'undefined' && !!(window.google && window.google.maps) && !(window as any).__googleMapsAuthFailed
  );

  const [center, setCenter] = useState<{ lat: number; lng: number }>(() => ({
    lat: pickupLocation?.lat || 9.5600,
    lng: pickupLocation?.lng || 44.0650,
  }));
  const [zoom, setZoom] = useState<number>(14);
  const [mapLayer, setMapLayer] = useState<'roadmap' | 'satellite' | 'dark'>('roadmap');
  const [showTraffic, setShowTraffic] = useState<boolean>(false);
  const [isCenteringGPS, setIsCenteringGPS] = useState<boolean>(false);

  // Projection / Screen offset sync for markers
  const [overlayProjection, setOverlayProjection] = useState<google.maps.MapCanvasProjection | null>(null);

  // Fallback Dragging & Panning state
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const centerStartRef = useRef<{ lat: number; lng: number }>({ lat: 9.5600, lng: 44.0650 });
  const hasMovedRef = useRef(false);

  // Dimensions
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: typeof window !== 'undefined' ? window.innerWidth : 800,
    height: typeof window !== 'undefined' ? window.innerHeight : 600,
  });

  // Keep dimensions responsive
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({
          width: Math.max(rect.width, 300),
          height: Math.max(rect.height, 300),
        });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Listen to Google Maps auth failure
  useEffect(() => {
    const handleAuthFailure = () => {
      setIsSdkLoaded(false);
      if (googleMapInstanceRef.current && mapDomRef.current) {
        try {
          mapDomRef.current.innerHTML = '';
        } catch (_e) {}
      }
    };
    window.addEventListener('gm_authFailure', handleAuthFailure);
    return () => window.removeEventListener('gm_authFailure', handleAuthFailure);
  }, []);

  // Only load SDK if a non-empty key is present
  useEffect(() => {
    let mounted = true;
    if (GOOGLE_MAPS_KEY && !isSdkLoaded && !(window as any).__googleMapsAuthFailed) {
      loadGoogleMapsSdk(GOOGLE_MAPS_KEY).then((loaded) => {
        if (mounted && loaded && window.google && window.google.maps) {
          setIsSdkLoaded(true);
        }
      });
    }
    return () => {
      mounted = false;
    };
  }, [isSdkLoaded]);

  // Handle Location Click
  const handleLocationSelect = useCallback(
    (lat: number, lng: number) => {
      const nearest = findNearestHargeisaPlace(lat, lng);
      const newLoc = {
        id: `loc_pin_${Date.now()}`,
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

  // Initialize native Google Map when SDK is ready
  useEffect(() => {
    if (!isSdkLoaded || !mapDomRef.current || googleMapInstanceRef.current) return;

    try {
      const gMap = new google.maps.Map(mapDomRef.current, {
        center,
        zoom,
        disableDefaultUI: true,
        clickableIcons: false,
        gestureHandling: 'greedy',
        styles: mapLayer === 'dark' ? DARK_GOOGLE_MAP_STYLES : CLEAN_GOOGLE_MAP_STYLES,
        mapTypeId: mapLayer === 'satellite' ? google.maps.MapTypeId.HYBRID : google.maps.MapTypeId.ROADMAP,
      });

      googleMapInstanceRef.current = gMap;

      const traffic = new google.maps.TrafficLayer();
      trafficLayerRef.current = traffic;
      if (showTraffic) {
        traffic.setMap(gMap);
      }

      gMap.addListener('center_changed', () => {
        const c = gMap.getCenter();
        if (c) {
          setCenter({ lat: c.lat(), lng: c.lng() });
        }
      });

      gMap.addListener('zoom_changed', () => {
        const z = gMap.getZoom();
        if (z !== undefined) {
          setZoom(z);
        }
      });

      gMap.addListener('click', (e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
          handleLocationSelect(e.latLng.lat(), e.latLng.lng());
        }
      });

      // OverlayView to get accurate projection for HTML vehicle markers
      const overlay = new google.maps.OverlayView();
      overlay.onAdd = function () {};
      overlay.draw = function () {
        const projection = overlay.getProjection();
        if (projection) {
          setOverlayProjection(projection);
        }
      };
      overlay.onRemove = function () {};
      overlay.setMap(gMap);
      overlayRef.current = overlay;
    } catch (err) {
      console.warn('[Google Maps] Initialization notice:', err);
    }
  }, [isSdkLoaded, handleLocationSelect]);

  // Sync Map Options on change
  useEffect(() => {
    const gMap = googleMapInstanceRef.current;
    if (!gMap) return;

    if (mapLayer === 'satellite') {
      gMap.setMapTypeId(google.maps.MapTypeId.HYBRID);
      gMap.setOptions({ styles: undefined });
    } else if (mapLayer === 'dark') {
      gMap.setMapTypeId(google.maps.MapTypeId.ROADMAP);
      gMap.setOptions({ styles: DARK_GOOGLE_MAP_STYLES });
    } else {
      gMap.setMapTypeId(google.maps.MapTypeId.ROADMAP);
      gMap.setOptions({ styles: CLEAN_GOOGLE_MAP_STYLES });
    }
  }, [mapLayer]);

  // Sync Traffic Layer
  useEffect(() => {
    const traffic = trafficLayerRef.current;
    const gMap = googleMapInstanceRef.current;
    if (!traffic || !gMap) return;
    if (showTraffic) {
      traffic.setMap(gMap);
    } else {
      traffic.setMap(null);
    }
  }, [showTraffic]);

  // Sync center and zoom into Google Map
  useEffect(() => {
    const gMap = googleMapInstanceRef.current;
    if (!gMap) return;
    const curCenter = gMap.getCenter();
    if (
      !curCenter ||
      Math.abs(curCenter.lat() - center.lat) > 0.0001 ||
      Math.abs(curCenter.lng() - center.lng) > 0.0001
    ) {
      gMap.panTo({ lat: center.lat, lng: center.lng });
    }
  }, [center]);

  useEffect(() => {
    const gMap = googleMapInstanceRef.current;
    if (!gMap) return;
    if (gMap.getZoom() !== zoom) {
      gMap.setZoom(zoom);
    }
  }, [zoom]);

  // Real-Time Hardware GPS Driver Telematics
  const assignedDriver = currentRide?.assignedDriverId
    ? drivers.find((d) => d.id === currentRide.assignedDriverId)
    : undefined;

  const liveDriverPos = useMemo(() => {
    if (role === 'driver' && driverGpsStatus?.active && driverGpsStatus.lat) {
      return {
        lat: driverGpsStatus.lat,
        lng: driverGpsStatus.lng,
        heading: driverGpsStatus.heading || 0,
      };
    }
    if (assignedDriver) {
      return {
        lat: assignedDriver.currentLocation?.lat ?? (assignedDriver as any).lat ?? 9.5600,
        lng: assignedDriver.currentLocation?.lng ?? (assignedDriver as any).lng ?? 44.0650,
        heading: assignedDriver.currentHeading ?? 45,
      };
    }
    return null;
  }, [role, driverGpsStatus, assignedDriver]);

  // Update center when pickup location changes initially
  useEffect(() => {
    if (pickupLocation?.lat && pickupLocation?.lng) {
      setCenter({ lat: pickupLocation.lat, lng: pickupLocation.lng });
    }
  }, [pickupLocation?.lat, pickupLocation?.lng]);

  const handleCenterGPS = () => {
    if ('geolocation' in navigator) {
      setIsCenteringGPS(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setIsCenteringGPS(false);
          const { latitude, longitude } = pos.coords;
          setCenter({ lat: latitude, lng: longitude });
          setZoom(16);
          handleLocationSelect(latitude, longitude);
        },
        () => {
          setIsCenteringGPS(false);
          setCenter({ lat: 9.5600, lng: 44.0650 });
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  };

  const handleFitBounds = () => {
    const gMap = googleMapInstanceRef.current;
    if (gMap && pickupLocation && dropoffLocation && window.google) {
      const bounds = new google.maps.LatLngBounds();
      bounds.extend({ lat: pickupLocation.lat, lng: pickupLocation.lng });
      bounds.extend({ lat: dropoffLocation.lat, lng: dropoffLocation.lng });
      if (liveDriverPos) {
        bounds.extend({ lat: liveDriverPos.lat, lng: liveDriverPos.lng });
      }
      gMap.fitBounds(bounds, { top: 60, bottom: 80, left: 40, right: 40 });
    } else if (pickupLocation && dropoffLocation) {
      const midLat = (pickupLocation.lat + dropoffLocation.lat) / 2;
      const midLng = (pickupLocation.lng + dropoffLocation.lng) / 2;
      setCenter({ lat: midLat, lng: midLng });
      setZoom(13);
    } else if (pickupLocation) {
      setCenter({ lat: pickupLocation.lat, lng: pickupLocation.lng });
      setZoom(15);
    } else {
      setCenter({ lat: 9.5600, lng: 44.0650 });
      setZoom(14);
    }
  };

  // Convert Lat/Lng to Container Screen Pixel coordinates
  const toScreenCoord = useCallback(
    (lat: number, lng: number) => {
      if (overlayProjection && window.google && googleMapInstanceRef.current) {
        try {
          const latLng = new google.maps.LatLng(lat, lng);
          const point = overlayProjection.fromLatLngToContainerPixel(latLng);
          if (point) {
            return { x: point.x, y: point.y };
          }
        } catch (_e) {}
      }

      const centerPixel = latLngToPixel(center.lat, center.lng, zoom);
      const p = latLngToPixel(lat, lng, zoom);
      return {
        x: p.x - centerPixel.x + dimensions.width / 2,
        y: p.y - centerPixel.y + dimensions.height / 2,
      };
    },
    [overlayProjection, center.lat, center.lng, zoom, dimensions.width, dimensions.height]
  );

  // Real Road Route Path Points
  const routePoints = useMemo(() => {
    if (roadRoute?.coordinates && roadRoute.coordinates.length > 1) {
      return roadRoute.coordinates.map(([lng, lat]) => toScreenCoord(lat, lng));
    }
    if (pickupLocation && dropoffLocation) {
      const p1 = toScreenCoord(pickupLocation.lat, pickupLocation.lng);
      const p2 = toScreenCoord(dropoffLocation.lat, dropoffLocation.lng);
      // Smooth intermediate waypoint
      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2;
      return [p1, { x: midX, y: midY }, p2];
    }
    return [];
  }, [roadRoute?.coordinates, pickupLocation, dropoffLocation, toScreenCoord]);

  // Smooth curved SVG path for the route
  const smoothRoutePath = useMemo(() => {
    if (routePoints.length < 2) return '';
    if (routePoints.length === 2) {
      return `M ${routePoints[0].x},${routePoints[0].y} L ${routePoints[1].x},${routePoints[1].y}`;
    }
    let d = `M ${routePoints[0].x},${routePoints[0].y}`;
    for (let i = 1; i < routePoints.length - 1; i++) {
      const pCurr = routePoints[i];
      const pNext = routePoints[i + 1];
      const midX = (pCurr.x + pNext.x) / 2;
      const midY = (pCurr.y + pNext.y) / 2;
      d += ` Q ${pCurr.x},${pCurr.y} ${midX},${midY}`;
    }
    const last = routePoints[routePoints.length - 1];
    d += ` L ${last.x},${last.y}`;
    return d;
  }, [routePoints]);

  // Driver Approach Path computation
  const approachSvgPath = useMemo(() => {
    if (
      !liveDriverPos ||
      !pickupLocation ||
      (currentRide?.status !== 'accepted' && currentRide?.status !== 'driver_arrived')
    ) {
      return '';
    }
    const pDriver = toScreenCoord(liveDriverPos.lat, liveDriverPos.lng);
    const pPickup = toScreenCoord(pickupLocation.lat, pickupLocation.lng);
    return `M ${pDriver.x},${pDriver.y} L ${pPickup.x},${pPickup.y}`;
  }, [liveDriverPos, pickupLocation, currentRide?.status, toScreenCoord]);

  // Pre-calculate pure Google Map direct raster tiles for instant smooth rendering
  const centerPixel = useMemo(
    () => latLngToPixel(center.lat, center.lng, zoom),
    [center.lat, center.lng, zoom]
  );

  const minTile = useMemo(() => {
    const tl = pixelToLatLng(
      centerPixel.x - dimensions.width / 2 - 256,
      centerPixel.y - dimensions.height / 2 - 256,
      zoom
    );
    return latLngToTile(tl.lat, tl.lng, zoom);
  }, [centerPixel.x, centerPixel.y, dimensions.width, dimensions.height, zoom]);

  const maxTile = useMemo(() => {
    const br = pixelToLatLng(
      centerPixel.x + dimensions.width / 2 + 256,
      centerPixel.y + dimensions.height / 2 + 256,
      zoom
    );
    return latLngToTile(br.lat, br.lng, zoom);
  }, [centerPixel.x, centerPixel.y, dimensions.width, dimensions.height, zoom]);

  // Curated prominent landmarks and city places in Hargeisa for high visual clarity
  const HARGEISA_NOTABLE_PLACES = useMemo(() => [
    { id: 'place_airport', name: 'Cigaal Airport (Egal)', lat: 9.5167, lng: 44.0889, category: 'Airport', icon: '✈️' },
    { id: 'place_mig', name: 'Taallada MiG (War Memorial)', lat: 9.5598, lng: 44.0673, category: 'Monument', icon: '🏛️' },
    { id: 'place_suuq', name: 'Suuqa Waaheen (Central Market)', lat: 9.5620, lng: 44.0645, category: 'Market', icon: '🛍️' },
    { id: 'place_dahabshiil', name: 'Dahabshiil HQ (26 June)', lat: 9.5615, lng: 44.0682, category: 'Finance', icon: '🏦' },
    { id: 'place_telesom', name: 'Telesom HQ (Main Street)', lat: 9.5585, lng: 44.0640, category: 'Telecom', icon: '📱' },
    { id: 'place_uoh', name: 'Jaamacadda Hargeysa (UoH)', lat: 9.5512, lng: 44.0585, category: 'University', icon: '🎓' },
    { id: 'place_edna', name: 'Edna Adan Hospital', lat: 9.5543, lng: 44.0678, category: 'Hospital', icon: '🏥' },
    { id: 'place_mansoor', name: 'Mansoor Hotel', lat: 9.5822, lng: 44.0450, category: 'Hotel', icon: '🏨' },
    { id: 'place_ambassador', name: 'Ambassador Hotel', lat: 9.5255, lng: 44.0845, category: 'Hotel', icon: '🏨' },
    { id: 'place_jigjigayar', name: 'Jigjiga Yar District', lat: 9.5700, lng: 44.0750, category: 'District', icon: '📍' },
    { id: 'place_shacabka', name: "Bada Cas / Sha'abka", lat: 9.5570, lng: 44.0610, category: 'District', icon: '📍' },
    { id: 'place_gollis', name: 'Gollis University', lat: 9.5630, lng: 44.0725, category: 'University', icon: '🎓' },
    { id: 'place_national', name: 'National Museum & Daryeel', lat: 9.5590, lng: 44.0655, category: 'Culture', icon: '🏛️' },
    { id: 'place_star', name: 'Star Hotel / Main Rd', lat: 9.5605, lng: 44.0665, category: 'Hotel', icon: '🏨' },
    { id: 'place_oriental', name: 'Oriental Hotel Hargeisa', lat: 9.5612, lng: 44.0650, category: 'Hotel', icon: '🏨' },
    { id: 'place_inaxaar', name: 'Ina Naxar Street', lat: 9.5645, lng: 44.0690, category: 'Street', icon: '📍' },
    { id: 'place_maxamuud', name: 'Maxamuud Haybe Area', lat: 9.5480, lng: 44.0720, category: 'District', icon: '📍' },
    { id: 'place_koodbuur', name: 'Ibrahim Koodbuur District', lat: 9.5750, lng: 44.0620, category: 'District', icon: '📍' },
  ], []);

  // Compute screen coordinates for visible Hargeisa city places
  const visibleCityPlaces = useMemo(() => {
    return HARGEISA_NOTABLE_PLACES.map((p) => {
      const pt = toScreenCoord(p.lat, p.lng);
      return { ...p, x: pt.x, y: pt.y };
    }).filter((p) => p.x >= -60 && p.x <= dimensions.width + 60 && p.y >= -60 && p.y <= dimensions.height + 60);
  }, [HARGEISA_NOTABLE_PLACES, toScreenCoord, dimensions.width, dimensions.height]);

  const fallbackGoogleTiles = useMemo(() => {
    const list: Array<{ x: number; y: number; left: number; top: number; key: string; url: string; fallbackUrl: string }> = [];
    const minX = Math.max(0, Math.min(minTile.x, maxTile.x) - 1);
    const maxX = Math.max(minTile.x, maxTile.x) + 1;
    const minY = Math.max(0, Math.min(minTile.y, maxTile.y) - 1);
    const maxY = Math.max(minTile.y, maxTile.y) + 1;

    const subdomains = ['a', 'b', 'c', 'd'];

    for (let tx = minX; tx <= maxX; tx++) {
      for (let ty = minY; ty <= maxY; ty++) {
        const tilePixelX = tx * 256;
        const tilePixelY = ty * 256;
        const screenX = tilePixelX - centerPixel.x + dimensions.width / 2;
        const screenY = tilePixelY - centerPixel.y + dimensions.height / 2;

        const sub = subdomains[Math.abs(tx + ty) % subdomains.length];
        let url = `https://${sub}.basemaps.cartocdn.com/rastertiles/voyager/${zoom}/${tx}/${ty}.png`;
        if (mapLayer === 'satellite') {
          url = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${zoom}/${ty}/${tx}`;
        } else if (mapLayer === 'dark') {
          url = `https://${sub}.basemaps.cartocdn.com/dark_all/${zoom}/${tx}/${ty}.png`;
        }

        const fallbackUrl = `https://tile.openstreetmap.org/${zoom}/${tx}/${ty}.png`;

        list.push({
          x: tx,
          y: ty,
          left: screenX,
          top: screenY,
          key: `map_${mapLayer}_${zoom}_${tx}_${ty}`,
          url,
          fallbackUrl,
        });
      }
    }
    return list;
  }, [zoom, minTile, maxTile, centerPixel, dimensions, mapLayer]);

  // Touch and Mouse fallback interaction
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isSdkLoaded) return;
    isDraggingRef.current = true;
    hasMovedRef.current = false;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    centerStartRef.current = { ...center };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isSdkLoaded || !isDraggingRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) hasMovedRef.current = true;

    const centerP = latLngToPixel(centerStartRef.current.lat, centerStartRef.current.lng, zoom);
    const newPixel = { x: centerP.x - dx, y: centerP.y - dy };
    const newLatLng = pixelToLatLng(newPixel.x, newPixel.y, zoom);
    setCenter(newLatLng);
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (isSdkLoaded) return;
    if (!hasMovedRef.current && isDraggingRef.current && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      const centerP = latLngToPixel(center.lat, center.lng, zoom);
      const targetPixel = {
        x: centerP.x + (clickX - dimensions.width / 2),
        y: centerP.y + (clickY - dimensions.height / 2),
      };
      const clickedLatLng = pixelToLatLng(targetPixel.x, targetPixel.y, zoom);
      handleLocationSelect(clickedLatLng.lat, clickedLatLng.lng);
    }
    isDraggingRef.current = false;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isSdkLoaded || e.touches.length !== 1) return;
    const touch = e.touches[0];
    isDraggingRef.current = true;
    hasMovedRef.current = false;
    dragStartRef.current = { x: touch.clientX, y: touch.clientY };
    centerStartRef.current = { ...center };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isSdkLoaded || !isDraggingRef.current || e.touches.length !== 1) return;
    const touch = e.touches[0];
    const dx = touch.clientX - dragStartRef.current.x;
    const dy = touch.clientY - dragStartRef.current.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) hasMovedRef.current = true;

    const centerP = latLngToPixel(centerStartRef.current.lat, centerStartRef.current.lng, zoom);
    const newPixel = { x: centerP.x - dx, y: centerP.y - dy };
    const newLatLng = pixelToLatLng(newPixel.x, newPixel.y, zoom);
    setCenter(newLatLng);
  };

  const handleTouchEnd = () => {
    if (isSdkLoaded) return;
    isDraggingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (isSdkLoaded) return;
    e.preventDefault();
    if (e.deltaY < 0) {
      setZoom((z) => Math.min(19, z + 1));
    } else if (e.deltaY > 0) {
      setZoom((z) => Math.max(10, z - 1));
    }
  };

  // Nearby drivers to render on map (filtered within viewport and deduplicated by id)
  const visibleDrivers = useMemo(() => {
    const list = (drivers || []).filter((d) => {
      const lat = d.currentLocation?.lat ?? (d as any).lat;
      const lng = d.currentLocation?.lng ?? (d as any).lng;
      if (!lat || !lng) return false;
      return d.status !== 'offline';
    });
    const seen = new Set<string>();
    return list.filter((d) => {
      if (seen.has(d.id)) return false;
      seen.add(d.id);
      return true;
    });
  }, [drivers]);

  return (
    <div
      ref={containerRef}
      className="w-full relative overflow-hidden select-none font-sans"
      style={{
        height,
        backgroundColor: mapLayer === 'dark' ? '#111827' : mapLayer === 'satellite' ? '#0f172a' : '#e5e3df',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
    >
      {/* 1. Real Google Maps Native Container */}
      <div
        ref={mapDomRef}
        className="absolute inset-0 w-full h-full z-0"
        style={{ opacity: isSdkLoaded ? 1 : 0, transition: 'opacity 0.3s ease' }}
      />

      {/* 2. High-Clarity Slippy Raster Tiles (Hargeisa, Somaliland) */}
      {!isSdkLoaded && (
        <div className="absolute inset-0 pointer-events-none z-0">
          {fallbackGoogleTiles.map((t) => (
            <img
              key={t.key}
              src={t.url}
              alt="hargeisa-map-tile"
              loading="eager"
              onError={(e) => {
                if (t.fallbackUrl && e.currentTarget.src !== t.fallbackUrl) {
                  e.currentTarget.src = t.fallbackUrl;
                }
              }}
              className="absolute w-[256px] h-[256px] select-none pointer-events-none"
              style={{
                left: `${t.left}px`,
                top: `${t.top}px`,
              }}
            />
          ))}
        </div>
      )}

      {/* 3. Real SVG Route Corridor Layer */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
        <defs>
          <linearGradient id="routeGrad" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#0066F5" />
            <stop offset="100%" stopColor="#00A86B" />
          </linearGradient>
          <filter id="routeGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#0066F5" floodOpacity="0.35" />
          </filter>
        </defs>

        {/* Approach Route (Driver to Pickup) */}
        {approachSvgPath && (
          <path
            d={approachSvgPath}
            fill="none"
            stroke="#38bdf8"
            strokeWidth="4"
            strokeDasharray="6 6"
            strokeLinecap="round"
            className="animate-pulse"
          />
        )}

        {/* Trip Route Ribbon */}
        {smoothRoutePath && (
          <>
            <path
              d={smoothRoutePath}
              fill="none"
              stroke="#0066F5"
              strokeWidth="10"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#routeGlow)"
              opacity="0.4"
            />
            <path
              d={smoothRoutePath}
              fill="none"
              stroke="#0066F5"
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d={smoothRoutePath}
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="2"
              strokeDasharray="4 16"
              strokeLinecap="round"
              opacity="0.8"
            />
          </>
        )}
      </svg>

      {/* 4. Real Interactive Markers Layer (Drivers, Pickup, Destination, City Places) */}
      <div className="absolute inset-0 pointer-events-none z-20">
        {/* Prominent Hargeisa City Places & Landmarks */}
        {visibleCityPlaces.map((p) => (
          <div
            key={p.id}
            onClick={(e) => {
              e.stopPropagation();
              handleLocationSelect(p.lat, p.lng);
            }}
            className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto cursor-pointer group transition-all hover:scale-110 active:scale-95 z-20"
            style={{ left: `${p.x}px`, top: `${p.y}px` }}
            title={`${p.name} - Guji si aad u doorato goobtan`}
          >
            <div className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-white/95 dark:bg-slate-900/95 shadow-md border border-slate-200/90 dark:border-slate-700/90 backdrop-blur-xs text-[10px] font-bold text-slate-800 dark:text-slate-100 group-hover:bg-blue-50 group-hover:text-blue-700 group-hover:border-blue-300">
              <span className="text-xs">{p.icon}</span>
              <span className="truncate max-w-[120px]">{p.name.split(' (')[0]}</span>
            </div>
          </div>
        ))}

        {/* Nearby Active Wadaage Fleet Drivers in Hargeisa */}
        {visibleDrivers.map((driver, idx) => {
          const lat = driver.currentLocation?.lat ?? (driver as any).lat;
          const lng = driver.currentLocation?.lng ?? (driver as any).lng;
          if (!lat || !lng) return null;
          const pt = toScreenCoord(lat, lng);
          const isAssigned = currentRide?.assignedDriverId === driver.id;

          return (
            <div
              key={`drv_${driver.id}_${idx}`}
              className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-all duration-300 ease-out z-25"
              style={{ left: `${pt.x}px`, top: `${pt.y}px` }}
            >
              <RealisticVehicleMarker
                color={driver.vehicle?.color || (driver as any).carColor || 'White'}
                model={driver.vehicle?.model || (driver as any).carModel || 'Toyota Vitz'}
                licensePlate={driver.vehicle?.licensePlate || (driver as any).licensePlate || 'SL-Taxi'}
                driverName={driver.name}
                heading={driver.currentHeading || 0}
                isAssigned={isAssigned}
                showDetails={isAssigned}
                size={isAssigned ? 'md' : 'sm'}
              />
            </div>
          );
        })}

        {/* Rider Pickup Beacon */}
        {pickupLocation && (() => {
          const pt = toScreenCoord(pickupLocation.lat, pickupLocation.lng);
          return (
            <div
              className="absolute -translate-x-1/2 -translate-y-full pointer-events-none animate-in fade-in zoom-in-95 duration-200 z-30"
              style={{ left: `${pt.x}px`, top: `${pt.y}px` }}
            >
              <div className="relative flex flex-col items-center select-none pb-1">
                <div className="relative bg-[#0066F5] text-white text-[11px] font-extrabold px-3 py-1 rounded-xl shadow-xl whitespace-nowrap mb-1 border border-blue-400/40 after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-[4px] after:border-transparent after:border-t-[#0066F5]">
                  <span>📍 {pickupLocation.name || 'Pickup Point'}</span>
                </div>
                <div className="w-5 h-5 rounded-full bg-[#0066F5] border-2 border-white shadow-lg flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-white" />
                </div>
              </div>
            </div>
          );
        })()}

        {/* Rider Destination Beacon */}
        {dropoffLocation && (() => {
          const pt = toScreenCoord(dropoffLocation.lat, dropoffLocation.lng);
          return (
            <div
              className="absolute -translate-x-1/2 -translate-y-full pointer-events-none animate-in fade-in zoom-in-95 duration-200 z-30"
              style={{ left: `${pt.x}px`, top: `${pt.y}px` }}
            >
              <div className="relative flex flex-col items-center pb-1">
                <div className="px-3 py-1 bg-slate-900/95 border border-emerald-400 text-emerald-300 text-[11px] font-black rounded-xl shadow-xl mb-1 whitespace-nowrap">
                  <span>🏁 {dropoffLocation.name || 'Destination'}</span>
                </div>
                <div className="w-7 h-7 rounded-full bg-[#094757] border-2 border-[#00E575] flex items-center justify-center text-[#00E575] shadow-xl">
                  <MapPin className="w-4 h-4 fill-current" />
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* 5. Clean Modern Floating Map Controls */}
      <div className="absolute right-3.5 bottom-24 z-30 pointer-events-auto flex flex-col space-y-2">
        {/* Fit Bounds / Overview */}
        <button
          type="button"
          onClick={handleFitBounds}
          className="w-10 h-10 rounded-full bg-white/95 dark:bg-slate-900/95 text-slate-800 dark:text-slate-200 shadow-lg border border-slate-200 dark:border-slate-800 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95 transition cursor-pointer"
          title="Fit Route Bounds"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        {/* Center My GPS */}
        <button
          type="button"
          onClick={handleCenterGPS}
          disabled={isCenteringGPS}
          className="w-10 h-10 rounded-full bg-white/95 dark:bg-slate-900/95 text-blue-600 shadow-lg border border-slate-200 dark:border-slate-800 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95 transition cursor-pointer"
          title="Center on My GPS"
        >
          <Navigation className={`w-4 h-4 ${isCenteringGPS ? 'animate-spin' : ''}`} />
        </button>

        {/* Layer Selector */}
        <button
          type="button"
          onClick={() => {
            setMapLayer((prev) => (prev === 'roadmap' ? 'satellite' : prev === 'satellite' ? 'dark' : 'roadmap'));
          }}
          className="w-10 h-10 rounded-full bg-white/95 dark:bg-slate-900/95 text-slate-800 dark:text-slate-200 shadow-lg border border-slate-200 dark:border-slate-800 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95 transition cursor-pointer"
          title={`Layer: ${mapLayer}`}
        >
          <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        </button>

        {/* Zoom In & Out */}
        <div className="flex flex-col bg-white/95 dark:bg-slate-900/95 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(19, z + 1))}
            className="w-10 h-9 flex items-center justify-center text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 active:bg-slate-200 transition cursor-pointer border-b border-slate-200 dark:border-slate-800"
            title="Zoom In"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(10, z - 1))}
            className="w-10 h-9 flex items-center justify-center text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 active:bg-slate-200 transition cursor-pointer"
            title="Zoom Out"
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
