import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile, UserRole } from '../types';

export const ADMIN_BOOTSTRAP_EMAIL = 'murlimanohar7041@gmail.com';

/**
 * Strips all `undefined` values from an object recursively to prevent Firestore setDoc/updateDoc crashes.
 */
export function cleanFirestoreObject<T extends Record<string, any>>(obj: T): T {
  const cleaned: any = Array.isArray(obj) ? [] : {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) {
      continue;
    }
    if (value !== null && typeof value === 'object' && !(value instanceof Date)) {
      cleaned[key] = cleanFirestoreObject(value);
    } else {
      cleaned[key] = value;
    }
  }
  return cleaned as T;
}

/**
 * Returns a human-friendly error message from Firebase Auth error objects or codes.
 * Also logs the raw error to console for seamless debugging.
 */
export function getAuthErrorMessage(error: any): string {
  if (!error) return 'An unknown error occurred. Please try again.';
  
  const code = typeof error === 'string' ? error : error.code || '';
  const message = error.message || '';

  // Log detailed error for developers / debugging
  console.error('[M-Bites Auth Debug]', { code, message, error });

  switch (code) {
    case 'auth/invalid-credential':
      return 'Invalid email or password. Please check your credentials or register a new account.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please verify and try again, or click "Forgot Password".';
    case 'auth/user-not-found':
      return 'No account found with this email. Please register to create an account.';
    case 'auth/email-already-in-use':
      return 'This email address is already registered. Please sign in with your password.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address (e.g., name@example.com).';
    case 'auth/weak-password':
      return 'Password is too weak. Please use at least 6 characters with letters and numbers.';
    case 'auth/user-disabled':
      return 'This account has been suspended by the administrator.';
    case 'auth/too-many-requests':
      return 'Too many failed login attempts. Access is temporarily paused for security. Please try again in a few minutes.';
    case 'auth/network-request-failed':
      return 'Network connectivity error. Please check your internet connection and try again.';
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'Google sign-in was cancelled.';
    case 'auth/popup-blocked':
      return 'Sign-in popup was blocked by browser. Please enable popups for this website.';
    case 'auth/unauthorized-domain':
      return 'This domain is not authorized in Firebase configuration. Please use the authorized domain.';
    case 'auth/operation-not-allowed':
      return 'Email/Password authentication provider is being initialized. Please try again.';
    case 'auth/requires-recent-login':
      return 'Please log in again to perform this sensitive action.';
    default:
      if (message.includes('network') || message.includes('offline')) {
        return 'Network connection error. Please check your internet connection.';
      }
      return message || 'Authentication failed. Please verify your details.';
  }
}

/**
 * Given user input (which can be an email or a 10-digit phone number),
 * resolves to the correct email address for Firebase Auth.
 */
export async function resolveEmailFromIdentifier(input: string): Promise<string> {
  const cleaned = input.trim();
  if (cleaned.includes('@')) {
    return cleaned.toLowerCase();
  }

  // Input looks like a phone number (e.g., "9876543210" or "+919876543210")
  const numericPhone = cleaned.replace(/\D/g, '');
  if (numericPhone.length >= 10) {
    const raw10 = numericPhone.slice(-10);
    try {
      // Query users collection for this phone number if permitted
      const q = query(collection(db, 'users'), where('phone', '==', raw10));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const userData = snap.docs[0].data() as UserProfile;
        if (userData.email) {
          return userData.email.toLowerCase();
        }
      }
    } catch (err) {
      // Unauthenticated reads might fail gracefully
      console.warn('Phone lookup in users collection skipped (unauthenticated or offline):', err);
    }
    // Fallback standard synthetic email for phone-only registered accounts
    return `${raw10}@mbites-user.com`;
  }

  return cleaned.toLowerCase();
}

/**
 * Checks if an email or user profile represents an Admin
 */
export function isUserAdmin(email?: string | null, profile?: UserProfile | null): boolean {
  if (!email && !profile) return false;
  if (email && email.toLowerCase() === ADMIN_BOOTSTRAP_EMAIL.toLowerCase()) return true;
  if (profile?.role === 'admin') return true;
  return false;
}

/**
 * Checks if user profile represents a Delivery Partner (Rider)
 */
export function isUserRider(profile?: UserProfile | null, email?: string | null): boolean {
  if (profile?.role === 'rider') return true;
  if (isUserAdmin(email, profile)) return true;
  return false;
}

