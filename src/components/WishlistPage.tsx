import React, { memo, useMemo } from 'react';
import { ArrowLeft, Heart, Trash2, ShoppingBag, Plus } from 'lucide-react';
import { products } from '../products';
import OptimizedImage from './OptimizedImage';

interface WishlistPageProps {
  wishlistIds: number[];
  onRemoveFromWishlist: (id: number) => void;
  onAddToCart: (item: any) => void;
  onBuyNow?: (item: any) => void;
  onProductClick?: (item: any) => void;
  onBack: () => void;
}

const WishlistPageComponent: React.FC<WishlistPageProps> = ({
  wishlistIds,
  onRemoveFromWishlist,
  onAddToCart,
  onBuyNow,
  onProductClick,
  onBack,
}) => {
  const wishlistSet = useMemo(() => new Set(wishlistIds), [wishlistIds]);
  const savedItems = useMemo(
    () => products.filter((item) => wishlistSet.has(item.id)),
    [wishlistSet]
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] pb-20 text-gray-900 dark:text-gray-100 transition-colors">
      <div className="bg-white dark:bg-[#141414] border-b border-gray-200 dark:border-white/10 sticky top-0 z-40 shadow-sm dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 -ml-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-[#E23744] fill-[#E23744]" />
            <h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">
              Your Wishlist ({savedItems.length})
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {savedItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[50vh] text-center">
            <Heart className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4 opacity-50" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Wishlist is empty</h2>
            <p className="text-gray-500 dark:text-gray-400">Save items you love by clicking the heart icon on menus.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {savedItems.map((item, index) => {
              const originalPrice = item.disc ? Math.round(item.price / (1 - item.disc / 100)) : item.price;
              return (
                <div
                  key={item.id}
                  onClick={() => onProductClick?.(item)}
                  className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-white/5 rounded-2xl overflow-hidden flex flex-col group hover:border-[#E23744]/40 shadow-sm hover:shadow-[0_8px_30px_rgba(226,55,68,0.12)] transition-all duration-300 cursor-pointer"
                >
                  <div className="h-48 relative overflow-hidden bg-gray-100 dark:bg-[#1a1a1a]">
                    <OptimizedImage
                      src={item.image}
                      alt={item.name}
                      fallbackId={item.id}
                      priority={index < 4}
                      className="w-full h-full group-hover:scale-105 transition-transform duration-500"
                    />

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveFromWishlist(item.id);
                      }}
                      className="absolute top-3 right-3 z-10 p-2 bg-white/90 dark:bg-black/60 backdrop-blur-md rounded-full text-[#E23744] hover:bg-white dark:hover:bg-black transition-all border border-gray-200 dark:border-white/10 shadow-sm hover:scale-110 active:scale-90"
                      title="Remove from wishlist"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>

                    {/* Veg/Non-Veg Badge */}
                    {item.isVeg !== undefined && (
                      <div className="absolute top-3 left-3 z-10 bg-white/90 dark:bg-black/80 backdrop-blur-md p-1.5 rounded-lg border border-gray-200 dark:border-white/10">
                        <div
                          className={`w-3.5 h-3.5 border rounded-sm flex items-center justify-center ${
                            item.isVeg ? 'border-green-500' : 'border-red-500'
                          }`}
                        >
                          <div
                            className={`w-1.5 h-1.5 rounded-full ${
                              item.isVeg ? 'bg-green-500' : 'bg-red-500'
                            }`}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-4 flex flex-col flex-1">
                    <p className="text-[11px] font-bold tracking-wider uppercase text-gray-500 dark:text-gray-400 mb-1">
                      {item.category}
                    </p>
                    <h3 className="font-bold text-[16px] text-gray-900 dark:text-white leading-tight line-clamp-2 group-hover:text-[#E23744] transition-colors mb-2 h-[2.8em]">
                      {item.name}
                    </h3>

                    {/* Price */}
                    <div className="flex items-center gap-2 mt-auto pb-3">
                      <span className="text-[18px] font-black text-gray-900 dark:text-white">
                        ₹{item.price}
                      </span>
                      {item.disc && (
                        <>
                          <span className="text-[13px] text-gray-400 line-through">
                            ₹{originalPrice}
                          </span>
                          <span className="text-[11px] font-black text-[#E23744] tracking-wide">
                            {item.disc}% OFF
                          </span>
                        </>
                      )}
                    </div>

                    <div className="mt-auto pt-3 border-t border-gray-100 dark:border-white/5 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onBuyNow?.(item);
                        }}
                        className="flex-1 py-2 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-black font-black text-xs rounded-lg active:scale-95 transition-all shadow-[0_4px_14px_rgba(251,191,36,0.3)] uppercase flex items-center justify-center gap-1"
                      >
                        Buy Now
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddToCart(item);
                        }}
                        className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-900 dark:text-white flex items-center justify-center hover:bg-[#E23744] hover:text-white dark:hover:bg-[#E23744] transition-all duration-300 shadow-sm active:scale-95 shrink-0 group/add"
                        title="Add to Cart"
                      >
                        <ShoppingBag className="w-4 h-4 group-hover/add:hidden" />
                        <Plus className="w-5 h-5 hidden group-hover/add:block" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export const WishlistPage = memo(WishlistPageComponent);
export default WishlistPage;
