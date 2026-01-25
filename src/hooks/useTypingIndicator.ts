// src/hooks/useTypingIndicator.ts
import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export function useTypingIndicator(chatId: string | null | undefined, currentUserId: string | undefined) {
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  useEffect(() => {
    if (!chatId || !currentUserId) {
      setTypingUsers([]);
      return;
    }

    const typingRef = doc(db, 'typing', chatId);

    const unsubscribe = onSnapshot(
      typingRef, 
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          const typing = Object.entries(data)
            .filter(([userId]) => userId !== currentUserId)
            .map(([_, value]: [string, any]) => value.userName)
            .filter(Boolean);
          
          setTypingUsers(typing);
        } else {
          setTypingUsers([]);
        }
      },
      (error) => {
        console.error('Typing indicator error:', error);
        setTypingUsers([]);
      }
    );

    return () => unsubscribe();
  }, [chatId, currentUserId]);

  return typingUsers;
}