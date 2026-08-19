/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth, db } from './firebase';
import { collection, doc, setDoc, updateDoc, onSnapshot, query, where } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from './lib/firestore-errors';
import { AnimatePresence } from 'motion/react';
import { ShieldCheck, Bike, ArrowLeft, Lock } from 'lucide-react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Banners from './components/Banners';
import Categories from './components/Categories';
import ProductGrid from './components/ProductGrid';
import BottomNav from './components/BottomNav';
import MenuPage from './components/MenuPage';
import CartPanel from './components/CartPanel';
import CheckoutPage from './components/CheckoutPage';
import SuccessScreen from './components/SuccessScreen';
import OffersPage from './components/OffersPage';
import SkeletonGrid from './components/SkeletonGrid';

import OrdersPage from './components/OrdersPage';
import AdminDashboard from './components/AdminDashboard';
import DeliveryPartnerDashboard from './components/DeliveryPartnerDashboard';
import SearchPage from './components/SearchPage';
import WishlistPage from './components/WishlistPage';
import ProfileModal from './components/ProfileModal';
import MobileMenu from './components/MobileMenu';
import ProductModal from './components/ProductModal';
import Footer from './components/Footer';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import OfflineBanner from './components/OfflineBanner';
import { Order, CartItem, OrderStatus, RestaurantLocation, UserProfile } from './types';
import { DEFAULT_CUSTOMER_LOCATION, DEFAULT_RESTAURANT_LOCATION } from './utils/geoUtils';
import { registerServiceWorker, sendOrderStatusNotification } from './utils/pwaUtils';
import { isUserAdmin, isUserRider, ADMIN_BOOTSTRAP_EMAIL } from './utils/authUtils';

type ViewState = 'home' | 'menu' | 'checkout' | 'success' | 'offers' | 'search' | 'orders' | 'admin' | 'rider' | 'wishlist';

