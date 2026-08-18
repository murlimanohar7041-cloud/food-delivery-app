import React, { useState, useEffect } from 'react';
import { X, Phone, ArrowLeft, MapPin, Locate, Lock, Mail, User as UserIcon, ShieldCheck, CheckCircle2, ShoppingBag, Truck, Edit3, Save, AlertCircle, Eye, EyeOff, Bike } from 'lucide-react';
import { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile,
  signOut
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase';
import { toast } from 'react-hot-toast';
import { getUserCurrentLocation } from '../utils/geoUtils';
import { LocationCoords, UserProfile } from '../types';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin?: (name: string) => void;
  initialMode?: 'login' | 'register';
  onNavigate?: (view: string) => void;
}

export default function ProfileModal({ 
  isOpen, 
  onClose, 
  onLogin, 
  initialMode = 'login',
  onNavigate 
}: ProfileModalProps) {
  const [isRegisterMode, setIsRegisterMode] = useState(initialMode === 'register');
  const [authMode, setAuthMode] = useState<'default' | 'phone' | 'otp'>('default');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Registration form state
  const [regFullName, setRegFullName] = useState('');
  const [regMobile, setRegMobile] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regCity, setRegCity] = useState('');
  const [regPincode, setRegPincode] = useState('');
  const [regLocation, setRegLocation] = useState<LocationCoords | null>(null);
  const [isDetectingGps, setIsDetectingGps] = useState(false);

  // Login form state
  const [loginEmailOrMobile, setLoginEmailOrMobile] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // User Profile state (when logged in)
  const currentUser = auth.currentUser;
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editAddress, setEditAddress] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editPincode, setEditPincode] = useState('');
  const [editPhone, setEditPhone] = useState('');

  // Sync mode when prop changes
  useEffect(() => {
    setIsRegisterMode(initialMode === 'register');
  }, [initialMode, isOpen]);

  // Load Firestore user profile if logged in
  useEffect(() => {
    if (!currentUser) {
      setUserProfile(null);
      return;
    }
    const loadProfile = async () => {
      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const snap = await getDoc(userDocRef);
        if (snap.exists()) {
          const data = snap.data() as UserProfile;
          setUserProfile(data);
          setEditAddress(data.address || '');
          setEditCity(data.city || '');
          setEditPincode(data.pincode || '');
          setEditPhone(data.phone || '');
        } else {
          // If no doc exists yet, seed basic
          const basicProfile: UserProfile = {
            id: currentUser.uid,
            name: currentUser.displayName || 'Customer',
            email: currentUser.email || '',
            role: currentUser.email === 'murlimanohar7041@gmail.com' ? 'admin' : 'customer',
            createdAt: new Date().toISOString()
          };
          setUserProfile(basicProfile);
          await setDoc(userDocRef, basicProfile);
        }
      } catch (err) {
        console.error('Error fetching user profile:', err);
      }
    };
    loadProfile();
  }, [currentUser, isOpen]);

  if (!isOpen) return null;

  // GPS auto-detect for registration
  const handleDetectGpsLocation = async () => {
    setIsDetectingGps(true);
    toast.loading('Detecting your live GPS coordinates...', { id: 'gps-toast' });
    try {
      const res = await getUserCurrentLocation();
      toast.dismiss('gps-toast');
      if (res.coords) {
        setRegLocation(res.coords);
        if (!regCity) setRegCity('Detected Location');
        toast.success('Live Location Permission Granted! 📍');
      } else if (res.error) {
        toast.error(res.error, { duration: 4000 });
      }
    } catch (e: any) {
      toast.dismiss('gps-toast');
      toast.error('Location error. Please grant permission or enter manually.');
    } finally {
      setIsDetectingGps(false);
    }
  };

  // Google Login
  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        const userDocRef = doc(db, 'users', result.user.uid);
        const snap = await getDoc(userDocRef);
        if (!snap.exists()) {
          const newProf: UserProfile = {
            id: result.user.uid,
            name: result.user.displayName || 'Customer',
            email: result.user.email || '',
            role: result.user.email === 'murlimanohar7041@gmail.com' ? 'admin' : 'customer',
            createdAt: new Date().toISOString()
          };
          await setDoc(userDocRef, newProf);
        }
        onLogin?.(result.user.displayName || 'Customer');
        toast.success(`Welcome back, ${result.user.displayName || 'Customer'}!`);
        onClose();
      }
    } catch (error: any) {
      if (error.code === 'auth/unauthorized-domain' || error.message?.includes('unauthorized domain')) {
        toast.error('Preview note: Please add this domain to Firebase Console.', { duration: 6000 });
      } else if (error.code !== 'auth/popup-closed-by-user' && error.code !== 'auth/cancelled-popup-request') {
        toast.error(error.message || 'Google Sign-In failed');
      }
    } finally {
      setLoading(false);
    }
  };

  // Customer Registration Submit
  const handleCustomerRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regEmail.trim() || !regPassword) {
      toast.error('Please enter a valid email and password');
      return;
    }
    if (regPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (!regFullName.trim()) {
      toast.error('Please enter your full name');
      return;
    }
    if (!regAddress.trim()) {
      toast.error('Please provide a delivery address');
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, regEmail.trim(), regPassword);
      const user = userCredential.user;

      await updateProfile(user, {
        displayName: regFullName.trim()
      });

      const customerProfile: UserProfile = {
        id: user.uid,
        name: regFullName.trim(),
        email: regEmail.trim().toLowerCase(),
        phone: regMobile.trim(),
        role: regEmail.trim().toLowerCase() === 'murlimanohar7041@gmail.com' ? 'admin' : 'customer',
        address: regAddress.trim(),
        city: regCity.trim() || 'New Delhi',
        pincode: regPincode.trim(),
        location: regLocation || undefined,
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'users', user.uid), customerProfile);
      setUserProfile(customerProfile);
      toast.success('Registration successful! Welcome to M-Bites 🎉');
      onLogin?.(regFullName.trim());
      onClose();
    } catch (error: any) {
      console.error('Registration failed:', error);
      if (error.code === 'auth/email-already-in-use') {
        toast.error('Email is already registered. Please log in instead.');
        setIsRegisterMode(false);
      } else {
        toast.error(error.message || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Customer Email / Password Login
  const handleCustomerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmailOrMobile.trim() || !loginPassword) {
      toast.error('Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      const email = loginEmailOrMobile.includes('@') 
        ? loginEmailOrMobile.trim().toLowerCase() 
        : `${loginEmailOrMobile.replace(/\D/g, '')}@mbites-user.com`;

      const userCred = await signInWithEmailAndPassword(auth, email, loginPassword);
      const user = userCred.user;
      
      onLogin?.(user.displayName || user.email?.split('@')[0] || 'Customer');
      toast.success(`Welcome back, ${user.displayName || 'Customer'}!`);
      onClose();
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        toast.error('Invalid email or password. If you are new, please Register first.');
      } else {
        toast.error(error.message || 'Login failed. Please verify credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Save updated profile
  const handleSaveProfile = async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      await updateDoc(doc(db, 'users', currentUser.uid), {
        address: editAddress,
        city: editCity,
        pincode: editPincode,
        phone: editPhone
      });
      setUserProfile((prev) => prev ? { ...prev, address: editAddress, city: editCity, pincode: editPincode, phone: editPhone } : null);
      setIsEditingProfile(false);
      toast.success('Address and profile details updated successfully! 💾');
    } catch (e: any) {
      toast.error('Failed to update details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose}></div>
      <div 
        className="relative bg-white dark:bg-[#141414] rounded-3xl shadow-2xl shadow-red-500/10 w-full max-w-lg max-h-[90vh] overflow-y-auto transform scale-100 transition-all border border-black/10 dark:border-white/10"
        style={{ animation: 'modalSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
      >
        <style>{`
          @keyframes modalSlideUp {
            from { opacity: 0; transform: translateY(30px) scale(0.96); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }
        `}</style>
        
        <div className="p-6 sm:p-8">
          <button 
            onClick={onClose} 
            className="absolute top-5 right-5 text-gray-500 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors rounded-full p-2"
          >
            <X className="w-5 h-5" />
          </button>

          {/* If user is already logged in, show their account dashboard */}
          {currentUser ? (
            <div>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-gradient-to-tr from-[#E23744] to-[#FF5E5E] rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-red-500/20">
                  {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                      {currentUser.displayName || 'Customer'}
                    </h2>
                    {userProfile?.role === 'admin' && (
                      <span className="bg-blue-500/20 text-blue-500 text-xs px-2 py-0.5 rounded-full font-bold">
                        Admin
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{currentUser.email}</p>
                </div>
              </div>

              {/* Saved Delivery Address Card */}
              <div className="bg-gray-50 dark:bg-[#0a0a0a] rounded-2xl p-5 border border-gray-200 dark:border-white/5 mb-6">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-black tracking-wider uppercase text-gray-400 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#E23744]" />
                    Saved Delivery Address
                  </span>
                  <button 
                    onClick={() => setIsEditingProfile(!isEditingProfile)}
                    className="text-xs font-bold text-[#E23744] hover:underline flex items-center gap-1"
                  >
                    <Edit3 className="w-3 h-3" />
                    {isEditingProfile ? 'Cancel' : 'Edit'}
                  </button>
                </div>

                {isEditingProfile ? (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-bold text-gray-500">Street / House / Area</label>
                      <input 
                        value={editAddress}
                        onChange={(e) => setEditAddress(e.target.value)}
                        placeholder="e.g. Flat 402, Lotus Towers, MG Road"
                        className="w-full mt-1 px-3 py-2 rounded-xl bg-white dark:bg-[#141414] border border-gray-200 dark:border-white/10 text-sm font-medium text-gray-900 dark:text-white outline-none focus:border-[#E23744]"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs font-bold text-gray-500">City</label>
                        <input 
                          value={editCity}
                          onChange={(e) => setEditCity(e.target.value)}
                          placeholder="City"
                          className="w-full mt-1 px-3 py-2 rounded-xl bg-white dark:bg-[#141414] border border-gray-200 dark:border-white/10 text-sm font-medium text-gray-900 dark:text-white outline-none focus:border-[#E23744]"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-500">Pincode</label>
                        <input 
                          value={editPincode}
                          onChange={(e) => setEditPincode(e.target.value)}
                          placeholder="110001"
                          className="w-full mt-1 px-3 py-2 rounded-xl bg-white dark:bg-[#141414] border border-gray-200 dark:border-white/10 text-sm font-medium text-gray-900 dark:text-white outline-none focus:border-[#E23744]"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500">Phone</label>
                      <input 
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full mt-1 px-3 py-2 rounded-xl bg-white dark:bg-[#141414] border border-gray-200 dark:border-white/10 text-sm font-medium text-gray-900 dark:text-white outline-none focus:border-[#E23744]"
                      />
                    </div>
                    <button 
                      onClick={handleSaveProfile}
                      disabled={loading}
                      className="w-full mt-2 bg-[#E23744] hover:bg-[#d12c38] text-white py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md"
                    >
                      <Save className="w-3.5 h-3.5" />
                      Save Address
                    </button>
                  </div>
                ) : (
                  <div>
                    {userProfile?.address ? (
                      <div className="text-sm font-medium text-gray-800 dark:text-gray-200 space-y-1">
                        <p>{userProfile.address}</p>
                        <p className="text-gray-500 dark:text-gray-400 text-xs">
                          {userProfile.city} {userProfile.pincode ? `- ${userProfile.pincode}` : ''}
                        </p>
                        {userProfile.phone && (
                          <p className="text-gray-500 dark:text-gray-400 text-xs font-mono">
                            📞 {userProfile.phone}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 italic">No delivery address saved yet. Click edit to add your default address.</p>
                    )}
                  </div>
                )}
              </div>

              {/* Quick Navigation Action Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                <button
                  onClick={() => {
                    onClose();
                    onNavigate?.('orders');
                  }}
                  className="flex items-center gap-3 p-4 rounded-2xl bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/5 hover:border-[#E23744]/40 hover:bg-[#E23744]/5 text-gray-900 dark:text-white text-left transition-all group"
                >
                  <div className="p-2.5 bg-red-100 dark:bg-red-500/10 text-[#E23744] rounded-xl group-hover:scale-110 transition-transform">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">My Orders</h4>
                    <p className="text-xs text-gray-500">View orders & invoices</p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    onClose();
                    onNavigate?.('orders');
                  }}
                  className="flex items-center gap-3 p-4 rounded-2xl bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/5 hover:border-emerald-500/40 hover:bg-emerald-500/5 text-gray-900 dark:text-white text-left transition-all group"
                >
                  <div className="p-2.5 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-500 rounded-xl group-hover:scale-110 transition-transform">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">Live Tracking</h4>
                    <p className="text-xs text-gray-500">Track active deliveries</p>
                  </div>
                </button>

                {/* Admin panel link if admin */}
                {(userProfile?.role === 'admin' || currentUser.email === 'murlimanohar7041@gmail.com') && (
                  <>
                    <button
                      onClick={() => {
                        onClose();
                        onNavigate?.('admin');
                      }}
                      className="sm:col-span-2 flex items-center justify-between p-4 rounded-2xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 font-bold text-sm hover:scale-[1.01] transition-all"
                    >
                      <div className="flex items-center gap-2.5">
                        <ShieldCheck className="w-5 h-5" />
                        <span>Open Admin Control Dashboard</span>
                      </div>
                      <span>→</span>
                    </button>

                    <button
                      onClick={() => {
                        onClose();
                        onNavigate?.('rider');
                      }}
                      className="sm:col-span-2 flex items-center justify-between p-4 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-sm hover:scale-[1.01] transition-all"
                    >
                      <div className="flex items-center gap-2.5">
                        <Bike className="w-5 h-5" />
                        <span>Open Delivery Partner (Rider) Portal</span>
                      </div>
                      <span>→</span>
                    </button>
                  </>
                )}

                {/* Direct Rider Portal button for riders */}
                {userProfile?.role === 'rider' && currentUser.email !== 'murlimanohar7041@gmail.com' && (
                  <button
                    onClick={() => {
                      onClose();
                      onNavigate?.('rider');
                    }}
                    className="sm:col-span-2 flex items-center justify-between p-4 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-sm hover:scale-[1.01] transition-all"
                  >
                    <div className="flex items-center gap-2.5">
                      <Bike className="w-5 h-5" />
                      <span>Open Delivery Boy Tasks Portal</span>
                    </div>
                    <span>→</span>
                  </button>
                )}
              </div>

              {/* Logout Button */}
              <button
                onClick={async () => {
                  await signOut(auth);
                  onLogin?.('');
                  onClose();
                  toast.success('Logged out successfully');
                }}
                className="w-full py-3.5 rounded-xl border border-red-500/30 text-[#E23744] hover:bg-red-500/10 font-bold text-sm transition-all"
              >
                Log Out
              </button>
            </div>
          ) : (
            /* Login / Register Views */
            <>
              {/* Tab Selector: Login vs Register to Order */}
              <div className="flex rounded-2xl bg-gray-100 dark:bg-[#0a0a0a] p-1.5 mb-6 border border-black/5 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => setIsRegisterMode(false)}
                  className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${
                    !isRegisterMode
                      ? 'bg-white dark:bg-[#1f1f1f] text-gray-900 dark:text-white shadow-md'
                      : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Customer Login
                </button>
                <button
                  type="button"
                  onClick={() => setIsRegisterMode(true)}
                  className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${
                    isRegisterMode
                      ? 'bg-gradient-to-r from-[#E23744] to-[#FF5E5E] text-white shadow-md shadow-red-500/20'
                      : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Register to Order
                </button>
              </div>

              {/* Registration Form ("Register to Order") */}
              {isRegisterMode ? (
                <div>
                  <div className="mb-5">
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                      Register to Order Food 🍔
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Create your M-Bites account with delivery address & GPS for real-time tracking.
                    </p>
                  </div>

                  <form onSubmit={handleCustomerRegister} className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Full Name *</label>
                      <input 
                        type="text" 
                        required
                        value={regFullName}
                        onChange={(e) => setRegFullName(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#0a0a0a] text-gray-900 dark:text-white text-sm focus:border-[#E23744] outline-none" 
                        placeholder="e.g. Ramesh Kumar" 
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Mobile Number *</label>
                        <input 
                          type="tel" 
                          required
                          value={regMobile}
                          onChange={(e) => setRegMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#0a0a0a] text-gray-900 dark:text-white text-sm focus:border-[#E23744] outline-none font-mono" 
                          placeholder="9876543210" 
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Email Address *</label>
                        <input 
                          type="email" 
                          required
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#0a0a0a] text-gray-900 dark:text-white text-sm focus:border-[#E23744] outline-none" 
                          placeholder="name@example.com" 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Password *</label>
                        <div className="relative">
                          <input 
                            type={showPassword ? 'text' : 'password'}
                            required
                            value={regPassword}
                            onChange={(e) => setRegPassword(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#0a0a0a] text-gray-900 dark:text-white text-sm focus:border-[#E23744] outline-none pr-10" 
                            placeholder="Min 6 characters" 
                          />
                          <button 
                            type="button" 
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Confirm Password *</label>
                        <input 
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={regConfirmPassword}
                          onChange={(e) => setRegConfirmPassword(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#0a0a0a] text-gray-900 dark:text-white text-sm focus:border-[#E23744] outline-none" 
                          placeholder="Re-type password" 
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Delivery Address *</label>
                      <input 
                        type="text" 
                        required
                        value={regAddress}
                        onChange={(e) => setRegAddress(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#0a0a0a] text-gray-900 dark:text-white text-sm focus:border-[#E23744] outline-none" 
                        placeholder="House / Flat No, Building, Street / Area" 
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">City *</label>
                        <input 
                          type="text" 
                          required
                          value={regCity}
                          onChange={(e) => setRegCity(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#0a0a0a] text-gray-900 dark:text-white text-sm focus:border-[#E23744] outline-none" 
                          placeholder="e.g. New Delhi" 
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Pincode *</label>
                        <input 
                          type="text" 
                          required
                          value={regPincode}
                          onChange={(e) => setRegPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#0a0a0a] text-gray-900 dark:text-white text-sm focus:border-[#E23744] outline-none font-mono" 
                          placeholder="110001" 
                        />
                      </div>
                    </div>

                    {/* Location Permission / GPS auto-detect */}
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={handleDetectGpsLocation}
                        disabled={isDetectingGps}
                        className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border text-xs font-bold transition-all ${
                          regLocation
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                            : 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20'
                        }`}
                      >
                        <Locate className={`w-4 h-4 ${isDetectingGps ? 'animate-spin' : ''}`} />
                        <span>
                          {regLocation 
                            ? `📍 Live GPS Attached (${regLocation.lat.toFixed(3)}, ${regLocation.lng.toFixed(3)})` 
                            : 'Grant Location Permission & Auto-Detect GPS'}
                        </span>
                      </button>
                    </div>

                    <button 
                      type="submit" 
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-[#E23744] to-[#FF5E5E] text-white font-bold text-base py-3.5 rounded-xl hover:shadow-[0_0_20px_rgba(226,55,68,0.4)] active:scale-[0.98] transition-all cursor-pointer mt-2"
                    >
                      {loading ? 'Creating Account...' : 'Complete Registration & Order'}
                    </button>
                  </form>
                </div>
              ) : (
                /* Customer Login Form */
                <div>
                  <div className="mb-5">
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                      Welcome Back 👋
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Log in to access saved addresses, previous orders, and live delivery tracking.
                    </p>
                  </div>

                  {/* 1-tap Google Sign-In */}
                  <button 
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-3 bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white font-bold text-sm py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 active:scale-[0.98] transition-all mb-4 shadow-sm"
                  >
                    <svg viewBox="0 0 24 24" className="w-5 h-5">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      <path d="M1 1h22v22H1z" fill="none"/>
                    </svg>
                    Continue with Google
                  </button>

                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex-1 h-px bg-gray-200 dark:bg-white/10"></div>
                    <span className="text-gray-400 font-bold text-xs uppercase">OR with Email / Password</span>
                    <div className="flex-1 h-px bg-gray-200 dark:bg-white/10"></div>
                  </div>

                  <form onSubmit={handleCustomerLogin} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                        Registered Email or Mobile
                      </label>
                      <input 
                        type="text" 
                        required
                        value={loginEmailOrMobile}
                        onChange={(e) => setLoginEmailOrMobile(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#0a0a0a] text-gray-900 dark:text-white text-sm focus:border-[#E23744] outline-none" 
                        placeholder="e.g. name@example.com" 
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">Password</label>
                        <button 
                          type="button" 
                          onClick={() => setShowPassword(!showPassword)}
                          className="text-xs text-[#E23744] hover:underline font-bold"
                        >
                          {showPassword ? 'Hide' : 'Show'}
                        </button>
                      </div>
                      <input 
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#0a0a0a] text-gray-900 dark:text-white text-sm focus:border-[#E23744] outline-none" 
                        placeholder="••••••••" 
                      />
                    </div>

                    <button 
                      type="submit" 
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-[#E23744] to-[#FF5E5E] text-white font-bold text-base py-3.5 rounded-xl hover:shadow-[0_0_20px_rgba(226,55,68,0.4)] active:scale-[0.98] transition-all cursor-pointer"
                    >
                      {loading ? 'Logging in...' : 'Login to My Account'}
                    </button>
                  </form>

                  <div className="mt-6 text-center text-xs font-medium text-gray-600 dark:text-gray-400">
                    New customer?{' '}
                    <button 
                      type="button" 
                      onClick={() => setIsRegisterMode(true)} 
                      className="text-[#E23744] font-black hover:underline cursor-pointer"
                    >
                      Register to Order here
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

