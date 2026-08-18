import { X, ShoppingBag, Plus, Minus, ChevronRight } from 'lucide-react';
import { getFallbackImage } from '../utils/fallbackImage';

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  isVeg: boolean;
  image?: string;
}

interface CartPanelProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (id: number, delta: number) => void;
  onCheckout: () => void;
}

export default function CartPanel({ isOpen, onClose, cartItems, onUpdateQuantity, onCheckout }: CartPanelProps) {
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = subtotal > 0 ? 40 : 0;
  const taxes = subtotal * 0.08;
  const total = subtotal + deliveryFee + taxes;

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity z-[100] ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      
      {/* Side Panel */}
      <div 
        className={`fixed top-0 right-0 h-full w-full sm:w-[400px] bg-[#0a0a0a] shadow-[0_0_50px_rgba(0,0,0,0.5)] z-[101] transform transition-transform duration-300 cubic-bezier(0.16, 1, 0.3, 1) flex flex-col border-l border-black/5 dark:border-white/5 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="bg-[#141414] px-4 py-4 border-b border-black/10 dark:border-white/10 flex items-center justify-between sticky top-0 z-10 shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
          <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" />
            Your Cart
          </h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-black/5 dark:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:text-white" />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 hide-scrollbar">
          {cartItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-600 dark:text-gray-400 space-y-4">
              <ShoppingBag className="w-16 h-16 opacity-20" />
              <p className="font-medium text-gray-500">Your cart is empty</p>
              <button 
                onClick={onClose}
                className="text-[#E23744] font-bold text-sm hover:text-[#ff414d] transition-colors"
              >
                Browse Restaurants
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-[#141414] rounded-2xl p-4 shadow-lg border border-black/5 dark:border-white/5">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-start justify-between py-4 border-b border-black/5 dark:border-white/5 last:border-0 last:pb-0 first:pt-0 gap-3">
                    {item.image && (
                      <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-black/5 dark:border-white/5 relative bg-[#1a1a1a]">
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
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`w-3 h-3 border rounded-sm flex items-center justify-center shrink-0 ${item.isVeg ? 'border-green-500' : 'border-red-500'}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${item.isVeg ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-tight">{item.name}</h3>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 text-sm font-medium ml-5">₹{(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                    
                    {/* Quantity Controls */}
                    <div className="flex items-center bg-[#1a1a1a] border border-black/10 dark:border-white/10 rounded-lg overflow-hidden shrink-0 shadow-inner">
                      <button 
                        onClick={() => onUpdateQuantity(item.id, -1)}
                        className="px-2.5 py-1.5 text-[#E23744] hover:bg-black/5 dark:bg-white/5 transition-colors"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-2 font-bold text-sm text-gray-900 dark:text-white min-w-[1.5rem] text-center">
                        {item.quantity}
                      </span>
                      <button 
                        onClick={() => onUpdateQuantity(item.id, 1)}
                        className="px-2.5 py-1.5 text-[#E23744] hover:bg-black/5 dark:bg-white/5 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bill Details */}
              <div className="bg-[#141414] rounded-2xl p-4 shadow-lg border border-black/5 dark:border-white/5">
                <h3 className="font-bold text-gray-900 dark:text-white mb-4 text-sm">Bill Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Item Total</span>
                    <span className="font-medium text-gray-700 dark:text-gray-300">₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Delivery Fee</span>
                    <span className="font-medium text-gray-700 dark:text-gray-300">₹{deliveryFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Taxes & Charges</span>
                    <span className="font-medium text-gray-700 dark:text-gray-300">₹{taxes.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-black/10 dark:border-white/10 pt-3 mt-3 flex justify-between">
                    <span className="font-bold text-gray-700 dark:text-gray-300">To Pay</span>
                    <span className="font-black text-gray-900 dark:text-white text-lg">₹{total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Checkout Button */}
        {cartItems.length > 0 && (
          <div className="bg-[#141414] p-4 border-t border-black/10 dark:border-white/10 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
            <button 
              onClick={onCheckout}
              className="w-full bg-gradient-to-r from-[#E23744] to-[#FF5E5E] text-gray-900 dark:text-white rounded-xl py-3.5 px-4 font-bold flex items-center justify-between hover:shadow-[0_0_20px_rgba(226,55,68,0.4)] active:scale-[0.98] transition-all"
            >
              <div className="flex flex-col items-start">
                <span className="text-xs text-red-100 uppercase tracking-wider">Total</span>
                <span className="text-lg leading-none">₹{total.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-1">
                Checkout <ChevronRight className="w-5 h-5 pointer-events-none group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          </div>
        )}
      </div>
    </>
  );
}
