import React, { useState } from 'react';
import { Instagram, Twitter, Facebook, Youtube } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface FooterProps {
  onOpenRiderPortal?: () => void;
}

export default function Footer({ onOpenRiderPortal }: FooterProps) {
  const [email, setEmail] = useState('');

  const handleJoin = () => {
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }
    
    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    // Simulate API call for newsletter subscription
    toast.success('Successfully subscribed to newsletter! 🎉');
    setEmail('');
  };

  return (
    <footer className="bg-[#111418] text-gray-400 py-16 px-6 lg:px-20 font-sans border-t border-white/5 pb-32 md:pb-16">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-12 justify-between">
        {/* Brand & Socials */}
        <div className="flex-1 max-w-sm">
          <h2 className="text-[#e6c79a] text-2xl font-semibold mb-6 tracking-wide">
            M-BITES
          </h2>
          <p className="text-sm leading-relaxed mb-8">
            Elevating your food delivery experience with real-time GPS tracking, fresh gourmet meals, and superfast deliveries.
          </p>
          <div className="flex gap-5">
            <a href="#" className="hover:text-white transition-colors">
              <Instagram className="w-5 h-5" />
            </a>
            <a href="#" className="hover:text-white transition-colors">
              <Twitter className="w-5 h-5" />
            </a>
            <a href="#" className="hover:text-white transition-colors">
              <Facebook className="w-5 h-5" />
            </a>
            <a href="#" className="hover:text-white transition-colors">
              <Youtube className="w-5 h-5" />
            </a>
          </div>
        </div>

        {/* Explore / Shop */}
        <div className="flex-1 max-w-[200px]">
          <h3 className="text-white font-bold mb-6 tracking-wide text-sm">EXPLORE</h3>
          <ul className="space-y-4 text-sm">
            <li><a href="#" className="hover:text-white transition-colors">All Cuisines</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Fast Food</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Healthy Meals</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Desserts</a></li>
          </ul>
        </div>

        {/* Support & Partner */}
        <div className="flex-1 max-w-[200px]">
          <h3 className="text-white font-bold mb-6 tracking-wide text-sm">SUPPORT</h3>
          <ul className="space-y-4 text-sm">
            <li><a href="#" className="hover:text-white transition-colors">FAQ</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Delivery Policy</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Refunds</a></li>
            {onOpenRiderPortal && (
              <li>
                <button 
                  onClick={onOpenRiderPortal}
                  className="hover:text-amber-400 transition-colors text-left flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Delivery Partner Fleet</span>
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-mono">Rider</span>
                </button>
              </li>
            )}
          </ul>
        </div>

        {/* Newsletter */}
        <div className="flex-[1.5]">
          <h3 className="text-white font-bold mb-6 tracking-wide text-sm">NEWSLETTER</h3>
          <p className="text-sm leading-relaxed mb-6">
            Subscribe to get special offers, free giveaways, and once-in-a-lifetime deals.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <input 
              type="email" 
              placeholder="Enter your email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
              className="bg-[#1a1f26] border border-transparent focus:border-white/20 text-white px-5 py-3 rounded outline-none w-full text-sm transition-colors"
            />
            <button 
              onClick={handleJoin}
              className="bg-[#e6c79a] text-black font-semibold px-8 py-3 rounded text-sm hover:bg-[#d8b88c] active:scale-95 transition-all whitespace-nowrap"
            >
              JOIN
            </button>
          </div>
        </div>
      </div>
      
      {/* Copyright / Maker Info */}
      <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500">
        <p>© {new Date().getFullYear()} NEXRA. All rights reserved.</p>
        <p className="mt-4 sm:mt-0 flex gap-1 items-center">
          Made with <span className="text-red-500">♥</span> by 
          <a href="mailto:murlimanohar7041@gmail.com" className="text-[#e6c79a] hover:text-white transition-colors ml-1">Murli Manohar Kumar</a>
        </p>
      </div>
    </footer>
  );
}
