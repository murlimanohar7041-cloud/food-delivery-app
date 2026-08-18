import React, { memo } from 'react';
import { Star, ShoppingCart, Plus, Heart } from 'lucide-react';
import OptimizedImage from './OptimizedImage';
import { Product } from '../products';

interface ProductCardProps {
  product: Product;
  isWishlisted: boolean;
  priority?: boolean;
  onAddToCart: (item: Product) => void;
  onBuyNow?: (item: Product) => void;
  onProductClick?: (item: Product) => void;
  onToggleWishlist?: (id: number) => void;
}

const ProductCardComponent: React.FC<ProductCardProps> = ({
  product,
  isWishlisted,
  priority = false,
  onAddToCart,
  onBuyNow,
  onProductClick,
  onToggleWishlist,
}) => {
  const originalPrice = product.disc ? Math.round(product.price / (1 - product.disc / 100)) : null;

  return (
    <div
      onClick={() => onProductClick?.(product)}
      className="bg-white dark:bg-[#141414] rounded-xl sm:rounded-2xl overflow-hidden border border-gray-200 dark:border-white/5 hover:border-[#E23744]/40 dark:hover:border-[#E23744]/50 shadow-sm hover:shadow-[0_8px_24px_rgba(226,55,68,0.12)] dark:hover:shadow-[0_8px_24px_rgba(226,55,68,0.2)] transition-all duration-300 group flex flex-col relative cursor-pointer transform-gpu [contain:paint_layout]"
    >
      {/* Wishlist Button */}
      {onToggleWishlist && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleWishlist(product.id);
          }}
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10 p-1.5 sm:p-2 bg-white/90 dark:bg-black/80 backdrop-blur-md rounded-full shadow-sm hover:scale-110 active:scale-90 transition-transform duration-200 border border-transparent dark:border-white/10"
        >
          <Heart
            className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-colors duration-200 ${
              isWishlisted
                ? 'fill-[#E23744] text-[#E23744]'
                : 'text-gray-600 dark:text-gray-300'
            }`}
          />
        </button>
      )}

      {/* Image Container with Optimized Lazy Loading */}
      <div className="relative h-[120px] sm:h-[180px] overflow-hidden bg-gray-100 dark:bg-[#1a1a1a]">
        <OptimizedImage
          src={product.image}
          alt={product.name}
          fallbackId={product.id}
          priority={priority}
          className="w-full h-full group-hover:scale-105 transition-transform duration-300 ease-out"
        />

        {/* Veg / Non-Veg Indicator */}
        <div className="absolute bottom-2 left-2 sm:bottom-2.5 sm:left-2.5 z-10 bg-white/90 dark:bg-black/80 backdrop-blur-md p-1 sm:p-1.5 rounded-md border border-gray-200 dark:border-white/10 scale-90 sm:scale-100 shadow-sm">
          <div
            className={`w-3 h-3 border rounded-sm flex items-center justify-center ${
              product.isVeg ? 'border-green-500' : 'border-red-500'
            }`}
          >
            <div
              className={`w-1.5 h-1.5 rounded-full ${
                product.isVeg ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
          </div>
        </div>
      </div>

      {/* Product Information */}
      <div className="p-3 sm:p-4 flex flex-col flex-1">
        <div className="mb-1 text-[9px] sm:text-[11px] font-bold tracking-wider uppercase text-gray-500 dark:text-gray-400">
          {product.category}
        </div>

        <h3 className="text-[13px] sm:text-[15px] font-bold text-gray-900 dark:text-white mb-1.5 line-clamp-2 leading-snug group-hover:text-[#E23744] transition-colors h-[2.8em] sm:h-[2.6em]">
          {product.name}
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-1.5 mb-2 text-[10px] sm:text-xs">
          <div className="flex items-center gap-0.5 bg-green-600 text-white px-1.5 py-0.5 rounded font-bold shadow-sm">
            {product.rating}{' '}
            <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-current" />
          </div>
        </div>

        {/* Price & Discounts */}
        <div className="flex items-center gap-1.5 sm:gap-2 mt-auto">
          <span className="text-[15px] sm:text-[18px] font-black text-gray-900 dark:text-white">
            ₹{product.price}
          </span>
          {product.disc && originalPrice && (
            <>
              <span className="text-[11px] sm:text-[13px] text-gray-400 line-through">
                ₹{originalPrice}
              </span>
              <span className="text-[10px] sm:text-[11px] font-black text-[#E23744] dark:text-[#ff5c6a] tracking-wide">
                {product.disc}% OFF
              </span>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-3 pt-2.5 border-t border-gray-100 dark:border-white/5 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onBuyNow?.(product);
            }}
            className="flex-1 py-1.5 sm:py-2 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-black font-black text-[11px] sm:text-[12px] rounded-lg transition-all active:scale-95 shadow-[0_2px_10px_rgba(251,191,36,0.25)] uppercase flex items-center justify-center gap-1"
          >
            Buy Now
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(product);
            }}
            className="w-8 h-8 sm:w-9 sm:h-9 shrink-0 rounded-lg bg-gray-100 dark:bg-white/5 text-gray-900 dark:text-white flex items-center justify-center hover:bg-[#E23744] hover:text-white dark:hover:bg-[#E23744] transition-all duration-200 shadow-sm active:scale-95 group/btn"
            title="Add to Cart"
            aria-label="Add to Cart"
          >
            <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover/btn:hidden" />
            <Plus className="w-4 h-4 sm:w-5 sm:h-5 hidden group-hover/btn:block" />
          </button>
        </div>
      </div>
    </div>
  );
};

export const ProductCard = memo(ProductCardComponent);
export default ProductCard;
