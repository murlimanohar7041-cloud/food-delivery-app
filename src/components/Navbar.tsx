import { Search, MapPin, ShoppingBag, User, Menu, ChevronDown, LogOut, Sun, Moon, TrendingUp, Heart, LayoutGrid, Tag, Download, Bell, Smartphone } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useEffect, useState, useRef } from 'react';
import { usePWAInstall, requestNotificationPermission } from '../utils/pwaUtils';

interface NavbarProps {
  cartCount: number;
  onOpenCart: () => void;
  onOpenProfile: () => void;
  onOpenMobileMenu: () => void;
  onOpenOffers: () => void;
  onGoHome: () => void;
  userName: string | null;
  onLogout: () => void;
  setView: (view: any) => void;
  setSearchQuery: (q: string) => void;
  isAdmin?: boolean;
}

export default function Navbar({ cartCount, onOpenCart, onOpenProfile, onOpenMobileMenu, onOpenOffers, onGoHome, userName, onLogout, setView, setSearchQuery, isAdmin }: NavbarProps) {
  const [isDark, setIsDark] = useState(() => {
    return document.documentElement.classList.contains('dark');
  });
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { isInstallable, isInstalled, isIOS, triggerInstall } = usePWAInstall();
  const menuRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const handleInstallClick = async () => {
    await triggerInstall();
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-black/10 dark:border-white/10 transition-all duration-300 shadow-sm dark:shadow-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-[72px]">
          {/* Logo & Location */}
          <div className="flex items-center gap-3 md:gap-4 min-w-0">
            <div className="flex items-center gap-2.5 min-w-0 cursor-pointer group" onClick={onGoHome}>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#FF385C] via-[#E23744] to-[#B3131E] p-0.5 shadow-md group-hover:scale-105 transition-transform flex items-center justify-center shrink-0">
                <img src="/icon.svg" alt="M-Bites Logo" className="w-full h-full rounded-[10px] object-cover" />
              </div>
              <div className="flex flex-col">
                <span className="text-[20px] md:text-[24px] font-black tracking-tighter bg-gradient-to-r from-[#E23744] via-[#FF5E5E] to-[#FF8C00] bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300 drop-shadow-lg shadow-red-500/20 truncate">
                  M-Bites
                </span>
                <span className="hidden sm:inline-block text-[10px] uppercase tracking-widest font-black text-gray-400 -mt-1">
                  Food Delivery
                </span>
              </div>
            </div>
          </div>

          {/* Search Bar (Desktop) */}
          <div className="hidden md:flex flex-1 max-w-xl mx-6">
            <div className="relative w-full flex shadow-[0_8px_24px_rgba(0,0,0,0.1)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.4)] border border-black/10 dark:border-white/10 rounded-xl overflow-hidden bg-gray-50 dark:bg-[#141414] hover:bg-white dark:hover:bg-[#1a1a1a] transition-colors focus-within:ring-2 focus-within:ring-[#E23744]/50 focus-within:border-transparent">
              <div className="pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              </div>
              <input
                type="text"
                className="block w-full pl-3 pr-4 py-3 text-[15px] border-none outline-none bg-transparent placeholder-gray-500 text-gray-900 dark:text-white"
                placeholder="Search restaurants, cuisines or dishes..."
                id="dekstop-search"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setSearchQuery((e.target as HTMLInputElement).value);
                    setView('search');
                  }
                }}
              />
              <button 
                className="px-5 bg-gradient-to-r from-[#E23744] to-[#FF5E5E] hover:from-[#ff414d] hover:to-[#ff6b6b] text-white font-semibold text-[15px] transition-all cursor-pointer"
                onClick={() => {
                  const val = (document.getElementById('dekstop-search') as HTMLInputElement).value;
                  setSearchQuery(val);
                  setView('search');
                }}
              >
                Search
              </button>
            </div>
          </div>

          {/* Right Navigation */}
          <div className="flex items-center gap-2 sm:gap-4 md:gap-6 flex-shrink-0">
            {/* Install PWA Button (Desktop/Mobile Header) */}
            {!isInstalled && (
              <button
                onClick={handleInstallClick}
                className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#E23744]/10 hover:bg-[#E23744]/20 text-[#E23744] dark:text-[#FF5E5E] text-xs font-bold border border-[#E23744]/20 transition-all hover:scale-105 active:scale-95 shadow-sm"
                title="Install App on your device"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Install App</span>
              </button>
            )}

            {/* Push Notifications Toggle */}
            <button
              onClick={() => requestNotificationPermission()}
              className="p-2 rounded-full text-gray-600 dark:text-gray-400 hover:text-[#E23744] dark:hover:text-[#FF5E5E] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              title="Enable Order Notifications"
            >
              <Bell className="w-5 h-5" />
            </button>

            <div className="relative hidden md:block" ref={menuRef}>
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center gap-2.5 px-4 py-2 rounded-full lg:bg-black/5 dark:lg:bg-white/5 border border-transparent hover:border-[#E23744]/20 hover:bg-[#E23744]/5 text-gray-700 dark:text-gray-300 hover:text-[#E23744] active:scale-95 text-[15px] font-bold transition-all duration-300 group shadow-sm hover:shadow-md"
              >
                <div className="relative">
                  <LayoutGrid className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-[#E23744] text-white text-[9px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center animate-pulse">
                      {cartCount}
                    </span>
                  )}
                </div>
                <span>Explore</span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-500 ${isMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isMenuOpen && (
                <div className="absolute top-full mt-3 right-0 w-64 bg-white dark:bg-[#141414] rounded-2xl shadow-2xl shadow-black/20 dark:shadow-red-500/10 border border-gray-100 dark:border-white/10 py-3 origin-top-right overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  <div className="px-4 pb-3 mb-2 border-b border-gray-100 dark:border-white/5">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Quick Access</span>
                  </div>

                  <button 
                    onClick={() => { onOpenOffers(); setIsMenuOpen(false); }}
                    className="w-full flex items-center justify-between px-4 py-3 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-[#E23744]/5 hover:text-[#E23744] transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-100 dark:bg-red-500/10 rounded-xl group-hover:scale-110 transition-transform">
                        <Tag className="w-4 h-4" />
                      </div>
                      Offers & Deals
                    </div>
                    <ChevronDown className="w-4 h-4 -rotate-90 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                  </button>

                  <button 
                    onClick={() => { setView('wishlist'); setIsMenuOpen(false); }}
                    className="w-full flex items-center justify-between px-4 py-3 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-500/5 hover:text-[#E23744] transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-pink-100 dark:bg-pink-500/10 rounded-xl group-hover:scale-110 transition-transform">
                        <Heart className="w-4 h-4" />
                      </div>
                      Favorites
                    </div>
                    <ChevronDown className="w-4 h-4 -rotate-90 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                  </button>

                  <button 
                    onClick={() => { setIsMenuOpen(false); onOpenCart(); }}
                    className="w-full flex items-center justify-between px-4 py-3 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-orange-500/5 hover:text-[#E23744] transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative p-2 bg-orange-100 dark:bg-orange-500/10 rounded-xl group-hover:scale-110 transition-transform">
                        <ShoppingBag className="w-4 h-4" />
                        {cartCount > 0 && (
                          <span className="absolute top-1 right-1 w-2 h-2 bg-[#E23744] rounded-full"></span>
                        )}
                      </div>
                      Your Cart
                    </div>
                    <div className="flex items-center gap-2">
                      {cartCount > 0 && <span className="bg-[#E23744] text-white text-[10px] px-1.5 py-0.5 rounded-full">{cartCount}</span>}
                      <ChevronDown className="w-4 h-4 -rotate-90 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                    </div>
                  </button>

                  {!isInstalled && (
                    <button 
                      onClick={() => { handleInstallClick(); setIsMenuOpen(false); }}
                      className="w-full flex items-center justify-between px-4 py-3 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-emerald-500/5 hover:text-emerald-500 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 dark:bg-emerald-500/10 rounded-xl group-hover:scale-110 transition-transform text-emerald-500">
                          <Smartphone className="w-4 h-4" />
                        </div>
                        Install Mobile App
                      </div>
                      <ChevronDown className="w-4 h-4 -rotate-90 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                    </button>
                  )}

                  {isAdmin && (
                    <button 
                      onClick={() => { setView('admin'); setIsMenuOpen(false); }}
                      className="w-full flex items-center justify-between px-4 py-3 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-500/5 hover:text-[#E23744] transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-500/10 rounded-xl group-hover:scale-110 transition-transform">
                          <TrendingUp className="w-4 h-4" />
                        </div>
                        Admin Dashboard
                      </div>
                      <ChevronDown className="w-4 h-4 -rotate-90 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                    </button>
                  )}

                  <div className="h-px bg-gray-100 dark:bg-white/5 my-2"></div>

                  <button 
                    onClick={() => { setIsDark(!isDark); setIsMenuOpen(false); }}
                    className="w-full flex items-center justify-between px-4 py-3 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-100 dark:bg-white/5 rounded-xl group-hover:rotate-12 transition-transform">
                        {isDark ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-blue-500" />}
                      </div>
                      {isDark ? 'Light Mode' : 'Dark Mode'}
                    </div>
                    <div className={`w-10 h-5 rounded-full relative transition-colors ${isDark ? 'bg-amber-500/20' : 'bg-blue-500/20'}`}>
                      <div className={`absolute top-1 w-3 h-3 rounded-full transition-all ${isDark ? 'right-1 bg-amber-500' : 'left-1 bg-blue-500'}`}></div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {userName ? (
              <div className="hidden md:flex items-center gap-4 relative" ref={profileRef}>
                <div className="w-px h-6 bg-gray-200 dark:bg-white/10 mx-2"></div>
                <div 
                  className="flex items-center text-gray-900 dark:text-white text-[15px] font-bold group cursor-pointer select-none" 
                  title={userName}
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                >
                  <div className="w-9 h-9 bg-gradient-to-r from-[#E23744] via-[#FF5E5E] to-[#FF8C00] rounded-full flex items-center justify-center text-white font-black transition-all duration-500 group-hover:scale-110 group-active:scale-95 shadow-lg shadow-red-500/20 ring-2 ring-transparent group-hover:ring-[#E23744]/30">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                </div>

                {isProfileOpen && (
                  <div className="absolute top-full right-0 mt-3 w-[260px] bg-white dark:bg-[#141414] rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.5)] border border-black/5 dark:border-white/10 py-2 origin-top-right animate-in fade-in zoom-in-95 duration-200">
                    <div className="px-4 py-3 border-b border-black/5 dark:border-white/10 mb-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Signed in as</p>
                      <p className="text-base font-bold text-gray-900 dark:text-white truncate">{userName}</p>
                    </div>

                    <div className="px-2">
                      <button 
                        onClick={() => { setView('orders'); setIsProfileOpen(false); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-all"
                      >
                        <ShoppingBag className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        My Orders & Tracking
                      </button>
                      <button 
                        onClick={() => { setView('wishlist'); setIsProfileOpen(false); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-all"
                      >
                        <Heart className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        My Wishlist
                      </button>
                    </div>

                    <div className="h-px bg-gray-100 dark:bg-white/5 my-2"></div>

                    <div className="px-2">
                      <button 
                        onClick={() => { onLogout(); setIsProfileOpen(false); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-[#E23744] hover:bg-red-50 dark:hover:bg-[#E23744]/10 rounded-xl transition-all"
                      >
                        <LogOut className="w-4 h-4" />
                        Log out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button 
                onClick={onOpenProfile}
                className="hidden md:flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#E23744] to-[#FF5E5E] text-white rounded-full text-[15px] font-bold transition-all hover:shadow-lg hover:shadow-red-500/25 active:scale-95 cursor-pointer"
              >
                <User className="w-5 h-5" />
                <span>Profile</span>
              </button>
            )}

            <button 
              onClick={onOpenMobileMenu}
              className="md:hidden p-2 text-gray-700 dark:text-gray-300 hover:text-[#E23744] transition-all bg-black/5 dark:bg-white/5 rounded-full"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

