import { Star, Percent, ArrowLeft } from 'lucide-react';
import { getFallbackImage } from '../utils/fallbackImage';
import { restaurants } from '../data';

interface OffersPageProps {
  onSelectRestaurant: (restaurant: any) => void;
  onBack: () => void;
}

export default function OffersPage({ onSelectRestaurant, onBack }: OffersPageProps) {
  // Filter restaurants that have an offer
  const offerRestaurants = restaurants.filter(r => r.offer);

  return (
    <section className="py-8 bg-[#0a0a0a] min-h-screen text-gray-900 dark:text-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <button onClick={onBack} className="p-2 -ml-2 mb-4 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:text-white hover:bg-black/5 dark:bg-white/10 rounded-full transition-colors flex items-center gap-2">
          <ArrowLeft className="w-6 h-6" />
          <span className="font-medium">Back</span>
        </button>
        
        <div className="mb-8 pt-2">
          <div className="inline-flex items-center justify-center p-3 bg-red-500/20 rounded-full mb-4 text-[#E23744] shadow-[0_0_15px_rgba(226,55,68,0.3)]">
            <Percent className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white mb-2">Exclusive Offers For You</h1>
          <p className="text-gray-600 dark:text-gray-400 font-medium">Enjoy massive discounts and special deals from your favorite restaurants!</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {offerRestaurants.map((restaurant) => (
            <div 
              key={restaurant.id} 
              onClick={() => onSelectRestaurant(restaurant)}
              className="bg-[#141414] rounded-[16px] overflow-hidden border border-black/5 dark:border-white/5 hover:border-[#E23744]/50 hover:shadow-[0_8px_30px_rgba(226,55,68,0.15)] transition-all duration-500 group cursor-pointer flex flex-col"
            >
              {/* Image Container */}
              <div className="relative h-[200px] overflow-hidden bg-[#1a1a1a]">
                <img 
                  src={restaurant.image} 
                  alt={restaurant.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.src = getFallbackImage(restaurant.id);
                    e.currentTarget.onerror = null;
                  }}
                />
                
                {/* Huge Offer Badge */}
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-[#141414] via-black/40 to-transparent opacity-90"></div>
                
                {/* Promoted Badge */}
                {restaurant.promoted && (
                  <div className="absolute top-4 left-0 bg-gradient-to-r from-gray-900 to-gray-800 text-gray-900 dark:text-white text-[11px] font-bold px-3 py-1.5 rounded-r-md uppercase shadow-lg shadow-black/50 border border-black/10 dark:border-white/10 border-l-0">
                    Promoted
                  </div>
                )}
                
                <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                   <div className="text-[#E23744] font-black text-2xl tracking-tight drop-shadow-md">
                     {restaurant.offer}
                   </div>
                   <div className="bg-white text-black text-[12px] font-bold px-3 py-1.5 rounded-md shadow-sm">
                     {restaurant.deliveryTime}
                   </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-5 flex flex-col flex-1">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-[19px] font-bold text-gray-900 dark:text-white truncate pr-4 group-hover:text-[#E23744] transition-colors">
                    {restaurant.name}
                  </h3>
                  <div className="flex items-center gap-1 bg-[#24963F] text-gray-900 dark:text-white px-2 py-1 rounded-md text-[13px] font-bold shrink-0 shadow-[0_0_10px_rgba(36,150,63,0.3)]">
                    {restaurant.rating}
                    <Star className="w-3.5 h-3.5 fill-current" />
                  </div>
                </div>

                <div className="text-gray-600 dark:text-gray-400 text-[14px] mb-4 truncate font-medium">
                  {restaurant.cuisines.join(', ')}
                </div>
                
                <div className="mt-auto border-t border-dashed border-black/10 dark:border-white/10 pt-4 flex justify-between items-center text-[13px] text-gray-600 dark:text-gray-400 font-medium">
                  <p className="shrink-0 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-500"></span>
                    {restaurant.priceForTwo}
                  </p>
                  <p className="shrink-0 text-[#E23744] font-bold group-hover:scale-105 transition-transform">
                    Order Now
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {offerRestaurants.length === 0 && (
          <div className="text-center py-20">
             <div className="inline-flex justify-center items-center w-20 h-20 bg-[#141414] rounded-full mb-4 border border-black/5 dark:border-white/5">
               <Percent className="w-8 h-8 text-gray-600" />
             </div>
             <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No offers right now</h3>
             <p className="text-gray-600 dark:text-gray-400">Check back later for exciting discounts!</p>
          </div>
        )}
      </div>
    </section>
  );
}
