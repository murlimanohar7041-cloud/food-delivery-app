import React, { useState, useEffect } from 'react';
import { getFallbackImage } from '../utils/fallbackImage';
import { ArrowLeft, MapPin, CreditCard, Smartphone, Banknote, ChevronRight, ShieldCheck, Copy, CheckCircle2, QrCode, Scan, Camera, Search, X, Locate, Navigation, Loader2, Lock, UserCheck } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';
import { getUserCurrentLocation } from '../utils/geoUtils';
import { LocationCoords, UserProfile } from '../types';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { User } from 'firebase/auth';

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  isVeg: boolean;
  image?: string;
}

interface Address {
  firstName: string;
  lastName: string;
  email: string;
  address: string;
  city: string;
  zipCode: string;
  phone?: string;
}

interface CheckoutPageProps {
  cartItems: CartItem[];
  currentUser?: User | null;
  onBack: () => void;
  onRequireAuth?: () => void;
  onPlaceOrder: (orderData: { 
    items: CartItem[]; 
    total: number; 
    address: Address; 
    paymentMethod: string;
    customerLocation?: LocationCoords;
  }) => void;
}

const UPI_APPS = [
  { name: 'PhonePe', id: 'phonepe', upi: '9122993866@ybl', color: '#5f259f', logo: 'https://upload.wikimedia.org/wikipedia/commons/7/71/PhonePe_Logo.svg' },
  { name: 'Google Pay', id: 'gpay', upi: 'murlimanohar7041@okhdfcbank', color: '#4285f4', logo: 'https://cdn.iconscout.com/icon/free/png-512/free-google-pay-2038779-1721670.png' },
  { name: 'Paytm', id: 'paytm', upi: '9122993866@pthdfc', color: '#002970', logo: 'https://upload.wikimedia.org/wikipedia/commons/2/24/Paytm_Logo_%28standalone%29.svg' },
  { name: 'Navi', id: 'navi', upi: '9122993866@nyes', color: '#01bd70', logo: 'https://res.cloudinary.com/dcbcegqox/image/upload/v1713713837/Navi_w80yln.png' }
];

const ALL_BANKS = [
  { id: 'sbi', name: 'State Bank of India (SBI)' },
  { id: 'hdfc', name: 'HDFC Bank' },
  { id: 'icici', name: 'ICICI Bank' },
  { id: 'axis', name: 'Axis Bank' },
  { id: 'kotak', name: 'Kotak Mahindra Bank' },
  { id: 'pnb', name: 'Punjab National Bank' },
  { id: 'bob', name: 'Bank of Baroda' },
  { id: 'canara', name: 'Canara Bank' },
  { id: 'union', name: 'Union Bank of India' },
  { id: 'yes', name: 'Yes Bank' },
  { id: 'indusind', name: 'IndusInd Bank' },
  { id: 'idfc', name: 'IDFC First Bank' },
  { id: 'hsbc', name: 'HSBC Bank' },
  { id: 'scb', name: 'Standard Chartered' }
];

const EMI_BANKS = [
  { id: 'hdfc-cc', name: 'HDFC Bank Credit Card' },
  { id: 'icici-cc', name: 'ICICI Bank Credit Card' },
  { id: 'axis-cc', name: 'Axis Bank Credit Card' },
  { id: 'sbi-cc', name: 'SBI Credit Card' },
  { id: 'kotak-cc', name: 'Kotak Mahindra Bank Credit Card' },
  { id: 'amex', name: 'American Express' },
  { id: 'scb-cc', name: 'Standard Chartered Credit Card' },
  { id: 'hsbc-cc', name: 'HSBC Credit Card' },
  { id: 'rbl-cc', name: 'RBL Bank Credit Card' },
  { id: 'yes-cc', name: 'Yes Bank Credit Card' }
];

