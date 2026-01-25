// src/lib/services/userService.ts
import { 
    collection, 
    query, 
    where, 
    getDocs, 
    doc, 
    getDoc,
    updateDoc 
  } from 'firebase/firestore';
  import { db } from '@/lib/firebase/config';
  import { User } from '@/types';
  
  export const userService = {
    // Get all users (Admin only)
    getAllUsers: async (): Promise<User[]> => {
      try {
        const usersRef = collection(db, 'users');
        const snapshot = await getDocs(usersRef);
        
        return snapshot.docs.map(doc => ({
          ...doc.data(),
          uid: doc.id,
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          lastSeen: doc.data().lastSeen?.toDate() || new Date(),
        })) as User[];
      } catch (error) {
        console.error('Error fetching users:', error);
        return [];
      }
    },
  
    // Get employees only
    getEmployees: async (): Promise<User[]> => {
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('role', '==', 'employee'));
        const snapshot = await getDocs(q);
        
        return snapshot.docs.map(doc => ({
          ...doc.data(),
          uid: doc.id,
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          lastSeen: doc.data().lastSeen?.toDate() || new Date(),
        })) as User[];
      } catch (error) {
        console.error('Error fetching employees:', error);
        return [];
      }
    },
  
    // Get admins only
    getAdmins: async (): Promise<User[]> => {
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('role', '==', 'admin'));
        const snapshot = await getDocs(q);
        
        return snapshot.docs.map(doc => ({
          ...doc.data(),
          uid: doc.id,
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          lastSeen: doc.data().lastSeen?.toDate() || new Date(),
        })) as User[];
      } catch (error) {
        console.error('Error fetching admins:', error);
        return [];
      }
    },
  
    // Get user by ID
    getUserById: async (userId: string): Promise<User | null> => {
      try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        
        if (userDoc.exists()) {
          return {
            ...userDoc.data(),
            uid: userDoc.id,
            createdAt: userDoc.data().createdAt?.toDate() || new Date(),
            lastSeen: userDoc.data().lastSeen?.toDate() || new Date(),
          } as User;
        }
        
        return null;
      } catch (error) {
        console.error('Error fetching user:', error);
        return null;
      }
    },
  
    // Update user profile
    updateUserProfile: async (userId: string, data: Partial<User>) => {
      try {
        await updateDoc(doc(db, 'users', userId), data);
        return { success: true, error: null };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
  };