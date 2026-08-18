import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase only once
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Standard Firestore initialization with explicit database ID
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Validate Connection to Firestore with graceful offline handling
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('the client is offline') || (error as any).code === 'unavailable') {
        // Safe offline mode notification
        console.info("Firestore: offline mode active, local data cached.");
      }
    }
  }
}

if (typeof window !== 'undefined' && typeof navigator !== 'undefined' && navigator.onLine) {
  // Test connection non-blockingly
  testConnection().catch(() => {});
}