export default function CheckoutPage({ 
  cartItems, 
  currentUser = auth.currentUser, 
  onBack, 
  onRequireAuth, 
  onPlaceOrder 
}: CheckoutPageProps) {
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cod'>('online');
  const [onlineMethod, setOnlineMethod] = useState<'upi' | 'card' | 'netbanking' | 'emi'>('upi');
  const [selectedUpiApp, setSelectedUpiApp] = useState(UPI_APPS[0]);
  const [isCopied, setIsCopied] = useState(false);
  
  // Extra states for full payment UI
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [selectedBank, setSelectedBank] = useState('');
  const [bankSearchQuery, setBankSearchQuery] = useState('');
  const [selectedEmiBank, setSelectedEmiBank] = useState('');
  const [emiSearchQuery, setEmiSearchQuery] = useState('');
  const [emiDuration, setEmiDuration] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [customerLocation, setCustomerLocation] = useState<LocationCoords | null>(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  // Auto-populate from currentUser profile in Firestore
  useEffect(() => {
    const user = currentUser || auth.currentUser;
    if (user) {
      if (user.displayName) {
        const parts = user.displayName.split(' ');
        setFirstName(parts[0] || '');
        setLastName(parts.slice(1).join(' ') || '');
      }
      if (user.email) {
        setEmail(user.email);
      }

      // Fetch saved address from Firestore
      const fetchProfile = async () => {
        try {
          const docSnap = await getDoc(doc(db, 'users', user.uid));
          if (docSnap.exists()) {
            const data = docSnap.data() as UserProfile;
            if (data.address && !address) setAddress(data.address);
            if (data.city && !city) setCity(data.city);
            if (data.pincode && !zipCode) setZipCode(data.pincode);
            if (data.phone && !phone) setPhone(data.phone);
            if (data.location && !customerLocation) setCustomerLocation(data.location);
          }
        } catch (e) {
          console.error('Error fetching user profile for checkout:', e);
        }
      };
      fetchProfile();
    }
  }, [currentUser]);

  const handleDetectLocation = async () => {
    setIsDetectingLocation(true);
    toast.loading('Detecting your live location...', { id: 'loc-toast' });
    try {
      const res = await getUserCurrentLocation();
      toast.dismiss('loc-toast');
      if (res.coords) {
        setCustomerLocation(res.coords);
        if (!city) setCity('Current Location');
        if (!address) setAddress(`Lat: ${res.coords.lat.toFixed(4)}, Lng: ${res.coords.lng.toFixed(4)}`);
        toast.success('Live GPS location detected successfully! 📍');
      } else if (res.error) {
        toast.error(res.error, { duration: 4000 });
      }
    } catch (e: any) {
      toast.dismiss('loc-toast');
      toast.error('Could not detect location. Please enter manually.');
    } finally {
      setIsDetectingLocation(false);
    }
  };

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = subtotal > 0 ? 40 : 0;
  const taxes = subtotal * 0.08;
  const total = subtotal + deliveryFee + taxes;

  const startCamera = async () => {
    setIsScanning(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      toast.error('Unable to access camera.');
      setIsScanning(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
    }
    setIsScanning(false);
  };

  const captureCard = () => {
    toast.loading('Scanning card...', { id: 'scan-toast' });
    setTimeout(() => {
      stopCamera();
      // Simulating successful scan for UI Prototype
      toast.dismiss('scan-toast');
      toast.success('Card scanned successfully!');
      setCardNumber('4532015390021104');
      setCardExpiry('12/28');
      setCardName(firstName ? `${firstName} ${lastName}`.trim() : 'Test User');
    }, 1500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Strict authentication check
    const activeUser = currentUser || auth.currentUser;
    if (!activeUser) {
      toast.error('Please Register/Login to Place Your Order', {
        duration: 5000,
        icon: '🔒'
      });
      if (onRequireAuth) {
        onRequireAuth();
      }
      return;
    }

    if (!address.trim()) {
      toast.error('Please provide a delivery address');
      return;
    }
    
    let finalPaymentMethod = 'Cash on Delivery';
    if (paymentMethod === 'online') {
      if (onlineMethod === 'upi') {
        finalPaymentMethod = `Online Payment (${selectedUpiApp.name} UPI)`;
      } else if (onlineMethod === 'card') {
        finalPaymentMethod = `Credit/Debit Card (${cardNumber.slice(-4)})`;
      } else if (onlineMethod === 'netbanking') {
        finalPaymentMethod = `Net Banking (${selectedBank || 'Other'})`;
      } else if (onlineMethod === 'emi') {
        finalPaymentMethod = `EMI (${selectedEmiBank} - ${emiDuration}M)`;
      } else {
        finalPaymentMethod = `Online Payment (${onlineMethod.toUpperCase()})`;
      }
    }

    const formData = new FormData();
    formData.append('First Name', firstName);
    formData.append('Last Name', lastName);
    formData.append('Email', email || activeUser.email || '');
    formData.append('Address', address);
    formData.append('City', city);
    formData.append('Zip Code', zipCode);
    formData.append('Phone', phone);
    formData.append('Product Name', cartItems.map(item => `${item.quantity}x ${item.name}`).join(', '));
    formData.append('Total Amount', total.toFixed(2));

    onPlaceOrder({
      items: [...cartItems],
      total: total,
      address: { firstName, lastName, email: email || activeUser.email || '', address, city, zipCode, phone },
      paymentMethod: finalPaymentMethod,
      customerLocation: customerLocation || undefined
    });
  };

  const copyUpiId = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(selectedUpiApp.upi);
    setIsCopied(true);
    toast.success('UPI ID copied to clipboard');
    setTimeout(() => setIsCopied(false), 2000);
  };

  const activeUser = currentUser || auth.currentUser;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] pb-20 md:pb-10 text-gray-900 dark:text-gray-100 transition-colors">
      {/* Header */}
      <div className="bg-white dark:bg-[#141414] border-b border-gray-200 dark:border-white/10 sticky top-0 z-40 shadow-sm dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 -ml-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Secure Checkout</h1>
          </div>
          
          {activeUser ? (
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
              <UserCheck className="w-4 h-4" />
              <span>Logged in as {activeUser.displayName || activeUser.email?.split('@')[0]}</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={onRequireAuth}
              className="text-xs font-bold text-[#E23744] hover:bg-red-500/10 px-3 py-1.5 rounded-full border border-red-500/30 transition-all"
            >
              Login / Register
            </button>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Guest Warning Banner if not logged in */}
        {!activeUser && (
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-red-500/10 via-orange-500/10 to-transparent border border-red-500/30 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 text-[#E23744] flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                  Registration / Login Required to Order
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Please login or create an account to save your address and enable live delivery tracking.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onRequireAuth}
              className="px-4 py-2 bg-gradient-to-r from-[#E23744] to-[#FF5E5E] text-white rounded-xl text-xs font-black shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              Register / Login to Order →
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-8">
          
          {/* Left Column: Form & Payment */}
          <div className="flex-1 space-y-6">
            
            {/* 1. Delivery Details */}
            <div className="glass-card bg-white dark:bg-[#141414] rounded-2xl p-6 shadow-sm dark:shadow-lg border border-gray-200 dark:border-white/5">
              <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 dark:bg-red-500/20 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(226,55,68,0.3)]">
                    <MapPin className="w-5 h-5 text-[#E23744]" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Delivery Details</h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Where should we deliver your order?</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDetectLocation}
                  disabled={isDetectingLocation}
                  className="flex items-center gap-2 text-xs font-bold text-[#E23744] bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 px-3 py-2 rounded-xl transition-all border border-red-200 dark:border-red-500/20"
                >
                  <Locate className={`w-3.5 h-3.5 ${isDetectingLocation ? 'animate-spin' : ''}`} />
                  {customerLocation ? '📍 Location Attached' : 'Auto-Detect Live GPS'}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">First Name *</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#0a0a0a] text-gray-900 dark:text-white text-sm focus:border-[#E23744] outline-none"
                    placeholder="e.g. Ramesh"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#0a0a0a] text-gray-900 dark:text-white text-sm focus:border-[#E23744] outline-none"
                    placeholder="e.g. Kumar"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#0a0a0a] text-gray-900 dark:text-white text-sm focus:border-[#E23744] outline-none"
                    placeholder="ramesh@example.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#0a0a0a] text-gray-900 dark:text-white text-sm focus:border-[#E23744] outline-none font-mono"
                    placeholder="+91 98765 43210"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Delivery Street Address *</label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#0a0a0a] text-gray-900 dark:text-white text-sm focus:border-[#E23744] outline-none"
                    placeholder="House/Flat No., Building Name, Street / Locality"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">City *</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#0a0a0a] text-gray-900 dark:text-white text-sm focus:border-[#E23744] outline-none"
                    placeholder="New Delhi"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Pincode *</label>
                  <input
                    type="text"
                    required
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#0a0a0a] text-gray-900 dark:text-white text-sm focus:border-[#E23744] outline-none font-mono"
                    placeholder="110001"
                  />
                </div>
              </div>
            </div>

            {/* 2. Payment Method */}
            <div className="glass-card bg-white dark:bg-[#141414] rounded-2xl p-6 shadow-sm dark:shadow-lg border border-gray-200 dark:border-white/5">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-500/20 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                  <ShieldCheck className="w-5 h-5 text-blue-500" />
                </div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Payment Method</h2>
              </div>

              <div className="space-y-4">
                {/* Online Payment Option */}
                <div className={`block border rounded-xl p-4 transition-all ${paymentMethod === 'online' ? 'border-[#E23744] bg-red-50 dark:bg-[#E23744]/10 shadow-[0_0_15px_rgba(226,55,68,0.2)]' : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'}`}>
                  <label className="flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-3">
                      <input 
                        type="radio" 
                        name="payment" 
                        value="online" 
                        checked={paymentMethod === 'online'} 
                        onChange={() => setPaymentMethod('online')}
                        className="w-5 h-5 text-[#E23744] focus:ring-[#E23744] border-gray-300 dark:border-gray-600 bg-white dark:bg-[#0a0a0a]"
                      />
                      <span className="font-bold text-gray-900 dark:text-white">Online Payment</span>
                    </div>
                    <div className="flex gap-1">
                      <CreditCard className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      <Smartphone className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </div>
                  </label>

                  {/* Online Payment Sub-options */}
                  {paymentMethod === 'online' && (
                    <div className="mt-4 pl-4 sm:pl-8 space-y-3">
                      <div className="flex flex-col gap-2">
                        <label className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${onlineMethod === 'upi' ? 'border-[#E23744] bg-white dark:bg-[#1a1a1a]' : 'border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#0a0a0a] hover:border-gray-300 dark:hover:border-white/20'}`}>
                          <div className="flex items-center gap-3">
                            <input type="radio" name="onlineMethod" checked={onlineMethod === 'upi'} onChange={() => setOnlineMethod('upi')} className="text-[#E23744] focus:ring-[#E23744] bg-white dark:bg-[#141414] border-gray-300 dark:border-gray-600" />
                            <span className="font-medium text-sm text-gray-700 dark:text-gray-300">UPI Payments</span>
                          </div>
                          <Smartphone className={`w-4 h-4 ${onlineMethod === 'upi' ? 'text-[#E23744]' : 'text-gray-400 dark:text-gray-500'}`} />
                        </label>
                        
                        {/* the expanded UPI QR section */}
                        <AnimatePresence>
                          {onlineMethod === 'upi' && (
                            <motion.div 
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="bg-gray-100 dark:bg-[#0a0a0a]/50 border border-gray-200 dark:border-white/5 shadow-inner rounded-xl p-3 mt-1 mb-2 space-y-2 backdrop-blur-sm">
                                {UPI_APPS.map(app => (
                                  <div key={app.id} className={`border rounded-xl transition-all duration-300 overflow-hidden ${selectedUpiApp.id === app.id ? 'border-[#E23744]/50 bg-white dark:bg-[#1a1a1a] shadow-[0_4px_15px_rgba(226,55,68,0.08)]' : 'border-gray-200 dark:border-white/5 bg-gray-50/50 dark:bg-[#141414] hover:bg-white dark:hover:bg-[#1a1a1a] hover:border-gray-300 dark:hover:border-white/10'}`}>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        setSelectedUpiApp(app);
                                      }}
                                      className="w-full flex items-center justify-between p-3 group"
                                    >
                                      <div className="flex items-center gap-4">
                                        <div 
                                          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm relative overflow-hidden group-hover:scale-105 transition-transform bg-white"
                                          style={{ 
                                            borderColor: `${app.color}40`,
                                            borderWidth: '1px'
                                          }}
                                        >
                                              {app.name === 'Navi' ? (
                                            <img src={app.logo} alt={app.name} referrerPolicy="no-referrer" className="w-10 h-10 object-cover" />
                                          ) : (
                                            <img src={app.logo} alt={app.name} referrerPolicy="no-referrer" className="w-10 h-10 object-contain p-1" />
                                          )}
                                        </div>
                                        <div className="text-left">
                                          <p className="text-[15px] font-semibold text-gray-900 dark:text-gray-100 leading-tight tracking-wide">{app.name}</p>
                                          <p className="text-[12px] text-gray-500 font-mono mt-0.5 tracking-wider">{app.upi}</p>
                                        </div>
                                      </div>
                                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${selectedUpiApp.id === app.id ? 'border-[#E23744] bg-[#E23744]' : 'border-gray-300 dark:border-gray-600 bg-transparent'}`}>
                                        {selectedUpiApp.id === app.id && <div className="w-2 h-2 bg-white dark:bg-[#0a0a0a] rounded-full" />}
                                      </div>
                                    </button>

                                    <AnimatePresence>
                                      {selectedUpiApp.id === app.id && (
                                        <motion.div
                                          initial={{ height: 0, opacity: 0 }}
                                          animate={{ height: 'auto', opacity: 1 }}
                                          exit={{ height: 0, opacity: 0 }}
                                          className="overflow-hidden"
                                        >
                                          <div className="pt-0 p-4 pl-14">
                                            <div className="flex flex-col sm:flex-row items-center gap-4 bg-gray-50 dark:bg-[#0a0a0a] rounded-xl p-3 border border-gray-200 dark:border-white/5">
                                              <div className="bg-white p-2 rounded-xl shrink-0 border border-gray-100 dark:border-0 shadow-sm">
                                                <img 
                                                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`upi://pay?pa=${selectedUpiApp.upi}&pn=NexraDelivery&am=${total}&cu=INR`)}`}
                                                  alt="UPI QR Code"
                                                  className="w-[100px] h-[100px]"
                                                />
                                              </div>
                                              <div className="flex-1 w-full text-center sm:text-left">
                                                <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-0.5">Paying To</p>
                                                <p className="text-[#E23744] font-black text-sm mb-2">Nexra Delivery</p>
                                                
                                                <div className="flex items-center justify-center sm:justify-start gap-2 mt-2">
                                                  <div 
                                                    className="w-6 h-6 rounded-md flex items-center justify-center shadow-sm relative overflow-hidden bg-white"
                                                    style={{ 
                                                      borderColor: `${selectedUpiApp.color}40`,
                                                      borderWidth: '1px'
                                                    }}
                                                  >
                                                    {selectedUpiApp.name === 'Navi' ? (
                                                      <img src={selectedUpiApp.logo} alt={selectedUpiApp.name} referrerPolicy="no-referrer" className="w-6 h-6 object-cover" />
                                                    ) : (
                                                      <img src={selectedUpiApp.logo} alt={selectedUpiApp.name} referrerPolicy="no-referrer" className="w-6 h-6 object-contain p-0.5" />
                                                    )}
                                                  </div>
                                                  <button 
                                                    type="button"
                                                    onClick={copyUpiId}
                                                    className="flex items-center gap-1.5 py-1 px-2.5 bg-white dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-md transition-colors border border-gray-200 dark:border-white/10 group/btn shadow-sm backdrop-blur-sm"
                                                  >
                                                    <span className="font-mono text-xs text-gray-700 dark:text-gray-300">{selectedUpiApp.upi}</span>
                                                    {isCopied ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3 h-3 text-gray-400 dark:text-gray-400 group-hover/btn:text-gray-900 dark:text-white transition-colors" />}
                                                  </button>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        </motion.div>
                                      )}
                                    </AnimatePresence>
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${onlineMethod === 'card' ? 'border-[#E23744] bg-white dark:bg-[#1a1a1a]' : 'border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#0a0a0a] hover:border-gray-300 dark:hover:border-white/20'}`}>
                          <div className="flex items-center gap-3">
                            <input type="radio" name="onlineMethod" checked={onlineMethod === 'card'} onChange={() => setOnlineMethod('card')} className="text-[#E23744] focus:ring-[#E23744] bg-white dark:bg-[#141414] border-gray-300 dark:border-gray-600" />
                            <span className="font-medium text-sm text-gray-700 dark:text-gray-300">Credit / Debit / ATM Card</span>
                          </div>
                          <CreditCard className={`w-4 h-4 ${onlineMethod === 'card' ? 'text-[#E23744]' : 'text-gray-400 dark:text-gray-500'}`} />
                        </label>
                        <AnimatePresence>
                          {onlineMethod === 'card' && (
                            <motion.div 
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="bg-gray-100 dark:bg-[#0a0a0a]/50 border border-gray-200 dark:border-white/5 shadow-inner rounded-xl p-4 mt-1 mb-2 space-y-4 backdrop-blur-sm">
                                <div>
                                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Card Number</label>
                                  <div className="relative">
                                    <input type="text" name="cardnumber" autoComplete="cc-number" inputMode="numeric" value={cardNumber} onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').slice(0, 16))} placeholder="0000 0000 0000 0000" className="w-full px-4 pr-12 py-2.5 rounded-lg border border-gray-200 dark:border-white/10 outline-none bg-white dark:bg-[#1a1a1a] focus:border-[#E23744] font-mono" />
                                    <button
                                      type="button"
                                      onClick={startCamera}
                                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-[#E23744] transition-colors bg-white dark:bg-[#1a1a1a] rounded-md"
                                      title="Scan Card"
                                    >
                                      <Scan className="w-5 h-5" />
                                    </button>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Valid Thru</label>
                                    <input type="text" name="cc-exp" autoComplete="cc-exp" value={cardExpiry} onChange={(e) => setCardExpiry(e.target.value)} placeholder="MM/YY" className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-white/10 outline-none bg-white dark:bg-[#1a1a1a] focus:border-[#E23744] font-mono" />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">CVV</label>
                                    <input type="password" name="cvc" autoComplete="cc-csc" value={cardCvv} onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="123" className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-white/10 outline-none bg-white dark:bg-[#1a1a1a] focus:border-[#E23744] font-mono" />
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Name on Card</label>
                                  <input type="text" name="ccname" autoComplete="cc-name" value={cardName} onChange={(e) => setCardName(e.target.value)} placeholder="John Doe" className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-white/10 outline-none bg-white dark:bg-[#1a1a1a] focus:border-[#E23744]" />
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${onlineMethod === 'netbanking' ? 'border-[#E23744] bg-white dark:bg-[#1a1a1a]' : 'border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#0a0a0a] hover:border-gray-300 dark:hover:border-white/20'}`}>
                          <div className="flex items-center gap-3">
                            <input type="radio" name="onlineMethod" checked={onlineMethod === 'netbanking'} onChange={() => setOnlineMethod('netbanking')} className="text-[#E23744] focus:ring-[#E23744] bg-white dark:bg-[#141414] border-gray-300 dark:border-gray-600" />
                            <span className="font-medium text-sm text-gray-700 dark:text-gray-300">Net Banking</span>
                          </div>
                          <Banknote className={`w-4 h-4 ${onlineMethod === 'netbanking' ? 'text-[#E23744]' : 'text-gray-400 dark:text-gray-500'}`} />
                        </label>
                        <AnimatePresence>
                          {onlineMethod === 'netbanking' && (
                            <motion.div 
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="bg-gray-100 dark:bg-[#0a0a0a]/50 border border-gray-200 dark:border-white/5 shadow-inner rounded-xl p-4 mt-1 mb-2 space-y-4 backdrop-blur-sm">
                                <div>
                                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Select Your Bank</label>
                                  <div className="relative mb-3">
                                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                      type="text"
                                      placeholder="Search your bank..."
                                      value={bankSearchQuery}
                                      onChange={(e) => setBankSearchQuery(e.target.value)}
                                      className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-white/10 outline-none bg-white dark:bg-[#1a1a1a] focus:border-[#E23744] text-sm text-gray-900 dark:text-white"
                                    />
                                  </div>
                                  <div className="max-h-40 overflow-y-auto space-y-1 border border-gray-200 dark:border-white/10 rounded-lg p-1 bg-white dark:bg-[#1a1a1a] hide-scrollbar">
                                    {ALL_BANKS.filter(b => b.name.toLowerCase().includes(bankSearchQuery.toLowerCase())).map(bank => (
                                      <button
                                        key={bank.id}
                                        type="button"
                                        onClick={() => setSelectedBank(bank.name)}
                                        className={`w-full text-left px-3 py-2.5 rounded-md text-sm transition-colors ${selectedBank === bank.name ? 'bg-red-50 dark:bg-[#E23744]/20 text-[#E23744] font-bold' : 'hover:bg-gray-100 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300'}`}
                                      >
                                        {bank.name}
                                      </button>
                                    ))}
                                    {ALL_BANKS.filter(b => b.name.toLowerCase().includes(bankSearchQuery.toLowerCase())).length === 0 && (
                                      <p className="text-xs text-center text-gray-500 py-4">No banks found matching "{bankSearchQuery}"</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${onlineMethod === 'emi' ? 'border-[#E23744] bg-white dark:bg-[#1a1a1a]' : 'border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#0a0a0a] hover:border-gray-300 dark:hover:border-white/20'}`}>
                          <div className="flex items-center gap-3">
                            <input type="radio" name="onlineMethod" checked={onlineMethod === 'emi'} onChange={() => setOnlineMethod('emi')} className="text-[#E23744] focus:ring-[#E23744] bg-white dark:bg-[#141414] border-gray-300 dark:border-gray-600" />
                            <span className="font-medium text-sm text-gray-700 dark:text-gray-300">EMI (Easy Installments)</span>
                          </div>
                          <CreditCard className={`w-4 h-4 ${onlineMethod === 'emi' ? 'text-[#E23744]' : 'text-gray-400 dark:text-gray-500'}`} />
                        </label>
                        <AnimatePresence>
                          {onlineMethod === 'emi' && (
                            <motion.div 
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="bg-gray-100 dark:bg-[#0a0a0a]/50 border border-gray-200 dark:border-white/5 shadow-inner rounded-xl p-4 mt-1 mb-2 space-y-4 backdrop-blur-sm">
                                <div>
                                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Select EMI Bank</label>
                                  <div className="relative mb-3">
                                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                      type="text"
                                      placeholder="Search credit cards..."
                                      value={emiSearchQuery}
                                      onChange={(e) => setEmiSearchQuery(e.target.value)}
                                      className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-white/10 outline-none bg-white dark:bg-[#1a1a1a] focus:border-[#E23744] text-sm text-gray-900 dark:text-white"
                                    />
                                  </div>
                                  <div className="max-h-40 overflow-y-auto space-y-1 border border-gray-200 dark:border-white/10 rounded-lg p-1 bg-white dark:bg-[#1a1a1a] hide-scrollbar mb-4">
                                    {EMI_BANKS.filter(b => b.name.toLowerCase().includes(emiSearchQuery.toLowerCase())).map(bank => (
                                      <button
                                        key={bank.id}
                                        type="button"
                                        onClick={() => setSelectedEmiBank(bank.name)}
                                        className={`w-full text-left px-3 py-2.5 rounded-md text-sm transition-colors ${selectedEmiBank === bank.name ? 'bg-red-50 dark:bg-[#E23744]/20 text-[#E23744] font-bold' : 'hover:bg-gray-100 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300'}`}
                                      >
                                        {bank.name}
                                      </button>
                                    ))}
                                    {EMI_BANKS.filter(b => b.name.toLowerCase().includes(emiSearchQuery.toLowerCase())).length === 0 && (
                                      <p className="text-xs text-center text-gray-500 py-4">No cards found matching "{emiSearchQuery}"</p>
                                    )}
                                  </div>
                                </div>
                                {selectedEmiBank && (
                                  <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Select EMI Tenure</label>
                                    <select 
                                      value={emiDuration}
                                      onChange={(e) => setEmiDuration(e.target.value)}
                                      className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-white/10 outline-none bg-white dark:bg-[#1a1a1a] focus:border-[#E23744] appearance-none"
                                    >
                                      <option value="" disabled>Choose EMI duration...</option>
                                      <option value="3">3 Months EMI @ 13.00% pa</option>
                                      <option value="6">6 Months EMI @ 13.00% pa</option>
                                      <option value="9">9 Months EMI @ 14.00% pa</option>
                                      <option value="12">12 Months EMI @ 14.00% pa</option>
                                    </select>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  )}
                </div>

                {/* COD Option */}
                <label className={`block border rounded-xl p-4 cursor-pointer transition-all ${paymentMethod === 'cod' ? 'border-[#E23744] bg-red-50 dark:bg-[#E23744]/10 shadow-[0_0_15px_rgba(226,55,68,0.2)]' : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <input 
                        type="radio" 
                        name="payment" 
                        value="cod" 
                        checked={paymentMethod === 'cod'} 
                        onChange={() => setPaymentMethod('cod')}
                        className="w-5 h-5 text-[#E23744] focus:ring-[#E23744] border-gray-300 dark:border-gray-600 bg-white dark:bg-[#0a0a0a]"
                      />
                      <span className="font-bold text-gray-900 dark:text-white">Cash on Delivery (COD)</span>
                    </div>
                    <Banknote className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary */}
          <div className="w-full lg:w-[400px]">
            <div className="glass-card bg-white dark:bg-[#141414] rounded-2xl p-6 shadow-[0_4px_30px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_30px_rgba(0,0,0,0.3)] border border-gray-200 dark:border-white/5 sticky top-24">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Order Summary</h2>
              
              <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto pr-2 hide-scrollbar">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm items-center gap-3">
                    {item.image && (
                      <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-black/5 dark:border-white/5 relative bg-[#1a1a1a]">
                        <img 
                          src={item.image} 
                          alt={item.name} 
                          className="w-full h-full object-cover" 
                          onError={(e) => {
                            e.currentTarget.src = getFallbackImage(item.id);
                            e.currentTarget.onerror = null;
                          }}
                        />
                      </div>
                    )}
                    <div className="flex flex-1 gap-2 items-start">
                      <div className={`w-3.5 h-3.5 mt-0.5 border rounded-sm flex items-center justify-center shrink-0 ${item.isVeg ? 'border-green-500' : 'border-red-500'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${item.isVeg ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white leading-tight">{item.name}</p>
                        <p className="text-gray-600 dark:text-gray-400 text-xs mt-0.5">Qty: {item.quantity}</p>
                      </div>
                    </div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">₹{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-200 dark:border-white/10 pt-4 space-y-3 text-sm mb-6">
                <div className="flex justify-between text-gray-500 dark:text-gray-400">
                  <span>Item Total</span>
                  <span className="font-medium text-gray-900 dark:text-gray-300">₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-500 dark:text-gray-400">
                  <span>Delivery Fee</span>
                  <span className="font-medium text-gray-900 dark:text-gray-300">₹{deliveryFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-500 dark:text-gray-400">
                  <span>Taxes & Charges</span>
                  <span className="font-medium text-gray-900 dark:text-gray-300">₹{taxes.toFixed(2)}</span>
                </div>
                <div className="border-t border-dashed border-gray-200 dark:border-white/10 pt-4 mt-2 flex justify-between items-center">
                  <span className="font-bold text-gray-900 dark:text-white text-base">Grand Total</span>
                  <span className="font-black text-[#E23744] text-xl">₹{total.toFixed(2)}</span>
                </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-gradient-to-r from-[#E23744] to-[#FF5E5E] text-white rounded-xl py-4 font-bold text-lg flex items-center justify-center gap-2 hover:shadow-[0_0_20px_rgba(226,55,68,0.4)] active:scale-[0.98] transition-all"
              >
                {paymentMethod === 'online' 
                  ? (onlineMethod === 'upi' ? `I Have Paid ₹${total.toFixed(2)}` 
                    : onlineMethod === 'emi' ? `Start EMI of ₹${(total / (parseInt(emiDuration) || 1)).toFixed(2)}/mo`
                    : `Pay ₹${total.toFixed(2)} Securely`) 
                  : `Place Order • ₹${total.toFixed(2)}`}
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </form>
      </div>

      <AnimatePresence>
        {isScanning && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-white dark:bg-[#141414] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="p-4 border-b border-gray-100 dark:border-white/10 flex justify-between items-center bg-white dark:bg-[#141414]">
                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Scan className="w-5 h-5 text-[#E23744]" />
                  Scan Card
                </h3>
                <button onClick={stopCamera} className="text-gray-500 hover:text-gray-900 dark:hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="relative aspect-[4/3] bg-black">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover opacity-80" />
                <div className="absolute inset-0 flex items-center justify-center p-6 pointer-events-none">
                  {/* Backdrop mask effect */}
                  <div className="absolute inset-0 bg-black/40">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[320px] aspect-[1.586/1] rounded-xl shadow-[0_0_0_9999px_rgba(0,0,0,0.6)]"></div>
                  </div>
                  
                  {/* Card shape outline overlay */}
                  <div className="w-full max-w-[320px] aspect-[1.586/1] border-2 border-white/30 rounded-xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-green-500 rounded-tl-xl -translate-x-0.5 -translate-y-0.5 z-10"></div>
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-green-500 rounded-tr-xl translate-x-0.5 -translate-y-0.5 z-10"></div>
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-green-500 rounded-bl-xl -translate-x-0.5 translate-y-0.5 z-10"></div>
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-green-500 rounded-br-xl translate-x-0.5 translate-y-0.5 z-10"></div>
                    
                    {/* Animated scanning line */}
                    <motion.div 
                      className="absolute inset-x-0 h-1 bg-green-500 w-full shadow-[0_0_10px_rgba(34,197,94,0.8)] z-20"
                      initial={{ top: '0%' }}
                      animate={{ top: ['0%', '98%', '0%'] }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                    />
                    <div className="absolute inset-0 bg-green-500/10 mix-blend-overlay"></div>
                  </div>
                </div>
              </div>
              <div className="p-5 bg-gray-50 dark:bg-[#0a0a0a]">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 text-center mb-5 leading-relaxed">
                  Position your card within the frame. Details will be extracted automatically.
                </p>
                <button type="button" onClick={captureCard} className="w-full relative group overflow-hidden py-3.5 bg-gradient-to-r from-[#E23744] to-[#FF5E5E] hover:from-[#d12c38] hover:to-[#ff4545] text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-red-500/30">
                  <div className="absolute inset-0 bg-white/20 group-hover:translate-x-full -translate-x-full transition-transform duration-500 ease-out skew-x-12"></div>
                  <Camera className="w-5 h-5 relative z-10" />
                  <span className="relative z-10">Force Capture</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
