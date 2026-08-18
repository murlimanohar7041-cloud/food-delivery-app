import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile, UserRole } from '../types';

export const ADMIN_BOOTSTRAP_EMAIL = 'murlimanohar7041@gmail.com';

/**
 * Returns a human-friendly, localized error message from Firebase Auth error objects or codes.
 */
export function getAuthErrorMessage(error: any): string {
  if (!error) return 'An unknown error occurred. Please try again.';
  
  const code = typeof error === 'string' ? error : error.code || '';
  const message = error.message || '';

  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
      return 'Invalid email or password. Please check your credentials and try again.';
    case 'auth/user-not-found':
      return 'No account found with this email or mobile. Please register first.';
    case 'auth/email-already-in-use':
      return 'This email address is already registered. Please login instead.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address format (e.g. name@example.com).';
    case 'auth/weak-password':
      return 'Password is too weak. Please use at least 6 characters.';
    case 'auth/user-disabled':
      return 'This account has been disabled or suspended. Please contact customer support.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Access is temporarily restricted for security. Please try again in a few minutes.';
    case 'auth/network-request-failed':
      return 'Network connection error. Please check your internet connection.';
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'Sign-in cancelled.';
    case 'auth/popup-blocked':
      return 'Popup was blocked by your browser. Please allow popups for this site.';
    case 'auth/unauthorized-domain':
      return 'This domain is not authorized in Firebase Console.';
    case 'auth/operation-not-allowed':
      return 'This sign-in method is currently disabled. Please contact admin.';
    case 'auth/requires-recent-login':
      return 'Please re-authenticate to perform this sensitive action.';
    default:
      if (message.includes('network') || message.includes('offline')) {
        return 'Network connection error. Please check your internet connection.';
      }
      return message || 'Authentication failed. Please verify your details.';
  }
}

/**
 * Given user input (which can be an email or a 10-digit phone number),
 * resolves to the correct email address stored in Firestore.
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
      // Query users collection for this phone number
      const q = query(collection(db, 'users'), where('phone', '==', raw10));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const userData = snap.docs[0].data() as UserProfile;
        if (userData.email) {
          return userData.email.toLowerCase();
        }
      }
      
      // Also try with full phone
      const qFull = query(collection(db, 'users'), where('phone', '==', cleaned));
      const snapFull = await getDocs(qFull);
      if (!snapFull.empty) {
        const userData = snapFull.docs[0].data() as UserProfile;
        if (userData.email) {
          return userData.email.toLowerCase();
        }
      }
    } catch (err) {
      console.warn('Could not lookup phone in Firestore users:', err);
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
export function isUserRider(profile?: UserProfile | null): boolean {
  return profile?.role === 'rider';
}
