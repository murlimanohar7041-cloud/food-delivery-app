import React, { useState, useEffect, memo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import OptimizedImage from './OptimizedImage';

interface BannersProps {
  onBannerClick?: (tag: string) => void;
}

const bannerData = [
  {
    id: 1,
    title: 'Gourmet Pizza Fiesta',
    subtitle: 'Flat 50% OFF up to ₹150',
    tag: 'Pizza',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1000&q=80',
    color: 'from-amber-600 to-orange-700'
  },
  {
    id: 2,
    title: 'Craving Juicy Burgers?',
    subtitle: 'Free Delivery on Orders Above ₹299',
    tag: 'Burgers',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1000&q=80',
    color: 'from-rose-600 to-red-800'
  },
  {
    id: 3,
    title: 'Healthy Superfood Bowls',
    subtitle: 'Get 20% Cashback via M-Pay',
    tag: 'Healthy',
    image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1000&q=80',
    color: 'from-emerald-600 to-teal-800'
  }
];

const BannersComponent: React.FC<BannersProps> = ({ onBannerClick }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % bannerData.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <div className="relative rounded-2xl overflow-hidden shadow-lg h-44 sm:h-56 md:h-64 group bg-black">
        {bannerData.map((banner, index) => {
          const isActive = index === currentIndex;
          return (
            <div
              key={banner.id}
              onClick={() => onBannerClick?.(banner.tag)}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out cursor-pointer ${
                isActive ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              <OptimizedImage
                src={banner.image}
                alt={banner.title}
                priority={index === 0}
                className="w-full h-full"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 to-transparent flex flex-col justify-center px-6 sm:px-12">
                <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-amber-400 mb-1">
                  Limited Time Deal
                </span>
                <h2 className="text-xl sm:text-3xl md:text-4xl font-black text-white max-w-md leading-tight">
                  {banner.title}
                </h2>
                <p className="text-xs sm:text-base text-gray-200 mt-1 sm:mt-2 font-medium">
                  {banner.subtitle}
                </p>
                <div className="mt-3 sm:mt-4">
                  <button 
                    type="button"
                    className="px-4 py-1.5 sm:px-6 sm:py-2 bg-[#E23744] hover:bg-red-600 text-white font-black text-xs sm:text-sm rounded-full transition-transform active:scale-95 shadow-md"
                  >
                    Order Now
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {/* Carousel Prev/Next Navigation Controls */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setCurrentIndex((prev) => (prev === 0 ? bannerData.length - 1 : prev - 1));
          }}
          aria-label="Previous banner"
          className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setCurrentIndex((prev) => (prev + 1) % bannerData.length);
          }}
          aria-label="Next banner"
          className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Indicator dots */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
          {bannerData.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(i);
              }}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === currentIndex ? 'w-6 bg-[#E23744]' : 'w-2 bg-white/50'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export const Banners = memo(BannersComponent);
export default Banners;
