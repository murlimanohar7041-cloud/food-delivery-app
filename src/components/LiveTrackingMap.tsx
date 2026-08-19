import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import L from 'leaflet';
import {
  MapPin,
  Navigation,
  Phone,
  MessageSquare,
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  LocateFixed,
  Bike,
  Compass,
  Radio,
  ExternalLink,
  Crosshair,
  Gauge,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Order, OrderStatus, DeliveryLocation, DeliveryPartner, LiveLocation } from '../types';
import {
  calculateDistanceKm,
  calculateBearing,
  calculateETA,
  fetchRealRoadRoute,
  getUserCurrentLocation,
  DEFAULT_CUSTOMER_LOCATION
} from '../utils/geoUtils';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { toast } from 'react-hot-toast';
import OrderChatModal from './OrderChatModal';
import CallModal from './CallModal';

interface LiveTrackingMapProps {
  order: Order;
  isAdmin?: boolean;
  onUpdateStatus?: (status: OrderStatus) => void;
  onClose?: () => void;
}

// Order status progression steps
export const TRACKING_STEPS: { status: OrderStatus; label: string; sub: string; icon: string }[] = [
  { status: 'Pending', label: 'Order Placed', sub: 'We have received your order', icon: '📝' },
  { status: 'Restaurant Accepted', label: 'Restaurant Accepted', sub: 'Kitchen confirmed your order', icon: '👨‍🍳' },
  { status: 'Preparing', label: 'Preparing Food', sub: 'Your meal is being freshly cooked', icon: '🍳' },
  { status: 'Ready for Pickup', label: 'Ready for Pickup', sub: 'Order packed for delivery partner', icon: '📦' },
  { status: 'Out for Delivery', label: 'Out for Delivery', sub: 'Rider is on the way with your order', icon: '🛵' },
  { status: 'Delivered', label: 'Delivered', sub: 'Delivered successfully!', icon: '✨' },
];

