import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { Store, MapPin, Locate, Save, RefreshCw, CheckCircle2, AlertCircle, Compass, Navigation } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { getUserCurrentLocation, reverseGeocode, DEFAULT_RESTAURANT_LOCATION } from '../utils/geoUtils';

interface KitchenLocationData {
  name: string;
  lat: number;
  lng: number;
  address: string;
  updatedAt?: string;
}

export default function KitchenLocationManager() {
  const [kitchenLocation, setKitchenLocation] = useState<KitchenLocationData>(DEFAULT_RESTAURANT_LOCATION);
  const [storeName, setStoreName] = useState(DEFAULT_RESTAURANT_LOCATION.name);
  const [storeAddress, setStoreAddress] = useState(DEFAULT_RESTAURANT_LOCATION.address);
  const [storeLat, setStoreLat] = useState<string>(DEFAULT_RESTAURANT_LOCATION.lat.toString());
  const [storeLng, setStoreLng] = useState<string>(DEFAULT_RESTAURANT_LOCATION.lng.toString());
  
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDetectingGps, setIsDetectingGps] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  // Load existing Kitchen Location from Firestore
  useEffect(() => {
    const fetchKitchenLocation = async () => {
      setLoading(true);
      try {
        const docRef = doc(db, 'settings', 'kitchenLocation');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as KitchenLocationData;
          setKitchenLocation(data);
          setStoreName(data.name || DEFAULT_RESTAURANT_LOCATION.name);
          setStoreAddress(data.address || DEFAULT_RESTAURANT_LOCATION.address);
          setStoreLat(data.lat.toString());
          setStoreLng(data.lng.toString());
        }
      } catch (err) {
        console.warn('Using default kitchen location fallback:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchKitchenLocation();
  }, []);

  // Initialize interactive Leaflet map for picking Kitchen location
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const initialLat = parseFloat(storeLat) || DEFAULT_RESTAURANT_LOCATION.lat;
    const initialLng = parseFloat(storeLng) || DEFAULT_RESTAURANT_LOCATION.lng;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 15,
      attributionControl: false
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

    const storeIcon = L.divIcon({
      className: 'custom-kitchen-pin',
      html: `
        <div class="relative flex items-center justify-center">
          <div class="absolute w-12 h-12 bg-red-500/25 rounded-full animate-pulse"></div>
          <div class="w-10 h-10 bg-[#E23744] border-2 border-white rounded-2xl shadow-xl flex items-center justify-center text-white">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
            </svg>
          </div>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });

    const marker = L.marker([initialLat, initialLng], {
      icon: storeIcon,
      draggable: true
    }).addTo(map);

    marker.bindPopup(`<b>${storeName}</b><br/>Drag or click map to move store position`).openPopup();
    markerRef.current = marker;

    // Handle marker drag
    marker.on('dragend', async () => {
      const pos = marker.getLatLng();
      setStoreLat(pos.lat.toFixed(6));
      setStoreLng(pos.lng.toFixed(6));

      const addr = await reverseGeocode(pos.lat, pos.lng);
      if (addr) setStoreAddress(addr);
      toast.success('Updated Kitchen GPS Coordinates! 📍');
    });

    // Handle map click to place kitchen pin
    map.on('click', async (e: L.LeafletMouseEvent) => {
      marker.setLatLng(e.latlng);
      setStoreLat(e.latlng.lat.toFixed(6));
      setStoreLng(e.latlng.lng.toFixed(6));

      const addr = await reverseGeocode(e.latlng.lat, e.latlng.lng);
      if (addr) setStoreAddress(addr);
      toast.success('Kitchen pin placed at selected location! 📍');
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update map view and marker when lat/lng inputs change
  useEffect(() => {
    const lat = parseFloat(storeLat);
    const lng = parseFloat(storeLng);
    if (!isNaN(lat) && !isNaN(lng) && mapInstanceRef.current && markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
      mapInstanceRef.current.panTo([lat, lng]);
    }
  }, [storeLat, storeLng]);

  // Acquire Admin's real device location as Kitchen location
  const handleDetectDeviceGps = async () => {
    setIsDetectingGps(true);
    toast.loading('Acquiring real device GPS location for Kitchen...', { id: 'kitchen-gps' });

    try {
      const result = await getUserCurrentLocation({ timeoutMs: 15000 });
      toast.dismiss('kitchen-gps');

      if (result.coords) {
        const lat = result.coords.lat;
        const lng = result.coords.lng;
        setStoreLat(lat.toFixed(6));
        setStoreLng(lng.toFixed(6));

        if (mapInstanceRef.current && markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
          mapInstanceRef.current.setView([lat, lng], 17, { animate: true });
        }

        const geoAddr = await reverseGeocode(lat, lng);
        if (geoAddr) {
          setStoreAddress(geoAddr);
        }

        toast.success(`Kitchen GPS locked to device location! (±${result.coords.accuracy || 5}m accuracy)`);
      } else if (result.error) {
        toast.error(result.error);
      }
    } catch (e: any) {
      toast.dismiss('kitchen-gps');
      toast.error('Failed to get GPS location.');
    } finally {
      setIsDetectingGps(false);
    }
  };

  // Save Kitchen Location to Firestore
  const handleSaveKitchenLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(storeLat);
    const lng = parseFloat(storeLng);

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      toast.error('Please enter valid GPS Latitude and Longitude values.');
      return;
    }

    if (!storeName.trim() || !storeAddress.trim()) {
      toast.error('Please provide Kitchen store name and street address.');
      return;
    }

    setIsSaving(true);
    const updatedLocation: KitchenLocationData = {
      name: storeName.trim(),
      lat: parseFloat(lat.toFixed(6)),
      lng: parseFloat(lng.toFixed(6)),
      address: storeAddress.trim(),
      updatedAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'settings', 'kitchenLocation'), updatedLocation);
      setKitchenLocation(updatedLocation);
      toast.success('Kitchen GPS Location saved to Firestore! All new orders and live tracking will use this exact point. 🚀');
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to save kitchen settings to database.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-[#15171e] rounded-2xl border border-white/10 p-6 shadow-2xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#E23744] to-orange-500 flex items-center justify-center text-white shadow-md">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-white">Kitchen & Store Real GPS Location</h2>
            <p className="text-xs text-gray-400">Set the exact store GPS coordinates for order routing and live rider tracking</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDetectDeviceGps}
          disabled={isDetectingGps}
          className="inline-flex items-center gap-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 font-bold px-3.5 py-2 rounded-xl text-xs transition-all active:scale-95 shadow-sm"
        >
          <Locate className={`w-4 h-4 ${isDetectingGps ? 'animate-spin' : ''}`} />
          <span>{isDetectingGps ? 'Detecting GPS...' : 'Use My Live GPS as Kitchen'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Input Form */}
        <form onSubmit={handleSaveKitchenLocation} className="lg:col-span-5 space-y-4 text-xs">
          <div>
            <label className="block text-gray-300 font-bold mb-1.5">Kitchen / Restaurant Name *</label>
            <input
              type="text"
              required
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white outline-none focus:border-[#E23744]"
              placeholder="M-Bites Gourmet Kitchen"
            />
          </div>

          <div>
            <label className="block text-gray-300 font-bold mb-1.5">Full Street Address *</label>
            <textarea
              required
              rows={3}
              value={storeAddress}
              onChange={(e) => setStoreAddress(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white outline-none focus:border-[#E23744] leading-relaxed resize-none"
              placeholder="Shop No. 12, Main Market, Connaught Place, New Delhi"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-300 font-bold mb-1.5">Latitude (Real GPS) *</label>
              <input
                type="text"
                required
                value={storeLat}
                onChange={(e) => setStoreLat(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white outline-none font-mono focus:border-[#E23744]"
                placeholder="28.6315"
              />
            </div>
            <div>
              <label className="block text-gray-300 font-bold mb-1.5">Longitude (Real GPS) *</label>
              <input
                type="text"
                required
                value={storeLng}
                onChange={(e) => setStoreLng(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white outline-none font-mono focus:border-[#E23744]"
                placeholder="77.2167"
              />
            </div>
          </div>

          <div className="bg-black/30 p-3 rounded-xl border border-white/5 space-y-1.5 font-mono text-[11px] text-gray-400">
            <div className="flex justify-between">
              <span>Active Kitchen:</span>
              <strong className="text-white">{kitchenLocation.name}</strong>
            </div>
            <div className="flex justify-between">
              <span>Coordinates:</span>
              <strong className="text-emerald-400">{kitchenLocation.lat}, {kitchenLocation.lng}</strong>
            </div>
            {kitchenLocation.updatedAt && (
              <div className="flex justify-between text-[10px] text-gray-500">
                <span>Last Updated:</span>
                <span>{new Date(kitchenLocation.updatedAt).toLocaleString()}</span>
              </div>
            )}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-3 bg-gradient-to-r from-[#E23744] to-orange-500 text-white font-black rounded-xl text-xs shadow-lg hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving to Database...' : 'Save Kitchen GPS Location'}</span>
            </button>
          </div>
        </form>

        {/* Right: Interactive Map Picker */}
        <div className="lg:col-span-7 flex flex-col space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span className="font-bold text-white flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#E23744]" />
              Interactive Location Picker (Click or drag red pin)
            </span>
            <span className="text-[11px] text-gray-500">Updates live on click</span>
          </div>

          <div className="relative flex-1 min-h-[300px] lg:min-h-[380px] rounded-2xl overflow-hidden border border-white/10 shadow-inner">
            <div ref={mapContainerRef} className="w-full h-full min-h-[300px] lg:min-h-[380px] z-0" />
          </div>
        </div>
      </div>
    </div>
  );
}
