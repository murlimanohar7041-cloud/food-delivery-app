import React, { useState } from 'react';
import { 
  X, 
  Phone, 
  PhoneCall, 
  Copy, 
  Check, 
  ShieldCheck, 
  Bike, 
  Store, 
  User as UserIcon,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface CallModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetRole: 'rider' | 'restaurant' | 'customer';
  targetName: string;
  targetPhone: string;
  orderId?: string;
}

export default function CallModal({
  isOpen,
  onClose,
  targetRole,
  targetName,
  targetPhone,
  orderId
}: CallModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(targetPhone);
    setCopied(true);
    toast.success('Phone number copied to clipboard! 📋');
    setTimeout(() => setCopied(false), 2500);
  };

  const getRoleIcon = () => {
    switch (targetRole) {
      case 'rider':
        return <Bike className="w-8 h-8 text-white" />;
      case 'restaurant':
        return <Store className="w-8 h-8 text-white" />;
      default:
        return <UserIcon className="w-8 h-8 text-white" />;
    }
  };

  const getRoleBadge = () => {
    switch (targetRole) {
      case 'rider':
        return 'Delivery Partner';
      case 'restaurant':
        return 'Restaurant / Kitchen Support';
      default:
        return 'Customer';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm bg-white dark:bg-[#141414] rounded-3xl p-6 shadow-2xl border border-black/10 dark:border-white/10 text-center">
        
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Avatar / Icon */}
        <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-4 animate-pulse">
          {getRoleIcon()}
        </div>

        {/* Title */}
        <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-2">
          {getRoleBadge()}
        </span>

        <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight mb-1">
          {targetName}
        </h3>

        {orderId && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 font-mono">
            Order Reference: #{orderId.slice(-6).toUpperCase()}
          </p>
        )}

        {/* Phone number display box */}
        <div className="my-5 p-4 rounded-2xl bg-gray-50 dark:bg-[#1c1d24] border border-black/5 dark:border-white/5 flex items-center justify-between">
          <div className="text-left">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
              Contact Number
            </span>
            <span className="text-lg font-black text-gray-900 dark:text-white font-mono">
              {targetPhone}
            </span>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className="p-2.5 rounded-xl bg-white dark:bg-[#282a36] hover:bg-gray-100 dark:hover:bg-[#343746] text-gray-600 dark:text-gray-300 border border-black/5 dark:border-white/10 transition-colors cursor-pointer"
            title="Copy Number"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>

        {/* Call Action Button */}
        <div className="space-y-3">
          <a
            href={`tel:${targetPhone.replace(/\s+/g, '')}`}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-black text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-500/25 active:scale-98 transition-all"
          >
            <PhoneCall className="w-4 h-4" />
            <span>Call Now ({targetPhone})</span>
          </a>

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400 font-medium pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Secure connection • Direct cellular line</span>
          </div>
        </div>

      </div>
    </div>
  );
}
