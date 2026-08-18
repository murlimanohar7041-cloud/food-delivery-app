import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  Bike, 
  MapPin, 
  Phone, 
  Navigation, 
  CheckCircle2, 
  Clock, 
  Radio, 
  Power, 
  AlertCircle, 
  Package, 
  ChevronRight,
  RefreshCw,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import { Order, DeliveryPartner, OrderStatus } from '../types';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { collection, query, where, onSnapshot, updateDoc, getDocs } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { getUserCurrentLocation } from '../utils/geoUtils';

interface DeliveryPartnerDashboardProps {
  onBack: () => void;
  partnerEmail?: string;
}

export default function DeliveryPartnerDashboard({ onBack, partnerEmail }: DeliveryPartnerDashboardProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const [isBroadcastingLocation, setIsBroadcastingLocation] = useState(false);
  const [activePartner, setActivePartner] = useState<DeliveryPartner>({
    id: auth.currentUser?.uid || 'rider-rahul-01',
    name: auth.currentUser?.displayName || 'Rahul Sharma',
    phone: '+91 98765 43210',
    vehicleNumber: 'DL 08 CD 4921',
    vehicleType: 'bike',
    rating: 4.85,
    status: 'active',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop'
  });
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const watchIdRef = useRef<number | null>(null);

  // Sync rider profile from Firestore
  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      getDoc(doc(db, 'users', user.uid)).then((snap) => {
        if (snap.exists()) {
          const d = snap.data();
          setActivePartner(prev => ({
            ...prev,
            id: user.uid,
            name: d.name || user.displayName || prev.name,
            phone: d.phone || prev.phone,
            vehicleNumber: d.vehicleNumber || prev.vehicleNumber
          }));
        }
      }).catch(err => console.warn('Rider profile load:', err));
    }
  }, []);

  // Fetch Delivery Orders in real time
  useEffect(() => {
    const q = query(collection(db, 'orders'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allOrders: Order[] = [];
      snapshot.forEach((d) => {
        allOrders.push({ id: d.id, ...d.data() } as Order);
      });
      // Filter for active delivery orders or all for simulation
      allOrders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setOrders(allOrders);
      if (selectedOrder) {
        const updated = allOrders.find(o => o.id === selectedOrder.id);
        if (updated) setSelectedOrder(updated);
      }
    }, (error) => {
      console.warn('Rider orders sync notice:', error.message);
    });
    return () => unsubscribe();
  }, [selectedOrder?.id]);

  // GPS broadcasting
  const startLiveLocationBroadcast = (orderId?: string) => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your device.');
      return;
    }

    setIsBroadcastingLocation(true);
    toast.success('Live GPS Sharing Started 📍', { id: 'gps-toast' });

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude, heading, speed } = position.coords;
        const now = new Date().toISOString();

        // Update target order if selected or all active out-for-delivery orders
        const targetOrders = orderId ? orders.filter(o => o.id === orderId) : orders.filter(o => o.status === 'Out for Delivery');

        for (const ord of targetOrders) {
          try {
            await updateDoc(doc(db, 'orders', ord.id), {
              deliveryLocation: {
                lat: latitude,
                lng: longitude,
                heading: heading || 0,
                speed: speed || 0,
                updatedAt: now
              }
            });
          } catch (err) {
            console.error('Error updating live GPS for order:', ord.id, err);
          }
        }
      },
      (error) => {
        console.warn('Geolocation error:', error.message);
        toast.error('GPS signal weak or permission denied.');
        setIsBroadcastingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 2000
      }
    );
  };

  const stopLiveLocationBroadcast = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsBroadcastingLocation(false);
    toast('Live GPS Sharing Stopped', { icon: '🛑' });
  };

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: newStatus,
        deliveryPartner: activePartner
      });
      toast.success(`Order status updated to ${newStatus}! 🚀`);
      
      if (newStatus === 'Out for Delivery' && !isBroadcastingLocation) {
        startLiveLocationBroadcast(orderId);
      } else if (newStatus === 'Delivered') {
        toast.success('Great job on delivering this order! 🎉');
      }
    } catch (e: any) {
      console.error(e);
      toast.error('Failed to update order status');
    }
  };

  const activeDeliveries = orders.filter(o => ['Restaurant Accepted', 'Preparing', 'Ready for Pickup', 'Out for Delivery'].includes(o.status));
  const completedDeliveries = orders.filter(o => o.status === 'Delivered');

  return (
    <div className="min-h-screen bg-gray-900 text-white pb-20 font-sans">
      {/* Rider Top Navigation */}
      <div className="bg-[#18181b] border-b border-white/10 sticky top-0 z-40 px-4 py-3 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={onBack}
              className="p-2 -ml-1 hover:bg-white/10 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-300" />
            </button>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#E23744] to-orange-500 flex items-center justify-center shadow-md">
                <Bike className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-sm leading-tight text-white">M-Bites Rider Portal</h1>
                <p className="text-[11px] text-gray-400 font-medium">{activePartner.name} • {activePartner.vehicleNumber}</p>
              </div>
            </div>
          </div>

          {/* Duty Status Toggle */}
          <button
            onClick={() => {
              setIsOnline(!isOnline);
              toast(isOnline ? 'You are now OFFLINE' : 'You are now ONLINE & ready for orders!', {
                icon: isOnline ? '🔴' : '🟢'
              });
            }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
              isOnline 
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                : 'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            <span>{isOnline ? 'ON DUTY' : 'OFF DUTY'}</span>
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        
        {/* GPS Location Broadcaster Card */}
        <div className="p-4 rounded-2xl bg-[#1f1f23] border border-white/10 shadow-md flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isBroadcastingLocation ? 'bg-emerald-500/20 text-emerald-400 animate-pulse' : 'bg-white/5 text-gray-400'}`}>
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                Live GPS Broadcast
                {isBroadcastingLocation && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                )}
              </h3>
              <p className="text-xs text-gray-400">
                {isBroadcastingLocation 
                  ? 'Transmitting live coordinates to customer tracking map' 
                  : 'Enable live GPS when you are out for delivery'}
              </p>
            </div>
          </div>

          <button
            onClick={() => isBroadcastingLocation ? stopLiveLocationBroadcast() : startLiveLocationBroadcast()}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              isBroadcastingLocation
                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30'
                : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-md'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>{isBroadcastingLocation ? 'Stop Sharing GPS' : 'Start Live GPS Broadcast'}</span>
          </button>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-4 rounded-2xl bg-[#18181b] border border-white/5 text-center">
            <span className="text-2xl font-black text-white">{activeDeliveries.length}</span>
            <p className="text-xs text-gray-400 mt-1 font-medium">Active Tasks</p>
          </div>
          <div className="p-4 rounded-2xl bg-[#18181b] border border-white/5 text-center">
            <span className="text-2xl font-black text-emerald-400">{completedDeliveries.length}</span>
            <p className="text-xs text-gray-400 mt-1 font-medium">Delivered</p>
          </div>
          <div className="p-4 rounded-2xl bg-[#18181b] border border-white/5 text-center">
            <span className="text-2xl font-black text-amber-400">⭐ {activePartner.rating}</span>
            <p className="text-xs text-gray-400 mt-1 font-medium">Rider Score</p>
          </div>
        </div>

        {/* Assigned / Active Orders List */}
        <div>
          <h2 className="text-base font-bold text-white mb-3 flex items-center justify-between">
            <span>Current Delivery Tasks</span>
            <span className="text-xs font-bold text-gray-400 bg-white/5 px-2.5 py-1 rounded-full">
              {activeDeliveries.length} Active
            </span>
          </h2>

          {activeDeliveries.length === 0 ? (
            <div className="p-8 rounded-2xl bg-[#18181b] border border-white/5 text-center space-y-2">
              <Package className="w-12 h-12 text-gray-600 mx-auto" />
              <p className="font-bold text-sm text-gray-300">No active delivery assignments right now</p>
              <p className="text-xs text-gray-500">New orders assigned by Admin will appear here immediately</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeDeliveries.map((order) => (
                <div 
                  key={order.id}
                  className="p-5 rounded-2xl bg-[#18181b] border border-white/10 hover:border-white/20 transition-all space-y-4 shadow-lg"
                >
                  {/* Order header */}
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-white text-base">#{order.id}</span>
                        <span className="text-xs font-bold bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-md border border-amber-500/30">
                          {order.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {order.restaurantName || 'M-Bites Gourmet Kitchen'}
                      </p>
                    </div>
                    <span className="text-base font-black text-emerald-400">₹{order.total.toFixed(2)}</span>
                  </div>

                  {/* Customer and Delivery Location info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-black/30 p-3.5 rounded-xl border border-white/5">
                    <div>
                      <span className="text-gray-500 block uppercase font-bold text-[10px] mb-1">Customer Details</span>
                      <p className="font-bold text-white text-sm">
                        {order.address.firstName || order.address.name || 'Customer'} {order.address.lastName || ''}
                      </p>
                      <p className="text-gray-400 mt-1 flex items-start gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#E23744] shrink-0 mt-0.5" />
                        <span>{order.address.address}, {order.address.city} {order.address.zipCode}</span>
                      </p>
                    </div>

                    <div className="flex flex-col justify-between sm:items-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
                      <div>
                        <span className="text-gray-500 block uppercase font-bold text-[10px] mb-1">Payment Type</span>
                        <span className="font-bold text-white">{order.paymentMethod}</span>
                      </div>

                      {/* Quick Call Customer */}
                      {order.address.phone && (
                        <a
                          href={`tel:${order.address.phone}`}
                          className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-colors"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>Call: {order.address.phone}</span>
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Items summary */}
                  <div className="text-xs text-gray-300">
                    <span className="text-gray-500 font-bold block mb-1">Order Items:</span>
                    <p className="bg-white/5 p-2 rounded-lg font-mono">
                      {order.items.map(i => `${i.quantity}x ${i.name}`).join(' • ')}
                    </p>
                  </div>

                  {/* Rider Status Action Buttons */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    {order.status === 'Pending' || order.status === 'Restaurant Accepted' ? (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'Preparing')}
                        className="flex-1 py-2.5 bg-yellow-600 hover:bg-yellow-700 text-white font-bold rounded-xl text-xs transition-all text-center shadow-md"
                      >
                        Accept & Start Preparing
                      </button>
                    ) : null}

                    {order.status === 'Preparing' ? (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'Ready for Pickup')}
                        className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs transition-all text-center shadow-md"
                      >
                        Food Ready for Pickup
                      </button>
                    ) : null}

                    {order.status === 'Ready for Pickup' ? (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'Out for Delivery')}
                        className="flex-1 py-2.5 bg-gradient-to-r from-[#E23744] to-orange-500 hover:opacity-90 text-white font-black rounded-xl text-xs transition-all text-center shadow-md flex items-center justify-center gap-2"
                      >
                        <Bike className="w-4 h-4" />
                        <span>Picked Up & Start Delivery (Live GPS)</span>
                      </button>
                    ) : null}

                    {order.status === 'Out for Delivery' ? (
                      <div className="flex w-full gap-2">
                        {/* Navigate on Google Maps */}
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${order.address.address || ''}, ${order.address.city || ''}`)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5"
                        >
                          <Navigation className="w-3.5 h-3.5" />
                          <span>Google Maps Nav</span>
                        </a>

                        <button
                          onClick={() => handleUpdateStatus(order.id, 'Delivered')}
                          className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-md"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Mark as Delivered ✓</span>
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recently Delivered Orders */}
        {completedDeliveries.length > 0 && (
          <div>
            <h2 className="text-base font-bold text-white mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Delivered Orders History ({completedDeliveries.length})</span>
            </h2>

            <div className="space-y-2">
              {completedDeliveries.slice(0, 5).map(order => (
                <div key={order.id} className="p-3 bg-[#18181b] rounded-xl border border-white/5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-white">#{order.id}</span>
                    <span className="text-gray-400 ml-2">to {order.address.firstName || 'Customer'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-emerald-400">₹{order.total.toFixed(2)}</span>
                    <span className="text-gray-500">{new Date(order.date).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
