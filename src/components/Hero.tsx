import React, { memo } from 'react';
import { Search } from 'lucide-react';

interface HeroProps {
  setView: (view: any) => void;
  setSearchQuery: (q: string) => void;
}

const QUICK_FILTERS = ['Delivery', 'Dining Out', 'Nightlife', 'Pro Offers', 'Healthy', 'Pure Veg'];

const HeroComponent: React.FC<HeroProps> = ({ setView, setSearchQuery }) => {
  return (
    <div className="relative bg-gray-50 dark:bg-[#0a0a0a] pt-10 pb-12 sm:pt-16 sm:pb-20 overflow-hidden border-b border-black/5 dark:border-white/5 z-0 transition-colors">
      {/* Background food image with CSS hardware-accelerated opacity */}
      <div 
        className="absolute inset-0 z-[-20] opacity-15 dark:opacity-10 pointer-events-none transform-gpu"
      >
        <img 
          src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=75" 
          alt="Delicious food spread" 
          className="w-full h-full object-cover"
          loading="eager"
          decoding="async"
          fetchPriority="high"
          referrerPolicy="no-referrer"
        />
      </div>

      {/* Decorative gradient glowing orb */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] sm:w-[800px] h-[350px] sm:h-[500px] bg-[#E23744]/15 rounded-full blur-[100px] -z-10 pointer-events-none mix-blend-screen"></div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-[32px] sm:text-[48px] font-black text-gray-900 dark:text-white mb-4 leading-tight tracking-tight">
          Discover the best <span className="bg-gradient-to-r from-[#E23744] to-[#FF8C00] bg-clip-text text-transparent">food & drinks</span>
        </h1>
        <p className="text-sm sm:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-8 font-medium">
          Order food from favourite restaurants near you in seconds.
        </p>

        {/* Mobile Search Bar */}
        <div className="md:hidden max-w-md mx-auto mb-8">
          <div className="relative w-full flex shadow-[0_4px_20px_rgba(226,55,68,0.12)] border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden bg-white dark:bg-[#141414]">
            <div className="pl-4 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              id="mobile-hero-search"
              type="text"
              className="block w-full pl-3 pr-4 py-3.5 text-sm border-none outline-none bg-transparent placeholder-gray-400 text-gray-900 dark:text-white"
              placeholder="Restaurant, cuisine, or a dish..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setSearchQuery((e.target as HTMLInputElement).value);
                  setView('search');
                }
              }}
            />
          </div>
        </div>

        {/* Quick Filters */}
        <div className="flex flex-wrap justify-center gap-2.5 max-w-3xl mx-auto">
          {QUICK_FILTERS.map((filter, index) => (
            <button
              key={filter}
              type="button"
              className={`px-5 py-2 rounded-full text-xs sm:text-sm font-bold transition-transform active:scale-95 shadow-sm ${
                index === 0
                  ? 'bg-gradient-to-r from-[#E23744] to-[#FF5E5E] text-white shadow-red-500/20'
                  : 'bg-white dark:bg-[#141414] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-white/10 hover:border-[#E23744] hover:text-[#E23744]'
              }`}
              onClick={() => {
                setSearchQuery(filter);
                setView('search');
              }}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export const Hero = memo(HeroComponent);
export default Hero;
