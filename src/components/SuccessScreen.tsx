import React, { useState } from 'react';
import { CheckCircle2, Home, MapPin, Truck, FileText, Download, X, Navigation, Bike } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Order } from '../types';
import InvoiceModal from './InvoiceModal';

interface SuccessScreenProps {
  order?: Order;
  onBackToHome: () => void;
  onViewOrders?: () => void;
}

export default function SuccessScreen({ order, onBackToHome, onViewOrders }: SuccessScreenProps) {
  const [showInvoice, setShowInvoice] = useState(false);
  const displayOrderId = order?.id || Math.floor(100000000 + Math.random() * 900000000).toString();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] flex flex-col items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="glass-card rounded-3xl p-8 max-w-md w-full text-center relative overflow-hidden bg-white dark:bg-[#141414] border border-gray-200 dark:border-white/10 shadow-2xl"
      >
        
        {/* Glow effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-emerald-500/20 blur-[60px] rounded-full pointer-events-none"></div>

        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.2, damping: 12, stiffness: 200 }}
          className="w-24 h-24 bg-emerald-100 dark:bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_20px_rgba(16,185,129,0.3)] relative z-10 border border-emerald-500/30"
        >
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4, type: 'spring' }}
          >
            <CheckCircle2 className="w-12 h-12 text-emerald-500" />
          </motion.div>
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mb-2 relative z-10"
        >
          Order Confirmed! 🎉
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-gray-600 dark:text-gray-400 mb-6 font-medium relative z-10 text-sm"
        >
          Your delicious meal is being prepared & assigned to a rider.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-gray-50 dark:bg-[#0a0a0a] rounded-2xl p-4 mb-6 text-left border border-gray-200 dark:border-white/10 relative z-10 shadow-sm"
        >
          <div className="flex justify-between items-center mb-3 pb-3 border-b border-gray-200/60 dark:border-white/10">
            <span className="text-gray-500 text-xs font-medium">Order ID</span>
            <span className="font-bold text-gray-900 dark:text-white text-sm">#{displayOrderId}</span>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500 shrink-0 mt-0.5">
              <Bike className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 dark:text-white mb-0.5">Live Delivery Tracking Ready</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                Watch your delivery partner on the live GPS map in real-time.
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="flex flex-col gap-3 relative z-10"
        >
          {/* Live Track Order button */}
          <button 
            onClick={onViewOrders}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-3.5 font-bold text-base shadow-lg shadow-emerald-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
          >
            <Navigation className="w-5 h-5 animate-pulse" />
            <span>Track Live Order on Map</span>
          </button>

          {order && (
            <button 
              onClick={() => setShowInvoice(true)}
              className="w-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl py-3 font-bold text-sm border border-blue-200 dark:border-blue-500/20 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-all flex items-center justify-center gap-2"
            >
              <FileText className="w-4 h-4" />
              View Invoice
            </button>
          )}
          
          <button 
            onClick={onBackToHome}
            className="w-full bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 rounded-xl py-3 font-bold text-sm hover:bg-gray-200 dark:hover:bg-white/10 transition-all flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            Back to Home
          </button>
        </motion.div>
      </motion.div>

      {/* Invoice Modal */}
      {order && <InvoiceModal show={showInvoice} onClose={() => setShowInvoice(false)} order={order} />}
    </div>
  );
}
