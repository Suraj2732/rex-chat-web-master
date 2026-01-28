import { useEffect, useCallback, use } from 'react';
import {
  collection,
  query,
  orderBy,
  limit,
  endBefore,
  limitToLast,
  onSnapshot,
  getDocs,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Message } from '@/types';
import { useMessageStore } from '@/store/messageStore';
import { notificationService } from '@/lib/services/notificationService';

const MESSAGES_PER_PAGE = 50;

// Listener manager to prevent N+1 problem
class MessageListenerManager {
  private listeners: Map<string, () => void> = new Map();
  private activeChatId: string | null = null;
  

  subscribe(chatId: string, callback: (messages: Message[]) => void): () => void {
    // Unsubscribe from previous chat if switching
    if (this.activeChatId && this.activeChatId !== chatId) {
      this.unsubscribe(this.activeChatId);
    }

    // If already subscribed to this chat, return existing unsubscribe
    if (this.listeners.has(chatId)) {
      return () => this.unsubscribe(chatId);
    }

    this.activeChatId = chatId;

    const messagesRef = collection(db, 'chats', chatId, 'messages');
    // Listen to the most recent messages first (for real-time updates)
    const q = query(
      messagesRef,
      orderBy('createdAt', 'desc'),
      limit(MESSAGES_PER_PAGE)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const messagesData = snapshot.docs
          .map((doc) => ({
            ...doc.data(),
            id: doc.id,
            createdAt: doc.data().createdAt?.toDate() || new Date(),
            updatedAt: doc.data().updatedAt?.toDate(),
          }))
          .reverse() as Message[];

        callback(messagesData);
      },
      (error) => {
        console.error('Error in message listener:', error);
      }
    );

    this.listeners.set(chatId, unsubscribe);

    return () => this.unsubscribe(chatId);
  }

  unsubscribe(chatId: string) {
    const unsubscribe = this.listeners.get(chatId);
    if (unsubscribe) {
      unsubscribe();
      this.listeners.delete(chatId);
      if (this.activeChatId === chatId) {
        this.activeChatId = null;
      }
    }
  }

  unsubscribeAll() {
    this.listeners.forEach((unsubscribe) => unsubscribe());
    this.listeners.clear();
    this.activeChatId = null;
  }
}

// Singleton instance - ensures only one listener per chat (solves N+1 problem)
const listenerManager = new MessageListenerManager();

export function useMessagesOptimized(chatId: string | null | undefined, currentUserId?: string) {
  const {
    messagesByChat,
    setMessages,
    setLoading,
    setHasMore,
    setLoadingOlder,
    loading,
    hasMore,
    loadingOlder,
  } = useMessageStore();

  const messages = chatId ? messagesByChat[chatId] || [] : [];
  const isLoading = chatId ? loading[chatId] ?? true : false;
  const hasMoreMessages = chatId ? hasMore[chatId] ?? true : false;
  const isLoadingOlder = chatId ? loadingOlder[chatId] ?? false : false;

  // Load initial batch of messages with real-time listener
  useEffect(() => {
    if (!chatId) {
      setLoading('', false);
      return;
    }

    setLoading(chatId, true);

    const unsubscribe = listenerManager.subscribe(chatId, (newMessages) => {
      setMessages(chatId, newMessages);
      setLoading(chatId, false);
      setHasMore(chatId, newMessages.length === MESSAGES_PER_PAGE);
    });

    return () => {
      unsubscribe();
      // Clean up old chats to prevent memory leaks
      setTimeout(() => {
        const clearChat = useMessageStore.getState().clearOldChats;
        clearChat();
      }, 1000); // Delay to allow new chat to load first
    };
  }, [chatId, setMessages, setLoading, setHasMore]);

  // Handle notifications for new messages
  useEffect(() => {
    if (!chatId || !currentUserId || messages.length === 0) return;
    
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.senderId !== currentUserId && notificationService) {
      notificationService.showMessageNotification(lastMessage.senderName, lastMessage.content);
    }
  }, [messages, currentUserId, chatId]);

  // Function to load older messages (when scrolling up) - batch fetching
  const loadOlderMessages = useCallback(async () => {
    if (!chatId || isLoadingOlder || !hasMoreMessages) return;

    try {
      setLoadingOlder(chatId, true);
      const messagesRef = collection(db, 'chats', chatId, 'messages');
      
      // Get the oldest message we currently have
      const currentMessages = messagesByChat[chatId] || [];
      if (currentMessages.length === 0) {
        setLoadingOlder(chatId, false);
        return;
      }

      const oldestMessage = currentMessages[0];
      
      // Create a timestamp for the query
      const oldestTimestamp = Timestamp.fromDate(oldestMessage.createdAt);
      
      // Query for messages before the oldest one (batch fetch)
      const q = query(
        messagesRef,
        orderBy('createdAt', 'desc'),
        endBefore(oldestTimestamp),
        limitToLast(MESSAGES_PER_PAGE)
      );

      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        setHasMore(chatId, false);
        setLoadingOlder(chatId, false);
        return;
      }

      const olderMessages = snapshot.docs
        .map((doc) => ({
          ...doc.data(),
          id: doc.id,
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate(),
        }))
        .reverse() as Message[];

      // Prepend older messages to the store
      const { prependMessages } = useMessageStore.getState();
      prependMessages(chatId, olderMessages);

      setHasMore(chatId, snapshot.docs.length === MESSAGES_PER_PAGE);
      setLoadingOlder(chatId, false);
    } catch (error) {
      console.error('Error loading older messages:', error);
      setLoadingOlder(chatId, false);
    }
  }, [chatId, isLoadingOlder, hasMoreMessages, messagesByChat, setLoadingOlder, setHasMore]);

  return {
    messages,
    loading: isLoading,
    hasMore: hasMoreMessages,
    loadingOlder: isLoadingOlder,
    loadOlderMessages,
  };
}
