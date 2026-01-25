import { useEffect, useState } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot,
  limit
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Message } from '@/types';

export function useMessages(chatId: string | null | undefined) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!chatId) {
      setLoading(false);
      return;
    }

    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messagesData = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as Message[];

      setMessages(messagesData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [chatId]);

  return { messages, loading };
}

