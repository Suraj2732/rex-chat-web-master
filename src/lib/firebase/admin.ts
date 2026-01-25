// src/lib/firebase/admin.ts
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import serviceAccount from '@/config/service-key.json';

let adminApp: App;

function getAdminApp() {
  if (getApps().length === 0) {
    // Try environment variables first, fallback to service account file
    const credential = process.env.FIREBASE_ADMIN_PROJECT_ID 
      ? cert({
          projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
          clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        })
      : cert(serviceAccount as any);

    adminApp = initializeApp({
      credential,
    });
  } else {
    adminApp = getApps()[0];
  }
  return adminApp;
}

export const adminAuth = getAuth(getAdminApp());
export const adminDb = getFirestore(getAdminApp());
