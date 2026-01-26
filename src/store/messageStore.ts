import { create } from 'zustand';
import { Message } from '@/types';

interface MessageState {
  // Messages by chatId
  messagesByChat: Record<string, Message[]>;
  // Loading states
  loading: Record<string, boolean>;
  // Pagination state
  hasMore: Record<string, boolean>;
  // Last document snapshot for pagination
  lastDocSnapshots: Record<string, any>;
  // First document snapshot for reverse pagination
  firstDocSnapshots: Record<string, any>;
  // Whether we're loading older messages
  loadingOlder: Record<string, boolean>;
  // Whether we're loading newer messages
  loadingNewer: Record<string, boolean>;
  
  // Actions
  setMessages: (chatId: string, messages: Message[]) => void;
  addMessage: (chatId: string, message: Message) => void;
  updateMessage: (chatId: string, messageId: string, updates: Partial<Message>) => void;
  deleteMessage: (chatId: string, messageId: string) => void;
  prependMessages: (chatId: string, messages: Message[]) => void;
  appendMessages: (chatId: string, messages: Message[]) => void;
  setLoading: (chatId: string, loading: boolean) => void;
  setHasMore: (chatId: string, hasMore: boolean) => void;
  setLastDocSnapshot: (chatId: string, snapshot: any) => void;
  setFirstDocSnapshot: (chatId: string, snapshot: any) => void;
  setLoadingOlder: (chatId: string, loading: boolean) => void;
  setLoadingNewer: (chatId: string, loading: boolean) => void;
  clearChat: (chatId: string) => void;
  clearOldChats: () => void;
  getMessages: (chatId: string) => Message[];
}

