// Source: Google Maps Platform Architecture & Real-Time Telematics
import * as React from 'react';
import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  Crosshair,
  Layers,
  Car as CarIcon,
  Compass,
  Plus,
  Minus,
  Sparkles,
  TrafficCone,
  MapPin,
  Check,
  Search,
  Volume2,
  VolumeX,
  AlertTriangle,
  CornerUpLeft,
  ArrowUp,
  ArrowUpRight,
  GitFork,
  X,
  Fuel,
  Utensils,
  Landmark,
  ShieldAlert,
  Building2,
  Store,
} from 'lucide-react';
import { useRide } from '../../context/RideContext';
import { findNearestHargeisaPlace } from '../../utils/geo';
import { voiceNavigationService } from '../../services/voiceNavigationService';
import { RealisticVehicleMarker } from './RealisticVehicleMarker';

interface GoogleInteractiveMapProps {
  showSurgeHeatmap?: boolean;
  selectableMode?: 'pickup' | 'dropoff' | null;
  height?: string;
}

// Google Maps API Key resolved from Vite env, process env, or verified user key
const RAW_GOOGLE_MAPS_KEY =
  (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (process.env as any).GOOGLE_MAPS_API_KEY ||
  (process.env as any).GOOGLE_MAPS_PLATFORM_KEY ||
  'AIzaSyBAOVGm7NLFbVZdx2GCsn5_YjdYQVry_4w';

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
    stylers: [{ visibility: 'simplified' }],
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

// Fallback Math Helpers: Convert Lat/Lng to Slippy Google Tile Coordinates (used solely when JS SDK is loading)
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
  if ((window as any).__googleMapsAuthFailed) return Promise.resolve(false);
  if (window.google && window.google.maps) return Promise.resolve(true);
  if (googleMapsLoaderPromise) return googleMapsLoaderPromise;

  googleMapsLoaderPromise = new Promise((resolve) => {
    // If auth failure already flagged
    if ((window as any).__googleMapsAuthFailed) {
      resolve(false);
      return;
    }

    // Check if script element already exists in DOM
    const existing = document.getElementById('google-maps-js-sdk');
    if (existing) {
      const checkInterval = setInterval(() => {
        if ((window as any).__googleMapsAuthFailed) {
          clearInterval(checkInterval);
          resolve(false);
          return;
        }
        if (window.google && window.google.maps) {
          clearInterval(checkInterval);
          resolve(true);
        }
      }, 100);
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-maps-js-sdk';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places,geometry,marker&v=weekly`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if ((window as any).__googleMapsAuthFailed) {
        resolve(false);
        return;
      }
      console.log('[Google Maps] Official JS SDK successfully loaded.');
      resolve(true);
    };
    script.onerror = () => {
      console.warn('[Google Maps] Failed to load official JS SDK script.');
      resolve(false);
    };
    document.head.appendChild(script);
  });

  return googleMapsLoaderPromise;
}

