import React, { memo } from 'react';
import { Star, Clock, Info } from 'lucide-react';
import { restaurants } from '../data';
import { toast } from 'react-hot-toast';
import OptimizedImage from './OptimizedImage';

interface RestaurantGridProps {
  onSelectRestaurant: (restaurant: any) => void;
}

const RestaurantGridComponent: React.FC<RestaurantGridProps> = ({ onSelectRestaurant }) => {
  return (
    <section className="py-8 bg-gray-50 dark:bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-[22px] sm:text-[26px] font-black text-gray-900 dark:text-white tracking-tight mb-6">
          Nearby Restaurants
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {restaurants.map((restaurant, index) => (
            <div 
              key={restaurant.id} 
              onClick={() => onSelectRestaurant(restaurant)}
              className="bg-white dark:bg-[#141414] rounded-2xl overflow-hidden border border-gray-200 dark:border-white/5 hover:border-[#E23744]/40 hover:shadow-[0_12px_36px_rgba(226,55,68,0.15)] transition-all duration-300 group cursor-pointer flex flex-col"
            >
              {/* Image Container */}
              <div className="relative h-[200px] overflow-hidden bg-gray-100 dark:bg-[#1a1a1a]">
                <OptimizedImage 
                  src={restaurant.image} 
                  alt={restaurant.name}
                  fallbackId={restaurant.id}
                  priority={index < 3}
                  className="w-full h-full group-hover:scale-105 transition-transform duration-500 ease-out"
                />
                
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 dark:from-[#141414] via-transparent to-transparent opacity-80 pointer-events-none"></div>
                
                {/* Promoted Badge */}
                {restaurant.promoted && (
                  <div className="absolute top-3.5 left-0 z-10 bg-gradient-to-r from-gray-900 to-gray-800 text-white text-[11px] font-bold px-3 py-1 rounded-r-md uppercase shadow-md border border-white/10 border-l-0">
                    Promoted
                  </div>
                )}

                {/* Offer Badge */}
                {restaurant.offer && (
                  <div className="absolute top-3.5 left-0 z-10 bg-gradient-to-r from-[#256FEF] to-blue-400 text-white text-[11px] font-black px-3 py-1 rounded-r-md shadow-md">
                    {restaurant.offer}
                  </div>
                )}
                
                {/* Delivery Time Pill */}
                <div className="absolute bottom-3.5 right-3.5 z-10 bg-white/90 dark:bg-black/70 backdrop-blur-md text-gray-900 dark:text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-md border border-white/20 dark:border-white/10 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#E23744]" />
                  {restaurant.deliveryTime}
                </div>
              </div>

              {/* Content */}
              <div className="p-5 flex flex-col flex-1">
                <div className="flex justify-between items-start mb-1.5">
                  <h3 className="text-[18px] font-bold text-gray-900 dark:text-white truncate pr-3 group-hover:text-[#E23744] transition-colors">
                    {restaurant.name}
                  </h3>
                  <div className="flex items-center gap-1 bg-[#24963F] text-white px-2 py-0.5 rounded-md text-[12px] font-bold shrink-0 shadow-sm">
                    {restaurant.rating}
                    <Star className="w-3 h-3 fill-current" />
                  </div>
                </div>

                <div className="text-gray-600 dark:text-gray-400 text-[13px] mb-4 truncate font-medium">
                  {restaurant.cuisines.join(', ')}
                </div>
                
                <div className="mt-auto flex justify-between items-center border-t border-gray-100 dark:border-white/5 pt-3 text-[12px] text-gray-600 dark:text-gray-400 font-medium">
                  <p className="shrink-0 flex items-center gap-1.5 font-bold text-gray-700 dark:text-gray-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    {restaurant.priceForTwo}
                  </p>
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation(); 
                      toast('Restaurant details coming soon!', { icon: 'ℹ️' });
                    }}
                    className="shrink-0 flex items-center gap-1 group-hover:text-[#E23744] transition-colors font-semibold"
                  >
                    <Info className="w-3.5 h-3.5" />
                    Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export const RestaurantGrid = memo(RestaurantGridComponent);
export default RestaurantGrid;
