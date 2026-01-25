// src/components/ChatSidebar.tsx
'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Chat } from '@/types';
import UserInfo from './UserInfo';
import { useChatsOptimized } from '@/hooks/useChatsOptimized';
import { useState } from 'react';
import { useSelectedChatId, useAppActions } from '@/store/appStore';
import ChatHeader from './ChatHeader';
import ChatSearch from './ChatSearch';
import ChatItem from './ChatItem';
import NoChatText from './NoChatText';



export default function ChatUserList() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const selectedChatId = useSelectedChatId();
  const { setSelectedChatId, setSelectedChatUser } = useAppActions();
  const { chats, loading } = useChatsOptimized(currentUser?.uid);

  const unreadChats = chats.filter(chat =>
    currentUser && chat.unreadCount[currentUser.uid] > 0
  );

  const displayChats = activeTab === 'unread' ? unreadChats : chats;
  const getOtherUser = (chat: Chat) => {
    return chat.participantsData.find(p => p.uid !== currentUser?.uid);
  };

  return (
    <div className="w-[380px] bg-[#111b21] border-r border-[#222d34] text-white flex flex-col">

      <ChatHeader />
      <ChatSearch />
      <UserInfo user={currentUser} />

      <div className="flex gap-2 px-3 py-2 text-sm">
        <span onClick={() => setActiveTab('all')} className={`cursor-pointer px-3 py-1 rounded-full ${activeTab === 'all'
          ? ' bg-[#005c4b] text-white'
          : ' bg-[#202c33]'
          } `}>All</span>
        <span onClick={() => setActiveTab('unread')} className={`cursor-pointer px-3 py-1 rounded-full ${activeTab === 'unread'
          ? ' bg-[#005c4b] text-white'
          : ' bg-[#202c33]'
          } `}>Unread</span>

      </div>

      <div className="mx-3 my-2 mb-5 bg-[#0f3d2e] px-3 py-2 rounded-lg text-sm">
        Message notifications are off. <span className=" text-green-300 underline cursor-pointer">Turn on</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : displayChats.length === 0 ? (
          <NoChatText />
        ) : (
          displayChats.map((chat) => {
            // Fix read receipt logic: check if the other user has read the last message
            const otherUser = getOtherUser(chat);
            const isRead = chat.lastMessage?.readBy && 
              otherUser && 
              chat.lastMessage.readBy.includes(otherUser.uid);

            const unreadCount = currentUser ? chat.unreadCount[currentUser.uid] || 0 : 0;

            return (
              <ChatItem
                key={chat.id}
                selectedChatId={selectedChatId}
                otherUser={otherUser}
                currentUser={currentUser}
                chat={chat}
                unreadCount={unreadCount}
                isRead={isRead}
                onClick={() => {
                  setSelectedChatId(chat.id);
                  setSelectedChatUser(otherUser || null);
                }}

              />
            );
          })
        )}
      </div>
    </div>
  );
}