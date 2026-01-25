// src/contexts/AuthContext.tsx
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import { User } from '@/types';

interface AuthContextType {
  currentUser: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  firebaseUser: null,
  loading: true,
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setFirebaseUser(user);
      
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        
        if (userDoc.exists()) {
          const userData = userDoc.data() as User;
          setCurrentUser({
            ...userData,
            uid: user.uid,
            createdAt: userData.createdAt || new Date(),
            lastSeen: new Date(),
          });

          // Update online status
          await updateDoc(doc(db, 'users', user.uid), {
            isOnline: true,
            lastSeen: serverTimestamp(),
          });
        }
      } else {
        setCurrentUser(null);
      }
      
      setLoading(false);
    });

    return () => {
      // Update offline status on unmount
      if (firebaseUser) {
        updateDoc(doc(db, 'users', firebaseUser.uid), {
          isOnline: false,
          lastSeen: serverTimestamp(),
        });
      }
      unsubscribe();
    };
  }, []);

  // Update online status periodically
  useEffect(() => {
    if (!firebaseUser) return;

    const interval = setInterval(async () => {
      await updateDoc(doc(db, 'users', firebaseUser.uid), {
        lastSeen: serverTimestamp(),
      });
    }, 60000); // Every minute

    return () => clearInterval(interval);
  }, [firebaseUser]);

  return (
    <AuthContext.Provider value={{ currentUser, firebaseUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
}