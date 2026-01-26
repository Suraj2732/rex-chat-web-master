'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useChatsOptimized } from '@/hooks/useChatsOptimized';
import { chatServiceOptimized } from '@/lib/services/chatServiceOptimized';
import { Message } from '@/types';
import { X, Search, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import UserAvatar from './UserAvatar';

interface ForwardMessageModalProps {
  messages: Message[];
  onClose: () => void;
}

export default function ForwardMessageModal({ messages, onClose }: ForwardMessageModalProps) {
  const { currentUser } = useAuth();
  const { chats, loading } = useChatsOptimized(currentUser?.uid);
  const [selectedChats, setSelectedChats] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [forwarding, setForwarding] = useState(false);

  const filteredChats = (chats || []).filter(chat => {
    const otherUser = chat.participantsData.find(p => p.uid !== currentUser?.uid);
    return otherUser?.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false;
  });

  const handleToggleChat = (chatId: string) => {
    setSelectedChats(prev => 
      prev.includes(chatId) 
        ? prev.filter(id => id !== chatId)
        : [...prev, chatId]
    );
  };

  const handleForward = async () => {
    if (!currentUser || selectedChats.length === 0) return;

    setForwarding(true);
    
    try {
      const forwardPromises = [];
      
      for (const chatId of selectedChats) {
        for (const message of messages) {
          forwardPromises.push(
            chatServiceOptimized.forwardMessage(
              message,
              chatId,
              currentUser.uid,
              currentUser.displayName
            )
          );
        }
      }

      await Promise.all(forwardPromises);
      
      toast.success(`Forwarded ${messages.length} message(s) to ${selectedChats.length} chat(s)`);
      onClose();
    } catch (error) {
      console.error('Error forwarding message:', error);
      toast.error('Failed to forward message');
    } finally {
      setForwarding(false);
    }
  };

  const getOtherUser = (chat: any) => {
    return chat.participantsData.find((p: any) => p.uid !== currentUser?.uid);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-[#202c33] rounded-lg w-full max-w-md p-6 text-[#e9edef]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Forward Message</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#374045] rounded-full transition-colors cursor-pointer"
          >
            <X className="w-6 h-6 text-[#aebac1]" />
          </button>
        </div>

        {/* Message Preview */}
        <div className="mb-4 p-3 bg-[#111b21] rounded-lg border border-[#2a3942]">
          <p className="text-sm text-[#8696a0] mb-1">Forwarding {messages.length} message{messages.length > 1 ? 's' : ''}:</p>
          <p className="text-sm font-medium truncate text-[#e9edef]">{messages.length === 1 ? (messages[0].content || 'Media') : `${messages.length} messages`}</p>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#8696a0]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search chats..."
            className="w-full pl-10 pr-4 py-2 bg-[#2a3942] border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00a884] text-[#e9edef] placeholder-[#8696a0]"
          />
        </div>

        {/* Chat List */}
        <div className="max-h-96 overflow-y-auto mb-4 custom-scrollbar">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00a884]"></div>
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="text-center text-[#8696a0] py-8">
              No chats found
            </div>
          ) : (
            filteredChats.map((chat) => {
              const otherUser = getOtherUser(chat);
              const isSelected = selectedChats.includes(chat.id);

              return (
                <div
                  key={chat.id}
                  onClick={() => handleToggleChat(chat.id)}
                  className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors mb-1 ${
                    isSelected ? 'bg-[#005c4b] hover:bg-[#005c4b]' : 'hover:bg-[#111b21]'
                  }`}
                >
                  <div className="flex-shrink-0">
                    <UserAvatar user={otherUser} size="md" />
                  </div>
                  <div className="ml-3 flex-1 min-w-0">
                    <h3 className="font-medium text-[#e9edef] truncate">{otherUser?.displayName}</h3>
                    <p className="text-sm text-[#8696a0] truncate">{otherUser?.email}</p>
                  </div>
                  {isSelected && (
                    <div className="w-6 h-6 bg-[#00a884] rounded-full flex items-center justify-center border border-[#202c33] flex-shrink-0">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Forward Button */}
        <button
          onClick={handleForward}
          disabled={selectedChats.length === 0 || forwarding}
          className="w-full bg-[#00a884] text-gray-900 py-2 rounded-lg hover:bg-[#008f6f] transition-colors disabled:bg-[#2a3942] disabled:text-[#8696a0] disabled:cursor-not-allowed font-semibold flex items-center justify-center cursor-pointer"
        >
          {forwarding ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#111b21] mr-2"></div>
              Forwarding...
            </>
          ) : (
            <>
              <Send className="w-5 h-5 mr-2" />
              Forward to {selectedChats.length} chat{selectedChats.length !== 1 ? 's' : ''}
            </>
          )}
        </button>
      </div>
    </div>
  );
}