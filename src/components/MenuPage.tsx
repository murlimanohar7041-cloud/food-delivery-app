import React, { useMemo, memo } from 'react';
import { ArrowLeft, Star, Clock, Info, Search, Share2, Heart, Plus, Minus } from 'lucide-react';
import { menuItems } from '../data';
import { toast } from 'react-hot-toast';
import OptimizedImage from './OptimizedImage';

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  isVeg: boolean;
  image?: string;
}

interface MenuPageProps {
  restaurant: any;
  onBack: () => void;
  cartItems: CartItem[];
  wishlistIds: number[];
  onAddToCart: (item: any) => void;
  onBuyNow?: (item: any) => void;
  onProductClick?: (item: any) => void;
  onUpdateQuantity: (id: number, delta: number) => void;
  onToggleWishlist: (id: number) => void;
  onSearch: () => void;
}

const MenuPageComponent: React.FC<MenuPageProps> = ({
  restaurant,
  onBack,
  cartItems,
  wishlistIds,
  onAddToCart,
  onBuyNow,
  onProductClick,
  onUpdateQuantity,
  onToggleWishlist,
  onSearch,
}) => {
  const quantityMap = useMemo(() => {
    const map = new Map<number, number>();
    cartItems.forEach((item) => map.set(item.id, item.quantity));
    return map;
  }, [cartItems]);

  const wishlistSet = useMemo(() => new Set(wishlistIds), [wishlistIds]);

  return (
    <div className="bg-gray-50 dark:bg-[#0a0a0a] min-h-screen pb-20 text-gray-900 dark:text-gray-100 transition-colors">
      {/* Sticky Header */}
      <div className="sticky top-0 z-40 bg-white/90 dark:bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-black/5 dark:border-white/5 px-4 py-3 flex items-center justify-between shadow-sm">
        <button
          onClick={onBack}
          className="p-2 -ml-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:text-white hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex gap-2">
          <button
            onClick={onSearch}
            className="p-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:text-white hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors"
          >
            <Search className="w-5 h-5" />
          </button>
          <button
            onClick={() => toast('Link copied to clipboard!', { icon: '🔗' })}
            className="p-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:text-white hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Restaurant Info */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mb-1 tracking-tight">
              {restaurant.name}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm mb-1.5">
              {restaurant.cuisines?.join(', ')}
            </p>
            <p className="text-gray-500 text-xs mb-3">New York • 2.5 km</p>
            <div className="flex items-center gap-3 text-xs font-semibold text-gray-700 dark:text-gray-300">
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#E23744]" />
                {restaurant.deliveryTime}
              </div>
              <div className="w-1 h-1 bg-gray-500 rounded-full"></div>
              <div>{restaurant.priceForTwo}</div>
            </div>
          </div>
          <div className="flex flex-col items-center bg-white dark:bg-[#141414] border border-gray-200 dark:border-white/10 rounded-xl p-2.5 shadow-sm">
            <div className="flex items-center gap-1 text-emerald-500 font-bold text-base mb-0.5">
              {restaurant.rating} <Star className="w-3.5 h-3.5 fill-current" />
            </div>
            <div className="text-[9px] text-gray-400 font-bold uppercase tracking-wider border-t border-gray-100 dark:border-white/5 pt-1.5 text-center">
              10K+ Ratings
            </div>
          </div>
        </div>

        {/* Offers */}
        {restaurant.offer && (
          <div className="flex items-center gap-3 p-3.5 border border-blue-500/20 rounded-xl mb-6 bg-blue-500/10">
            <div className="bg-blue-600 text-white p-1.5 rounded-full shadow-sm">
              <Info className="w-3.5 h-3.5" />
            </div>
            <div>
              <p className="font-bold text-blue-900 dark:text-blue-200 text-xs">{restaurant.offer}</p>
              <p className="text-[11px] text-blue-600 dark:text-blue-400">Use code MBITESPRO at checkout</p>
            </div>
          </div>
        )}

        <div className="border-b border-gray-200 dark:border-white/5 mb-6"></div>

        {/* Menu Items */}
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white mb-5 flex items-center gap-2">
            Recommended <span className="text-xs font-medium text-gray-500">({menuItems.length})</span>
          </h2>

          <div className="flex flex-col gap-6">
            {menuItems.map((item, index) => {
              const quantity = quantityMap.get(item.id) || 0;
              const originalPrice = item.disc ? Math.round(item.price / (1 - item.disc / 100)) : item.price;
              const isWishlisted = wishlistSet.has(item.id);

              return (
                <div
                  key={item.id}
                  className="flex justify-between gap-4 pb-6 border-b border-gray-100 dark:border-white/5 last:border-0 group cursor-pointer"
                  onClick={() => onProductClick?.(item)}
                >
                  {/* Item Details */}
                  <div className="flex-1 min-w-0">
                    <div className={`w-3.5 h-3.5 border rounded-sm flex items-center justify-center mb-1.5 ${item.isVeg ? 'border-green-500' : 'border-red-500'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${item.isVeg ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-1 group-hover:text-[#E23744] transition-colors flex items-center justify-between pr-2">
                      <span className="truncate">{item.name}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleWishlist?.(item.id);
                        }}
                        className={`p-1 rounded-full transition-colors ml-2 ${isWishlisted ? 'text-[#E23744]' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                      >
                        <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
                      </button>
                    </h3>

                    {/* Rating & Count */}
                    <div className="flex items-center gap-1.5 mb-1.5 text-xs">
                      <div className="flex items-center gap-0.5 bg-green-600 text-white px-1.5 py-0.5 rounded font-bold shadow-sm text-[10px]">
                        {item.rating} <Star className="w-2.5 h-2.5 fill-current" />
                      </div>
                      <span className="text-gray-400 text-xs">{item.ratingsCount} ratings</span>
                    </div>

                    <div className="flex items-center gap-2 mb-1.5">
                      <p className="font-black text-gray-900 dark:text-white text-base sm:text-lg">₹{item.price.toFixed(2)}</p>
                      {item.disc && (
                        <>
                          <span className="text-xs text-gray-400 line-through">₹{originalPrice.toFixed(2)}</span>
                          <span className="text-[9px] font-black bg-green-500/10 text-green-600 dark:text-green-400 px-1.5 py-0.5 rounded border border-green-500/20 uppercase tracking-wider">
                            {item.disc}% OFF
                          </span>
                        </>
                      )}
                    </div>

                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  {/* Item Image & Controls */}
                  <div className="relative w-[110px] sm:w-[130px] shrink-0">
                    <div className="w-[110px] sm:w-[130px] h-[110px] sm:h-[130px] rounded-2xl overflow-hidden shadow-md border border-gray-200 dark:border-white/5 bg-gray-100 dark:bg-[#1a1a1a]">
                      <OptimizedImage
                        src={item.image}
                        alt={item.name}
                        fallbackId={item.id}
                        priority={index < 3}
                        className="w-full h-full group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>

                    <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-[95px] sm:w-[110px] flex flex-col gap-1.5">
                      {quantity > 0 ? (
                        <div className="bg-white dark:bg-[#141414] text-green-600 dark:text-green-500 font-bold text-xs rounded-xl shadow-md border border-green-500/30 flex items-center justify-between overflow-hidden">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onUpdateQuantity(item.id, -1);
                            }}
                            className="px-2.5 py-1.5 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="font-black text-xs">{quantity}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onUpdateQuantity(item.id, 1);
                            }}
                            className="px-2.5 py-1.5 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-1 items-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onAddToCart(item);
                            }}
                            className="w-full bg-white dark:bg-[#141414] text-green-600 dark:text-green-500 font-bold text-xs py-1.5 rounded-lg shadow-md border border-gray-200 dark:border-white/10 hover:border-green-500/50 transition-all active:scale-95 uppercase tracking-wide"
                          >
                            Add
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onBuyNow?.(item);
                            }}
                            className="w-full bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-black font-black text-[9px] py-1 rounded-md active:scale-95 transition-all shadow-sm uppercase"
                          >
                            Buy Now
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export const MenuPage = memo(MenuPageComponent);
export default MenuPage;
