import React, { useState, useMemo, memo } from 'react';
import { ArrowLeft, Search, Filter, SortDesc, ShoppingCart, Heart, Star, Plus } from 'lucide-react';
import { products } from '../products';
import OptimizedImage from './OptimizedImage';

interface SearchPageProps {
  onBack: () => void;
  onAddToCart: (item: any) => void;
  onBuyNow?: (item: any) => void;
  onProductClick?: (item: any) => void;
  initialQuery?: string;
  wishlistIds?: number[];
  onToggleWishlist?: (id: number) => void;
}

const ALL_CATEGORIES = ['All', 'Pizza', 'Burgers', 'Healthy', 'Drinks', 'Desserts', 'Sushi', 'Coffee', 'Pasta', 'Tacos', 'Salads', 'Ice Cream'];

const SearchPageComponent: React.FC<SearchPageProps> = ({
  onBack,
  onAddToCart,
  onBuyNow,
  onProductClick,
  initialQuery = '',
  wishlistIds = [],
  onToggleWishlist,
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [minPrice, setMinPrice] = useState('100');
  const [maxPrice, setMaxPrice] = useState('800');
  const [category, setCategory] = useState('All');

  const wishlistSet = useMemo(() => new Set(wishlistIds), [wishlistIds]);

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    const min = Number(minPrice) || 0;
    const max = Number(maxPrice) || 10000;

    return products.filter((item) => {
      const matchesSearch = !q || item.name.toLowerCase().includes(q) || item.category.toLowerCase().includes(q);
      const matchPrice = item.price >= min && item.price <= max;
      const matchCategory = category === 'All' || item.category.toLowerCase() === category.toLowerCase();
      return matchesSearch && matchPrice && matchCategory;
    });
  }, [query, minPrice, maxPrice, category]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] pb-20 text-gray-900 dark:text-gray-100 transition-colors">
      {/* Sticky Search Header */}
      <div className="bg-white dark:bg-[#141414] border-b border-gray-200 dark:border-white/10 sticky top-0 z-40 shadow-sm transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 -ml-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search food, dishes, cuisine..."
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#0a0a0a] text-gray-900 dark:text-white focus:outline-none focus:border-[#E23744] text-sm transition-all"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between text-xs sm:text-sm">
            <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar w-full sm:w-auto pb-1">
              <Filter className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span className="font-bold text-gray-600 dark:text-gray-400 shrink-0">Category:</span>
              <div className="flex gap-1.5 shrink-0">
                {ALL_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`px-3 py-1 rounded-lg border text-xs font-semibold whitespace-nowrap transition-colors ${
                      category === cat
                        ? 'bg-[#E23744] border-transparent text-white'
                        : 'bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 bg-gray-100 dark:bg-[#1a1a1a] p-1.5 rounded-lg border border-gray-200 dark:border-white/10 shrink-0">
              <SortDesc className="w-3.5 h-3.5 text-gray-400" />
              <span className="font-bold text-gray-700 dark:text-gray-300 text-xs">Price:</span>
              <input
                type="number"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-14 bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/10 rounded px-1.5 py-0.5 text-xs text-center"
              />
              <span className="text-gray-400">-</span>
              <input
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-14 bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/10 rounded px-1.5 py-0.5 text-xs text-center"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <h2 className="text-base font-bold text-gray-700 dark:text-gray-300 mb-5 flex items-center gap-2">
          Results for "{query || category}" <span className="text-gray-400 text-xs">({filteredItems.length} found)</span>
        </h2>

        {filteredItems.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Search className="w-12 h-12 mx-auto mb-3 opacity-25" />
            <p className="text-sm">No items found matching your filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            {filteredItems.map((item, index) => {
              const isWishlisted = wishlistSet.has(item.id);
              const originalPrice = item.disc ? Math.round(item.price / (1 - item.disc / 100)) : item.price;

              return (
                <div
                  key={item.id}
                  className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-white/5 p-3.5 rounded-xl flex gap-3.5 hover:border-[#E23744]/40 hover:shadow-md transition-all group relative cursor-pointer"
                  onClick={() => onProductClick?.(item)}
                >
                  <div className="relative w-24 h-24 rounded-lg overflow-hidden shrink-0 bg-gray-100 dark:bg-[#1a1a1a]">
                    <OptimizedImage
                      src={item.image}
                      alt={item.name}
                      fallbackId={item.id}
                      priority={index < 4}
                      className="w-full h-full group-hover:scale-105 transition-transform duration-500"
                    />
                    {item.isVeg !== undefined && (
                      <div className="absolute bottom-1 right-1 z-10 bg-white/90 dark:bg-black/80 backdrop-blur-md p-1 rounded scale-75">
                        <div
                          className={`w-3 h-3 border rounded-sm flex items-center justify-center ${
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

                  <div className="flex flex-col flex-1 min-w-0">
                    <div className="pr-6">
                      <h3 className="font-bold text-gray-900 dark:text-white text-sm leading-tight mb-1 group-hover:text-[#E23744] transition-colors truncate">
                        {item.name}
                      </h3>

                      <div className="flex items-center gap-1.5 mb-1 text-[10px]">
                        <div className="flex items-center gap-0.5 bg-green-600 text-white px-1.5 py-0.5 rounded font-bold shadow-sm">
                          {item.rating || 4.5} <Star className="w-2.5 h-2.5 fill-current" />
                        </div>
                      </div>

                      <div className="flex items-baseline gap-1.5">
                        <p className="text-gray-900 dark:text-white font-black text-base">₹{item.price}</p>
                        {item.disc && (
                          <>
                            <p className="text-xs text-gray-400 line-through">₹{originalPrice}</p>
                            <p className="text-[10px] font-black text-[#E23744]">{item.disc}% OFF</p>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-auto pt-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onBuyNow?.(item);
                        }}
                        className="flex-1 py-1.5 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-black font-black text-[11px] rounded-lg active:scale-95 transition-all uppercase text-center"
                      >
                        Buy Now
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddToCart(item);
                        }}
                        className="p-1.5 w-8 h-8 flex items-center justify-center bg-gray-100 dark:bg-[#1a1a1a] text-gray-900 dark:text-white hover:bg-[#E23744] hover:text-white dark:hover:bg-[#E23744] font-bold rounded-lg transition-all active:scale-95 shrink-0 group/add"
                        title="Add to Cart"
                      >
                        <ShoppingCart className="w-3.5 h-3.5 group-hover/add:hidden" />
                        <Plus className="w-4 h-4 hidden group-hover/add:block" />
                      </button>
                    </div>
                  </div>

                  {onToggleWishlist && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleWishlist(item.id);
                      }}
                      className="absolute top-2.5 right-2.5 z-10 p-1.5 bg-white/90 dark:bg-black/50 backdrop-blur-md rounded-full shadow-sm hover:scale-110 active:scale-90 transition-transform"
                    >
                      <Heart
                        className={`w-3.5 h-3.5 ${
                          isWishlisted
                            ? 'fill-[#E23744] text-[#E23744]'
                            : 'text-gray-400 dark:text-gray-500'
                        }`}
                      />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export const SearchPage = memo(SearchPageComponent);
export default SearchPage;
