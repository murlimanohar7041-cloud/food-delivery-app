import { X, Search, Heart, User, MapPin, ShoppingBag, LogOut, TrendingUp, Download, Bell, Smartphone } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { usePWAInstall, requestNotificationPermission } from '../utils/pwaUtils';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenProfile: () => void;
  userName: string | null;
  onLogout: () => void;
  setView: (view: any) => void;
  isAdmin?: boolean;
}

export default function MobileMenu({ isOpen, onClose, onOpenProfile, userName, onLogout, setView, isAdmin }: MobileMenuProps) {
  const { isInstallable, isInstalled, isIOS, triggerInstall } = usePWAInstall();

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    onClose();
    await triggerInstall();
  };

  return (
    <div className="fixed inset-0 z-[100] md:hidden flex justify-end">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} style={{ animation: 'fadeIn 0.3s ease-out' }}></div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideLeft { from { transform: translateX(100%); } to { transform: translateX(0); } }
      `}</style>
      <div 
        className="relative w-[82%] max-w-[340px] bg-[#0a0a0a] h-full shadow-[0_0_50px_rgba(0,0,0,0.5)] p-6 flex flex-col border-l border-white/10 overflow-y-auto"
        style={{ animation: 'slideLeft 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
      >
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#FF385C] to-[#E23744] p-0.5 shadow-md flex items-center justify-center">
              <img src="/icon.svg" alt="App" className="w-full h-full rounded-[6px]" />
            </div>
            <span className="text-xl font-black bg-gradient-to-r from-[#E23744] via-[#FF5E5E] to-[#FF8C00] bg-clip-text text-transparent">
              M-Bites App
            </span>
          </div>
          <button onClick={onClose} className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex flex-col gap-1.5">
          {userName ? (
            <div className="flex flex-col gap-2 mb-3 p-4 bg-[#141414] rounded-2xl border border-white/5 shadow-inner">
              <div 
                className="flex items-center gap-3 mb-1 cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => { onClose(); onOpenProfile(); }}
              >
                <div className="w-10 h-10 bg-gradient-to-br from-[#E23744] to-[#FF5E5E] rounded-full flex items-center justify-center text-white font-bold text-lg shadow-[0_0_10px_rgba(226,55,68,0.4)]">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-bold text-white text-base">{userName}</div>
                  <div className="text-xs text-[#FF5E5E] font-semibold">Foodie Member • Edit Address →</div>
                </div>
              </div>
              <button 
                onClick={() => { onLogout(); onClose(); }}
                className="flex items-center gap-2 text-gray-400 hover:text-[#E23744] font-bold text-xs transition-colors mt-2 pt-2 border-t border-white/5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" /> Logout
              </button>
            </div>
          ) : (
            <button 
              onClick={() => { onClose(); onOpenProfile(); }}
              className="flex items-center gap-3 text-gray-300 hover:text-[#E23744] hover:bg-[#141414] p-3.5 rounded-xl font-bold text-base transition-all group border border-transparent hover:border-white/5"
            >
              <User className="w-5 h-5 text-[#E23744] group-hover:scale-110 transition-transform" /> Profile & Login
            </button>
          )}
          {isAdmin && (
            <button 
              onClick={() => { onClose(); setView('admin'); }}
              className="flex items-center gap-3 text-[#FF5E5E] bg-[#E23744]/10 hover:bg-[#E23744]/20 p-3.5 rounded-xl font-bold text-base transition-all group border border-[#E23744]/20"
            >
              <TrendingUp className="w-5 h-5 group-hover:scale-110 transition-transform" /> Admin Dashboard
            </button>
          )}
          <button 
            onClick={() => { onClose(); setView('orders'); }}
            className="flex items-center gap-3 text-gray-300 hover:text-[#E23744] hover:bg-[#141414] p-3.5 rounded-xl font-bold text-base transition-all group border border-transparent hover:border-white/5"
          >
            <ShoppingBag className="w-5 h-5 text-gray-400 group-hover:scale-110 transition-transform" /> Your Orders & Live GPS
          </button>
          <button 
            onClick={() => { onClose(); setView('wishlist'); }}
            className="flex items-center gap-3 text-gray-300 hover:text-[#E23744] hover:bg-[#141414] p-3.5 rounded-xl font-bold text-base transition-all group border border-transparent hover:border-white/5"
          >
            <Heart className="w-5 h-5 text-pink-500 group-hover:scale-110 transition-transform" /> Favorites
          </button>
          <button 
            onClick={() => { onClose(); setView('search'); }}
            className="flex items-center gap-3 text-gray-300 hover:text-[#E23744] hover:bg-[#141414] p-3.5 rounded-xl font-bold text-base transition-all group border border-transparent hover:border-white/5"
          >
            <Search className="w-5 h-5 text-gray-400 group-hover:scale-110 transition-transform" /> Search Foods
          </button>

          <button 
            onClick={async () => {
              const res = await requestNotificationPermission();
              if (res) toast.success('Order notifications enabled!');
            }}
            className="flex items-center gap-3 text-gray-300 hover:text-amber-400 hover:bg-[#141414] p-3.5 rounded-xl font-bold text-base transition-all group border border-transparent hover:border-white/5"
          >
            <Bell className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" /> Notification Alerts
          </button>
        </div>
        
        <div className="mt-auto pt-6 border-t border-white/10 flex flex-col gap-3">
          {!isInstalled && (
            <button 
              onClick={handleInstallClick}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#E23744] to-[#FF5E5E] text-white font-bold py-3.5 rounded-xl shadow-[0_0_20px_rgba(226,55,68,0.3)] hover:shadow-[0_0_25px_rgba(226,55,68,0.5)] active:scale-[0.98] transition-all text-base"
            >
              <Smartphone className="w-5 h-5" />
              <span>Install Mobile App (PWA)</span>
            </button>
          )}
          <button 
            onClick={() => { toast('Customer Support 24/7 is ready to help at support@mbites.com', { icon: '🎧' }); }}
            className="w-full bg-[#141414] text-gray-300 font-bold py-3 rounded-xl hover:bg-[#1a1a1a] hover:text-white transition-colors text-sm border border-white/5"
          >
            Help & Support
          </button>
        </div>
      </div>
    </div>
  );
}

