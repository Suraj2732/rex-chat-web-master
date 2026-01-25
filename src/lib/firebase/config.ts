// src/lib/firebase/config.ts
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
    apiKey: "AIzaSyAbParkiAO911foJmBQ2u9RCo92fnQIVNI",
    authDomain: "chataap-7d8c1.firebaseapp.com",
    projectId: "chataap-7d8c1",
    storageBucket: "chataap-7d8c1.appspot.com",
    messagingSenderId: "1059103906463",
    appId: "1:1059103906463:web:85068cbc4d2468bc78e0aa",
    measurementId: "G-SVG6SQMTLY"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };