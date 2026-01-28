// Optimized version of useChats hook
// Fixes N+1 problem, implements user caching, and efficient listener management

import { useEffect, useState, useMemo, useCallback } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  getDocs,
  getDoc,
  doc,
  limit,
  startAfter,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Chat, User, Message } from '@/types';

const CHATS_PER_PAGE = 20;

// User cache to prevent repeated fetches
const userCache = new Map<string, { user: User; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Batch fetch users (Firestore whereIn limit is 10)
async function batchFetchUsers(userIds: string[]): Promise<Map<string, User>> {
  const userMap = new Map<string, User>();
  const uncachedIds: string[] = [];

  // Check cache first
  const now = Date.now();
  for (const userId of userIds) {
    const cached = userCache.get(userId);
    if (cached && now - cached.timestamp < CACHE_TTL) {
      userMap.set(userId, cached.user);
    } else {
      uncachedIds.push(userId);
    }
  }

  // Batch fetch uncached users (10 at a time due to Firestore limit)
  for (let i = 0; i < uncachedIds.length; i += 10) {
    const batch = uncachedIds.slice(i, i + 10);
    
    // Fetch users individually (Firestore doesn't support whereIn for document IDs easily)
    // In production, consider using a Cloud Function for batch fetching
    const fetchPromises = batch.map(async (userId) => {
      try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists() && !userDoc.data().isDeleted) {
          const userData = {
            ...userDoc.data(),
            uid: userDoc.id,
            createdAt: userDoc.data().createdAt?.toDate() || new Date(),
            lastSeen: userDoc.data().lastSeen?.toDate() || new Date(),
          } as User;
          userMap.set(userDoc.id, userData);
          userCache.set(userDoc.id, { user: userData, timestamp: now });
        }
      } catch (err) {
        console.error(`Error fetching user ${userId}:`, err);
      }
    });
    
    await Promise.all(fetchPromises);
  }

  return userMap;
}

// Chat listener manager (prevents multiple listeners)
class ChatListenerManager {
  private unsubscribe: (() => void) | null = null;
  private activeUserId: string | null = null;

  subscribe(
    userId: string,
    callback: (chats: Chat[]) => void
  ): () => void {
    // Unsubscribe from previous user
    if (this.unsubscribe && this.activeUserId !== userId) {
      this.unsubscribe();
    }

    if (this.activeUserId === userId && this.unsubscribe) {
      return this.unsubscribe;
    }

    this.activeUserId = userId;

    const chatsRef = collection(db, 'chats');
    const q = query(
      chatsRef,
      where('participants', 'array-contains', userId),
      orderBy('lastMessageTime', 'desc'),
      limit(CHATS_PER_PAGE) // Limit to 20 chats per page
    );

    this.unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        const chatsData: Chat[] = [];
        const allParticipantIds = new Set<string>();

        // Collect all participant IDs
        snapshot.docs.forEach((doc) => {
          const chatData = doc.data();
          chatData.participants?.forEach((id: string) => allParticipantIds.add(id));
        });

        // Batch fetch all users
        const userMap = await batchFetchUsers(Array.from(allParticipantIds));

        // Build chats with cached user data
        for (const doc of snapshot.docs) {
          const chatData = doc.data();
          const participantsData: User[] = chatData.participants
            .map((id: string) => userMap.get(id))
            .filter((user: User | undefined): user is User => {
              return user !== undefined && !user.isDeleted;
            });

          // Skip chats where other participants are deleted
          const otherParticipants = participantsData.filter(user => user.uid !== userId);
          if (otherParticipants.length === 0) {
            continue;
          }

          const chat: Chat = {
            id: doc.id,
            participants: chatData.participants,
            participantsData,
            // Use denormalized lastMessage from chat document
            lastMessage: chatData.lastMessage
              ? {
                  ...chatData.lastMessage,
                  id: chatData.lastMessage.id || '',
                  createdAt: chatData.lastMessage.createdAt?.toDate() || new Date(),
                  readBy: chatData.lastMessage.readBy || [],
                  isEdited: chatData.lastMessage.isEdited || false,
                  isDeleted: chatData.lastMessage.isDeleted || false,
                } as Message
              : undefined,
            lastMessageTime: chatData.lastMessageTime?.toDate() || new Date(),
            unreadCount: chatData.unreadCount || {},
            createdAt: chatData.createdAt?.toDate() || new Date(),
            createdBy: chatData.createdBy,
          };

          chatsData.push(chat);
        }

        callback(chatsData);
      },
      (error) => {
        console.error('Error in chat listener:', error);
      }
    );

    return () => {
      if (this.unsubscribe) {
        this.unsubscribe();
        this.unsubscribe = null;
        this.activeUserId = null;
      }
    };
  }
}

const chatListenerManager = new ChatListenerManager();

export function useChatsOptimized(userId: string | undefined) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<any>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    // setChats([]);
    setLastDoc(null);
    setHasMore(true);

    const unsubscribe = chatListenerManager.subscribe(userId, (newChats) => {
      setChats(newChats);
      setLoading(false);
      setHasMore(newChats.length === CHATS_PER_PAGE);
    });

    return () => {
      unsubscribe();
    };
  }, [userId]);

  const loadMoreChats = useCallback(async () => {
    if (!userId || loadingMore || !hasMore) return;

    setLoadingMore(true);
    try {
      const chatsRef = collection(db, 'chats');
      let q = query(
        chatsRef,
        where('participants', 'array-contains', userId),
        orderBy('lastMessageTime', 'desc'),
        limit(CHATS_PER_PAGE)
      );

      if (lastDoc) {
        q = query(
          chatsRef,
          where('participants', 'array-contains', userId),
          orderBy('lastMessageTime', 'desc'),
          startAfter(lastDoc),
          limit(CHATS_PER_PAGE)
        );
      }

      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        setHasMore(false);
        setLoadingMore(false);
        return;
      }

      const allParticipantIds = new Set<string>();
      snapshot.docs.forEach((doc) => {
        const chatData = doc.data();
        chatData.participants?.forEach((id: string) => allParticipantIds.add(id));
      });

      const userMap = await batchFetchUsers(Array.from(allParticipantIds));
      const newChats: Chat[] = [];

      for (const doc of snapshot.docs) {
        const chatData = doc.data();
        const participantsData: User[] = chatData.participants
          .map((id: string) => userMap.get(id))
          .filter((user: User | undefined): user is User => {
            return user !== undefined && !user.isDeleted;
          });

        const otherParticipants = participantsData.filter(user => user.uid !== userId);
        if (otherParticipants.length === 0) continue;

        const chat: Chat = {
          id: doc.id,
          participants: chatData.participants,
          participantsData,
          lastMessage: chatData.lastMessage
            ? {
                ...chatData.lastMessage,
                id: chatData.lastMessage.id || '',
                createdAt: chatData.lastMessage.createdAt?.toDate() || new Date(),
                readBy: chatData.lastMessage.readBy || [],
                isEdited: chatData.lastMessage.isEdited || false,
                isDeleted: chatData.lastMessage.isDeleted || false,
              } as Message
            : undefined,
          lastMessageTime: chatData.lastMessageTime?.toDate() || new Date(),
          unreadCount: chatData.unreadCount || {},
          createdAt: chatData.createdAt?.toDate() || new Date(),
          createdBy: chatData.createdBy,
        };

        newChats.push(chat);
      }

      setChats(prev => [...prev, ...newChats]);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      setHasMore(snapshot.docs.length === CHATS_PER_PAGE);
    } catch (error) {
      console.error('Error loading more chats:', error);
    } finally {
      setLoadingMore(false);
    }
  }, [userId, loadingMore, hasMore, lastDoc]);

  const sortedChats = useMemo(() => {
    return [...chats].sort(
      (a, b) => b.lastMessageTime.getTime() - a.lastMessageTime.getTime()
    );
  }, [chats]);

  return { 
    chats: sortedChats, 
    loading, 
    hasMore, 
    loadingMore, 
    loadMoreChats 
  };
}
