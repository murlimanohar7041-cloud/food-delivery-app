import React, { useEffect, useState, lazy, Suspense } from 'react';
import { 
  ArrowLeft, 
  RefreshCw, 
  ExternalLink, 
  Navigation, 
  Bike, 
  X, 
  Users, 
  ShoppingBag, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  UserPlus, 
  ShieldCheck, 
  Ban, 
  Phone, 
  MapPin, 
  Search, 
  SlidersHorizontal,
  ChevronDown,
  Plus,
  Store,
  MessageSquare,
  Utensils,
  Tag,
  Trash2,
  Edit3,
  Check
} from 'lucide-react';
import { Order, OrderStatus, UserProfile, DeliveryPartner } from '../types';
import { products as initialProducts, Product } from '../products';
import { db, auth } from '../firebase';
import { collection, onSnapshot, doc, updateDoc, setDoc, addDoc, query, getDocs } from 'firebase/firestore';
import { toast } from 'react-hot-toast';

const LiveTrackingMap = lazy(() => import('./LiveTrackingMap'));
const KitchenLocationManager = lazy(() => import('./KitchenLocationManager'));
const OrderChatModal = lazy(() => import('./OrderChatModal'));
const CallModal = lazy(() => import('./CallModal'));

interface AdminDashboardProps {
  onBack: () => void;
  orders?: Order[];
  onUpdateOrderStatus?: (orderId: string, status: string) => void;
}

const DEFAULT_RIDERS: DeliveryPartner[] = [
  {
    id: 'rider-rahul-01',
    name: 'Rahul Sharma',
    phone: '+91 98765 43210',
    vehicleNumber: 'DL 08 CD 4921',
    vehicleType: 'bike',
    rating: 4.85,
    status: 'active',
    isActive: true,
    totalDeliveries: 142,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop'
  },
  {
    id: 'rider-vikram-02',
    name: 'Vikram Singh',
    phone: '+91 98111 22334',
    vehicleNumber: 'DL 03 XY 1109',
    vehicleType: 'ev',
    rating: 4.92,
    status: 'active',
    isActive: true,
    totalDeliveries: 89,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop'
  },
  {
    id: 'rider-amit-03',
    name: 'Amit Patel',
    phone: '+91 98222 33445',
    vehicleNumber: 'DL 12 AB 9081',
    vehicleType: 'scooter',
    rating: 4.78,
    status: 'offline',
    isActive: false,
    totalDeliveries: 56,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop'
  }
];