export const useMessageStore = create<MessageState>((set, get) => ({
  messagesByChat: {},
  loading: {},
  hasMore: {},
  lastDocSnapshots: {},
  firstDocSnapshots: {},
  loadingOlder: {},
  loadingNewer: {},

  setMessages: (chatId, messages) =>
    set((state) => ({
      messagesByChat: {
        ...state.messagesByChat,
        [chatId]: messages,
      },
    })),

  addMessage: (chatId, message) =>
    set((state) => {
      const existingMessages = state.messagesByChat[chatId] || [];
      // Check if message already exists to avoid duplicates
      if (existingMessages.some((m) => m.id === message.id)) {
        return state;
      }
      return {
        messagesByChat: {
          ...state.messagesByChat,
          [chatId]: [...existingMessages, message],
        },
      };
    }),

  updateMessage: (chatId, messageId, updates) =>
    set((state) => {
      const messages = state.messagesByChat[chatId] || [];
      return {
        messagesByChat: {
          ...state.messagesByChat,
          [chatId]: messages.map((msg) =>
            msg.id === messageId ? { ...msg, ...updates } : msg
          ),
        },
      };
    }),

  deleteMessage: (chatId, messageId) =>
    set((state) => {
      const messages = state.messagesByChat[chatId] || [];
      return {
        messagesByChat: {
          ...state.messagesByChat,
          [chatId]: messages.filter((msg) => msg.id !== messageId),
        },
      };
    }),

  prependMessages: (chatId, messages) =>
    set((state) => {
      const existingMessages = state.messagesByChat[chatId] || [];
      // Merge and deduplicate
      const messageMap = new Map<string, Message>();
      [...messages, ...existingMessages].forEach((msg) => {
        messageMap.set(msg.id, msg);
      });
      return {
        messagesByChat: {
          ...state.messagesByChat,
          [chatId]: Array.from(messageMap.values()).sort(
            (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
          ),
        },
      };
    }),

  appendMessages: (chatId, messages) =>
    set((state) => {
      const existingMessages = state.messagesByChat[chatId] || [];
      // Merge and deduplicate
      const messageMap = new Map<string, Message>();
      [...existingMessages, ...messages].forEach((msg) => {
        messageMap.set(msg.id, msg);
      });
      return {
        messagesByChat: {
          ...state.messagesByChat,
          [chatId]: Array.from(messageMap.values()).sort(
            (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
          ),
        },
      };
    }),

  setLoading: (chatId, loading) =>
    set((state) => ({
      loading: {
        ...state.loading,
        [chatId]: loading,
      },
    })),

  setHasMore: (chatId, hasMore) =>
    set((state) => ({
      hasMore: {
        ...state.hasMore,
        [chatId]: hasMore,
      },
    })),

  setLastDocSnapshot: (chatId, snapshot) =>
    set((state) => ({
      lastDocSnapshots: {
        ...state.lastDocSnapshots,
        [chatId]: snapshot,
      },
    })),

  setFirstDocSnapshot: (chatId, snapshot) =>
    set((state) => ({
      firstDocSnapshots: {
        ...state.firstDocSnapshots,
        [chatId]: snapshot,
      },
    })),

  setLoadingOlder: (chatId, loading) =>
    set((state) => ({
      loadingOlder: {
        ...state.loadingOlder,
        [chatId]: loading,
      },
    })),

  setLoadingNewer: (chatId, loading) =>
    set((state) => ({
      loadingNewer: {
        ...state.loadingNewer,
        [chatId]: loading,
      },
    })),

  clearChat: (chatId) =>
    set((state) => {
      const newMessagesByChat = { ...state.messagesByChat };
      delete newMessagesByChat[chatId];
      const newLoading = { ...state.loading };
      delete newLoading[chatId];
      const newHasMore = { ...state.hasMore };
      delete newHasMore[chatId];
      const newLastDocSnapshots = { ...state.lastDocSnapshots };
      delete newLastDocSnapshots[chatId];
      const newFirstDocSnapshots = { ...state.firstDocSnapshots };
      delete newFirstDocSnapshots[chatId];
      const newLoadingOlder = { ...state.loadingOlder };
      delete newLoadingOlder[chatId];
      const newLoadingNewer = { ...state.loadingNewer };
      delete newLoadingNewer[chatId];

      return {
        messagesByChat: newMessagesByChat,
        loading: newLoading,
        hasMore: newHasMore,
        lastDocSnapshots: newLastDocSnapshots,
        firstDocSnapshots: newFirstDocSnapshots,
        loadingOlder: newLoadingOlder,
        loadingNewer: newLoadingNewer,
      };
    }),
    clearOldChats: () => {
    const MAX_CACHED_CHATS = 10;
    const state = get();
    const chatIds = Object.keys(state.messagesByChat);

    if (chatIds.length > MAX_CACHED_CHATS) {
      // Keep only the most recent chats (by last message time)
      const chatsWithTimestamps = chatIds
        .map((id) => {
          const messages = state.messagesByChat[id] || [];
          const lastMessageTime =
            messages.length > 0
              ? messages[messages.length - 1]?.createdAt?.getTime() || 0
              : 0;
          return { id, lastMessageTime };
        })
        .sort((a, b) => b.lastMessageTime - a.lastMessageTime);

      // Remove oldest chats
      const toRemove = chatsWithTimestamps.slice(MAX_CACHED_CHATS);
      toRemove.forEach(({ id }) => {
        const { clearChat } = useMessageStore.getState();
        clearChat(id);
      }
      );
    }
  },

  getMessages: (chatId) => {
    return get().messagesByChat[chatId] || [];
  },

  // Memory management: Clear old chats to prevent memory leaks
  // clearOldChats: () => {
  //   const MAX_CACHED_CHATS = 10;
  //   const state = get();
  //   const chatIds = Object.keys(state.messagesByChat);

  //   if (chatIds.length > MAX_CACHED_CHATS) {
  //     // Keep only the most recent chats (by last message time)
  //     const chatsWithTimestamps = chatIds
  //       .map((id) => {
  //         const messages = state.messagesByChat[id] || [];
  //         const lastMessageTime =
  //           messages.length > 0
  //             ? messages[messages.length - 1]?.createdAt?.getTime() || 0
  //             : 0;
  //         return { id, lastMessageTime };
  //       })
  //       .sort((a, b) => b.lastMessageTime - a.lastMessageTime);

  //     // Remove oldest chats
  //     const toRemove = chatsWithTimestamps.slice(MAX_CACHED_CHATS);
  //     toRemove.forEach(({ id }) => {
  //       const { clearChat } = useMessageStore.getState();
  //       clearChat(id);
  //     });
  //   }
  // },
}));
