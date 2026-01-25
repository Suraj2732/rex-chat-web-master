import { create } from 'zustand';
import { useMemo } from 'react';
import { User } from '@/types';

interface AppState {
  // UI State
  refresh: boolean;
  showUserList: boolean;
  loading: boolean;
  searchQuery: string;
  chatSearchQuery: string;
  
  // Chat Selection
  selectedChatId: string | null;
  selectedChatUser: User | null;
  
  // Actions
  setRefresh: (refresh: boolean) => void;
  setShowUserList: (show: boolean) => void;
  setLoading: (loading: boolean) => void;
  setSearchQuery: (query: string) => void;
  setChatSearchQuery: (query: string) => void;
  setSelectedChatId: (chatId: string | null) => void;
  setSelectedChatUser: (user: User | null) => void;
  
  // Computed selectors (for minimal re-renders)
  resetChatSelection: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Initial state
  refresh: false,
  showUserList: false,
  loading: false,
  searchQuery: '',
  chatSearchQuery: '',
  selectedChatId: null,
  selectedChatUser: null,
  
  // Actions
  setRefresh: (refresh) => set({ refresh }),
  setShowUserList: (showUserList) => set({ showUserList }),
  setLoading: (loading) => set({ loading }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setChatSearchQuery: (chatSearchQuery) => set({ chatSearchQuery }),
  setSelectedChatId: (selectedChatId) => set({ selectedChatId }),
  setSelectedChatUser: (selectedChatUser) => set({ selectedChatUser }),
  
  // Helper action
  resetChatSelection: () => set({ 
    selectedChatId: null, 
    selectedChatUser: null 
  }),
}));

// Selectors for minimal re-renders (components only re-render when their specific data changes)
export const useSelectedChatId = () => useAppStore((state) => state.selectedChatId);
export const useSelectedChatUser = () => useAppStore((state) => state.selectedChatUser);
export const useShowUserList = () => useAppStore((state) => state.showUserList);
export const useSearchQuery = () => useAppStore((state) => state.searchQuery);
export const useChatSearchQuery = () => useAppStore((state) => state.chatSearchQuery);
export const useAppLoading = () => useAppStore((state) => state.loading);
export const useRefresh = () => useAppStore((state) => state.refresh);

// Action selectors - actions are stable functions, so we can safely memoize them
export const useAppActions = () => {
  // Get actions from store - they're stable functions, so we can memoize the object
  const setRefresh = useAppStore((state) => state.setRefresh);
  const setShowUserList = useAppStore((state) => state.setShowUserList);
  const setLoading = useAppStore((state) => state.setLoading);
  const setSearchQuery = useAppStore((state) => state.setSearchQuery);
  const setChatSearchQuery = useAppStore((state) => state.setChatSearchQuery);
  const setSelectedChatId = useAppStore((state) => state.setSelectedChatId);
  const setSelectedChatUser = useAppStore((state) => state.setSelectedChatUser);
  const resetChatSelection = useAppStore((state) => state.resetChatSelection);

  // Memoize the actions object - actions are stable, so dependencies won't change
  return useMemo(
    () => ({
      setRefresh,
      setShowUserList,
      setLoading,
      setSearchQuery,
      setChatSearchQuery,
      setSelectedChatId,
      setSelectedChatUser,
      resetChatSelection,
    }),
    [
      setRefresh,
      setShowUserList,
      setLoading,
      setSearchQuery,
      setChatSearchQuery,
      setSelectedChatId,
      setSelectedChatUser,
      resetChatSelection,
    ]
  );
};
