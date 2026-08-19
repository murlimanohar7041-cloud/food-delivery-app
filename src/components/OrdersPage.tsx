import React, { useState, useMemo, useEffect } from 'react';
import {
  ArrowLeft,
  Search,
  Filter,
  ChevronRight,
  Package,
  Truck,
  CheckCircle2,
  ChevronDown,
  MapPin,
  Clock,
  Star,
  HelpCircle,
  FileText,
  Navigation,
  Radio,
  Bike,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import InvoiceModal from './InvoiceModal';
import LiveTrackingMap from './LiveTrackingMap';
import { Order, OrderStatus } from '../types';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { toast } from 'react-hot-toast';

interface OrdersPageProps {
  orders: Order[];
  onBack: () => void;
  isAdmin?: boolean;
  onReorder?: (items: any[]) => void;
}

const ORDER_FILTERS = ['All', 'On the way', 'Delivered', 'Cancelled'];
const TIME_FILTERS = ['Anytime', 'Last 30 days', '2025', '2024'];

export default function OrdersPage({ orders, onBack, isAdmin, onReorder }: OrdersPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [timeFilter, setTimeFilter] = useState('Anytime');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  // Filter logic
  const filteredOrders = useMemo(() => {
    return orders
      .filter((order) => {
        const matchesSearch =
          order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          order.items.some((item) =>
            item.name.toLowerCase().includes(searchQuery.toLowerCase())
          );

        const matchesStatus =
          activeFilter === 'All' ||
          (activeFilter === 'On the way' &&
            [
              'Pending',
              'Restaurant Accepted',
              'Preparing',
              'Ready for Pickup',
              'Out for Delivery'
            ].includes(order.status)) ||
          (activeFilter === 'Delivered' && order.status === 'Delivered') ||
          (activeFilter === 'Cancelled' && order.status === 'Cancelled');

        return matchesSearch && matchesStatus;
      })
      .sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
  }, [orders, searchQuery, activeFilter]);

  const selectedOrder = useMemo(
    () => orders.find((o) => o.id === selectedOrderId),
    [orders, selectedOrderId]
  );

  if (selectedOrderId && selectedOrder) {
    return (
      <OrderDetailView
        order={selectedOrder}
        isAdmin={isAdmin}
        onBack={() => setSelectedOrderId(null)}
        onReorder={onReorder}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#f1f3f6] dark:bg-[#0a0a0a] pb-20 text-gray-900 dark:text-gray-100">
      {/* Header */}
      <div className="bg-white dark:bg-[#141414] border-b border-gray-200 dark:border-white/10 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 -ml-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold">My Orders</h1>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search your orders here"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-[#f0f2f5] dark:bg-white/5 border-none rounded-lg w-80 text-sm focus:ring-1 focus:ring-[#2874f0] outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      <div className={`max-w-7xl mx-auto px-0 sm:px-4 py-0 sm:py-6 ${isAdmin ? 'lg:flex gap-6' : ''}`}>
        {/* Filters Sidebar (Desktop) - ONLY FOR ADMIN */}
        {isAdmin && (
          <div className="hidden lg:block w-72 shrink-0">
            <div className="bg-white dark:bg-[#141414] rounded-xl shadow-sm overflow-hidden sticky top-24 border border-gray-200 dark:border-white/5">
              <div className="p-4 border-b border-gray-100 dark:border-white/5 font-bold flex items-center justify-between">
                <span className="text-lg">Filters</span>
              </div>

              <div className="p-4 space-y-8">
                <div>
                  <p className="text-xs font-bold uppercase text-gray-400 mb-4 tracking-widest">
                    Order Status
                  </p>
                  <div className="space-y-3">
                    {ORDER_FILTERS.map((f) => (
                      <label key={f} className="flex items-center gap-3 cursor-pointer group">
                        <div
                          className={`w-4 h-4 rounded-sm border transition-all flex items-center justify-center ${
                            activeFilter === f
                              ? 'bg-[#2874f0] border-[#2874f0]'
                              : 'border-gray-300 dark:border-gray-600 group-hover:border-gray-400'
                          }`}
                        >
                          {activeFilter === f && (
                            <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                          )}
                        </div>
                        <input
                          type="radio"
                          name="status"
                          className="hidden"
                          checked={activeFilter === f}
                          onChange={() => setActiveFilter(f)}
                        />
                        <span
                          className={`text-sm ${
                            activeFilter === f
                              ? 'text-gray-900 dark:text-white font-bold'
                              : 'text-gray-600 dark:text-gray-400'
                          }`}
                        >
                          {f}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase text-gray-400 mb-4 tracking-widest">
                    Order Time
                  </p>
                  <div className="space-y-3">
                    {TIME_FILTERS.map((f) => (
                      <label key={f} className="flex items-center gap-3 cursor-pointer group">
                        <div
                          className={`w-4 h-4 rounded-sm border transition-all flex items-center justify-center ${
                            timeFilter === f
                              ? 'bg-[#2874f0] border-[#2874f0]'
                              : 'border-gray-300 dark:border-gray-600 group-hover:border-gray-400'
                          }`}
                        >
                          {timeFilter === f && (
                            <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                          )}
                        </div>
                        <input
                          type="radio"
                          name="time"
                          className="hidden"
                          checked={timeFilter === f}
                          onChange={() => setTimeFilter(f)}
                        />
                        <span
                          className={`text-sm ${
                            timeFilter === f
                              ? 'text-gray-900 dark:text-white font-bold'
                              : 'text-gray-600 dark:text-gray-400'
                          }`}
                        >
                          {f}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Orders List */}
        <div className="flex-1 space-y-3 sm:space-y-4">
          {filteredOrders.length === 0 ? (
            <div className="bg-white dark:bg-[#141414] rounded-2xl p-12 text-center shadow-sm border border-gray-200 dark:border-white/5">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-1">No orders found</h3>
              <p className="text-gray-500">Try adjusting your filters or search query</p>
            </div>
          ) : (
            filteredOrders.map((order) => (
              <div key={order.id}>
                <OrderCard order={order} onClick={() => setSelectedOrderId(order.id)} />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

interface OrderCardProps {
  order: Order;
  onClick: () => void;
}

function OrderCard({ order, onClick }: OrderCardProps) {
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'Delivered':
        return { label: 'Delivered', color: 'text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500' };
      case 'Cancelled':
        return { label: 'Cancelled', color: 'text-red-600 dark:text-red-400', dot: 'bg-red-500' };
      case 'Pending':
        return { label: 'Order Placed', color: 'text-orange-500', dot: 'bg-orange-500' };
      case 'Restaurant Accepted':
        return { label: 'Accepted', color: 'text-blue-500', dot: 'bg-blue-500' };
      case 'Preparing':
        return { label: 'Preparing', color: 'text-yellow-600 dark:text-yellow-500', dot: 'bg-yellow-500' };
      case 'Ready for Pickup':
        return { label: 'Ready for Pickup', color: 'text-purple-600 dark:text-purple-400', dot: 'bg-purple-500' };
      case 'Out for Delivery':
        return { label: 'Out for Delivery', color: 'text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500' };
      default:
        return { label: status, color: 'text-blue-600', dot: 'bg-blue-500' };
    }
  };

  const getStatusDateText = (status: string) => {
    switch (status) {
      case 'Delivered':
        return 'Delivered on';
      case 'Cancelled':
        return 'Cancelled on';
      default:
        return 'Arriving by';
    }
  };

  const isLiveActive = [
    'Pending',
    'Restaurant Accepted',
    'Preparing',
    'Ready for Pickup',
    'Out for Delivery'
  ].includes(order.status);

  const status = getStatusDisplay(order.status);

  return (
    <motion.div
      onClick={onClick}
      className="bg-white dark:bg-[#141414] sm:rounded-2xl border-b sm:border border-gray-200 dark:border-white/5 p-4 sm:p-6 transition-all hover:shadow-md cursor-pointer group"
    >
      <div className="flex gap-4 sm:gap-6 items-center">
        {/* Left: Product Image */}
        <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 bg-gray-50 dark:bg-white/5 rounded-xl overflow-hidden flex items-center justify-center p-2 border border-gray-100 dark:border-white/10">
          {order.items[0]?.image ? (
            <img
              src={order.items[0].image}
              alt={order.items[0].name}
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            <Package className="w-8 h-8 text-gray-300" />
          )}
        </div>

        {/* Middle: Info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col lg:flex-row lg:justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white truncate group-hover:text-[#2874f0] transition-colors mb-1">
                {order.items.map((i) => i.name).join(', ')}
              </h3>
              <p className="text-[11px] text-gray-400 font-medium mb-2 tracking-wide">
                ID: #{order.id}
              </p>
              <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-gray-500">
                <span className="text-gray-900 dark:text-white">₹{order.total.toFixed(2)}</span>
                <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                <span>{order.items.reduce((a, b) => a + b.quantity, 0)} Items</span>
              </div>
            </div>

            <div className="lg:w-64 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <div
                    className={`w-2.5 h-2.5 rounded-full ${status.dot} ${
                      isLiveActive ? 'animate-ping' : ''
                    }`}
                  ></div>
                  <span className={`text-sm font-black ${status.color}`}>
                    {status.label} •{' '}
                    {new Date(order.date).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short'
                    })}
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 font-medium">
                  {order.address?.city || 'Delivery Address'}
                </p>
              </div>

              {/* Action */}
              <div className="mt-3 flex items-center gap-2">
                {isLiveActive ? (
                  <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold px-3 py-1 rounded-full border border-emerald-500/20 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                    <Bike className="w-3.5 h-3.5" />
                    Track Live on Map →
                  </span>
                ) : (
                  <span className="text-[11px] font-black text-[#2874f0] hover:underline uppercase tracking-wider">
                    View Details →
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="hidden sm:flex items-center">
          <ChevronRight className="w-5 h-5 text-gray-300 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </motion.div>
  );
}

function OrderDetailView({
  order,
  isAdmin = false,
  onBack,
  onReorder
}: {
  order: Order;
  isAdmin?: boolean;
  onBack: () => void;
  onReorder?: (items: any[]) => void;
}) {
  const [showInvoice, setShowInvoice] = useState(false);
  const [activeTab, setActiveTab] = useState<'map' | 'details'>('map');

  const handleUpdateStatus = async (newStatus: OrderStatus) => {
    try {
      await updateDoc(doc(db, 'orders', order.id), {
        status: newStatus
      });
      toast.success(`Order status updated to ${newStatus}`);
    } catch (e: any) {
      toast.error('Failed to update status');
    }
  };

  const handleReorderClick = () => {
    if (onReorder) {
      onReorder(order.items);
      toast.success('Items added to cart! Proceed to checkout.', { icon: '🛒' });
    }
  };

  return (
    <div className="min-h-screen bg-[#f1f3f6] dark:bg-[#0a0a0a] pb-20">
      {/* Top Header */}
      <div className="bg-white dark:bg-[#141414] sticky top-0 z-50 border-b border-gray-200 dark:border-white/5 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 -ml-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Order Tracking</h2>
              <p className="text-xs text-gray-500">ID: #{order.id}</p>
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-gray-100 dark:bg-white/5 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('map')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                activeTab === 'map'
                  ? 'bg-white dark:bg-[#252525] shadow text-black dark:text-white'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Navigation className="w-3.5 h-3.5 text-emerald-500" />
              <span>Live Map</span>
            </button>
            <button
              onClick={() => setActiveTab('details')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                activeTab === 'details'
                  ? 'bg-white dark:bg-[#252525] shadow text-black dark:text-white'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Items & Invoice</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Main View: Live GPS Map Component */}
        {activeTab === 'map' ? (
          <LiveTrackingMap
            order={order}
            isAdmin={isAdmin}
            onUpdateStatus={handleUpdateStatus}
            onClose={onBack}
          />
        ) : null}

        {/* Detailed Address & Items breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Delivery Address Card */}
          <div className="bg-white dark:bg-[#141414] p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-white/5 space-y-4">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                Delivery Address
              </p>
              <p className="text-sm font-bold text-gray-900 dark:text-white">
                {order.address.firstName || order.address.name || 'Customer'}{' '}
                {order.address.lastName || ''}
              </p>
              <div className="text-xs text-gray-500 leading-relaxed mt-1">
                {order.address.flat ? `${order.address.flat}, ` : ''}
                {order.address.address}
                <br /> {order.address.city}, {order.address.zipCode}
              </div>
              <div className="mt-3 flex items-center gap-2">
                <p className="text-[11px] font-black text-gray-700 dark:text-gray-300">
                  Phone:
                </p>
                <p className="text-xs text-gray-500">{order.address.phone || 'N/A'}</p>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 dark:border-white/5">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
                Payment Method
              </p>
              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                {order.paymentMethod}
              </p>
            </div>
          </div>

          {/* Items Breakdown Card */}
          <div className="lg:col-span-2 bg-white dark:bg-[#141414] rounded-2xl shadow-sm border border-gray-200 dark:border-white/5 overflow-hidden flex flex-col justify-between">
            <div>
              <div className="p-4 border-b border-gray-100 dark:border-white/5 font-bold text-xs uppercase tracking-widest text-gray-400 flex items-center justify-between">
                <span>Items ({order.items.length})</span>
                <span>Subtotal</span>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-white/5 max-h-64 overflow-y-auto">
                {order.items.map((item, idx) => (
                  <div key={idx} className="p-4 flex gap-4 items-center">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-14 h-14 object-cover bg-gray-50 dark:bg-white/5 p-1 rounded-xl border border-gray-100 dark:border-white/10"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                        {item.name}
                      </h4>
                      <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                      ₹{(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-[#101010] border-t border-gray-100 dark:border-white/5 flex flex-wrap justify-between items-center gap-4">
              <div>
                <p className="text-xs text-gray-400">Total Paid</p>
                <p className="text-lg font-black text-gray-900 dark:text-white">
                  ₹{order.total.toFixed(2)}
                </p>
              </div>

              <div className="flex flex-wrap gap-2.5">
                {/* Cancel Order button if order state allows */}
                {['Pending', 'Restaurant Accepted'].includes(order.status) && (
                  <button
                    onClick={async () => {
                      if (window.confirm('Are you sure you want to cancel this order?')) {
                        try {
                          await updateDoc(doc(db, 'orders', order.id), {
                            status: 'Cancelled',
                            cancelReason: 'Cancelled by customer request',
                            updatedAt: new Date().toISOString()
                          });
                          toast.success('Order cancelled successfully.');
                        } catch (err: any) {
                          toast.error('Could not cancel order: ' + err.message);
                        }
                      }
                    }}
                    className="px-4 py-2 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20 rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors cursor-pointer"
                  >
                    Cancel Order
                  </button>
                )}

                {onReorder && (
                  <button
                    onClick={handleReorderClick}
                    className="px-4 py-2 bg-[#E23744]/10 text-[#E23744] border border-[#E23744]/30 rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-[#E23744]/20 transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Reorder Items
                  </button>
                )}

                <button
                  onClick={() => setShowInvoice(true)}
                  className="px-4 py-2 bg-blue-50 dark:bg-blue-500/10 text-[#2874f0] border border-blue-200 dark:border-blue-500/20 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  Invoice
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <InvoiceModal
        show={showInvoice}
        onClose={() => setShowInvoice(false)}
        order={order}
      />
    </div>
  );
}
