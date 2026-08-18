import React from 'react';
import { Home, ShoppingBag, User, Heart, Compass, MapPin } from 'lucide-react';

interface BottomNavProps {
  cartCount: number;
  activeOrderCount?: number;
  onOpenCart: () => void;
  onOpenProfile: () => void;
  onGoHome: () => void;
  onOpenWishlist: () => void;
  onOpenOrders?: () => void;
  activeView: string;
}

export default function BottomNav({
  cartCount,
  activeOrderCount = 0,
  onOpenCart,
  onOpenProfile,
  onGoHome,
  onOpenWishlist,
  onOpenOrders,
  activeView,
}: BottomNavProps) {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0c0c0ce6] backdrop-blur-2xl border-t border-white/10 pb-[env(safe-area-inset-bottom,8px)] z-50 shadow-[0_-8px_30px_rgba(0,0,0,0.6)]">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto px-2">
        {/* Home / Delivery */}
        <button
          onClick={onGoHome}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 gap-1 transition-all duration-200 ${
            activeView === 'home' || activeView === 'menu'
              ? 'text-[#E23744]'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <Home
            className={`w-5 h-5 transition-transform duration-200 ${
              activeView === 'home' ? 'scale-110' : ''
            }`}
          />
          <span className="text-[11px] font-bold tracking-tight">Delivery</span>
        </button>

        {/* Live Tracking / Orders */}
        <button
          onClick={onOpenOrders}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 gap-1 transition-all duration-200 relative ${
            activeView === 'orders'
              ? 'text-[#E23744]'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <div className="relative">
            <Compass
              className={`w-5 h-5 transition-transform duration-200 ${
                activeView === 'orders' ? 'scale-110' : ''
              }`}
            />
            {activeOrderCount > 0 && (
              <span className="absolute -top-1 -right-1.5 w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></span>
            )}
            {activeOrderCount > 0 && (
              <span className="absolute -top-1 -right-1.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-black"></span>
            )}
          </div>
          <span className="text-[11px] font-bold tracking-tight">Track</span>
        </button>

        {/* Wishlist */}
        <button
          onClick={onOpenWishlist}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 gap-1 transition-all duration-200 ${
            activeView === 'wishlist'
              ? 'text-[#E23744]'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <Heart
            className={`w-5 h-5 transition-transform duration-200 ${
              activeView === 'wishlist' ? 'scale-110 fill-current' : ''
            }`}
          />
          <span className="text-[11px] font-bold tracking-tight">Favorites</span>
        </button>

        {/* Cart */}
        <button
          onClick={onOpenCart}
          className="flex flex-col items-center justify-center flex-1 h-full py-1 gap-1 text-gray-400 hover:text-[#E23744] transition-all duration-200 group"
        >
          <div className="relative">
            <ShoppingBag className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-[#E23744] text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-lg border border-black">
                {cartCount}
              </span>
            )}
          </div>
          <span className="text-[11px] font-bold tracking-tight">Cart</span>
        </button>

        {/* Profile */}
        <button
          onClick={onOpenProfile}
          className="flex flex-col items-center justify-center flex-1 h-full py-1 gap-1 transition-all duration-200 text-gray-400 hover:text-[#E23744]"
        >
          <User className="w-5 h-5 hover:scale-110 transition-transform duration-200" />
          <span className="text-[11px] font-bold tracking-tight">Profile</span>
        </button>
      </div>
    </div>
  );
}
