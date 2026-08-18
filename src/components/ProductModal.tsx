import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { X, Star, ShoppingCart, Plus } from 'lucide-react';
import OptimizedImage from './OptimizedImage';

interface ProductModalProps {
  product: any;
  onClose: () => void;
  onAddToCart: (product: any) => void;
  onBuyNow: (product: any) => void;
}

export default function ProductModal({ product, onClose, onAddToCart, onBuyNow }: ProductModalProps) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const originalPrice = product.disc ? Math.round(product.price / (1 - product.disc / 100)) : product.price;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 pb-20 sm:pb-6">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 30 }}
        className="relative w-full max-w-4xl bg-white dark:bg-[#141414] rounded-[24px] sm:rounded-[32px] shadow-2xl overflow-hidden flex flex-col sm:flex-row max-h-[90vh] z-10 border border-gray-100 dark:border-white/5"
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-5 sm:right-5 z-20 p-2 sm:p-2.5 bg-white/70 dark:bg-black/50 hover:bg-white dark:hover:bg-black backdrop-blur-md rounded-full shadow-lg transition-all active:scale-90 border border-gray-100/50 dark:border-white/10"
        >
          <X className="w-5 h-5 text-gray-900 dark:text-white" />
        </button>

        {/* Image Side */}
        <div className="w-full sm:w-1/2 h-64 sm:h-auto relative bg-gray-50 dark:bg-[#1a1a1a]">
          <OptimizedImage
            src={product.image}
            alt={product.name}
            fallbackId={product.id}
            priority={true}
            className="w-full h-full"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60 pointer-events-none"></div>
          
          {product.disc && (
            <div className="absolute top-5 left-5 z-10 bg-gradient-to-r from-[#E23744] to-[#FF8C00] text-white px-3.5 py-1.5 rounded-xl text-xs md:text-sm font-black shadow-lg uppercase tracking-wider">
              {product.disc}% OFF
            </div>
          )}
        </div>

        {/* Details Side */}
        <div className="w-full sm:w-1/2 p-6 sm:p-8 md:p-10 flex flex-col overflow-y-auto bg-white dark:bg-[#141414]">
          <div className="flex items-center gap-2 mb-4">
             {product.isVeg !== undefined && (
              <div className={`w-4 h-4 border rounded-sm flex items-center justify-center shrink-0 ${product.isVeg ? 'border-green-500' : 'border-red-500'}`}>
                <div className={`w-2 h-2 rounded-full ${product.isVeg ? 'bg-green-500' : 'bg-red-500'}`}></div>
              </div>
            )}
            <span className="text-xs sm:text-sm font-bold tracking-widest uppercase text-[#E23744] dark:text-[#ff5c6a]">
              {product.category || 'Specialty'}
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-4 leading-tight">
            {product.name}
          </h2>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center gap-1 bg-green-600 text-white px-2.5 py-1 rounded-md font-bold shadow-sm text-sm sm:text-base">
              {product.rating || 4.5} <Star className="w-4 h-4 fill-current" />
            </div>
            <span className="text-gray-500 text-sm font-medium underline decoration-gray-300 dark:decoration-gray-700 underline-offset-4">
              {product.ratingsCount || 240} Ratings
            </span>
          </div>

          <p className="text-gray-600 dark:text-gray-300 text-base leading-relaxed mb-8 sm:mb-10 flex-1">
            {product.description || `Delight your taste buds with our freshly prepared ${product.name}. Carefully crafted using the finest ingredients to deliver a perfect culinary experience. A highly recommended choice among our customers!`}
          </p>

          <div className="mt-auto pt-6 border-t border-gray-100 dark:border-white/5 shrink-0">
            <div className="flex flex-col mb-6">
              <span className="text-sm font-medium text-gray-500 mb-1">Total Price</span>
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">
                  ₹{product.price}
                </span>
                {product.disc && (
                  <span className="text-xl text-gray-400 line-through font-medium">
                    ₹{originalPrice}
                  </span>
                )}
              </div>
            </div>

            <div className="flex gap-3 sm:gap-4">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onBuyNow(product);
                }}
                className="flex-1 py-4 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-black font-black text-base rounded-2xl active:scale-95 transition-all shadow-[0_4px_14px_rgba(251,191,36,0.3)] uppercase flex items-center justify-center gap-2"
              >
                Buy Now
              </button>
              <button
                type="button"
                onClick={() => {
                  onAddToCart(product);
                  onClose();
                }}
                className="w-14 h-14 sm:w-[60px] sm:h-[60px] shrink-0 flex items-center justify-center bg-gray-100 dark:bg-white/5 hover:bg-[#E23744] hover:text-white dark:hover:bg-[#E23744] text-gray-900 dark:text-white font-bold rounded-2xl active:scale-95 transition-all duration-300 group/add border border-gray-200 dark:border-transparent"
              >
                <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 group-hover/add:hidden" />
                <Plus className="w-6 h-6 sm:w-7 sm:h-7 hidden group-hover/add:block" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
