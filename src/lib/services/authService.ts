// src/lib/services/authService.ts
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    updateProfile
  } from 'firebase/auth';
  import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
  import { auth, db } from '@/lib/firebase/config';
  import { UserRole } from '@/types';
  
  export const authService = {
    // Sign in existing user
    signIn: async (email: string, password: string) => {
      try {
        const result = await signInWithEmailAndPassword(auth, email, password);
        return { user: result.user, error: null };
      } catch (error: any) {
        return { user: null, error: error.message };
      }
    },
  
    // Sign out
    signOut: async () => {
      try {
        await firebaseSignOut(auth);
        return { error: null };
      } catch (error: any) {
        return { error: error.message };
      }
    },
  
    // Create new user (Admin only)
    createUser: async (
      email: string, 
      password: string, 
      displayName: string, 
      role: UserRole
    ) => {
      try {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        
        // Update profile
        await updateProfile(result.user, { displayName });
  
        // Create user document in Firestore
        await setDoc(doc(db, 'users', result.user.uid), {
          uid: result.user.uid,
          email,
          displayName,
          role,
          photoURL: null,
          createdAt: serverTimestamp(),
          lastSeen: serverTimestamp(),
          isOnline: true,
        });
  
        return { user: result.user, error: null };
      } catch (error: any) {
        return { user: null, error: error.message };
      }
    },
  };