export default function AdminDashboard({ onBack, orders = [], onUpdateOrderStatus }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'orders' | 'customers' | 'riders' | 'kitchen' | 'menu'>('orders');
  const [customers, setCustomers] = useState<UserProfile[]>([]);
  const [riders, setRiders] = useState<DeliveryPartner[]>(DEFAULT_RIDERS);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [trackingOrder, setTrackingOrder] = useState<Order | null>(null);

  // Real-time Chat & Call modals
  const [chatOrder, setChatOrder] = useState<Order | null>(null);
  const [callModalData, setCallModalData] = useState<{
    isOpen: boolean;
    targetRole: 'rider' | 'restaurant' | 'customer';
    targetName: string;
    targetPhone: string;
    orderId?: string;
  }>({
    isOpen: false,
    targetRole: 'customer',
    targetName: '',
    targetPhone: ''
  });

  // Menu Management State
  const [menuItems, setMenuItems] = useState<(Product & { inStock?: boolean })[]>(() => {
    return initialProducts.map(p => ({ ...p, inStock: true }));
  });
  const [menuSearch, setMenuSearch] = useState('');
  const [selectedMenuCategory, setSelectedMenuCategory] = useState('All');
  const [isAddDishOpen, setIsAddDishOpen] = useState(false);
  const [newDishName, setNewDishName] = useState('');
  const [newDishPrice, setNewDishPrice] = useState('');
  const [newDishCategory, setNewDishCategory] = useState('Pizza');
  const [newDishIsVeg, setNewDishIsVeg] = useState(true);
  const [newDishImage, setNewDishImage] = useState('');
  
  // Search and filter states
  const [orderSearch, setOrderSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [customerSearch, setCustomerSearch] = useState('');
  const [isAddRiderOpen, setIsAddRiderOpen] = useState(false);

  // New Rider Form State
  const [newRiderName, setNewRiderName] = useState('');
  const [newRiderPhone, setNewRiderPhone] = useState('');
  const [newRiderVehicle, setNewRiderVehicle] = useState('');
  const [newRiderType, setNewRiderType] = useState<'bike' | 'scooter' | 'ev'>('bike');

  // Fetch real-time Customers from Firestore
  useEffect(() => {
    const unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const fetched: UserProfile[] = [];
      snapshot.forEach((d) => {
        fetched.push({ id: d.id, ...d.data() } as UserProfile);
      });
      setCustomers(fetched);
    }, (error) => {
      console.warn('Admin users sync notice:', error.message);
    });

    const unsubscribeRiders = onSnapshot(collection(db, 'deliveryPartners'), (snapshot) => {
      if (!snapshot.empty) {
        const fetchedRiders: DeliveryPartner[] = [];
        snapshot.forEach((d) => {
          fetchedRiders.push({ id: d.id, ...d.data() } as DeliveryPartner);
        });
        setRiders(fetchedRiders);
      }
    }, (error) => {
      console.warn('Admin riders sync notice:', error.message);
    });

    return () => {
      unsubscribeUsers();
      unsubscribeRiders();
    };
  }, []);

  // Sync / Refresh
  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setLastUpdated(new Date());
      setLoading(false);
      toast.success('Admin Dashboard updated!');
    }, 600);
  };

  // Order status colors
  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('pending')) return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    if (s.includes('accepted')) return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    if (s.includes('preparing')) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    if (s.includes('pickup')) return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    if (s.includes('out for delivery')) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    if (s.includes('delivered')) return 'bg-green-500/20 text-green-400 border-green-500/30';
    if (s.includes('cancelled')) return 'bg-red-500/20 text-red-400 border-red-500/30';
    return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  // Order Management: Assign Rider
  const handleAssignRider = async (orderId: string, riderId: string) => {
    const rider = riders.find(r => r.id === riderId) || DEFAULT_RIDERS[0];
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        deliveryBoyId: riderId,
        deliveryPartner: rider,
        status: 'Ready for Pickup'
      });
      toast.success(`Assigned ${rider.name} to Order #${orderId}`);
    } catch (e) {
      console.error(e);
      toast.error('Failed to assign delivery partner');
    }
  };

  // Customer Management: Toggle Block/Unblock
  const handleToggleCustomerBlock = async (userId: string, currentBlocked: boolean = false) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        blocked: !currentBlocked
      });
      toast.success(!currentBlocked ? 'Customer blocked' : 'Customer unblocked');
    } catch (e) {
      console.error(e);
      toast.error('Failed to update customer status');
    }
  };

  // Delivery Boy Management: Add Rider
  const handleAddRider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRiderName || !newRiderPhone || !newRiderVehicle) {
      toast.error('Please fill in all rider fields');
      return;
    }

    const riderId = `rider-${Date.now()}`;
    const riderData: DeliveryPartner = {
      id: riderId,
      name: newRiderName,
      phone: newRiderPhone,
      vehicleNumber: newRiderVehicle.toUpperCase(),
      vehicleType: newRiderType,
      rating: 5.0,
      status: 'active',
      isActive: true,
      totalDeliveries: 0,
      createdAt: new Date().toISOString(),
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop'
    };

    try {
      await setDoc(doc(db, 'deliveryPartners', riderId), riderData);
      setRiders(prev => [riderData, ...prev]);
      setIsAddRiderOpen(false);
      setNewRiderName('');
      setNewRiderPhone('');
      setNewRiderVehicle('');
      toast.success(`Added new delivery boy: ${riderData.name}! 🛵`);
    } catch (e) {
      console.error(e);
      toast.error('Failed to add delivery boy');
    }
  };

  // Delivery Boy Management: Toggle Active Status
  const handleToggleRiderActive = async (riderId: string, currentActive: boolean) => {
    const newStatus = !currentActive ? 'active' : 'offline';
    try {
      await updateDoc(doc(db, 'deliveryPartners', riderId), {
        isActive: !currentActive,
        status: newStatus
      });
      setRiders(prev => prev.map(r => r.id === riderId ? { ...r, isActive: !currentActive, status: newStatus } : r));
      toast.success(`Rider status set to ${newStatus}`);
    } catch (e) {
      // Local fallback
      setRiders(prev => prev.map(r => r.id === riderId ? { ...r, isActive: !currentActive, status: newStatus } : r));
      toast.success(`Rider status updated`);
    }
  };

  // Metric Computations
  const totalOrdersCount = orders.length;
  const newOrdersCount = orders.filter(o => o.status === 'Pending').length;
  const activeOrdersCount = orders.filter(o => ['Restaurant Accepted', 'Preparing', 'Ready for Pickup', 'Out for Delivery'].includes(o.status)).length;
  const deliveredOrdersCount = orders.filter(o => o.status === 'Delivered').length;
  const cancelledOrdersCount = orders.filter(o => o.status === 'Cancelled').length;

  // Filtered orders
  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.id.toLowerCase().includes(orderSearch.toLowerCase()) ||
      (o.address?.firstName || '').toLowerCase().includes(orderSearch.toLowerCase()) ||
      (o.address?.phone || '').includes(orderSearch);
    const matchesStatus = statusFilter === 'All' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Filtered customers
  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.email.toLowerCase().includes(customerSearch.toLowerCase()) ||
    (c.phone || '').includes(customerSearch)
  );

  return (
    <div className="min-h-screen bg-[#0d0e12] text-gray-100 pb-20 font-sans">
      {/* Top Navbar */}
      <div className="bg-[#15171e] border-b border-white/10 sticky top-0 z-40 shadow-xl">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button 
              onClick={onBack} 
              className="p-2 -ml-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#E23744] to-orange-500 flex items-center justify-center font-black text-white text-sm shadow-md">
                M
              </div>
              <div>
                <h1 className="text-base font-black text-white tracking-tight">M-Bites Admin Command Center</h1>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-mono">Master Control System</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Firestore Connected</span>
            </div>
            <button 
              onClick={handleRefresh} 
              className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border border-white/10 text-gray-300 hover:text-white"
              disabled={loading}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Sync Live</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 flex space-x-2 sm:space-x-4 border-t border-white/5 pt-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('orders')}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-black flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'orders'
                ? 'border-[#E23744] text-[#E23744]'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Orders ({orders.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('menu')}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-black flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'menu'
                ? 'border-[#E23744] text-[#E23744]'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Utensils className="w-4 h-4" />
            <span>Menu & Kitchen ({menuItems.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('customers')}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-black flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'customers'
                ? 'border-[#E23744] text-[#E23744]'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Customers ({customers.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('riders')}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-black flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'riders'
                ? 'border-[#E23744] text-[#E23744]'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Bike className="w-4 h-4" />
            <span>Delivery Boys ({riders.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('kitchen')}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-black flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'kitchen'
                ? 'border-[#E23744] text-[#E23744]'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>Store GPS</span>
          </button>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Metric Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
          <div className="bg-[#15171e] p-4 rounded-2xl border border-white/5 shadow-md">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Total Orders</span>
            <div className="text-2xl font-black text-white mt-1">{totalOrdersCount}</div>
            <span className="text-[11px] text-gray-500">Lifetime logged</span>
          </div>
          <div className="bg-[#15171e] p-4 rounded-2xl border border-orange-500/20 shadow-md">
            <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400">New Pending</span>
            <div className="text-2xl font-black text-orange-400 mt-1">{newOrdersCount}</div>
            <span className="text-[11px] text-orange-300/70">Awaiting kitchen accept</span>
          </div>
          <div className="bg-[#15171e] p-4 rounded-2xl border border-blue-500/20 shadow-md">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">Active In-Flight</span>
            <div className="text-2xl font-black text-blue-400 mt-1">{activeOrdersCount}</div>
            <span className="text-[11px] text-blue-300/70">Preparing / Out</span>
          </div>
          <div className="bg-[#15171e] p-4 rounded-2xl border border-emerald-500/20 shadow-md">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Delivered</span>
            <div className="text-2xl font-black text-emerald-400 mt-1">{deliveredOrdersCount}</div>
            <span className="text-[11px] text-emerald-300/70">Completed orders</span>
          </div>
          <div className="bg-[#15171e] p-4 rounded-2xl border border-red-500/20 shadow-md col-span-2 sm:col-span-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-red-400">Cancelled</span>
            <div className="text-2xl font-black text-red-400 mt-1">{cancelledOrdersCount}</div>
            <span className="text-[11px] text-red-300/70">Rejected or void</span>
          </div>
        </div>

        {/* TAB 1: ORDERS MANAGEMENT */}
        {activeTab === 'orders' && (
          <div className="bg-[#15171e] rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
            {/* Filter and Search Bar */}
            <div className="p-5 border-b border-white/10 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 bg-black/20">
              <div className="flex items-center gap-3">
                <div className="relative flex-1 sm:w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by Order ID, Name, Phone..."
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 outline-none focus:border-[#E23744]"
                  />
                </div>
                
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-300 font-bold outline-none cursor-pointer"
                >
                  <option value="All">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Restaurant Accepted">Accepted</option>
                  <option value="Preparing">Preparing</option>
                  <option value="Ready for Pickup">Ready for Pickup</option>
                  <option value="Out for Delivery">Out for Delivery</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div className="text-xs font-bold text-gray-400 text-right">
                Showing {filteredOrders.length} of {orders.length} orders
              </div>
            </div>

            {/* Orders Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-black/40 text-gray-400 border-b border-white/10 uppercase tracking-wider font-mono text-[11px]">
                  <tr>
                    <th className="px-6 py-4">Order ID & Date</th>
                    <th className="px-6 py-4">Customer & Contact</th>
                    <th className="px-6 py-4">Delivery Address</th>
                    <th className="px-6 py-4">Items & Amount</th>
                    <th className="px-6 py-4">Status Changer</th>
                    <th className="px-6 py-4">Assign Delivery Partner</th>
                    <th className="px-6 py-4 text-right">Live GPS Map</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                        No orders matching the filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-black text-white text-sm">#{order.id}</div>
                          <div className="text-gray-500 text-[11px] mt-0.5">
                            {new Date(order.date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="font-bold text-white">
                            {order.address.firstName || order.address.name || 'Customer'} {order.address.lastName || ''}
                          </div>
                          <div className="text-gray-400 font-mono text-[11px]">{order.address.phone || order.userEmail || '-'}</div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="max-w-[200px] truncate font-medium text-gray-300" title={order.address.address}>
                            {order.address.address || 'No street address'}
                          </div>
                          <div className="text-gray-500 text-[11px]">{order.address.city} {order.address.zipCode}</div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="font-black text-emerald-400 text-sm">₹{order.total.toFixed(2)}</div>
                          <div className="text-gray-400 text-[11px] max-w-[180px] truncate" title={order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}>
                            {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <select
                              value={order.status}
                              onChange={(e) => onUpdateOrderStatus && onUpdateOrderStatus(order.id, e.target.value)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-black border outline-none cursor-pointer ${getStatusBadge(order.status)}`}
                            >
                              <option className="bg-[#15171e] text-white" value="Pending">Pending (New)</option>
                              <option className="bg-[#15171e] text-white" value="Restaurant Accepted">Restaurant Accepted</option>
                              <option className="bg-[#15171e] text-white" value="Preparing">Preparing in Kitchen</option>
                              <option className="bg-[#15171e] text-white" value="Ready for Pickup">Ready for Pickup</option>
                              <option className="bg-[#15171e] text-white" value="Out for Delivery">Out for Delivery</option>
                              <option className="bg-[#15171e] text-white" value="Delivered">Delivered ✓</option>
                              <option className="bg-[#15171e] text-white" value="Cancelled">Cancelled ✗</option>
                            </select>

                            {/* Quick Accept/Reject shortcut buttons for pending orders */}
                            {order.status === 'Pending' && (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => onUpdateOrderStatus && onUpdateOrderStatus(order.id, 'Restaurant Accepted')}
                                  className="p-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg text-[10px] font-bold border border-emerald-500/30"
                                  title="Accept Order"
                                >
                                  Accept
                                </button>
                                <button
                                  onClick={() => onUpdateOrderStatus && onUpdateOrderStatus(order.id, 'Cancelled')}
                                  className="p-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-[10px] font-bold border border-red-500/30"
                                  title="Reject Order"
                                >
                                  Reject
                                </button>
                              </div>
                            )}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <select
                            value={order.deliveryBoyId || order.deliveryPartner?.id || ''}
                            onChange={(e) => handleAssignRider(order.id, e.target.value)}
                            className="bg-black/40 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-gray-200 font-bold outline-none cursor-pointer"
                          >
                            <option value="">-- Assign Rider --</option>
                            {riders.map(r => (
                              <option key={r.id} value={r.id} className="bg-[#15171e]">
                                {r.name} ({r.vehicleNumber}) - {r.isActive ? '🟢 Active' : '🔴 Offline'}
                              </option>
                            ))}
                          </select>
                        </td>

                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setChatOrder(order)}
                              className="p-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-xl text-xs font-bold border border-blue-500/30 transition-colors"
                              title="Chat with Customer / Rider"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </button>
                            {order.address?.phone && (
                              <button
                                type="button"
                                onClick={() => setCallModalData({
                                  isOpen: true,
                                  targetRole: 'customer',
                                  targetName: `${order.address.firstName || order.address.name || 'Customer'}`,
                                  targetPhone: order.address.phone || '',
                                  orderId: order.id
                                })}
                                className="p-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 rounded-xl text-xs font-bold border border-emerald-500/30 transition-colors"
                                title="Call Customer"
                              >
                                <Phone className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => setTrackingOrder(order)}
                              className="inline-flex items-center gap-1.5 bg-gradient-to-r from-[#E23744] to-orange-500 hover:opacity-90 text-white px-3 py-1.5 rounded-xl text-xs font-black transition-all shadow-md cursor-pointer"
                            >
                              <Bike className="w-3.5 h-3.5" />
                              <span>Track GPS</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: MENU & KITCHEN MANAGEMENT */}
        {activeTab === 'menu' && (
          <div className="space-y-6">
            <div className="bg-[#15171e] rounded-2xl border border-white/10 p-5 flex items-center justify-between flex-wrap gap-4 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="relative w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search menu dishes..."
                    value={menuSearch}
                    onChange={(e) => setMenuSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 outline-none focus:border-[#E23744]"
                  />
                </div>

                <select
                  value={selectedMenuCategory}
                  onChange={(e) => setSelectedMenuCategory(e.target.value)}
                  className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-300 font-bold outline-none cursor-pointer"
                >
                  {['All', 'Pizza', 'Burgers', 'Healthy', 'Drinks', 'Desserts', 'Sushi', 'Pasta', 'Salads', 'Ice Cream'].map(c => (
                    <option key={c} value={c} className="bg-[#15171e]">{c}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400 font-medium">
                  {menuItems.filter(m => m.inStock !== false).length} items in stock
                </span>
                <button
                  type="button"
                  onClick={() => setIsAddDishOpen(true)}
                  className="px-4 py-2 bg-gradient-to-r from-[#E23744] to-orange-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md hover:opacity-90 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add New Dish</span>
                </button>
              </div>
            </div>

            {/* Menu items grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {menuItems
                .filter(item => {
                  const matchSearch = item.name.toLowerCase().includes(menuSearch.toLowerCase());
                  const matchCat = selectedMenuCategory === 'All' || item.category === selectedMenuCategory;
                  return matchSearch && matchCat;
                })
                .map(item => (
                  <div 
                    key={item.id}
                    className={`bg-[#15171e] rounded-2xl border p-4 flex gap-4 items-center transition-all ${
                      item.inStock !== false 
                        ? 'border-white/10 hover:border-white/20' 
                        : 'border-red-500/20 opacity-60 bg-red-950/10'
                    }`}
                  >
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      className="w-16 h-16 rounded-xl object-cover border border-white/10 shrink-0" 
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${item.isVeg ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        <h4 className="font-bold text-sm text-white truncate">{item.name}</h4>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{item.category} • ⭐ {item.rating}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="font-black text-emerald-400 text-sm">₹{item.price}</span>
                        {item.disc ? (
                          <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded font-bold">
                            {item.disc}% OFF
                          </span>
                        ) : null}
                      </div>
                    </div>

                    {/* Stock toggle */}
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          const updated = menuItems.map(m => m.id === item.id ? { ...m, inStock: m.inStock === false } : m);
                          setMenuItems(updated);
                          toast.success(`${item.name} marked ${item.inStock === false ? 'IN STOCK' : 'OUT OF STOCK'}`);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-black tracking-wider transition-all cursor-pointer ${
                          item.inStock !== false
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}
                      >
                        {item.inStock !== false ? 'IN STOCK' : 'OUT OF STOCK'}
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* TAB 2: CUSTOMERS MANAGEMENT */}
        {activeTab === 'customers' && (
          <div className="bg-[#15171e] rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-white/10 flex justify-between items-center flex-wrap gap-4 bg-black/20">
              <div className="relative w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search customer by name, email, phone..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 outline-none focus:border-[#E23744]"
                />
              </div>

              <div className="text-xs font-bold text-gray-400">
                Registered Users: {customers.length}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-black/40 text-gray-400 border-b border-white/10 uppercase tracking-wider font-mono text-[11px]">
                  <tr>
                    <th className="px-6 py-4">Customer Name & Role</th>
                    <th className="px-6 py-4">Contact (Email & Mobile)</th>
                    <th className="px-6 py-4">Saved Delivery Address</th>
                    <th className="px-6 py-4">Registered Date</th>
                    <th className="px-6 py-4">Total Orders</th>
                    <th className="px-6 py-4 text-right">Account Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                        No registered customers found in Firestore database.
                      </td>
                    </tr>
                  ) : (
                    filteredCustomers.map((user) => {
                      const userOrdersCount = orders.filter(o => o.userId === user.id || o.userEmail === user.email).length;
                      return (
                        <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-bold text-white text-sm flex items-center gap-2">
                              <span>{user.name || 'Unnamed User'}</span>
                              {user.role === 'admin' && (
                                <span className="bg-red-500/20 text-[#E23744] text-[10px] font-black px-2 py-0.5 rounded-full border border-red-500/30">
                                  ADMIN
                                </span>
                              )}
                              {user.blocked && (
                                <span className="bg-red-500/20 text-red-400 text-[10px] font-black px-2 py-0.5 rounded-full border border-red-500/30">
                                  BLOCKED
                                </span>
                              )}
                            </div>
                            <div className="text-gray-500 text-[10px] font-mono">UID: {user.id.slice(0, 10)}...</div>
                          </td>

                          <td className="px-6 py-4">
                            <div className="text-white font-medium">{user.email}</div>
                            <div className="text-gray-400 font-mono mt-0.5">{user.phone || 'No phone'}</div>
                          </td>

                          <td className="px-6 py-4">
                            <div className="max-w-[220px] truncate text-gray-300" title={user.address}>
                              {user.address || 'No saved address'}
                            </div>
                            <div className="text-gray-500 text-[11px]">{user.city || '-'} {user.pincode || ''}</div>
                          </td>

                          <td className="px-6 py-4 text-gray-400 font-mono">
                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Active Member'}
                          </td>

                          <td className="px-6 py-4">
                            <span className="bg-white/10 text-white font-black px-2.5 py-1 rounded-lg text-xs">
                              {userOrdersCount} Orders
                            </span>
                          </td>

                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => handleToggleCustomerBlock(user.id, user.blocked)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                user.blocked
                                  ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30'
                                  : 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30'
                              }`}
                            >
                              {user.blocked ? 'Unblock User' : 'Block User'}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: DELIVERY BOYS MANAGEMENT */}
        {activeTab === 'riders' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div>
                <h2 className="text-lg font-black text-white">Delivery Fleet & Riders</h2>
                <p className="text-xs text-gray-400">Manage delivery boy accounts, assign orders, and monitor real-time delivery status</p>
              </div>

              <button
                onClick={() => setIsAddRiderOpen(true)}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-[#E23744] to-orange-500 text-white font-black px-4 py-2.5 rounded-xl text-xs shadow-lg hover:opacity-90 active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Delivery Boy</span>
              </button>
            </div>

            {/* Riders Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {riders.map((rider) => {
                const assignedDeliveries = orders.filter(o => (o.deliveryBoyId === rider.id || o.deliveryPartner?.id === rider.id) && o.status !== 'Delivered' && o.status !== 'Cancelled');
                return (
                  <div key={rider.id} className="bg-[#15171e] rounded-2xl border border-white/10 p-5 space-y-4 shadow-xl relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img 
                          src={rider.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop'} 
                          alt={rider.name}
                          className="w-12 h-12 rounded-xl object-cover border border-white/10"
                        />
                        <div>
                          <h3 className="font-bold text-white text-sm">{rider.name}</h3>
                          <p className="text-xs text-gray-400 font-mono">{rider.phone}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleToggleRiderActive(rider.id!, rider.isActive ?? true)}
                        className={`text-[10px] font-black px-2.5 py-1 rounded-full border transition-all ${
                          rider.isActive !== false
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            : 'bg-red-500/20 text-red-400 border-red-500/30'
                        }`}
                      >
                        {rider.isActive !== false ? '🟢 ACTIVE' : '🔴 OFFLINE'}
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs bg-black/30 p-3 rounded-xl border border-white/5 font-mono">
                      <div>
                        <span className="text-gray-500 block text-[10px]">VEHICLE</span>
                        <span className="text-white font-bold">{rider.vehicleNumber}</span>
                        <span className="text-gray-400 block text-[10px] uppercase">({rider.vehicleType})</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block text-[10px]">RIDER RATING</span>
                        <span className="text-amber-400 font-bold">⭐ {rider.rating}</span>
                        <span className="text-gray-400 block text-[10px]">{rider.totalDeliveries || 100}+ delivered</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
                      <span className="text-gray-400">
                        Active Tasks: <strong className="text-white">{assignedDeliveries.length}</strong>
                      </span>

                      <a
                        href={`tel:${rider.phone}`}
                        className="inline-flex items-center gap-1 text-[#E23744] hover:underline font-bold text-xs"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Call Rider</span>
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: KITCHEN & STORE GPS SETTINGS */}
        {activeTab === 'kitchen' && (
          <Suspense fallback={
            <div className="w-full h-80 bg-[#15171e] rounded-2xl flex flex-col items-center justify-center border border-white/10 gap-3">
              <RefreshCw className="w-8 h-8 text-[#E23744] animate-spin" />
              <p className="text-xs font-bold text-gray-400">Loading Kitchen GPS Settings...</p>
            </div>
          }>
            <KitchenLocationManager />
          </Suspense>
        )}

      </div>

      {/* Add Rider Modal */}
      {isAddRiderOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#15171e] rounded-3xl max-w-md w-full p-6 relative border border-white/10 shadow-2xl space-y-5">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-[#E23744]/20 text-[#E23744] flex items-center justify-center font-bold">
                  <Bike className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Register Delivery Boy</h3>
                  <p className="text-xs text-gray-400">Add a new partner to the delivery fleet</p>
                </div>
              </div>

              <button
                onClick={() => setIsAddRiderOpen(false)}
                className="p-1.5 text-gray-400 hover:text-white rounded-full bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddRider} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-300 font-bold mb-1.5">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Suresh Verma"
                  value={newRiderName}
                  onChange={(e) => setNewRiderName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white outline-none focus:border-[#E23744]"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-bold mb-1.5">Mobile Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98765 43210"
                  value={newRiderPhone}
                  onChange={(e) => setNewRiderPhone(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white outline-none font-mono focus:border-[#E23744]"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-bold mb-1.5">Vehicle Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. DL 01 AB 1234"
                  value={newRiderVehicle}
                  onChange={(e) => setNewRiderVehicle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white outline-none font-mono uppercase focus:border-[#E23744]"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-bold mb-1.5">Vehicle Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['bike', 'scooter', 'ev'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setNewRiderType(type)}
                      className={`py-2 rounded-xl border text-center font-bold capitalize transition-all ${
                        newRiderType === type
                          ? 'bg-[#E23744] text-white border-[#E23744]'
                          : 'bg-white/5 text-gray-400 border-white/10 hover:text-white'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-[#E23744] to-orange-500 text-white font-black rounded-xl text-sm shadow-lg hover:opacity-90 active:scale-95 transition-all"
                >
                  Create Delivery Boy Account →
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Live Map & Driver Simulation Modal */}
      {trackingOrder && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#15171e] rounded-3xl max-w-6xl w-full p-6 relative border border-white/10 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-bold text-white">
                  Live GPS Tracking & Driver Simulation
                </h3>
                <p className="text-xs text-gray-400">Order #{trackingOrder.id} • Customer: {trackingOrder.address.firstName || 'Customer'}</p>
              </div>
              <button
                onClick={() => setTrackingOrder(null)}
                className="p-2 text-gray-400 hover:text-white bg-white/10 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <LiveTrackingMap
              order={trackingOrder}
              isAdmin={true}
              onUpdateStatus={(status) => {
                if (onUpdateOrderStatus) onUpdateOrderStatus(trackingOrder.id, status);
                setTrackingOrder((prev) => (prev ? { ...prev, status } : null));
              }}
              onClose={() => setTrackingOrder(null)}
            />
          </div>
        </div>
      )}

      {/* Add New Dish Modal */}
      {isAddDishOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#15171e] rounded-3xl max-w-md w-full p-6 border border-white/10 shadow-2xl">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-white/10">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Utensils className="w-5 h-5 text-[#E23744]" />
                Add New Kitchen Dish
              </h3>
              <button 
                onClick={() => setIsAddDishOpen(false)}
                className="p-1.5 text-gray-400 hover:text-white bg-white/5 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newDishName.trim() || !newDishPrice) {
                  toast.error('Please enter dish name and price');
                  return;
                }
                const newDish: Product & { inStock?: boolean } = {
                  id: Date.now(),
                  name: newDishName.trim(),
                  price: parseFloat(newDishPrice),
                  category: newDishCategory,
                  isVeg: newDishIsVeg,
                  rating: 4.8,
                  image: newDishImage.trim() || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=340&h=340&q=75',
                  inStock: true
                };
                setMenuItems(prev => [newDish, ...prev]);
                setIsAddDishOpen(false);
                setNewDishName('');
                setNewDishPrice('');
                setNewDishImage('');
                toast.success(`${newDish.name} added to restaurant menu! 🍲`);
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="block text-gray-400 font-bold mb-1">Dish Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Paneer Butter Masala"
                  value={newDishName}
                  onChange={(e) => setNewDishName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-white outline-none focus:border-[#E23744]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 font-bold mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="299"
                    value={newDishPrice}
                    onChange={(e) => setNewDishPrice(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-white outline-none focus:border-[#E23744]"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 font-bold mb-1">Category</label>
                  <select
                    value={newDishCategory}
                    onChange={(e) => setNewDishCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-white outline-none"
                  >
                    {['Pizza', 'Burgers', 'Healthy', 'Drinks', 'Desserts', 'Sushi', 'Pasta', 'Salads', 'Ice Cream'].map(c => (
                      <option key={c} value={c} className="bg-[#15171e]">{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-gray-400 font-bold mb-1">Dish Image URL</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={newDishImage}
                  onChange={(e) => setNewDishImage(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-white outline-none focus:border-[#E23744]"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <label className="text-gray-300 font-bold">Food Type:</label>
                <button
                  type="button"
                  onClick={() => setNewDishIsVeg(true)}
                  className={`px-3 py-1.5 rounded-lg font-bold border transition-all ${
                    newDishIsVeg 
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' 
                      : 'bg-white/5 text-gray-400 border-white/10'
                  }`}
                >
                  🟢 Pure Veg
                </button>
                <button
                  type="button"
                  onClick={() => setNewDishIsVeg(false)}
                  className={`px-3 py-1.5 rounded-lg font-bold border transition-all ${
                    !newDishIsVeg 
                      ? 'bg-red-500/20 text-red-400 border-red-500/40' 
                      : 'bg-white/5 text-gray-400 border-white/10'
                  }`}
                >
                  🔴 Non-Veg
                </button>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-[#E23744] to-orange-500 text-white font-black rounded-xl text-sm shadow-lg hover:opacity-90 transition-all cursor-pointer"
                >
                  Add Dish to Menu →
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Real-time Order Chat Modal */}
      {chatOrder && (
        <Suspense fallback={null}>
          <OrderChatModal
            order={chatOrder}
            currentUserRole="restaurant"
            currentUserId={auth.currentUser?.uid || 'admin-uid'}
            currentUserName={auth.currentUser?.displayName || 'M-Bites Kitchen'}
            onClose={() => setChatOrder(null)}
            onInitiateCall={(role, phone, name) => {
              setCallModalData({
                isOpen: true,
                targetRole: role,
                targetName: name,
                targetPhone: phone,
                orderId: chatOrder.id
              });
            }}
          />
        </Suspense>
      )}

      {/* Secure Call Modal */}
      {callModalData.isOpen && (
        <Suspense fallback={null}>
          <CallModal
            isOpen={callModalData.isOpen}
            onClose={() => setCallModalData(prev => ({ ...prev, isOpen: false }))}
            targetRole={callModalData.targetRole}
            targetName={callModalData.targetName}
            targetPhone={callModalData.targetPhone}
            orderId={callModalData.orderId}
          />
        </Suspense>
      )}

      {/* Real-time Order GPS Live Tracking Modal for Admin */}
      {trackingOrder && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-[#15171e] rounded-3xl max-w-6xl w-full p-6 relative border border-white/10 shadow-2xl space-y-4 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#E23744] to-orange-500 flex items-center justify-center text-white shadow-lg">
                  <Bike className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-white text-base">
                    Live GPS Telemetry • Order #{trackingOrder.id}
                  </h3>
                  <p className="text-xs text-gray-400">
                    Customer: {trackingOrder.address.firstName || 'Customer'} • Rider: {trackingOrder.deliveryPartner?.name || 'Assigned Rider'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setTrackingOrder(null)}
                className="p-2 text-gray-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <Suspense fallback={
              <div className="w-full h-96 bg-[#15171e] rounded-2xl flex flex-col items-center justify-center border border-white/10 gap-3">
                <RefreshCw className="w-8 h-8 text-[#E23744] animate-spin" />
                <p className="text-xs font-bold text-gray-400">Loading GPS Map View...</p>
              </div>
            }>
              <LiveTrackingMap
                order={trackingOrder}
                isAdmin={true}
                onUpdateStatus={(status) => {
                  if (onUpdateOrderStatus) {
                    onUpdateOrderStatus(trackingOrder.id, status);
                  }
                }}
                onClose={() => setTrackingOrder(null)}
              />
            </Suspense>
          </div>
        </div>
      )}
    </div>
  );
}
