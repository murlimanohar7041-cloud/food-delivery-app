/**
 * Production Payment Utilities for Razorpay, Stripe & Cash on Delivery (COD)
 */

declare global {
  interface Window {
    Razorpay?: any;
    Stripe?: any;
  }
}

export interface PaymentOptions {
  amountInRupees: number;
  orderId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
}

export interface PaymentResult {
  success: boolean;
  gateway: 'razorpay' | 'stripe' | 'cod';
  paymentId?: string;
  error?: string;
  isTestMode?: boolean;
}

/**
 * Dynamically load Razorpay standard checkout script
 */
export async function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

/**
 * Execute Razorpay Payment
 */
export async function processRazorpayPayment(options: PaymentOptions): Promise<PaymentResult> {
  const keyId = ((import.meta as any).env?.VITE_RAZORPAY_KEY_ID as string) || '';

  if (!keyId) {
    return {
      success: false,
      gateway: 'razorpay',
      error: 'VITE_RAZORPAY_KEY_ID is not configured in .env. Please configure Razorpay Key ID or choose Cash on Delivery.'
    };
  }

  const loaded = await loadRazorpayScript();
  if (!loaded) {
    return {
      success: false,
      gateway: 'razorpay',
      error: 'Failed to load Razorpay SDK. Please check your internet connection.'
    };
  }

  return new Promise((resolve) => {
    try {
      const rzpOptions = {
        key: keyId,
        amount: Math.round(options.amountInRupees * 100), // amount in paise
        currency: 'INR',
        name: 'M-Bites Food Delivery',
        description: `Payment for Order #${options.orderId.slice(-6).toUpperCase()}`,
        image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=100&h=100&fit=crop',
        prefill: {
          name: options.customerName,
          email: options.customerEmail,
          contact: options.customerPhone
        },
        theme: {
          color: '#E23744'
        },
        handler: function (response: any) {
          resolve({
            success: true,
            gateway: 'razorpay',
            paymentId: response.razorpay_payment_id
          });
        },
        modal: {
          ondismiss: function () {
            resolve({
              success: false,
              gateway: 'razorpay',
              error: 'Payment was cancelled by the user.'
            });
          }
        }
      };

      const rzp = new window.Razorpay(rzpOptions);
      rzp.on('payment.failed', function (response: any) {
        resolve({
          success: false,
          gateway: 'razorpay',
          error: response.error?.description || 'Payment transaction failed.'
        });
      });
      rzp.open();
    } catch (e: any) {
      resolve({
        success: false,
        gateway: 'razorpay',
        error: e.message || 'Error opening payment window.'
      });
    }
  });
}
