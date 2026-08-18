import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Share, PlusSquare, Sparkles, Check, Bell, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { usePWAInstall, requestNotificationPermission } from '../utils/pwaUtils';

interface PWAInstallPromptProps {
  forceOpen?: boolean;
  onCloseForce?: () => void;
}

export default function PWAInstallPrompt({ forceOpen, onCloseForce }: PWAInstallPromptProps) {
  const { isInstallable, isInstalled, isIOS, triggerInstall } = usePWAInstall();
  const [showBanner, setShowBanner] = useState<boolean>(false);
  const [showIosGuide, setShowIosGuide] = useState<boolean>(false);

  useEffect(() => {
    // Check if dismissed recently
    const dismissed = localStorage.getItem('mbites_pwa_dismissed');
    const dismissedTime = dismissed ? parseInt(dismissed, 10) : 0;
    const now = Date.now();

    // Auto-show banner if installable or iOS, not installed, and not dismissed in the last 24 hours
    if ((isInstallable || isIOS) && !isInstalled && (now - dismissedTime > 24 * 60 * 60 * 1000)) {
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [isInstallable, isInstalled, isIOS]);

  const handleDismiss = () => {
    setShowBanner(false);
    if (onCloseForce) onCloseForce();
    localStorage.setItem('mbites_pwa_dismissed', Date.now().toString());
  };

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIosGuide(true);
      return;
    }

    const success = await triggerInstall();
    if (success) {
      setShowBanner(false);
    }
  };

  if (isInstalled) return null;

  const isOpen = forceOpen || showBanner;

  if (!isOpen && !showIosGuide) return null;

  return (
    <AnimatePresence>
      {/* Mobile Floating Install Pill / Banner */}
      {isOpen && !showIosGuide && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-50 pointer-events-auto"
        >
          <div className="bg-[#141414] text-white p-4 rounded-2xl border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.8)] backdrop-blur-2xl relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#E23744]/20 rounded-full blur-3xl pointer-events-none"></div>

            <div className="flex items-start gap-3.5 relative z-10">
              {/* App Icon */}
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#FF385C] via-[#E23744] to-[#B3131E] p-0.5 shadow-lg flex items-center justify-center shrink-0">
                <img
                  src="/icon.svg"
                  alt="M-Bites App"
                  className="w-full h-full rounded-[10px] object-cover"
                />
              </div>

              {/* Text Info */}
              <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <h4 className="font-extrabold text-sm text-white tracking-tight">
                    Install M-Bites App
                  </h4>
                  <span className="bg-[#E23744]/20 text-[#FF4D5B] text-[9px] font-black px-1.5 py-0.5 rounded border border-[#E23744]/30 uppercase">
                    PWA
                  </span>
                </div>
                <p className="text-xs text-gray-400 leading-snug">
                  Fast 1-tap ordering, real-time GPS tracking & works offline.
                </p>
                <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-400 font-medium">
                  <span className="flex items-center gap-1 text-emerald-400">
                    <ShieldCheck className="w-3 h-3" /> Safe & Fast
                  </span>
                  <span>•</span>
                  <span>⚡ Instant Loading</span>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={handleDismiss}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 mt-3.5 pt-3 border-t border-white/10 relative z-10">
              <button
                onClick={handleDismiss}
                className="flex-1 py-2 text-xs font-semibold text-gray-400 hover:text-white transition-colors"
              >
                Not Now
              </button>
              <button
                onClick={handleInstallClick}
                className="flex-[2] py-2 px-4 bg-gradient-to-r from-[#E23744] to-[#FF4D5B] hover:brightness-110 active:scale-95 text-white rounded-xl text-xs font-bold shadow-md shadow-[#E23744]/30 flex items-center justify-center gap-1.5 transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Add to Home Screen</span>
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* iOS Installation Instruction Modal */}
      {showIosGuide && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-[#141414] border border-white/10 rounded-3xl p-6 max-w-sm w-full text-white shadow-2xl relative"
          >
            <button
              onClick={() => setShowIosGuide(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white bg-white/5 rounded-full"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#E23744] to-orange-500 mx-auto mb-3 flex items-center justify-center shadow-lg p-0.5">
                <img src="/icon.svg" alt="App" className="w-full h-full rounded-[14px]" />
              </div>
              <h3 className="text-lg font-bold">Install M-Bites on iPhone / iPad</h3>
              <p className="text-xs text-gray-400 mt-1">
                Follow these simple steps in Safari to add the app to your Home Screen:
              </p>
            </div>

            <div className="space-y-4 mb-6 text-sm text-gray-300">
              <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                  <Share className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-xs text-white">1. Tap the Share button</p>
                  <p className="text-[11px] text-gray-400">Located at bottom navigation bar in Safari</p>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <PlusSquare className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-xs text-white">2. Select "Add to Home Screen"</p>
                  <p className="text-[11px] text-gray-400">Scroll down in the share menu options</p>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                  <Check className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-xs text-white">3. Tap "Add"</p>
                  <p className="text-[11px] text-gray-400">Top right corner to complete install</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIosGuide(false)}
              className="w-full py-3 bg-[#E23744] hover:bg-[#FF4D5B] text-white rounded-xl font-bold text-sm transition-all"
            >
              Got it!
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
