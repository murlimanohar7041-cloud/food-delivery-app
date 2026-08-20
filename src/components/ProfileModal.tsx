import React, { useState, useEffect } from 'react';
import { 
  X, 
  MapPin, 
  Locate, 
  User as UserIcon, 
  ShieldCheck, 
  ShoppingBag, 
  Truck, 
  Edit3, 
  Save, 
  Eye, 
  EyeOff, 
  Bike,
  Lock,
  Mail,
  Phone,
  KeyRound,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  LogOut
} from 'lucide-react';
import { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile,
  sendPasswordResetEmail,
  signOut
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase';
import { toast } from 'react-hot-toast';
import { getUserCurrentLocation } from '../utils/geoUtils';
import { LocationCoords, UserProfile, UserRole } from '../types';
import { getAuthErrorMessage, resolveEmailFromIdentifier, ADMIN_BOOTSTRAP_EMAIL, isUserAdmin, isUserRider } from '../utils/authUtils';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin?: (name: string) => void;
  initialMode?: 'login' | 'register' | 'rider';
  onNavigate?: (view: string) => void;
}

type ModalTab = 'customer-login' | 'register' | 'rider-login' | 'forgot-password';

export default function ProfileModal({ 
  isOpen, 
  onClose, 
  onLogin, 
  initialMode = 'login',
  onNavigate 
}: ProfileModalProps) {
  // Modal Navigation Tab
  const [activeTab, setActiveTab] = useState<ModalTab>('customer-login');
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

  // Customer Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Rider Login form state
  const [riderIdentifier, setRiderIdentifier] = useState('');
  const [riderPassword, setRiderPassword] = useState('');

  // Forgot Password state
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetEmailSent, setResetEmailSent] = useState(false);

  // User Profile state (when logged in)
  const currentUser = auth.currentUser;
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editAddress, setEditAddress] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editPincode, setEditPincode] = useState('');
  const [editPhone, setEditPhone] = useState('');

  // Sync mode when initialMode prop changes
  useEffect(() => {
    if (initialMode === 'register') {
      setActiveTab('register');
    } else if (initialMode === 'rider') {
      setActiveTab('rider-login');
    } else {
      setActiveTab('customer-login');
    }
  }, [initialMode, isOpen]);

  // Load Firestore user profile whenever currentUser changes
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
          // If no doc exists yet, seed initial profile
          const isAdmin = currentUser.email?.toLowerCase() === ADMIN_BOOTSTRAP_EMAIL.toLowerCase();
          const basicProfile: UserProfile = {
            id: currentUser.uid,
            name: currentUser.displayName || (currentUser.email ? currentUser.email.split('@')[0] : 'Customer'),
            email: currentUser.email || '',
            role: isAdmin ? 'admin' : 'customer',
            createdAt: new Date().toISOString(),
            blocked: false,
            totalOrders: 0
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
    toast.loading('Detecting your live GPS location & address...', { id: 'gps-toast' });
    try {
      const res = await getUserCurrentLocation({ timeoutMs: 15000 });
      toast.dismiss('gps-toast');
      if (res.coords) {
        setRegLocation(res.coords);
        
        if (res.coords.structuredAddress) {
          const st = res.coords.structuredAddress;
          setRegAddress(st.street || st.formattedAddress);
          if (st.city) setRegCity(st.city);
          if (st.pincode) setRegPincode(st.pincode);
        } else if (res.coords.address) {
          setRegAddress(res.coords.address);
          if (!regCity) setRegCity('Current Location');
        }

        const accuracyText = res.coords.accuracy ? ` (±${res.coords.accuracy}m)` : '';
        toast.success(`Live GPS & Address attached!${accuracyText} 📍`);
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

  // GPS auto-detect for editing profile address
  const handleDetectProfileGpsLocation = async () => {
    setIsDetectingGps(true);
    toast.loading('Acquiring current GPS location...', { id: 'edit-gps-toast' });
    try {
      const res = await getUserCurrentLocation({ timeoutMs: 15000 });
      toast.dismiss('edit-gps-toast');
      if (res.coords) {
        if (res.coords.structuredAddress) {
          const st = res.coords.structuredAddress;
          setEditAddress(st.street || st.formattedAddress);
          if (st.city) setEditCity(st.city);
          if (st.pincode) setEditPincode(st.pincode);
        } else if (res.coords.address) {
          setEditAddress(res.coords.address);
        }
        toast.success('Address populated from live GPS! 📍');
      } else if (res.error) {
        toast.error(res.error);
      }
    } catch (e) {
      toast.dismiss('edit-gps-toast');
      toast.error('Failed to detect GPS location.');
    } finally {
      setIsDetectingGps(false);
    }
  };

  // Google Sign-In
  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        const userDocRef = doc(db, 'users', result.user.uid);
        const snap = await getDoc(userDocRef);
        const emailLower = (result.user.email || '').toLowerCase();
        const isBootstrapAdmin = emailLower === ADMIN_BOOTSTRAP_EMAIL.toLowerCase();
        let userRole: UserRole = isBootstrapAdmin ? 'admin' : 'customer';
        
        if (!snap.exists()) {
          const newProf: UserProfile = {
            id: result.user.uid,
            name: result.user.displayName || 'Customer',
            email: emailLower,
            role: userRole,
            createdAt: new Date().toISOString(),
            blocked: false,
            totalOrders: 0
          };
          await setDoc(userDocRef, newProf);
          setUserProfile(newProf);
        } else {
          const existingData = snap.data() as UserProfile;
          if (existingData.blocked) {
            await signOut(auth);
            toast.error('Your account has been suspended by the administrator.');
            return;
          }
          if (isBootstrapAdmin && existingData.role !== 'admin') {
            await updateDoc(userDocRef, { role: 'admin' });
            existingData.role = 'admin';
          }
          userRole = existingData.role || userRole;
          setUserProfile(existingData);
        }

        const nameToGreet = result.user.displayName || 'Customer';
        onLogin?.(nameToGreet);
        onClose();

        if (userRole === 'admin') {
          toast.success(`Admin access verified! Opening Admin Dashboard 🛡️`);
          onNavigate?.('admin');
        } else if (userRole === 'rider') {
          toast.success(`Delivery partner verified! Opening Rider Portal 🛵`);
          onNavigate?.('rider');
        } else {
          toast.success(`Welcome back, ${nameToGreet}! 👋`);
        }
      }
    } catch (error: any) {
      console.error('Google Sign-In failed:', error);
      toast.error(getAuthErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  // Customer Registration Submit
  const handleCustomerRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regEmail.trim() || !regPassword) {
      toast.error('Please provide a valid email and password');
      return;
    }
    if (regPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      toast.error('Passwords do not match. Please re-enter.');
      return;
    }
    if (!regFullName.trim()) {
      toast.error('Please enter your full name');
      return;
    }
    if (!regAddress.trim()) {
      toast.error('Please provide your delivery address');
      return;
    }

    setLoading(true);
    const emailLower = regEmail.trim().toLowerCase();
    const isBootstrapAdmin = emailLower === ADMIN_BOOTSTRAP_EMAIL.toLowerCase();

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, emailLower, regPassword);
      const user = userCredential.user;

      await updateProfile(user, {
        displayName: regFullName.trim()
      });

      const customerProfile: UserProfile = {
        id: user.uid,
        name: regFullName.trim(),
        email: emailLower,
        phone: regMobile.trim(),
        role: isBootstrapAdmin ? 'admin' : 'customer',
        address: regAddress.trim(),
        city: regCity.trim() || 'New Delhi',
        pincode: regPincode.trim(),
        location: regLocation || undefined,
        createdAt: new Date().toISOString(),
        blocked: false,
        totalOrders: 0
      };

      await setDoc(doc(db, 'users', user.uid), customerProfile);
      setUserProfile(customerProfile);
      onLogin?.(regFullName.trim());
      onClose();

      if (isBootstrapAdmin) {
        toast.success(`Admin account registered! Opening Admin Dashboard 🛡️`);
        onNavigate?.('admin');
      } else {
        toast.success(`Registration successful! Welcome to M-Bites, ${regFullName.trim()} 🎉`);
      }
    } catch (error: any) {
      console.error('Registration attempt error:', error);
      const isEmailInUse = error.code === 'auth/email-already-in-use' || 
        (error.message && error.message.includes('email-already-in-use'));

      if (isEmailInUse) {
        // Smart fallback: If account already exists with this email, attempt immediate sign-in with the provided password
        try {
          const userCred = await signInWithEmailAndPassword(auth, emailLower, regPassword);
          const user = userCred.user;

          // Check and update profile in Firestore
          const userDocRef = doc(db, 'users', user.uid);
          const snap = await getDoc(userDocRef);
          let userRole: UserRole = isBootstrapAdmin ? 'admin' : 'customer';

          if (snap.exists()) {
            const prof = snap.data() as UserProfile;
            if (prof.blocked) {
              await signOut(auth);
              toast.error('This account is suspended. Please contact support.');
              return;
            }
            // Update profile with newest details if provided
            const updates: Partial<UserProfile> = {};
            if (regFullName.trim() && !prof.name) updates.name = regFullName.trim();
            if (regAddress.trim() && !prof.address) updates.address = regAddress.trim();
            if (regLocation && !prof.location) updates.location = regLocation;
            if (regMobile.trim() && !prof.phone) updates.phone = regMobile.trim();
            if (isBootstrapAdmin && prof.role !== 'admin') updates.role = 'admin';

            if (Object.keys(updates).length > 0) {
              await updateDoc(userDocRef, updates);
              Object.assign(prof, updates);
            }
            userRole = prof.role || userRole;
            setUserProfile(prof);
          } else {
            const customerProfile: UserProfile = {
              id: user.uid,
              name: regFullName.trim() || user.displayName || 'Customer',
              email: emailLower,
              phone: regMobile.trim(),
              role: isBootstrapAdmin ? 'admin' : 'customer',
              address: regAddress.trim(),
              city: regCity.trim() || 'New Delhi',
              pincode: regPincode.trim(),
              location: regLocation || undefined,
              createdAt: new Date().toISOString(),
              blocked: false,
              totalOrders: 0
            };
            await setDoc(userDocRef, customerProfile);
            setUserProfile(customerProfile);
          }

          const displayName = user.displayName || regFullName.trim() || 'Customer';
          onLogin?.(displayName);
          onClose();

          if (userRole === 'admin') {
            toast.success(`Welcome back, Admin! Opening Admin Dashboard 🛡️`);
            onNavigate?.('admin');
          } else {
            toast.success(`Welcome back, ${displayName}! Logged in to your existing account 🍔`);
          }
          return;
        } catch (loginErr: any) {
          // If password was incorrect or different
          toast.error('This email is already registered. Switched to Sign In — please enter your password.', { duration: 5000 });
          setLoginIdentifier(emailLower);
          setActiveTab('customer-login');
        }
      } else {
        toast.error(getAuthErrorMessage(error));
      }
    } finally {
      setLoading(false);
    }
  };

  // Customer Email / Mobile Login
  const handleCustomerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginIdentifier.trim() || !loginPassword) {
      toast.error('Please enter your registered email/phone and password');
      return;
    }

    setLoading(true);
    try {
      const resolvedEmail = await resolveEmailFromIdentifier(loginIdentifier);
      const userCred = await signInWithEmailAndPassword(auth, resolvedEmail, loginPassword);
      const user = userCred.user;
      const isBootstrapAdmin = (user.email || '').toLowerCase() === ADMIN_BOOTSTRAP_EMAIL.toLowerCase();

      // Verify Firestore profile
      const userDocRef = doc(db, 'users', user.uid);
      const snap = await getDoc(userDocRef);
      let userRole: UserRole = isBootstrapAdmin ? 'admin' : 'customer';

      if (snap.exists()) {
        const prof = snap.data() as UserProfile;
        if (prof.blocked) {
          await signOut(auth);
          toast.error('This account is suspended. Please contact support.');
          return;
        }
        if (isBootstrapAdmin && prof.role !== 'admin') {
          await updateDoc(userDocRef, { role: 'admin' });
          prof.role = 'admin';
        }
        userRole = prof.role || userRole;
        setUserProfile(prof);
      } else if (isBootstrapAdmin) {
        const adminProf: UserProfile = {
          id: user.uid,
          name: user.displayName || 'Administrator',
          email: user.email || ADMIN_BOOTSTRAP_EMAIL,
          role: 'admin',
          createdAt: new Date().toISOString(),
          blocked: false,
          totalOrders: 0
        };
        await setDoc(userDocRef, adminProf);
        setUserProfile(adminProf);
      }
      
      const displayName = user.displayName || (user.email ? user.email.split('@')[0] : 'Customer');
      onLogin?.(displayName);
      onClose();

      if (userRole === 'admin') {
        toast.success(`Admin clearance verified! Opening Admin Dashboard 🛡️`);
        onNavigate?.('admin');
      } else if (userRole === 'rider') {
        toast.success(`Delivery partner verified! Opening Rider Portal 🛵`);
        onNavigate?.('rider');
      } else {
        toast.success(`Welcome back, ${displayName}! 🍔`);
      }
    } catch (error: any) {
      console.error('Customer Login error:', error);
      toast.error(getAuthErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  // Delivery Boy / Rider Login
  const handleRiderLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!riderIdentifier.trim() || !riderPassword) {
      toast.error('Please enter Rider email/mobile and password');
      return;
    }

    setLoading(true);
    try {
      const email = await resolveEmailFromIdentifier(riderIdentifier);
      const userCred = await signInWithEmailAndPassword(auth, email, riderPassword);
      const user = userCred.user;

      // Verify Rider or Admin Role
      const userDocRef = doc(db, 'users', user.uid);
      const snap = await getDoc(userDocRef);
      let isRiderAuthorized = false;

      if (snap.exists()) {
        const prof = snap.data() as UserProfile;
        if (prof.role === 'rider' || prof.role === 'admin' || user.email === ADMIN_BOOTSTRAP_EMAIL) {
          isRiderAuthorized = true;
        }
        setUserProfile(prof);
      } else if (user.email === ADMIN_BOOTSTRAP_EMAIL) {
        isRiderAuthorized = true;
      }

      if (!isRiderAuthorized) {
        toast('Logged in, but this account is not registered as a Delivery Partner. Register with Admin for rider access.', { icon: 'ℹ️' });
      } else {
        toast.success(`Welcome Rider, ${user.displayName || 'Partner'}! 🛵`);
      }

      onLogin?.(user.displayName || 'Delivery Partner');
      onClose();
      onNavigate?.('rider');
    } catch (error: any) {
      console.error('Rider Login error:', error);
      toast.error(getAuthErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  // Forgot Password Request
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      toast.error('Please enter your registered email address');
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, forgotEmail.trim().toLowerCase());
      setResetEmailSent(true);
      toast.success('Password reset link sent to your email! Please check your inbox ✉️');
    } catch (error: any) {
      console.error('Password reset error:', error);
      toast.error(getAuthErrorMessage(error));
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
        address: editAddress.trim(),
        city: editCity.trim(),
        pincode: editPincode.trim(),
        phone: editPhone.trim()
      });
      setUserProfile((prev) => prev ? { 
        ...prev, 
        address: editAddress.trim(), 
        city: editCity.trim(), 
        pincode: editPincode.trim(), 
        phone: editPhone.trim() 
      } : null);
      setIsEditingProfile(false);
      toast.success('Address and contact details updated successfully! 💾');
    } catch (e: any) {
      toast.error('Failed to update details. Please try again.');
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
            className="absolute top-5 right-5 text-gray-500 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors rounded-full p-2 cursor-pointer z-10"
          >
            <X className="w-5 h-5" />
          </button>

          {/* ========================================================= */}
          {/* IF USER IS ALREADY LOGGED IN: SHOW ACCOUNT DASHBOARD     */}
          {/* ========================================================= */}
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
                    {isUserAdmin(currentUser.email, userProfile) && (
                      <span className="bg-blue-500/20 text-blue-500 text-xs px-2.5 py-0.5 rounded-full font-bold">
                        Admin
                      </span>
                    )}
                    {userProfile?.role === 'rider' && !isUserAdmin(currentUser.email, userProfile) && (
                      <span className="bg-amber-500/20 text-amber-500 text-xs px-2.5 py-0.5 rounded-full font-bold">
                        Rider
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
                    className="text-xs font-bold text-[#E23744] hover:underline flex items-center gap-1 cursor-pointer"
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
                      type="button"
                      onClick={handleDetectProfileGpsLocation}
                      disabled={isDetectingGps}
                      className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-xs font-bold transition-all cursor-pointer"
                    >
                      <Locate className={`w-3.5 h-3.5 ${isDetectingGps ? 'animate-spin' : ''}`} />
                      <span>{isDetectingGps ? 'Acquiring GPS...' : 'Auto-Detect Address via Live GPS'}</span>
                    </button>

                    <button 
                      onClick={handleSaveProfile}
                      disabled={loading}
                      className="w-full mt-2 bg-[#E23744] hover:bg-[#d12c38] text-white py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
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
                  className="flex items-center gap-3 p-4 rounded-2xl bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/5 hover:border-[#E23744]/40 hover:bg-[#E23744]/5 text-gray-900 dark:text-white text-left transition-all group cursor-pointer"
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
                  className="flex items-center gap-3 p-4 rounded-2xl bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/5 hover:border-emerald-500/40 hover:bg-emerald-500/5 text-gray-900 dark:text-white text-left transition-all group cursor-pointer"
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
                {isUserAdmin(currentUser.email, userProfile) && (
                  <button
                    onClick={() => {
                      onClose();
                      onNavigate?.('admin');
                    }}
                    className="sm:col-span-2 flex items-center justify-between p-4 rounded-2xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 font-bold text-sm hover:scale-[1.01] transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <ShieldCheck className="w-5 h-5" />
                      <span>Open Admin Control Dashboard</span>
                    </div>
                    <span>→</span>
                  </button>
                )}

                {/* Direct Rider Portal button for riders or admin */}
                {(userProfile?.role === 'rider' || isUserAdmin(currentUser.email, userProfile)) && (
                  <button
                    onClick={() => {
                      onClose();
                      onNavigate?.('rider');
                    }}
                    className="sm:col-span-2 flex items-center justify-between p-4 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-sm hover:scale-[1.01] transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <Bike className="w-5 h-5" />
                      <span>Open Delivery Partner (Rider) Portal</span>
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
                className="w-full py-3.5 rounded-xl border border-red-500/30 text-[#E23744] hover:bg-red-500/10 font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                Log Out
              </button>
            </div>
          ) : (
            /* ========================================================= */
            /* UN-AUTHENTICATED: LOGIN / REGISTER / RIDER VIEWS          */
            /* ========================================================= */
            <>
              {/* Dedicated Partner / Rider Login Back-Button */}
              {activeTab === 'rider-login' ? (
                <div className="mb-6 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setActiveTab('customer-login')}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Customer Sign In</span>
                  </button>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-mono">
                    FLEET PORTAL
                  </span>
                </div>
              ) : activeTab !== 'forgot-password' ? (
                /* Sleek 2-segment Customer Switcher */
                <div className="grid grid-cols-2 gap-2 bg-gray-100 dark:bg-[#0a0a0a] p-1.5 rounded-2xl mb-6 border border-black/5 dark:border-white/5">
                  <button
                    type="button"
                    onClick={() => setActiveTab('customer-login')}
                    className={`py-2.5 px-3 text-xs font-extrabold rounded-xl transition-all text-center cursor-pointer ${
                      activeTab === 'customer-login'
                        ? 'bg-white dark:bg-[#1f1f1f] text-gray-900 dark:text-white shadow-md'
                        : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('register')}
                    className={`py-2.5 px-3 text-xs font-extrabold rounded-xl transition-all text-center cursor-pointer ${
                      activeTab === 'register'
                        ? 'bg-gradient-to-r from-[#E23744] to-[#FF5E5E] text-white shadow-md shadow-red-500/20'
                        : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    Create Account
                  </button>
                </div>
              ) : null}

              {/* ------------------------------------------------------------- */}
              {/* TAB 1: CUSTOMER LOGIN                                         */}
              {/* ------------------------------------------------------------- */}
              {activeTab === 'customer-login' && (
                <div>
                  <div className="mb-5">
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                      Welcome Back 👋
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Log in to access saved addresses, order history, and real-time live GPS tracking.
                    </p>
                  </div>

                  {/* 1-tap Google Sign-In */}
                  <button 
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-3 bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white font-bold text-sm py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 active:scale-[0.98] transition-all mb-4 shadow-sm cursor-pointer"
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
                    <span className="text-gray-400 font-bold text-xs uppercase">OR with Email / Mobile</span>
                    <div className="flex-1 h-px bg-gray-200 dark:bg-white/10"></div>
                  </div>

                  <form onSubmit={handleCustomerLogin} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                        Registered Email or 10-Digit Mobile
                      </label>
                      <div className="relative">
                        <input 
                          type="text" 
                          required
                          value={loginIdentifier}
                          onChange={(e) => setLoginIdentifier(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#0a0a0a] text-gray-900 dark:text-white text-sm focus:border-[#E23744] outline-none" 
                          placeholder="name@example.com or 9876543210" 
                        />
                        <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">Password</label>
                        <button 
                          type="button" 
                          onClick={() => setShowPassword(!showPassword)}
                          className="text-xs text-[#E23744] hover:underline font-bold cursor-pointer"
                        >
                          {showPassword ? 'Hide' : 'Show'}
                        </button>
                      </div>
                      <div className="relative">
                        <input 
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#0a0a0a] text-gray-900 dark:text-white text-sm focus:border-[#E23744] outline-none" 
                          placeholder="••••••••" 
                        />
                        <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                        <button 
                          type="button" 
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setForgotEmail(loginIdentifier.includes('@') ? loginIdentifier : '');
                          setActiveTab('forgot-password');
                        }}
                        className="text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-[#E23744] cursor-pointer"
                      >
                        Forgot Password?
                      </button>
                    </div>

                    <button 
                      type="submit" 
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-[#E23744] to-[#FF5E5E] text-white font-bold text-base py-3.5 rounded-xl hover:shadow-[0_0_20px_rgba(226,55,68,0.4)] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Logging in...</span>
                        </>
                      ) : (
                        <span>Login to My Account</span>
                      )}
                    </button>
                  </form>

                  <div className="mt-6 text-center text-xs font-medium text-gray-600 dark:text-gray-400">
                    New customer?{' '}
                    <button 
                      type="button" 
                      onClick={() => setActiveTab('register')} 
                      className="text-[#E23744] font-black hover:underline cursor-pointer"
                    >
                      Register to Order here
                    </button>
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* TAB 2: REGISTER TO ORDER                                      */}
              {/* ------------------------------------------------------------- */}
              {activeTab === 'register' && (
                <div>
                  <div className="mb-5">
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                      Register to Order Food 🍔
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Create your M-Bites account with delivery address & GPS for real-time tracking.
                    </p>
                  </div>

                  {/* 1-Tap Google Sign-Up */}
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1e1e1e] hover:bg-gray-50 dark:hover:bg-[#252525] text-gray-800 dark:text-white font-bold text-sm shadow-sm hover:shadow transition-all cursor-pointer mb-5"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Instant Sign-Up with Google</span>
                  </button>

                  <div className="relative mb-5 text-center">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200 dark:border-white/10"></div>
                    </div>
                    <span className="relative px-3 bg-white dark:bg-[#141414] text-[11px] font-bold uppercase tracking-wider text-gray-400">
                      Or Register with Email / Mobile
                    </span>
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
                            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
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
                        className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
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
                      className="w-full bg-gradient-to-r from-[#E23744] to-[#FF5E5E] text-white font-bold text-base py-3.5 rounded-xl hover:shadow-[0_0_20px_rgba(226,55,68,0.4)] active:scale-[0.98] transition-all cursor-pointer mt-2 flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Creating Account...</span>
                        </>
                      ) : (
                        <span>Complete Registration & Order</span>
                      )}
                    </button>
                  </form>

                  <div className="mt-5 text-center text-xs font-medium text-gray-600 dark:text-gray-400">
                    Already have an account?{' '}
                    <button 
                      type="button" 
                      onClick={() => setActiveTab('customer-login')} 
                      className="text-[#E23744] font-black hover:underline cursor-pointer"
                    >
                      Sign In to My Account
                    </button>
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* TAB 2: RIDER (DELIVERY BOY) LOGIN                             */}
              {/* ------------------------------------------------------------- */}
              {activeTab === 'rider-login' && (
                <div>
                  <div className="mb-5">
                    <div className="flex items-center gap-2 text-amber-500 font-black text-xs uppercase tracking-wider mb-1">
                      <Bike className="w-4 h-4" />
                      Delivery Fleet Access
                    </div>
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                      Delivery Boy (Rider) Login 🛵
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Log in to access your assigned orders, accept pickups, and broadcast live GPS location to customers.
                    </p>
                  </div>

                  <form onSubmit={handleRiderLogin} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                        Rider Registered Email or Mobile
                      </label>
                      <div className="relative">
                        <input 
                          type="text" 
                          required
                          value={riderIdentifier}
                          onChange={(e) => setRiderIdentifier(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-amber-500/20 bg-amber-50/30 dark:bg-amber-950/20 text-gray-900 dark:text-white text-sm focus:border-amber-500 outline-none" 
                          placeholder="rider@mbites.com or 9876543210" 
                        />
                        <Mail className="w-4 h-4 text-amber-400 absolute left-3.5 top-3.5" />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">Rider Password</label>
                        <button 
                          type="button" 
                          onClick={() => setShowPassword(!showPassword)}
                          className="text-xs text-amber-500 hover:underline font-bold cursor-pointer"
                        >
                          {showPassword ? 'Hide' : 'Show'}
                        </button>
                      </div>
                      <div className="relative">
                        <input 
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={riderPassword}
                          onChange={(e) => setRiderPassword(e.target.value)}
                          className="w-full pl-10 pr-10 py-3 rounded-xl border border-amber-500/20 bg-amber-50/30 dark:bg-amber-950/20 text-gray-900 dark:text-white text-sm focus:border-amber-500 outline-none" 
                          placeholder="••••••••" 
                        />
                        <Lock className="w-4 h-4 text-amber-400 absolute left-3.5 top-3.5" />
                        <button 
                          type="button" 
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <button 
                      type="submit" 
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black font-extrabold text-base py-3.5 rounded-xl shadow-lg shadow-amber-500/25 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Connecting Fleet Portal...</span>
                        </>
                      ) : (
                        <>
                          <Bike className="w-5 h-5" />
                          <span>Login to Rider Delivery Dashboard</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* TAB 5: FORGOT PASSWORD                                        */}
              {/* ------------------------------------------------------------- */}
              {activeTab === 'forgot-password' && (
                <div>
                  <div className="mb-5">
                    <button
                      type="button"
                      onClick={() => setActiveTab('customer-login')}
                      className="text-xs text-gray-500 hover:text-[#E23744] font-bold mb-3 flex items-center gap-1 cursor-pointer"
                    >
                      ← Back to Login
                    </button>
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                      Reset Password 🔑
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Enter your registered email address and we will send you a secure password reset link.
                    </p>
                  </div>

                  {resetEmailSent ? (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5 text-center space-y-3">
                      <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                      <h4 className="font-bold text-base text-gray-900 dark:text-white">Reset Link Dispatched!</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        We sent instructions to <strong className="text-gray-900 dark:text-white">{forgotEmail}</strong>. Please follow the link to set your new password.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setResetEmailSent(false);
                          setActiveTab('customer-login');
                        }}
                        className="w-full mt-2 py-2.5 bg-[#E23744] text-white rounded-xl text-xs font-bold cursor-pointer"
                      >
                        Return to Login
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleForgotPassword} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                          Registered Email Address
                        </label>
                        <div className="relative">
                          <input 
                            type="email" 
                            required
                            value={forgotEmail}
                            onChange={(e) => setForgotEmail(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#0a0a0a] text-gray-900 dark:text-white text-sm focus:border-[#E23744] outline-none" 
                            placeholder="name@example.com" 
                          />
                          <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                        </div>
                      </div>

                      <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-[#E23744] hover:bg-[#d12c38] text-white font-bold text-base py-3.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                      >
                        {loading ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Sending link...</span>
                          </>
                        ) : (
                          <span>Send Password Reset Link</span>
                        )}
                      </button>
                    </form>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
