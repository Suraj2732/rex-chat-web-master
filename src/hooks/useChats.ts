import { useEffect, useState } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot 
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Chat, User } from '@/types';
import { userService } from '@/lib/services/userService';

export function useChats(userId: string | undefined) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
 

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const chatsRef = collection(db, 'chats');
   
    const q = query(
      chatsRef,
      where('participants', 'array-contains', userId),
      orderBy('lastMessageTime', 'desc')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const chatsData: Chat[] = [];

      for (const doc of snapshot.docs) {
        const chatData = doc.data();
        
        // Get participant data
        const participantsData: User[] = [];
        for (const participantId of chatData.participants) {
          const user = await userService.getUserById(participantId);
          if (user) participantsData.push(user);
        }

        // Get last message
        const messagesRef = collection(db, 'chats', doc.id, 'messages');
        const lastMessageQuery = query(
          messagesRef,
          orderBy('createdAt', 'desc')
        );
        
        const messagesUnsubscribe = onSnapshot(lastMessageQuery, (msgSnapshot) => {
          if (!msgSnapshot.empty) {
            const lastMsg = msgSnapshot.docs[0].data();
            const chat: Chat = {
              id: doc.id,
              participants: chatData.participants,
              participantsData,
              lastMessage: {
                ...lastMsg,
                id: msgSnapshot.docs[0].id,
                createdAt: lastMsg.createdAt?.toDate() || new Date(),
              } as any,
              lastMessageTime: chatData.lastMessageTime?.toDate() || new Date(),
              unreadCount: chatData.unreadCount || {},
              createdAt: chatData.createdAt?.toDate() || new Date(),
              createdBy: chatData.createdBy,
            };

            setChats(prev => {
              const filtered = prev.filter(c => c.id !== chat.id);
              return [chat, ...filtered].sort((a, b) => 
                b.lastMessageTime.getTime() - a.lastMessageTime.getTime()
              );
            });
          }
        });
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  return { chats, loading };
}