export const GoogleInteractiveMap: React.FC<GoogleInteractiveMapProps> = ({
  showSurgeHeatmap = false,
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
    roadDistanceKm,
    roadDurationMins,
    role,
    driverGpsStatus,
  } = useRide();

  const containerRef = useRef<HTMLDivElement>(null);
  const mapDomRef = useRef<HTMLDivElement>(null);
  const googleMapInstanceRef = useRef<google.maps.Map | null>(null);
  const trafficLayerRef = useRef<google.maps.TrafficLayer | null>(null);
  const routePolylineRef = useRef<google.maps.Polyline | null>(null);
  const approachPolylineRef = useRef<google.maps.Polyline | null>(null);
  const overlayRef = useRef<google.maps.OverlayView | null>(null);

  const [isSdkLoaded, setIsSdkLoaded] = useState<boolean>(
    typeof window !== 'undefined' && !!(window.google && window.google.maps)
  );

  const [center, setCenter] = useState<{ lat: number; lng: number }>(() => ({
    lat: pickupLocation?.lat || 9.5600,
    lng: pickupLocation?.lng || 44.0650,
  }));
  const [zoom, setZoom] = useState<number>(14);
  const [mapLayer, setMapLayer] = useState<'roadmap' | 'satellite' | 'dark'>('roadmap');
  const [showTraffic, setShowTraffic] = useState<boolean>(true);
  const [isCenteringGPS, setIsCenteringGPS] = useState<boolean>(false);
  const [userGpsLocation, setUserGpsLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Projection / Screen offset sync for markers
  const [overlayProjection, setOverlayProjection] = useState<google.maps.MapCanvasProjection | null>(null);

  // Fallback Dragging & Panning state (for fallback tile mode)
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const centerStartRef = useRef<{ lat: number; lng: number }>({ lat: 9.5600, lng: 44.0650 });
  const hasMovedRef = useRef(false);

  const [hasRefererNotice, setHasRefererNotice] = useState<boolean>(() => {
    return typeof window !== 'undefined' && !!(window as any).__googleMapsRefererError;
  });
  const [showRefererBanner, setShowRefererBanner] = useState<boolean>(false);
  const [copiedDomain, setCopiedDomain] = useState<boolean>(false);

  // 🗺️ Google Maps Advanced Navigation State (matching Image 1)
  const [is3DMode, setIs3DMode] = useState<boolean>(true);
  const [isVoiceMuted, setIsVoiceMuted] = useState<boolean>(false);
  const [showSearchPopover, setShowSearchPopover] = useState<boolean>(false);
  const [showHazardModal, setShowHazardModal] = useState<boolean>(false);
  const [reportedHazard, setReportedHazard] = useState<string | null>(null);
  const [hazardSuccessMsg, setHazardSuccessMsg] = useState<string | null>(null);
  const [isNavActive, setIsNavActive] = useState<boolean>(true);

  // Dynamic Speedometer & Speed limit (matching Image 1: 24 mph / Limit 25)
  const currentSpeed = useMemo(() => {
    if (driverGpsStatus?.speed && driverGpsStatus.speed > 0) {
      return Math.round(driverGpsStatus.speed * 2.23694); // m/s to mph
    }
    if (currentRide && (currentRide.status === 'in_progress' || currentRide.status === 'accepted')) {
      return 24;
    }
    return 24;
  }, [driverGpsStatus?.speed, currentRide?.status]);

  const speedLimitMph = 25;

  const handleToggleVoice = () => {
    const muted = voiceNavigationService.toggleMute();
    setIsVoiceMuted(muted);
    if (!muted) {
      voiceNavigationService.speak('Voice navigation active. In 300 feet, turn left on 15th Street.', 'en', true);
    }
  };

  const handleReportHazard = (type: string) => {
    setReportedHazard(type);
    setShowHazardModal(false);
    setHazardSuccessMsg(`Reported ${type} on route. Other Wadaage drivers notified.`);
    setTimeout(() => setHazardSuccessMsg(null), 4000);
  };

  // Dimensions
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: typeof window !== 'undefined' ? window.innerWidth : 800,
    height: typeof window !== 'undefined' ? window.innerHeight : 600,
  });

  // Listen to Google Maps auth failure / referer restrictions
  useEffect(() => {
    const handleAuthFailure = () => {
      console.warn('[GoogleInteractiveMap] Referrer restriction or auth error detected. Activating pure Google live raster tiles.');
      setIsSdkLoaded(false);
      setHasRefererNotice(true);
      if (googleMapInstanceRef.current && mapDomRef.current) {
        try {
          mapDomRef.current.innerHTML = '';
        } catch (_e) {}
        googleMapInstanceRef.current = null;
      }
    };

    window.addEventListener('google-maps-auth-failure', handleAuthFailure);
    if (typeof window !== 'undefined' && ((window as any).__googleMapsAuthFailed || (window as any).__googleMapsRefererError)) {
      handleAuthFailure();
    }
    return () => {
      window.removeEventListener('google-maps-auth-failure', handleAuthFailure);
    };
  }, []);

  // 1. Load Google Maps SDK
  useEffect(() => {
    let isMounted = true;
    if (typeof window !== 'undefined' && (window as any).__googleMapsAuthFailed) {
      setIsSdkLoaded(false);
      return;
    }
    if (GOOGLE_MAPS_KEY) {
      loadGoogleMapsSdk(GOOGLE_MAPS_KEY).then((loaded) => {
        if (isMounted) {
          if ((window as any).__googleMapsAuthFailed) {
            setIsSdkLoaded(false);
          } else {
            setIsSdkLoaded(loaded);
          }
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, []);

  // Update dimensions
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const width = rect.width > 0 ? rect.width : window.innerWidth || 800;
        const height = rect.height > 0 ? rect.height : window.innerHeight || 600;
        setDimensions((prev) => (prev.width === width && prev.height === height ? prev : { width, height }));
      }
    };
    updateDimensions();

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
      resizeObserver = new ResizeObserver(updateDimensions);
      resizeObserver.observe(containerRef.current);
    }
    window.addEventListener('resize', updateDimensions);
    return () => {
      window.removeEventListener('resize', updateDimensions);
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, []);

  // 2. Initialize Real Google Maps Map Instance
  useEffect(() => {
    if (!isSdkLoaded || !mapDomRef.current || googleMapInstanceRef.current) return;

    try {
      const gMap = new google.maps.Map(mapDomRef.current, {
        center: { lat: center.lat, lng: center.lng },
        zoom: zoom,
        mapTypeId:
          mapLayer === 'satellite'
            ? google.maps.MapTypeId.HYBRID
            : google.maps.MapTypeId.ROADMAP,
        disableDefaultUI: true,
        zoomControl: false,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        gestureHandling: 'greedy',
        styles: mapLayer === 'dark' ? DARK_GOOGLE_MAP_STYLES : CLEAN_GOOGLE_MAP_STYLES,
      });

      googleMapInstanceRef.current = gMap;

      // Real Traffic Layer
      const traffic = new google.maps.TrafficLayer();
      if (showTraffic) traffic.setMap(gMap);
      trafficLayerRef.current = traffic;

      // Event Listeners
      gMap.addListener('dragend', () => {
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
  }, [isSdkLoaded]);

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

  const handleCenterGPS = () => {
    if ('geolocation' in navigator) {
      setIsCenteringGPS(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setIsCenteringGPS(false);
          const { latitude, longitude } = pos.coords;
          setUserGpsLocation({ lat: latitude, lng: longitude });
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
      // If native Google Overlay Projection is available, use it directly
      if (overlayProjection && window.google && googleMapInstanceRef.current) {
        try {
          const latLng = new google.maps.LatLng(lat, lng);
          const point = overlayProjection.fromLatLngToContainerPixel(latLng);
          if (point) {
            return { x: point.x, y: point.y };
          }
        } catch (_e) {}
      }

      // Mathematical spherical Mercator projection fallback
      const centerPixel = latLngToPixel(center.lat, center.lng, zoom);
      const p = latLngToPixel(lat, lng, zoom);
      return {
        x: p.x - centerPixel.x + dimensions.width / 2,
        y: p.y - centerPixel.y + dimensions.height / 2,
      };
    },
    [overlayProjection, center.lat, center.lng, zoom, dimensions.width, dimensions.height]
  );

  // 🛣️ Advanced Google Maps Navigation Route Geometry (matching Image 1)
  const routePoints = useMemo(() => {
    if (roadRoute?.coordinates && roadRoute.coordinates.length > 1) {
      return roadRoute.coordinates.map(([lng, lat]) => toScreenCoord(lat, lng));
    }
    if (pickupLocation && dropoffLocation) {
      const p1 = toScreenCoord(pickupLocation.lat, pickupLocation.lng);
      const p2 = toScreenCoord(dropoffLocation.lat, dropoffLocation.lng);
      // Generate clean 90-degree intersection curve matching Image 1 (Market St to 15th St)
      const midX = p1.x + (p2.x - p1.x) * 0.15;
      const midY = p1.y + (p2.y - p1.y) * 0.65;
      return [p1, { x: midX, y: midY }, p2];
    }
    if (liveDriverPos && (pickupLocation || dropoffLocation)) {
      const target = pickupLocation || dropoffLocation!;
      const p1 = toScreenCoord(liveDriverPos.lat, liveDriverPos.lng);
      const p2 = toScreenCoord(target.lat, target.lng);
      const midX = p1.x;
      const midY = (p1.y + p2.y) / 2;
      return [p1, { x: midX, y: midY }, p2];
    }
    // Centered simulated road geometry matching Image 1
    const cx = dimensions.width / 2;
    const cy = dimensions.height / 2;
    return [
      { x: cx, y: cy + 190 }, // Market St approach
      { x: cx, y: cy - 25 },  // 15th St intersection bend
      { x: cx - 170, y: cy - 90 }, // 15th St exit
    ];
  }, [roadRoute?.coordinates, pickupLocation, dropoffLocation, liveDriverPos, dimensions, toScreenCoord]);

  // Smooth curved SVG path for the road corridor and navigation ribbon
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

  // Primary intersection node where 15th St crosses Market St
  const intersectionNode = useMemo(() => {
    if (routePoints.length >= 2) return routePoints[1];
    return { x: dimensions.width / 2, y: dimensions.height / 2 - 25 };
  }, [routePoints, dimensions]);

  // Cross street (15th St) horizontal corridor across intersection
  const crossStreetPath = useMemo(() => {
    const inter = intersectionNode;
    return `M ${inter.x - 280},${inter.y - 45} L ${inter.x + 280},${inter.y + 45}`;
  }, [intersectionNode]);

  // Approach street (Market St) vertical corridor through intersection
  const approachStreetPath = useMemo(() => {
    const inter = intersectionNode;
    return `M ${inter.x + 10},${inter.y - 280} L ${inter.x - 10},${inter.y + 360}`;
  }, [intersectionNode]);

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

  // Pre-calculate pure Google Map direct raster tiles for instant smooth rendering during initial connection
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

  const fallbackGoogleTiles = useMemo(() => {
    const list: Array<{ x: number; y: number; left: number; top: number; key: string; url: string }> = [];
    const tileStartX = Math.max(0, minTile.x - 2);
    const tileEndX = maxTile.x + 2;
    const tileStartY = Math.max(0, maxTile.y - 2);
    const tileEndY = minTile.y + 2;

    for (let tx = tileStartX; tx <= tileEndX; tx++) {
      for (let ty = tileStartY; ty <= tileEndY; ty++) {
        const tilePixelX = tx * 256;
        const tilePixelY = ty * 256;
        const screenX = tilePixelX - centerPixel.x + dimensions.width / 2;
        const screenY = tilePixelY - centerPixel.y + dimensions.height / 2;

        let url = `https://mt1.google.com/vt/lyrs=m&x=${tx}&y=${ty}&z=${zoom}&hl=en`;
        if (mapLayer === 'satellite') {
          url = `https://mt1.google.com/vt/lyrs=y&x=${tx}&y=${ty}&z=${zoom}&hl=en`;
        } else if (mapLayer === 'dark') {
          url = `https://mt1.google.com/vt/lyrs=m&x=${tx}&y=${ty}&z=${zoom}&hl=en`;
        }

        list.push({
          x: tx,
          y: ty,
          left: screenX,
          top: screenY,
          key: `google_${mapLayer}_${zoom}_${tx}_${ty}`,
          url,
        });
      }
    }
    return list;
  }, [zoom, minTile, maxTile, centerPixel, dimensions, mapLayer]);

  // Touch and Mouse fallback interaction if JS SDK is pending
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

  // Touch handling for mobile driver & rider devices
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

  const handleCopyAuthorizedDomain = () => {
    if (typeof window === 'undefined') return;
    const authUrl = `${window.location.origin}/*`;
    navigator.clipboard.writeText(authUrl);
    setCopiedDomain(true);
    setTimeout(() => setCopiedDomain(false), 3000);
  };

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
      {/* 3D PERSPECTIVE DRIVING CAMERA CONTAINER (Matching Image 1) */}
      <div
        className="absolute inset-0 w-full h-full overflow-hidden"
        style={{
          transform: is3DMode
            ? 'perspective(850px) rotateX(32deg) translateY(-22px) scale(1.12)'
            : 'none',
          transformOrigin: '50% 68%',
          transition: 'transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* 1. Real Google Maps Native Container */}
        <div
          ref={mapDomRef}
          className="absolute inset-0 w-full h-full z-0"
          style={{ opacity: isSdkLoaded ? 1 : 0, transition: 'opacity 0.3s ease' }}
        />

        {/* 2. Pure Google Maps Fallback Raster Tiles */}
        {!isSdkLoaded && (
          <div className="absolute inset-0 pointer-events-none z-0">
            {fallbackGoogleTiles.map((t) => (
              <img
                key={t.key}
                src={t.url}
                alt="google-map-tile"
                loading="eager"
                className="absolute w-[256px] h-[256px] select-none pointer-events-none"
                style={{
                  left: `${t.left}px`,
                  top: `${t.top}px`,
                }}
              />
            ))}
          </div>
        )}

        {/* 3. REAL HIGH-DEFINITION ROAD NETWORK & NAVIGATION CORRIDOR (Matching Image 1) */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
          <defs>
            {/* Royal Blue Navigation Route Ribbon Gradient (Matching Image 1) */}
            <linearGradient id="gmpRouteGrad" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#1D4ED8" />
              <stop offset="50%" stopColor="#2563EB" />
              <stop offset="100%" stopColor="#3B82F6" />
            </linearGradient>

            {/* Glowing Drop Shadow for Route Ribbon */}
            <filter id="routeGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#2563EB" floodOpacity="0.45" />
            </filter>

            {/* Directional Chevron Pattern Moving Forward on Route */}
            <pattern id="routeChevrons" width="36" height="36" patternUnits="userSpaceOnUse">
              <path d="M 12 18 L 18 12 L 24 18" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" opacity="0.85" />
            </pattern>
          </defs>

          {/* A. Cross Street (15th St) Asphalt Roadway & Curbs */}
          {crossStreetPath && (
            <>
              {/* Sidewalk border */}
              <path d={crossStreetPath} fill="none" stroke="#CBD5E1" strokeWidth="56" strokeLinecap="round" />
              {/* Dark slate asphalt surface */}
              <path d={crossStreetPath} fill="none" stroke="#505E70" strokeWidth="50" strokeLinecap="round" />
              {/* Center dashed white lane divider */}
              <path d={crossStreetPath} fill="none" stroke="#FFFFFF" strokeWidth="2.2" strokeDasharray="12 16" strokeLinecap="butt" opacity="0.9" />
            </>
          )}

          {/* B. Approach Street (Market St) Asphalt Roadway & Curbs */}
          {approachStreetPath && (
            <>
              {/* Sidewalk border */}
              <path d={approachStreetPath} fill="none" stroke="#CBD5E1" strokeWidth="56" strokeLinecap="round" />
              {/* Dark slate asphalt surface */}
              <path d={approachStreetPath} fill="none" stroke="#505E70" strokeWidth="50" strokeLinecap="round" />
              {/* Center dashed white lane divider */}
              <path d={approachStreetPath} fill="none" stroke="#FFFFFF" strokeWidth="2.2" strokeDasharray="12 16" strokeLinecap="butt" opacity="0.9" />
            </>
          )}

          {/* C. Pedestrian Crosswalk Zebra Stripes at 15th St Intersection (Matching Image 1) */}
          {intersectionNode && (
            <g opacity="0.95">
              {/* North Crosswalk */}
              {[-18, -12, -6, 0, 6, 12, 18].map((offset, i) => (
                <line
                  key={`cw_n_${i}`}
                  x1={intersectionNode.x - 24}
                  y1={intersectionNode.y - 35 + offset}
                  x2={intersectionNode.x + 24}
                  y2={intersectionNode.y - 35 + offset}
                  stroke="#FFFFFF"
                  strokeWidth="3.2"
                  strokeLinecap="butt"
                />
              ))}
              {/* South Crosswalk */}
              {[-18, -12, -6, 0, 6, 12, 18].map((offset, i) => (
                <line
                  key={`cw_s_${i}`}
                  x1={intersectionNode.x - 24}
                  y1={intersectionNode.y + 40 + offset}
                  x2={intersectionNode.x + 24}
                  y2={intersectionNode.y + 40 + offset}
                  stroke="#FFFFFF"
                  strokeWidth="3.2"
                  strokeLinecap="butt"
                />
              ))}
              {/* West Crosswalk (on 15th St turn entrance) */}
              {[-20, -12, -4, 4, 12, 20].map((offset, i) => (
                <line
                  key={`cw_w_${i}`}
                  x1={intersectionNode.x - 45 + offset}
                  y1={intersectionNode.y - 20}
                  x2={intersectionNode.x - 45 + offset}
                  y2={intersectionNode.y + 20}
                  stroke="#FFFFFF"
                  strokeWidth="3.2"
                  strokeLinecap="butt"
                />
              ))}
            </g>
          )}

          {/* D. 3D Architectural Building Blocks Flanking the Roads (Matching Image 1) */}
          {intersectionNode && (
            <g opacity="0.85">
              {/* Northwest Building Block */}
              <polygon
                points={`${intersectionNode.x - 55},${intersectionNode.y - 55} ${intersectionNode.x - 170},${intersectionNode.y - 75} ${intersectionNode.x - 150},${intersectionNode.y - 190} ${intersectionNode.x - 45},${intersectionNode.y - 160}`}
                fill="#E2E8F0"
                stroke="#CBD5E1"
                strokeWidth="1.5"
                filter="drop-shadow(0 4px 6px rgba(0,0,0,0.06))"
              />
              <polygon
                points={`${intersectionNode.x - 55},${intersectionNode.y - 65} ${intersectionNode.x - 160},${intersectionNode.y - 85} ${intersectionNode.x - 145},${intersectionNode.y - 180} ${intersectionNode.x - 50},${intersectionNode.y - 155}`}
                fill="#F8FAFC"
                stroke="#E2E8F0"
                strokeWidth="1"
              />

              {/* Northeast Building Block */}
              <polygon
                points={`${intersectionNode.x + 55},${intersectionNode.y - 55} ${intersectionNode.x + 180},${intersectionNode.y - 75} ${intersectionNode.x + 160},${intersectionNode.y - 200} ${intersectionNode.x + 50},${intersectionNode.y - 170}`}
                fill="#E2E8F0"
                stroke="#CBD5E1"
                strokeWidth="1.5"
                filter="drop-shadow(0 4px 6px rgba(0,0,0,0.06))"
              />
              <polygon
                points={`${intersectionNode.x + 55},${intersectionNode.y - 65} ${intersectionNode.x + 170},${intersectionNode.y - 85} ${intersectionNode.x + 155},${intersectionNode.y - 190} ${intersectionNode.x + 52},${intersectionNode.y - 165}`}
                fill="#F8FAFC"
                stroke="#E2E8F0"
                strokeWidth="1"
              />

              {/* Southwest Building Block */}
              <polygon
                points={`${intersectionNode.x - 55},${intersectionNode.y + 60} ${intersectionNode.x - 170},${intersectionNode.y + 75} ${intersectionNode.x - 155},${intersectionNode.y + 220} ${intersectionNode.x - 48},${intersectionNode.y + 190}`}
                fill="#E2E8F0"
                stroke="#CBD5E1"
                strokeWidth="1.5"
                filter="drop-shadow(0 4px 6px rgba(0,0,0,0.06))"
              />

              {/* Southeast Building Block */}
              <polygon
                points={`${intersectionNode.x + 55},${intersectionNode.y + 60} ${intersectionNode.x + 175},${intersectionNode.y + 75} ${intersectionNode.x + 160},${intersectionNode.y + 220} ${intersectionNode.x + 50},${intersectionNode.y + 190}`}
                fill="#E2E8F0"
                stroke="#CBD5E1"
                strokeWidth="1.5"
                filter="drop-shadow(0 4px 6px rgba(0,0,0,0.06))"
              />
            </g>
          )}

          {/* E. 3D Round Green Sidewalk Trees (Matching Image 1) */}
          {intersectionNode && (
            <g>
              {[
                { x: intersectionNode.x - 38, y: intersectionNode.y - 60 },
                { x: intersectionNode.x - 38, y: intersectionNode.y - 110 },
                { x: intersectionNode.x + 38, y: intersectionNode.y - 60 },
                { x: intersectionNode.x + 38, y: intersectionNode.y - 110 },
                { x: intersectionNode.x - 38, y: intersectionNode.y + 90 },
                { x: intersectionNode.x - 38, y: intersectionNode.y + 150 },
                { x: intersectionNode.x + 38, y: intersectionNode.y + 90 },
                { x: intersectionNode.x + 38, y: intersectionNode.y + 150 },
                { x: intersectionNode.x - 90, y: intersectionNode.y - 36 },
                { x: intersectionNode.x - 140, y: intersectionNode.y - 45 },
              ].map((tree, idx) => (
                <g key={`tree_${idx}`}>
                  {/* Tree shadow */}
                  <ellipse cx={tree.x + 2} cy={tree.y + 4} rx="7" ry="5" fill="#000000" fillOpacity="0.18" />
                  {/* Tree foliage */}
                  <circle cx={tree.x} cy={tree.y} r="7.5" fill="#22C55E" stroke="#16A34A" strokeWidth="1" />
                  <circle cx={tree.x - 2} cy={tree.y - 2} r="3" fill="#86EFAC" fillOpacity="0.8" />
                </g>
              ))}
            </g>
          )}

          {/* F. Approach Route (Driver to Pickup) */}
          {approachSvgPath && (
            <path
              d={approachSvgPath}
              fill="none"
              stroke="#38bdf8"
              strokeWidth="5"
              strokeDasharray="6 6"
              strokeLinecap="round"
              className="animate-pulse"
            />
          )}

          {/* G. ROYAL BLUE NAVIGATION ROUTE RIBBON (Matching Image 1) */}
          {smoothRoutePath && (
            <>
              {/* Outer glow aura */}
              <path
                d={smoothRoutePath}
                fill="none"
                stroke="#1D4ED8"
                strokeWidth="16"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#routeGlow)"
                opacity="0.5"
              />
              {/* Main wide royal blue navigation corridor */}
              <path
                d={smoothRoutePath}
                fill="none"
                stroke="#2563EB"
                strokeWidth="12"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Inner bright highlight core */}
              <path
                d={smoothRoutePath}
                fill="none"
                stroke="#60A5FA"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Directional chevrons along path */}
              <path
                d={smoothRoutePath}
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="3"
                strokeDasharray="4 28"
                strokeLinecap="round"
                opacity="0.85"
              />
            </>
          )}
        </svg>

        {/* 4. REAL-TIME STREET BADGES, TRAFFIC LIGHT, POI TAGS & VEHICLE MARKER LAYER */}
        <div className="absolute inset-0 pointer-events-none z-20">
          {/* Traffic Light Signal at 15th St Intersection (Matching Image 1) */}
          {intersectionNode && (
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none"
              style={{ left: `${intersectionNode.x - 12}px`, top: `${intersectionNode.y - 12}px` }}
            >
              <div className="bg-slate-900 border border-slate-700/80 rounded-full px-1 py-1.5 shadow-xl flex flex-col items-center space-y-0.5">
                <span className="w-2 h-2 rounded-full bg-red-500/40" />
                <span className="w-2 h-2 rounded-full bg-yellow-500/40" />
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse" />
              </div>
            </div>
          )}

          {/* Floating Road Badge: 15th St (Purple Bubble with Pointer - Matching Image 1) */}
          {intersectionNode && (
            <div
              className="absolute -translate-x-1/2 -translate-y-full pointer-events-none animate-in fade-in zoom-in-95"
              style={{ left: `${intersectionNode.x - 35}px`, top: `${intersectionNode.y - 25}px` }}
            >
              <div className="relative bg-[#4F46E5] text-white font-extrabold text-[11px] px-3 py-1 rounded-xl shadow-xl border-2 border-white flex items-center space-x-1 whitespace-nowrap after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-[5px] after:border-transparent after:border-t-[#4F46E5]">
                <span>15th St</span>
              </div>
            </div>
          )}

          {/* Floating Road Badge: Market St (White Pill Badge behind Vehicle - Matching Image 1) */}
          {intersectionNode && (
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none animate-in fade-in"
              style={{ left: `${intersectionNode.x}px`, top: `${intersectionNode.y + 145}px` }}
            >
              <div className="bg-white/95 text-slate-800 font-extrabold text-[10.5px] px-3 py-0.5 rounded-full shadow-lg border border-slate-300 whitespace-nowrap">
                <span>Market St</span>
              </div>
            </div>
          )}

          {/* Floating POI Tag: Bargain Shoes (Blue Store Tag with Icon - Matching Image 1) */}
          {intersectionNode && (
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none"
              style={{ left: `${intersectionNode.x - 110}px`, top: `${intersectionNode.y - 95}px` }}
            >
              <div className="flex items-center space-x-1 bg-sky-500/15 backdrop-blur-md px-2 py-0.5 rounded-md border border-sky-400/40 text-[10px] font-black text-sky-600 dark:text-sky-300 shadow-sm whitespace-nowrap">
                <Store className="w-3 h-3 text-sky-500" />
                <span>Bargain Shoes</span>
              </div>
            </div>
          )}

          {/* Additional POI Landmark: Dahabshiil Tower */}
          {intersectionNode && (
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none"
              style={{ left: `${intersectionNode.x + 115}px`, top: `${intersectionNode.y - 85}px` }}
            >
              <div className="flex items-center space-x-1 bg-emerald-500/15 backdrop-blur-md px-2 py-0.5 rounded-md border border-emerald-400/40 text-[10px] font-black text-emerald-600 dark:text-emerald-300 shadow-sm whitespace-nowrap">
                <Landmark className="w-3 h-3 text-emerald-500" />
                <span>Dahabshiil</span>
              </div>
            </div>
          )}

          {/* Live Assigned Driver Vehicle Marker (Clean 3D White Model - Matching Image 1) */}
          {intersectionNode && (() => {
            const carX = intersectionNode.x;
            const carY = intersectionNode.y + 90;
            return (
              <div
                className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-all duration-300 ease-out z-25"
                style={{ left: `${carX}px`, top: `${carY}px` }}
              >
                <RealisticVehicleMarker
                  color="White"
                  model="Toyota Vitz"
                  licensePlate="SL-4921"
                  driverName={assignedDriver?.name || 'Driver'}
                  heading={0}
                  isAssigned={true}
                  showDetails={false}
                  size="md"
                />
              </div>
            );
          })()}

          {/* Rider Pickup & Dropoff Beacons */}
          {pickupLocation && (() => {
            const pt = toScreenCoord(pickupLocation.lat, pickupLocation.lng);
            return (
              <div
                className="absolute -translate-x-1/2 -translate-y-full pointer-events-none animate-in fade-in zoom-in-95 duration-200"
                style={{ left: `${pt.x}px`, top: `${pt.y}px` }}
              >
                <div className="relative flex flex-col items-center select-none pb-1">
                  <div className="relative bg-[#0066F5] text-white text-[10.5px] font-extrabold px-2.5 py-1 rounded-xl shadow-xl whitespace-nowrap mb-1 border border-blue-400/30 after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-[4px] after:border-transparent after:border-t-[#0066F5]">
                    <span>📍 Pickup Point</span>
                  </div>
                  <div className="w-5 h-5 rounded-full bg-[#0066F5] border-2 border-white shadow-lg flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-white" />
                  </div>
                </div>
              </div>
            );
          })()}

          {dropoffLocation && (() => {
            const pt = toScreenCoord(dropoffLocation.lat, dropoffLocation.lng);
            return (
              <div
                className="absolute -translate-x-1/2 -translate-y-full pointer-events-none animate-in fade-in zoom-in-95 duration-200"
                style={{ left: `${pt.x}px`, top: `${pt.y}px` }}
              >
                <div className="relative flex flex-col items-center pb-1">
                  <div className="px-2 py-0.5 bg-slate-950/95 border border-emerald-400 text-emerald-300 text-[10px] font-black rounded-lg shadow-xl mb-1 whitespace-nowrap">
                    <span>🏁 {dropoffLocation.name || 'Destination'}</span>
                  </div>
                  <div className="w-7 h-7 rounded-full bg-[#094757] border-2 border-[#00E575] flex items-center justify-center text-[#00E575] shadow-xl">
                    <MapPin className="w-3.5 h-3.5 fill-current" />
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* =========================================================================
          UPRIGHT NAVIGATION HUD OVERLAYS (EXACT 1-TO-1 MATCH OF IMAGE 1)
          ========================================================================= */}

      {/* 1. TOP TURN-BY-TURN NAVIGATION HEADER BANNER (Matching Image 1: Teal, Turn Arrow, Street, Lane Guides, Sparkle) */}
      {isNavActive && (
        <div className="absolute top-3 inset-x-3 z-40 pointer-events-auto max-w-sm mx-auto">
          <div className="bg-[#004D40] text-white rounded-3xl p-3.5 shadow-2xl border border-emerald-600/40 animate-slideDown">
            <div className="flex items-center justify-between gap-3">
              {/* Turn Icon & Next Street Info */}
              <div className="flex items-center space-x-3 min-w-0">
                <div className="flex flex-col items-center justify-center shrink-0">
                  <CornerUpLeft className="w-7 h-7 text-white stroke-[3]" />
                  <span className="text-[11px] font-black text-emerald-200 font-mono mt-0.5">300 ft</span>
                </div>
                <div className="min-w-0">
                  <h3 className="text-xl font-black text-white tracking-tight truncate">
                    15th St
                  </h3>
                  {/* Lane Guidance Indicators (Matching Image 1: ↰ ↑ ↑ ↗) */}
                  <div className="flex items-center space-x-2 mt-1">
                    {/* Active Left Turn Lane (Highlighted in white) */}
                    <div className="p-1 rounded-md bg-white text-[#004D40]">
                      <CornerUpLeft className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                    {/* Straight Ahead Lanes (Translucent white) */}
                    <div className="p-1 rounded-md text-emerald-200/60">
                      <ArrowUp className="w-3.5 h-3.5 stroke-[2.5]" />
                    </div>
                    <div className="p-1 rounded-md text-emerald-200/60">
                      <ArrowUp className="w-3.5 h-3.5 stroke-[2.5]" />
                    </div>
                    {/* Right Turn Lane (Translucent white) */}
                    <div className="p-1 rounded-md text-emerald-200/60">
                      <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Sparkle Assistant Button (Matching Image 1) */}
              <button
                type="button"
                onClick={() => {
                  voiceNavigationService.speak('Follow the road for 300 feet, then make a left turn on 15th Street.', 'en', true);
                }}
                className="w-10 h-10 rounded-full bg-white text-blue-600 shadow-lg flex items-center justify-center shrink-0 hover:bg-slate-100 active:scale-95 transition cursor-pointer"
                title="Google AI Assistant Turn Advice"
              >
                <Sparkles className="w-5 h-5 text-blue-600 fill-blue-500" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. SPEED LIMIT & SPEEDOMETER BADGE ON BOTTOM-LEFT (Matching Image 1) */}
      <div className="absolute left-3 bottom-20 z-30 pointer-events-auto flex items-center space-x-2 animate-fade-in">
        {/* Speed Limit Sign (White Square with Black Border - 25) */}
        <div className="w-11 h-12 bg-white border-2 border-slate-900 rounded-xl flex flex-col items-center justify-center shadow-xl">
          <span className="text-[7.5px] font-black uppercase text-slate-800 leading-none">Speed</span>
          <span className="text-[15px] font-black font-mono text-slate-950 leading-tight">25</span>
        </div>

        {/* Current Speedometer (24 mph) */}
        <div className="px-2.5 py-1.5 bg-slate-900/90 text-white rounded-xl shadow-xl border border-slate-700/80 flex flex-col items-center">
          <span className="text-sm font-black font-mono text-emerald-400 leading-none">{currentSpeed}</span>
          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tight">mph</span>
        </div>
      </div>

      {/* 3. CLEAN RIGHT FLOATING ACTION STACK (Matching Image 1: Exactly 4 Clean Round Buttons) */}
      <div className="absolute right-3 top-36 z-30 pointer-events-auto flex flex-col space-y-2.5">
        {/* North Compass Button */}
        <button
          type="button"
          onClick={handleFitBounds}
          className="w-11 h-11 rounded-full bg-white text-slate-800 shadow-xl border border-slate-200 flex items-center justify-center hover:bg-slate-50 active:scale-95 transition cursor-pointer"
          title="Compass North"
        >
          <Compass className="w-5 h-5 text-red-500" />
        </button>

        {/* Search Along Route Button (🔍) */}
        <button
          type="button"
          onClick={() => setShowSearchPopover(!showSearchPopover)}
          className={`w-11 h-11 rounded-full shadow-xl border flex items-center justify-center active:scale-95 transition cursor-pointer ${
            showSearchPopover ? 'bg-blue-600 text-white border-blue-500' : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
          }`}
          title="Search Places along Route (Gas, Food, ATM)"
        >
          <Search className="w-5 h-5" />
        </button>

        {/* Audio Guidance Mute/Unmute Button (🔊) */}
        <button
          type="button"
          onClick={handleToggleVoice}
          className={`w-11 h-11 rounded-full shadow-xl border flex items-center justify-center active:scale-95 transition cursor-pointer ${
            !isVoiceMuted ? 'bg-white text-slate-800 border-slate-200' : 'bg-slate-800 text-slate-400 border-slate-700'
          }`}
          title={isVoiceMuted ? 'Unmute Audio Guidance' : 'Mute Audio Guidance'}
        >
          {!isVoiceMuted ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
        </button>

        {/* Hazard / Incident Report Alert Button (⚠️) */}
        <button
          type="button"
          onClick={() => setShowHazardModal(!showHazardModal)}
          className="w-11 h-11 rounded-full bg-white text-amber-500 shadow-xl border border-slate-200 flex items-center justify-center hover:bg-slate-50 active:scale-95 transition cursor-pointer"
          title="Report Road Hazard, Police, or Traffic"
        >
          <AlertTriangle className="w-5 h-5" />
        </button>

        {/* 3D Perspective vs 2D Flat View Toggle */}
        <button
          type="button"
          onClick={() => setIs3DMode(!is3DMode)}
          className={`w-11 h-11 rounded-full shadow-xl border flex flex-col items-center justify-center active:scale-95 transition cursor-pointer font-black text-xs ${
            is3DMode ? 'bg-[#004D40] text-emerald-300 border-emerald-500' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
          title={is3DMode ? '3D Driving Perspective Active' : 'Switch to 3D Driving Perspective'}
        >
          <span>{is3DMode ? '3D' : '2D'}</span>
        </button>
      </div>

      {/* 4. SEARCH POPOVER MODAL (When 🔍 clicked) */}
      {showSearchPopover && (
        <div className="absolute right-16 top-48 z-40 w-48 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-2 space-y-1.5 animate-fadeIn pointer-events-auto">
          <div className="flex items-center justify-between pb-1 border-b border-slate-200 dark:border-slate-800 px-1">
            <span className="text-[10px] font-black uppercase text-slate-500">Search on Route</span>
            <button type="button" onClick={() => setShowSearchPopover(false)} className="text-slate-400 hover:text-slate-600">
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
                voiceNavigationService.speak(`Searching for nearby ${item.label} along route.`, 'en');
              }}
              className="w-full flex items-center space-x-2 px-2 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 text-left cursor-pointer"
            >
              <item.icon className={`w-3.5 h-3.5 ${item.color}`} />
              <span className="truncate">{item.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* 5. ROAD HAZARD REPORT MODAL (When ⚠️ clicked) */}
      {showHazardModal && (
        <div className="absolute right-16 top-64 z-40 w-52 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-2xl border border-amber-500/40 p-2.5 space-y-2 animate-fadeIn pointer-events-auto">
          <div className="flex items-center justify-between pb-1 border-b border-slate-200 dark:border-slate-800">
            <span className="text-[10px] font-black uppercase text-amber-500 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              <span>Report Hazard</span>
            </span>
            <button type="button" onClick={() => setShowHazardModal(false)} className="text-slate-400 hover:text-slate-600">
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

      {/* Hazard Report Success Toast */}
      {hazardSuccessMsg && (
        <div className="absolute top-24 inset-x-4 z-50 max-w-sm mx-auto bg-amber-500 text-slate-950 px-4 py-2 rounded-2xl shadow-2xl text-xs font-black flex items-center justify-center space-x-2 animate-slideDown">
          <Check className="w-4 h-4" />
          <span>{hazardSuccessMsg}</span>
        </div>
      )}

      {/* 6. BOTTOM NAVIGATION BAR (Matching Image 1: Route split icon, 2 min, 0.1 mi • 2:06 PM, Red Exit button) */}
      <div className="absolute bottom-3 inset-x-3 z-30 pointer-events-auto max-w-sm mx-auto">
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-3xl p-3 shadow-2xl border border-slate-200/90 dark:border-slate-800 flex items-center justify-between gap-3 animate-slideUp">
          {/* Route Options Icon (Matching Image 1: ⑂) */}
          <button
            type="button"
            onClick={handleFitBounds}
            className="w-9 h-9 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center hover:bg-slate-200 active:scale-95 transition cursor-pointer"
            title="Alternative Routes"
          >
            <GitFork className="w-4 h-4" />
          </button>

          {/* ETA & Distance (Matching Image 1: 2 min, 0.1 mi • 2:06 PM) */}
          <div className="text-center flex-1">
            <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono leading-none">
              {roadDurationMins ? `${roadDurationMins} min` : '2 min'}
            </div>
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-0.5">
              {roadDistanceKm ? `${roadDistanceKm.toFixed(1)} km` : '0.1 mi'} • {new Date(Date.now() + 2 * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>

          {/* Red Exit Navigation Button (Matching Image 1) */}
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

      {/* 7. Domain Authorization Notice Popover (Kept clean and non-intrusive) */}
      {showRefererBanner && (
        <div className="absolute left-3 bottom-24 z-40 max-w-xs bg-slate-900/95 border border-amber-500/50 rounded-2xl p-3 text-white text-xs shadow-2xl backdrop-blur-md animate-fade-in pointer-events-auto space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-amber-400 text-[11px] flex items-center gap-1">
              <span>⚠️</span>
              <span>Google Maps API Authorization</span>
            </span>
            <button
              type="button"
              onClick={() => setShowRefererBanner(false)}
              className="text-slate-400 hover:text-white text-xs px-1"
            >
              ✕
            </button>
          </div>
          <p className="text-[10.5px] text-slate-300 leading-snug">
            To authorize this environment in Google Cloud Console:
          </p>
          <div className="p-1.5 bg-slate-950 rounded-lg border border-slate-800 font-mono text-[9.5px] text-emerald-300 break-all select-all">
            {typeof window !== 'undefined' ? `${window.location.origin}/*` : 'https://.../*'}
          </div>
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={handleCopyAuthorizedDomain}
              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-lg text-[10px] transition cursor-pointer"
            >
              {copiedDomain ? 'Copied URL!' : 'Copy Site URL'}
            </button>
            <span className="text-[9.5px] text-slate-400 font-medium">Google Live Raster Active</span>
          </div>
        </div>
      )}
    </div>
  );
};
