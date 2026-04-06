import * as admin from 'firebase-admin';
import dotenv from 'dotenv';
dotenv.config();

// Usually, you should use service account JSON.
// For testing purposes, if FIREBASE_SERVICE_ACCOUNT is available it uses that, 
// otherwise initializes default app (which might fail without GOOGLE_APPLICATION_CREDENTIALS)

try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } else {
    // Attempt default initialization
    admin.initializeApp();
  }
  console.log('Firebase Admin SDK Initialized');
} catch (error) {
  console.error('Firebase Admin Initialization Error:', error);
}

export const db = admin.firestore();
export const auth = admin.auth();