export default function App() {
  const [view, setView] = useState<ViewState>('home');
  const [selectedRestaurant, setSelectedRestaurant] = useState<any>(null);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileInitialMode, setProfileInitialMode] = useState<'login' | 'register' | 'admin' | 'rider'>('login');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);
  const [activeKitchenLocation, setActiveKitchenLocation] = useState<RestaurantLocation>(DEFAULT_RESTAURANT_LOCATION);
  const prevOrderStatusMap = useRef<Record<string, OrderStatus>>({});

  // Advanced Features State
  const [currentOrder, setCurrentOrder] = useState<Order | undefined>(undefined);
  const [orders, setOrders] = useState<Order[]>([]);
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Register PWA Service Worker on Mount
  useEffect(() => {
    registerServiceWorker();

    // Check URL parameters for view navigation (e.g. from PWA shortcut or Notification Click)
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view') as ViewState | null;
    if (viewParam && ['home', 'menu', 'checkout', 'success', 'offers', 'search', 'orders', 'admin', 'rider', 'wishlist'].includes(viewParam)) {
      setView(viewParam);
    }
  }, []);
  
  // Track Firebase Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        setUserName(user.displayName || (user.email ? user.email.split('@')[0] : 'User'));
        setUserEmail(user.email);
      } else {
        setUserEmail(null);
        setUserName(null);
        setCurrentUserProfile(null);
        setOrders([]);
      }
    });
    return () => unsubscribe();
  }, []);

  // Sync user profile from Firestore in real-time
  useEffect(() => {
    if (!currentUser) {
      setCurrentUserProfile(null);
      return;
    }

    const unsubProfile = onSnapshot(doc(db, 'users', currentUser.uid), (docSnap) => {
      if (docSnap.exists()) {
        const prof = docSnap.data() as UserProfile;
        setCurrentUserProfile(prof);
        if (prof.name && !currentUser.displayName) {
          setUserName(prof.name);
        }
        if (prof.blocked) {
          signOut(auth);
          toast.error('This account has been suspended by the administrator.');
        }
      }
    }, (err) => {
      console.warn('User profile sync notice:', err);
    });

    return () => unsubProfile();
  }, [currentUser]);

  const isAdmin = isUserAdmin(userEmail, currentUserProfile);
  const isRider = isUserRider(currentUserProfile) || isAdmin;

  // Fetch / Sync Orders from Firestore & Trigger Push/Toast notifications on status change
  useEffect(() => {
    if (!currentUser) return;
    
    let q;
    if (currentUser.email === 'murlimanohar7041@gmail.com') {
      // Admin sees all orders
      q = query(collection(db, 'orders'));
    } else {
      q = query(collection(db, 'orders'), where('userId', '==', currentUser.uid));
    }

    const unSub = onSnapshot(q, (snapshot) => {
      const fetchedOrders: Order[] = [];
      snapshot.forEach((docSnap) => {
        const ord = { id: docSnap.id, ...docSnap.data() } as Order;
        fetchedOrders.push(ord);

        // Check if status changed for this order
        const previousStatus = prevOrderStatusMap.current[ord.id];
        if (previousStatus && previousStatus !== ord.status) {
          sendOrderStatusNotification(ord.id, ord.status, ord.restaurantName || 'Restaurant');
        }
        prevOrderStatusMap.current[ord.id] = ord.status;
      });
      // Sort orders descending
      fetchedOrders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setOrders(fetchedOrders);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'orders');
    });

    return () => unSub();
  }, [currentUser]);

  // Real-time synchronization of Store / Kitchen GPS location
  useEffect(() => {
    const unsubKitchen = onSnapshot(doc(db, 'settings', 'kitchenLocation'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as RestaurantLocation;
        if (data.lat && data.lng) {
          setActiveKitchenLocation(data);
        }
      }
    }, (err) => {
      console.warn('Kitchen location sync notice:', err);
    });

    return () => unsubKitchen();
  }, []);

  useEffect(() => {
    // Default to dark mode
    document.documentElement.classList.add('dark');
  }, []);

  const handleNavChange = useCallback((newView: ViewState, restaurant: any = null) => {
    if (restaurant !== null) {
      setSelectedRestaurant(restaurant);
    }
    setView(newView);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Handle hardware/browser back buttons intuitively
  useEffect(() => {
    if (view !== 'home' || isCartOpen || isProfileOpen || isMobileMenuOpen) {
      window.history.pushState({ modalObject: true }, '');
    }
  }, [view, isCartOpen, isProfileOpen, isMobileMenuOpen]);

  useEffect(() => {
    const handlePopState = () => {
      if (isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      } else if (isCartOpen) {
        setIsCartOpen(false);
      } else if (isProfileOpen) {
        setIsProfileOpen(false);
      } else if (view !== 'home') {
        if (view === 'checkout') handleNavChange(selectedRestaurant ? 'menu' : 'home');
        else if (view === 'success') handleNavChange('home');
        else handleNavChange('home'); 
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [view, isCartOpen, isProfileOpen, isMobileMenuOpen, selectedRestaurant, handleNavChange]);

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleLogin = useCallback((name: string) => {
    setUserName(name);
    setIsProfileOpen(false);
    toast.success(`Welcome back, ${name}!`);
  }, []);

  const handleAddToCart = useCallback((item: any) => {
    setCartItems(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { id: item.id, name: item.name, price: item.price, quantity: 1, isVeg: item.isVeg, image: item.image || '' }];
    });
    toast.success(`${item.name} added to cart!`, { duration: 1500, id: `add-${item.id}` });
  }, []);

  const handleBuyNow = useCallback((item: any) => {
    setCartItems(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { id: item.id, name: item.name, price: item.price, quantity: 1, isVeg: item.isVeg, image: item.image || '' }];
    });
    handleNavChange('checkout');
  }, [handleNavChange]);

  const handleUpdateQuantity = useCallback((id: number, delta: number) => {
    setCartItems(prev => {
      return prev.map(item => {
        if (item.id === id) {
          return { ...item, quantity: Math.max(0, item.quantity + delta) };
        }
        return item;
      }).filter(item => item.quantity > 0);
    });
  }, []);

  const handleToggleWishlist = useCallback((id: number) => {
    setWishlist(prev => {
      const isSaved = prev.includes(id);
      if (isSaved) {
        toast('Removed from wishlist', { icon: '🤍', id: `wish-${id}`, duration: 1500 });
        return prev.filter(i => i !== id);
      } else {
        toast.success('Saved to wishlist!', { icon: '❤️', id: `wish-${id}`, duration: 1500 });
        return [...prev, id];
      }
    });
  }, []);

  const handleCheckout = useCallback(() => {
    setIsCartOpen(false);
    handleNavChange('checkout');
  }, [handleNavChange]);

  const handlePlaceOrder = async (orderData: Omit<Order, 'id' | 'date' | 'status'>) => {
    if (!currentUser) {
      toast.error('Please login to place an order');
      return;
    }

    const cLoc = orderData.customerLocation || DEFAULT_CUSTOMER_LOCATION;
    const rLoc: RestaurantLocation = {
      name: selectedRestaurant?.name || activeKitchenLocation.name || 'M-Bites Gourmet Kitchen',
      lat: activeKitchenLocation.lat || DEFAULT_RESTAURANT_LOCATION.lat,
      lng: activeKitchenLocation.lng || DEFAULT_RESTAURANT_LOCATION.lng,
      address: activeKitchenLocation.address || DEFAULT_RESTAURANT_LOCATION.address
    };
    
    const newOrder: Order = {
      ...orderData,
      id: Math.floor(100000000 + Math.random() * 900000000).toString(),
      date: new Date().toISOString(),
      status: 'Pending',
      userId: currentUser.uid,
      userEmail: currentUser.email || '',
      restaurantName: rLoc.name,
      customerLocation: cLoc,
      restaurantLocation: rLoc,
      deliveryLocation: {
        lat: rLoc.lat,
        lng: rLoc.lng,
        heading: 0,
        speed: 0,
        updatedAt: new Date().toISOString()
      },
      deliveryPartner: {
        name: 'Rahul Sharma',
        phone: '+91 98765 43210',
        vehicleNumber: 'DL 08 CD 4921',
        vehicleType: 'bike',
        rating: 4.85,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop'
      }
    };
    
    // UI Updates
    setCurrentOrder(newOrder);
    setCartItems([]);
    handleNavChange('success');

    // Firebase requires defined values. JSON serialization safely strips `undefined` fields.
    const cleanOrder = JSON.parse(JSON.stringify(newOrder));

    try {
      await setDoc(doc(db, 'orders', cleanOrder.id), cleanOrder);
      toast.success('Order placed successfully! 🎉', { duration: 4000 });
    } catch (error) {
      console.error(error);
      handleFirestoreError(error, OperationType.CREATE, `orders/${newOrder.id}`);
    }
  };

  const handleBackToHome = useCallback(() => {
    handleNavChange('home', null);
  }, [handleNavChange]);

  const handleLogout = useCallback(async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error(e);
    }
    setUserName(null);
    setUserEmail(null);
    setCurrentUserProfile(null);
    toast.success('Logged out successfully');
  }, []);

  const openProfileWithMode = (mode: 'login' | 'register' | 'admin' | 'rider' = 'login') => {
    setProfileInitialMode(mode);
    setIsProfileOpen(true);
  };

  // Render different full-page views
  if (view === 'admin') {
    if (!isAdmin) {
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-[#141414] p-8 rounded-3xl border border-blue-500/20 shadow-2xl text-center space-y-5">
            <div className="w-16 h-16 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center mx-auto">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white">Admin Clearance Required</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                This area is restricted to authorized M-Bites administrators only. Please log in with admin credentials.
              </p>
            </div>
            <div className="space-y-3 pt-2">
              <button
                onClick={() => openProfileWithMode('admin')}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Lock className="w-4 h-4" />
                <span>Login with Admin Credentials</span>
              </button>
              <button
                onClick={() => setView('home')}
                className="w-full py-3 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Home</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <AdminDashboard 
        orders={orders}
        onUpdateOrderStatus={async (id: string, status: string) => {
          try {
            await updateDoc(doc(db, 'orders', id), { status });
          } catch (error) {
            handleFirestoreError(error, OperationType.UPDATE, `orders/${id}`);
          }
        }}
        onBack={() => setView('home')}
      />
    );
  }

  if (view === 'rider') {
    if (!isRider) {
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-[#141414] p-8 rounded-3xl border border-amber-500/20 shadow-2xl text-center space-y-5">
            <div className="w-16 h-16 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center mx-auto">
              <Bike className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white">Delivery Fleet Access</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Sign in with your Delivery Partner / Rider account to view your deliveries and broadcast live GPS.
              </p>
            </div>
            <div className="space-y-3 pt-2">
              <button
                onClick={() => openProfileWithMode('rider')}
                className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black font-extrabold rounded-xl shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Bike className="w-5 h-5" />
                <span>Login as Delivery Boy / Rider</span>
              </button>
              <button
                onClick={() => setView('home')}
                className="w-full py-3 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Home</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <DeliveryPartnerDashboard
        onBack={() => setView('home')}
        partnerEmail={userEmail || ''}
      />
    );
  }

  if (view === 'success') {
    return (
      <SuccessScreen 
        order={currentOrder}
        onViewOrders={() => setView('orders')}
        onBackToHome={handleBackToHome} 
      />
    );
  }

  if (view === 'checkout') {
    return (
      <CheckoutPage 
        cartItems={cartItems} 
        currentUser={currentUser}
        onBack={() => setView(selectedRestaurant ? 'menu' : 'home')} 
        onRequireAuth={() => setIsProfileOpen(true)}
        onPlaceOrder={handlePlaceOrder} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] pb-16 md:pb-0 font-sans text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <Navbar 
        cartCount={cartCount} 
        onOpenCart={() => setIsCartOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        onOpenOffers={() => handleNavChange('offers')}
        onGoHome={() => handleNavChange('home', null)}
        userName={userName}
        setView={(v) => handleNavChange(v)}
        setSearchQuery={setSearchQuery}
        onLogout={handleLogout}
        isAdmin={isAdmin}
      />
      <Toaster 
        position="bottom-center"
        toastOptions={{
          style: {
            background: '#181818',
            color: '#fff',
            borderRadius: '10px',
            border: '1px solid rgba(255,255,255,0.1)',
            fontSize: '13px'
          },
        }}
      />
      <main>
        {isTransitioning ? (
          <SkeletonGrid />
        ) : (
          <>
            {view === 'menu' && selectedRestaurant && (
              <MenuPage 
                restaurant={selectedRestaurant} 
                onBack={() => handleNavChange('home', null)} 
                cartItems={cartItems}
                wishlistIds={wishlist}
                onAddToCart={handleAddToCart}
                onBuyNow={handleBuyNow}
                onProductClick={setSelectedProduct}
                onUpdateQuantity={handleUpdateQuantity}
                onToggleWishlist={handleToggleWishlist}
                onSearch={() => handleNavChange('search')}
              />
            )}
            
            {view === 'offers' && (
              <OffersPage 
                onSelectRestaurant={(restaurant) => handleNavChange('menu', restaurant)}
                onBack={() => handleNavChange('home')}
              />
            )}
            
            {view === 'orders' && (
              <OrdersPage 
                orders={orders}
                onBack={() => handleNavChange('home')}
                isAdmin={isAdmin}
                onReorder={(items) => {
                  items.forEach(i => handleAddToCart(i));
                  setIsCartOpen(true);
                }}
              />
            )}

            {view === 'wishlist' && (
              <WishlistPage 
                wishlistIds={wishlist}
                onRemoveFromWishlist={handleToggleWishlist}
                onAddToCart={handleAddToCart}
                onBuyNow={handleBuyNow}
                onProductClick={setSelectedProduct}
                onBack={() => handleNavChange('home')}
              />
            )}

            {view === 'search' && (
              <SearchPage 
                initialQuery={searchQuery}
                onBack={() => handleNavChange('home')}
                onAddToCart={handleAddToCart}
                onBuyNow={handleBuyNow}
                onProductClick={setSelectedProduct}
                wishlistIds={wishlist}
                onToggleWishlist={handleToggleWishlist}
              />
            )}

            {view === 'home' && (
              <>
                <Hero setView={(v) => handleNavChange(v)} setSearchQuery={setSearchQuery} />
                <Banners onBannerClick={(tag) => {
                  setSearchQuery(tag);
                  handleNavChange('search');
                }} />
                <Categories setView={(v) => handleNavChange(v)} setSearchQuery={setSearchQuery} />
                <ProductGrid 
                  onAddToCart={handleAddToCart}
                  onBuyNow={handleBuyNow}
                  onProductClick={setSelectedProduct}
                  wishlistIds={wishlist}
                  onToggleWishlist={handleToggleWishlist}
                />
              </>
            )}
          </>
        )}
        {['home', 'search', 'menu', 'offers'].includes(view) && (
          <Footer onOpenRiderPortal={() => {
            setProfileInitialMode('rider');
            setIsProfileOpen(true);
          }} />
        )}
      </main>

      {/* Offline Connectivity Indicator */}
      <OfflineBanner />

      {/* PWA Floating Install Prompt */}
      <PWAInstallPrompt />

      <BottomNav 
        cartCount={cartCount} 
        activeOrderCount={orders.filter(o => !['Delivered', 'Cancelled'].includes(o.status)).length}
        onOpenCart={() => setIsCartOpen(true)} 
        onOpenProfile={() => setIsProfileOpen(true)} 
        onGoHome={() => handleNavChange('home', null)}
        onOpenWishlist={() => handleNavChange('wishlist', null)}
        onOpenOrders={() => handleNavChange('orders', null)}
        activeView={view}
      />
      
      <CartPanel 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onCheckout={handleCheckout}
      />
      
      <ProfileModal 
        isOpen={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)} 
        initialMode={profileInitialMode}
        onLogin={handleLogin}
        onNavigate={(v) => handleNavChange(v as ViewState)}
      />
      
      <MobileMenu 
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)} 
        onOpenProfile={() => setIsProfileOpen(true)}
        userName={userName}
        onLogout={handleLogout}
        setView={(v) => handleNavChange(v as ViewState)}
        isAdmin={isAdmin}
      />

      <AnimatePresence>
        {selectedProduct && (
          <ProductModal
            product={selectedProduct}
            onClose={() => setSelectedProduct(null)}
            onAddToCart={handleAddToCart}
            onBuyNow={handleBuyNow}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
