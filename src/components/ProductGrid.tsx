import React, { useState, useMemo, useEffect, useRef, memo } from 'react';
import ProductCard from './ProductCard';
import { getMixedProducts } from '../products';
import { prefetchImages } from './OptimizedImage';
import { Utensils, Sparkles } from 'lucide-react';

interface ProductGridProps {
  onAddToCart: (item: any) => void;
  onBuyNow?: (item: any) => void;
  onProductClick?: (item: any) => void;
  wishlistIds?: number[];
  onToggleWishlist?: (id: number) => void;
}

const CATEGORIES = [
  'All',
  'Pizza',
  'Burgers',
  'Healthy',
  'Drinks',
  'Desserts',
  'Sushi',
  'Coffee',
  'Pasta',
  'Tacos',
  'Salads',
  'Ice Cream',
];

const INITIAL_BATCH_SIZE = 24;
const BATCH_INCREMENT = 18;

const ProductGridComponent: React.FC<ProductGridProps> = ({
  onAddToCart,
  onBuyNow,
  onProductClick,
  wishlistIds = [],
  onToggleWishlist,
}) => {
  const allProducts = useMemo(() => getMixedProducts(), []);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [visibleCount, setVisibleCount] = useState<number>(INITIAL_BATCH_SIZE);
  const bottomSentinelRef = useRef<HTMLDivElement>(null);

  // Fast Set lookup for wishlist IDs O(1)
  const wishlistSet = useMemo(() => new Set(wishlistIds), [wishlistIds]);

  // Filter products by selected category
  const filteredProducts = useMemo(() => {
    if (selectedCategory === 'All') {
      return allProducts;
    }
    return allProducts.filter((p) => p.category.toLowerCase() === selectedCategory.toLowerCase());
  }, [allProducts, selectedCategory]);

  // Products to render based on current visible count
  const displayedProducts = useMemo(() => {
    return filteredProducts.slice(0, visibleCount);
  }, [filteredProducts, visibleCount]);

  // Background prefetch next batch images during browser idle time
  useEffect(() => {
    const nextImages = filteredProducts
      .slice(0, Math.min(visibleCount + BATCH_INCREMENT, filteredProducts.length))
      .map((p) => p.image);
    prefetchImages(nextImages);
  }, [displayedProducts, visibleCount, filteredProducts]);

  // Reset visible count when category changes
  const handleSelectCategory = (category: string) => {
    setSelectedCategory(category);
    setVisibleCount(INITIAL_BATCH_SIZE);
  };

  // Pre-load next batch 600px ahead of viewport scroll
  useEffect(() => {
    if (visibleCount >= filteredProducts.length) return;

    const sentinel = bottomSentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + BATCH_INCREMENT, filteredProducts.length));
        }
      },
      {
        rootMargin: '600px 0px',
        threshold: 0,
      }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [visibleCount, filteredProducts.length]);

  return (
    <section className="py-8 bg-gray-50 dark:bg-[#0a0a0a] min-h-[600px] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#E23744]/10 dark:bg-[#E23744]/20 rounded-xl text-[#E23744]">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-[22px] sm:text-[26px] font-black text-gray-900 dark:text-white tracking-tight leading-tight">
                Explore Menu
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Fresh gourmet meals delivered hot & fast ({filteredProducts.length} items)
              </p>
            </div>
          </div>

          {/* Highlights */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <Sparkles className="w-3.5 h-3.5" /> 100% Fresh Guaranteed
            </span>
          </div>
        </div>

        {/* Category Horizontal Filter Bar */}
        <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-3 mb-6 -mx-4 px-4 sm:mx-0 sm:px-0">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => handleSelectCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? 'bg-[#E23744] text-white shadow-md shadow-red-500/25 scale-[1.02]'
                    : 'bg-white dark:bg-[#141414] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-white/5 hover:border-gray-300 dark:hover:border-white/20 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Product Grid with Layout Containment */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-5">
          {displayedProducts.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              isWishlisted={wishlistSet.has(product.id)}
              priority={index < 8}
              onAddToCart={onAddToCart}
              onBuyNow={onBuyNow}
              onProductClick={onProductClick}
              onToggleWishlist={onToggleWishlist}
            />
          ))}
        </div>

        {/* Invisible Sentinel Element */}
        {visibleCount < filteredProducts.length && (
          <div
            ref={bottomSentinelRef}
            className="w-full py-6 flex justify-center items-center"
          >
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-400">
              <div className="w-2 h-2 rounded-full bg-[#E23744] animate-ping" />
              Loading more delicious items...
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export const ProductGrid = memo(ProductGridComponent);
export default ProductGrid;