export default function LiveTrackingMap({
  order: initialOrder,
  isAdmin = false,
  onUpdateStatus,
  onClose
}: LiveTrackingMapProps) {
  const [liveOrder, setLiveOrder] = useState<Order>(initialOrder);
  const [liveLocationData, setLiveLocationData] = useState<LiveLocation | null>(null);
  const [isUpdatingCustomerGps, setIsUpdatingCustomerGps] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  // Markers & Layers refs (ONLY Customer and Delivery Boy markers on map)
  const userMarkerRef = useRef<L.Marker | null>(null);
  const riderMarkerRef = useRef<L.Marker | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  // Live map state
  const [mapTheme, setMapTheme] = useState<'dark' | 'light' | 'satellite'>('dark');
  const [autoFollowRider, setAutoFollowRider] = useState(true);
  const [roadRouteCoords, setRoadRouteCoords] = useState<[number, number][]>([]);
  const [routeDistanceKm, setRouteDistanceKm] = useState<number>(0);
  const [routeDurationMins, setRouteDurationMins] = useState<number>(0);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const lastFetchedRouteOriginRef = useRef<string>('');

  // Real-time Chat & Call Modal states
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [callModalData, setCallModalData] = useState<{
    isOpen: boolean;
    targetRole: 'rider' | 'restaurant' | 'customer';
    targetName: string;
    targetPhone: string;
  }>({
    isOpen: false,
    targetRole: 'rider',
    targetName: '',
    targetPhone: ''
  });

  // 1. Subscribe to real-time Firestore order updates
  useEffect(() => {
    if (!initialOrder?.id) return;
    setLiveOrder(initialOrder);

    const orderDocRef = doc(db, 'orders', initialOrder.id);
    const unsubscribeOrder = onSnapshot(
      orderDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const updated = { id: docSnap.id, ...docSnap.data() } as Order;
          setLiveOrder(updated);
        }
      },
      (error) => {
        console.warn('Live tracking order sync notice:', error.message);
      }
    );

    // 2. Subscribe to dedicated high-frequency real-time liveLocations collection
    const liveLocDocRef = doc(db, 'liveLocations', initialOrder.id);
    const unsubscribeLiveLoc = onSnapshot(
      liveLocDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const loc = docSnap.data() as LiveLocation;
          setLiveLocationData(loc);
        }
      },
      (error) => {
        console.warn('Live tracking gps sync notice:', error.message);
      }
    );

    return () => {
      unsubscribeOrder();
      unsubscribeLiveLoc();
    };
  }, [initialOrder?.id]);

  // Customer GPS coordinates
  const customerPos = useMemo(() => {
    if (liveOrder.customerLocation?.lat && liveOrder.customerLocation?.lng) {
      return {
        lat: liveOrder.customerLocation.lat,
        lng: liveOrder.customerLocation.lng,
        accuracy: liveOrder.customerLocation.accuracy,
        address: liveOrder.customerLocation.address || liveOrder.address?.address || 'Customer Delivery Address',
      };
    }
    return DEFAULT_CUSTOMER_LOCATION;
  }, [liveOrder.customerLocation, liveOrder.address]);

  // Delivery Partner live GPS coordinates
  const currentRiderPos: DeliveryLocation = useMemo(() => {
    // 1st priority: live broadcast from liveLocations/{orderId}
    if (liveLocationData?.lat && liveLocationData?.lng) {
      return {
        lat: liveLocationData.lat,
        lng: liveLocationData.lng,
        heading: liveLocationData.heading || 0,
        speed: liveLocationData.speed || 0,
        accuracy: liveLocationData.accuracy,
        updatedAt: liveLocationData.updatedAt
      };
    }
    // 2nd priority: deliveryLocation from orders/{orderId}
    if (liveOrder.deliveryLocation?.lat && liveOrder.deliveryLocation?.lng) {
      return liveOrder.deliveryLocation;
    }
    // Fallback: If not started yet, place rider near customer point with bearing toward customer
    return {
      lat: customerPos.lat + 0.008,
      lng: customerPos.lng + 0.008,
      heading: calculateBearing(customerPos.lat + 0.008, customerPos.lng + 0.008, customerPos.lat, customerPos.lng) || 0,
      speed: 0,
      updatedAt: liveOrder.date || new Date().toISOString()
    };
  }, [liveLocationData, liveOrder.deliveryLocation, customerPos, liveOrder.date]);

  // Delivery partner details
  const deliveryPartner: DeliveryPartner = useMemo(() => {
    return liveOrder.deliveryPartner || {
      name: liveLocationData?.riderName || 'Rahul Sharma',
      phone: liveLocationData?.riderPhone || '+91 98765 43210',
      vehicleNumber: 'DL 08 CD 4921',
      vehicleType: 'bike',
      rating: 4.85,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop'
    };
  }, [liveOrder.deliveryPartner, liveLocationData]);

  // Fetch real road route geometry from OSRM between Rider coordinates and Customer coordinates
  const updateRoadRoute = useCallback(async () => {
    const originKey = `${currentRiderPos.lat.toFixed(5)},${currentRiderPos.lng.toFixed(5)}->${customerPos.lat.toFixed(5)},${customerPos.lng.toFixed(5)}`;
    if (originKey === lastFetchedRouteOriginRef.current && roadRouteCoords.length > 0) {
      return;
    }
    lastFetchedRouteOriginRef.current = originKey;

    setIsCalculatingRoute(true);
    try {
      const result = await fetchRealRoadRoute(
        { lat: currentRiderPos.lat, lng: currentRiderPos.lng },
        { lat: customerPos.lat, lng: customerPos.lng }
      );
      setRoadRouteCoords(result.coordinates);
      setRouteDistanceKm(result.distanceKm);
      setRouteDurationMins(result.durationMinutes);
    } catch (err) {
      console.warn('Route calculation fallback:', err);
    } finally {
      setIsCalculatingRoute(false);
    }
  }, [currentRiderPos.lat, currentRiderPos.lng, customerPos.lat, customerPos.lng, roadRouteCoords.length]);

  useEffect(() => {
    updateRoadRoute();
  }, [updateRoadRoute]);

  // Distance & ETA calculation
  const distanceRemainingKm = useMemo(() => {
    if (routeDistanceKm > 0) return routeDistanceKm;
    return calculateDistanceKm(
      currentRiderPos.lat,
      currentRiderPos.lng,
      customerPos.lat,
      customerPos.lng
    );
  }, [routeDistanceKm, currentRiderPos, customerPos]);

  const liveETA = useMemo(() => {
    if (liveOrder.status === 'Delivered') return { minutes: 0, text: 'Delivered' };
    if (liveOrder.status === 'Cancelled') return { minutes: 0, text: 'Cancelled' };
    if (routeDurationMins > 0) {
      return {
        minutes: routeDurationMins,
        text: routeDurationMins <= 2 ? 'Arriving now' : `${routeDurationMins} mins`
      };
    }
    return calculateETA(distanceRemainingKm, currentRiderPos.speed || 25);
  }, [liveOrder.status, routeDurationMins, distanceRemainingKm, currentRiderPos.speed]);

  // Step tracking index
  const currentStepIndex = useMemo(() => {
    const idx = TRACKING_STEPS.findIndex((s) => s.status === liveOrder.status);
    return idx === -1 ? 0 : idx;
  }, [liveOrder.status]);

  // Custom high-contrast SVG leaflet icons (ONLY Customer & Rider)
  const createCustomIcons = useCallback(() => {
    // 1. Customer Marker Icon (📍 Customer actual GPS location)
    const userIcon = L.divIcon({
      className: 'custom-user-marker',
      html: `
        <div class="relative flex items-center justify-center">
          <div class="absolute w-10 h-10 bg-blue-500/30 rounded-full animate-ping"></div>
          <div class="w-9 h-9 bg-blue-600 border-2 border-white rounded-full shadow-xl flex items-center justify-center text-white">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
            </svg>
          </div>
          <span class="absolute -bottom-5 bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow whitespace-nowrap">
            📍 You (Customer)
          </span>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });

    // 2. Real Delivery Partner GPS Marker Icon (🛵 Delivery Boy actual GPS location)
    const headingDeg = currentRiderPos.heading || 0;
    const riderIcon = L.divIcon({
      className: 'custom-rider-marker',
      html: `
        <div class="relative flex items-center justify-center">
          <div class="absolute w-14 h-14 bg-emerald-500/25 rounded-full animate-pulse"></div>
          <div class="w-11 h-11 bg-emerald-500 border-2 border-white rounded-full shadow-2xl flex items-center justify-center text-white relative transition-transform duration-300" style="transform: rotate(${headingDeg}deg);">
            <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="18.5" cy="17.5" r="3.5"/>
              <circle cx="5.5" cy="17.5" r="3.5"/>
              <circle cx="15" cy="5" r="1"/>
              <path d="M12 17.5V14l-3-3 4-3 2 3h2"/>
            </svg>
          </div>
          <span class="absolute -bottom-5 bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow whitespace-nowrap">
            🛵 ${deliveryPartner.name.split(' ')[0]} (Live GPS)
          </span>
        </div>
      `,
      iconSize: [44, 44],
      iconAnchor: [22, 22],
    });

    return { userIcon, riderIcon };
  }, [currentRiderPos.heading, deliveryPartner.name]);

  const getTileUrl = (theme: 'light' | 'dark' | 'satellite') => {
    switch (theme) {
      case 'satellite':
        return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      case 'light':
        return 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
      case 'dark':
      default:
        return 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
    }
  };

  // Initialize Map (Contains ONLY Customer & Rider markers)
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [customerPos.lat, customerPos.lng],
      zoom: 14,
      zoomControl: false,
      attributionControl: false
    });

    const tileUrl = getTileUrl(mapTheme);
    const tiles = L.tileLayer(tileUrl, {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);
    tileLayerRef.current = tiles;

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const { userIcon, riderIcon } = createCustomIcons();

    // 1. Add Customer Marker (ONLY Customer)
    const uMarker = L.marker([customerPos.lat, customerPos.lng], { icon: userIcon })
      .addTo(map)
      .bindPopup(`<b>📍 Customer Delivery Location</b><br/>${customerPos.address}`);
    userMarkerRef.current = uMarker;

    // 2. Add Live Delivery Boy Marker (ONLY Rider)
    const riderMarker = L.marker([currentRiderPos.lat, currentRiderPos.lng], { icon: riderIcon })
      .addTo(map)
      .bindPopup(`<b>🛵 ${deliveryPartner.name}</b><br/>${deliveryPartner.vehicleNumber} (${deliveryPartner.vehicleType})<br/>Speed: ${currentRiderPos.speed || 0} km/h`);
    riderMarkerRef.current = riderMarker;

    // 3. Add Road Polyline between Rider and Customer
    const initialCoords = roadRouteCoords.length > 0 
      ? roadRouteCoords 
      : [[currentRiderPos.lat, currentRiderPos.lng], [customerPos.lat, customerPos.lng]] as [number, number][];

    const routeLine = L.polyline(initialCoords, {
      color: '#10B981',
      weight: 5,
      opacity: 0.9,
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(map);
    routePolylineRef.current = routeLine;

    // Fit map bounds strictly to Customer & Rider markers
    const group = L.featureGroup([uMarker, riderMarker]);
    map.fitBounds(group.getBounds().pad(0.25));

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Tile Layer when map theme changes
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    tileLayerRef.current.setUrl(getTileUrl(mapTheme));
  }, [mapTheme]);

  // Update Markers and Polyline on live GPS updates
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const { userIcon, riderIcon } = createCustomIcons();

    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([customerPos.lat, customerPos.lng]);
      userMarkerRef.current.setIcon(userIcon);
    }
    if (riderMarkerRef.current) {
      riderMarkerRef.current.setLatLng([currentRiderPos.lat, currentRiderPos.lng]);
      riderMarkerRef.current.setIcon(riderIcon);
    }
    if (routePolylineRef.current && roadRouteCoords.length > 0) {
      routePolylineRef.current.setLatLngs(roadRouteCoords);
    }

    // Auto-follow rider when out for delivery
    if (autoFollowRider && liveOrder.status === 'Out for Delivery') {
      mapInstanceRef.current.panTo([currentRiderPos.lat, currentRiderPos.lng], {
        animate: true,
        duration: 0.5
      });
    }
  }, [customerPos, currentRiderPos, roadRouteCoords, createCustomIcons, autoFollowRider, liveOrder.status]);

  // Recenter controls (Customer & Rider only)
  const handleRecenter = () => {
    if (!mapInstanceRef.current) return;
    const markers: L.Marker[] = [];
    if (userMarkerRef.current) markers.push(userMarkerRef.current);
    if (riderMarkerRef.current) markers.push(riderMarkerRef.current);

    if (markers.length > 0) {
      const group = L.featureGroup(markers);
      mapInstanceRef.current.fitBounds(group.getBounds().pad(0.3), {
        animate: true,
        duration: 0.8
      });
    }
  };

  const handleFocusRider = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.setView([currentRiderPos.lat, currentRiderPos.lng], 16, {
      animate: true,
      duration: 0.8
    });
  };

  const handleFocusCustomer = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.setView([customerPos.lat, customerPos.lng], 16, {
      animate: true,
      duration: 0.8
    });
  };

  // Customer self GPS acquisition / update
  const handleAcquireCustomerGps = async () => {
    setIsUpdatingCustomerGps(true);
    toast.loading('Acquiring your device GPS coordinates...', { id: 'gps-cust' });
    try {
      const res = await getUserCurrentLocation({ timeoutMs: 12000 });
      toast.dismiss('gps-cust');
      if (res.coords) {
        // Update order in Firestore
        await updateDoc(doc(db, 'orders', liveOrder.id), {
          customerLocation: {
            lat: res.coords.lat,
            lng: res.coords.lng,
            accuracy: res.coords.accuracy,
            address: res.coords.address
          }
        });
        toast.success(`📍 Your live GPS location updated! (±${res.coords.accuracy || 5}m)`);
      } else if (res.error) {
        toast.error(res.error);
      }
    } catch (e: any) {
      toast.dismiss('gps-cust');
      toast.error('Could not detect GPS location.');
    } finally {
      setIsUpdatingCustomerGps(false);
    }
  };

  const lastUpdatedSeconds = useMemo(() => {
    if (!currentRiderPos.updatedAt) return null;
    const diff = Math.floor((Date.now() - new Date(currentRiderPos.updatedAt).getTime()) / 1000);
    if (diff < 5) return 'Live now (0s)';
    if (diff < 60) return `${diff}s ago`;
    return `${Math.floor(diff / 60)}m ago`;
  }, [currentRiderPos.updatedAt]);

  const isLiveGpsBroadcasting = Boolean(liveLocationData?.lat && liveLocationData?.status === 'active');

  return (
    <div className="w-full flex flex-col lg:flex-row gap-6">
      {/* Map Main Canvas */}
      <div className="flex-1 flex flex-col bg-white dark:bg-[#141414] rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm overflow-hidden min-h-[460px] lg:min-h-[600px]">
        {/* Map Top Bar */}
        <div className="p-4 border-b border-gray-100 dark:border-white/5 flex flex-wrap items-center justify-between gap-3 bg-gray-50/80 dark:bg-[#1a1a1a]/80 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping"></div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-sm text-gray-900 dark:text-white uppercase tracking-wider">
                  Real GPS Live Delivery Map
                </span>
                <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">
                  {liveOrder.status}
                </span>
              </div>
              <p className="text-xs text-gray-500">Order #{liveOrder.id}</p>
            </div>
          </div>

          {/* Controls Bar */}
          <div className="flex items-center gap-2">
            {/* Theme switcher */}
            <div className="flex items-center bg-gray-200/70 dark:bg-white/5 rounded-lg p-0.5 text-xs font-bold">
              <button
                onClick={() => setMapTheme('dark')}
                className={`px-2.5 py-1 rounded-md transition-colors ${mapTheme === 'dark' ? 'bg-white dark:bg-[#252525] shadow text-black dark:text-white' : 'text-gray-500'}`}
              >
                Dark
              </button>
              <button
                onClick={() => setMapTheme('light')}
                className={`px-2.5 py-1 rounded-md transition-colors ${mapTheme === 'light' ? 'bg-white dark:bg-[#252525] shadow text-black dark:text-white' : 'text-gray-500'}`}
              >
                Light
              </button>
              <button
                onClick={() => setMapTheme('satellite')}
                className={`px-2.5 py-1 rounded-md transition-colors ${mapTheme === 'satellite' ? 'bg-white dark:bg-[#252525] shadow text-black dark:text-white' : 'text-gray-500'}`}
              >
                Satellite
              </button>
            </div>

            {/* Auto Follow Toggle */}
            <button
              onClick={() => setAutoFollowRider(!autoFollowRider)}
              title={autoFollowRider ? 'Auto-follow Rider: ON' : 'Auto-follow Rider: OFF'}
              className={`p-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                autoFollowRider
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-gray-100 dark:bg-white/10 text-gray-400'
              }`}
            >
              <Crosshair className="w-4 h-4" />
              <span className="hidden sm:inline">Follow Rider</span>
            </button>

            {/* Focus Rider */}
            <button
              onClick={handleFocusRider}
              title="Center on Delivery Partner"
              className="p-2 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 rounded-lg text-gray-700 dark:text-gray-200 transition-colors"
            >
              <Bike className="w-4 h-4 text-emerald-500" />
            </button>

            {/* Focus Customer */}
            <button
              onClick={handleFocusCustomer}
              title="Center on My Location"
              className="p-2 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 rounded-lg text-gray-700 dark:text-gray-200 transition-colors"
            >
              <MapPin className="w-4 h-4 text-blue-500" />
            </button>

            {/* Fit All */}
            <button
              onClick={handleRecenter}
              title="Fit Full Route"
              className="p-2 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 rounded-lg text-gray-700 dark:text-gray-200 transition-colors"
            >
              <LocateFixed className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Leaflet Map DOM Element */}
        <div className="relative flex-1 min-h-[360px] sm:min-h-[440px]">
          <div ref={mapContainerRef} className="w-full h-full min-h-[360px] sm:min-h-[440px] z-0" />

          {/* Floating Live ETA & Distance Badge */}
          <div className="absolute top-4 left-4 z-[400] bg-white/95 dark:bg-[#141414]/95 backdrop-blur-md rounded-2xl p-3.5 shadow-2xl border border-gray-200/60 dark:border-white/10 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-500">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Estimated Arrival</p>
              <p className="text-lg font-black text-gray-900 dark:text-white leading-tight">
                {liveETA.text}
              </p>
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                <span>{distanceRemainingKm} km road route</span>
                <span>•</span>
                <span>{currentRiderPos.speed ? `${currentRiderPos.speed} km/h` : 'Active'}</span>
              </div>
            </div>
          </div>

          {/* Live GPS Sync Status pill */}
          <div className="absolute bottom-4 left-4 z-[400] bg-black/85 backdrop-blur-md text-white text-[11px] font-mono px-3.5 py-2 rounded-xl border border-white/15 flex items-center gap-2 shadow-2xl">
            <Radio className={`w-3.5 h-3.5 ${isLiveGpsBroadcasting ? 'text-emerald-400 animate-pulse' : 'text-yellow-400'}`} />
            <span>GPS: {lastUpdatedSeconds || 'Live Active'}</span>
            {currentRiderPos.accuracy && (
              <>
                <span className="text-gray-500">•</span>
                <span className="text-emerald-300">±{currentRiderPos.accuracy}m</span>
              </>
            )}
            {currentRiderPos.heading !== undefined && (
              <>
                <span className="text-gray-500">•</span>
                <span className="flex items-center gap-1">
                  <Compass className="w-3 h-3 text-blue-400" />
                  {currentRiderPos.heading}°
                </span>
              </>
            )}
          </div>

          {/* Customer GPS recalibrate button */}
          <button
            onClick={handleAcquireCustomerGps}
            disabled={isUpdatingCustomerGps}
            title="Update customer location from this device's GPS"
            className="absolute top-4 right-4 z-[400] bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-xl flex items-center gap-1.5 transition-all border border-white/20"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isUpdatingCustomerGps ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh My GPS</span>
          </button>
        </div>

        {/* Map Bottom Status Strip: Rider <-> Customer ONLY */}
        <div className="p-4 bg-gray-50 dark:bg-[#101010] border-t border-gray-100 dark:border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 sm:gap-4 flex-wrap text-gray-700 dark:text-gray-300">
            <button
              onClick={handleFocusRider}
              className="flex items-center gap-1.5 hover:text-emerald-400 transition-colors"
              title="Click to view Live Delivery Boy location"
            >
              <Bike className="w-4 h-4 text-emerald-500" />
              <span className="font-bold">🛵 {deliveryPartner.name} (Live Rider)</span>
            </button>

            <span className="text-gray-400 font-bold">━━━━ ➔</span>

            <button
              onClick={handleFocusCustomer}
              className="flex items-center gap-1.5 hover:text-blue-400 transition-colors"
              title="Click to view Customer Delivery destination"
            >
              <MapPin className="w-4 h-4 text-blue-500" />
              <span className="font-bold">📍 {customerPos.address || 'Delivery Location'}</span>
            </button>
          </div>

          <div className="text-[11px] text-gray-500 font-mono ml-auto flex items-center gap-2">
            <span>{isCalculatingRoute ? 'Calculating road route...' : 'OSRM Live Road Navigation'}</span>
          </div>
        </div>
      </div>

      {/* Right Column: Milestones & Delivery Partner Card */}
      <div className="w-full lg:w-96 flex flex-col gap-4">
        {/* Delivery Partner Details Card */}
        <div className="bg-white dark:bg-[#141414] rounded-2xl p-5 border border-gray-200 dark:border-white/10 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">
            Assigned Delivery Partner
          </p>
          <div className="flex items-center gap-4 mb-4">
            <img
              src={deliveryPartner.avatar}
              alt={deliveryPartner.name}
              className="w-14 h-14 rounded-full object-cover border-2 border-emerald-500 shadow-md"
            />
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-base text-gray-900 dark:text-white truncate">
                {deliveryPartner.name}
              </h4>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 font-bold text-xs px-1.5 py-0.5 rounded flex items-center gap-0.5">
                  ★ {deliveryPartner.rating}
                </span>
                <span className="text-xs text-gray-500 font-medium font-mono">
                  • {deliveryPartner.vehicleNumber}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2.5 bg-emerald-500/10 rounded-xl mb-4 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>Real GPS Broadcast Verified • Safe Delivery</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setCallModalData({
                isOpen: true,
                targetRole: 'rider',
                targetName: deliveryPartner.name,
                targetPhone: deliveryPartner.phone || '+91 98765 43210'
              })}
              className="py-2.5 px-4 bg-[#2874f0] hover:bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
            >
              <Phone className="w-4 h-4" />
              Call Partner
            </button>
            <button
              type="button"
              onClick={() => setIsChatOpen(true)}
              className="py-2.5 px-4 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-900 dark:text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              Live Chat
            </button>
          </div>
        </div>

        {/* 6-Stage Real-Time Status Timeline */}
        <div className="bg-white dark:bg-[#141414] rounded-2xl p-5 border border-gray-200 dark:border-white/10 shadow-sm flex-1">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100 dark:border-white/5">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
              Live Order Progress
            </p>
            {isAdmin && onUpdateStatus && (
              <select
                value={liveOrder.status}
                onChange={(e) => onUpdateStatus(e.target.value as OrderStatus)}
                className="text-xs font-bold bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white border-none rounded px-2 py-1 outline-none cursor-pointer"
              >
                {TRACKING_STEPS.map((s) => (
                  <option key={s.status} value={s.status}>
                    {s.label}
                  </option>
                ))}
                <option value="Cancelled">Cancelled</option>
              </select>
            )}
          </div>

          <div className="space-y-4">
            {TRACKING_STEPS.map((step, idx) => {
              const isCompleted = currentStepIndex > idx || liveOrder.status === 'Delivered';
              const isCurrent = currentStepIndex === idx && liveOrder.status !== 'Delivered';

              return (
                <div key={step.status} className="flex items-start gap-3 relative">
                  {/* Vertical connecting line */}
                  {idx < TRACKING_STEPS.length - 1 && (
                    <div
                      className={`absolute left-4 top-8 w-0.5 -bottom-4 ${
                        isCompleted ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-white/10'
                      }`}
                    />
                  )}

                  {/* Step Icon Badge */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm z-10 transition-all ${
                      isCompleted
                        ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                        : isCurrent
                        ? 'bg-blue-600 text-white ring-4 ring-blue-500/20 animate-pulse'
                        : 'bg-gray-100 dark:bg-white/5 text-gray-400 border border-gray-200 dark:border-white/10'
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : step.icon}
                  </div>

                  <div className="flex-1 pt-0.5">
                    <div className="flex items-center justify-between">
                      <p
                        className={`text-sm font-bold ${
                          isCompleted || isCurrent
                            ? 'text-gray-900 dark:text-white'
                            : 'text-gray-400'
                        }`}
                      >
                        {step.label}
                      </p>
                      {isCurrent && (
                        <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 rounded-full">
                          In Progress
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{step.sub}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Real-time Order Chat Modal */}
      {isChatOpen && (
        <OrderChatModal
          order={liveOrder}
          currentUserRole={isAdmin ? 'restaurant' : 'customer'}
          currentUserId={auth.currentUser?.uid || 'user-anon'}
          currentUserName={auth.currentUser?.displayName || 'Customer'}
          onClose={() => setIsChatOpen(false)}
          onInitiateCall={(role, phone, name) => {
            setCallModalData({
              isOpen: true,
              targetRole: role,
              targetName: name,
              targetPhone: phone
            });
          }}
        />
      )}

      {/* Secure Call Modal */}
      <CallModal
        isOpen={callModalData.isOpen}
        onClose={() => setCallModalData(prev => ({ ...prev, isOpen: false }))}
        targetRole={callModalData.targetRole}
        targetName={callModalData.targetName}
        targetPhone={callModalData.targetPhone}
        orderId={liveOrder.id}
      />
    </div>
  );
}
