'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useChats } from '@/hooks/useChats';
import { chatService } from '@/lib/services/chatService';
import { Message } from '@/types';
import { X, Search, Send } from 'lucide-react';
import toast from 'react-hot-toast';

interface ForwardMessageModalProps {
  message: Message;
  onClose: () => void;
}

export default function ForwardMessageModal({ message, onClose }: ForwardMessageModalProps) {
  const { currentUser } = useAuth();
  const { chats } = useChats(currentUser?.uid);
  const [selectedChats, setSelectedChats] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [forwarding, setForwarding] = useState(false);

  const filteredChats = chats.filter(chat => {
    const otherUser = chat.participantsData.find(p => p.uid !== currentUser?.uid);
    return otherUser?.displayName.toLowerCase().includes(searchQuery.toLowerCase());
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
      const forwardPromises = selectedChats.map(chatId =>
        chatService.forwardMessage(
          message,
          chatId,
          currentUser.uid,
          currentUser.displayName
        )
      );

      await Promise.all(forwardPromises);
      
      toast.success(`Message forwarded to ${selectedChats.length} chat(s)`);
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Forward Message</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Message Preview */}
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Forwarding:</p>
          <p className="text-sm font-medium truncate">{message.content}</p>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search chats..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Chat List */}
        <div className="max-h-96 overflow-y-auto mb-4">
          {filteredChats.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
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
                  className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
                    isSelected ? 'bg-blue-50 border-2 border-blue-500' : 'hover:bg-gray-50 border-2 border-transparent'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
                    {otherUser?.displayName?.charAt(0).toUpperCase()}
                  </div>
                  <div className="ml-3 flex-1">
                    <h3 className="font-semibold">{otherUser?.displayName}</h3>
                    <p className="text-sm text-gray-500">{otherUser?.email}</p>
                  </div>
                  {isSelected && (
                    <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
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
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed font-medium flex items-center justify-center"
        >
          {forwarding ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
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