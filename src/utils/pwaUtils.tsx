import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

// Service worker registration
export function registerServiceWorker() {
  if ('serviceWorker' in navigator && process.env.NODE_ENV !== 'development') {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('[PWA] ServiceWorker registered with scope:', reg.scope);
        })
        .catch((err) => {
          console.warn('[PWA] ServiceWorker registration failed:', err);
        });
    });
  }
}

// Check if app is running in Standalone (Installed PWA) mode
export function isRunningStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://')
  );
}

// PWA Install Prompt Hook
let deferredPrompt: any = null;

export function usePWAInstall() {
  const [isInstallable, setIsInstallable] = useState<boolean>(false);
  const [isInstalled, setIsInstalled] = useState<boolean>(isRunningStandalone());
  const [isIOS, setIsIOS] = useState<boolean>(false);

  useEffect(() => {
    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      deferredPrompt = e;
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      deferredPrompt = null;
      setIsInstallable(false);
      setIsInstalled(true);
      toast.success('M-Bites installed successfully! Open from your Home Screen.', {
        icon: '📱',
        duration: 5000
      });
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const triggerInstall = async (silentFallback: boolean = false): Promise<boolean> => {
    if (isInstalled || isRunningStandalone()) {
      toast.success('M-Bites is already installed on your device!', { icon: '📱' });
      return true;
    }

    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        deferredPrompt = null;
        setIsInstallable(false);
        if (outcome === 'accepted') {
          setIsInstalled(true);
          return true;
        }
        return false;
      } catch (e) {
        console.warn('Install prompt error:', e);
        return false;
      }
    }

    // When native prompt is not available
    if (isIOS) {
      if (!silentFallback) {
        toast('On iOS Safari: Tap Share (⎙) at the bottom and select "Add to Home Screen"', {
          icon: '📱',
          duration: 5000
        });
      }
      return false;
    }

    if (!silentFallback) {
      toast('To install, tap your browser menu (⋮) and select "Install app" or "Add to Home screen"', {
        icon: '📱',
        duration: 5000
      });
    }
    return false;
  };

  return {
    isInstallable,
    isInstalled,
    isIOS,
    triggerInstall
  };
}

// Audio chime generator for notifications (Web Audio API)
function playChime(type: 'success' | 'alert' | 'delivery' = 'alert') {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    if (type === 'delivery') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.setValueAtTime(880, now + 0.12); // A5
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      osc.start(now);
      osc.stop(now + 0.4);
    } else {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.2); // G5
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
      osc.start(now);
      osc.stop(now + 0.45);
    }
  } catch (e) {
    // Audio Context not allowed before interaction
  }
}

// Push / System Notification Manager
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    toast.error('Notifications are not supported in this browser');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      toast.success('Live delivery notifications enabled! 🔔');
      sendOrderStatusNotification('Notifications Enabled', 'You will receive real-time updates when your food is on the way!');
      return true;
    }
  }

  toast.error('Notification permission was blocked in browser settings');
  return false;
}

export function sendOrderStatusNotification(
  title: string,
  body: string,
  orderId?: string
) {
  playChime('delivery');

  // Trigger web notification if granted
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.ready.then((reg) => {
          reg.showNotification(title, {
            body,
            icon: '/icon-192.svg',
            badge: '/icon.svg',
            tag: orderId ? `order-${orderId}` : 'mbites-notification',
            vibrate: [100, 50, 100],
            data: {
              url: orderId ? `/?view=orders&orderId=${orderId}` : '/?view=orders'
            }
          } as any);
        });
      } else {
        new Notification(title, {
          body,
          icon: '/icon-192.svg',
          tag: orderId ? `order-${orderId}` : 'mbites-notification'
        });
      }
    } catch (e) {
      console.warn('Notification trigger error:', e);
    }
  }

  // Also trigger in-app toast
  toast.custom((t) => (
    <div
      onClick={() => toast.dismiss(t.id)}
      className={`${
        t.visible ? 'animate-enter' : 'animate-leave'
      } max-w-md w-full bg-[#181818] text-white shadow-2xl rounded-2xl pointer-events-auto flex ring-1 ring-white/10 p-3.5 items-center gap-3 border border-emerald-500/30 cursor-pointer`}
    >
      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#E23744] to-orange-500 flex items-center justify-center text-white shrink-0 shadow-md">
        🔔
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-gray-200 truncate">{title}</p>
        <p className="text-[11px] text-gray-400 line-clamp-1">{body}</p>
      </div>
    </div>
  ), { duration: 4500, position: 'top-right' });
}

// Hook to track online / offline state
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Connection restored! You are back online.', { icon: '🟢' });
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.error('You are currently offline. Check your internet.', { icon: '📡', duration: 6000 });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
