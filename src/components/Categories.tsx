import React, { memo } from 'react';
import { categories } from '../data';
import OptimizedImage from './OptimizedImage';

interface CategoriesProps {
  setView: (view: any) => void;
  setSearchQuery: (q: string) => void;
}

const CategoriesComponent: React.FC<CategoriesProps> = ({ setView, setSearchQuery }) => {
  return (
    <section className="py-6 sm:py-8 bg-gray-50 dark:bg-[#0a0a0a] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-[20px] sm:text-[24px] font-black text-gray-900 dark:text-white tracking-tight">
            Inspiration for your first order
          </h2>
        </div>
        
        <div className="flex overflow-x-auto hide-scrollbar gap-5 sm:gap-7 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
          {categories.map((category, index) => (
            <div 
              key={category.id}
              onClick={() => {
                setSearchQuery(category.name);
                setView('search');
              }}
              className="flex flex-col items-center gap-2 min-w-[76px] sm:min-w-[88px] cursor-pointer group shrink-0"
            >
              <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-full overflow-hidden bg-white dark:bg-[#141414] border border-gray-200 dark:border-white/10 p-0.5 transition-all duration-300 group-hover:scale-105 group-hover:border-[#E23744] shadow-sm">
                <OptimizedImage 
                  src={category.image} 
                  alt={category.name}
                  fallbackId={category.id}
                  priority={index < 4}
                  className="w-full h-full rounded-full group-hover:brightness-105 transition-all"
                />
              </div>
              <span className="text-[13px] font-bold text-gray-700 dark:text-gray-300 group-hover:text-[#E23744] dark:group-hover:text-white transition-colors text-center truncate max-w-[80px]">
                {category.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export const Categories = memo(CategoriesComponent);
export default Categories;
